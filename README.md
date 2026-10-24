# SmartClass — Integrated Academic and Classroom Management Platform

SmartClass is a production-grade, full-stack academic management platform designed according to the **SmartClass Software Requirements Specification (SRS Version 1.0 Approved)** and styled with high fidelity to the Figma UI specifications.

---

## 🏛️ System Architecture

* **Frontend (`/frontend`)**:
  * React 19 + TypeScript + Vite 8
  * Tailwind CSS v4 + Curated Aesthetic Palette (`#243B2D`, `#F4F1E6`, `#E8D36A`, `#F5EBD7`)
  * Lucide Icons & Recharts analytics
  * API service integration with role-based routing and live state
* **Backend (`/backend`)**:
  * Python FastAPI application layer with RESTful endpoints
  * PBKDF2-HMAC-SHA256 salted password hashing & JWT token authentication
  * Role-Based Access Control (Student, Faculty, HOD, Admin, Council Head)
  * Account lockout protection (5 consecutive failed attempts → 15-minute cooldown)
  * Student class isolation (students are scoped to their own class timetable and roster)
  * Student privacy protection (mobile numbers masked for non-authorized roles)
  * Timetable conflict detection engine (parallel batch aware, joint elective group-bypass)
  * Free classroom search & automatic council event calendar/announcement publication
* **Database**:
  * PostgreSQL relational database cluster (`smartclass` on port 5433 with automatic SQLite fallback)
  * SQLAlchemy ORM with complete 25-table schema & transactional integrity

---

## 🔑 Demo Credentials

All test accounts are pre-seeded in the database with the default password `demo1234`:

| Role | User ID | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Admin** | `ADM001` | `demo1234` | System Administrator (Full system access) |
| **Council Head** | `CON001` | `demo1234` | Student Council Head (Event & calendar publication) |
| **Student (D12A)** | `D12A-01` | `demo1234` | Roll 01, Class D12A |
| **Student (D12B)** | `D12B-01` | `demo1234` | Roll 01, Class D12B |
| **Student (D12C)** | `D12C-01` | `demo1234` | Roll 01, Class D12C |
| **Faculty (HOD)** | `FAC-MP` | `demo1234` | Head of Department |
| **Faculty Member** | `FAC-AB` | `demo1234` | Faculty Member |
| **First-Login User** | `D12A-02` | `demo1234` | Initial account setup (Mandatory password reset test) |

> Note: Quick-login buttons are also provided directly on the Login card for instant role inspection.

---

## 📥 Loading Your Data

The backend includes a data ingestion engine for college timetables and class rosters from Excel workbooks (`data.xlsx`).

### Environment Variables
Configure the following in `backend/.env` or system environment:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DATA_XLSX_PATH` | `<root>/data.xlsx` | Path to the source workbook |
| `APP_ENV` | `development` | In development, exposes demo accounts and dev helpers |
| `SEED_ADMIN_PASSWORD` | `demo1234` | Initial password for `ADM001` |
| `SEED_DEV_PASSWORD` | `demo1234` | Default seed password for student/faculty demo accounts |
| `DEPARTMENT_NAME` | `Computer Engineering` | Department name applied to classes |
| `HOD_INITIALS` | `MP` | Faculty initials mapped to Head of Department |

### Running the Seed & Ingestion Script
From the repository root:
```bash
# Full reset and re-import of data.xlsx:
python backend/seed.py

# Safe idempotent re-run without dropping tables:
python backend/seed.py --no-reset

# Import without optional demo content (quizzes, assignments, announcements):
python backend/seed.py --no-demo-content
```

The importer:
1. Parses student rosters across all class division sheets.
2. Identifies unique faculty members and assigns unique identifiers (`FAC-{initials}`).
3. Extracts rooms, lab allocations, and theory slots.
4. Normalizes merged 2-hour lab slots into 2-hour continuous timetable entries.
5. Emits static JSON snapshots to `frontend/src/data/generated/`.
6. Generates an import audit report at `backend/data/import_report.md`.

---

## 🚀 Running the System Locally

### 1. Database Setup & Seeding
From the repository root:
```bash
python backend/seed.py
```

### 2. Start the Backend API Server
```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
* API interactive docs (Swagger UI): `http://127.0.0.1:8000/docs`

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
# Or preview production bundle:
npm run build && npm run preview -- --port 4173 --host 127.0.0.1
```
* Access the web application at: `http://127.0.0.1:4173` or `http://127.0.0.1:5173`

---

## 🧪 Running Automated Tests

Run backend unit tests, data parser regression tests, and API integration tests:
```bash
# Run all tests (17 test cases):
python -m pytest backend/ -v
```

---

## 📋 SRS Feature Compliance Summary

| Section | Feature Area | Status | Implementation Details |
| :--- | :--- | :--- | :--- |
| **4.1** | Authentication & RBAC | ✅ Complete | Salted hash, JWT, lockout on 5 fails, first-login password enforcement, HOD role combo |
| **4.2** | Class & Course Admin | ✅ Complete | Class rosters, course allocations, student directory with privacy masking |
| **4.3** | Attendance Management | ✅ Complete | Manual lecture-level attendance, defaulter lists (<75%), audit trail, clean empty states |
| **4.4** | Lecture Management | ✅ Complete | Regular, Substitute (scheduled vs actual faculty preserved), Extra, and Cancelled lectures |
| **4.5** | Timetable Management | ✅ Complete | Complete & day-wise timetable, parallel batch support, joint elective conflict bypass |
| **4.6** | Classroom Availability| ✅ Complete | Free room search for date/time range against conducted & scheduled lectures |
| **4.7** | Study Material | ✅ Complete | Upload and download organized by unit/topic |
| **4.8** | Assignment Workflow | ✅ Complete | Assignment creation, submission, Late-tagging, grading, and feedback |
| **4.9** | Online Quizzes | ✅ Complete | Timed MCQ attempts, deterministic evaluation, auto-submission |
| **4.10**| Academic Results | ✅ Complete | Course-level performance, averages, clean empty states when no marks |
| **4.11**| Role Dashboards | ✅ Complete | Specialized dashboards for Student, Faculty, HOD, Admin, and Council Head |
| **4.12**| Announcements & Notifs| ✅ Complete | Audience-targeted announcements & system event notifications |
| **4.13**| Academic Calendar | ✅ Complete | Filterable by Events, Tests, Holidays |
| **4.14**| Council Events | ✅ Complete | Event creation with auto-generation of calendar entries and announcements |
| **4.15**| Discussion Forums | ✅ Complete | Per-course forum topics and threaded replies |
| **4.16**| Feedback & Grievances | ✅ Complete | Defined lifecycle (Submitted → Under Review → In Progress → Resolved) |
| **4.17**| AI Performance Reports| ✅ Complete | Advisory strengths, weak areas, and revision topic generation |