import React, {
  useState,
  useEffect
} from 'react';

import { useAuth } from './context/AuthContext';

import Navbar from './components/common/Navbar';
import LoginView from './components/auth/LoginView';

// Student

import StudentHome from './components/student/StudentHome';
import StudentTimetable from './components/student/StudentTimetable';
import StudentAttendance from './components/student/StudentAttendance';
import StudentAssignments from './components/student/StudentAssignments';

// Faculty

import FacultyHome from './components/faculty/FacultyHome';
import FacultyTimetable from './components/faculty/FacultyTimetable';
import FacultyControlPanel from './components/faculty/FacultyControlPanel';

// Admin

import AdminDashboard from './components/admin/AdminDashboard';

// Explorer

import ExplorerView from './components/explorer/ExplorerView';


export default function App() {

  const {
    user,
    role,
    loading
  } = useAuth();


  const [activeTab, setActiveTab] =
    useState('home');


  useEffect(() => {

    if (role === 'admin') {
      setActiveTab('admin-dashboard');
    }

    if (
      role === 'student' ||
      role === 'faculty'
    ) {
      setActiveTab('home');
    }

  }, [role]);


  if (loading) {

    return (

      <div className="min-h-screen bg-slate-50 flex items-center justify-center">

        <div className="text-center space-y-3">

          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-iiit-600 mx-auto" />

          <p className="text-xs font-bold text-slate-500">

            Loading IIIT Allahabad Portal...

          </p>

        </div>

      </div>

    );
  }


  if (!user) {
    return <LoginView />;
  }


  const renderContent = () => {


    // Explorer

    if (activeTab === 'explorer') {
      return <ExplorerView />;
    }


    // Student

    if (role === 'student') {

      switch (activeTab) {

        case 'home':
          return (
            <StudentHome
              setActiveTab={setActiveTab}
            />
          );

        case 'timetable':
          return <StudentTimetable />;

        case 'attendance':
          return <StudentAttendance />;

        case 'assignments':
          return <StudentAssignments />;

        default:
          return (
            <StudentHome
              setActiveTab={setActiveTab}
            />
          );
      }
    }


    // Faculty

    if (role === 'faculty') {

      switch (activeTab) {

        case 'home':
          return (
            <FacultyHome
              setActiveTab={setActiveTab}
            />
          );

        case 'timetable':
          return <FacultyTimetable />;

        case 'control-panel':
          return <FacultyControlPanel />;

        default:
          return (
            <FacultyHome
              setActiveTab={setActiveTab}
            />
          );
      }
    }


    // Admin

    if (role === 'admin') {

      return <AdminDashboard />;

    }


    return null;
  };


  return (

    <div className="min-h-screen bg-slate-50 flex flex-col">

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />


      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {renderContent()}

      </main>


      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">

        © 2026 Indian Institute of Information Technology, Allahabad.

      </footer>


    </div>

  );
}