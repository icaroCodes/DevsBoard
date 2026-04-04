import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/api';

const HEARTBEAT_INTERVAL = 30000; // 30 segundos
const SESSION_KEY = 'devsboard_session_id';

function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function sendHeartbeat(sessionId, activeSeconds) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const token = localStorage.getItem('token');
  const payload = JSON.stringify({
    session_id: sessionId,
    active_seconds: activeSeconds,
  });

  // fetch com keepalive funciona cross-origin com headers (sendBeacon não)
  try {
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
  } catch {
    // fallback para sendBeacon (sem auth, mas melhor que nada)
    navigator.sendBeacon?.(
      `${apiUrl}/sessions/heartbeat`,
      new Blob([payload], { type: 'application/json' })
    );
  }
}

export function useSessionTracker(isAuthenticated) {
  const [activeSeconds, setActiveSeconds] = useState(0);
  const activeSecondsRef = useRef(0);
  const isActiveRef = useRef(true);
  const intervalRef = useRef(null);
  const heartbeatRef = useRef(null);
  const sessionIdRef = useRef(null);
  const initializedRef = useRef(false);

  // Inicializar sessão
  useEffect(() => {
    if (!isAuthenticated || initializedRef.current) return;
    initializedRef.current = true;

    // Criar ou recuperar session ID
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    const isExisting = !!sessionId;

    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }

    sessionIdRef.current = sessionId;

    // Registrar/recuperar sessão no backend
    api('/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then((data) => {
        if (isExisting && data?.active_seconds > 0) {
          // Restaurar tempo salvo no backend (caso de reload)
          activeSecondsRef.current = data.active_seconds;
          setActiveSeconds(data.active_seconds);
        }
      })
      .catch(() => {})
      .finally(() => {
        // Iniciar contador apenas após restaurar o tempo
        intervalRef.current = setInterval(() => {
          if (isActiveRef.current) {
            activeSecondsRef.current += 1;
            setActiveSeconds(activeSecondsRef.current);
          }
        }, 1000);

        // Heartbeat para persistir no backend
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
      // Enviar último heartbeat antes de desmontar
      if (sessionIdRef.current && activeSecondsRef.current > 0) {
        sendHeartbeat(sessionIdRef.current, activeSecondsRef.current);
      }
      clearInterval(intervalRef.current);
      clearInterval(heartbeatRef.current);
      initializedRef.current = false;
    };
  }, [isAuthenticated]);

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

  // Enviar heartbeat ao fechar/recarregar (com auth)
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
