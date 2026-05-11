import { useState, useEffect, useMemo } from'react';
import { useNavigate } from'react-router-dom';
import { motion, AnimatePresence } from'framer-motion';
import { 
 Trophy, LayoutGrid, CheckSquare, Target, Wallet, 
 Repeat, Briefcase, Zap, Clock, ShieldAlert, Lock, ChevronRight
} from'lucide-react';
import { api } from'../../lib/api';
import { useToast } from'../../contexts/ToastContext';
import { useAuth } from'../../contexts/AuthContext';
import LoadingSkeleton from'../../components/LoadingSkeleton';

const TIERS = {
 bronze: {
 label:'BRONZE',
 medal:'/bronze.svg',
 color:'#CD7F32',
 bg:'rgba(205,127,50,0.08)',
 },
 prata: {
 label:'PRATA',
 medal:'/prata.svg',
 color:'#C8D4E3',
 bg:'rgba(200,212,227,0.08)',
 },
 ouro: {
 label:'OURO',
 medal:'/ouro.svg',
 color:'#FFD700',
 bg:'rgba(255,215,0,0.08)',
 },
 platina: {
 label:'PLATINA',
 medal:'/platina.svg',
 color:'#E2E8FF',
 bg:'rgba(226,232,255,0.08)',
 },
};

const CATEGORIES = [
 { id:'all', label:'Todas', icon: LayoutGrid },
 { id:'tasks', label:'Tarefas', icon: CheckSquare },
 { id:'goals', label:'Metas', icon: Target },
 { id:'finances', label:'Finanças', icon: Wallet },
 { id:'routines', label:'Rotinas', icon: Repeat },
 { id:'projects', label:'Projetos', icon: Briefcase },
 { id:'tempo', label:'Tempo', icon: Clock },
 { id:'streak', label:'Streak', icon: Zap },
 { id:'hidden', label:'Especiais', icon: ShieldAlert },
];

export default function AchievementsMobile() {
 const [data, setData] = useState(null);
 const [loading, setLoading] = useState(true);
 const [filter, setFilter] = useState('all');
 const { error } = useToast();
 const { activeTeam } = useAuth();
 const navigate = useNavigate();

 useEffect(() => {
 setLoading(true);
 api('/achievements')
 .then(d => setData(d))
 .catch(err => error(err.message))
 .finally(() => setLoading(false));
 }, [activeTeam]);

 const tierSummary = useMemo(() => {
 if (!data?.achievements) return null;
 const acc = { 
 bronze: { u: 0, t: 0 }, 
 prata: { u: 0, t: 0 }, 
 ouro: { u: 0, t: 0 }, 
 platina: { u: 0, t: 0 } 
 };
 data.achievements.forEach(a => {
 if (acc[a.tier]) {
 acc[a.tier].t++;
 if (a.unlocked) acc[a.tier].u++;
 }
 });
 return acc;
 }, [data]);

 const filtered = useMemo(() => {
 if (!data?.achievements) return [];
 let list = data.achievements;
 if (filter !=='all') {
 list = list.filter(a => 
 filter ==='hidden' 
 ? (a.category ==='hidden' || a.category ==='ultimate')
 : a.category === filter
 );
 }
 return [...list].sort((a, b) => (b.unlocked === a.unlocked ? 0 : b.unlocked ? 1 : -1));
 }, [data, filter]);

 if (loading) return <LoadingSkeleton variant="achievements" />;

 return (
 <div className="px-5 py-8 pb-32">
 {/* Header */}
 <div className="flex justify-between items-start mb-8">
 <div>
 <h1 className="text-[32px] font-bold text-white tracking-tight leading-none mb-2">
 Conquistas
 </h1>
 <p className="text-[14px] text-[#86868B] font-medium leading-snug">
 Cada troféu é uma prova de que você foi além.
 </p>
 </div>
 <button 
 onClick={() => navigate('/achievements/leaderboard')}
 className="w-12 h-12 rounded-[14px] bg-[#202020] border border-white/5 flex items-center justify-center text-white/40 active:scale-95 transition-all"
 >
 <Trophy size={20} />
 </button>
 </div>

 {/* Main Stats Card */}
 {data && (
 <div className="p-8 bg-[#202020] rounded-[40px] border border-white/[0.03] mb-8">
 <div className="flex items-baseline gap-2 mb-2">
 <span className="text-[64px] font-bold text-white leading-none tracking-tighter">
 {data.stats.unlocked}
 </span>
 <span className="text-[28px] font-bold text-white/20">
 / {data.stats.total}
 </span>
 </div>
 <p className="text-[11px] font-semibold text-white/30 mb-8">
 Troféus Desbloqueados
 </p>

 <div className="flex justify-between items-end mb-3">
 <span className="text-[11px] font-semibold tracking-normal text-white/20">Progresso Geral</span>
 <span className="text-[16px] font-semibold text-[#FFD700]">{data.stats.percentage}%</span>
 </div>
 <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${data.stats.percentage}%` }}
 transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
 className="h-full rounded-full"
 style={{
 background:'linear-gradient(90deg, #CD7F32, #FFD700)',
 boxShadow:'0 0 15px rgba(255,215,0,0.3)'
 }}
 />
 </div>

 {/* Trophy Grid */}
 <div className="grid grid-cols-2 gap-4 mt-10">
 {Object.entries(tierSummary || {}).map(([key, val]) => {
 const tier = TIERS[key];
 const isLocked = val.u === 0;
 return (
 <div 
 key={key} 
 className={`flex flex-col items-center gap-3 p-5 rounded-[28px] border ${
 isLocked ?'bg-transparent border-white/5 opacity-40' :'border-white/[0.05]'
 }`}
 style={{ background: isLocked ?'transparent' : tier.bg }}
 >
 <img 
 src={tier.medal} 
 className={`w-10 h-10 object-contain ${isLocked ?'grayscale brightness-[0.2]' :''}`} 
 alt={tier.label}
 />
 <span className="text-[9px] font-semibold mb-1" style={{ color: isLocked ?'#3a3a3c' : tier.color }}>
 {tier.label}
 </span>
 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-1">
 <div 
 className="h-full rounded-full" 
 style={{ 
 width: `${(val.u / val.t) * 100}%`,
 background: tier.color 
 }} 
 />
 </div>
 <span className="text-[11px] font-bold text-white/80">
 {val.u} <span className="text-white/20">/ {val.t}</span>
 </span>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* Tabs / Filter */}
 <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide mb-8 -mx-5 px-5 snap-x snap-mandatory">
 {CATEGORIES.map(cat => (
 <button
 key={cat.id}
 onClick={() => setFilter(cat.id)}
 className={`flex items-center gap-2 px-5 py-3 rounded-full text-[13px] font-bold whitespace-nowrap transition-all snap-start ${
 filter === cat.id ?'bg-white text-black' :'bg-[#202020] text-[#86868B]'
 }`}
 >
 <cat.icon size={16} />
 {cat.label}
 </button>
 ))}
 </div>

 {/* List of achievements */}
 <div className="space-y-3">
 {filtered.map((a) => (
 <div 
 key={a.slug}
 className={`p-4 rounded-[28px] border transition-all flex items-center gap-4 ${
 a.unlocked ?'bg-[#202020] border-white/[0.04]' :'bg-transparent border-white/5 opacity-40'
 }`}
 >
 <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center ${
 a.unlocked ?'bg-white/5' :'bg-white/[0.02]'
 }`}>
 <img 
 src={TIERS[a.tier]?.medal} 
 className={`w-8 h-8 object-contain ${!a.unlocked ?'grayscale brightness-0 opacity-20' :''}`} 
 alt=""
 />
 </div>
 <div className="flex-1 min-w-0">
 <h3 className={`text-[15px] font-bold truncate ${a.unlocked ?'text-white' :'text-white/40'}`}>
 {a.hidden && !a.unlocked ?'Conquista Oculta' : a.name}
 </h3>
 <p className="text-[12px] text-[#86868B] truncate">
 {a.hidden && !a.unlocked ?'Continue evoluindo...' : a.description}
 </p>
 </div>
 {a.unlocked && <div className="w-2 h-2 rounded-full" style={{ background: TIERS[a.tier]?.color }} />}
 </div>
 ))}
 </div>
 </div>
 );
}
