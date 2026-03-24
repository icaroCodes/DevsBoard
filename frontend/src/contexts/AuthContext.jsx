import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [activeTeam, setActiveTeam] = useState(() => JSON.parse(localStorage.getItem('activeTeam')));
  const [loading, setLoading] = useState(true);

  // Sync activeTeam to localStorage
  useEffect(() => {
    if (activeTeam) {
      localStorage.setItem('activeTeam', JSON.stringify(activeTeam));
    } else {
      localStorage.removeItem('activeTeam');
    }
  }, [activeTeam]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && user) {
      setLoading(false);
      return;
    }
    if (!token) {
      setUser(null);
      setLoading(false);
    } else {
      api('/settings')
        .then((data) => {
          setUser(data);
          // Atualizar o registro do usuário atual nos recentes
          saveRecentAccount(localStorage.getItem('token'), data);
        })
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    }
  }, []);

  const saveRecentAccount = (token, user) => {
    if (!token || !user) return;
    const recent = JSON.parse(localStorage.getItem('recentAccounts') || '[]');
    // Filter out if already exists
    const updated = [
      { token, user, lastUsed: new Date().getTime() },
      ...recent.filter(acc => acc.user.id !== user.id)
    ].slice(0, 3); // Keep only 3
    localStorage.setItem('recentAccounts', JSON.stringify(updated));
  };

  const refreshUser = async () => {
    try {
      const data = await api('/settings');
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      saveRecentAccount(localStorage.getItem('token'), data);
      return data;
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
    }
  };

  const login = async (email, password) => {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    setActiveTeam(null); // Clear team context on new login
    saveRecentAccount(data.token, data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    setActiveTeam(null);
    saveRecentAccount(data.token, data.user);
    return data;
  };

  const switchAccount = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setActiveTeam(null); // Clear team context on switch
    saveRecentAccount(token, userData);
    window.location.reload(); // Reload to refresh all contexts
  };

  const loginWithToken = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    saveRecentAccount(token, user);
  };

  const switchTeam = (team) => {
    setActiveTeam(team);
    // Reload can be avoid if we handle it in context providers, 
    // but for consistency with data filtering, a reload/reset might be safer.
    // However, let's try just updating the context state first.
  };

  const updateUser = (data) => {
    const newUser = { ...user, ...data };
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    saveRecentAccount(localStorage.getItem('token'), newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeTeam');
    setUser(null);
    setActiveTeam(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      activeTeam,
      loading, 
      login, 
      register, 
      loginWithToken, 
      switchAccount,
      switchTeam,
      logout, 
      updateUser, 
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora de AuthProvider');
  return ctx;
}
