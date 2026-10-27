# SmartClass Test Report

Updated: 2026-10-27

## Verified checks

| Check | Command | Result |
|---|---|---|
| Backend regression/security suite | `python -m pytest backend/test_backend.py -q` | 13 passed in 10.54s. One non-functional warning: pytest could not write `.pytest_cache` because of workspace permissions. |
| Frontend production build | `npm.cmd run build` from `frontend` | Passed; 1,956 modules, JS bundle 233.32 kB (73.88 kB gzip). Vite warns that the inherited config uses `__dirname` and a JSON import unsupported by its planned native loader. |
| Python syntax | `python -m py_compile ...` for backend and data scripts | Passed. |
| Migration cycle | Alembic `upgrade head`, `downgrade base`, `upgrade head` against a fresh temporary SQLite database | Passed for all three revisions. Temporary database removed. |
| Workbook validation | `validate_college_excel.py` | Completed; it identified the four decision categories before approval. |
| Strict import dry run | `import_college_data.py --dry-run ...` with approved mappings | Passed: 208 students, 31 faculty, 100/100 valid timetable occurrences, zero exceptions. |
| Idempotency/provisioning integration | Import twice into the migrated development database | Passed: 239 created on first run, 0 on second; no duplicate credential manifest; 100 schedule occurrences retained. |
| Academic calendar import | `import_academic_calendar.py --apply` | Passed: 81 dated entries from the approved Odd Semester 2026–27 calendar. |
| Synthetic academic generation | `seed_demo_academics.py --semester-start 2026-08-03 --semester-end 2026-11-18 --seed 2026 --apply` | Passed: 603 lectures, 57,568 attendance records, 48 assignments/quizzes, 3,079 submissions, and 3,328 attempts. Verification found zero demo lectures on excluded calendar dates and every demo lecture/attendance row has generation provenance. |
| Diff whitespace check | `git diff --check` | Passed; line-ending conversion notices only. |

## Automated scenarios covered

- Generic failed-login responses and successful login.
- First-login setup-token restriction and password policy.
- Logout revocation/token invalidation.
- Class timetable object authorization and same-class timetable consistency.
- Timetable conflict endpoint role protection.
- Student grievance isolation.
- Course-forum reply isolation and faculty class-assignment scope.
- Quiz questions hidden outside their availability window.
- Attendance percentages derived from lecture attendance rows.
- Rule-based multi-test topic analytics.
- Import duplicate prevention, missing phones, HOD assignment, and stable counts through the integration run described above.

## Not yet verified end to end

- PostgreSQL migration/import against a live PostgreSQL service (none was reachable locally).
- Browser automation across every role. The frontend production compiler passed, but no Playwright/Cypress suite exists.
- Browser-level verification across all roles and imported data, including timetable visibility and generated academic records.
- Persistent study-material upload/download; intentionally disabled pending private object storage and malware/content validation.
- Faculty roster-editing UI. Backend lecture/attendance endpoints are authorized and validated, while the current page exposes verified summaries and defaulters only.
- Admin CRUD screens. Fake actions were removed; safe importer/migrations exist, but production CRUD endpoints are not implemented.

No unrun scenario is reported as passed.
