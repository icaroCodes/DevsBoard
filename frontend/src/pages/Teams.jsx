import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Mail, Inbox, Check, X, Plus,
  Crown, Shield, User, Trash2, LogOut, Send,
  ChevronDown, Bell, Wifi, WifiOff, Clock,
  Heart, Briefcase, MailPlus, ArrowLeft
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmModalContext';
import { useRealtime, useRealtimeSubscription } from '../contexts/RealtimeContext';
import LoadingSkeleton from '../components/LoadingSkeleton';




export default function Teams() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const { confirm } = useConfirm();

  
  const [teams, setTeams] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [sentInvites, setSentInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('teams'); 
  const [showInviteModal, setShowInviteModal] = useState(null); 
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', type: 'team' });
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedTeamData, setSelectedTeamData] = useState(null);
  const [changeRequests, setChangeRequests] = useState([]);
  const { connected: realtimeConnected } = useRealtime() || {};

  
  
  
  const fetchTeams = useCallback(async () => {
    try {
      const data = await api('/teams');
      setTeams(data || []);
    } catch (err) {
      console.error('Erro ao carregar times:', err);
    }
  }, []);

  const fetchInbox = useCallback(async () => {
    try {
      const data = await api('/teams/invitations/inbox');
      setInbox(data || []);
    } catch (err) {
      console.error('Erro ao carregar inbox:', err);
    }
  }, []);

  const fetchSentInvites = useCallback(async () => {
    try {
      const data = await api('/teams/invitations/sent');
      setSentInvites(data || []);
    } catch (err) {
      console.error('Erro ao carregar convites enviados:', err);
    }
  }, []);

  
  const fetchChangeRequests = useCallback(async () => {
    try {
      const data = await api('/teams/change-requests/inbox');
      setChangeRequests(data || []);
    } catch (err) {
      console.error('Erro ao buscar requests:', err);
    }
  }, []);

  
  const fetchTeamDetail = useCallback(async (teamId) => {
    if (!teamId) return;
    try {
      const data = await api('/teams');
      const team = (data || []).find(t => t.id === teamId);
      if (team) {
        setSelectedTeamData(team);
        setTeams(data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes do time:', err);
    }
  }, []);

  
  
  
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchTeams(), fetchInbox(), fetchSentInvites(), fetchChangeRequests()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchTeams, fetchInbox, fetchSentInvites, fetchChangeRequests]);

  
  
  
  useRealtimeSubscription(
    ['teams', 'team_members', 'team_invitations', 'team_invitations_sent', 'change_requests'],
    (detail) => {
      console.log('🔔 [Teams] Realtime event:', detail.table, detail.payload?.eventType);

      if (detail.table === 'team_invitations' || detail.table === 'team_invitations_sent' || detail.table === 'change_requests') {
        fetchInbox();
        fetchSentInvites();
        fetchTeams();
        fetchChangeRequests();
      }
      if (detail.table === 'team_members' || detail.table === 'teams') {
        fetchTeams();
        
        if (selectedTeam) {
          fetchTeamDetail(selectedTeam);
        }
      }
    }
  );

  
  
  
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeam.name.trim()) return;
    setCreating(true);
    try {
      await api('/teams', {
        method: 'POST',
        body: JSON.stringify(newTeam),
      });
      success(`${newTeam.type === 'family' ? 'Família' : 'Time'} "${newTeam.name}" criado!`);
      setNewTeam({ name: '', type: 'team' });
      setActiveTab('teams');
      fetchTeams();
    } catch (err) {
      toastError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !showInviteModal) return;
    setInviting(true);
    try {
      await api(`/teams/${showInviteModal}/invite`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail }),
      });
      success(`Convite enviado para ${inviteEmail}!`);
      setInviteEmail('');
      setShowInviteModal(null);
      fetchSentInvites();
    } catch (err) {
      toastError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleAcceptInvite = async (invitationId) => {
    try {
      const result = await api(`/teams/invitations/${invitationId}/accept`, { method: 'POST' });
      success(result.message || 'Convite aceito!');
      fetchInbox();
      fetchTeams();
    } catch (err) {
      toastError(err.message);
    }
  };

  const handleRejectInvite = async (invitationId) => {
    confirm({
      title: 'Rejeitar convite?',
      message: 'Tem certeza que deseja rejeitar este convite?',
      onConfirm: async () => {
        try {
          await api(`/teams/invitations/${invitationId}/reject`, { method: 'POST' });
          success('Convite rejeitado.');
          fetchInbox();
        } catch (err) {
          toastError(err.message);
        }
      }
    });
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    confirm({
      title: `Excluir "${teamName}"?`,
      message: 'Todos os membros serão removidos e os dados do time serão perdidos.',
      onConfirm: async () => {
        try {
          await api(`/teams/${teamId}`, { method: 'DELETE' });
          success('Time excluído.');
          setSelectedTeam(null);
          setSelectedTeamData(null);
          fetchTeams();
        } catch (err) {
          toastError(err.message);
        }
      }
    });
  };

  const handleLeaveTeam = async (teamId, teamName) => {
    confirm({
      title: `Sair de "${teamName}"?`,
      message: 'Você não terá mais acesso a este time.',
      onConfirm: async () => {
        try {
          await api(`/teams/${teamId}/members/${user.id}`, { method: 'DELETE' });
          success('Você saiu do time.');
          setSelectedTeam(null);
          setSelectedTeamData(null);
          fetchTeams();
        } catch (err) {
          toastError(err.message);
        }
      }
    });
  };

  const handleRemoveMember = async (teamId, memberId, memberName) => {
    confirm({
      title: `Remover "${memberName}"?`,
      message: 'O membro será removido do time.',
      onConfirm: async () => {
        try {
          await api(`/teams/${teamId}/members/${memberId}`, { method: 'DELETE' });
          success('Membro removido.');
          fetchTeams();
        } catch (err) {
          toastError(err.message);
        }
      }
    });
  };

  const handleChangeRole = async (teamId, memberId, role) => {
    try {
      await api(`/teams/${teamId}/members/${memberId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
      });
      success('Papel do membro atualizado.');
      fetchTeamDetail(teamId);
      fetchTeams();
    } catch (err) {
      toastError(err.message);
    }
  };

  const handleApproveChange = async (reqId) => {
    try {
      await api(`/teams/change-requests/${reqId}/approve`, { method: 'POST' });
      success('Alteração aprovada com sucesso.');
      fetchChangeRequests();
    } catch (err) {
      toastError(err.message);
    }
  };

  const handleRejectChange = async (reqId) => {
    try {
      await api(`/teams/change-requests/${reqId}/reject`, { method: 'POST' });
      success('Alteração rejeitada.');
      fetchChangeRequests();
    } catch (err) {
      toastError(err.message);
    }
  };

  
  
  
  const getRoleIcon = (role) => {
    if (role === 'owner') return <Crown size={14} className="text-amber-400" />;
    if (role === 'admin') return <Shield size={14} className="text-blue-400" />;
    return <User size={14} className="text-zinc-500" />;
  };

  const getRoleLabel = (role) => {
    if (role === 'owner') return 'Dono';
    if (role === 'admin') return 'Admin';
    return 'Membro';
  };

  const getTypeIcon = (type) => {
    if (type === 'family') return <Heart size={18} className="text-pink-400" />;
    return <Briefcase size={18} className="text-blue-400" />;
  };

  const timeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'agora mesmo';
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
  };

  
  
  
  if (loading) return <LoadingSkeleton variant="teams" />;

  
  
  
  if (selectedTeam) {
    const team = selectedTeamData || teams.find(t => t.id === selectedTeam);
    if (!team) {
      setSelectedTeam(null);
      setSelectedTeamData(null);
      return null;
    }

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto pb-12">
        {}
        <div className="mb-8 px-1">
          <button
            onClick={() => { setSelectedTeam(null); setSelectedTeamData(null); }}
            className="flex items-center gap-2 text-[#86868B] hover:text-white transition-all mb-6 group w-fit"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
              <ArrowLeft size={16} strokeWidth={3} />
            </div>
            <span className="text-[14px] font-bold uppercase tracking-widest">Painel Geral</span>
          </button>
          
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[28px] flex items-center justify-center relative overflow-hidden ${
              team.type === 'family' 
                ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' 
                : 'bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/20'
            }`}>
              {}
              <div className={`absolute inset-0 opacity-20 blur-xl ${team.type === 'family' ? 'bg-pink-500' : 'bg-[#0A84FF]'}`} />
              <div className="relative z-10 scale-125">
                {team.type === 'family' ? <Heart size={28} /> : <Briefcase size={28} />}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-[28px] sm:text-[36px] font-extrabold text-white tracking-tight leading-none">{team.name}</h1>
                <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                  team.type === 'family' ? 'bg-pink-500/20 text-pink-400' : 'bg-[#0A84FF]/20 text-[#0A84FF]'
                }`}>
                  {team.type === 'family' ? 'Família' : 'Time'}
                </div>
              </div>
              <p className="text-[14px] text-[#86868B] font-medium">
                {team.member_count} {team.member_count === 1 ? 'membro conectado' : 'membros conectados'}
              </p>
            </div>
          </div>
        </div>

        {}
        <section className="bg-transparent mb-8">
          <div className="flex items-center justify-between mb-5 px-1">
            <h2 className="text-[18px] font-bold text-white tracking-tight flex items-center gap-2">
              Membros do grupo
              <span className="text-[14px] text-[#86868B] font-medium">({team.member_count})</span>
            </h2>
            {['owner', 'admin'].includes(team.my_role) && (
              <button
                onClick={() => setShowInviteModal(team.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-[13px] font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                <UserPlus size={14} strokeWidth={3} />
                Convidar
              </button>
            )}
          </div>

          <div className="space-y-2">
            {team.members?.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between p-4 rounded-3xl bg-[#1C1C1E] border border-white/[0.03] hover:border-white/[0.1] transition-all group/member"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {member.user?.avatar_url ? (
                      <img src={member.user.avatar_url} alt="" className="w-11 h-11 rounded-full border-2 border-white/10 object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#3A3A3C] to-[#2C2C2E] flex items-center justify-center border-2 border-white/10">
                        <span className="text-sm font-black text-zinc-300">{member.user?.name?.[0]?.toUpperCase() || '?'}</span>
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1C1C1E] flex items-center justify-center border border-white/5">
                      {getRoleIcon(member.role)}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-white leading-none">{member.user?.name || 'Usuário'}</span>
                      {member.user_id === user.id && (
                        <span className="text-[9px] bg-white text-black px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">EU</span>
                      )}
                    </div>
                    <span className="text-[12px] text-[#86868B] font-medium">{member.user?.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {['owner', 'admin'].includes(team.my_role) && member.role !== 'owner' && member.user_id !== user.id && (
                    <select
                      value={member.role}
                      onChange={(e) => handleChangeRole(team.id, member.user_id, e.target.value)}
                      className="bg-[#2C2C2E] border border-white/10 text-white text-[11px] font-bold rounded-lg px-2 py-1 outline-none mr-2 appearance-none cursor-pointer hover:bg-[#3A3A3C] transition-colors"
                    >
                      <option value="admin">ADMIN</option>
                      <option value="member">MEMBRO</option>
                    </select>
                  )}

                  {member.user_id === user.id && member.role !== 'owner' && (
                    <button
                      onClick={() => handleLeaveTeam(team.id, team.name)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-[#86868B] hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-all active:scale-90"
                      title="Sair do time"
                    >
                      <LogOut size={18} />
                    </button>
                  )}
                  {['owner', 'admin'].includes(team.my_role) && member.user_id !== user.id && member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(team.id, member.user_id, member.user?.name)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-[#86868B] hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-all active:scale-90"
                      title="Remover membro"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {}
        {team.my_role === 'owner' && (
          <section className="bg-[#1C1C1E] border border-white/[0.04] rounded-[28px] overflow-hidden shadow-sm p-6">
            <div className="flex items-center justify-between p-4 bg-[#FF453A]/5 border border-[#FF453A]/10 rounded-2xl">
              <div>
                <p className="text-[14px] font-medium text-[#F5F5F7]">Excluir {team.type === 'family' ? 'família' : 'time'}</p>
                <p className="text-[12px] text-[#86868B] mt-0.5">Ação irreversível. Todos os membros serão removidos.</p>
              </div>
              <button
                onClick={() => handleDeleteTeam(team.id, team.name)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF453A] text-white text-[12px] font-bold hover:bg-[#FF3B30] transition-colors"
              >
                <Trash2 size={14} /> Excluir
              </button>
            </div>
          </section>
        )}
      </motion.div>
    );
  }

  
  
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto pb-12">
      <div className="mb-8 flex items-end justify-between px-1">
        <div className="flex-1 min-w-0">
          {}
          <h1 className="text-[28px] sm:text-[32px] font-bold text-white tracking-tighter sm:tracking-tight mb-1">
            Times <span className="font-light text-white/30">&</span> Família
          </h1>
          
          <p className="text-[14px] sm:text-[15px] text-[#86868B] font-medium">Gerencie seus grupos e convites</p>
        </div>
        
        <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
          <div className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-all duration-500 ${
            realtimeConnected 
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
              : 'bg-amber-500/5 border-amber-500/20 text-amber-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${realtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              {realtimeConnected ? 'Live' : 'Off'}
            </span>
          </div>
          
          <button
            onClick={() => setActiveTab('create')}
            className="hidden sm:flex px-4 h-10 rounded-xl bg-white text-black items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5 font-bold text-[13px]"
          >
            <Plus size={16} strokeWidth={3} />
            Novo Grupo
          </button>
        </div>
      </div>

      <div className="sticky top-0 z-40 -mx-4 px-4 pb-4 pt-2 bg-transparent pointer-events-none mb-4">
        <div className="overflow-x-auto scrollbar-hide pointer-events-auto">
          <div className="flex p-1.5 bg-[#1C1C1E]/60 backdrop-blur-xl rounded-[24px] border border-white/[0.06] w-fit shadow-2xl">
            {[
              { id: 'teams', label: 'Meus Times',       labelShort: 'Times',   icon: Users, count: teams.length },
              { id: 'inbox', label: 'Mensagens', labelShort: 'Inbox', icon: Inbox, count: inbox.length + changeRequests.length },
              { id: 'create', label: 'Novo Grupo',       labelShort: 'Criar',    icon: Plus,  count: null },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-[18px] text-[13px] font-bold transition-all duration-300 outline-none whitespace-nowrap ${
                  activeTab === tab.id ? 'text-white' : 'text-[#86868B] hover:text-white/60'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-[#323235] rounded-[18px] shadow-lg -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <tab.icon size={16} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                <span className="sm:hidden">{tab.labelShort}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span className={`inline-flex items-center justify-center px-1.5 min-w-[20px] h-[20px] rounded-full text-[10px] font-black border ${
                    activeTab === tab.id
                      ? 'bg-white text-black border-white'
                      : 'bg-white/5 text-[#86868B] border-white/10'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {}
      {}
      {}
      <AnimatePresence mode="wait">
        {activeTab === 'teams' && (
          <motion.div
            key="teams"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {teams.length === 0 ? (
              <div className="glass-card bg-[#1C1C1E] border border-white/[0.04] rounded-[28px] p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#2C2C2E] flex items-center justify-center mx-auto mb-4">
                  <Users size={24} className="text-[#86868B]" />
                </div>
                <h3 className="text-[17px] font-semibold text-[#F5F5F7] mb-2">Nenhum time ainda</h3>
                <p className="text-[13px] text-[#86868B] mb-6">Crie um time ou família para começar a colaborar.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-6 py-3 rounded-xl bg-[#0A84FF] text-white text-[14px] font-semibold hover:bg-[#007AFF] transition-all active:scale-[0.98]"
                >
                  <Plus size={16} className="inline mr-2" />
                  Criar Time
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
                {teams.map((team, idx) => (
                  <motion.div
                    key={team.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => { setSelectedTeam(team.id); fetchTeamDetail(team.id); }}
                    className="group relative bg-[#1C1C1E] border border-white/[0.05] rounded-[24px] p-4 sm:p-5 hover:bg-[#242424] hover:border-white/[0.1] transition-all cursor-pointer overflow-hidden isolate active:scale-[0.99]"
                  >
                    {}
                    <div className="sm:hidden absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 pointer-events-none">
                      <div className={`absolute -top-[50%] -right-[20%] w-[150%] h-[150%] blur-[80px] rounded-full opacity-[0.15] ${
                        team.type === 'family' ? 'bg-pink-500' : 'bg-[#0A84FF]'
                      }`} />
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 relative z-10 transition-transform">
                      {}
                      <div className={`w-14 h-14 sm:w-12 sm:h-12 rounded-[20px] sm:rounded-xl shrink-0 flex items-center justify-center transition-all duration-500 group-hover:scale-105 ${
                        team.type === 'family'
                          ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                          : 'bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/20'
                      }`}>
                        {getTypeIcon(team.type)}
                      </div>

                      {}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-[17px] sm:text-[18px] font-bold text-white truncate">
                            {team.name}
                          </h3>
                          <span className={`shrink-0 text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md border ${
                            team.my_role === 'owner' 
                              ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' 
                              : 'bg-white/5 text-[#86868B] border-white/5'
                          }`}>
                            {getRoleLabel(team.my_role)}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex -space-x-2.5">
                            {team.members?.slice(0, 4).map((m, i) => (
                              <div key={m.user_id} className="relative z-0" style={{ zIndex: 10 - i }}>
                                {m.user?.avatar_url ? (
                                  <img
                                    src={m.user.avatar_url}
                                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-[#1C1C1E] object-cover ring-1 ring-white/5"
                                  />
                                ) : (
                                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#3A3A3C] border-2 border-[#1C1C1E] ring-1 ring-white/5 flex items-center justify-center">
                                    <span className="text-[9px] font-black text-zinc-400 uppercase">
                                      {m.user?.name?.[0]}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                            {team.member_count > 4 && (
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#2C2C2E] border-2 border-[#1C1C1E] ring-1 ring-white/5 flex items-center justify-center">
                                <span className="text-[8px] font-black text-[#86868B]">+{team.member_count - 4}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-[12px] sm:text-[13px] font-medium text-[#86868B]">
                            {team.member_count} {team.member_count === 1 ? 'membro' : 'membros'}
                          </span>
                        </div>
                      </div>

                      {}
                      <div className="hidden sm:flex w-8 h-8 rounded-full bg-white/5 items-center justify-center text-[#86868B] group-hover:bg-white group-hover:text-black transition-all shrink-0">
                        <ChevronDown size={14} strokeWidth={3} className="-rotate-90" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {}
        {}
        {}
        {activeTab === 'inbox' && (
          <motion.div
            key="inbox"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {(inbox.length === 0 && changeRequests.length === 0) ? (
              <div className="glass-card bg-[#1C1C1E] border border-white/[0.04] rounded-[28px] p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#2C2C2E] flex items-center justify-center mx-auto mb-4">
                  <Inbox size={28} className="text-[#86868B]" />
                </div>
                <h3 className="text-[18px] font-semibold text-[#F5F5F7] mb-2">Caixa de entrada vazia</h3>
                <p className="text-[14px] text-[#86868B]">Nenhum convite pendente no momento.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {}
                {changeRequests?.length > 0 && (
                  <div className="mb-10">
                    <div className="flex items-center gap-3 px-1 mb-5">
                       <div className="w-8 h-8 rounded-lg bg-[#0A84FF]/10 flex items-center justify-center text-[#0A84FF]">
                          <Shield size={18} />
                       </div>
                       <h3 className="text-[15px] font-bold text-[#F5F5F7] tracking-tight">
                          Solicitações de Membros <span className="text-[#86868B] ml-1 font-medium">({changeRequests.length})</span>
                       </h3>
                    </div>
                    
                    <div className="grid gap-4">
                      {changeRequests.map((req) => (
                        <motion.div 
                          key={req.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group relative bg-[#1C1C1E] border border-white/[0.05] rounded-[32px] p-6 overflow-hidden transition-all hover:bg-[#242427]"
                        >
                          <div className="flex flex-col sm:flex-row gap-6 items-start justify-between relative z-10">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3A3A3C] to-[#2C2C2E] flex items-center justify-center border border-white/10 shadow-lg">
                                   {req.user?.avatar_url ? (
                                      <img src={req.user.avatar_url} className="w-full h-full rounded-2xl object-cover" />
                                   ) : (
                                      <span className="text-sm font-black text-white/50">{req.user?.name?.[0]}</span>
                                   )}
                                </div>
                                <div>
                                   <p className="text-[15px] text-white font-bold leading-tight">
                                      {req.user?.name}
                                   </p>
                                   <p className="text-[13px] text-[#86868B] font-medium">
                                      no time <span className="text-white/80">{req.team?.name}</span>
                                   </p>
                                </div>
                              </div>
                              
                              <div className="bg-black/40 rounded-2xl p-4 border border-white/5 relative group-hover:border-white/10 transition-colors">
                                 <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                                    <span className="text-[10px] font-black text-[#86868B] uppercase tracking-[0.2em]">Detalhes da Alteração</span>
                                    <div className="px-2 py-0.5 rounded bg-[#0A84FF]/10 text-[#0A84FF] text-[9px] font-black">
                                       {req.action_type === 'create' ? 'CREATE' : req.action_type === 'delete' ? 'DELETE' : 'UPDATE'}
                                    </div>
                                 </div>
                                 <div className="text-[12px] text-zinc-400 font-mono leading-relaxed overflow-x-auto max-h-[150px] custom-scrollbar">
                                    {JSON.stringify(req.payload, null, 2)}
                                 </div>
                              </div>
                            </div>

                            <div className="flex flex-row sm:flex-col gap-3 shrink-0 w-full sm:w-auto">
                               <button 
                                  onClick={() => handleApproveChange(req.id)} 
                                  className="flex-1 sm:w-32 h-12 rounded-2xl bg-white text-black text-[13px] font-extrabold transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
                               >
                                  Aprovar
                               </button>
                               <button 
                                  onClick={() => handleRejectChange(req.id)} 
                                  className="flex-1 sm:w-32 h-12 rounded-2xl bg-[#2C2C2E] text-[#86868B] hover:text-white text-[13px] font-extrabold transition-all active:scale-95 border border-white/5"
                               >
                                  Rejeitar
                               </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
                
                {inbox.length > 0 && (
                  <h3 className="text-[14px] font-semibold text-[#86868B] uppercase tracking-wider px-1 mb-3">
                    {inbox.length} {inbox.length === 1 ? 'convite pendente' : 'convites pendentes'}
                  </h3>
                )}
                {inbox.map((invitation) => (
                  <motion.div
                    key={invitation.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#1C1C1E] border border-white/[0.04] rounded-[24px] p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF9F0A]/15 to-[#FF375F]/15 border border-white/[0.06] flex items-center justify-center shrink-0">
                        <MailPlus size={20} className="text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[16px] font-semibold text-[#F5F5F7]">
                          Convite para{' '}
                          <span className="text-[#0A84FF]">{invitation.team?.name || 'Time'}</span>
                        </h4>
                        <p className="text-[13px] text-[#86868B] mt-1">
                          <span className="text-zinc-300 font-medium">{invitation.invited_by_user?.name || 'Alguém'}</span>
                          {' '}convidou você para participar{' '}
                          {invitation.team?.type === 'family' ? 'da família' : 'do time'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock size={11} className="text-[#86868B]" />
                          <span className="text-[11px] text-[#86868B]">{timeAgo(invitation.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                          <button
                            onClick={() => handleAcceptInvite(invitation.id)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#30D158] text-white text-[13px] font-semibold hover:bg-[#28C84E] transition-all active:scale-[0.97]"
                          >
                            <Check size={15} /> Aceitar
                          </button>
                          <button
                            onClick={() => handleRejectInvite(invitation.id)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF453A]/10 text-[#FF453A] text-[13px] font-semibold hover:bg-[#FF453A]/20 transition-all active:scale-[0.97]"
                          >
                            <X size={15} /> Rejeitar
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {}
                {sentInvites.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-[14px] font-semibold text-[#86868B] uppercase tracking-wider px-1 mb-3">
                      Convites enviados por você
                    </h3>
                    {sentInvites.map((inv) => (
                      <div
                        key={inv.id}
                        className="bg-[#1C1C1E] border border-white/[0.04] rounded-[20px] p-4 flex items-center justify-between mb-2"
                      >
                        <div className="flex items-center gap-3">
                          <Send size={14} className="text-[#86868B]" />
                          <div>
                            <span className="text-[13px] text-[#F5F5F7]">
                              {inv.invited_user?.name || inv.invited_email}
                            </span>
                            <span className="text-[12px] text-[#86868B] ml-2">→ {inv.team?.name}</span>
                          </div>
                        </div>
                        <span className={`text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${inv.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                            inv.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400' :
                              'bg-red-500/10 text-red-400'
                          }`}>
                          {inv.status === 'pending' ? 'Pendente' : inv.status === 'accepted' ? 'Aceito' : 'Rejeitado'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {}
        {}
        {}
        {activeTab === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="glass-card bg-[#1C1C1E] border border-white/[0.04] rounded-[28px] p-8">
              <h3 className="text-[20px] font-semibold text-[#F5F5F7] mb-6">Criar novo grupo</h3>

              <form onSubmit={handleCreateTeam} className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[13px] font-black text-[#86868B] ml-1 uppercase tracking-[0.2em]">Escolha o Tipo de Grupo</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { value: 'team', label: 'Time Profissional', icon: Briefcase, desc: 'Ideal para projetos e colaboração.', color: 'blue' },
                      { value: 'family', label: 'Grupo Familiar', icon: Heart, desc: 'Perfeito para família e amigos.', color: 'pink' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNewTeam({ ...newTeam, type: opt.value })}
                        className={`relative p-6 rounded-[32px] border-2 text-left transition-all overflow-hidden isolate ${newTeam.type === opt.value
                            ? opt.color === 'blue'
                              ? 'border-[#0A84FF] bg-[#0A84FF]/5'
                              : 'border-pink-500 bg-pink-500/5'
                            : 'border-white/5 bg-[#1C1C1E] hover:border-white/10'
                          }`}
                      >
                        {}
                        {newTeam.type === opt.value && (
                          <div className={`absolute -inset-4 blur-[40px] opacity-[0.15] -z-10 ${opt.color === 'blue' ? 'bg-[#0A84FF]' : 'bg-pink-500'}`} />
                        )}

                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-500 ${
                          newTeam.type === opt.value 
                            ? opt.color === 'blue' ? 'bg-[#0A84FF] text-white' : 'bg-pink-500 text-white'
                            : 'bg-white/5 text-[#86868B]'
                        }`}>
                          <opt.icon size={24} strokeWidth={2.5} />
                        </div>
                        
                        <p className={`text-[17px] font-bold tracking-tight ${newTeam.type === opt.value ? 'text-white' : 'text-[#86868B]'}`}>
                          {opt.label}
                        </p>
                        <p className="text-[13px] text-[#86868B] font-medium mt-1">{opt.desc}</p>
                        
                        {newTeam.type === opt.value && (
                          <div className="absolute top-6 right-6 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                            <Check size={14} strokeWidth={4} className="text-black" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {}
                <div className="space-y-2">
                  <label className="text-[13px] font-black text-[#86868B] ml-1 uppercase tracking-[0.2em]">Nome do Grupo</label>
                  <input
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder={newTeam.type === 'family' ? 'Ex: Família Silva' : 'Ex: Squad Frontend'}
                    className="w-full px-6 py-5 rounded-[24px] bg-[#1C1C1E] border border-white/5 text-[18px] font-bold text-white focus:border-[#0A84FF] focus:bg-[#242427] focus:outline-none transition-all placeholder:text-white/20 placeholder:font-medium"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating || !newTeam.name.trim()}
                  className="w-full h-16 rounded-[24px] bg-white text-black text-[16px] font-black hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 shadow-2xl disabled:pointer-events-none"
                >
                  {creating ? 'Processando...' : `Criar ${newTeam.type === 'family' ? 'Família' : 'Time'}`}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      {}
      {}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowInviteModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#1C1C1E] border border-white/10 rounded-[32px] p-8 w-full max-w-md shadow-2xl overflow-hidden relative isolate"
              onClick={e => e.stopPropagation()}
            >
              {}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0A84FF] opacity-[0.05] blur-[60px] -z-10" />

              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#0A84FF]/10 flex items-center justify-center text-[#0A84FF] border border-[#0A84FF]/20">
                  <UserPlus size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-[20px] font-bold text-white tracking-tight">Convidar Membro</h3>
                  <p className="text-[14px] text-[#86868B] font-medium">
                    {teams.find(t => t.id === showInviteModal)?.name}
                  </p>
                </div>
              </div>

              <form onSubmit={handleInvite} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#86868B] ml-1 uppercase tracking-[0.2em]">Endereço de E-mail</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#86868B] group-focus-within:text-white transition-colors" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="usuario@email.com"
                      className="w-full pl-14 pr-6 py-4.5 rounded-[22px] bg-[#2C2C2E]/50 border border-white/5 text-[16px] font-bold text-white focus:border-[#0A84FF] focus:bg-[#2C2C2E] focus:outline-none transition-all placeholder:text-[#86868B]/50"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(null)}
                    className="flex-1 h-14 rounded-[20px] bg-white/5 text-[#86868B] text-[14px] font-bold hover:text-white transition-all active:scale-95"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={inviting || !inviteEmail.trim()}
                    className="flex-1 h-14 rounded-[20px] bg-white text-black text-[14px] font-black hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-white/5"
                  >
                    {inviting ? 'Enviando...' : (
                      <>
                        <Send size={16} strokeWidth={3} /> Enviar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {}
      <div className="fixed bottom-24 right-6 z-50 sm:hidden">
        <button
          onClick={() => setActiveTab('create')}
          className="w-14 h-14 rounded-full bg-white text-black shadow-2xl flex items-center justify-center active:scale-90 transition-transform ring-4 ring-black"
        >
          <Plus size={28} strokeWidth={3} />
        </button>
      </div>
    </motion.div>
  );
}
