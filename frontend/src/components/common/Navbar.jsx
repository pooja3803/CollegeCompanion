import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  FileText,
  Compass,
  Sliders,
  ShieldCheck,
  LogOut,
  Building2
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, role, logout } = useAuth();

  // Role-specific navigation tabs strictly according to role
  const getNavItems = () => {
    switch (role) {
      case 'student':
        return [
          { id: 'home', label: 'Home', icon: GraduationCap },
          { id: 'timetable', label: 'Timetable', icon: Calendar },
          { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
          { id: 'assignments', label: 'Assignments', icon: FileText },
          { id: 'explorer', label: 'Explorer', icon: Compass },
        ];
      case 'faculty':
        return [
          { id: 'home', label: 'Home', icon: Building2 },
          { id: 'timetable', label: 'Timetable', icon: Calendar },
          { id: 'control-panel', label: 'Faculty Control Panel', icon: Sliders },
          { id: 'explorer', label: 'Explorer', icon: Compass },
        ];
      case 'admin':
        return [
          { id: 'admin-dashboard', label: 'Admin Control Dashboard', icon: ShieldCheck },
          { id: 'explorer', label: 'Explorer', icon: Compass },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 rounded-full border border-amber-300">Admin</span>;
      case 'faculty':
        return <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 rounded-full border border-indigo-300">Faculty</span>;
      case 'student':
        return <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">Student</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-iiit-800 to-iiit-600 flex items-center justify-center text-white shadow-md shadow-iiit-600/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">IIIT Allahabad</span>
                {getRoleBadge()}
              </div>
              <p className="text-[11px] font-medium text-slate-500 leading-none">College Companion Portal</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-iiit-50 text-iiit-700 border border-iiit-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-iiit-600' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile Info & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pl-2">
              <img
                src={user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`}
                alt={user?.name}
                className="w-8 h-8 rounded-full border border-slate-200 bg-slate-100"
              />
              <div className="text-left leading-tight hidden lg:block">
                <div className="text-xs font-bold text-slate-800 truncate max-w-[140px]">{user?.name}</div>
                <div className="text-[10px] text-slate-500 capitalize">{role}</div>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center space-x-1 overflow-x-auto py-2 border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-iiit-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
