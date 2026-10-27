# SmartClass Data Import Report

Updated: 2026-10-27

## Source audit

The source workbook was read without modification. Its SHA-256 at validation time was `cf79485770ad937afdb2528b952a1f4a420b7ebf17f7a0783cc2b756c68bea5f`.

| Sheet | Valid records | Notes |
|---|---:|---|
| D12A | 73 | Phone is blank at source rows 72 and 73; import preserves `NULL`. |
| D12B | 67 | 18 blank worksheet rows ignored. |
| D12C | 68 | 14 blank worksheet rows ignored. |
| Faculty | 31 | Unique initials; Nupur Giri matches exactly once and receives faculty role plus HOD permission. |
| Timetable | 117 populated cells | Parsed to 100 logical occurrences; all 100 are valid after approved mappings. |

Total identities: 208 students + 31 faculty = 239 accounts. No malformed student emails, duplicate student emails, duplicate roll numbers, class mismatches, missing faculty names/initials, or duplicate faculty initials were found.

## Import design and verification

- Stable student IDs follow `STU-<CLASS>-<ROLL>`; faculty IDs use their unique source initials.
- Every new account receives a cryptographically random 20-character temporary password, stored only as a hash in the database.
- The one-time credential CSV must be outside the repository and is created exclusively. It is never logged.
- Source/record keys and database uniqueness constraints make reruns idempotent.
- The apply path is one transaction; failures roll back database changes and remove a newly written credential manifest.
- The migrated development SQLite database was imported twice. Run 1 created 239 accounts and a 240-line manifest (header plus accounts). Run 2 created zero accounts and no second manifest.
- Verified database totals after the rerun: 239 users, 208 student records, 31 faculty users, 1 HOD permission, 2 null student phones, 3 classes, 8 courses, 100 schedule occurrences, 118 class memberships, 50 batch groups, 30 class-course-faculty assignments, 17 classrooms, and 2 import-run audit rows.

The import was applied only to the ignored development database `backend/smartclass-dev.db`; no production or external database was modified.

## Timetable decisions

The project owner approved all mappings on 2026-10-27. The parser keeps source coordinates and raw text for audit. The approvals are recorded in `config/timetable_mappings.approved.json`.

| Ambiguity | Source coordinates | Approved decision |
|---|---|---|
| `SD` | F5, F22, G32, H36, F40, F45, H45 | Approved as `SSD`. |
| `D17B` | F22 | Approved as `D12B`. |
| `D17C` | F22 | Approved as `D12C`. |
| `PROJECT` | H36, G45, H45, G46 | Approved as a non-course project activity. |

Combined-class markers and batch practicals are represented explicitly through schedule occurrence, class-membership, and batch-group tables. They are not flattened into duplicate lectures.

## Academic calendar and synthetic records

The approved Odd Semester 2026–27 calendar was transcribed to `config/academic_calendar_odd_2026_2027.json` and imported idempotently as 81 dated calendar entries. The instructional window is 2026-08-03 through 2026-11-18.

The deterministic generator uses seed `2026` and skips dates marked as `Holidays` or `Tests`: the 14–18 September mid-semester break, 28 September–3 October mid-term tests, and 2–7 November re-mid-term tests. It generated 603 combined-aware conducted demo lectures, 57,568 attendance records, 48 assignments, 3,079 submissions, 48 quizzes, and 3,328 attempts. Every generated academic record is labelled `source=synthetic`, `is_demo=true`, and with its generation version. Batch practicals (48 timetable occurrences) remain excluded because the source does not provide student-to-batch membership.

## Commands

```powershell
python scripts/validate_college_excel.py --file docs/data.xlsx --output docs/validation-report.local.json
python scripts/import_college_data.py --file docs/data.xlsx --dry-run --timetable-mappings config/timetable_mappings.approved.json
```

Latest strict dry run: 208 students validated, 31 faculty validated, zero identity issues, 100 valid occurrences, zero timetable exceptions, `strict_import_ready=true`.
