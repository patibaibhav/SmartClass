import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { Card, MetricCard, SectionHeader, ProgressBar, Badge } from '../components/ui';
import { api } from '../services/api';

interface CourseResult {
  course: string;
  name: string;
  assignments: number | null;
  quizzes: number | null;
  average: number | null;
  trend: string;
  isDemo: boolean;
}

const TrendIcon = ({ trend }: { trend: string }) =>
  trend === 'up' ? <TrendingUp size={14} className="text-[#2F4F3A]" /> :
  trend === 'down' ? <TrendingDown size={14} className="text-[#D98282]" /> :
  <Minus size={14} className="text-[#9a8a75]" />;

interface Props { role?: string; }

export default function ResultsPage({ role = 'student' }: Props) {
  const [results, setResults] = useState<CourseResult[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [insights, setInsights] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getResults().then(setResults).catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedCourse || role !== 'student') return;
    api.getPerformanceInsights(selectedCourse).then(setInsights).catch(err => setError(err.message));
  }, [role, selectedCourse]);

  const overall = useMemo(() => {
    const values = results.map(result => result.average).filter((value): value is number => value !== null);
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
  }, [results]);

  if (selectedCourse) {
    const course = results.find(result => result.course === selectedCourse);
    if (!course) return null;
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <button onClick={() => { setSelectedCourse(null); setInsights(null); }} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← Back to Results</button>
        <div className="flex items-center gap-3"><h2 className="text-xl font-bold text-[#1a2e1e]">{course.name}</h2><TrendIcon trend={course.trend} />{course.isDemo && <Badge variant="warning">Demonstration data</Badge>}</div>
        <div className="grid sm:grid-cols-3 gap-4">
          <MetricCard label="Assignments" value={course.assignments === null ? '—' : `${course.assignments}%`} color="#2F4F3A" />
          <MetricCard label="Quizzes" value={course.quizzes === null ? '—' : `${course.quizzes}%`} color="#7DB7C9" />
          <MetricCard label="Average" value={course.average === null ? '—' : `${course.average}%`} color="#2F4F3A" />
        </div>
        <Card className="p-5 space-y-4">
          <div><p className="text-sm font-bold text-[#1a2e1e]">Topic-wise Performance Insights (rule-based)</p><p className="text-xs text-[#7a6a55]">Advisory analysis; official scores are unchanged.</p></div>
          {insights?.topics?.length ? insights.topics.map((topic: any) => (
            <div key={topic.topic}>
              <div className="flex justify-between text-sm"><span>{topic.topic}</span><span>{topic.accuracy}% · {topic.classification}</span></div>
              <ProgressBar value={topic.accuracy} />
              <p className="text-xs text-[#9a8a75] mt-1">{topic.questionCount} questions across {topic.testCount} tests</p>
            </div>
          )) : <p className="text-sm text-[#7a6a55]">Complete more released quizzes to generate reliable topic insights.</p>}
          {insights?.recommendations?.map((recommendation: string) => <p key={recommendation} className="text-sm text-[#3a2e1a]">• {recommendation}</p>)}
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <SectionHeader title="Results" sub="Academic performance calculated from recorded submissions and quiz attempts" />
      {error && <Card className="p-4 text-sm text-[#b04040]">{error}</Card>}
      <MetricCard label="Overall Average" value={overall === null ? '—' : `${overall}%`} sub="Available recorded work" color="#2F4F3A" />
      <Card className="overflow-hidden">
        <table className="sc-table">
          <thead><tr><th>Course</th><th>Assignments</th><th>Quizzes</th><th>Average</th><th>Trend</th><th></th></tr></thead>
          <tbody>
            {results.map(result => (
              <tr key={result.course}>
                <td><p className="font-semibold">{result.course}</p><p className="text-xs text-[#7a6a55]">{result.name}</p>{result.isDemo && <Badge variant="warning">Demo</Badge>}</td>
                <td>{result.assignments === null ? '—' : `${result.assignments}%`}</td>
                <td>{result.quizzes === null ? '—' : `${result.quizzes}%`}</td>
                <td className="font-bold">{result.average === null ? '—' : `${result.average}%`}</td>
                <td><TrendIcon trend={result.trend} /></td>
                <td>{role === 'student' && <button onClick={() => setSelectedCourse(result.course)} className="text-xs text-[#2F4F3A] font-semibold flex items-center">Details <ChevronRight size={12} /></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!results.length && !error && <div className="p-8 text-center text-sm text-[#7a6a55]">No recorded results are available.</div>}
      </Card>
    </div>
  );
}
