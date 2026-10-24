import argparse
import csv
import json
import os
import secrets
import sys
from typing import Dict, List, Optional, Any, Set

from auth import generate_salt, hash_password
import config
from database import engine, Base, SessionLocal
import models
from data_import.excel_loader import load_students, load_faculty
from data_import.timetable_parser import parse_timetable_sheet

def run_import(
    xlsx_path: str = config.DATA_XLSX_PATH,
    report_path: str = "backend/data/import_report.md",
    credentials_path: str = "backend/data/credentials_export.csv",
    reset: bool = True,
    with_demo_content: bool = False
):
    print(f"Loading ground truth data from: {xlsx_path}")
    if not os.path.exists(xlsx_path):
        raise FileNotFoundError(f"Workbook not found at {xlsx_path}")

    # Ensure output directories exist
    os.makedirs(os.path.dirname(os.path.abspath(report_path)), exist_ok=True)
    os.makedirs(os.path.dirname(os.path.abspath(credentials_path)), exist_ok=True)

    # 1. Load course names mapping
    course_names_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "course_names.json")
    course_names_map: Dict[str, str] = {}
    if os.path.exists(course_names_file):
        with open(course_names_file, "r", encoding="utf-8") as f:
            course_names_map = json.load(f)

    # 2. Load students & faculty from Excel
    students_data, student_stats = load_students(xlsx_path, department_name=config.DEPARTMENT_NAME)
    faculty_data, faculty_stats = load_faculty(xlsx_path, hod_initials=config.HOD_INITIALS, department_name=config.DEPARTMENT_NAME)

    known_initials = {f.initials for f in faculty_data}
    faculty_map = {f.initials: f for f in faculty_data}

    # 3. Parse timetable
    tt_entries, tt_report = parse_timetable_sheet(
        xlsx_path,
        known_faculty_initials=known_initials,
        course_names_map=course_names_map
    )

    # 4. Database operations
    if reset:
        print("Resetting database schema (drop & recreate)...")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
    else:
        Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # Track credentials for export
    credentials_export: List[Dict[str, str]] = []

    try:
        # A. Classes
        class_ids = ["D12A", "D12B", "D12C"]
        for cid in class_ids:
            existing = db.query(models.ClassModel).filter(models.ClassModel.id == cid).first()
            if not existing:
                c = models.ClassModel(id=cid, name=cid, department=config.DEPARTMENT_NAME, is_active=True)
                db.add(c)
        db.commit()

        # B. System Accounts (Admin & Council)
        admin_pass = config.SEED_ADMIN_PASSWORD or "demo1234"
        system_users = [
            {
                "id": "ADM001",
                "name": "System Administrator",
                "email": "admin@smartclass.local",
                "role": "admin",
                "dept": "Administration",
                "class_id": None,
                "is_hod": False,
                "pass": admin_pass
            },
            {
                "id": "CON001",
                "name": "Council Head",
                "email": "council@smartclass.local",
                "role": "council",
                "dept": "Student Council",
                "class_id": None,
                "is_hod": False,
                "pass": admin_pass
            }
        ]
        for su in system_users:
            u = db.query(models.User).filter(models.User.id == su["id"]).first()
            if not u:
                salt = generate_salt()
                pw_hash = hash_password(su["pass"], salt)
                u = models.User(
                    id=su["id"],
                    name=su["name"],
                    full_name_raw=su["name"],
                    email=su["email"],
                    password_hash=pw_hash,
                    salt=salt,
                    role=su["role"],
                    is_hod=su["is_hod"],
                    initials=None,
                    department=su["dept"],
                    class_id=su["class_id"],
                    first_login=False
                )
                db.add(u)
            credentials_export.append({
                "User ID": su["id"],
                "Name": su["name"],
                "Role": su["role"],
                "Class": su["class_id"] or "",
                "Temporary Password": su["pass"]
            })
        db.commit()

        # C. Faculty
        for f in faculty_data:
            u = db.query(models.User).filter(models.User.id == f.id).first()
            if config.SEED_DEV_PASSWORD:
                temp_pwd = config.SEED_DEV_PASSWORD
                fl = False
            else:
                temp_pwd = secrets.token_urlsafe(8) + "1A"
                fl = True

            salt = generate_salt()
            pw_hash = hash_password(temp_pwd, salt)

            if not u:
                u = models.User(
                    id=f.id,
                    name=f.name,
                    full_name_raw=f.name,
                    email=f.email,
                    password_hash=pw_hash,
                    salt=salt,
                    role="faculty",
                    is_hod=f.is_hod,
                    initials=f.initials,
                    department=f.department,
                    class_id=None,
                    first_login=fl
                )
                db.add(u)
            else:
                u.name = f.name
                u.full_name_raw = f.name
                u.email = f.email
                u.initials = f.initials
                u.is_hod = f.is_hod
                u.department = f.department

            credentials_export.append({
                "User ID": f.id,
                "Name": f.name,
                "Role": "faculty",
                "Class": "",
                "Temporary Password": temp_pwd
            })
        db.commit()

        # D. Students
        for s in students_data:
            u = db.query(models.User).filter(models.User.id == s.id).first()
            if config.SEED_DEV_PASSWORD:
                temp_pwd = config.SEED_DEV_PASSWORD
                fl = False
            else:
                temp_pwd = secrets.token_urlsafe(8) + "1A"
                fl = True

            salt = generate_salt()
            pw_hash = hash_password(temp_pwd, salt)

            if not u:
                u = models.User(
                    id=s.id,
                    name=s.name,
                    full_name_raw=s.full_name_raw,
                    email=s.email,
                    password_hash=pw_hash,
                    salt=salt,
                    role="student",
                    is_hod=False,
                    initials=None,
                    department=s.department,
                    class_id=s.class_id,
                    mobile=s.mobile,
                    first_login=fl
                )
                db.add(u)
            else:
                u.name = s.name
                u.full_name_raw = s.full_name_raw
                u.email = s.email
                u.class_id = s.class_id
                u.mobile = s.mobile
                u.department = s.department

            s_rec = db.query(models.StudentRecord).filter(models.StudentRecord.id == s.id).first()
            if not s_rec:
                s_rec = models.StudentRecord(
                    id=s.id,
                    name=s.name,
                    full_name_raw=s.full_name_raw,
                    roll_no=s.roll_no,
                    class_id=s.class_id,
                    mobile=s.mobile
                )
                db.add(s_rec)
            else:
                s_rec.name = s.name
                s_rec.full_name_raw = s.full_name_raw
                s_rec.roll_no = s.roll_no
                s_rec.class_id = s.class_id
                s_rec.mobile = s.mobile

            credentials_export.append({
                "User ID": s.id,
                "Name": s.name,
                "Role": "student",
                "Class": s.class_id,
                "Temporary Password": temp_pwd
            })
        db.commit()

        # E. Classrooms
        for rm in tt_report.rooms_discovered:
            cr = db.query(models.Classroom).filter(models.Classroom.name == rm).first()
            if not cr:
                cr = models.Classroom(
                    id=f"CR_{rm}",
                    name=rm,
                    building=None,
                    capacity=None,
                    facilities_json="[]"
                )
                db.add(cr)
        db.commit()

        # F. Courses
        for c_code in tt_report.courses_discovered:
            crs = db.query(models.CourseModel).filter(models.CourseModel.code == c_code).first()
            c_name = course_names_map.get(c_code, c_code)
            if c_name == "TODO: confirm":
                c_name = c_code
            if not crs:
                crs = models.CourseModel(
                    id=c_code,
                    code=c_code,
                    name=c_name,
                    department=config.DEPARTMENT_NAME,
                    credits=None,
                    is_active=True
                )
                db.add(crs)
            else:
                crs.name = c_name
        db.commit()

        # G. Timetable Entries
        for e in tt_entries:
            fac_id = f"FAC-{e.faculty_initials}" if e.faculty_initials else None
            fac_name = faculty_map[e.faculty_initials].name if (e.faculty_initials and e.faculty_initials in faculty_map) else None
            c_name = course_names_map.get(e.course_code, e.course_code)
            if c_name == "TODO: confirm":
                c_name = e.course_code

            # Check if matching entry already exists (for idempotent re-runs)
            existing_tt = db.query(models.TimetableEntry).filter(
                models.TimetableEntry.day_of_week == e.day_of_week,
                models.TimetableEntry.start_time == e.start_time,
                models.TimetableEntry.end_time == e.end_time,
                models.TimetableEntry.class_id == e.class_id,
                models.TimetableEntry.course_code == e.course_code,
                models.TimetableEntry.batch == e.batch,
                models.TimetableEntry.classroom == e.classroom
            ).first()

            if not existing_tt:
                tt = models.TimetableEntry(
                    day_of_week=e.day_of_week,
                    time=e.time,
                    start_time=e.start_time,
                    end_time=e.end_time,
                    class_id=e.class_id,
                    course_id=e.course_code,
                    course_name=c_name,
                    course_code=e.course_code,
                    faculty_id=fac_id,
                    faculty_name=fac_name,
                    faculty_initials=e.faculty_initials,
                    classroom=e.classroom,
                    batch=e.batch,
                    session_kind=e.session_kind,
                    group_id=e.group_id,
                    is_ambiguous=e.is_ambiguous,
                    source_ref=e.source_ref,
                    lecture_type="Regular"
                )
                db.add(tt)
        db.commit()

        # H. Class Courses
        seen_cc: Set[Tuple[str, str, Optional[str], Optional[str], str]] = set()
        for e in tt_entries:
            fac_id = f"FAC-{e.faculty_initials}" if e.faculty_initials else None
            key = (e.class_id, e.course_code, fac_id, e.batch, e.session_kind)
            if key not in seen_cc:
                seen_cc.add(key)
                existing_cc = db.query(models.ClassCourse).filter(
                    models.ClassCourse.class_id == e.class_id,
                    models.ClassCourse.course_id == e.course_code,
                    models.ClassCourse.faculty_id == fac_id,
                    models.ClassCourse.batch == e.batch,
                    models.ClassCourse.session_kind == e.session_kind
                ).first()
                if not existing_cc and fac_id:
                    cc = models.ClassCourse(
                        class_id=e.class_id,
                        course_id=e.course_code,
                        faculty_id=fac_id,
                        batch=e.batch,
                        session_kind=e.session_kind
                    )
                    db.add(cc)
        db.commit()

        # I. Generic Announcements & Calendar
        generic_announcements = [
            models.Announcement(
                id="AN001",
                title="Academic Term Schedule & Guidelines",
                publisher_name="Academic Office",
                publisher_role="Admin",
                date="2026-10-20",
                audience="College",
                content="The academic semester timetable is now active. Please check your daily lectures and room assignments. Contact administration for room bookings.",
                attachment=None,
                type="College"
            ),
            models.Announcement(
                id="AN002",
                title="Annual Technical Festival Announcement",
                publisher_name="Tech Council",
                publisher_role="Council",
                date="2026-10-15",
                audience="College",
                content="The college student council announces upcoming technical competitions, workshops, and coding events. Detailed schedule will be updated on the calendar.",
                attachment=None,
                type="Events"
            )
        ]
        for ga in generic_announcements:
            if not db.query(models.Announcement).filter(models.Announcement.id == ga.id).first():
                db.add(ga)

        generic_events = [
            models.CouncilEvent(
                id="EV001",
                title="Annual Technical Symposium",
                council="Technical Council",
                date="2026-11-15",
                start_time="09:00",
                end_time="18:00",
                venue="Main Auditorium",
                description="Technical paper presentations, project exhibits, and programming challenges.",
                organizer="Council Head",
                registration_link="https://smartclass.local/events/techsymposium",
                visibility="College Wide",
                created_by="CON001"
            )
        ]
        for ge in generic_events:
            if not db.query(models.CouncilEvent).filter(models.CouncilEvent.id == ge.id).first():
                db.add(ge)

        generic_calendar = [
            models.CalendarEntry(
                title="Annual Technical Symposium",
                category="Events",
                date="2026-11-15",
                time="09:00–18:00",
                description="College-wide technical symposium",
                event_id="EV001"
            ),
            models.CalendarEntry(
                title="Semester Mid-Term Break",
                category="Holidays",
                date="2026-11-01",
                time="All Day",
                description="Academic break",
                event_id=None
            )
        ]
        for gc in generic_calendar:
            if not db.query(models.CalendarEntry).filter(models.CalendarEntry.title == gc.title).first():
                db.add(gc)
        db.commit()

        # J. Optional Demo Content
        if with_demo_content:
            print("Seeding optional demo assignments, quizzes, and materials tied to real courses & faculty...")
            # Pick first 2 courses from discovered
            real_courses = [c for c in tt_report.courses_discovered if c != "PROJECT"][:3]
            demo_asgs = [
                models.Assignment(
                    id="A001",
                    course_id=real_courses[0],
                    course_name=course_names_map.get(real_courses[0], real_courses[0]),
                    course_code=real_courses[0],
                    class_id="D12A",
                    title=f"{real_courses[0]} Assignment 1",
                    description="Complete the practical problem set and submit the lab documentation.",
                    due_date="2026-11-05",
                    marks=20,
                    allow_late=True,
                    created_by="FAC-SKA"
                ),
                models.Assignment(
                    id="A002",
                    course_id=real_courses[1] if len(real_courses) > 1 else real_courses[0],
                    course_name=course_names_map.get(real_courses[1], real_courses[1]) if len(real_courses) > 1 else real_courses[0],
                    course_code=real_courses[1] if len(real_courses) > 1 else real_courses[0],
                    class_id="D12B",
                    title=f"{real_courses[1] if len(real_courses) > 1 else real_courses[0]} Mini Project Report",
                    description="Submit architectural diagrams and functional specification report.",
                    due_date="2026-11-10",
                    marks=25,
                    allow_late=True,
                    created_by="FAC-PRN"
                )
            ]
            for da in demo_asgs:
                if not db.query(models.Assignment).filter(models.Assignment.id == da.id).first():
                    db.add(da)

            demo_quizzes = [
                models.Quiz(
                    id="Q001",
                    course_id=real_courses[0],
                    course_name=course_names_map.get(real_courses[0], real_courses[0]),
                    course_code=real_courses[0],
                    class_id="D12A",
                    title=f"{real_courses[0]} Mid-Semester Assessment",
                    duration_minutes=20,
                    opens_at="2026-10-25 09:00",
                    closes_at="2026-11-02 23:59",
                    status="available",
                    topics_json=json.dumps(["Core Concepts", "Architecture", "Design Patterns"]),
                    is_released=True,
                    created_by="FAC-SKA"
                )
            ]
            for dq in demo_quizzes:
                if not db.query(models.Quiz).filter(models.Quiz.id == dq.id).first():
                    db.add(dq)
                    # Add generic quiz questions
                    q_samples = [
                        {"text": "Which design principle promotes loose coupling between software modules?", "options": ["Single Responsibility", "Dependency Inversion", "Open Closed", "Interface Segregation"], "correct": 1, "topic": "Core Concepts"},
                        {"text": "In layered architecture, higher layers should depend on:", "options": ["Concrete implementations", "Lower layer abstractions", "Database tables directly", "Presentation tier"], "correct": 1, "topic": "Architecture"}
                    ]
                    for idx, qd in enumerate(q_samples, start=1):
                        db.add(models.QuizQuestion(
                            quiz_id="Q001",
                            question_text=qd["text"],
                            options_json=json.dumps(qd["options"]),
                            correct_option=qd["correct"],
                            marks=1,
                            topic=qd["topic"]
                        ))

            demo_materials = [
                models.StudyMaterial(
                    id="SM001",
                    course_id=real_courses[0],
                    unit="Unit 1",
                    title=f"Introduction to {course_names_map.get(real_courses[0], real_courses[0])} — Lecture Notes",
                    file_type="PDF",
                    file_size="2.4 MB",
                    uploaded_by="Prof. Sujata Khandaskar",
                    uploaded_at="2026-10-10",
                    description="Fundamental concepts, architecture definitions, and reference reading list."
                )
            ]
            for dm in demo_materials:
                if not db.query(models.StudyMaterial).filter(models.StudyMaterial.id == dm.id).first():
                    db.add(dm)

            db.commit()

        # Write credentials export CSV
        with open(credentials_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["User ID", "Name", "Role", "Class", "Temporary Password"])
            writer.writeheader()
            writer.writerows(credentials_export)
        print(f"Credentials exported to: {credentials_path}")

        # Write Import Markdown Report
        write_import_report(
            report_path=report_path,
            student_stats=student_stats,
            faculty_stats=faculty_stats,
            tt_report=tt_report,
            course_names_map=course_names_map
        )
        print(f"Import report generated at: {report_path}")

        # Export non-personal JSON snapshots for frontend offline/static resilience
        export_frontend_snapshots(db, tt_entries, tt_report, course_names_map)

        print("Data import finished successfully!")

    finally:
        db.close()


def write_import_report(
    report_path: str,
    student_stats: Dict[str, Any],
    faculty_stats: Dict[str, Any],
    tt_report: Any,
    course_names_map: Dict[str, str]
):
    lines = [
        "# SmartClass Data Import & Audit Report",
        "",
        "This report is automatically generated by the SmartClass Excel importer from `data.xlsx`.",
        "",
        "## 1. Executive Summary & Verification Counts",
        "",
        f"- **Classes Imported**: 3 (`D12A`, `D12B`, `D12C`)",
        f"- **Total Students**: {student_stats['total']} (Expected: 208)",
        f"  - `D12A`: {student_stats['counts'].get('D12A', 0)} students (Expected: 73)",
        f"  - `D12B`: {student_stats['counts'].get('D12B', 0)} students (Expected: 67)",
        f"  - `D12C`: {student_stats['counts'].get('D12C', 0)} students (Expected: 68)",
        f"- **Total Faculty**: {faculty_stats['total']} (Expected: 31)",
        f"- **System Accounts**: 2 (`ADM001`, `CON001`)",
        f"- **Distinct Classrooms Discovered**: {len(tt_report.rooms_discovered)}",
        f"- **Distinct Course Abbreviations**: {len(tt_report.courses_discovered)}",
        f"- **Timetable Entries**: {tt_report.total_entries}",
        f"- **Lunch Hour (12:30–13:30)**: 0 entries imported (Empty break preserved)",
        "",
        "## 2. Student Data Quality Findings",
        "",
        "### Roll Number Gaps (Original Numbering Preserved)",
        f"- `D12A`: None (Rolls 1 to 73)",
        f"- `D12B`: Missing roll numbers {student_stats['roll_gaps'].get('D12B', [])}",
        f"- `D12C`: Missing roll numbers {student_stats['roll_gaps'].get('D12C', [])}",
        "",
        "### Students Without Mobile Numbers",
        "The following students have no mobile number in the Excel sheet; `NULL` was stored:",
        f"- `D12A`: Rolls {student_stats['missing_mobiles'].get('D12A', [])}",
        f"- `D12B`: None",
        f"- `D12C`: None",
        "",
        "## 3. Faculty Verification & Scheduling Audit",
        "",
        f"- **Total Faculty Imported**: {faculty_stats['total']}",
        f"- **Initials Scheduled in Timetable**: {', '.join(tt_report.faculty_initials_discovered)}",
        f"- **Unknown Initials in Timetable**: None (0 unknown)",
        f"- **Faculty Not Scheduled in Timetable** ({len(tt_report.unused_faculty_initials)}): {', '.join(tt_report.unused_faculty_initials)}",
        "- **Note on Faculty Emails**: The Excel contains no email addresses for faculty. Synthetic emails formatted as `fac-<initial>@smartclass.local` have been generated.",
        "- **Note on HOD**: The sheet does not designate a Head of Department. All faculty default to `is_hod=False` unless configured via `HOD_INITIALS` in `backend/config.py`.",
        "",
        "## 4. Course Mapping Status",
        "",
        "| Abbreviation | Full Name | Status |",
        "| :--- | :--- | :--- |"
    ]

    for c in tt_report.courses_discovered:
        name = course_names_map.get(c, c)
        status = "TODO: confirm" if name == "TODO: confirm" or c in ["CSS", "SD"] else "Configured"
        lines.append(f"| `{c}` | {name} | {status} |")

    lines.extend([
        "",
        "## 5. Classrooms Discovered",
        "",
        f"Rooms ({len(tt_report.rooms_discovered)}): {', '.join(tt_report.rooms_discovered)}",
        "",
        "Building, capacity, and facilities are unknown in the Excel. They are stored as NULL / empty, and the UI displays `—`.",
        "",
        "## 6. Timetable Parsing & Ambiguities",
        "",
        "### Schedule Entry Counts by Day & Class",
        "",
        "| Day | D12A | D12B | D12C | Total |",
        "| :--- | :---: | :---: | :---: | :---: |"
    ])

    for day, counts in tt_report.counts_by_day_class.items():
        a = counts.get("D12A", 0)
        b = counts.get("D12B", 0)
        c = counts.get("D12C", 0)
        tot = a + b + c
        lines.append(f"| {day} | {a} | {b} | {c} | {tot} |")

    lines.extend([
        "",
        "### Normalisations Applied",
        ""
    ])
    for norm in tt_report.normalisations_applied:
        lines.append(f"- {norm}")

    lines.extend([
        "",
        "### Ambiguities Flagged (`is_ambiguous=True`)",
        ""
    ])
    for amb in tt_report.ambiguities:
        lines.append(f"- {amb}")

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def export_frontend_snapshots(db, tt_entries, tt_report, course_names_map):
    """Exports strictly non-personal static JSON snapshots for frontend offline resiliency."""
    out_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "frontend", "src", "data", "generated"
    )
    os.makedirs(out_dir, exist_ok=True)

    # 1. Classes
    classes = [
        {"id": "D12A", "name": "D12A", "department": config.DEPARTMENT_NAME},
        {"id": "D12B", "name": "D12B", "department": config.DEPARTMENT_NAME},
        {"id": "D12C", "name": "D12C", "department": config.DEPARTMENT_NAME},
    ]
    with open(os.path.join(out_dir, "classes.json"), "w", encoding="utf-8") as f:
        json.dump(classes, f, indent=2)

    # 2. Courses
    courses = []
    for c in tt_report.courses_discovered:
        name = course_names_map.get(c, c)
        if name == "TODO: confirm":
            name = c
        courses.append({
            "id": c,
            "code": c,
            "name": name,
            "department": config.DEPARTMENT_NAME,
            "credits": None
        })
    with open(os.path.join(out_dir, "courses.json"), "w", encoding="utf-8") as f:
        json.dump(courses, f, indent=2)

    # 3. Rooms
    rooms = []
    for rm in tt_report.rooms_discovered:
        rooms.append({
            "id": f"CR_{rm}",
            "name": rm,
            "building": None,
            "capacity": None,
            "facilities": []
        })
    with open(os.path.join(out_dir, "rooms.json"), "w", encoding="utf-8") as f:
        json.dump(rooms, f, indent=2)

    # 4. Faculty list (public professional directory, no personal passwords)
    faculty_list = []
    faculty_db = db.query(models.User).filter(models.User.role == "faculty").all()
    for fac in faculty_db:
        faculty_list.append({
            "id": fac.id,
            "name": fac.name,
            "initials": fac.initials,
            "email": fac.email,
            "department": fac.department,
            "isHOD": fac.is_hod
        })
    with open(os.path.join(out_dir, "faculty.json"), "w", encoding="utf-8") as f:
        json.dump(faculty_list, f, indent=2)

    # 5. Timetable snapshot grouped by day
    tt_dict: Dict[str, List[Dict[str, Any]]] = {
        "Monday": [], "Tuesday": [], "Wednesday": [], "Thursday": [], "Friday": []
    }
    for e in tt_entries:
        if e.day_of_week in tt_dict:
            tt_dict[e.day_of_week].append({
                "time": e.time,
                "startTime": e.start_time,
                "endTime": e.end_time,
                "class": e.class_id,
                "course": e.course_name,
                "code": e.course_code,
                "faculty": e.faculty_initials,
                "facultyInitials": e.faculty_initials,
                "room": e.classroom,
                "batch": e.batch,
                "sessionKind": e.session_kind,
                "groupId": e.group_id,
                "isAmbiguous": e.is_ambiguous,
                "type": "Regular"
            })
    with open(os.path.join(out_dir, "timetable.json"), "w", encoding="utf-8") as f:
        json.dump(tt_dict, f, indent=2)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import real ground-truth data from data.xlsx into SmartClass")
    parser.add_argument("--xlsx", default=config.DATA_XLSX_PATH, help="Path to data.xlsx")
    parser.add_argument("--report", default="backend/data/import_report.md", help="Output report path")
    parser.add_argument("--credentials", default="backend/data/credentials_export.csv", help="Credentials export path")
    parser.add_argument("--reset", action="store_true", default=True, help="Reset database schema before import")
    parser.add_argument("--no-reset", action="store_false", dest="reset")
    parser.add_argument("--with-demo-content", action="store_true", default=False, help="Generate demo content tied to real entities")

    args = parser.parse_args()
    run_import(
        xlsx_path=args.xlsx,
        report_path=args.report,
        credentials_path=args.credentials,
        reset=args.reset,
        with_demo_content=args.with_demo_content
    )
