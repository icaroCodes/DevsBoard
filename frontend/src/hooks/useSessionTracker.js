import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/api';

const HEARTBEAT_INTERVAL = 30000; // 30 segundos
const SESSION_KEY = 'devsboard_session';

function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function sendHeartbeat(sessionId, activeSeconds) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const token = localStorage.getItem('token');
  const payload = JSON.stringify({ session_id: sessionId, active_seconds: activeSeconds });

  fetch(`${apiUrl}/sessions/heartbeat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

export function useSessionTracker(isAuthenticated, userId) {
  const [activeSeconds, setActiveSeconds] = useState(0);
  const activeSecondsRef = useRef(0);
  const isActiveRef = useRef(true);
  const intervalRef = useRef(null);
  const heartbeatRef = useRef(null);
  const sessionIdRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Flag para cancelar callbacks assíncronos se o efeito for limpo antes
    let cancelled = false;

    // Reusa a sessão apenas se pertencer ao mesmo usuário
    let sessionId = null;
    let isExisting = false;
    try {
      const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY));
      if (stored?.sessionId && stored?.userId && String(stored.userId) === String(userId)) {
        sessionId = stored.sessionId;
        isExisting = true;
      }
    } catch (_) {}

    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId, userId, activeSeconds: 0 }));
    } else {
      // Se já existia no sessionStorage, carrega o tempo guardado imediatamente para evitar o "zero"
      const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY));
      if (stored?.activeSeconds > 0) {
        activeSecondsRef.current = stored.activeSeconds;
        setActiveSeconds(stored.activeSeconds);
      }
    }

    sessionIdRef.current = sessionId;

    api('/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then((data) => {
        if (cancelled) return;
        if (isExisting && data?.active_seconds > 0) {
          activeSecondsRef.current = data.active_seconds;
          setActiveSeconds(data.active_seconds);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;

        // Contador de 1 em 1 segundo
        intervalRef.current = setInterval(() => {
          if (isActiveRef.current) {
            activeSecondsRef.current += 1;
            setActiveSeconds(prev => {
              const newVal = prev + 1;
              // Salva no sessionStorage para persistir no refresh
              try {
                const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
                sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...stored, activeSeconds: newVal }));
              } catch (_) {}
              return newVal;
            });
          }
        }, 1000);

        // Heartbeat para persistir no backend a cada 30s
        heartbeatRef.current = setInterval(() => {
          if (sessionIdRef.current && activeSecondsRef.current > 0) {
            api('/sessions/heartbeat', {
              method: 'POST',
              body: JSON.stringify({
                session_id: sessionIdRef.current,
                active_seconds: activeSecondsRef.current,
              }),
            }).catch(() => {});
          }
        }, HEARTBEAT_INTERVAL);
      });

    return () => {
      cancelled = true;
      if (sessionIdRef.current && activeSecondsRef.current > 0) {
        sendHeartbeat(sessionIdRef.current, activeSecondsRef.current);
      }
      clearInterval(intervalRef.current);
      clearInterval(heartbeatRef.current);
      intervalRef.current = null;
      heartbeatRef.current = null;
      // DO NOT remove SESSION_KEY here to allow persistence across refreshes
      activeSecondsRef.current = 0;
      setActiveSeconds(0);
    };
  }, [isAuthenticated, userId]);

  // Detectar visibilidade da aba
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      isActiveRef.current = document.visibilityState === 'visible';
    };
    const handleFocus = () => { isActiveRef.current = true; };
    const handleBlur = () => { isActiveRef.current = false; };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isAuthenticated]);

  // Heartbeat final ao fechar a aba
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleBeforeUnload = () => {
      if (sessionIdRef.current && activeSecondsRef.current > 0) {
        sendHeartbeat(sessionIdRef.current, activeSecondsRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAuthenticated]);

  const formatTime = useCallback((totalSecs) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    if (hours > 0) return `${hours}h ${minutes}min`;
    if (minutes > 0) return `${minutes}min`;
    return `${seconds}s`;
  }, []);

  return {
    activeSeconds,
    formattedTime: formatTime(activeSeconds),
    isActive: isActiveRef.current,
  };
}
