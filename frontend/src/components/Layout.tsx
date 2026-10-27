import React, { useState } from 'react';
import {
  LayoutDashboard, BookOpen, ClipboardList, Clock, FileText,
  PenSquare, HelpCircle, BarChart2, Calendar, Megaphone,
  MessageSquare, AlertCircle, DoorOpen, Users, Building2,
  GraduationCap, Settings, Bell, Search, ChevronDown,
  LogOut, UserCircle, Shield, Zap, Menu, X, Star
} from 'lucide-react';
import type { Role, User } from '../types';
import { Avatar } from './ui';

type Page =
  | 'dashboard' | 'my-class' | 'attendance' | 'timetable' | 'study-material'
  | 'assignments' | 'quizzes' | 'results' | 'calendar' | 'announcements'
  | 'forums' | 'grievances' | 'classroom-availability' | 'profile' | 'notifications'
  | 'faculty-attendance' | 'defaulters' | 'extra-lecture' | 'substitute-lecture'
  | 'admin-users' | 'admin-classes' | 'admin-courses' | 'admin-analytics' | 'admin-classrooms' | 'admin-grievances'
  | 'council-events' | 'council-create-event';

interface NavItem {
  page: Page;
  label: string;
  icon: React.ElementType;
}

const STUDENT_NAV: NavItem[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'my-class', label: 'My Class', icon: GraduationCap },
  { page: 'attendance', label: 'Attendance', icon: ClipboardList },
  { page: 'timetable', label: 'Timetable', icon: Clock },
  { page: 'study-material', label: 'Study Material', icon: FileText },
  { page: 'assignments', label: 'Assignments', icon: PenSquare },
  { page: 'quizzes', label: 'Quizzes', icon: HelpCircle },
  { page: 'results', label: 'Results', icon: BarChart2 },
  { page: 'calendar', label: 'Calendar', icon: Calendar },
  { page: 'announcements', label: 'Announcements', icon: Megaphone },
  { page: 'forums', label: 'Discussion Forums', icon: MessageSquare },
  { page: 'grievances', label: 'Grievances', icon: AlertCircle },
  { page: 'classroom-availability', label: 'Classroom Finder', icon: DoorOpen },
];

const FACULTY_NAV: NavItem[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'my-class', label: 'My Classes', icon: GraduationCap },
  { page: 'faculty-attendance', label: 'Attendance', icon: ClipboardList },
  { page: 'timetable', label: 'Timetable', icon: Clock },
  { page: 'study-material', label: 'Study Material', icon: FileText },
  { page: 'assignments', label: 'Assignments', icon: PenSquare },
  { page: 'quizzes', label: 'Quizzes', icon: HelpCircle },
  { page: 'results', label: 'Results', icon: BarChart2 },
  { page: 'calendar', label: 'Calendar', icon: Calendar },
  { page: 'announcements', label: 'Announcements', icon: Megaphone },
  { page: 'forums', label: 'Discussion Forums', icon: MessageSquare },
  { page: 'classroom-availability', label: 'Classroom Finder', icon: DoorOpen },
];

const ADMIN_NAV: NavItem[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'admin-users', label: 'Users', icon: Users },
  { page: 'admin-classes', label: 'Classes & Courses', icon: BookOpen },
  { page: 'timetable', label: 'Timetable', icon: Clock },
  { page: 'admin-classrooms', label: 'Classrooms', icon: Building2 },
  { page: 'attendance', label: 'Attendance Overview', icon: ClipboardList },
  { page: 'admin-analytics', label: 'Academic Analytics', icon: BarChart2 },
  { page: 'announcements', label: 'Announcements', icon: Megaphone },
  { page: 'calendar', label: 'Calendar', icon: Calendar },
  { page: 'admin-grievances', label: 'Grievances', icon: AlertCircle },
];

const COUNCIL_NAV: NavItem[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'council-events', label: 'Events', icon: Star },
  { page: 'calendar', label: 'Calendar', icon: Calendar },
  { page: 'announcements', label: 'Announcements', icon: Megaphone },
];

const NAV_MAP: Record<Role, NavItem[]> = {
  student: STUDENT_NAV,
  faculty: FACULTY_NAV,
  admin: ADMIN_NAV,
  council: COUNCIL_NAV,
};

interface LayoutProps {
  user: User;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  children: React.ReactNode;
  notificationCount?: number;
  onNotifications?: () => void;
  pageTitle?: string;
}

export default function Layout({ user, currentPage, onNavigate, onLogout, children, notificationCount = 0, onNotifications, pageTitle }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navItems = NAV_MAP[user.role];

  const roleLabel = user.role === 'faculty' ? (user.isHOD ? 'Faculty · HOD' : 'Faculty') :
    user.role === 'student' ? 'Student' :
    user.role === 'admin' ? 'Administrator' : 'Council Head';

  const currentLabel = navItems.find(n => n.page === currentPage)?.label || pageTitle || 'SmartClass';

  return (
    <div className="flex h-full bg-[#F4F1E6] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        w-[240px] bg-[#243B2D] flex flex-col
        transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        shrink-0
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#2F4F3A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E8D36A] flex items-center justify-center">
              <BookOpen size={16} className="text-[#243B2D]" />
            </div>
            <div>
              <p className="text-[#F4F1E6] font-bold text-base leading-tight">SmartClass</p>
              <p className="text-[#7a9a80] text-[10px] uppercase tracking-widest">Academic Platform</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-0.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = currentPage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => { onNavigate(item.page); setSidebarOpen(false); }}
                  className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left ${
                    active
                      ? 'bg-[#2F4F3A] text-[#F4F1E6]'
                      : 'text-[#9abaaa] hover:bg-[#2F4F3A] hover:text-[#F4F1E6]'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-[#E8D36A]' : ''} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* HOD section */}
          {user.role === 'faculty' && user.isHOD && (
            <div className="mt-4 pt-4 border-t border-[#2F4F3A]">
              <p className="text-[10px] text-[#5a7a60] uppercase tracking-widest px-3 mb-2">HOD Access</p>
              <button
                onClick={() => { onNavigate('admin-analytics'); setSidebarOpen(false); }}
                className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left ${currentPage === 'admin-analytics' ? 'bg-[#2F4F3A] text-[#F4F1E6]' : 'text-[#9abaaa] hover:bg-[#2F4F3A] hover:text-[#F4F1E6]'}`}
              >
                <BarChart2 size={16} />
                Department Analytics
              </button>
              <button
                onClick={() => { onNavigate('admin-grievances'); setSidebarOpen(false); }}
                className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left ${currentPage === 'admin-grievances' ? 'bg-[#2F4F3A] text-[#F4F1E6]' : 'text-[#9abaaa] hover:bg-[#2F4F3A] hover:text-[#F4F1E6]'}`}
              >
                <AlertCircle size={16} />
                Grievances
              </button>
            </div>
          )}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-[#2F4F3A]">
          <button
            onClick={() => { onNavigate('profile'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#2F4F3A] transition-colors"
          >
            <Avatar name={user.name} size="sm" />
            <div className="flex-1 text-left min-w-0">
              <p className="text-[#F4F1E6] text-xs font-semibold truncate">{user.name}</p>
              <p className="text-[#7a9a80] text-[10px]">{roleLabel}</p>
            </div>
            <Settings size={13} className="text-[#5a7a60] shrink-0" />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-[#F4F1E6] border-b border-[#E8E2D0] px-5 py-3.5 flex items-center gap-4 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#2F4F3A] hover:bg-[#E8E2D0] p-1.5 rounded-lg transition-colors">
            <Menu size={20} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-[#1a2e1e] truncate">{currentLabel}</h1>
            <p className="text-[10px] text-[#9a8a75] hidden sm:block">
              {user.name} · {user.class || user.department}
            </p>
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-[#F5EBD7] border border-[#E8E2D0] rounded-xl px-3 py-2 w-52">
            <Search size={14} className="text-[#9a8a75] shrink-0" />
            <input placeholder="Search..." className="bg-transparent text-sm text-[#1a2e1e] placeholder:text-[#b0a090] focus:outline-none w-full" />
          </div>

          {/* Notifications */}
          <button
            onClick={onNotifications}
            className="relative p-2 rounded-xl text-[#5a4a35] hover:bg-[#E8E2D0] transition-colors"
          >
            <Bell size={18} />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#D98282] rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-xl hover:bg-[#E8E2D0] transition-colors p-1.5"
            >
              <Avatar name={user.name} size="sm" />
              <ChevronDown size={14} className="text-[#7a6a55] hidden sm:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#F5EBD7] border border-[#E8E2D0] rounded-2xl shadow-lg z-50 overflow-hidden" onClick={() => setProfileOpen(false)}>
                <div className="px-4 py-3 border-b border-[#E8E2D0]">
                  <p className="text-sm font-semibold text-[#1a2e1e]">{user.name}</p>
                  <p className="text-xs text-[#7a6a55]">{user.id} · {roleLabel}</p>
                </div>
                <button onClick={() => onNavigate('profile')} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#3a2e1a] hover:bg-[#E8E2D0] transition-colors">
                  <UserCircle size={15} /> My Profile
                </button>
                <button onClick={() => onNavigate('notifications')} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#3a2e1a] hover:bg-[#E8E2D0] transition-colors">
                  <Bell size={15} /> Notifications
                </button>
                <div className="border-t border-[#E8E2D0]">
                  <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#D98282] hover:bg-[#fdf0f0] transition-colors">
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export type { Page };
