import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Compass,
  Megaphone,
  Calendar,
  Users,
  Building2,
  Search,
  MapPin,
  Clock,
  Mail,
  Shield,
  Briefcase,
  BookOpen,
  Pin
} from 'lucide-react';

export default function ExplorerView() {
  const [activeTab, setActiveTab] = useState('announcements'); // 'announcements' | 'events' | 'faculty-directory' | 'campus-info'
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [facultyDirectory, setFacultyDirectory] = useState([]);
  const [campusInfo, setCampusInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAllExplorerData();
  }, []);

  const fetchAllExplorerData = async () => {
    try {
      setLoading(true);
      const [annRes, evRes, facRes, campRes] = await Promise.all([
        api.get('/explorer/announcements'),
        api.get('/explorer/events'),
        api.get('/explorer/faculty-directory'),
        api.get('/explorer/campus-info')
      ]);

      setAnnouncements(annRes.data);
      setEvents(evRes.data);
      setFacultyDirectory(facRes.data);
      setCampusInfo(campRes.data);
    } catch (err) {
      console.error('Failed to load explorer data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Explorer Header */}
      <div className="bg-gradient-to-r from-slate-900 via-iiit-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-inner">
              <Compass className="w-8 h-8 text-iiit-300 animate-spin-slow" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-iiit-500/20 text-iiit-300 text-xs font-bold border border-iiit-500/30 mb-1">
                Campus Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Campus Explorer</h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-0.5">Discover announcements, upcoming events, faculty directory, and campus facilities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Explorer Tab Navigation */}
      <div className="flex items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center space-x-1">
          {[
            { id: 'announcements', label: 'Announcements & Circulars', icon: Megaphone, count: announcements.length },
            { id: 'events', label: 'Campus Events & Fests', icon: Calendar, count: events.length },
            { id: 'faculty-directory', label: 'Faculty Directory', icon: Users, count: facultyDirectory.length },
            { id: 'campus-info', label: 'Campus Facilities', icon: Building2, count: campusInfo.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-iiit-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${isActive ? 'bg-iiit-700 text-white font-extrabold' : 'bg-slate-100 text-slate-600'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[200px] hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in explorer..."
            className="text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 w-full focus:outline-hidden focus:ring-2 focus:ring-iiit-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-iiit-600"></div>
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* 1. ANNOUNCEMENTS TAB */}
          {/* ======================================================== */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              {announcements
                .filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.content.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((a) => (
                  <div
                    key={a.id}
                    className={`bg-white rounded-2xl p-6 border shadow-sm transition-all hover:shadow-md ${
                      a.is_pinned === 1 ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200">
                          {a.category}
                        </span>
                        {a.is_pinned === 1 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-lg border border-amber-300">
                            <Pin className="w-3 h-3 rotate-45" /> Pinned
                          </span>
                        )}
                        <span className="text-xs font-semibold text-slate-400 font-mono">{a.published_date}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">Issued by: <strong>{a.author_name}</strong></span>
                    </div>

                    <h2 className="text-lg font-extrabold text-slate-900 mb-2">{a.title}</h2>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{a.content}</p>
                  </div>
                ))}
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. CAMPUS EVENTS TAB */}
          {/* ======================================================== */}
          {activeTab === 'events' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events
                .filter(e => (e.title || e.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (e.description || '').toLowerCase().includes(searchQuery.toLowerCase()))
                .map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {ev.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-bold text-rose-600 font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{ev.date || ev.eventDate}</span>
                        </div>
                      </div>

                      <h3 className="font-extrabold text-lg text-slate-900">{ev.title || ev.name}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{ev.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700 font-mono">{ev.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span className="font-semibold text-slate-800">{ev.venue || ev.location}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 pt-1">
                        Organized by: <strong className="text-slate-600">{ev.organizer}</strong>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. FACULTY DIRECTORY TAB */}
          {/* ======================================================== */}
          {activeTab === 'faculty-directory' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facultyDirectory
                .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.department.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((f) => (
                  <div
                    key={f.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:border-iiit-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={f.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.faculty_code}`}
                        alt={f.name}
                        className="w-14 h-14 rounded-2xl border border-slate-200 bg-slate-100 shrink-0"
                      />
                      <div>
                        <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {f.faculty_code}
                        </span>
                        <h3 className="font-bold text-base text-slate-900 mt-1">{f.name}</h3>
                        <p className="text-xs text-indigo-700 font-semibold">{f.designation}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{f.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>Office: <strong>{f.office_room || 'CC3'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-[11px] text-slate-700">{f.email}</span>
                      </div>
                    </div>

                    {f.subjects && f.subjects.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">Courses Instructed:</div>
                        <div className="flex flex-wrap gap-1">
                          {f.subjects.map((sub, idx) => (
                            <span key={idx} className="font-mono text-[10px] font-bold bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                              {sub.code} ({sub.branch} Y{sub.year})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. CAMPUS FACILITIES & INFO TAB */}
          {/* ======================================================== */}
          {activeTab === 'campus-info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campusInfo
                .filter(c => (c.name || c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.description || '').toLowerCase().includes(searchQuery.toLowerCase()))
                .map((facility, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {facility.category}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-lg text-slate-900">{facility.name || facility.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{facility.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span className="font-semibold text-slate-800">{facility.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-[11px] text-slate-600">{facility.timings || facility.openingHours}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
