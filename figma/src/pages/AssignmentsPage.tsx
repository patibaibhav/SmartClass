import React, { useState } from 'react';
import { Upload, ChevronRight, CheckCircle, Clock, AlertTriangle, X, FileText, Plus } from 'lucide-react';
import { Card, Badge, Button, Tabs, SectionHeader, EmptyState, Modal, Input, Toast } from '../components/ui';
import { ASSIGNMENTS, STUDENTS } from '../data/mock';

interface Props {
  role?: string;
}

export default function AssignmentsPage({ role = 'student' }: Props) {
  const [tab, setTab] = useState('All');
  const [detail, setDetail] = useState<typeof ASSIGNMENTS[0] | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [gradeOpen, setGradeOpen] = useState<any | null>(null);
  const [submissionFile, setSubmissionFile] = useState('');
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [toast, setToast] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const tabs = role === 'student' ? ['All', 'Pending', 'Submitted', 'Graded', 'Overdue'] : ['All', 'Active', 'Closed'];

  const filtered = ASSIGNMENTS.filter(a => {
    if (tab === 'All') return true;
    return a.status === tab.toLowerCase();
  });

  const statusMap: Record<string, any> = { pending: 'pending', submitted: 'submitted', graded: 'graded', overdue: 'overdue' };

  function handleSubmit() {
    setSubmitOpen(false);
    setToast('Assignment submitted successfully.');
    setSubmissionFile('');
  }

  if (role === 'faculty') {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <SectionHeader
          title="Assignments"
          sub="Manage assignments and grade submissions"
          action={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> Create Assignment</Button>}
        />

        {createOpen && (
          <Modal title="Create Assignment" onClose={() => setCreateOpen(false)} width="max-w-xl">
            <div className="space-y-4">
              <Input label="Title" value={newTitle} onChange={setNewTitle} placeholder="Assignment title" required />
              <div>
                <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Description</label>
                <textarea rows={3} className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] resize-none" placeholder="Describe the assignment..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Course" value="CS302" onChange={() => {}} />
                <Input label="Maximum Marks" value="20" onChange={() => {}} type="number" />
              </div>
              <Input label="Due Date" value="" onChange={() => {}} type="date" />
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => { setCreateOpen(false); setToast('Assignment created successfully.'); }}>Create Assignment</Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Assignment list with submissions */}
        <div className="space-y-4">
          {ASSIGNMENTS.map(a => (
            <Card key={a.id} className="overflow-hidden">
              <div className="p-5 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-bold text-[#1a2e1e]">{a.title}</h3>
                    <Badge variant={statusMap[a.status]}>{a.status.charAt(0).toUpperCase() + a.status.slice(1)}</Badge>
                  </div>
                  <p className="text-xs text-[#7a6a55]">{a.courseCode} · Due {a.dueDate} · {a.marks} marks</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setDetail(a)}>View Submissions</Button>
              </div>
              {detail?.id === a.id && (
                <div className="border-t border-[#E8E2D0]">
                  <table className="sc-table">
                    <thead><tr><th>Student</th><th>Roll No</th><th>Submitted</th><th>Status</th><th>Marks</th><th>Action</th></tr></thead>
                    <tbody>
                      {STUDENTS.slice(0, 6).map((s, i) => (
                        <tr key={s.id}>
                          <td className="font-medium">{s.name}</td>
                          <td>{s.rollNo}</td>
                          <td>{i < 4 ? 'Aug ' + (10 + i) : '—'}</td>
                          <td>
                            {i < 3 ? <Badge variant="submitted">Submitted</Badge> :
                             i === 3 ? <Badge variant="late">Late</Badge> :
                             <Badge variant="pending">Pending</Badge>}
                          </td>
                          <td>{i < 3 ? `${15 + i}/20` : '—'}</td>
                          <td>
                            {i < 4 && (
                              <button onClick={() => setGradeOpen(s)} className="text-xs text-[#2F4F3A] font-semibold hover:underline">
                                {i < 3 ? 'Edit Grade' : 'Grade'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ))}
        </div>

        {gradeOpen && (
          <Modal title={`Grade — ${gradeOpen.name}`} onClose={() => setGradeOpen(null)}>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[#7a6a55] mb-1">Submission file</p>
                <div className="flex items-center gap-2 p-3 bg-[#F4F1E6] rounded-xl border border-[#E8E2D0]">
                  <FileText size={14} className="text-[#2F4F3A]" />
                  <span className="text-sm text-[#2F4F3A]">submission_{gradeOpen.rollNo}.pdf</span>
                </div>
              </div>
              <Input label="Marks Awarded" value={marks} onChange={setMarks} type="number" placeholder="e.g. 17" />
              <div>
                <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Feedback</label>
                <textarea rows={3} value={feedback} onChange={e => setFeedback(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] resize-none" placeholder="Add feedback for the student..." />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setGradeOpen(null)}>Cancel</Button>
                <Button variant="primary" onClick={() => { setGradeOpen(null); setToast('Grade saved successfully.'); }}>Save Grade</Button>
              </div>
            </div>
          </Modal>
        )}

        {toast && <Toast message={toast} onClose={() => setToast('')} />}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <SectionHeader title="Assignments" sub="Track and submit your assignments" />
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {detail ? (
        <div className="space-y-4">
          <button onClick={() => setDetail(null)} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← Back to assignments</button>
          <Card className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant={statusMap[detail.status]}>{detail.status.charAt(0).toUpperCase() + detail.status.slice(1)}</Badge>
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
              <span className="flex items-center gap-1"><Clock size={12} /> Due: <strong>{detail.dueDate}</strong></span>
              <span>Maximum marks: <strong>{detail.marks}</strong></span>
            </div>

            <p className="text-sm text-[#3a2e1a] leading-relaxed border-t border-[#E8E2D0] pt-4">{detail.description}</p>

            {detail.submittedAt && (
              <div className="bg-[#e6f4ec] border border-[#c0e0cd] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={15} className="text-[#1a6b3c]" />
                  <p className="text-sm font-semibold text-[#1a6b3c]">Submitted</p>
                  {detail.status === 'late' && <Badge variant="late">Late</Badge>}
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
                <p className="text-2xl font-bold text-[#2F4F3A]">{(detail as any).obtainedMarks}/{detail.marks}</p>
                <p className="text-sm text-[#3a2e1a] leading-relaxed">{(detail as any).feedback}</p>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <EmptyState icon={CheckCircle} message="You're all caught up!" sub="No assignments in this category." />
          ) : (
            filtered.map(a => (
              <Card key={a.id} className="p-5 flex items-center gap-4" onClick={() => setDetail(a)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={statusMap[a.status]}>{a.status.charAt(0).toUpperCase() + a.status.slice(1)}</Badge>
                    <span className="text-xs text-[#9a8a75]">{a.courseCode}</span>
                    {a.status === 'overdue' && <AlertTriangle size={13} className="text-[#D98282]" />}
                  </div>
                  <p className="text-sm font-semibold text-[#1a2e1e]">{a.title}</p>
                  <p className="text-xs text-[#7a6a55] mt-0.5">Due {a.dueDate} · {a.marks} marks</p>
                </div>
                {a.status === 'graded' && (
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-[#2F4F3A]">{(a as any).obtainedMarks}/{a.marks}</p>
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
            <p className="text-sm text-[#3a2e1a]">Upload your submission for <strong>{detail?.title}</strong></p>
            <div className="border-2 border-dashed border-[#E8E2D0] rounded-xl p-8 text-center cursor-pointer hover:border-[#7DB7C9] transition-colors">
              <Upload size={24} className="text-[#7a6a55] mx-auto mb-2" />
              <p className="text-sm text-[#7a6a55]">Click to upload or drag & drop</p>
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
