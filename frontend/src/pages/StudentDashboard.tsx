import React from 'react';
import { ClipboardList, PenSquare, HelpCircle, BarChart2, AlertTriangle, ChevronRight, BookOpen, TrendingUp } from 'lucide-react';
import { Card, MetricCard, Badge, ProgressBar, CircularProgress, SectionHeader } from '../components/ui';
import { ATTENDANCE_DATA, ASSIGNMENTS, QUIZZES, ANNOUNCEMENTS, EVENTS, TIMETABLE } from '../data/mock';

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
  const pending = ASSIGNMENTS.filter(a => a.status === 'pending').length;
  const overdue = ASSIGNMENTS.filter(a => a.status === 'overdue').length;
  const upcomingQuiz = QUIZZES.filter(q => q.status === 'available' || q.status === 'upcoming').length;
  const overallAttendance = Math.round(ATTENDANCE_DATA.reduce((s, a) => s + a.percentage, 0) / ATTENDANCE_DATA.length);
  const lowAttendance = ATTENDANCE_DATA.filter(a => a.percentage < 75);
  const today = TIMETABLE['Wednesday'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-7">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e1e]">{getGreeting()}, {userName.split(' ')[0]} 👋</h1>
          <p className="text-sm text-[#7a6a55] mt-0.5">Here's your academic overview for today.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-[#F5EBD7] border border-[#E8E2D0] rounded-xl px-4 py-2">
          <BookOpen size={14} className="text-[#2F4F3A]" />
          <span className="text-sm font-medium text-[#2F4F3A]">SE-A · Semester 5</span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Attendance" value={`${overallAttendance}%`}
          sub={overallAttendance < 75 ? 'Below minimum' : '5 courses'}
          icon={ClipboardList}
          color={overallAttendance >= 75 ? '#2F4F3A' : overallAttendance >= 65 ? '#9a6000' : '#b04040'}
          onClick={() => onNavigate('attendance')}
        />
        <MetricCard
          label="Assignments" value={`${pending + overdue} pending`}
          sub={overdue > 0 ? `${overdue} overdue` : 'Stay on track'}
          icon={PenSquare}
          color={overdue > 0 ? '#b04040' : '#2F4F3A'}
          onClick={() => onNavigate('assignments')}
        />
        <MetricCard
          label="Quizzes" value={`${upcomingQuiz} upcoming`}
          sub="Due this week"
          icon={HelpCircle}
          color="#7a6000"
          onClick={() => onNavigate('quizzes')}
        />
        <MetricCard
          label="Academic Average" value="82%"
          sub="↑ 3% from last month"
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
                <p key={a.course} className="text-xs text-[#7a4a00]">
                  <span className="font-medium">{a.name}</span> — {a.percentage.toFixed(1)}%
                  {a.percentage < 75 && <span className="ml-1 text-[#b04040] font-semibold">(Below 75% minimum)</span>}
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
            <h3 className="text-base font-bold text-[#1a2e1e]">Today's Schedule</h3>
            <button onClick={() => onNavigate('timetable')} className="text-xs text-[#2F4F3A] font-semibold hover:underline flex items-center gap-1">View full timetable <ChevronRight size={13} /></button>
          </div>
          <div className="space-y-2.5">
            {today.map((lecture, i) => {
              const typeColors: Record<string, string> = {
                Regular: 'border-l-[#7DB7C9]',
                Substitute: 'border-l-[#E8D36A]',
                Extra: 'border-l-[#9a7acc]',
                Cancelled: 'border-l-[#D98282] opacity-60',
              };
              const typeBadge: Record<string, any> = {
                Regular: 'regular', Substitute: 'substitute', Extra: 'extra', Cancelled: 'cancelled'
              };
              return (
                <Card key={i} className={`p-4 border-l-4 ${typeColors[lecture.type] || typeColors.Regular} flex items-center gap-4`}>
                  <div className="text-center shrink-0 w-16">
                    <p className="text-xs font-bold text-[#2F4F3A]">{lecture.time.split('–')[0]}</p>
                    <p className="text-[10px] text-[#9a8a75]">– {lecture.time.split('–')[1]}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a2e1e] truncate">{lecture.course}</p>
                    <p className="text-xs text-[#7a6a55]">{lecture.faculty} · {lecture.room}</p>
                  </div>
                  <Badge variant={typeBadge[lecture.type] || 'regular'}>{lecture.type}</Badge>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Attendance summary */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[#1a2e1e]">Attendance</h3>
          <Card className="p-5">
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
              {ATTENDANCE_DATA.map(a => (
                <div key={a.course}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-medium text-[#3a2e1a] truncate pr-2">{a.name.split(' ')[0]}{' '}{a.name.split(' ')[1] || ''}</p>
                    <p className="text-xs font-bold shrink-0" style={{ color: a.percentage >= 75 ? '#2F4F3A' : a.percentage >= 65 ? '#9a6000' : '#b04040' }}>
                      {a.percentage.toFixed(0)}%
                    </p>
                  </div>
                  <ProgressBar value={a.percentage} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Upcoming assignments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#1a2e1e]">Upcoming Work</h3>
          <button onClick={() => onNavigate('assignments')} className="text-xs text-[#2F4F3A] font-semibold hover:underline flex items-center gap-1">View all <ChevronRight size={13} /></button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ASSIGNMENTS.filter(a => a.status !== 'graded').map(a => {
            const statusMap: Record<string, any> = { pending: 'pending', submitted: 'submitted', overdue: 'overdue', graded: 'graded' };
            const borderMap: Record<string, string> = { pending: 'border-[#f0df90]', overdue: 'border-[#f0c8c8]', submitted: 'border-[#c4dde8]', graded: 'border-[#E8E2D0]' };
            return (
              <Card key={a.id} className={`p-4 border ${borderMap[a.status]}`} onClick={() => onNavigate('assignments')}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant={statusMap[a.status]}>{a.status.charAt(0).toUpperCase() + a.status.slice(1)}</Badge>
                  <span className="text-xs text-[#9a8a75] shrink-0">{a.marks} marks</span>
                </div>
                <p className="text-sm font-semibold text-[#1a2e1e] leading-snug">{a.title}</p>
                <p className="text-xs text-[#7a6a55] mt-1">{a.courseCode}</p>
                <p className="text-xs text-[#9a8a75] mt-1.5">Due {a.dueDate}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent announcements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#1a2e1e]">Recent Announcements</h3>
          <button onClick={() => onNavigate('announcements')} className="text-xs text-[#2F4F3A] font-semibold hover:underline flex items-center gap-1">View all <ChevronRight size={13} /></button>
        </div>
        <div className="space-y-2.5">
          {ANNOUNCEMENTS.slice(0, 3).map(ann => (
            <Card key={ann.id} className="p-4 flex items-start gap-4" onClick={() => onNavigate('announcements')}>
              <div className="w-9 h-9 rounded-xl bg-[#E8E2D0] flex items-center justify-center shrink-0">
                <BookOpen size={16} className="text-[#2F4F3A]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1a2e1e] truncate">{ann.title}</p>
                <p className="text-xs text-[#7a6a55]">{ann.publisher} · {ann.date}</p>
              </div>
              <Badge variant={ann.type.toLowerCase() as any}>{ann.type}</Badge>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
