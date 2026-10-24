import React, { useState, useEffect } from 'react';
import { ClipboardList, PenSquare, HelpCircle, BarChart2, AlertTriangle, ChevronRight, BookOpen, Clock } from 'lucide-react';
import { Card, MetricCard, Badge, ProgressBar, CircularProgress, EmptyState } from '../components/ui';
import { api } from '../services/api';

interface Props {
  onNavigate: (page: string) => void;
  userName: string;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function StudentDashboard({ onNavigate, userName }: Props) {
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    const queryDay = (currentDay === 'Sunday' || currentDay === 'Saturday') ? 'Monday' : currentDay;

    Promise.allSettled([
      api.getStudentAttendance(),
      api.getAssignments(),
      api.getQuizzes(),
      api.getAnnouncements(),
      api.getTimetable()
    ]).then(([attRes, asgRes, qzRes, annRes, ttRes]) => {
      if (!isMounted) return;

      if (attRes.status === 'fulfilled' && Array.isArray(attRes.value)) {
        setAttendanceList(attRes.value);
      }
      if (asgRes.status === 'fulfilled' && Array.isArray(asgRes.value)) {
        setAssignments(asgRes.value);
      }
      if (qzRes.status === 'fulfilled' && Array.isArray(qzRes.value)) {
        setQuizzes(qzRes.value);
      }
      if (annRes.status === 'fulfilled' && Array.isArray(annRes.value)) {
        setAnnouncements(annRes.value);
      }
      if (ttRes.status === 'fulfilled' && ttRes.value) {
        const tt = ttRes.value;
        const entries = tt[queryDay] || [];
        setTodaySchedule(entries);
      }
      setLoading(false);
    });

    return () => { isMounted = false; };
  }, []);

  const pending = assignments.filter(a => a.status === 'pending').length;
  const overdue = assignments.filter(a => a.status === 'overdue').length;
  const upcomingQuiz = quizzes.filter(q => q.status === 'available' || q.status === 'upcoming').length;

  const hasAttendance = attendanceList.length > 0;
  const overallAttendance = hasAttendance
    ? Math.round(attendanceList.reduce((s, a) => s + (a.percentage || 0), 0) / attendanceList.length)
    : 0;
  const lowAttendance = attendanceList.filter(a => (a.percentage || 0) < 75);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-7">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e1e]">{getGreeting()}, {userName.split(' ')[0]} 👋</h1>
          <p className="text-sm text-[#7a6a55] mt-0.5">Here's your academic overview for today.</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Attendance"
          value={hasAttendance ? `${overallAttendance}%` : 'N/A'}
          sub={hasAttendance ? (overallAttendance < 75 ? 'Below minimum' : `${attendanceList.length} courses`) : 'No records yet'}
          icon={ClipboardList}
          color={!hasAttendance ? '#7a6a55' : overallAttendance >= 75 ? '#2F4F3A' : '#b04040'}
          onClick={() => onNavigate('attendance')}
        />
        <MetricCard
          label="Assignments"
          value={`${pending + overdue} pending`}
          sub={overdue > 0 ? `${overdue} overdue` : 'Stay on track'}
          icon={PenSquare}
          color={overdue > 0 ? '#b04040' : '#2F4F3A'}
          onClick={() => onNavigate('assignments')}
        />
        <MetricCard
          label="Quizzes"
          value={`${upcomingQuiz} upcoming`}
          sub="Available assessments"
          icon={HelpCircle}
          color="#7a6000"
          onClick={() => onNavigate('quizzes')}
        />
        <MetricCard
          label="Academic Results"
          value="Reports"
          sub="View semester grades"
          icon={BarChart2}
          color="#2a6a82"
          onClick={() => onNavigate('results')}
        />
      </div>

      {/* Low attendance alert */}
      {lowAttendance.length > 0 && (
        <div className="bg-[#fdf6e0] border border-[#f0df90] rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-[#9a6000] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#7a4a00]">Low Attendance Alert</p>
            <div className="mt-1 space-y-0.5">
              {lowAttendance.map(a => (
                <p key={a.course_code || a.course} className="text-xs text-[#7a4a00]">
                  <span className="font-medium">{a.name || a.course_code}</span> — {(a.percentage || 0).toFixed(1)}%
                  <span className="ml-1 text-[#b04040] font-semibold">(Below 75% minimum)</span>
                </p>
              ))}
            </div>
          </div>
          <button onClick={() => onNavigate('attendance')} className="text-xs text-[#9a6000] font-semibold hover:underline shrink-0">View →</button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's timetable */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1a2e1e]">Class Schedule</h3>
            <button onClick={() => onNavigate('timetable')} className="text-xs text-[#2F4F3A] font-semibold hover:underline flex items-center gap-1">
              View full timetable <ChevronRight size={13} />
            </button>
          </div>

          {todaySchedule.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-[#7a6a55]">No scheduled lectures for today.</p>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {todaySchedule.map((lecture, i) => (
                <Card key={i} className="p-4 border-l-4 border-l-[#2F4F3A] flex items-center gap-4">
                  <div className="text-center shrink-0 w-24">
                    <p className="text-xs font-bold text-[#2F4F3A]">{lecture.time || `${lecture.start_time || ''} - ${lecture.end_time || ''}`}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a2e1e] truncate">{lecture.course_name || lecture.course || lecture.course_code}</p>
                    <p className="text-xs text-[#7a6a55]">
                      {lecture.faculty || lecture.faculty_name} {lecture.faculty_initials ? `(${lecture.faculty_initials})` : ''} · Room {lecture.classroom || lecture.room}
                      {lecture.batch ? ` · Batch ${lecture.batch}` : ''}
                    </p>
                  </div>
                  <Badge variant="default">
                    {lecture.session_kind ? lecture.session_kind.toUpperCase() : (lecture.type || 'REGULAR')}
                  </Badge>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Attendance summary */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[#1a2e1e]">Attendance</h3>
          <Card className="p-5">
            {hasAttendance ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <CircularProgress value={overallAttendance} size={70} strokeWidth={7} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-[#1a2e1e]">{overallAttendance}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[#7a6a55] uppercase font-semibold tracking-wider">Overall</p>
                    <p className="text-2xl font-bold text-[#1a2e1e]">{overallAttendance}%</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {attendanceList.map(a => (
                    <div key={a.course_code || a.course}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-medium text-[#3a2e1a] truncate pr-2">{a.course_name || a.name || a.course_code}</p>
                        <p className="text-xs font-bold shrink-0" style={{ color: (a.percentage || 0) >= 75 ? '#2F4F3A' : '#b04040' }}>
                          {(a.percentage || 0).toFixed(0)}%
                        </p>
                      </div>
                      <ProgressBar value={a.percentage || 0} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm font-semibold text-[#1a2e1e]">No Attendance Recorded</p>
                <p className="text-xs text-[#7a6a55] mt-1">Attendance records will appear once faculty marks sessions.</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Upcoming assignments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#1a2e1e]">Upcoming Work</h3>
          <button onClick={() => onNavigate('assignments')} className="text-xs text-[#2F4F3A] font-semibold hover:underline flex items-center gap-1">
            View all <ChevronRight size={13} />
          </button>
        </div>
        {assignments.length === 0 ? (
          <Card className="p-6 text-center text-[#7a6a55] text-sm">
            No assignments currently pending.
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {assignments.filter(a => a.status !== 'graded').slice(0, 4).map(a => (
              <Card key={a.id} className="p-4 border border-[#E8E2D0]" onClick={() => onNavigate('assignments')}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant={a.status === 'submitted' ? 'submitted' : a.status === 'overdue' ? 'danger' : 'warning'}>
                    {a.status ? a.status.toUpperCase() : 'PENDING'}
                  </Badge>
                  {a.marks && <span className="text-xs text-[#9a8a75] shrink-0">{a.marks} marks</span>}
                </div>
                <p className="text-sm font-semibold text-[#1a2e1e] leading-snug">{a.title}</p>
                <p className="text-xs text-[#7a6a55] mt-1">{a.courseCode || a.course_id}</p>
                {a.dueDate && <p className="text-xs text-[#9a8a75] mt-1.5">Due {a.dueDate}</p>}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent announcements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#1a2e1e]">Recent Announcements</h3>
          <button onClick={() => onNavigate('announcements')} className="text-xs text-[#2F4F3A] font-semibold hover:underline flex items-center gap-1">
            View all <ChevronRight size={13} />
          </button>
        </div>
        {announcements.length === 0 ? (
          <Card className="p-6 text-center text-[#7a6a55] text-sm">
            No announcements published yet.
          </Card>
        ) : (
          <div className="space-y-2.5">
            {announcements.slice(0, 3).map(ann => (
              <Card key={ann.id} className="p-4 flex items-start gap-4" onClick={() => onNavigate('announcements')}>
                <div className="w-9 h-9 rounded-xl bg-[#E8E2D0] flex items-center justify-center shrink-0">
                  <BookOpen size={16} className="text-[#2F4F3A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a2e1e] truncate">{ann.title}</p>
                  <p className="text-xs text-[#7a6a55]">{ann.publisher || ann.author_name || 'Academic Office'} · {ann.date || ann.created_at?.slice(0, 10)}</p>
                </div>
                <Badge variant="default">{ann.type || 'Notice'}</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
