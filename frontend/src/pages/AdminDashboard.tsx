import React, { useEffect, useState } from 'react';
import { Users, BookOpen, Building2, AlertCircle, Calendar } from 'lucide-react';
import { Card, MetricCard, SectionHeader } from '../components/ui';
import { api } from '../services/api';

interface Props { onNavigate: (page: string) => void; currentPage?: string; isHOD?: boolean }
export default function AdminDashboard({ onNavigate, currentPage = 'dashboard', isHOD = false }: Props) {
  const [stats, setStats] = useState<any>(null); const [error, setError] = useState('');
  useEffect(() => { api.getDashboardStats(isHOD ? 'hod' : 'admin').then(setStats).catch(e => setError(e.message)); }, [isHOD]);
  if (isHOD && currentPage === 'admin-analytics') {
    return <div className="p-6 max-w-7xl mx-auto space-y-6"><SectionHeader title="Department Analytics" sub="Computer Engineering · shared academic records"/>
      {error && <Card className="p-4 text-[#b04040]">{error}</Card>}
      {stats && <>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4"><MetricCard label="Students" value={stats.totalStudents} icon={Users}/><MetricCard label="Faculty" value={stats.totalFaculty} icon={Users}/><MetricCard label="Classes" value={stats.totalClasses} icon={BookOpen}/><MetricCard label="Attendance" value={`${stats.departmentAttendance}%`} icon={Calendar}/><MetricCard label="Defaulters" value={stats.defaulters} icon={AlertCircle} color="#b04040"/></div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5"><h3 className="font-bold mb-4">Classwise attendance</h3><div className="space-y-3">{stats.classwiseAttendance.map((item: any) => <div key={item.classId} className="flex justify-between bg-[#F4F1E6] rounded-xl p-3"><span className="font-semibold">{item.classId} · {item.students} students</span><span className="font-bold">{item.attendancePercentage}%</span></div>)}</div></Card>
          <Card className="p-5"><h3 className="font-bold mb-4">Subject performance</h3><div className="space-y-3">{stats.subjectPerformance.map((item: any) => <div key={item.course} className="flex justify-between bg-[#F4F1E6] rounded-xl p-3"><span className="text-sm"><b>{item.course}</b> · {item.name}</span><span className="font-bold">{item.average == null ? '—' : `${item.average}%`}</span></div>)}</div></Card>
          <Card className="p-5 lg:col-span-2"><div className="flex justify-between mb-4"><h3 className="font-bold">Faculty and course summary</h3><button onClick={() => onNavigate('admin-grievances')} className="text-sm font-semibold text-[#2F4F3A]">Pending grievances: {stats.pendingGrievances}</button></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{stats.facultySummaries.map((item: any) => <div key={item.id} className="bg-[#F4F1E6] rounded-xl p-3"><p className="text-sm font-semibold">{item.name}</p><p className="text-xs text-[#7a6a55]">{item.courses === 0 && item.classes === 0 ? 'Not assigned any class or course' : `${item.courses} courses · ${item.classes} classes`}</p></div>)}</div></Card>
        </div>
      </>}
      {!stats && !error && <Card className="p-6">Loading department analytics…</Card>}
    </div>;
  }
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
