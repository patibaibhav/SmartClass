import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { Card, Badge, Button, Select, SectionHeader, Tabs } from '../components/ui';
import { api } from '../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
type LectureType = 'Regular' | 'Substitute' | 'Extra' | 'Cancelled';

interface TimetableLecture {
  id: number;
  time: string;
  startTime: string;
  endTime: string;
  course: string;
  code: string;
  faculty: string | null;
  room: string | null;
  type: LectureType;
  classIds?: string[];
  batches?: string[];
  parallelGroup?: string | null;
}

type Timetable = Record<(typeof DAYS)[number], TimetableLecture[]>;

const EMPTY_TIMETABLE: Timetable = {
  Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [],
};

const TYPE_COLORS: Record<LectureType, string> = {
  Regular: '#eaf3f8',
  Substitute: '#fdf6e0',
  Extra: '#f0eaf8',
  Cancelled: '#f5f0f0',
};
const TYPE_BORDER: Record<LectureType, string> = {
  Regular: '#7DB7C9',
  Substitute: '#E8D36A',
  Extra: '#9a7acc',
  Cancelled: '#D98282',
};

interface Props {
  role?: string;
  onAddLecture?: () => void;
}

export default function TimetablePage({ role, onAddLecture }: Props) {
  const [view, setView] = useState('Full Timetable');
  const [selectedDay, setSelectedDay] = useState('Wednesday');
  const [weekOffset, setWeekOffset] = useState(0);
  const [timetable, setTimetable] = useState<Timetable>(EMPTY_TIMETABLE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getTimetable()
      .then(data => setTimetable({ ...EMPTY_TIMETABLE, ...data } as Timetable))
      .catch(err => setError(err.message || 'Unable to load the timetable.'))
      .finally(() => setLoading(false));
  }, []);

  const times = useMemo(() => Array.from(new Set(
    DAYS.flatMap(day => timetable[day].map(lecture => lecture.startTime)),
  )).sort(), [timetable]);

  const weekLabel = weekOffset === 0 ? 'Official weekly schedule' : 'Base weekly schedule';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <SectionHeader title="Timetable" sub="View your complete weekly schedule" />
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

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 rounded-lg hover:bg-[#E8E2D0] transition-colors">
            <ChevronLeft size={16} className="text-[#5a4a35]" />
          </button>
          <span className="text-sm font-medium text-[#2F4F3A] px-2">{weekLabel}</span>
          <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 rounded-lg hover:bg-[#E8E2D0] transition-colors">
            <ChevronRight size={16} className="text-[#5a4a35]" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(TYPE_BORDER).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
            <span className="text-xs text-[#7a6a55]">{type}</span>
          </div>
        ))}
      </div>

      {loading && <Card className="p-8 text-center text-sm text-[#7a6a55]">Loading timetable…</Card>}
      {error && <Card className="p-5 text-sm text-[#b04040]">{error}</Card>}

      {!loading && !error && (view === 'Full Timetable' ? (
        /* Full grid */
        <div className="overflow-x-auto rounded-2xl border border-[#E8E2D0]">
          <table className="w-full min-w-[800px]" style={{ background: '#F5EBD7' }}>
            <thead>
              <tr style={{ background: '#243B2D' }}>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#9abaaa] uppercase tracking-wider w-24">Time</th>
                {DAYS.map(d => (
                  <th key={d} className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider ${d === 'Wednesday' ? 'text-[#E8D36A]' : 'text-[#9abaaa]'}`}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {times.map(time => {
                const rowCells = DAYS.map(day => {
                  const lectures = timetable[day].filter(lecture => lecture.startTime === time);
                  return { day, lectures };
                });
                if (rowCells.every(c => c.lectures.length === 0)) return null;
                return (
                  <tr key={time} className="border-b border-[#E8E2D0] last:border-b-0">
                    <td className="px-4 py-3 text-xs font-semibold text-[#7a6a55] align-top">{time}</td>
                    {rowCells.map(({ day, lectures }) => (
                      <td key={day} className="px-2 py-2 align-top">
                        {lectures.map((l, i) => (
                          <div key={i} className="rounded-xl p-2.5 border-l-4 mb-1 text-xs" style={{
                            background: TYPE_COLORS[l.type as LectureType] || TYPE_COLORS.Regular,
                            borderLeftColor: TYPE_BORDER[l.type as LectureType] || TYPE_BORDER.Regular,
                          }}>
                            <p className="font-semibold text-[#1a2e1e] leading-snug">{l.course}</p>
                            <p className="text-[#7a6a55] mt-0.5">{l.room || 'Room not provided'}</p>
                            <p className="text-[#9a8a75]">{l.faculty || 'Faculty not provided'}</p>
                            {l.batches?.length ? <p className="text-[#9a8a75]">{l.batches.join(', ')}</p> : null}
                          </div>
                        ))}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Day view */
        <div className="space-y-4">
          {/* Day selector */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {DAYS.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-4 py-2 rounded-xl text-sm font-medium shrink-0 transition-colors ${selectedDay === d ? 'bg-[#2F4F3A] text-[#F4F1E6]' : 'bg-[#E8E2D0] text-[#5a4a35] hover:bg-[#ddd7c0]'}`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {(timetable[selectedDay as keyof Timetable] || []).map((lecture, i) => (
              <Card key={i} className="p-5 flex gap-5 items-start border-l-4" style={{ borderLeftColor: TYPE_BORDER[lecture.type as LectureType] } as React.CSSProperties}>
                <div className="shrink-0 text-center w-20">
                  <p className="text-base font-bold text-[#2F4F3A]">{lecture.startTime}</p>
                  <p className="text-xs text-[#9a8a75]">–{lecture.endTime}</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-bold text-[#1a2e1e]">{lecture.course}</h3>
                    <span className="text-xs text-[#7a6a55]">({lecture.code})</span>
                    <Badge variant={lecture.type.toLowerCase() as any}>{lecture.type}</Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-[#7a6a55]">
                    <span className="flex items-center gap-1"><Clock size={11} />{lecture.time}</span>
                    <span>{lecture.room ? `Room ${lecture.room}` : 'Room not provided'}</span>
                    <span>{lecture.faculty || 'Faculty not provided'}</span>
                  </div>
                  {lecture.type === 'Substitute' && (
                    <p className="text-xs text-[#7a6000] mt-2 bg-[#fdf6e0] rounded-lg px-3 py-1.5 inline-block">
                      Substitute lecture — attendance recorded against conducting faculty
                    </p>
                  )}
                  {lecture.type === 'Cancelled' && (
                    <p className="text-xs text-[#9a8a75] mt-2">This lecture is cancelled and does not count toward attendance.</p>
                  )}
                </div>
              </Card>
            ))}
            {!timetable[selectedDay as keyof Timetable]?.length && (
              <Card className="p-10 text-center">
                <p className="text-sm text-[#9a8a75]">No lectures scheduled for {selectedDay}.</p>
              </Card>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
