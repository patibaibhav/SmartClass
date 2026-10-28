# Supabase PostgreSQL backup and recovery

Backups contain personal academic data. Encrypt them at rest, limit access, and never commit them.

## Backup

Install PostgreSQL client tools compatible with the Supabase server. With the **native provider PostgreSQL URL** (for example `postgresql://...`, not SQLAlchemy's `postgresql+psycopg2://...`) in a protected environment:

```powershell
pg_dump --format=custom --no-owner --file C:\secure\smartclass-YYYYMMDD.dump "$env:DATABASE_URL"
pg_restore --list C:\secure\smartclass-YYYYMMDD.dump
```

Store the dump in approved institutional storage. Record date, database/project, Alembic revision, and checksum in an access-controlled operations log.

## Restore rehearsal

Never restore over production. Create a disposable Supabase/PostgreSQL database, set its protected `DATABASE_URL`, then:

```powershell
pg_restore --clean --if-exists --no-owner --dbname "$env:TEST_DATABASE_URL" C:\secure\smartclass-YYYYMMDD.dump
python -m alembic -c backend/alembic.ini current
```

Verify representative counts (users, students, timetable occurrences, PEC enrollments, assignments, quiz attempts) and an authorized Student/Faculty/HOD query. Delete the disposable database after the rehearsal.

## Failed import or migration

Stop API deployments that might write data. Do not improvise `drop_all`, destructive SQL, or a production restore. Identify the last good backup and Alembic revision, restore only under an approved maintenance procedure, and document the incident. Supabase plan backup/PITR capabilities vary; confirm them in the provider dashboard rather than assuming free-plan recovery is available.
