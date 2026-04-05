import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const TIER_CONFIG = {
  platina: { color: '#E2E8FF', medal: '/platina.svg', label: 'Platina' },
  ouro:    { color: '#FFD700', medal: '/ouro.svg',    label: 'Ouro'    },
  prata:   { color: '#C8D4E3', medal: '/prata.svg',   label: 'Prata'   },
  bronze:  { color: '#CD7F32', medal: '/bronze.svg',  label: 'Bronze'  },
};

// qual medalha aparece no pódio de cada posição
const PODIUM_MEDAL = {
  1: { src: '/platina.svg', color: '#E2E8FF', glow: 'rgba(226,232,255,0.35)', border: 'rgba(226,232,255,0.3)',  bg: 'linear-gradient(145deg,#0e0e14,#13131a)', pedestal: 'h-32' },
  2: { src: '/prata.svg',   color: '#C8D4E3', glow: 'rgba(200,212,227,0.25)', border: 'rgba(200,212,227,0.22)', bg: 'linear-gradient(145deg,#111114,#0e0e11)', pedestal: 'h-24' },
  3: { src: '/bronze.svg',  color: '#CD7F32', glow: 'rgba(205,127,50,0.25)',  border: 'rgba(205,127,50,0.22)',  bg: 'linear-gradient(145deg,#110e0a,#0e0b08)', pedestal: 'h-20' },
};

function Avatar({ user, size = 48, fontSize = 18 }) {
  const [errored, setErrored] = useState(false);
  const initial = (user.name || '?')[0].toUpperCase();

  if (user.avatar_url && !errored) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
        onError={() => setErrored(true)}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-black text-white shrink-0"
      style={{ width: size, height: size, fontSize, background: 'linear-gradient(135deg,#2a2a2e,#1a1a1e)' }}
    >
      {initial}
    </div>
  );
}

function TierBadges({ user }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      {['platina', 'ouro', 'prata', 'bronze'].map(tier => {
        const count = user[tier];
        if (!count) return null;
        const cfg = TIER_CONFIG[tier];
        return (
          <div key={tier} className="flex items-center gap-0.5">
            <img src={cfg.medal} alt={cfg.label} className="w-3.5 h-3.5 object-contain" />
            <span className="text-[10px] font-black" style={{ color: cfg.color }}>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function PodiumCard({ user, position, isMe }) {
  const cfg = PODIUM_MEDAL[position];
  const isFirst = position === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * position, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-2"
      style={{ flex: isFirst ? '0 0 40%' : '0 0 27%' }}
    >
      {/* Avatar flutuando acima do pedestal */}
      <div className="relative">
        <div
          className="rounded-full p-[2px]"
          style={{ background: `linear-gradient(135deg, ${cfg.color}, transparent)` }}
        >
          <Avatar
            user={user}
            size={isFirst ? 68 : 52}
            fontSize={isFirst ? 24 : 18}
          />
        </div>
        {isMe && (
          <div
            className="absolute -bottom-1 -right-1 text-[7px] font-black px-1.5 py-0.5 rounded-full"
            style={{ background: '#8E9C78', color: '#000' }}
          >
            EU
          </div>
        )}
      </div>

      {/* Pedestal */}
      <div
        className={`w-full rounded-[18px] flex flex-col items-center justify-end gap-2 pb-4 pt-3 px-3 ${cfg.pedestal}`}
        style={{
          background: cfg.bg,
          border:     `1px solid ${cfg.border}`,
          boxShadow:  `0 0 40px ${cfg.glow}`,
        }}
      >
        {/* Medalha do tier */}
        <img
          src={cfg.src}
          alt={`#${position}`}
          className="object-contain"
          style={{ width: isFirst ? 36 : 28, height: isFirst ? 36 : 28 }}
        />

        {/* Nome */}
        <p
          className="text-center font-black leading-tight w-full"
          style={{
            fontSize: isFirst ? (user.name.length > 10 ? 11 : 13) : (user.name.length > 10 ? 9 : 11),
            color: '#F5F5F7',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: 1.2,
          }}
        >
          {user.name.length > 14 ? user.name.slice(0, 13) + '…' : user.name}
        </p>

        {/* Total */}
        <p
          className="text-[10px] font-black"
          style={{ color: cfg.color }}
        >
          {user.total} troféus
        </p>
      </div>
    </motion.div>
  );
}

const ROW_MEDAL = {
  1: { src: '/platina.svg', color: '#E2E8FF' },
  2: { src: '/prata.svg',   color: '#C8D4E3' },
  3: { src: '/bronze.svg',  color: '#CD7F32' },
};

function RankRow({ user, position, isMe, index }) {
  const positionMedal = ROW_MEDAL[position];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="flex items-center gap-4 px-4 py-3.5 rounded-[16px] transition-all"
      style={{
        background: isMe ? 'rgba(142,156,120,0.08)' : 'rgba(255,255,255,0.025)',
        border:     isMe ? '1px solid rgba(142,156,120,0.2)' : '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Posição */}
      <div className="w-7 flex items-center justify-center shrink-0">
        {positionMedal ? (
          <img src={positionMedal.src} alt={`#${position}`} className="w-5 h-5 object-contain" />
        ) : (
          <span className="text-[12px] font-black" style={{ color: isMe ? '#8E9C78' : '#3a3a3c' }}>
            #{position}
          </span>
        )}
      </div>

      {/* Avatar */}
      <Avatar user={user} size={40} fontSize={15} />

      {/* Nome + badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[13px] font-bold text-white truncate">{user.name}</p>
          {isMe && (
            <span
              className="text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0"
              style={{ background: '#8E9C78', color: '#000' }}
            >
              EU
            </span>
          )}
        </div>
        <TierBadges user={user} />
      </div>

      {/* Total */}
      <span className="text-[13px] font-black text-zinc-400 shrink-0">{user.total}</span>
    </motion.div>
  );
}

export default function Leaderboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api('/achievements/leaderboard')
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const leaderboard = data?.leaderboard || [];
  const podium      = leaderboard.slice(0, 3);
  const top5        = leaderboard.slice(0, 5);

  return (
    <div
      className="max-w-2xl mx-auto pb-32 px-4 md:px-6 font-sans select-none"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif' }}
    >
      {/* Header */}
      <div className="pt-10 pb-8 flex items-start justify-between">
        <div>
          <motion.button
            onClick={() => navigate('/achievements')}
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 mb-5 group"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <div
              className="flex items-center justify-center w-8 h-8 rounded-[10px] transition-all duration-200 group-hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ArrowLeft size={15} color="#A1A1AA" />
            </div>
            <span
              className="text-[13px] font-semibold transition-colors duration-200 text-zinc-500 group-hover:text-white"
            >
              Conquistas
            </span>
          </motion.button>
          <h1 className="text-[38px] md:text-[44px] font-black text-white tracking-tighter mb-1 leading-none">
            Top Global
          </h1>
          <p className="text-[15px] font-medium text-zinc-500">
            As contas com mais troféus desbloqueados.
          </p>
        </div>
        <Trophy size={32} className="text-zinc-700 mt-10 shrink-0" />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'rgba(255,215,0,0.3)', borderTopColor: '#FFD700' }}
          />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700">
            Carregando ranking...
          </p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 gap-3 text-zinc-700">
          <Trophy size={40} strokeWidth={1} />
          <p className="text-[13px] font-medium">Nenhuma conquista desbloqueada ainda.</p>
        </div>
      ) : (
        <>
          {/* ── Pódio ── */}
          {podium.length >= 1 && (
            <div className="mb-8">
              <div className="flex items-end justify-center gap-3">
                {/* 2º lugar à esquerda */}
                {podium[1] && (
                  <PodiumCard user={podium[1]} position={2} isMe={podium[1].id === user?.id} />
                )}
                {/* 1º lugar no centro */}
                <PodiumCard user={podium[0]} position={1} isMe={podium[0].id === user?.id} />
                {/* 3º lugar à direita */}
                {podium[2] && (
                  <PodiumCard user={podium[2]} position={3} isMe={podium[2].id === user?.id} />
                )}
              </div>
            </div>
          )}

          {/* ── Top 5 lista ── */}
          {top5.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700 mb-2">
                Top 5
              </p>
              {top5.map((u, i) => (
                <RankRow
                  key={u.id}
                  user={u}
                  position={i + 1}
                  isMe={u.id === user?.id}
                  index={i}
                />
              ))}
            </div>
          )}

          {/* Minha posição fora do top 50 */}
          {data?.mePosition && data.mePosition > 50 && (
            <div
              className="mt-6 p-4 rounded-[16px] text-center"
              style={{ background: 'rgba(142,156,120,0.06)', border: '1px solid rgba(142,156,120,0.15)' }}
            >
              <p className="text-[12px] text-zinc-500">
                Sua posição: <span className="font-black text-white">#{data.mePosition}</span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
