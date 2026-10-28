from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from config import DATABASE_URL, IS_PRODUCTION


engine_options: dict[str, object] = {"pool_pre_ping": True}
if DATABASE_URL.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}
elif IS_PRODUCTION:
    # Conservative settings avoid exhausting Supabase connection limits on a
    # small Render instance while recovering safely from stale connections.
    engine_options.update({"pool_size": 5, "max_overflow": 2, "pool_recycle": 1800})

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
