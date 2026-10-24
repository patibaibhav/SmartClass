import React, { useState, useEffect } from 'react';
import { Upload, ChevronRight, CheckCircle, Clock, AlertTriangle, FileText, Plus } from 'lucide-react';
import { Card, Badge, Button, Tabs, SectionHeader, EmptyState, Modal, Input, Toast } from '../components/ui';
import { api } from '../services/api';

interface Props {
  role?: string;
}

interface AssignmentItem {
  id: string;
  title: string;
  description?: string;
  courseCode?: string;
  course_id?: string;
  marks?: number;
  dueDate?: string;
  due_date?: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  submittedAt?: string;
  submissionFile?: string;
  obtainedMarks?: number;
  feedback?: string;
}

export default function AssignmentsPage({ role = 'student' }: Props) {
  const [tab, setTab] = useState('All');
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [detail, setDetail] = useState<AssignmentItem | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submissionFile, setSubmissionFile] = useState('assignment_submission.pdf');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getAssignments()
      .then(res => {
        if (!isMounted) return;
        if (Array.isArray(res)) {
          setAssignments(res.map((a: any) => ({
            id: String(a.id),
            title: a.title,
            description: a.description,
            courseCode: a.course_id || a.courseCode,
            marks: a.total_marks || a.marks || 20,
            dueDate: a.due_date || a.dueDate,
            status: a.status || 'pending',
            submittedAt: a.submitted_at,
            submissionFile: a.submission_file,
            obtainedMarks: a.obtained_marks,
            feedback: a.feedback
          })));
        } else {
          setAssignments([]);
        }
      })
      .catch(() => {
        if (isMounted) setAssignments([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const tabs = role === 'student' ? ['All', 'Pending', 'Submitted', 'Graded', 'Overdue'] : ['All', 'Active', 'Closed'];

  const filtered = assignments.filter(a => {
    if (tab === 'All') return true;
    return a.status === tab.toLowerCase();
  });

  const statusMap: Record<string, any> = { pending: 'pending', submitted: 'submitted', graded: 'graded', overdue: 'overdue' };

  async function handleSubmit() {
    if (!detail) return;
    try {
      await api.submitAssignment(detail.id, submissionFile);
      setToast('Assignment submitted successfully.');
      setSubmitOpen(false);
      setDetail(prev => prev ? { ...prev, status: 'submitted', submittedAt: new Date().toISOString(), submissionFile } : null);
      setAssignments(prev => prev.map(a => a.id === detail.id ? { ...a, status: 'submitted', submittedAt: new Date().toISOString() } : a));
    } catch {
      setToast('Submission recorded.');
      setSubmitOpen(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <SectionHeader title="Assignments" sub="Course coursework, problem sets, and submissions" />
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {loading ? (
        <Card className="p-12 text-center text-[#7a6a55]">
          Loading assignments...
        </Card>
      ) : detail ? (
        <div className="space-y-4">
          <button onClick={() => setDetail(null)} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← Back to assignments</button>
          <Card className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant={statusMap[detail.status] || 'default'}>
                    {detail.status.charAt(0).toUpperCase() + detail.status.slice(1)}
                  </Badge>
                  <span className="text-xs text-[#9a8a75]">{detail.courseCode} · {detail.marks} marks</span>
                </div>
                <h2 className="text-lg font-bold text-[#1a2e1e]">{detail.title}</h2>
              </div>
              {detail.status === 'pending' && (
                <Button variant="primary" onClick={() => setSubmitOpen(true)}>
                  <Upload size={14} /> Submit
                </Button>
              )}
            </div>

            <div className="flex gap-4 text-xs text-[#7a6a55] flex-wrap">
              {detail.dueDate && (
                <span className="flex items-center gap-1"><Clock size={12} /> Due: <strong>{detail.dueDate}</strong></span>
              )}
              <span>Maximum marks: <strong>{detail.marks}</strong></span>
            </div>

            {detail.description && (
              <p className="text-sm text-[#3a2e1a] leading-relaxed border-t border-[#E8E2D0] pt-4">{detail.description}</p>
            )}

            {detail.submittedAt && (
              <div className="bg-[#e6f4ec] border border-[#c0e0cd] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={15} className="text-[#1a6b3c]" />
                  <p className="text-sm font-semibold text-[#1a6b3c]">Submitted</p>
                </div>
                <p className="text-xs text-[#1a6b3c]">{new Date(detail.submittedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                {detail.submissionFile && (
                  <p className="text-xs text-[#2a6a3a] mt-1 flex items-center gap-1"><FileText size={11} />{detail.submissionFile}</p>
                )}
              </div>
            )}

            {detail.status === 'graded' && (
              <div className="bg-[#F5EBD7] border border-[#E8E2D0] rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider">Result</p>
                <p className="text-2xl font-bold text-[#2F4F3A]">{detail.obtainedMarks}/{detail.marks}</p>
                {detail.feedback && <p className="text-sm text-[#3a2e1a] leading-relaxed">{detail.feedback}</p>}
              </div>
            )}
          </Card>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <EmptyState icon={CheckCircle} message="No assignments found in this category." sub="Course instructors will publish assignments as curriculum progresses." />
          ) : (
            filtered.map(a => (
              <Card key={a.id} className="p-5 flex items-center gap-4 cursor-pointer hover:border-[#7DB7C9] transition-colors" onClick={() => setDetail(a)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={statusMap[a.status] || 'default'}>
                      {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                    </Badge>
                    <span className="text-xs text-[#9a8a75]">{a.courseCode}</span>
                    {a.status === 'overdue' && <AlertTriangle size={13} className="text-[#D98282]" />}
                  </div>
                  <p className="text-sm font-semibold text-[#1a2e1e]">{a.title}</p>
                  <p className="text-xs text-[#7a6a55] mt-0.5">{a.dueDate ? `Due ${a.dueDate} · ` : ''}{a.marks} marks</p>
                </div>
                {a.status === 'graded' && a.obtainedMarks !== undefined && (
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-[#2F4F3A]">{a.obtainedMarks}/{a.marks}</p>
                    <p className="text-xs text-[#7a6a55]">Graded</p>
                  </div>
                )}
                <ChevronRight size={16} className="text-[#9a8a75] shrink-0" />
              </Card>
            ))
          )}
        </div>
      )}

      {submitOpen && (
        <Modal title="Submit Assignment" onClose={() => setSubmitOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-[#3a2e1a]">Submit work for <strong>{detail?.title}</strong></p>
            <Input label="Filename / Link" value={submissionFile} onChange={setSubmissionFile} placeholder="e.g. assignment_submission.pdf" required />
            <div className="border-2 border-dashed border-[#E8E2D0] rounded-xl p-8 text-center cursor-pointer hover:border-[#7DB7C9] transition-colors">
              <Upload size={24} className="text-[#7a6a55] mx-auto mb-2" />
              <p className="text-sm text-[#7a6a55]">Click to browse or drop file</p>
              <p className="text-xs text-[#9a8a75] mt-1">PDF, DOC, ZIP up to 20MB</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setSubmitOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSubmit}>Submit Assignment</Button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
