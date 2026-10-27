import React, { useEffect, useState } from 'react';
import { Users, ClipboardList, AlertTriangle, BookOpen } from 'lucide-react';
import { Card, MetricCard } from '../components/ui';
import { api } from '../services/api';

interface Props { onNavigate: (page: string) => void; userName: string; isHOD?: boolean }
export default function FacultyDashboard({ onNavigate, userName, isHOD }: Props) {
  const [stats, setStats] = useState<any>(null); const [error, setError] = useState('');
  useEffect(() => { api.getDashboardStats('faculty').then(setStats).catch(e => setError(e.message)); }, []);
  return <div className="p-6 max-w-7xl mx-auto space-y-7">
    <div className="flex justify-between"><div><h1 className="text-2xl font-bold">Welcome, {userName}</h1><p className="text-sm text-[#7a6a55]">Faculty dashboard · database-derived attendance</p></div>{isHOD && <span className="h-fit rounded-xl bg-[#2F4F3A] text-white px-4 py-2 text-sm"><BookOpen size={14} className="inline mr-2"/>HOD access</span>}</div>
    {error && <Card className="p-4 text-[#b04040]">{error}</Card>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard label="Assigned Classes" value={stats?.classes ?? '—'} icon={BookOpen} onClick={() => onNavigate('my-class')} />
      <MetricCard label="Average Attendance" value={stats ? `${stats.avgAttendance ?? 0}%` : '—'} icon={ClipboardList} onClick={() => onNavigate('faculty-attendance')} />
      <MetricCard label="Defaulters" value={stats?.defaulters ?? '—'} icon={AlertTriangle} color="#b04040" onClick={() => onNavigate('defaulters')} />
      <MetricCard label="Teaching Schedule" value="View" icon={Users} onClick={() => onNavigate('timetable')} />
    </div>
    {!stats && !error && <Card className="p-5">Loading dashboard…</Card>}
  </div>;
}
