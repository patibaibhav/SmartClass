from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey,
    Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=True)
    phone = Column(String(30), nullable=True)
    password_hash = Column(String(255), nullable=False)
    salt = Column(String(64), nullable=False)
    role = Column(String(20), nullable=False, index=True) # student, faculty, admin, council
    is_hod = Column(Boolean, default=False)
    department = Column(String(100), nullable=False)
    class_id = Column(String(50), nullable=True) # e.g. SE-A
    avatar = Column(String(255), nullable=True)
    first_login = Column(Boolean, default=False)
    token_version = Column(Integer, nullable=False, default=0)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    source = Column(String(30), nullable=False, default="manual")
    source_record_key = Column(String(150), nullable=True, unique=True)

class ClassModel(Base):
    __tablename__ = "classes"

    id = Column(String(50), primary_key=True) # e.g. 'SE-A'
    name = Column(String(100), nullable=False) # e.g. 'SE Computer Engineering - Div A'
    department = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)

class CourseModel(Base):
    __tablename__ = "courses"

    id = Column(String(50), primary_key=True) # e.g. 'CS301'
    code = Column(String(20), nullable=False, unique=True)
    name = Column(String(150), nullable=False)
    department = Column(String(100), nullable=False)
    credits = Column(Integer, default=3)
    is_active = Column(Boolean, default=True)

class ClassCourse(Base):
    __tablename__ = "class_courses"
    __table_args__ = (
        UniqueConstraint("class_id", "course_id", "faculty_id", name="uq_class_course_faculty"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    class_id = Column(String(50), ForeignKey("classes.id"), nullable=False)
    course_id = Column(String(50), ForeignKey("courses.id"), nullable=False)
    faculty_id = Column(String(50), ForeignKey("users.id"), nullable=False)

class StudentRecord(Base):
    __tablename__ = "students"
    __table_args__ = (
        UniqueConstraint("class_id", "roll_no", name="uq_student_class_roll"),
    )

    id = Column(String(50), ForeignKey("users.id"), primary_key=True)
    name = Column(String(100), nullable=False)
    roll_no = Column(String(50), nullable=False)
    class_id = Column(String(50), ForeignKey("classes.id"), nullable=False)
    source = Column(String(30), nullable=False, default="manual")
    source_record_key = Column(String(150), nullable=True, unique=True)

class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(String(50), primary_key=True)
    name = Column(String(50), nullable=False, unique=True) # 'A-101'
    building = Column(String(50), nullable=True)
    capacity = Column(Integer, nullable=True)
    facilities_json = Column(Text, default="[]")

class Lecture(Base):
    __tablename__ = "lectures"
    __table_args__ = (
        UniqueConstraint(
            "schedule_occurrence_id",
            "date",
            "generation_version",
            name="uq_lecture_schedule_date_generation",
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    class_id = Column(String(50), ForeignKey("classes.id"), nullable=True)
    schedule_occurrence_id = Column(
        Integer,
        ForeignKey("schedule_occurrences.id", name="fk_lectures_schedule_occurrence"),
        nullable=True,
        index=True,
    )
    course_id = Column(String(50), ForeignKey("courses.id"), nullable=False)
    course_name = Column(String(150), nullable=True)
    course_code = Column(String(20), nullable=True)
    scheduled_faculty_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    scheduled_faculty_name = Column(String(100), nullable=True)
    actual_faculty_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    actual_faculty_name = Column(String(100), nullable=True)
    date = Column(String(20), nullable=False) # YYYY-MM-DD
    start_time = Column(String(10), nullable=False) # 09:00
    end_time = Column(String(10), nullable=False) # 10:00
    lecture_type = Column(String(20), default="Regular") # Regular, Substitute, Extra, Cancelled
    classroom = Column(String(50), nullable=False)
    status = Column(String(20), default="Scheduled") # Scheduled, Conducted, Cancelled
    notes = Column(Text, nullable=True)
    substitute_reason = Column(Text, nullable=True)
    source = Column(String(30), nullable=False, default="manual")
    is_demo = Column(Boolean, nullable=False, default=False)
    generation_version = Column(String(50), nullable=True)


class LectureClassMembership(Base):
    __tablename__ = "lecture_class_memberships"
    __table_args__ = (
        UniqueConstraint("lecture_id", "class_id", name="uq_lecture_class"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    lecture_id = Column(
        Integer, ForeignKey("lectures.id", name="fk_lecture_membership_lecture"), nullable=False, index=True
    )
    class_id = Column(
        String(50), ForeignKey("classes.id", name="fk_lecture_membership_class"), nullable=False, index=True
    )

class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint("lecture_id", "student_id", name="uq_attendance_lecture_student"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    lecture_id = Column(Integer, ForeignKey("lectures.id"), nullable=False, index=True)
    student_id = Column(String(50), ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(20), nullable=False) # Present, Absent
    marked_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    marked_by = Column(String(50), ForeignKey("users.id"), nullable=False)
    source = Column(String(30), nullable=False, default="manual")
    is_demo = Column(Boolean, nullable=False, default=False)
    generation_version = Column(String(50), nullable=True)

class AttendanceAudit(Base):
    __tablename__ = "attendance_audit"

    id = Column(Integer, primary_key=True, autoincrement=True)
    attendance_id = Column(Integer, ForeignKey("attendance.id"), nullable=False)
    old_status = Column(String(20), nullable=False)
    new_status = Column(String(20), nullable=False)
    changed_by = Column(String(50), ForeignKey("users.id"), nullable=False)
    changed_at = Column(DateTime, default=utc_now)
    reason = Column(Text, nullable=True)

class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    day_of_week = Column(String(20), nullable=False) # Monday, Tuesday, etc.
    time = Column(String(30), nullable=False) # e.g. 09:00–10:00
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    class_id = Column(String(50), ForeignKey("classes.id"), nullable=False)
    course_id = Column(String(50), ForeignKey("courses.id"), nullable=False)
    course_name = Column(String(150), nullable=False)
    course_code = Column(String(20), nullable=False)
    faculty_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    faculty_name = Column(String(100), nullable=False)
    classroom = Column(String(50), nullable=False)
    lecture_type = Column(String(20), default="Regular")


class ScheduleOccurrence(Base):
    """One weekly teaching event that may serve multiple classes."""

    __tablename__ = "schedule_occurrences"
    __table_args__ = (
        UniqueConstraint("source_workbook_sha256", "source_cell", "source_item_index", name="uq_schedule_source_item"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    day_of_week = Column(String(20), nullable=False, index=True)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    course_id = Column(String(50), ForeignKey("courses.id"), nullable=True)
    source_subject_code = Column(String(30), nullable=False)
    faculty_id = Column(String(50), ForeignKey("users.id"), nullable=True, index=True)
    classroom = Column(String(50), nullable=True, index=True)
    activity_kind = Column(String(30), nullable=False, default="lecture")
    session_type = Column(String(20), nullable=False, default="Regular")
    parallel_group = Column(String(100), nullable=True)
    conflict_exception_reason = Column(Text, nullable=True)
    raw_source_text = Column(Text, nullable=False)
    source_sheet = Column(String(100), nullable=False)
    source_cell = Column(String(20), nullable=False)
    source_item_index = Column(Integer, nullable=False, default=0)
    source_workbook_sha256 = Column(String(64), nullable=False)


class ScheduleClassMembership(Base):
    __tablename__ = "schedule_class_memberships"
    __table_args__ = (
        UniqueConstraint("occurrence_id", "class_id", name="uq_schedule_occurrence_class"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    occurrence_id = Column(Integer, ForeignKey("schedule_occurrences.id"), nullable=False, index=True)
    class_id = Column(String(50), ForeignKey("classes.id"), nullable=False, index=True)


class ScheduleBatchGroup(Base):
    __tablename__ = "schedule_batch_groups"
    __table_args__ = (
        UniqueConstraint("occurrence_id", "class_id", "batch_code", name="uq_schedule_occurrence_batch"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    occurrence_id = Column(Integer, ForeignKey("schedule_occurrences.id"), nullable=False, index=True)
    class_id = Column(String(50), ForeignKey("classes.id"), nullable=False, index=True)
    batch_code = Column(String(20), nullable=False)

class StudyMaterial(Base):
    __tablename__ = "study_materials"

    id = Column(String(50), primary_key=True)
    course_id = Column(String(50), ForeignKey("courses.id"), nullable=False)
    unit = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    file_type = Column(String(20), nullable=False) # PDF, PPT, DOC, LINK
    file_size = Column(String(50), default="1.5 MB")
    file_url = Column(String(255), nullable=True)
    uploaded_by = Column(String(100), nullable=False)
    uploaded_at = Column(String(30), nullable=False)
    description = Column(Text, nullable=True)

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(String(50), primary_key=True)
    course_id = Column(String(50), ForeignKey("courses.id"), nullable=False)
    course_name = Column(String(150), nullable=False)
    course_code = Column(String(20), nullable=False)
    class_id = Column(String(50), ForeignKey("classes.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    due_date = Column(String(30), nullable=False)
    marks = Column(Integer, default=20)
    allow_late = Column(Boolean, default=True)
    attachment_file = Column(String(255), nullable=True)
    created_by = Column(String(50), ForeignKey("users.id"), nullable=False)
    source = Column(String(30), nullable=False, default="manual")
    is_demo = Column(Boolean, nullable=False, default=False)
    generation_version = Column(String(50), nullable=True)

class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"
    __table_args__ = (
        UniqueConstraint("assignment_id", "student_id", name="uq_assignment_submission_student"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    assignment_id = Column(String(50), ForeignKey("assignments.id"), nullable=False)
    student_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    student_name = Column(String(100), nullable=True)
    submitted_at = Column(String(30), nullable=False)
    submission_file = Column(String(255), nullable=False)
    status = Column(String(20), default="submitted") # submitted, late, graded
    obtained_marks = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    graded_by = Column(String(100), nullable=True)
    graded_at = Column(String(30), nullable=True)
    source = Column(String(30), nullable=False, default="manual")
    is_demo = Column(Boolean, nullable=False, default=False)
    generation_version = Column(String(50), nullable=True)

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String(50), primary_key=True)
    course_id = Column(String(50), ForeignKey("courses.id"), nullable=False)
    course_name = Column(String(150), nullable=False)
    course_code = Column(String(20), nullable=False)
    class_id = Column(String(50), ForeignKey("classes.id"), nullable=False)
    title = Column(String(200), nullable=False)
    duration_minutes = Column(Integer, default=15)
    max_attempts = Column(Integer, nullable=False, default=1)
    opens_at = Column(String(30), nullable=False)
    closes_at = Column(String(30), nullable=False)
    status = Column(String(20), default="available") # available, upcoming, completed
    topics_json = Column(Text, default="[]")
    is_released = Column(Boolean, default=True)
    created_by = Column(String(50), ForeignKey("users.id"), nullable=False)
    source = Column(String(30), nullable=False, default="manual")
    is_demo = Column(Boolean, nullable=False, default=False)
    generation_version = Column(String(50), nullable=True)

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    quiz_id = Column(String(50), ForeignKey("quizzes.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    options_json = Column(Text, nullable=False) # JSON array of 4 choices
    correct_option = Column(Integer, nullable=False) # 0-indexed
    marks = Column(Integer, default=1)
    topic = Column(String(100), default="General")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    quiz_id = Column(String(50), ForeignKey("quizzes.id"), nullable=False)
    student_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    started_at = Column(DateTime, default=utc_now)
    submitted_at = Column(DateTime, default=utc_now)
    answers_json = Column(Text, default="{}") # { question_id: chosen_index }
    score = Column(Float, default=0.0)
    total_marks = Column(Float, default=0.0)
    is_auto_submitted = Column(Boolean, default=False)
    source = Column(String(30), nullable=False, default="manual")
    is_demo = Column(Boolean, nullable=False, default=False)
    generation_version = Column(String(50), nullable=True)

class AIReport(Base):
    __tablename__ = "ai_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    quiz_id = Column(String(50), ForeignKey("quizzes.id"), nullable=False)
    student_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    score = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    correct_count = Column(Integer, default=0)
    incorrect_count = Column(Integer, default=0)
    unattempted_count = Column(Integer, default=0)
    strengths_json = Column(Text, default="[]")
    improvements_json = Column(Text, default="[]")
    suggestions_json = Column(Text, default="[]")
    topic_performance_json = Column(Text, default="[]")
    status = Column(String(20), default="Ready") # Ready, Pending, Unavailable
    created_at = Column(DateTime, default=utc_now)

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(String(50), primary_key=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    publisher_name = Column(String(100), nullable=False)
    publisher_role = Column(String(50), nullable=False)
    date = Column(String(30), nullable=False)
    audience = Column(String(100), nullable=False) # College, Course, Events, Class
    attachment = Column(String(255), nullable=True)
    type = Column(String(50), default="College")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=True) # null = broadcast
    message = Column(Text, nullable=False)
    type = Column(String(20), default="info") # info, warning, danger, default
    icon = Column(String(50), default="announcement")
    read = Column(Boolean, default=False)
    time_ago = Column(String(50), default="Just now")
    created_at = Column(DateTime, default=utc_now)

class CouncilEvent(Base):
    __tablename__ = "council_events"

    id = Column(String(50), primary_key=True)
    title = Column(String(200), nullable=False)
    council = Column(String(100), nullable=False)
    date = Column(String(30), nullable=False)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    venue = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    organizer = Column(String(100), nullable=False)
    registration_link = Column(String(255), nullable=True)
    visibility = Column(String(50), default="College Wide") # College Wide or Council Only
    created_by = Column(String(50), ForeignKey("users.id"), nullable=False)

class CalendarEntry(Base):
    __tablename__ = "calendar_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    category = Column(String(20), nullable=False) # Events, Tests, Holidays
    date = Column(String(30), nullable=False)
    time = Column(String(30), nullable=True)
    description = Column(Text, nullable=True)
    event_id = Column(String(50), nullable=True)

class ForumTopic(Base):
    __tablename__ = "forum_topics"

    id = Column(String(50), primary_key=True)
    course_id = Column(String(50), ForeignKey("courses.id"), nullable=False)
    course_code = Column(String(20), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    author_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    author_name = Column(String(100), nullable=False)
    created_at = Column(String(30), nullable=False)
    pinned = Column(Boolean, default=False)
    replies_count = Column(Integer, default=0)
    last_reply = Column(String(50), default="Just now")

class ForumReply(Base):
    __tablename__ = "forum_replies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    topic_id = Column(String(50), ForeignKey("forum_topics.id"), nullable=False)
    author_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    author_name = Column(String(100), nullable=False)
    author_role = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(String(30), nullable=False)

class Grievance(Base):
    __tablename__ = "grievances"

    id = Column(String(50), primary_key=True)
    student_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    student_name = Column(String(100), nullable=False)
    subject = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False) # Attendance, Academic, Infrastructure, General
    description = Column(Text, nullable=False)
    attachment = Column(String(255), nullable=True)
    status = Column(String(30), default="SUBMITTED") # SUBMITTED, ASSIGNED, UNDER REVIEW, IN PROGRESS, RESOLVED, CLOSED
    submitted_at = Column(String(30), nullable=False)
    last_updated = Column(String(30), nullable=False)
    resolution = Column(Text, nullable=True)
    assigned_to = Column(String(100), nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=utc_now)


class RevokedToken(Base):
    __tablename__ = "revoked_tokens"

    jti = Column(String(64), primary_key=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    revoked_at = Column(DateTime, nullable=False, default=utc_now)
    reason = Column(String(100), nullable=False, default="logout")


class ImportRun(Base):
    __tablename__ = "import_runs"

    id = Column(String(36), primary_key=True)
    workbook_sha256 = Column(String(64), nullable=False, index=True)
    source_filename = Column(String(255), nullable=False)
    status = Column(String(30), nullable=False)
    summary_json = Column(Text, nullable=False, default="{}")
    started_at = Column(DateTime, nullable=False, default=utc_now)
    completed_at = Column(DateTime, nullable=True)
