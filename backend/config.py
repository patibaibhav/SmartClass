from __future__ import annotations

import os
import secrets
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
IS_PRODUCTION = APP_ENV == "production"

configured_database_url = os.getenv("DATABASE_URL", "").strip()
if configured_database_url:
    DATABASE_URL = configured_database_url
elif IS_PRODUCTION:
    raise RuntimeError("DATABASE_URL must be configured when APP_ENV=production")
else:
    # SQLite is an explicit development/test database, never a connection fallback.
    DATABASE_URL = f"sqlite:///{(BASE_DIR / 'smartclass-dev.db').as_posix()}"

configured_secret = os.getenv("SECRET_KEY", "").strip()
if IS_PRODUCTION and len(configured_secret) < 32:
    raise RuntimeError("SECRET_KEY must contain at least 32 characters in production")
SECRET_KEY = configured_secret or secrets.token_urlsafe(48)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
REMEMBER_TOKEN_EXPIRE_MINUTES = int(os.getenv("REMEMBER_TOKEN_EXPIRE_MINUTES", "1440"))
PASSWORD_SETUP_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("PASSWORD_SETUP_TOKEN_EXPIRE_MINUTES", "15")
)

MAX_FAILED_LOGIN_ATTEMPTS = int(os.getenv("MAX_FAILED_LOGIN_ATTEMPTS", "5"))
ACCOUNT_LOCKOUT_MINUTES = int(os.getenv("ACCOUNT_LOCKOUT_MINUTES", "15"))
DEFAULT_LOW_ATTENDANCE_THRESHOLD = float(
    os.getenv("LOW_ATTENDANCE_THRESHOLD", "75")
)

default_origins = (
    "http://127.0.0.1:5173,http://localhost:5173,"
    "http://127.0.0.1:8443,http://localhost:8443"
)
CORS_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "CORS_ORIGINS", default_origins if not IS_PRODUCTION else ""
    ).split(",")
    if origin.strip()
]
if IS_PRODUCTION and not CORS_ORIGINS:
    raise RuntimeError("CORS_ORIGINS must be configured when APP_ENV=production")
if "*" in CORS_ORIGINS:
    raise RuntimeError("Wildcard CORS origins are not allowed")

STORAGE_BACKEND = os.getenv(
    "STORAGE_BACKEND", "local" if not IS_PRODUCTION else ""
).strip()
if IS_PRODUCTION and STORAGE_BACKEND == "local":
    raise RuntimeError("Production uploads require persistent object storage")
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads"))).resolve()
