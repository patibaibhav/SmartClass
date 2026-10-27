import React, { useEffect, useState } from 'react';
import { MessageSquare, Pin, Plus, Send } from 'lucide-react';
import { Card, Badge, Button, SectionHeader, EmptyState, Modal, Input, Avatar } from '../components/ui';
import { api } from '../services/api';

interface Props { role?: string }
export default function ForumsPage({ role = 'student' }: Props) {
  const [topics, setTopics] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState(''); const [content, setContent] = useState(''); const [reply, setReply] = useState('');
  const [error, setError] = useState('');

  const reload = () => api.getForums().then(setTopics).catch(e => setError(e.message));
  useEffect(() => { reload(); api.getCourses().then(setCourses).catch(() => undefined); }, []);
  async function openTopic(topic: any) { setSelected(topic); setError(''); try { setReplies(await api.getForumReplies(topic.id)); } catch (e: any) { setError(e.message); } }
  async function create() { try { await api.createForumTopic(selectedCourse, title, content); setCreateOpen(false); setTitle(''); setContent(''); await reload(); } catch (e: any) { setError(e.message); } }
  async function postReply() { if (!selected || !reply.trim()) return; try { await api.postForumReply(selected.id, reply); setReply(''); setReplies(await api.getForumReplies(selected.id)); await reload(); } catch (e: any) { setError(e.message); } }

  if (selected) return <div className="p-6 max-w-4xl mx-auto space-y-5">
    <button onClick={() => setSelected(null)} className="text-sm font-semibold">← Back to forums</button>
    <Card className="p-6"><p className="text-xs text-[#7a6a55]">{selected.courseCode} · {selected.createdAt}</p><h2 className="text-lg font-bold">{selected.title}</h2><div className="flex gap-3 pt-4 mt-4 border-t"><Avatar name={selected.author}/><div><p className="font-semibold">{selected.author}</p><p className="text-sm mt-1">{selected.content}</p></div></div></Card>
    {error && <Card className="p-4 text-[#b04040]">{error}</Card>}
    <div className="space-y-3">{replies.map(r => <Card key={r.id} className="p-5 flex gap-3"><Avatar name={r.author} size="sm"/><div className="flex-1"><p className="text-sm font-semibold">{r.author} <Badge variant="default">{r.role}</Badge></p><p className="text-sm mt-1">{r.content}</p><p className="text-xs text-[#9a8a75] mt-2">{r.createdAt}</p></div></Card>)}</div>
    {['student','faculty','hod'].includes(role) && <Card className="p-4"><textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} placeholder="Add a reply" className="w-full px-4 py-2.5 rounded-xl border bg-[#F4F1E6]"/><div className="flex justify-end mt-3"><Button onClick={postReply} disabled={!reply.trim()}><Send size={13}/> Post Reply</Button></div></Card>}
  </div>;

  const filtered = selectedCourse ? topics.filter(t => t.courseCode === selectedCourse) : topics;
  return <div className="p-6 max-w-4xl mx-auto space-y-6">
    <SectionHeader title="Discussion Forums" sub="Course-scoped discussions" action={['student','faculty','hod'].includes(role) ? <Button onClick={() => setCreateOpen(true)}><Plus size={14}/> New Discussion</Button> : undefined}/>
    <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="px-4 py-2.5 rounded-xl border bg-[#F4F1E6]"><option value="">All authorized courses</option>{courses.filter(c => topics.some(t => t.courseCode === c.id || t.courseCode === c.code)).map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}</select>
    {error && <Card className="p-4 text-[#b04040]">{error}</Card>}
    {filtered.length === 0 ? <EmptyState icon={MessageSquare} message="No discussions are available."/> : <div className="space-y-3">{filtered.map(topic => <Card key={topic.id} className="p-4 flex gap-3" onClick={() => openTopic(topic)}>{topic.pinned && <Pin size={14}/>}<div className="flex-1"><p className="font-semibold">{topic.title}</p><p className="text-xs text-[#7a6a55]">{topic.courseCode} · {topic.author} · {topic.createdAt}</p></div><span className="text-xs">{topic.replies} replies</span></Card>)}</div>}
    {createOpen && <Modal title="Start a Discussion" onClose={() => setCreateOpen(false)}><div className="space-y-4"><select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border bg-[#F4F1E6]"><option value="">Choose a course</option>{courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}</select><Input label="Title" value={title} onChange={setTitle}/><textarea value={content} onChange={e => setContent(e.target.value)} rows={4} className="w-full px-4 py-2.5 rounded-xl border bg-[#F4F1E6]"/><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={create} disabled={!selectedCourse || !title.trim() || !content.trim()}>Post</Button></div></div></Modal>}
  </div>;
}
