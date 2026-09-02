import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, Clock, MapPin, Users, BookOpen, AlertCircle, Briefcase } from 'lucide-react';

export default function FacultyTimetable() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('All');
  const [error, setError] = useState(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    fetchFacultyTimetable();
  }, []);

  const fetchFacultyTimetable = async () => {
    try {
      setLoading(true);
      const res = await api.get('/faculty/timetable');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load faculty timetable', err);
      setError('Unable to load faculty teaching timetable');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="font-semibold">{error || 'Unable to display timetable'}</p>
      </div>
    );
  }

  const { facultyName, department, timetable } = data;

  const filteredEntries = selectedDay === 'All'
    ? timetable
    : timetable.filter(e => e.day_of_week === selectedDay);

  const groupedByDay = days.reduce((acc, day) => {
    acc[day] = timetable.filter(e => e.day_of_week === day);
    return acc;
  }, {});

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Teaching Timetable</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
              Personal Teaching Schedule
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Classes assigned to {facultyName} ({department})
          </p>
        </div>

        {/* Day Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedDay('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedDay === 'All'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Days
          </button>
          {days.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDay === day
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Timetable Schedule Cards */}
      {selectedDay === 'All' ? (
        <div className="space-y-6">
          {days.map(day => {
            const dayEntries = groupedByDay[day] || [];
            return (
              <div key={day} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    {day}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{dayEntries.length} Assigned Lectures</span>
                </div>

                <div className="p-6">
                  {dayEntries.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dayEntries.map((cls) => (
                        <div
                          key={cls.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono text-xs font-bold">
                              {cls.subject_code}
                            </span>
                            <span className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                              <MapPin className="w-3 h-3 text-rose-500" /> {cls.room}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-bold text-sm text-slate-900">{cls.subject_name}</h3>
                            <div className="text-xs text-indigo-700 font-semibold flex items-center gap-1.5 mt-1 bg-indigo-50 px-2 py-1 rounded-lg">
                              <Users className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Class: {cls.branch} • Year {cls.year} • Sec {cls.section}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-mono font-medium text-slate-600">
                            <span className="flex items-center gap-1 text-indigo-700 font-bold">
                              <Clock className="w-3.5 h-3.5" /> {cls.start_time} - {cls.end_time}
                            </span>
                            <span className="text-[11px] text-slate-400">{cls.credits} Credits</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">No teaching load scheduled on {day}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            {selectedDay} Lectures
          </h2>

          {filteredEntries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntries.map((cls) => (
                <div
                  key={cls.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono text-xs font-bold">
                      {cls.subject_code}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      <MapPin className="w-3 h-3 text-rose-500" /> {cls.room}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{cls.subject_name}</h3>
                    <div className="text-xs text-indigo-700 font-semibold flex items-center gap-1.5 mt-1 bg-indigo-50 px-2 py-1 rounded-lg">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Class: {cls.branch} • Year {cls.year} • Sec {cls.section}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-mono font-medium text-slate-600">
                    <span className="flex items-center gap-1 text-indigo-700 font-bold">
                      <Clock className="w-3.5 h-3.5" /> {cls.start_time} - {cls.end_time}
                    </span>
                    <span className="text-[11px] text-slate-400">{cls.credits} Credits</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No teaching slots on {selectedDay}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
