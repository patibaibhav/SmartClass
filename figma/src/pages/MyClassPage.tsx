import React, { useState } from 'react';
import { Users, BookOpen, ChevronRight, Clock } from 'lucide-react';
import { Card, Badge, Tabs, SectionHeader, ProgressBar } from '../components/ui';
import { STUDENTS, COURSES, ATTENDANCE_DATA } from '../data/mock';

interface Props {
  role?: string;
  onNavigate?: (page: string) => void;
}

const CLASSES = [
  { name: 'SE-A', division: 'A', year: 'Second Year', dept: 'Computer Science', students: 62, courses: ['CS301', 'CS302', 'CS303', 'CS304', 'CS305'], nextLecture: '09:00 — Data Structures' },
  { name: 'SE-B', division: 'B', year: 'Second Year', dept: 'Computer Science', students: 58, courses: ['CS302'], nextLecture: '11:15 — Database Systems' },
];

export default function MyClassPage({ role = 'student', onNavigate }: Props) {
  const [selectedClass, setSelectedClass] = useState<string | null>(role === 'student' ? 'SE-A' : null);
  const [activeTab, setActiveTab] = useState('Overview');

  if (!selectedClass) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <SectionHeader title="My Classes" sub="Classes assigned to you this semester" />
        <div className="grid sm:grid-cols-2 gap-4">
          {CLASSES.map(cls => (
            <Card key={cls.name} className="p-5" onClick={() => setSelectedClass(cls.name)}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#2F4F3A] flex items-center justify-center">
                  <BookOpen size={16} className="text-[#E8D36A]" />
                </div>
                <span className="text-xs font-semibold text-[#7a6a55] bg-[#E8E2D0] px-2 py-1 rounded-lg">{cls.students} students</span>
              </div>
              <h3 className="text-lg font-bold text-[#1a2e1e]">{cls.name}</h3>
              <p className="text-sm text-[#7a6a55]">Division {cls.division} · {cls.year} · {cls.dept}</p>
              <div className="flex gap-1.5 flex-wrap mt-3">
                {cls.courses.map(c => <Badge key={c} variant="default">{c}</Badge>)}
              </div>
              <p className="text-xs text-[#7DB7C9] mt-3 flex items-center gap-1"><Clock size={11} />Next: {cls.nextLecture}</p>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const cls = CLASSES.find(c => c.name === selectedClass) || CLASSES[0];
  const tabs = role === 'student'
    ? ['Overview', 'Courses', 'Attendance']
    : ['Overview', 'Courses', 'Attendance', 'Students'];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        {role !== 'student' && (
          <button onClick={() => setSelectedClass(null)} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← My Classes</button>
        )}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-[#1a2e1e]">{cls.name}</h2>
          <p className="text-sm text-[#7a6a55]">Division {cls.division} · {cls.year} · {cls.dept}</p>
        </div>
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'Overview' && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="p-5 sm:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-[#1a2e1e]">Class Information</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Class', value: cls.name },
                { label: 'Division', value: cls.division },
                { label: 'Academic Year', value: '2024–25' },
                { label: 'Department', value: cls.dept },
                { label: 'Students', value: cls.students },
                { label: 'Courses', value: cls.courses.length },
              ].map(item => (
                <div key={item.label} className="bg-[#F4F1E6] rounded-xl p-3">
                  <p className="text-xs text-[#7a6a55]">{item.label}</p>
                  <p className="font-semibold text-[#1a2e1e] mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h4 className="text-sm font-bold text-[#1a2e1e] mb-3">Quick Stats</h4>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-[#7a6a55]">Avg Attendance</span><span className="font-bold text-[#2F4F3A]">82%</span></div>
              <div className="flex justify-between"><span className="text-sm text-[#7a6a55]">Active Assignments</span><span className="font-bold text-[#1a2e1e]">4</span></div>
              <div className="flex justify-between"><span className="text-sm text-[#7a6a55]">Active Quizzes</span><span className="font-bold text-[#1a2e1e]">1</span></div>
              <div className="flex justify-between"><span className="text-sm text-[#7a6a55]">Next Lecture</span><span className="font-bold text-[#7DB7C9] text-xs">09:00 Today</span></div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'Courses' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {COURSES.filter(c => cls.courses.includes(c.code)).map(course => (
            <Card key={course.id} className="p-5">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="default">{course.code}</Badge>
                <span className="text-xs text-[#7a6a55]">{course.credits} credits</span>
              </div>
              <p className="text-sm font-bold text-[#1a2e1e]">{course.name}</p>
              <p className="text-xs text-[#7a6a55] mt-1">{course.faculty}</p>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'Attendance' && (
        <div className="space-y-3">
          {ATTENDANCE_DATA.map(a => (
            <Card key={a.course} className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#1a2e1e]">{a.name}</p>
                <p className="text-xs text-[#7a6a55]">{a.present}/{a.total} lectures</p>
              </div>
              <div className="w-32">
                <ProgressBar value={a.percentage} />
              </div>
              <span className="font-bold text-sm w-12 text-right" style={{ color: a.percentage >= 75 ? '#2F4F3A' : '#b04040' }}>
                {a.percentage.toFixed(0)}%
              </span>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'Students' && role !== 'student' && (
        <Card className="overflow-hidden">
          <table className="sc-table">
            <thead><tr><th>Student</th><th>Roll No.</th><th>Attendance</th></tr></thead>
            <tbody>
              {STUDENTS.map((s, i) => {
                const att = 60 + Math.floor(Math.random() * 35);
                return (
                  <tr key={s.id}>
                    <td className="font-medium">{s.name}</td>
                    <td>{s.rollNo}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: att >= 75 ? '#2F4F3A' : '#b04040' }}>{att}%</span>
                        <div className="w-20"><ProgressBar value={att} /></div>
                        {att < 75 && <Badge variant={att < 65 ? 'danger' : 'warning'}>{att < 65 ? 'Defaulter' : 'Warning'}</Badge>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
