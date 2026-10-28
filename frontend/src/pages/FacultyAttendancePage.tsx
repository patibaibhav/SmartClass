import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, ClipboardList, Plus, Save } from 'lucide-react';
import { AttendanceToggle, Badge, Button, Card, Input, MetricCard, Modal, SectionHeader } from '../components/ui';
import { api } from '../services/api';

const today = new Date().toISOString().slice(0, 10);
const blankLecture = { class_id: '', course_id: '', date: today, start_time: '09:30', end_time: '10:30', classroom: '', lecture_type: 'Regular', notes: '' };

export default function FacultyAttendancePage() {
  const [summary, setSummary] = useState<any>(null);
  const [lectures, setLectures] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedId, setSelectedId] = useState('');
  const [roster, setRoster] = useState<any>(null);
  const [marks, setMarks] = useState<Record<string, 'P' | 'A'>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<any>(blankLecture);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const [attendance, lectureRows, classRows, courseRows, me] = await Promise.all([
      api.getFacultyAttendance(), api.getLectures(), api.getClasses(), api.getCourses(), api.me(),
    ]);
    setSummary(attendance); setLectures(lectureRows); setClasses(classRows); setCourses(courseRows); setUser(me);
  }
  useEffect(() => { load().catch(e => setError(e.message)); }, []);

  async function openLecture(id: string) {
    setSelectedId(id); setError(''); setMessage('');
    if (!id) { setRoster(null); return; }
    try {
      const payload = await api.getLectureRoster(Number(id));
      setRoster(payload);
      setMarks(Object.fromEntries(payload.students.map((student: any) => [student.id, student.status === 'Absent' ? 'A' : 'P'])));
    } catch (e: any) { setError(e.message); }
  }

  async function save() {
    if (!roster) return;
    setError('');
    try {
      await api.markAttendance(roster.lecture.id, roster.students.map((student: any) => ({ student_id: student.id, status: marks[student.id] === 'A' ? 'Absent' : 'Present' })));
      setMessage('Attendance saved. Student and HOD views now use these records.');
      await openLecture(String(roster.lecture.id));
      await load();
    } catch (e: any) { setError(e.message); }
  }

  async function createLecture() {
    setError('');
    try {
      const result = await api.createLecture({ ...form, actual_faculty_id: user.id, scheduled_faculty_id: user.id });
      setCreateOpen(false); setForm(blankLecture); await load(); await openLecture(String(result.lectureId));
      setMessage('Lecture created. Mark the roster and save attendance.');
    } catch (e: any) { setError(e.message); }
  }

  return <div className="p-6 max-w-6xl mx-auto space-y-5">
    <SectionHeader title="Attendance Management" sub="Open a lecture, mark its eligible roster, save, and reopen corrections" action={<Button onClick={() => setCreateOpen(true)}><Plus size={14}/>New lecture</Button>}/>
    {error && <Card className="p-4 text-[#b04040]">{error}</Card>}{message && <Card className="p-4 text-[#1a6b3c]"><CheckCircle size={16} className="inline mr-2"/>{message}</Card>}
    {summary && <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><MetricCard label="Assigned Classes" value={summary.stats.classes} icon={ClipboardList}/><MetricCard label="Assigned Courses" value={summary.stats.courses} icon={ClipboardList}/><MetricCard label="Average Attendance" value={`${summary.stats.avgAttendance}%`} icon={ClipboardList}/><MetricCard label="Defaulters" value={summary.stats.defaulters} icon={AlertTriangle} color="#b04040"/></div>}
    <Card className="p-5"><label className="text-xs font-semibold uppercase tracking-wider">Lecture</label><select value={selectedId} onChange={e => void openLecture(e.target.value)} className="mt-2 w-full px-4 py-3 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6]"><option value="">Select a scheduled or conducted lecture</option>{lectures.map(lecture => <option key={lecture.id} value={lecture.id}>{lecture.date} · {lecture.startTime}–{lecture.endTime} · {lecture.courseCode} · {lecture.classIds.join(', ')} · {lecture.status}</option>)}</select></Card>
    {roster && <Card className="overflow-hidden"><div className="p-5 flex justify-between gap-4 border-b border-[#E8E2D0]"><div><h3 className="font-bold">{roster.lecture.courseName}</h3><p className="text-xs text-[#7a6a55]">{roster.lecture.date} · {roster.lecture.startTime}–{roster.lecture.endTime} · {roster.lecture.classIds.join(', ')}</p></div><Button onClick={save}><Save size={14}/>Save attendance</Button></div><div className="overflow-x-auto"><table className="sc-table"><thead><tr><th>Roll</th><th>Student</th><th>Class</th><th>Attendance</th><th>State</th></tr></thead><tbody>{roster.students.map((student: any) => <tr key={student.id}><td>{student.rollNo}</td><td>{student.name}</td><td>{student.classId}</td><td><AttendanceToggle value={marks[student.id] || 'P'} onChange={value => setMarks(current => ({ ...current, [student.id]: value }))}/></td><td><Badge variant={student.saved ? 'success' : 'pending'}>{student.saved ? 'Saved' : 'New'}</Badge></td></tr>)}</tbody></table></div></Card>}
    {createOpen && <Modal title="Create authorized lecture" onClose={() => setCreateOpen(false)}><div className="space-y-4"><select value={form.class_id} onChange={e => setForm({...form,class_id:e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-[#F4F1E6]"><option value="">Select class</option>{classes.map(item => <option key={item.id} value={item.id}>{item.id} · {item.name}</option>)}</select><select value={form.course_id} onChange={e => setForm({...form,course_id:e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-[#F4F1E6]"><option value="">Select course</option>{courses.map(item => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select><Input label="Date" type="date" value={form.date} onChange={value => setForm({...form,date:value})}/><div className="grid grid-cols-2 gap-3"><Input label="Start" type="time" value={form.start_time} onChange={value => setForm({...form,start_time:value})}/><Input label="End" type="time" value={form.end_time} onChange={value => setForm({...form,end_time:value})}/></div><Input label="Classroom" value={form.classroom} onChange={value => setForm({...form,classroom:value})}/><select value={form.lecture_type} onChange={e => setForm({...form,lecture_type:e.target.value})} className="w-full px-4 py-2.5 rounded-xl border bg-[#F4F1E6]"><option>Regular</option><option>Extra</option><option>Substitute</option></select><Input label="Notes" value={form.notes} onChange={value => setForm({...form,notes:value})}/><Button className="w-full justify-center" onClick={createLecture} disabled={!form.class_id || !form.course_id || !form.date || !form.classroom}>Create lecture</Button></div></Modal>}
  </div>;
}
