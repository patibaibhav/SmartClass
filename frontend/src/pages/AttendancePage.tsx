import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, Badge, ProgressBar, CircularProgress, Tabs, SectionHeader, EmptyState } from '../components/ui';
import { api } from '../services/api';

interface CourseAttendance {
  course: string;
  name: string;
  total: number;
  present: number;
  percentage: number;
  isDefaulter: boolean;
}

interface HistoryItem {
  lectureId: number;
  date: string;
  course: string;
  courseName: string;
  time: string;
  type: string;
  status: string;
  isDemo: boolean;
}

interface AttendanceResponse {
  overallPercentage: number;
  isOverallDefaulter: boolean;
  courses: CourseAttendance[];
  history: HistoryItem[];
}

export default function AttendancePage() {
  const [tab, setTab] = useState('Overview');
  const [data, setData] = useState<AttendanceResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getStudentAttendance().then(setData).catch(err => setError(err.message));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <SectionHeader title="Attendance" sub="Attendance calculated from valid conducted lectures" />
      <Tabs tabs={['Overview', 'History']} active={tab} onChange={setTab} />
      {error && <Card className="p-4 text-sm text-[#b04040]">{error}</Card>}
      {!data && !error && <Card className="p-8 text-center text-sm text-[#7a6a55]">Loading attendance…</Card>}

      {data && tab === 'Overview' && (
        <div className="space-y-5">
          <Card className="p-6 flex items-center gap-8 flex-wrap">
            <div className="relative"><CircularProgress value={data.overallPercentage} size={100} strokeWidth={9} /><div className="absolute inset-0 flex items-center justify-center"><span className="text-xl font-bold">{data.overallPercentage}%</span></div></div>
            <div><h3 className="font-bold text-[#1a2e1e]">Overall attendance</h3><p className="text-sm text-[#7a6a55]">Cancelled lectures are excluded.</p>{data.isOverallDefaulter && <Badge variant="danger">Below threshold</Badge>}</div>
          </Card>
          {data.courses.map(course => (
            <Card key={course.course} className="p-5">
              <div className="flex justify-between gap-4"><div><p className="font-semibold text-[#1a2e1e]">{course.name}</p><p className="text-xs text-[#7a6a55]">{course.course} · {course.present}/{course.total} present</p></div><div className="flex items-center gap-2"><span className="font-bold">{course.percentage}%</span>{course.isDefaulter && <AlertTriangle size={14} className="text-[#D98282]" />}</div></div>
              <div className="mt-3"><ProgressBar value={course.percentage} /></div>
            </Card>
          ))}
          {!data.courses.length && <EmptyState icon={CheckCircle} message="No attendance records." sub="Attendance will appear after valid lectures are conducted." />}
        </div>
      )}

      {data && tab === 'History' && (
        <Card className="overflow-hidden">
          <table className="sc-table">
            <thead><tr><th>Date</th><th>Course</th><th>Time</th><th>Type</th><th>Status</th><th>Source</th></tr></thead>
            <tbody>{data.history.map(item => (
              <tr key={item.lectureId}>
                <td>{item.date}</td><td><p className="font-semibold">{item.course}</p><p className="text-xs text-[#7a6a55]">{item.courseName}</p></td><td>{item.time}</td><td><Badge variant={item.type.toLowerCase() as any}>{item.type}</Badge></td><td><Badge variant={item.status === 'Present' ? 'present' : 'absent'}>{item.status}</Badge></td><td>{item.isDemo ? <Badge variant="warning">Demo</Badge> : 'Recorded'}</td>
              </tr>
            ))}</tbody>
          </table>
          {!data.history.length && <div className="p-8 text-center text-sm text-[#7a6a55]">No lecture-level attendance history.</div>}
        </Card>
      )}
    </div>
  );
}
