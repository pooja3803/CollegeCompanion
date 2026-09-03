import React, {
  createContext,
  useContext,
  useState,
  useEffect
} from 'react';

import api, {
  setAuthToken
} from '../services/api';


const AuthContext =
  createContext(null);


export const AuthProvider = ({ children }) => {

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);


  // ==========================================
  // CHECK EXISTING SESSION
  // ==========================================

  useEffect(() => {

    fetchCurrentUser();

  }, []);


  const fetchCurrentUser = async () => {

    const token =
      localStorage.getItem('iiita_token');


    if (!token) {

      setLoading(false);

      return;
    }


    try {

      setAuthToken(token);

      const res =
        await api.get('/auth/me');

      setUser(res.data.user);

      localStorage.setItem(
        'iiita_user',
        JSON.stringify(res.data.user)
      );

    } catch (error) {

      console.error(
        'Session validation failed:',
        error
      );

      setAuthToken(null);

      localStorage.removeItem(
        'iiita_user'
      );

      setUser(null);

    } finally {

      setLoading(false);
    }
  };


  // ==========================================
  // LOGIN
  // ==========================================

  const login = async (
    email,
    password
  ) => {

    const res =
      await api.post(
        '/auth/login',
        {
          email,
          password
        }
      );


    const {
      token,
      user: userData
    } = res.data;


    setAuthToken(token);


    localStorage.setItem(
      'iiita_user',
      JSON.stringify(userData)
    );


    setUser(userData);


    return userData;
  };


  // ==========================================
  // SIGNUP
  // ==========================================

  const signup = async (data) => {

    const res =
      await api.post(
        '/auth/signup',
        data
      );

    return res.data;
  };


  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {

    setAuthToken(null);

    localStorage.removeItem(
      'iiita_user'
    );

    setUser(null);
  };


  return (

    <AuthContext.Provider
      value={{

        user,

        role: user?.role,

        loading,

        login,

        signup,

        logout,

        fetchCurrentUser

      }}
    >

      {children}

    </AuthContext.Provider>

  );
};


export const useAuth = () =>
  useContext(AuthContext);