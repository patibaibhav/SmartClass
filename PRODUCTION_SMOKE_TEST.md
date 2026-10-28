# Hosted production smoke test

Run after every first deployment and before a project demonstration. Record only pass/fail and non-sensitive account identifiers.

Browser automation is included under `frontend/e2e`. Install Chromium once in the chosen CI/test machine, then run it only with isolated demo credentials:

```powershell
Set-Location frontend
npx playwright install chromium
$env:E2E_BASE_URL = "https://<your-vercel-project>.vercel.app"
$env:E2E_STUDENT_ID = "<isolated-demo-student>"
$env:E2E_STUDENT_PASSWORD = "<secure-password>"
npm run test:e2e
```

1. Open the Vercel URL over HTTPS, refresh a deep route, and verify the app still loads.
2. Open `https://<render>/api/health`; expect HTTP 200 and `status=healthy`.
3. Log in as a student: verify dashboard, PEC-filtered timetable, attendance, one assignment, quiz, and results.
4. Log in as a directly assigned faculty member: verify My Classes, timetable, attendance roster, assignment review/grading, and quiz attempts.
5. Upload a permitted PDF under 10 MB to an assigned course. Log in as an eligible student and download it. Confirm an unrelated account receives HTTP 403 when requesting the download endpoint.
6. Restart/redeploy the Render service. Confirm the uploaded material remains available and the same database records are visible.
7. Mark a test attendance record, submit/grade a test assignment, and submit a test quiz using isolated demo accounts. Verify student, faculty, and HOD views agree.
8. Log in as the HOD and verify analytics, defaulters, and grievances. HOD department oversight must not appear as fabricated personal teaching assignments.
9. Check Classroom Finder for overlapping, adjacent, and cancelled sessions.
10. Inspect Render logs for unexpected errors, secrets, tokens, passwords, or database URLs. None may appear.

If any check fails, stop the release demonstration, preserve non-sensitive diagnostics, and use the rollback/recovery guide.
