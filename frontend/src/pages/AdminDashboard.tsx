import React, { useEffect, useState } from 'react';
import { Users, BookOpen, Building2, AlertCircle, Calendar } from 'lucide-react';
import { Card, MetricCard, SectionHeader } from '../components/ui';
import { api } from '../services/api';

interface Props { onNavigate: (page: string) => void; currentPage?: string }
export default function AdminDashboard({ onNavigate, currentPage = 'dashboard' }: Props) {
  const [stats, setStats] = useState<any>(null); const [error, setError] = useState('');
  useEffect(() => { api.getDashboardStats('admin').then(setStats).catch(e => setError(e.message)); }, []);
  if (currentPage !== 'dashboard') {
    const labels: Record<string,string> = { 'admin-users': 'User Management', 'admin-classes': 'Class and Course Management', 'admin-analytics': 'Administrative Analytics' };
    return <div className="p-6 max-w-5xl mx-auto space-y-5"><SectionHeader title={labels[currentPage] || 'Administration'} sub="Administrative overview"/><Card className="p-6"><p className="font-semibold">This write workflow is not exposed in the production API yet.</p><p className="text-sm text-[#7a6a55] mt-2">Use the validated, idempotent import process for accounts and academic structure. The UI does not simulate create, edit, deactivate, or analytics actions.</p></Card></div>;
  }
  return <div className="p-6 max-w-7xl mx-auto space-y-7"><SectionHeader title="Administration" sub="Database-backed institutional counts"/>
    {error && <Card className="p-4 text-[#b04040]">{error}</Card>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard label="Students" value={stats?.totalStudents ?? '—'} icon={Users} onClick={() => onNavigate('admin-users')}/>
      <MetricCard label="Faculty" value={stats?.totalFaculty ?? '—'} icon={Users} onClick={() => onNavigate('admin-users')}/>
      <MetricCard label="Classes" value={stats?.totalClasses ?? '—'} icon={BookOpen} onClick={() => onNavigate('admin-classes')}/>
      <MetricCard label="Courses" value={stats?.totalCourses ?? '—'} icon={BookOpen} onClick={() => onNavigate('admin-classes')}/>
      <MetricCard label="Classrooms" value={stats?.totalClassrooms ?? '—'} icon={Building2} onClick={() => onNavigate('admin-classrooms')}/>
      <MetricCard label="Open Grievances" value={stats?.pendingGrievances ?? '—'} icon={AlertCircle} onClick={() => onNavigate('grievances')}/>
      <MetricCard label="Events" value={stats?.upcomingEvents ?? '—'} icon={Calendar}/>
    </div>{!stats && !error && <Card className="p-5">Loading dashboard…</Card>}</div>;
}
