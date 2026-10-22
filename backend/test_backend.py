import pytest
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["app"] == "SmartClass API"

def test_valid_login():
    response = client.post("/api/auth/login", json={
        "user_id": "STU001",
        "password": "demo1234"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["phase"] == "login"
    assert "token" in data
    assert data["user"]["id"] == "STU001"
    assert data["user"]["role"] == "student"

def test_invalid_login_generic_error():
    # FR-AUTH-005: Generic error message that doesn't reveal whether ID or password was wrong
    response = client.post("/api/auth/login", json={
        "user_id": "STU001",
        "password": "IncorrectPassword"
    })
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid User ID or password. Please try again."

def test_classroom_availability():
    # FR-ROOM-001 to 005
    response = client.post("/api/classrooms/search-availability", json={
        "date": "2026-10-21",
        "start_time": "10:00",
        "end_time": "11:00"
    })
    assert response.status_code == 200
    data = response.json()
    assert "classrooms" in data
    assert data["total"] >= 8
    assert data["available"] > 0

def test_timetable_conflict_detection():
    # FR-TT-009, 010, 011
    response = client.post(
        "/api/timetable/check-conflict?day=Monday&start_time=09:30&end_time=10:30&classroom=A-204&faculty_id=FAC001&class_id=SE-A"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["hasConflict"] is True
    assert len(data["conflicts"]) >= 1

def test_event_auto_generates_calendar_and_announcement():
    # FR-EVENT-005, FR-EVENT-006, BR-022, BR-023
    test_title = "Automated Test Coding Contest"
    response = client.post("/api/events", json={
        "title": test_title,
        "council": "Code Council",
        "date": "2026-11-28",
        "start_time": "14:00",
        "end_time": "17:00",
        "venue": "Lab-2",
        "description": "Coding contest for all branches.",
        "organizer": "Priya Desai",
        "visibility": "College Wide"
    })
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
    # FR-GRV-001, 002, 004
    sub_resp = client.post("/api/grievances", json={
        "subject": "Audio system feedback in Auditorium",
        "category": "Infrastructure",
        "description": "Mic 2 produces continuous feedback noise."
    })
    assert sub_resp.status_code == 200
    gid = sub_resp.json()["grievanceId"]

    # Update status to UNDER REVIEW
    upd_resp = client.patch(f"/api/grievances/{gid}", json={
        "status": "UNDER REVIEW",
        "resolution": "AV crew notified."
    })
    assert upd_resp.status_code == 200
