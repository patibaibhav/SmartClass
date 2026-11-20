"""Create Admin and Council Head accounts (idempotent; never resets existing passwords).

Usage (run against the database named by DATABASE_URL, default: local dev DB):
    python scripts/provision_admin_council.py --admin "Full Name" --council "Full Name:Council Name" ...
    python scripts/provision_admin_council.py --defaults

Generated temporary passwords are written to a gitignored CSV (default:
backend/initial-login-credentials-admin.csv) and are NEVER printed.
Accounts are created with first_login=True, so the user must change the password.
"""
from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

import models  # noqa: E402
from admin_routes import temporary_password  # noqa: E402
from auth import generate_salt, hash_password  # noqa: E402
from database import SessionLocal  # noqa: E402

DEPARTMENT = "Computer Engineering"
COUNCILS = ["CSI", "ISA", "IEEE", "ISTE", "Codecell ++", "QuestIT", "MBFTL", "AI Colegion"]


def council_slug(name: str) -> str:
    return "".join(ch for ch in name.upper() if ch.isalnum()) or "COUNCIL"


def ensure(db, user_id: str, name: str, role: str, written: list, council: str | None = None) -> bool:
    if db.get(models.User, user_id):
        return False
    password = temporary_password(20)
    salt = generate_salt()
    db.add(models.User(
        id=user_id, name=name, password_hash=hash_password(password, salt), salt=salt,
        role=role, department=DEPARTMENT, council=council, first_login=True, source="admin",
    ))
    db.add(models.AuditLog(user_id="system", action="USER_CREATED", resource="User",
                           details=f"Provisioned {role} account {user_id}"))
    written.append((user_id, password, role))
    return True


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--admin", action="append", default=[], help="Admin full name")
    parser.add_argument("--council", action="append", default=[], help="'Head Name' for a council head")
    parser.add_argument("--defaults", action="store_true", help="One admin (ADMIN-01)")
    parser.add_argument("--councils", action="store_true", help="One head account per college council (COU-<NAME>)")
    parser.add_argument("--out", default=str(ROOT / "backend" / "initial-login-credentials-admin.csv"))
    args = parser.parse_args()
    admins = list(args.admin)
    councils = list(args.council)
    if args.defaults:
        admins = admins or ["System Administrator"]
    if not admins and not councils and not args.councils:
        parser.error("Pass --defaults, --councils, or at least one --admin/--council")

    written: list = []
    db = SessionLocal()
    try:
        for index, name in enumerate(admins, start=1):
            ensure(db, f"ADMIN-{index:02d}", name, "admin", written)
        for index, name in enumerate(councils, start=1):
            ensure(db, f"COU-{index:02d}", name, "council", written)
        if args.councils:
            for council in COUNCILS:
                ensure(db, f"COU-{council_slug(council)}", f"{council} Council Head", "council", written, council)
        db.commit()
    finally:
        db.close()

    if written:
        out = Path(args.out)
        new_file = not out.exists()
        with out.open("a", newline="", encoding="utf-8") as handle:
            writer = csv.writer(handle)
            if new_file:
                writer.writerow(["user_id", "temporary_password", "role"])
            writer.writerows(written)
        print(f"Created {len(written)} account(s): {[w[0] for w in written]}")
        print(f"Temporary passwords saved to {out} (keep private; do not commit).")
    else:
        print("No new accounts created (they already exist).")


if __name__ == "__main__":
    main()
