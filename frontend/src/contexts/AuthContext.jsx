import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import supabase from '../lib/supabase';

const AuthContext = createContext(null);

// Conecta o cliente Supabase Realtime com um JWT assinado pelo backend.
// Sem isso, auth.uid() é NULL nas RLS policies e nenhum evento é entregue.
const applyRealtimeAuth = (token) => {
  if (!supabase) return;
  if (token) {
    localStorage.setItem('supabaseToken', token);
    try { supabase.realtime.setAuth(token); } catch (e) { console.warn('[Realtime setAuth]', e); }
  } else {
    localStorage.removeItem('supabaseToken');
    try { supabase.realtime.setAuth(null); } catch {}
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [activeTeam, setActiveTeam] = useState(() => JSON.parse(localStorage.getItem('activeTeam')));
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    if (activeTeam) {
      localStorage.setItem('activeTeam', JSON.stringify(activeTeam));
    } else {
      localStorage.removeItem('activeTeam');
    }
  }, [activeTeam]);

  useEffect(() => {
    // Sem token = sem sessão. Não dispara nenhuma request — evita travar
    // Landing/Auth em loading se o backend estiver lento/offline.
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return;
    }

    // Restaura o token Realtime salvo (cobre o gap até o /auth/realtime-token responder).
    const cachedRt = localStorage.getItem('supabaseToken');
    if (cachedRt) applyRealtimeAuth(cachedRt);

    // Renova o token Realtime assim que a app sobe.
    api('/auth/realtime-token')
      .then((d) => { if (d?.supabaseToken) applyRealtimeAuth(d.supabaseToken); })
      .catch((e) => console.warn('[realtime-token boot]', e.message));

    // Failsafe: se /settings travar, libera o loading em 8s para não prender
    // a UI no skeleton indefinidamente. O user cache já foi hidratado do localStorage.
    const failsafe = setTimeout(() => setLoading(false), 8000);

    api('/settings')
      .then((data) => {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        
        if (data.name) localStorage.setItem('_userName', data.name);
        
        if (data.language) {
          localStorage.setItem('lang', data.language);
          window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: data.language } }));
        }
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
          applyRealtimeAuth(null);
        } else {
          console.warn('[Settings fetch failed — keeping session]', msg);
          
        }
      })
      .finally(() => {
        clearTimeout(failsafe);
        setLoading(false);
      });
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
    if (data.supabaseToken) applyRealtimeAuth(data.supabaseToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    if (data.user?.name) localStorage.setItem('_userName', data.user.name);
    if (data.user?.language) {
      localStorage.setItem('lang', data.user.language);
      window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: data.user.language } }));
    }
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
    if (data.supabaseToken) applyRealtimeAuth(data.supabaseToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    if (data.user?.name) localStorage.setItem('_userName', data.user.name);
    if (data.user?.language) {
      localStorage.setItem('lang', data.user.language);
      window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: data.user.language } }));
    }
    setUser(data.user);
    setActiveTeam(null);
    return data;
  };

  const switchAccount = () => {
    logout();
    window.location.href = '/auth';
  };

  const switchTeam = (team) => {
    // Escreve o localStorage SINCRONAMENTE antes do setState. O lib/api.js
    // lê `x-team-id` do localStorage a cada request — e as useEffects dos
    // consumers (Projects, Dashboard, etc.) com dep `[activeTeam]` disparam
    // ANTES da useEffect do próprio AuthContext no flush do React. Sem esse
    // write síncrono, o primeiro fetch pós-switch sai com o team antigo e
    // o conteúdo do workspace anterior persiste na tela.
    if (team) {
      localStorage.setItem('activeTeam', JSON.stringify(team));
    } else {
      localStorage.removeItem('activeTeam');
    }
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
    sessionStorage.removeItem('devsboard_session');
    applyRealtimeAuth(null);
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
