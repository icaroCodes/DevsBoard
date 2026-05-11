import { useState, useEffect, useCallback } from'react';
import { motion, AnimatePresence } from'framer-motion';
import {
 Users, Inbox, Plus, Heart, Briefcase,
 ChevronRight, Crown, Shield, User,
 MailPlus, Check, X, Clock, UserPlus, Mail, Send, LogOut, Trash2, AtSign
} from'lucide-react';
import { api } from'../../lib/api';
import { useAuth } from'../../contexts/AuthContext';
import { useToast } from'../../contexts/ToastContext';
import { useConfirm } from'../../contexts/ConfirmModalContext';
import { useRealtime, useRealtimeSubscription } from'../../contexts/RealtimeContext';
import LoadingSkeleton from'../../components/LoadingSkeleton';

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
 const [newTeam, setNewTeam] = useState({ name:'', type:'team' });
 const [creating, setCreating] = useState(false);
 const [showInviteModal, setShowInviteModal] = useState(null);
 const [inviteUsername, setInviteUsername] = useState('');
 const [inviting, setInviting] = useState(false);

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
 ['teams','team_members','team_invitations','team_invitations_sent','change_requests'],
 (detail) => {
 if (detail.table ==='team_invitations' || detail.table ==='team_invitations_sent' || detail.table ==='change_requests') {
 fetchInbox();
 fetchSentInvites();
 fetchTeams();
 fetchChangeRequests();
 }
 if (detail.table ==='team_members' || detail.table ==='teams') {
 fetchTeams();
 if (selectedTeamId) fetchTeamDetail(selectedTeamId);
 }
 }
 );

 const handleAcceptInvite = async (invitationId) => {
 try {
 const result = await api(`/teams/invitations/${invitationId}/accept`, { method:'POST' });
 success(result.message ||'Convite aceito!');
 fetchInbox();
 fetchTeams();
 } catch (err) {
 toastError(err.message);
 }
 };

 const handleCreateTeam = async (e) => {
 e.preventDefault();
 if (!newTeam.name.trim() || creating) return;
 setCreating(true);
 try {
 await api('/teams', { method:'POST', body: JSON.stringify(newTeam) });
 success(`${newTeam.type ==='family' ?'Família' :'Time'}"${newTeam.name}" criado!`);
 setNewTeam({ name:'', type:'team' });
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
 const cleaned = inviteUsername.trim().replace(/^@/,'');
 if (!cleaned || !showInviteModal || inviting) return;
 setInviting(true);
 try {
 await api(`/teams/${showInviteModal}/invite`, {
 method:'POST',
 body: JSON.stringify({ username: cleaned }),
 });
 success(`Convite enviado para @${cleaned}!`);
 setInviteUsername('');
 setShowInviteModal(null);
 fetchSentInvites();
 } catch (err) {
 toastError(err.message);
 } finally {
 setInviting(false);
 }
 };

 const handleLeaveTeam = (teamId, teamName) => {
 confirm({
 title: `Sair de"${teamName}"?`,
 message:'Você não terá mais acesso a este time.',
 onConfirm: async () => {
 try {
 await api(`/teams/${teamId}/members/${user.id}`, { method:'DELETE' });
 success('Você saiu do time.');
 setSelectedTeamId(null);
 setSelectedTeamData(null);
 fetchTeams();
 } catch (err) {
 toastError(err.message);
 }
 }
 });
 };

 const handleDeleteTeam = (teamId, teamName) => {
 confirm({
 title: `Excluir"${teamName}"?`,
 message:'Todos os membros serão removidos e os dados do time serão perdidos.',
 onConfirm: async () => {
 try {
 await api(`/teams/${teamId}`, { method:'DELETE' });
 success('Time excluído.');
 setSelectedTeamId(null);
 setSelectedTeamData(null);
 fetchTeams();
 } catch (err) {
 toastError(err.message);
 }
 }
 });
 };

 const handleRejectInvite = async (invitationId) => {
 confirm({
 title:'Rejeitar convite?',
 message:'Tem certeza que deseja rejeitar este convite?',
 onConfirm: async () => {
 try {
 await api(`/teams/invitations/${invitationId}/reject`, { method:'POST' });
 success('Convite rejeitado.');
 fetchInbox();
 } catch (err) {
 toastError(err.message);
 }
 }
 });
 };

 if (loading) return <LoadingSkeleton variant="teams" />;

 const inviteModal = (
 <AnimatePresence>
 {showInviteModal && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
 onClick={() => setShowInviteModal(null)}
 >
 <motion.div
 initial={{ opacity: 0, y: 40 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: 40 }}
 transition={{ type:'spring', damping: 28, stiffness: 320 }}
 className="bg-[#202020] border border-white/10 rounded-[28px] p-6 w-full max-w-md shadow-2xl"
 onClick={e => e.stopPropagation()}
 >
 <div className="flex items-center gap-3 mb-6">
 <div className="w-11 h-11 rounded-2xl bg-[#0A84FF]/10 flex items-center justify-center text-[#0A84FF]">
 <UserPlus size={22} strokeWidth={2.5} />
 </div>
 <div>
 <h3 className="text-[18px] font-bold text-white tracking-tight">Convidar Membro</h3>
 <p className="text-[13px] text-[#86868B] font-medium">
 {teams.find(t => t.id === showInviteModal)?.name}
 </p>
 </div>
 </div>
 <form onSubmit={handleInvite} className="space-y-4">
 <div className="relative">
 <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868B]" />
 <input
 type="text"
 value={inviteUsername}
 onChange={(e) => setInviteUsername(e.target.value.replace(/^@/,'').toLowerCase())}
 placeholder="icarocodes"
 autoComplete="off"
 spellCheck={false}
 className="w-full pl-11 pr-4 py-3.5 rounded-[18px] bg-[#2C2C2E] border border-white/5 text-[15px] font-bold text-white focus:border-[#0A84FF] focus:outline-none transition-all placeholder:text-[#86868B]/60"
 required
 autoFocus
 />
 </div>
 <div className="flex gap-3">
 <button
 type="button"
 onClick={() => { setShowInviteModal(null); setInviteUsername(''); }}
 className="flex-1 h-12 rounded-[16px] bg-white/5 text-[#86868B] text-[13px] font-bold active:scale-95 transition-all"
 >
 Cancelar
 </button>
 <button
 type="submit"
 disabled={inviting || !inviteUsername.trim()}
 className="flex-1 h-12 rounded-[16px] bg-white text-black text-[13px] font-semibold active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
 >
 {inviting ?'Enviando...' : (<><Send size={14} strokeWidth={3} /> Enviar</>)}
 </button>
 </div>
 </form>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 );

 if (selectedTeamId) {
 const team = selectedTeamData || teams.find(t => t.id === selectedTeamId);
 if (!team) {
 setSelectedTeamId(null);
 return null;
 }

 const canInvite = ['owner','admin'].includes(team.my_role);
 return (
 <>
 {inviteModal}
 <div className="px-5 py-6 pb-32">
 <button
 onClick={() => setSelectedTeamId(null)}
 className="flex items-center gap-2 text-[#86868B] mb-8"
 >
 <ChevronRight size={20} className="rotate-180" />
 <span className="text-[14px] font-bold">Voltar</span>
 </button>

 <div className="flex items-center gap-5 mb-8">
 <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center ${
 team.type ==='family' ?'bg-pink-500/10 text-pink-400' :'bg-[#0A84FF]/10 text-[#0A84FF]'
 }`}>
 {team.type ==='family' ? <Heart size={28} /> : <Briefcase size={28} />}
 </div>
 <div className="flex-1 min-w-0">
 <h1 className="text-[24px] font-bold text-white leading-tight truncate">{team.name}</h1>
 <p className="text-[14px] text-[#86868B]">{team.member_count} membros</p>
 </div>
 </div>

 {canInvite && (
 <button
 onClick={() => setShowInviteModal(team.id)}
 className="w-full mb-6 flex items-center justify-center gap-2 py-4 bg-white text-black rounded-[20px] text-[14px] font-bold active:scale-95 transition-all shadow-lg"
 >
 <UserPlus size={16} strokeWidth={3} />
 Convidar membro
 </button>
 )}

 <div className="space-y-3">
 <h2 className="text-[12px] font-bold text-[#86868B] tracking-normal">Membros</h2>
 {team.members?.map(member => (
 <div key={member.user_id} className="flex items-center justify-between p-4 bg-[#202020] rounded-[24px]">
 <div className="flex items-center gap-3 min-w-0">
 {member.user?.avatar_url ? (
 <img src={member.user.avatar_url} className="w-10 h-10 rounded-full object-cover shrink-0" />
 ) : (
 <div className="w-10 h-10 rounded-full bg-[#2C2C2E] flex items-center justify-center text-white/40 text-[12px] font-bold shrink-0">
 {member.user?.name?.[0]}
 </div>
 )}
 <div className="min-w-0">
 <p className="text-[15px] font-bold text-white truncate">{member.user?.name}</p>
 <p className="text-[12px] text-[#86868B]">{member.role ==='owner' ?'Dono' : member.role ==='admin' ?'Admin' :'Membro'}</p>
 </div>
 </div>
 </div>
 ))}
 </div>

 {team.my_role ==='owner' ? (
 <button
 onClick={() => handleDeleteTeam(team.id, team.name)}
 className="mt-8 w-full flex items-center justify-center gap-2 py-4 bg-[#FF453A]/10 text-[#FF453A] border border-[#FF453A]/20 rounded-[20px] text-[14px] font-bold active:scale-95 transition-all"
 >
 <Trash2 size={16} />
 Excluir {team.type ==='family' ?'família' :'time'}
 </button>
 ) : (
 <button
 onClick={() => handleLeaveTeam(team.id, team.name)}
 className="mt-8 w-full flex items-center justify-center gap-2 py-4 bg-[#2C2C2E] text-[#86868B] rounded-[20px] text-[14px] font-bold active:scale-95 transition-all"
 >
 <LogOut size={16} />
 Sair do time
 </button>
 )}
 </div>
 </>
 );
 }

 return (
 <>
 {inviteModal}
 <div className="px-5 py-8">
 <div className="flex justify-between items-start mb-8">
 <div>
 <h1 className="text-[32px] font-bold text-white tracking-tight leading-none mb-2">
 Times <span className="text-[#86868B] font-medium">&</span> Família
 </h1>
 <p className="text-[14px] text-[#86868B] font-medium">Gerencie seus grupos e convites</p>
 </div>
 
 <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
 realtimeConnected ?'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' :'bg-amber-500/5 border-amber-500/10 text-amber-400'
 }`}>
 <div className={`w-1.5 h-1.5 rounded-full ${realtimeConnected ?'bg-emerald-400 animate-pulse' :'bg-amber-400'}`} />
 <span className="text-[10px] font-semibold tracking-normal">{realtimeConnected ?'Live' :'Off'}</span>
 </div>
 </div>

 <div className="p-1 bg-[#202020]/60 backdrop-blur-xl rounded-[22px] border border-white/[0.05] flex mb-8">
 {[
 { id:'teams', label:'Times', count: teams.length, icon: Users },
 { id:'inbox', label:'Inbox', count: inbox.length + changeRequests.length, icon: Inbox },
 { id:'create', label:'Criar', count: null, icon: Plus },
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[18px] text-[13px] font-bold transition-all ${
 activeTab === tab.id ?'bg-white/10 text-white shadow-lg' :'text-[#86868B]'
 }`}
 >
 <tab.icon size={16} />
 {tab.label}
 {tab.count > 0 && (
 <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
 activeTab === tab.id ?'bg-white text-black' :'bg-white/5 text-[#86868B]'
 }`}>
 {tab.count}
 </span>
 )}
 </button>
 ))}
 </div>

 <AnimatePresence mode="wait">
 {activeTab ==='teams' && (
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
 team.type ==='family' ?'bg-pink-500/10 text-pink-400' :'bg-[#0A84FF]/10 text-[#0A84FF]'
 }`}>
 {team.type ==='family' ? <Heart size={24} /> : <Briefcase size={24} />}
 </div>
 
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <h3 className="text-[17px] font-bold text-white truncate">{team.name}</h3>
 {team.my_role ==='owner' && (
 <span className="text-[9px] font-semibold tracking-normal bg-amber-400/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-400/20">
 DONO
 </span>
 )}
 {team.my_role ==='member' && (
 <span className="text-[9px] font-semibold tracking-normal bg-white/5 text-[#86868B] px-1.5 py-0.5 rounded border border-white/10">
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

 {activeTab ==='inbox' && (
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

 {activeTab ==='create' && (
 <motion.div
 key="create"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="space-y-6"
 >
 <form onSubmit={handleCreateTeam} className="p-6 bg-[#202020] rounded-[32px] border border-white/[0.03] space-y-6">
 <div>
 <h2 className="text-[20px] font-bold text-white mb-1">Novo Grupo</h2>
 <p className="text-[13px] text-[#86868B]">Crie um espaço para colaborar.</p>
 </div>

 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[#86868B]">Tipo</label>
 <div className="grid grid-cols-2 gap-3">
 {[
 { value:'team', label:'Time', icon: Briefcase, color:'blue' },
 { value:'family', label:'Família', icon: Heart, color:'pink' },
 ].map(opt => {
 const selected = newTeam.type === opt.value;
 return (
 <button
 key={opt.value}
 type="button"
 onClick={() => setNewTeam({ ...newTeam, type: opt.value })}
 className={`relative p-4 rounded-[22px] border-2 text-left transition-all ${
 selected
 ? opt.color ==='blue'
 ?'border-[#0A84FF] bg-[#0A84FF]/5'
 :'border-pink-500 bg-pink-500/5'
 :'border-white/5 bg-[#1A1A1C]'
 }`}
 >
 <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 ${
 selected
 ? opt.color ==='blue' ?'bg-[#0A84FF] text-white' :'bg-pink-500 text-white'
 :'bg-white/5 text-[#86868B]'
 }`}>
 <opt.icon size={18} strokeWidth={2.5} />
 </div>
 <p className={`text-[14px] font-bold ${selected ?'text-white' :'text-[#86868B]'}`}>
 {opt.label}
 </p>
 {selected && (
 <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white flex items-center justify-center">
 <Check size={12} strokeWidth={4} className="text-black" />
 </div>
 )}
 </button>
 );
 })}
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-[11px] font-semibold text-[#86868B]">Nome</label>
 <input
 type="text"
 value={newTeam.name}
 onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
 placeholder={newTeam.type ==='family' ?'Ex: Família Silva' :'Ex: Squad Frontend'}
 className="w-full px-4 py-4 rounded-[18px] bg-[#1A1A1C] border border-white/5 text-[15px] font-bold text-white focus:border-[#0A84FF] focus:outline-none transition-all placeholder:text-white/20"
 required
 />
 </div>

 <button
 type="submit"
 disabled={creating || !newTeam.name.trim()}
 className="w-full py-4 bg-white text-black rounded-[20px] text-[15px] font-semibold active:scale-95 transition-all disabled:opacity-50"
 >
 {creating ?'Criando...' : `Criar ${newTeam.type ==='family' ?'família' :'time'}`}
 </button>
 </form>
 </motion.div>
 )}
 </AnimatePresence>

 {activeTab !=='create' && !selectedTeamId && (
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
 </>
 );
}
