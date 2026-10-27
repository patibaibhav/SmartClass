import React, { useEffect, useState } from 'react';
import { ClipboardList, PenSquare, HelpCircle, BarChart2, AlertTriangle } from 'lucide-react';
import { Card, MetricCard } from '../components/ui';
import { api } from '../services/api';

interface Props { onNavigate: (page: string) => void; userName: string }
export default function StudentDashboard({ onNavigate, userName }: Props) {
  const [stats, setStats] = useState<any>(null); const [quizzes, setQuizzes] = useState<any[]>([]); const [error, setError] = useState('');
  useEffect(() => { Promise.all([api.getDashboardStats('student'), api.getQuizzes()]).then(([s, q]) => { setStats(s); setQuizzes(q); }).catch(e => setError(e.message)); }, []);
  const activeQuizzes = quizzes.filter(q => q.status === 'available' || q.status === 'upcoming').length;
  return <div className="p-6 max-w-7xl mx-auto space-y-7">
    <div><h1 className="text-2xl font-bold">Welcome, {userName.split(' ')[0]}</h1><p className="text-sm text-[#7a6a55]">Your database-backed academic overview.</p></div>
    {error && <Card className="p-4 text-[#b04040]">{error}</Card>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard label="Attendance" value={stats ? `${stats.attendancePercentage}%` : '—'} icon={ClipboardList} onClick={() => onNavigate('attendance')} />
      <MetricCard label="Pending Assignments" value={stats?.pendingAssignments ?? '—'} icon={PenSquare} onClick={() => onNavigate('assignments')} />
      <MetricCard label="Active Quizzes" value={activeQuizzes} icon={HelpCircle} onClick={() => onNavigate('quizzes')} />
      <MetricCard label="Results" value="View" icon={BarChart2} onClick={() => onNavigate('results')} />
    </div>
    {stats?.isAttendanceDefaulter && <div className="bg-[#fdf6e0] border border-[#f0df90] rounded-2xl p-4 flex gap-3"><AlertTriangle size={18}/><p className="text-sm">Overall attendance is below the configured 75% threshold. Open Attendance for the course-level calculation.</p></div>}
    {!stats && !error && <Card className="p-5">Loading dashboard…</Card>}
  </div>;
}
