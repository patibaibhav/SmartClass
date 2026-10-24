import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, ExternalLink, Calendar as CalendarIcon } from 'lucide-react';
import { Card, Badge, SectionHeader, Modal, Button, EmptyState } from '../components/ui';
import { api } from '../services/api';

const MONTH_DAYS = 31;
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface EventItem {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  council?: string;
  description?: string;
  type?: string;
  registrationLink?: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [filter, setFilter] = useState<string[]>(['Events', 'Tests', 'Holidays']);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });

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
            description: e.description,
            type: e.type || 'Events'
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
  }, []);

  function toggleFilter(f: string) {
    setFilter(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <SectionHeader title="Campus Calendar" sub="Academic events, examinations, council activities, and holidays" />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-[#7a6a55] uppercase tracking-wider">Show:</span>
        {[
          { label: 'Events', color: '#2F4F3A' },
          { label: 'Tests', color: '#7DB7C9' },
          { label: 'Holidays', color: '#E8D36A' },
        ].map(f => (
          <button
            key={f.label}
            onClick={() => toggleFilter(f.label)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filter.includes(f.label) ? 'text-white' : 'bg-[#F4F1E6] text-[#7a6a55] border-[#E8E2D0]'
            }`}
            style={filter.includes(f.label) ? { background: f.color, borderColor: f.color } : {}}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: filter.includes(f.label) ? 'rgba(255,255,255,0.6)' : f.color }} />
            {f.label}
          </button>
        ))}
      </div>

      {/* Upcoming events list */}
      <div>
        <h4 className="text-sm font-bold text-[#1a2e1e] mb-3">Scheduled Campus Events</h4>
        {loading ? (
          <Card className="p-12 text-center text-[#7a6a55]">Loading calendar events...</Card>
        ) : events.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            message="No upcoming events on the calendar."
            sub="Student council and department event announcements will appear here."
          />
        ) : (
          <div className="space-y-3">
            {events.map(ev => (
              <Card key={ev.id} className="p-5 flex items-start gap-4 cursor-pointer hover:border-[#7DB7C9] transition-colors" onClick={() => setSelectedEvent(ev)}>
                <div className="w-14 text-center shrink-0 bg-[#E8E2D0] py-2 px-1 rounded-xl">
                  <p className="text-[10px] text-[#7a6a55] uppercase font-bold">{ev.date ? ev.date.slice(5, 7) : 'DATE'}</p>
                  <p className="text-xl font-bold text-[#2F4F3A]">{ev.date ? ev.date.slice(8, 10) : '—'}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-base font-bold text-[#1a2e1e]">{ev.title}</p>
                    {ev.council && <Badge variant="info">{ev.council}</Badge>}
                  </div>
                  <div className="flex gap-4 text-xs text-[#7a6a55] flex-wrap mt-1">
                    <span className="flex items-center gap-1"><Clock size={12} />{ev.startTime} – {ev.endTime}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} />{ev.venue}</span>
                  </div>
                  {ev.description && (
                    <p className="text-xs text-[#7a6a55] mt-1.5 line-clamp-1">{ev.description}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedEvent && (
        <Modal title={selectedEvent.title} onClose={() => setSelectedEvent(null)} width="max-w-lg">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="info">{selectedEvent.council || 'Student Council'}</Badge>
              <Badge variant="default">Campus Event</Badge>
            </div>
            {selectedEvent.description && (
              <p className="text-sm text-[#3a2e1a] leading-relaxed">{selectedEvent.description}</p>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-[#F4F1E6] rounded-xl p-3">
                <p className="text-xs text-[#7a6a55]">Date</p>
                <p className="font-semibold text-[#1a2e1e] mt-0.5">{selectedEvent.date}</p>
              </div>
              <div className="bg-[#F4F1E6] rounded-xl p-3">
                <p className="text-xs text-[#7a6a55]">Time</p>
                <p className="font-semibold text-[#1a2e1e] mt-0.5">{selectedEvent.startTime} – {selectedEvent.endTime}</p>
              </div>
              <div className="bg-[#F4F1E6] rounded-xl p-3 col-span-2">
                <p className="text-xs text-[#7a6a55]">Venue</p>
                <p className="font-semibold text-[#1a2e1e] mt-0.5">{selectedEvent.venue}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
