import React, { useState, useEffect } from 'react';
import { MessageSquare, Pin, Plus, Send } from 'lucide-react';
import { Card, Badge, Button, SectionHeader, EmptyState, Modal, Input, Avatar } from '../components/ui';
import { api } from '../services/api';

interface Props {
  role?: string;
}

interface ForumTopic {
  id: string;
  courseCode: string;
  course_id?: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  replies?: number;
  pinned?: boolean;
}

interface ForumReply {
  id?: string;
  author: string;
  role?: string;
  time?: string;
  content: string;
}

export default function ForumsPage({ role = 'student' }: Props) {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [threads, setThreads] = useState<ForumTopic[]>([]);
  const [selectedThread, setSelectedThread] = useState<ForumTopic | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCourses().then(res => {
      if (Array.isArray(res) && res.length > 0) {
        setCourses(res);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getForums(selectedCourse || undefined)
      .then(res => {
        if (!isMounted) return;
        if (Array.isArray(res)) {
          setThreads(res.map((f: any) => ({
            id: String(f.id),
            courseCode: f.course_id || f.courseCode || 'General',
            title: f.title,
            content: f.content,
            author: f.author_name || f.author || 'User',
            createdAt: f.created_at ? f.created_at.slice(0, 10) : 'Recent',
            replies: f.reply_count || 0,
            pinned: f.pinned || false
          })));
        } else {
          setThreads([]);
        }
      })
      .catch(() => {
        if (isMounted) setThreads([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [selectedCourse]);

  async function openThread(t: ForumTopic) {
    setSelectedThread(t);
    const reps = await api.getForumReplies(t.id);
    if (Array.isArray(reps)) {
      setReplies(reps.map((r: any) => ({
        id: r.id,
        author: r.author_name || r.author || 'User',
        role: r.role || 'Student',
        time: r.created_at ? r.created_at.slice(0, 10) : 'Recent',
        content: r.content
      })));
    } else {
      setReplies([]);
    }
  }

  async function handleCreateTopic() {
    if (!newTitle || !newContent) return;
    const courseCode = selectedCourse || (courses[0]?.code || 'CNS');
    const res = await api.createForumTopic(courseCode, newTitle, newContent);
    const newT: ForumTopic = {
      id: res?.id ? String(res.id) : `FT${Date.now()}`,
      courseCode,
      title: newTitle,
      content: newContent,
      author: 'You',
      createdAt: 'Just now',
      replies: 0
    };
    setThreads(prev => [newT, ...prev]);
    setCreateOpen(false);
    setNewTitle('');
    setNewContent('');
  }

  async function handlePostReply() {
    if (!replyText || !selectedThread) return;
    await api.postForumReply(selectedThread.id, replyText);
    const newRep: ForumReply = {
      author: 'You',
      role: role === 'faculty' ? 'Faculty' : 'Student',
      time: 'Just now',
      content: replyText
    };
    setReplies(prev => [...prev, newRep]);
    setReplyText('');
    setThreads(prev => prev.map(t => t.id === selectedThread.id ? { ...t, replies: (t.replies || 0) + 1 } : t));
  }

  if (selectedThread) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <button onClick={() => setSelectedThread(null)} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← Back to Discussions</button>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs text-[#7a6a55] mb-1">{selectedThread.courseCode} · {selectedThread.createdAt}</p>
              <h2 className="text-lg font-bold text-[#1a2e1e]">{selectedThread.title}</h2>
            </div>
            {selectedThread.pinned && (
              <Badge variant="info"><Pin size={10} /> Pinned</Badge>
            )}
          </div>
          <div className="flex items-start gap-3 pt-4 border-t border-[#E8E2D0]">
            <Avatar name={selectedThread.author} size="md" />
            <div>
              <p className="text-sm font-semibold text-[#1a2e1e]">{selectedThread.author}</p>
              <p className="text-sm text-[#3a2e1a] leading-relaxed mt-1">{selectedThread.content}</p>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider">{replies.length} Replies</p>
          {replies.length === 0 ? (
            <Card className="p-6 text-center text-xs text-[#7a6a55]">
              No replies yet. Be the first to reply to this discussion!
            </Card>
          ) : (
            replies.map((r, i) => (
              <Card key={i} className="p-5 flex items-start gap-3">
                <Avatar name={r.author} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-[#1a2e1e]">{r.author}</p>
                    {r.role === 'Faculty' && <Badge variant="info">Faculty</Badge>}
                    <span className="text-xs text-[#9a8a75] ml-auto">{r.time}</span>
                  </div>
                  <p className="text-sm text-[#3a2e1a] leading-relaxed">{r.content}</p>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Reply box */}
        <Card className="p-4">
          <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider mb-3">Add a Reply</p>
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            rows={3}
            placeholder="Share your thoughts, explanation, or question..."
            className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] resize-none"
          />
          <div className="flex justify-end mt-3">
            <Button variant="primary" size="sm" onClick={handlePostReply}>
              <Send size={13} /> Post Reply
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <SectionHeader
        title="Discussion Forums"
        sub="Academic questions, course discussions, and collaborative study"
        action={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> New Discussion</Button>}
      />

      {/* Course filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCourse(null)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            selectedCourse === null ? 'bg-[#2F4F3A] text-[#F4F1E6]' : 'bg-[#E8E2D0] text-[#5a4a35] hover:bg-[#ddd7c0]'
          }`}
        >
          All Courses
        </button>
        {courses.map(c => (
          <button
            key={c.code}
            onClick={() => setSelectedCourse(c.code)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              selectedCourse === c.code ? 'bg-[#2F4F3A] text-[#F4F1E6]' : 'bg-[#E8E2D0] text-[#5a4a35] hover:bg-[#ddd7c0]'
            }`}
          >
            {c.code}
          </button>
        ))}
      </div>

      {loading ? (
        <Card className="p-12 text-center text-[#7a6a55]">Loading forum threads...</Card>
      ) : threads.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          message="No active discussions in this forum."
          sub="Start the conversation by posting a new topic."
        />
      ) : (
        <div className="space-y-3">
          {threads.map(thread => (
            <Card
              key={thread.id}
              className="p-5 flex items-start gap-4 cursor-pointer hover:border-[#7DB7C9] transition-colors"
              onClick={() => openThread(thread)}
            >
              <div className="w-10 h-10 rounded-xl bg-[#E8E2D0] flex items-center justify-center text-[#2F4F3A] shrink-0">
                <MessageSquare size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="default">{thread.courseCode}</Badge>
                  {thread.pinned && <Badge variant="info"><Pin size={10} /> Pinned</Badge>}
                </div>
                <h3 className="text-base font-bold text-[#1a2e1e] leading-snug">{thread.title}</h3>
                <p className="text-xs text-[#7a6a55] mt-1 line-clamp-1">{thread.content}</p>
                <div className="flex gap-4 text-xs text-[#9a8a75] mt-2">
                  <span>By {thread.author}</span>
                  <span>{thread.createdAt}</span>
                  <span>{thread.replies || 0} replies</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {createOpen && (
        <Modal title="Create Discussion Topic" onClose={() => setCreateOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Course</label>
              <select
                value={selectedCourse || (courses[0]?.code || 'CNS')}
                onChange={e => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] appearance-none"
              >
                {courses.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <Input label="Topic Title" value={newTitle} onChange={setNewTitle} placeholder="What do you want to ask or discuss?" required />
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Details</label>
              <textarea
                rows={4}
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] resize-none"
                placeholder="Elaborate on your question or discussion point..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateTopic}>Post Topic</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
