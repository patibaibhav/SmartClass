import json
import os
import uuid
import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, status, Query, Security, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.responses import Response
from sqlalchemy import or_, text
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from analytics import build_topic_performance_insights
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_current_user, require_role,
    check_account_lockout, record_failed_attempt, record_successful_login,
    generate_salt, validate_password, create_password_setup_token,
    require_password_setup_user, revoke_presented_token, security
)
from config import (
    CORS_ORIGINS, DEFAULT_LOW_ATTENDANCE_THRESHOLD,
    REMEMBER_TOKEN_EXPIRE_MINUTES, SUPABASE_STORAGE_BUCKET
)
from storage import StorageError, get_storage, validate_upload


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


PEC_COURSE_IDS = {"CSS", "SSD", "DWM"}


def student_first_name(user: models.User) -> str:
    """Return a safe display name without changing the stored legal/source name."""
    parts = [part for part in (user.name or "").split() if part]
    if not parts:
        return user.id
    if user.role == "student" and user.source == "college-xlsx" and len(parts) >= 2:
        return parts[1]
    return parts[0]


def serialize_user(user: models.User) -> dict[str, Any]:
    return {
        "id": user.id,
        "name": user.name,
        "firstName": student_first_name(user),
        "email": user.email,
        "role": user.role,
        "isHOD": user.is_hod,
        "department": user.department,
        "class": user.class_id,
        "firstLogin": user.first_login,
    }


def elective_for_student(db: Session, student_id: str) -> models.ElectiveEnrollment | None:
    return db.query(models.ElectiveEnrollment).filter(
        models.ElectiveEnrollment.student_id == student_id
    ).first()


def student_is_eligible_for_course(db: Session, user: models.User, course_id: str) -> bool:
    if course_id in PEC_COURSE_IDS:
        enrollment = elective_for_student(db, user.id)
        return bool(enrollment and enrollment.course_id == course_id)
    return bool(db.query(models.ClassCourse).filter(
        models.ClassCourse.class_id == user.class_id,
        models.ClassCourse.course_id == course_id,
    ).first())


def faculty_is_assigned_to_course(db: Session, user: models.User, course_id: str) -> bool:
    """HOD status provides analytics access, not an invented teaching assignment."""
    return bool(db.query(models.ClassCourse).filter(
        models.ClassCourse.faculty_id == user.id,
        models.ClassCourse.course_id == course_id,
    ).first())


def can_access_material(db: Session, user: models.User, material: models.StudyMaterial) -> bool:
    if user.role in {"admin", "council"}:
        return False
    if user.role == "student":
        return student_is_eligible_for_course(db, user, material.course_id)
    return faculty_is_assigned_to_course(db, user, material.course_id)


def eligible_roster(
    db: Session,
    class_ids: set[str],
    course_id: str,
    schedule_occurrence_id: int | None = None,
) -> list[models.StudentRecord]:
    query = db.query(models.StudentRecord).filter(models.StudentRecord.class_id.in_(class_ids))
    students = query.order_by(models.StudentRecord.class_id, models.StudentRecord.roll_no).all()
    batch_rows = db.query(models.ScheduleBatchGroup).filter(
        models.ScheduleBatchGroup.occurrence_id == schedule_occurrence_id,
        models.ScheduleBatchGroup.class_id.in_(class_ids),
    ).all() if schedule_occurrence_id else []
    if batch_rows or course_id in PEC_COURSE_IDS:
        allowed_by_class: dict[str, set[str]] = {}
        for row in batch_rows:
            allowed_by_class.setdefault(row.class_id, set()).add(row.batch_code)
        enrollments = {
            row.student_id: row for row in db.query(models.ElectiveEnrollment).filter(
                models.ElectiveEnrollment.student_id.in_([student.id for student in students])
            )
        }
        students = [
            student for student in students
            if enrollments.get(student.id)
            and (
                enrollments[student.id].batch_code in allowed_by_class[student.class_id]
                if student.class_id in allowed_by_class
                else enrollments[student.id].course_id == course_id
            )
        ]
    return students


def student_can_attend_lecture(db: Session, user: models.User, lecture: models.Lecture) -> bool:
    if lecture.schedule_occurrence_id:
        batch_rows = db.query(models.ScheduleBatchGroup).filter_by(
            occurrence_id=lecture.schedule_occurrence_id,
            class_id=user.class_id,
        ).all()
        if batch_rows:
            enrollment = elective_for_student(db, user.id)
            return bool(enrollment and enrollment.batch_code in {row.batch_code for row in batch_rows})
    return student_is_eligible_for_course(db, user, lecture.course_id)


def quiz_class_ids(db: Session, quiz: models.Quiz) -> set[str]:
    class_ids = {
        row.class_id for row in db.query(models.QuizClassMembership).filter_by(quiz_id=quiz.id)
    }
    if quiz.class_id:
        class_ids.add(quiz.class_id)
    return class_ids


def student_can_access_quiz(db: Session, user: models.User, quiz: models.Quiz) -> bool:
    return bool(user.class_id in quiz_class_ids(db, quiz) and student_is_eligible_for_course(db, user, quiz.course_id))


def faculty_can_manage_quiz(db: Session, user: models.User, quiz: models.Quiz) -> bool:
    if user.is_hod or quiz.created_by == user.id:
        return True
    return bool(db.query(models.ClassCourse).filter(
        models.ClassCourse.class_id.in_(quiz_class_ids(db, quiz)),
        models.ClassCourse.course_id == quiz.course_id,
        models.ClassCourse.faculty_id == user.id,
    ).first())

app = FastAPI(
    title="SmartClass API",
    description="Integrated Academic and Classroom Management Platform API",
    version="1.0.0"
)
logger = logging.getLogger("smartclass.api")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        # Do not include headers, bodies, tokens, or connection strings in logs.
        logger.exception("unhandled_request_error method=%s path=%s", request.method, request.url.path)
        raise
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    logger.info(
        "request_complete method=%s path=%s status=%s duration_ms=%d",
        request.method, request.url.path, response.status_code,
        (time.perf_counter() - started) * 1000,
    )
    return response

# -------------------------------------------------------------
# 1. AUTHENTICATION & ACCESS CONTROL (FR-AUTH-001 to 012)
# -------------------------------------------------------------

@app.post("/api/auth/login")
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == req.user_id).first()
    if not user:
        # Reduce the timing difference between unknown IDs and wrong passwords.
        hash_password(req.password, "0" * 32)
        # FR-AUTH-005: Generic error message
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid User ID or password. Please try again."
        )

    # Check lockout per FR-AUTH-006
    check_account_lockout(user)

    # Verify password
    if not verify_password(req.password, user.salt, user.password_hash):
        record_failed_attempt(user, db)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid User ID or password. Please try again."
        )

    # Check first-login requirement per FR-AUTH-003
    if user.first_login:
        return {
            "phase": "first-login",
            "token": create_password_setup_token(user),
            "message": "Temporary password detected. Please change your password to continue.",
            "user": {**serialize_user(user), "firstLogin": True}
        }

    record_successful_login(user, db)
    token = create_access_token(
        data={
            "sub": user.id,
            "role": user.role,
            "isHOD": user.is_hod,
            "ver": user.token_version,
        },
        expires_delta=(
            timedelta(minutes=REMEMBER_TOKEN_EXPIRE_MINUTES)
            if req.remember
            else None
        ),
    )

    return {
        "phase": "login",
        "token": token,
        "user": {**serialize_user(user), "firstLogin": False}
    }

@app.post("/api/auth/first-login")
def first_login(
    req: schemas.FirstLoginRequest,
    user: models.User = Depends(require_password_setup_user),
    db: Session = Depends(get_db),
):
    password_error = validate_password(req.new_password)
    if password_error:
        raise HTTPException(status_code=400, detail=password_error)
    if req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    # Update password and disable first_login flag
    new_salt = generate_salt()
    user.salt = new_salt
    user.password_hash = hash_password(req.new_password, new_salt)
    user.first_login = False
    user.token_version = int(user.token_version or 0) + 1
    db.commit()

    record_successful_login(user, db)
    token = create_access_token(data={
        "sub": user.id,
        "role": user.role,
        "isHOD": user.is_hod,
        "ver": user.token_version,
    })

    return {
        "token": token,
        "user": {**serialize_user(user), "firstLogin": False}
    }

@app.post("/api/auth/change-password")
def change_password(req: schemas.ChangePasswordRequest, current_user: models.User = Depends(require_current_user), db: Session = Depends(get_db)):
    if not verify_password(req.current_password, current_user.salt, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password incorrect.")

    password_error = validate_password(req.new_password)
    if password_error:
        raise HTTPException(status_code=400, detail=password_error)
    if req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    current_user.salt = generate_salt()
    current_user.password_hash = hash_password(req.new_password, current_user.salt)
    current_user.token_version = int(current_user.token_version or 0) + 1
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="PASSWORD_CHANGED",
        resource="User",
        details="Password changed; existing tokens invalidated.",
    ))
    db.commit()

    return {"message": "Password changed successfully. Please sign in again."}

@app.get("/api/auth/me")
def get_current_user_profile(user: models.User = Depends(require_current_user)):
    return serialize_user(user)

@app.post("/api/auth/logout")
def logout(
    user: models.User = Depends(require_current_user),
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db),
):
    revoke_presented_token(credentials, user, db, reason="logout")
    audit = models.AuditLog(user_id=user.id, action="LOGOUT", resource="User", details="User logged out.")
    db.add(audit)
    db.commit()
    return {"message": "Logged out successfully"}

# -------------------------------------------------------------
# 2. CLASS & COURSE MANAGEMENT (FR-CLASS-001 to 010)
# -------------------------------------------------------------

@app.get("/api/academic/classes")
def list_classes(
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.ClassModel).filter(models.ClassModel.is_active == True)
    if user.role == "student":
        query = query.filter(models.ClassModel.id == user.class_id)
    elif user.role == "faculty":
        assigned_ids = db.query(models.ClassCourse.class_id).filter(
            models.ClassCourse.faculty_id == user.id
        )
        query = query.filter(models.ClassModel.id.in_(assigned_ids))
    classes = query.all()
    return [{"id": c.id, "name": c.name, "department": c.department} for c in classes]

@app.get("/api/academic/courses")
def list_courses(
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.CourseModel).filter(models.CourseModel.is_active == True)
    if user.role == "student":
        allowed = {
            row.course_id for row in db.query(models.ClassCourse).filter_by(class_id=user.class_id)
            if student_is_eligible_for_course(db, user, row.course_id)
        }
        query = query.filter(models.CourseModel.id.in_(allowed))
    elif user.role == "faculty":
        allowed = db.query(models.ClassCourse.course_id).filter_by(faculty_id=user.id)
        query = query.filter(models.CourseModel.id.in_(allowed))
    courses = query.all()
    return [{
        "id": c.id,
        "code": c.code,
        "name": c.name,
        "department": c.department,
        "credits": c.credits
    } for c in courses]

@app.get("/api/academic/my-class")
def get_my_class(
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    if not user.class_id:
        if user.role != "faculty":
            raise HTTPException(status_code=404, detail="No class is assigned to this account")
        assignment_query = db.query(models.ClassCourse).filter(
            models.ClassCourse.faculty_id == user.id
        )
        class_ids = sorted({row.class_id for row in assignment_query.all()})
        classes = []
        for assigned_class_id in class_ids:
            class_record = db.query(models.ClassModel).filter(models.ClassModel.id == assigned_class_id).first()
            if not class_record:
                continue
            class_course_query = db.query(models.ClassCourse).filter(
                models.ClassCourse.class_id == assigned_class_id
            )
            class_course_query = class_course_query.filter(models.ClassCourse.faculty_id == user.id)
            class_courses = class_course_query.all()
            course_ids = {row.course_id for row in class_courses}
            if course_ids and course_ids.issubset(PEC_COURSE_IDS):
                students = db.query(models.StudentRecord).join(
                    models.ElectiveEnrollment,
                    models.ElectiveEnrollment.student_id == models.StudentRecord.id,
                ).filter(
                    models.StudentRecord.class_id == assigned_class_id,
                    models.ElectiveEnrollment.course_id.in_(course_ids),
                ).all()
            else:
                students = db.query(models.StudentRecord).filter(
                    models.StudentRecord.class_id == assigned_class_id
                ).all()
            classes.append({
                "classId": assigned_class_id,
                "className": class_record.name,
                "totalStudents": len(students),
                "students": [{"id": s.id, "name": s.name, "rollNo": s.roll_no} for s in students],
                "courses": [{"id": row.course_id} for row in class_courses],
            })
        return {"classes": classes}
    class_id = user.class_id
    class_record = db.query(models.ClassModel).filter(models.ClassModel.id == class_id).first()
    if not class_record:
        raise HTTPException(status_code=404, detail="Assigned class was not found")
    students = db.query(models.StudentRecord).filter(models.StudentRecord.class_id == class_id).all()
    
    # Courses associated with this class
    cc_records = db.query(models.ClassCourse).filter(models.ClassCourse.class_id == class_id).all()
    elective = elective_for_student(db, user.id) if user.role == "student" else None
    if user.role == "student":
        cc_records = [
            row for row in cc_records
            if row.course_id not in PEC_COURSE_IDS or (elective and row.course_id == elective.course_id)
        ]
    courses_info = []
    for cc in cc_records:
        course = db.query(models.CourseModel).filter(models.CourseModel.id == cc.course_id).first()
        faculty = db.query(models.User).filter(models.User.id == cc.faculty_id).first()
        if course:
            courses_info.append({
                "id": course.id,
                "code": course.code,
                "name": course.name,
                "credits": course.credits,
                "faculty": faculty.name if faculty else "Unassigned"
            })

    return {
        "classId": class_id,
        "className": class_record.name,
        "totalStudents": len(students),
        "students": [{"id": s.id, "name": s.name, "rollNo": s.roll_no, "class": s.class_id} for s in students],
        "courses": courses_info
    }

# -------------------------------------------------------------
# 3. ATTENDANCE & LECTURE MANAGEMENT (FR-ATT, FR-LECT)
# -------------------------------------------------------------

@app.get("/api/attendance/student")
def get_student_attendance(
    user: models.User = Depends(require_role("student")),
    db: Session = Depends(get_db),
):
    if not user.class_id:
        raise HTTPException(status_code=404, detail="No class is assigned to this account")
    student_id = user.id
    course_ids = [
        row.course_id
        for row in db.query(models.ClassCourse).filter(
            models.ClassCourse.class_id == user.class_id
        ).all()
    ]
    elective = elective_for_student(db, user.id)
    course_ids = [
        course_id for course_id in course_ids
        if course_id not in PEC_COURSE_IDS or (elective and elective.course_id == course_id)
    ]
    courses = db.query(models.CourseModel).filter(models.CourseModel.id.in_(course_ids)).all() if course_ids else []
    result = []

    for c in courses:
        lectures = db.query(models.Lecture).outerjoin(models.LectureClassMembership).filter(
            models.Lecture.course_id == c.id,
            or_(
                models.Lecture.class_id == user.class_id,
                models.LectureClassMembership.class_id == user.class_id,
            ),
            models.Lecture.status == "Conducted"
        ).distinct().all()
        lectures = [lecture for lecture in lectures if student_can_attend_lecture(db, user, lecture)]
        lec_ids = [l.id for l in lectures]
        records = (
            db.query(models.Attendance).filter(
                models.Attendance.student_id == student_id,
                models.Attendance.lecture_id.in_(lec_ids)
            ).all()
            if lec_ids
            else []
        )
        total = len(lectures)
        present = sum(1 for record in records if record.status == "Present")
        pct = round((present / total * 100), 1) if total else 0.0

        result.append({
            "course": c.id,
            "name": c.name,
            "total": total,
            "present": present,
            "percentage": pct,
            "isDefaulter": pct < DEFAULT_LOW_ATTENDANCE_THRESHOLD
        })

    overall_total = sum(item["total"] for item in result)
    overall_present = sum(item["present"] for item in result)
    overall_pct = round((overall_present / overall_total * 100), 1) if overall_total > 0 else 0.0
    history_rows = db.query(models.Attendance, models.Lecture).join(
        models.Lecture, models.Attendance.lecture_id == models.Lecture.id
    ).filter(models.Attendance.student_id == student_id).order_by(
        models.Lecture.date.desc(), models.Lecture.start_time.desc()
    ).all()
    history_rows = [
        (attendance, lecture) for attendance, lecture in history_rows
        if student_can_attend_lecture(db, user, lecture)
    ]

    return {
        "studentId": student_id,
        "overallPercentage": overall_pct,
        "isOverallDefaulter": overall_pct < DEFAULT_LOW_ATTENDANCE_THRESHOLD,
        "courses": result,
        "history": [
            {
                "lectureId": lecture.id,
                "date": lecture.date,
                "course": lecture.course_code or lecture.course_id,
                "courseName": lecture.course_name,
                "time": f"{lecture.start_time}–{lecture.end_time}",
                "type": lecture.lecture_type,
                "status": attendance.status,
                "isDemo": attendance.is_demo,
            }
            for attendance, lecture in history_rows
        ],
    }

@app.get("/api/attendance/faculty")
def get_faculty_attendance(
    user: models.User = Depends(require_role("faculty", "hod", "admin")),
    db: Session = Depends(get_db),
):
    assignments_query = db.query(models.ClassCourse)
    if user.role == "faculty":
        assignments_query = assignments_query.filter(models.ClassCourse.faculty_id == user.id)
    assignments = assignments_query.all()
    defaulters = []
    percentages = []
    for assignment in assignments:
        course = db.query(models.CourseModel).filter(models.CourseModel.id == assignment.course_id).first()
        lectures = db.query(models.Lecture).outerjoin(models.LectureClassMembership).filter(
            or_(
                models.Lecture.class_id == assignment.class_id,
                models.LectureClassMembership.class_id == assignment.class_id,
            ),
            models.Lecture.course_id == assignment.course_id,
            models.Lecture.status == "Conducted",
        ).distinct().all()
        if not lectures:
            continue
        lecture_ids = [lecture.id for lecture in lectures]
        students = eligible_roster(db, {assignment.class_id}, assignment.course_id)
        for student in students:
            present = db.query(models.Attendance).filter(
                models.Attendance.student_id == student.id,
                models.Attendance.lecture_id.in_(lecture_ids),
                models.Attendance.status == "Present",
            ).count()
            percentage = round(present / len(lectures) * 100, 1)
            percentages.append(percentage)
            if percentage < DEFAULT_LOW_ATTENDANCE_THRESHOLD:
                defaulters.append({
                    "id": student.id,
                    "name": student.name,
                    "rollNo": student.roll_no,
                    "course": f"{course.name} ({course.code})" if course else assignment.course_id,
                    "percentage": percentage,
                })
    faculty_assignment_ids = [
        assignment.id for assignment in db.query(models.Assignment).filter(
            models.Assignment.created_by == user.id
        ).all()
    ] if user.role == "faculty" else [assignment.id for assignment in db.query(models.Assignment).all()]
    pending_submissions = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.assignment_id.in_(faculty_assignment_ids),
        models.AssignmentSubmission.status.in_(["submitted", "late"]),
    ).count() if faculty_assignment_ids else 0
    now = utc_now().isoformat()
    quiz_query = db.query(models.Quiz).filter(
        models.Quiz.opens_at <= now,
        models.Quiz.closes_at >= now,
    )
    if user.role == "faculty":
        quiz_query = quiz_query.filter(models.Quiz.created_by == user.id)
    return {
        "stats": {
            "classes": len({assignment.class_id for assignment in assignments}),
            "courses": len({assignment.course_id for assignment in assignments}),
            "avgAttendance": round(sum(percentages) / len(percentages), 1) if percentages else 0.0,
            "defaulters": len(defaulters),
            "pendingAssignments": pending_submissions,
            "activeQuizzes": quiz_query.count(),
        },
        "defaulters": defaulters
    }

@app.get("/api/lectures")
def list_lectures(
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.Lecture)
    if user.role == "student":
        query = query.outerjoin(models.LectureClassMembership).filter(
            or_(
                models.Lecture.class_id == user.class_id,
                models.LectureClassMembership.class_id == user.class_id,
            )
        ).distinct()
    elif user.role == "faculty":
        query = query.filter(models.Lecture.actual_faculty_id == user.id)
    lectures = query.order_by(models.Lecture.date.desc()).all()
    if user.role == "student":
        lectures = [
            lecture for lecture in lectures
            if student_is_eligible_for_course(db, user, lecture.course_id)
        ]
    lecture_ids = [lecture.id for lecture in lectures]
    membership_rows = (
        db.query(models.LectureClassMembership).filter(
            models.LectureClassMembership.lecture_id.in_(lecture_ids)
        ).all()
        if lecture_ids
        else []
    )
    class_ids_by_lecture: dict[int, list[str]] = {}
    for membership in membership_rows:
        class_ids_by_lecture.setdefault(membership.lecture_id, []).append(membership.class_id)
    return [{
        "id": l.id,
        "class": l.class_id,
        "courseId": l.course_id,
        "courseName": l.course_name,
        "courseCode": l.course_code,
        "scheduledFaculty": l.scheduled_faculty_name,
        "actualFaculty": l.actual_faculty_name,
        "date": l.date,
        "startTime": l.start_time,
        "endTime": l.end_time,
        "lectureType": l.lecture_type,
        "classroom": l.classroom,
        "status": l.status,
        "notes": l.notes,
        "classIds": sorted(class_ids_by_lecture.get(l.id, [l.class_id] if l.class_id else [])),
    } for l in lectures]


@app.get("/api/lectures/{lecture_id}/roster")
def get_lecture_roster(
    lecture_id: int,
    user: models.User = Depends(require_role("faculty", "hod", "admin")),
    db: Session = Depends(get_db),
):
    lecture = db.get(models.Lecture, lecture_id)
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    class_ids = {
        row.class_id for row in db.query(models.LectureClassMembership).filter_by(lecture_id=lecture.id)
    }
    if lecture.class_id:
        class_ids.add(lecture.class_id)
    if user.role == "faculty" and not user.is_hod and lecture.actual_faculty_id != user.id:
        authorized = db.query(models.ClassCourse).filter(
            models.ClassCourse.class_id.in_(class_ids),
            models.ClassCourse.course_id == lecture.course_id,
            models.ClassCourse.faculty_id == user.id,
        ).first()
        if not authorized:
            raise HTTPException(status_code=403, detail="Faculty assignment does not permit this lecture")
    attendance_by_student = {
        row.student_id: row for row in db.query(models.Attendance).filter_by(lecture_id=lecture.id)
    }
    roster = eligible_roster(db, class_ids, lecture.course_id, lecture.schedule_occurrence_id)
    return {
        "lecture": {
            "id": lecture.id,
            "courseId": lecture.course_id,
            "courseName": lecture.course_name,
            "date": lecture.date,
            "startTime": lecture.start_time,
            "endTime": lecture.end_time,
            "classIds": sorted(class_ids),
            "status": lecture.status,
        },
        "students": [
            {
                "id": student.id,
                "name": student.name,
                "rollNo": student.roll_no,
                "classId": student.class_id,
                "status": attendance_by_student.get(student.id).status
                if attendance_by_student.get(student.id) else "Present",
                "saved": student.id in attendance_by_student,
            }
            for student in roster
        ],
    }

@app.post("/api/lectures/create")
def create_lecture(
    req: schemas.LectureCreateRequest,
    user: models.User = Depends(require_role("faculty", "hod", "admin")),
    db: Session = Depends(get_db),
):
    course = db.query(models.CourseModel).filter(models.CourseModel.id == req.course_id).first()
    class_record = db.query(models.ClassModel).filter(models.ClassModel.id == req.class_id).first()
    if not course or not class_record:
        raise HTTPException(status_code=400, detail="Unknown class or course")
    if req.lecture_type not in {"Regular", "Substitute", "Extra"}:
        raise HTTPException(status_code=400, detail="Unsupported lecture type")
    try:
        datetime.fromisoformat(req.date)
        start_value = datetime.strptime(req.start_time, "%H:%M")
        end_value = datetime.strptime(req.end_time, "%H:%M")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Date/time values are invalid") from exc
    if end_value <= start_value:
        raise HTTPException(status_code=400, detail="Lecture end time must be after its start time")
    if user.role == "faculty" and not user.is_hod:
        authorized = db.query(models.ClassCourse).filter(
            models.ClassCourse.class_id == req.class_id,
            models.ClassCourse.course_id == req.course_id,
            models.ClassCourse.faculty_id == user.id,
        ).first()
        if not authorized or req.actual_faculty_id != user.id:
            raise HTTPException(status_code=403, detail="Faculty assignment does not permit this lecture")
    sched_faculty = db.query(models.User).filter(models.User.id == (req.scheduled_faculty_id or req.actual_faculty_id)).first()
    act_faculty = db.query(models.User).filter(models.User.id == req.actual_faculty_id).first()
    if not sched_faculty or not act_faculty:
        raise HTTPException(status_code=400, detail="Unknown faculty account")
    conflict = db.query(models.Lecture).filter(
        models.Lecture.date == req.date,
        models.Lecture.status != "Cancelled",
        models.Lecture.start_time < req.end_time,
        models.Lecture.end_time > req.start_time,
        or_(
            models.Lecture.classroom == req.classroom,
            models.Lecture.actual_faculty_id == req.actual_faculty_id,
        ),
    ).first()
    if conflict:
        raise HTTPException(status_code=409, detail="The faculty member or classroom is already occupied in this time range")

    lec = models.Lecture(
        class_id=req.class_id,
        course_id=req.course_id,
        course_name=course.name if course else "Course",
        course_code=course.code if course else req.course_id,
        scheduled_faculty_id=sched_faculty.id if sched_faculty else req.actual_faculty_id,
        scheduled_faculty_name=sched_faculty.name if sched_faculty else "Faculty",
        actual_faculty_id=act_faculty.id if act_faculty else req.actual_faculty_id,
        actual_faculty_name=act_faculty.name if act_faculty else "Faculty",
        date=req.date,
        start_time=req.start_time,
        end_time=req.end_time,
        lecture_type=req.lecture_type,
        classroom=req.classroom,
        status="Scheduled",
        notes=req.notes,
        substitute_reason=req.substitute_reason
    )
    db.add(lec)
    db.flush()
    db.add(models.LectureClassMembership(lecture_id=lec.id, class_id=req.class_id))
    db.commit()
    db.refresh(lec)

    # Notification for substitute or extra lecture per FR-NOTIF-004
    if req.lecture_type in ["Substitute", "Extra"]:
        notif = models.Notification(
            id=f"N_{uuid.uuid4().hex[:6]}",
            message=f"Timetable updated: {req.date} {course.name if course else ''} is a {req.lecture_type} lecture ({req.classroom}).",
            type="info",
            icon="timetable",
            time_ago="Just now"
        )
        db.add(notif)
        db.commit()

    return {"message": "Lecture created successfully", "lectureId": lec.id}

@app.post("/api/attendance/mark")
def mark_attendance(
    req: schemas.MarkAttendanceRequest,
    user: models.User = Depends(require_role("faculty", "hod")),
    db: Session = Depends(get_db),
):
    lec = db.query(models.Lecture).filter(models.Lecture.id == req.lecture_id).first()
    if not lec:
        raise HTTPException(status_code=404, detail="Lecture not found")
    if lec.status == "Cancelled" or lec.lecture_type == "Cancelled":
        raise HTTPException(status_code=409, detail="Attendance cannot be recorded for a cancelled lecture")

    lecture_class_ids = {
        membership.class_id
        for membership in db.query(models.LectureClassMembership).filter(
            models.LectureClassMembership.lecture_id == lec.id
        ).all()
    }
    if lec.class_id:
        lecture_class_ids.add(lec.class_id)

    if user.role == "faculty" and not user.is_hod:
        authorized = db.query(models.ClassCourse).filter(
            models.ClassCourse.class_id.in_(lecture_class_ids),
            models.ClassCourse.course_id == lec.course_id,
            models.ClassCourse.faculty_id == user.id,
        ).first()
        if not authorized and lec.actual_faculty_id != user.id:
            raise HTTPException(status_code=403, detail="Faculty assignment does not permit attendance changes")
    faculty_id = user.id
    roster_ids = {
        student.id for student in eligible_roster(
            db, lecture_class_ids, lec.course_id, lec.schedule_occurrence_id
        )
    }
    submitted_ids = [item.student_id for item in req.attendance]
    if len(set(submitted_ids)) != len(submitted_ids):
        raise HTTPException(status_code=400, detail="Attendance contains duplicate students")
    if set(submitted_ids) != roster_ids:
        raise HTTPException(status_code=400, detail="Attendance must include the complete eligible lecture roster")
    if any(item.status not in {"Present", "Absent"} for item in req.attendance):
        raise HTTPException(status_code=400, detail="Attendance status must be Present or Absent")
    
    # Save attendance records per FR-ATT-004
    for item in req.attendance:
        existing = db.query(models.Attendance).filter(
            models.Attendance.lecture_id == req.lecture_id,
            models.Attendance.student_id == item.student_id
        ).first()
        if existing:
            # Audit change per FR-ATT-006
            if existing.status != item.status:
                audit = models.AttendanceAudit(
                    attendance_id=existing.id,
                    old_status=existing.status,
                    new_status=item.status,
                    changed_by=faculty_id,
                    reason="Correction by faculty"
                )
                db.add(audit)
            existing.status = item.status
            existing.updated_at = utc_now()
        else:
            att = models.Attendance(
                lecture_id=req.lecture_id,
                student_id=item.student_id,
                status=item.status,
                marked_by=faculty_id
            )
            db.add(att)

    lec.status = "Conducted"
    db.commit()
    return {"message": "Attendance persisted successfully", "count": len(req.attendance)}

# -------------------------------------------------------------
# 4. TIMETABLE & CONFLICT DETECTION (FR-TT-001 to 012)
# -------------------------------------------------------------

@app.get("/api/timetable")
def get_timetable(
    day: Optional[str] = None,
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    grouped: Dict[str, List[Any]] = {
        "Monday": [], "Tuesday": [], "Wednesday": [], "Thursday": [], "Friday": []
    }
    occurrence_query = db.query(models.ScheduleOccurrence)
    if user.role == "student":
        if not user.class_id:
            raise HTTPException(status_code=404, detail="No class is assigned to this account")
        occurrence_query = occurrence_query.join(models.ScheduleClassMembership).filter(
            models.ScheduleClassMembership.class_id == user.class_id
        )
    elif user.role == "faculty":
        occurrence_query = occurrence_query.filter(models.ScheduleOccurrence.faculty_id == user.id)
    if day:
        occurrence_query = occurrence_query.filter(models.ScheduleOccurrence.day_of_week == day)
    occurrences = occurrence_query.order_by(
        models.ScheduleOccurrence.day_of_week,
        models.ScheduleOccurrence.start_time,
    ).all()
    if user.role == "student":
        elective = elective_for_student(db, user.id)
        batch_rows = db.query(models.ScheduleBatchGroup).filter(
            models.ScheduleBatchGroup.occurrence_id.in_([item.id for item in occurrences]),
            models.ScheduleBatchGroup.class_id == user.class_id,
        ).all() if occurrences else []
        batches_by_id: dict[int, set[str]] = {}
        for row in batch_rows:
            batches_by_id.setdefault(row.occurrence_id, set()).add(row.batch_code)
        occurrences = [
            occurrence for occurrence in occurrences
            if (
                (
                    elective
                    and elective.batch_code in batches_by_id[occurrence.id]
                ) if occurrence.id in batches_by_id else (
                    occurrence.course_id not in PEC_COURSE_IDS
                    or (elective and occurrence.course_id == elective.course_id)
                )
            )
        ]

    if occurrences:
        occurrence_ids = [occurrence.id for occurrence in occurrences]
        memberships = db.query(models.ScheduleClassMembership).filter(
            models.ScheduleClassMembership.occurrence_id.in_(occurrence_ids)
        ).all()
        batches = db.query(models.ScheduleBatchGroup).filter(
            models.ScheduleBatchGroup.occurrence_id.in_(occurrence_ids)
        ).all()
        class_ids_by_occurrence: dict[int, list[str]] = {}
        batches_by_occurrence: dict[int, list[str]] = {}
        for membership in memberships:
            class_ids_by_occurrence.setdefault(membership.occurrence_id, []).append(membership.class_id)
        for batch in batches:
            batches_by_occurrence.setdefault(batch.occurrence_id, []).append(
                f"{batch.class_id}:{batch.batch_code}"
            )
        for occurrence in occurrences:
            display_course_id = occurrence.course_id
            if (
                user.role == "student"
                and elective
                and occurrence.course_id in PEC_COURSE_IDS
                and occurrence.id in batches_by_id
            ):
                # Practical batches are PEC cohorts: CSS=A, SSD=B, DWM=C.
                # Show the student's selected PEC even when the source cell's
                # subject label disagrees with its authoritative batch label.
                display_course_id = elective.course_id
            course = (
                db.query(models.CourseModel).filter(models.CourseModel.id == display_course_id).first()
                if display_course_id
                else None
            )
            faculty = (
                db.query(models.User).filter(models.User.id == occurrence.faculty_id).first()
                if occurrence.faculty_id
                else None
            )
            grouped[occurrence.day_of_week].append({
                "id": occurrence.id,
                "time": f"{occurrence.start_time}–{occurrence.end_time}",
                "startTime": occurrence.start_time,
                "endTime": occurrence.end_time,
                "course": course.name if course else occurrence.source_subject_code,
                "code": course.code if course else occurrence.source_subject_code,
                "faculty": faculty.name if faculty else None,
                "room": occurrence.classroom,
                "type": occurrence.session_type,
                "classIds": sorted(class_ids_by_occurrence.get(occurrence.id, [])),
                "batches": sorted(batches_by_occurrence.get(occurrence.id, [])),
                "parallelGroup": occurrence.parallel_group,
                "durationMinutes": (
                    datetime.strptime(occurrence.end_time, "%H:%M")
                    - datetime.strptime(occurrence.start_time, "%H:%M")
                ).seconds // 60,
            })
        return grouped

    legacy_query = db.query(models.TimetableEntry)
    if user.role == "student":
        legacy_query = legacy_query.filter(models.TimetableEntry.class_id == user.class_id)
    elif user.role == "faculty":
        legacy_query = legacy_query.filter(models.TimetableEntry.faculty_id == user.id)
    if day:
        legacy_query = legacy_query.filter(models.TimetableEntry.day_of_week == day)
    for e in legacy_query.all():
        if e.day_of_week in grouped:
            grouped[e.day_of_week].append({
                "id": e.id,
                "time": e.time,
                "startTime": e.start_time,
                "endTime": e.end_time,
                "course": e.course_name,
                "code": e.course_code,
                "faculty": e.faculty_name,
                "room": e.classroom,
                "type": e.lecture_type,
                "classIds": [e.class_id],
                "batches": [],
                "parallelGroup": None,
            })
    return grouped


@app.get("/api/classes/{class_id}/timetable")
def get_class_timetable(
    class_id: str,
    day: Optional[str] = None,
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    if user.role == "student" and user.class_id != class_id:
        raise HTTPException(status_code=403, detail="Students may view only their assigned class timetable")
    if user.role == "faculty" and not user.is_hod:
        assigned = db.query(models.ClassCourse).filter(
            models.ClassCourse.class_id == class_id,
            models.ClassCourse.faculty_id == user.id,
        ).first()
        if not assigned:
            raise HTTPException(status_code=403, detail="Faculty is not assigned to this class")
    query = db.query(models.ScheduleOccurrence).join(models.ScheduleClassMembership).filter(
        models.ScheduleClassMembership.class_id == class_id
    )
    if day:
        query = query.filter(models.ScheduleOccurrence.day_of_week == day)
    return [
        {
            "id": occurrence.id,
            "day": occurrence.day_of_week,
            "startTime": occurrence.start_time,
            "endTime": occurrence.end_time,
            "subjectCode": occurrence.source_subject_code,
            "facultyId": occurrence.faculty_id,
            "room": occurrence.classroom,
            "type": occurrence.session_type,
            "parallelGroup": occurrence.parallel_group,
        }
        for occurrence in query.order_by(
            models.ScheduleOccurrence.day_of_week,
            models.ScheduleOccurrence.start_time,
        ).all()
    ]

@app.post("/api/timetable/check-conflict")
def check_timetable_conflict(
    day: str = Query(...),
    start_time: str = Query(...),
    end_time: str = Query(...),
    classroom: str = Query(...),
    faculty_id: str = Query(...),
    class_id: str = Query(...),
    _user: models.User = Depends(require_role("faculty", "hod", "admin")),
    db: Session = Depends(get_db)
):
    """Detects timetable conflicts per FR-TT-009, 010, 011."""
    conflicts = []
    
    # 1. Faculty overlap check (FR-TT-009)
    faculty_overlap = db.query(models.TimetableEntry).filter(
        models.TimetableEntry.day_of_week == day,
        models.TimetableEntry.faculty_id == faculty_id,
        models.TimetableEntry.start_time < end_time,
        models.TimetableEntry.end_time > start_time
    ).first()
    if faculty_overlap:
        conflicts.append(f"Faculty is already assigned to {faculty_overlap.course_code} ({faculty_overlap.time})")

    # 2. Classroom overlap check (FR-TT-010)
    room_overlap = db.query(models.TimetableEntry).filter(
        models.TimetableEntry.day_of_week == day,
        models.TimetableEntry.classroom == classroom,
        models.TimetableEntry.start_time < end_time,
        models.TimetableEntry.end_time > start_time
    ).first()
    if room_overlap:
        conflicts.append(f"Classroom {classroom} is already occupied by {room_overlap.course_code} ({room_overlap.time})")

    # 3. Class overlap check (FR-TT-011)
    class_overlap = db.query(models.TimetableEntry).filter(
        models.TimetableEntry.day_of_week == day,
        models.TimetableEntry.class_id == class_id,
        models.TimetableEntry.start_time < end_time,
        models.TimetableEntry.end_time > start_time
    ).first()
    if class_overlap:
        conflicts.append(f"Class {class_id} already has a scheduled lecture: {class_overlap.course_code}")

    normalized_faculty_overlap = db.query(models.ScheduleOccurrence).filter(
        models.ScheduleOccurrence.day_of_week == day,
        models.ScheduleOccurrence.faculty_id == faculty_id,
        models.ScheduleOccurrence.start_time < end_time,
        models.ScheduleOccurrence.end_time > start_time,
    ).first()
    if normalized_faculty_overlap:
        conflicts.append(
            f"Faculty is already assigned to {normalized_faculty_overlap.source_subject_code} "
            f"({normalized_faculty_overlap.start_time}–{normalized_faculty_overlap.end_time})"
        )

    normalized_room_overlap = db.query(models.ScheduleOccurrence).filter(
        models.ScheduleOccurrence.day_of_week == day,
        models.ScheduleOccurrence.classroom == classroom,
        models.ScheduleOccurrence.start_time < end_time,
        models.ScheduleOccurrence.end_time > start_time,
    ).first()
    if normalized_room_overlap:
        conflicts.append(
            f"Classroom {classroom} is already occupied by "
            f"{normalized_room_overlap.source_subject_code} "
            f"({normalized_room_overlap.start_time}–{normalized_room_overlap.end_time})"
        )

    normalized_class_overlap = db.query(models.ScheduleOccurrence).join(
        models.ScheduleClassMembership
    ).filter(
        models.ScheduleOccurrence.day_of_week == day,
        models.ScheduleClassMembership.class_id == class_id,
        models.ScheduleOccurrence.start_time < end_time,
        models.ScheduleOccurrence.end_time > start_time,
    ).first()
    if normalized_class_overlap:
        conflicts.append(
            f"Class {class_id} already has a scheduled activity: "
            f"{normalized_class_overlap.source_subject_code}"
        )

    return {
        "hasConflict": len(conflicts) > 0,
        "conflicts": conflicts
    }

# -------------------------------------------------------------
# 5. CLASSROOM AVAILABILITY SEARCH (FR-ROOM-001 to 005)
# -------------------------------------------------------------

@app.get("/api/classrooms")
def get_all_classrooms(
    _user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    rooms = db.query(models.Classroom).all()
    return [{
        "id": r.id,
        "name": r.name,
        "building": r.building,
        "capacity": r.capacity,
        "facilities": json.loads(r.facilities_json)
    } for r in rooms]

@app.post("/api/classrooms/search-availability")
def search_classroom_availability(
    req: schemas.ClassroomSearchRequest,
    _user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    """Compares requested time range against lectures per FR-ROOM-001 to 005."""
    try:
        requested_start = datetime.strptime(req.start_time, "%H:%M")
        requested_end = datetime.strptime(req.end_time, "%H:%M")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Times must use HH:MM format") from exc
    if requested_end <= requested_start:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    rooms = db.query(models.Classroom).all()
    
    # Overlapping lectures on that date
    overlapping_lectures = db.query(models.Lecture).filter(
        models.Lecture.date == req.date,
        models.Lecture.status != "Cancelled",
        models.Lecture.start_time < req.end_time,
        models.Lecture.end_time > req.start_time
    ).all()

    occupied_rooms = {l.classroom: l for l in overlapping_lectures}
    try:
        requested_day = datetime.fromisoformat(req.date).strftime("%A")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Date must use YYYY-MM-DD format") from exc
    recurring_occurrences = db.query(models.ScheduleOccurrence).filter(
        models.ScheduleOccurrence.day_of_week == requested_day,
        models.ScheduleOccurrence.classroom.isnot(None),
        models.ScheduleOccurrence.start_time < req.end_time,
        models.ScheduleOccurrence.end_time > req.start_time,
        models.ScheduleOccurrence.session_type != "Cancelled",
    ).all()
    occupied_schedule_rooms = {
        occurrence.classroom: occurrence for occurrence in recurring_occurrences
    }

    results = []
    for r in rooms:
        is_occupied = r.name in occupied_rooms or r.name in occupied_schedule_rooms
        occupied_by = None
        if is_occupied:
            if r.name in occupied_rooms:
                lec = occupied_rooms[r.name]
                occupied_by = f"{lec.course_code} - {lec.course_name} ({lec.actual_faculty_name})"
            else:
                occurrence = occupied_schedule_rooms[r.name]
                occupied_by = occurrence.source_subject_code
        
        results.append({
            "id": r.id,
            "name": r.name,
            "building": r.building,
            "capacity": r.capacity,
            "facilities": json.loads(r.facilities_json),
            "status": "Occupied" if is_occupied else "Available",
            "occupiedBy": occupied_by
        })

    return {
        "date": req.date,
        "timeRange": f"{req.start_time}–{req.end_time}",
        "total": len(results),
        "available": sum(1 for x in results if x["status"] == "Available"),
        "occupied": sum(1 for x in results if x["status"] == "Occupied"),
        "classrooms": results
    }

# -------------------------------------------------------------
# 6. STUDY MATERIAL MANAGEMENT (FR-MAT-001 to 006)
# -------------------------------------------------------------

@app.get("/api/materials")
def list_study_materials(
    course_id: Optional[str] = None,
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    allowed_course_ids: Optional[set[str]] = None
    if user.role == "student":
        allowed_course_ids = {
            row.course_id for row in db.query(models.ClassCourse).filter(
                models.ClassCourse.class_id == user.class_id
            ).all()
        }
        allowed_course_ids = {
            value for value in allowed_course_ids
            if student_is_eligible_for_course(db, user, value)
        }
    elif user.role == "faculty":
        allowed_course_ids = {
            row.course_id for row in db.query(models.ClassCourse).filter(
                models.ClassCourse.faculty_id == user.id
            ).all()
        }
    if course_id and allowed_course_ids is not None and course_id not in allowed_course_ids:
        raise HTTPException(status_code=403, detail="Course access is not permitted")
    query = db.query(models.StudyMaterial)
    if allowed_course_ids is not None:
        query = query.filter(models.StudyMaterial.course_id.in_(allowed_course_ids))
    if course_id:
        query = query.filter(models.StudyMaterial.course_id == course_id)
    materials = query.all()
    files_by_material = {
        item.material_id: item
        for item in db.query(models.StoredFile).filter(
            models.StoredFile.material_id.in_([material.id for material in materials])
        ).all()
    } if materials else {}
    return [{
        "id": m.id,
        "course": m.course_id,
        "unit": m.unit,
        "title": m.title,
        "type": m.file_type,
        "size": m.file_size,
        "uploadedBy": m.uploaded_by,
        "uploadedAt": m.uploaded_at,
        "description": m.description,
        "hasFile": m.id in files_by_material,
        "fileName": files_by_material[m.id].original_filename if m.id in files_by_material else None,
    } for m in materials]


@app.post("/api/materials/upload", status_code=status.HTTP_201_CREATED)
async def upload_study_material(
    course_id: str = Form(...),
    unit: str = Form(...),
    title: str = Form(...),
    description: str = Form(""),
    file: UploadFile = File(...),
    user: models.User = Depends(require_role("faculty", "hod")),
    db: Session = Depends(get_db),
):
    if not faculty_is_assigned_to_course(db, user, course_id):
        raise HTTPException(status_code=403, detail="Faculty is not assigned to this course")
    course = db.get(models.CourseModel, course_id)
    if not course or not unit.strip() or not title.strip():
        raise HTTPException(status_code=400, detail="Course, unit, and title are required")
    content = await file.read()
    try:
        original_filename, content_type = validate_upload(file.filename or "", file.content_type or "", content)
        storage = get_storage()
        object_key = storage.create_key(course_id=course_id, filename=original_filename)
        storage.upload(key=object_key, content=content, content_type=content_type)
    except StorageError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    material = models.StudyMaterial(
        id=f"MAT-{uuid.uuid4().hex[:12].upper()}",
        course_id=course_id,
        unit=unit.strip(),
        title=title.strip(),
        file_type=original_filename.rsplit(".", 1)[-1].upper(),
        file_size=f"{len(content) / 1024:.1f} KB",
        uploaded_by=user.name,
        uploaded_at=utc_now().strftime("%Y-%m-%dT%H:%M:%S"),
        description=description.strip() or None,
    )
    stored_file = models.StoredFile(
        id=f"FILE-{uuid.uuid4().hex[:12].upper()}",
        bucket=SUPABASE_STORAGE_BUCKET,
        object_key=object_key,
        original_filename=original_filename,
        content_type=content_type,
        size_bytes=len(content),
        uploaded_by_id=user.id,
        course_id=course_id,
        material_id=material.id,
    )
    try:
        db.add(material)
        db.add(stored_file)
        db.commit()
    except Exception:
        db.rollback()
        try:
            storage.delete(object_key)
        except StorageError:
            pass
        raise
    return {"id": material.id, "message": "Study material uploaded successfully"}


@app.get("/api/materials/{material_id}/download")
def download_study_material(
    material_id: str,
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    material = db.get(models.StudyMaterial, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Study material not found")
    if not can_access_material(db, user, material):
        raise HTTPException(status_code=403, detail="You are not authorized to download this material")
    stored_file = db.query(models.StoredFile).filter_by(material_id=material_id).first()
    if not stored_file:
        raise HTTPException(status_code=404, detail="No downloadable file is attached to this material")
    try:
        stored = get_storage().download(stored_file.object_key)
    except StorageError as exc:
        status_code = 404 if "no longer available" in str(exc) else 503
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc
    safe_filename = stored_file.original_filename.replace('"', "")
    return Response(
        content=stored.content,
        media_type=stored_file.content_type,
        headers={"Content-Disposition": f'attachment; filename="{safe_filename}"'},
    )


@app.delete("/api/materials/{material_id}")
def delete_study_material(
    material_id: str,
    user: models.User = Depends(require_role("faculty", "hod")),
    db: Session = Depends(get_db),
):
    material = db.get(models.StudyMaterial, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Study material not found")
    stored_file = db.query(models.StoredFile).filter_by(material_id=material_id).first()
    if not stored_file or stored_file.uploaded_by_id != user.id:
        raise HTTPException(status_code=403, detail="Only the uploading faculty member may delete this material")
    try:
        get_storage().delete(stored_file.object_key)
    except StorageError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    db.delete(stored_file)
    db.delete(material)
    db.commit()
    return {"message": "Study material deleted"}

# -------------------------------------------------------------
# 7. ASSIGNMENT MANAGEMENT (FR-ASG-001 to 010)
# -------------------------------------------------------------

@app.post("/api/assignments")
def create_assignment(
    req: schemas.AssignmentCreateRequest,
    user: models.User = Depends(require_role("faculty", "hod")),
    db: Session = Depends(get_db),
):
    course = db.get(models.CourseModel, req.course_id)
    class_record = db.get(models.ClassModel, req.class_id)
    if not course or not class_record:
        raise HTTPException(status_code=400, detail="Unknown class or course")
    if user.role == "faculty" and not user.is_hod:
        authorized = db.query(models.ClassCourse).filter_by(
            class_id=req.class_id, course_id=req.course_id, faculty_id=user.id
        ).first()
        if not authorized:
            raise HTTPException(status_code=403, detail="Faculty is not assigned to this class and course")
    try:
        datetime.fromisoformat(req.due_date)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Due date must use ISO date or date-time format") from exc
    if req.marks <= 0:
        raise HTTPException(status_code=400, detail="Marks must be greater than zero")
    assignment = models.Assignment(
        id=f"ASG-{uuid.uuid4().hex[:12].upper()}",
        course_id=course.id,
        course_name=course.name,
        course_code=course.code,
        class_id=class_record.id,
        title=req.title.strip(),
        description=req.description.strip(),
        due_date=req.due_date,
        marks=req.marks,
        allow_late=req.allow_late,
        attachment_file=req.attachment_file,
        created_by=user.id,
    )
    if not assignment.title or not assignment.description:
        raise HTTPException(status_code=400, detail="Title and description are required")
    db.add(assignment)
    db.commit()
    return {"message": "Assignment published", "assignmentId": assignment.id}

@app.get("/api/assignments")
def list_assignments(
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    assignment_query = db.query(models.Assignment)
    if user.role == "student":
        assignment_query = assignment_query.filter(models.Assignment.class_id == user.class_id)
    elif user.role == "faculty":
        assignment_query = assignment_query.filter(models.Assignment.created_by == user.id)
    assignments = assignment_query.all()
    if user.role == "student":
        assignments = [
            assignment for assignment in assignments
            if student_is_eligible_for_course(db, user, assignment.course_id)
        ]
    student_id = user.id if user.role == "student" else None
    
    results = []
    for a in assignments:
        sub = None
        if student_id:
            sub = db.query(models.AssignmentSubmission).filter(
                models.AssignmentSubmission.assignment_id == a.id,
                models.AssignmentSubmission.student_id == student_id
            ).first()

        status_val = "pending" if user.role == "student" else "open"
        obtained_marks = None
        feedback = None
        submitted_at = None
        submission_file = None
        submission_text = None

        if sub:
            status_val = sub.status
            obtained_marks = sub.obtained_marks
            feedback = sub.feedback
            submitted_at = sub.submitted_at
            submission_file = sub.submission_file
            submission_text = sub.submission_text

        submission_count = db.query(models.AssignmentSubmission).filter_by(
            assignment_id=a.id
        ).count() if user.role != "student" else None
        pending_to_grade = db.query(models.AssignmentSubmission).filter(
            models.AssignmentSubmission.assignment_id == a.id,
            models.AssignmentSubmission.status.in_(["submitted", "late"]),
        ).count() if user.role != "student" else None
        if user.role != "student" and submission_count and pending_to_grade == 0:
            status_val = "graded"

        results.append({
            "id": a.id,
            "title": a.title,
            "course": a.course_name,
            "courseCode": a.course_code,
            "dueDate": a.due_date,
            "marks": a.marks,
            "status": status_val,
            "description": a.description,
            "submittedAt": submitted_at,
            "submissionFile": submission_file,
            "submissionText": submission_text,
            "obtainedMarks": obtained_marks,
            "feedback": feedback,
            "submissionCount": submission_count,
            "pendingToGrade": pending_to_grade,
            "classId": a.class_id,
            "courseId": a.course_id,
            "allowLate": a.allow_late,
        })
    return results


@app.get("/api/assignments/{assignment_id}/submissions")
def list_assignment_submissions(
    assignment_id: str,
    user: models.User = Depends(require_role("faculty", "hod")),
    db: Session = Depends(get_db),
):
    assignment = db.get(models.Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if user.role == "faculty" and not user.is_hod and assignment.created_by != user.id:
        raise HTTPException(status_code=403, detail="Faculty may view only their assignment submissions")
    submissions = db.query(models.AssignmentSubmission).filter_by(
        assignment_id=assignment.id
    ).order_by(models.AssignmentSubmission.student_name).all()
    return [{
        "id": submission.id,
        "studentId": submission.student_id,
        "studentName": submission.student_name,
        "submittedAt": submission.submitted_at,
        "submissionFile": submission.submission_file,
        "submissionText": submission.submission_text,
        "status": submission.status,
        "obtainedMarks": submission.obtained_marks,
        "feedback": submission.feedback,
        "gradedAt": submission.graded_at,
    } for submission in submissions]

@app.post("/api/assignments/{assignment_id}/submit")
def submit_assignment(
    assignment_id: str,
    req: schemas.AssignmentSubmitRequest,
    user: models.User = Depends(require_role("student")),
    db: Session = Depends(get_db),
):
    student_id = user.id
    student_name = user.name
    
    asg = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not asg:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if asg.class_id != user.class_id:
        raise HTTPException(status_code=403, detail="Assignment is outside the student's class")
    if not student_is_eligible_for_course(db, user, asg.course_id):
        raise HTTPException(status_code=403, detail="Assignment is outside the student's enrolled courses")
    if not (req.submission_file and req.submission_file.strip()) and not (
        req.submission_text and req.submission_text.strip()
    ):
        raise HTTPException(status_code=400, detail="Submission text or a file reference is required")

    now_str = utc_now().strftime("%Y-%m-%dT%H:%M:%S")
    sub_status = "submitted"
    try:
        deadline = datetime.fromisoformat(asg.due_date)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail="Assignment deadline is misconfigured") from exc
    if len(asg.due_date) == 10:
        deadline = deadline.replace(hour=23, minute=59, second=59)
    if utc_now() > deadline:
        if not asg.allow_late:
            raise HTTPException(status_code=409, detail="The submission deadline has passed")
        sub_status = "late"

    sub = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.assignment_id == assignment_id,
        models.AssignmentSubmission.student_id == student_id
    ).first()

    if sub:
        sub.submitted_at = now_str
        sub.submission_file = req.submission_file.strip() if req.submission_file else None
        sub.submission_text = req.submission_text.strip() if req.submission_text else None
        sub.status = sub_status
    else:
        sub = models.AssignmentSubmission(
            assignment_id=assignment_id,
            student_id=student_id,
            student_name=student_name,
            submitted_at=now_str,
            submission_file=req.submission_file.strip() if req.submission_file else None,
            submission_text=req.submission_text.strip() if req.submission_text else None,
            status=sub_status
        )
        db.add(sub)

    db.commit()
    return {"message": "Assignment submitted successfully", "status": sub_status}

@app.post("/api/assignments/submissions/{submission_id}/grade")
def grade_submission(
    submission_id: int,
    req: schemas.GradeSubmissionRequest,
    user: models.User = Depends(require_role("faculty", "hod")),
    db: Session = Depends(get_db),
):
    sub = db.query(models.AssignmentSubmission).filter(models.AssignmentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    assignment = db.query(models.Assignment).filter(models.Assignment.id == sub.assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if user.role == "faculty" and not user.is_hod and assignment.created_by != user.id:
        raise HTTPException(status_code=403, detail="Faculty may grade only their assignments")
    if req.marks < 0 or req.marks > assignment.marks:
        raise HTTPException(status_code=400, detail="Marks must be within the assignment maximum")

    sub.obtained_marks = req.marks
    sub.feedback = req.feedback
    sub.status = "graded"
    sub.graded_by = user.name
    sub.graded_at = utc_now().strftime("%Y-%m-%dT%H:%M:%S")
    db.commit()

    # Generate student notification
    notif = models.Notification(
        id=f"N_{uuid.uuid4().hex[:6]}",
        user_id=sub.student_id,
        message=f"Your assignment submission has been graded. Marks: {req.marks}",
        type="info",
        icon="assignment",
        time_ago="Just now"
    )
    db.add(notif)
    db.commit()

    return {"message": "Submission graded successfully"}

# -------------------------------------------------------------
# 8. QUIZ & TEST MANAGEMENT (FR-QUIZ-001 to 010)
# -------------------------------------------------------------

@app.get("/api/quizzes")
def list_quizzes(
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.Quiz)
    if user.role == "student":
        query = query.filter(models.Quiz.is_released == True)
    elif user.role == "faculty":
        query = query.filter(models.Quiz.is_released == True)
    quizzes = query.all()
    if user.role == "student":
        quizzes = [quiz for quiz in quizzes if student_can_access_quiz(db, user, quiz)]
    elif user.role == "faculty":
        direct_assignments = db.query(models.ClassCourse).filter_by(faculty_id=user.id).all()
        quizzes = [
            quiz for quiz in quizzes
            if quiz.created_by == user.id or any(
                assignment.course_id == quiz.course_id
                and assignment.class_id in quiz_class_ids(db, quiz)
                for assignment in direct_assignments
            )
        ]
    results = []
    now = utc_now()
    for q in quizzes:
        question_count = db.query(models.QuizQuestion).filter(models.QuizQuestion.quiz_id == q.id).count()
        attempts_used = db.query(models.QuizAttempt).filter_by(
            quiz_id=q.id, student_id=user.id
        ).count() if user.role == "student" else None
        try:
            opens_at = datetime.fromisoformat(q.opens_at)
            closes_at = datetime.fromisoformat(q.closes_at)
            if now < opens_at:
                quiz_status = "upcoming"
            elif now > closes_at or (attempts_used is not None and attempts_used >= q.max_attempts):
                quiz_status = "completed"
            else:
                quiz_status = "available"
        except ValueError:
            quiz_status = "misconfigured"
        results.append({
            "id": q.id,
            "title": q.title,
            "course": q.course_name,
            "courseCode": q.course_code,
            "questions": question_count,
            "duration": q.duration_minutes,
            "opens": q.opens_at,
            "closes": q.closes_at,
            "status": quiz_status,
            "topics": json.loads(q.topics_json),
            "attemptsUsed": attempts_used,
            "maxAttempts": q.max_attempts,
            "canAttempt": user.role == "student" and quiz_status == "available",
            "isReleased": q.is_released,
        })
    return results

@app.get("/api/quizzes/{quiz_id}/questions")
def get_quiz_questions(
    quiz_id: str,
    user: models.User = Depends(require_role("student", "faculty", "hod")),
    db: Session = Depends(get_db),
):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if user.role == "student":
        if not student_can_access_quiz(db, user, quiz):
            raise HTTPException(status_code=403, detail="Quiz is outside the student's enrolled courses")
    elif not user.is_hod:
        if not faculty_can_manage_quiz(db, user, quiz):
            raise HTTPException(status_code=403, detail="Faculty is not assigned to this quiz")
    now = utc_now()
    try:
        opens_at = datetime.fromisoformat(quiz.opens_at)
        closes_at = datetime.fromisoformat(quiz.closes_at)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail="Quiz availability is misconfigured") from exc
    if user.role == "student":
        if now < opens_at or now > closes_at:
            raise HTTPException(status_code=409, detail="Quiz is not currently available")
        attempts = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.quiz_id == quiz_id,
            models.QuizAttempt.student_id == user.id,
        ).count()
        if attempts >= quiz.max_attempts:
            raise HTTPException(status_code=409, detail="Quiz attempt limit reached")
    questions = db.query(models.QuizQuestion).filter(models.QuizQuestion.quiz_id == quiz_id).all()
    return [{
        "id": q.id,
        "question": q.question_text,
        "options": json.loads(q.options_json),
        "topic": q.topic,
        "marks": q.marks,
        **({"correctOption": q.correct_option} if user.role != "student" else {}),
    } for q in questions]


@app.get("/api/quizzes/{quiz_id}/attempts")
def list_quiz_attempts(
    quiz_id: str,
    user: models.User = Depends(require_role("faculty", "hod")),
    db: Session = Depends(get_db),
):
    quiz = db.get(models.Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if not faculty_can_manage_quiz(db, user, quiz):
        raise HTTPException(status_code=403, detail="Faculty is not assigned to this quiz")
    attempts = db.query(models.QuizAttempt, models.User).join(
        models.User, models.User.id == models.QuizAttempt.student_id
    ).filter(models.QuizAttempt.quiz_id == quiz_id).order_by(
        models.QuizAttempt.submitted_at.desc()
    ).all()
    return [{
        "id": attempt.id,
        "studentId": attempt.student_id,
        "studentName": student.name,
        "submittedAt": attempt.submitted_at,
        "score": attempt.score,
        "total": attempt.total_marks,
        "percentage": round(attempt.score / attempt.total_marks * 100, 1)
        if attempt.total_marks else 0.0,
    } for attempt, student in attempts]

@app.post("/api/quizzes/{quiz_id}/submit")
def submit_quiz_attempt(
    quiz_id: str,
    req: schemas.QuizSubmitRequest,
    user: models.User = Depends(require_role("student")),
    db: Session = Depends(get_db),
):
    student_id = user.id
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if not student_can_access_quiz(db, user, quiz):
        raise HTTPException(status_code=403, detail="Quiz is outside the student's enrolled courses")
    now = utc_now()
    try:
        opens_at = datetime.fromisoformat(quiz.opens_at)
        closes_at = datetime.fromisoformat(quiz.closes_at)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail="Quiz availability is misconfigured") from exc
    if now < opens_at or now > closes_at:
        raise HTTPException(status_code=409, detail="Quiz is not currently available")
    attempt_count = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.quiz_id == quiz_id,
        models.QuizAttempt.student_id == student_id,
    ).count()
    if attempt_count >= quiz.max_attempts:
        raise HTTPException(status_code=409, detail="Quiz attempt limit reached")
    questions = db.query(models.QuizQuestion).filter(models.QuizQuestion.quiz_id == quiz_id).all()
    if not questions:
        raise HTTPException(status_code=409, detail="Quiz has no questions")

    correct_count = 0
    total_questions = len(questions)
    answers = req.answers

    topic_correct: Dict[str, int] = {}
    topic_total: Dict[str, int] = {}

    for q in questions:
        topic = q.topic or "General"
        topic_total[topic] = topic_total.get(topic, 0) + 1
        chosen = answers.get(str(q.id))
        if chosen is not None and chosen == q.correct_option:
            correct_count += 1
            topic_correct[topic] = topic_correct.get(topic, 0) + 1

    score = sum(
        question.marks
        for question in questions
        if answers.get(str(question.id)) == question.correct_option
    )
    total_marks = sum(question.marks for question in questions)

    # Save attempt deterministically per FR-QUIZ-006
    attempt = models.QuizAttempt(
        quiz_id=quiz_id,
        student_id=student_id,
        started_at=utc_now() - timedelta(minutes=10),
        submitted_at=utc_now(),
        answers_json=json.dumps(answers),
        score=score,
        total_marks=total_marks,
        is_auto_submitted=req.is_auto_submitted
    )
    db.add(attempt)
    db.commit()

    # Generate AI Report per Section 4.17
    pct = round((score / total_marks * 100), 1) if total_marks > 0 else 0
    topic_breakdown = []
    strengths = []
    improvements = []
    
    for t, tot in topic_total.items():
        corr = topic_correct.get(t, 0)
        t_pct = int(corr / tot * 100)
        topic_breakdown.append({"topic": t, "score": t_pct, "questions": tot})
        if t_pct >= 75:
            strengths.append(t)
        else:
            improvements.append(t)

    ai_rep = models.AIReport(
        quiz_id=quiz_id,
        student_id=student_id,
        score=pct,
        total=100.0,
        correct_count=correct_count,
        incorrect_count=sum(1 for question in questions if str(question.id) in answers) - correct_count,
        unattempted_count=sum(1 for question in questions if str(question.id) not in answers),
        strengths_json=json.dumps(strengths or ["Core fundamental concepts"]),
        improvements_json=json.dumps(improvements or ["Revision of edge cases"]),
        suggestions_json=json.dumps([
            "Review key topics from Unit lectures",
            "Solve 5 practice problems from recommended textbooks",
            "Re-attempt past quizzes for active recall"
        ]),
        topic_performance_json=json.dumps(topic_breakdown),
        status="Ready"
    )
    db.add(ai_rep)
    db.commit()

    return {
        "score": score,
        "total": total_marks,
        "percentage": pct,
        "message": "Quiz submitted and evaluated successfully"
    }

# -------------------------------------------------------------
# 9. AI TEST PERFORMANCE REPORT (FR-AI-001 to 008)
# -------------------------------------------------------------

@app.get("/api/performance-insights")
def get_performance_insights(
    course_id: Optional[str] = None,
    user: models.User = Depends(require_role("student")),
    db: Session = Depends(get_db),
):
    if course_id:
        if not student_is_eligible_for_course(db, user, course_id):
            raise HTTPException(status_code=403, detail="Course access is not permitted")
    return build_topic_performance_insights(
        db,
        student_id=user.id,
        course_id=course_id,
    )

@app.get("/api/ai-report/{quiz_id}")
def get_ai_report(
    quiz_id: str,
    user: models.User = Depends(require_role("student")),
    db: Session = Depends(get_db),
):
    student_id = user.id
    report = db.query(models.AIReport).filter(
        models.AIReport.quiz_id == quiz_id,
        models.AIReport.student_id == student_id
    ).order_by(models.AIReport.created_at.desc()).first()

    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="No performance insight is available for this quiz",
        )
        # Fallback to seeded demo report
        return {
            "quizId": quiz_id,
            "quizTitle": quiz.title if quiz else "Quiz Evaluation",
            "score": 78,
            "correct": 7,
            "incorrect": 2,
            "unattempted": 1,
            "total": 10,
            "strengths": ["SQL Joins", "Normalization concepts", "Relational integrity"],
            "improvements": ["Indexing (B+ tree, Hash)", "Transaction isolation levels", "Query optimization"],
            "suggestions": [
                "Review B+ tree and Hash index structures with practice problems",
                "Practice transaction isolation level scenarios — Read Committed vs Serializable",
                "Work through 5–8 query optimization examples from the textbook",
                "Attempt previous year questions on indexing"
            ],
            "topicPerformance": [
                {"topic": "Normalization", "score": 92, "questions": 3},
                {"topic": "SQL Joins", "score": 88, "questions": 2},
                {"topic": "Transactions", "score": 65, "questions": 2},
                {"topic": "Indexing", "score": 61, "questions": 2},
                {"topic": "Referential Integrity", "score": 100, "questions": 1}
            ],
            "status": "Ready"
        }

    return {
        "quizId": report.quiz_id,
        "quizTitle": quiz.title if quiz else "Quiz Performance",
        "score": report.score,
        "correct": report.correct_count,
        "incorrect": report.incorrect_count,
        "unattempted": report.unattempted_count,
        "total": report.total,
        "strengths": json.loads(report.strengths_json),
        "improvements": json.loads(report.improvements_json),
        "suggestions": json.loads(report.suggestions_json),
        "topicPerformance": json.loads(report.topic_performance_json),
        "status": report.status
    }

# -------------------------------------------------------------
# 10. RESULTS & PERFORMANCE (FR-RESULT-001 to 006)
# -------------------------------------------------------------

@app.get("/api/results")
def get_results(
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "student":
        return []
    course_ids = {
        row.course_id for row in db.query(models.ClassCourse).filter(
            models.ClassCourse.class_id == user.class_id
        ).all()
    }
    results = []
    courses = (
        db.query(models.CourseModel).filter(models.CourseModel.id.in_(course_ids)).all()
        if course_ids
        else []
    )
    for course in courses:
        assignments = db.query(models.Assignment).filter(
            models.Assignment.course_id == course.id,
            models.Assignment.class_id == user.class_id,
        ).all()
        assignment_percentages = []
        for assignment in assignments:
            submission = db.query(models.AssignmentSubmission).filter(
                models.AssignmentSubmission.assignment_id == assignment.id,
                models.AssignmentSubmission.student_id == user.id,
                models.AssignmentSubmission.obtained_marks.isnot(None),
            ).first()
            if submission and assignment.marks:
                assignment_percentages.append(submission.obtained_marks / assignment.marks * 100)

        quizzes = db.query(models.Quiz).filter(
            models.Quiz.course_id == course.id,
            or_(
                models.Quiz.class_id == user.class_id,
                models.Quiz.id.in_(
                    db.query(models.QuizClassMembership.quiz_id).filter(
                        models.QuizClassMembership.class_id == user.class_id
                    )
                ),
            ),
        ).all()
        attempts = []
        for quiz in quizzes:
            attempts.extend(db.query(models.QuizAttempt).filter(
                models.QuizAttempt.quiz_id == quiz.id,
                models.QuizAttempt.student_id == user.id,
            ).all())
        attempts.sort(key=lambda attempt: attempt.submitted_at)
        quiz_percentages = [
            attempt.score / attempt.total_marks * 100
            for attempt in attempts
            if attempt.total_marks
        ]
        assignment_average = round(sum(assignment_percentages) / len(assignment_percentages), 1) if assignment_percentages else None
        quiz_average = round(sum(quiz_percentages) / len(quiz_percentages), 1) if quiz_percentages else None
        available = [value for value in (assignment_average, quiz_average) if value is not None]
        overall_average = round(sum(available) / len(available), 1) if available else None
        trend = "insufficient-data"
        if len(quiz_percentages) >= 2:
            difference = quiz_percentages[-1] - quiz_percentages[-2]
            trend = "up" if difference > 2 else "down" if difference < -2 else "stable"
        results.append({
            "course": course.code,
            "name": course.name,
            "assignments": assignment_average,
            "quizzes": quiz_average,
            "average": overall_average,
            "trend": trend,
            "isDemo": any(quiz.is_demo for quiz in quizzes) or any(assignment.is_demo for assignment in assignments),
        })
    return results

# -------------------------------------------------------------
# 11. DASHBOARDS (FR-DASH-001 to 005)
# -------------------------------------------------------------

@app.get("/api/dashboard/stats")
def get_dashboard_stats(
    role: Optional[str] = None,
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    if role and role != user.role and not user.is_hod:
        raise HTTPException(status_code=403, detail="Dashboard role does not match the authenticated account")
    if user.is_hod and role in {"hod", "admin"}:
        students = db.query(models.StudentRecord).all()
        attendance_rows = db.query(models.Attendance, models.StudentRecord).join(
            models.StudentRecord, models.StudentRecord.id == models.Attendance.student_id
        ).all()
        class_counts: dict[str, dict[str, int]] = {}
        for attendance, student in attendance_rows:
            bucket = class_counts.setdefault(student.class_id, {"present": 0, "total": 0})
            bucket["total"] += 1
            if attendance.status == "Present":
                bucket["present"] += 1
        classwise = [{
            "classId": class_id,
            "students": sum(1 for student in students if student.class_id == class_id),
            "attendancePercentage": round(values["present"] / values["total"] * 100, 1)
            if values["total"] else 0.0,
        } for class_id, values in sorted(class_counts.items())]
        total_present = sum(values["present"] for values in class_counts.values())
        total_records = sum(values["total"] for values in class_counts.values())
        faculty_summaries = []
        for faculty in db.query(models.User).filter_by(role="faculty").order_by(models.User.name):
            assigned = db.query(models.ClassCourse).filter_by(faculty_id=faculty.id).all()
            faculty_summaries.append({
                "id": faculty.id,
                "name": faculty.name,
                "classes": len({item.class_id for item in assigned}),
                "courses": len({item.course_id for item in assigned}),
            })
        performance = []
        for course in db.query(models.CourseModel).order_by(models.CourseModel.code):
            attempts = db.query(models.QuizAttempt).join(
                models.Quiz, models.Quiz.id == models.QuizAttempt.quiz_id
            ).filter(models.Quiz.course_id == course.id).all()
            percentages = [
                attempt.score / attempt.total_marks * 100
                for attempt in attempts if attempt.total_marks
            ]
            performance.append({
                "course": course.code,
                "name": course.name,
                "average": round(sum(percentages) / len(percentages), 1) if percentages else None,
                "attempts": len(percentages),
            })
        defaulter_count = sum(1 for student in students if any(
            item["percentage"] < DEFAULT_LOW_ATTENDANCE_THRESHOLD
            for item in get_student_attendance(user=db.get(models.User, student.id), db=db)["courses"]
            if item["total"] > 0
        ))
        return {
            "totalStudents": len(students),
            "totalFaculty": db.query(models.User).filter_by(role="faculty").count(),
            "totalClasses": db.query(models.ClassModel).count(),
            "departmentAttendance": round(total_present / total_records * 100, 1)
            if total_records else 0.0,
            "defaulters": defaulter_count,
            "pendingGrievances": db.query(models.Grievance).filter(
                models.Grievance.status.notin_(["RESOLVED", "CLOSED"])
            ).count(),
            "classwiseAttendance": classwise,
            "subjectPerformance": performance,
            "facultySummaries": faculty_summaries,
        }
    if user.role == "admin":
        return {
            "totalStudents": db.query(models.StudentRecord).count(),
            "totalFaculty": db.query(models.User).filter(models.User.role == "faculty").count(),
            "totalClasses": db.query(models.ClassModel).count(),
            "totalCourses": db.query(models.CourseModel).count(),
            "totalClassrooms": db.query(models.Classroom).count(),
            "pendingGrievances": db.query(models.Grievance).filter(
                models.Grievance.status.notin_(["RESOLVED", "CLOSED"])
            ).count(),
            "upcomingEvents": db.query(models.CouncilEvent).count(),
        }
    if user.role == "faculty":
        attendance_payload = get_faculty_attendance(user=user, db=db)
        assignments = db.query(models.ClassCourse).filter(models.ClassCourse.faculty_id == user.id)
        assignment_rows = assignments.all()
        today = utc_now().strftime("%A")
        timetable = get_timetable(day=today, user=user, db=db)
        return {
            **attendance_payload["stats"],
            "assignedClasses": sorted({item.class_id for item in assignment_rows}),
            "assignedCourses": [{
                "classId": item.class_id,
                "courseId": item.course_id,
                "courseName": (db.get(models.CourseModel, item.course_id).name
                    if db.get(models.CourseModel, item.course_id) else item.course_id),
            } for item in assignment_rows],
            "todaySchedule": timetable.get(today, []),
            "defaulterSummary": attendance_payload["defaulters"][:8],
            "recentAnnouncements": list_announcements(user=user, db=db)[:5],
        }
    if user.role == "student":
        attendance = get_student_attendance(user=user, db=db)
        assignments = list_assignments(user=user, db=db)
        quizzes = list_quizzes(user=user, db=db)
        results = get_results(user=user, db=db)
        averages = [item["average"] for item in results if item["average"] is not None]
        today = utc_now().strftime("%A")
        timetable = get_timetable(day=today, user=user, db=db)
        elective = elective_for_student(db, user.id)
        return {
            "firstName": student_first_name(user),
            "attendancePercentage": attendance["overallPercentage"],
            "isAttendanceDefaulter": attendance["isOverallDefaulter"],
            "pendingAssignments": len([assignment for assignment in assignments if assignment["status"] in {"pending", "late"}]),
            "activeQuizzes": len([quiz for quiz in quizzes if quiz["status"] in {"available", "upcoming"}]),
            "academicAverage": round(sum(averages) / len(averages), 1) if averages else None,
            "subjectAttendance": attendance["courses"],
            "todaySchedule": timetable.get(today, []),
            "upcomingAssignments": [assignment for assignment in assignments if assignment["status"] in {"pending", "late"}][:5],
            "upcomingQuizzes": [quiz for quiz in quizzes if quiz["status"] in {"available", "upcoming"}][:5],
            "recentAnnouncements": list_announcements(user=user, db=db)[:5],
            "elective": ({"courseId": elective.course_id, "batch": elective.batch_code} if elective else None),
        }
    return {"upcomingEvents": db.query(models.CouncilEvent).count()}

# -------------------------------------------------------------
# 12. ANNOUNCEMENTS & NOTIFICATIONS (FR-NOTIF-001 to 006)
# -------------------------------------------------------------

@app.get("/api/announcements")
def list_announcements(
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.Announcement)
    if user.role == "student":
        query = query.filter(models.Announcement.audience.in_(["College", user.class_id]))
    items = query.order_by(models.Announcement.date.desc()).all()
    return [{
        "id": a.id,
        "title": a.title,
        "publisher": a.publisher_name,
        "publisherRole": a.publisher_role,
        "date": a.date,
        "audience": a.audience,
        "content": a.content,
        "attachment": a.attachment,
        "type": a.type
    } for a in items]

@app.post("/api/announcements")
def create_announcement(
    req: schemas.AnnouncementCreateRequest,
    user: models.User = Depends(require_role("faculty", "hod", "admin")),
    db: Session = Depends(get_db),
):
    ann = models.Announcement(
        id=f"AN{uuid.uuid4().hex[:4].upper()}",
        title=req.title,
        content=req.content,
        publisher_name=user.name,
        publisher_role="HOD" if user.is_hod else user.role.title(),
        date=utc_now().strftime("%Y-%m-%d"),
        audience=req.audience,
        attachment=req.attachment,
        type=req.type
    )
    db.add(ann)

    # Notify users
    notif = models.Notification(
        id=f"N_{uuid.uuid4().hex[:6]}",
        message=f"New announcement: {req.title}",
        type="default",
        icon="announcement",
        time_ago="Just now"
    )
    db.add(notif)
    db.commit()

    return {"message": "Announcement published successfully"}

@app.get("/api/notifications")
def list_notifications(
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    notifs = db.query(models.Notification).filter(
        or_(models.Notification.user_id == user.id, models.Notification.user_id.is_(None))
    ).order_by(models.Notification.created_at.desc()).all()
    return [{
        "id": n.id,
        "message": n.message,
        "type": n.type,
        "read": n.read,
        "time": n.time_ago,
        "icon": n.icon
    } for n in notifs]

@app.post("/api/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    n = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        or_(models.Notification.user_id == user.id, models.Notification.user_id.is_(None)),
    ).first()
    if n:
        n.read = True
        db.commit()
    return {"message": "Notification marked as read"}

# -------------------------------------------------------------
# 13. CALENDAR & COUNCIL EVENTS (FR-EVENT, FR-CAL)
# -------------------------------------------------------------

@app.get("/api/calendar")
def list_calendar(
    category: Optional[str] = None,
    _user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.CalendarEntry)
    if category and category != "All":
        query = query.filter(models.CalendarEntry.category == category)
    items = query.all()
    return [{
        "id": c.id,
        "title": c.title,
        "category": c.category,
        "date": c.date,
        "time": c.time,
        "description": c.description
    } for c in items]

@app.get("/api/events")
def list_events(
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.CouncilEvent)
    if user.role not in {"council", "admin"}:
        query = query.filter(models.CouncilEvent.visibility == "College Wide")
    items = query.all()
    return [{
        "id": e.id,
        "title": e.title,
        "council": e.council,
        "date": e.date,
        "startTime": e.start_time,
        "endTime": e.end_time,
        "venue": e.venue,
        "description": e.description,
        "organizer": e.organizer,
        "registrationLink": e.registration_link,
        "visibility": e.visibility
    } for e in items]

@app.post("/api/events")
def create_event(
    req: schemas.CouncilEventCreateRequest,
    user: models.User = Depends(require_role("council")),
    db: Session = Depends(get_db),
):
    event_id = f"EV{uuid.uuid4().hex[:4].upper()}"
    ev = models.CouncilEvent(
        id=event_id,
        title=req.title,
        council=req.council,
        date=req.date,
        start_time=req.start_time,
        end_time=req.end_time,
        venue=req.venue,
        description=req.description,
        organizer=req.organizer,
        registration_link=req.registration_link,
        visibility=req.visibility,
        created_by=user.id
    )
    db.add(ev)

    # FR-EVENT-005: Auto-create calendar entry
    cal = models.CalendarEntry(
        title=req.title,
        category="Events",
        date=req.date,
        time=f"{req.start_time}–{req.end_time}",
        description=req.description,
        event_id=event_id
    )
    db.add(cal)

    # FR-EVENT-006: Auto-generate announcement
    ann = models.Announcement(
        id=f"AN{uuid.uuid4().hex[:4].upper()}",
        title=req.title,
        content=f"{req.description}\n\nVenue: {req.venue}\nTime: {req.start_time} - {req.end_time}",
        publisher_name=req.council,
        publisher_role="Council",
        date=req.date,
        audience="College",
        type="Events"
    )
    db.add(ann)

    db.commit()
    return {"message": "Event published with automatic calendar entry and announcement", "eventId": event_id}

# -------------------------------------------------------------
# 14. DISCUSSION FORUMS (FR-FORUM-001 to 004)
# -------------------------------------------------------------

def ensure_forum_access(topic: models.ForumTopic, user: models.User, db: Session) -> None:
    """Enforce course membership before exposing a topic or its replies."""
    if user.role in {"admin", "council"} or user.is_hod:
        return
    query = db.query(models.ClassCourse).filter(models.ClassCourse.course_id == topic.course_id)
    if user.role == "student":
        allowed = query.filter(models.ClassCourse.class_id == user.class_id).first()
        if allowed and not student_is_eligible_for_course(db, user, topic.course_id):
            allowed = None
    elif user.role == "faculty":
        allowed = query.filter(models.ClassCourse.faculty_id == user.id).first()
    else:
        allowed = None
    if not allowed:
        raise HTTPException(status_code=403, detail="Course forum access is not permitted")

@app.get("/api/forums")
def list_forums(
    course_code: Optional[str] = None,
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    allowed_course_ids: Optional[set[str]] = None
    if user.role == "student":
        allowed_course_ids = {
            row.course_id for row in db.query(models.ClassCourse).filter(
                models.ClassCourse.class_id == user.class_id
            ).all()
        }
        allowed_course_ids = {
            value for value in allowed_course_ids
            if student_is_eligible_for_course(db, user, value)
        }
    elif user.role == "faculty":
        allowed_course_ids = {
            row.course_id for row in db.query(models.ClassCourse).filter(
                models.ClassCourse.faculty_id == user.id
            ).all()
        }
    query = db.query(models.ForumTopic)
    if allowed_course_ids is not None:
        query = query.filter(models.ForumTopic.course_id.in_(allowed_course_ids))
    if course_code:
        query = query.filter(models.ForumTopic.course_code == course_code)
    topics = query.order_by(models.ForumTopic.pinned.desc()).all()
    return [{
        "id": t.id,
        "course": t.course_code,
        "courseCode": t.course_code,
        "title": t.title,
        "author": t.author_name,
        "authorId": t.author_id,
        "createdAt": t.created_at,
        "replies": t.replies_count,
        "lastReply": t.last_reply,
        "pinned": t.pinned,
        "content": t.content
    } for t in topics]

@app.post("/api/forums")
def create_forum_topic(
    req: schemas.ForumTopicCreateRequest,
    user: models.User = Depends(require_role("student", "faculty", "hod")),
    db: Session = Depends(get_db),
):
    if user.role == "student":
        authorized = student_is_eligible_for_course(db, user, req.course_id)
    else:
        authorized = db.query(models.ClassCourse).filter(
            models.ClassCourse.course_id == req.course_id,
            models.ClassCourse.faculty_id == user.id,
        ).first() or user.is_hod
    if not authorized:
        raise HTTPException(status_code=403, detail="Course forum access is not permitted")
    now_str = utc_now().strftime("%Y-%m-%d %H:%M")
    topic = models.ForumTopic(
        id=f"F{uuid.uuid4().hex[:4].upper()}",
        course_id=req.course_id,
        course_code=req.course_id,
        title=req.title,
        content=req.content,
        author_id=user.id,
        author_name=user.name,
        created_at=now_str,
        pinned=False,
        replies_count=0,
        last_reply="Just now"
    )
    db.add(topic)
    db.commit()
    return {"message": "Discussion topic created successfully", "topicId": topic.id}

@app.get("/api/forums/{topic_id}/replies")
def get_forum_replies(
    topic_id: str,
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    topic = db.query(models.ForumTopic).filter(models.ForumTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    ensure_forum_access(topic, user, db)
    replies = db.query(models.ForumReply).filter(models.ForumReply.topic_id == topic_id).order_by(models.ForumReply.created_at.asc()).all()
    return [{
        "id": r.id,
        "author": r.author_name,
        "role": r.author_role,
        "content": r.content,
        "createdAt": r.created_at
    } for r in replies]

@app.post("/api/forums/{topic_id}/replies")
def post_forum_reply(
    topic_id: str,
    req: schemas.ForumReplyCreateRequest,
    user: models.User = Depends(require_role("student", "faculty", "hod")),
    db: Session = Depends(get_db),
):
    topic = db.query(models.ForumTopic).filter(models.ForumTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    ensure_forum_access(topic, user, db)

    reply = models.ForumReply(
        topic_id=topic_id,
        author_id=user.id,
        author_name=user.name,
        author_role="HOD" if user.is_hod else user.role.title(),
        content=req.content,
        created_at=utc_now().strftime("%Y-%m-%d %H:%M")
    )
    db.add(reply)
    topic.replies_count += 1
    topic.last_reply = "Just now"
    db.commit()
    return {"message": "Reply posted successfully"}

# -------------------------------------------------------------
# 15. FEEDBACK & GRIEVANCE MANAGEMENT (FR-GRV-001 to 007)
# -------------------------------------------------------------

@app.get("/api/grievances")
def list_grievances(
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.Grievance)
    if user.role == "student":
        # Scoped to student per FR-GRV-006
        query = query.filter(models.Grievance.student_id == user.id)
    elif user.role != "admin" and not user.is_hod:
        raise HTTPException(status_code=403, detail="Grievance access is not permitted")
    items = query.order_by(models.Grievance.submitted_at.desc()).all()
    return [{
        "id": g.id,
        "subject": g.subject,
        "category": g.category,
        "submittedAt": g.submitted_at,
        "status": g.status,
        "lastUpdated": g.last_updated,
        "description": g.description,
        "resolution": g.resolution,
        "studentName": g.student_name,
        "studentId": g.student_id,
        "assignedTo": g.assigned_to
    } for g in items]

@app.post("/api/grievances")
def submit_grievance(
    req: schemas.GrievanceCreateRequest,
    user: models.User = Depends(require_role("student")),
    db: Session = Depends(get_db),
):
    today_str = utc_now().strftime("%Y-%m-%d")
    gr = models.Grievance(
        id=f"GR{uuid.uuid4().hex[:4].upper()}",
        student_id=user.id,
        student_name=user.name,
        subject=req.subject,
        category=req.category,
        description=req.description,
        attachment=req.attachment,
        status="SUBMITTED",
        submitted_at=today_str,
        last_updated=today_str
    )
    db.add(gr)
    db.commit()
    return {"message": "Grievance submitted successfully", "grievanceId": gr.id}

@app.patch("/api/grievances/{grievance_id}")
def update_grievance(
    grievance_id: str,
    req: schemas.GrievanceUpdateRequest,
    user: models.User = Depends(require_role("admin", "hod")),
    db: Session = Depends(get_db),
):
    gr = db.query(models.Grievance).filter(models.Grievance.id == grievance_id).first()
    if not gr:
        raise HTTPException(status_code=404, detail="Grievance not found")

    allowed_statuses = {"SUBMITTED", "ASSIGNED", "UNDER REVIEW", "IN PROGRESS", "RESOLVED", "CLOSED"}
    normalized_status = req.status.strip().upper()
    if normalized_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Unsupported grievance status")

    gr.status = normalized_status
    gr.last_updated = utc_now().strftime("%Y-%m-%d")
    if req.resolution:
        gr.resolution = req.resolution
    if req.assigned_to:
        gr.assigned_to = req.assigned_to

    # Log audit per NFR-SEC-008
    audit = models.AuditLog(
        user_id=user.id,
        action="GRIEVANCE_UPDATED",
        resource=f"Grievance:{grievance_id}",
        details=f"Status set to {normalized_status}"
    )
    db.add(audit)
    db.commit()
    return {"message": "Grievance updated successfully"}

# -------------------------------------------------------------
# ROOT & HEALTH CHECK
# -------------------------------------------------------------

@app.get("/api/health", include_in_schema=False)
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "healthy"}

@app.get("/")
def root():
    return {
        "app": "SmartClass API",
        "version": "1.0.0",
        "status": "online",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
