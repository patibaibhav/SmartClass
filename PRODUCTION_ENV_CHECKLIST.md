# Production environment checklist

Before deployment, verify the following without putting secrets in Git, Vercel, screenshots, or chat.

- [ ] Render has `APP_ENV=production`, a non-default 32+ character `SECRET_KEY`, and exact HTTPS `CORS_ORIGINS`.
- [ ] `DATABASE_URL` points to Supabase PostgreSQL using `postgresql+psycopg2://` and `DATABASE_SSLMODE=verify-full`.
- [ ] `STORAGE_BACKEND=supabase`; the Supabase URL is HTTPS; the service-role key exists only in Render; private bucket `smartclass-materials` exists.
- [ ] Vercel has only `VITE_API_BASE_URL=https://<render>/api`; it has no database, JWT, or Supabase service-role secrets.
- [ ] Alembic has run exactly once for the release and `/api/health` returns 200.
- [ ] Private workbooks and initial credential manifests are outside the repository and distributed via an approved secure channel.
- [ ] Imports were run and verified; the PEC report has no unresolved conflict.
- [ ] An approved demo-data decision was made; demo seeding is never run at app startup.
- [ ] A backup was created and restore steps were rehearsed on a disposable database.
- [ ] Render logs are retained/reviewed and an owner is responsible for secret rotation and incident response.

Admin CRUD is intentionally excluded from this deployment scope. It is not represented as complete in the SRS matrix.
