import React, { useState } from 'react';
import { AlertTriangle, ChevronRight, Calendar, BookOpen, CheckCircle } from 'lucide-react';
import { Card, Badge, ProgressBar, CircularProgress, Tabs, SectionHeader, EmptyState } from '../components/ui';
import { ATTENDANCE_DATA, COURSES } from '../data/mock';

const LECTURE_HISTORY = [
  { date: '2024-08-14', course: 'CS302', courseName: 'Database Systems', time: '10:00', type: 'Regular', status: 'P' },
  { date: '2024-08-14', course: 'CS303', courseName: 'Operating Systems', time: '11:15', type: 'Regular', status: 'A' },
  { date: '2024-08-13', course: 'CS301', courseName: 'Data Structures', time: '09:00', type: 'Regular', status: 'P' },
  { date: '2024-08-13', course: 'CS302', courseName: 'Database Systems', time: '10:00', type: 'Substitute', status: 'P' },
  { date: '2024-08-12', course: 'CS303', courseName: 'Operating Systems', time: '09:00', type: 'Regular', status: 'A' },
  { date: '2024-08-12', course: 'CS304', courseName: 'Computer Networks', time: '14:00', type: 'Regular', status: 'P' },
  { date: '2024-08-11', course: 'CS301', courseName: 'Data Structures', time: '09:00', type: 'Extra', status: 'P' },
  { date: '2024-08-11', course: 'CS302', courseName: 'Database Systems', time: '10:00', type: 'Cancelled', status: '-' },
  { date: '2024-08-09', course: 'CS303', courseName: 'Operating Systems', time: '09:00', type: 'Regular', status: 'A' },
  { date: '2024-08-09', course: 'CS304', courseName: 'Computer Networks', time: '14:00', type: 'Regular', status: 'P' },
];

export default function AttendancePage() {
  const [tab, setTab] = useState('Overview');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const overall = Math.round(ATTENDANCE_DATA.reduce((s, a) => s + a.percentage, 0) / ATTENDANCE_DATA.length);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <SectionHeader title="Attendance" sub="Track your attendance across all courses" />

      <Tabs tabs={['Overview', 'Course-wise', 'History']} active={tab} onChange={setTab} />

      {tab === 'Overview' && (
        <div className="space-y-6">
          {/* Overall card */}
          <Card className="p-6">
            <div className="flex items-center gap-8 flex-wrap">
              <div className="relative">
                <CircularProgress value={overall} size={100} strokeWidth={9} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-[#1a2e1e]">{overall}%</span>
                  <span className="text-[9px] text-[#7a6a55] uppercase tracking-wide">Overall</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[#1a2e1e] mb-3">Semester Attendance Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: 'Total Lectures', value: ATTENDANCE_DATA.reduce((s, a) => s + a.total, 0) },
                    { label: 'Present', value: ATTENDANCE_DATA.reduce((s, a) => s + a.present, 0) },
                    { label: 'Absent', value: ATTENDANCE_DATA.reduce((s, a) => s + a.total - a.present, 0) },
                  ].map(stat => (
                    <div key={stat.label}>
                      <p className="text-xl font-bold text-[#1a2e1e]">{stat.value}</p>
                      <p className="text-xs text-[#7a6a55] mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Course-wise summary */}
          <div className="space-y-3">
            {ATTENDANCE_DATA.map(a => {
              const isLow = a.percentage < 75;
              const isWarning = a.percentage >= 65 && a.percentage < 75;
              return (
                <Card key={a.course} className={`p-4 ${isLow ? 'border border-[#f0df90]' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <CircularProgress value={a.percentage} size={52} strokeWidth={5} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold" style={{ color: a.percentage >= 75 ? '#2F4F3A' : a.percentage >= 65 ? '#9a6000' : '#b04040' }}>
                          {Math.round(a.percentage)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#1a2e1e]">{a.name}</p>
                        <span className="text-xs text-[#9a8a75]">{a.course}</span>
                        {isLow && (
                          <Badge variant={isWarning ? 'warning' : 'danger'}>
                            {isWarning ? 'Warning' : 'Low Attendance'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#7a6a55] mt-0.5">{a.present}/{a.total} lectures attended</p>
                      {isLow && (
                        <p className="text-xs text-[#9a6000] mt-1 flex items-center gap-1">
                          <AlertTriangle size={11} />
                          {a.percentage < 65
                            ? `You need ${Math.ceil((0.75 * (a.total + 12) - a.present))} consecutive lectures to reach 75%.`
                            : `You need ${Math.ceil((0.75 * (a.total + 5) - a.present))} more lectures to reach 75%.`
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'Course-wise' && (
        <div className="space-y-4">
          {!selectedCourse ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {ATTENDANCE_DATA.map(a => (
                <Card key={a.course} className="p-5" onClick={() => setSelectedCourse(a.course)}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-[#1a2e1e]">{a.name}</p>
                      <p className="text-xs text-[#7a6a55]">{a.course}</p>
                    </div>
                    <div className="relative">
                      <CircularProgress value={a.percentage} size={48} strokeWidth={5} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-[#1a2e1e]">{Math.round(a.percentage)}%</span>
                      </div>
                    </div>
                  </div>
                  <ProgressBar value={a.percentage} />
                  <div className="flex justify-between mt-2 text-xs text-[#7a6a55]">
                    <span>{a.present} present</span>
                    <span>{a.total - a.present} absent</span>
                    <span>{a.total} total</span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div>
              <button onClick={() => setSelectedCourse(null)} className="text-sm text-[#2F4F3A] font-semibold mb-4 hover:underline">← Back to courses</button>
              {(() => {
                const course = ATTENDANCE_DATA.find(a => a.course === selectedCourse)!;
                return (
                  <div className="space-y-4">
                    <Card className="p-5">
                      <h3 className="text-base font-bold text-[#1a2e1e] mb-1">{course.name}</h3>
                      <p className="text-xs text-[#7a6a55] mb-4">{course.course}</p>
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <CircularProgress value={course.percentage} size={80} strokeWidth={8} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold text-[#1a2e1e]">{course.percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                          <div><p className="text-xl font-bold text-[#2F4F3A]">{course.total}</p><p className="text-xs text-[#7a6a55]">Total</p></div>
                          <div><p className="text-xl font-bold text-[#2F4F3A]">{course.present}</p><p className="text-xs text-[#7a6a55]">Present</p></div>
                          <div><p className="text-xl font-bold text-[#D98282]">{course.total - course.present}</p><p className="text-xs text-[#7a6a55]">Absent</p></div>
                        </div>
                      </div>
                    </Card>
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-[#1a2e1e]">Lecture History</h4>
                      <Card className="overflow-hidden">
                        <table className="sc-table">
                          <thead><tr><th>Date</th><th>Time</th><th>Type</th><th>Status</th></tr></thead>
                          <tbody>
                            {LECTURE_HISTORY.filter(l => l.course === selectedCourse).map((l, i) => (
                              <tr key={i}>
                                <td>{l.date}</td>
                                <td>{l.time}</td>
                                <td><Badge variant={l.type.toLowerCase() as any}>{l.type}</Badge></td>
                                <td>
                                  {l.status === 'P' ? <Badge variant="present">Present</Badge> :
                                   l.status === 'A' ? <Badge variant="absent">Absent</Badge> :
                                   <span className="text-xs text-[#9a8a75]">N/A</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Card>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {tab === 'History' && (
        <Card className="overflow-hidden">
          <table className="sc-table">
            <thead>
              <tr><th>Date</th><th>Course</th><th>Time</th><th>Type</th><th>Status</th></tr>
            </thead>
            <tbody>
              {LECTURE_HISTORY.map((l, i) => (
                <tr key={i}>
                  <td className="font-medium">{l.date}</td>
                  <td>
                    <p className="font-medium text-xs">{l.course}</p>
                    <p className="text-[#7a6a55]">{l.courseName}</p>
                  </td>
                  <td>{l.time}</td>
                  <td><Badge variant={l.type.toLowerCase() as any}>{l.type}</Badge></td>
                  <td>
                    {l.status === 'P' ? <Badge variant="present">Present</Badge> :
                     l.status === 'A' ? <Badge variant="absent">Absent</Badge> :
                     <span className="text-xs text-[#9a8a75]">Not counted</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
