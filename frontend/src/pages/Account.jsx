import { useState, useEffect, useRef } from'react';
import { useNavigate } from'react-router-dom';
import {
 Search, ExternalLink, Flame, Award, Timer, Calendar,
 Trophy, ChevronRight, Zap, User, LogOut, Trash2, ShieldAlert
} from'lucide-react';
import { api } from'../lib/api';
import { useAuth } from'../contexts/AuthContext';
import { useToast } from'../contexts/ToastContext';
import { useConfirm } from'../contexts/ConfirmModalContext';

export default function Account() {
 const { user, logout } = useAuth();
 const { success, error: showError } = useToast();
 const { confirm } = useConfirm();
 const navigate = useNavigate();

 const [stats, setStats] = useState(null);
 const [sessionStats, setSessionStats] = useState({});
 const [achievements, setAchievements] = useState({ unlocked: 0, total: 0 });
 const [searchQuery, setSearchQuery] = useState('');
 const [searchResults, setSearchResults] = useState([]);
 const [searching, setSearching] = useState(false);
 const searchTimeout = useRef(null);

 useEffect(() => {
 Promise.all([
 api('/settings').catch(() => null),
 api('/sessions/stats').catch(() => ({})),
 api('/achievements').catch(() => ({ stats: { unlocked: 0, total: 0 } })),
 ]).then(([settingsData, sessData, achieveData]) => {
 if (settingsData) {
 setStats({
 totalSeconds: settingsData.total_usage_seconds || 0,
 accountAgeDays: settingsData.account_age_days || 0,
 currentStreak: settingsData.current_streak || 0,
 longestStreak: settingsData.longest_streak || 0,
 username: settingsData.username,
 name: settingsData.name,
 avatar_url: settingsData.avatar_url,
 email: settingsData.email,
 });
 }
 setSessionStats(sessData || {});
 setAchievements(achieveData?.stats || { unlocked: 0, total: 0 });
 });
 }, []);

 // Debounced search
 useEffect(() => {
 if (searchTimeout.current) clearTimeout(searchTimeout.current);
 if (!searchQuery.trim() || searchQuery.trim().length < 2) {
 setSearchResults([]);
 setSearching(false);
 return;
 }
 setSearching(true);
 searchTimeout.current = setTimeout(async () => {
 try {
 const results = await api(`/public/search/users?q=${encodeURIComponent(searchQuery.trim())}`);
 setSearchResults(results || []);
 } catch {
 setSearchResults([]);
 } finally {
 setSearching(false);
 }
 }, 350);
 return () => clearTimeout(searchTimeout.current);
 }, [searchQuery]);

  const handleDelete = () => {
    const confirmationUsername = stats?.username || user?.username;
    if (!confirmationUsername) {
      showError('Username não encontrado. Tente novamente.');
      return;
    }
    
    confirm({
      title: 'Deletar conta permanentemente?',
      message: 'Essa ação é irreversível. Todos os seus dados serão apagados.',
      requireInput: confirmationUsername,
      onConfirm: async () => {
        try {
          await api('/settings', { 
            method: 'DELETE', 
            body: JSON.stringify({ confirmation_username: confirmationUsername })
          });
          logout();
        } catch (err) {
          showError(err?.message || 'Erro ao deletar conta');
        }
      }
    });
  };

 const totalHours = stats ? Math.floor(stats.totalSeconds / 3600) : 0;
 const totalMinutes = stats ? Math.floor((stats.totalSeconds % 3600) / 60) : 0;
 const longestSession = sessionStats.longest_session_seconds || 0;

 return (
 <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 space-y-6">

 {/* ── Search Bar ── */}
 <div className="relative">
 <div className="flex items-center gap-3 bg-[var(--db-surface)] border border-[var(--db-border)] rounded-2xl px-4 py-3 focus-within:border-[var(--db-accent)]/40 focus-within:ring-2 focus-within:ring-[var(--db-accent)]/10 transition-all">
 <Search size={18} className="text-[var(--db-text-3)] shrink-0" />
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Buscar conta por username..."
 className="flex-1 bg-transparent text-[var(--db-text)] text-[15px] placeholder:text-[var(--db-text-3)] outline-none"
 />
 {searchQuery && (
 <button onClick={() => setSearchQuery('')} className="text-[var(--db-text-3)] hover:text-[var(--db-text)] transition-colors text-xs font-medium">
 Limpar
 </button>
 )}
 </div>

 {/* Search results dropdown */}
 {(searchResults.length > 0 || searching) && searchQuery.trim().length >= 2 && (
 <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--db-surface)] border border-[var(--db-border)] rounded-2xl shadow-2xl overflow-hidden z-50">
 {searching && searchResults.length === 0 && (
 <div className="px-4 py-3 text-[13px] text-[var(--db-text-3)]">Buscando...</div>
 )}
 {searchResults.map((u) => (
 <button
 key={u.id}
 onClick={() => { navigate(`/@${u.username}`); setSearchQuery(''); }}
 className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--db-bg-secondary)] transition-colors text-left"
 >
 <div className="w-9 h-9 rounded-xl overflow-hidden bg-[var(--db-bg-secondary)] shrink-0">
 {u.avatar_url ? (
 <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full flex items-center justify-center">
 <User size={16} className="text-[var(--db-text-3)]" />
 </div>
 )}
 </div>
 <div className="min-w-0">
 <p className="text-sm font-semibold text-[var(--db-text)] truncate">{u.name || u.username}</p>
 <p className="text-xs text-[var(--db-text-3)] truncate">@{u.username}</p>
 </div>
 <ExternalLink size={14} className="ml-auto text-[var(--db-text-3)] shrink-0" />
 </button>
 ))}
 {!searching && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
 <div className="px-4 py-3 text-[13px] text-[var(--db-text-3)]">Nenhuma conta encontrada</div>
 )}
 </div>
 )}
 </div>

 {/* ── Profile Card ── */}
 <section className="bg-[var(--db-surface)] border border-[var(--db-border)] rounded-3xl overflow-hidden shadow-xl">
 <div className="relative h-24 sm:h-28 bg-gradient-to-br from-[var(--db-accent)] via-[var(--db-accent-hover)] to-[var(--db-blue)] overflow-hidden">
 <div className="absolute inset-0 opacity-20" style={{ backgroundImage:'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />
 </div>

 <div className="px-5 pb-5">
 <div className="-mt-10 flex items-end gap-4 mb-4">
 <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[var(--db-surface-2)] border-4 border-[var(--db-surface)] shadow-xl shrink-0">
 {(stats?.avatar_url || user?.avatar_url) ? (
 <img src={stats?.avatar_url || user?.avatar_url} alt="" className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full flex items-center justify-center">
 <User size={28} className="text-[var(--db-text-3)]" />
 </div>
 )}
 </div>
 <div className="min-w-0 pb-1">
 <p className="text-lg font-bold text-[var(--db-text)] truncate">{stats?.name || user?.name ||'Seu Nome'}</p>
 {(stats?.username || user?.username) && (
 <p className="text-[13px] text-[var(--db-text-3)] truncate">@{stats?.username || user?.username}</p>
 )}
 </div>
 </div>

 {(stats?.username || user?.username) && (
 <button
 onClick={() => navigate(`/@${stats?.username || user?.username}`)}
 className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[var(--db-accent)]/10 hover:bg-[var(--db-accent)]/20 border border-[var(--db-accent)]/20 text-[var(--db-accent)] text-sm font-bold transition-all active:scale-[0.98]"
 >
 <ExternalLink size={15} />
 Ver perfil público
 </button>
 )}
 </div>
 </section>

 {/* ── Stats ── */}
 {stats && (
 <section className="bg-[var(--db-surface)] border border-[var(--db-border)] rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
 <div className="text-center py-3">
 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--db-accent)]/10 text-[var(--db-accent)] text-[11px] font-bold mb-3">
 <Zap size={12} />
 Tempo Acumulado
 </div>
 <p className="text-5xl sm:text-6xl font-semibold tracking-tighter text-[var(--db-text)]">
 {totalHours}<span className="text-xl sm:text-2xl font-bold opacity-40 ml-1">h</span>
 </p>
 <p className="text-[13px] text-[var(--db-text-3)] mt-1">
 {totalMinutes} minutos acumulados
 </p>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div className="bg-[var(--db-bg-secondary)] rounded-2xl p-4 text-center">
 <Flame size={16} className="text-orange-400 mx-auto mb-2" />
 <p className="text-2xl font-semibold text-[var(--db-text)]">{stats.currentStreak}</p>
 <p className="text-[10px] font-bold tracking-normal text-[var(--db-text-3)] mt-0.5">Streak Atual</p>
 </div>
 <div className="bg-[var(--db-bg-secondary)] rounded-2xl p-4 text-center">
 <Award size={16} className="text-yellow-400 mx-auto mb-2" />
 <p className="text-2xl font-semibold text-[var(--db-text)]">{stats.longestStreak}</p>
 <p className="text-[10px] font-bold tracking-normal text-[var(--db-text-3)] mt-0.5">Maior Streak</p>
 </div>
 <div className="bg-[var(--db-bg-secondary)] rounded-2xl p-4 text-center">
 <Timer size={16} className="text-[var(--db-blue)] mx-auto mb-2" />
 <p className="text-2xl font-semibold text-[var(--db-text)]">
 {longestSession >= 3600
 ? `${Math.floor(longestSession / 3600)}h`
 : `${Math.floor(longestSession / 60)}m`}
 </p>
 <p className="text-[10px] font-bold tracking-normal text-[var(--db-text-3)] mt-0.5">Maior Sessão</p>
 </div>
 <div className="bg-[var(--db-bg-secondary)] rounded-2xl p-4 text-center">
 <Calendar size={16} className="text-emerald-400 mx-auto mb-2" />
 <p className="text-2xl font-semibold text-[var(--db-text)]">{stats.accountAgeDays}</p>
 <p className="text-[10px] font-bold tracking-normal text-[var(--db-text-3)] mt-0.5">Dias na Plataforma</p>
 </div>
 </div>

 <button
 onClick={() => navigate('/achievements')}
 className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/15 hover:border-amber-500/30 transition-all group"
 >
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
 <Trophy size={16} className="text-amber-400" />
 </div>
 <div className="text-left">
 <p className="text-sm font-bold text-[var(--db-text)]">{achievements.unlocked}/{achievements.total} Conquistas</p>
 <p className="text-[11px] text-[var(--db-text-3)]">{achievements.total > 0 ? Math.round((achievements.unlocked / achievements.total) * 100) : 0}% completo</p>
 </div>
 </div>
 <ChevronRight size={16} className="text-[var(--db-text-3)] group-hover:translate-x-1 transition-transform" />
 </button>
 </section>
 )}

 {/* ── Zona Crítica ── */}
 <section className="bg-[var(--db-surface)] border border-[var(--db-border)] rounded-3xl p-5 shadow-xl">
 <div className="flex items-center gap-2 mb-4 text-[var(--db-red)]">
 <ShieldAlert size={16} />
 <h3 className="font-bold text-[11px]">Zona Crítica</h3>
 </div>

 <div className="space-y-3">
 <button
 onClick={() => {
 confirm({
 title:"Sair do sistema?",
 message:"Sua sessão será encerrada com segurança.",
 onConfirm: () => { logout(); navigate('/'); }
 });
 }}
 className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[var(--db-bg-secondary)] hover:bg-[var(--db-surface-3)] transition-all group"
 >
 <div className="flex items-center gap-3">
 <LogOut size={16} className="text-[var(--db-text-3)]" />
 <span className="text-[13px] font-bold text-[var(--db-text-2)]">Encerrar Sessão</span>
 </div>
 <ChevronRight size={14} className="text-[var(--db-text-3)] group-hover:translate-x-1 transition-transform" />
 </button>

 <button
 onClick={handleDelete}
 className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[var(--db-red)]/5 hover:bg-[var(--db-red)]/10 border border-[var(--db-red)]/10 transition-all group"
 >
 <div className="flex items-center gap-3">
 <Trash2 size={16} className="text-[var(--db-red)]" />
 <span className="text-[13px] font-bold text-[var(--db-red)]">Deletar Conta</span>
 </div>
 <ChevronRight size={14} className="text-[var(--db-red)]/40 group-hover:translate-x-1 transition-transform" />
 </button>
 </div>
 </section>
 </div>
 );
}
