import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Lock, Sparkles, Clock, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const categoryLabels = {
  all: 'Todas',
  tasks: 'Tarefas',
  goals: 'Metas',
  finances: 'Finanças',
  routines: 'Rotinas',
  projects: 'Projetos',
  teams: 'Times',
  tempo: 'Tempo',
  longevidade: 'Longevidade',
  special: 'Especiais',
};

const categoryColors = {
  tasks: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', glow: 'rgba(59,130,246,0.15)' },
  goals: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'rgba(16,185,129,0.15)' },
  finances: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'rgba(245,158,11,0.15)' },
  routines: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', glow: 'rgba(168,85,247,0.15)' },
  projects: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', glow: 'rgba(6,182,212,0.15)' },
  teams: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', glow: 'rgba(244,63,94,0.15)' },
  tempo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', glow: 'rgba(99,102,241,0.15)' },
  longevidade: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20', glow: 'rgba(20,184,166,0.15)' },
  special: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', glow: 'rgba(234,179,8,0.15)' },
};

const tierColors = {
  iniciante: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', label: 'Iniciante' },
  consistente: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Consistente' },
  avançado: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Avançado' },
  dominante: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Dominante' },
};

function formatProgressLabel(achievement) {
  const { category, slug, current, threshold } = achievement;

  // Tempo de sessão e total: mostrar em formato legível
  if (slug === 'session_1h' || slug === 'session_3h') {
    const curMin = Math.floor(current / 60);
    const thrMin = Math.floor(threshold / 60);
    if (curMin >= 60) {
      return `${Math.floor(curMin / 60)}h ${curMin % 60}min / ${Math.floor(thrMin / 60)}h`;
    }
    return `${curMin}min / ${thrMin >= 60 ? `${Math.floor(thrMin / 60)}h` : `${thrMin}min`}`;
  }

  if (slug?.startsWith('total_')) {
    const curH = Math.floor(current / 3600);
    const curM = Math.floor((current % 3600) / 60);
    const thrH = Math.floor(threshold / 3600);
    return `${curH}h ${curM}min / ${thrH}h`;
  }

  if (slug?.startsWith('account_')) {
    return `${current} / ${threshold} dias`;
  }

  // Finanças: formato monetário
  if (category === 'finances' && threshold >= 1000) {
    return `R$ ${current.toLocaleString('pt-BR')} / R$ ${threshold.toLocaleString('pt-BR')}`;
  }

  return `${current} / ${threshold}`;
}

function AchievementCard({ achievement, index }) {
  const colors = categoryColors[achievement.category] || categoryColors.special;
  const tier = tierColors[achievement.tier] || tierColors.iniciante;
  const isUnlocked = achievement.unlocked;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className={`relative group rounded-[24px] border overflow-hidden transition-all duration-500 ${
        isUnlocked
          ? `bg-[#1C1C1E] ${colors.border} hover:border-white/20 shadow-sm hover:shadow-lg`
          : 'bg-[#1C1C1E]/60 border-white/[0.03] opacity-60 hover:opacity-80'
      }`}
      style={isUnlocked ? { boxShadow: `0 0 40px ${colors.glow}` } : {}}
    >
      {/* Glow effect for unlocked */}
      {isUnlocked && (
        <div
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-[0.06] pointer-events-none transition-opacity group-hover:opacity-[0.12]"
          style={{ background: colors.glow.replace('0.15', '1') }}
        />
      )}

      <div className="relative p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] flex items-center justify-center text-2xl sm:text-3xl shrink-0 transition-transform group-hover:scale-105 ${
            isUnlocked ? `${colors.bg} shadow-lg` : 'bg-white/[0.03]'
          }`}>
            {isUnlocked ? (
              <span className="drop-shadow-lg">{achievement.icon}</span>
            ) : (
              <Lock size={22} className="text-[#48484A]" />
            )}
            {isUnlocked && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#30D158] flex items-center justify-center shadow-lg shadow-[#30D158]/30">
                <Sparkles size={10} className="text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className={`text-[15px] sm:text-[17px] font-semibold tracking-tight truncate ${
              isUnlocked ? 'text-[#F5F5F7]' : 'text-[#48484A]'
            }`}>
              {achievement.name}
            </h3>
            <p className={`text-[12px] sm:text-[13px] mt-0.5 line-clamp-2 ${
              isUnlocked ? 'text-[#86868B]' : 'text-[#3A3A3C]'
            }`}>
              {achievement.description}
            </p>

            {/* Category + Tier tags */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`inline-block px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-widest ${
                isUnlocked ? `${colors.bg} ${colors.text}` : 'bg-white/[0.02] text-[#3A3A3C]'
              }`}>
                {categoryLabels[achievement.category]}
              </span>
              {achievement.tier && (
                <span className={`inline-block px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-widest ${
                  isUnlocked ? `${tier.bg} ${tier.text}` : 'bg-white/[0.02] text-[#3A3A3C]'
                }`}>
                  {tier.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className={`text-[11px] font-medium ${isUnlocked ? 'text-[#86868B]' : 'text-[#3A3A3C]'}`}>
              {isUnlocked ? 'Completa' : formatProgressLabel(achievement)}
            </span>
            <span className={`text-[11px] font-bold ${isUnlocked ? colors.text : 'text-[#3A3A3C]'}`}>
              {achievement.progress}%
            </span>
          </div>
          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${achievement.progress}%` }}
              transition={{ duration: 1.2, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full rounded-full ${
                isUnlocked ? 'bg-gradient-to-r from-[#30D158] to-[#34C759]' : 'bg-white/10'
              }`}
            />
          </div>
        </div>

        {/* Unlock date */}
        {isUnlocked && achievement.unlocked_at && (
          <p className="text-[10px] text-[#48484A] mt-2.5 font-medium">
            Desbloqueada em {new Date(achievement.unlocked_at).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function Achievements() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { error } = useToast();
  const { activeTeam } = useAuth();

  useEffect(() => {
    setLoading(true);
    api('/achievements')
      .then(setData)
      .catch(err => error(err.message))
      .finally(() => setLoading(false));
  }, [activeTeam]);

  const filteredAchievements = data?.achievements?.filter(a =>
    filter === 'all' ? true : a.category === filter
  ) || [];

  const unlockedFirst = [...filteredAchievements].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    return b.progress - a.progress;
  });

  const categories = ['all', ...Object.keys(categoryLabels).filter(k => k !== 'all')];

  // Tier progress summary
  const tierSummary = data?.achievements ? (() => {
    const tiers = { iniciante: { total: 0, unlocked: 0 }, consistente: { total: 0, unlocked: 0 }, avançado: { total: 0, unlocked: 0 }, dominante: { total: 0, unlocked: 0 } };
    data.achievements.forEach(a => {
      if (a.tier && tiers[a.tier]) {
        tiers[a.tier].total++;
        if (a.unlocked) tiers[a.tier].unlocked++;
      }
    });
    return tiers;
  })() : null;

  return (
    <div
      className="max-w-5xl mx-auto pb-12 font-sans"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      {/* Header */}
      <div className="flex flex-col gap-6 mb-8 lg:mb-10 px-1 sm:px-0">
        <div className="space-y-1">
          <h1 className="text-[32px] md:text-[40px] leading-tight font-semibold text-[#F5F5F7] tracking-tight">
            Conquistas
          </h1>
          <p className="text-[15px] sm:text-[17px] text-[#86868B]">Acompanhe seu progresso e evolua na plataforma</p>
        </div>

        {/* Stats card */}
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-[#1C1C1E] border border-white/[0.06] rounded-[28px] p-6 sm:p-8 overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#30D158]/[0.04] to-transparent rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#0A84FF]/[0.03] to-transparent rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Trophy icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[20px] bg-gradient-to-br from-[#FFD700]/20 to-[#FFA500]/10 border border-[#FFD700]/10 flex items-center justify-center shrink-0 shadow-lg shadow-[#FFD700]/5">
                <Trophy size={32} className="sm:size-10 text-[#FFD700] drop-shadow-lg" />
              </div>

              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-[36px] sm:text-[48px] font-bold text-[#F5F5F7] tracking-tighter leading-none">
                    {data.stats.unlocked}
                  </span>
                  <span className="text-[18px] sm:text-[22px] text-[#86868B] font-medium">
                    / {data.stats.total}
                  </span>
                </div>
                <p className="text-[13px] sm:text-[15px] text-[#86868B] mt-1">conquistas desbloqueadas</p>

                {/* Progress bar */}
                <div className="mt-4 max-w-md">
                  <div className="h-2.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${data.stats.percentage}%` }}
                      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FF8C00] shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[11px] text-[#48484A] font-medium">Progresso Geral</span>
                    <span className="text-[11px] text-[#FFD700] font-bold">{data.stats.percentage}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tier Progress Bars */}
            {tierSummary && (
              <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/[0.05]">
                {Object.entries(tierSummary).map(([key, val]) => {
                  const tc = tierColors[key];
                  const pct = val.total > 0 ? Math.round((val.unlocked / val.total) * 100) : 0;
                  return (
                    <div key={key} className="text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${tc.text}`}>{tc.label}</span>
                        <span className="text-[10px] text-[#48484A] font-medium">{val.unlocked}/{val.total}</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className={`h-full rounded-full ${
                            key === 'iniciante' ? 'bg-zinc-400' :
                            key === 'consistente' ? 'bg-blue-400' :
                            key === 'avançado' ? 'bg-purple-400' :
                            'bg-amber-400'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3.5 py-2 rounded-full text-[12px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                filter === cat
                  ? 'bg-white text-zinc-950 shadow-lg shadow-white/10'
                  : 'bg-white/[0.04] text-[#86868B] hover:bg-white/[0.08] hover:text-[#F5F5F7]'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-4 items-center justify-center h-[40vh]">
          <div className="w-10 h-10 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
          <p className="text-[14px] text-[#86868B] font-medium">Carregando conquistas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {unlockedFirst.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-[#1C1C1E] rounded-[24px] border border-white/[0.04]">
              <Trophy size={48} className="text-[#86868B] mb-4 opacity-50" strokeWidth={1.5} />
              <p className="text-[17px] font-medium text-[#F5F5F7]">Nenhuma conquista nesta categoria</p>
              <p className="text-[14px] text-[#86868B] mt-2 text-center max-w-sm">
                Continue usando o DevsBoard para desbloquear conquistas incríveis!
              </p>
            </div>
          ) : (
            unlockedFirst.map((a, i) => (
              <AchievementCard key={a.slug} achievement={a} index={i} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
