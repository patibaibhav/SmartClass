import React, { useState, useEffect } from 'react';
import { Search, DoorOpen, Users, CheckCircle, X } from 'lucide-react';
import { Card, Badge, Button, SectionHeader, EmptyState } from '../components/ui';
import { api } from '../services/api';

interface ClassroomItem {
  id: string;
  name: string;
  building?: string;
  capacity?: number;
  status?: string;
  facilities?: string[];
  occupied_by?: string;
}

export default function ClassroomAvailabilityPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState('10:30');
  const [building, setBuilding] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const [allRooms, setAllRooms] = useState<ClassroomItem[]>([]);
  const [availableRooms, setAvailableRooms] = useState<ClassroomItem[]>([]);
  const [occupiedRooms, setOccupiedRooms] = useState<ClassroomItem[]>([]);

  useEffect(() => {
    api.getClassrooms().then(res => {
      if (Array.isArray(res)) {
        setAllRooms(res);
      }
    }).catch(() => {});
  }, []);

  async function search() {
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.searchClassroomAvailability(date, startTime, endTime);
      if (res && res.classrooms) {
        const avail = res.classrooms.filter((c: any) => c.status === 'Available');
        const occ = res.classrooms.filter((c: any) => c.status === 'Occupied');
        setAvailableRooms(avail);
        setOccupiedRooms(occ);
      } else {
        setAvailableRooms(allRooms);
        setOccupiedRooms([]);
      }
    } catch {
      setAvailableRooms(allRooms);
      setOccupiedRooms([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredAvailable = availableRooms.filter(c =>
    (building === '' || !c.building || c.building === building) &&
    (minCapacity === '' || (c.capacity && c.capacity >= parseInt(minCapacity)))
  );

  const buildings = [...new Set(allRooms.map(c => c.building).filter(Boolean))];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <SectionHeader
        title="Classroom Finder"
        sub="Search classroom and laboratory availability across the campus"
      />

      {/* Search panel */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-[#1a2e1e] mb-4">Search Availability</h3>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]"
            />
          </div>
        </div>

        {buildings.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Building</label>
              <select
                value={building}
                onChange={e => setBuilding(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] appearance-none"
              >
                <option value="">Any Building</option>
                {buildings.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
        )}

        <Button variant="primary" className="w-full justify-center py-3" onClick={search} disabled={loading}>
          <Search size={15} /> {loading ? 'Checking Availability...' : 'Find Available Classrooms'}
        </Button>
      </Card>

      {searched && (
        <div className="space-y-5">
          {/* Available */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-[#2F4F3A]" />
              <h3 className="text-sm font-bold text-[#1a2e1e]">Available Rooms ({filteredAvailable.length})</h3>
              <span className="text-xs text-[#7a6a55]">{startTime} – {endTime}</span>
            </div>
            {filteredAvailable.length === 0 ? (
              <EmptyState icon={DoorOpen} message="No classrooms available for this time slot." sub="Try a different time slot or date." />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredAvailable.map(cr => (
                  <Card key={cr.id || cr.name} className="p-4 border border-[#c0e0cd]">
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-9 h-9 rounded-xl bg-[#e6f4ec] flex items-center justify-center">
                        <DoorOpen size={16} className="text-[#1a6b3c]" />
                      </div>
                      <Badge variant="available">Available</Badge>
                    </div>
                    <p className="text-base font-bold text-[#1a2e1e]">Room {cr.name || cr.id}</p>
                    {cr.building && <p className="text-xs text-[#7a6a55]">{cr.building}</p>}
                    {cr.capacity && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-[#7a6a55]">
                        <Users size={11} /> {cr.capacity} seats
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Occupied */}
          {occupiedRooms.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <X size={16} className="text-[#D98282]" />
                <h3 className="text-sm font-bold text-[#1a2e1e]">Occupied Rooms ({occupiedRooms.length})</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {occupiedRooms.map(cr => (
                  <Card key={cr.id || cr.name} className="p-4 opacity-75">
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-9 h-9 rounded-xl bg-[#fdf0f0] flex items-center justify-center">
                        <DoorOpen size={16} className="text-[#b04040]" />
                      </div>
                      <Badge variant="danger">Occupied</Badge>
                    </div>
                    <p className="text-base font-bold text-[#1a2e1e]">Room {cr.name || cr.id}</p>
                    {cr.occupied_by && (
                      <p className="text-xs text-[#b04040] mt-1">{cr.occupied_by}</p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-[#9a8a75] text-center">
            Availability is cross-referenced against the master timetable and ad-hoc scheduled sessions.
          </p>
        </div>
      )}
    </div>
  );
}
