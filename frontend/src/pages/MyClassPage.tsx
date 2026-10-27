import React, { useEffect, useState } from 'react';
import { Users, BookOpen } from 'lucide-react';
import { Card, Badge, SectionHeader, EmptyState } from '../components/ui';
import { api } from '../services/api';

interface Props { role?: string; onNavigate?: (page: string) => void }
export default function MyClassPage({ role = 'student' }: Props) {
  const [payload, setPayload] = useState<any>(null); const [selected, setSelected] = useState<any>(null); const [error, setError] = useState('');
  useEffect(() => { api.getMyClass().then(data => { setPayload(data); if (!data.classes) setSelected(data); }).catch(e => setError(e.message)); }, []);
  if (error) return <div className="p-6 max-w-4xl mx-auto"><SectionHeader title="My Classes"/><Card className="p-5 text-[#b04040]">{error}</Card></div>;
  if (!payload) return <div className="p-6">Loading class data…</div>;
  if (payload.classes && !selected) return <div className="p-6 max-w-4xl mx-auto space-y-5"><SectionHeader title="My Classes" sub="Classes assigned through course-faculty relationships"/>{payload.classes.length === 0 ? <EmptyState icon={BookOpen} message="No classes are assigned to this faculty account."/> : <div className="grid sm:grid-cols-2 gap-4">{payload.classes.map((c: any) => <Card key={c.classId} className="p-5" onClick={() => setSelected(c)}><BookOpen size={18}/><h3 className="font-bold mt-3">{c.className}</h3><p className="text-sm text-[#7a6a55]">{c.totalStudents} students · {c.courses.length} courses</p></Card>)}</div>}</div>;
  const cls = selected;
  return <div className="p-6 max-w-5xl mx-auto space-y-5">{payload.classes && <button onClick={() => setSelected(null)} className="text-sm font-semibold">← My Classes</button>}<SectionHeader title={cls.className} sub={`${cls.totalStudents} enrolled students`}/>
    <div className="grid sm:grid-cols-2 gap-4">{cls.courses.map((course: any) => <Card key={course.id} className="p-5"><Badge variant="default">{course.code || course.id}</Badge><p className="font-bold mt-2">{course.name || course.id}</p>{course.faculty && <p className="text-xs text-[#7a6a55]">{course.faculty}</p>}</Card>)}</div>
    {role !== 'student' && <Card className="overflow-hidden"><table className="sc-table"><thead><tr><th>Student</th><th>Roll No.</th></tr></thead><tbody>{cls.students.map((s: any) => <tr key={s.id}><td className="font-medium"><Users size={12} className="inline mr-2"/>{s.name}</td><td>{s.rollNo}</td></tr>)}</tbody></table></Card>}
  </div>;
}
