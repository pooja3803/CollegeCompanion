import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Sliders,
  UserCheck,
  PlusCircle,
  FileCheck,
  CheckCircle2,
  XCircle,
  Save,
  Users,
  Calendar,
  Clock,
  BookOpen,
  Award,
  AlertCircle,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

export default function FacultyControlPanel() {
  const [activeSubTab, setActiveSubTab] = useState('attendance'); // 'attendance' | 'create-assignment' | 'grade-submissions'
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Attendance State
  const [selectedClassId, setSelectedClassId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStudents, setAttendanceStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceSavedMsg, setAttendanceSavedMsg] = useState(null);

  // 2. Create Assignment State
  const [assignmentSubjectId, setAssignmentSubjectId] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [assignmentMaxMarks, setAssignmentMaxMarks] = useState(25);
  const [creatingAssignment, setCreatingAssignment] = useState(false);
  const [assignmentCreatedMsg, setAssignmentCreatedMsg] = useState(null);

  // 3. Grade Submissions State
  const [facultyAssignments, setFacultyAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [submissionData, setSubmissionData] = useState(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingState, setGradingState] = useState({}); // studentId -> { marks, feedback }
  const [savingGradeFor, setSavingGradeFor] = useState(null);
  const [gradeSavedMsg, setGradeSavedMsg] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const classesRes = await api.get('/faculty/assigned-classes');
      setAssignedClasses(classesRes.data);
      if (classesRes.data.length > 0) {
        setSelectedClassId(classesRes.data[0].subject_id.toString());
        setAssignmentSubjectId(classesRes.data[0].subject_id.toString());
      }

      const assignmentsRes = await api.get('/faculty/assignments');
      setFacultyAssignments(assignmentsRes.data);
      if (assignmentsRes.data.length > 0) {
        setSelectedAssignmentId(assignmentsRes.data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load faculty control panel initial data', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Attendance Students whenever class or date changes
  useEffect(() => {
    if (selectedClassId && attendanceDate && activeSubTab === 'attendance') {
      fetchClassStudents(selectedClassId, attendanceDate);
    }
  }, [selectedClassId, attendanceDate, activeSubTab]);

  const fetchClassStudents = async (subjectId, date) => {
    try {
      setLoadingStudents(true);
      setAttendanceSavedMsg(null);
      const res = await api.get(`/faculty/attendance/students?subjectId=${subjectId}&date=${date}`);
      setAttendanceStudents(res.data.students || []);
    } catch (err) {
      console.error('Failed to load class students', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Attendance Toggle Status
  const toggleStudentStatus = (studentId) => {
    setAttendanceStudents(prev =>
      prev.map(s => s.studentId === studentId ? { ...s, status: s.status === 'Present' ? 'Absent' : 'Present' } : s)
    );
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    setAttendanceStudents(prev => prev.map(s => ({ ...s, status: 'Present' })));
  };

  // Save Attendance to DB
  const handleSaveAttendance = async () => {
    try {
      setSavingAttendance(true);
      await api.post('/faculty/attendance/save', {
        subjectId: parseInt(selectedClassId, 10),
        date: attendanceDate,
        attendance: attendanceStudents.map(s => ({ studentId: s.studentId, status: s.status }))
      });
      setAttendanceSavedMsg('Attendance saved successfully to the database!');
      setTimeout(() => setAttendanceSavedMsg(null), 3000);
    } catch (err) {
      console.error('Failed to save attendance', err);
      alert(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSavingAttendance(false);
    }
  };

  // Create Assignment
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentSubjectId || !assignmentTitle.trim() || !assignmentDueDate) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setCreatingAssignment(true);
      await api.post('/faculty/assignments', {
        subjectId: parseInt(assignmentSubjectId, 10),
        title: assignmentTitle.trim(),
        description: assignmentDesc.trim(),
        dueDate: assignmentDueDate,
        maxMarks: parseInt(assignmentMaxMarks, 10) || 100
      });

      setAssignmentCreatedMsg('Assignment created and published to students!');
      setAssignmentTitle('');
      setAssignmentDesc('');
      setAssignmentDueDate('');
      setAssignmentMaxMarks(25);

      // Refresh assignments list
      const assignmentsRes = await api.get('/faculty/assignments');
      setFacultyAssignments(assignmentsRes.data);

      setTimeout(() => setAssignmentCreatedMsg(null), 3500);
    } catch (err) {
      console.error('Failed to create assignment', err);
      alert(err.response?.data?.message || 'Failed to create assignment');
    } finally {
      setCreatingAssignment(false);
    }
  };

  // Fetch Submissions for Selected Assignment
  useEffect(() => {
    if (selectedAssignmentId && activeSubTab === 'grade-submissions') {
      fetchAssignmentSubmissions(selectedAssignmentId);
    }
  }, [selectedAssignmentId, activeSubTab]);

  const fetchAssignmentSubmissions = async (assignmentId) => {
    try {
      setLoadingSubmissions(true);
      const res = await api.get(`/faculty/assignments/${assignmentId}/submissions`);
      setSubmissionData(res.data);

      // Initialize grading state
      const initialGrades = {};
      res.data.students.forEach(st => {
        initialGrades[st.student_id] = {
          marks: st.marks_obtained !== null && st.marks_obtained !== undefined ? st.marks_obtained : '',
          feedback: st.feedback || ''
        };
      });
      setGradingState(initialGrades);
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleGradeChange = (studentId, field, value) => {
    setGradingState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSaveGrade = async (studentId) => {
    const grade = gradingState[studentId];
    if (grade.marks === '' || grade.marks === null || grade.marks === undefined) {
      alert('Please enter a valid mark');
      return;
    }

    try {
      setSavingGradeFor(studentId);
      await api.post('/faculty/submissions/grade', {
        assignmentId: parseInt(selectedAssignmentId, 10),
        studentId,
        marksObtained: parseFloat(grade.marks),
        feedback: grade.feedback
      });

      setGradeSavedMsg(`Grade saved for student!`);
      setTimeout(() => setGradeSavedMsg(null), 2500);
      fetchAssignmentSubmissions(selectedAssignmentId);
    } catch (err) {
      console.error('Failed to save grade', err);
      alert(err.response?.data?.message || 'Failed to save grade');
    } finally {
      setSavingGradeFor(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Control Panel Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Control Panel</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
              Instructor Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Manage class attendance, assignments, and grade submissions</p>
        </div>

        {/* 3 Tool Tabs Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'attendance'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Attendance</span>
          </button>

          <button
            onClick={() => setActiveSubTab('create-assignment')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'create-assignment'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Assignment</span>
          </button>

          <button
            onClick={() => setActiveSubTab('grade-submissions')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'grade-submissions'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Grade Submissions</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. ATTENDANCE MANAGEMENT TOOL */}
      {/* ======================================================== */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-6">
          {/* Class & Date Selector Bar */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Select Assigned Subject/Class */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Assigned Course & Section:
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {assignedClasses.map((c) => (
                    <option key={c.subject_id} value={c.subject_id}>
                      {c.subject_code} - {c.subject_name} ({c.branch} Year {c.year} Sec {c.section}) [{c.student_count} Students]
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lecture Date:
                </label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                />
              </div>

              {/* Quick Actions */}
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="flex-1 px-3 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Mark All Present</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={savingAttendance || attendanceStudents.length === 0}
                  className="flex-1 px-4 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingAttendance ? 'Saving...' : 'Save Attendance'}</span>
                </button>
              </div>
            </div>

            {attendanceSavedMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{attendanceSavedMsg}</span>
              </div>
            )}
          </div>

          {/* Student List for Attendance */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Class Roll Call</h2>
                <p className="text-xs text-slate-500">
                  {attendanceStudents.length} Students dynamically fetched for selected branch, year & section
                </p>
              </div>
              <div className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700">
                Present: {attendanceStudents.filter(s => s.status === 'Present').length} / {attendanceStudents.length}
              </div>
            </div>

            {loadingStudents ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : attendanceStudents.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {attendanceStudents.map((st, index) => {
                  const isPresent = st.status === 'Present';
                  return (
                    <div
                      key={st.studentId}
                      className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="text-xs font-mono font-bold text-slate-400 w-6">{index + 1}.</span>
                        <img
                          src={st.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${st.rollNumber}`}
                          alt={st.studentName}
                          className="w-10 h-10 rounded-full border border-slate-200 bg-slate-100"
                        />
                        <div>
                          <h3 className="font-bold text-sm text-slate-900">{st.studentName}</h3>
                          <div className="text-xs text-slate-500 font-mono">
                            {st.rollNumber} • {st.studentEmail}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleStudentStatus(st.studentId)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                            isPresent
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-rose-600 hover:bg-rose-700 text-white'
                          }`}
                        >
                          {isPresent ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          <span>{st.status}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No students found matching this branch/year/section.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. CREATE ASSIGNMENT TOOL */}
      {/* ======================================================== */}
      {activeSubTab === 'create-assignment' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Creation Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div>
              <h2 className="font-extrabold text-lg text-slate-900">Create New Course Assignment</h2>
              <p className="text-xs text-slate-500">Publish coursework to your assigned sections</p>
            </div>

            {assignmentCreatedMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{assignmentCreatedMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Course & Section <span className="text-rose-500">*</span>:
                </label>
                <select
                  value={assignmentSubjectId}
                  onChange={(e) => setAssignmentSubjectId(e.target.value)}
                  required
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {assignedClasses.map((c) => (
                    <option key={c.subject_id} value={c.subject_id}>
                      {c.subject_code} - {c.subject_name} ({c.branch} Year {c.year} Sec {c.section})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assignment Title <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  placeholder="e.g. Assignment 2: B-Tree Indexing & Query Optimization"
                  required
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Problem Statement & Guidelines:
                </label>
                <textarea
                  rows={4}
                  value={assignmentDesc}
                  onChange={(e) => setAssignmentDesc(e.target.value)}
                  placeholder="Provide detailed submission requirements, reference links, and rubric..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Due Date <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="date"
                    value={assignmentDueDate}
                    onChange={(e) => setAssignmentDueDate(e.target.value)}
                    required
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Maximum Marks <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={assignmentMaxMarks}
                    onChange={(e) => setAssignmentMaxMarks(e.target.value)}
                    required
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={creatingAssignment}
                  className="w-full py-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{creatingAssignment ? 'Publishing...' : 'Publish Assignment to Students'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Recently Published Assignments List */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="font-extrabold text-base text-slate-900">Active Assignments</h2>
              <p className="text-xs text-slate-500">{facultyAssignments.length} Assignments created by you</p>
            </div>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {facultyAssignments.map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 hover:bg-white transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                      {a.subject_code} • Sec {a.section}
                    </span>
                    <span className="text-[11px] font-semibold text-rose-600">Due: {a.due_date}</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">{a.title}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>Max: {a.max_marks} Marks</span>
                    <span className="font-semibold text-indigo-700">{a.total_submissions} Submitted</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. GRADE SUBMISSIONS TOOL */}
      {/* ======================================================== */}
      {activeSubTab === 'grade-submissions' && (
        <div className="space-y-6">
          {/* Assignment Selector */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 max-w-xl">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Assignment to Grade:
              </label>
              <select
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {facultyAssignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.subject_code} - {a.title} (Sec {a.section} • Due: {a.due_date})
                  </option>
                ))}
              </select>
            </div>

            {submissionData?.assignment && (
              <div className="flex items-center gap-3 bg-indigo-50/80 px-4 py-3 rounded-xl border border-indigo-200">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-indigo-600 font-bold">Max Marks</div>
                  <div className="text-base font-extrabold text-indigo-900">{submissionData.assignment.max_marks}</div>
                </div>
                <div className="h-6 w-px bg-indigo-200"></div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-indigo-600 font-bold">Class</div>
                  <div className="text-xs font-bold text-indigo-900">
                    {submissionData.assignment.branch} Y{submissionData.assignment.year} Sec {submissionData.assignment.section}
                  </div>
                </div>
              </div>
            )}
          </div>

          {gradeSavedMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{gradeSavedMsg}</span>
            </div>
          )}

          {/* Student Submissions List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Student Submissions & Grading Roster</h2>
                <p className="text-xs text-slate-500">
                  Enter marks and optional feedback notes, then click Save Grade
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {submissionData?.students?.length || 0} Students in Class
              </span>
            </div>

            {loadingSubmissions ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : submissionData?.students && submissionData.students.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {submissionData.students.map((st) => {
                  const grade = gradingState[st.student_id] || { marks: '', feedback: '' };
                  const isSubmitted = st.submission_status === 'Submitted' || st.submission_status === 'Graded';
                  const isGraded = st.submission_status === 'Graded';

                  return (
                    <div key={st.student_id} className="p-5 sm:px-6 hover:bg-slate-50/50 transition-colors space-y-3">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${st.roll_number}`}
                            alt={st.student_name}
                            className="w-10 h-10 rounded-full border border-slate-200 bg-slate-100"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-slate-900">{st.student_name}</h3>
                              <span className="font-mono text-xs font-bold text-slate-500">({st.roll_number})</span>
                            </div>
                            <div className="text-xs text-slate-400">{st.student_email}</div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          {isGraded ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <Award className="w-3.5 h-3.5" /> Graded ({st.marks_obtained}/{submissionData.assignment.max_marks})
                            </span>
                          ) : isSubmitted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Submitted (Needs Grade)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3.5 h-3.5" /> Not Submitted
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Submission Content */}
                      {st.submission_content && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 break-all flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-500 block text-[10px] uppercase font-sans">Submitted Solution:</span>
                            {st.submission_content}
                          </div>
                          {st.submission_content.startsWith('http') && (
                            <a
                              href={st.submission_content}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-indigo-600 hover:text-indigo-800 bg-white rounded border border-slate-200 shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Grading Inputs Row */}
                      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <div className="w-full sm:w-36">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Marks (Max: {submissionData.assignment.max_marks})
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={submissionData.assignment.max_marks}
                            value={grade.marks}
                            onChange={(e) => handleGradeChange(st.student_id, 'marks', e.target.value)}
                            placeholder="Marks"
                            className="w-full text-xs font-bold p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                          />
                        </div>

                        <div className="w-full flex-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Feedback / Remarks:
                          </label>
                          <input
                            type="text"
                            value={grade.feedback}
                            onChange={(e) => handleGradeChange(st.student_id, 'feedback', e.target.value)}
                            placeholder="e.g. Well organized schema and clean proofs."
                            className="w-full text-xs p-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                          />
                        </div>

                        <div className="w-full sm:w-auto self-end pt-1">
                          <button
                            type="button"
                            onClick={() => handleSaveGrade(st.student_id)}
                            disabled={savingGradeFor === st.student_id}
                            className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{savingGradeFor === st.student_id ? 'Saving...' : 'Save Grade'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <FileCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No assignment selected or no students enrolled.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
