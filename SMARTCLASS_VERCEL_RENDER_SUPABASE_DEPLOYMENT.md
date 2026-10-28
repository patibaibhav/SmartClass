# SmartClass deployment: Supabase, Render, and Vercel

This guide deploys the existing FastAPI application on Render and the Vite frontend on Vercel. The browser communicates only with FastAPI; it never receives a database URL or Supabase service-role key.

## 1. Create Supabase resources

1. Create a Supabase project in the nearest appropriate region.
2. Create a **private** Storage bucket named `smartclass-materials`. Do not make it public.
3. Copy a PostgreSQL connection URL suitable for server-side applications. Prefer the provider's documented direct connection for Alembic/imports and its documented server-safe pooler when a direct connection is unavailable from Render.
4. Convert `postgres://...` or `postgresql://...` to `postgresql+psycopg2://...` only if SmartClass has not already done so. Set `DATABASE_SSLMODE=verify-full`; configure the provider CA/root certificate if your provider requires it.
5. Copy the project HTTPS URL and the **service-role** key. The key is Render-only and must never be placed in Vercel or committed.

## 2. Deploy the API on Render

Connect the repository and select branch `dev3`. Use the root directory. `render.yaml` supplies these commands:

```text
Build:       pip install -r backend/requirements.txt
Pre-deploy:  python -m alembic -c backend/alembic.ini upgrade head
Start:       python -m uvicorn main:app --app-dir backend --host 0.0.0.0 --port $PORT
Health:      /api/health
```

Set these secret/environment values in Render:

```text
APP_ENV=production
DATABASE_URL=postgresql+psycopg2://...              # Supabase; no SQLite
DATABASE_SSLMODE=verify-full
SECRET_KEY=<independent random value, 32+ characters>
CORS_ORIGINS=https://<your-vercel-project>.vercel.app
STORAGE_BACKEND=supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only service-role key>
SUPABASE_STORAGE_BUCKET=smartclass-materials
MAX_UPLOAD_BYTES=10485760
LOG_LEVEL=INFO
```

Deploy, inspect the Render logs for migration/startup failures, and open `https://<render-service>/api/health`. It must return `{"status":"healthy"}` without disclosing infrastructure details.

## 3. Import approved data once

Do this from an authorized computer with the private workbooks available, using the same Supabase `DATABASE_URL`. Never commit the workbooks or credential manifest.

```powershell
python -m alembic -c backend/alembic.ini upgrade head
python scripts/import_college_data.py --file docs/data.xlsx --apply --credential-output C:\secure\smartclass-initial-credentials.csv --timetable-mappings config/timetable_mappings.approved.json
python scripts/import_pec_data.py --file docs/pec.xlsx --apply --output docs/pec-import-report.local.json
python scripts/import_academic_calendar.py --file config/academic_calendar_odd_2026_2027.json --apply
python scripts/seed_demo_quizzes.py --apply
```

The identity and PEC importers are idempotent. PEC decisions remain CSS=A, SSD=B, DWM=C; the recorded D12C roll 29 decision is SSD/B. Demo academic generation is optional and must be an explicit, approved operation.

## 4. Deploy the frontend on Vercel

Import the repository, set the root directory to `frontend`, build command to `npm ci && npm run build`, and output directory to `dist`. Set only:

```text
VITE_API_BASE_URL=https://<render-service>.onrender.com/api
```

Deploy once, copy the actual Vercel HTTPS origin, then update Render `CORS_ORIGINS` to exactly that origin and redeploy the API. `frontend/vercel.json` provides the SPA rewrite needed for page refreshes.

## 5. Verify hosted workflows

Use [PRODUCTION_SMOKE_TEST.md](PRODUCTION_SMOKE_TEST.md). Confirm Student, Faculty, and HOD roles against the same hosted database. Faculty material uploads must persist after an API restart; downloads must work only for authorized course members.

## Troubleshooting

- **Database URL/TLS:** verify driver prefix, password URL encoding, Supabase connection mode, and certificate chain. Do not lower TLS validation to `disable` or `require`.
- **Migration fails:** do not run migrations from multiple web workers. Run the documented migration command once and inspect the Alembic revision.
- **CORS/401:** use the exact Vercel `https://` origin and confirm `VITE_API_BASE_URL` ends in `/api`.
- **Storage upload fails:** confirm the private bucket exists, `STORAGE_BACKEND=supabase`, the Render-only service-role key is valid, and the file is an allowed type under 10 MB.
- **Vercel 404 on refresh:** ensure `frontend/vercel.json` is deployed with the frontend root.
- **Cold starts/paused services:** free services may take time to wake. Retry the health endpoint before treating the service as unavailable.
