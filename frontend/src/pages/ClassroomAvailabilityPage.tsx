import React, { useEffect, useMemo, useState } from 'react';
import { Search, DoorOpen, Users, CheckCircle, X } from 'lucide-react';
import { Card, Badge, Button, SectionHeader, EmptyState } from '../components/ui';
import { api } from '../services/api';

type Room = { id: string; name: string; building?: string | null; capacity?: number | null; facilities?: string[]; status?: 'Available' | 'Occupied'; occupiedBy?: string | null };

export default function ClassroomAvailabilityPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [building, setBuilding] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { api.getClassrooms().then(setRooms).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);

  async function search() {
    if (!date || !startTime || !endTime || startTime >= endTime) { setError('Choose a date and a valid time range.'); return; }
    setLoading(true); setError('');
    try { const result = await api.searchClassroomAvailability(date, startTime, endTime); setRooms(result.classrooms || []); setSearched(true); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  const filtered = rooms.filter(room => (!building || room.building === building) && (!minCapacity || (room.capacity != null && room.capacity >= Number(minCapacity))));
  const available = filtered.filter(room => room.status !== 'Occupied');
  const occupied = filtered.filter(room => room.status === 'Occupied');
  const buildings = useMemo(() => [...new Set(rooms.map(r => r.building).filter(Boolean))] as string[], [rooms]);

  return <div className="p-6 max-w-4xl mx-auto space-y-6">
    <SectionHeader title="Classroom Finder" sub="Availability calculated from scheduled and conducted lectures" />
    <Card className="p-6 space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <label className="text-xs font-semibold">Date<input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full px-4 py-2.5 rounded-xl border bg-[#F4F1E6]" /></label>
        <label className="text-xs font-semibold">Start Time<input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="mt-1 w-full px-4 py-2.5 rounded-xl border bg-[#F4F1E6]" /></label>
        <label className="text-xs font-semibold">End Time<input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="mt-1 w-full px-4 py-2.5 rounded-xl border bg-[#F4F1E6]" /></label>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <select value={building} onChange={e => setBuilding(e.target.value)} className="px-4 py-2.5 rounded-xl border bg-[#F4F1E6]"><option value="">Any building</option>{buildings.map(v => <option key={v}>{v}</option>)}</select>
        <input type="number" min="1" value={minCapacity} onChange={e => setMinCapacity(e.target.value)} placeholder="Minimum known capacity" className="px-4 py-2.5 rounded-xl border bg-[#F4F1E6]" />
      </div>
      <Button variant="primary" className="w-full justify-center" onClick={search} disabled={loading}><Search size={15} /> {loading ? 'Checking…' : 'Find Available Classrooms'}</Button>
      {error && <p className="text-sm text-[#b04040]">{error}</p>}
    </Card>
    {searched && <div className="space-y-5">
      <RoomGroup title={`Available (${available.length})`} icon={<CheckCircle size={16} />} rooms={available} empty="No matching rooms are available." />
      {occupied.length > 0 && <RoomGroup title={`Occupied (${occupied.length})`} icon={<X size={16} />} rooms={occupied} />}
      <p className="text-xs text-[#9a8a75] text-center">Unknown building or capacity metadata is left blank; it is not inferred.</p>
    </div>}
  </div>;
}

function RoomGroup({ title, icon, rooms, empty }: { title: string; icon: React.ReactNode; rooms: Room[]; empty?: string }) {
  return <section><h3 className="text-sm font-bold flex items-center gap-2 mb-3">{icon}{title}</h3>
    {rooms.length === 0 ? <EmptyState icon={DoorOpen} message={empty || 'No rooms.'} /> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{rooms.map(room => <Card key={room.id} className="p-4">
      <div className="flex justify-between"><DoorOpen size={17} /><Badge variant={room.status === 'Occupied' ? 'occupied' : 'available'}>{room.status || 'Available'}</Badge></div>
      <p className="font-bold mt-2">{room.name}</p><p className="text-xs text-[#7a6a55]">{room.building || 'Building not provided'}</p>
      <p className="text-xs text-[#7a6a55] flex items-center gap-1 mt-2"><Users size={11} />{room.capacity == null ? 'Capacity not provided' : `${room.capacity} seats`}</p>
      {room.occupiedBy && <p className="text-xs text-[#b04040] mt-2">{room.occupiedBy}</p>}
    </Card>)}</div>}
  </section>;
}
