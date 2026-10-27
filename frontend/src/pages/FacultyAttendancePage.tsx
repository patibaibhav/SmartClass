import React, { useEffect, useState } from 'react';
import { AlertTriangle, ClipboardList } from 'lucide-react';
import { Card, MetricCard, Badge, SectionHeader, EmptyState } from '../components/ui';
import { api } from '../services/api';

export default function FacultyAttendancePage() {
  const [data, setData] = useState<any>(null); const [error, setError] = useState('');
  useEffect(() => { api.getFacultyAttendance().then(setData).catch(e => setError(e.message)); }, []);
  return <div className="p-6 max-w-5xl mx-auto space-y-5"><SectionHeader title="Attendance Management" sub="Computed from conducted lectures and attendance records"/>
    {error && <Card className="p-4 text-[#b04040]">{error}</Card>}
    {data && <><div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><MetricCard label="Assigned Classes" value={data.stats.classes} icon={ClipboardList}/><MetricCard label="Assigned Courses" value={data.stats.courses} icon={ClipboardList}/><MetricCard label="Average Attendance" value={`${data.stats.avgAttendance}%`} icon={ClipboardList}/><MetricCard label="Defaulters" value={data.stats.defaulters} icon={AlertTriangle} color="#b04040"/></div>
      <Card className="p-4 text-sm text-[#7a6a55]">Lecture creation and attendance-marking APIs enforce faculty assignment and roster membership. This screen currently provides the verified attendance overview; a full roster editor remains an integration task.</Card>
      {data.defaulters.length === 0 ? <EmptyState icon={ClipboardList} message="No students are below the 75% threshold in recorded lectures."/> : <Card className="overflow-hidden"><table className="sc-table"><thead><tr><th>Student</th><th>Roll No.</th><th>Course</th><th>Attendance</th></tr></thead><tbody>{data.defaulters.map((s: any) => <tr key={`${s.id}-${s.course}`}><td>{s.name}</td><td>{s.rollNo}</td><td>{s.course}</td><td><Badge variant={s.percentage < 65 ? 'danger' : 'warning'}>{s.percentage}%</Badge></td></tr>)}</tbody></table></Card>}
    </>}{!data && !error && <p>Loading attendance…</p>}
  </div>;
}
