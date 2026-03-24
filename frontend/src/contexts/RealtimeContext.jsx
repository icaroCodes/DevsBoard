import { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { api } from '../lib/api';

const RealtimeContext = createContext(null);

export function RealtimeProvider({ children }) {
  const { user, activeTeam } = useAuth();
  const { success } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!supabase || !user) return;

    // Conectar ao canal global de notificações/convites
    const globalChannel = supabase
      .channel('global-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'team_invitations',
        filter: `invited_user_id=eq.${user.id}`
      }, (payload) => {
        console.log('🔔 Convite recebido em tempo real:', payload);
        success('📩 Você recebeu um novo convite de time!');
        api(`/teams/invitations/inbox`).then(setNotifications);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'team_invitations',
        filter: `invited_user_id=eq.${user.id}`
      }, (payload) => {
        api(`/teams/invitations/inbox`).then(setNotifications);
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
        console.log(`📡 WebSocket Principal: ${status}`);
      });

    let teamChannel = null;
    if (activeTeam) {
      console.log(`📡 Conectando ao canal da equipe: ${activeTeam.name}`);
      teamChannel = supabase.channel(`team-${activeTeam.id}`);
      
      const tables = [
        'finances', 
        'task_boards', 
        'task_lists', 
        'task_cards', 
        'tasks', 
        'goals', 
        'routines', 
        'projects',
        'project_assets'
      ];
      
      tables.forEach(table => {
        teamChannel.on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: table,
          filter: `team_id=eq.${activeTeam.id}`
        }, (payload) => {
          console.log(`📡 REALTIME [${activeTeam.name}] - Mudança em ${table}:`, payload.eventType, payload.new?.id || payload.old?.id);
          window.dispatchEvent(new CustomEvent('team-data-changed', { detail: { table, payload } }));
          
          if (payload.eventType === 'INSERT' && payload.new.user_id !== user.id) {
            success(`✨ Nova atualização em ${table} da equipe!`);
          }
        });
      });

      teamChannel.subscribe((status) => {
        console.log(`📡 WebSocket Equipe (${activeTeam.name}): STATUS = ${status}`);
        if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Erro no canal da equipe. Verifique se o filtro team_id=eq.${activeTeam.id} é válido ou se a replicação está ativada.`);
        }
      });
    }

    // Carga inicial de notificações
    api('/teams/invitations/inbox').then(setNotifications).catch(console.error);

    return () => {
      supabase.removeChannel(globalChannel);
      if (teamChannel) supabase.removeChannel(teamChannel);
    };
  }, [user, activeTeam, success]);

  return (
    <RealtimeContext.Provider value={{ notifications, connected }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  return ctx;
}
