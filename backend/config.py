from __future__ import annotations

import os
import secrets
import logging
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


BASE_DIR = Path(__file__).resolve().parent
APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
IS_PRODUCTION = APP_ENV == "production"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

configured_database_url = os.getenv("DATABASE_URL", "").strip()
if configured_database_url:
    # Supabase commonly presents a libpq `postgres://` URL. SQLAlchemy needs
    # the installed psycopg2 driver explicitly selected.
    if configured_database_url.startswith("postgres://"):
        configured_database_url = "postgresql+psycopg2://" + configured_database_url[len("postgres://"):]
    elif configured_database_url.startswith("postgresql://"):
        configured_database_url = "postgresql+psycopg2://" + configured_database_url[len("postgresql://"):]
    DATABASE_URL = configured_database_url
elif IS_PRODUCTION:
    raise RuntimeError("DATABASE_URL must be configured when APP_ENV=production")
else:
    # SQLite is an explicit development/test database, never a connection fallback.
    DATABASE_URL = f"sqlite:///{(BASE_DIR / 'smartclass-dev.db').as_posix()}"

if IS_PRODUCTION and not DATABASE_URL.startswith("postgresql+psycopg2://"):
    raise RuntimeError("Production DATABASE_URL must use PostgreSQL with psycopg2")

DATABASE_SSLMODE = os.getenv("DATABASE_SSLMODE", "verify-full" if IS_PRODUCTION else "").strip()
if IS_PRODUCTION:
    if DATABASE_SSLMODE not in {"verify-ca", "verify-full"}:
        raise RuntimeError("DATABASE_SSLMODE must be verify-ca or verify-full in production")
    parsed_database_url = urlsplit(DATABASE_URL)
    query_parameters = dict(parse_qsl(parsed_database_url.query, keep_blank_values=True))
    configured_sslmode = query_parameters.get("sslmode")
    if configured_sslmode == "disable":
        raise RuntimeError("DATABASE_URL must not disable PostgreSQL TLS")
    # Replace provider-provided `require` with the configured verification
    # mode rather than accepting a connection that encrypts without checking
    # the certificate chain.
    query_parameters["sslmode"] = DATABASE_SSLMODE
    DATABASE_URL = urlunsplit(parsed_database_url._replace(query=urlencode(query_parameters)))

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

STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "local" if not IS_PRODUCTION else "").strip().lower()
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "smartclass-materials").strip()
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))
if IS_PRODUCTION and STORAGE_BACKEND != "supabase":
    raise RuntimeError("Production uploads require STORAGE_BACKEND=supabase")
if STORAGE_BACKEND == "supabase" and (
    not SUPABASE_URL.startswith("https://")
    or not SUPABASE_SERVICE_ROLE_KEY
    or not SUPABASE_STORAGE_BUCKET
):
    raise RuntimeError("Supabase storage requires HTTPS URL, service role key, and bucket name")
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads"))).resolve()
