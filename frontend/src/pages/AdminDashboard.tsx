import React, { useState } from 'react';
import { Users, BookOpen, Building2, ClipboardList, AlertCircle, Calendar, BarChart2, ChevronRight, Plus, Search, UserPlus, Pencil, ShieldOff } from 'lucide-react';
import { Card, MetricCard, Badge, Button, Tabs, SectionHeader, Modal, Input, Toast, ProgressBar } from '../components/ui';
import { ADMIN_STATS, STUDENTS, USERS, COURSES } from '../data/mock';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface Props {
  onNavigate: (page: string) => void;
  currentPage?: string;
}

const DEPT_ATTENDANCE = [
  { dept: 'CS', avg: 82 },
  { dept: 'IT', avg: 78 },
  { dept: 'EXTC', avg: 85 },
  { dept: 'Mech', avg: 79 },
  { dept: 'Civil', avg: 76 },
];

const GRIEVANCE_DATA = [
  { name: 'New', value: 5, color: '#D98282' },
  { name: 'In Review', value: 3, color: '#E8D36A' },
  { name: 'Resolved', value: 4, color: '#2F4F3A' },
];

export default function AdminDashboard({ onNavigate, currentPage = 'dashboard' }: Props) {
  const [userTab, setUserTab] = useState('Students');
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newId, setNewId] = useState('');
  const [newRole, setNewRole] = useState('student');
  const [toast, setToast] = useState('');

  if (currentPage === 'admin-users') {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <SectionHeader
          title="User Management"
          sub="Manage student, faculty, and council head accounts"
          action={<Button variant="primary" onClick={() => setCreateUserOpen(true)}><UserPlus size={14} /> Create User</Button>}
        />

        <Tabs tabs={['Students', 'Faculty', 'Council Heads']} active={userTab} onChange={setUserTab} />

        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E2D0] flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8a75]" />
              <input placeholder="Search users..." className="pl-9 pr-4 py-2 w-full rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]" />
            </div>
          </div>
          <table className="sc-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>User ID</th>
                <th>Email</th>
                <th>Department</th>
                {userTab === 'Students' && <th>Class</th>}
                {userTab === 'Faculty' && <th>HOD</th>}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(userTab === 'Students' ? STUDENTS : userTab === 'Faculty' ? USERS.filter(u => u.role === 'faculty') : USERS.filter(u => u.role === 'council')).map((user: any, i) => (
                <tr key={user.id}>
                  <td className="font-medium">{user.name}</td>
                  <td>{user.id || `STU${String(i + 1).padStart(3, '0')}`}</td>
                  <td className="text-xs">{user.email || `${user.name.split(' ')[0].toLowerCase()}@smartclass.edu`}</td>
                  <td>Computer Science</td>
                  {userTab === 'Students' && <td>{user.class || 'SE-A'}</td>}
                  {userTab === 'Faculty' && <td>{user.isHOD ? <Badge variant="success">HOD</Badge> : '—'}</td>}
                  <td><Badge variant="present">Active</Badge></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-[#E8E2D0] text-[#7a6a55]" title="Edit"><Pencil size={13} /></button>
                      <button className="p-1.5 rounded-lg hover:bg-[#fdf0f0] text-[#D98282]" title="Deactivate"><ShieldOff size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {createUserOpen && (
          <Modal title="Create New User" onClose={() => setCreateUserOpen(false)} width="max-w-lg">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Full Name" value={newName} onChange={setNewName} placeholder="e.g. Arjun Sharma" required className="col-span-2" />
                <Input label="Email" value={newEmail} onChange={setNewEmail} placeholder="user@smartclass.edu" required />
                <Input label="User ID" value={newId} onChange={setNewId} placeholder="e.g. STU013" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] appearance-none">
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="council">Council Head</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Department</label>
                  <select className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] appearance-none">
                    {['Computer Science', 'IT', 'EXTC', 'Mechanical', 'Civil'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                {newRole === 'student' && (
                  <div>
                    <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Class</label>
                    <select className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] appearance-none">
                      {['SE-A', 'SE-B', 'TE-A', 'TE-B', 'BE-A'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                )}
                {newRole === 'faculty' && (
                  <div className="flex items-center gap-2 mt-5">
                    <input type="checkbox" id="isHod" className="w-4 h-4 accent-[#2F4F3A]" />
                    <label htmlFor="isHod" className="text-sm text-[#3a2e1a]">Grant HOD permissions</label>
                  </div>
                )}
              </div>
              <div className="bg-[#fdf6e0] border border-[#f0df90] rounded-xl p-3 text-xs text-[#7a4a00]">
                A temporary password will be auto-generated and shared with the user. They will be required to change it on first login.
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setCreateUserOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => { setCreateUserOpen(false); setToast('User account created successfully.'); }}>Create Account</Button>
              </div>
            </div>
          </Modal>
        )}

        {toast && <Toast message={toast} onClose={() => setToast('')} />}
      </div>
    );
  }

  if (currentPage === 'admin-classes') {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <SectionHeader
          title="Classes & Courses"
          sub="Manage academic classes and course assignments"
          action={<div className="flex gap-2"><Button size="sm" variant="secondary">+ Course</Button><Button size="sm" variant="primary">+ Class</Button></div>}
        />
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Classes */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#1a2e1e]">Classes</h3>
            {['SE-A', 'SE-B', 'TE-A', 'TE-B', 'BE-A', 'BE-B'].map(cls => (
              <Card key={cls} className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#2F4F3A] flex items-center justify-center">
                  <BookOpen size={13} className="text-[#F4F1E6]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1a2e1e]">{cls}</p>
                  <p className="text-xs text-[#7a6a55]">{Math.floor(Math.random() * 15) + 50} students · {Math.floor(Math.random() * 3) + 4} courses</p>
                </div>
                <button className="text-xs text-[#2F4F3A] font-semibold hover:underline">Manage</button>
              </Card>
            ))}
          </div>

          {/* Courses */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#1a2e1e]">Courses</h3>
            {COURSES.map(course => (
              <Card key={course.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#1a2e1e]">{course.name}</p>
                    <p className="text-xs text-[#7a6a55]">{course.code} · {course.faculty}</p>
                  </div>
                  <button className="text-xs text-[#2F4F3A] font-semibold hover:underline">Edit</button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'admin-analytics') {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <SectionHeader title="Academic Analytics" sub="Institution-level performance overview" />
        <div className="grid sm:grid-cols-2 gap-5">
          <Card className="p-5">
            <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider mb-4">Attendance by Department</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DEPT_ATTENDANCE}>
                  <XAxis dataKey="dept" tick={{ fontSize: 12, fill: '#7a6a55' }} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#7a6a55' }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v: any) => [`${v}%`]} contentStyle={{ background: '#F5EBD7', border: '1px solid #E8E2D0', borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="avg" fill="#2F4F3A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider mb-4">Grievance Status</p>
            <div className="h-44 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={GRIEVANCE_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                    {GRIEVANCE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={10} formatter={(v: string) => <span style={{ fontSize: 12, color: '#3a2e1a' }}>{v}</span>} />
                  <Tooltip contentStyle={{ background: '#F5EBD7', border: '1px solid #E8E2D0', borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard label="Avg Attendance" value="82%" color="#2F4F3A" />
          <MetricCard label="Avg Quiz Score" value="74%" color="#7DB7C9" />
          <MetricCard label="Low Attendance" value={73} sub="students" color="#D98282" />
          <MetricCard label="Assignments Submitted" value="89%" color="#2F4F3A" />
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-[#1a2e1e]">Admin Dashboard</h1>
        <p className="text-sm text-[#7a6a55] mt-0.5">SmartClass — Institution Overview</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard label="Students" value={ADMIN_STATS.totalStudents} icon={Users} onClick={() => onNavigate('admin-users')} />
        <MetricCard label="Faculty" value={ADMIN_STATS.totalFaculty} icon={Users} color="#7DB7C9" onClick={() => onNavigate('admin-users')} />
        <MetricCard label="Classes" value={ADMIN_STATS.totalClasses} icon={BookOpen} color="#7a6000" onClick={() => onNavigate('admin-classes')} />
        <MetricCard label="Courses" value={ADMIN_STATS.totalCourses} icon={BookOpen} color="#2a6a82" onClick={() => onNavigate('admin-classes')} />
        <MetricCard label="Classrooms" value={ADMIN_STATS.totalClassrooms} icon={Building2} onClick={() => onNavigate('admin-classrooms')} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-5 space-y-3">
          <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider">Attendance Overview</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-bold text-[#2F4F3A]">{ADMIN_STATS.avgAttendance}%</p>
            <div>
              <p className="text-xs text-[#7a6a55]">Institution average</p>
              <p className="text-xs text-[#D98282] font-semibold mt-0.5">{ADMIN_STATS.lowAttendanceCount} students below 75%</p>
            </div>
          </div>
          <ProgressBar value={ADMIN_STATS.avgAttendance} />
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider mb-3">Pending Grievances</p>
          <p className="text-3xl font-bold text-[#D98282]">{ADMIN_STATS.pendingGrievances}</p>
          <p className="text-xs text-[#7a6a55] mt-1">Require attention</p>
          <button onClick={() => onNavigate('admin-grievances')} className="text-xs text-[#2F4F3A] font-semibold hover:underline mt-3 block">Review →</button>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider mb-3">Upcoming Events</p>
          <p className="text-3xl font-bold text-[#7DB7C9]">{ADMIN_STATS.upcomingEvents}</p>
          <p className="text-xs text-[#7a6a55] mt-1">This month</p>
          <button onClick={() => onNavigate('calendar')} className="text-xs text-[#2F4F3A] font-semibold hover:underline mt-3 block">View calendar →</button>
        </Card>
      </div>

      <Card className="p-5">
        <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider mb-4">Attendance by Department</p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DEPT_ATTENDANCE}>
              <XAxis dataKey="dept" tick={{ fontSize: 12, fill: '#7a6a55' }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#7a6a55' }} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Avg Attendance']} contentStyle={{ background: '#F5EBD7', border: '1px solid #E8E2D0', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="avg" fill="#2F4F3A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
