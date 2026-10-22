import React, { useState } from 'react';
import { Paperclip, Plus, Megaphone } from 'lucide-react';
import { Card, Badge, Button, Tabs, SectionHeader, EmptyState, Modal, Input, Avatar } from '../components/ui';
import { ANNOUNCEMENTS } from '../data/mock';

interface Props {
  role?: string;
}

export default function AnnouncementsPage({ role = 'student' }: Props) {
  const [tab, setTab] = useState('All');
  const [selected, setSelected] = useState<typeof ANNOUNCEMENTS[0] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');

  const types = ['All', 'College', 'Course', 'Events'];
  const filtered = ANNOUNCEMENTS.filter(a => tab === 'All' || a.type === tab);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <SectionHeader
        title="Announcements"
        sub="Important notices from faculty, administration, and councils"
        action={(role === 'faculty' || role === 'admin') ? (
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={14} /> New Announcement
          </Button>
        ) : undefined}
      />

      <Tabs tabs={types} active={tab} onChange={setTab} />

      {selected ? (
        <div className="space-y-4">
          <button onClick={() => setSelected(null)} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← Back</button>
          <Card className="p-6 space-y-4">
            <div className="flex items-start gap-3 flex-wrap">
              <Badge variant={selected.type.toLowerCase() as any}>{selected.type}</Badge>
              <span className="text-xs text-[#9a8a75]">{selected.date}</span>
            </div>
            <h2 className="text-lg font-bold text-[#1a2e1e]">{selected.title}</h2>
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E2D0]">
              <Avatar name={selected.publisher} size="sm" />
              <div>
                <p className="text-sm font-semibold text-[#1a2e1e]">{selected.publisher}</p>
                <p className="text-xs text-[#7a6a55]">{selected.publisherRole} · {selected.audience}</p>
              </div>
            </div>
            <p className="text-sm text-[#3a2e1a] leading-relaxed">{selected.content}</p>
            {selected.attachment && (
              <div className="flex items-center gap-2 p-3 bg-[#F4F1E6] rounded-xl border border-[#E8E2D0]">
                <Paperclip size={14} className="text-[#7a6a55]" />
                <span className="text-sm text-[#2F4F3A] font-medium">{selected.attachment}</span>
                <button className="ml-auto text-xs text-[#2F4F3A] font-semibold hover:underline">Download</button>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <EmptyState icon={Megaphone} message="No announcements." sub="Nothing posted in this category yet." />
          ) : (
            filtered.map(ann => (
              <Card key={ann.id} className="p-5 flex items-start gap-4" onClick={() => setSelected(ann)}>
                <Avatar name={ann.publisher} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={ann.type.toLowerCase() as any}>{ann.type}</Badge>
                    <span className="text-xs text-[#9a8a75]">{ann.date}</span>
                  </div>
                  <p className="text-sm font-bold text-[#1a2e1e]">{ann.title}</p>
                  <p className="text-xs text-[#7a6a55] mt-0.5">{ann.publisher} · {ann.audience}</p>
                  <p className="text-xs text-[#9a8a75] mt-1.5 line-clamp-2">{ann.content}</p>
                  {ann.attachment && (
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-[#7a6a55]">
                      <Paperclip size={11} /> {ann.attachment}
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {createOpen && (
        <Modal title="Create Announcement" onClose={() => setCreateOpen(false)} width="max-w-lg">
          <div className="space-y-4">
            <Input label="Title" value={title} onChange={setTitle} placeholder="Announcement title" required />
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Audience</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] appearance-none">
                <option>SE-A (My Class)</option>
                <option>CS301 — Data Structures (My Course)</option>
                <option>College-wide</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Message</label>
              <textarea rows={4} className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] resize-none" placeholder="Write your announcement..." />
            </div>
            <div className="border-2 border-dashed border-[#E8E2D0] rounded-xl p-4 text-center cursor-pointer hover:border-[#7DB7C9] transition-colors">
              <Paperclip size={16} className="text-[#7a6a55] mx-auto mb-1" />
              <p className="text-xs text-[#7a6a55]">Attach file (optional)</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setCreateOpen(false)}>Post Announcement</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
