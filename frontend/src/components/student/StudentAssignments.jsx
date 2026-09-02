import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  FileText,
  Clock,
  CheckCircle,
  Award,
  AlertCircle,
  Send,
  ExternalLink,
  MessageSquare,
  User,
  X
} from 'lucide-react';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Submit modal state
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/assignments');
      setAssignments(res.data);
    } catch (err) {
      console.error('Failed to load student assignments', err);
      setError('Unable to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubmit = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionContent(assignment.submission_content || '');
    setSuccessMsg(null);
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!submissionContent.trim()) return;

    try {
      setSubmitting(true);
      await api.post(`/student/assignments/${selectedAssignment.id}/submit`, {
        submissionContent: submissionContent.trim()
      });
      setSuccessMsg('Assignment submitted successfully!');
      setTimeout(() => {
        setSelectedAssignment(null);
        setSuccessMsg(null);
        fetchAssignments();
      }, 1200);
    } catch (err) {
      console.error('Failed to submit assignment', err);
      alert(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-iiit-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Assignments & Coursework</h1>
          <p className="text-xs text-slate-500 mt-1">Coursework assigned by course instructors</p>
        </div>
        <div className="text-xs font-bold px-3 py-1.5 bg-slate-100 rounded-xl text-slate-700">
          {assignments.length} Total Assignments
        </div>
      </div>

      {/* Assignment List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments.map((assignment) => {
          const isGraded = assignment.submission_status === 'Graded';
          const isSubmitted = assignment.submission_status === 'Submitted';
          const isPending = !isGraded && !isSubmitted;

          return (
            <div
              key={assignment.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6 space-y-4">
                {/* Header Tag Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 bg-iiit-50 border border-iiit-200 text-iiit-800 rounded-lg text-xs font-bold font-mono">
                    {assignment.subject_code} • {assignment.subject_name}
                  </span>

                  {isGraded && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <Award className="w-3.5 h-3.5" /> Graded
                    </span>
                  )}
                  {isSubmitted && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                      <CheckCircle className="w-3.5 h-3.5" /> Submitted
                    </span>
                  )}
                  {isPending && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <Clock className="w-3.5 h-3.5" /> Not Submitted
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 leading-snug">{assignment.title}</h3>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed">
                    {assignment.description || 'No additional instructions provided.'}
                  </p>
                </div>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Prof. {assignment.faculty_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-rose-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Due: {assignment.due_date}
                    </span>
                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      Max: {assignment.max_marks} Marks
                    </span>
                  </div>
                </div>

                {/* Submission Details & Grade Card if Available */}
                {isGraded && (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-600" /> Grade Obtained:
                      </span>
                      <span className="text-sm font-extrabold text-emerald-700">
                        {assignment.marks_obtained} / {assignment.max_marks}
                      </span>
                    </div>
                    {assignment.feedback && (
                      <p className="text-xs text-emerald-800 bg-white/70 p-2 rounded-lg border border-emerald-100">
                        <span className="font-semibold">Instructor Feedback:</span> {assignment.feedback}
                      </p>
                    )}
                  </div>
                )}

                {isSubmitted && !isGraded && assignment.submission_content && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Your Submission:</div>
                    <div className="text-xs text-slate-700 truncate font-mono bg-white p-2 rounded border border-slate-100">
                      {assignment.submission_content}
                    </div>
                    <div className="text-[10px] text-slate-400 text-right">Awaiting grading</div>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Status: <strong className="text-slate-700">{assignment.submission_status}</strong>
                </span>
                <button
                  onClick={() => handleOpenSubmit(assignment)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs ${
                    isGraded
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : isSubmitted
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-iiit-600 hover:bg-iiit-700 text-white'
                  }`}
                >
                  {isGraded ? 'View / Resubmit' : isSubmitted ? 'Update Submission' : 'Submit Assignment'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submission Modal Dialog */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Submit Assignment</h3>
                <p className="text-xs text-slate-500">{selectedAssignment.subject_code} • {selectedAssignment.title}</p>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMsg ? (
              <div className="py-8 text-center text-emerald-600 space-y-2">
                <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 animate-bounce" />
                <p className="font-bold text-base">{successMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitAssignment} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Submission Content / Repository Link / Solution Notes:
                  </label>
                  <textarea
                    rows={4}
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    required
                    placeholder="e.g. GitHub Repository link, Google Drive document link, or textual response..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-iiit-500 font-mono"
                  ></textarea>
                  <p className="text-[11px] text-slate-400">
                    Provide the repository link, Google Drive/PDF link, or written answer for grading.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAssignment(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !submissionContent.trim()}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-iiit-600 hover:bg-iiit-700 rounded-xl shadow-xs disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit to Faculty'}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
