export type Role = 'student' | 'faculty' | 'admin' | 'council';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isHOD?: boolean;
  department: string;
  class?: string;
  avatar?: string;
  firstLogin?: boolean;
}

export const USERS: User[] = [
  { id: 'STU001', name: 'Arjun Sharma', email: 'arjun.sharma@smartclass.edu', role: 'student', department: 'Computer Science', class: 'SE-A' },
  { id: 'FAC001', name: 'Prof. Meera Patel', email: 'meera.patel@smartclass.edu', role: 'faculty', department: 'Computer Science', isHOD: false },
  { id: 'FAC002', name: 'Prof. Rajesh Mehta', email: 'rajesh.mehta@smartclass.edu', role: 'faculty', department: 'Computer Science', isHOD: true },
  { id: 'ADM001', name: 'Sunita Nair', email: 'sunita.nair@smartclass.edu', role: 'admin', department: 'Administration' },
  { id: 'CON001', name: 'Priya Desai', email: 'priya.desai@smartclass.edu', role: 'council', department: 'Computer Science' },
];

export const COURSES = [
  { id: 'CS301', code: 'CS301', name: 'Data Structures & Algorithms', faculty: 'Prof. Meera Patel', credits: 4 },
  { id: 'CS302', code: 'CS302', name: 'Database Management Systems', faculty: 'Prof. Rajesh Mehta', credits: 4 },
  { id: 'CS303', code: 'CS303', name: 'Operating Systems', faculty: 'Prof. Anita Singh', credits: 3 },
  { id: 'CS304', code: 'CS304', name: 'Computer Networks', faculty: 'Prof. Vikram Joshi', credits: 3 },
  { id: 'CS305', code: 'CS305', name: 'Software Engineering', faculty: 'Prof. Deepa Rao', credits: 3 },
];

export const STUDENTS = [
  { id: 'STU001', name: 'Arjun Sharma', rollNo: '22CS001', class: 'SE-A' },
  { id: 'STU002', name: 'Priya Malhotra', rollNo: '22CS002', class: 'SE-A' },
  { id: 'STU003', name: 'Rohan Gupta', rollNo: '22CS003', class: 'SE-A' },
  { id: 'STU004', name: 'Sneha Iyer', rollNo: '22CS004', class: 'SE-A' },
  { id: 'STU005', name: 'Karan Bhat', rollNo: '22CS005', class: 'SE-A' },
  { id: 'STU006', name: 'Ananya Krishnan', rollNo: '22CS006', class: 'SE-A' },
  { id: 'STU007', name: 'Vikram Nair', rollNo: '22CS007', class: 'SE-A' },
  { id: 'STU008', name: 'Pooja Sharma', rollNo: '22CS008', class: 'SE-A' },
  { id: 'STU009', name: 'Aditya Verma', rollNo: '22CS009', class: 'SE-A' },
  { id: 'STU010', name: 'Riya Pillai', rollNo: '22CS010', class: 'SE-A' },
  { id: 'STU011', name: 'Siddharth Rao', rollNo: '22CS011', class: 'SE-A' },
  { id: 'STU012', name: 'Kavya Reddy', rollNo: '22CS012', class: 'SE-A' },
];

export const ATTENDANCE_DATA = [
  { course: 'CS301', name: 'Data Structures & Algorithms', total: 42, present: 39, percentage: 92.9 },
  { course: 'CS302', name: 'Database Management Systems', total: 38, present: 30, percentage: 78.9 },
  { course: 'CS303', name: 'Operating Systems', total: 37, present: 24, percentage: 64.9 },
  { course: 'CS304', name: 'Computer Networks', total: 36, present: 33, percentage: 91.7 },
  { course: 'CS305', name: 'Software Engineering', total: 34, present: 30, percentage: 88.2 },
];

export const TIMETABLE = {
  Monday: [
    { time: '09:00–10:00', course: 'Data Structures', code: 'CS301', faculty: 'Prof. Patel', room: 'A-204', type: 'Regular' },
    { time: '10:00–11:00', course: 'Database Systems', code: 'CS302', faculty: 'Prof. Mehta', room: 'B-102', type: 'Regular' },
    { time: '11:15–12:15', course: 'Operating Systems', code: 'CS303', faculty: 'Prof. Singh', room: 'A-101', type: 'Regular' },
    { time: '14:00–15:00', course: 'Computer Networks', code: 'CS304', faculty: 'Prof. Joshi', room: 'C-301', type: 'Regular' },
  ],
  Tuesday: [
    { time: '09:00–10:00', course: 'Software Engineering', code: 'CS305', faculty: 'Prof. Rao', room: 'A-202', type: 'Regular' },
    { time: '10:00–11:00', course: 'Data Structures', code: 'CS301', faculty: 'Prof. Patel', room: 'A-204', type: 'Regular' },
    { time: '14:00–16:00', course: 'Database Systems Lab', code: 'CS302L', faculty: 'Prof. Mehta', room: 'Lab-2', type: 'Regular' },
  ],
  Wednesday: [
    { time: '09:00–10:00', course: 'Operating Systems', code: 'CS303', faculty: 'Prof. Singh', room: 'A-101', type: 'Regular' },
    { time: '10:00–11:00', course: 'Computer Networks', code: 'CS304', faculty: 'Prof. Joshi', room: 'C-301', type: 'Substitute' },
    { time: '11:15–12:15', course: 'Software Engineering', code: 'CS305', faculty: 'Prof. Rao', room: 'A-202', type: 'Regular' },
    { time: '14:00–15:00', course: 'Data Structures', code: 'CS301', faculty: 'Prof. Patel', room: 'A-204', type: 'Extra' },
  ],
  Thursday: [
    { time: '09:00–10:00', course: 'Database Systems', code: 'CS302', faculty: 'Prof. Mehta', room: 'B-102', type: 'Regular' },
    { time: '10:00–11:00', course: 'Operating Systems', code: 'CS303', faculty: 'Prof. Singh', room: 'A-101', type: 'Regular' },
    { time: '14:00–16:00', course: 'Networks Lab', code: 'CS304L', faculty: 'Prof. Joshi', room: 'Lab-3', type: 'Regular' },
  ],
  Friday: [
    { time: '09:00–10:00', course: 'Computer Networks', code: 'CS304', faculty: 'Prof. Joshi', room: 'C-301', type: 'Regular' },
    { time: '10:00–11:00', course: 'Software Engineering', code: 'CS305', faculty: 'Prof. Rao', room: 'A-202', type: 'Regular' },
    { time: '11:15–12:15', course: 'Database Systems', code: 'CS302', faculty: 'Prof. Mehta', room: 'B-102', type: 'Cancelled' },
    { time: '14:00–15:00', course: 'Data Structures', code: 'CS301', faculty: 'Prof. Patel', room: 'A-204', type: 'Regular' },
  ],
};

export const ASSIGNMENTS = [
  {
    id: 'A001', title: 'Normalization Assignment', course: 'Database Management Systems', courseCode: 'CS302',
    dueDate: '2024-08-18', marks: 20, status: 'pending', description: 'Normalize the given hospital database schema to 3NF and BCNF. Submit a detailed report with ER diagrams.',
    submittedAt: null, submissionFile: null
  },
  {
    id: 'A002', title: 'Binary Tree Implementation', course: 'Data Structures & Algorithms', courseCode: 'CS301',
    dueDate: '2024-08-12', marks: 25, status: 'submitted', description: 'Implement AVL tree with insertion, deletion, and traversal. Include time complexity analysis.',
    submittedAt: '2024-08-11T14:42:00', submissionFile: 'avl_tree.zip'
  },
  {
    id: 'A003', title: 'Process Scheduling Report', course: 'Operating Systems', courseCode: 'CS303',
    dueDate: '2024-08-05', marks: 15, status: 'graded', description: 'Compare FCFS, SJF, Round Robin, and Priority scheduling with Gantt charts.',
    submittedAt: '2024-08-04T09:30:00', submissionFile: 'scheduling.pdf', obtainedMarks: 13, feedback: 'Good analysis of algorithms. Gantt charts are clear and accurate. Minor issues with preemptive SJF explanation.'
  },
  {
    id: 'A004', title: 'Network Topology Design', course: 'Computer Networks', courseCode: 'CS304',
    dueDate: '2024-07-28', marks: 20, status: 'overdue', description: 'Design a scalable network topology for a multi-branch organization.',
    submittedAt: null, submissionFile: null
  },
];

export const QUIZZES = [
  {
    id: 'Q001', title: 'DBMS Unit 2 Quiz', course: 'Database Management Systems', courseCode: 'CS302',
    questions: 10, duration: 15, opens: '2024-08-14 09:00', closes: '2024-08-16 23:59',
    status: 'available', topics: ['Normalization', 'SQL Joins', 'Indexing', 'Transactions']
  },
  {
    id: 'Q002', title: 'DSA Mid-Semester Test', course: 'Data Structures & Algorithms', courseCode: 'CS301',
    questions: 20, duration: 30, opens: '2024-08-20 10:00', closes: '2024-08-20 12:00',
    status: 'upcoming', topics: ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Sorting']
  },
  {
    id: 'Q003', title: 'OS Unit 1 Quiz', course: 'Operating Systems', courseCode: 'CS303',
    questions: 15, duration: 20, opens: '2024-08-01 09:00', closes: '2024-08-03 23:59',
    status: 'completed', score: 12, total: 15
  },
];

export const QUIZ_QUESTIONS = [
  {
    id: 1, question: 'Which normal form eliminates partial dependencies?',
    options: ['1NF', '2NF', '3NF', 'BCNF'], correct: 1
  },
  {
    id: 2, question: 'Which SQL join returns all rows from both tables, with NULLs where there is no match?',
    options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'], correct: 3
  },
  {
    id: 3, question: 'What is the purpose of a B+ tree index?',
    options: ['To sort records by primary key', 'To enable fast range queries and ordered access', 'To compress database tables', 'To enforce referential integrity'], correct: 1
  },
  {
    id: 4, question: 'ACID stands for:',
    options: ['Atomicity, Consistency, Isolation, Durability', 'Access, Consistency, Index, Data', 'Atomicity, Concurrency, Isolation, Distribution', 'Authorization, Consistency, Integrity, Distribution'], correct: 0
  },
  {
    id: 5, question: 'Which isolation level prevents dirty reads but allows non-repeatable reads?',
    options: ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'], correct: 1
  },
  {
    id: 6, question: 'What does a foreign key constraint enforce?',
    options: ['Uniqueness of values', 'Referential integrity between tables', 'Not null constraint', 'Check constraint'], correct: 1
  },
  {
    id: 7, question: 'Which SQL clause is used to filter grouped results?',
    options: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'], correct: 1
  },
  {
    id: 8, question: 'A relation is in BCNF if:',
    options: ['It is in 1NF and has no partial dependencies', 'Every determinant is a candidate key', 'It has no transitive dependencies', 'It has a single primary key'], correct: 1
  },
  {
    id: 9, question: 'Which index type is most efficient for exact-match lookups on a hash-distributed column?',
    options: ['B-tree index', 'Hash index', 'Bitmap index', 'Clustered index'], correct: 1
  },
  {
    id: 10, question: 'What is a phantom read?',
    options: ['Reading data modified by another transaction', 'A transaction reading rows that were inserted by another transaction', 'Reading stale cached data', 'Reading a rolled-back transaction'], correct: 1
  },
];

export const ANNOUNCEMENTS = [
  { id: 'AN001', title: 'Mid-Semester Examination Schedule Released', publisher: 'Academic Office', publisherRole: 'Admin', date: '2024-08-12', audience: 'College', content: 'The mid-semester examination schedule for August 2024 has been released. Please check the academic calendar for your examination dates. All examinations will be held in the Main Examination Hall. Bring your admit cards.', attachment: 'midsem_schedule_2024.pdf', type: 'College' },
  { id: 'AN002', title: 'Data Structures Assignment Deadline Extended', publisher: 'Prof. Meera Patel', publisherRole: 'Faculty', date: '2024-08-10', audience: 'SE-A — CS301', content: 'The deadline for the Binary Tree Implementation assignment has been extended to August 14, 2024. Please ensure you submit by the new deadline. No further extensions will be granted.', attachment: null, type: 'Course' },
  { id: 'AN003', title: 'Annual Technical Fest — TechSpark 2024', publisher: 'Tech Council', publisherRole: 'Council', date: '2024-08-08', audience: 'College', content: 'Registration for TechSpark 2024 is now open! This year features hackathon, paper presentation, coding contests, robotics, and much more. Register before August 20 for early bird benefits.', attachment: 'techspark2024_brochure.pdf', type: 'Events' },
  { id: 'AN004', title: 'DBMS Lab Practical Examination Date', publisher: 'Prof. Rajesh Mehta', publisherRole: 'Faculty', date: '2024-08-06', audience: 'SE-A — CS302', content: 'The DBMS lab practical examination will be conducted on August 25, 2024. The examination will cover SQL queries, normalization, and PL/SQL procedures. Bring your lab journal.', attachment: null, type: 'Course' },
];

export const EVENTS = [
  { id: 'EV001', title: 'TechSpark 2024 — Annual Technical Fest', council: 'Tech Council', date: '2024-08-25', startTime: '09:00', endTime: '18:00', venue: 'Main Auditorium & Sports Ground', description: 'Annual technical fest featuring hackathon, robotics, paper presentation, and coding contests.', organizer: 'Priya Desai', registrationLink: 'https://forms.smartclass.edu/techspark2024', visibility: 'College Wide' },
  { id: 'EV002', title: 'Chess & Board Games Championship', council: 'Sports Council', date: '2024-08-18', startTime: '10:00', endTime: '17:00', venue: 'Student Activity Centre', description: 'Inter-department chess championship and board game events. Open to all students.', organizer: 'Karan Shah', registrationLink: 'https://forms.smartclass.edu/chess2024', visibility: 'College Wide' },
  { id: 'EV003', title: 'Literary Fest — Wordcraft', council: 'Literary Council', date: '2024-09-05', startTime: '10:00', endTime: '16:00', venue: 'Seminar Hall A', description: 'Debate, creative writing, poetry slam, and book club discussions.', organizer: 'Aditya Kulkarni', registrationLink: null, visibility: 'College Wide' },
];

export const STUDY_MATERIALS = [
  { id: 'SM001', course: 'CS302', unit: 'Unit 1', title: 'Introduction to DBMS — Lecture Notes', type: 'PDF', size: '2.4 MB', uploadedBy: 'Prof. Rajesh Mehta', uploadedAt: '2024-07-15', description: 'Overview of DBMS concepts, data models, and RDBMS architecture.' },
  { id: 'SM002', course: 'CS302', unit: 'Unit 1', title: 'ER Diagrams & Data Modeling', type: 'PPT', size: '3.1 MB', uploadedBy: 'Prof. Rajesh Mehta', uploadedAt: '2024-07-18', description: 'Entity-relationship diagrams and relational mapping.' },
  { id: 'SM003', course: 'CS302', unit: 'Unit 2', title: 'SQL Fundamentals & Advanced Queries', type: 'PDF', size: '1.8 MB', uploadedBy: 'Prof. Rajesh Mehta', uploadedAt: '2024-07-25', description: 'DDL, DML, joins, subqueries, aggregation, and views.' },
  { id: 'SM004', course: 'CS302', unit: 'Unit 2', title: 'Normalization — 1NF to BCNF', type: 'PDF', size: '2.2 MB', uploadedBy: 'Prof. Rajesh Mehta', uploadedAt: '2024-08-01', description: 'Functional dependencies, normal forms, and decomposition.' },
  { id: 'SM005', course: 'CS302', unit: 'Unit 3', title: 'Transaction Management & Concurrency', type: 'PDF', size: '1.9 MB', uploadedBy: 'Prof. Rajesh Mehta', uploadedAt: '2024-08-08', description: 'ACID properties, serializability, deadlock, and recovery.' },
  { id: 'SM006', course: 'CS301', unit: 'Unit 1', title: 'Arrays, Stacks & Queues', type: 'PDF', size: '1.5 MB', uploadedBy: 'Prof. Meera Patel', uploadedAt: '2024-07-10', description: 'Linear data structures with implementation and analysis.' },
  { id: 'SM007', course: 'CS301', unit: 'Unit 2', title: 'Binary Trees & BST', type: 'PPT', size: '2.8 MB', uploadedBy: 'Prof. Meera Patel', uploadedAt: '2024-07-22', description: 'Tree traversals, AVL trees, and red-black trees.' },
];

export const GRIEVANCES = [
  { id: 'GR001', subject: 'Incorrect Attendance Record in CS303', category: 'Attendance', submittedAt: '2024-08-10', status: 'Under Review', lastUpdated: '2024-08-12', description: 'I was marked absent on August 5th in Operating Systems but I was present. I have signed the attendance sheet. Please verify and correct.' },
  { id: 'GR002', subject: 'Lab Facility Issue — Computer Lab 2', category: 'Infrastructure', submittedAt: '2024-07-28', status: 'Resolved', lastUpdated: '2024-08-05', description: 'Several computers in Lab 2 are not working. This is affecting our lab practicals.', resolution: 'Lab computers have been serviced. 8 faulty systems have been repaired. Thank you for reporting.' },
];

export const FORUMS = [
  { id: 'F001', course: 'CS302', courseCode: 'CS302', title: 'Can someone explain BCNF with an example?', author: 'Arjun Sharma', authorId: 'STU001', createdAt: '2024-08-11 14:22', replies: 12, lastReply: '2 hours ago', pinned: false, content: 'I understand 3NF but I am confused about BCNF. Can someone explain when a relation is in 3NF but not BCNF with a concrete example?' },
  { id: 'F002', course: 'CS302', courseCode: 'CS302', title: 'Important topics for Unit 3 exam', author: 'Sneha Iyer', authorId: 'STU004', createdAt: '2024-08-10 09:15', replies: 7, lastReply: '5 hours ago', pinned: true, content: 'What are the most important topics from Unit 3 (Transaction Management) for the mid-semester exam?' },
  { id: 'F003', course: 'CS302', courseCode: 'CS302', title: 'Doubt regarding Assignment 1 — Normalization steps', author: 'Rohan Gupta', authorId: 'STU003', createdAt: '2024-08-09 16:45', replies: 4, lastReply: '1 day ago', pinned: false, content: 'In the normalization assignment, should we normalize to BCNF or stop at 3NF?' },
  { id: 'F004', course: 'CS301', courseCode: 'CS301', title: 'AVL Tree rotation — right vs left-right', author: 'Priya Malhotra', authorId: 'STU002', createdAt: '2024-08-08 11:30', replies: 9, lastReply: '3 hours ago', pinned: false, content: 'I am confused about when to apply right rotation vs left-right rotation in AVL trees. Can someone help?' },
];

export const NOTIFICATIONS = [
  { id: 'N001', message: 'Assignment "Normalization Assignment" due tomorrow', type: 'warning', read: false, time: '1 hour ago', icon: 'assignment' },
  { id: 'N002', message: 'Quiz results for OS Unit 1 Quiz have been released', type: 'info', read: false, time: '3 hours ago', icon: 'quiz' },
  { id: 'N003', message: 'Your attendance in Operating Systems is below 75%', type: 'danger', read: false, time: '1 day ago', icon: 'attendance' },
  { id: 'N004', message: 'Timetable updated: Wednesday Computer Networks lecture is now a Substitute lecture', type: 'info', read: true, time: '2 days ago', icon: 'timetable' },
  { id: 'N005', message: 'New announcement: TechSpark 2024 registration open', type: 'default', read: true, time: '3 days ago', icon: 'announcement' },
  { id: 'N006', message: 'Prof. Patel uploaded new study material for Data Structures', type: 'default', read: true, time: '4 days ago', icon: 'material' },
];

export const CLASSROOMS = [
  { id: 'CR001', name: 'A-101', building: 'A Block', capacity: 60, facilities: ['Projector', 'AC'] },
  { id: 'CR002', name: 'A-102', building: 'A Block', capacity: 60, facilities: ['Projector', 'AC'] },
  { id: 'CR003', name: 'A-201', building: 'A Block', capacity: 80, facilities: ['Smart Board', 'AC'] },
  { id: 'CR004', name: 'A-204', building: 'A Block', capacity: 60, facilities: ['Projector'] },
  { id: 'CR005', name: 'B-102', building: 'B Block', capacity: 70, facilities: ['Projector', 'AC'] },
  { id: 'CR006', name: 'B-203', building: 'B Block', capacity: 50, facilities: ['Projector'] },
  { id: 'CR007', name: 'C-301', building: 'C Block', capacity: 90, facilities: ['Smart Board', 'AC', 'Recording'] },
  { id: 'CR008', name: 'Lab-2', building: 'Lab Block', capacity: 30, facilities: ['Computers', 'AC'] },
  { id: 'CR009', name: 'Lab-3', building: 'Lab Block', capacity: 30, facilities: ['Computers', 'AC'] },
];

export const AI_REPORT = {
  quizId: 'Q001',
  quizTitle: 'DBMS Unit 2 Quiz',
  score: 78,
  correct: 7,
  incorrect: 2,
  unattempted: 1,
  total: 10,
  strengths: ['SQL Joins', 'Normalization concepts', 'Relational integrity'],
  improvements: ['Indexing (B+ tree, Hash)', 'Transaction isolation levels', 'Query optimization'],
  suggestions: [
    'Review B+ tree and Hash index structures with practice problems',
    'Practice transaction isolation level scenarios — Read Committed vs Serializable',
    'Work through 5–8 query optimization examples from the textbook',
    'Attempt previous year questions on indexing',
  ],
  topicPerformance: [
    { topic: 'Normalization', score: 92, questions: 3 },
    { topic: 'SQL Joins', score: 88, questions: 2 },
    { topic: 'Transactions', score: 65, questions: 2 },
    { topic: 'Indexing', score: 61, questions: 2 },
    { topic: 'Referential Integrity', score: 100, questions: 1 },
  ],
};

export const ADMIN_STATS = {
  totalStudents: 847,
  totalFaculty: 62,
  totalClasses: 24,
  totalCourses: 118,
  totalClassrooms: 38,
  avgAttendance: 82,
  lowAttendanceCount: 73,
  pendingGrievances: 12,
  upcomingEvents: 4,
};

export const FACULTY_STATS = {
  classes: 3,
  courses: 5,
  avgAttendance: 82,
  defaulters: 12,
  pendingAssignments: 3,
  activeQuizzes: 1,
};

export const RESULTS_DATA = [
  { course: 'CS301', name: 'Data Structures & Algorithms', assignments: 88, quizzes: 74, average: 81, trend: 'up' },
  { course: 'CS302', name: 'Database Management Systems', assignments: 82, quizzes: 78, average: 80, trend: 'up' },
  { course: 'CS303', name: 'Operating Systems', assignments: 73, quizzes: 69, average: 71, trend: 'down' },
  { course: 'CS304', name: 'Computer Networks', assignments: 91, quizzes: 85, average: 88, trend: 'up' },
  { course: 'CS305', name: 'Software Engineering', assignments: 78, quizzes: 72, average: 75, trend: 'stable' },
];
