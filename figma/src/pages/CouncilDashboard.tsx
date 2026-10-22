import React, { useState } from 'react';
import { Star, Plus, Calendar, Globe, Users, ChevronRight, CheckCircle } from 'lucide-react';
import { Card, MetricCard, Badge, Button, SectionHeader, Modal, Input, Toast } from '../components/ui';
import { EVENTS } from '../data/mock';

interface Props {
  onNavigate: (page: string) => void;
  currentPage?: string;
  userName: string;
}

export default function CouncilDashboard({ onNavigate, currentPage = 'dashboard', userName }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [visibility, setVisibility] = useState('College Wide');
  const [published, setPublished] = useState(false);
  const [toast, setToast] = useState('');

  function publishEvent() {
    setPublished(true);
  }

  if (published) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-5 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#e6f4ec] flex items-center justify-center mx-auto">
          <CheckCircle size={32} className="text-[#1a6b3c]" />
        </div>
        <h2 className="text-xl font-bold text-[#1a2e1e]">Event published successfully.</h2>
        <p className="text-sm text-[#7a6a55]">Calendar entry and announcement created automatically.</p>
        <div className="space-y-2.5">
          {[
            { icon: Calendar, label: 'Calendar entry created', color: '#2F4F3A' },
            { icon: CheckCircle, label: 'College-wide announcement posted', color: '#2F4F3A' },
            { icon: Users, label: 'Notification sent to all students', color: '#2F4F3A' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 p-3 bg-[#e6f4ec] border border-[#c0e0cd] rounded-xl">
              <item.icon size={16} className="text-[#1a6b3c]" />
              <p className="text-sm text-[#1a6b3c] font-medium">{item.label}</p>
            </div>
          ))}
        </div>
        <Button variant="primary" onClick={() => { setPublished(false); onNavigate('council-events'); }}>
          Back to Events
        </Button>
      </div>
    );
  }

  if (currentPage === 'council-create-event' || createOpen) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <button onClick={() => { setCreateOpen(false); onNavigate('council-events'); }} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← Events</button>
        <h2 className="text-xl font-bold text-[#1a2e1e]">Create Event</h2>
        <Card className="p-6 space-y-4">
          <Input label="Event Name" value={eventName} onChange={setEventName} placeholder="e.g. TechSpark 2025" required />
          <div>
            <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Description</label>
            <textarea rows={3} className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] resize-none" placeholder="Describe the event..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Date</label>
              <input type="date" className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Venue</label>
              <input type="text" placeholder="e.g. Main Auditorium" className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Start Time</label>
              <input type="time" className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">End Time</label>
              <input type="time" className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
            </div>
          </div>
          <Input label="Registration Link (optional)" value="" onChange={() => {}} placeholder="https://forms.smartclass.edu/..." />
          <div>
            <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-2">Visibility</label>
            <div className="flex gap-3">
              {['College Wide', 'Council Only'].map(v => (
                <button
                  key={v}
                  onClick={() => setVisibility(v)}
                  className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${visibility === v ? 'border-[#2F4F3A] bg-[rgba(47,79,58,0.06)] text-[#2F4F3A]' : 'border-[#E8E2D0] text-[#7a6a55]'}`}
                >
                  {v === 'College Wide' ? <Globe size={14} /> : <Users size={14} />}
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-[#fdf6e0] border border-[#f0df90] rounded-xl p-3 text-xs text-[#7a4a00]">
            Publishing this event will automatically create a calendar entry, post an announcement, and send notifications to the selected audience.
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => onNavigate('council-events')}>Save as Draft</Button>
            <Button variant="primary" onClick={publishEvent}>Publish Event</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (currentPage === 'council-events') {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <SectionHeader
          title="Events"
          sub="Manage council events and publications"
          action={<Button variant="primary" onClick={() => onNavigate('council-create-event')}><Plus size={14} /> Create Event</Button>}
        />
        <div className="grid sm:grid-cols-3 gap-4">
          <MetricCard label="Upcoming Events" value={2} color="#2F4F3A" />
          <MetricCard label="Past Events" value={5} color="#7DB7C9" />
          <MetricCard label="Drafts" value={1} color="#9a8a75" />
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#1a2e1e]">Upcoming</h3>
          {EVENTS.map(ev => (
            <Card key={ev.id} className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#2F4F3A] flex items-center justify-center shrink-0">
                <Star size={16} className="text-[#E8D36A]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-bold text-[#1a2e1e]">{ev.title}</p>
                  <Badge variant="info">{ev.visibility}</Badge>
                </div>
                <p className="text-xs text-[#7a6a55]">{ev.date} · {ev.venue}</p>
                {ev.registrationLink && <p className="text-xs text-[#7DB7C9] mt-0.5">Has registration link</p>}
              </div>
              <button className="text-xs text-[#2F4F3A] font-semibold hover:underline shrink-0">Edit</button>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Council dashboard
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-[#1a2e1e]">Good morning, {userName.split(' ')[0]}</h1>
        <p className="text-sm text-[#7a6a55] mt-0.5">Tech Council · Council Head Dashboard</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Upcoming Events" value={2} icon={Star} onClick={() => onNavigate('council-events')} />
        <MetricCard label="Past Events" value={5} icon={Calendar} color="#7DB7C9" onClick={() => onNavigate('council-events')} />
        <MetricCard label="Announcements" value={3} icon={Globe} color="#7a6000" onClick={() => onNavigate('announcements')} />
        <MetricCard label="Drafts" value={1} icon={Star} color="#9a8a75" onClick={() => onNavigate('council-events')} />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#1a2e1e]">Upcoming Events</h3>
        <Button variant="primary" size="sm" onClick={() => onNavigate('council-create-event')}>
          <Plus size={14} /> Create Event
        </Button>
      </div>

      <div className="space-y-3">
        {EVENTS.map(ev => (
          <Card key={ev.id} className="p-5 flex items-start gap-4" onClick={() => onNavigate('council-events')}>
            <div className="w-12 text-center shrink-0">
              <p className="text-xs text-[#7a6a55] uppercase font-semibold">Aug</p>
              <p className="text-xl font-bold text-[#2F4F3A]">{ev.date.split('-')[2]}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#1a2e1e]">{ev.title}</p>
              <p className="text-xs text-[#7a6a55]">{ev.venue} · {ev.startTime}–{ev.endTime}</p>
              {ev.registrationLink && <p className="text-xs text-[#7DB7C9] mt-1">External registration link available</p>}
            </div>
            <Badge variant={ev.visibility === 'College Wide' ? 'college' : 'default'}>{ev.visibility}</Badge>
          </Card>
        ))}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
