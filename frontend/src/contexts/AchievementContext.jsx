import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, X } from 'lucide-react';
import { api } from '../lib/api';

const AchievementContext = createContext(null);

// ─── Tier config (espelho do Achievements.jsx) ────────────────────────────────

const TIERS = {
  bronze:  { label: 'Bronze',  color: '#CD7F32', colorAlpha: 'rgba(205,127,50,',  medal: '/bronze.svg',  glowStrong: '0 0 60px rgba(205,127,50,0.30)',  border: '1px solid rgba(205,127,50,0.22)',  barColor: '#CD7F32'  },
  prata:   { label: 'Prata',   color: '#C8D4E3', colorAlpha: 'rgba(200,212,227,', medal: '/prata.svg',   glowStrong: '0 0 60px rgba(200,212,227,0.28)', border: '1px solid rgba(200,212,227,0.22)', barColor: '#A8B8CC'  },
  ouro:    { label: 'Ouro',    color: '#FFD700', colorAlpha: 'rgba(255,215,0,',   medal: '/ouro.svg',    glowStrong: '0 0 60px rgba(255,215,0,0.30)',   border: '1px solid rgba(255,215,0,0.22)',   barColor: '#FFD700'  },
  platina: { label: 'Platina', color: '#E2E8FF', colorAlpha: 'rgba(226,232,255,', medal: '/platina.svg', glowStrong: '0 0 80px rgba(200,200,255,0.40)', border: '1px solid rgba(226,232,255,0.25)', barColor: '#C8D0FF'  },
};

// ─── Som ──────────────────────────────────────────────────────────────────────

function playUnlockSound(tier) {
  try {
    const src   = tier === 'platina' ? '/audio/monstersong.mp3' : '/audio/Rdrsong.mp3';
    const audio = new Audio(src);
    audio.volume = 0.6;
    audio.play().catch(() => {});
  } catch (_) {}
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function fireConfetti(tier) {
  const colors = {
    bronze:  ['#CD7F32', '#E8A45A', '#F5C88A', '#fff'],
    prata:   ['#A8B8CC', '#C8D4E3', '#E0E8F4', '#fff'],
    ouro:    ['#FFD700', '#FFA500', '#FFE55C', '#fff'],
    platina: ['#E2E8FF', '#C8D0FF', '#A0A8FF', '#FFD700', '#fff', '#C0C0C0'],
  };
  const palette = colors[tier] || colors.bronze;

  if (tier === 'platina') {
    const burst = (origin, angle) => confetti({
      particleCount: 120, angle, spread: 90, startVelocity: 55,
      gravity: 0.8, decay: 0.93, origin, colors: palette,
      shapes: ['star', 'circle'], scalar: 1.3, zIndex: 9999,
    });
    burst({ x: 0.5, y: 0.6 }, 90);
    setTimeout(() => burst({ x: 0.2, y: 0.7 }, 60),  180);
    setTimeout(() => burst({ x: 0.8, y: 0.7 }, 120), 360);
    setTimeout(() => burst({ x: 0.5, y: 0.5 }, 90),  600);
  } else {
    confetti({
      particleCount: 80, angle: 90, spread: 70, startVelocity: 45,
      gravity: 0.9, decay: 0.92, origin: { x: 0.5, y: 0.65 },
      colors: palette, shapes: ['circle', 'square'], scalar: 1.1, zIndex: 9999,
    });
  }
}

// ─── Popup ────────────────────────────────────────────────────────────────────

function UnlockPopup({ achievement, onClose }) {
  const tier       = TIERS[achievement.tier] || TIERS.bronze;
  const [progress, setProgress] = useState(100);
  const timerRef   = useRef(null);
  const isPlatina  = achievement.tier === 'platina';

  useEffect(() => {
    const DURATION = 5000;
    const TICK     = 50;
    let elapsed    = 0;
    timerRef.current = setInterval(() => {
      elapsed += TICK;
      setProgress(Math.max(0, 100 - (elapsed / DURATION) * 100));
      if (elapsed >= DURATION) { clearInterval(timerRef.current); onClose(); }
    }, TICK);
    return () => clearInterval(timerRef.current);
  }, [onClose]);

  return (
    <motion.div
      initial={{ x: 120, opacity: 0 }}
      animate={{ x: 0,   opacity: 1 }}
      exit={{   x: 120, opacity: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      className="fixed bottom-6 right-6 z-[9999] w-[340px] overflow-hidden rounded-[20px] cursor-pointer select-none"
      style={{ background: 'linear-gradient(135deg,#111114,#18181c)', border: tier.border, boxShadow: `${tier.glowStrong},0 20px 60px rgba(0,0,0,0.7)` }}
      onClick={onClose}
    >
      {/* Platina shimmer */}
      {isPlatina && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{ background: 'linear-gradient(90deg,transparent 0%,rgba(200,210,255,0.06) 50%,transparent 100%)', backgroundSize: '200% 100%' }}
        />
      )}

      <div className="flex items-center gap-4 p-5">
        {/* Medal */}
        <motion.div
          initial={{ scale: 0.4, rotate: -15 }}
          animate={{ scale: 1,   rotate: 0 }}
          transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.1 }}
          className="relative shrink-0"
        >
          <div
            className="w-16 h-16 rounded-[18px] flex items-center justify-center overflow-hidden"
            style={{ background: `${tier.colorAlpha}0.08)`, boxShadow: tier.glowStrong.replace('60px', '20px') }}
          >
            <img src={tier.medal} alt={tier.label} className="w-12 h-12 object-contain" />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 400 }}
            className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: tier.color }}
          >
            <Sparkles size={12} color="#000" strokeWidth={2.5} />
          </motion.div>
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-0.5" style={{ color: tier.color }}>
            Conquista Desbloqueada!
          </p>
          <p className="text-[15px] font-bold text-white leading-tight truncate">
            {achievement.name}
          </p>
          <p className="text-[12px] text-zinc-500 mt-0.5 line-clamp-1">
            {achievement.description}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
              style={{ background: `${tier.colorAlpha}0.12)`, color: tier.color }}
            >
              {tier.label}
            </span>
          </div>
        </div>

        <button
          onClick={e => { e.stopPropagation(); onClose(); }}
          className="shrink-0 p-1.5 rounded-full hover:bg-white/10 text-zinc-600 hover:text-zinc-300 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Barra de auto-dismiss */}
      <div className="h-[2px] bg-white/[0.04]">
        <div className="h-full transition-none" style={{ width: `${progress}%`, background: tier.barColor }} />
      </div>
    </motion.div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const SEEN_KEY    = 'devsboard_seen_achievements';
const DEBOUNCE_MS = 1500;

export function AchievementProvider({ children }) {
  const [queue,      setQueue]      = useState([]);
  const [current,    setCurrent]    = useState(null);
  const debounceRef = useRef(null);

  // Enfileira conquistas para exibição + som + confetti
  const showAchievements = useCallback((achievements) => {
    if (!achievements?.length) return;
    setQueue(q => [...q, ...achievements]);
  }, []);

  // Chama o backend e retorna conquistas recém-desbloqueadas
  const checkAchievements = useCallback(async () => {
    try {
      if (!localStorage.getItem('user')) return;
      const data = await api('/achievements/check', { method: 'POST' });
      if (data?.newly_unlocked?.length) {
        showAchievements(data.newly_unlocked);
      }
    } catch (err) {
      console.warn('[Achievements] checkAchievements falhou:', err?.message || err);
    }
  }, [showAchievements]);

  // Escuta mutações da api.js
  useEffect(() => {
    const handler = () => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(checkAchievements, DEBOUNCE_MS);
    };
    window.addEventListener('devsboard:mutation', handler);
    return () => {
      window.removeEventListener('devsboard:mutation', handler);
      clearTimeout(debounceRef.current);
    };
  }, [checkAchievements]);

  // Gerencia fila: exibe uma por vez
  useEffect(() => {
    if (current || !queue.length) return;

    const next = queue[0];
    setQueue(q => q.slice(1));
    setCurrent(next);

    // Marca como vista no localStorage (evita re-exibição na página de conquistas)
    const seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'));
    seen.add(next.slug);
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));

    // Som + confetti
    setTimeout(() => {
      playUnlockSound(next.tier);
      fireConfetti(next.tier);
    }, 200);
  }, [current, queue]);

  const dismiss = useCallback(() => setCurrent(null), []);

  return (
    <AchievementContext.Provider value={{ checkAchievements, showAchievements }}>
      {children}
      <AnimatePresence>
        {current && (
          <UnlockPopup key={current.slug} achievement={current} onClose={dismiss} />
        )}
      </AnimatePresence>
    </AchievementContext.Provider>
  );
}

export const useAchievements = () => useContext(AchievementContext);
