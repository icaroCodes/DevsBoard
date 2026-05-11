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
    const initAuth = async () => {
      try {
        const data = await api('/auth/session');
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.supabaseToken) {
          applyRealtimeAuth(data.supabaseToken);
        }
      } catch (err) {
        setUser(null);
        localStorage.removeItem('user');
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
      localStorage.removeItem('activeTeam');
      applyRealtimeAuth(null);
      window.location.href = '/';
    }
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
