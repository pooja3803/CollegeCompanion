import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  ShieldCheck,
  Users,
  Briefcase,
  BookOpen,
  Calendar,
  Megaphone,
  Plus,
  Trash2,
  Edit,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  MapPin,
  Clock,
  Building2
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('subjects'); // 'subjects' | 'students' | 'faculty' | 'timetable' | 'notices' | 'events' | 'facilities'
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Datasets
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [facilities, setFacilities] = useState([]);

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // for editing events or facilities
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);
  const [actionErrorMsg, setActionErrorMsg] = useState(null);

  // Form states
  const [studentForm, setStudentForm] = useState({ name: '', email: '', rollNumber: '', branch: 'Information Technology', branchCode: 'IT', year: 3, section: 'A', password: 'password123' });
  const [facultyForm, setFacultyForm] = useState({ name: '', email: '', facultyCode: '', department: 'Department of Information Technology', designation: 'Associate Professor', officeRoom: 'CC3-401', password: 'password123' });
  const [subjectForm, setSubjectForm] = useState({ code: '', name: '', credits: 4, department: 'Information Technology', facultyId: '', branch: 'IT', year: 3, section: 'A' });
  const [timetableForm, setTimetableForm] = useState({ branch: 'IT', year: 3, section: 'A', subjectId: '', facultyId: '', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', room: 'LT-1' });
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', category: 'Academic', targetRole: 'all', isPinned: false });
  const [eventForm, setEventForm] = useState({ title: '', category: 'Technical', description: '', date: new Date().toISOString().split('T')[0], time: '10:00 AM', venue: '', organizer: 'IIIT Allahabad' });
  const [facilityForm, setFacilityForm] = useState({ name: '', category: 'Academic & Labs', description: '', location: '', timings: '09:00 AM - 05:00 PM' });

  // Academic branch, year, section presets
  const branchOptions = [
    { code: 'IT', name: 'Information Technology' },
    { code: 'ECE', name: 'Electronics & Communication Engineering' },
    { code: 'AI', name: 'Artificial Intelligence & Data Science' },
    { code: 'BI', name: 'Business Informatics' },
    { code: 'CSS', name: 'Computing & Software Systems' },
  ];

  const yearOptions = [1, 2, 3, 4, 5];
  const sectionOptions = ['A', 'B', 'C', 'D', 'E'];

  useEffect(() => {
    fetchStats();
    fetchDataForTab(activeTab);
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    }
  };

  const fetchDataForTab = async (tab) => {
    try {
      setLoading(true);
      if (tab === 'students') {
        const res = await api.get('/admin/students');
        setStudents(res.data);
      } else if (tab === 'faculty') {
        const res = await api.get('/admin/faculty');
        setFaculty(res.data);
      } else if (tab === 'subjects') {
        const [subRes, facRes] = await Promise.all([
          api.get('/admin/subjects'),
          api.get('/admin/faculty')
        ]);
        setSubjects(subRes.data);
        setFaculty(facRes.data);
        if (facRes.data.length > 0 && !subjectForm.facultyId) {
          setSubjectForm(prev => ({ ...prev, facultyId: facRes.data[0].id.toString() }));
        }
      } else if (tab === 'timetable') {
        const [ttRes, subRes, facRes] = await Promise.all([
          api.get('/admin/timetable'),
          api.get('/admin/subjects'),
          api.get('/admin/faculty')
        ]);
        setTimetable(ttRes.data);
        setSubjects(subRes.data);
        setFaculty(facRes.data);
        if (subRes.data.length > 0 && !timetableForm.subjectId) {
          setTimetableForm(prev => ({ ...prev, subjectId: subRes.data[0].id.toString(), facultyId: subRes.data[0].faculty_id?.toString() || (facRes.data[0]?.id?.toString() || '') }));
        }
      } else if (tab === 'notices') {
        const res = await api.get('/admin/notices');
        setNotices(res.data);
      } else if (tab === 'events') {
  const res = await api.get('/events');
  setEvents(res.data);
} else if (tab === 'facilities') {
  const res = await api.get('/facilities');
  setFacilities(res.data);
}
    } catch (err) {
      console.error(`Failed to load ${tab} data:`, err);
      const errMsg = err.response?.data?.message || err.message || `Failed to load ${tab} data`;
      showError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (msg) => {
    setActionSuccessMsg(msg);
    setActionErrorMsg(null);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const showError = (msg) => {
    setActionErrorMsg(msg);
    setActionSuccessMsg(null);
    setTimeout(() => setActionErrorMsg(null), 5000);
  };

  // ADD & EDIT HANDLERS

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setActionErrorMsg(null);
    try {
      await api.post('/admin/students', studentForm);
      showFeedback('Student created successfully in database!');
      setShowAddModal(false);
      await fetchDataForTab('students');
      await fetchStats();
    } catch (err) {
      console.error('Failed to add student:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to add student';
      showError(errMsg);
    }
  };

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    setActionErrorMsg(null);
    try {
      await api.post('/admin/faculty', facultyForm);
      showFeedback('Faculty created successfully in database!');
      setShowAddModal(false);
      await fetchDataForTab('faculty');
      await fetchStats();
    } catch (err) {
      console.error('Failed to add faculty:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to add faculty';
      showError(errMsg);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setActionErrorMsg(null);
    try {
      await api.post('/admin/subjects', subjectForm);
      showFeedback('Subject added successfully in database!');
      setShowAddModal(false);
      await fetchDataForTab('subjects');
      await fetchStats();
    } catch (err) {
      console.error('Failed to add subject:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to add subject';
      showError(errMsg);
    }
  };

  const handleAddTimetable = async (e) => {
    e.preventDefault();
    setActionErrorMsg(null);
    try {
      await api.post('/admin/timetable', timetableForm);
      showFeedback('Timetable entry created successfully in database!');
      setShowAddModal(false);
      await fetchDataForTab('timetable');
      await fetchStats();
    } catch (err) {
      console.error('Failed to add timetable slot:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to create timetable slot';
      showError(errMsg);
    }
  };

  const handleAddNotice = async (e) => {
    e.preventDefault();
    setActionErrorMsg(null);
    try {
      await api.post('/admin/notices', noticeForm);
      showFeedback('Notice published successfully in database!');
      setShowAddModal(false);
      await fetchDataForTab('notices');
      await fetchStats();
    } catch (err) {
      console.error('Failed to post notice:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to post notice';
      showError(errMsg);
    }
  };

  const handleSaveEvent = async (e) => {
  e.preventDefault();

  setActionErrorMsg(null);

  try {
    if (editingItem) {
      await api.put(`/events/${editingItem.id}`, eventForm);

      showFeedback('Event updated successfully!');
    } else {
      await api.post('/events', eventForm);

      showFeedback('Event created successfully!');
    }

    setShowAddModal(false);
    setEditingItem(null);

    setEventForm({
      title: '',
      category: 'Technical',
      description: '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00 AM',
      venue: '',
      organizer: 'IIIT Allahabad'
    });

    await fetchDataForTab('events');
    await fetchStats();

  } catch (err) {
    console.error(
      'Failed to save event:',
      err.response?.data || err.message
    );

    const errMsg =
      err.response?.data?.message ||
      err.message ||
      'Failed to save event';

    showError(errMsg);
  }
};

  const handleSaveFacility = async (e) => {
  e.preventDefault();

  setActionErrorMsg(null);

  try {
    if (editingItem) {
      await api.put(
        `/facilities/${editingItem.id}`,
        facilityForm
      );

      showFeedback('Facility updated successfully!');
    } else {
      await api.post('/facilities', facilityForm);

      showFeedback('Facility added successfully!');
    }

    setShowAddModal(false);
    setEditingItem(null);

    setFacilityForm({
      name: '',
      category: 'Academic & Labs',
      description: '',
      location: '',
      timings: '09:00 AM - 05:00 PM'
    });

    await fetchDataForTab('facilities');
    await fetchStats();

  } catch (err) {
    console.error(
      'Failed to save facility:',
      err.response?.data || err.message
    );

    const errMsg =
      err.response?.data?.message ||
      err.message ||
      'Failed to save facility';

    showError(errMsg);
  }
};

  // Open Edit Modals
  const handleOpenEditEvent = (ev) => {
    setEditingItem(ev);
    setActionErrorMsg(null);
    setEventForm({
      title: ev.title || ev.name || '',
      category: ev.category || 'General',
      description: ev.description || '',
      date: ev.date || ev.eventDate || '',
      time: ev.time || '10:00 AM',
      venue: ev.venue || ev.location || '',
      organizer: ev.organizer || 'IIIT Allahabad'
    });
    setShowAddModal(true);
  };

  const handleOpenEditFacility = (fac) => {
    setEditingItem(fac);
    setActionErrorMsg(null);
    setFacilityForm({
      name: fac.name || fac.title || '',
      category: fac.category || 'General',
      description: fac.description || '',
      location: fac.location || '',
      timings: fac.timings || fac.openingHours || '09:00 AM - 05:00 PM'
    });
    setShowAddModal(true);
  };

  // ==========================================
  // DELETE HANDLERS (DATABASE BACKED)
  // ==========================================
  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Delete student "${name}"? This permanently deletes all associated records.`)) return;
    try {
      await api.delete(`/admin/students/${id}`);
      showFeedback(`Student "${name}" deleted.`);
      await fetchDataForTab('students');
      await fetchStats();
    } catch (err) {
      console.error('Failed to delete student:', err);
      showError(err.response?.data?.message || err.message || 'Failed to delete student');
    }
  };

  const handleDeleteFaculty = async (id, name) => {
    if (!window.confirm(`Delete faculty member "${name}"?`)) return;
    try {
      await api.delete(`/admin/faculty/${id}`);
      showFeedback(`Faculty "${name}" deleted.`);
      await fetchDataForTab('faculty');
      await fetchStats();
    } catch (err) {
      console.error('Failed to delete faculty:', err);
      showError(err.response?.data?.message || err.message || 'Failed to delete faculty');
    }
  };

  const handleDeleteSubject = async (id, code, name) => {
    if (!window.confirm(`Delete subject "${code} - ${name}" permanently from the database?`)) return;
    try {
      await api.delete(`/admin/subjects/${id}`);
      showFeedback(`Subject "${code}" deleted.`);
      await fetchDataForTab('subjects');
      await fetchStats();
    } catch (err) {
      console.error('Failed to delete subject:', err);
      showError(err.response?.data?.message || err.message || 'Failed to delete subject');
    }
  };

  const handleDeleteTimetable = async (id) => {
    if (!window.confirm('Delete this timetable entry?')) return;
    try {
      await api.delete(`/admin/timetable/${id}`);
      showFeedback('Timetable entry deleted.');
      await fetchDataForTab('timetable');
      await fetchStats();
    } catch (err) {
      console.error('Failed to delete timetable entry:', err);
      showError(err.response?.data?.message || err.message || 'Failed to delete timetable entry');
    }
  };

  const handleDeleteNotice = async (id, title) => {
    if (!window.confirm(`Delete notice "${title}"?`)) return;
    try {
      await api.delete(`/admin/notices/${id}`);
      showFeedback('Notice deleted.');
      await fetchDataForTab('notices');
      await fetchStats();
    } catch (err) {
      console.error('Failed to delete notice:', err);
      showError(err.response?.data?.message || err.message || 'Failed to delete notice');
    }
  };

  const handleDeleteEvent = async (id, title) => {
    if (!window.confirm(`Delete campus event "${title}" from database?`)) return;
    try {
      // await api.delete(`/admin/events/${id}`);
      await api.delete(`/events/${id}`);
      showFeedback(`Event "${title}" deleted.`);
      await fetchDataForTab('events');
      await fetchStats();
    } catch (err) {
      console.error('Failed to delete event:', err);
      showError(err.response?.data?.message || err.message || 'Failed to delete event');
    }
  };

  const handleDeleteFacility = async (id, name) => {
    if (!window.confirm(`Delete facility "${name}" from database?`)) return;
    try {
      // await api.delete(`/admin/facilities/${id}`);
      await api.delete(`/admin/facilities/${id}`);
      showFeedback(`Facility "${name}" deleted.`);
      await fetchDataForTab('facilities');
      await fetchStats();
    } catch (err) {
      console.error('Failed to delete facility:', err);
      showError(err.response?.data?.message || err.message || 'Failed to delete facility');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Admin Dashboard Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/70 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 mb-1">
                Administrative Control Panel
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Admin Control Dashboard</h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-0.5">Manage academic curriculum, departments, campus events, and facilities</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15">
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-amber-200">Subjects</div>
              <div className="text-base font-extrabold">{stats?.totalSubjects ?? '...'}</div>
            </div>
            <div className="h-6 w-px bg-white/20"></div>
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-amber-200">Events</div>
              <div className="text-base font-extrabold">{stats?.totalEvents ?? '...'}</div>
            </div>
            <div className="h-6 w-px bg-white/20"></div>
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-amber-200">Facilities</div>
              <div className="text-base font-extrabold">{stats?.totalFacilities ?? '...'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Tabs Navigation Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center space-x-1">
          {[
            { id: 'subjects', label: 'Subjects', icon: BookOpen, count: stats?.totalSubjects },
            { id: 'students', label: 'Students', icon: Users, count: stats?.totalStudents },
            { id: 'faculty', label: 'Faculty', icon: Briefcase, count: stats?.totalFaculty },
            { id: 'timetable', label: 'Timetable', icon: Calendar, count: stats?.totalTimetableSlots },
            { id: 'notices', label: 'Notices', icon: Megaphone, count: stats?.totalNotices },
            { id: 'events', label: 'Campus Events & Fests', icon: Calendar, count: stats?.totalEvents },
            { id: 'facilities', label: 'Campus Facilities', icon: Building2, count: stats?.totalFacilities },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchTerm('');
                  setEditingItem(null);
                  setActionErrorMsg(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${isActive ? 'bg-amber-600 text-slate-950 font-extrabold' : 'bg-slate-200 text-slate-700'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setActionErrorMsg(null);
            setEventForm({ title: '', category: 'Technical', description: '', date: new Date().toISOString().split('T')[0], time: '10:00 AM', venue: '', organizer: 'IIIT Allahabad' });
            setFacilityForm({ name: '', category: 'Academic & Labs', description: '', location: '', timings: '09:00 AM - 05:00 PM' });
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add New</span>
        </button>
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. SUBJECTS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Academic Courses & Subjects</h2>
              <p className="text-xs text-slate-500">Working Delete option permanently cascades removals to timetable & assignments</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search subject code, name, branch..."
                className="text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 w-full sm:w-64 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Subject Code & Name</th>
                  <th className="px-6 py-3.5">Assigned Class / Section</th>
                  <th className="px-6 py-3.5">Instructor / Faculty</th>
                  <th className="px-6 py-3.5">Credits</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {subjects
                  .filter(s => s.code.toLowerCase().includes(searchTerm.toLowerCase()) || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.branch.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-slate-900 bg-slate-100 inline-block px-2 py-0.5 rounded border border-slate-200 mb-0.5">
                          {sub.code}
                        </div>
                        <div className="font-bold text-sm text-slate-900">{sub.name}</div>
                        <div className="text-[11px] text-slate-400">{sub.department}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200">
                          {sub.branch} • Year {sub.year} • Sec {sub.section}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{sub.faculty_name || 'Unassigned'}</div>
                        <div className="text-[11px] text-slate-400">{sub.faculty_email || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-800">{sub.credits} Credits</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteSubject(sub.id, sub.code, sub.name)}
                          className="p-2 text-rose-600 hover:text-white hover:bg-rose-600 rounded-xl border border-rose-200 hover:border-rose-600 transition-all"
                          title="Delete subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. CAMPUS EVENTS & FESTS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Campus Events & Technical/Cultural Fests</h2>
              <p className="text-xs text-slate-500">Database-backed events visible in Explorer. Admin can add, edit, or delete events.</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search event title, venue..."
                className="text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 w-full sm:w-64 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {events.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                No campus events found in database. Click "Add New" to create one.
              </div>
            ) : (
              events
                .filter(e => (e.title || e.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (e.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || (e.venue || e.location || '').toLowerCase().includes(searchTerm.toLowerCase()))
                .map((ev) => (
                  <div key={ev.id} className="p-5 sm:px-6 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                          {ev.category}
                        </span>
                        <span className="text-xs font-mono font-bold text-rose-600 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {ev.date || ev.eventDate}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">• {ev.time}</span>
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-base">{ev.title || ev.name}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{ev.description}</p>
                      
                      <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" /> {ev.venue || ev.location}
                        </span>
                        <span>•</span>
                        <span>Organized by: <strong>{ev.organizer}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenEditEvent(ev)}
                        className="p-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-xl border border-indigo-200 hover:border-indigo-600 transition-all"
                        title="Edit event"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(ev.id, ev.title || ev.name)}
                        className="p-2 text-rose-600 hover:text-white hover:bg-rose-600 rounded-xl border border-rose-200 hover:border-rose-600 transition-all"
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. CAMPUS FACILITIES MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'facilities' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Campus Facilities & Infrastructure</h2>
              <p className="text-xs text-slate-500">Database-backed facilities visible in Explorer. Admin can add, edit, or delete facilities.</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search facility name, location..."
                className="text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 w-full sm:w-64 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {facilities.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                No campus facilities found in database. Click "Add New" to create one.
              </div>
            ) : (
              facilities
                .filter(f => (f.name || f.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (f.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || (f.location || '').toLowerCase().includes(searchTerm.toLowerCase()))
                .map((fac) => (
                  <div key={fac.id} className="p-5 sm:px-6 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                          {fac.category}
                        </span>
                        <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {fac.timings || fac.openingHours}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-base">{fac.name || fac.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{fac.description}</p>
                      
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1 font-semibold text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> Location: {fac.location}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenEditFacility(fac)}
                        className="p-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-xl border border-indigo-200 hover:border-indigo-600 transition-all"
                        title="Edit facility"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFacility(fac.id, fac.name || fac.title)}
                        className="p-2 text-rose-600 hover:text-white hover:bg-rose-600 rounded-xl border border-rose-200 hover:border-rose-600 transition-all"
                        title="Delete facility"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. STUDENTS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Enrolled Students Roster</h2>
              <p className="text-xs text-slate-500">Student enrollment across all departments and academic years</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, roll number..."
                className="text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 w-full sm:w-64 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Roll Number</th>
                  <th className="px-6 py-3.5">Branch & Year</th>
                  <th className="px-6 py-3.5">Section</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {students
                  .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={st.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${st.roll_number}`}
                            alt={st.name}
                            className="w-8 h-8 rounded-full border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{st.name}</div>
                            <div className="text-[11px] text-slate-400">{st.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {st.roll_number}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-semibold text-slate-800">{st.branch} ({st.branch_code})</span>
                        <div className="text-[11px] text-slate-500">Year {st.year}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-200">
                          Section {st.section}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteStudent(st.id, st.name)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg"
                          title="Delete student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. FACULTY MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'faculty' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Institute Faculty Directory</h2>
              <p className="text-xs text-slate-500">Faculty appointments, departments, and course assignments</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search faculty name, department..."
                className="text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 w-full sm:w-64 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Faculty Profile</th>
                  <th className="px-6 py-3.5">Faculty Code</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Taught Courses</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {faculty
                  .filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.department.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((fac) => (
                    <tr key={fac.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={fac.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fac.faculty_code}`}
                            alt={fac.name}
                            className="w-8 h-8 rounded-full border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{fac.name}</div>
                            <div className="text-[11px] text-indigo-700 font-semibold">{fac.designation} • Room {fac.office_room}</div>
                            <div className="text-[11px] text-slate-400">{fac.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {fac.faculty_code}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-semibold text-slate-800">{fac.department}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {fac.taughtSubjects && fac.taughtSubjects.length > 0 ? (
                            fac.taughtSubjects.map((s) => (
                              <span key={s.id} className="font-mono text-[10px] font-bold bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-200">
                                {s.code} ({s.branch} Y{s.year} {s.section})
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No courses assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteFaculty(fac.id, fac.name)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg"
                          title="Delete faculty"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. TIMETABLE MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'timetable' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Institute Master Timetable</h2>
              <p className="text-xs text-slate-500">Timetable slots populate both student and faculty timetable views</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search day, subject, room..."
                className="text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 w-full sm:w-64 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Day & Time Slot</th>
                  <th className="px-6 py-3.5">Target Class / Section</th>
                  <th className="px-6 py-3.5">Subject</th>
                  <th className="px-6 py-3.5">Assigned Faculty</th>
                  <th className="px-6 py-3.5">Room</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {timetable
                  .filter(t => t.day_of_week.toLowerCase().includes(searchTerm.toLowerCase()) || t.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) || t.room.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="font-bold text-slate-900">{t.day_of_week}</div>
                        <div className="font-mono text-slate-500 text-[11px] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {t.start_time} - {t.end_time}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {t.branch} • Year {t.year} • Sec {t.section}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-mono text-[11px] font-bold text-indigo-700">{t.subject_code}</div>
                        <div className="font-bold text-slate-900">{t.subject_name}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-bold text-slate-900">{t.faculty_name}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1 w-max">
                          <MapPin className="w-3.5 h-3.5" /> {t.room}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteTimetable(t.id)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg"
                          title="Delete timetable entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. NOTICES MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'notices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base">College Announcements & Notices</h2>
              <p className="text-xs text-slate-500">Official circulars visible across student, faculty, and explorer views</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {notices.map((n) => (
              <div key={n.id} className="p-5 sm:px-6 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                      {n.category}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                      Target: {n.target_role}
                    </span>
                    {n.is_pinned === 1 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                        Pinned
                      </span>
                    )}
                    <span className="text-xs text-slate-400">• {n.published_date}</span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">{n.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.content}</p>
                </div>

                <button
                  onClick={() => handleDeleteNotice(n.id, n.title)}
                  className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl"
                  title="Delete notice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL FOR ADDING / EDITING ITEMS */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900">
                {editingItem ? 'Edit ' : 'Add New '}
                {activeTab === 'subjects' ? 'Subject' : activeTab === 'students' ? 'Student' : activeTab === 'faculty' ? 'Faculty Member' : activeTab === 'timetable' ? 'Timetable Slot' : activeTab === 'events' ? 'Campus Event' : activeTab === 'facilities' ? 'Campus Facility' : 'Notice'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                  setActionErrorMsg(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionErrorMsg}</span>
              </div>
            )}

            {/* SUBJECT FORM */}
            {activeTab === 'subjects' && (
              <form onSubmit={handleAddSubject} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Subject Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. CS401"
                      required
                      value={subjectForm.code}
                      onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Credits *</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      required
                      value={subjectForm.credits}
                      onChange={(e) => setSubjectForm({ ...subjectForm, credits: e.target.value })}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Distributed Computing & Cloud Infrastructure"
                    required
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assign Faculty *</label>
                  <select
                    value={subjectForm.facultyId}
                    onChange={(e) => setSubjectForm({ ...subjectForm, facultyId: e.target.value })}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    {faculty.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.department})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Branch</label>
                    <input
                      type="text"
                      required
                      list="branchesList"
                      placeholder="IT, ECE, AI..."
                      value={subjectForm.branch}
                      onChange={(e) => setSubjectForm({ ...subjectForm, branch: e.target.value })}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white"
                    />
                    <datalist id="branchesList">
                      {branchOptions.map(b => (
                        <option key={b.code} value={b.code}>{b.name}</option>
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Year</label>
                    <select
                      value={subjectForm.year}
                      onChange={(e) => setSubjectForm({ ...subjectForm, year: parseInt(e.target.value, 10) })}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white"
                    >
                      {yearOptions.map(y => (
                        <option key={y} value={y}>Year {y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                    <input
                      type="text"
                      required
                      list="sectionsList"
                      placeholder="A, B, C..."
                      value={subjectForm.section}
                      onChange={(e) => setSubjectForm({ ...subjectForm, section: e.target.value })}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white"
                    />
                    <datalist id="sectionsList">
                      {sectionOptions.map(s => (
                        <option key={s} value={s}>Section {s}</option>
                      ))}
                    </datalist>
                  </div>
                </div>

                <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 font-bold text-slate-950 text-xs rounded-xl shadow-xs">
                  Create Subject
                </button>
              </form>
            )}

            {/* CAMPUS EVENT FORM (ADD & EDIT) */}
            {activeTab === 'events' && (
              <form onSubmit={handleSaveEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Event / Fest Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Effervescence '26 - Cultural Night"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                    <select
                      value={eventForm.category}
                      onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="Cultural">Cultural</option>
                      <option value="Technical">Technical</option>
                      <option value="Sports">Sports</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Seminar">Seminar</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Event Date *</label>
                    <input
                      type="date"
                      required
                      value={eventForm.date}
                      onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Time *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 06:00 PM"
                      value={eventForm.time}
                      onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Venue / Location *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Main Auditorium / CC3 Quadrangle"
                      value={eventForm.venue}
                      onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Organizer</label>
                  <input
                    type="text"
                    placeholder="e.g. Student Activity Center & GeekHaven"
                    value={eventForm.organizer}
                    onChange={(e) => setEventForm({ ...eventForm, organizer: e.target.value })}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Detailed event description, schedule, and participation guidelines..."
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  ></textarea>
                </div>

                <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 font-bold text-slate-950 text-xs rounded-xl shadow-xs">
                  {editingItem ? 'Save Changes' : 'Publish Campus Event'}
                </button>
              </form>
            )}

            {/* CAMPUS FACILITY FORM (ADD & EDIT) */}
            {activeTab === 'facilities' && (
              <form onSubmit={handleSaveFacility} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Facility Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Central Computing Facility 4 (CC4)"
                    value={facilityForm.name}
                    onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                    <select
                      value={facilityForm.category}
                      onChange={(e) => setFacilityForm({ ...facilityForm, category: e.target.value })}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="Academic & Labs">Academic & Labs</option>
                      <option value="Academic & Research">Academic & Research</option>
                      <option value="Recreation & Student Life">Recreation & Student Life</option>
                      <option value="Sports & Fitness">Sports & Fitness</option>
                      <option value="Medical & Wellness">Medical & Wellness</option>
                      <option value="Accommodation">Accommodation</option>
                      <option value="Dining & Cafeteria">Dining & Cafeteria</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Opening Hours / Timings *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 24x7 with Biometric Access"
                      value={facilityForm.timings}
                      onChange={(e) => setFacilityForm({ ...facilityForm, timings: e.target.value })}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location on Campus *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Academic Complex, 2nd Floor, Wing B"
                    value={facilityForm.location}
                    onChange={(e) => setFacilityForm({ ...facilityForm, location: e.target.value })}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Description of facility, equipment, guidelines, and access rules..."
                    value={facilityForm.description}
                    onChange={(e) => setFacilityForm({ ...facilityForm, description: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  ></textarea>
                </div>

                <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 font-bold text-slate-950 text-xs rounded-xl shadow-xs">
                  {editingItem ? 'Save Changes' : 'Add Campus Facility'}
                </button>
              </form>
            )}

            {/* STUDENT FORM */}
            {activeTab === 'students' && (
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Harshita Singh"
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Roll Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. IIT2022099"
                      value={studentForm.rollNumber}
                      onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. student.harshita@iiita.ac.in"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Branch</label>
                    <input
                      type="text"
                      required
                      list="studentBranchesList"
                      placeholder="IT, ECE..."
                      value={studentForm.branchCode}
                      onChange={(e) => {
                        const code = e.target.value.toUpperCase();
                        const matched = branchOptions.find(b => b.code === code);
                        setStudentForm({
                          ...studentForm,
                          branchCode: code,
                          branch: matched ? matched.name : code
                        });
                      }}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white"
                    />
                    <datalist id="studentBranchesList">
                      {branchOptions.map(b => (
                        <option key={b.code} value={b.code}>{b.name}</option>
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Year</label>
                    <select
                      value={studentForm.year}
                      onChange={(e) => setStudentForm({ ...studentForm, year: parseInt(e.target.value, 10) })}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white"
                    >
                      {yearOptions.map(y => (
                        <option key={y} value={y}>Year {y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                    <input
                      type="text"
                      required
                      list="studentSectionsList"
                      placeholder="A, B, C..."
                      value={studentForm.section}
                      onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white"
                    />
                    <datalist id="studentSectionsList">
                      {sectionOptions.map(s => (
                        <option key={s} value={s}>Section {s}</option>
                      ))}
                    </datalist>
                  </div>
                </div>

                <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 font-bold text-slate-950 text-xs rounded-xl shadow-xs">
                  Create Student
                </button>
              </form>
            )}

            {/* FACULTY FORM */}
            {activeTab === 'faculty' && (
              <form onSubmit={handleAddFaculty} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Vijay Kumar"
                      value={facultyForm.name}
                      onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Faculty Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FAC-IT-05"
                      value={facultyForm.facultyCode}
                      onChange={(e) => setFacultyForm({ ...facultyForm, facultyCode: e.target.value })}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. faculty.vijay@iiita.ac.in"
                    value={facultyForm.email}
                    onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      required
                      value={facultyForm.department}
                      onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      required
                      value={facultyForm.designation}
                      onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 font-bold text-slate-950 text-xs rounded-xl shadow-xs">
                  Create Faculty Member
                </button>
              </form>
            )}

            {/* TIMETABLE FORM */}
            {activeTab === 'timetable' && (
              <form onSubmit={handleAddTimetable} className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Branch</label>
                    <input
                      type="text"
                      required
                      list="ttBranchesList"
                      placeholder="IT, ECE..."
                      value={timetableForm.branch}
                      onChange={(e) => setTimetableForm({ ...timetableForm, branch: e.target.value })}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white"
                    />
                    <datalist id="ttBranchesList">
                      {branchOptions.map(b => (
                        <option key={b.code} value={b.code}>{b.name}</option>
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Year</label>
                    <select
                      value={timetableForm.year}
                      onChange={(e) => setTimetableForm({ ...timetableForm, year: parseInt(e.target.value, 10) })}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white"
                    >
                      {yearOptions.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                    <input
                      type="text"
                      required
                      list="ttSectionsList"
                      placeholder="A, B, C..."
                      value={timetableForm.section}
                      onChange={(e) => setTimetableForm({ ...timetableForm, section: e.target.value })}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white"
                    />
                    <datalist id="ttSectionsList">
                      {sectionOptions.map(s => (
                        <option key={s} value={s}>Section {s}</option>
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                  <select
                    value={timetableForm.subjectId}
                    onChange={(e) => {
                      const subId = e.target.value;
                      const matchedSub = subjects.find(s => s.id.toString() === subId);
                      setTimetableForm({
                        ...timetableForm,
                        subjectId: subId,
                        facultyId: matchedSub?.faculty_id?.toString() || timetableForm.facultyId
                      });
                    }}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.code} - {s.name} ({s.branch} Sec {s.section})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Faculty</label>
                  <select
                    value={timetableForm.facultyId}
                    onChange={(e) => setTimetableForm({ ...timetableForm, facultyId: e.target.value })}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    {faculty.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.department})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Day of Week</label>
                    <select
                      value={timetableForm.dayOfWeek}
                      onChange={(e) => setTimetableForm({ ...timetableForm, dayOfWeek: e.target.value })}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Room</label>
                    <input
                      type="text"
                      required
                      value={timetableForm.room}
                      onChange={(e) => setTimetableForm({ ...timetableForm, room: e.target.value })}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={timetableForm.startTime}
                      onChange={(e) => setTimetableForm({ ...timetableForm, startTime: e.target.value })}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                    <input
                      type="time"
                      required
                      value={timetableForm.endTime}
                      onChange={(e) => setTimetableForm({ ...timetableForm, endTime: e.target.value })}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 font-bold text-slate-950 text-xs rounded-xl shadow-xs">
                  Create Timetable Slot
                </button>
              </form>
            )}

            {/* NOTICE FORM */}
            {activeTab === 'notices' && (
              <form onSubmit={handleAddNotice} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notice Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Annual Convocation 2026 Registration"
                    value={noticeForm.title}
                    onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={noticeForm.category}
                      onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="Academic">Academic</option>
                      <option value="Hostel">Hostel</option>
                      <option value="Event">Event</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Role</label>
                    <select
                      value={noticeForm.targetRole}
                      onChange={(e) => setNoticeForm({ ...noticeForm, targetRole: e.target.value })}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="all">All (Campus-wide)</option>
                      <option value="student">Students Only</option>
                      <option value="faculty">Faculty Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notice Content *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write announcement body..."
                    value={noticeForm.content}
                    onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300"
                  ></textarea>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={noticeForm.isPinned}
                    onChange={(e) => setNoticeForm({ ...noticeForm, isPinned: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Pin this notice to top of announcements</span>
                </label>

                <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 font-bold text-slate-950 text-xs rounded-xl shadow-xs">
                  Publish Announcement
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
