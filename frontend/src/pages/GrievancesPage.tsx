import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Plus, ChevronRight } from 'lucide-react';
import { Card, Badge, Button, Tabs, SectionHeader, EmptyState, Modal, Input } from '../components/ui';
import { api } from '../services/api';

interface Props {
  role?: string;
}

const STATUS_STEPS = ['Submitted', 'Assigned', 'Under Review', 'In Progress', 'Resolved', 'Closed'];

const STATUS_BADGE: Record<string, any> = {
  Submitted: 'pending',
  Assigned: 'assigned',
  'Under Review': 'under-review',
  'In Progress': 'in-progress',
  Resolved: 'resolved',
  Closed: 'closed',
};

export default function GrievancesPage({ role = 'student' }: Props) {
  const [tab, setTab] = useState('All');
  const [list, setList] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [category, setCategory] = useState('Attendance');
  const [subject, setSubject] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getGrievances()
      .then(res => {
        if (!isMounted) return;
        if (Array.isArray(res)) {
          setList(res.map((g: any) => ({
            id: g.id,
            subject: g.subject || g.title,
            category: g.category,
            description: g.description,
            status: g.status || 'Submitted',
            submittedAt: g.created_at ? g.created_at.slice(0, 10) : 'Recent',
            lastUpdated: g.updated_at ? g.updated_at.slice(0, 10) : 'Recent',
            student_id: g.student_id,
            resolution: g.resolution
          })));
        } else {
          setList([]);
        }
      })
      .catch(() => {
        if (isMounted) setList([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  async function handleCreate() {
    if (!subject || !desc) return;
    const res = await api.submitGrievance(subject, category, desc);
    const newG = {
      id: res ? res.grievanceId : `GR${Date.now()}`,
      subject,
      category,
      description: desc,
      status: 'Submitted',
      submittedAt: new Date().toISOString().slice(0, 10),
      lastUpdated: new Date().toISOString().slice(0, 10)
    };
    setList(prev => [newG, ...prev]);
    setCreateOpen(false);
    setSubject('');
    setDesc('');
  }

  const ADMIN_TABS = ['All', 'New', 'In Review', 'In Progress', 'Resolved'];
  const STUDENT_TABS = ['All', 'Open', 'Resolved', 'Closed'];

  const isAdmin = role === 'admin' || role === 'faculty';

  if (selected) {
    const currentStep = STATUS_STEPS.indexOf(selected.status);
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <button onClick={() => setSelected(null)} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← Back to Grievances</button>
        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={STATUS_BADGE[selected.status] || 'default'}>{selected.status}</Badge>
                <Badge variant="default">{selected.category}</Badge>
              </div>
              <h2 className="text-lg font-bold text-[#1a2e1e]">{selected.subject}</h2>
              <p className="text-xs text-[#7a6a55] mt-0.5">Submitted {selected.submittedAt} · Last updated {selected.lastUpdated}</p>
            </div>
            {isAdmin && selected.status !== 'Resolved' && selected.status !== 'Closed' && (
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={async () => {
                  await api.updateGrievance(selected.id, 'Resolved', 'Issue resolved by administration.');
                  setSelected((prev: any) => ({ ...prev, status: 'Resolved' }));
                  setList(prev => prev.map(g => g.id === selected.id ? { ...g, status: 'Resolved' } : g));
                }}>Mark Resolved</Button>
              </div>
            )}
          </div>

          <p className="text-sm text-[#3a2e1a] leading-relaxed border-t border-[#E8E2D0] pt-4">{selected.description}</p>
        </Card>

        {/* Status timeline */}
        <Card className="p-6">
          <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider mb-4">Progress</p>
          <div className="space-y-0">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center z-10 ${
                      done ? 'bg-[#2F4F3A] border-[#2F4F3A]' : 'bg-[#F4F1E6] border-[#E8E2D0]'
                    }`}>
                      {done ? <CheckCircle size={13} className="text-[#F4F1E6]" /> : <div className="w-2 h-2 rounded-full bg-[#E8E2D0]" />}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 ${done ? 'bg-[#2F4F3A]' : 'bg-[#E8E2D0]'}`} />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className={`text-sm font-semibold ${done ? 'text-[#1a2e1e]' : 'text-[#9a8a75]'}`}>{step}</p>
                    {active && selected.status === 'Resolved' && selected.resolution && (
                      <p className="text-xs text-[#3a2e1a] mt-1 leading-relaxed">{selected.resolution}</p>
                    )}
                    {active && <p className="text-xs text-[#7a6a55] mt-0.5">{selected.lastUpdated}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <SectionHeader
        title={isAdmin ? "Grievance Management" : "My Grievances"}
        sub={isAdmin ? "Review, track, and resolve student grievances" : "Submit and track status of grievances"}
        action={!isAdmin ? (
          <Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> Submit Grievance</Button>
        ) : undefined}
      />
      <Tabs tabs={isAdmin ? ADMIN_TABS : STUDENT_TABS} active={tab} onChange={setTab} />

      {loading ? (
        <Card className="p-12 text-center text-[#7a6a55]">Loading grievances...</Card>
      ) : list.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          message="No grievances on record."
          sub={isAdmin ? "No complaints currently filed." : "Use the button above to raise an official concern."}
        />
      ) : (
        <div className="space-y-3">
          {list.map(g => (
            <Card key={g.id} className="p-5 flex items-start gap-4 cursor-pointer hover:border-[#7DB7C9] transition-colors" onClick={() => setSelected(g)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant={STATUS_BADGE[g.status] || 'default'}>{g.status}</Badge>
                  <Badge variant="default">{g.category}</Badge>
                  {isAdmin && g.student_id && <span className="text-xs text-[#7a6a55]">By: {g.student_id}</span>}
                </div>
                <p className="text-sm font-semibold text-[#1a2e1e]">{g.subject}</p>
                <p className="text-xs text-[#7a6a55] mt-0.5">Submitted {g.submittedAt} · Updated {g.lastUpdated}</p>
              </div>
              <ChevronRight size={16} className="text-[#9a8a75] shrink-0 mt-1" />
            </Card>
          ))}
        </div>
      )}

      {createOpen && (
        <Modal title="Submit Grievance" onClose={() => setCreateOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Category <span className="text-[#D98282]">*</span></label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] appearance-none">
                {['Attendance', 'Academic', 'Infrastructure', 'Faculty', 'Administration', 'Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <Input label="Subject" value={subject} onChange={setSubject} placeholder="Brief subject of your grievance" required />
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Description <span className="text-[#D98282]">*</span></label>
              <textarea rows={4} value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] resize-none" placeholder="Describe your grievance in detail..." />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate}>Submit Grievance</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
