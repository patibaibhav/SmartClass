"""Generate reproducible demonstration academics without changing imported identities."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import date, datetime, time, timedelta
from pathlib import Path
from typing import Any


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPOSITORY_ROOT / "backend"))

import models  # noqa: E402
from database import SessionLocal  # noqa: E402


WEEKDAYS = {0: "Monday", 1: "Tuesday", 2: "Wednesday", 3: "Thursday", 4: "Friday"}


def stable_fraction(seed: int, *parts: object) -> float:
    payload = ":".join([str(seed), *(str(part) for part in parts)]).encode("utf-8")
    value = int.from_bytes(hashlib.sha256(payload).digest()[:8], "big")
    return value / float(2**64 - 1)


def generation_version(seed: int, start: date, end: date) -> str:
    return f"demo-v1-{seed}-{start.isoformat()}-{end.isoformat()}"


def date_range(start: date, end: date):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def teaching_dates(db: Any, semester_start: date, semester_end: date) -> tuple[list[date], list[str]]:
    """Return weekdays that are not explicitly calendar-marked as a test or holiday."""
    blocked = {
        row.date
        for row in db.query(models.CalendarEntry).filter(
            models.CalendarEntry.category.in_(["Holidays", "Tests"]),
            models.CalendarEntry.date >= semester_start.isoformat(),
            models.CalendarEntry.date <= semester_end.isoformat(),
        ).all()
    }
    dates = [
        current_date for current_date in date_range(semester_start, semester_end)
        if current_date.weekday() in WEEKDAYS and current_date.isoformat() not in blocked
    ]
    return dates, sorted(blocked)


def reset_demo_only(db: Any) -> dict[str, int]:
    demo_quiz_ids = [row.id for row in db.query(models.Quiz.id).filter(models.Quiz.is_demo == True).all()]
    demo_assignment_ids = [row.id for row in db.query(models.Assignment.id).filter(models.Assignment.is_demo == True).all()]
    demo_lecture_ids = [row.id for row in db.query(models.Lecture.id).filter(models.Lecture.is_demo == True).all()]
    deleted = {}
    deleted["ai_reports"] = db.query(models.AIReport).filter(models.AIReport.quiz_id.in_(demo_quiz_ids)).delete(synchronize_session=False) if demo_quiz_ids else 0
    deleted["quiz_attempts"] = db.query(models.QuizAttempt).filter(models.QuizAttempt.quiz_id.in_(demo_quiz_ids)).delete(synchronize_session=False) if demo_quiz_ids else 0
    deleted["quiz_questions"] = db.query(models.QuizQuestion).filter(models.QuizQuestion.quiz_id.in_(demo_quiz_ids)).delete(synchronize_session=False) if demo_quiz_ids else 0
    deleted["quizzes"] = db.query(models.Quiz).filter(models.Quiz.id.in_(demo_quiz_ids)).delete(synchronize_session=False) if demo_quiz_ids else 0
    deleted["assignment_submissions"] = db.query(models.AssignmentSubmission).filter(models.AssignmentSubmission.assignment_id.in_(demo_assignment_ids)).delete(synchronize_session=False) if demo_assignment_ids else 0
    deleted["assignments"] = db.query(models.Assignment).filter(models.Assignment.id.in_(demo_assignment_ids)).delete(synchronize_session=False) if demo_assignment_ids else 0
    deleted["attendance"] = db.query(models.Attendance).filter(models.Attendance.lecture_id.in_(demo_lecture_ids)).delete(synchronize_session=False) if demo_lecture_ids else 0
    deleted["lecture_memberships"] = db.query(models.LectureClassMembership).filter(models.LectureClassMembership.lecture_id.in_(demo_lecture_ids)).delete(synchronize_session=False) if demo_lecture_ids else 0
    deleted["lectures"] = db.query(models.Lecture).filter(models.Lecture.id.in_(demo_lecture_ids)).delete(synchronize_session=False) if demo_lecture_ids else 0
    return deleted


def generate(seed: int, semester_start: date, semester_end: date, apply: bool) -> dict[str, Any]:
    version = generation_version(seed, semester_start, semester_end)
    db = SessionLocal()
    counts = {
        "lectures": 0,
        "attendance_records": 0,
        "assignments": 0,
        "submissions": 0,
        "quizzes": 0,
        "questions": 0,
        "attempts": 0,
    }
    try:
        occurrences = db.query(models.ScheduleOccurrence).filter(
            models.ScheduleOccurrence.course_id.isnot(None),
            models.ScheduleOccurrence.faculty_id.isnot(None),
        ).all()
        if not occurrences:
            raise RuntimeError(
                "No approved schedule occurrences are available. Import the reviewed timetable first."
            )
        batch_occurrence_ids = {
            row.occurrence_id for row in db.query(models.ScheduleBatchGroup.occurrence_id).distinct().all()
        }
        eligible_occurrences = [
            occurrence for occurrence in occurrences if occurrence.id not in batch_occurrence_ids
        ]
        assignments = db.query(models.ClassCourse).all()
        if not assignments:
            raise RuntimeError("No class/course/faculty assignments are available")

        scheduled_dates, excluded_dates = teaching_dates(db, semester_start, semester_end)
        if not apply:
            teaching_days = sum(
                1
                for current_date in scheduled_dates
                for occurrence in eligible_occurrences
                if WEEKDAYS.get(current_date.weekday()) == occurrence.day_of_week
            )
            return {
                "mode": "dry-run",
                "generationVersion": version,
                "eligibleScheduleOccurrences": len(eligible_occurrences),
                "batchOccurrencesSkipped": len(occurrences) - len(eligible_occurrences),
                "calendarExcludedDates": excluded_dates,
                "projectedConductedLectures": teaching_days,
                "classCourseAssignments": len(assignments),
            }

        # SQLAlchemy begins a read transaction for the validation queries
        # above. End it before opening the single atomic write transaction.
        db.rollback()
        with db.begin():
            for current_date in scheduled_dates:
                day_name = WEEKDAYS.get(current_date.weekday())
                if not day_name:
                    continue
                for occurrence in eligible_occurrences:
                    if occurrence.day_of_week != day_name:
                        continue
                    lecture = db.query(models.Lecture).filter(
                        models.Lecture.schedule_occurrence_id == occurrence.id,
                        models.Lecture.date == current_date.isoformat(),
                        models.Lecture.generation_version == version,
                    ).first()
                    if not lecture:
                        course = db.query(models.CourseModel).filter(models.CourseModel.id == occurrence.course_id).one()
                        faculty = db.query(models.User).filter(models.User.id == occurrence.faculty_id).one()
                        lecture = models.Lecture(
                            schedule_occurrence_id=occurrence.id,
                            class_id=None,
                            course_id=course.id,
                            course_name=course.name,
                            course_code=course.code,
                            scheduled_faculty_id=faculty.id,
                            scheduled_faculty_name=faculty.name,
                            actual_faculty_id=faculty.id,
                            actual_faculty_name=faculty.name,
                            date=current_date.isoformat(),
                            start_time=occurrence.start_time,
                            end_time=occurrence.end_time,
                            lecture_type="Regular",
                            classroom=occurrence.classroom or "Not provided",
                            status="Conducted",
                            source="synthetic",
                            is_demo=True,
                            generation_version=version,
                        )
                        db.add(lecture)
                        db.flush()
                    counts["lectures"] += 1
                    class_ids = [
                        row.class_id for row in db.query(models.ScheduleClassMembership).filter(
                            models.ScheduleClassMembership.occurrence_id == occurrence.id
                        ).all()
                    ]
                    existing_memberships = {
                        row.class_id for row in db.query(models.LectureClassMembership).filter(
                            models.LectureClassMembership.lecture_id == lecture.id
                        ).all()
                    }
                    for class_id in set(class_ids) - existing_memberships:
                        db.add(models.LectureClassMembership(lecture_id=lecture.id, class_id=class_id))
                    students = db.query(models.StudentRecord).filter(
                        models.StudentRecord.class_id.in_(class_ids)
                    ).all()
                    for student in students:
                        existing = db.query(models.Attendance).filter(
                            models.Attendance.lecture_id == lecture.id,
                            models.Attendance.student_id == student.id,
                        ).first()
                        if existing:
                            continue
                        target_rate = 0.65 + stable_fraction(seed, student.id, occurrence.course_id, "rate") * 0.33
                        present = stable_fraction(seed, student.id, occurrence.id, current_date) < target_rate
                        db.add(
                            models.Attendance(
                                lecture_id=lecture.id,
                                student_id=student.id,
                                status="Present" if present else "Absent",
                                marked_by=occurrence.faculty_id,
                                source="synthetic",
                                is_demo=True,
                                generation_version=version,
                            )
                        )
                        counts["attendance_records"] += 1

            for assignment_link in assignments:
                students = db.query(models.StudentRecord).filter(
                    models.StudentRecord.class_id == assignment_link.class_id
                ).all()
                course = db.query(models.CourseModel).filter(models.CourseModel.id == assignment_link.course_id).one()
                for sequence in (1, 2):
                    assignment_id = f"DEMO-A-{assignment_link.class_id}-{course.code}-{sequence}"
                    assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
                    if not assignment:
                        due = semester_end - timedelta(days=(3 - sequence) * 10)
                        assignment = models.Assignment(
                            id=assignment_id,
                            course_id=course.id,
                            course_name=course.name,
                            course_code=course.code,
                            class_id=assignment_link.class_id,
                            title=f"{course.code} Demonstration Assignment {sequence}",
                            description="Synthetic demonstration record generated for SmartClass validation.",
                            due_date=due.isoformat(),
                            marks=20,
                            allow_late=True,
                            created_by=assignment_link.faculty_id,
                            source="synthetic",
                            is_demo=True,
                            generation_version=version,
                        )
                        db.add(assignment)
                    counts["assignments"] += 1
                    for student in students:
                        if stable_fraction(seed, assignment_id, student.id, "submit") < 0.08:
                            continue
                        existing = db.query(models.AssignmentSubmission).filter(
                            models.AssignmentSubmission.assignment_id == assignment_id,
                            models.AssignmentSubmission.student_id == student.id,
                        ).first()
                        if existing:
                            continue
                        score = round(8 + stable_fraction(seed, assignment_id, student.id, "score") * 12, 1)
                        db.add(
                            models.AssignmentSubmission(
                                assignment_id=assignment_id,
                                student_id=student.id,
                                student_name=student.name,
                                submitted_at=f"{assignment.due_date}T12:00:00",
                                submission_file="synthetic-record-no-file",
                                status="graded",
                                obtained_marks=score,
                                feedback="Demonstration feedback generated from a fixed seed.",
                                graded_by=assignment_link.faculty_id,
                                graded_at=f"{assignment.due_date}T18:00:00",
                                source="synthetic",
                                is_demo=True,
                                generation_version=version,
                            )
                        )
                        counts["submissions"] += 1

                for sequence in (1, 2):
                    quiz_id = f"DEMO-Q-{assignment_link.class_id}-{course.code}-{sequence}"
                    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
                    quiz_date = semester_end - timedelta(days=(3 - sequence) * 7)
                    if not quiz:
                        quiz = models.Quiz(
                            id=quiz_id,
                            course_id=course.id,
                            course_name=course.name,
                            course_code=course.code,
                            class_id=assignment_link.class_id,
                            title=f"{course.code} Demonstration Quiz {sequence}",
                            duration_minutes=20,
                            max_attempts=1,
                            opens_at=f"{quiz_date.isoformat()} 09:00",
                            closes_at=f"{quiz_date.isoformat()} 18:00",
                            status="completed",
                            topics_json=json.dumps(["Fundamentals", "Applied Concepts"]),
                            is_released=True,
                            created_by=assignment_link.faculty_id,
                            source="synthetic",
                            is_demo=True,
                            generation_version=version,
                        )
                        db.add(quiz)
                        db.flush()
                    counts["quizzes"] += 1
                    questions = db.query(models.QuizQuestion).filter(models.QuizQuestion.quiz_id == quiz_id).all()
                    if not questions:
                        for question_index in range(4):
                            question = models.QuizQuestion(
                                quiz_id=quiz_id,
                                question_text=f"Demonstration {course.code} objective question {question_index + 1}",
                                options_json=json.dumps(["Option A", "Option B", "Option C", "Option D"]),
                                correct_option=question_index % 4,
                                marks=1,
                                topic="Fundamentals" if question_index < 2 else "Applied Concepts",
                            )
                            db.add(question)
                        db.flush()
                        questions = db.query(models.QuizQuestion).filter(models.QuizQuestion.quiz_id == quiz_id).all()
                    counts["questions"] += len(questions)
                    for student in students:
                        existing = db.query(models.QuizAttempt).filter(
                            models.QuizAttempt.quiz_id == quiz_id,
                            models.QuizAttempt.student_id == student.id,
                        ).first()
                        if existing:
                            continue
                        answers = {}
                        score = 0
                        for question in questions:
                            correct = stable_fraction(seed, quiz_id, student.id, question.id) < (
                                0.55 + stable_fraction(seed, student.id, course.id, "quiz-rate") * 0.4
                            )
                            selected = question.correct_option if correct else (question.correct_option + 1) % 4
                            answers[str(question.id)] = selected
                            if correct:
                                score += question.marks
                        db.add(
                            models.QuizAttempt(
                                quiz_id=quiz_id,
                                student_id=student.id,
                                started_at=datetime.combine(quiz_date, time(9, 0)),
                                submitted_at=datetime.combine(quiz_date, time(9, 15)),
                                answers_json=json.dumps(answers, sort_keys=True),
                                score=score,
                                total_marks=sum(question.marks for question in questions),
                                source="synthetic",
                                is_demo=True,
                                generation_version=version,
                            )
                        )
                        counts["attempts"] += 1
        return {"mode": "applied", "generationVersion": version, **counts}
    finally:
        db.close()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=int, default=2026)
    parser.add_argument("--semester-start", required=True, type=date.fromisoformat)
    parser.add_argument("--semester-end", required=True, type=date.fromisoformat)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true")
    mode.add_argument("--apply", action="store_true")
    parser.add_argument("--reset-demo-only", action="store_true")
    parser.add_argument("--confirm-reset", choices=["RESET-DEMO-ONLY"])
    args = parser.parse_args()
    if args.semester_end < args.semester_start:
        parser.error("--semester-end must not precede --semester-start")
    if args.reset_demo_only:
        if args.confirm_reset != "RESET-DEMO-ONLY":
            parser.error("--reset-demo-only requires --confirm-reset RESET-DEMO-ONLY")
        db = SessionLocal()
        try:
            with db.begin():
                deleted = reset_demo_only(db)
            print(json.dumps({"mode": "reset-demo-only", "deleted": deleted}, indent=2))
        finally:
            db.close()
        if not args.apply:
            return 0
    result = generate(args.seed, args.semester_start, args.semester_end, args.apply)
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
