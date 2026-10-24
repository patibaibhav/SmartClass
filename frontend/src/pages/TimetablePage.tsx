import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, AlertTriangle, Users } from 'lucide-react';
import { Card, Badge, Button, SectionHeader, Tabs } from '../components/ui';
import { api } from '../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
const TIME_SLOTS = [
  '08:30 - 09:30',
  '09:30 - 10:30',
  '10:30 - 11:30',
  '11:30 - 12:30',
  '12:30 - 13:30',
  '13:30 - 14:30',
  '14:30 - 15:30',
];

interface Props {
  role?: string;
  onAddLecture?: () => void;
}

interface TimetableItem {
  id: number;
  class_id?: string;
  course: string;
  course_name?: string;
  faculty: string;
  faculty_initials?: string;
  room: string;
  time: string;
  start_time: string;
  end_time: string;
  type: string;
  batch?: string | null;
  session_kind?: string;
  group_id?: string | null;
  is_ambiguous?: boolean;
  source_ref?: string | null;
}

export default function TimetablePage({ role, onAddLecture }: Props) {
  const [view, setView] = useState('Full Timetable');
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [timetableData, setTimetableData] = useState<Record<string, TimetableItem[]>>({});
  const [selectedClass, setSelectedClass] = useState<string>('D12A');
  const [availableClasses, setAvailableClasses] = useState<string[]>(['D12A', 'D12B', 'D12C']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    // If student, don't pass class_id (backend scopes to student's class)
    // If faculty/admin, pass selectedClass
    const classParam = role === 'student' ? undefined : selectedClass;

    api.getTimetable(classParam)
      .then(res => {
        if (!isMounted) return;
        if (res && typeof res === 'object') {
          setTimetableData(res);
        } else {
          setTimetableData({});
        }
      })
      .catch(err => {
        if (isMounted) setError(err.message || 'Failed to load timetable');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [role, selectedClass]);

  // Normalize time strings for matching
  function getLecturesForSlot(day: string, slot: string) {
    const list = timetableData[day] || [];
    const slotStart = slot.split(' - ')[0].trim();
    return list.filter(l => {
      const lStart = (l.start_time || l.time.split(' - ')[0] || '').trim();
      return lStart === slotStart;
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <SectionHeader title="Academic Timetable" sub="Weekly scheduled lectures and lab sessions" />
          {role !== 'student' && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs font-semibold text-[#7a6a55]">Class:</span>
              {availableClasses.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedClass(c)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    selectedClass === c
                      ? 'bg-[#2F4F3A] text-[#F4F1E6]'
                      : 'bg-[#E8E2D0] text-[#5a4a35] hover:bg-[#ddd7c0]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {(role === 'faculty' || role === 'admin') && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onAddLecture}>
              <Plus size={14} /> Extra Lecture
            </Button>
            <Button variant="primary" size="sm" onClick={onAddLecture}>
              <Plus size={14} /> Substitute
            </Button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs tabs={['Full Timetable', 'Day View']} active={view} onChange={setView} />
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap text-xs text-[#7a6a55]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#7DB7C9]" />
          <span>Theory</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#E8D36A]" />
          <span>Practical / Lab</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#D98282]" />
          <span>Ambiguous source</span>
        </div>
      </div>

      {loading ? (
        <Card className="p-12 text-center text-[#7a6a55]">
          Loading timetable entries...
        </Card>
      ) : error ? (
        <Card className="p-8 text-center text-[#b04040]">
          {error}
        </Card>
      ) : view === 'Full Timetable' ? (
        /* Full grid */
        <div className="overflow-x-auto rounded-2xl border border-[#E8E2D0]">
          <table className="w-full min-w-[900px]" style={{ background: '#F5EBD7' }}>
            <thead>
              <tr style={{ background: '#243B2D' }}>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#9abaaa] uppercase tracking-wider w-28">Time</th>
                {DAYS.map(d => (
                  <th key={d} className="px-3 py-3 text-left text-xs font-semibold text-[#9abaaa] uppercase tracking-wider">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map(slot => {
                return (
                  <tr key={slot} className="border-b border-[#E8E2D0] last:border-b-0">
                    <td className="px-3 py-3 text-xs font-bold text-[#7a6a55] align-top bg-[#ede4ce] whitespace-nowrap">
                      {slot}
                    </td>
                    {DAYS.map(day => {
                      const lectures = getLecturesForSlot(day, slot);
                      return (
                        <td key={day} className="px-2 py-2 align-top border-l border-[#E8E2D0]">
                          {lectures.length === 0 ? (
                            <span className="text-[11px] text-[#b0a090] italic">—</span>
                          ) : (
                            <div className="space-y-1.5">
                              {lectures.map((l, i) => {
                                const isPractical = l.session_kind === 'practical' || (l.batch != null && l.batch !== '');
                                const borderColor = l.is_ambiguous ? '#D98282' : isPractical ? '#E8D36A' : '#7DB7C9';
                                const bgColor = l.is_ambiguous ? '#fdf2f2' : isPractical ? '#fefce8' : '#f0f9ff';

                                return (
                                  <div
                                    key={i}
                                    className="rounded-xl p-2 border-l-4 text-xs shadow-xs"
                                    style={{
                                      background: bgColor,
                                      borderLeftColor: borderColor,
                                    }}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <p className="font-bold text-[#1a2e1e] leading-snug">{l.course}</p>
                                      {l.batch && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E8D36A] text-[#243B2D]">
                                          {l.batch}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-[#7a6a55] mt-0.5 font-medium">Room {l.room}</p>
                                    <p className="text-[10px] text-[#9a8a75] truncate">
                                      {l.faculty_initials ? `${l.faculty} (${l.faculty_initials})` : l.faculty}
                                    </p>
                                    {l.is_ambiguous && (
                                      <div className="flex items-center gap-1 mt-1 text-[10px] text-[#b04040]">
                                        <AlertTriangle size={10} />
                                        <span>Ambiguous</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Day view */
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {DAYS.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-4 py-2 rounded-xl text-sm font-medium shrink-0 transition-colors ${
                  selectedDay === d ? 'bg-[#2F4F3A] text-[#F4F1E6]' : 'bg-[#E8E2D0] text-[#5a4a35] hover:bg-[#ddd7c0]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {(timetableData[selectedDay] || []).map((lecture, i) => {
              const isPractical = lecture.session_kind === 'practical' || (lecture.batch != null && lecture.batch !== '');
              const borderColor = lecture.is_ambiguous ? '#D98282' : isPractical ? '#E8D36A' : '#7DB7C9';

              return (
                <Card
                  key={i}
                  className="p-5 flex gap-5 items-start border-l-4"
                  style={{ borderLeftColor: borderColor }}
                >
                  <div className="shrink-0 text-center w-28">
                    <p className="text-sm font-bold text-[#2F4F3A]">{lecture.time || `${lecture.start_time} - ${lecture.end_time}`}</p>
                    <span className="text-[10px] uppercase font-semibold text-[#7a6a55]">
                      {lecture.session_kind || 'Theory'}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-base font-bold text-[#1a2e1e]">{lecture.course_name || lecture.course}</h3>
                      <Badge variant="default">{lecture.course}</Badge>
                      {lecture.batch && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#E8D36A] text-[#243B2D]">
                          Batch {lecture.batch}
                        </span>
                      )}
                      {lecture.is_ambiguous && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#fde8e8] text-[#b04040] flex items-center gap-1">
                          <AlertTriangle size={12} /> Ambiguous in sheet
                        </span>
                      )}
                    </div>

                    <div className="flex gap-4 text-xs text-[#7a6a55] mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1"><Clock size={11} />{lecture.time}</span>
                      <span>Room: <strong className="text-[#1a2e1e]">{lecture.room}</strong></span>
                      <span>Faculty: <strong className="text-[#1a2e1e]">{lecture.faculty} {lecture.faculty_initials ? `(${lecture.faculty_initials})` : ''}</strong></span>
                    </div>

                    {lecture.source_ref && (
                      <p className="text-[10px] text-[#9a8a75] mt-2">Source: {lecture.source_ref}</p>
                    )}
                  </div>
                </Card>
              );
            })}

            {(!timetableData[selectedDay] || timetableData[selectedDay].length === 0) && (
              <Card className="p-10 text-center">
                <p className="text-sm text-[#9a8a75]">No lectures scheduled for {selectedDay}.</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
