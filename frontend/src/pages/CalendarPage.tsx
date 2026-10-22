import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, ExternalLink } from 'lucide-react';
import { Card, Badge, SectionHeader, Modal, Button } from '../components/ui';
import { EVENTS } from '../data/mock';

const MONTH_DAYS = 31;
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type CalView = 'month' | 'week' | 'day';

const CALENDAR_EVENTS = [
  { date: 14, type: 'test', label: 'DBMS Quiz', color: '#7DB7C9' },
  { date: 18, type: 'event', label: 'Chess Championship', color: '#2F4F3A' },
  { date: 20, type: 'test', label: 'DSA Test', color: '#7DB7C9' },
  { date: 25, type: 'event', label: 'TechSpark 2024', color: '#2F4F3A' },
  { date: 28, type: 'holiday', label: 'Independence Day Obs.', color: '#E8D36A' },
];

export default function CalendarPage() {
  const [view, setView] = useState<CalView>('month');
  const [selectedEvent, setSelectedEvent] = useState<typeof EVENTS[0] | null>(null);
  const [filter, setFilter] = useState<string[]>(['Events', 'Tests', 'Holidays']);
  const currentMonth = 'August 2024';

  function toggleFilter(f: string) {
    setFilter(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }

  const firstDay = 4; // August 2024 starts on Thursday (index 4)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionHeader title="Calendar" sub="Academic events, tests, and holidays" />
        <div className="flex gap-1 bg-[#E8E2D0] rounded-xl p-1">
          {(['month', 'week', 'day'] as CalView[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${view === v ? 'bg-[#F5EBD7] text-[#2F4F3A] shadow-sm' : 'text-[#7a6a55]'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filter.includes(f.label) ? 'text-white' : 'bg-[#F4F1E6] text-[#7a6a55] border-[#E8E2D0]'}`}
            style={filter.includes(f.label) ? { background: f.color, borderColor: f.color } : {}}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: filter.includes(f.label) ? 'rgba(255,255,255,0.6)' : f.color }} />
            {f.label}
          </button>
        ))}
      </div>

      {/* Month header */}
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-[#E8E2D0] transition-colors"><ChevronLeft size={18} className="text-[#5a4a35]" /></button>
        <h3 className="text-lg font-bold text-[#1a2e1e]">{currentMonth}</h3>
        <button className="p-2 rounded-lg hover:bg-[#E8E2D0] transition-colors"><ChevronRight size={18} className="text-[#5a4a35]" /></button>
        <button className="ml-2 px-3 py-1.5 text-xs font-semibold text-[#2F4F3A] hover:bg-[#E8E2D0] rounded-lg transition-colors">Today</button>
      </div>

      {/* Calendar grid */}
      {view === 'month' && (
        <Card className="overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-[#E8E2D0]">
            {WEEK_DAYS.map(d => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-[#7a6a55] uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells before month start */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 border-b border-r border-[#E8E2D0] bg-[#f9f5ee]" />
            ))}

            {Array.from({ length: MONTH_DAYS }).map((_, i) => {
              const day = i + 1;
              const dayEvents = CALENDAR_EVENTS.filter(e => e.date === day && filter.includes(e.type === 'event' ? 'Events' : e.type === 'test' ? 'Tests' : 'Holidays'));
              const isToday = day === 14;
              const isWeekend = (firstDay + i) % 7 === 0 || (firstDay + i) % 7 === 6;

              return (
                <div key={day} className={`h-24 border-b border-r border-[#E8E2D0] p-2 ${isWeekend ? 'bg-[#faf6f0]' : ''} hover:bg-[#F5EBD7] transition-colors cursor-pointer`}>
                  <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full ${isToday ? 'bg-[#2F4F3A] text-[#F4F1E6]' : 'text-[#3a2e1a]'}`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map((ev, ei) => (
                      <div key={ei} className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate text-white leading-tight"
                        style={{ background: ev.color }}>
                        {ev.label}
                      </div>
                    ))}
                    {dayEvents.length > 2 && <div className="text-[10px] text-[#7a6a55]">+{dayEvents.length - 2} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Upcoming events list */}
      <div>
        <h4 className="text-sm font-bold text-[#1a2e1e] mb-3">Upcoming Events</h4>
        <div className="space-y-3">
          {EVENTS.map(ev => (
            <Card key={ev.id} className="p-5 flex items-start gap-4" onClick={() => setSelectedEvent(ev)}>
              <div className="w-12 text-center shrink-0">
                <p className="text-xs text-[#7a6a55] uppercase font-semibold">{ev.date.split('-')[1] === '08' ? 'Aug' : 'Sep'}</p>
                <p className="text-xl font-bold text-[#2F4F3A]">{ev.date.split('-')[2]}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-[#1a2e1e]">{ev.title}</p>
                  <Badge variant="info">{ev.council}</Badge>
                </div>
                <div className="flex gap-3 text-xs text-[#7a6a55] flex-wrap">
                  <span className="flex items-center gap-1"><Clock size={11} />{ev.startTime}–{ev.endTime}</span>
                  <span className="flex items-center gap-1"><MapPin size={11} />{ev.venue}</span>
                </div>
              </div>
              {ev.registrationLink && (
                <Button size="sm" variant="outline">Register</Button>
              )}
            </Card>
          ))}
        </div>
      </div>

      {selectedEvent && (
        <Modal title={selectedEvent.title} onClose={() => setSelectedEvent(null)} width="max-w-lg">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="info">{selectedEvent.council}</Badge>
              <Badge variant="college">College Wide</Badge>
            </div>
            <p className="text-sm text-[#3a2e1a] leading-relaxed">{selectedEvent.description}</p>
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
            {selectedEvent.registrationLink && (
              <Button variant="primary" className="w-full justify-center" onClick={() => {}}>
                <ExternalLink size={14} /> Register for Event
              </Button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
