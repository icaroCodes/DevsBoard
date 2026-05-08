import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Inbox, Plus, Heart, Briefcase, 
  ChevronRight, Crown, Shield, User,
  MailPlus, Check, X, Clock
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmModalContext';
import { useRealtime, useRealtimeSubscription } from '../../contexts/RealtimeContext';
import LoadingSkeleton from '../../components/LoadingSkeleton';

export default function TeamsMobile() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const { confirm } = useConfirm();
  const { connected: realtimeConnected } = useRealtime() || {};

  const [teams, setTeams] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [sentInvites, setSentInvites] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('teams');
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [selectedTeamData, setSelectedTeamData] = useState(null);

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
      if (detail.table === 'team_invitations' || detail.table === 'team_invitations_sent' || detail.table === 'change_requests') {
        fetchInbox();
        fetchSentInvites();
        fetchTeams();
        fetchChangeRequests();
      }
      if (detail.table === 'team_members' || detail.table === 'teams') {
        fetchTeams();
        if (selectedTeamId) fetchTeamDetail(selectedTeamId);
      }
    }
  );

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

  if (loading) return <LoadingSkeleton variant="teams" />;

  if (selectedTeamId) {
    const team = selectedTeamData || teams.find(t => t.id === selectedTeamId);
    if (!team) {
      setSelectedTeamId(null);
      return null;
    }

    return (
      <div className="px-5 py-6">
        <button 
          onClick={() => setSelectedTeamId(null)}
          className="flex items-center gap-2 text-[#86868B] mb-8"
        >
          <ChevronRight size={20} className="rotate-180" />
          <span className="text-[14px] font-bold">Voltar</span>
        </button>

        <div className="flex items-center gap-5 mb-10">
          <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center ${
            team.type === 'family' ? 'bg-pink-500/10 text-pink-400' : 'bg-[#0A84FF]/10 text-[#0A84FF]'
          }`}>
            {team.type === 'family' ? <Heart size={28} /> : <Briefcase size={28} />}
          </div>
          <div>
            <h1 className="text-[24px] font-bold text-white leading-tight">{team.name}</h1>
            <p className="text-[14px] text-[#86868B]">{team.member_count} membros</p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-[14px] font-bold text-[#86868B] uppercase tracking-wider">Membros</h2>
          {team.members?.map(member => (
            <div key={member.user_id} className="flex items-center justify-between p-4 bg-[#202020] rounded-[24px]">
              <div className="flex items-center gap-3">
                {member.user?.avatar_url ? (
                  <img src={member.user.avatar_url} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#2C2C2E] flex items-center justify-center text-white/40 text-[12px] font-bold">
                    {member.user?.name?.[0]}
                  </div>
                )}
                <div>
                  <p className="text-[15px] font-bold text-white">{member.user?.name}</p>
                  <p className="text-[12px] text-[#86868B]">{member.role === 'owner' ? 'Dono' : member.role === 'admin' ? 'Admin' : 'Membro'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-white tracking-tight leading-none mb-2">
            Times <span className="text-[#86868B] font-medium">&</span> Família
          </h1>
          <p className="text-[14px] text-[#86868B] font-medium">Gerencie seus grupos e convites</p>
        </div>
        
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
          realtimeConnected ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-amber-500/5 border-amber-500/10 text-amber-400'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${realtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-[10px] font-black uppercase tracking-wider">{realtimeConnected ? 'Live' : 'Off'}</span>
        </div>
      </div>

      <div className="p-1 bg-[#202020]/60 backdrop-blur-xl rounded-[22px] border border-white/[0.05] flex mb-8">
        {[
          { id: 'teams', label: 'Times', count: teams.length, icon: Users },
          { id: 'inbox', label: 'Inbox', count: inbox.length + changeRequests.length, icon: Inbox },
          { id: 'create', label: 'Criar', count: null, icon: Plus },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[18px] text-[13px] font-bold transition-all ${
              activeTab === tab.id ? 'bg-white/10 text-white shadow-lg' : 'text-[#86868B]'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count > 0 && (
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                activeTab === tab.id ? 'bg-white text-black' : 'bg-white/5 text-[#86868B]'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'teams' && (
          <motion.div
            key="teams"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {teams.map((team) => (
              <div 
                key={team.id}
                onClick={() => { setSelectedTeamId(team.id); fetchTeamDetail(team.id); }}
                className="group p-4 bg-[#202020] rounded-[24px] border border-transparent active:scale-[0.98] transition-all flex items-center gap-4"
              >
                <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center ${
                  team.type === 'family' ? 'bg-pink-500/10 text-pink-400' : 'bg-[#0A84FF]/10 text-[#0A84FF]'
                }`}>
                  {team.type === 'family' ? <Heart size={24} /> : <Briefcase size={24} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[17px] font-bold text-white truncate">{team.name}</h3>
                    {team.my_role === 'owner' && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-400/20">
                        DONO
                      </span>
                    )}
                    {team.my_role === 'member' && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-white/5 text-[#86868B] px-1.5 py-0.5 rounded border border-white/10">
                        MEMBRO
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {team.members?.slice(0, 3).map((m, i) => (
                        <div key={m.user_id} className="w-6 h-6 rounded-full border-2 border-[#202020] bg-[#2C2C2E] overflow-hidden">
                          {m.user?.avatar_url ? (
                            <img src={m.user.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-white/40 font-bold">
                              {m.user?.name?.[0]}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="text-[12px] font-medium text-[#86868B]">
                      {team.member_count} membros
                    </span>
                  </div>
                </div>
                
                <ChevronRight size={20} className="text-[#3A3A3C]" />
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'inbox' && (
          <motion.div
            key="inbox"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {inbox.length === 0 && changeRequests.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-16 h-16 rounded-3xl bg-[#202020] flex items-center justify-center mx-auto mb-4">
                  <Inbox size={28} className="text-[#3A3A3C]" />
                </div>
                <p className="text-[#86868B] font-medium">Tudo limpo por aqui</p>
              </div>
            )}

            {inbox.map((invitation) => (
              <div key={invitation.id} className="p-5 bg-[#202020] rounded-[28px] border border-white/[0.03]">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/10 flex items-center justify-center text-amber-400 shrink-0">
                    <MailPlus size={22} />
                  </div>
                  <div>
                    <h4 className="text-[16px] font-bold text-white">Convite para {invitation.team?.name}</h4>
                    <p className="text-[13px] text-[#86868B] mt-1">
                      <span className="text-white">{invitation.invited_by_user?.name}</span> convidou você.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[#86868B]">
                      <Clock size={12} />
                      <span className="text-[11px] font-medium">Pendente</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleAcceptInvite(invitation.id)}
                    className="py-3 bg-white text-black rounded-[18px] text-[13px] font-bold active:scale-95 transition-all"
                  >
                    Aceitar
                  </button>
                  <button 
                    onClick={() => handleRejectInvite(invitation.id)}
                    className="py-3 bg-[#2C2C2E] text-white rounded-[18px] text-[13px] font-bold active:scale-95 transition-all"
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="p-6 bg-[#202020] rounded-[32px] border border-white/[0.03]">
              <div className="w-16 h-16 rounded-[22px] bg-[#0A84FF]/10 flex items-center justify-center text-[#0A84FF] mb-6">
                <Plus size={32} />
              </div>
              <h2 className="text-[20px] font-bold text-white mb-2">Novo Grupo</h2>
              <p className="text-[14px] text-[#86868B] mb-8">Crie um espaço para sua equipe ou família colaborar.</p>
              
              <button className="w-full py-4 bg-[#0A84FF] text-white rounded-[20px] text-[15px] font-bold shadow-lg shadow-[#0A84FF]/20 active:scale-95 transition-all">
                Começar agora
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab !== 'create' && !selectedTeamId && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setActiveTab('create')}
          className="fixed right-6 bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-2xl z-40 active:scale-90 transition-transform"
        >
          <Plus size={28} strokeWidth={3} />
        </motion.button>
      )}
    </div>
  );
}
