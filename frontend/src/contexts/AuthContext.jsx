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
    api('/settings')
      .then((data) => {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      })
      .catch((err) => {
        const msg = err.message || '';
        // Só desloga em falha de autenticação explícita (401/sessão inválida)
        // Erros de rede (ECONNRESET, ECONNREFUSED) NÃO devem deslogar
        const isAuthFailure =
          msg.includes('Sessão') ||
          msg.includes('login') ||
          msg.includes('inválid') ||
          msg.includes('expirad');

        if (isAuthFailure) {
          console.warn('[Session Verify Failed]', msg);
          setUser(null);
          setActiveTeam(null);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('activeTeam');
        } else {
          console.warn('[Settings fetch failed — keeping session]', msg);
          // Mantém o user do localStorage (erro de rede transitório)
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const refreshUser = async () => {
    try {
      const data = await api('/settings');
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
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
    if (data.token) localStorage.setItem('token', data.token);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    setActiveTeam(null);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (data.token) localStorage.setItem('token', data.token);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    setActiveTeam(null);
    return data;
  };

  const switchAccount = () => {
    logout();
    window.location.href = '/auth';
  };

  const switchTeam = (team) => {
    setActiveTeam(team);
  };

  const updateUser = (data) => {
    const newUser = { ...user, ...data };
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Erro no logout remoto:', err);
    }
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
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
