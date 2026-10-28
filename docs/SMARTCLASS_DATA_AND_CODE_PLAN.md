# SmartClass — Data Migration, SRS Gap Audit, Security and Production Readiness

**Status:** implementation specification, not an assertion that changes have already been made. **Inputs:** `SmartClass-main (2).zip`, `SmartClass_SRS.pdf` (approved v1.0, 44 pages), `data.xlsx`. **Repository root after extraction:** `SmartClass-main/`. Do not push the original Excel file, personal phone numbers, or generated passwords to a public GitHub repository. Do not treat README claims of SRS completion as independently verified.

## 0. Non-negotiable agent contract
1. Create a feature branch and baseline database backup; do not edit the original spreadsheet. First run existing tests, build frontend, record failures and snapshots. Never run `backend/seed.py` against a populated or production database: its `seed_database(reset=True)` calls `Base.metadata.drop_all`.
2. Preserve all working roles, routes and modules. No invented personal data, no fake faculty mappings, no silent omission of malformed rows. Keep synthetic academic metrics visibly labelled **Demonstration data**.
3. Import data through repeatable, transactional, validated scripts; preserve identifiers across reruns. No automatic destructive migrations. Prefer Alembic with reviewed migrations and rollback/backup instructions.
4. Treat real student/faculty identity, emails and phone numbers as personal data. For a public demo, get authorization and use a pseudonymized dataset instead. Do not publish a directory of passwords. No automatic emailing credentials without permission.
5. Keep `frontend/` as the deployed UI and the single maintained frontend source tree.
6. Every claimed completion requires code changes, tests and manual verification. Record unresolved ambiguities in a review report rather than guessing.

## 1. Observed architecture and verified findings
- Frontend: React 19 + TypeScript + Vite 8, `frontend/src/App.tsx`, `frontend/src/pages/`, `frontend/src/data/mock.ts`, `frontend/src/services/api.ts`. Backend: FastAPI + SQLAlchemy, `backend/main.py`, `models.py`, `schemas.py`, `auth.py`, `database.py`, `config.py`, `seed.py`, `test_backend.py`. PostgreSQL intended.
- **Critical P0:** `frontend/src/services/api.ts` hardcodes `http://127.0.0.1:8000/api`. Replace with validated `import.meta.env.VITE_API_BASE_URL` (production HTTPS); fail clearly on missing production config.
- **Critical P0:** `frontend/src/pages/Login.tsx` falls back to mock `USERS` on network failure and accepts demo passwords. Remove in production; keep any optional demo experience strictly separate and explicitly gated to local development. Backend failures must show an error, never authorize a user.
- **Critical P0:** `backend/database.py` silently falls back to local SQLite on PostgreSQL connection error. Fail fast in production; remove silent fallback; use explicit dev-only SQLite setting if required. `backend/config.py` has a hardcoded default JWT secret; require a strong environment secret in production.
- **Critical P0:** `backend/main.py` CORS `allow_origins=["*"]` with `allow_credentials=True`. Use an explicit allowlist of deployed frontend origins; no wildcard with credentials. Audit every endpoint for authentication and object-level authorization, not just navigation guards.
- **Critical P0:** `backend/seed.py` drops all tables by default. Make reset dev-only and guarded; add idempotent data importer, separate synthetic demo seeder and admin bootstrap. Do not run seed on app startup.
- **P1:** `backend/main.py` executes `Base.metadata.create_all()` on import. Move schema management to Alembic migrations; keep startup read-only with respect to schema.
- **P1:** `frontend/src/pages/TimetablePage.tsx` renders imported `TIMETABLE` from `mock.ts`, not the backend. `backend/main.py` GET `/api/timetable` fetches all entries with no demonstrated role scope. Implement authorized classwise API and frontend binding.
- **P1:** `backend/main.py` `/api/my-class` defaults missing class to `SE-A` and attendance contains `mock_stats` fallback. Eliminate misleading fallbacks and replace with class-scoped DB calculations.
- **P1:** `backend/models.py` `User` lacks phone and `StudentRecord` has roll number but no unique `(class_id, roll_no)` constraint. Plan migration for nullable phone, unique class+roll and import provenance. Preserve existing profiles.
- **P1:** `backend/config.py` `UPLOAD_DIR` is local disk. Render filesystem is not suitable for durable uploads; use private object storage, signed access and DB metadata.
- **P1:** Auth token stored in browser localStorage in API client. Review XSS risks and token revocation, logout, first-login enforcement on *every* protected API, CSRF if switching to cookies. Test against SRS FR-AUTH-003/007/011.
- **P1:** `backend/main.py` contains seeded/precalculated response values; systematically search all pages for `mock.ts` imports and API `catch { return null; }` fallbacks. Replace them in production paths or explicitly mark demo-only.
- These are code-inspection findings, **not** evidence that the full app was executed or every SRS requirement passed. Run tests and produce evidence before claiming full compliance.

## 2. Spreadsheet inventory (read-only inspection)
| Sheet | Meaning | Count of nonempty student rows |
|---|---|---:|
| D12A | students; columns Email Address, FULL NAME (SURNAME FIRST), Class, Mobile Number, Roll No | 73 |
| D12B | same | 67 |
| D12C | same | 68 |
| Faculty | faculty names + initials | 31 |
| Timetable | Monday–Friday, time slots, D12A/D12B/D12C cells; includes multi-line combined-class and batch entries | 43 content/header rows after first lines |

**Expected:** 208 students + 31 faculty; exactly 2 missing student phone cells detected in D12A, none in D12B/C. Counts are provisional until parser validation. Sheet `D12B` reports 86 worksheet rows but only 67 populated records; ignore blank rows. Some names are incomplete or inconsistently ordered; preserve original text. Faculty sheet contains `Dr. Nupur Giri` (initial `NG`) — grant her Faculty + HOD privileges in the same account. No separate HOD identity. Excel does **not** provide faculty emails/phones, so do not invent them; schema may need nullable faculty email or authorized admin-provided addresses. Existing `User.email` is nonnullable/unique; resolve by migration or explicit verified data collection, not fake live email addresses.

**Timetable data issues:** Monday 09:30 D12A cell includes multiple overlapping combined-class elective choices (`SD`, `CSS`, `DWM`), with D12B/D12C cells blank; Wednesday equivalent mentions `D17B+D17C` (probable typo; **do not auto-correct**). Some slots contain batch `A/B/C` lab rotations; some cells contain `PROJECT` without a faculty/room; several faculty initials are potentially ambiguous; `SD` is not in the supplied subject glossary (`SSD` is). Require a mapping approval before import. Never invent a faculty or room to satisfy non-null fields.

## 3. Identity, usernames and credentials
**Student ID:** `STU-D12A-001` (class + zero-padded roll number), analogous B/C; stable and unique, deterministic from validated sheet class/roll. Store original email, exact supplied full name, roll, class, phone nullable. If future class transfer occurs, keep immutable account ID and update class membership/history (FR-CLASS-010); the ID is an initial identifier, not a mutable computed key.

**Faculty ID:** `FAC-NG`, `FAC-GB`, etc. only where initials are unique; otherwise `FAC-<NORMALIZED-INITIAL>-<STABLE-SUFFIX>` generated and saved in import mapping. Validate case-insensitive uniqueness. Names must not be rewritten or inferred from initials. Keep Admin and Council Head accounts separate, only if authorized; do not assign students council permissions by assumption.

**Passwords:** User-requested name/class/roll-derived passwords are predictable and unsafe. Instead generate cryptographically random unique temporary passwords (at least 16 characters), set `first_login=True`, hash using existing PBKDF2 with per-user salt (or migrate to Argon2id), force change before any other access, and deliver through an approved private channel. Optional recognizable **usernames** can incorporate class/roll; passwords must not. Credential manifest only as an ephemeral, encrypted, access-controlled file outside Git, with deletion policy and no logging. No shared `demo1234` for real users. Add secure admin reset mechanism. Verify brute-force lockout and generic errors.

## 4. Academic entities and timetable data model
1. Classes: `D12A`, `D12B`, `D12C`, department `Computer Engineering`. Import one roster per class, not per student timetable.
2. Courses (canonical): `SSD` Software System Design, `CCL` Cloud Computing Lab, `DE` Data Engineering, `ML` Machine Learning, `CSS` Cryptography and System Security, `DWM` Data Warehousing and Mining, `SEA` Software Engineering and Architecture, `TCS` Theory of Computer Science. Treat workbook `SD` as **unresolved candidate** for SSD until approved. Preserve source token and mapping rationale. `PROJECT` is an unresolved activity, not automatically one of these courses.
3. Add normalized schedule tables as necessary: `schedule_slots` (weekday, start/end, term, activity kind), `schedule_occurrences` (subject, faculty nullable when unknown, room nullable, session type, source sheet/cell), `schedule_class_memberships` (one occurrence may serve many classes), and `schedule_batch_groups` (batch A/B/C within class). Alternatively implement equivalent schema with tested constraints. Keep regular timetable distinct from dated conducted lectures, substitutes, extras and cancellations.
4. **Classwise invariant:** Every student in `D12A` sees the same base `D12A` weekly timetable, regardless of personal identity, roll, optional/batch course. Likewise B/C. Show every source cell's parallel alternatives/rotations visibly (stacked entries, labels) rather than randomly assigning one. For a combined session, associate each listed class with the same underlying session record; do not double-count a faculty/room clash from its own shared session.
5. Handle combined-class overlaps: same faculty/room/time shared across multiple classes is **not** a conflict if represented by one event with multiple class memberships. Distinct events overlapping same faculty/room are flagged; overlapping alternative elective options in a class may be legitimate and need `parallel_group` or conflict exception with reason. Distinguish genuine clashes from concurrent lab batches. Never globally disable conflict detection.
6. Timetable parser must read weekday header, class columns F/G/H, slot in E; normalize `10.30-11.30` and `10:30-11:30`; split multiline entries cautiously; extract subject, batch, faculty initials, room, combined classes, and retain exact raw cell + Excel coordinate. Use an **exceptions CSV/report** with source row, raw text, proposed interpretation, issue, required decision. Import validated records only, fail on unknown mappings in strict mode. Require manual signoff for D17 typo, SD/SSD, PROJECT, combined electives, and unknown faculty initials.
7. API examples: `GET /api/me/timetable?view=week`, `GET /api/classes/D12A/timetable?day=Monday` (Faculty/Admin or authorized student), `GET /api/faculty/me/timetable`; server must derive student class from authenticated account, never trust client class ID. Test IDOR for D12A student requesting D12B protected data.
8. Keep frontend timetable full-week/day views, responsive stacked parallel cells, exact time labels, faculty/room/batch annotations, explicit unavailable metadata; no fabricated data. Test all 208 students grouped into three identical classwise outputs.

## 5. Attendance and demo academic history
- Generate **deterministic** synthetic data using fixed RNG seed and a clearly defined semester date range supplied/configured by project owner; do not pretend it is authentic attendance. Create actual conducted lecture records first, then attendance per eligible student/session, with uniqueness `(lecture_id,student_id)`; do not mark a student in another class or batch; exclude cancelled sessions and holidays. For combined classes, lecture attendance must include eligible rosters without duplication.
- Target varied plausible attendance rates by student/subject, including below/above configurable 75% threshold; calculate all percentages from attendance rows, not hardcoded stats. Record `source=synthetic`/`is_demo` and generation version; rerun without duplication. Preserve real manually entered attendance on subsequent reruns.
- Generate a small, consistent corpus of quizzes, objective questions tagged to course **topics**, attempts, answers, deterministic marks, assignments, submissions and result releases. Vary outcomes per student but ensure no impossible marks, missing answers counted correctly, no attempts outside allowed windows unless clearly backfilled demo history. Use historical dates; no misleading future-completed exams.
- AI report workaround: **deterministic topic performance analysis**, not claim of external AI. Across multiple completed released tests, aggregate earned/possible points by topic, count questions and tests, optionally use recency weighting and confidence floor; e.g. `>=80%` strong, `<60%` needs improvement, otherwise developing, with insufficient evidence when sample small. Thresholds configurable; show supporting attempts, denominators, coverage, trends and recommended study topics. Do not expose other students' answers. Title `Topic-wise Performance Insights (rule-based)` unless a genuine LLM integration is later added; explicitly mark deviation from SRS FR-AI requirements and obtain approval if strict compliance is required. Official scores never generated or modified by AI.
- Study material: leave clean course/topic catalog ready for future uploads; implement metadata, MIME/size validation, authorization, private persistent object storage, signed downloads, upload lifecycle, deletion and cleanup. Do not fabricate document files or public links.

## 6. SRS traceability and regression matrix
For **every** FR/NFR/BR in SRS Sections 4–5, produce `docs/SRS_TRACEABILITY.md` with `ID | requirement | endpoint/model/UI | test | PASS/PARTIAL/FAIL/NOT TESTED | evidence | fix`. The SRS covers 17 features. Explicit test focus:
| SRS area | Required evidence |
|---|---|
| FR-AUTH-001..012 | unique login, first-login block, salted hashing, lockout, logout invalidation, role/record authorization, HOD combo |
| FR-CLASS-001..010 | admin class/course/faculty assignment, student reassignment preserving history, scope enforcement |
| FR-ATT-001..014 | authorized manual marking, one row/student/lecture, audit edits, valid denominators, alerts/defaulters |
| FR-LECT-001..009 | regular/substitute/extra/cancelled; original vs actual faculty, scheduling and attendance |
| FR-TT-001..012 | full and day views, classwise student view, faculty/admin scopes, valid conflict detection and exceptions |
| FR-ROOM | date/time free-room calculation including extra/substitute, adjacent times nonconflicting |
| FR-MAT | faculty upload/update/remove, topic organization, permitted student access, durable files |
| FR-ASG | publish, submit, late, grade, feedback, isolation |
| FR-QUIZ | objective evaluation, timer/attempt limits, release gate, result isolation |
| FR results/dashboard | correct DB-backed aggregates, scoped roles, no fixed demo numbers |
| FR announcement/calendar/council/forum/grievance | publish/visibility, workflows, linked event generation, scope and notifications |
| FR-AI | document deterministic workaround as SRS deviation pending acceptance |
| NFR security/privacy/performance | HTTPS, secrets, isolation, access logs, backups, uploads, responsiveness, production error handling |

**High-risk test cases:** network disconnected must not permit mock login; invalid/expired token; first-login token cannot access regular endpoints; changing password revokes old token; HOD can see departmental data but faculty without HOD cannot; two students same class get identical weekly timetable; combined class same event not false conflict; unrelated faculty simultaneous room conflict; blank phone stays NULL and UI displays `Not provided`; unknown faculty email not fabricated; reset seeder cannot run in production; app restart preserves records and files; no CORS wildcard; no private phone numbers in public API responses.

## 7. Implementation sequence / agent work packages
**Phase 0 — baseline:** unzip, `git status`, inspect README, run `python -m pytest backend/test_backend.py`, `cd frontend && npm ci && npm run build`, save output; inspect `backend/main.py` entire 1193 lines and `frontend/src/pages/*` and map every API/mock usage. Capture failures without patching blindly.

**Phase 1 — critical security:** remove login fallback; explicit API URL, fail-fast database, secrets and CORS, authz guards, proper token lifecycle; tests. Separate real login from any demo mode.

**Phase 2 — schema:** create Alembic setup and migrations for phone, nullable/verified faculty contact strategy, import audit, timetable normalized multi-class/batch representation, topic-tagged quiz results, demo provenance and constraints. Back up DB and test forward/rollback.

**Phase 3 — ETL:** implement `scripts/validate_college_excel.py` (read-only report) and `scripts/import_college_data.py --file ... --dry-run` then `--apply`; transactional upsert; no delete; per-sheet counts and duplicates; faculty initial mapping; source-cell review. Store approved mapping configuration separately, version-controlled but with no personal records. Export validation report excluding sensitive data by default.

**Phase 4 — backend:** classwise timetable and shared-session conflicts; course assignments, roster, attendance/lecture generation; role-scoped endpoints; remove hardcoded responses; add pagination for large rosters.

**Phase 5 — frontend:** replace mock-dependent pages progressively with real API hooks; loading/empty/error states, auth expiry handling, classwise timetable, nullable phone; admin import stats and data source labels. Do not replace the UI design unnecessarily.

**Phase 6 — seeded demonstration:** separate `scripts/seed_demo_academics.py --seed 2026 --dry-run/--apply` that does not change imported identity data; consistent quizzes/assignments/attendance; topic insights. Support `--reset-demo-only` with explicit confirmation and never delete real records.

**Phase 7 — verification:** pytest + frontend build + browser smoke checks for each role, 208 student logins via test harness (without exporting passwords), faculty and HOD, conflict cases, API authorization, persistence. Add CI with unit/integration checks. Generate traceability report and `docs/DEPLOYMENT_READINESS.md` with blockers and exact commands.

**Phase 8 — production hardening:** environment validation, HTTPS, private storage, DB pool/SSL, backups, logging without PII, rate limits, health checks, trusted hosts, security headers, CSP, no stack traces, DB migrations at controlled deploy stage. Deploy only after all P0 checks pass.

## 8. Required deliverables from coding agent
- Reviewed migrations, parser, validation report, import script, mapping decisions, secure credential bootstrap, synthetic-only seeder, corrected backend/UI, tests, CI and updated README.
- Explicit unresolved decisions: faculty email collection/nullable policy; timetable `SD` vs `SSD`; `D17B/D17C` typo; elective/batch interpretation; `PROJECT` activity; academic term dates; which users may access real personal information; HOD scope; whether to accept rule-based report as SRS deviation.
- Final evidence: exact test counts/results, import row counts, rejected row list, all three timetable screenshots, HOD login, deployment readiness checklist, and a list of incomplete SRS requirements. Never report `100% SRS compliant` without proof.
