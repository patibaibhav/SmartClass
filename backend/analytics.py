from __future__ import annotations

import json
from collections import defaultdict
from typing import Any

from sqlalchemy.orm import Session

import models


STRONG_THRESHOLD = 80.0
NEEDS_IMPROVEMENT_THRESHOLD = 60.0
MIN_QUESTIONS_PER_TOPIC = 3
MIN_TESTS_PER_TOPIC = 2


def build_topic_performance_insights(
    db: Session,
    *,
    student_id: str,
    course_id: str | None = None,
) -> dict[str, Any]:
    quiz_query = db.query(models.Quiz).filter(models.Quiz.is_released == True)
    if course_id:
        quiz_query = quiz_query.filter(models.Quiz.course_id == course_id)
    quizzes = {quiz.id: quiz for quiz in quiz_query.all()}
    if not quizzes:
        return _empty_insights(course_id)

    attempts = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.student_id == student_id,
        models.QuizAttempt.quiz_id.in_(quizzes),
    ).order_by(models.QuizAttempt.submitted_at.asc()).all()
    topic_totals: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"earned": 0.0, "possible": 0.0, "questions": 0, "tests": set()}
    )
    test_performance: list[dict[str, Any]] = []

    for attempt in attempts:
        questions = db.query(models.QuizQuestion).filter(
            models.QuizQuestion.quiz_id == attempt.quiz_id
        ).all()
        answers = json.loads(attempt.answers_json or "{}")
        for question in questions:
            topic = question.topic or "General"
            stats = topic_totals[topic]
            stats["possible"] += question.marks
            stats["questions"] += 1
            stats["tests"].add(attempt.quiz_id)
            if answers.get(str(question.id)) == question.correct_option:
                stats["earned"] += question.marks
        percentage = (
            round(attempt.score / attempt.total_marks * 100, 1)
            if attempt.total_marks
            else 0.0
        )
        test_performance.append(
            {
                "quizId": attempt.quiz_id,
                "submittedAt": attempt.submitted_at.isoformat(),
                "percentage": percentage,
            }
        )

    topics = []
    strong_topics = []
    weak_topics = []
    developing_topics = []
    for topic, stats in sorted(topic_totals.items()):
        percentage = (
            round(stats["earned"] / stats["possible"] * 100, 1)
            if stats["possible"]
            else 0.0
        )
        sufficient = (
            stats["questions"] >= MIN_QUESTIONS_PER_TOPIC
            and len(stats["tests"]) >= MIN_TESTS_PER_TOPIC
        )
        if not sufficient:
            classification = "insufficient-evidence"
        elif percentage >= STRONG_THRESHOLD:
            classification = "strong"
            strong_topics.append(topic)
        elif percentage < NEEDS_IMPROVEMENT_THRESHOLD:
            classification = "needs-improvement"
            weak_topics.append(topic)
        else:
            classification = "developing"
            developing_topics.append(topic)
        topics.append(
            {
                "topic": topic,
                "accuracy": percentage,
                "earnedMarks": stats["earned"],
                "possibleMarks": stats["possible"],
                "questionCount": stats["questions"],
                "testCount": len(stats["tests"]),
                "classification": classification,
            }
        )

    trend = {"direction": "insufficient-data", "changePercentagePoints": None}
    if len(test_performance) >= 2:
        change = round(
            test_performance[-1]["percentage"] - test_performance[-2]["percentage"],
            1,
        )
        trend = {
            "direction": "improving" if change > 2 else "declining" if change < -2 else "stable",
            "changePercentagePoints": change,
        }

    recommendations = [f"Review and practise {topic}." for topic in weak_topics]
    recommendations.extend(
        f"Continue targeted practice in {topic}." for topic in developing_topics
    )
    if not recommendations:
        recommendations.append(
            "Complete more released quizzes to increase topic coverage."
            if not topics or any(topic["classification"] == "insufficient-evidence" for topic in topics)
            else "Maintain current study habits and revisit topics periodically."
        )

    return {
        "title": "Topic-wise Performance Insights (rule-based)",
        "advisory": True,
        "courseId": course_id,
        "attemptCount": len(attempts),
        "thresholds": {
            "strongAtOrAbove": STRONG_THRESHOLD,
            "needsImprovementBelow": NEEDS_IMPROVEMENT_THRESHOLD,
            "minimumQuestionsPerTopic": MIN_QUESTIONS_PER_TOPIC,
            "minimumTestsPerTopic": MIN_TESTS_PER_TOPIC,
        },
        "strongTopics": strong_topics,
        "weakTopics": weak_topics,
        "developingTopics": developing_topics,
        "topics": topics,
        "trend": trend,
        "recommendations": recommendations,
        "testPerformance": test_performance,
    }


def _empty_insights(course_id: str | None) -> dict[str, Any]:
    return {
        "title": "Topic-wise Performance Insights (rule-based)",
        "advisory": True,
        "courseId": course_id,
        "attemptCount": 0,
        "thresholds": {
            "strongAtOrAbove": STRONG_THRESHOLD,
            "needsImprovementBelow": NEEDS_IMPROVEMENT_THRESHOLD,
            "minimumQuestionsPerTopic": MIN_QUESTIONS_PER_TOPIC,
            "minimumTestsPerTopic": MIN_TESTS_PER_TOPIC,
        },
        "strongTopics": [],
        "weakTopics": [],
        "developingTopics": [],
        "topics": [],
        "trend": {"direction": "insufficient-data", "changePercentagePoints": None},
        "recommendations": ["Complete released quizzes to generate topic insights."],
        "testPerformance": [],
    }
