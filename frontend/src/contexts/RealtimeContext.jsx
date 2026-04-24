import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import supabase from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { api } from '../lib/api';

const RealtimeContext = createContext(null);















const DATA_TABLES = [
  'finances',
  'task_boards',
  'task_lists',
  'task_cards',
  'tasks',
  'goals',
  'routines',
  'routine_tasks',
  'projects',
];


const TEAM_MGMT_TABLES = [
  'teams',
  'team_members',
  'team_invitations',
];


const TABLE_LABELS = {
  finances: 'finanças',
  task_boards: 'quadros',
  task_lists: 'listas',
  task_cards: 'cartões',
  tasks: 'tarefas',
  goals: 'metas',
  routines: 'rotinas',
  routine_tasks: 'rotinas',
  projects: 'projetos',
  teams: 'times',
  team_members: 'membros',
  team_invitations: 'convites',
};


function createDebouncedDispatcher(delayMs = 300) {
  const pending = new Map();

  return (table, payload) => {
    const key = table;

    if (pending.has(key)) {
      clearTimeout(pending.get(key));
    }

    pending.set(key, setTimeout(() => {
      pending.delete(key);
      window.dispatchEvent(
        new CustomEvent('team-data-changed', {
          detail: { table, payload, timestamp: Date.now() },
        })
      );
    }, delayMs));
  };
}

export function RealtimeProvider({ children }) {
  const { user, activeTeam } = useAuth();
  const { success } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); 
  const [lastEvent, setLastEvent] = useState(null);

  
  const activeTeamRef = useRef(activeTeam);
  const userRef = useRef(user);
  const dispatcherRef = useRef(createDebouncedDispatcher(250));

  useEffect(() => { activeTeamRef.current = activeTeam; }, [activeTeam]);
  useEffect(() => { userRef.current = user; }, [user]);

  
  useEffect(() => {
    if (!supabase || !user) return;

    setConnectionStatus('connecting');

    const globalChannel = supabase
      .channel('global-user-notifications', {
        config: { broadcast: { self: false } },
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'team_invitations',
      }, (payload) => {
        if (payload.new?.invited_user_id !== user.id) return;
        console.log('🔔 [GLOBAL] Novo convite recebido:', payload.new?.id);
        success('📩 Você recebeu um novo convite de time!');
        api('/teams/invitations/inbox').then(setNotifications).catch(console.error);
        dispatcherRef.current('team_invitations', payload);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'team_invitations',
      }, (payload) => {
        if (payload.new?.invited_user_id !== user.id) return;
        console.log('🔔 [GLOBAL] Convite atualizado:', payload.new?.id, payload.new?.status);
        api('/teams/invitations/inbox').then(setNotifications).catch(console.error);
        dispatcherRef.current('team_invitations', payload);
      })
      .subscribe((status, err) => {
        console.log(`📡 [GLOBAL] WebSocket: ${status}`, err || '');
        if (status === 'SUBSCRIBED') {
          setConnected(true);
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('error');
          console.error('❌ [GLOBAL] Erro de conexão WebSocket');
        }
      });

    
    api('/teams/invitations/inbox').then(setNotifications).catch(console.error);

    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, [user, success]);

  
  useEffect(() => {
    if (!supabase || !user || activeTeam) return;

    console.log('📡 [PESSOAL] Conectando canal de dados pessoais...');

    const personalChannel = supabase.channel('personal-data-channel', {
      config: { broadcast: { self: false } },
    });

    DATA_TABLES.forEach((table) => {
      personalChannel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: table,
      }, (payload) => {
        const record = payload.new || payload.old;
        if (record && record.user_id !== userRef.current?.id) return;

        console.log(`📡 [PESSOAL] Mudança em ${table}:`, payload.eventType, record?.id);

        setLastEvent({ table, type: payload.eventType, timestamp: Date.now() });
        dispatcherRef.current(table, payload);
      });
    });

    personalChannel.subscribe((status) => {
      console.log(`📡 [PESSOAL] Status: ${status}`);
    });

    return () => {
      console.log('📡 [PESSOAL] Desconectando canal pessoal');
      supabase.removeChannel(personalChannel);
    };
  }, [user, activeTeam, success]);

  
  useEffect(() => {
    if (!supabase || !user || !activeTeam) return;

    console.log(`📡 [TIME] Conectando ao canal do time: ${activeTeam.name} (${activeTeam.id})`);

    const teamChannel = supabase.channel(`team-data-${activeTeam.id}`, {
      config: { broadcast: { self: false } },
    });

    DATA_TABLES.forEach((table) => {
      teamChannel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: table,
      }, (payload) => {
        const record = payload.new || payload.old;
        if (record && record.team_id !== activeTeamRef.current?.id) return;

        console.log(`📡 [TIME:${activeTeamRef.current?.name}] Mudança em ${table}:`, payload.eventType, record?.id);

        setLastEvent({ table, type: payload.eventType, team: activeTeamRef.current?.name, timestamp: Date.now() });
        dispatcherRef.current(table, payload);
      });
    });

    teamChannel.subscribe((status) => {
      console.log(`📡 [TIME:${activeTeam.name}] Status: ${status}`);
      if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Erro no canal do time. Verifique se o filtro team_id=eq.${activeTeam.id} é válido ou se a replicação está ativada.`);
      }
    });

    return () => {
      console.log(`📡 [TIME] Desconectando canal do time: ${activeTeam.name}`);
      supabase.removeChannel(teamChannel);
    };
  }, [user, activeTeam, success]);

  
  useEffect(() => {
    if (!supabase || !user) return;

    console.log('📡 [MGMT] Conectando canal de gerenciamento de times...');

    const mgmtChannel = supabase.channel('team-management-channel', {
      config: { broadcast: { self: true } },
    });

    
    mgmtChannel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'teams',
    }, (payload) => {
      console.log('📡 [MGMT] Mudança em teams:', payload.eventType, payload.new?.id || payload.old?.id);
      dispatcherRef.current('teams', payload);
    });

    
    mgmtChannel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'team_members',
    }, (payload) => {
      console.log('📡 [MGMT] Mudança em team_members:', payload.eventType, payload.new?.user_id || payload.old?.user_id);
      dispatcherRef.current('team_members', payload);
    });

    
    mgmtChannel.on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'users',
    }, (payload) => {
      console.log('📡 [MGMT] Perfil de usuário atualizado:', payload.new?.id);
      
      dispatcherRef.current('team_members', payload);
      dispatcherRef.current('teams', payload);
    });

    
    mgmtChannel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'team_invitations',
    }, (payload) => {
      const record = payload.new || payload.old;
      if (!record) return;

      if (record.invited_by === user.id) {
        console.log('📡 [MGMT] Convite enviado atualizado:', payload.eventType, record.id, record.status);
        dispatcherRef.current('team_invitations_sent', payload);
        if (payload.eventType === 'UPDATE') {
          dispatcherRef.current('teams', payload);
          dispatcherRef.current('team_members', payload);
        }
      }

      if (record.invited_user_id === user.id) {
        console.log('📡 [MGMT] Convite recebido atualizado:', payload.eventType, record.id, record.status);
        dispatcherRef.current('team_invitations', payload);
        if (payload.eventType === 'UPDATE' && record.status === 'accepted') {
          dispatcherRef.current('teams', payload);
        }
      }
    });

    
    mgmtChannel.on('broadcast', { event: 'team-action' }, (payload) => {
      console.log('📡 [MGMT] Broadcast recebido:', payload);
      dispatcherRef.current('teams', payload);
      dispatcherRef.current('team_members', payload);
    });

    mgmtChannel.subscribe((status) => {
      console.log(`📡 [MGMT] Status: ${status}`);
    });

    return () => {
      console.log('📡 [MGMT] Desconectando canal de gerenciamento');
      supabase.removeChannel(mgmtChannel);
    };
  }, [user]);

  
  const subscribe = useCallback((tables, callback) => {
    const handler = (e) => {
      if (tables.includes(e.detail.table)) {
        callback(e.detail);
      }
    };
    window.addEventListener('team-data-changed', handler);
    return () => window.removeEventListener('team-data-changed', handler);
  }, []);

  return (
    <RealtimeContext.Provider value={{
      notifications,
      connected,
      connectionStatus,
      lastEvent,
      subscribe,
    }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  return ctx;
}


export function useRealtimeSubscription(tables, callback, deps = []) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler = (e) => {
      if (tables.includes(e.detail.table)) {
        callbackRef.current(e.detail);
      }
    };
    window.addEventListener('team-data-changed', handler);
    return () => window.removeEventListener('team-data-changed', handler);
  }, [tables.join(','), ...deps]); 
}
