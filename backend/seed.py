import json
import sys
from datetime import datetime
from database import engine, Base, SessionLocal
import models
from auth import generate_salt, hash_password

def seed_database(reset: bool = True):
    if reset:
        print("Dropping existing tables to ensure clean schema...")
        Base.metadata.drop_all(bind=engine)
    
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()

    print("Seeding SmartClass database with initial records...")

    # 1. Classes
    classes = [
        models.ClassModel(id="SE-A", name="SE Computer Engineering - Div A", department="Computer Science"),
        models.ClassModel(id="SE-B", name="SE Computer Engineering - Div B", department="Computer Science"),
        models.ClassModel(id="TE-A", name="TE Computer Engineering - Div A", department="Computer Science"),
        models.ClassModel(id="BE-A", name="BE Computer Engineering - Div A", department="Computer Science"),
    ]
    db.add_all(classes)
    db.commit()

    # 2. Courses
    courses = [
        models.CourseModel(id="CS301", code="CS301", name="Data Structures & Algorithms", department="Computer Science", credits=4),
        models.CourseModel(id="CS302", code="CS302", name="Database Management Systems", department="Computer Science", credits=4),
        models.CourseModel(id="CS303", code="CS303", name="Operating Systems", department="Computer Science", credits=3),
        models.CourseModel(id="CS304", code="CS304", name="Computer Networks", department="Computer Science", credits=3),
        models.CourseModel(id="CS305", code="CS305", name="Software Engineering", department="Computer Science", credits=3),
    ]
    db.add_all(courses)
    db.commit()

    # 3. Users
    users_data = [
        {"id": "STU001", "name": "Arjun Sharma", "email": "arjun.sharma@smartclass.edu", "role": "student", "dept": "Computer Science", "class_id": "SE-A", "is_hod": False},
        {"id": "STU002", "name": "Priya Malhotra", "email": "priya.m@smartclass.edu", "role": "student", "dept": "Computer Science", "class_id": "SE-A", "is_hod": False},
        {"id": "STU003", "name": "Rohan Gupta", "email": "rohan.g@smartclass.edu", "role": "student", "dept": "Computer Science", "class_id": "SE-A", "is_hod": False},
        {"id": "STU004", "name": "Sneha Iyer", "email": "sneha.i@smartclass.edu", "role": "student", "dept": "Computer Science", "class_id": "SE-A", "is_hod": False},
        {"id": "STU005", "name": "Karan Bhat", "email": "karan.b@smartclass.edu", "role": "student", "dept": "Computer Science", "class_id": "SE-A", "is_hod": False},
        {"id": "STU006", "name": "Ananya Krishnan", "email": "ananya.k@smartclass.edu", "role": "student", "dept": "Computer Science", "class_id": "SE-A", "is_hod": False},
        {"id": "STU007", "name": "Vikram Nair", "email": "vikram.n@smartclass.edu", "role": "student", "dept": "Computer Science", "class_id": "SE-A", "is_hod": False},
        {"id": "STU008", "name": "Pooja Sharma", "email": "pooja.s@smartclass.edu", "role": "student", "dept": "Computer Science", "class_id": "SE-A", "is_hod": False},
        {"id": "STU009", "name": "Aditya Verma", "email": "aditya.v@smartclass.edu", "role": "student", "dept": "Computer Science", "class_id": "SE-A", "is_hod": False},
        {"id": "STU010", "name": "Riya Pillai", "email": "riya.p@smartclass.edu", "role": "student", "dept": "Computer Science", "class_id": "SE-A", "is_hod": False},
        {"id": "STU011", "name": "Siddharth Rao", "email": "siddharth.r@smartclass.edu", "role": "student", "dept": "Computer Science", "class_id": "SE-A", "is_hod": False},
        {"id": "STU012", "name": "Kavya Reddy", "email": "kavya.r@smartclass.edu", "role": "student", "dept": "Computer Science", "class_id": "SE-A", "is_hod": False},
        {"id": "FAC001", "name": "Prof. Meera Patel", "email": "meera.patel@smartclass.edu", "role": "faculty", "dept": "Computer Science", "class_id": None, "is_hod": False},
        {"id": "FAC002", "name": "Prof. Rajesh Mehta", "email": "rajesh.mehta@smartclass.edu", "role": "faculty", "dept": "Computer Science", "class_id": None, "is_hod": True},
        {"id": "ADM001", "name": "Sunita Nair", "email": "sunita.nair@smartclass.edu", "role": "admin", "dept": "Administration", "class_id": None, "is_hod": False},
        {"id": "CON001", "name": "Priya Desai", "email": "priya.desai@smartclass.edu", "role": "council", "dept": "Computer Science", "class_id": None, "is_hod": False},
    ]

    for u in users_data:
        salt = generate_salt()
        pwd_hash = hash_password("demo1234", salt)
        user = models.User(
            id=u["id"],
            name=u["name"],
            email=u["email"],
            password_hash=pwd_hash,
            salt=salt,
            role=u["role"],
            is_hod=u["is_hod"],
            department=u["dept"],
            class_id=u["class_id"],
            first_login=False
        )
        db.add(user)

    # User for first-login testing (FR-AUTH-003)
    temp_salt = generate_salt()
    temp_user = models.User(
        id="STU_NEW",
        name="New Student",
        email="new.student@smartclass.edu",
        password_hash=hash_password("Temp@123", temp_salt),
        salt=temp_salt,
        role="student",
        is_hod=False,
        department="Computer Science",
        class_id="SE-A",
        first_login=True
    )
    db.add(temp_user)
    db.commit()

    # 4. Class Courses
    class_courses = [
        models.ClassCourse(class_id="SE-A", course_id="CS301", faculty_id="FAC001"),
        models.ClassCourse(class_id="SE-A", course_id="CS302", faculty_id="FAC002"),
        models.ClassCourse(class_id="SE-A", course_id="CS303", faculty_id="FAC001"),
        models.ClassCourse(class_id="SE-A", course_id="CS304", faculty_id="FAC002"),
        models.ClassCourse(class_id="SE-A", course_id="CS305", faculty_id="FAC001"),
    ]
    db.add_all(class_courses)
    db.commit()

    # 5. Students
    for i in range(1, 13):
        sid = f"STU{i:03d}"
        roll = f"22CS{i:03d}"
        s_rec = models.StudentRecord(id=sid, name=users_data[i-1]["name"], roll_no=roll, class_id="SE-A")
        db.add(s_rec)
    db.commit()

    # 6. Classrooms
    rooms = [
        models.Classroom(id="CR001", name="A-101", building="A Block", capacity=60, facilities_json=json.dumps(["Projector", "AC"])),
        models.Classroom(id="CR002", name="A-102", building="A Block", capacity=60, facilities_json=json.dumps(["Projector", "AC"])),
        models.Classroom(id="CR003", name="A-201", building="A Block", capacity=80, facilities_json=json.dumps(["Smart Board", "AC"])),
        models.Classroom(id="CR004", name="A-204", building="A Block", capacity=60, facilities_json=json.dumps(["Projector"])),
        models.Classroom(id="CR005", name="B-102", building="B Block", capacity=70, facilities_json=json.dumps(["Projector", "AC"])),
        models.Classroom(id="CR006", name="B-203", building="B Block", capacity=50, facilities_json=json.dumps(["Projector"])),
        models.Classroom(id="CR007", name="C-301", building="C Block", capacity=90, facilities_json=json.dumps(["Smart Board", "AC", "Recording"])),
        models.Classroom(id="CR008", name="Lab-2", building="Lab Block", capacity=30, facilities_json=json.dumps(["Computers", "AC"])),
        models.Classroom(id="CR009", name="Lab-3", building="Lab Block", capacity=30, facilities_json=json.dumps(["Computers", "AC"])),
    ]
    db.add_all(rooms)
    db.commit()

    # 7. Timetable entries
    tt = [
        # Monday
        models.TimetableEntry(day_of_week="Monday", time="09:00–10:00", start_time="09:00", end_time="10:00", class_id="SE-A", course_id="CS301", course_code="CS301", course_name="Data Structures", faculty_id="FAC001", faculty_name="Prof. Patel", classroom="A-204", lecture_type="Regular"),
        models.TimetableEntry(day_of_week="Monday", time="10:00–11:00", start_time="10:00", end_time="11:00", class_id="SE-A", course_id="CS302", course_code="CS302", course_name="Database Systems", faculty_id="FAC002", faculty_name="Prof. Mehta", classroom="B-102", lecture_type="Regular"),
        models.TimetableEntry(day_of_week="Monday", time="11:15–12:15", start_time="11:15", end_time="12:15", class_id="SE-A", course_id="CS303", course_code="CS303", course_name="Operating Systems", faculty_id="FAC001", faculty_name="Prof. Singh", classroom="A-101", lecture_type="Regular"),
        models.TimetableEntry(day_of_week="Monday", time="14:00–15:00", start_time="14:00", end_time="15:00", class_id="SE-A", course_id="CS304", course_code="CS304", course_name="Computer Networks", faculty_id="FAC002", faculty_name="Prof. Joshi", classroom="C-301", lecture_type="Regular"),
        # Tuesday
        models.TimetableEntry(day_of_week="Tuesday", time="09:00–10:00", start_time="09:00", end_time="10:00", class_id="SE-A", course_id="CS305", course_code="CS305", course_name="Software Engineering", faculty_id="FAC001", faculty_name="Prof. Rao", classroom="A-202", lecture_type="Regular"),
        models.TimetableEntry(day_of_week="Tuesday", time="10:00–11:00", start_time="10:00", end_time="11:00", class_id="SE-A", course_id="CS301", course_code="CS301", course_name="Data Structures", faculty_id="FAC001", faculty_name="Prof. Patel", classroom="A-204", lecture_type="Regular"),
        models.TimetableEntry(day_of_week="Tuesday", time="14:00–16:00", start_time="14:00", end_time="16:00", class_id="SE-A", course_id="CS302", course_code="CS302L", course_name="Database Systems Lab", faculty_id="FAC002", faculty_name="Prof. Mehta", classroom="Lab-2", lecture_type="Regular"),
        # Wednesday
        models.TimetableEntry(day_of_week="Wednesday", time="09:00–10:00", start_time="09:00", end_time="10:00", class_id="SE-A", course_id="CS303", course_code="CS303", course_name="Operating Systems", faculty_id="FAC001", faculty_name="Prof. Singh", classroom="A-101", lecture_type="Regular"),
        models.TimetableEntry(day_of_week="Wednesday", time="10:00–11:00", start_time="10:00", end_time="11:00", class_id="SE-A", course_id="CS304", course_code="CS304", course_name="Computer Networks", faculty_id="FAC002", faculty_name="Prof. Joshi", classroom="C-301", lecture_type="Substitute"),
        models.TimetableEntry(day_of_week="Wednesday", time="11:15–12:15", start_time="11:15", end_time="12:15", class_id="SE-A", course_id="CS305", course_code="CS305", course_name="Software Engineering", faculty_id="FAC001", faculty_name="Prof. Rao", classroom="A-202", lecture_type="Regular"),
        models.TimetableEntry(day_of_week="Wednesday", time="14:00–15:00", start_time="14:00", end_time="15:00", class_id="SE-A", course_id="CS301", course_code="CS301", course_name="Data Structures", faculty_id="FAC001", faculty_name="Prof. Patel", classroom="A-204", lecture_type="Extra"),
        # Thursday
        models.TimetableEntry(day_of_week="Thursday", time="09:00–10:00", start_time="09:00", end_time="10:00", class_id="SE-A", course_id="CS302", course_code="CS302", course_name="Database Systems", faculty_id="FAC002", faculty_name="Prof. Mehta", classroom="B-102", lecture_type="Regular"),
        models.TimetableEntry(day_of_week="Thursday", time="10:00–11:00", start_time="10:00", end_time="11:00", class_id="SE-A", course_id="CS303", course_code="CS303", course_name="Operating Systems", faculty_id="FAC001", faculty_name="Prof. Singh", classroom="A-101", lecture_type="Regular"),
        models.TimetableEntry(day_of_week="Thursday", time="14:00–16:00", start_time="14:00", end_time="16:00", class_id="SE-A", course_id="CS304", course_code="CS304L", course_name="Networks Lab", faculty_id="FAC002", faculty_name="Prof. Joshi", classroom="Lab-3", lecture_type="Regular"),
        # Friday
        models.TimetableEntry(day_of_week="Friday", time="09:00–10:00", start_time="09:00", end_time="10:00", class_id="SE-A", course_id="CS304", course_code="CS304", course_name="Computer Networks", faculty_id="FAC002", faculty_name="Prof. Joshi", classroom="C-301", lecture_type="Regular"),
        models.TimetableEntry(day_of_week="Friday", time="10:00–11:00", start_time="10:00", end_time="11:00", class_id="SE-A", course_id="CS305", course_code="CS305", course_name="Software Engineering", faculty_id="FAC001", faculty_name="Prof. Rao", classroom="A-202", lecture_type="Regular"),
        models.TimetableEntry(day_of_week="Friday", time="11:15–12:15", start_time="11:15", end_time="12:15", class_id="SE-A", course_id="CS302", course_code="CS302", course_name="Database Systems", faculty_id="FAC002", faculty_name="Prof. Mehta", classroom="B-102", lecture_type="Cancelled"),
        models.TimetableEntry(day_of_week="Friday", time="14:00–15:00", start_time="14:00", end_time="15:00", class_id="SE-A", course_id="CS301", course_code="CS301", course_name="Data Structures", faculty_id="FAC001", faculty_name="Prof. Patel", classroom="A-204", lecture_type="Regular"),
    ]
    db.add_all(tt)
    db.commit()

    # 8. Lectures and Attendance Records
    lec1 = models.Lecture(
        id=1,
        class_id="SE-A",
        course_id="CS302",
        course_name="Database Management Systems",
        course_code="CS302",
        scheduled_faculty_id="FAC002",
        scheduled_faculty_name="Prof. Rajesh Mehta",
        actual_faculty_id="FAC002",
        actual_faculty_name="Prof. Rajesh Mehta",
        date="2026-10-21",
        start_time="10:00",
        end_time="11:00",
        lecture_type="Regular",
        classroom="B-102",
        status="Conducted",
        notes="Covered 3NF and BCNF normalization."
    )
    db.add(lec1)
    db.commit()

    # Add attendance for all 12 students in lecture 1
    for i in range(1, 13):
        sid = f"STU{i:03d}"
        status = "Present" if i != 3 else "Absent" # STU003 Absent
        att = models.Attendance(
            lecture_id=1,
            student_id=sid,
            status=status,
            marked_by="FAC002"
        )
        db.add(att)
    db.commit()

    # 9. Assignments
    assignments = [
        models.Assignment(
            id="A001",
            course_id="CS302",
            course_name="Database Management Systems",
            course_code="CS302",
            class_id="SE-A",
            title="Normalization Assignment",
            description="Normalize the given hospital database schema to 3NF and BCNF. Submit a detailed report with ER diagrams.",
            due_date="2026-10-28",
            marks=20,
            allow_late=True,
            created_by="FAC002"
        ),
        models.Assignment(
            id="A002",
            course_id="CS301",
            course_name="Data Structures & Algorithms",
            course_code="CS301",
            class_id="SE-A",
            title="Binary Tree Implementation",
            description="Implement AVL tree with insertion, deletion, and traversal. Include time complexity analysis.",
            due_date="2026-10-25",
            marks=25,
            allow_late=True,
            created_by="FAC001"
        ),
        models.Assignment(
            id="A003",
            course_id="CS303",
            course_name="Operating Systems",
            course_code="CS303",
            class_id="SE-A",
            title="Process Scheduling Report",
            description="Compare FCFS, SJF, Round Robin, and Priority scheduling with Gantt charts.",
            due_date="2026-10-15",
            marks=15,
            allow_late=False,
            created_by="FAC001"
        ),
        models.Assignment(
            id="A004",
            course_id="CS304",
            course_name="Computer Networks",
            course_code="CS304",
            class_id="SE-A",
            title="Network Topology Design",
            description="Design a scalable network topology for a multi-branch organization.",
            due_date="2026-10-10",
            marks=20,
            allow_late=True,
            created_by="FAC002"
        ),
    ]
    db.add_all(assignments)
    db.commit()

    # Submissions
    sub1 = models.AssignmentSubmission(
        assignment_id="A002",
        student_id="STU001",
        student_name="Arjun Sharma",
        submitted_at="2026-10-24T14:42:00",
        submission_file="avl_tree.zip",
        status="submitted"
    )
    sub2 = models.AssignmentSubmission(
        assignment_id="A003",
        student_id="STU001",
        student_name="Arjun Sharma",
        submitted_at="2026-10-14T09:30:00",
        submission_file="scheduling.pdf",
        status="graded",
        obtained_marks=13,
        feedback="Good analysis of algorithms. Gantt charts are clear and accurate. Minor issues with preemptive SJF explanation.",
        graded_by="Prof. Meera Patel",
        graded_at="2026-10-16T11:00:00"
    )
    db.add_all([sub1, sub2])
    db.commit()

    # 10. Quizzes
    q1 = models.Quiz(
        id="Q001",
        course_id="CS302",
        course_name="Database Management Systems",
        course_code="CS302",
        class_id="SE-A",
        title="DBMS Unit 2 Quiz",
        duration_minutes=15,
        opens_at="2026-10-20 09:00",
        closes_at="2026-10-26 23:59",
        status="available",
        topics_json=json.dumps(["Normalization", "SQL Joins", "Indexing", "Transactions"]),
        is_released=True,
        created_by="FAC002"
    )
    q2 = models.Quiz(
        id="Q002",
        course_id="CS301",
        course_name="Data Structures & Algorithms",
        course_code="CS301",
        class_id="SE-A",
        title="DSA Mid-Semester Test",
        duration_minutes=30,
        opens_at="2026-10-30 10:00",
        closes_at="2026-10-30 12:00",
        status="upcoming",
        topics_json=json.dumps(["Arrays", "Linked Lists", "Trees", "Graphs", "Sorting"]),
        is_released=False,
        created_by="FAC001"
    )
    db.add_all([q1, q2])
    db.commit()

    # Quiz Questions for Q001
    q_data = [
        {"text": "Which normal form eliminates partial dependencies?", "options": ["1NF", "2NF", "3NF", "BCNF"], "correct": 1, "topic": "Normalization"},
        {"text": "Which SQL join returns all rows from both tables, with NULLs where there is no match?", "options": ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"], "correct": 3, "topic": "SQL Joins"},
        {"text": "What is the purpose of a B+ tree index?", "options": ["To sort records by primary key", "To enable fast range queries and ordered access", "To compress database tables", "To enforce referential integrity"], "correct": 1, "topic": "Indexing"},
        {"text": "ACID stands for:", "options": ["Atomicity, Consistency, Isolation, Durability", "Access, Consistency, Index, Data", "Atomicity, Concurrency, Isolation, Distribution", "Authorization, Consistency, Integrity, Distribution"], "correct": 0, "topic": "Transactions"},
        {"text": "Which isolation level prevents dirty reads but allows non-repeatable reads?", "options": ["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable"], "correct": 1, "topic": "Transactions"},
        {"text": "What does a foreign key constraint enforce?", "options": ["Uniqueness of values", "Referential integrity between tables", "Not null constraint", "Check constraint"], "correct": 1, "topic": "Referential Integrity"},
        {"text": "Which SQL clause is used to filter grouped results?", "options": ["WHERE", "HAVING", "GROUP BY", "ORDER BY"], "correct": 1, "topic": "SQL Joins"},
        {"text": "A relation is in BCNF if:", "options": ["It is in 1NF and has no partial dependencies", "Every determinant is a candidate key", "It has no transitive dependencies", "It has a single primary key"], "correct": 1, "topic": "Normalization"},
        {"text": "Which index type is most efficient for exact-match lookups on a hash-distributed column?", "options": ["B-tree index", "Hash index", "Bitmap index", "Clustered index"], "correct": 1, "topic": "Indexing"},
        {"text": "What is a phantom read?", "options": ["Reading data modified by another transaction", "A transaction reading rows that were inserted by another transaction", "Reading stale cached data", "Reading a rolled-back transaction"], "correct": 1, "topic": "Transactions"},
    ]
    for qd in q_data:
        qq = models.QuizQuestion(
            quiz_id="Q001",
            question_text=qd["text"],
            options_json=json.dumps(qd["options"]),
            correct_option=qd["correct"],
            marks=1,
            topic=qd["topic"]
        )
        db.add(qq)
    db.commit()

    # Completed attempt & AI Report for Q001
    attempt1 = models.QuizAttempt(
        quiz_id="Q001",
        student_id="STU001",
        started_at=datetime.utcnow(),
        submitted_at=datetime.utcnow(),
        answers_json=json.dumps({"1": 1, "2": 3, "3": 0, "4": 0, "5": 1, "6": 1, "7": 1, "8": 1, "9": 0, "10": 1}),
        score=7.0,
        total_marks=10.0,
        is_auto_submitted=False
    )
    db.add(attempt1)
    db.commit()

    ai_rep = models.AIReport(
        quiz_id="Q001",
        student_id="STU001",
        score=70.0,
        total=100.0,
        correct_count=7,
        incorrect_count=2,
        unattempted_count=1,
        strengths_json=json.dumps(["SQL Joins", "Normalization concepts", "Relational integrity"]),
        improvements_json=json.dumps(["Indexing (B+ tree, Hash)", "Transaction isolation levels", "Query optimization"]),
        suggestions_json=json.dumps([
            "Review B+ tree and Hash index structures with practice problems",
            "Practice transaction isolation level scenarios — Read Committed vs Serializable",
            "Work through 5–8 query optimization examples from the textbook",
            "Attempt previous year questions on indexing"
        ]),
        topic_performance_json=json.dumps([
            {"topic": "Normalization", "score": 92, "questions": 3},
            {"topic": "SQL Joins", "score": 88, "questions": 2},
            {"topic": "Transactions", "score": 65, "questions": 2},
            {"topic": "Indexing", "score": 61, "questions": 2},
            {"topic": "Referential Integrity", "score": 100, "questions": 1}
        ]),
        status="Ready"
    )
    db.add(ai_rep)
    db.commit()

    # 11. Announcements
    announcements = [
        models.Announcement(id="AN001", title="Mid-Semester Examination Schedule Released", publisher_name="Academic Office", publisher_role="Admin", date="2026-10-20", audience="College", content="The mid-semester examination schedule for October 2026 has been released. Please check the academic calendar for your examination dates. All examinations will be held in the Main Examination Hall. Bring your admit cards.", attachment="midsem_schedule_2026.pdf", type="College"),
        models.Announcement(id="AN002", title="Data Structures Assignment Deadline Extended", publisher_name="Prof. Meera Patel", publisher_role="Faculty", date="2026-10-18", audience="SE-A — CS301", content="The deadline for the Binary Tree Implementation assignment has been extended to October 25, 2026. Please ensure you submit by the new deadline. No further extensions will be granted.", attachment=None, type="Course"),
        models.Announcement(id="AN003", title="Annual Technical Fest — TechSpark 2026", publisher_name="Tech Council", publisher_role="Council", date="2026-10-15", audience="College", content="Registration for TechSpark 2026 is now open! This year features hackathon, paper presentation, coding contests, robotics, and much more. Register before October 30 for early bird benefits.", attachment="techspark2026_brochure.pdf", type="Events"),
        models.Announcement(id="AN004", title="DBMS Lab Practical Examination Date", publisher_name="Prof. Rajesh Mehta", publisher_role="Faculty", date="2026-10-12", audience="SE-A — CS302", content="The DBMS lab practical examination will be conducted on October 29, 2026. The examination will cover SQL queries, normalization, and PL/SQL procedures. Bring your lab journal.", attachment=None, type="Course"),
    ]
    db.add_all(announcements)
    db.commit()

    # 12. Events & Calendar
    events = [
        models.CouncilEvent(id="EV001", title="TechSpark 2026 — Annual Technical Fest", council="Tech Council", date="2026-11-05", start_time="09:00", end_time="18:00", venue="Main Auditorium & Sports Ground", description="Annual technical fest featuring hackathon, robotics, paper presentation, and coding contests.", organizer="Priya Desai", registration_link="https://forms.smartclass.edu/techspark2026", visibility="College Wide", created_by="CON001"),
        models.CouncilEvent(id="EV002", title="Chess & Board Games Championship", council="Sports Council", date="2026-10-28", start_time="10:00", end_time="17:00", venue="Student Activity Centre", description="Inter-department chess championship and board game events. Open to all students.", organizer="Karan Shah", registration_link="https://forms.smartclass.edu/chess2026", visibility="College Wide", created_by="CON001"),
        models.CouncilEvent(id="EV003", title="Literary Fest — Wordcraft", council="Literary Council", date="2026-11-15", start_time="10:00", end_time="16:00", venue="Seminar Hall A", description="Debate, creative writing, poetry slam, and book club discussions.", organizer="Aditya Kulkarni", registration_link=None, visibility="College Wide", created_by="CON001"),
    ]
    db.add_all(events)
    db.commit()

    cal_entries = [
        models.CalendarEntry(title="TechSpark 2026 — Technical Fest", category="Events", date="2026-11-05", time="09:00–18:00", description="Annual tech fest", event_id="EV001"),
        models.CalendarEntry(title="Chess Championship", category="Events", date="2026-10-28", time="10:00–17:00", description="Inter-department tournament", event_id="EV002"),
        models.CalendarEntry(title="DBMS Unit 2 Quiz", category="Tests", date="2026-10-26", time="15 mins", description="Online Quiz", event_id=None),
        models.CalendarEntry(title="Diwali Break", category="Holidays", date="2026-11-01", time="All Day", description="Festival holiday", event_id=None),
    ]
    db.add_all(cal_entries)
    db.commit()

    # 13. Study Material
    sm = [
        models.StudyMaterial(id="SM001", course_id="CS302", unit="Unit 1", title="Introduction to DBMS — Lecture Notes", file_type="PDF", file_size="2.4 MB", uploaded_by="Prof. Rajesh Mehta", uploaded_at="2026-09-15", description="Overview of DBMS concepts, data models, and RDBMS architecture."),
        models.StudyMaterial(id="SM002", course_id="CS302", unit="Unit 1", title="ER Diagrams & Data Modeling", file_type="PPT", file_size="3.1 MB", uploaded_by="Prof. Rajesh Mehta", uploaded_at="2026-09-18", description="Entity-relationship diagrams and relational mapping."),
        models.StudyMaterial(id="SM003", course_id="CS302", unit="Unit 2", title="SQL Fundamentals & Advanced Queries", file_type="PDF", file_size="1.8 MB", uploaded_by="Prof. Rajesh Mehta", uploaded_at="2026-09-25", description="DDL, DML, joins, subqueries, aggregation, and views."),
        models.StudyMaterial(id="SM004", course_id="CS302", unit="Unit 2", title="Normalization — 1NF to BCNF", file_type="PDF", file_size="2.2 MB", uploaded_by="Prof. Rajesh Mehta", uploaded_at="2026-10-01", description="Functional dependencies, normal forms, and decomposition."),
        models.StudyMaterial(id="SM005", course_id="CS302", unit="Unit 3", title="Transaction Management & Concurrency", file_type="PDF", file_size="1.9 MB", uploaded_by="Prof. Rajesh Mehta", uploaded_at="2026-10-08", description="ACID properties, serializability, deadlock, and recovery."),
        models.StudyMaterial(id="SM006", course_id="CS301", unit="Unit 1", title="Arrays, Stacks & Queues", file_type="PDF", file_size="1.5 MB", uploaded_by="Prof. Meera Patel", uploaded_at="2026-09-10", description="Linear data structures with implementation and analysis."),
        models.StudyMaterial(id="SM007", course_id="CS301", unit="Unit 2", title="Binary Trees & BST", file_type="PPT", file_size="2.8 MB", uploaded_by="Prof. Meera Patel", uploaded_at="2026-09-22", description="Tree traversals, AVL trees, and red-black trees."),
    ]
    db.add_all(sm)
    db.commit()

    # 14. Grievances
    gr = [
        models.Grievance(id="GR001", student_id="STU001", student_name="Arjun Sharma", subject="Incorrect Attendance Record in CS303", category="Attendance", submitted_at="2026-10-10", status="UNDER REVIEW", last_updated="2026-10-12", description="I was marked absent on August 5th in Operating Systems but I was present. I have signed the attendance sheet. Please verify and correct.", assigned_to="Prof. Rajesh Mehta"),
        models.Grievance(id="GR002", student_id="STU001", student_name="Arjun Sharma", subject="Lab Facility Issue — Computer Lab 2", category="Infrastructure", submitted_at="2026-09-28", status="RESOLVED", last_updated="2026-10-05", description="Several computers in Lab 2 are not working. This is affecting our lab practicals.", resolution="Lab computers have been serviced. 8 faulty systems have been repaired. Thank you for reporting.", assigned_to="Sunita Nair"),
    ]
    db.add_all(gr)
    db.commit()

    # 15. Forums
    forums = [
        models.ForumTopic(id="F001", course_id="CS302", course_code="CS302", title="Can someone explain BCNF with an example?", author_id="STU001", author_name="Arjun Sharma", created_at="2026-10-11 14:22", pinned=False, replies_count=2, last_reply="2 hours ago", content="I understand 3NF but I am confused about BCNF. Can someone explain when a relation is in 3NF but not BCNF with a concrete example?"),
        models.ForumTopic(id="F002", course_id="CS302", course_code="CS302", title="Important topics for Unit 3 exam", author_id="STU004", author_name="Sneha Iyer", created_at="2026-10-10 09:15", pinned=True, replies_count=1, last_reply="5 hours ago", content="What are the most important topics from Unit 3 (Transaction Management) for the mid-semester exam?"),
        models.ForumTopic(id="F003", course_id="CS302", course_code="CS302", title="Doubt regarding Assignment 1 — Normalization steps", author_id="STU003", author_name="Rohan Gupta", created_at="2026-10-09 16:45", pinned=False, replies_count=0, last_reply="1 day ago", content="In the normalization assignment, should we normalize to BCNF or stop at 3NF?"),
        models.ForumTopic(id="F004", course_id="CS301", course_code="CS301", title="AVL Tree rotation — right vs left-right", author_id="STU002", author_name="Priya Malhotra", created_at="2026-10-08 11:30", pinned=False, replies_count=1, last_reply="3 hours ago", content="I am confused about when to apply right rotation vs left-right rotation in AVL trees. Can someone help?"),
    ]
    db.add_all(forums)
    db.commit()

    # Forum replies
    replies = [
        models.ForumReply(topic_id="F001", author_id="FAC002", author_name="Prof. Rajesh Mehta", author_role="Faculty", content="In 3NF, the RHS can be a prime attribute even if LHS is not a candidate key. In BCNF, for every functional dependency X -> Y, X MUST be a candidate key.", created_at="2026-10-11 15:00"),
        models.ForumReply(topic_id="F001", author_id="STU003", author_name="Rohan Gupta", author_role="Student", content="Check Slide 14 of Prof. Mehta's Unit 2 notes for the Student-Advisor-Subject example!", created_at="2026-10-11 16:30"),
        models.ForumReply(topic_id="F002", author_id="FAC002", author_name="Prof. Rajesh Mehta", author_role="Faculty", content="Pay special attention to Conflict Serializability, Two-Phase Locking (2PL), and ACID anomalies.", created_at="2026-10-10 10:15"),
        models.ForumReply(topic_id="F004", author_id="FAC001", author_name="Prof. Meera Patel", author_role="Faculty", content="Right rotation is applied on LL imbalance (left-heavy left child). Left-Right rotation is for LR imbalance (left child has a right child).", created_at="2026-10-08 12:00"),
    ]
    db.add_all(replies)
    db.commit()

    # 16. Notifications
    notifs = [
        models.Notification(id="N001", user_id="STU001", message="Assignment 'Normalization Assignment' due in 6 days", type="warning", read=False, time_ago="1 hour ago", icon="assignment"),
        models.Notification(id="N002", user_id="STU001", message="Quiz results for DBMS Unit 2 Quiz have been released", type="info", read=False, time_ago="3 hours ago", icon="quiz"),
        models.Notification(id="N003", user_id="STU001", message="Your attendance in Operating Systems is below 75%", type="danger", read=False, time_ago="1 day ago", icon="attendance"),
        models.Notification(id="N004", user_id="STU001", message="Timetable updated: Wednesday Computer Networks lecture is now a Substitute lecture", type="info", read=True, time_ago="2 days ago", icon="timetable"),
        models.Notification(id="N005", user_id="STU001", message="New announcement: TechSpark 2026 registration open", type="default", read=True, time_ago="3 days ago", icon="announcement"),
        models.Notification(id="N006", user_id="STU001", message="Prof. Patel uploaded new study material for Data Structures", type="default", read=True, time_ago="4 days ago", icon="material"),
    ]
    db.add_all(notifs)
    db.commit()

    print("SmartClass database seeded successfully with complete records!")
    db.close()

if __name__ == "__main__":
    reset = "--no-reset" not in sys.argv
    seed_database(reset=reset)
