import React from 'react';
import { Users, ClipboardList, AlertTriangle, BookOpen, PenSquare, HelpCircle, ChevronRight, Plus, Clock } from 'lucide-react';
import { Card, MetricCard, Badge, ProgressBar, SectionHeader } from '../components/ui';
import { FACULTY_STATS, STUDENTS, ATTENDANCE_DATA, TIMETABLE } from '../data/mock';

interface Props {
  onNavigate: (page: string) => void;
  userName: string;
  isHOD?: boolean;
}

const CLASSES = [
  { name: 'SE-A', division: 'A', year: '2022–23', students: 62, courses: ['CS301', 'CS302'], nextLecture: '09:00 — Data Structures' },
  { name: 'SE-B', division: 'B', year: '2022–23', students: 58, courses: ['CS302'], nextLecture: '11:15 — Database Systems' },
  { name: 'TE-A', division: 'A', year: '2021–22', students: 55, courses: ['CS401'], nextLecture: '14:00 — Advanced Databases' },
];

const DEFAULTERS = [
  { name: 'Vikram Nair', class: 'SE-A', course: 'CS303', attendance: 62, status: 'Defaulter' },
  { name: 'Karan Bhat', class: 'SE-A', course: 'CS302', attendance: 68, status: 'Warning' },
  { name: 'Pooja Sharma', class: 'SE-B', course: 'CS303', attendance: 61, status: 'Defaulter' },
  { name: 'Aditya Verma', class: 'SE-A', course: 'CS303', attendance: 72, status: 'Warning' },
];

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function FacultyDashboard({ onNavigate, userName, isHOD }: Props) {
  const today = TIMETABLE['Wednesday'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-7">
      {/* Greeting */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e1e]">{getGreeting()}, Prof. {userName.split(' ').pop()}</h1>
          <p className="text-sm text-[#7a6a55] mt-0.5">
            {isHOD ? 'Faculty · Department Head' : 'Faculty'} · Computer Science
          </p>
        </div>
        {isHOD && (
          <div className="flex items-center gap-2 bg-[#2F4F3A] text-[#F4F1E6] rounded-xl px-4 py-2">
            <BookOpen size={14} />
            <span className="text-sm font-semibold">HOD Access Active</span>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="My Classes" value={FACULTY_STATS.classes} icon={Users} onClick={() => onNavigate('my-class')} />
        <MetricCard label="Avg Attendance" value={`${FACULTY_STATS.avgAttendance}%`} icon={ClipboardList} color="#2a6a82" onClick={() => onNavigate('faculty-attendance')} />
        <MetricCard label="Defaulters" value={FACULTY_STATS.defaulters} sub="Below 75%" icon={AlertTriangle} color="#b04040" onClick={() => onNavigate('defaulters')} />
        <MetricCard label="Pending Grading" value={FACULTY_STATS.pendingAssignments} icon={PenSquare} color="#7a6000" onClick={() => onNavigate('assignments')} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1a2e1e]">Today's Lectures</h3>
            <button onClick={() => onNavigate('timetable')} className="text-xs text-[#2F4F3A] font-semibold hover:underline flex items-center gap-1">Full timetable <ChevronRight size={13} /></button>
          </div>
          <div className="space-y-2.5">
            {today.map((lecture, i) => (
              <Card key={i} className="p-4 flex items-center gap-4">
                <div className="text-center shrink-0 w-16">
                  <p className="text-xs font-bold text-[#2F4F3A]">{lecture.time.split('–')[0]}</p>
                  <p className="text-[10px] text-[#9a8a75]">– {lecture.time.split('–')[1]}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a2e1e]">{lecture.course}</p>
                  <p className="text-xs text-[#7a6a55]">SE-A · {lecture.room}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={lecture.type.toLowerCase() as any}>{lecture.type}</Badge>
                  <button onClick={() => onNavigate('faculty-attendance')} className="text-xs bg-[#2F4F3A] text-[#F4F1E6] px-3 py-1.5 rounded-lg font-medium hover:bg-[#243B2D] transition-colors">
                    Mark
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Attendance overview */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[#1a2e1e]">Attendance by Course</h3>
          <Card className="p-5 space-y-3">
            {ATTENDANCE_DATA.map(a => (
              <div key={a.course}>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-medium text-[#3a2e1a]">{a.course}</p>
                  <p className="text-xs font-bold" style={{ color: a.percentage >= 75 ? '#2F4F3A' : a.percentage >= 65 ? '#9a6000' : '#b04040' }}>
                    {a.percentage.toFixed(0)}%
                  </p>
                </div>
                <ProgressBar value={a.percentage} />
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* My classes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#1a2e1e]">My Classes</h3>
          <button onClick={() => onNavigate('my-class')} className="text-xs text-[#2F4F3A] font-semibold hover:underline flex items-center gap-1">View all <ChevronRight size={13} /></button>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {CLASSES.map(cls => (
            <Card key={cls.name} className="p-5" onClick={() => onNavigate('my-class')}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#2F4F3A] flex items-center justify-center">
                  <BookOpen size={16} className="text-[#E8D36A]" />
                </div>
                <span className="text-xs text-[#7a6a55]">{cls.students} students</span>
              </div>
              <h4 className="text-base font-bold text-[#1a2e1e]">{cls.name}</h4>
              <p className="text-xs text-[#7a6a55]">Division {cls.division} · {cls.year}</p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {cls.courses.map(c => <Badge key={c} variant="default">{c}</Badge>)}
              </div>
              <p className="text-xs text-[#7DB7C9] mt-3 flex items-center gap-1"><Clock size={11} />Next: {cls.nextLecture}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Defaulters */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#1a2e1e]">Attendance Defaulters</h3>
          <button onClick={() => onNavigate('defaulters')} className="text-xs text-[#2F4F3A] font-semibold hover:underline flex items-center gap-1">View all <ChevronRight size={13} /></button>
        </div>
        <Card className="overflow-hidden">
          <table className="sc-table">
            <thead><tr><th>Student</th><th>Class</th><th>Course</th><th>Attendance</th><th>Status</th></tr></thead>
            <tbody>
              {DEFAULTERS.map((d, i) => (
                <tr key={i}>
                  <td className="font-medium">{d.name}</td>
                  <td>{d.class}</td>
                  <td>{d.course}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: d.attendance < 65 ? '#b04040' : '#9a6000' }}>{d.attendance}%</span>
                      <div className="w-16"><ProgressBar value={d.attendance} /></div>
                    </div>
                  </td>
                  <td><Badge variant={d.status === 'Defaulter' ? 'danger' : 'warning'}>{d.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
