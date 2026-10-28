"""Create one shared, accessible demonstration quiz per imported subject."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPOSITORY_ROOT / "backend"))

import models  # noqa: E402
from database import SessionLocal  # noqa: E402


BANKS = {
    "TCS": [
        ("Which machine recognizes exactly the regular languages?", ["Finite automaton", "Pushdown automaton", "Turing machine only", "Linear bounded automaton"], 0, "Finite Automata"),
        ("The pumping lemma is commonly used to prove that a language is what?", ["Finite", "Not regular", "Deterministic", "Ambiguous"], 1, "Regular Languages"),
        ("Which grammar type generates context-free languages?", ["Type 0", "Type 1", "Type 2", "Type 3 only"], 2, "Grammars"),
        ("A pushdown automaton adds which storage structure to a finite automaton?", ["Queue", "Stack", "Heap", "Register file"], 1, "Pushdown Automata"),
        ("Which problem is undecidable?", ["DFA membership", "DFA emptiness", "Halting problem", "Regular expression matching"], 2, "Computability"),
        ("The complement of a regular language is what?", ["Always regular", "Never regular", "Always finite", "Context-sensitive only"], 0, "Closure Properties"),
        ("A DFA transition function maps a state and input symbol to what?", ["A set of grammars", "Exactly one state", "A stack symbol", "An output string"], 1, "Finite Automata"),
        ("Which normal form restricts CFG productions mainly to A→BC or A→a?", ["Greibach", "Chomsky", "Backus-Naur", "Kleene"], 1, "Grammars"),
    ],
    "ML": [
        ("Which learning setting uses labelled examples?", ["Supervised learning", "Unsupervised learning", "Reinforcement learning only", "Clustering"], 0, "Foundations"),
        ("Overfitting means a model performs well on training data but how on unseen data?", ["Identically", "Poorly", "Without features", "Only faster"], 1, "Generalization"),
        ("Which metric is TP/(TP+FP)?", ["Recall", "Precision", "Accuracy", "Specificity"], 1, "Evaluation"),
        ("Gradient descent updates parameters in which direction?", ["Along the gradient", "Opposite the gradient", "Randomly only", "Toward zero always"], 1, "Optimization"),
        ("Which algorithm is naturally used for clustering?", ["K-means", "Linear regression", "Naive Bayes", "Logistic regression"], 0, "Clustering"),
        ("A decision-tree split commonly maximizes what?", ["Learning rate", "Information gain", "Epoch count", "Feature count"], 1, "Decision Trees"),
        ("Regularization primarily helps reduce what?", ["Underflow", "Overfitting", "Data collection", "Label count"], 1, "Generalization"),
        ("A confusion matrix summarizes predictions for what kind of task?", ["Classification", "Sorting", "Compression", "Parsing"], 0, "Evaluation"),
    ],
    "CSS": [
        ("Which security property ensures data is not altered without detection?", ["Availability", "Integrity", "Confidentiality", "Non-repudiation only"], 1, "Security Goals"),
        ("AES is what type of cipher?", ["Asymmetric", "Symmetric block", "Stream-only public key", "Hash function"], 1, "Symmetric Cryptography"),
        ("RSA security relies primarily on the difficulty of what?", ["Sorting", "Integer factorization", "Graph coloring", "String matching"], 1, "Public Key Cryptography"),
        ("A cryptographic hash should make finding two inputs with the same digest difficult. This is called?", ["Collision resistance", "Availability", "Key escrow", "Forwarding"], 0, "Hash Functions"),
        ("Which protocol commonly secures web traffic?", ["FTP", "TLS", "ARP", "DHCP"], 1, "Network Security"),
        ("A digital signature is verified using whose key?", ["Recipient's private key", "Signer's public key", "Signer's private key", "A shared password"], 1, "Digital Signatures"),
        ("What does a nonce primarily prevent?", ["Replay attacks", "Compression", "Backups", "Routing loops"], 0, "Protocols"),
        ("Principle of least privilege grants users what?", ["All permissions", "Minimum necessary permissions", "Temporary passwords only", "Network access only"], 1, "Access Control"),
    ],
    "SSD": [
        ("High cohesion means a module's responsibilities are what?", ["Closely related", "Widely unrelated", "Duplicated", "Unspecified"], 0, "Design Quality"),
        ("Low coupling between modules generally improves what?", ["Maintainability", "Global state", "Duplication", "Build size only"], 0, "Design Quality"),
        ("Which SOLID principle says a class should have one reason to change?", ["Open/Closed", "Single Responsibility", "Liskov Substitution", "Dependency Inversion"], 1, "SOLID"),
        ("The Factory pattern primarily encapsulates what?", ["Object creation", "Database storage", "Network transport", "User input"], 0, "Creational Patterns"),
        ("The Observer pattern defines what relationship?", ["One-to-many notification", "Sorting order", "Inheritance only", "Database locking"], 0, "Behavioral Patterns"),
        ("A UML sequence diagram emphasizes what?", ["Object interactions over time", "Deployment hardware", "Database columns", "Package ownership only"], 0, "UML"),
        ("Dependency inversion recommends depending on what?", ["Concrete utilities", "Abstractions", "Global variables", "UI classes"], 1, "SOLID"),
        ("Which pattern provides a simplified interface to a complex subsystem?", ["Facade", "Iterator", "Prototype", "Command"], 0, "Structural Patterns"),
    ],
    "DWM": [
        ("A data warehouse is primarily optimized for what?", ["Analytical queries", "Single-row transaction updates", "Device drivers", "Source compilation"], 0, "Warehousing"),
        ("In a star schema, dimension tables connect directly to what?", ["Fact table", "Other dimensions only", "Log files", "Source code"], 0, "Dimensional Modeling"),
        ("ETL stands for what?", ["Extract, Transform, Load", "Evaluate, Test, Link", "Encode, Transfer, Log", "Extract, Train, Learn"], 0, "ETL"),
        ("Which OLAP operation selects one value of a dimension?", ["Slice", "Drill-down", "Roll-up", "Pivot only"], 0, "OLAP"),
        ("Support in association-rule mining measures what?", ["Frequency of an itemset", "Rule execution time", "Number of dimensions", "Classification error"], 0, "Association Mining"),
        ("Confidence for X→Y estimates what?", ["P(Y|X)", "P(X)+P(Y)", "Warehouse size", "Cluster distance"], 0, "Association Mining"),
        ("A fact table commonly contains what?", ["Measures and foreign keys", "Only descriptive text", "Application source code", "User passwords"], 0, "Dimensional Modeling"),
        ("Data cleaning is used to handle what?", ["Missing and inconsistent values", "CPU scheduling", "Encryption keys", "UI layouts"], 0, "Preprocessing"),
    ],
    "DE": [
        ("A data pipeline moves and transforms data between what?", ["Sources and destinations", "Only UI components", "CPU registers", "Encryption algorithms"], 0, "Pipelines"),
        ("Batch processing handles data primarily how?", ["In collected groups", "One event with zero latency", "Only in browsers", "Without storage"], 0, "Processing Models"),
        ("Which property allows a repeated pipeline operation to produce the same final state?", ["Idempotency", "Volatility", "Coupling", "Recursion"], 0, "Reliability"),
        ("Data partitioning is commonly used to improve what?", ["Parallelism and scalability", "Password strength", "UI contrast", "Code indentation"], 0, "Distributed Data"),
        ("A schema registry is especially useful for managing what?", ["Data-contract versions", "CPU temperature", "Web fonts", "User sessions only"], 0, "Data Contracts"),
        ("Exactly-once semantics aim to ensure an event affects results how many times?", ["At most zero", "Exactly one", "At least two", "An unknown number"], 1, "Streaming"),
        ("Which format is columnar and suited to analytics?", ["Parquet", "Plain bitmap", "HTML", "Executable binary"], 0, "Storage Formats"),
        ("A data quality check might validate what?", ["Null rates and ranges", "Screen resolution", "Keyboard layout", "Compiler flags"], 0, "Data Quality"),
    ],
    "SEA": [
        ("Software architecture describes a system's high-level components and what?", ["Their interactions", "Only variable names", "Only test data", "Keyboard shortcuts"], 0, "Architecture"),
        ("Which architectural style exposes resources through HTTP interfaces?", ["REST", "Batch file", "Shared memory only", "Assembly pipeline"], 0, "Architectural Styles"),
        ("A quality attribute scenario specifies stimulus, environment, response, and what?", ["Response measure", "Password", "File extension", "Color palette"], 0, "Quality Attributes"),
        ("Horizontal scaling adds what?", ["More service instances", "More code to one method", "Only CPU frequency", "More table columns"], 0, "Scalability"),
        ("A circuit breaker helps prevent what?", ["Cascading service failures", "Database normalization", "Source formatting", "User registration"], 0, "Resilience"),
        ("Which tactic improves availability by duplicating components?", ["Redundancy", "Obfuscation", "Inlining", "Minification"], 0, "Availability"),
        ("An architecture decision record captures what?", ["A decision and its rationale", "Only source code", "Only test output", "User passwords"], 0, "Documentation"),
        ("Modifiability is improved by localizing what?", ["Expected changes", "All data globally", "Every dependency", "Runtime failures"], 0, "Quality Attributes"),
    ],
    "CCL": [
        ("Cloud elasticity means resources can do what?", ["Scale with demand", "Never change", "Run only offline", "Avoid virtualization"], 0, "Cloud Fundamentals"),
        ("IaaS primarily provides what?", ["Virtualized compute, storage, and networking", "Only finished business software", "Only source control", "Only email"], 0, "Service Models"),
        ("A container image is best described as what?", ["Immutable application package", "Running process only", "Physical server", "Database transaction"], 0, "Containers"),
        ("Which command commonly lists running Docker containers?", ["docker ps", "docker initdb", "docker grep", "docker route"], 0, "Containers"),
        ("A Kubernetes Deployment manages what?", ["Replica sets and pod rollout", "Physical cabling", "SQL joins", "DNS registration only"], 0, "Orchestration"),
        ("Object storage organizes data primarily as what?", ["Objects in buckets", "CPU pages", "Relational rows only", "Stack frames"], 0, "Cloud Storage"),
        ("A load balancer distributes what?", ["Requests across targets", "Source code across files", "Passwords across users", "Tables across columns"], 0, "Networking"),
        ("Infrastructure as Code makes infrastructure what?", ["Versionable and repeatable", "Manual only", "Unmonitored", "Hardware-specific only"], 0, "Automation"),
    ],
}


def seed(apply: bool) -> dict:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    report = {"mode": "apply" if apply else "dry-run", "quizzes": len(BANKS), "questions": sum(map(len, BANKS.values())), "created": 0, "updated": 0, "archivedDuplicates": 0}
    if not apply:
        return report
    db = SessionLocal()
    try:
        with db.begin():
            old = db.query(models.Quiz).filter(models.Quiz.is_demo == True).all()
            for quiz in old:
                if quiz.generation_version == "demo-final-v1":
                    continue
                if quiz.is_released:
                    quiz.is_released = False
                    quiz.status = "completed"
                    report["archivedDuplicates"] += 1
            class_ids = [row.id for row in db.query(models.ClassModel).order_by(models.ClassModel.id)]
            for course_id, questions in BANKS.items():
                course = db.get(models.CourseModel, course_id)
                assignment = db.query(models.ClassCourse).filter_by(course_id=course_id).order_by(models.ClassCourse.faculty_id).first()
                if not course or not assignment:
                    raise RuntimeError(f"Missing imported course or faculty assignment for {course_id}")
                quiz_id = f"DEMO-FINAL-{course_id}"
                quiz = db.get(models.Quiz, quiz_id)
                if not quiz:
                    quiz = models.Quiz(id=quiz_id)
                    db.add(quiz)
                    report["created"] += 1
                else:
                    report["updated"] += 1
                quiz.course_id = course.id
                quiz.course_name = course.name
                quiz.course_code = course.code
                quiz.class_id = None
                quiz.title = f"{course.name} Demonstration Quiz"
                quiz.duration_minutes = 20
                quiz.max_attempts = 2
                quiz.opens_at = (now - timedelta(days=1)).isoformat(timespec="seconds")
                quiz.closes_at = (now + timedelta(days=60)).isoformat(timespec="seconds")
                quiz.status = "available"
                quiz.topics_json = json.dumps(sorted({item[3] for item in questions}))
                quiz.is_released = True
                quiz.created_by = assignment.faculty_id
                quiz.source = "synthetic"
                quiz.is_demo = True
                quiz.generation_version = "demo-final-v1"
                db.flush()
                for class_id in class_ids:
                    if not db.query(models.QuizClassMembership).filter_by(quiz_id=quiz.id, class_id=class_id).first():
                        db.add(models.QuizClassMembership(quiz_id=quiz.id, class_id=class_id))
                if db.query(models.QuizQuestion).filter_by(quiz_id=quiz.id).count() == 0:
                    for text, options, correct, topic in questions:
                        db.add(models.QuizQuestion(quiz_id=quiz.id, question_text=text, options_json=json.dumps(options), correct_option=correct, marks=1, topic=topic))
    finally:
        db.close()
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    print(json.dumps(seed(args.apply), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
