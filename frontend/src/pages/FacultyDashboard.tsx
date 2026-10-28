import React, { useEffect, useState } from 'react';
import { AlertTriangle, BookOpen, ClipboardList, HelpCircle, PenSquare, Users } from 'lucide-react';
import { Badge, Card, MetricCard, SectionHeader } from '../components/ui';
import { api } from '../services/api';

interface Props { onNavigate: (page: string) => void; userName: string; isHOD?: boolean }

export default function FacultyDashboard({ onNavigate, userName, isHOD }: Props) {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState('');
  useEffect(() => { api.getDashboardStats('faculty').then(setStats).catch(e => setError(e.message)); }, []);
  return <div className="p-6 max-w-7xl mx-auto space-y-7">
    <div className="flex justify-between gap-4"><div><h1 className="text-2xl font-bold">Welcome, {userName}</h1><p className="text-sm text-[#7a6a55]">Teaching activity from your assigned classes and courses</p></div>{isHOD && <button onClick={() => onNavigate('admin-analytics')} className="h-fit rounded-xl bg-[#2F4F3A] text-white px-4 py-2 text-sm"><BookOpen size={14} className="inline mr-2"/>HOD analytics</button>}</div>
    {error && <Card className="p-4 text-[#b04040]">{error}</Card>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard label="Assigned Classes" value={stats?.classes ?? '—'} icon={BookOpen} onClick={() => onNavigate('my-class')}/>
      <MetricCard label="Average Attendance" value={stats ? `${stats.avgAttendance ?? 0}%` : '—'} icon={ClipboardList} onClick={() => onNavigate('faculty-attendance')}/>
      <MetricCard label="Submissions to Grade" value={stats?.pendingAssignments ?? '—'} icon={PenSquare} onClick={() => onNavigate('assignments')}/>
      <MetricCard label="Active Quizzes" value={stats?.activeQuizzes ?? '—'} icon={HelpCircle} onClick={() => onNavigate('quizzes')}/>
    </div>
    {stats && <div className="grid lg:grid-cols-2 gap-6">
      <Card className="p-5"><SectionHeader title="Today's teaching schedule" sub="Scheduled sessions assigned to you" action={<button onClick={() => onNavigate('timetable')} className="text-xs font-semibold text-[#2F4F3A]">Full timetable</button>}/><div className="space-y-3">{stats.todaySchedule.map((item: any) => <div key={item.id} className="flex gap-3 p-3 bg-[#F4F1E6] rounded-xl border-l-4 border-[#7DB7C9]"><div className="w-24"><p className="text-sm font-bold">{item.startTime}</p><p className="text-xs text-[#9a8a75]">{item.endTime}</p></div><div><p className="text-sm font-semibold">{item.course}</p><p className="text-xs text-[#7a6a55]">{item.classIds.join(', ')} · {item.room || 'Room not assigned'}</p></div></div>)}{!stats.todaySchedule.length && <p className="text-sm text-[#9a8a75] py-6 text-center">No teaching sessions today.</p>}</div></Card>
      <Card className="p-5"><SectionHeader title="Assigned subjects" sub="Your authorized class-course combinations"/><div className="grid sm:grid-cols-2 gap-3">{stats.assignedCourses.map((item: any, index: number) => <div key={`${item.classId}-${item.courseId}-${index}`} className="p-3 bg-[#F4F1E6] rounded-xl"><p className="text-sm font-semibold">{item.courseId} · {item.courseName}</p><p className="text-xs text-[#7a6a55]">{item.classId}</p></div>)}</div>{!stats.assignedCourses.length && <p className="text-sm text-[#9a8a75] py-6 text-center">Not assigned any class or course.</p>}</Card>
      <Card className="p-5"><SectionHeader title="Attendance defaulters" sub="Students below the configured threshold" action={<button onClick={() => onNavigate('faculty-attendance')} className="text-xs font-semibold text-[#2F4F3A]">Mark attendance</button>}/><div className="space-y-2">{stats.defaulterSummary.map((item: any) => <div key={`${item.id}-${item.course}`} className="flex items-center gap-3 p-3 rounded-xl bg-[#F4F1E6]"><AlertTriangle size={15} className="text-[#b04040]"/><div className="flex-1"><p className="text-sm font-semibold">{item.name}</p><p className="text-xs text-[#7a6a55]">{item.course}</p></div><Badge variant="danger">{item.percentage}%</Badge></div>)}{!stats.defaulterSummary.length && <p className="text-sm text-[#9a8a75] py-6 text-center">No defaulters in recorded sessions.</p>}</div></Card>
      <Card className="p-5"><SectionHeader title="Recent announcements" sub="Department and college updates"/><div className="space-y-3">{stats.recentAnnouncements.map((item: any) => <div key={item.id} className="p-3 rounded-xl bg-[#F4F1E6]"><p className="text-sm font-semibold">{item.title}</p><p className="text-xs text-[#7a6a55]">{item.publisher} · {item.date}</p></div>)}</div></Card>
    </div>}
    {!stats && !error && <Card className="p-6 text-[#7a6a55]">Loading dashboard…</Card>}
  </div>;
}
