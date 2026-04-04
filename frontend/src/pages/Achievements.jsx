import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

// ─── Tier config ─────────────────────────────────────────────────────────────

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
  all:      'Todas',
  tasks:    'Tarefas',
  goals:    'Metas',
  finances: 'Finanças',
  routines: 'Rotinas',
  projects: 'Projetos',
  tempo:    'Tempo',
  streak:   'Streak',
  hidden:   'Especiais',
  ultimate: 'Especiais',
};

// ─── Achievement Card ─────────────────────────────────────────────────────────

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
      {/* Platina shimmer overlay */}
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

      <div className="flex gap-4 p-5 relative z-10">
        {/* Medal */}
        <div className="relative shrink-0">
          <div
            className="w-[72px] h-[72px] rounded-[18px] flex items-center justify-center overflow-hidden transition-all duration-300"
            style={{
              background: isUnlocked ? tier.bg : 'rgba(255,255,255,0.03)',
              boxShadow:  isUnlocked ? tier.glow : 'none',
            }}
          >
            {isHidden ? (
              <Lock size={22} className="text-zinc-700" />
            ) : (
              <img
                src={tier.medal}
                alt={tier.label}
                className="w-12 h-12 object-contain transition-all duration-300"
                style={{ filter: isUnlocked ? 'none' : 'grayscale(100%) brightness(0.3)' }}
              />
            )}
          </div>

          {/* Unlock badge */}
          {isUnlocked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: tier.color }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5.5L4 7.5L8 3" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-[15px] font-bold leading-tight mb-1 truncate"
            style={{ color: isUnlocked ? '#F5F5F7' : '#3a3a3c' }}
          >
            {isHidden ? 'Conquista Oculta' : achievement.name}
          </h3>
          <p className="text-[12px] leading-snug line-clamp-2 mb-3" style={{ color: isUnlocked ? '#6e6e73' : '#2a2a2c' }}>
            {isHidden ? 'Continue evoluindo para revelar este troféu.' : achievement.description}
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Tier badge */}
            <span
              className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
              style={{
                background: isUnlocked ? `${tier.colorAlpha}0.12)` : 'rgba(255,255,255,0.04)',
                color:      isUnlocked ? tier.color : '#3a3a3c',
              }}
            >
              {tier.label}
            </span>

            {/* Category badge */}
            {!isHidden && (
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/[0.04] text-zinc-600">
                {CATEGORY_LABELS[achievement.category] || achievement.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
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

      {/* Full-width shimmer line at top for unlocked */}
      {isUnlocked && (
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: `linear-gradient(90deg, transparent, ${tier.colorAlpha}0.4), transparent)` }}
        />
      )}
    </motion.div>
  );
}

// ─── Tier Summary Card ────────────────────────────────────────────────────────

function TierCard({ tierKey, unlocked, total }) {
  const tier = TIERS[tierKey];
  const pct  = total > 0 ? (unlocked / total) * 100 : 0;

  return (
    <div
      className="flex flex-col items-center gap-3 p-4 rounded-[18px] border transition-all"
      style={{
        background: unlocked > 0 ? tier.bg : 'rgba(255,255,255,0.02)',
        border:     unlocked > 0 ? tier.border : '1px solid rgba(255,255,255,0.04)',
        boxShadow:  unlocked > 0 ? tier.glow : 'none',
      }}
    >
      {/* Medal image */}
      <img
        src={tier.medal}
        alt={tier.label}
        className="w-10 h-10 object-contain"
        style={{ filter: unlocked === 0 ? 'grayscale(100%) brightness(0.25)' : 'none' }}
      />

      <div className="text-center w-full">
        <p
          className="text-[10px] font-black uppercase tracking-[0.15em] mb-2"
          style={{ color: unlocked > 0 ? tier.color : '#2c2c2e' }}
        >
          {tier.label}
        </p>

        {/* Progress bar */}
        <div className="h-[3px] bg-white/[0.05] rounded-full overflow-hidden mb-1.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full"
            style={{ background: tier.barColor }}
          />
        </div>

        <p className="text-[10px] font-bold" style={{ color: unlocked > 0 ? '#6e6e73' : '#2c2c2e' }}>
          {unlocked} <span className="text-[#2c2c2e]">/ {total}</span>
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const CATEGORIES = ['all', 'tasks', 'goals', 'finances', 'routines', 'projects', 'tempo', 'streak', 'hidden'];

export default function Achievements() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const { error } = useToast();
  const { activeTeam } = useAuth();

  // ── Load achievements ──
  useEffect(() => {
    setLoading(true);
    api('/achievements')
      .then(d => setData(d))
      .catch(err => error(err.message))
      .finally(() => setLoading(false));
  }, [activeTeam]);

  // ── Derived ──
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
    // Unlocked first, then by tier rank (higher = earlier), then alpha
    return [...list].sort((a, b) => {
      if (b.unlocked !== a.unlocked) return b.unlocked ? 1 : -1;
      const ra = TIERS[a.tier]?.rank || 0;
      const rb = TIERS[b.tier]?.rank || 0;
      return rb - ra;
    });
  }, [data, filter]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="max-w-6xl mx-auto pb-32 px-4 md:px-6 font-sans select-none"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif' }}
    >
      {/* ── Header ── */}
      <div className="pt-10 pb-8">
        <h1 className="text-[38px] md:text-[44px] font-black text-white tracking-tighter mb-1 leading-none">
          Conquistas
        </h1>
        <p className="text-[15px] font-medium text-zinc-500">
          Cada troféu é uma prova de que você foi além.
        </p>
      </div>

      {/* ── Stats Hero ── */}
      {data && tierSummary && (
        <div
          className="rounded-[28px] p-7 md:p-10 mb-10 relative overflow-hidden"
          style={{
            background:  'linear-gradient(145deg, #111114, #0d0d10)',
            border:      '1px solid rgba(255,255,255,0.05)',
            boxShadow:   '0 30px 80px rgba(0,0,0,0.5)',
          }}
        >
          {/* Subtle radial glow behind */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(255,215,0,0.04) 0%, transparent 70%)' }}
          />

          {/* Score row */}
          <div className="flex items-end gap-3 mb-2 relative z-10">
            <span className="text-[60px] font-black text-white leading-none tracking-tighter">
              {data.stats.unlocked}
            </span>
            <span className="text-[28px] font-bold text-zinc-700 mb-1.5">
              / {data.stats.total}
            </span>
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-600 mb-7 relative z-10">
            Troféus desbloqueados
          </p>

          {/* Main progress bar */}
          <div className="relative z-10 mb-10">
            <div
              className="h-[6px] rounded-full overflow-hidden mb-2"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data.stats.percentage}%` }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #CD7F32, #FFD700, #E2E8FF)',
                  boxShadow:  '0 0 12px rgba(255,215,0,0.3)',
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-zinc-700">Progresso Total</span>
              <span style={{ color: '#FFD700' }}>{data.stats.percentage}%</span>
            </div>
          </div>

          {/* Tier grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
            {Object.entries(tierSummary).map(([key, val]) => (
              <TierCard key={key} tierKey={key} unlocked={val.u} total={val.t} />
            ))}
          </div>
        </div>
      )}

      {/* ── Filter Tabs ── */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className="px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all border shrink-0"
            style={{
              background: filter === cat ? '#fff' : '#111',
              color:      filter === cat ? '#000' : '#666',
              border:     filter === cat ? '1px solid #fff' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'rgba(255,215,0,0.3)', borderTopColor: '#FFD700' }}
          />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700">
            Carregando troféus...
          </p>
        </div>
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
