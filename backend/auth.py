from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import jwt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

import models
from config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ACCOUNT_LOCKOUT_MINUTES,
    ALGORITHM,
    MAX_FAILED_LOGIN_ATTEMPTS,
    PASSWORD_SETUP_TOKEN_EXPIRE_MINUTES,
    SECRET_KEY,
)
from database import get_db


security = HTTPBearer(auto_error=False)


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def generate_salt() -> str:
    return secrets.token_hex(16)


def hash_password(password: str, salt: str) -> str:
    """PBKDF2-HMAC-SHA256 with a unique per-password salt."""
    return hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000
    ).hex()


def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    candidate_hash = hash_password(password, salt)
    return secrets.compare_digest(candidate_hash, expected_hash)


def validate_password(password: str) -> Optional[str]:
    if len(password) < 12:
        return "Password must be at least 12 characters."
    if not any(character.isupper() for character in password):
        return "Password must contain at least one uppercase letter."
    if not any(character.islower() for character in password):
        return "Password must contain at least one lowercase letter."
    if not any(character.isdigit() for character in password):
        return "Password must contain at least one number."
    if not any(not character.isalnum() for character in password):
        return "Password must contain at least one special character."
    return None


def create_access_token(
    data: dict[str, Any],
    expires_delta: Optional[timedelta] = None,
    *,
    purpose: str = "access",
) -> str:
    now = utc_now()
    lifetime = expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = data.copy()
    payload.update(
        {
            "exp": now + lifetime,
            "iat": now,
            "jti": uuid.uuid4().hex,
            "purpose": purpose,
        }
    )
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_password_setup_token(user: models.User) -> str:
    return create_access_token(
        {"sub": user.id, "ver": user.token_version},
        expires_delta=timedelta(minutes=PASSWORD_SETUP_TOKEN_EXPIRE_MINUTES),
        purpose="password_setup",
    )


def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def _resolve_token_user(
    credentials: HTTPAuthorizationCredentials,
    db: Session,
    *,
    expected_purpose: str,
) -> tuple[models.User, Dict[str, Any]]:
    payload = decode_access_token(credentials.credentials)
    if payload.get("purpose") != expected_purpose:
        raise HTTPException(status_code=401, detail="Invalid token purpose")
    user_id = payload.get("sub")
    jti = payload.get("jti")
    if not user_id or not jti:
        raise HTTPException(status_code=401, detail="Invalid token")
    if db.query(models.RevokedToken).filter(models.RevokedToken.jti == jti).first():
        raise HTTPException(status_code=401, detail="Token has been invalidated")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if int(payload.get("ver", -1)) != int(user.token_version or 0):
        raise HTTPException(status_code=401, detail="Token has been invalidated")
    return user, payload


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: Session = Depends(get_db),
) -> Optional[models.User]:
    if not credentials:
        return None
    user, _ = _resolve_token_user(credentials, db, expected_purpose="access")
    if user.first_login:
        raise HTTPException(status_code=403, detail="Password change required")
    return user


def require_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: Session = Depends(get_db),
) -> models.User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = get_current_user(credentials, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def require_password_setup_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: Session = Depends(get_db),
) -> models.User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Password setup token required")
    user, _ = _resolve_token_user(credentials, db, expected_purpose="password_setup")
    if not user.first_login:
        raise HTTPException(status_code=409, detail="Password setup is already complete")
    return user


def revoke_presented_token(
    credentials: HTTPAuthorizationCredentials,
    user: models.User,
    db: Session,
    *,
    reason: str,
) -> None:
    payload = decode_access_token(credentials.credentials)
    expires_at = datetime.fromtimestamp(payload["exp"], timezone.utc).replace(tzinfo=None)
    if not db.query(models.RevokedToken).filter(models.RevokedToken.jti == payload["jti"]).first():
        db.add(
            models.RevokedToken(
                jti=payload["jti"],
                user_id=user.id,
                expires_at=expires_at,
                reason=reason,
            )
        )


def require_role(*allowed_roles: str):
    def role_checker(user: models.User = Depends(require_current_user)) -> models.User:
        user_roles = {user.role}
        if user.is_hod:
            user_roles.add("hod")
        if user_roles.isdisjoint(allowed_roles):
            raise HTTPException(status_code=403, detail="Access forbidden")
        return user

    return role_checker


def check_account_lockout(user: models.User) -> None:
    if user.locked_until and user.locked_until > utc_now():
        raise HTTPException(
            status_code=403,
            detail="Account is temporarily locked. Please try again later.",
        )


def record_failed_attempt(user: models.User, db: Session) -> None:
    user.failed_login_attempts = int(user.failed_login_attempts or 0) + 1
    if user.failed_login_attempts >= MAX_FAILED_LOGIN_ATTEMPTS:
        user.locked_until = utc_now() + timedelta(minutes=ACCOUNT_LOCKOUT_MINUTES)
        db.add(
            models.AuditLog(
                user_id=user.id,
                action="ACCOUNT_LOCKED",
                resource="User",
                details="Account locked after repeated failed authentication attempts.",
            )
        )
    db.commit()


def record_successful_login(user: models.User, db: Session) -> None:
    user.failed_login_attempts = 0
    user.locked_until = None
    db.add(
        models.AuditLog(
            user_id=user.id,
            action="LOGIN_SUCCESS",
            resource="User",
            details="User authenticated successfully.",
        )
    )
    db.commit()
