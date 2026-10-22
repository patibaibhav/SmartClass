import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { Card, MetricCard, SectionHeader, ProgressBar, Badge } from '../components/ui';
import { RESULTS_DATA } from '../data/mock';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';

const TREND_HISTORY = [
  { month: 'May', assignments: 72, quizzes: 65 },
  { month: 'Jun', assignments: 78, quizzes: 70 },
  { month: 'Jul', assignments: 81, quizzes: 74 },
  { month: 'Aug', assignments: 84, quizzes: 77 },
];

const TrendIcon = ({ trend }: { trend: string }) =>
  trend === 'up' ? <TrendingUp size={14} className="text-[#2F4F3A]" /> :
  trend === 'down' ? <TrendingDown size={14} className="text-[#D98282]" /> :
  <Minus size={14} className="text-[#9a8a75]" />;

interface Props {
  role?: string;
}

export default function ResultsPage({ role = 'student' }: Props) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const overall = Math.round(RESULTS_DATA.reduce((s, r) => s + r.average, 0) / RESULTS_DATA.length);

  if (selectedCourse) {
    const course = RESULTS_DATA.find(r => r.course === selectedCourse)!;
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <button onClick={() => setSelectedCourse(null)} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← Back to Results</button>

        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-[#1a2e1e]">{course.course}</h2>
          <TrendIcon trend={course.trend} />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <MetricCard label="Assignments" value={`${course.assignments}%`} color="#2F4F3A" />
          <MetricCard label="Quizzes" value={`${course.quizzes}%`} color="#7DB7C9" />
          <MetricCard label="Average" value={`${course.average}%`} color={course.average >= 75 ? '#2F4F3A' : '#D98282'} />
        </div>

        <Card className="p-5">
          <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider mb-4">Performance Breakdown</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'Assignments', value: course.assignments }, { name: 'Quizzes', value: course.quizzes }, { name: 'Average', value: course.average }]}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#7a6a55' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#7a6a55' }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: any) => [`${v}%`]} contentStyle={{ background: '#F5EBD7', border: '1px solid #E8E2D0', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" fill="#2F4F3A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Assignment breakdown */}
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E2D0]">
            <p className="text-sm font-bold text-[#1a2e1e]">Assignment History</p>
          </div>
          <table className="sc-table">
            <thead><tr><th>Assignment</th><th>Max Marks</th><th>Obtained</th><th>Percentage</th></tr></thead>
            <tbody>
              {[
                { title: 'Assignment 1 — Introduction', max: 20, got: 18 },
                { title: 'Assignment 2 — Normalization', max: 20, got: 17 },
                { title: 'Assignment 3 — Transactions', max: 15, got: 12 },
              ].map((a, i) => (
                <tr key={i}>
                  <td>{a.title}</td>
                  <td>{a.max}</td>
                  <td className="font-semibold text-[#2F4F3A]">{a.got}</td>
                  <td>{Math.round((a.got / a.max) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <SectionHeader title="Results" sub="Academic performance across all courses" />

      {/* Summary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Overall Average" value={`${overall}%`} sub="Semester average" color="#2F4F3A" />
        <MetricCard label="Assignments" value="83%" sub="All courses" color="#7DB7C9" />
        <MetricCard label="Quizzes" value="75%" sub="All courses" color="#7a6000" />
        <MetricCard label="Best Subject" value="CS304" sub="88% average" color="#2F4F3A" />
      </div>

      {/* Trend chart */}
      <Card className="p-5">
        <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider mb-4">Performance Trend</p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={TREND_HISTORY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#7a6a55' }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#7a6a55' }} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: any) => [`${v}%`]} contentStyle={{ background: '#F5EBD7', border: '1px solid #E8E2D0', borderRadius: 12, fontSize: 12 }} />
              <Legend />
              <Line type="monotone" dataKey="assignments" stroke="#2F4F3A" strokeWidth={2} dot={{ r: 4, fill: '#2F4F3A' }} name="Assignments" />
              <Line type="monotone" dataKey="quizzes" stroke="#7DB7C9" strokeWidth={2} dot={{ r: 4, fill: '#7DB7C9' }} name="Quizzes" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Course-wise table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8E2D0] flex items-center justify-between">
          <p className="text-sm font-bold text-[#1a2e1e]">Course-wise Performance</p>
        </div>
        <table className="sc-table">
          <thead><tr><th>Course</th><th>Assignments</th><th>Quizzes</th><th>Average</th><th>Trend</th><th></th></tr></thead>
          <tbody>
            {RESULTS_DATA.map(r => (
              <tr key={r.course}>
                <td>
                  <p className="font-semibold">{r.course}</p>
                  <p className="text-xs text-[#7a6a55] truncate max-w-[160px]">{r.name}</p>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{r.assignments}%</span>
                    <div className="w-16"><ProgressBar value={r.assignments} /></div>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{r.quizzes}%</span>
                    <div className="w-16"><ProgressBar value={r.quizzes} /></div>
                  </div>
                </td>
                <td>
                  <span className="font-bold text-base" style={{ color: r.average >= 75 ? '#2F4F3A' : '#D98282' }}>{r.average}%</span>
                </td>
                <td><TrendIcon trend={r.trend} /></td>
                <td>
                  <button onClick={() => setSelectedCourse(r.course)} className="text-xs text-[#2F4F3A] font-semibold hover:underline flex items-center gap-0.5">
                    Details <ChevronRight size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
