# SmartClass

SmartClass is a React/FastAPI academic-management application being upgraded from a UI demo to a database-backed college system. It includes authenticated role views, classwise timetables, attendance, assignments, quizzes, deterministic performance analytics, announcements, calendar/events, forums, grievances, migration tooling, and validated college-data import.

This repository does **not** contain production credentials or the private source workbook. It also does not claim full SRS compliance; see [SRS_COMPLIANCE_MATRIX.md](SRS_COMPLIANCE_MATRIX.md).

## Local setup

Requirements: Python 3.11+, Node.js 20+, and PostgreSQL for a production-like setup. SQLite is supported only when `APP_ENV` is `development` or `test`.

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
$env:APP_ENV = "development"
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
python -m alembic -c backend/alembic.ini upgrade head

Set-Location frontend
npm install
```

The commands above use the local SQLite development database. Environment files are not loaded implicitly; production variables must be configured in the shell or hosting process manager. The frontend defaults to `http://127.0.0.1:8000/api` in development, so its `.env` file is optional.

Run the services in separate terminals:

```powershell
Set-Location backend
$env:APP_ENV = "development"
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

```powershell
Set-Location frontend
npm run dev
```

After the private workbooks have been validated, the local data workflow is:

```powershell
python scripts/import_pec_data.py --file docs/pec.xlsx --output docs/pec-import-report.local.json
python scripts/import_pec_data.py --file docs/pec.xlsx --apply --output docs/pec-import-report.local.json
python scripts/seed_demo_quizzes.py --apply
```

The PEC importer uses `config/pec_mappings.approved.json` for audited conflict decisions. It returns a non-zero status if a source conflict has no approved decision, while still importing unambiguous rows and recording the blocker in the local report.

## College-data workflow

The workbook is intentionally ignored by Git. Validate it first:

```powershell
python scripts/validate_college_excel.py --file docs/data.xlsx --output docs/validation-report.local.json
python scripts/import_college_data.py --file docs/data.xlsx --dry-run --timetable-mappings config/timetable_mappings.approved.json
```

Identity import can proceed only with a credential manifest path outside this repository. Approved timetable decisions are recorded in `config/timetable_mappings.approved.json`; the example file remains an unapproved template.

```powershell
python scripts/import_college_data.py --file docs/data.xlsx --apply --credential-output C:\secure\smartclass-initial-credentials.csv --timetable-mappings config/timetable_mappings.approved.json
```

The importer is transactional and idempotent. It writes password hashes to the database and creates a new, exclusive credential manifest only for newly provisioned accounts.

Import the approved Odd Semester 2026–27 calendar before generating explicitly labelled deterministic academics. Its instructional window is 2026-08-03 through 2026-11-18; the generator excludes calendar entries marked as Tests or Holidays.

```powershell
python scripts/import_academic_calendar.py --file config/academic_calendar_odd_2026_2027.json --apply
python scripts/seed_demo_academics.py --semester-start 2026-08-03 --semester-end 2026-11-18 --seed 2026 --dry-run
python scripts/seed_demo_academics.py --semester-start 2026-08-03 --semester-end 2026-11-18 --seed 2026 --apply
```

## Verification

```powershell
python -m pytest backend/test_backend.py -q
python -m py_compile backend/main.py backend/auth.py backend/models.py scripts/import_academic_calendar.py scripts/import_college_data.py scripts/seed_demo_academics.py scripts/timetable_parser.py scripts/validate_college_excel.py
Set-Location frontend
npm run build
```

See [TEST_REPORT.md](TEST_REPORT.md), [DATA_IMPORT_REPORT.md](DATA_IMPORT_REPORT.md), and [DEPLOYMENT_READINESS.md](DEPLOYMENT_READINESS.md) for verified results and remaining blockers.
