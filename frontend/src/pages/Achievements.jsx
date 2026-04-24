import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Lock, Trophy, LayoutGrid, CheckSquare, Target, Wallet, 
  Repeat, Briefcase, Zap, Clock, ShieldAlert 
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSkeleton from '../components/LoadingSkeleton';



const TIERS = {
  bronze: {
    label:        'Bronze',
    color:        '#CD7F32',
    colorAlpha:   'rgba(205,127,50,',
    border:       '1px solid rgba(205,127,50,0.22)',
    borderHover:  '1px solid rgba(205,127,50,0.45)',
    glow:         '0 0 32px rgba(205,127,50,0.18)',
    glowStrong:   '0 0 60px rgba(205,127,50,0.30)',
    bg:           'rgba(205,127,50,0.06)',
    medal:        '/bronze.svg',
    barColor:     '#CD7F32',
  },
  prata: {
    label:        'Prata',
    color:        '#C8D4E3',
    colorAlpha:   'rgba(200,212,227,',
    border:       '1px solid rgba(200,212,227,0.22)',
    borderHover:  '1px solid rgba(200,212,227,0.45)',
    glow:         '0 0 32px rgba(200,212,227,0.15)',
    glowStrong:   '0 0 60px rgba(200,212,227,0.28)',
    bg:           'rgba(200,212,227,0.05)',
    medal:        '/prata.svg',
    barColor:     '#A8B8CC',
  },
  ouro: {
    label:        'Ouro',
    color:        '#FFD700',
    colorAlpha:   'rgba(255,215,0,',
    border:       '1px solid rgba(255,215,0,0.22)',
    borderHover:  '1px solid rgba(255,215,0,0.45)',
    glow:         '0 0 32px rgba(255,215,0,0.18)',
    glowStrong:   '0 0 60px rgba(255,215,0,0.30)',
    bg:           'rgba(255,215,0,0.05)',
    medal:        '/ouro.svg',
    barColor:     '#FFD700',
  },
  platina: {
    label:        'Platina',
    color:        '#E2E8FF',
    colorAlpha:   'rgba(226,232,255,',
    border:       '1px solid rgba(226,232,255,0.25)',
    borderHover:  '1px solid rgba(226,232,255,0.5)',
    glow:         '0 0 40px rgba(180,180,255,0.20)',
    glowStrong:   '0 0 80px rgba(200,200,255,0.40)',
    bg:           'rgba(226,232,255,0.05)',
    medal:        '/platina.svg',
    barColor:     '#C8D0FF',
  },
};

const CATEGORY_LABELS = {
  all:      { label: 'Todas',    icon: LayoutGrid },
  tasks:    { label: 'Tarefas',  icon: CheckSquare },
  goals:    { label: 'Metas',    icon: Target },
  finances: { label: 'Finanças', icon: Wallet },
  routines: { label: 'Rotinas',  icon: Repeat },
  projects: { label: 'Projetos', icon: Briefcase },
  tempo:    { label: 'Tempo',    icon: Clock },
  streak:   { label: 'Streak',   icon: Zap },
  hidden:   { label: 'Especiais',icon: ShieldAlert },
  ultimate: { label: 'Especiais',icon: ShieldAlert },
};



function AchievementCard({ achievement, index }) {
  const isUnlocked = achievement.unlocked;
  const isHidden   = achievement.hidden && !isUnlocked;
  const tier       = TIERS[achievement.tier] || TIERS.bronze;
  const isPlatina  = achievement.tier === 'platina';
  const progress   = isUnlocked ? 100 : (achievement.progress || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ delay: index * 0.025, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[22px] transition-all duration-300 group"
      style={{
        background: isUnlocked
          ? `linear-gradient(145deg, #131316, #0e0e11)`
          : '#0c0c0e',
        border:     isUnlocked ? tier.border : '1px solid rgba(255,255,255,0.04)',
        boxShadow:  isUnlocked ? tier.glow : 'none',
        opacity:    isUnlocked ? 1 : 0.55,
      }}
      whileHover={isUnlocked ? { scale: 1.01 } : {}}
    >
      {}
      {isPlatina && isUnlocked && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(200,210,255,0.04) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
        />
      )}

      <div className="flex gap-4 p-4 sm:p-5 relative z-10">
        {}
        <div className="relative shrink-0 flex items-center justify-center">
          <div
            className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-[18px] sm:rounded-[22px] flex items-center justify-center overflow-hidden transition-all duration-300"
            style={{
              background: isUnlocked ? tier.bg : 'rgba(255,255,255,0.02)',
              boxShadow:  isUnlocked ? tier.glow : 'none',
              border: isUnlocked ? 'none' : '1px solid rgba(255,255,255,0.04)',
            }}
          >
            {isHidden ? (
              <Lock size={20} className="text-zinc-800" />
            ) : (
              <img
                src={tier.medal}
                alt={tier.label}
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain transition-all duration-300 group-hover:scale-110"
                style={{ filter: isUnlocked ? 'none' : 'grayscale(100%) brightness(0.25)' }}
              />
            )}
          </div>

          {}
          {isUnlocked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0c0c0e]"
              style={{ background: tier.color }}
            >
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                <path d="M2 5.5L4 7.5L8 3" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
          )}
        </div>

        {}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3
            className="text-[14px] sm:text-[15px] font-bold leading-tight mb-0.5 sm:mb-1 truncate"
            style={{ color: isUnlocked ? '#F5F5F7' : '#3a3a3c' }}
          >
            {isHidden ? 'Conquista Oculta' : achievement.name}
          </h3>
          <p className="text-[11px] sm:text-[12px] leading-snug line-clamp-2 mb-2 sm:mb-3" style={{ color: isUnlocked ? '#86868B' : '#2a2a2c' }}>
            {isHidden ? 'Continue evoluindo para revelar este troféu.' : achievement.description}
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            {}
            <span
              className="px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider"
              style={{
                background: isUnlocked ? `${tier.colorAlpha}0.1)` : 'rgba(255,255,255,0.03)',
                color:      isUnlocked ? tier.color : '#3a3a3c',
              }}
            >
              {tier.label}
            </span>

            {}
            {!isHidden && (
              <span className="px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-white/[0.03] text-white/20">
                {CATEGORY_LABELS[achievement.category]?.label || achievement.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {}
      {!isUnlocked && progress > 0 && (
        <div className="px-5 pb-4 relative z-10">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-700">Progresso</span>
            <span className="text-[9px] font-black text-zinc-600">{progress}%</span>
          </div>
          <div className="h-[3px] bg-white/[0.05] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: index * 0.02 }}
              className="h-full rounded-full"
              style={{ background: tier.barColor, opacity: 0.5 }}
            />
          </div>
        </div>
      )}

      {}
      {isUnlocked && (
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: `linear-gradient(90deg, transparent, ${tier.colorAlpha}0.4), transparent)` }}
        />
      )}
    </motion.div>
  );
}



function TierCard({ tierKey, unlocked, total }) {
  const tier = TIERS[tierKey];
  const pct  = total > 0 ? (unlocked / total) * 100 : 0;

  return (
    <div
      className="flex flex-col items-center gap-3 p-4 sm:p-5 rounded-[22px] sm:rounded-[28px] border transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] group/tier"
      style={{
        background: unlocked > 0 ? tier.bg : 'rgba(255,255,255,0.01)',
        border:     unlocked > 0 ? tier.border : '1px solid rgba(255,255,255,0.03)',
        boxShadow:  unlocked > 0 ? tier.glow : 'none',
        backdropFilter: 'blur(8px)',
      }}
    >
      {}
      <div className="relative">
        <img
          src={tier.medal}
          alt={tier.label}
          className="w-10 h-10 sm:w-12 sm:h-12 object-contain transition-all duration-500 group-hover/tier:scale-110"
          style={{ filter: unlocked === 0 ? 'grayscale(100%) brightness(0.25)' : 'none' }}
        />
        {unlocked === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-white/5">
            <Lock size={12} />
          </div>
        )}
      </div>

      <div className="text-center w-full">
        <p
          className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-2 sm:mb-3"
          style={{ color: unlocked > 0 ? tier.color : '#3a3a3c' }}
        >
          {tier.label}
        </p>

        {}
        <div className="h-[2px] sm:h-[3px] bg-white/[0.04] rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full"
            style={{ 
              background: tier.barColor,
              boxShadow: unlocked > 0 ? `0 0 10px ${tier.color}40` : 'none'
            }}
          />
        </div>

        <p className="text-[10px] sm:text-[11px] font-bold" style={{ color: unlocked > 0 ? '#F5F5F7' : '#2c2c2e' }}>
          {unlocked} <span className="text-[#3a3a3c] font-medium">/ {total}</span>
        </p>
      </div>
    </div>
  );
}



const CATEGORIES = ['all', 'tasks', 'goals', 'finances', 'routines', 'projects', 'tempo', 'streak', 'hidden'];

export default function Achievements() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
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
    const acc = { bronze: { u: 0, t: 0 }, prata: { u: 0, t: 0 }, ouro: { u: 0, t: 0 }, platina: { u: 0, t: 0 } };
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
    if (filter !== 'all') {
      list = list.filter(a =>
        filter === 'hidden'
          ? (a.category === 'hidden' || a.category === 'ultimate')
          : a.category === filter
      );
    }
    
    return [...list].sort((a, b) => {
      if (b.unlocked !== a.unlocked) return b.unlocked ? 1 : -1;
      const ra = TIERS[a.tier]?.rank || 0;
      const rb = TIERS[b.tier]?.rank || 0;
      return rb - ra;
    });
  }, [data, filter]);

  

  return (
    <div
      className="max-w-6xl mx-auto pb-32 px-4 md:px-6 font-sans select-none"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif' }}
    >
      <div className="pt-8 sm:pt-12 pb-6 sm:pb-10 flex items-center justify-between px-1">
        <div>
          <h1 className="text-[34px] sm:text-[48px] font-extrabold text-white tracking-tighter mb-1 leading-none">
            Conquistas
          </h1>
          <p className="text-[13px] sm:text-[16px] font-medium text-white/40 max-w-[240px] sm:max-w-none leading-tight">
            Cada troféu é uma prova de que você foi além.
          </p>
        </div>

        {}
        <div
          className="flex p-1 shrink-0 mt-2"
          style={{
            background: 'rgba(28,28,30,0.8)',
            backdropFilter: 'blur(12px)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <motion.button
            onClick={() => navigate('/achievements/leaderboard')}
            className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-[8px] text-[13px] font-medium outline-none cursor-pointer text-[#86868B] hover:text-[#F5F5F7] transition-colors"
            whileHover="hovered"
            initial="idle"
          >
            <motion.div
              variants={{
                idle:    { opacity: 0, scale: 0.95 },
                hovered: { opacity: 1, scale: 1 },
              }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              className="absolute inset-0 bg-[#3A3A3C] rounded-[8px] shadow-sm -z-10"
            />
            <Trophy size={14} strokeWidth={2} />
            <span className="hidden sm:inline">Top Global</span>
          </motion.button>
        </div>
      </div>

      {}
      {data && tierSummary && (
        <div
          className="glass-panel rounded-[32px] sm:rounded-[40px] p-6 sm:p-12 mb-10 relative overflow-hidden isolate"
          style={{
            background:  'linear-gradient(165deg, #111116 0%, #09090b 100%)',
            border:      '1px solid rgba(255,255,255,0.06)',
            boxShadow:   '0 40px 100px rgba(0,0,0,0.6)',
          }}
        >
          {}
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-[#FFD700]/[0.03] blur-[120px] rounded-full -z-10" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-[#CD7F32]/[0.03] blur-[120px] rounded-full -z-10" />

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-10 relative z-10">
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[64px] sm:text-[88px] font-black text-white leading-none tracking-tighter">
                  {data.stats.unlocked}
                </span>
                <span className="text-[24px] sm:text-[32px] font-bold text-white/20">
                  / {data.stats.total}
                </span>
              </div>
              <p className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.3em] text-white/30 ml-1">
                Troféus Desbloqueados
              </p>
            </div>

            <div className="flex-1 max-w-[320px]">
              <div className="flex justify-between items-end mb-2 px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Progresso Geral</span>
                <span className="text-[16px] font-black text-[#FFD700] tracking-tighter">{data.stats.percentage}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${data.stats.percentage}%` }}
                  transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #CD7F32, #FFD700, #E2E8FF)',
                    boxShadow: '0 0 20px rgba(255,215,0,0.2)',
                  }}
                />
              </div>
            </div>
          </div>

          {}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 relative z-10">
            {Object.entries(tierSummary).map(([key, val]) => (
              <TierCard key={key} tierKey={key} unlocked={val.u} total={val.t} />
            ))}
          </div>
        </div>
      )}

      {}
      <div className="sticky top-0 z-40 -mx-4 px-4 pb-6 pt-2 bg-transparent pointer-events-none mb-4">
        <div className="overflow-x-auto scrollbar-hide pointer-events-auto">
          <div className="flex p-1.5 bg-[#1C1C1E]/60 backdrop-blur-xl rounded-[24px] border border-white/[0.06] w-fit shadow-2xl">
            {CATEGORIES.map(cat => {
              const Icon = CATEGORY_LABELS[cat]?.icon || LayoutGrid;
              const label = CATEGORY_LABELS[cat]?.label || cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-[18px] text-[12px] font-bold transition-all duration-300 outline-none whitespace-nowrap ${
                    filter === cat ? 'text-white' : 'text-[#86868B] hover:text-white/60'
                  }`}
                >
                  {filter === cat && (
                    <motion.div
                      layoutId="activeFilterBg"
                      className="absolute inset-0 bg-[#323235] rounded-[18px] shadow-lg -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon size={14} strokeWidth={filter === cat ? 2.5 : 2} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {}
      {loading ? (
        <LoadingSkeleton variant="achievements" />
      ) : (
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-20 text-zinc-700 text-[13px] font-medium">
              Nenhuma conquista nesta categoria.
            </div>
          ) : (
            filtered.map((a, i) => (
              <AchievementCard key={a.slug} achievement={a} index={i} />
            ))
          )}
        </motion.div>
      )}

    </div>
  );
}
