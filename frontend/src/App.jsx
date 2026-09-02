import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import LoginView from './components/auth/LoginView';

// Student Components
import StudentHome from './components/student/StudentHome';
import StudentTimetable from './components/student/StudentTimetable';
import StudentAttendance from './components/student/StudentAttendance';
import StudentAssignments from './components/student/StudentAssignments';

// Faculty Components
import FacultyHome from './components/faculty/FacultyHome';
import FacultyTimetable from './components/faculty/FacultyTimetable';
import FacultyControlPanel from './components/faculty/FacultyControlPanel';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';

// Shared Explorer Component
import ExplorerView from './components/explorer/ExplorerView';

export default function App() {
  const { user, role, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  // Adjust active tab automatically when role changes
  useEffect(() => {
    if (role === 'admin') {
      setActiveTab('admin-dashboard');
    } else if (role === 'faculty') {
      setActiveTab('home');
    } else if (role === 'student') {
      setActiveTab('home');
    }
  }, [role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-iiit-600 mx-auto"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Loading IIIT Allahabad Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  // Render role-specific content
  const renderContent = () => {
    // 1. Shared Explorer View
    if (activeTab === 'explorer') {
      return <ExplorerView />;
    }

    // 2. Student Role Views
    if (role === 'student') {
      switch (activeTab) {
        case 'home':
          return <StudentHome setActiveTab={setActiveTab} />;
        case 'timetable':
          return <StudentTimetable />;
        case 'attendance':
          return <StudentAttendance />;
        case 'assignments':
          return <StudentAssignments />;
        default:
          return <StudentHome setActiveTab={setActiveTab} />;
      }
    }

    // 3. Faculty Role Views
    if (role === 'faculty') {
      switch (activeTab) {
        case 'home':
          return <FacultyHome setActiveTab={setActiveTab} />;
        case 'timetable':
          return <FacultyTimetable />;
        case 'control-panel':
          return <FacultyControlPanel />;
        default:
          return <FacultyHome setActiveTab={setActiveTab} />;
      }
    }

    // 4. Admin Role Views
    if (role === 'admin') {
      switch (activeTab) {
        case 'admin-dashboard':
          return <AdminDashboard />;
        default:
          return <AdminDashboard />;
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-iiit-100 selection:text-iiit-900">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {renderContent()}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Indian Institute of Information Technology, Allahabad. All rights reserved.</p>
          <p className="text-[11px] text-slate-400 font-mono">Devrajghat, Jhalwa, Prayagraj, UP 211015</p>
        </div>
      </footer>
    </div>
  );
}
