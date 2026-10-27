import React, { useState } from 'react';
import { Eye, EyeOff, Bell, LogOut, Shield } from 'lucide-react';
import { Card, Button, SectionHeader, Badge, Avatar, Toast } from '../components/ui';
import type { User } from '../types';

interface Props {
  user: User;
  onLogout: () => void;
}

export default function ProfilePage({ user, onLogout }: Props) {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState('');
  const [notifPrefs, setNotifPrefs] = useState({
    assignments: true,
    quizzes: true,
    attendance: true,
    announcements: true,
    grievances: user.role !== 'student',
    timetable: true,
  });

  const roleLabel = user.role === 'faculty'
    ? user.isHOD ? 'Faculty' : 'Faculty'
    : user.role === 'student' ? 'Student'
    : user.role === 'admin' ? 'Administrator'
    : 'Council Head';

  function savePassword() {
    if (newPass !== confirmPass) { setToast('Passwords do not match.'); return; }
    if (newPass.length < 8) { setToast('Password too short.'); return; }
    setOldPass(''); setNewPass(''); setConfirmPass('');
    setToast('Password changed successfully.');
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <SectionHeader title="Profile & Settings" />

      {/* Profile card */}
      <Card className="p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#2F4F3A] text-[#F4F1E6] flex items-center justify-center text-xl font-bold shrink-0">
            {user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-[#1a2e1e]">{user.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="info">{roleLabel}</Badge>
              {user.isHOD && <Badge variant="success">HOD</Badge>}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-[#E8E2D0]">
          {[
            { label: 'User ID', value: user.id },
            { label: 'Email', value: user.email },
            { label: 'Department', value: user.department },
            ...(user.class ? [{ label: 'Class', value: user.class }] : []),
            { label: 'Role', value: user.isHOD ? 'Faculty · HOD' : roleLabel },
          ].map(item => (
            <div key={item.label} className="bg-[#F4F1E6] rounded-xl p-4">
              <p className="text-xs text-[#7a6a55] uppercase tracking-wider">{item.label}</p>
              <p className="text-sm font-semibold text-[#1a2e1e] mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Change password */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-[#2F4F3A]" />
          <h3 className="text-sm font-bold text-[#1a2e1e]">Change Password</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Current Password</label>
            <div className="relative">
              <input type={showOld ? 'text' : 'password'} value={oldPass} onChange={e => setOldPass(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
              <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6a55]">
                {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">New Password</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6a55]">
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Confirm New Password</label>
            <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
          </div>
          <Button variant="primary" size="sm" onClick={savePassword}>Update Password</Button>
        </div>
      </Card>

      {/* Notification preferences */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={16} className="text-[#2F4F3A]" />
          <h3 className="text-sm font-bold text-[#1a2e1e]">Notification Preferences</h3>
        </div>
        <div className="space-y-3">
          {Object.entries(notifPrefs).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between">
              <label className="text-sm text-[#3a2e1a] capitalize">{key === 'timetable' ? 'Timetable changes' : key.charAt(0).toUpperCase() + key.slice(1)}</label>
              <button
                onClick={() => setNotifPrefs(p => ({ ...p, [key]: !val }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${val ? 'bg-[#2F4F3A]' : 'bg-[#E8E2D0]'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${val ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Sign out */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#3a2e1a]">Sign Out</p>
            <p className="text-xs text-[#7a6a55]">You will be returned to the login page.</p>
          </div>
          <Button variant="danger" size="sm" onClick={onLogout}>
            <LogOut size={14} /> Sign Out
          </Button>
        </div>
      </Card>

      {toast && <Toast message={toast} type={toast.includes('successfully') ? 'success' : 'error'} onClose={() => setToast('')} />}
    </div>
  );
}
