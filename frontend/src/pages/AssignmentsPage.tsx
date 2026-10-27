import React, { useEffect, useState } from 'react';
import { ChevronRight, CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react';
import { Card, Badge, Tabs, SectionHeader, EmptyState } from '../components/ui';
import { api } from '../services/api';

interface AssignmentItem {
  id: string;
  title: string;
  course: string;
  courseCode: string;
  dueDate: string;
  marks: number;
  status: string;
  description: string;
  submittedAt?: string | null;
  submissionFile?: string | null;
  obtainedMarks?: number | null;
  feedback?: string | null;
}

interface Props { role?: string; }

export default function AssignmentsPage({ role = 'student' }: Props) {
  const [tab, setTab] = useState('All');
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [detail, setDetail] = useState<AssignmentItem | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAssignments().then(setAssignments).catch(err => setError(err.message));
  }, []);

  const tabs = role === 'student' ? ['All', 'Pending', 'Submitted', 'Graded', 'Late'] : ['All', 'Open', 'Graded'];
  const filtered = assignments.filter(assignment => tab === 'All' || assignment.status === tab.toLowerCase());
  const statusMap: Record<string, any> = { pending: 'pending', submitted: 'submitted', graded: 'graded', late: 'late', open: 'pending' };

  if (detail) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <button onClick={() => setDetail(null)} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← Back to assignments</button>
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2"><Badge variant={statusMap[detail.status] || 'pending'}>{detail.status}</Badge><span className="text-xs text-[#9a8a75]">{detail.courseCode} · {detail.marks} marks</span></div>
          <h2 className="text-lg font-bold text-[#1a2e1e]">{detail.title}</h2>
          <p className="text-xs text-[#7a6a55] flex items-center gap-1"><Clock size={12} /> Due {detail.dueDate}</p>
          <p className="text-sm text-[#3a2e1a] border-t border-[#E8E2D0] pt-4">{detail.description}</p>
          {detail.submittedAt && <div className="bg-[#e6f4ec] rounded-xl p-4"><p className="text-sm font-semibold text-[#1a6b3c] flex items-center gap-2"><CheckCircle size={15} />Submitted</p><p className="text-xs mt-1">{detail.submittedAt}</p>{detail.submissionFile && <p className="text-xs mt-1 flex items-center gap-1"><FileText size={11} />{detail.submissionFile}</p>}</div>}
          {detail.status === 'graded' && <div className="bg-[#F5EBD7] rounded-xl p-4"><p className="text-2xl font-bold text-[#2F4F3A]">{detail.obtainedMarks}/{detail.marks}</p><p className="text-sm mt-2">{detail.feedback}</p></div>}
          {role === 'student' && detail.status === 'pending' && <p className="text-sm text-[#7a6a55]">Online file submission remains disabled until private persistent object storage is configured.</p>}
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <SectionHeader title="Assignments" sub={role === 'student' ? 'Track recorded assignments and feedback' : 'Assignments for your authorized courses'} />
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      {error && <Card className="p-4 text-sm text-[#b04040]">{error}</Card>}
      <div className="space-y-3">
        {!filtered.length && !error ? <EmptyState icon={CheckCircle} message="No assignments." sub="No database records match this category." /> : filtered.map(assignment => (
          <Card key={assignment.id} className="p-5 flex items-center gap-4" onClick={() => setDetail(assignment)}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1"><Badge variant={statusMap[assignment.status] || 'pending'}>{assignment.status}</Badge><span className="text-xs text-[#9a8a75]">{assignment.courseCode}</span>{assignment.status === 'late' && <AlertTriangle size={13} className="text-[#D98282]" />}</div>
              <p className="text-sm font-semibold text-[#1a2e1e]">{assignment.title}</p>
              <p className="text-xs text-[#7a6a55] mt-0.5">Due {assignment.dueDate} · {assignment.marks} marks</p>
            </div>
            {assignment.status === 'graded' && <p className="text-lg font-bold text-[#2F4F3A]">{assignment.obtainedMarks}/{assignment.marks}</p>}
            <ChevronRight size={16} className="text-[#9a8a75]" />
          </Card>
        ))}
      </div>
    </div>
  );
}
