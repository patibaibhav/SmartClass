"""Import an approved academic-calendar JSON file into SmartClass idempotently."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date, timedelta
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPOSITORY_ROOT / "backend"))

import models  # noqa: E402
from database import SessionLocal  # noqa: E402


def days_between(start: date, end: date):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def load_calendar(path: Path) -> dict:
    calendar = json.loads(path.read_text(encoding="utf-8"))
    for item in calendar.get("entries", []):
        if item.get("category") not in {"Events", "Tests", "Holidays"}:
            raise ValueError(f"Unsupported calendar category: {item.get('category')}")
        if date.fromisoformat(item["end"]) < date.fromisoformat(item["start"]):
            raise ValueError(f"Calendar range ends before it starts: {item['title']}")
    return calendar


def import_calendar(calendar: dict, apply: bool) -> dict:
    expanded = [
        {
            "title": item["title"], "category": item["category"],
            "date": current.isoformat(),
            "description": item.get("description") or f"Imported from {calendar['source']}",
        }
        for item in calendar["entries"]
        for current in days_between(date.fromisoformat(item["start"]), date.fromisoformat(item["end"]))
    ]
    result = {
        "mode": "applied" if apply else "dry-run",
        "source": calendar["source"],
        "termStart": calendar["term"]["start"],
        "lastInstructionDay": calendar["term"]["last_instruction_day"],
        "calendarDays": len(expanded),
        "created": 0,
        "existing": 0,
    }
    if not apply:
        return result
    db = SessionLocal()
    try:
        with db.begin():
            for item in expanded:
                existing = db.query(models.CalendarEntry).filter(
                    models.CalendarEntry.title == item["title"],
                    models.CalendarEntry.category == item["category"],
                    models.CalendarEntry.date == item["date"],
                    models.CalendarEntry.description == item["description"],
                ).first()
                if existing:
                    result["existing"] += 1
                    continue
                db.add(models.CalendarEntry(**item))
                result["created"] += 1
    finally:
        db.close()
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", type=Path, required=True)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    print(json.dumps(import_calendar(load_calendar(args.file.resolve()), args.apply), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
