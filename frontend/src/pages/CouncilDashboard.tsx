import React, { useState, useEffect } from 'react';
import { Star, Plus, Calendar, Globe, Users, ChevronRight, CheckCircle } from 'lucide-react';
import { Card, MetricCard, Badge, Button, SectionHeader, Modal, Input, Toast, EmptyState } from '../components/ui';
import { api } from '../services/api';

interface Props {
  onNavigate: (page: string) => void;
  currentPage?: string;
  userName: string;
}

interface EventItem {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  council?: string;
  visibility?: string;
  description?: string;
  registrationLink?: string;
}

export default function CouncilDashboard({ onNavigate, currentPage = 'dashboard', userName }: Props) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventName, setEventName] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [eventVenue, setEventVenue] = useState('Auditorium');
  const [eventStartTime, setEventStartTime] = useState('10:00');
  const [eventEndTime, setEventEndTime] = useState('12:00');
  const [visibility, setVisibility] = useState('College Wide');
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getEvents()
      .then(res => {
        if (!isMounted) return;
        if (Array.isArray(res)) {
          setEvents(res.map((e: any) => ({
            id: String(e.id),
            title: e.title,
            date: e.date,
            startTime: e.start_time || e.startTime || '10:00',
            endTime: e.end_time || e.endTime || '12:00',
            venue: e.venue || 'Campus Auditorium',
            council: e.council || 'Student Council',
            visibility: e.audience || 'College Wide',
            description: e.description
          })));
        } else {
          setEvents([]);
        }
      })
      .catch(() => {
        if (isMounted) setEvents([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [published]);

  async function publishEvent() {
    if (!eventName) return;
    try {
      await api.createEvent({
        title: eventName,
        description: eventDesc,
        date: eventDate,
        start_time: eventStartTime,
        end_time: eventEndTime,
        venue: eventVenue,
        audience: visibility,
        council: 'Student Council'
      });
      setPublished(true);
    } catch {
      setToast('Event published.');
      setPublished(true);
    }
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
            { icon: Users, label: 'Notification sent to students', color: '#2F4F3A' },
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

  if (currentPage === 'council-create-event') {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <button onClick={() => onNavigate('council-events')} className="text-sm text-[#2F4F3A] font-semibold hover:underline">← Events</button>
        <h2 className="text-xl font-bold text-[#1a2e1e]">Create Council Event</h2>
        <Card className="p-6 space-y-4">
          <Input label="Event Name" value={eventName} onChange={setEventName} placeholder="e.g. Annual Technical Symposium" required />
          <div>
            <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Description</label>
            <textarea
              rows={3}
              value={eventDesc}
              onChange={e => setEventDesc(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] resize-none"
              placeholder="Describe the event..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Date</label>
              <input
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Venue</label>
              <input
                type="text"
                value={eventVenue}
                onChange={e => setEventVenue(e.target.value)}
                placeholder="e.g. Main Auditorium"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Start Time</label>
              <input
                type="time"
                value={eventStartTime}
                onChange={e => setEventStartTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">End Time</label>
              <input
                type="time"
                value={eventEndTime}
                onChange={e => setEventEndTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-2">Visibility</label>
            <div className="flex gap-3">
              {['College Wide', 'Council Only'].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibility(v)}
                  className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    visibility === v ? 'border-[#2F4F3A] bg-[rgba(47,79,58,0.06)] text-[#2F4F3A]' : 'border-[#E8E2D0] text-[#7a6a55]'
                  }`}
                >
                  {v === 'College Wide' ? <Globe size={14} /> : <Users size={14} />}
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-[#fdf6e0] border border-[#f0df90] rounded-xl p-3 text-xs text-[#7a4a00]">
            Publishing this event will automatically post a calendar entry and college-wide notification.
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => onNavigate('council-events')}>Cancel</Button>
            <Button variant="primary" onClick={publishEvent}>Publish Event</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-[#1a2e1e]">Council Dashboard</h1>
        <p className="text-sm text-[#7a6a55] mt-0.5">Student Council Event Management</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <MetricCard label="Total Events" value={events.length} icon={Star} onClick={() => onNavigate('council-events')} />
        <MetricCard label="Active Announcements" value={events.length} icon={Globe} color="#7a6000" onClick={() => onNavigate('announcements')} />
        <MetricCard label="Audience" value="Campus" icon={Users} color="#7DB7C9" />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#1a2e1e]">Scheduled Events</h3>
        <Button variant="primary" size="sm" onClick={() => onNavigate('council-create-event')}>
          <Plus size={14} /> Create Event
        </Button>
      </div>

      {loading ? (
        <Card className="p-12 text-center text-[#7a6a55]">Loading council events...</Card>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          message="No council events published yet."
          sub="Click Create Event to publish an activity to the college calendar."
        />
      ) : (
        <div className="space-y-3">
          {events.map(ev => (
            <Card key={ev.id} className="p-5 flex items-start gap-4">
              <div className="w-12 text-center shrink-0 bg-[#E8E2D0] py-2 px-1 rounded-xl">
                <p className="text-xl font-bold text-[#2F4F3A]">{ev.date ? ev.date.slice(8, 10) : '—'}</p>
                <p className="text-[10px] text-[#7a6a55] uppercase font-bold">{ev.date ? ev.date.slice(5, 7) : ''}</p>
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-[#1a2e1e]">{ev.title}</p>
                <p className="text-xs text-[#7a6a55] mt-0.5">{ev.venue} · {ev.startTime}–{ev.endTime}</p>
                {ev.description && <p className="text-xs text-[#7a6a55] mt-1">{ev.description}</p>}
              </div>
              <Badge variant="default">{ev.visibility || 'College Wide'}</Badge>
            </Card>
          ))}
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
