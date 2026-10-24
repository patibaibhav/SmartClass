import hashlib
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
import models
from config import (
    SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES,
    MAX_FAILED_LOGIN_ATTEMPTS, ACCOUNT_LOCKOUT_MINUTES
)

security = HTTPBearer(auto_error=False)

def generate_salt() -> str:
    return secrets.token_hex(16)

def hash_password(password: str, salt: str) -> str:
    """One-way cryptographic hash with per-password salt using PBKDF2-HMAC-SHA256 (FR-AUTH-004)."""
    return hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()

def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    candidate_hash = hash_password(password, salt)
    return secrets.compare_digest(candidate_hash, expected_hash)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    if not credentials:
        return None
    token = credentials.credentials
    payload = decode_access_token(token)
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def require_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: Session = Depends(get_db)
) -> models.User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user = get_current_user(credentials, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user

def require_role(*allowed_roles):
    roles = []
    for r in allowed_roles:
        if isinstance(r, (list, tuple, set)):
            roles.extend(r)
        else:
            roles.append(r)

    def role_checker(user: models.User = Depends(require_current_user)) -> models.User:
        user_roles = [user.role]
        if user.is_hod:
            user_roles.append("hod")
        if not any(r in roles for r in user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: insufficient role permissions"
            )
        return user
    return role_checker

def check_account_lockout(user: models.User) -> None:
    """Checks if account is locked out per FR-AUTH-006."""
    if user.locked_until and user.locked_until > datetime.utcnow():
        remaining = int((user.locked_until - datetime.utcnow()).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is temporarily locked due to consecutive failed attempts. Please try again in {remaining} minute(s)."
        )

def record_failed_attempt(user: models.User, db: Session) -> None:
    user.failed_login_attempts += 1
    if user.failed_login_attempts >= MAX_FAILED_LOGIN_ATTEMPTS:
        user.locked_until = datetime.utcnow() + timedelta(minutes=ACCOUNT_LOCKOUT_MINUTES)
        # Log lockout
        audit = models.AuditLog(
            user_id=user.id,
            action="ACCOUNT_LOCKED",
            resource="User",
            details=f"Account locked for {ACCOUNT_LOCKOUT_MINUTES} minutes after {user.failed_login_attempts} failed attempts."
        )
        db.add(audit)
    db.commit()

def record_successful_login(user: models.User, db: Session) -> None:
    user.failed_login_attempts = 0
    user.locked_until = None
    audit = models.AuditLog(
        user_id=user.id,
        action="LOGIN_SUCCESS",
        resource="User",
        details="User authenticated successfully."
    )
    db.add(audit)
    db.commit()
