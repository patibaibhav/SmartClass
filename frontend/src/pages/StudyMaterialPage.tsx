import React, { useEffect, useMemo, useState } from 'react';
import { FileText, ExternalLink, Upload } from 'lucide-react';
import { Card, Badge, Button, SectionHeader, EmptyState } from '../components/ui';
import { api } from '../services/api';

interface Props { role?: string }
type Material = { id: string; course: string; unit: string; title: string; type: string; size?: string; uploadedAt?: string; description?: string };

export default function StudyMaterialPage({ role = 'student' }: Props) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getMaterials(), api.getCourses()]).then(([m, c]) => {
      setMaterials(m); setCourses(c);
      if (m.length) setSelectedCourse(m[0].course);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const visible = selectedCourse ? materials.filter(m => m.course === selectedCourse) : materials;
  const units = useMemo(() => [...new Set(visible.map(m => m.unit))], [visible]);

  return <div className="p-6 max-w-5xl mx-auto space-y-6">
    <SectionHeader title="Study Material" sub="Authorized course resources from the database" action={role === 'faculty' ? <Button variant="secondary" disabled title="Persistent object storage is not configured"><Upload size={14}/> Upload unavailable</Button> : undefined} />
    {role === 'faculty' && <p className="text-xs text-[#7a6a55]">Uploads are intentionally disabled until private persistent object storage and file scanning are configured.</p>}
    <div className="flex gap-2 flex-wrap"><button onClick={() => setSelectedCourse('')} className={`px-4 py-2 rounded-xl text-sm ${!selectedCourse ? 'bg-[#2F4F3A] text-white' : 'bg-[#E8E2D0]'}`}>All</button>{courses.filter(c => materials.some(m => m.course === c.id)).map(c => <button key={c.id} onClick={() => setSelectedCourse(c.id)} className={`px-4 py-2 rounded-xl text-sm ${selectedCourse === c.id ? 'bg-[#2F4F3A] text-white' : 'bg-[#E8E2D0]'}`}>{c.code}</button>)}</div>
    {loading ? <p>Loading materials…</p> : error ? <Card className="p-4 text-[#b04040]">{error}</Card> : units.length === 0 ? <EmptyState icon={FileText} message="No study materials are available for your courses." /> : units.map(unit => <section key={unit} className="space-y-3">
      <h3 className="text-sm font-bold border-b pb-2">{unit}</h3>
      <div className="grid sm:grid-cols-2 gap-3">{visible.filter(m => m.unit === unit).map(m => <Card key={m.id} className="p-4 flex gap-3">
        <FileText size={20} className="text-[#2F4F3A] shrink-0"/><div className="flex-1"><p className="text-sm font-semibold">{m.title}</p><p className="text-xs text-[#7a6a55] mt-1">{m.description || 'No description provided'}</p><div className="flex gap-2 mt-2"><Badge variant="default">{m.type}</Badge>{m.size && <span className="text-xs">{m.size}</span>}</div></div>
        {m.type === 'LINK' && <ExternalLink size={14}/>}</Card>)}</div>
    </section>)}
  </div>;
}
