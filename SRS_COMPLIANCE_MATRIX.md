# SmartClass SRS Compliance Matrix

Updated: 2026-10-28. Statuses are based on code inspection plus the checks in `TEST_REPORT.md`; they are not release certification.

Status vocabulary: **Verified**, **Partial**, **Missing**, **Failing**, **Blocked**. A range means every listed ID in that inclusive SRS range was reviewed under that disposition, with per-ID exceptions called out below.

| Actual SRS requirement IDs | Status | Implementation and verification evidence |
|---|---|---|
| FR-AUTH-001–FR-AUTH-012 | Partial | Login, generic failures, PBKDF2 hashing, first-login change, policy, lockout, scoped JWTs, revocation/logout, and backend roles are implemented; automated auth/security cases pass. Password recovery/admin lifecycle remains incomplete. |
| FR-CLASS-001–FR-CLASS-010 | Partial | Classes/courses, assignments, rosters, stable imports, and faculty links are database-backed. Read views are integrated. General Admin create/edit/deactivate/reassignment UI/API is missing; audited import is the supported path. |
| FR-ATT-001–FR-ATT-014 | Partial | Lecture-level records, PEC-aware roster scope, complete roster marking, reopen/correction, audit changes, student percentages/history, faculty summaries, and <75% defaulters are implemented with API integration coverage. Browser acceptance remains. |
| FR-LECT-001–FR-LECT-009 | Partial | Regular/Substitute/Extra model, scheduled vs actual faculty, cancellation exclusion, combined class membership, scoped create/list/mark endpoints are implemented. Complete UI flows and browser verification are outstanding. |
| FR-TT-001–FR-TT-012 | Partial | Normalized classwise schedules, combined sessions, batches, faculty/student scoping, day/full views, and conflict logic are implemented; API tests pass. All 100 approved workbook occurrences are imported. Browser E2E and managed-PostgreSQL verification remain. |
| FR-ROOM-001–FR-ROOM-005 | Partial | Date/time overlap search includes dated lectures and recurring schedules and the frontend uses it. Adjacent times are non-conflicting. Source capacity/building metadata is unknown and remains blank; browser-level shared-session checks remain. |
| FR-MAT-001–FR-MAT-006 | Partial | Course-authorized private Supabase upload/download, generated object keys, file metadata, type/size validation, and frontend material controls are implemented. Provider integration and malware/content scanning remain pending. |
| FR-ASG-001–FR-ASG-010 | Partial | Authorized create, list, text submit, late policy, faculty submission review, grade/feedback, and student result workflows are database-backed with cross-role tests. File upload remains disabled pending private storage. |
| FR-QUIZ-001–FR-QUIZ-010 | Partial | PEC/class-scoped list/questions/submission, availability, attempt limits, deterministic scoring, shared class quizzes, result persistence, faculty inspection, and attempt visibility are implemented. Eight curated released demo quizzes have eight questions each. Authoring UI and timer/auto-submit remain incomplete. |
| FR-RESULT-001–FR-RESULT-006 | Partial | Student results are derived from recorded attempts and the frontend displays them. Cross-role result administration/export and complete E2E evidence are missing. |
| FR-DASH-001–FR-DASH-005 | Partial | Student and Faculty dashboards include schedules, work, attendance, subjects, announcements, quiz/submission activity, and alerts. HOD analytics aggregates shared attendance, performance, classes, faculty, defaulters, and grievances. Browser visual acceptance remains. |
| FR-NOTIF-001–FR-NOTIF-006 | Partial | Authenticated scoped list/read, announcements, and automatic substitute/extra/event notifications are present. Delivery remains in-app only and audience/expiry workflows need broader tests. |
| FR-CAL-001–FR-CAL-005 | Partial | Database calendar list/filter and event-created entries are integrated. Admin academic-calendar CRUD and full role E2E are incomplete. |
| FR-EVENT-001–FR-EVENT-009 | Partial | Council-only event creation, visibility filtering, registration link, and atomic calendar/announcement generation are integrated. Draft/edit/delete workflows are missing. |
| FR-FORUM-001–FR-FORUM-004 | Verified | Course-scoped topics/replies and frontend posting are database-backed. Both topic lists and reply endpoints enforce membership; access-control regression was code-reviewed and suite remains green. |
| FR-GRV-001–FR-GRV-007 | Partial | Student submission/own-list isolation and Admin/HOD lifecycle update are implemented; isolation has automated coverage. Attachment storage and richer audit/notification behavior are incomplete. |
| FR-AI-001–FR-AI-008 | Partial | The requested project-specific replacement is deterministic advisory analytics, not AI. It uses real attempts/question topics, >=80% strong, <60% weak, minimum 3 questions and 2 tests, trend and recommendations; automated analytics coverage passes. This intentionally differs from AI wording in the original SRS. |
| NFR-SEC-001–NFR-SEC-009 | Partial | Hashing, secure temporary credentials, token purpose/version/JTI/revocation, lockout, backend authorization, explicit CORS, production secret checks, security headers, and no silent DB fallback are implemented. External penetration testing, TLS termination verification, secret rotation, audit retention, and file security are outstanding. |
| NFR-PERF-001–NFR-PERF-009 | Missing | Production-scale latency, concurrency, throughput, load, and capacity requirements have not been measured. A successful local build/test is not performance verification. |
| NFR-SAFE-001–NFR-SAFE-003 | Partial | Transactional/idempotent imports, migrations, constraints, demo provenance, and guarded destructive operations improve integrity. Managed backups, restore drills, disaster recovery, and production monitoring are not configured. |
| BR-001–BR-030 | Partial | Core rules enforced include unique accounts/rolls, one HOD identity with extra permission, class/course scope, one attendance row per lecture/student, cancelled lecture exclusion, <75% attendance threshold, quiz windows/attempts, classwise timetable, and non-overlap at adjacent times. Production acceptance has not been signed off. |

## Individual dispositions requiring attention

- **Timetable follow-up:** FR-TT-001 through FR-TT-012 now use 100 approved imported occurrences; they remain Partial pending browser E2E and managed-PostgreSQL verification.
- **Missing UI/API workflows:** the administrative portions of FR-CLASS-001 through FR-CLASS-010; upload portions of FR-MAT-001 through FR-MAT-006; quiz-authoring/timer portions of FR-QUIZ-001 through FR-QUIZ-010; event draft/edit/delete portions of FR-EVENT-001 through FR-EVENT-009.
- **Substituted requirement:** FR-AI-001 through FR-AI-008 are implemented as the user-approved deterministic analytics alternative. They must not be described as generative AI.
- **Not verified:** every NFR-PERF ID (NFR-PERF-001, 002, 003, 004, 005, 006, 007, 008, 009) requires measured acceptance criteria and a production-like environment.
- **Security follow-up:** NFR-SEC-001, 002, 003, 004, 005, 006, 007, 008, and 009 are only partially certified until TLS/provider controls, external security testing, object storage, monitoring, and operational procedures are verified.
- **Safety follow-up:** NFR-SAFE-001, NFR-SAFE-002, and NFR-SAFE-003 need managed backup/restore and failure-recovery evidence.

## Evidence locations

- Backend/API/security: `backend/main.py`, `backend/auth.py`, `backend/test_backend.py`
- Schema and migrations: `backend/models.py`, `backend/migrations/`
- Import and timetable: `scripts/validate_college_excel.py`, `scripts/import_college_data.py`, `scripts/timetable_parser.py`
- Deterministic academics/analytics: `scripts/seed_demo_academics.py`, `backend/analytics.py`
- Frontend integration: `frontend/src/services/api.ts`, `frontend/src/pages/`
- Executed checks: `TEST_REPORT.md`

No requirement marked Partial, Missing, or Blocked should be represented as fully SRS-compliant in release materials.
