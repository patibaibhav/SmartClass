from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    salt = Column(String(64), nullable=False)
    role = Column(String(20), nullable=False, index=True) # student, faculty, admin, council
    is_hod = Column(Boolean, default=False)
    department = Column(String(100), nullable=False)
    class_id = Column(String(50), nullable=True) # e.g. SE-A
    avatar = Column(String(255), nullable=True)
    first_login = Column(Boolean, default=False)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

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

    id = Column(Integer, primary_key=True, autoincrement=True)
    class_id = Column(String(50), ForeignKey("classes.id"), nullable=False)
    course_id = Column(String(50), ForeignKey("courses.id"), nullable=False)
    faculty_id = Column(String(50), ForeignKey("users.id"), nullable=False)

class StudentRecord(Base):
    __tablename__ = "students"

    id = Column(String(50), ForeignKey("users.id"), primary_key=True)
    name = Column(String(100), nullable=False)
    roll_no = Column(String(50), nullable=False)
    class_id = Column(String(50), ForeignKey("classes.id"), nullable=False)

class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(String(50), primary_key=True)
    name = Column(String(50), nullable=False, unique=True) # 'A-101'
    building = Column(String(50), nullable=False)
    capacity = Column(Integer, default=60)
    facilities_json = Column(Text, default="[]")

class Lecture(Base):
    __tablename__ = "lectures"

    id = Column(Integer, primary_key=True, autoincrement=True)
    class_id = Column(String(50), ForeignKey("classes.id"), nullable=False)
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

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    lecture_id = Column(Integer, ForeignKey("lectures.id"), nullable=False, index=True)
    student_id = Column(String(50), ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(20), nullable=False) # Present, Absent
    marked_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    marked_by = Column(String(50), ForeignKey("users.id"), nullable=False)

class AttendanceAudit(Base):
    __tablename__ = "attendance_audit"

    id = Column(Integer, primary_key=True, autoincrement=True)
    attendance_id = Column(Integer, ForeignKey("attendance.id"), nullable=False)
    old_status = Column(String(20), nullable=False)
    new_status = Column(String(20), nullable=False)
    changed_by = Column(String(50), ForeignKey("users.id"), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)
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

class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

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

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String(50), primary_key=True)
    course_id = Column(String(50), ForeignKey("courses.id"), nullable=False)
    course_name = Column(String(150), nullable=False)
    course_code = Column(String(20), nullable=False)
    class_id = Column(String(50), ForeignKey("classes.id"), nullable=False)
    title = Column(String(200), nullable=False)
    duration_minutes = Column(Integer, default=15)
    opens_at = Column(String(30), nullable=False)
    closes_at = Column(String(30), nullable=False)
    status = Column(String(20), default="available") # available, upcoming, completed
    topics_json = Column(Text, default="[]")
    is_released = Column(Boolean, default=True)
    created_by = Column(String(50), ForeignKey("users.id"), nullable=False)

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
    started_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    answers_json = Column(Text, default="{}") # { question_id: chosen_index }
    score = Column(Float, default=0.0)
    total_marks = Column(Float, default=0.0)
    is_auto_submitted = Column(Boolean, default=False)

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
    created_at = Column(DateTime, default=datetime.utcnow)

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
    created_at = Column(DateTime, default=datetime.utcnow)

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
    timestamp = Column(DateTime, default=datetime.utcnow)
