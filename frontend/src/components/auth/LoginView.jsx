import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Info,
  ShieldCheck,
  GraduationCap,
  Briefcase
} from 'lucide-react';

export default function LoginView() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid institutional credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-iiit-900 to-iiit-600 flex items-center justify-center text-white shadow-xl shadow-iiit-600/30 mx-auto mb-4 border border-white/20">
          <Building2 className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">IIIT Allahabad</h1>
        <p className="text-sm font-semibold text-iiit-700 mt-1">College Companion Portal</p>
        <p className="text-xs text-slate-500 mt-0.5">Secure Institutional Authentication</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 space-y-6">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-slate-200 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Institutional Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Institutional Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. student.aarav@iiita.ac.in"
                  className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-iiit-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-iiit-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-iiit-600 hover:bg-iiit-700 text-white font-bold text-xs rounded-xl shadow-md shadow-iiit-600/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Verifying Account...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Institutional Account Reference Guide */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Info className="w-4 h-4 text-iiit-600" />
            <span>Institutional Account Directory (Password: password123)</span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-500 font-mono">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 font-bold text-amber-700 font-sans"><ShieldCheck className="w-3 h-3" /> Admin:</span>
              <span>admin@iiita.ac.in</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 font-bold text-indigo-700 font-sans"><Briefcase className="w-3 h-3" /> Faculty:</span>
              <span>faculty.manish@iiita.ac.in</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 font-bold text-emerald-700 font-sans"><GraduationCap className="w-3 h-3" /> Student:</span>
              <span>student.aarav@iiita.ac.in</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
