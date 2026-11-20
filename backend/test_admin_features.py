"""Tests for Admin lifecycle, Council event edit/delete and faculty quiz authoring."""
from test_backend import (  # noqa: F401  (fixtures + helpers)
    auth, client, login, seeded_database, TestingSession,
)
import models


def admin_headers():
    return auth(login("ADM-001"))


def test_admin_routes_forbidden_for_other_roles():
    for user in ("STU-D12A-001", "FAC-NG", "CON-001"):
        assert client.get("/api/admin/users", headers=auth(login(user))).status_code == 403
    assert client.get("/api/admin/users").status_code == 401


def test_admin_creates_student_who_must_change_password():
    response = client.post("/api/admin/users", headers=admin_headers(), json={
        "role": "student", "name": "Test Student New", "class_id": "D12A", "roll_no": "50"})
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["user"]["id"] == "STU-D12A-050"
    assert "password_hash" not in body["user"]
    login_response = client.post("/api/auth/login", json={
        "user_id": "STU-D12A-050", "password": body["temporaryPassword"]})
    assert login_response.status_code == 200
    assert login_response.json()["phase"] == "first-login"
    # Duplicate roll rejected
    duplicate = client.post("/api/admin/users", headers=admin_headers(), json={
        "role": "student", "name": "Dup Student", "class_id": "D12A", "roll_no": "50"})
    assert duplicate.status_code == 409


def test_admin_deactivation_blocks_login_and_invalidates_session():
    token = login("STU-D12A-002")
    assert client.get("/api/auth/me", headers=auth(token)).status_code == 200
    changed = client.patch("/api/admin/users/STU-D12A-002", headers=admin_headers(), json={"is_active": False})
    assert changed.status_code == 200 and changed.json()["isActive"] is False
    assert client.get("/api/auth/me", headers=auth(token)).status_code == 401
    assert client.post("/api/auth/login", json={
        "user_id": "STU-D12A-002", "password": "SecurePass!123"}).status_code == 401
    client.patch("/api/admin/users/STU-D12A-002", headers=admin_headers(), json={"is_active": True})
    assert client.post("/api/auth/login", json={
        "user_id": "STU-D12A-002", "password": "SecurePass!123"}).status_code == 200


def test_admin_cannot_deactivate_self_and_reassigns_student_class():
    assert client.patch("/api/admin/users/ADM-001", headers=admin_headers(),
                        json={"is_active": False}).status_code == 400
    moved = client.patch("/api/admin/users/STU-D12A-001", headers=admin_headers(), json={"class_id": "D12B"})
    # Roll 1 already exists in D12B, so the move must be refused rather than corrupt rosters.
    assert moved.status_code == 409
    moved = client.patch("/api/admin/users/STU-D12A-002", headers=admin_headers(), json={"class_id": "D12B"})
    assert moved.status_code == 200 and moved.json()["classId"] == "D12B"


def test_admin_reset_password_forces_first_login():
    reset = client.post("/api/admin/users/STU-D12A-001/reset-password", headers=admin_headers())
    assert reset.status_code == 200
    again = client.post("/api/auth/login", json={
        "user_id": "STU-D12A-001", "password": reset.json()["temporaryPassword"]})
    assert again.json()["phase"] == "first-login"


def test_admin_class_course_and_faculty_assignment():
    headers = admin_headers()
    assert client.put("/api/admin/classes", headers=headers, json={
        "id": "D12D", "name": "Computer Engineering - D12D"}).status_code == 200
    assert client.put("/api/admin/courses", headers=headers, json={
        "id": "NEW1", "name": "New Course"}).status_code == 200
    created = client.post("/api/admin/assignments", headers=headers, json={
        "class_id": "D12D", "course_id": "NEW1", "faculty_id": "FAC-SM"})
    assert created.status_code == 201
    assert client.post("/api/admin/assignments", headers=headers, json={
        "class_id": "D12D", "course_id": "NEW1", "faculty_id": "FAC-SM"}).status_code == 409
    assert client.post("/api/admin/assignments", headers=headers, json={
        "class_id": "D12D", "course_id": "NEW1", "faculty_id": "STU-D12A-001"}).status_code == 404
    # Faculty now sees the new class
    classes = client.get("/api/academic/classes", headers=auth(login("FAC-SM"))).json()
    assert "D12D" in {c["id"] for c in classes}
    assert client.delete(f"/api/admin/assignments/{created.json()['id']}", headers=headers).status_code == 200


EVENT = {
    "title": "Hackathon", "council": "Coding Club", "date": "2026-12-01", "start_time": "10:00",
    "end_time": "12:00", "venue": "Hall", "description": "Build things", "organizer": "CC",
    "visibility": "College Wide",
}


def test_council_event_edit_and_delete_sync_calendar_and_announcement():
    head = auth(login("CON-001"))
    created = client.post("/api/events", headers=head, json=EVENT)
    assert created.status_code == 200
    event_id = created.json()["eventId"]
    updated = client.put(f"/api/events/{event_id}", headers=head, json={**EVENT, "title": "Hackathon 2", "venue": "Lab"})
    assert updated.status_code == 200
    student = auth(login("STU-D12A-001"))
    assert "Hackathon 2" in {a["title"] for a in client.get("/api/announcements", headers=student).json()}
    assert "Hackathon 2" in {c["title"] for c in client.get("/api/calendar", headers=student).json()}
    assert client.delete(f"/api/events/{event_id}", headers=head).status_code == 200
    assert "Hackathon 2" not in {a["title"] for a in client.get("/api/announcements", headers=student).json()}
    assert "Hackathon 2" not in {c["title"] for c in client.get("/api/calendar", headers=student).json()}
    assert client.delete(f"/api/events/{event_id}", headers=head).status_code == 404


def test_only_creator_council_head_can_modify_event():
    db = TestingSession()
    from test_backend import add_user
    add_user(db, "CON-002", "council")
    db.commit(); db.close()
    event_id = client.post("/api/events", headers=auth(login("CON-001")), json=EVENT).json()["eventId"]
    other = auth(login("CON-002"))
    assert client.put(f"/api/events/{event_id}", headers=other, json=EVENT).status_code == 403
    assert client.delete(f"/api/events/{event_id}", headers=other).status_code == 403
    assert client.delete(f"/api/events/{event_id}", headers=auth(login("STU-D12A-001"))).status_code == 403


QUIZ = {
    "course_id": "TCS", "class_ids": ["D12A"], "title": "Unit 1 Quiz", "duration_minutes": 10,
    "opens_at": "2020-01-01T00:00", "closes_at": "2099-01-01T00:00", "max_attempts": 1,
    "questions": [
        {"question_text": "Which automaton accepts regular languages?", "options": ["DFA", "PDA", "TM", "LBA"],
         "correct_option": 0, "marks": 2, "topic": "Automata"},
        {"question_text": "Halting problem is?", "options": ["Decidable", "Undecidable", "Regular", "Finite"],
         "correct_option": 1, "marks": 1, "topic": "Computability"},
    ],
}


def test_faculty_authors_quiz_student_attempts_faculty_sees_result():
    faculty = auth(login("FAC-SM"))
    created = client.post("/api/quizzes", headers=faculty, json=QUIZ)
    assert created.status_code == 201, created.text
    quiz_id = created.json()["id"]
    student = auth(login("STU-D12A-001"))
    listed = [q for q in client.get("/api/quizzes", headers=student).json() if q["id"] == quiz_id]
    assert listed and listed[0]["canAttempt"] is True and listed[0]["questions"] == 2
    questions = client.get(f"/api/quizzes/{quiz_id}/questions", headers=student).json()
    assert all("correct" not in str(q).lower() or "correct_option" not in q for q in questions)
    answers = {str(q["id"]): 0 for q in questions}
    submit = client.post(f"/api/quizzes/{quiz_id}/submit", headers=student, json={"answers": answers})
    assert submit.status_code == 200
    attempts = client.get(f"/api/quizzes/{quiz_id}/attempts", headers=faculty).json()
    assert len(attempts) == 1 and attempts[0]["total"] == 3
    # Other division student cannot see it; second attempt is blocked.
    other = auth(login("STU-D12B-001"))
    assert quiz_id not in {q["id"] for q in client.get("/api/quizzes", headers=other).json()}
    assert client.post(f"/api/quizzes/{quiz_id}/submit", headers=student, json={"answers": answers}).status_code == 409


def test_quiz_authoring_authorization_and_validation():
    assert client.post("/api/quizzes", headers=auth(login("FAC-OTHER")), json=QUIZ).status_code == 403
    assert client.post("/api/quizzes", headers=auth(login("STU-D12A-001")), json=QUIZ).status_code == 403
    faculty = auth(login("FAC-SM"))
    bad = {**QUIZ, "questions": [{**QUIZ["questions"][0], "correct_option": 9}]}
    assert client.post("/api/quizzes", headers=faculty, json=bad).status_code == 422
    backwards = {**QUIZ, "opens_at": "2030-01-01T00:00", "closes_at": "2029-01-01T00:00"}
    assert client.post("/api/quizzes", headers=faculty, json=backwards).status_code == 422


def test_draft_quiz_hidden_from_students_until_released():
    faculty = auth(login("FAC-SM"))
    quiz_id = client.post("/api/quizzes", headers=faculty, json={**QUIZ, "is_released": False}).json()["id"]
    student = auth(login("STU-D12A-001"))
    assert quiz_id not in {q["id"] for q in client.get("/api/quizzes", headers=student).json()}
    assert quiz_id in {q["id"] for q in client.get("/api/quizzes", headers=faculty).json()}
    assert client.post(f"/api/quizzes/{quiz_id}/release", headers=faculty, json={"is_released": True}).status_code == 200
    assert quiz_id in {q["id"] for q in client.get("/api/quizzes", headers=student).json()}


def test_admin_can_read_department_analytics_but_not_students():
    admin = admin_headers()
    stats = client.get("/api/dashboard/stats?role=analytics", headers=admin)
    assert stats.status_code == 200 and "classwiseAttendance" in stats.json()
    assert client.get("/api/dashboard/stats?role=analytics", headers=auth(login("STU-D12A-001"))).status_code == 403
    assert client.get("/api/dashboard/stats?role=admin", headers=admin).json()["totalClasses"] == 2


def test_council_head_is_bound_to_own_council():
    db = TestingSession()
    from test_backend import add_user
    add_user(db, "COU-CSI", "council"); add_user(db, "COU-IEEE", "council"); db.flush()
    for uid, council in (("COU-CSI", "CSI"), ("COU-IEEE", "IEEE")):
        db.get(models.User, uid).council = council
    db.commit(); db.close()
    csi, ieee = auth(login("COU-CSI")), auth(login("COU-IEEE"))
    assert client.get("/api/auth/me", headers=csi).json()["council"] == "CSI"
    # Request claims another council; the server overrides it.
    ev = client.post("/api/events", headers=csi, json={**EVENT, "council": "IEEE", "visibility": "Council Only"}).json()["eventId"]
    assert ev in {e["id"] for e in client.get("/api/events", headers=csi).json()}
    assert ev not in {e["id"] for e in client.get("/api/events", headers=ieee).json()}
    assert client.get("/api/events", headers=csi).json()[0]["council"] == "CSI"
    assert client.get("/api/events", headers=auth(login("STU-D12A-001"))).json() == []


LECTURE = {"class_id": "D12A", "course_id": "TCS", "date": "2026-12-02", "start_time": "10:00",
           "end_time": "11:00", "classroom": "314", "lecture_type": "Extra"}


def test_substitute_lecture_flow_and_cancel():
    fac = auth(login("FAC-SM"))
    other = auth(login("FAC-OTHER"))
    # Extra lecture must be taught by the creator
    assert client.post("/api/lectures/create", headers=fac, json={
        **LECTURE, "actual_faculty_id": "FAC-OTHER"}).status_code == 403
    # Substitute: assigned faculty hands it to a colleague
    sub = client.post("/api/lectures/create", headers=fac, json={
        **LECTURE, "lecture_type": "Substitute", "actual_faculty_id": "FAC-OTHER", "classroom": "315"})
    assert sub.status_code == 200, sub.text
    lecture_id = sub.json()["lectureId"]
    # The substitute can open the roster and mark attendance
    roster = client.get(f"/api/lectures/{lecture_id}/roster", headers=other)
    assert roster.status_code == 200
    students = [{"student_id": s["id"], "status": "Present"} for s in roster.json()["students"]]
    assert client.post("/api/attendance/mark", headers=other, json={"lecture_id": lecture_id, "attendance": students}).status_code == 200
    # Conducted lectures cannot be cancelled
    assert client.post(f"/api/lectures/{lecture_id}/cancel", headers=fac, json={}).status_code == 409
    # A scheduled one can; marking a cancelled lecture is refused; students cannot cancel
    extra = client.post("/api/lectures/create", headers=fac, json={
        **LECTURE, "actual_faculty_id": "FAC-SM", "start_time": "12:00", "end_time": "13:00", "classroom": "316"}).json()["lectureId"]
    assert client.post(f"/api/lectures/{extra}/cancel", headers=auth(login("STU-D12A-001")), json={}).status_code == 403
    assert client.post(f"/api/lectures/{extra}/cancel", headers=other, json={}).status_code == 403
    assert client.post(f"/api/lectures/{extra}/cancel", headers=fac, json={"reason": "Holiday"}).status_code == 200
    assert client.post("/api/attendance/mark", headers=fac, json={"lecture_id": extra, "attendance": students}).status_code == 409
    assert client.post(f"/api/lectures/{extra}/cancel", headers=fac, json={}).status_code == 409


def test_faculty_list_is_not_available_to_students():
    assert client.get("/api/faculty", headers=auth(login("STU-D12A-001"))).status_code == 403
    assert {f["id"] for f in client.get("/api/faculty", headers=auth(login("FAC-SM"))).json()} >= {"FAC-SM", "FAC-OTHER"}


def test_forgot_password_queue_is_generic_deduped_and_resolved_by_admin():
    unknown = client.post("/api/auth/forgot-password", json={"user_id": "NOPE-1"})
    known = client.post("/api/auth/forgot-password", json={"user_id": "STU-D12A-001"})
    assert unknown.status_code == known.status_code == 200 and unknown.json() == known.json()
    client.post("/api/auth/forgot-password", json={"user_id": "STU-D12A-001"})  # duplicate inside 24h
    admin = admin_headers()
    queue = client.get("/api/admin/reset-requests", headers=admin).json()
    assert [r["userId"] for r in queue] == ["STU-D12A-001"]
    assert client.get("/api/admin/reset-requests", headers=auth(login("FAC-SM"))).status_code == 403
    assert client.post("/api/admin/users/STU-D12A-001/reset-password", headers=admin).status_code == 200
    assert client.get("/api/admin/reset-requests", headers=admin).json() == []


def test_event_drafts_are_private_until_published():
    head, student = auth(login("CON-001")), auth(login("STU-D12A-001"))
    draft = client.post("/api/events", headers=head, json={**EVENT, "publish": False}).json()["eventId"]
    assert draft in {e["id"] for e in client.get("/api/events", headers=head).json()}
    assert draft not in {e["id"] for e in client.get("/api/events", headers=student).json()}
    assert "Hackathon" not in {a["title"] for a in client.get("/api/announcements", headers=student).json()}
    assert client.post(f"/api/events/{draft}/publish", headers=auth(login("STU-D12A-001"))).status_code == 403
    assert client.post(f"/api/events/{draft}/publish", headers=head).status_code == 200
    assert draft in {e["id"] for e in client.get("/api/events", headers=student).json()}
    assert "Hackathon" in {a["title"] for a in client.get("/api/announcements", headers=student).json()}
    assert client.post(f"/api/events/{draft}/publish", headers=head).status_code == 409


def test_assignment_file_submission_upload_download_and_authorization(monkeypatch):
    import main as main_module
    from storage import StoredObject

    class FakeStorage:
        objects: dict = {}

        def create_key(self, *, course_id, filename):
            return f"submissions/{course_id}/t-{filename}"

        def upload(self, *, key, content, content_type):
            self.objects[key] = (content, content_type)

        def download(self, key):
            content, content_type = self.objects[key]
            return StoredObject(key=key, content=content, content_type=content_type)

        def delete(self, key):
            self.objects.pop(key, None)

    fake = FakeStorage()
    monkeypatch.setattr(main_module, "get_storage", lambda: fake)
    faculty, student = auth(login("FAC-SM")), auth(login("STU-D12A-001"))
    created = client.post("/api/assignments", headers=faculty, json={
        "class_id": "D12A", "course_id": "TCS", "title": "Report", "description": "x",
        "due_date": "2099-01-01", "marks": 10, "allow_late": True})
    assert created.status_code in {200, 201}, created.text
    assignment_id = [a for a in client.get("/api/assignments", headers=faculty).json() if a["title"] == "Report"][0]["id"]
    # Bad type rejected, other class cannot submit
    assert client.post(f"/api/assignments/{assignment_id}/submit-file", headers=student,
                       files={"file": ("x.exe", b"MZ", "application/octet-stream")}).status_code == 503
    assert client.post(f"/api/assignments/{assignment_id}/submit-file", headers=auth(login("STU-D12B-001")),
                       files={"file": ("r.pdf", b"%PDF-1", "application/pdf")}).status_code == 403
    ok = client.post(f"/api/assignments/{assignment_id}/submit-file", headers=student,
                     files={"file": ("report.pdf", b"%PDF-1 hello", "application/pdf")})
    assert ok.status_code == 200, ok.text
    mine = [a for a in client.get("/api/assignments", headers=student).json() if a["id"] == assignment_id][0]
    assert mine["hasFile"] and mine["submissionFile"] == "report.pdf"
    seen = client.get(f"/api/assignments/{assignment_id}/submissions", headers=faculty).json()
    assert seen[0]["hasFile"]
    url = f"/api/assignments/submissions/{seen[0]['id']}/file"
    assert client.get(url, headers=faculty).content == b"%PDF-1 hello"
    assert client.get(url, headers=student).status_code == 200
    assert client.get(url, headers=auth(login("STU-D12A-002"))).status_code == 403
    assert client.get(url, headers=auth(login("FAC-OTHER"))).status_code == 403
    # Text-only resubmission drops the file
    client.post(f"/api/assignments/{assignment_id}/submit", headers=student, json={"submission_text": "plain answer"})
    assert not [a for a in client.get("/api/assignments", headers=student).json() if a["id"] == assignment_id][0]["hasFile"]
    assert not fake.objects


def test_admin_timetable_create_conflicts_and_delete():
    admin = admin_headers()
    entry = {"day": "Tuesday", "start_time": "09:00", "end_time": "10:00", "course_id": "TCS",
             "faculty_id": "FAC-SM", "classroom": "401", "class_ids": ["D12A"]}
    created = client.post("/api/admin/timetable", headers=admin, json=entry)
    assert created.status_code == 201, created.text
    clash = client.post("/api/admin/timetable", headers=admin, json={**entry, "start_time": "09:30", "end_time": "10:30"})
    assert clash.status_code == 409 and "already teaches" in clash.json()["detail"]
    adjacent = client.post("/api/admin/timetable", headers=admin, json={**entry, "start_time": "10:00", "end_time": "11:00"})
    assert adjacent.status_code == 201
    assert client.post("/api/admin/timetable", headers=admin, json={**entry, "end_time": "08:00"}).status_code == 400
    day = client.get("/api/timetable?day=Tuesday", headers=auth(login("STU-D12A-001"))).json()
    assert any(l["room"] == "401" for l in day["Tuesday"])
    assert client.post("/api/admin/timetable", headers=auth(login("FAC-SM")), json=entry).status_code == 403
    listed = client.get("/api/admin/timetable?class_id=D12A", headers=admin).json()
    assert len(listed) == 2 and all(r["createdByAdmin"] for r in listed)
    assert client.delete(f"/api/admin/timetable/{created.json()['id']}", headers=admin).status_code == 200
    assert client.delete(f"/api/admin/timetable/{created.json()['id']}", headers=admin).status_code == 404


def test_storage_network_failure_becomes_clean_503_and_crash_keeps_cors(monkeypatch):
    import httpx
    import main as main_module
    from storage import SupabaseStorage

    storage = SupabaseStorage(url="https://example.invalid", key="k", bucket="b")

    def boom(*args, **kwargs):
        raise httpx.ConnectError("no route")

    monkeypatch.setattr(httpx, "request", boom)
    monkeypatch.setattr(main_module, "get_storage", lambda: storage)
    headers = {**auth(login("FAC-SM")), "Origin": "http://localhost:5173"}
    upload = client.post(
        "/api/materials/upload", headers=headers,
        data={"course_id": "TCS", "unit": "U1", "title": "T", "description": ""},
        files={"file": ("n.pdf", b"%PDF-x", "application/pdf")},
    )
    assert upload.status_code == 503
    assert "unreachable" in upload.json()["detail"]
    assert upload.headers.get("access-control-allow-origin") == "http://localhost:5173"

    # A genuinely unexpected crash still returns JSON with CORS headers (not an opaque network error).
    def crash():
        raise RuntimeError("unexpected")

    monkeypatch.setattr(main_module, "get_storage", crash)
    crashed = client.post(
        "/api/materials/upload", headers=headers,
        data={"course_id": "TCS", "unit": "U1", "title": "T", "description": ""},
        files={"file": ("n.pdf", b"%PDF-x", "application/pdf")},
    )
    assert crashed.status_code == 500
    assert crashed.json()["detail"].startswith("Internal server error")
    assert crashed.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_faculty_attendance_summary_counts_match_roster():
    """Bulk attendance counting must agree with per-lecture marks."""
    fac = auth(login("FAC-SM"))
    lecture_id = client.post("/api/lectures/create", headers=fac, json={
        "class_id": "D12A", "course_id": "TCS", "date": "2026-12-03", "start_time": "10:00",
        "end_time": "11:00", "classroom": "314", "lecture_type": "Extra", "actual_faculty_id": "FAC-SM"}).json()["lectureId"]
    roster = client.get(f"/api/lectures/{lecture_id}/roster", headers=fac).json()["students"]
    marks = [{"student_id": s["id"], "status": "Present" if i == 0 else "Absent"} for i, s in enumerate(roster)]
    assert client.post("/api/attendance/mark", headers=fac, json={"lecture_id": lecture_id, "attendance": marks}).status_code == 200
    summary = client.get("/api/attendance/faculty", headers=fac).json()
    assert summary["stats"]["defaulters"] == len(roster) - 1
    assert summary["stats"]["avgAttendance"] == round(100 / len(roster), 1)
    assert all(d["percentage"] == 0.0 for d in summary["defaulters"])


def test_uploads_work_with_foreign_keys_enforced_like_postgres(monkeypatch):
    """SQLite ignores foreign keys by default, which hid an insert-order bug that PostgreSQL rejected."""
    import main as main_module
    from test_backend import test_engine
    from storage import StoredObject

    class FakeStorage:
        objects: dict = {}

        def create_key(self, *, course_id, filename):
            return f"materials/{course_id}/k-{filename}"

        def upload(self, *, key, content, content_type):
            self.objects[key] = (content, content_type)

        def download(self, key):
            content, content_type = self.objects[key]
            return StoredObject(key=key, content=content, content_type=content_type)

        def delete(self, key):
            self.objects.pop(key, None)

    fake = FakeStorage()
    monkeypatch.setattr(main_module, "get_storage", lambda: fake)
    with test_engine.connect() as connection:
        connection.exec_driver_sql("PRAGMA foreign_keys=ON")
    try:
        faculty = auth(login("FAC-SM"))
        upload = client.post(
            "/api/materials/upload", headers=faculty,
            data={"course_id": "TCS", "unit": "Unit 1", "title": "Notes", "description": ""},
            files={"file": ("notes.pdf", b"%PDF-1", "application/pdf")})
        assert upload.status_code == 201, upload.text
        assert fake.objects  # file kept because the database rows saved
        created = client.post("/api/assignments", headers=faculty, json={
            "class_id": "D12A", "course_id": "TCS", "title": "FK", "description": "x",
            "due_date": "2099-01-01", "marks": 5, "allow_late": True})
        assert created.status_code in {200, 201}, created.text
        assignment_id = [a for a in client.get("/api/assignments", headers=faculty).json() if a["title"] == "FK"][0]["id"]
        file_submit = client.post(f"/api/assignments/{assignment_id}/submit-file", headers=auth(login("STU-D12A-001")),
                                  files={"file": ("a.pdf", b"%PDF-1", "application/pdf")})
        assert file_submit.status_code == 200, file_submit.text
    finally:
        with test_engine.connect() as connection:
            connection.exec_driver_sql("PRAGMA foreign_keys=OFF")
