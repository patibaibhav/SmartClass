"""Administrator lifecycle APIs (SRS FR-AUTH-002, FR-CLASS-001..010).

All routes require the ``admin`` role. Temporary passwords are returned once in
the response and are never stored or logged in clear text.
"""
from __future__ import annotations

import re
import secrets
import string
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import models
from auth import generate_salt, hash_password, require_role, validate_password
from database import get_db

router = APIRouter(prefix="/api/admin", tags=["admin"])
ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{2,50}$")
ROLES = {"student", "faculty", "council"}


def temporary_password(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%*-_+"
    while True:
        value = "".join(secrets.choice(alphabet) for _ in range(length))
        if validate_password(value) is None:
            return value


def audit(db: Session, admin: models.User, action: str, resource: str, details: str) -> None:
    db.add(models.AuditLog(user_id=admin.id, action=action, resource=resource, details=details))


class UserCreate(BaseModel):
    role: str
    name: str = Field(min_length=2, max_length=100)
    user_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: str = "Computer Engineering"
    class_id: Optional[str] = None
    roll_no: Optional[str] = None
    is_hod: bool = False
    council: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    class_id: Optional[str] = None
    is_active: Optional[bool] = None
    is_hod: Optional[bool] = None


class ClassUpsert(BaseModel):
    id: str
    name: str
    department: str = "Computer Engineering"
    is_active: bool = True


class CourseUpsert(BaseModel):
    id: str
    code: Optional[str] = None
    name: str
    department: str = "Computer Engineering"
    credits: int = Field(default=3, ge=0, le=12)
    is_active: bool = True


class Assignment(BaseModel):
    class_id: str
    course_id: str
    faculty_id: str


def view_user(u: models.User) -> dict:
    return {
        "id": u.id, "name": u.name, "role": u.role, "email": u.email, "phone": u.phone,
        "department": u.department, "classId": u.class_id, "isHOD": bool(u.is_hod), "council": u.council,
        "isActive": u.is_active is not False, "firstLogin": bool(u.first_login),
    }


@router.get("/users")
def list_users(role: Optional[str] = None, q: Optional[str] = None, limit: int = 300,
               admin: models.User = Depends(require_role("admin")), db: Session = Depends(get_db)):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(models.User.name.ilike(like) | models.User.id.ilike(like))
    return [view_user(u) for u in query.order_by(models.User.role, models.User.id).limit(min(limit, 500))]


@router.post("/users", status_code=201)
def create_user(req: UserCreate, admin: models.User = Depends(require_role("admin")),
                db: Session = Depends(get_db)):
    if req.role not in ROLES:
        raise HTTPException(400, "Role must be student, faculty or council")
    roll = ""
    if req.role == "student":
        if not req.class_id or not req.roll_no:
            raise HTTPException(400, "Students require a class and roll number")
        if not db.get(models.ClassModel, req.class_id):
            raise HTTPException(404, "Class not found")
        roll = req.roll_no.strip().lstrip("0") or "0"
        if db.query(models.StudentRecord).filter_by(class_id=req.class_id, roll_no=roll).first():
            raise HTTPException(409, "Roll number already exists in this class")
        if req.user_id:
            user_id = req.user_id
        elif roll.isdigit():
            user_id = f"STU-{req.class_id}-{int(roll):03d}"
        else:
            raise HTTPException(400, "Provide a numeric roll number or an explicit user ID")
    else:
        if req.role == "council" and not (req.council or "").strip():
            raise HTTPException(400, "Council Head accounts require a council name")
        prefix = "FAC" if req.role == "faculty" else "COU"
        user_id = req.user_id or f"{prefix}-{secrets.token_hex(2).upper()}"
    if not ID_PATTERN.match(user_id):
        raise HTTPException(400, "Invalid user ID")
    if db.get(models.User, user_id):
        raise HTTPException(409, "User ID already exists")
    if req.email and db.query(models.User).filter(models.User.email == req.email).first():
        raise HTTPException(409, "Email already in use")
    password = temporary_password()
    salt = generate_salt()
    user = models.User(
        id=user_id, name=req.name.strip(), email=req.email or None, phone=req.phone,
        password_hash=hash_password(password, salt), salt=salt, role=req.role,
        is_hod=bool(req.is_hod and req.role == "faculty"), department=req.department,
        class_id=req.class_id if req.role == "student" else None,
        council=req.council.strip() if req.role == "council" and req.council else None,
        first_login=True, source="admin",
    )
    db.add(user)
    db.flush()
    if req.role == "student":
        db.add(models.StudentRecord(id=user_id, name=user.name, roll_no=roll,
                                    class_id=req.class_id, source="admin"))
    audit(db, admin, "USER_CREATED", "User", f"Created {req.role} account {user_id}")
    db.commit()
    return {"user": view_user(user), "temporaryPassword": password,
            "notice": "Share this password securely. It is shown only once."}


@router.patch("/users/{user_id}")
def update_user(user_id: str, req: UserUpdate, admin: models.User = Depends(require_role("admin")),
                db: Session = Depends(get_db)):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    data = req.model_dump(exclude_unset=True)
    if user.id == admin.id and data.get("is_active") is False:
        raise HTTPException(400, "You cannot deactivate your own account")
    if data.get("class_id") and data["class_id"] != user.class_id:
        if user.role != "student":
            raise HTTPException(400, "Only students belong to a class")
        if not db.get(models.ClassModel, data["class_id"]):
            raise HTTPException(404, "Class not found")
        record = db.get(models.StudentRecord, user.id)
        if record:
            clash = db.query(models.StudentRecord).filter(
                models.StudentRecord.class_id == data["class_id"],
                models.StudentRecord.roll_no == record.roll_no,
                models.StudentRecord.id != user.id).first()
            if clash:
                raise HTTPException(409, "Roll number already used in the target class")
            record.class_id = data["class_id"]
        enrol = db.query(models.ElectiveEnrollment).filter_by(student_id=user.id).first()
        if enrol:
            enrol.academic_class_id = data["class_id"]
        user.class_id = data["class_id"]
    for field in ("name", "email", "phone", "department", "is_hod"):
        if field in data and data[field] is not None:
            setattr(user, field, data[field])
    if data.get("is_active") is not None:
        user.is_active = data["is_active"]
        user.token_version = (user.token_version or 0) + 1  # invalidate live sessions
    if user.role == "student" and data.get("name"):
        record = db.get(models.StudentRecord, user.id)
        if record:
            record.name = user.name
    audit(db, admin, "USER_UPDATED", "User", f"Updated {user_id}: {sorted(data)}")
    db.commit()
    return view_user(user)


@router.post("/users/{user_id}/reset-password")
def reset_password(user_id: str, admin: models.User = Depends(require_role("admin")),
                   db: Session = Depends(get_db)):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    password = temporary_password()
    user.salt = generate_salt()
    user.password_hash = hash_password(password, user.salt)
    user.first_login = True
    user.failed_login_attempts = 0
    user.locked_until = None
    user.token_version = (user.token_version or 0) + 1
    audit(db, admin, "PASSWORD_RESET", "User", f"Temporary password issued for {user_id}")
    db.commit()
    return {"userId": user_id, "temporaryPassword": password,
            "notice": "Share this password securely. It is shown only once."}


@router.get("/classes")
def list_classes(admin: models.User = Depends(require_role("admin")), db: Session = Depends(get_db)):
    counts: dict = {}
    for (cid,) in db.query(models.StudentRecord.class_id):
        counts[cid] = counts.get(cid, 0) + 1
    return [{"id": c.id, "name": c.name, "department": c.department, "isActive": bool(c.is_active),
             "students": counts.get(c.id, 0)}
            for c in db.query(models.ClassModel).order_by(models.ClassModel.id)]


@router.put("/classes")
def upsert_class(req: ClassUpsert, admin: models.User = Depends(require_role("admin")),
                 db: Session = Depends(get_db)):
    if not ID_PATTERN.match(req.id):
        raise HTTPException(400, "Invalid class ID")
    obj = db.get(models.ClassModel, req.id)
    if obj:
        obj.name, obj.department, obj.is_active = req.name, req.department, req.is_active
    else:
        db.add(models.ClassModel(id=req.id, name=req.name, department=req.department, is_active=req.is_active))
    audit(db, admin, "CLASS_UPSERT", "Class", f"{req.id} active={req.is_active}")
    db.commit()
    return {"id": req.id, "name": req.name, "isActive": req.is_active}


@router.get("/courses")
def list_courses(admin: models.User = Depends(require_role("admin")), db: Session = Depends(get_db)):
    return [{"id": c.id, "code": c.code, "name": c.name, "department": c.department,
             "credits": c.credits, "isActive": bool(c.is_active)}
            for c in db.query(models.CourseModel).order_by(models.CourseModel.code)]


@router.put("/courses")
def upsert_course(req: CourseUpsert, admin: models.User = Depends(require_role("admin")),
                  db: Session = Depends(get_db)):
    if not ID_PATTERN.match(req.id):
        raise HTTPException(400, "Invalid course ID")
    code = req.code or req.id
    other = db.query(models.CourseModel).filter(models.CourseModel.code == code,
                                                models.CourseModel.id != req.id).first()
    if other:
        raise HTTPException(409, "Course code already used")
    obj = db.get(models.CourseModel, req.id)
    if obj:
        obj.code, obj.name, obj.department = code, req.name, req.department
        obj.credits, obj.is_active = req.credits, req.is_active
    else:
        db.add(models.CourseModel(id=req.id, code=code, name=req.name, department=req.department,
                                  credits=req.credits, is_active=req.is_active))
    audit(db, admin, "COURSE_UPSERT", "Course", f"{req.id} active={req.is_active}")
    db.commit()
    return {"id": req.id, "code": code, "name": req.name, "isActive": req.is_active}


@router.get("/assignments")
def list_assignments(admin: models.User = Depends(require_role("admin")), db: Session = Depends(get_db)):
    names = {u.id: u.name for u in db.query(models.User).filter(models.User.role == "faculty")}
    return [{"id": a.id, "classId": a.class_id, "courseId": a.course_id, "facultyId": a.faculty_id,
             "facultyName": names.get(a.faculty_id)}
            for a in db.query(models.ClassCourse).order_by(models.ClassCourse.class_id, models.ClassCourse.course_id)]


@router.post("/assignments", status_code=201)
def assign_faculty(req: Assignment, admin: models.User = Depends(require_role("admin")),
                   db: Session = Depends(get_db)):
    faculty = db.get(models.User, req.faculty_id)
    if not faculty or faculty.role != "faculty":
        raise HTTPException(404, "Faculty not found")
    if not db.get(models.ClassModel, req.class_id) or not db.get(models.CourseModel, req.course_id):
        raise HTTPException(404, "Class or course not found")
    if db.query(models.ClassCourse).filter_by(**req.model_dump()).first():
        raise HTTPException(409, "Assignment already exists")
    row = models.ClassCourse(**req.model_dump())
    db.add(row)
    audit(db, admin, "ASSIGNMENT_CREATED", "ClassCourse",
          f"{req.faculty_id} -> {req.class_id}/{req.course_id}")
    db.commit()
    return {"id": row.id}


@router.delete("/assignments/{assignment_id}")
def remove_assignment(assignment_id: int, admin: models.User = Depends(require_role("admin")),
                      db: Session = Depends(get_db)):
    row = db.get(models.ClassCourse, assignment_id)
    if not row:
        raise HTTPException(404, "Assignment not found")
    audit(db, admin, "ASSIGNMENT_REMOVED", "ClassCourse",
          f"{row.faculty_id} removed from {row.class_id}/{row.course_id}")
    db.delete(row)
    db.commit()
    return {"message": "Removed"}
