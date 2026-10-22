import React, { useState } from 'react';
import { MessageSquare, Pin, Plus, Send } from 'lucide-react';
import { Card, Badge, Button, SectionHeader, EmptyState, Modal, Input, Avatar } from '../components/ui';
import { FORUMS, COURSES } from '../data/mock';

interface Props {
  role?: string;
}

const REPLIES = [
  { author: 'Sneha Iyer', role: 'Student', time: '3 hours ago', content: 'BCNF is stricter than 3NF. A relation is in BCNF if for every functional dependency X → Y, X must be a superkey. The classic example is a relation with overlapping candidate keys where 3NF is satisfied but not BCNF. For example: Course(StudentID, Subject, Teacher) where Teacher determines Subject — it\'s in 3NF but not BCNF if Teacher is not a candidate key.' },
  { author: 'Prof. Rajesh Mehta', role: 'Faculty', time: '2 hours ago', content: 'Great explanation! To add to this: the key difference is that in 3NF, we allow non-prime attributes to depend on candidate keys. In BCNF, EVERY determinant must be a candidate key — no exceptions. This makes BCNF lossless but may not preserve all functional dependencies.' },
  { author: 'Rohan Gupta', role: 'Student', time: '1 hour ago', content: 'Thank you! This makes it much clearer. So if I have a relation that is in 3NF but not BCNF, decomposing to BCNF may lose some FD preservation, right?' },
];

export default function ForumsPage({ role = 'student' }: Props) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<typeof FORUMS[0] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [reply, setReply] = useState('');

  const coursesWithForums = [...new Set(FORUMS.map(f => f.courseCode))];

  if (selectedThread) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <button onClick={() => setSelectedThread(null)} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← Back to Forum</button>

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
          <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider">{selectedThread.replies} Replies</p>
          {REPLIES.map((r, i) => (
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
          ))}
        </div>

        {/* Reply box */}
        <Card className="p-4">
          <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider mb-3">Add a Reply</p>
          <textarea
            value={reply} onChange={e => setReply(e.target.value)} rows={3}
            placeholder="Share your thoughts, explanation, or question..."
            className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] resize-none"
          />
          <div className="flex justify-end mt-3">
            <Button variant="primary" size="sm" onClick={() => setReply('')}>
              <Send size={13} /> Post Reply
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (selectedCourse) {
    const threads = FORUMS.filter(f => f.courseCode === selectedCourse);
    const course = COURSES.find(c => c.code === selectedCourse);
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <button onClick={() => setSelectedCourse(null)} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← Course Forums</button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1a2e1e]">{course?.name || selectedCourse} Forum</h2>
            <p className="text-sm text-[#7a6a55]">{threads.length} discussions</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}><Plus size={14} /> New Discussion</Button>
        </div>

        <div className="space-y-2.5">
          {threads.map(thread => (
            <Card key={thread.id} className="p-4 flex items-start gap-4" onClick={() => setSelectedThread(thread)}>
              {thread.pinned && <Pin size={14} className="text-[#7DB7C9] mt-1 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1a2e1e]">{thread.title}</p>
                <p className="text-xs text-[#7a6a55] mt-0.5">{thread.author} · {thread.createdAt}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-[#2F4F3A]">{thread.replies} replies</p>
                <p className="text-xs text-[#9a8a75]">Last: {thread.lastReply}</p>
              </div>
            </Card>
          ))}
          {threads.length === 0 && <EmptyState icon={MessageSquare} message="No discussions yet." sub="Start a conversation for your course." />}
        </div>

        {createOpen && (
          <Modal title="Start a Discussion" onClose={() => setCreateOpen(false)}>
            <div className="space-y-4">
              <Input label="Discussion Title" value={newTitle} onChange={setNewTitle} placeholder="What would you like to discuss?" required />
              <div>
                <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Message</label>
                <textarea rows={4} className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] resize-none" placeholder="Describe your question or topic..." />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => setCreateOpen(false)}>Post Discussion</Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <SectionHeader title="Discussion Forums" sub="Course-specific discussions with faculty and classmates" />
      <div className="grid sm:grid-cols-2 gap-4">
        {COURSES.filter(c => coursesWithForums.includes(c.code)).map(course => {
          const threadCount = FORUMS.filter(f => f.courseCode === course.code).length;
          return (
            <Card key={course.id} className="p-5" onClick={() => setSelectedCourse(course.code)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-[#7a6a55] uppercase tracking-wider">{course.code}</p>
                  <h3 className="text-sm font-bold text-[#1a2e1e] mt-0.5">{course.name}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#2F4F3A] flex items-center justify-center">
                  <MessageSquare size={16} className="text-[#E8D36A]" />
                </div>
              </div>
              <p className="text-xs text-[#7a6a55]">{course.faculty}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E8E2D0]">
                <span className="text-xs text-[#7a6a55]">{threadCount} discussions</span>
                <span className="text-xs font-semibold text-[#2F4F3A]">Open Forum →</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
