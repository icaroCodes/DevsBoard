import { Link, useNavigate } from'react-router-dom';
import { ArrowLeft, Calendar, Flame, Trophy, Clock, Target, Globe, Github, Twitter, Linkedin } from'lucide-react';

const SOCIAL_ICONS = {
 github: Github,
 twitter: Twitter,
 linkedin: Linkedin,
 website: Globe,
};

const TIER_COLORS = {
 bronze:'text-[#CD7F32]',
 prata:'text-[#C0C0C0]',
 ouro:'text-[#FFD700]',
 platina:'text-[#E5E4E2]'
};

export default function PublicProfileMobile({ profile: p, memberSince, links }) {
 const navigate = useNavigate();
 
 return (
 <div className="min-h-screen font-[Poppins,sans-serif] bg-[#121214] text-zinc-100 pb-20">
 {/* Header com botão voltar */}
 <div className="sticky top-0 z-50 bg-[#121214]/80 backdrop-blur-xl border-b border-white/5 px-4 h-14 flex items-center justify-between">
 <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:scale-95 transition-transform">
 <ArrowLeft size={20} className="text-white" />
 </button>
 <div className="font-bold text-white tracking-tight text-[15px]">@{p.username}</div>
 <div className="w-10 h-10" /> {/* Spacer */}
 </div>

 <div className="px-4 py-8">
 {/* Avatar e Info Básica */}
 <div className="flex flex-col items-center text-center">
 <div className="relative">
 {p.avatar_url ? (
 <img
 src={p.avatar_url}
 alt={p.display_name}
 className="w-28 h-28 rounded-full object-cover border-4 border-[#1C1C1E] shadow-xl"
 />
 ) : (
 <div className="w-28 h-28 rounded-full bg-[#2C2C2E] border-4 border-[#1C1C1E] shadow-xl flex items-center justify-center text-5xl font-bold text-white/20">
 {(p.display_name || p.username ||'?').charAt(0).toUpperCase()}
 </div>
 )}
 </div>

 <h1 className="text-2xl font-bold text-white mt-5 tracking-tight leading-tight">
 {p.display_name || p.username}
 </h1>
 <p className="text-[14px] text-[#A1A1AA] mt-1">@{p.username}</p>

 {p.bio && (
 <p className="text-[#E5E5EA] mt-4 leading-relaxed whitespace-pre-line text-[14px] px-2">
 {p.bio}
 </p>
 )}

 <div className="flex items-center gap-2 mt-5 text-[12px] text-[#86868B] font-semibold tracking-normal bg-white/5 px-4 py-2 rounded-full">
 <Calendar size={14} />
 Desde {memberSince}
 </div>

 {links.length > 0 && (
 <div className="flex items-center justify-center gap-3 mt-6">
 {links.map(([key, url]) => {
 const Icon = SOCIAL_ICONS[key] || Globe;
 return (
 <a
 key={key}
 href={url}
 target="_blank"
 rel="noopener noreferrer me"
 className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 text-[#A1A1AA] hover:text-white active:scale-95 transition-all"
 >
 <Icon size={20} />
 </a>
 );
 })}
 </div>
 )}
 </div>

 {/* Stats */}
 {p.stats && (
 <div className="mt-10 space-y-3">
 <h2 className="text-[13px] font-bold text-[#86868B] tracking-normal px-1 mb-3">Estatísticas</h2>
 
 <div className="grid grid-cols-2 gap-3">
 <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-white/[0.04]">
 <div className="text-[10px] font-bold text-zinc-500 mb-1.5 flex items-center gap-1.5">
 <Clock size={12} /> Horas
 </div>
 <div className="text-2xl font-semibold text-white tracking-tight">
 {p.stats.total_hours}<span className="text-xs font-semibold text-zinc-500 ml-0.5">h</span>
 </div>
 </div>

 <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-white/[0.04] relative overflow-hidden group">
 <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-100" />
 <div className="text-[10px] font-bold text-orange-500 mb-1.5 flex items-center gap-1.5 relative z-10">
 <Flame size={12} /> Streak
 </div>
 <div className="text-2xl font-semibold text-white tracking-tight relative z-10">
 {p.current_streak} <span className="text-xs font-semibold text-zinc-500">dias</span>
 </div>
 </div>
 </div>

 <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-white/[0.04]">
 <div className="flex items-center justify-between mb-3">
 <div className="text-[10px] font-bold text-zinc-500 flex items-center gap-1.5">
 <Trophy size={12} /> Conquistas
 </div>
 <div className="flex items-baseline gap-1">
 <span className="text-xl font-semibold text-white tracking-tight">{p.stats.achievements_unlocked}</span>
 <span className="text-[11px] font-semibold text-zinc-500">/ {p.stats.achievements_total}</span>
 </div>
 </div>
 <div className="w-full bg-[#2C2C2E] rounded-full h-2 overflow-hidden">
 <div 
 className="bg-[#30D158] h-full rounded-full transition-all duration-1000 ease-out" 
 style={{ width: `${p.stats.achievements_percentage}%` }}
 />
 </div>
 </div>
 </div>
 )}

 {/* Conquistas Recentes */}
 {p.stats?.top_achievements?.length > 0 && (
 <div className="mt-10">
 <h2 className="text-[13px] font-bold text-[#86868B] tracking-normal px-1 mb-3">Top Conquistas</h2>
 <div className="flex flex-col gap-3">
 {p.stats.top_achievements.map((ach) => (
 <div key={ach.slug} className="bg-[#1C1C1E] rounded-2xl p-4 border border-white/[0.04] flex items-center gap-4">
 <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl shrink-0 shadow-inner">
 {ach.icon}
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-bold text-white text-[15px] truncate leading-tight">{ach.name}</h3>
 <div className={`text-[10px] font-semibold mt-1 ${TIER_COLORS[ach.tier] ||'text-zinc-500'}`}>
 {ach.tier}
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
