import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import supabase from '../lib/supabase';

export const AuthContext = createContext(null);

const applyRealtimeAuth = (token) => {
  if (!supabase) return;
  if (token) {
    localStorage.setItem('supabaseToken', token);
    try { supabase.realtime.setAuth(token); } catch (e) { console.warn('[Realtime setAuth]', e); }
  } else {
    localStorage.removeItem('supabaseToken');
    try { supabase.realtime.setAuth(null); } catch { }
  }
};

const safeParse = (key) => {
  try {
    const val = localStorage.getItem(key);
    return val && val !== 'undefined' ? JSON.parse(val) : null;
  } catch (e) {
    localStorage.removeItem(key);
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => safeParse('user'));
  const [activeTeam, setActiveTeam] = useState(() => safeParse('activeTeam'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTeam) {
      localStorage.setItem('activeTeam', JSON.stringify(activeTeam));
    } else {
      localStorage.removeItem('activeTeam');
    }
  }, [activeTeam]);

  useEffect(() => {
    // If there's no access token we have nothing to validate — don't hit
    // /auth/session, which would just 401 and trigger lib/api.js cleanup.
    // That cleanup wipes localStorage and, on protected routes, redirects
    // to "/", and combined with stale tokens can leave the app in a state
    // where Routes resolves to nothing visible (blank black screen).
    const hasToken = !!localStorage.getItem('token');
    if (!hasToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const data = await api('/auth/session');
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.supabaseToken) {
          applyRealtimeAuth(data.supabaseToken);
        }
      } catch (err) {
        // Session validation failed — wipe everything we keep keyed off
        // the access token. Without this, PublicRoute keeps reading the
        // stale `token` and redirecting to /dashboard, while
        // ProtectedRoute (user=null) bounces back to "/", producing a
        // redirect loop and a blank screen.
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('activeTeam');
        applyRealtimeAuth(null);
      } finally {
        setLoading(false);
      }
    };

    const savedToken = localStorage.getItem('supabaseToken');
    if (savedToken && supabase) {
      try { supabase.realtime.setAuth(savedToken); } catch { }
    }

    initAuth();
  }, []);

  const loginWithOAuth = (provider) => {
    const oauthUrl = import.meta.env.VITE_OAUTH_URL || 'https://devsboard-backend.onrender.com';
    window.location.href = `${oauthUrl}/auth/${provider}`;
  };

  const exchangeOAuthCode = async (code) => {
    try {
      const data = await api('/auth/exchange', { method: 'POST', body: JSON.stringify({ code }) });
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.supabaseToken) {
        applyRealtimeAuth(data.supabaseToken);
      }
      return data.user;
    } catch (err) {
      console.error('Falha ao trocar código OAuth:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Erro no logout', err);
    } finally {
      setUser(null);
      setActiveTeam(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('activeTeam');
      applyRealtimeAuth(null);
      window.location.href = '/';
    }
  };

  // Compatibility shims for components written against the older context
  // shape (Layout, WorkspaceSheet). `switchTeam` must write localStorage
  // synchronously before setState because consumers (Projects, Dashboard,
  // etc.) read `activeTeam` from localStorage in their fetch headers, and
  // they re-fetch on the same tick as the state update.
  const switchTeam = (team) => {
    if (team) {
      localStorage.setItem('activeTeam', JSON.stringify(team));
    } else {
      localStorage.removeItem('activeTeam');
    }
    setActiveTeam(team);
  };
  const switchAccount = () => {
    logout();
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const refreshUser = async () => {
    try {
      const data = await api('/auth/session');
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.supabaseToken) {
        applyRealtimeAuth(data.supabaseToken);
      }
      return data.user;
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      activeTeam,
      setActiveTeam,
      loading,
      loginWithOAuth,
      exchangeOAuthCode,
      logout,
      switchTeam,
      switchAccount,
      updateUser,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
