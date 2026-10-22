import React, { useState } from 'react';
import { Search, CheckCircle, Users, ChevronRight, Plus } from 'lucide-react';
import { Card, Badge, Button, Select, SectionHeader, AttendanceToggle, Modal, Toast } from '../components/ui';
import { STUDENTS, COURSES, TIMETABLE } from '../data/mock';

type Phase = 'select' | 'mark' | 'history' | 'extra' | 'substitute';

export default function FacultyAttendancePage() {
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedClass, setSelectedClass] = useState('SE-A');
  const [selectedCourse, setSelectedCourse] = useState('CS302');
  const [selectedLectureType, setSelectedLectureType] = useState('Regular');
  const [attendance, setAttendance] = useState<Record<string, 'P' | 'A'>>(() =>
    Object.fromEntries(STUDENTS.map(s => [s.id, 'P']))
  );
  const [searchQ, setSearchQ] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [extraReason, setExtraReason] = useState('');

  const filteredStudents = STUDENTS.filter(s =>
    s.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchQ.toLowerCase())
  );

  const presentCount = Object.values(attendance).filter(v => v === 'P').length;
  const absentCount = STUDENTS.length - presentCount;

  function markAll(status: 'P' | 'A') {
    setAttendance(Object.fromEntries(STUDENTS.map(s => [s.id, status])));
  }

  function saveAttendance() {
    setConfirmOpen(false);
    setToast('Attendance saved successfully for ' + STUDENTS.length + ' students.');
    setPhase('history');
  }

  if (phase === 'extra') {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <button onClick={() => setPhase('select')} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← Back</button>
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#1a2e1e]">Add Extra Lecture</h2>
          <p className="text-xs text-[#7a6a55]">Extra lectures will appear in the timetable, attendance history, and count toward attendance percentage.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Class</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] appearance-none">
                {['SE-A', 'SE-B', 'TE-A'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Course</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] appearance-none">
                {COURSES.map(c => <option key={c.id}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Date</label>
              <input type="date" className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Classroom</label>
              <input type="text" placeholder="e.g. A-204" className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Start Time</label>
              <input type="time" className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">End Time</label>
              <input type="time" className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Reason</label>
            <textarea rows={2} value={extraReason} onChange={e => setExtraReason(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] resize-none" placeholder="Reason for extra lecture..." />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setPhase('select')}>Cancel</Button>
            <Button variant="primary" onClick={() => { setPhase('select'); setToast('Extra lecture added successfully.'); }}>Add Extra Lecture</Button>
          </div>
        </Card>
        {toast && <Toast message={toast} onClose={() => setToast('')} />}
      </div>
    );
  }

  if (phase === 'substitute') {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <button onClick={() => setPhase('select')} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← Back</button>
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#1a2e1e]">Mark as Substitute Lecture</h2>
          <div className="bg-[#fdf6e0] border border-[#f0df90] rounded-xl p-3 text-xs text-[#7a4a00]">
            Attendance will be recorded against the Faculty member actually conducting the lecture while preserving the original scheduled Faculty.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Original Faculty</label>
              <input type="text" defaultValue="Prof. Rajesh Mehta" className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" readOnly />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Substitute Faculty</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] appearance-none">
                <option>Prof. Meera Patel</option>
                <option>Prof. Anita Singh</option>
                <option>Prof. Vikram Joshi</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Class</label>
              <input type="text" defaultValue="SE-A" className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Course</label>
              <input type="text" defaultValue="CS302 — Database Systems" className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Date</label>
              <input type="date" className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Classroom</label>
              <input type="text" defaultValue="B-102" className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Reason</label>
            <textarea rows={2} className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] resize-none" placeholder="Reason for substitute lecture..." />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setPhase('select')}>Cancel</Button>
            <Button variant="primary" onClick={() => { setPhase('select'); setToast('Substitute lecture recorded successfully.'); }}>Save Substitute Lecture</Button>
          </div>
        </Card>
        {toast && <Toast message={toast} onClose={() => setToast('')} />}
      </div>
    );
  }

  if (phase === 'mark') {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <button onClick={() => setPhase('select')} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← Change Selection</button>

        {/* Lecture info */}
        <Card className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[
              { label: 'Course', value: COURSES.find(c => c.id === selectedCourse)?.name || selectedCourse },
              { label: 'Class', value: selectedClass },
              { label: 'Date', value: 'Aug 14, 2024' },
              { label: 'Time', value: '10:00 – 11:00' },
              { label: 'Classroom', value: 'B-102' },
              { label: 'Type', value: selectedLectureType },
            ].map(item => (
              <div key={item.label} className="bg-[#F4F1E6] rounded-xl p-3">
                <p className="text-xs text-[#7a6a55]">{item.label}</p>
                <p className="font-semibold text-[#1a2e1e] mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8a75]" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search student..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
          </div>
          <Button size="sm" variant="secondary" onClick={() => markAll('P')}>Mark All Present</Button>
          <Button size="sm" variant="ghost" onClick={() => markAll('A')}>Mark All Absent</Button>
          <div className="ml-auto text-sm font-medium text-[#3a2e1a]">
            <span className="text-[#2F4F3A] font-bold">{presentCount} P</span> · <span className="text-[#D98282] font-bold">{absentCount} A</span>
          </div>
        </div>

        {/* Student roster */}
        <Card className="overflow-hidden">
          <table className="sc-table">
            <thead><tr><th>#</th><th>Student</th><th>Roll No.</th><th>Status</th></tr></thead>
            <tbody>
              {filteredStudents.map((s, i) => (
                <tr key={s.id}>
                  <td className="text-[#9a8a75]">{i + 1}</td>
                  <td className="font-medium">{s.name}</td>
                  <td>{s.rollNo}</td>
                  <td>
                    <AttendanceToggle value={attendance[s.id] || 'P'} onChange={v => setAttendance(a => ({ ...a, [s.id]: v }))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="flex justify-end">
          <Button variant="primary" onClick={() => setConfirmOpen(true)}>
            <CheckCircle size={15} /> Save Attendance
          </Button>
        </div>

        {confirmOpen && (
          <Modal title="Confirm Attendance" onClose={() => setConfirmOpen(false)}>
            <div className="space-y-4">
              <p className="text-sm text-[#3a2e1a]">Save attendance for <strong>{STUDENTS.length} students</strong> in <strong>{selectedClass} — {selectedCourse}</strong>?</p>
              <div className="flex gap-6 text-center">
                <div><p className="text-xl font-bold text-[#2F4F3A]">{presentCount}</p><p className="text-xs text-[#7a6a55]">Present</p></div>
                <div><p className="text-xl font-bold text-[#D98282]">{absentCount}</p><p className="text-xs text-[#7a6a55]">Absent</p></div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Review Again</Button>
                <Button variant="primary" onClick={saveAttendance}>Confirm & Save</Button>
              </div>
            </div>
          </Modal>
        )}

        {toast && <Toast message={toast} onClose={() => setToast('')} />}
      </div>
    );
  }

  if (phase === 'history') {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <SectionHeader title="Attendance" sub="Mark and manage lecture attendance" />
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setPhase('substitute')}>Substitute</Button>
            <Button size="sm" variant="secondary" onClick={() => setPhase('extra')}>Extra Lecture</Button>
            <Button size="sm" variant="primary" onClick={() => setPhase('select')}>Mark Attendance</Button>
          </div>
        </div>
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E2D0]">
            <p className="text-sm font-bold text-[#1a2e1e]">Lecture History</p>
          </div>
          <table className="sc-table">
            <thead><tr><th>Date</th><th>Course</th><th>Class</th><th>Type</th><th>Faculty</th><th>Present</th><th>Absent</th></tr></thead>
            <tbody>
              {[
                { date: '2024-08-14', course: 'CS302', class: 'SE-A', type: 'Regular', faculty: 'Prof. Mehta', present: 58, absent: 4 },
                { date: '2024-08-13', course: 'CS302', class: 'SE-A', type: 'Substitute', faculty: 'Prof. Patel', present: 55, absent: 7 },
                { date: '2024-08-12', course: 'CS302', class: 'SE-A', type: 'Regular', faculty: 'Prof. Mehta', present: 60, absent: 2 },
                { date: '2024-08-11', course: 'CS302', class: 'SE-B', type: 'Cancelled', faculty: 'Prof. Mehta', present: 0, absent: 0 },
                { date: '2024-08-09', course: 'CS302', class: 'SE-A', type: 'Extra', faculty: 'Prof. Mehta', present: 52, absent: 10 },
              ].map((l, i) => (
                <tr key={i}>
                  <td>{l.date}</td>
                  <td>{l.course}</td>
                  <td>{l.class}</td>
                  <td><Badge variant={l.type.toLowerCase() as any}>{l.type}</Badge></td>
                  <td>{l.faculty}</td>
                  <td className="text-[#2F4F3A] font-semibold">{l.present}</td>
                  <td className="text-[#D98282] font-semibold">{l.absent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  }

  // Select phase
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionHeader title="Attendance" sub="Select a class and lecture to mark attendance" />
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setPhase('substitute')}>Substitute Lecture</Button>
          <Button size="sm" variant="secondary" onClick={() => setPhase('extra')}>Extra Lecture</Button>
        </div>
      </div>

      <button onClick={() => setPhase('history')} className="text-sm text-[#2F4F3A] font-semibold hover:underline">View attendance history →</button>

      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#1a2e1e]">Select Lecture</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Class</label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] appearance-none">
              {['SE-A', 'SE-B', 'TE-A'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Course</label>
            <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] appearance-none">
              {COURSES.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Lecture Type</label>
            <div className="flex gap-2 flex-wrap">
              {['Regular', 'Substitute', 'Extra', 'Cancelled'].map(t => (
                <button key={t} onClick={() => setSelectedLectureType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedLectureType === t ? 'bg-[#2F4F3A] text-[#F4F1E6]' : 'bg-[#E8E2D0] text-[#5a4a35] hover:bg-[#ddd7c0]'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-[#F4F1E6] rounded-xl text-sm text-[#3a2e1a] flex-wrap">
          <Users size={15} className="text-[#2F4F3A]" />
          <span><strong>{STUDENTS.length}</strong> students in {selectedClass}</span>
          <span>·</span>
          <span>Date: <strong>Aug 14, 2024</strong></span>
        </div>

        {selectedLectureType === 'Cancelled' ? (
          <div className="space-y-2">
            <p className="text-xs text-[#9a8a75]">A cancelled lecture will appear in history but does not count toward attendance percentage.</p>
            <Button variant="primary" className="w-full justify-center" onClick={() => setToast('Lecture marked as cancelled.')}>Mark as Cancelled</Button>
          </div>
        ) : (
          <Button variant="primary" className="w-full justify-center py-3" onClick={() => setPhase('mark')}>
            <Users size={15} /> Open Student Roster
          </Button>
        )}
      </Card>
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
