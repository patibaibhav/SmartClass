import pytest
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models
from auth import create_access_token

client = TestClient(app)

def get_token(user_id: str, role: str, is_hod: bool = False) -> str:
    return create_access_token({"sub": user_id, "role": role, "isHOD": is_hod})

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["app"] == "SmartClass API"

def test_valid_login():
    response = client.post("/api/auth/login", json={
        "user_id": "ADM001",
        "password": "demo1234"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["phase"] == "login"
    assert "token" in data
    assert data["user"]["id"] == "ADM001"
    assert data["user"]["role"] == "admin"

def test_invalid_login_generic_error():
    # FR-AUTH-005: Generic error message that doesn't reveal whether ID or password was wrong
    response = client.post("/api/auth/login", json={
        "user_id": "ADM001",
        "password": "IncorrectPassword"
    })
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid User ID or password. Please try again."

def test_classroom_availability_monday_930():
    # Acceptance criteria: Monday 09:30–10:30 marks 315, 314, B31, B32 as occupied and others free
    # 2026-10-26 is a Monday
    response = client.post("/api/classrooms/search-availability", json={
        "date": "2026-10-26",
        "start_time": "09:30",
        "end_time": "10:30"
    })
    assert response.status_code == 200
    data = response.json()
    assert "classrooms" in data
    assert data["total"] == 17
    
    occupied = {r["name"] for r in data["classrooms"] if r["status"] == "Occupied"}
    expected_occupied = {"315", "314", "B31", "B32"}
    assert expected_occupied.issubset(occupied)
    assert len(occupied) == 4
    assert data["occupied"] == 4
    assert data["available"] == 13

def test_timetable_conflict_detection():
    # FR-TT-009, 010, 011
    # On Monday 09:30–10:30, room 315 is occupied by SD (PRL)
    response = client.post(
        "/api/timetable/check-conflict?day=Monday&start_time=09:30&end_time=10:30&classroom=315"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["hasConflict"] is True
    assert len(data["conflicts"]) >= 1

    # Joint group: passing matching group_id should NOT conflict
    # Monday 09:30 SD (PRL) in 315 has group_id "ELECTIVE_MON_0930"
    response_joint = client.post(
        "/api/timetable/check-conflict?day=Monday&start_time=09:30&end_time=10:30&classroom=315&group_id=ELECTIVE_MON_0930"
    )
    assert response_joint.status_code == 200
    assert response_joint.json()["hasConflict"] is False

def test_student_timetable_role_scoping():
    # Student D12B-01 querying own class timetable
    token_d12b = get_token("D12B-01", "student")
    
    # 1. Unauthenticated -> 401
    unauth_resp = client.get("/api/timetable")
    assert unauth_resp.status_code == 401

    # 2. Student gets own class
    resp_own = client.get(
        "/api/timetable",
        headers={"Authorization": f"Bearer {token_d12b}"}
    )
    assert resp_own.status_code == 200
    data_own = resp_own.json()
    # Check that all returned entries belong to D12B
    for day, entries in data_own.items():
        for e in entries:
            assert e["class"] == "D12B"

    # 3. Student querying another class -> 403 Forbidden
    resp_other = client.get(
        "/api/timetable?class_id=D12A",
        headers={"Authorization": f"Bearer {token_d12b}"}
    )
    assert resp_other.status_code == 403

def test_privacy_mobile_masking_in_my_class():
    # Student viewing roster only sees own mobile, others masked
    token_student = get_token("D12B-01", "student")
    resp_stu = client.get(
        "/api/academic/my-class",
        headers={"Authorization": f"Bearer {token_student}"}
    )
    assert resp_stu.status_code == 200
    data_stu = resp_stu.json()
    assert data_stu["classId"] == "D12B"
    for s in data_stu["students"]:
        if s["id"] == "D12B-01":
            # Own mobile should be present or null if not provided
            pass
        else:
            assert s["mobile"] is None, f"Privacy violation: other student's mobile visible: {s['id']}"

    # Admin viewing roster sees all mobile numbers
    token_admin = get_token("ADM001", "admin")
    resp_adm = client.get(
        "/api/academic/my-class?class_id=D12B",
        headers={"Authorization": f"Bearer {token_admin}"}
    )
    assert resp_adm.status_code == 200
    data_adm = resp_adm.json()
    # At least some students in D12B have mobile numbers
    has_mobile_count = sum(1 for s in data_adm["students"] if s["mobile"] is not None)
    assert has_mobile_count > 0

def test_event_auto_generates_calendar_and_announcement():
    token_council = get_token("CON001", "council")
    test_title = "Automated Test Coding Contest"
    response = client.post(
        "/api/events",
        json={
            "title": test_title,
            "council": "Code Council",
            "date": "2026-11-28",
            "start_time": "14:00",
            "end_time": "17:00",
            "venue": "315",
            "description": "Coding contest for all branches.",
            "organizer": "Student Council",
            "visibility": "College Wide"
        },
        headers={"Authorization": f"Bearer {token_council}"}
    )
    assert response.status_code == 200
    
    # Check announcement auto-created
    ann_resp = client.get("/api/announcements")
    assert ann_resp.status_code == 200
    ann_titles = [a["title"] for a in ann_resp.json()]
    assert test_title in ann_titles

    # Check calendar auto-created
    cal_resp = client.get("/api/calendar?category=Events")
    assert cal_resp.status_code == 200
    cal_titles = [c["title"] for c in cal_resp.json()]
    assert test_title in cal_titles

def test_grievance_lifecycle():
    token_student = get_token("D12B-01", "student")
    token_admin = get_token("ADM001", "admin")

    sub_resp = client.post(
        "/api/grievances",
        json={
            "subject": "Audio system feedback in Auditorium",
            "category": "Infrastructure",
            "description": "Mic 2 produces continuous feedback noise."
        },
        headers={"Authorization": f"Bearer {token_student}"}
    )
    assert sub_resp.status_code == 200
    gid = sub_resp.json()["grievanceId"]

    # Update status to UNDER REVIEW
    upd_resp = client.patch(
        f"/api/grievances/{gid}",
        json={
            "status": "UNDER REVIEW",
            "resolution": "AV crew notified."
        },
        headers={"Authorization": f"Bearer {token_admin}"}
    )
    assert upd_resp.status_code == 200

