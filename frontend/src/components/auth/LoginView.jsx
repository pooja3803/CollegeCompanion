import React, { useState } from 'react';

import { useAuth } from '../../context/AuthContext';

import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  UserPlus
} from 'lucide-react';


export default function LoginView() {

  const {
    login,
    signup
  } = useAuth();


  const [mode, setMode] =
    useState('login');


  const [role, setRole] =
    useState('student');


  const [email, setEmail] =
    useState('');


  const [password, setPassword] =
    useState('');


  const [rollNumber, setRollNumber] =
    useState('');


  const [facultyCode, setFacultyCode] =
    useState('');


  const [loading, setLoading] =
    useState(false);


  const [error, setError] =
    useState(null);


  const [success, setSuccess] =
    useState(null);


  const handleLogin = async (e) => {

    e.preventDefault();

    setError(null);
    setSuccess(null);


    try {

      setLoading(true);

      await login(
        email,
        password
      );

    } catch (err) {

      setError(
        err.response?.data?.message ||
        'Invalid email or password'
      );

    } finally {

      setLoading(false);
    }
  };


  const handleSignup = async (e) => {

    e.preventDefault();

    setError(null);
    setSuccess(null);


    try {

      setLoading(true);

      const data = {

        role,

        email,

        password

      };


      if (role === 'student') {
        data.rollNumber =
          rollNumber;
      }


      if (role === 'faculty') {
        data.facultyCode =
          facultyCode;
      }


      const response =
        await signup(data);


      setSuccess(
        response.message
      );


      setMode('login');


      setPassword('');

    } catch (err) {

      setError(
        err.response?.data?.message ||
        'Registration failed'
      );

    } finally {

      setLoading(false);
    }
  };


  return (

    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">


      {/* HEADER */}

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">

        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-iiit-900 to-iiit-600 flex items-center justify-center text-white shadow-xl mx-auto mb-4">

          <Building2 className="w-9 h-9" />

        </div>


        <h1 className="text-3xl font-extrabold text-slate-900">

          IIIT Allahabad

        </h1>


        <p className="text-sm font-semibold text-iiit-700 mt-1">

          College Companion Portal

        </p>

      </div>



      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">


        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-slate-200">


          {/* MODE BUTTONS */}

          <div className="flex mb-6 bg-slate-100 rounded-xl p-1">


            <button

              onClick={() => {

                setMode('login');

                setError(null);

                setSuccess(null);

              }}

              className={`flex-1 py-2 text-xs font-bold rounded-lg ${
                mode === 'login'
                  ? 'bg-white shadow text-iiit-700'
                  : 'text-slate-500'
              }`}

            >

              Login

            </button>



            <button

              onClick={() => {

                setMode('signup');

                setError(null);

                setSuccess(null);

              }}

              className={`flex-1 py-2 text-xs font-bold rounded-lg ${
                mode === 'signup'
                  ? 'bg-white shadow text-iiit-700'
                  : 'text-slate-500'
              }`}

            >

              Register

            </button>


          </div>



          {/* ERROR */}

          {error && (

            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">

              {error}

            </div>

          )}



          {/* SUCCESS */}

          {success && (

            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs">

              {success}

            </div>

          )}



          {/* LOGIN FORM */}

          {mode === 'login' && (

            <form
              onSubmit={handleLogin}
              className="space-y-4"
            >


              <div>

                <label className="block text-xs font-bold text-slate-700 mb-1">

                  Institutional Email

                </label>


                <div className="relative">

                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />


                  <input

                    type="email"

                    required

                    value={email}

                    onChange={(e) =>
                      setEmail(e.target.value)
                    }

                    placeholder="you@iiita.ac.in"

                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300"

                  />

                </div>

              </div>



              <div>

                <label className="block text-xs font-bold text-slate-700 mb-1">

                  Password

                </label>


                <div className="relative">

                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />


                  <input

                    type="password"

                    required

                    value={password}

                    onChange={(e) =>
                      setPassword(e.target.value)
                    }

                    placeholder="Enter your password"

                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300"

                  />

                </div>

              </div>



              <button

                type="submit"

                disabled={loading}

                className="w-full py-2.5 bg-iiit-600 hover:bg-iiit-700 text-white font-bold text-xs rounded-xl flex justify-center items-center gap-2 disabled:opacity-50"

              >

                {loading
                  ? 'Logging in...'
                  : 'Login'}

                <ArrowRight className="w-4 h-4" />

              </button>


            </form>

          )}



          {/* SIGNUP FORM */}

          {mode === 'signup' && (

            <form
              onSubmit={handleSignup}
              className="space-y-4"
            >


              {/* ROLE */}

              <div>

                <label className="block text-xs font-bold text-slate-700 mb-1">

                  Role

                </label>


                <select

                  value={role}

                  onChange={(e) =>
                    setRole(e.target.value)
                  }

                  className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-300"

                >

                  <option value="student">

                    Student

                  </option>

                  <option value="faculty">

                    Faculty

                  </option>

                </select>

              </div>



              {/* EMAIL */}

              <div>

                <label className="block text-xs font-bold text-slate-700 mb-1">

                  Institutional Email

                </label>


                <input

                  type="email"

                  required

                  value={email}

                  onChange={(e) =>
                    setEmail(e.target.value)
                  }

                  className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-300"

                />

              </div>



              {/* STUDENT */}

              {role === 'student' && (

                <div>

                  <label className="block text-xs font-bold text-slate-700 mb-1">

                    Roll Number

                  </label>


                  <input

                    type="text"

                    required

                    value={rollNumber}

                    onChange={(e) =>
                      setRollNumber(e.target.value)
                    }

                    className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-300"

                  />

                </div>

              )}



              {/* FACULTY */}

              {role === 'faculty' && (

                <div>

                  <label className="block text-xs font-bold text-slate-700 mb-1">

                    Faculty Code

                  </label>


                  <input

                    type="text"

                    required

                    value={facultyCode}

                    onChange={(e) =>
                      setFacultyCode(e.target.value)
                    }

                    className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-300"

                  />

                </div>

              )}



              {/* PASSWORD */}

              <div>

                <label className="block text-xs font-bold text-slate-700 mb-1">

                  Create Password

                </label>


                <input

                  type="password"

                  required

                  minLength="6"

                  value={password}

                  onChange={(e) =>
                    setPassword(e.target.value)
                  }

                  className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-300"

                />

              </div>



              <button

                type="submit"

                disabled={loading}

                className="w-full py-2.5 bg-iiit-600 text-white font-bold text-xs rounded-xl flex justify-center items-center gap-2 disabled:opacity-50"

              >

                {loading
                  ? 'Registering...'
                  : 'Register Account'}

                <UserPlus className="w-4 h-4" />

              </button>


            </form>

          )}


        </div>


        <p className="text-center text-[11px] text-slate-500 mt-4">

          Students and faculty must use their official institutional records.

        </p>


      </div>

    </div>
  );
}