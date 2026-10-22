# SmartClass — Integrated Academic and Classroom Management Platform

SmartClass is a production-grade, full-stack academic management platform designed according to the **SmartClass Software Requirements Specification (SRS Version 1.0 Approved)** and styled with high fidelity to the Figma UI specifications.

---

## 🏛️ System Architecture

* **Frontend (`/frontend`)**:
  * React 19 + TypeScript + Vite 8
  * Tailwind CSS v4 + Curated Aesthetic Palette (`#243B2D`, `#F4F1E6`, `#E8D36A`, `#F5EBD7`)
  * Lucide Icons & Recharts analytics
  * API service integration with graceful offline fallback
* **Backend (`/backend`)**:
  * Python FastAPI application layer with RESTful endpoints
  * PBKDF2-HMAC-SHA256 salted password hashing & JWT token authentication
  * Role-Based Access Control (Student, Faculty, HOD, Admin, Council Head)
  * Account lockout protection (5 consecutive failed attempts → 15-minute cooldown)
  * Timetable conflict detection engine (faculty, classroom, class overlaps)
  * Free classroom search & automatic council event calendar/announcement publication
* **Database**:
  * PostgreSQL relational database cluster (`smartclass` on port 5433 / default port)
  * SQLAlchemy ORM with complete 25-table schema & transactional integrity

---

## 🔑 Demo Credentials

All test accounts are pre-seeded in the database:

| Role | User ID | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Student** | `STU001` | `demo1234` | Arjun Sharma (SE-A, Computer Science) |
| **Faculty** | `FAC001` | `demo1234` | Prof. Meera Patel |
| **Faculty + HOD** | `FAC002` | `demo1234` | Prof. Rajesh Mehta (Head of Department) |
| **Admin** | `ADM001` | `demo1234` | Sunita Nair (System Administrator) |
| **Council Head**| `CON001` | `demo1234` | Priya Desai (Tech Council) |
| **First-Login User** | `STU_NEW` | `Temp@123` | Tests FR-AUTH-003 mandatory password change |

> Quick-login buttons are also provided directly on the Login card for instant role inspection.

---

## 🚀 Running the System Locally

### 1. Database Setup & Seeding
From the repository root:
```bash
# Seed database tables and initial records
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

Run backend integration tests and original unit tests using `pytest`:
```bash
# Run all tests
pytest

# Run backend API integration tests
pytest backend/test_backend.py
```

---

## 📋 SRS Feature Compliance Summary

| Section | Feature Area | Status | Implementation Details |
| :--- | :--- | :--- | :--- |
| **4.1** | Authentication & RBAC | ✅ Complete | Salted hash, JWT, lockout on 5 fails, first-login password enforcement, HOD role combo |
| **4.2** | Class & Course Admin | ✅ Complete | Admin creation of batches, course allocation, student reassignment |
| **4.3** | Attendance Management | ✅ Complete | Manual lecture-level attendance, defaulter lists (<75%), audit trail |
| **4.4** | Lecture Management | ✅ Complete | Regular, Substitute (scheduled vs actual faculty preserved), Extra, and Cancelled lectures |
| **4.5** | Timetable Management | ✅ Complete | Complete & day-wise timetable, 3-point conflict detection (faculty, room, class) |
| **4.6** | Classroom Availability| ✅ Complete | Free room search for date/time range against all conducted & scheduled lectures |
| **4.7** | Study Material | ✅ Complete | Upload and download organized by unit/topic |
| **4.8** | Assignment Workflow | ✅ Complete | Assignment creation, submission, Late-tagging, grading, and feedback |
| **4.9** | Online Quizzes | ✅ Complete | Timed MCQ attempts, deterministic evaluation, auto-submission |
| **4.10**| Academic Results | ✅ Complete | Course-level performance, averages, and trend tracking |
| **4.11**| Role Dashboards | ✅ Complete | Specialized dashboards for Student, Faculty, HOD, Admin, and Council Head |
| **4.12**| Announcements & Notifs| ✅ Complete | Audience-targeted announcements & system event notifications |
| **4.13**| Academic Calendar | ✅ Complete | Filterable by Events, Tests, Holidays |
| **4.14**| Council Events | ✅ Complete | Event creation with auto-generation of calendar entries and announcements |
| **4.15**| Discussion Forums | ✅ Complete | Per-course forum topics and threaded replies |
| **4.16**| Feedback & Grievances | ✅ Complete | Defined lifecycle (Submitted → Under Review → In Progress → Resolved) |
| **4.17**| AI Performance Reports| ✅ Complete | Advisory strengths, weak areas, and revision topic generation |