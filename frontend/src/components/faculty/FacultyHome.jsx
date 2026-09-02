import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Users,
  BookOpen,
  FileCheck,
  Megaphone,
  ArrowRight,
  AlertCircle,
  Mail,
  ShieldAlert
} from 'lucide-react';

export default function FacultyHome({ setActiveTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFacultyHome();
  }, []);

  const fetchFacultyHome = async () => {
    try {
      setLoading(true);
      const res = await api.get('/faculty/home');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load faculty home', err);
      setError('Unable to load faculty dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-iiit-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="font-semibold">{error || 'Unable to display faculty dashboard'}</p>
      </div>
    );
  }

  const { faculty, todaySchedule, assignedSubjects, totalAssignments, announcements } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Faculty Profile Card - Strictly Faculty Identity */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-iiit-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={faculty.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${faculty.facultyCode}`}
              alt={faculty.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-white/20 bg-white/10 p-1 shadow-inner"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-xs font-semibold mb-1 border border-indigo-500/40">
                <Briefcase className="w-3.5 h-3.5" /> {faculty.designation}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{faculty.name}</h1>
              <p className="text-slate-300 text-xs sm:text-sm font-medium mt-0.5">{faculty.department}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Faculty Code</div>
              <div className="text-sm font-bold font-mono text-amber-300">{faculty.facultyCode}</div>
            </div>
            <div className="h-8 w-px bg-white/20 mx-1"></div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Office Room</div>
              <div className="text-sm font-bold">{faculty.officeRoom || 'CC3'}</div>
            </div>
            <div className="h-8 w-px bg-white/20 mx-1"></div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Email</div>
              <div className="text-xs font-medium text-slate-200 font-mono">{faculty.email}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Courses</p>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">{assignedSubjects.length}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Active teaching load</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Lectures</p>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">{todaySchedule.classes?.length || 0}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Scheduled on {todaySchedule.day}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assignments Created</p>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">{totalAssignments}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Active course deliverables</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: Today's Teaching Schedule + Assigned Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Teaching Schedule */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Teaching Schedule ({todaySchedule.day})
              </h2>
              <p className="text-xs text-slate-500">Lectures & labs assigned to you today</p>
            </div>
            <button
              onClick={() => setActiveTab('timetable')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Full Timetable <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {todaySchedule.classes && todaySchedule.classes.length > 0 ? (
              todaySchedule.classes.map((cls) => (
                <div
                  key={cls.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                        {cls.subject_code}
                      </span>
                      <span className="font-bold text-sm text-slate-800">{cls.subject_name}</span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="font-semibold text-slate-700">
                        {cls.branch} • Year {cls.year} • Sec {cls.section}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600 font-mono">
                        <Clock className="w-3 h-3" /> {cls.start_time} - {cls.end_time}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" /> {cls.room}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl">
                <Calendar className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                <p className="text-xs">No lectures scheduled for today ({todaySchedule.day})</p>
              </div>
            )}
          </div>
        </div>

        {/* Assigned Subjects & Quick Action to Control Panel */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Your Assigned Courses & Classes
              </h2>
              <p className="text-xs text-slate-500">Subjects you instruct this semester</p>
            </div>
            <button
              onClick={() => setActiveTab('control-panel')}
              className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1"
            >
              Control Panel <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {assignedSubjects.map((sub) => (
              <div
                key={sub.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                      {sub.code}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{sub.name}</h3>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span className="text-indigo-700 font-semibold">{sub.branch} Year {sub.year} Sec {sub.section}</span>
                    <span>•</span>
                    <span>{sub.credits} Credits</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">{sub.student_count} Enrolled Students</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('control-panel')}
                  className="px-3 py-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg"
                >
                  Manage
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Relevant Announcements */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-500" />
            Faculty Notices & Institute Circulars
          </h2>
          <button
            onClick={() => setActiveTab('explorer')}
            className="text-xs font-semibold text-iiit-600 hover:text-iiit-800 flex items-center gap-1"
          >
            Explorer <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements && announcements.length > 0 ? (
            announcements.map((notice) => (
              <div
                key={notice.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                    {notice.category}
                  </span>
                  <span className="text-[11px] text-slate-400">{notice.published_date}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-800">{notice.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2">{notice.content}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">No notices posted</p>
          )}
        </div>
      </div>
    </div>
  );
}
