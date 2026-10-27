import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, ExternalLink } from 'lucide-react';
import { Card, Badge, SectionHeader, Modal, Button } from '../components/ui';
import { api } from '../services/api';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface CalendarEntry {
  id: number;
  title: string;
  category: 'Events' | 'Tests' | 'Holidays';
  date: string;
  time?: string | null;
  description?: string | null;
}

interface CouncilEvent {
  id: string;
  title: string;
  council: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  description: string;
  organizer: string;
  registrationLink?: string | null;
  visibility: string;
}

const CATEGORY_COLORS = { Events: '#2F4F3A', Tests: '#7DB7C9', Holidays: '#E8D36A' };

export default function CalendarPage() {
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [events, setEvents] = useState<CouncilEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CouncilEvent | null>(null);
  const [filter, setFilter] = useState<string[]>(['Events', 'Tests', 'Holidays']);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getCalendar(), api.getEvents()])
      .then(([calendarEntries, councilEvents]) => {
        setEntries(calendarEntries);
        setEvents(councilEvents);
      })
      .catch(err => setError(err.message || 'Unable to load the calendar.'));
  }, []);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const monthDays = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthEntries = useMemo(() => entries.filter(entry => {
    const parsed = new Date(`${entry.date}T00:00:00`);
    return parsed.getFullYear() === year && parsed.getMonth() === month && filter.includes(entry.category);
  }), [entries, filter, month, year]);

  function toggleFilter(category: string) {
    setFilter(current => current.includes(category) ? current.filter(item => item !== category) : [...current, category]);
  }

  function moveMonth(offset: number) {
    setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <SectionHeader title="Calendar" sub="Academic events, tests, and holidays" />

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-[#7a6a55] uppercase tracking-wider">Show:</span>
        {(Object.keys(CATEGORY_COLORS) as Array<keyof typeof CATEGORY_COLORS>).map(category => (
          <button key={category} onClick={() => toggleFilter(category)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${filter.includes(category) ? 'text-white' : 'bg-[#F4F1E6] text-[#7a6a55] border-[#E8E2D0]'}`}
            style={filter.includes(category) ? { background: CATEGORY_COLORS[category], borderColor: CATEGORY_COLORS[category] } : {}}>
            {category}
          </button>
        ))}
      </div>

      {error && <Card className="p-4 text-sm text-[#b04040]">{error}</Card>}

      <div className="flex items-center gap-4">
        <button onClick={() => moveMonth(-1)} className="p-2 rounded-lg hover:bg-[#E8E2D0]"><ChevronLeft size={18} /></button>
        <h3 className="text-lg font-bold text-[#1a2e1e]">{MONTH_NAMES[month]} {year}</h3>
        <button onClick={() => moveMonth(1)} className="p-2 rounded-lg hover:bg-[#E8E2D0]"><ChevronRight size={18} /></button>
        <button onClick={() => setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1))} className="ml-2 px-3 py-1.5 text-xs font-semibold text-[#2F4F3A] hover:bg-[#E8E2D0] rounded-lg">Today</button>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[#E8E2D0]">
          {WEEK_DAYS.map(day => <div key={day} className="py-3 text-center text-xs font-semibold text-[#7a6a55]">{day}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, index) => <div key={`empty-${index}`} className="h-24 border-b border-r border-[#E8E2D0] bg-[#f9f5ee]" />)}
          {Array.from({ length: monthDays }).map((_, index) => {
            const day = index + 1;
            const dayEntries = monthEntries.filter(entry => Number(entry.date.slice(-2)) === day);
            const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
            return (
              <div key={day} className="h-24 border-b border-r border-[#E8E2D0] p-2">
                <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full ${isToday ? 'bg-[#2F4F3A] text-white' : ''}`}>{day}</span>
                <div className="mt-1 space-y-0.5">
                  {dayEntries.slice(0, 2).map(entry => (
                    <div key={entry.id} className="text-[10px] font-medium px-1.5 py-0.5 rounded truncate text-white" style={{ background: CATEGORY_COLORS[entry.category] }}>{entry.title}</div>
                  ))}
                  {dayEntries.length > 2 && <div className="text-[10px] text-[#7a6a55]">+{dayEntries.length - 2} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div>
        <h4 className="text-sm font-bold text-[#1a2e1e] mb-3">Events</h4>
        <div className="space-y-3">
          {events.map(event => (
            <Card key={event.id} className="p-5 flex items-start gap-4" onClick={() => setSelectedEvent(event)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1"><p className="text-sm font-bold">{event.title}</p><Badge variant="info">{event.council}</Badge></div>
                <div className="flex gap-3 text-xs text-[#7a6a55] flex-wrap">
                  <span>{event.date}</span><span className="flex items-center gap-1"><Clock size={11} />{event.startTime}–{event.endTime}</span><span className="flex items-center gap-1"><MapPin size={11} />{event.venue}</span>
                </div>
              </div>
            </Card>
          ))}
          {!events.length && !error && <Card className="p-6 text-center text-sm text-[#7a6a55]">No visible events.</Card>}
        </div>
      </div>

      {selectedEvent && (
        <Modal title={selectedEvent.title} onClose={() => setSelectedEvent(null)} width="max-w-lg">
          <div className="space-y-4">
            <div className="flex gap-2"><Badge variant="info">{selectedEvent.council}</Badge><Badge variant="college">{selectedEvent.visibility}</Badge></div>
            <p className="text-sm text-[#3a2e1a]">{selectedEvent.description}</p>
            <p className="text-sm"><strong>Date:</strong> {selectedEvent.date}</p>
            <p className="text-sm"><strong>Time:</strong> {selectedEvent.startTime}–{selectedEvent.endTime}</p>
            <p className="text-sm"><strong>Venue:</strong> {selectedEvent.venue}</p>
            {selectedEvent.registrationLink && <Button variant="primary" className="w-full justify-center" onClick={() => window.open(selectedEvent.registrationLink!, '_blank', 'noopener,noreferrer')}><ExternalLink size={14} /> Registration</Button>}
          </div>
        </Modal>
      )}
    </div>
  );
}
