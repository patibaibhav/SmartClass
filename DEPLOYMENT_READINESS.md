# SmartClass Deployment Readiness

Updated: 2026-10-28. No deployment was performed.

## Intended architecture

- Frontend: Vercel static Vite build.
- API: Render web service running FastAPI/Uvicorn.
- Database: managed PostgreSQL with TLS and backups.
- Files: private persistent object storage. Local/ephemeral disk is not acceptable for production study materials.

The architecture fits the current application, but deployment is blocked until PostgreSQL verification, object storage implementation, and the remaining SRS gaps are resolved or accepted. Timetable mappings are approved and verified in development.

## Backend configuration

Production startup validates its configuration and will not silently use SQLite. Set:

| Variable | Production requirement |
|---|---|
| `APP_ENV` | `production` |
| `DATABASE_URL` | Render/managed PostgreSQL SQLAlchemy URL; require TLS according to provider instructions. |
| `SECRET_KEY` | Independent random secret, at least 32 characters. Never reuse an example value. |
| `CORS_ORIGINS` | Exact HTTPS Vercel origin(s), comma-separated; no wildcard. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Recommended 60 or shorter. |
| `REMEMBER_TOKEN_EXPIRE_MINUTES` | Explicit organizational choice. |
| `PASSWORD_SETUP_TOKEN_EXPIRE_MINUTES` | Recommended 15. |
| `MAX_FAILED_LOGIN_ATTEMPTS` / `ACCOUNT_LOCKOUT_MINUTES` | Default 5 / 15 unless policy specifies otherwise. |
| `LOW_ATTENDANCE_THRESHOLD` | 75 per current business rule. |
| `STORAGE_BACKEND` | Must not be `local`; an object-storage adapter still needs implementation. |

Build/install: `pip install -r backend/requirements.txt`

Migration: `python -m alembic -c backend/alembic.ini upgrade head`

Start: `python -m uvicorn main:app --app-dir backend --host 0.0.0.0 --port $PORT`

Health check: `GET /api/health` performs a database `SELECT 1`; use it for Render health monitoring.

## Frontend configuration

Set `VITE_API_BASE_URL=https://<render-service>/api`. Production builds reject a missing or non-HTTPS base URL.

Build from `frontend`: `npm ci` then `npm run build`. Publish `frontend/dist`. Configure the SPA host to rewrite non-asset routes to `index.html`.

## Release sequence

1. Create managed PostgreSQL and backups; store secrets only in provider secret settings.
2. Run migrations as a release/pre-deploy step.
3. Validate and import identities with a credential output in an access-controlled external location.
4. Use the recorded timetable approvals and rerun strict import against the managed database.
5. Run deterministic demo generation only if demo academic records are explicitly wanted.
   Import PEC selections with `python scripts/import_pec_data.py --file docs/pec.xlsx --apply`; the committed approved-decisions file resolves D12C roll 29 to SSD/Batch B. Then run `python scripts/seed_demo_quizzes.py --apply` for the curated quiz set.
6. Deploy API; confirm health and CORS from the exact frontend origin.
7. Deploy frontend and run role-based smoke tests.
8. Distribute initial credentials through an approved secure channel and delete/rotate the manifest according to institutional policy.

## Blocking items

- Apply and verify the approved timetable mappings against managed PostgreSQL.
- Verify migration, import, backup/restore, and representative queries on the chosen PostgreSQL service.
- Implement and test private object storage before enabling material uploads.
- Decide whether partial Admin CRUD is a release blocker; the Faculty attendance editor is implemented.
- Review the nine retained raw PEC subject/batch inconsistencies as an audit item; runtime practical assignment follows the approved batch labels and CSS=A, SSD=B, DWM=C mapping.
- Run browser-level tests for student, faculty, HOD, admin, and council roles.
- Add centralized production logging/monitoring and an operational incident/secret-rotation procedure.

The `.env.example` files contain placeholders only. The private workbook, credentials, `.env` files, SQLite databases, and upload directory are ignored by Git.
