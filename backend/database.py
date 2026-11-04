from __future__ import annotations

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from config import DATABASE_URL, IS_PRODUCTION


# pool_pre_ping sends an extra SELECT 1 round trip before every checkout, which
# is costly when the database is in another region. In production we rely on a
# short pool_recycle instead (below) and keep pre-ping opt-in.
engine_options: dict[str, object] = {
    "pool_pre_ping": os.getenv("DB_POOL_PRE_PING", "").strip().lower() in {"1", "true", "yes"}
}
if DATABASE_URL.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}
elif IS_PRODUCTION:
    # Conservative settings avoid exhausting Supabase connection limits on a
    # small Render instance while recovering safely from stale connections.
    engine_options.update({
        "pool_size": int(os.getenv("DB_POOL_SIZE", "8")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "4")),
        "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "240")),
        "pool_timeout": int(os.getenv("DB_POOL_TIMEOUT", "30")),
    })

# A configured database failure is fatal. Production must never silently switch
# to a different database and appear healthy with missing records.
engine = create_engine(DATABASE_URL, **engine_options)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
