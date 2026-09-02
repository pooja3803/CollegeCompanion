import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronUp,
  UserCheck,
  ShieldAlert,
  Info
} from 'lucide-react';

export default function StudentAttendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/attendance');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load student attendance', err);
      setError('Unable to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (subjectId) => {
    if (expandedSubject === subjectId) {
      setExpandedSubject(null);
    } else {
      setExpandedSubject(subjectId);
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
        <p className="font-semibold">{error || 'Unable to display attendance'}</p>
      </div>
    );
  }

  const { overall, subjectWise } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Academic Attendance</h1>
          <p className="text-xs text-slate-500 mt-1">Live records maintained by respective faculty</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700">
          <Info className="w-4 h-4 text-iiit-600" />
          <span>75% minimum attendance required for End-Sem eligibility</span>
        </div>
      </div>

      {/* Overall Attendance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Percentage</p>
            <h2 className={`text-3xl font-extrabold mt-1 ${overall.percentage >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {overall.percentage}%
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {overall.percentage >= 75 ? 'Above institute threshold' : 'Below 75% threshold!'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${overall.percentage >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Classes Attended</p>
            <h2 className="text-3xl font-extrabold text-slate-800 mt-1">{overall.classesAttended}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Present across all subjects</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-iiit-100 text-iiit-700 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Conducted</p>
            <h2 className="text-3xl font-extrabold text-slate-800 mt-1">{overall.classesConducted}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Recorded lecture & lab sessions</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Subject-Wise Attendance Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Subject-Wise Attendance</h2>
            <p className="text-xs text-slate-500">Click any subject to view detailed date logs</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">{subjectWise.length} Subjects Enrolled</span>
        </div>

        <div className="divide-y divide-slate-200">
          {subjectWise.map((sub) => {
            const isExpanded = expandedSubject === sub.subjectId;
            const isSafe = sub.percentage >= 75;

            return (
              <div key={sub.subjectId} className="transition-colors hover:bg-slate-50/50">
                <div
                  onClick={() => toggleExpand(sub.subjectId)}
                  className="p-5 sm:p-6 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="px-3 py-2 bg-slate-100 rounded-xl font-mono font-bold text-sm text-slate-800 border border-slate-200">
                      {sub.subjectCode}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{sub.subjectName}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Faculty: {sub.facultyName || 'TBA'} • {sub.credits} Credits</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    {/* Classes Count */}
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-500 font-medium">Classes Attended</div>
                      <div className="text-sm font-bold text-slate-800">
                        {sub.classesAttended} / {sub.classesConducted}
                      </div>
                    </div>

                    {/* Progress Bar & Percentage */}
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isSafe ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-extrabold w-11 text-right ${isSafe ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {sub.percentage}%
                      </span>
                    </div>

                    {/* Expand Arrow */}
                    <button className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Date-by-Date History */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 bg-slate-50/70 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Session Attendance Log ({sub.history?.length || 0} Records)
                    </h4>

                    {sub.history && sub.history.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                        {sub.history.map((record, index) => {
                          const isPresent = record.status === 'Present';
                          return (
                            <div
                              key={index}
                              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
                                isPresent
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : 'bg-rose-50 border-rose-200 text-rose-800'
                              }`}
                            >
                              <span className="font-mono text-[11px]">{record.date}</span>
                              <span className="font-bold flex items-center gap-1">
                                {isPresent ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>P</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                    <span>A</span>
                                  </>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 py-3 text-center">No attendance sessions recorded yet for this course</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
