import React, { useState, useEffect } from 'react';
import { Users, ClipboardList, AlertTriangle, BookOpen, PenSquare, ChevronRight, Clock } from 'lucide-react';
import { Card, MetricCard, Badge, ProgressBar, SectionHeader } from '../components/ui';
import { api } from '../services/api';

interface Props {
  onNavigate: (page: string) => void;
  userName: string;
  isHOD?: boolean;
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function FacultyDashboard({ onNavigate, userName, isHOD }: Props) {
  const [stats, setStats] = useState({
    classes: 0,
    avgAttendance: 0,
    defaulters: 0,
    pendingAssignments: 0,
    lecturesToday: 0
  });
  const [todayLectures, setTodayLectures] = useState<any[]>([]);
  const [courseAttendance, setCourseAttendance] = useState<any[]>([]);
  const [defaultersList, setDefaultersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    const queryDay = (currentDay === 'Sunday' || currentDay === 'Saturday') ? 'Monday' : currentDay;

    Promise.allSettled([
      api.getDashboardStats('faculty'),
      api.getTimetable(),
      api.getFacultyAttendance()
    ]).then(([statsRes, ttRes, attRes]) => {
      if (!isMounted) return;

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value);
      }
      if (ttRes.status === 'fulfilled' && ttRes.value) {
        const entries = ttRes.value[queryDay] || [];
        setTodayLectures(entries);
      }
      if (attRes.status === 'fulfilled' && attRes.value) {
        if (Array.isArray(attRes.value.courses)) {
          setCourseAttendance(attRes.value.courses);
        }
        if (Array.isArray(attRes.value.defaulters)) {
          setDefaultersList(attRes.value.defaulters);
        }
      }
      setLoading(false);
    });

    return () => { isMounted = false; };
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-7">
      {/* Greeting */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e1e]">{getGreeting()}, {userName}</h1>
          <p className="text-sm text-[#7a6a55] mt-0.5">
            {isHOD ? 'Faculty · Department Head' : 'Faculty Member'} · Engineering
          </p>
        </div>
        {isHOD && (
          <div className="flex items-center gap-2 bg-[#2F4F3A] text-[#F4F1E6] rounded-xl px-4 py-2">
            <BookOpen size={14} />
            <span className="text-sm font-semibold">HOD Access Active</span>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="My Classes"
          value={stats.classes}
          icon={Users}
          onClick={() => onNavigate('my-class')}
        />
        <MetricCard
          label="Avg Attendance"
          value={stats.avgAttendance > 0 ? `${stats.avgAttendance}%` : 'N/A'}
          icon={ClipboardList}
          color="#2a6a82"
          onClick={() => onNavigate('faculty-attendance')}
        />
        <MetricCard
          label="Defaulters"
          value={stats.defaulters}
          sub="Below 75% attendance"
          icon={AlertTriangle}
          color="#b04040"
          onClick={() => onNavigate('defaulters')}
        />
        <MetricCard
          label="Pending Grading"
          value={stats.pendingAssignments}
          icon={PenSquare}
          color="#7a6000"
          onClick={() => onNavigate('assignments')}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1a2e1e]">Today's Scheduled Sessions</h3>
            <button onClick={() => onNavigate('timetable')} className="text-xs text-[#2F4F3A] font-semibold hover:underline flex items-center gap-1">
              Full timetable <ChevronRight size={13} />
            </button>
          </div>

          {todayLectures.length === 0 ? (
            <Card className="p-8 text-center text-[#7a6a55] text-sm">
              No sessions scheduled for today.
            </Card>
          ) : (
            <div className="space-y-2.5">
              {todayLectures.map((lecture, i) => (
                <Card key={i} className="p-4 flex items-center gap-4">
                  <div className="text-center shrink-0 w-24">
                    <p className="text-xs font-bold text-[#2F4F3A]">{lecture.time || `${lecture.start_time} - ${lecture.end_time}`}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a2e1e] truncate">{lecture.course_name || lecture.course}</p>
                    <p className="text-xs text-[#7a6a55]">
                      Class {lecture.class_id || 'All'} · Room {lecture.room || lecture.classroom}
                      {lecture.batch ? ` · Batch ${lecture.batch}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{lecture.session_kind ? lecture.session_kind.toUpperCase() : 'THEORY'}</Badge>
                    <button
                      onClick={() => onNavigate('faculty-attendance')}
                      className="text-xs bg-[#2F4F3A] text-[#F4F1E6] px-3 py-1.5 rounded-lg font-medium hover:bg-[#243B2D] transition-colors"
                    >
                      Mark
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Attendance overview */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[#1a2e1e]">Course Attendance Summary</h3>
          <Card className="p-5 space-y-3">
            {courseAttendance.length === 0 ? (
              <p className="text-xs text-[#7a6a55] text-center py-6">
                No active attendance sessions recorded yet.
              </p>
            ) : (
              courseAttendance.map(a => (
                <div key={a.course_code}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-medium text-[#3a2e1a]">{a.course_code}</p>
                    <p className="text-xs font-bold" style={{ color: a.avg_attendance >= 75 ? '#2F4F3A' : '#b04040' }}>
                      {Math.round(a.avg_attendance)}%
                    </p>
                  </div>
                  <ProgressBar value={a.avg_attendance} />
                </div>
              ))
            )}
          </Card>
        </div>
      </div>

      {/* Defaulter preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#1a2e1e]">Defaulter Overview</h3>
          <button onClick={() => onNavigate('defaulters')} className="text-xs text-[#2F4F3A] font-semibold hover:underline flex items-center gap-1">
            View all defaulters <ChevronRight size={13} />
          </button>
        </div>
        {defaultersList.length === 0 ? (
          <Card className="p-6 text-center text-xs text-[#7a6a55]">
            No attendance defaulters reported at this time.
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {defaultersList.slice(0, 4).map(d => (
              <Card key={d.student_id || d.name} className="p-4 border border-[#f0c8c8]">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="danger">Below 75%</Badge>
                  <span className="text-xs font-bold text-[#b04040]">{Math.round(d.attendance)}%</span>
                </div>
                <p className="text-sm font-bold text-[#1a2e1e]">{d.name}</p>
                <p className="text-xs text-[#7a6a55]">{d.class_id} · {d.course_code}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
