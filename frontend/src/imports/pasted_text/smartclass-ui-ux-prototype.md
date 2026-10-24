Design a complete, production-quality UI/UX prototype for a college academic and classroom management web application called "SmartClass".

SmartClass is a modern web-based platform similar in concept to Google Classroom, but specifically designed for a college environment. It combines classroom/course management, attendance, timetable, study material, assignments, online quizzes, academic results, announcements, calendar/events, discussion forums, grievances, classroom availability and AI-powered academic performance analysis.

The goal is to create a polished, resume-worthy software engineering project UI that looks like a real product rather than a college-project dashboard.

==================================================
1. CORE DESIGN DIRECTION
==================================================

Create a minimal, modern, highly usable and professional interface.

The visual identity should subtly combine:
- Modern SaaS dashboard design
- College/academic environment
- Chalkboard/classroom visual inspiration
- Clean information hierarchy
- Warm, approachable visual language

DO NOT make the interface look childish, cartoonish, overly decorative or like an actual old-fashioned blackboard.

The "chalkboard" inspiration should be subtle:
- dark green navigation areas
- warm off-white content surfaces
- chalk-inspired accent colors
- occasional subtle board/paper motifs
- clean modern cards and typography

The UI must prioritize:
1. Readability
2. Visibility
3. Fast navigation
4. Clear hierarchy
5. Accessibility
6. Consistent spacing
7. Minimal cognitive load

Use generous whitespace and avoid overcrowded dashboards.

==================================================
2. EXACT COLOR PALETTE
==================================================

Use ONLY this primary visual palette unless a very light neutral is necessary for accessibility:

Chalkboard Green:
#2F4F3A

Dark Board Green:
#243B2D

Chalk White:
#F4F1E6

Warm Chalk:
#E8E2D0

Chalk Yellow:
#E8D36A

Chalk Blue:
#7DB7C9

Chalk Red:
#D98282

Wood Brown:
#8A5A3B

Cream Paper:
#F5EBD7

Suggested usage:

#243B2D
- Primary dark sidebar
- top-level navigation
- dark headers
- high emphasis areas

#2F4F3A
- Primary buttons
- active navigation
- important controls
- headings where appropriate

#F4F1E6
- Main application background
- primary light surface

#E8E2D0
- secondary surfaces
- table headers
- filters
- subtle separators

#E8D36A
- warnings
- attention states
- upcoming deadlines
- attendance warning indicators

#7DB7C9
- information
- links
- academic analytics
- neutral positive data visualization

#D98282
- errors
- low attendance
- overdue work
- destructive actions
- grievance escalation

#8A5A3B
- extremely subtle secondary accent
- optional classroom/wood-inspired elements
- do not overuse

#F5EBD7
- cards
- modal backgrounds
- content panels
- warm paper surfaces

Avoid gradients unless extremely subtle.
Avoid neon colors.
Avoid excessive shadows.
Use soft borders and restrained elevation.

==================================================
3. TYPOGRAPHY
==================================================

Use a modern highly readable sans-serif font.

Preferred:
- Inter
- Manrope
- DM Sans

Use:
- Bold/semibold headings
- Medium labels
- Regular body text
- Clear numerical typography for statistics

Do not use decorative handwritten/chalk fonts for normal UI text.

Optional chalk-style typography may be used extremely sparingly in branding or small decorative headings, but never for important information.

==================================================
4. APPLICATION LAYOUT
==================================================

Design SmartClass primarily as a responsive desktop web application.

Primary desktop layout:

LEFT:
Persistent sidebar navigation.

CENTER:
Main page content.

TOP:
Compact top bar containing:
- page title/breadcrumb
- search where relevant
- notifications
- user profile/avatar
- role indicator where useful

SIDEBAR:
Use Dark Board Green #243B2D.

Sidebar contains:
- SmartClass logo
- Dashboard
- My Classes / Courses
- Attendance
- Timetable
- Study Material
- Assignments
- Quizzes
- Results
- Calendar
- Announcements
- Discussion Forums
- Grievances
- Classroom Availability

Role-specific navigation should hide options that a user cannot access.

For example:
Student:
Dashboard
My Class
Attendance
Timetable
Study Material
Assignments
Quizzes
Results
Calendar
Announcements
Forums
Grievances
Classroom Availability

Faculty:
Dashboard
My Classes
Attendance
Timetable
Study Material
Assignments
Quizzes
Results
Calendar
Announcements
Forums
Classroom Availability

HOD:
Faculty navigation plus:
- Department Analytics
- Grievances

Admin:
Dashboard
Users
Classes
Courses
Faculty Assignments
Classrooms
Timetable Management
Attendance Overview
Academic Analytics
Announcements
Calendar
Grievances

Council Head:
Dashboard
My Council
Events
Calendar
Announcements

==================================================
5. GLOBAL DESIGN SYSTEM
==================================================

Create a reusable Figma design system.

Components should include:

Buttons:
- Primary
- Secondary
- Ghost
- Danger
- Icon button
- Disabled

Inputs:
- Text field
- Password field
- Search
- Dropdown
- Multi-select
- Date picker
- Time picker
- Text area
- File upload
- Filter chips

Cards:
- Metric card
- Course card
- Assignment card
- Quiz card
- Event card
- Announcement card
- Attendance card
- Analytics card

Tables:
- Student table
- Attendance table
- Assignment submissions table
- User management table
- Timetable table
- Grievance table

Status badges:
- Present
- Absent
- Regular
- Substitute
- Extra
- Cancelled
- Submitted
- Late
- Graded
- Upcoming
- Completed
- Open
- In Progress
- Resolved
- Closed

Other components:
- Modal
- Confirmation dialog
- Toast notification
- Empty state
- Loading state
- Error state
- Pagination
- Tabs
- Breadcrumbs
- Calendar cells
- Charts
- Progress bars
- Avatars

Maintain consistent:
- 8px spacing system
- 12–16px card radius
- subtle borders
- restrained shadows
- consistent iconography
- accessible contrast

Use a simple outline icon system such as Lucide-style icons.

==================================================
6. AUTHENTICATION
==================================================

Create the following authentication screens.

LOGIN:

SmartClass logo.

Fields:
- User ID
- Password

Controls:
- Show/hide password
- Remember me
- Login button

Below:
"Contact your administrator if you have forgotten your credentials."

Do NOT create public self-registration.

Accounts are created by Admin.

FIRST LOGIN:

If the Admin-provided temporary password is used:

Display:
"Welcome to SmartClass"

Message:
"For security, please create a new password before continuing."

Fields:
- Current temporary password
- New password
- Confirm password

Show password requirements.

After successful password change:
redirect to appropriate role dashboard.

Create states for:
- invalid credentials
- locked account
- expired session
- successful login

==================================================
7. ROLE SYSTEM
==================================================

There are four primary account categories:

1. Student
2. Faculty
3. Admin
4. Council Head

HOD is NOT a separate account type.

A Faculty account may additionally have HOD permissions.

Therefore a user can effectively be:
Faculty + HOD.

Show this elegantly in the profile/role context.

==================================================
8. ADMIN EXPERIENCE
==================================================

Create a complete Admin interface.

ADMIN DASHBOARD:

Show:
- total students
- total faculty
- total classes
- total courses
- classrooms
- attendance overview
- low attendance count
- pending grievances
- upcoming events
- recent announcements

Use clean metric cards and compact charts.

ADMIN USER MANAGEMENT:

Tabs:
- Students
- Faculty
- Council Heads

Actions:
- Create user
- Edit user
- Deactivate user
- Reset credentials

When creating a user:
- Name
- Email
- User ID
- Role
- Temporary password
- Class where applicable
- Department
- HOD permission where applicable

Show confirmation after account creation.

ADMIN CLASS MANAGEMENT:

Create:
- Class
- Division/section
- Department
- Academic year

Manage:
- students
- courses
- faculty assignments

ADMIN COURSE MANAGEMENT:

Fields:
- Course name
- Course code
- Department
- Associated classes
- Assigned faculty

Important behavior:

One Faculty member can teach the same course to multiple classes.

ADMIN CLASS MEMBERSHIP:

Show:
- current students
- add student
- remove student
- move student to another class

When a student is moved:
display a warning that historical academic records remain preserved.

==================================================
9. FACULTY EXPERIENCE
==================================================

FACULTY DASHBOARD:

Show:
- assigned classes
- assigned courses
- today's timetable
- upcoming lectures
- attendance overview
- defaulters
- upcoming assignments
- active quizzes
- recent announcements

Example metric cards:
"5 Classes"
"3 Courses"
"82% Avg Attendance"
"12 Defaulters"

Use charts only where useful.

==================================================
10. CLASSES AND COURSES
==================================================

Create a "My Classes" screen.

Each class appears as a card containing:
- class name
- division
- academic year
- courses
- number of students
- today's next lecture

Clicking a class opens:

CLASS OVERVIEW

Header:
Class name
Division
Faculty/course context

Tabs:
- Overview
- Courses
- Attendance
- Assignments
- Quizzes
- Study Material
- Results
- Discussion

Students see the class and associated courses.

Faculty see only classes/courses assigned to them.

==================================================
11. ATTENDANCE
==================================================

Attendance is MANUAL ONLY.

DO NOT include:
- QR attendance
- biometric attendance
- face recognition
- automatic attendance

FACULTY ATTENDANCE FLOW:

Faculty selects:
Class
Course
Lecture

Then display:

Lecture information:
- Course
- Date
- Time
- Classroom
- Faculty
- Lecture Type

Lecture types:
- Regular
- Substitute
- Extra
- Cancelled

Then display student roster:

| Student | ID | Status |

Each student has:
Present / Absent toggle.

Provide:
- Mark all present
- Mark all absent
- Search student
- Save attendance

Before saving:
show confirmation:
"Save attendance for 48 students?"

After save:
toast:
"Attendance saved successfully."

ATTENDANCE HISTORY:

Faculty can view lecture history.

Columns:
- Date
- Course
- Class
- Time
- Lecture Type
- Faculty
- Present count
- Absent count

Student attendance history:

Show:
- Course
- Total lectures
- Present
- Absent
- Percentage

Click lecture:
show attendance record.

ATTENDANCE DASHBOARD:

Use circular progress / progress bars.

Example:

Overall Attendance
84%

Course cards:

Data Structures
92%

Database Systems
78%
Warning

Operating Systems
65%
Low Attendance

LOW ATTENDANCE ALERT:

Use Chalk Yellow / Chalk Red appropriately.

Example:
"Your attendance in Operating Systems is 65%. Minimum required attendance: 75%."

FACULTY DEFAULTER VIEW:

Table:
Student
Class
Course
Attendance
Status

Filter:
- All
- Warning
- Defaulters

==================================================
12. REGULAR / SUBSTITUTE / EXTRA LECTURES
==================================================

This is an important feature.

Create a "Manage Lecture" action.

Options:

Regular Lecture
Substitute Lecture
Extra Lecture
Cancel Lecture

SUBSTITUTE:

Fields:
- Original Faculty
- Substitute Faculty
- Class
- Course
- Date
- Time
- Classroom
- Reason

Display:
"Attendance will be recorded against the Faculty member actually conducting the lecture while preserving the original scheduled Faculty."

EXTRA LECTURE:

Fields:
- Class
- Course
- Faculty
- Date
- Start time
- End time
- Classroom
- Reason

Extra lecture should:
- appear in timetable
- appear in attendance history
- count toward attendance

CANCELLED:

Cancelled lecture remains in history but does NOT count toward attendance percentage.

==================================================
13. TIMETABLE
==================================================

Create a polished timetable experience.

IMPORTANT:

EVERY USER must be able to see:

1. Complete / overall timetable
2. Day-wise timetable for a selected day

Do NOT restrict users to "today's timetable".

TIMETABLE SCREEN:

Top controls:
- Week selector
- Date selector
- Class filter
- Course filter
- Faculty filter
- Classroom filter

Views:
- Full timetable
- Day view

FULL TIMETABLE:

Use a grid:

Time | Monday | Tuesday | Wednesday | Thursday | Friday

Each lecture block contains:
- Course
- Faculty
- Class
- Room
- Time

DAY VIEW:

Large chronological schedule:

09:00
Data Structures
Room A-204
Faculty Member

11:00
Database Systems
Room B-102
Faculty Member

Use lecture-type badges:
Regular
Substitute
Extra
Cancelled

SUBSTITUTE lectures should visually distinguish themselves.

EXTRA lectures should also be clearly identifiable.

==================================================
14. CLASSROOM AVAILABILITY
==================================================

Create a "Find Free Classroom" screen.

Inputs:
- Date
- Start time
- End time

Optional:
- Building
- Capacity

Button:
"Find Available Classrooms"

Results:

Available:
A-101
A-102
B-203

Occupied:
A-201
B-102

Each classroom card:
- Classroom name
- Building
- Capacity
- Current status
- Occupied time if applicable

The system must treat adjacent non-overlapping lectures as available.

==================================================
15. STUDY MATERIAL
==================================================

Create a Study Material section.

COURSE MATERIAL SCREEN:

Header:
Course name
Course code
Faculty

Organize by:
- Unit 1
- Unit 2
- Unit 3
- Unit 4

Material cards:

PDF
Lecture Notes
Uploaded date
Faculty

Actions:
- View
- Download

Supported conceptual formats:
PDF
PPT/PPTX
DOC/DOCX
Images
Educational links

FACULTY:

"Upload Material"

Fields:
- Title
- Unit/topic
- Description
- File/link

==================================================
16. ASSIGNMENTS
==================================================

STUDENT ASSIGNMENTS SCREEN:

Tabs:
- All
- Pending
- Submitted
- Graded
- Overdue

Assignment card:

Assignment title
Course
Due date
Status
Marks

Example:

"Normalization Assignment"
Database Systems
Due Aug 18
Pending
20 marks

Assignment details:

- Title
- Description
- Attachments
- Maximum marks
- Deadline
- Submission status

Student action:
"Submit Assignment"

Upload file.

After submission:
Show:
Submitted Aug 16, 2:42 PM

If late:
Show Late badge.

FACULTY ASSIGNMENT SCREEN:

Create assignment.

Fields:
- Title
- Description
- Course
- Due date
- Maximum marks
- Attachment

Submission management:

Table:
Student
Submitted
Status
Marks
Feedback

Faculty can:
- open submission
- grade
- provide feedback

==================================================
17. ONLINE QUIZZES
==================================================

QUIZ LIST:

Cards show:
- Quiz title
- Course
- Number of questions
- Duration
- Opens
- Closes
- Status

Example:

"DBMS Unit 2 Quiz"
10 questions
15 minutes
Available

QUIZ INSTRUCTIONS:

Show:
- duration
- number of questions
- allowed attempts
- topics
- start button

QUIZ INTERFACE:

Minimal distraction-free layout.

Top:
Quiz name
Question count
Timer

Main:
Question

Options:
A
B
C
D

Sidebar:
Question navigation

Statuses:
- unanswered
- answered
- flagged

Submit button.

Confirmation modal:
"You have 2 unanswered questions. Submit anyway?"

QUIZ RESULT:

Show:
Score
Percentage
Correct answers
Incorrect answers
Topic-wise performance

Use visual charts sparingly.

==================================================
18. RESULTS
==================================================

Create a Results section.

STUDENT RESULTS:

Overview cards:
- Overall performance
- Assignments
- Quizzes
- Course average

Course-wise table:

Course
Assignments
Quizzes
Average
Trend

Click course:
show detailed breakdown.

FACULTY RESULTS:

Faculty can view performance for assigned classes/courses.

Show:
- class average
- highest score
- lowest score
- topic performance
- student distribution

HOD:
Department-level analytics.

ADMIN:
Institution-level aggregate analytics.

Respect role-based visibility.

==================================================
19. AI TEST PERFORMANCE REPORT
==================================================

Create a dedicated "AI Performance Report" experience.

IMPORTANT:
The AI report is ADVISORY.

AI does NOT calculate or change official marks.

Official quiz/test score is generated deterministically first.

Then AI receives performance/topic data and generates an advisory analysis.

REPORT SCREEN:

Header:
"AI Test Performance Analysis"

Show:

Overall Score
78%

Performance Summary

Strengths:
- SQL joins
- Normalization
- Relational concepts

Needs Improvement:
- Indexing
- Transactions
- Query optimization

Suggested Revision:
1. Review B+ tree indexing
2. Practice transaction problems
3. Revise isolation levels

Topic performance visualization:

Topic | Score

Normalization 92%
SQL Joins 88%
Indexing 61%
Transactions 65%

Include a small disclaimer:

"AI-generated insights are advisory and do not affect your official academic result."

If AI service is unavailable:
show:
"Your official result is available. The AI analysis is temporarily unavailable."

Do NOT make this a general AI chatbot.

==================================================
20. DASHBOARD
==================================================

STUDENT DASHBOARD should be the most polished screen.

Top greeting:
"Good morning, Alex"

Subtitle:
"Here's your academic overview."

Cards:

Attendance
84%

Assignments
3 pending

Quizzes
1 upcoming

Academic Average
82%

Then:

TODAY'S TIMETABLE

Timeline of today's lectures.

UPCOMING WORK

Assignment cards.

ATTENDANCE ALERT

If required.

RECENT RESULTS

Small list.

UPCOMING EVENTS

Calendar cards.

RECENT ANNOUNCEMENTS

Compact feed.

Keep dashboard visually calm.

==================================================
21. ANNOUNCEMENTS
==================================================

Create announcement center.

Announcement card:
- title
- publisher
- date
- audience
- content
- attachment if applicable

Filters:
- All
- Class
- Course
- College
- Events

Faculty/Admin can create announcements according to permissions.

Separate:
ANNOUNCEMENTS
from
NOTIFICATIONS.

==================================================
22. NOTIFICATIONS
==================================================

Notification center.

Examples:

"Assignment deadline tomorrow"
"Quiz results released"
"Attendance below threshold"
"Timetable changed"
"New event announced"
"New announcement posted"

Use small icons and appropriate accent colors.

Support:
- unread/read
- mark all read

==================================================
23. CALENDAR
==================================================

Create a modern academic calendar.

Views:
- Month
- Week
- Day

Filters:

Events
Tests
Holidays

IMPORTANT:
Do not make assignments or regular lectures mandatory calendar filter categories.

Calendar event colors should use the provided palette.

Click an event.

Event details modal/page:

Event title
Council
Date
Time
Venue
Description
Organizer
Registration link
"Register" button

==================================================
24. COUNCIL EVENT MANAGEMENT
==================================================

Council Head dashboard.

Show:
- upcoming events
- registrations/link clicks conceptually
- past events
- drafts

"Create Event"

Fields:
- Event name
- Description
- Date
- Start time
- End time
- Venue
- Council
- Visibility
- Registration link
- Poster/image optional

Visibility:
- Council Only
- College Wide

After publishing:

AUTOMATICALLY:
1. Create calendar event
2. Create announcement
3. Send notification to relevant audience

Show confirmation:

"Event published successfully."

Subtext:
"Calendar entry and announcement created automatically."

==================================================
25. DISCUSSION FORUMS
==================================================

Create per-course discussion forums.

Forum landing:
My Courses

Course forum:

"Database Systems Discussion"

Threads:

"Can someone explain BCNF?"
12 replies

"Important topics for Unit 3?"
7 replies

"Question about Assignment 2"
4 replies

Users can:
- create discussion
- reply
- search
- view recent discussions

Faculty can moderate their course forums.

Students cannot access forums for courses they are not enrolled in.

==================================================
26. FEEDBACK AND GRIEVANCE SYSTEM
==================================================

Create Student grievance center.

Student screen:

"My Grievances"

Cards show:
- Subject
- Category
- Date submitted
- Status
- Last updated

Statuses:

Submitted
Assigned
Under Review
In Progress
Resolved
Closed

"Submit Grievance"

Fields:
- Category
- Subject
- Description
- Attachment

Grievance detail page:

Timeline:

Submitted
↓
Assigned
↓
Under Review
↓
In Progress
↓
Resolved
↓
Closed

Show responses/remarks.

ADMIN/HOD:

Grievance management table.

Filters:
- New
- In Review
- In Progress
- Resolved
- Closed

They can:
- assign
- update status
- respond
- add internal remarks

==================================================
27. SEARCH
==================================================

Add a global search interaction.

Search should conceptually find:
- courses
- assignments
- quizzes
- announcements
- events
- study material

Show categorized search results.

Keep search simple and fast.

==================================================
28. PROFILE AND SETTINGS
==================================================

Profile page:

Name
User ID
Email
Role
Department
Class where applicable

Actions:
- Change password
- Notification preferences
- Logout

For Faculty + HOD:
show:
"Faculty"
"HOD"

==================================================
29. RESPONSIVE DESIGN
==================================================

Design desktop-first but ensure the UI can adapt to tablet/mobile.

Desktop:
- persistent sidebar
- multi-column dashboard
- full timetable grid

Tablet:
- collapsible sidebar
- 2-column cards

Mobile:
- bottom navigation or compact navigation
- stacked cards
- horizontally scrollable timetable
- simplified tables
- full-screen quiz experience

Do not simply shrink desktop layouts.

==================================================
30. IMPORTANT EMPTY / LOADING / ERROR STATES
==================================================

Design these states as part of the prototype.

Examples:

No assignments:
"You’re all caught up!"

No upcoming events:
"No upcoming events."

No study material:
"No materials have been uploaded for this course yet."

No grievances:
"No grievances submitted."

No available classrooms:
"No classrooms available for this time."

Loading:
Use skeleton loaders.

Error:
"Something went wrong. Please try again."

Success:
Use concise toast notifications.

==================================================
31. ACCESSIBILITY
==================================================

Prioritize accessibility.

Ensure:
- readable font sizes
- high contrast
- clear focus states
- icons are not the only way to communicate meaning
- status badges include text
- buttons have clear labels
- forms show validation messages
- destructive actions require confirmation

Do not rely only on red/green to distinguish attendance states.

==================================================
32. DATA VISUALIZATION
==================================================

Use charts only where they improve understanding.

Preferred:
- progress bars
- donut/circular attendance indicator
- simple bar charts
- line charts for performance trends
- topic comparison charts

Avoid:
- excessive dashboards
- 3D charts
- decorative graphs
- overly complex visualizations

Use the provided Chalk Blue, Chalk Yellow and Chalk Red for meaningful data states.

==================================================
33. IMPORTANT BUSINESS LOGIC TO REFLECT IN UI
==================================================

The prototype must visibly communicate these rules:

1. Admin creates Student, Faculty and Council Head accounts.

2. Users receive ID/password from Admin.

3. First login requires password change.

4. Admin creates classes.

5. Admin adds students to classes.

6. Admin creates courses and associates them with classes.

7. Admin assigns Faculty to courses/classes.

8. One Faculty may teach the same course to multiple classes.

9. Students see their assigned class and courses.

10. Faculty sees only assigned classes/courses.

11. Attendance is manual.

12. No QR attendance.

13. Attendance is recorded lecture-by-lecture.

14. Attendance history is visible to both Student and Faculty according to permissions.

15. Student cannot edit attendance.

16. Faculty can see attendance statistics and defaulters.

17. Student receives low-attendance alerts.

18. Regular lectures count toward attendance.

19. Substitute lectures count toward attendance and retain original/sustitute Faculty information.

20. Extra lectures count toward attendance.

21. Cancelled lectures do not count toward attendance.

22. Substitute and Extra lectures appear correctly in timetable/history.

23. Everyone can view the complete timetable.

24. Everyone can view a day-wise timetable for any selected day.

25. Classroom availability checks all relevant lectures.

26. Adjacent non-overlapping lectures do not create conflicts.

27. Quizzes are objectively and deterministically evaluated.

28. Official marks never depend on AI.

29. AI only provides advisory performance analysis.

30. Council Heads can create events.

31. Events can be Council Only or College Wide.

32. Publishing an event automatically creates a calendar entry.

33. Publishing an event automatically creates an announcement.

34. Event details may contain an external registration link.

35. Forums are course-specific.

36. Grievances follow a lifecycle from submission to closure.

37. HOD is a permission layer on a Faculty account, not a separate user type.

==================================================
34. KEY USER FLOWS TO PROTOTYPE
==================================================

Create clickable prototypes for at least these flows:

FLOW 1 — STUDENT LOGIN

Login
→ First password change if required
→ Student Dashboard
→ View Class
→ View Course
→ Study Material

FLOW 2 — ATTENDANCE

Student Dashboard
→ Attendance
→ Course
→ Attendance percentage
→ Lecture history
→ Lecture detail

FLOW 3 — FACULTY ATTENDANCE

Faculty Dashboard
→ My Class
→ Course
→ Attendance
→ Select lecture
→ Student roster
→ Mark Present/Absent
→ Save
→ Attendance history

FLOW 4 — SUBSTITUTE LECTURE

Faculty
→ Timetable
→ Select lecture
→ Mark as Substitute
→ Select substitute Faculty
→ Save
→ Timetable updates
→ Attendance history reflects actual Faculty

FLOW 5 — EXTRA LECTURE

Faculty
→ Add Extra Lecture
→ Class/Course/Faculty/Date/Time/Classroom
→ Save
→ Timetable
→ Attendance
→ History

FLOW 6 — TIMETABLE

Dashboard
→ Timetable
→ Full timetable
OR
→ Select date
→ Day-wise timetable

FLOW 7 — CLASSROOM

Timetable
→ Find Free Classroom
→ Date/time
→ Search
→ Available classrooms

FLOW 8 — ASSIGNMENT

Student
→ Assignments
→ Assignment details
→ Submit
→ Submission status
→ Result

Faculty
→ Assignments
→ Create
→ View submissions
→ Grade
→ Feedback

FLOW 9 — QUIZ

Student
→ Quizzes
→ Quiz details
→ Start
→ Answer questions
→ Submit
→ Official result
→ AI performance report

FLOW 10 — AI REPORT

Quiz Result
→ Generate/View AI Analysis
→ Strengths
→ Weak areas
→ Suggested revision

FLOW 11 — COUNCIL EVENT

Council Dashboard
→ Events
→ Create Event
→ Add registration link
→ Select visibility
→ Publish
→ Calendar entry automatically created
→ Announcement automatically created
→ Notification generated

FLOW 12 — GRIEVANCE

Student
→ Grievances
→ Submit
→ Track status
→ View response

HOD/Admin
→ Grievances
→ Open grievance
→ Assign
→ Update status
→ Respond
→ Resolve

==================================================
35. FIGMA FILE ORGANIZATION
==================================================

Organize the Figma file into pages:

01 — Cover / Product Overview
02 — Design System
03 — Authentication
04 — Student
05 — Faculty
06 — HOD
07 — Admin
08 — Council Head
09 — Shared Components
10 — Prototype Flows

Within each page organize screens logically.

Use Auto Layout extensively.

Use reusable components and variants.

Create component variants for:
- button states
- input states
- attendance states
- assignment states
- quiz states
- notification states
- grievance states
- event visibility
- lecture types

Use consistent naming.

Example:
Button / Primary / Default
Button / Primary / Hover
Button / Primary / Disabled

Card / Course
Card / Assignment
Card / Event

Badge / Attendance / Present
Badge / Attendance / Absent

==================================================
36. VISUAL QUALITY BAR
==================================================

The final Figma design should feel comparable to a polished modern SaaS product.

Prioritize:
- clean spacing
- strong typography
- consistent cards
- excellent tables
- clear empty states
- intuitive navigation
- meaningful color usage
- subtle academic personality

The design should NOT look like:
- a generic Bootstrap admin template
- a generic ERP
- an old college portal
- an over-designed Dribbble concept
- a childish education app
- a dark-mode-only application

The result should feel like:

"Google Classroom + modern college ERP + academic analytics"

but with its own SmartClass visual identity based on the chalkboard-inspired palette.

==================================================
37. FINAL PROTOTYPE REQUIREMENT
==================================================

Generate enough screens to demonstrate the entire product, not just the Student dashboard.

At minimum create polished representative screens for:

AUTH:
- Login
- First login password change

STUDENT:
- Dashboard
- My Class
- Course
- Attendance
- Attendance history
- Timetable full
- Timetable day view
- Classroom availability
- Study material
- Assignments
- Assignment detail/submission
- Quizzes
- Quiz attempt
- Quiz result
- AI performance report
- Results
- Calendar
- Announcements
- Notifications
- Discussion forum
- Grievances
- Grievance detail
- Profile/settings

FACULTY:
- Dashboard
- My Classes
- Course
- Attendance marking
- Attendance history
- Defaulters
- Timetable
- Add Extra Lecture
- Substitute Lecture
- Study material management
- Assignment creation
- Assignment submissions/grading
- Quiz creation
- Results/analytics
- Announcements
- Forum moderation

HOD:
- Department analytics
- Attendance/defaulter overview
- Grievance management

ADMIN:
- Dashboard
- User management
- Class management
- Course management
- Faculty assignment
- Student reassignment
- Classroom management
- Timetable management
- Attendance overview
- Academic analytics
- Announcements
- Grievances

COUNCIL HEAD:
- Dashboard
- Events
- Create event
- Event details
- Calendar

==================================================
38. FINAL INSTRUCTION
==================================================

Do not create every screen as an isolated design.

Create a coherent product system.

The same user should feel that every screen belongs to SmartClass.

Use realistic sample college data instead of lorem ipsum.

Use realistic names such as:
- Data Structures
- Database Management Systems
- Operating Systems
- Computer Networks
- Software Engineering

Use realistic student/faculty names and classroom numbers.

Make all important buttons, tabs, cards and navigation elements visually consistent.

Create realistic interactions and prototype connections wherever possible.

Focus on usability and information hierarchy over decoration.

The final output should be a polished, modern, minimal, responsive SmartClass college management platform suitable for:
- software engineering mini-project demonstration
- SRS/design documentation
- viva
- project presentation
- GitHub README screenshots
- internship/job resume portfolio
- live prototype demonstration

Most importantly, the UI must accurately represent the functional requirements and business rules above.