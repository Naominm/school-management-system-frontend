import { createContext, useContext, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('sms_user');
    return raw ? JSON.parse(raw) : null;
  });

  /**
   * Sign in with an email and a password, nothing else.
   *
   * The school is resolved from the account server-side, so the caller gets
   * back both the user and where to send them — a platform administrator to
   * the console, anyone owing a password change to that form, everyone else
   * to their dashboard.
   */
  function startSession(data) {
    localStorage.setItem('sms_token', data.token);
    localStorage.setItem('sms_user', JSON.stringify(data.user));
    setUser(data.user);
    return { user: data.user, school: data.school, landing: data.landing || '/' };
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    return startSession(data);
  }

  /**
   * Open a parent's session for one of their learners. Every page after this
   * reads that learner only, in that learner's school; switching is choosing
   * again.
   */
  async function chooseLearner(studentId) {
    const { data } = await api.post('/auth/guardian/select', { student_id: studentId });
    return startSession(data);
  }

  /**
   * Re-read the account from the server and store what comes back.
   *
   * Needed after anything that changes the account itself rather than its
   * data — changing a password clears must_change_password in the database,
   * and without this the copy in the browser would still say it is owed and
   * hold the person on that form.
   */
  async function refreshUser() {
    const { data } = await api.get('/auth/me');
    localStorage.setItem('sms_user', JSON.stringify(data));
    setUser(data);
    return data;
  }

  function logout() {
    localStorage.removeItem('sms_token');
    localStorage.removeItem('sms_user');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout, refreshUser, startSession, chooseLearner }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function RequireAuth({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  if (!user) return <Navigate to="/login" replace />;
  /* An account created by an administrator carries a temporary password.
   * Holding it on the change form is the point of the flag — otherwise a
   * learner keeps the password their teacher typed for them. */
  if (user.must_change_password && pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  /* A parent with more than one learner picks one before anything else —
   * every page shows a single learner's records. */
  if (user.guardian_id && !user.student_id && pathname !== '/choose-learner') {
    return <Navigate to="/choose-learner" replace />;
  }
  return children;
}
