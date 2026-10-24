import React, { useState, useEffect } from 'react';
import { Paperclip, Plus, Megaphone } from 'lucide-react';
import { Card, Badge, Button, Tabs, SectionHeader, EmptyState, Modal, Input, Avatar } from '../components/ui';
import { api } from '../services/api';

interface Props {
  role?: string;
}

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  publisher: string;
  publisherRole?: string;
  audience?: string;
  date: string;
  type: string;
  attachment?: string;
}

export default function AnnouncementsPage({ role = 'student' }: Props) {
  const [tab, setTab] = useState('All');
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [selected, setSelected] = useState<AnnouncementItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState('College-wide');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getAnnouncements()
      .then(res => {
        if (!isMounted) return;
        if (Array.isArray(res)) {
          setAnnouncements(res.map((a: any) => ({
            id: String(a.id),
            title: a.title,
            content: a.content,
            publisher: a.publisher || a.author_name || 'Academic Office',
            publisherRole: a.publisherRole || 'Administration',
            audience: a.audience || 'Campus',
            date: a.date || a.created_at?.slice(0, 10) || 'Recent',
            type: a.type || 'Notice'
          })));
        } else {
          setAnnouncements([]);
        }
      })
      .catch(() => {
        if (isMounted) setAnnouncements([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const types = ['All', 'Notice', 'Academic', 'Event'];
  const filtered = announcements.filter(a => tab === 'All' || a.type.toLowerCase() === tab.toLowerCase());

  async function handleCreate() {
    if (!title || !content) return;
    await api.createAnnouncement({
      title,
      content,
      audience,
      type: 'Notice'
    });
    const newA: AnnouncementItem = {
      id: `ANN${Date.now()}`,
      title,
      content,
      publisher: 'You',
      publisherRole: role,
      audience,
      date: new Date().toISOString().slice(0, 10),
      type: 'Notice'
    };
    setAnnouncements(prev => [newA, ...prev]);
    setCreateOpen(false);
    setTitle('');
    setContent('');
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <SectionHeader
        title="Announcements"
        sub="Important notices from faculty, administration, and campus councils"
        action={(role === 'faculty' || role === 'admin' || role === 'council') ? (
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={14} /> New Announcement
          </Button>
        ) : undefined}
      />

      <Tabs tabs={types} active={tab} onChange={setTab} />

      {loading ? (
        <Card className="p-12 text-center text-[#7a6a55]">Loading notices...</Card>
      ) : selected ? (
        <div className="space-y-4">
          <button onClick={() => setSelected(null)} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← Back</button>
          <Card className="p-6 space-y-4">
            <div className="flex items-start gap-3 flex-wrap">
              <Badge variant="default">{selected.type}</Badge>
              <span className="text-xs text-[#9a8a75]">{selected.date}</span>
            </div>
            <h2 className="text-xl font-bold text-[#1a2e1e]">{selected.title}</h2>
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E2D0]">
              <Avatar name={selected.publisher} size="sm" />
              <div>
                <p className="text-sm font-semibold text-[#1a2e1e]">{selected.publisher}</p>
                <p className="text-xs text-[#7a6a55]">{selected.publisherRole} · {selected.audience}</p>
              </div>
            </div>
            <p className="text-sm text-[#3a2e1a] leading-relaxed">{selected.content}</p>
          </Card>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <EmptyState icon={Megaphone} message="No announcements posted." sub="Notices will be published here as term activities commence." />
          ) : (
            filtered.map(ann => (
              <Card key={ann.id} className="p-5 flex items-start gap-4 cursor-pointer hover:border-[#7DB7C9] transition-colors" onClick={() => setSelected(ann)}>
                <Avatar name={ann.publisher} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="default">{ann.type}</Badge>
                    <span className="text-xs text-[#9a8a75]">{ann.date}</span>
                  </div>
                  <p className="text-base font-bold text-[#1a2e1e]">{ann.title}</p>
                  <p className="text-xs text-[#7a6a55] mt-0.5">{ann.publisher} · {ann.audience}</p>
                  <p className="text-xs text-[#9a8a75] mt-1.5 line-clamp-2">{ann.content}</p>
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
              <select value={audience} onChange={e => setAudience(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] appearance-none">
                <option value="College-wide">College-wide</option>
                <option value="D12A">Class D12A</option>
                <option value="D12B">Class D12B</option>
                <option value="D12C">Class D12C</option>
                <option value="Faculty">Faculty Only</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Message</label>
              <textarea
                rows={4}
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] resize-none"
                placeholder="Write the announcement..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate}>Post Announcement</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
