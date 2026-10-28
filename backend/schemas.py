from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict, Field

# Auth schemas
class LoginRequest(BaseModel):
    user_id: str
    password: str
    remember: bool = False

class FirstLoginRequest(BaseModel):
    new_password: str
    confirm_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    name: str
    firstName: Optional[str] = None
    email: Optional[str] = None
    role: str
    isHOD: Optional[bool] = False
    department: str
    className: Optional[str] = Field(default=None, alias="class")
    avatar: Optional[str] = None
    firstLogin: Optional[bool] = False

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

# Attendance schemas
class MarkAttendanceItem(BaseModel):
    student_id: str
    status: str # Present / Absent

class MarkAttendanceRequest(BaseModel):
    lecture_id: int
    attendance: List[MarkAttendanceItem]

class LectureCreateRequest(BaseModel):
    class_id: str
    course_id: str
    scheduled_faculty_id: Optional[str] = None
    actual_faculty_id: str
    date: str
    start_time: str
    end_time: str
    classroom: str
    lecture_type: str # 'Regular', 'Substitute', 'Extra'
    notes: Optional[str] = None
    substitute_reason: Optional[str] = None

# Grievance schemas
class GrievanceCreateRequest(BaseModel):
    subject: str
    category: str
    description: str
    attachment: Optional[str] = None

class GrievanceUpdateRequest(BaseModel):
    status: str
    resolution: Optional[str] = None
    assigned_to: Optional[str] = None

# Assignment schemas
class AssignmentCreateRequest(BaseModel):
    course_id: str
    class_id: str
    title: str
    description: str
    due_date: str
    marks: int = 20
    allow_late: bool = True
    attachment_file: Optional[str] = None

class AssignmentSubmitRequest(BaseModel):
    submission_file: Optional[str] = None
    submission_text: Optional[str] = None

class GradeSubmissionRequest(BaseModel):
    marks: float
    feedback: str

# Quiz schemas
class QuizCreateRequest(BaseModel):
    course_id: str
    class_id: str
    title: str
    duration_minutes: int
    opens_at: str
    closes_at: str
    max_attempts: int = Field(default=1, ge=1, le=10)
    topics: List[str] = []

class QuizSubmitRequest(BaseModel):
    answers: Dict[str, int] # question_id -> option_index
    is_auto_submitted: bool = False

# Forum schemas
class ForumTopicCreateRequest(BaseModel):
    course_id: str
    title: str
    content: str

class ForumReplyCreateRequest(BaseModel):
    content: str

# Announcement schemas
class AnnouncementCreateRequest(BaseModel):
    title: str
    content: str
    audience: str
    type: str = "College"
    attachment: Optional[str] = None

# Council Event schemas
class CouncilEventCreateRequest(BaseModel):
    title: str
    council: str
    date: str
    start_time: str
    end_time: str
    venue: str
    description: str
    organizer: str
    registration_link: Optional[str] = None
    visibility: str = "College Wide"

# Free Classroom search request
class ClassroomSearchRequest(BaseModel):
    date: str
    start_time: str
    end_time: str
