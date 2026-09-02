import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Megaphone,
  ArrowRight,
  BookOpen,
  MapPin,
  UserCheck
} from 'lucide-react';

export default function StudentHome({ setActiveTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/home');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load student home', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-iiit-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="font-semibold">{error || 'Unable to display dashboard'}</p>
      </div>
    );
  }

  const { student, todaySchedule, attendanceSummary, pendingAssignments, announcements } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Student Identity Card */}
      <div className="bg-gradient-to-r from-iiit-900 via-iiit-800 to-iiit-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={student.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.rollNumber}`}
              alt={student.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-white/20 bg-white/10 p-1 shadow-inner"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-1 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active Student
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{student.name}</h1>
              <p className="text-iiit-200 text-sm font-medium mt-0.5 font-mono">{student.rollNumber} • {student.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-iiit-200 font-bold">Branch</div>
              <div className="text-sm font-bold">{student.branch} ({student.branchCode})</div>
            </div>
            <div className="h-8 w-px bg-white/20 mx-1"></div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-iiit-200 font-bold">Academic Year</div>
              <div className="text-sm font-bold">Year {student.year}</div>
            </div>
            <div className="h-8 w-px bg-white/20 mx-1"></div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-iiit-200 font-bold">Section</div>
              <div className="text-sm font-bold text-amber-300">Section {student.section}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Attendance Overview + Pending Assignments Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Attendance Summary Widget */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-iiit-600" />
              Attendance Summary
            </h2>
            <button
              onClick={() => setActiveTab('attendance')}
              className="text-xs font-semibold text-iiit-600 hover:text-iiit-800 flex items-center gap-1"
            >
              View Details <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="my-5 flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div className="text-center">
                <span className={`text-4xl font-extrabold ${attendanceSummary.percentage >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {attendanceSummary.percentage}%
                </span>
                <p className="text-xs font-medium text-slate-500 mt-1">Overall Attendance</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center pt-3 border-t border-slate-100">
            <div className="bg-slate-50 p-2.5 rounded-xl">
              <div className="text-xs text-slate-500 font-medium">Attended</div>
              <div className="text-base font-bold text-slate-800">{attendanceSummary.totalAttended}</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl">
              <div className="text-xs text-slate-500 font-medium">Conducted</div>
              <div className="text-base font-bold text-slate-800">{attendanceSummary.totalConducted}</div>
            </div>
          </div>
        </div>

        {/* Today's Schedule Widget */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm md:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-iiit-600" />
                Today's Schedule ({todaySchedule.day})
              </h2>
              <p className="text-xs text-slate-500">Classes for Section {student.section}</p>
            </div>
            <button
              onClick={() => setActiveTab('timetable')}
              className="text-xs font-semibold text-iiit-600 hover:text-iiit-800 flex items-center gap-1"
            >
              Full Timetable <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {todaySchedule.classes && todaySchedule.classes.length > 0 ? (
              todaySchedule.classes.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-iiit-50/50 border border-slate-200/80 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="px-2.5 py-1.5 rounded-lg bg-iiit-100 text-iiit-800 text-xs font-bold font-mono">
                      {cls.start_time} - {cls.end_time}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-800">{cls.subject_name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>{cls.subject_code}</span>
                        <span>•</span>
                        <span>{cls.faculty_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{cls.room}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl">
                <Clock className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                <p className="text-xs">No lectures scheduled for today ({todaySchedule.day})</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Pending Assignments & Announcements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Assignments */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Pending Assignments
            </h2>
            <button
              onClick={() => setActiveTab('assignments')}
              className="text-xs font-semibold text-iiit-600 hover:text-iiit-800 flex items-center gap-1"
            >
              All Assignments <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {pendingAssignments && pendingAssignments.length > 0 ? (
              pendingAssignments.map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-xs transition-all flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="inline-block text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {a.subject_code} • {a.subject_name}
                    </div>
                    <div className="font-semibold text-sm text-slate-800">{a.title}</div>
                    <div className="text-xs text-rose-600 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Due: {a.due_date}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('assignments')}
                    className="px-3 py-1.5 bg-iiit-600 hover:bg-iiit-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    Submit
                  </button>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                <p className="text-xs">No pending assignments! All caught up.</p>
              </div>
            )}
          </div>
        </div>

        {/* Relevant Announcements */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-500" />
              Relevant Announcements
            </h2>
            <button
              onClick={() => setActiveTab('explorer')}
              className="text-xs font-semibold text-iiit-600 hover:text-iiit-800 flex items-center gap-1"
            >
              Explorer <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {announcements && announcements.length > 0 ? (
              announcements.map((notice) => (
                <div
                  key={notice.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-all space-y-1.5"
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
              <p className="text-xs text-slate-400 py-6 text-center">No announcements posted</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
