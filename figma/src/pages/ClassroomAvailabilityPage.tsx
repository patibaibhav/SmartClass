import React, { useState } from 'react';
import { Search, DoorOpen, Users, Zap, CheckCircle, X } from 'lucide-react';
import { Card, Badge, Button, SectionHeader, EmptyState } from '../components/ui';
import { CLASSROOMS } from '../data/mock';

const OCCUPIED_ROOMS = ['A-201', 'B-102', 'Lab-2'];

export default function ClassroomAvailabilityPage() {
  const [date, setDate] = useState('2024-08-14');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:00');
  const [building, setBuilding] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [searched, setSearched] = useState(false);

  function search() { setSearched(true); }

  const available = CLASSROOMS.filter(c =>
    !OCCUPIED_ROOMS.includes(c.name) &&
    (building === '' || c.building === building) &&
    (minCapacity === '' || c.capacity >= parseInt(minCapacity))
  );
  const occupied = CLASSROOMS.filter(c => OCCUPIED_ROOMS.includes(c.name));
  const buildings = [...new Set(CLASSROOMS.map(c => c.building))];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <SectionHeader
        title="Classroom Finder"
        sub="Find available classrooms for any date and time"
      />

      {/* Search panel */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-[#1a2e1e] mb-4">Search Availability</h3>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Start Time</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">End Time</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Building (optional)</label>
            <select value={building} onChange={e => setBuilding(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] appearance-none">
              <option value="">Any Building</option>
              {buildings.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Minimum Capacity (optional)</label>
            <input type="number" value={minCapacity} onChange={e => setMinCapacity(e.target.value)}
              placeholder="e.g. 60"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
          </div>
        </div>
        <Button variant="primary" className="w-full justify-center py-3" onClick={search}>
          <Search size={15} /> Find Available Classrooms
        </Button>
      </Card>

      {searched && (
        <div className="space-y-5">
          {/* Available */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-[#2F4F3A]" />
              <h3 className="text-sm font-bold text-[#1a2e1e]">Available ({available.length})</h3>
              <span className="text-xs text-[#7a6a55]">{startTime}–{endTime}</span>
            </div>
            {available.length === 0 ? (
              <EmptyState icon={DoorOpen} message="No classrooms available for this time." sub="Try a different time slot or building." />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {available.map(cr => (
                  <Card key={cr.id} className="p-4 border border-[#c0e0cd]">
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-9 h-9 rounded-xl bg-[#e6f4ec] flex items-center justify-center">
                        <DoorOpen size={16} className="text-[#1a6b3c]" />
                      </div>
                      <Badge variant="available">Available</Badge>
                    </div>
                    <p className="text-base font-bold text-[#1a2e1e]">{cr.name}</p>
                    <p className="text-xs text-[#7a6a55]">{cr.building}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-[#7a6a55]">
                      <Users size={11} /> {cr.capacity} seats
                    </div>
                    <div className="flex gap-1 flex-wrap mt-2">
                      {cr.facilities.map(f => (
                        <span key={f} className="px-2 py-0.5 bg-[#E8E2D0] rounded-full text-[10px] text-[#3a2e1a]">{f}</span>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Occupied */}
          {occupied.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <X size={16} className="text-[#D98282]" />
                <h3 className="text-sm font-bold text-[#1a2e1e]">Occupied ({occupied.length})</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {occupied.map(cr => (
                  <Card key={cr.id} className="p-4 opacity-70">
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-9 h-9 rounded-xl bg-[#fdf0f0] flex items-center justify-center">
                        <DoorOpen size={16} className="text-[#b04040]" />
                      </div>
                      <Badge variant="occupied">Occupied</Badge>
                    </div>
                    <p className="text-base font-bold text-[#1a2e1e]">{cr.name}</p>
                    <p className="text-xs text-[#7a6a55]">{cr.building}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-[#7a6a55]">
                      <Users size={11} /> {cr.capacity} seats
                    </div>
                    <p className="text-xs text-[#b04040] mt-2">09:00–10:00 — Data Structures</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-[#9a8a75] text-center">
            Adjacent non-overlapping lectures are not counted as conflicts. Results are as of the current timetable.
          </p>
        </div>
      )}
    </div>
  );
}
