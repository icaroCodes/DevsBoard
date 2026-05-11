import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const AlarmContext = createContext(null);

function getBrasiliaHHMM() {
  try {
    const parts = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const h = parts.find(p => p.type === 'hour')?.value || '00';
    const m = parts.find(p => p.type === 'minute')?.value || '00';
    return `${h}:${m}`;
  } catch {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const d = new Date(utcMs - 3 * 60 * 60 * 1000);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}

const typeLabel = { task: 'Atividade', card: 'Recado', routine: 'Rotina' };

function AlarmNotification({ alarm, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 30000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.96 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-3 bg-[#1C1C1E] border border-[#FFD60A]/30 rounded-[18px] px-4 py-3.5 shadow-2xl w-full max-w-sm pointer-events-auto"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,214,10,0.15)' }}
    >
      <div className="w-9 h-9 rounded-full bg-[#FFD60A]/15 flex items-center justify-center shrink-0 mt-0.5">
        <Bell size={17} className="text-[#FFD60A]" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-[#FFD60A] mb-0.5">{typeLabel[alarm.type] || 'Alarme'} · {alarm.time?.substring(0, 5)}</p>
        <p className="text-[14px] font-semibold text-[#F5F5F7] truncate">{alarm.title}</p>
        {alarm.description && (
          <p className="text-[12px] text-[#86868B] mt-0.5 line-clamp-1">{alarm.description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="p-1 text-[#86868B] hover:text-[#F5F5F7] rounded-full hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function AlarmProvider({ children }) {
  const { user } = useAuth();
  const alarmsRef = useRef([]);
  const firedRef = useRef(new Map());
  const lastMinuteRef = useRef(null);
  const swRegRef = useRef(null);
  const audioUnlockedRef = useRef(false);
  const [activeAlarms, setActiveAlarms] = useState([]);

  const playAlarm = useCallback(async (alarm) => {
    try {
      const audio = new Audio('/audio/alarme.mp3');
      audio.volume = 1.0;
      await audio.play();
    } catch (_) {}

    setActiveAlarms(prev => {
      const key = `${alarm.id}-${Date.now()}`;
      return [...prev, { ...alarm, _key: key }];
    });
  }, []);

  const dismissAlarm = useCallback((key) => {
    setActiveAlarms(prev => prev.filter(a => a._key !== key));
  }, []);

  const checkAlarms = useCallback(() => {
    const currentHHMM = getBrasiliaHHMM();

    if (currentHHMM !== lastMinuteRef.current) {
      firedRef.current.clear();
      lastMinuteRef.current = currentHHMM;
    }

    alarmsRef.current.forEach(alarm => {
      if (!alarm.time) return;
      if (alarm.time.substring(0, 5) !== currentHHMM) return;
      if (firedRef.current.has(alarm.id)) return;
      firedRef.current.set(alarm.id, true);
      playAlarm(alarm);
    });
  }, [playAlarm]);

  const loadAlarms = useCallback(async () => {
    if (!user) return;
    try {
      const alarms = await api('/alarms');
      alarmsRef.current = alarms;
      if (swRegRef.current?.active) {
        swRegRef.current.active.postMessage({ type: 'SET_ALARMS', alarms });
      }
    } catch (_) {}
  }, [user]);

  // Unlock audio on first user interaction
  useEffect(() => {
    const unlock = () => {
      if (audioUnlockedRef.current) return;
      audioUnlockedRef.current = true;
      const a = new Audio('/audio/alarme.mp3');
      a.volume = 0;
      a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
    };
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, []);

  // Register service worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        swRegRef.current = reg;
        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data?.type === 'ALARM_FIRE') {
            playAlarm(event.data.alarm);
          }
        });
      })
      .catch(() => {});

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [playAlarm]);

  useEffect(() => { loadAlarms(); }, [loadAlarms]);

  // Reload alarms when data changes (tasks, cards, routines saved)
  useEffect(() => {
    const handler = () => loadAlarms();
    window.addEventListener('devsboard:mutation', handler);
    return () => window.removeEventListener('devsboard:mutation', handler);
  }, [loadAlarms]);

  // Check every 30s
  useEffect(() => {
    checkAlarms();
    const id = setInterval(checkAlarms, 30000);
    return () => clearInterval(id);
  }, [checkAlarms]);

  return (
    <AlarmContext.Provider value={{ refreshAlarms: loadAlarms }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 380 }}>
        <AnimatePresence>
          {activeAlarms.map(alarm => (
            <AlarmNotification
              key={alarm._key}
              alarm={alarm}
              onDismiss={() => dismissAlarm(alarm._key)}
            />
          ))}
        </AnimatePresence>
      </div>
    </AlarmContext.Provider>
  );
}

export const useAlarm = () => useContext(AlarmContext);
