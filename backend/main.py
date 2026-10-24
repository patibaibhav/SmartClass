import json
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, status, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import engine, get_db, Base
import models
import schemas
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_current_user, require_role,
    check_account_lockout, record_failed_attempt, record_successful_login,
    generate_salt
)
from config import APP_ENV, DEFAULT_LOW_ATTENDANCE_THRESHOLD

# Initialize tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartClass API",
    description="Integrated Academic and Classroom Management Platform API (SRS v1.0 Compliant)",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# 1. AUTHENTICATION & ACCESS CONTROL (FR-AUTH-001 to 012)
# -------------------------------------------------------------

@app.post("/api/auth/login")
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == req.user_id).first()
    if not user:
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
            "message": "Temporary password detected. Please change your password to continue.",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "department": user.department,
                "class": user.class_id,
                "firstLogin": True
            }
        }

    record_successful_login(user, db)
    token = create_access_token(data={"sub": user.id, "role": user.role, "isHOD": user.is_hod})

    return {
        "phase": "login",
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "isHOD": user.is_hod,
            "department": user.department,
            "class": user.class_id,
            "firstLogin": False
        }
    }

@app.post("/api/auth/first-login")
def first_login(req: schemas.FirstLoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    if not any(c.isupper() for c in req.new_password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter.")
    if not any(c.isdigit() for c in req.new_password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number.")
    if req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    # Update password and disable first_login flag
    new_salt = generate_salt()
    user.salt = new_salt
    user.password_hash = hash_password(req.new_password, new_salt)
    user.first_login = False
    db.commit()

    record_successful_login(user, db)
    token = create_access_token(data={"sub": user.id, "role": user.role, "isHOD": user.is_hod})

    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "isHOD": user.is_hod,
            "department": user.department,
            "class": user.class_id,
            "firstLogin": False
        }
    }

@app.post("/api/auth/change-password")
def change_password(req: schemas.ChangePasswordRequest, current_user: models.User = Depends(require_current_user), db: Session = Depends(get_db)):
    if not verify_password(req.current_password, current_user.salt, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password incorrect.")

    if len(req.new_password) < 8 or not any(c.isupper() for c in req.new_password) or not any(c.isdigit() for c in req.new_password):
        raise HTTPException(status_code=400, detail="New password does not meet security criteria.")
    if req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    current_user.salt = generate_salt()
    current_user.password_hash = hash_password(req.new_password, current_user.salt)
    db.commit()

    return {"message": "Password changed successfully."}

@app.get("/api/auth/me")
def get_current_user_profile(user: models.User = Depends(require_current_user)):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "isHOD": user.is_hod,
        "department": user.department,
        "class": user.class_id,
        "firstLogin": user.first_login
    }

@app.post("/api/auth/logout")
def logout(user: Optional[models.User] = Depends(get_current_user), db: Session = Depends(get_db)):
    if user:
        audit = models.AuditLog(user_id=user.id, action="LOGOUT", resource="User", details="User logged out.")
        db.add(audit)
        db.commit()
    return {"message": "Logged out successfully"}

# -------------------------------------------------------------
# 2. CLASS & COURSE MANAGEMENT (FR-CLASS-001 to 010)
# -------------------------------------------------------------

@app.get("/api/academic/classes")
def list_classes(db: Session = Depends(get_db)):
    classes = db.query(models.ClassModel).filter(models.ClassModel.is_active == True).all()
    return [{"id": c.id, "name": c.name, "department": c.department} for c in classes]

@app.get("/api/academic/courses")
def list_courses(db: Session = Depends(get_db)):
    courses = db.query(models.CourseModel).filter(models.CourseModel.is_active == True).all()
    return [{
        "id": c.id,
        "code": c.code,
        "name": c.name,
        "department": c.department,
        "credits": c.credits
    } for c in courses]

@app.get("/api/academic/faculty")
def list_faculty(db: Session = Depends(get_db)):
    faculty = db.query(models.User).filter(models.User.role == "faculty").order_by(models.User.name.asc()).all()
    return [{
        "id": f.id,
        "name": f.name,
        "initials": f.initials,
        "department": f.department,
        "isHOD": f.is_hod,
        "email": f.email
    } for f in faculty]

@app.get("/api/academic/my-class")
def get_my_class(
    class_id: Optional[str] = Query(None),
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    if user.role == "student":
        # FR: Students can only view their own class
        if class_id and class_id != user.class_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can only view their own class."
            )
        target_class_id = user.class_id
    else:
        # Faculty / Admin / Council can specify class_id, defaulting to user's class or D12A
        target_class_id = class_id or user.class_id or "D12A"

    cls = db.query(models.ClassModel).filter(models.ClassModel.id == target_class_id).first()
    class_name = cls.name if cls else target_class_id

    students = db.query(models.StudentRecord).filter(models.StudentRecord.class_id == target_class_id).all()
    
    # Sort students by integer roll number
    def roll_sort_key(s):
        try:
            return (0, int(s.roll_no))
        except (ValueError, TypeError):
            return (1, str(s.roll_no or ""))

    sorted_students = sorted(students, key=roll_sort_key)

    student_list = []
    can_view_all_mobile = user.role in ["admin", "faculty"]
    for s in sorted_students:
        s_data = {
            "id": s.id,
            "name": s.name,
            "rollNo": s.roll_no,
            "class": s.class_id
        }
        # Mobile number privacy: return only to the student themself, faculty of that class, and admin
        if can_view_all_mobile or s.id == user.id:
            s_data["mobile"] = s.mobile
        else:
            s_data["mobile"] = None
        student_list.append(s_data)

    # Courses associated with this class from ClassCourse
    cc_records = db.query(models.ClassCourse).filter(models.ClassCourse.class_id == target_class_id).all()
    courses_info = []
    seen_cc = set()
    for cc in cc_records:
        course = db.query(models.CourseModel).filter(models.CourseModel.id == cc.course_id).first()
        faculty = db.query(models.User).filter(models.User.id == cc.faculty_id).first() if cc.faculty_id else None
        key = (cc.course_id, cc.faculty_id, cc.batch, cc.session_kind)
        if key not in seen_cc and course:
            seen_cc.add(key)
            fac_name = faculty.name if faculty else "Unassigned"
            if faculty and faculty.initials:
                fac_name += f" ({faculty.initials})"
            courses_info.append({
                "id": course.id,
                "code": course.code,
                "name": course.name,
                "credits": course.credits,
                "faculty": fac_name,
                "batch": cc.batch,
                "sessionKind": cc.session_kind
            })

    return {
        "classId": target_class_id,
        "className": class_name,
        "totalStudents": len(sorted_students),
        "students": student_list,
        "courses": courses_info
    }

@app.get("/api/admin/users")
def list_admin_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    class_id: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    query = db.query(models.User)

    if role:
        query = query.filter(models.User.role == role)
    if class_id:
        query = query.filter(models.User.class_id == class_id)
    if search:
        search_term = f"%{search.strip()}%"
        student_subq = db.query(models.StudentRecord.id).filter(
            models.StudentRecord.roll_no.ilike(search_term)
        ).subquery()
        query = query.filter(
            models.User.name.ilike(search_term) |
            models.User.email.ilike(search_term) |
            models.User.id.ilike(search_term) |
            models.User.id.in_(student_subq)
        )

    total = query.count()
    users = query.order_by(models.User.role, models.User.class_id, models.User.id).offset((page - 1) * limit).limit(limit).all()

    student_ids = [u.id for u in users if u.role == "student"]
    student_records = {s.id: s for s in db.query(models.StudentRecord).filter(models.StudentRecord.id.in_(student_ids)).all()} if student_ids else {}

    results = []
    for u in users:
        st = student_records.get(u.id)
        results.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "department": u.department,
            "class": u.class_id,
            "rollNo": st.roll_no if st else None,
            "mobile": st.mobile if st else None,
            "initials": u.initials,
            "isHOD": u.is_hod,
            "firstLogin": u.first_login,
            "isActive": u.is_active
        })

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "users": results
    }

@app.get("/api/dev/demo-accounts")
def get_demo_accounts(db: Session = Depends(get_db)):
    if APP_ENV == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo accounts endpoint is disabled in production."
        )

    student = db.query(models.StudentRecord).order_by(models.StudentRecord.class_id, models.StudentRecord.roll_no).first()
    faculty = db.query(models.User).filter(models.User.role == "faculty").order_by(models.User.name).first()

    return {
        "admin": {"id": "ADM001", "name": "System Administrator", "role": "admin"},
        "council": {"id": "CON001", "name": "Council Head", "role": "council"},
        "student": {
            "id": student.id,
            "name": student.name,
            "role": "student",
            "class": student.class_id,
            "rollNo": student.roll_no
        } if student else None,
        "faculty": {
            "id": faculty.id,
            "name": faculty.name,
            "role": "faculty",
            "initials": faculty.initials
        } if faculty else None
    }

# -------------------------------------------------------------
# 3. ATTENDANCE & LECTURE MANAGEMENT (FR-ATT, FR-LECT)
# -------------------------------------------------------------

@app.get("/api/attendance/student")
def get_student_attendance(user: models.User = Depends(require_current_user), db: Session = Depends(get_db)):
    student_id = user.id
    
    courses = db.query(models.CourseModel).all()
    result = []

    for c in courses:
        lectures = db.query(models.Lecture).filter(
            models.Lecture.course_id == c.id,
            models.Lecture.status == "Conducted"
        ).all()
        
        lec_ids = [l.id for l in lectures]
        if lec_ids:
            records = db.query(models.Attendance).filter(
                models.Attendance.student_id == student_id,
                models.Attendance.lecture_id.in_(lec_ids)
            ).all()
            total = len(records)
            present = sum(1 for r in records if r.status == "Present")
            pct = round((present / total * 100), 1) if total > 0 else 0.0
        else:
            total = 0
            present = 0
            pct = 0.0

        result.append({
            "course": c.id,
            "code": c.code,
            "name": c.name,
            "total": total,
            "present": present,
            "percentage": pct,
            "isDefaulter": pct < DEFAULT_LOW_ATTENDANCE_THRESHOLD and total > 0
        })

    overall_total = sum(item["total"] for item in result)
    overall_present = sum(item["present"] for item in result)
    overall_pct = round((overall_present / overall_total * 100), 1) if overall_total > 0 else 0.0

    return {
        "studentId": student_id,
        "overallPercentage": overall_pct,
        "isOverallDefaulter": overall_pct < DEFAULT_LOW_ATTENDANCE_THRESHOLD and overall_total > 0,
        "courses": result
    }

@app.get("/api/attendance/faculty")
def get_faculty_attendance(user: models.User = Depends(require_current_user), db: Session = Depends(get_db)):
    courses = db.query(models.CourseModel).all()
    classes = db.query(models.ClassModel).all()

    defaulters = []
    conducted_lecs = db.query(models.Lecture).filter(models.Lecture.status == "Conducted").all()
    avg_att = 0.0
    if conducted_lecs:
        students = db.query(models.StudentRecord).all()
        tot_all = 0
        pres_all = 0
        for s in students:
            records = db.query(models.Attendance).filter(models.Attendance.student_id == s.id).all()
            if records:
                tot = len(records)
                pres = sum(1 for r in records if r.status == "Present")
                pct = round((pres / tot * 100), 1)
                tot_all += tot
                pres_all += pres
                if pct < DEFAULT_LOW_ATTENDANCE_THRESHOLD:
                    defaulters.append({
                        "id": s.id,
                        "name": s.name,
                        "rollNo": s.roll_no,
                        "class": s.class_id,
                        "percentage": pct
                    })
        if tot_all > 0:
            avg_att = round((pres_all / tot_all * 100), 1)

    return {
        "stats": {
            "classes": len(classes),
            "courses": len(courses),
            "avgAttendance": avg_att,
            "defaulters": len(defaulters),
            "pendingAssignments": 0,
            "activeQuizzes": 0
        },
        "defaulters": defaulters
    }

@app.get("/api/lectures")
def list_lectures(db: Session = Depends(get_db)):
    lectures = db.query(models.Lecture).order_by(models.Lecture.date.desc()).all()
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
        "notes": l.notes
    } for l in lectures]

@app.post("/api/lectures/create")
def create_lecture(req: schemas.LectureCreateRequest, user: models.User = Depends(require_role(["faculty", "admin"])), db: Session = Depends(get_db)):
    course = db.query(models.CourseModel).filter(models.CourseModel.id == req.course_id).first()
    sched_faculty = db.query(models.User).filter(models.User.id == (req.scheduled_faculty_id or req.actual_faculty_id)).first()
    act_faculty = db.query(models.User).filter(models.User.id == req.actual_faculty_id).first()

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
    db.commit()
    db.refresh(lec)

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
def mark_attendance(req: schemas.MarkAttendanceRequest, user: models.User = Depends(require_role(["faculty", "admin"])), db: Session = Depends(get_db)):
    lec = db.query(models.Lecture).filter(models.Lecture.id == req.lecture_id).first()
    if not lec:
        raise HTTPException(status_code=404, detail="Lecture not found")

    faculty_id = user.id
    
    for item in req.attendance:
        existing = db.query(models.Attendance).filter(
            models.Attendance.lecture_id == req.lecture_id,
            models.Attendance.student_id == item.student_id
        ).first()
        if existing:
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
            existing.updated_at = datetime.utcnow()
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
    class_id: Optional[str] = Query(None),
    faculty_id: Optional[str] = Query(None),
    day: Optional[str] = Query(None),
    user: models.User = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.TimetableEntry)

    if user.role == "student":
        # Section 5: Student sees only their own class's full timetable (all batches)
        if class_id and class_id != user.class_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can only view their own class timetable."
            )
        target_class = user.class_id
        query = query.filter(models.TimetableEntry.class_id == target_class)
    elif user.role == "faculty":
        # Faculty: if class_id provided, filter by class; otherwise show own sessions across classes
        if class_id:
            query = query.filter(models.TimetableEntry.class_id == class_id)
        elif faculty_id:
            query = query.filter(
                (models.TimetableEntry.faculty_id == faculty_id) |
                (models.TimetableEntry.faculty_initials == faculty_id)
            )
        else:
            query = query.filter(
                (models.TimetableEntry.faculty_id == user.id) |
                (models.TimetableEntry.faculty_initials == (user.initials or ""))
            )
    else:
        # Admin / Council
        if class_id:
            query = query.filter(models.TimetableEntry.class_id == class_id)
        if faculty_id:
            query = query.filter(
                (models.TimetableEntry.faculty_id == faculty_id) |
                (models.TimetableEntry.faculty_initials == faculty_id)
            )

    if day:
        query = query.filter(models.TimetableEntry.day_of_week == day)

    entries = query.order_by(models.TimetableEntry.start_time.asc()).all()

    grouped: Dict[str, List[Any]] = {
        "Monday": [], "Tuesday": [], "Wednesday": [], "Thursday": [], "Friday": []
    }
    for e in entries:
        if e.day_of_week in grouped:
            grouped[e.day_of_week].append({
                "id": e.id,
                "time": e.time,
                "startTime": e.start_time,
                "endTime": e.end_time,
                "course": e.course_name,
                "code": e.course_code,
                "faculty": e.faculty_name,
                "facultyInitials": e.faculty_initials,
                "room": e.classroom,
                "type": e.lecture_type,
                "class": e.class_id,
                "classId": e.class_id,
                "batch": e.batch,
                "sessionKind": e.session_kind,
                "groupId": e.group_id,
                "isAmbiguous": e.is_ambiguous,
                "sourceRef": e.source_ref
            })
    return grouped

@app.post("/api/timetable/check-conflict")
def check_timetable_conflict(
    day: str = Query(...),
    start_time: str = Query(...),
    end_time: str = Query(...),
    classroom: Optional[str] = Query(None),
    faculty_id: Optional[str] = Query(None),
    class_id: Optional[str] = Query(None),
    batch: Optional[str] = Query(None),
    group_id: Optional[str] = Query(None),
    course_code: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Detects timetable conflicts per FR-TT-009, 010, 011, handling parallel batches and joint groups."""
    conflicts = []
    
    # 1. Faculty overlap check (FR-TT-009)
    if faculty_id:
        overlapping_faculty = db.query(models.TimetableEntry).filter(
            models.TimetableEntry.day_of_week == day,
            (models.TimetableEntry.faculty_id == faculty_id) | (models.TimetableEntry.faculty_initials == faculty_id),
            models.TimetableEntry.start_time < end_time,
            models.TimetableEntry.end_time > start_time
        ).all()
        for e in overlapping_faculty:
            if group_id and e.group_id == group_id:
                continue
            if course_code and e.course_code == course_code and e.classroom == classroom:
                continue
            conflicts.append(f"Faculty is already assigned to {e.course_code} ({e.time}) in room {e.classroom}")
            break

    # 2. Classroom overlap check (FR-TT-010)
    if classroom:
        overlapping_rooms = db.query(models.TimetableEntry).filter(
            models.TimetableEntry.day_of_week == day,
            models.TimetableEntry.classroom == classroom,
            models.TimetableEntry.start_time < end_time,
            models.TimetableEntry.end_time > start_time
        ).all()
        for e in overlapping_rooms:
            if group_id and e.group_id == group_id:
                continue
            if course_code and e.course_code == course_code and (faculty_id is None or e.faculty_id == faculty_id or e.faculty_initials == faculty_id):
                continue
            conflicts.append(f"Classroom {classroom} is already occupied by {e.course_code} ({e.time})")
            break

    # 3. Class overlap check (FR-TT-011)
    if class_id:
        overlapping_class = db.query(models.TimetableEntry).filter(
            models.TimetableEntry.day_of_week == day,
            models.TimetableEntry.class_id == class_id,
            models.TimetableEntry.start_time < end_time,
            models.TimetableEntry.end_time > start_time
        ).all()
        for e in overlapping_class:
            if group_id and e.group_id == group_id:
                continue
            # Practical batches of the same class running in parallel are not a conflict if their batches differ
            if batch and e.batch and e.batch != batch:
                continue
            conflicts.append(f"Class {class_id} already has a scheduled session: {e.course_code} ({e.time})")
            break

    return {
        "hasConflict": len(conflicts) > 0,
        "conflicts": conflicts
    }

# -------------------------------------------------------------
# 5. CLASSROOM AVAILABILITY SEARCH (FR-ROOM-001 to 005)
# -------------------------------------------------------------

@app.get("/api/classrooms")
def get_all_classrooms(db: Session = Depends(get_db)):
    rooms = db.query(models.Classroom).all()
    results = []
    for r in rooms:
        fac = []
        if r.facilities_json:
            try:
                fac = json.loads(r.facilities_json)
            except Exception:
                fac = []
        results.append({
            "id": r.id,
            "name": r.name,
            "building": r.building or "—",
            "capacity": r.capacity or "—",
            "facilities": fac
        })
    return results

@app.post("/api/classrooms/search-availability")
def search_classroom_availability(req: schemas.ClassroomSearchRequest, db: Session = Depends(get_db)):
    """Compares requested time range against lectures and weekly timetable per FR-ROOM-001 to 005."""
    rooms = db.query(models.Classroom).all()
    
    # Determine day of week from date
    day_of_week = None
    try:
        dt = datetime.strptime(req.date, "%Y-%m-%d")
        day_of_week = dt.strftime("%A")
    except Exception:
        day_of_week = None

    # Check lectures on that date
    overlapping_lectures = db.query(models.Lecture).filter(
        models.Lecture.date == req.date,
        models.Lecture.status != "Cancelled",
        models.Lecture.start_time < req.end_time,
        models.Lecture.end_time > req.start_time
    ).all()
    occupied_rooms: Dict[str, str] = {
        l.classroom: f"{l.course_code} - {l.course_name} ({l.actual_faculty_name})"
        for l in overlapping_lectures if l.classroom
    }

    # Check regular weekly timetable for that day of week
    if day_of_week:
        overlapping_tt = db.query(models.TimetableEntry).filter(
            models.TimetableEntry.day_of_week == day_of_week,
            models.TimetableEntry.start_time < req.end_time,
            models.TimetableEntry.end_time > req.start_time
        ).all()
        for entry in overlapping_tt:
            if entry.classroom and entry.classroom not in occupied_rooms:
                fac = entry.faculty_name or entry.faculty_initials or "Faculty"
                occupied_rooms[entry.classroom] = f"{entry.course_code} - {entry.course_name} ({fac})"

    results = []
    for r in rooms:
        is_occupied = r.name in occupied_rooms
        occupied_by = occupied_rooms.get(r.name)
        
        fac = []
        if r.facilities_json:
            try:
                fac = json.loads(r.facilities_json)
            except Exception:
                fac = []

        results.append({
            "id": r.id,
            "name": r.name,
            "building": r.building or "—",
            "capacity": r.capacity or "—",
            "facilities": fac,
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
def list_study_materials(course_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.StudyMaterial)
    if course_id:
        query = query.filter(models.StudyMaterial.course_id == course_id)
    materials = query.all()
    return [{
        "id": m.id,
        "course": m.course_id,
        "unit": m.unit,
        "title": m.title,
        "type": m.file_type,
        "size": m.file_size,
        "uploadedBy": m.uploaded_by,
        "uploadedAt": m.uploaded_at,
        "description": m.description
    } for m in materials]

# -------------------------------------------------------------
# 7. ASSIGNMENT MANAGEMENT (FR-ASG-001 to 010)
# -------------------------------------------------------------

@app.get("/api/assignments")
def list_assignments(user: models.User = Depends(require_current_user), db: Session = Depends(get_db)):
    assignments = db.query(models.Assignment).all()
    student_id = user.id
    
    results = []
    for a in assignments:
        sub = db.query(models.AssignmentSubmission).filter(
            models.AssignmentSubmission.assignment_id == a.id,
            models.AssignmentSubmission.student_id == student_id
        ).first()

        status_val = "pending"
        obtained_marks = None
        feedback = None
        submitted_at = None
        submission_file = None

        if sub:
            status_val = sub.status
            obtained_marks = sub.obtained_marks
            feedback = sub.feedback
            submitted_at = sub.submitted_at
            submission_file = sub.submission_file

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
            "obtainedMarks": obtained_marks,
            "feedback": feedback
        })
    return results

@app.post("/api/assignments/{assignment_id}/submit")
def submit_assignment(assignment_id: str, req: schemas.AssignmentSubmitRequest, user: models.User = Depends(require_current_user), db: Session = Depends(get_db)):
    student_id = user.id
    student_name = user.name
    
    asg = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not asg:
        raise HTTPException(status_code=404, detail="Assignment not found")

    now_str = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")
    sub_status = "submitted"
    if asg.due_date and now_str[:10] > asg.due_date:
        sub_status = "late"

    sub = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.assignment_id == assignment_id,
        models.AssignmentSubmission.student_id == student_id
    ).first()

    if sub:
        sub.submitted_at = now_str
        sub.submission_file = req.submission_file
        sub.status = sub_status
    else:
        sub = models.AssignmentSubmission(
            assignment_id=assignment_id,
            student_id=student_id,
            student_name=student_name,
            submitted_at=now_str,
            submission_file=req.submission_file,
            status=sub_status
        )
        db.add(sub)

    db.commit()
    return {"message": "Assignment submitted successfully", "status": sub_status}

@app.post("/api/assignments/submissions/{submission_id}/grade")
def grade_submission(submission_id: int, req: schemas.GradeSubmissionRequest, user: models.User = Depends(require_role(["faculty", "admin"])), db: Session = Depends(get_db)):
    sub = db.query(models.AssignmentSubmission).filter(models.AssignmentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    sub.obtained_marks = req.marks
    sub.feedback = req.feedback
    sub.status = "graded"
    sub.graded_by = user.name
    sub.graded_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")
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
def list_quizzes(db: Session = Depends(get_db)):
    quizzes = db.query(models.Quiz).all()
    results = []
    for q in quizzes:
        question_count = db.query(models.QuizQuestion).filter(models.QuizQuestion.quiz_id == q.id).count()
        results.append({
            "id": q.id,
            "title": q.title,
            "course": q.course_name,
            "courseCode": q.course_code,
            "questions": question_count or 10,
            "duration": q.duration_minutes,
            "opens": q.opens_at,
            "closes": q.closes_at,
            "status": q.status,
            "topics": json.loads(q.topics_json)
        })
    return results

@app.get("/api/quizzes/{quiz_id}/questions")
def get_quiz_questions(quiz_id: str, db: Session = Depends(get_db)):
    questions = db.query(models.QuizQuestion).filter(models.QuizQuestion.quiz_id == quiz_id).all()
    return [{
        "id": q.id,
        "question": q.question_text,
        "options": json.loads(q.options_json),
        "topic": q.topic
    } for q in questions]

@app.post("/api/quizzes/{quiz_id}/submit")
def submit_quiz_attempt(quiz_id: str, req: schemas.QuizSubmitRequest, user: models.User = Depends(require_current_user), db: Session = Depends(get_db)):
    student_id = user.id
    questions = db.query(models.QuizQuestion).filter(models.QuizQuestion.quiz_id == quiz_id).all()

    correct_count = 0
    total_questions = len(questions) or 10
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

    score = correct_count
    total_marks = total_questions

    attempt = models.QuizAttempt(
        quiz_id=quiz_id,
        student_id=student_id,
        started_at=datetime.utcnow() - timedelta(minutes=10),
        submitted_at=datetime.utcnow(),
        answers_json=json.dumps(answers),
        score=score,
        total_marks=total_marks,
        is_auto_submitted=req.is_auto_submitted
    )
    db.add(attempt)
    db.commit()

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
        incorrect_count=total_questions - correct_count,
        unattempted_count=0,
        strengths_json=json.dumps(strengths or ["Core fundamental concepts"]),
        improvements_json=json.dumps(improvements or ["Revision of edge cases"]),
        suggestions_json=json.dumps([
            "Review key topics from Unit lectures",
            "Solve practice problems from recommended textbooks",
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

@app.get("/api/ai-report/{quiz_id}")
def get_ai_report(quiz_id: str, user: models.User = Depends(require_current_user), db: Session = Depends(get_db)):
    report = db.query(models.AIReport).filter(
        models.AIReport.quiz_id == quiz_id,
        models.AIReport.student_id == user.id
    ).order_by(models.AIReport.created_at.desc()).first()

    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI report not found for this quiz and user."
        )

    return {
        "quizId": report.quiz_id,
        "quizTitle": quiz.title if quiz else "Quiz Performance",
        "score": report.score,
        "correct": report.correct_count,
        "incorrect": report.incorrect_count,
        "unattempted": report.unattempted_count,
        "total": 10,
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
def get_results(user: models.User = Depends(require_current_user), db: Session = Depends(get_db)):
    # Results start empty for real imported students; proper empty state rendered
    return []

# -------------------------------------------------------------
# 11. DASHBOARDS (FR-DASH-001 to 005)
# -------------------------------------------------------------

@app.get("/api/dashboard/stats")
def get_dashboard_stats(role: str = Query("student"), user: Optional[models.User] = Depends(get_current_user), db: Session = Depends(get_db)):
    if role == "admin":
        return {
            "totalStudents": db.query(models.StudentRecord).count(),
            "totalFaculty": db.query(models.User).filter(models.User.role == "faculty").count(),
            "totalClasses": db.query(models.ClassModel).count(),
            "totalCourses": db.query(models.CourseModel).count(),
            "totalClassrooms": db.query(models.Classroom).count(),
            "avgAttendance": 0.0,
            "lowAttendanceCount": 0,
            "pendingGrievances": db.query(models.Grievance).filter(models.Grievance.status != "RESOLVED").count(),
            "upcomingEvents": db.query(models.CouncilEvent).count()
        }
    elif role == "faculty":
        fac_id = user.id if user and user.role == "faculty" else None
        if fac_id:
            classes_count = db.query(models.TimetableEntry.class_id).filter(
                (models.TimetableEntry.faculty_id == fac_id) | (models.TimetableEntry.faculty_initials == (user.initials or ""))
            ).distinct().count()
            courses_count = db.query(models.TimetableEntry.course_code).filter(
                (models.TimetableEntry.faculty_id == fac_id) | (models.TimetableEntry.faculty_initials == (user.initials or ""))
            ).distinct().count()
        else:
            classes_count = db.query(models.ClassModel).count()
            courses_count = db.query(models.CourseModel).count()

        return {
            "classes": classes_count,
            "courses": courses_count,
            "avgAttendance": 0.0,
            "defaulters": 0,
            "pendingAssignments": 0,
            "activeQuizzes": 0
        }
    return {}

# -------------------------------------------------------------
# 12. ANNOUNCEMENTS & NOTIFICATIONS (FR-NOTIF-001 to 006)
# -------------------------------------------------------------

@app.get("/api/announcements")
def list_announcements(db: Session = Depends(get_db)):
    items = db.query(models.Announcement).order_by(models.Announcement.date.desc()).all()
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
def create_announcement(req: schemas.AnnouncementCreateRequest, user: models.User = Depends(require_role(["admin", "faculty", "council"])), db: Session = Depends(get_db)):
    ann = models.Announcement(
        id=f"AN{uuid.uuid4().hex[:4].upper()}",
        title=req.title,
        content=req.content,
        publisher_name=user.name,
        publisher_role=user.role.title(),
        date=datetime.utcnow().strftime("%Y-%m-%d"),
        audience=req.audience,
        attachment=req.attachment,
        type=req.type
    )
    db.add(ann)

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
def list_notifications(user: models.User = Depends(require_current_user), db: Session = Depends(get_db)):
    notifs = db.query(models.Notification).order_by(models.Notification.created_at.desc()).all()
    return [{
        "id": n.id,
        "message": n.message,
        "type": n.type,
        "read": n.read,
        "time": n.time_ago,
        "icon": n.icon
    } for n in notifs]

@app.post("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str, db: Session = Depends(get_db)):
    n = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if n:
        n.read = True
        db.commit()
    return {"message": "Notification marked as read"}

# -------------------------------------------------------------
# 13. CALENDAR & COUNCIL EVENTS (FR-EVENT, FR-CAL)
# -------------------------------------------------------------

@app.get("/api/calendar")
def list_calendar(category: Optional[str] = None, db: Session = Depends(get_db)):
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
def list_events(db: Session = Depends(get_db)):
    items = db.query(models.CouncilEvent).all()
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
def create_event(req: schemas.CouncilEventCreateRequest, user: models.User = Depends(require_role(["council", "admin"])), db: Session = Depends(get_db)):
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

    cal = models.CalendarEntry(
        title=req.title,
        category="Events",
        date=req.date,
        time=f"{req.start_time}–{req.end_time}",
        description=req.description,
        event_id=event_id
    )
    db.add(cal)

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

@app.get("/api/forums")
def list_forums(course_code: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.ForumTopic)
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
def create_forum_topic(req: schemas.ForumTopicCreateRequest, user: models.User = Depends(require_current_user), db: Session = Depends(get_db)):
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
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
def get_forum_replies(topic_id: str, db: Session = Depends(get_db)):
    replies = db.query(models.ForumReply).filter(models.ForumReply.topic_id == topic_id).order_by(models.ForumReply.created_at.asc()).all()
    return [{
        "id": r.id,
        "author": r.author_name,
        "role": r.author_role,
        "content": r.content,
        "createdAt": r.created_at
    } for r in replies]

@app.post("/api/forums/{topic_id}/replies")
def post_forum_reply(topic_id: str, req: schemas.ForumReplyCreateRequest, user: models.User = Depends(require_current_user), db: Session = Depends(get_db)):
    topic = db.query(models.ForumTopic).filter(models.ForumTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    reply = models.ForumReply(
        topic_id=topic_id,
        author_id=user.id,
        author_name=user.name,
        author_role=user.role.title(),
        content=req.content,
        created_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M")
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
def list_grievances(user: models.User = Depends(require_current_user), db: Session = Depends(get_db)):
    query = db.query(models.Grievance)
    if user.role == "student":
        # Scoped to student per FR-GRV-006
        query = query.filter(models.Grievance.student_id == user.id)
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
        "assignedTo": g.assigned_to
    } for g in items]

@app.post("/api/grievances")
def submit_grievance(req: schemas.GrievanceCreateRequest, user: models.User = Depends(require_current_user), db: Session = Depends(get_db)):
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
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
def update_grievance(grievance_id: str, req: schemas.GrievanceUpdateRequest, user: models.User = Depends(require_role(["admin", "faculty", "council"])), db: Session = Depends(get_db)):
    gr = db.query(models.Grievance).filter(models.Grievance.id == grievance_id).first()
    if not gr:
        raise HTTPException(status_code=404, detail="Grievance not found")

    gr.status = req.status
    gr.last_updated = datetime.utcnow().strftime("%Y-%m-%d")
    if req.resolution:
        gr.resolution = req.resolution
    if req.assigned_to:
        gr.assigned_to = req.assigned_to

    audit = models.AuditLog(
        user_id=user.id,
        action="GRIEVANCE_UPDATED",
        resource=f"Grievance:{grievance_id}",
        details=f"Status set to {req.status}"
    )
    db.add(audit)
    db.commit()
    return {"message": "Grievance updated successfully"}

# -------------------------------------------------------------
# ROOT & HEALTH CHECK
# -------------------------------------------------------------

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
