import React, { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, BookOpen, CheckCircle } from 'lucide-react';
import { Card, Badge, ProgressBar, CircularProgress, Tabs, SectionHeader, EmptyState } from '../components/ui';
import { api } from '../services/api';

interface AttendanceRecord {
  course_code: string;
  course_name: string;
  total: number;
  present: number;
  percentage: number;
  history?: Array<{
    date: string;
    status: string;
    type?: string;
  }>;
}

export default function AttendancePage() {
  const [tab, setTab] = useState('Overview');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getStudentAttendance()
      .then(res => {
        if (!isMounted) return;
        if (Array.isArray(res)) {
          setRecords(res);
        } else {
          setRecords([]);
        }
      })
      .catch(() => {
        if (isMounted) setRecords([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const totalLectures = records.reduce((s, a) => s + (a.total || 0), 0);
  const totalPresent = records.reduce((s, a) => s + (a.present || 0), 0);
  const overall = totalLectures > 0 ? Math.round((totalPresent / totalLectures) * 100) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <SectionHeader title="Attendance" sub="Track your attendance across all registered courses" />

      <Tabs tabs={['Overview', 'Course-wise']} active={tab} onChange={setTab} />

      {loading ? (
        <Card className="p-12 text-center text-[#7a6a55]">
          Loading attendance records...
        </Card>
      ) : records.length === 0 ? (
        <Card className="p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#E8E2D0] flex items-center justify-center mx-auto text-[#2F4F3A]">
            <Calendar size={24} />
          </div>
          <h3 className="text-base font-bold text-[#1a2e1e]">No Attendance Recorded Yet</h3>
          <p className="text-xs text-[#7a6a55] max-w-md mx-auto">
            Your attendance data will be updated here in real time as your professors conduct sessions and mark attendance.
          </p>
        </Card>
      ) : tab === 'Overview' ? (
        <div className="space-y-6">
          {/* Overall card */}
          <Card className="p-6">
            <div className="flex items-center gap-8 flex-wrap">
              <div className="relative">
                <CircularProgress value={overall} size={100} strokeWidth={9} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-[#1a2e1e]">{overall}%</span>
                  <span className="text-[9px] text-[#7a6a55] uppercase tracking-wide">Overall</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[#1a2e1e] mb-3">Semester Attendance Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: 'Total Lectures', value: totalLectures },
                    { label: 'Present', value: totalPresent },
                    { label: 'Absent', value: totalLectures - totalPresent },
                  ].map(stat => (
                    <div key={stat.label}>
                      <p className="text-xl font-bold text-[#1a2e1e]">{stat.value}</p>
                      <p className="text-xs text-[#7a6a55] mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Course-wise summary list */}
          <div className="space-y-3">
            {records.map(a => {
              const isLow = a.percentage < 75;
              const isWarning = a.percentage >= 65 && a.percentage < 75;
              return (
                <Card key={a.course_code} className={`p-4 ${isLow ? 'border border-[#f0df90]' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <CircularProgress value={a.percentage} size={52} strokeWidth={5} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold" style={{ color: a.percentage >= 75 ? '#2F4F3A' : a.percentage >= 65 ? '#9a6000' : '#b04040' }}>
                          {Math.round(a.percentage)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#1a2e1e]">{a.course_name || a.course_code}</p>
                        <span className="text-xs text-[#9a8a75]">({a.course_code})</span>
                        {isLow && (
                          <Badge variant={isWarning ? 'warning' : 'danger'}>
                            {isWarning ? 'Warning' : 'Low Attendance'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#7a6a55] mt-0.5">{a.present}/{a.total} lectures attended</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map(a => (
            <Card key={a.course_code} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#1a2e1e]">{a.course_name || a.course_code}</h4>
                  <p className="text-xs text-[#7a6a55]">Course Code: {a.course_code}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold" style={{ color: a.percentage >= 75 ? '#2F4F3A' : '#b04040' }}>
                    {a.percentage.toFixed(1)}%
                  </span>
                  <p className="text-[10px] text-[#7a6a55]">{a.present} of {a.total} attended</p>
                </div>
              </div>
              <ProgressBar value={a.percentage} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
