# SmartClass Test Report

Updated: 2026-10-28

## Verified checks

| Check | Command | Result |
|---|---|---|
| Backend regression/security suite | `python -m pytest backend/test_backend.py -q` | 23 passed in 8.76s. One harmless local pytest cache-permission warning. |
| Frontend production build | `npm.cmd run build` from `frontend` | Passed; 1,956 modules, JS bundle 233.62 kB (73.96 kB gzip). Native config compatibility warning resolved. |
| Python syntax | `python -m py_compile ...` for backend and data scripts | Passed. |
| Migration cycle | Alembic `upgrade head`, `downgrade base`, `upgrade head` against a fresh temporary SQLite database | Passed for all three revisions. Temporary database removed. |
| Workbook validation | `validate_college_excel.py` | Completed; it identified the four decision categories before approval. |
| Strict import dry run | `import_college_data.py --dry-run ...` with approved mappings | Passed: 208 students, 31 faculty, 100/100 valid timetable occurrences, zero exceptions. |
| Idempotency/provisioning integration | Import twice into the migrated development database | Passed: 239 created on first run, 0 on second; no duplicate credential manifest; 100 schedule occurrences retained. |
| Academic calendar import | `import_academic_calendar.py --apply` | Passed: 81 dated entries from the approved Odd Semester 2026–27 calendar. |
| Synthetic academic generation | `seed_demo_academics.py --semester-start 2026-08-03 --semester-end 2026-11-18 --seed 2026 --apply` | Passed: 603 lectures, 57,568 attendance records, 48 assignments/quizzes, 3,079 submissions, and 3,328 attempts. Verification found zero demo lectures on excluded calendar dates and every demo lecture/attendance row has generation provenance. |
| Diff whitespace check | `git diff --check` | Passed; line-ending conversion notices only. |
| PEC validation/import | `python scripts/import_pec_data.py --file docs/pec.xlsx --apply` | 208 valid enrollments, 0 unmatched, 0 name mismatches, 0 unresolved conflicts; D12C roll 29 resolved to SSD/Batch B and 9 raw timetable inconsistencies retained for audit. |
| Private storage API regression | `python -m pytest backend/test_backend.py -q` | Fake-adapter upload/list/download/unauthorized-download coverage passes; no provider credential was used. |
| Fresh migration cycle | Alembic upgrade head, downgrade base, upgrade head on a disposable SQLite database | Passed through private stored-file metadata revision `9a4bc8d2e031`. PostgreSQL provider execution remains pending. |
| Browser test discovery | `npm run test:e2e -- --list` from `frontend` | 2 Playwright tests discovered. Execution is pending Chromium and isolated hosted credentials. |
| Dependency audit | `npm audit --json` from `frontend` | 0 production and development dependency vulnerabilities after Playwright 1.64.1 update. |
| Final demo quiz seed | `python scripts/seed_demo_quizzes.py --apply` | 8 released quizzes, 64 curated questions, 24 shared class memberships; 48 older synthetic duplicates archived without deletion. |
| Live API smoke | Authenticated HTTP requests against `127.0.0.1:8000` | Faculty and HOD dashboard, quizzes, lectures, assignments, and attendance endpoints returned 200. Frontend returned 200 on port 8443. |

## Automated scenarios covered

- Ambiguous 12-hour source normalization and vertically merged two-hour timetable duration.
- PEC-specific CSS/SSD lecture isolation plus PEC-derived practical batch isolation for students in the same class.
- Faculty quiz question/answer inspection, student submission, persisted scoring, and faculty attempt visibility.
- Faculty assignment publishing, student text submission, faculty grading/feedback, and updated student view.
- Faculty attendance marking, correction, student history update, and attendance audit creation.
- Classroom occupied, adjacent, and cancelled interval behavior.
- HOD grievance resolution/audit and department dashboard authorization.

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
- Live Supabase Storage upload/download; private upload/download logic has local fake-adapter coverage but provider credentials were not available.
- Browser-driven UI automation remains unavailable; the faculty roster editor compiles and its APIs have integration coverage, but final visual acceptance is manual.
- Admin CRUD screens. Fake actions were removed; safe importer/migrations exist, but production CRUD endpoints are not implemented.

No unrun scenario is reported as passed.
