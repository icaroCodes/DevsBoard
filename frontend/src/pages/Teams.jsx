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

// ============================================
// TEAMS PAGE — Times & Família com WebSocket
// ============================================
export default function Teams() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const { confirm } = useConfirm();

  // State
  const [teams, setTeams] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [sentInvites, setSentInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('teams'); // teams | inbox | create
  const [showInviteModal, setShowInviteModal] = useState(null); // team id
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', type: 'team' });
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedTeamData, setSelectedTeamData] = useState(null);
  const [changeRequests, setChangeRequests] = useState([]);
  const { connected: realtimeConnected } = useRealtime() || {};

  // ============================================
  // FETCH DATA
  // ============================================
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

  // Change Requests
  const fetchChangeRequests = useCallback(async () => {
    try {
      const data = await api('/teams/change-requests/inbox');
      setChangeRequests(data || []);
    } catch (err) {
      console.error('Erro ao buscar requests:', err);
    }
  }, []);

  // Carregar detalhes do time selecionado
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

  // ============================================
  // INITIAL LOAD
  // ============================================
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchTeams(), fetchInbox(), fetchSentInvites(), fetchChangeRequests()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchTeams, fetchInbox, fetchSentInvites, fetchChangeRequests]);

  // ============================================
  // SUPABASE REALTIME via centralized RealtimeContext
  // ============================================
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
        // Se estiver vendo detalhes de um time, atualizar também
        if (selectedTeam) {
          fetchTeamDetail(selectedTeam);
        }
      }
    }
  );

  // ============================================
  // ACTIONS
  // ============================================
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

  // ============================================
  // HELPERS
  // ============================================
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

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="flex gap-2 items-center justify-center h-[40vh]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#86868B] animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2.5 h-2.5 rounded-full bg-[#86868B] animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2.5 h-2.5 rounded-full bg-[#86868B] animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    );
  }

  // ============================================
  // TEAM DETAIL VIEW
  // ============================================
  if (selectedTeam) {
    const team = selectedTeamData || teams.find(t => t.id === selectedTeam);
    if (!team) {
      setSelectedTeam(null);
      setSelectedTeamData(null);
      return null;
    }

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto pb-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => { setSelectedTeam(null); setSelectedTeamData(null); }}
            className="flex items-center gap-2 text-[#86868B] hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[14px]">Voltar</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0A84FF]/20 to-[#5E5CE6]/20 border border-white/[0.06] flex items-center justify-center">
              {team.type === 'family' ? <Heart size={24} className="text-pink-400" /> : <Briefcase size={24} className="text-blue-400" />}
            </div>
            <div>
              <h1 className="text-[28px] font-semibold text-[#F5F5F7] tracking-tight">{team.name}</h1>
              <p className="text-[14px] text-[#86868B]">
                {team.type === 'family' ? 'Família' : 'Time'} · {team.member_count} {team.member_count === 1 ? 'membro' : 'membros'} · Seu papel: {getRoleLabel(team.my_role)}
              </p>
            </div>
          </div>
        </div>

        {/* Members */}
        <section className="bg-[#1C1C1E] border border-white/[0.04] rounded-[28px] overflow-hidden shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[17px] font-semibold text-[#F5F5F7] flex items-center gap-2">
              <Users size={18} className="text-[#86868B]" />
              Membros
            </h2>
            {['owner', 'admin'].includes(team.my_role) && (
              <button
                onClick={() => setShowInviteModal(team.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A84FF] text-white text-[13px] font-semibold hover:bg-[#007AFF] transition-all active:scale-[0.98]"
              >
                <UserPlus size={15} />
                Convidar
              </button>
            )}
          </div>

          <div className="space-y-2">
            {team.members?.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between p-4 rounded-2xl bg-[#2C2C2E]/50 border border-white/[0.03] hover:bg-[#2C2C2E] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {member.user?.avatar_url ? (
                    <img src={member.user.avatar_url} alt="" className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#3A3A3C] flex items-center justify-center border border-white/10">
                      <span className="text-sm font-bold text-zinc-300">{member.user?.name?.[0]?.toUpperCase() || '?'}</span>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-medium text-[#F5F5F7]">{member.user?.name || 'Usuário'}</span>
                      {getRoleIcon(member.role)}
                      <span className="text-[11px] text-[#86868B] uppercase tracking-wider">{getRoleLabel(member.role)}</span>
                      {member.user_id === user.id && (
                        <span className="text-[10px] bg-[#0A84FF]/15 text-[#0A84FF] px-2 py-0.5 rounded-full font-bold">VOCÊ</span>
                      )}
                    </div>
                    <span className="text-[12px] text-[#86868B]">{member.user?.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {['owner', 'admin'].includes(team.my_role) && member.role !== 'owner' && member.user_id !== user.id && (
                    <select
                      value={member.role}
                      onChange={(e) => handleChangeRole(team.id, member.user_id, e.target.value)}
                      className="bg-[#1C1C1E] border border-white/10 text-[#86868B] text-[12px] rounded-lg px-2 py-1 outline-none mr-2"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Membro</option>
                    </select>
                  )}

                  {member.user_id === user.id && member.role !== 'owner' && (
                    <button
                      onClick={() => handleLeaveTeam(team.id, team.name)}
                      className="p-2 rounded-xl text-[#86868B] hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-all"
                      title="Sair do time"
                    >
                      <LogOut size={16} />
                    </button>
                  )}
                  {['owner', 'admin'].includes(team.my_role) && member.user_id !== user.id && member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(team.id, member.user_id, member.user?.name)}
                      className="p-2 rounded-xl text-[#86868B] hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-all"
                      title="Remover membro"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Danger Zone */}
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

  // ============================================
  // MAIN VIEW
  // ============================================
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-semibold text-[#F5F5F7] tracking-tight">Times & Família</h1>
          <p className="text-[15px] text-[#86868B] mt-1 flex items-center gap-2">
            Gerencie seus grupos e convites
            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${realtimeConnected
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-amber-500/10 text-amber-400'
              }`}>
              {realtimeConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
              {realtimeConnected ? 'Tempo real' : 'Conectando...'}
            </span>
          </p>
        </div>
      </div>

      {/* Tabs Switcher - Pill Style */}
      <div className="flex p-1.5 bg-[#1C1C1E]/80 backdrop-blur-md rounded-[20px] border border-white/[0.04] mb-10 w-fit mx-auto sm:mx-0">
        {[
          { id: 'teams', label: 'Meus Times', icon: Users, count: teams.length },
          { id: 'inbox', label: 'Caixa de Entrada', icon: Inbox, count: (inbox.length + changeRequests.length) },
          { id: 'create', label: 'Novo Time', icon: Plus, count: null },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2.5 px-6 py-2.5 rounded-[14px] text-[13px] font-semibold transition-all duration-300 outline-none ${activeTab === tab.id ? 'text-white' : 'text-[#86868B] hover:text-[#A1A1A1]'}`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabBg"
                className="absolute inset-0 bg-[#3A3A3C] rounded-[14px] shadow-sm -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <tab.icon size={16} strokeWidth={activeTab === tab.id ? 2.5 : 2} className="shrink-0" />
            <span className="whitespace-nowrap">{tab.label}</span>
            {tab.count !== null && tab.count > 0 && (
              <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black ${activeTab === tab.id ? 'bg-[#0A84FF] text-white shadow-[0_0_10px_rgba(10,132,255,0.4)]' : 'bg-white/5 text-[#86868B]'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ============================================ */}
      {/* TAB: MEUS TIMES */}
      {/* ============================================ */}
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
              <div className="bg-[#1C1C1E] border border-white/[0.04] rounded-[28px] p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#2C2C2E] flex items-center justify-center mx-auto mb-4">
                  <Users size={28} className="text-[#86868B]" />
                </div>
                <h3 className="text-[18px] font-semibold text-[#F5F5F7] mb-2">Nenhum time ainda</h3>
                <p className="text-[14px] text-[#86868B] mb-6">Crie um time ou família para começar a colaborar.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-6 py-3 rounded-xl bg-[#0A84FF] text-white text-[14px] font-semibold hover:bg-[#007AFF] transition-all active:scale-[0.98]"
                >
                  <Plus size={16} className="inline mr-2" />
                  Criar Time
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {teams.map((team) => (
                    <motion.div
                      key={team.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -4 }}
                      onClick={() => { setSelectedTeam(team.id); fetchTeamDetail(team.id); }}
                      className="bg-[#1C1C1E] border border-white/[0.05] rounded-[28px] p-6 hover:bg-[#2C2C2E]/30 hover:border-white/[0.1] transition-all cursor-pointer group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#0A84FF] opacity-[0.02] blur-3xl rounded-full -mr-10 -mt-10" />
                      
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-xl ${
                            team.type === 'family' 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                            : 'bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/20'
                          }`}>
                            {getTypeIcon(team.type)}
                          </div>
                          <div>
                            <h3 className="text-[19px] font-bold text-[#F5F5F7] tracking-tight group-hover:text-white transition-colors">{team.name}</h3>
                            <div className="flex items-center gap-4 mt-1.5">
                              <span className="text-[12px] text-[#86868B] font-medium flex items-center gap-1.5">
                                <Users size={12} strokeWidth={2.5} />
                                {team.member_count} {team.member_count === 1 ? 'Membro' : 'Membros'}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-[#2C2C2E] shrink-0" />
                              <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md ${
                                team.my_role === 'owner' ? 'bg-amber-400/10 text-amber-400' : 'bg-white/5 text-[#86868B]'
                              }`}>
                                {getRoleLabel(team.my_role)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="hidden sm:flex -space-x-2.5">
                            {team.members?.slice(0, 3).map((m, i) => (
                              <div key={m.user_id} className="relative transition-transform hover:-translate-y-1" style={{ zIndex: 5 - i }}>
                                {m.user?.avatar_url ? (
                                  <img src={m.user.avatar_url} className="w-9 h-9 rounded-full border-[3px] border-[#1C1C1E] object-cover" />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-[#3A3A3C] border-[3px] border-[#1C1C1E] flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase">{m.user?.name?.[0]}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                            {team.member_count > 3 && (
                              <div className="w-9 h-9 rounded-full bg-[#2C2C2E] border-[3px] border-[#1C1C1E] flex items-center justify-center z-0">
                                <span className="text-[10px] font-bold text-zinc-500">+{team.member_count - 3}</span>
                              </div>
                            )}
                          </div>
                          <div className="w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center text-[#86868B] group-hover:bg-white/10 group-hover:text-white transition-all">
                            <ChevronDown size={20} className="-rotate-90" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ============================================ */}
        {/* TAB: CAIXA DE ENTRADA */}
        {/* ============================================ */}
        {activeTab === 'inbox' && (
          <motion.div
            key="inbox"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {(inbox.length === 0 && changeRequests.length === 0) ? (
              <div className="bg-[#1C1C1E] border border-white/[0.04] rounded-[28px] p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#2C2C2E] flex items-center justify-center mx-auto mb-4">
                  <Inbox size={28} className="text-[#86868B]" />
                </div>
                <h3 className="text-[18px] font-semibold text-[#F5F5F7] mb-2">Caixa de entrada vazia</h3>
                <p className="text-[14px] text-[#86868B]">Nenhum convite pendente no momento.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Aprovações de alterações */}
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
                          className="group relative bg-[#1C1C1E] border border-white/[0.05] rounded-[24px] p-5 shadow-sm overflow-hidden"
                        >
                          <div className="flex flex-col sm:flex-row gap-5 items-start justify-between relative z-10">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3A3A3C] to-[#2C2C2E] flex items-center justify-center border border-white/5">
                                   {req.user?.avatar_url ? (
                                      <img src={req.user.avatar_url} className="w-full h-full rounded-full object-cover" />
                                   ) : (
                                      <span className="text-[11px] font-bold text-zinc-400">{req.user?.name?.[0]}</span>
                                   )}
                                </div>
                                <div>
                                   <p className="text-[14px] text-[#F5F5F7]">
                                      <span className="font-bold underline decoration-[#0A84FF]/30">{req.user?.name}</span> no time <span className="font-semibold text-white/90">{req.team?.name}</span>
                                   </p>
                                   <p className="text-[11px] text-[#86868B] uppercase font-black tracking-widest mt-0.5">
                                      {req.action_type === 'create' ? 'NOVO REGISTRO' : req.action_type === 'delete' ? 'EXCLUSÃO' : 'ATUALIZAÇÃO'} IN {req.entity_type}
                                   </p>
                                </div>
                              </div>
                              
                              {req.payload && (
                                <div className="mt-4 bg-black/20 rounded-[18px] p-4 border border-white/[0.03] relative group-hover:bg-black/30 transition-colors">
                                   <div className="flex items-center justify-between mb-2">
                                      <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">Dados da Solicitação</span>
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-pulse" />
                                   </div>
                                   <pre className="text-[12px] text-zinc-400 font-mono leading-relaxed overflow-x-auto max-h-[150px] custom-scrollbar">
                                      {JSON.stringify(req.payload, null, 2)}
                                   </pre>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-row sm:flex-col gap-2 shrink-0 self-stretch sm:self-auto justify-end">
                               <button 
                                  onClick={() => handleApproveChange(req.id)} 
                                  className="flex-1 sm:flex-none h-11 px-6 rounded-[16px] bg-[#30D158] hover:bg-[#28C84E] text-white text-[13px] font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[#30D158]/10"
                               >
                                  <Check size={16} strokeWidth={3} />
                                  <span>Aprovar</span>
                               </button>
                               <button 
                                  onClick={() => handleRejectChange(req.id)} 
                                  className="flex-1 sm:flex-none h-11 px-6 rounded-[16px] bg-white/[0.04] hover:bg-[#FF453A]/10 text-[#86868B] hover:text-[#FF453A] text-[13px] font-bold transition-all border border-transparent hover:border-[#FF453A]/20"
                               >
                                  <X size={16} strokeWidth={3} />
                                  <span>Rejeitar</span>
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

                {/* Convites Enviados */}
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

        {/* ============================================ */}
        {/* TAB: CRIAR NOVO */}
        {/* ============================================ */}
        {activeTab === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-[#1C1C1E] border border-white/[0.04] rounded-[28px] p-8">
              <h3 className="text-[20px] font-semibold text-[#F5F5F7] mb-6">Criar novo grupo</h3>

              <form onSubmit={handleCreateTeam} className="space-y-6">
                {/* Type Selection */}
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-[#86868B] ml-1 uppercase tracking-wider">Tipo</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'team', label: 'Time', icon: Briefcase, desc: 'Para projetos e trabalho', color: 'blue' },
                      { value: 'family', label: 'Família', icon: Heart, desc: 'Para família e amigos', color: 'pink' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNewTeam({ ...newTeam, type: opt.value })}
                        className={`p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${newTeam.type === opt.value
                            ? opt.color === 'blue'
                              ? 'border-[#0A84FF] bg-[#0A84FF]/5'
                              : 'border-pink-500 bg-pink-500/5'
                            : 'border-white/[0.06] bg-[#2C2C2E]/50 hover:border-white/[0.1]'
                          }`}
                      >
                        <opt.icon size={22} className={
                          newTeam.type === opt.value
                            ? opt.color === 'blue' ? 'text-[#0A84FF]' : 'text-pink-400'
                            : 'text-[#86868B]'
                        } />
                        <p className={`text-[15px] font-semibold mt-3 ${newTeam.type === opt.value ? 'text-[#F5F5F7]' : 'text-[#86868B]'
                          }`}>{opt.label}</p>
                        <p className="text-[12px] text-[#86868B] mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#86868B] ml-1 uppercase tracking-wider">Nome</label>
                  <input
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder={newTeam.type === 'family' ? 'Ex: Família Silva' : 'Ex: Squad Frontend'}
                    className="w-full px-5 py-3.5 rounded-[18px] bg-[#2C2C2E] border border-transparent text-[16px] text-[#F5F5F7] focus:border-[#0A84FF] focus:outline-none transition-all placeholder:text-[#86868B]/50"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating || !newTeam.name.trim()}
                  className="w-full px-6 py-4 rounded-[18px] bg-[#0A84FF] text-white text-[16px] font-semibold hover:bg-[#007AFF] transition-all disabled:opacity-50 shadow-lg shadow-[#0A84FF]/10 active:scale-[0.98]"
                >
                  {creating ? 'Criando...' : `Criar ${newTeam.type === 'family' ? 'Família' : 'Time'}`}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* MODAL: CONVIDAR MEMBRO */}
      {/* ============================================ */}
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
              className="bg-[#1C1C1E] border border-white/[0.06] rounded-[28px] p-8 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#0A84FF]/15 flex items-center justify-center">
                  <UserPlus size={20} className="text-[#0A84FF]" />
                </div>
                <div>
                  <h3 className="text-[18px] font-semibold text-[#F5F5F7]">Convidar membro</h3>
                  <p className="text-[13px] text-[#86868B]">
                    {teams.find(t => t.id === showInviteModal)?.name}
                  </p>
                </div>
              </div>

              <form onSubmit={handleInvite}>
                <div className="space-y-1.5 mb-6">
                  <label className="text-[13px] font-medium text-[#86868B] ml-1 uppercase tracking-wider">Email do membro</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868B]" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      className="w-full pl-12 pr-5 py-3.5 rounded-[18px] bg-[#2C2C2E] border border-transparent text-[16px] text-[#F5F5F7] focus:border-[#0A84FF] focus:outline-none transition-all placeholder:text-[#86868B]/50"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(null)}
                    className="flex-1 px-5 py-3 rounded-[14px] bg-[#2C2C2E] text-[#86868B] text-[14px] font-medium hover:text-white transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={inviting || !inviteEmail.trim()}
                    className="flex-1 px-5 py-3 rounded-[14px] bg-[#0A84FF] text-white text-[14px] font-semibold hover:bg-[#007AFF] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {inviting ? 'Enviando...' : (
                      <>
                        <Send size={14} /> Enviar convite
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
