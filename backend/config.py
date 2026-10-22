import os

# Database configuration
# Primary: PostgreSQL (configured in local cluster on port 5433)
PG_HOST = os.getenv("PG_HOST", "127.0.0.1")
PG_PORT = os.getenv("PG_PORT", "5433")
PG_USER = os.getenv("PG_USER", "postgres")
PG_PASSWORD = os.getenv("PG_PASSWORD", "")
PG_DB = os.getenv("PG_DB", "smartclass")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql+psycopg2://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DB}" if PG_PASSWORD else f"postgresql+psycopg2://{PG_USER}@{PG_HOST}:{PG_PORT}/{PG_DB}"
)

# SQLite fallback URL
SQLITE_URL = "sqlite:///./smartclass.db"

# Security settings
SECRET_KEY = os.getenv("SECRET_KEY", "smartclass-super-secret-production-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Business Rules configuration (from SRS Section 4 & 5.5)
MAX_FAILED_LOGIN_ATTEMPTS = 5
ACCOUNT_LOCKOUT_MINUTES = 15
DEFAULT_LOW_ATTENDANCE_THRESHOLD = 75.0  # percentage (TBD-004)
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
