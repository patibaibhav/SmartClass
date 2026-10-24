import React, { useState } from 'react';
import Login from './pages/Login';
import Layout, { type Page } from './components/Layout';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CouncilDashboard from './pages/CouncilDashboard';
import AttendancePage from './pages/AttendancePage';
import FacultyAttendancePage from './pages/FacultyAttendancePage';
import TimetablePage from './pages/TimetablePage';
import AssignmentsPage from './pages/AssignmentsPage';
import QuizzesPage from './pages/QuizzesPage';
import StudyMaterialPage from './pages/StudyMaterialPage';
import ResultsPage from './pages/ResultsPage';
import CalendarPage from './pages/CalendarPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ForumsPage from './pages/ForumsPage';
import GrievancesPage from './pages/GrievancesPage';
import ClassroomAvailabilityPage from './pages/ClassroomAvailabilityPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import MyClassPage from './pages/MyClassPage';
import type { User } from './data/mock';
import { api } from './services/api';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [unreadCount, setUnreadCount] = useState<number>(0);

  React.useEffect(() => {
    if (user) {
      api.getNotifications().then(data => {
        if (Array.isArray(data)) {
          setUnreadCount(data.filter((n: any) => !n.read).length);
        }
      }).catch(() => setUnreadCount(0));
    }
  }, [user, currentPage]);

  function handleLogin(u: User) {
    setUser(u);
    setCurrentPage('dashboard');
  }

  function handleLogout() {
    setUser(null);
    setCurrentPage('dashboard');
  }

  function navigate(page: string) {
    setCurrentPage(page as Page);
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const unread = unreadCount;

  function renderPage() {
    // Role-aware page rendering
    switch (currentPage) {
      case 'dashboard':
        if (user!.role === 'student') return <StudentDashboard onNavigate={navigate} userName={user!.name} />;
        if (user!.role === 'faculty') return <FacultyDashboard onNavigate={navigate} userName={user!.name} isHOD={user!.isHOD} />;
        if (user!.role === 'admin') return <AdminDashboard onNavigate={navigate} currentPage="dashboard" />;
        if (user!.role === 'council') return <CouncilDashboard onNavigate={navigate} userName={user!.name} currentPage="dashboard" />;
        return null;

      case 'my-class':
        return <MyClassPage role={user!.role} onNavigate={navigate} />;

      case 'attendance':
        return <AttendancePage />;

      case 'faculty-attendance':
        return <FacultyAttendancePage />;

      case 'timetable':
        return <TimetablePage role={user!.role} onAddLecture={() => navigate('faculty-attendance')} />;

      case 'assignments':
        return <AssignmentsPage role={user!.role} />;

      case 'quizzes':
        return <QuizzesPage />;

      case 'study-material':
        return <StudyMaterialPage role={user!.role} />;

      case 'results':
        return <ResultsPage role={user!.role} />;

      case 'calendar':
        return <CalendarPage />;

      case 'announcements':
        return <AnnouncementsPage role={user!.role} />;

      case 'forums':
        return <ForumsPage role={user!.role} />;

      case 'grievances':
        return <GrievancesPage role={user!.role} />;

      case 'admin-grievances':
        return <GrievancesPage role="admin" />;

      case 'classroom-availability':
        return <ClassroomAvailabilityPage />;

      case 'profile':
        return <ProfilePage user={user!} onLogout={handleLogout} />;

      case 'notifications':
        return <NotificationsPage />;

      case 'admin-users':
        return <AdminDashboard onNavigate={navigate} currentPage="admin-users" />;

      case 'admin-classes':
        return <AdminDashboard onNavigate={navigate} currentPage="admin-classes" />;

      case 'admin-analytics':
        return <AdminDashboard onNavigate={navigate} currentPage="admin-analytics" />;

      case 'admin-classrooms':
        return <ClassroomAvailabilityPage />;

      case 'defaulters':
        return <FacultyAttendancePage />;

      case 'council-events':
        return <CouncilDashboard onNavigate={navigate} userName={user!.name} currentPage="council-events" />;

      case 'council-create-event':
        return <CouncilDashboard onNavigate={navigate} userName={user!.name} currentPage="council-create-event" />;

      case 'extra-lecture':
        return <FacultyAttendancePage />;

      case 'substitute-lecture':
        return <FacultyAttendancePage />;

      default:
        return (
          <div className="p-6 text-center">
            <p className="text-[#7a6a55]">Page not found</p>
            <button onClick={() => navigate('dashboard')} className="mt-4 text-sm text-[#2F4F3A] font-semibold hover:underline">Back to Dashboard</button>
          </div>
        );
    }
  }

  return (
    <Layout
      user={user}
      currentPage={currentPage}
      onNavigate={navigate}
      onLogout={handleLogout}
      notificationCount={unread}
      onNotifications={() => navigate('notifications')}
    >
      {renderPage()}
    </Layout>
  );
}
