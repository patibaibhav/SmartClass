import React, { useEffect, useState } from 'react';
import { AlertTriangle, BarChart2, Bell, ClipboardList, Clock, HelpCircle, PenSquare } from 'lucide-react';
import { Badge, Card, MetricCard, ProgressBar, SectionHeader } from '../components/ui';
import { api } from '../services/api';

interface Props { onNavigate: (page: string) => void; userName: string }

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

export default function StudentDashboard({ onNavigate, userName }: Props) {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState('');
  useEffect(() => { api.getDashboardStats('student').then(setStats).catch(e => setError(e.message)); }, []);

  return <div className="p-6 max-w-7xl mx-auto space-y-7">
    <div><h1 className="text-2xl font-bold">{greeting()}, {stats?.firstName || userName}</h1><p className="text-sm text-[#7a6a55]">Your live academic overview{stats?.elective ? ` · ${stats.elective.courseId} (PEC Batch ${stats.elective.batch})` : ''}</p></div>
    {error && <Card className="p-4 text-[#b04040]">{error}</Card>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard label="Attendance" value={stats ? `${stats.attendancePercentage}%` : '—'} icon={ClipboardList} onClick={() => onNavigate('attendance')} />
      <MetricCard label="Pending Assignments" value={stats?.pendingAssignments ?? '—'} icon={PenSquare} onClick={() => onNavigate('assignments')} />
      <MetricCard label="Active Quizzes" value={stats?.activeQuizzes ?? '—'} icon={HelpCircle} onClick={() => onNavigate('quizzes')} />
      <MetricCard label="Academic Average" value={stats?.academicAverage == null ? '—' : `${stats.academicAverage}%`} icon={BarChart2} onClick={() => onNavigate('results')} />
    </div>
    {stats?.isAttendanceDefaulter && <div className="bg-[#fdf6e0] border border-[#f0df90] rounded-2xl p-4 flex gap-3"><AlertTriangle size={18} className="text-[#7a6000] shrink-0"/><div><p className="text-sm font-semibold">Attendance needs attention</p><p className="text-xs text-[#7a6a55]">Your overall attendance is below 75%. Review the affected subjects.</p></div></div>}
    {stats && <div className="grid lg:grid-cols-2 gap-6">
      <Card className="p-5"><SectionHeader title="Today's schedule" sub="Your class and selected PEC sessions" action={<button className="text-xs font-semibold text-[#2F4F3A]" onClick={() => onNavigate('timetable')}>Full timetable</button>}/><div className="space-y-3">{stats.todaySchedule.map((item: any) => <div key={item.id} className="flex gap-3 rounded-xl bg-[#F4F1E6] p-3 border-l-4 border-[#7DB7C9]"><div className="w-24 shrink-0"><p className="text-sm font-bold">{item.startTime}</p><p className="text-xs text-[#9a8a75]">to {item.endTime}</p></div><div className="min-w-0"><p className="text-sm font-semibold">{item.course}</p><p className="text-xs text-[#7a6a55]">{item.room || 'Room not assigned'} · {item.faculty || 'Faculty not assigned'}</p></div></div>)}{!stats.todaySchedule.length && <p className="text-sm text-[#9a8a75] py-6 text-center">No sessions scheduled today.</p>}</div></Card>
      <Card className="p-5"><SectionHeader title="Subject attendance" sub="Calculated from conducted lectures"/><div className="space-y-4">{stats.subjectAttendance.map((course: any) => <button key={course.course} onClick={() => onNavigate('attendance')} className="w-full text-left"><div className="flex justify-between text-sm mb-1"><span className="font-medium">{course.course} · {course.name}</span><span className={course.isDefaulter ? 'text-[#b04040] font-bold' : 'font-bold'}>{course.percentage}%</span></div><ProgressBar value={course.percentage}/></button>)}</div></Card>
      <Card className="p-5"><SectionHeader title="Upcoming work" sub="Assignments and quizzes requiring attention"/><div className="space-y-3">{stats.upcomingAssignments.map((item: any) => <button key={item.id} className="w-full flex items-center gap-3 text-left p-3 rounded-xl hover:bg-[#F4F1E6]" onClick={() => onNavigate('assignments')}><PenSquare size={16}/><div className="flex-1"><p className="text-sm font-semibold">{item.title}</p><p className="text-xs text-[#7a6a55]">{item.courseCode} · due {item.dueDate}</p></div><Badge variant={item.status}>{item.status}</Badge></button>)}{stats.upcomingQuizzes.map((item: any) => <button key={item.id} className="w-full flex items-center gap-3 text-left p-3 rounded-xl hover:bg-[#F4F1E6]" onClick={() => onNavigate('quizzes')}><HelpCircle size={16}/><div className="flex-1"><p className="text-sm font-semibold">{item.title}</p><p className="text-xs text-[#7a6a55]">{item.courseCode} · {item.duration} minutes</p></div><Badge variant={item.status}>{item.status}</Badge></button>)}{!stats.upcomingAssignments.length && !stats.upcomingQuizzes.length && <p className="text-sm text-[#9a8a75] py-6 text-center">No upcoming work.</p>}</div></Card>
      <Card className="p-5"><SectionHeader title="Recent announcements" sub="Latest college and class updates" action={<button className="text-xs font-semibold text-[#2F4F3A]" onClick={() => onNavigate('announcements')}>View all</button>}/><div className="space-y-3">{stats.recentAnnouncements.map((item: any) => <button key={item.id} className="w-full flex gap-3 text-left p-3 rounded-xl hover:bg-[#F4F1E6]" onClick={() => onNavigate('announcements')}><Bell size={16} className="text-[#E8D36A] shrink-0"/><div><p className="text-sm font-semibold">{item.title}</p><p className="text-xs text-[#7a6a55]">{item.publisher} · {item.date}</p></div></button>)}{!stats.recentAnnouncements.length && <p className="text-sm text-[#9a8a75] py-6 text-center">No announcements.</p>}</div></Card>
    </div>}
    {!stats && !error && <Card className="p-8 text-center text-[#7a6a55]"><Clock size={20} className="inline mr-2"/>Loading dashboard…</Card>}
  </div>;
}
