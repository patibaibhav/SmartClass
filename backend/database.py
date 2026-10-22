import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from config import DATABASE_URL, SQLITE_URL

logger = logging.getLogger(__name__)

engine = None
SessionLocal = None
Base = declarative_base()

try:
    # Try connecting to PostgreSQL
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    with engine.connect() as conn:
        logger.info("Successfully connected to PostgreSQL database.")
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    logger.warning(f"Could not connect to PostgreSQL ({e}). Falling back to SQLite.")
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
