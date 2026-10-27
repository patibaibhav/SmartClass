import os
from datetime import datetime
import json

os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("SECRET_KEY", "test-only-secret-key-with-at-least-32-characters")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import models
from auth import generate_salt, hash_password
from database import Base, get_db
from main import app


test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def add_user(
    db,
    user_id: str,
    role: str,
    *,
    class_id: str | None = None,
    is_hod: bool = False,
    first_login: bool = False,
    password: str = "SecurePass!123",
):
    salt = generate_salt()
    db.add(
        models.User(
            id=user_id,
            name=user_id,
            email=f"{user_id.casefold()}@example.test",
            password_hash=hash_password(password, salt),
            salt=salt,
            role=role,
            is_hod=is_hod,
            department="Computer Engineering",
            class_id=class_id,
            first_login=first_login,
            token_version=0,
        )
    )


@pytest.fixture(autouse=True)
def seeded_database():
    Base.metadata.create_all(test_engine)
    db = TestingSession()
    for class_id in ("D12A", "D12B"):
        db.add(
            models.ClassModel(
                id=class_id,
                name=f"Computer Engineering - {class_id}",
                department="Computer Engineering",
            )
        )
    db.add(
        models.CourseModel(
            id="TCS",
            code="TCS",
            name="Theory of Computer Science",
            department="Computer Engineering",
        )
    )
    add_user(db, "STU-D12A-001", "student", class_id="D12A")
    add_user(db, "STU-D12A-002", "student", class_id="D12A")
    add_user(db, "STU-D12B-001", "student", class_id="D12B")
    add_user(db, "FAC-SM", "faculty")
    add_user(db, "FAC-OTHER", "faculty")
    add_user(db, "FAC-NG", "faculty", is_hod=True)
    add_user(db, "ADM-001", "admin")
    add_user(db, "CON-001", "council")
    add_user(db, "STU-TEMP", "student", class_id="D12A", first_login=True, password="Temporary!123")
    db.flush()
    for student_id, roll, class_id in (
        ("STU-D12A-001", "1", "D12A"),
        ("STU-D12A-002", "2", "D12A"),
        ("STU-D12B-001", "1", "D12B"),
        ("STU-TEMP", "99", "D12A"),
    ):
        db.add(models.StudentRecord(id=student_id, name=student_id, roll_no=roll, class_id=class_id))
    db.add(models.ClassCourse(class_id="D12A", course_id="TCS", faculty_id="FAC-SM"))
    db.add(models.ClassCourse(class_id="D12B", course_id="TCS", faculty_id="FAC-OTHER"))
    db.add(models.Classroom(id="314", name="314", building="Main", capacity=80))
    db.add(
        models.TimetableEntry(
            day_of_week="Monday",
            time="08:30–09:30",
            start_time="08:30",
            end_time="09:30",
            class_id="D12A",
            course_id="TCS",
            course_name="Theory of Computer Science",
            course_code="TCS",
            faculty_id="FAC-SM",
            faculty_name="FAC-SM",
            classroom="314",
        )
    )
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(test_engine)


def login(user_id: str, password: str = "SecurePass!123") -> str:
    response = client.post(
        "/api/auth/login",
        json={"user_id": user_id, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()["token"]


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_root_and_protected_endpoint():
    assert client.get("/").status_code == 200
    assert client.get("/api/classrooms").status_code == 401


def test_login_uses_generic_error_and_returns_scoped_token():
    response = client.post(
        "/api/auth/login",
        json={"user_id": "STU-D12A-001", "password": "SecurePass!123"},
    )
    assert response.status_code == 200
    assert response.json()["user"]["class"] == "D12A"

    wrong_password = client.post(
        "/api/auth/login",
        json={"user_id": "STU-D12A-001", "password": "wrong"},
    )
    unknown_user = client.post(
        "/api/auth/login",
        json={"user_id": "UNKNOWN", "password": "wrong"},
    )
    assert wrong_password.status_code == unknown_user.status_code == 401
    assert wrong_password.json()["detail"] == unknown_user.json()["detail"]


def test_first_login_requires_limited_token_and_strong_password():
    login_response = client.post(
        "/api/auth/login",
        json={"user_id": "STU-TEMP", "password": "Temporary!123"},
    )
    assert login_response.status_code == 200
    assert login_response.json()["phase"] == "first-login"
    setup_token = login_response.json()["token"]
    assert client.get("/api/classrooms", headers=auth(setup_token)).status_code == 401
    assert client.post(
        "/api/auth/first-login",
        json={"new_password": "weak", "confirm_password": "weak"},
        headers=auth(setup_token),
    ).status_code == 400

    changed = client.post(
        "/api/auth/first-login",
        json={"new_password": "NewSecurePass!456", "confirm_password": "NewSecurePass!456"},
        headers=auth(setup_token),
    )
    assert changed.status_code == 200
    assert client.get("/api/classrooms", headers=auth(changed.json()["token"])).status_code == 200


def test_logout_revokes_token():
    token = login("STU-D12A-001")
    assert client.post("/api/auth/logout", headers=auth(token)).status_code == 200
    assert client.get("/api/auth/me", headers=auth(token)).status_code == 401


def test_student_cannot_view_another_class_timetable():
    token = login("STU-D12A-001")
    own = client.get("/api/classes/D12A/timetable", headers=auth(token))
    other = client.get("/api/classes/D12B/timetable", headers=auth(token))
    assert own.status_code == 200
    assert other.status_code == 403


def test_same_class_students_receive_same_timetable():
    first = client.get("/api/timetable", headers=auth(login("STU-D12A-001")))
    second = client.get("/api/timetable", headers=auth(login("STU-D12A-002")))
    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()
    assert len(first.json()["Monday"]) == 1


def test_conflict_check_is_role_protected_and_detects_overlap():
    query = "day=Monday&start_time=09:00&end_time=10:00&classroom=314&faculty_id=FAC-SM&class_id=D12A"
    student_response = client.post(
        f"/api/timetable/check-conflict?{query}",
        headers=auth(login("STU-D12A-001")),
    )
    admin_response = client.post(
        f"/api/timetable/check-conflict?{query}",
        headers=auth(login("ADM-001")),
    )
    assert student_response.status_code == 403
    assert admin_response.status_code == 200
    assert admin_response.json()["hasConflict"] is True


def test_student_grievances_are_isolated():
    first_token = login("STU-D12A-001")
    second_token = login("STU-D12A-002")
    created = client.post(
        "/api/grievances",
        json={"subject": "Test", "category": "Academic", "description": "Private"},
        headers=auth(first_token),
    )
    assert created.status_code == 200
    assert len(client.get("/api/grievances", headers=auth(first_token)).json()) == 1
    assert client.get("/api/grievances", headers=auth(second_token)).json() == []


def test_attendance_is_calculated_from_conducted_lectures():
    db = TestingSession()
    lecture = models.Lecture(
        class_id="D12A",
        course_id="TCS",
        scheduled_faculty_id="FAC-SM",
        actual_faculty_id="FAC-SM",
        date="2026-10-20",
        start_time="08:30",
        end_time="09:30",
        lecture_type="Regular",
        classroom="314",
        status="Conducted",
    )
    db.add(lecture)
    db.flush()
    db.add(
        models.Attendance(
            lecture_id=lecture.id,
            student_id="STU-D12A-001",
            status="Present",
            marked_by="FAC-SM",
        )
    )
    db.commit()
    db.close()

    response = client.get(
        "/api/attendance/student",
        headers=auth(login("STU-D12A-001")),
    )
    assert response.status_code == 200
    assert response.json()["overallPercentage"] == 100.0
    assert response.json()["courses"][0]["total"] == 1


def test_rule_based_topic_insights_use_multiple_recorded_attempts():
    db = TestingSession()
    for quiz_index, correct_answers in ((1, 2), (2, 3)):
        quiz_id = f"QUIZ-{quiz_index}"
        db.add(
            models.Quiz(
                id=quiz_id,
                course_id="TCS",
                course_name="Theory of Computer Science",
                course_code="TCS",
                class_id="D12A",
                title=quiz_id,
                duration_minutes=15,
                opens_at="2026-10-01 09:00",
                closes_at="2026-10-01 10:00",
                is_released=True,
                created_by="FAC-SM",
            )
        )
        db.flush()
        questions = []
        for question_index in range(3):
            question = models.QuizQuestion(
                quiz_id=quiz_id,
                question_text=f"Question {question_index}",
                options_json='["A", "B"]',
                correct_option=0,
                marks=1,
                topic="Automata",
            )
            db.add(question)
            questions.append(question)
        db.flush()
        answers = {
            str(question.id): 0 if index < correct_answers else 1
            for index, question in enumerate(questions)
        }
        db.add(
            models.QuizAttempt(
                quiz_id=quiz_id,
                student_id="STU-D12A-001",
                started_at=datetime(2026, 10, quiz_index, 9, 0),
                submitted_at=datetime(2026, 10, quiz_index, 9, 10),
                answers_json=json.dumps(answers),
                score=correct_answers,
                total_marks=3,
            )
        )
    db.commit()
    db.close()

    response = client.get(
        "/api/performance-insights?course_id=TCS",
        headers=auth(login("STU-D12A-001")),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Topic-wise Performance Insights (rule-based)"
    assert data["attemptCount"] == 2
    assert data["topics"][0]["accuracy"] == 83.3
    assert data["topics"][0]["classification"] == "strong"
    assert data["trend"]["direction"] == "improving"


def test_forum_replies_require_course_membership():
    db = TestingSession()
    db.add(models.CourseModel(id="SSD", code="SSD", name="Software System Design", department="Computer Engineering"))
    db.add(models.ClassCourse(class_id="D12A", course_id="SSD", faculty_id="FAC-SM"))
    db.add(models.ForumTopic(
        id="TOPIC-SSD", course_id="SSD", course_code="SSD", title="Scoped",
        content="Only members", author_id="FAC-SM", author_name="FAC-SM",
        created_at="2026-10-27 10:00", replies_count=0, last_reply="Never",
    ))
    db.commit()
    db.close()

    allowed = client.get("/api/forums/TOPIC-SSD/replies", headers=auth(login("STU-D12A-001")))
    denied = client.get("/api/forums/TOPIC-SSD/replies", headers=auth(login("STU-D12B-001")))
    assert allowed.status_code == 200
    assert denied.status_code == 403


def test_quiz_questions_are_hidden_outside_availability_window():
    db = TestingSession()
    db.add(models.Quiz(
        id="FUTURE", course_id="TCS", course_name="Theory of Computer Science",
        course_code="TCS", class_id="D12A", title="Future quiz", duration_minutes=10,
        opens_at="2099-01-01 09:00", closes_at="2099-01-01 10:00",
        is_released=True, created_by="FAC-SM",
    ))
    db.commit()
    db.close()
    response = client.get("/api/quizzes/FUTURE/questions", headers=auth(login("STU-D12A-001")))
    assert response.status_code == 409


def test_faculty_my_classes_are_assignment_scoped():
    response = client.get("/api/academic/my-class", headers=auth(login("FAC-SM")))
    assert response.status_code == 200
    assert [item["classId"] for item in response.json()["classes"]] == ["D12A"]
