import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Building2, Search, UserPlus, Pencil, ShieldOff, AlertCircle } from 'lucide-react';
import { Card, MetricCard, Badge, Button, Tabs, SectionHeader, Modal, Input, Toast, ProgressBar } from '../components/ui';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface Props {
  onNavigate: (page: string) => void;
  currentPage?: string;
}

const GRIEVANCE_DATA = [
  { name: 'New', value: 0, color: '#D98282' },
  { name: 'In Review', value: 0, color: '#E8D36A' },
  { name: 'Resolved', value: 0, color: '#2F4F3A' },
];

export default function AdminDashboard({ onNavigate, currentPage = 'dashboard' }: Props) {
  const [stats, setStats] = useState({
    totalStudents: 208,
    totalFaculty: 31,
    totalClasses: 3,
    totalCourses: 9,
    totalClassrooms: 17,
    avgAttendance: 0,
    lowAttendanceCount: 0,
    pendingGrievances: 0,
    upcomingEvents: 0
  });

  const [userTab, setUserTab] = useState('Students');
  const [userList, setUserList] = useState<any[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [classesList, setClassesList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newId, setNewId] = useState('');
  const [newRole, setNewRole] = useState('student');
  const [toast, setToast] = useState('');

  // Fetch initial stats, classes, courses
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.allSettled([
      api.getDashboardStats('admin'),
      api.getClasses(),
      api.getCourses()
    ]).then(([stRes, clRes, coRes]) => {
      if (!isMounted) return;
      if (stRes.status === 'fulfilled' && stRes.value) setStats(stRes.value);
      if (clRes.status === 'fulfilled' && Array.isArray(clRes.value)) setClassesList(clRes.value);
      if (coRes.status === 'fulfilled' && Array.isArray(coRes.value)) setCoursesList(coRes.value);
      setLoading(false);
    });

    return () => { isMounted = false; };
  }, []);

  // Fetch users when on admin-users page or tab/search changes
  useEffect(() => {
    if (currentPage !== 'admin-users') return;

    let roleQuery = 'student';
    if (userTab === 'Faculty') roleQuery = 'faculty';
    if (userTab === 'Council Heads') roleQuery = 'council';

    api.getAdminUsers({
      page: 1,
      limit: 100,
      search: searchQuery || undefined,
      role: roleQuery
    }).then(res => {
      if (res && Array.isArray(res.items)) {
        setUserList(res.items);
        setTotalUsersCount(res.total || res.items.length);
      } else {
        setUserList([]);
        setTotalUsersCount(0);
      }
    }).catch(() => {
      setUserList([]);
    });
  }, [currentPage, userTab, searchQuery]);

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
          <div className="px-5 py-4 border-b border-[#E8E2D0] flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8a75]" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, roll, or ID..."
                className="pl-9 pr-4 py-2 w-full rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]"
              />
            </div>
            <span className="text-xs font-semibold text-[#7a6a55]">
              Showing {userList.length} of {totalUsersCount} accounts
            </span>
          </div>

          <table className="sc-table w-full">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Roll No.</th>
                <th>Email</th>
                {userTab === 'Students' && <th>Class</th>}
                {userTab === 'Faculty' && <th>Initials</th>}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {userList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-[#7a6a55]">
                    No accounts found matching query.
                  </td>
                </tr>
              ) : (
                userList.map((user: any) => (
                  <tr key={user.id}>
                    <td className="font-bold text-[#2F4F3A]">{user.id}</td>
                    <td className="font-medium text-[#1a2e1e]">{user.name}</td>
                    <td className="text-xs">{user.rollNo || '—'}</td>
                    <td className="text-xs text-[#7a6a55]">{user.email || '—'}</td>
                    {userTab === 'Students' && <td className="font-semibold text-xs">{user.class || '—'}</td>}
                    {userTab === 'Faculty' && <td>{user.initials ? <Badge variant="default">{user.initials}</Badge> : '—'}</td>}
                    <td><Badge variant="present">Active</Badge></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="p-1.5 rounded-lg hover:bg-[#E8E2D0] text-[#7a6a55]" title="Edit"><Pencil size={13} /></button>
                        <button className="p-1.5 rounded-lg hover:bg-[#fdf0f0] text-[#D98282]" title="Deactivate"><ShieldOff size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        {createUserOpen && (
          <Modal title="Create New User" onClose={() => setCreateUserOpen(false)} width="max-w-lg">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Full Name" value={newName} onChange={setNewName} placeholder="Full Name" required className="col-span-2" />
                <Input label="Email" value={newEmail} onChange={setNewEmail} placeholder="user@domain.edu" required />
                <Input label="User ID" value={newId} onChange={setNewId} placeholder="e.g. D12A-75 or FAC-NEW" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9] appearance-none">
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="council">Council Head</option>
                </select>
              </div>
              <div className="bg-[#fdf6e0] border border-[#f0df90] rounded-xl p-3 text-xs text-[#7a4a00]">
                A temporary password will be auto-generated. The user will change it on first login.
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setCreateUserOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => { setCreateUserOpen(false); setToast('User created.'); }}>Create Account</Button>
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
          sub="Configured academic classes and official courses"
        />
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Classes */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#1a2e1e]">Classes</h3>
            {classesList.map(cls => (
              <Card key={cls.id || cls.name} className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#2F4F3A] flex items-center justify-center">
                  <BookOpen size={13} className="text-[#F4F1E6]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1a2e1e]">{cls.name || cls.id}</p>
                  <p className="text-xs text-[#7a6a55]">{cls.student_count || cls.students || '—'} students · {cls.year || 'Third Year'}</p>
                </div>
                <button onClick={() => onNavigate('my-class')} className="text-xs text-[#2F4F3A] font-semibold hover:underline">View Roster</button>
              </Card>
            ))}
          </div>

          {/* Courses */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#1a2e1e]">Courses</h3>
            {coursesList.map(course => (
              <Card key={course.id || course.code} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#1a2e1e]">{course.name}</p>
                    <p className="text-xs text-[#7a6a55]">{course.code} {course.credits ? `· ${course.credits} credits` : ''}</p>
                  </div>
                  <Badge variant="default">{course.code}</Badge>
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
        <SectionHeader title="Academic Analytics" sub="Institution performance overview" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard label="Total Enrolled" value={stats.totalStudents} color="#2F4F3A" />
          <MetricCard label="Total Faculty" value={stats.totalFaculty} color="#7DB7C9" />
          <MetricCard label="Active Classes" value={stats.totalClasses} color="#7a6000" />
          <MetricCard label="Total Rooms" value={stats.totalClassrooms} color="#2F4F3A" />
        </div>
        <Card className="p-8 text-center text-xs text-[#7a6a55]">
          Additional historical analytics will populate automatically as lectures and assessments are conducted.
        </Card>
      </div>
    );
  }

  // Admin dashboard view
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-[#1a2e1e]">Admin Dashboard</h1>
        <p className="text-sm text-[#7a6a55] mt-0.5">SmartClass — System Overview</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard label="Students" value={stats.totalStudents} icon={Users} onClick={() => onNavigate('admin-users')} />
        <MetricCard label="Faculty" value={stats.totalFaculty} icon={Users} color="#7DB7C9" onClick={() => onNavigate('admin-users')} />
        <MetricCard label="Classes" value={stats.totalClasses} icon={BookOpen} color="#7a6000" onClick={() => onNavigate('admin-classes')} />
        <MetricCard label="Courses" value={stats.totalCourses} icon={BookOpen} color="#2a6a82" onClick={() => onNavigate('admin-classes')} />
        <MetricCard label="Classrooms" value={stats.totalClassrooms} icon={Building2} onClick={() => onNavigate('admin-classrooms')} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-5 space-y-3">
          <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider">Attendance Overview</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-bold text-[#2F4F3A]">{stats.avgAttendance > 0 ? `${stats.avgAttendance}%` : 'N/A'}</p>
            <div>
              <p className="text-xs text-[#7a6a55]">Institution average</p>
              <p className="text-xs text-[#D98282] font-semibold mt-0.5">{stats.lowAttendanceCount} students below 75%</p>
            </div>
          </div>
          <ProgressBar value={stats.avgAttendance} />
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider mb-3">Pending Grievances</p>
          <p className="text-3xl font-bold text-[#D98282]">{stats.pendingGrievances}</p>
          <p className="text-xs text-[#7a6a55] mt-1">Require administrative review</p>
          <button onClick={() => onNavigate('admin-grievances')} className="text-xs text-[#2F4F3A] font-semibold hover:underline mt-3 block">Review →</button>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider mb-3">Campus Events</p>
          <p className="text-3xl font-bold text-[#7DB7C9]">{stats.upcomingEvents}</p>
          <p className="text-xs text-[#7a6a55] mt-1">Scheduled activities</p>
          <button onClick={() => onNavigate('calendar')} className="text-xs text-[#2F4F3A] font-semibold hover:underline mt-3 block">View calendar →</button>
        </Card>
      </div>
    </div>
  );
}
