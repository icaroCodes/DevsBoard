import { useEffect, useRef, useState, useCallback } from 'react';
import supabase from '../lib/supabase';


const CURSOR_COLORS = [
  '#0A84FF', '#FF375F', '#30D158', '#FFD60A', '#BF5AF2',
  '#FF9F0A', '#64D2FF', '#FF6482', '#5E5CE6', '#34C759',
  '#AF52DE', '#FF2D55',
];

export function colorFromId(id) {
  const str = String(id || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}


// Hook: joins a Supabase Realtime channel scoped to roomId, tracks presence,
// and broadcasts/receives cursor positions. Throttled to ~20Hz.
export function useLiveCursors(roomId, user) {
  const [peers, setPeers] = useState({});
  const [cursors, setCursors] = useState({});
  const [dragStates, setDragStates] = useState({});
  const channelRef = useRef(null);

  const lastSentRef = useRef(0);
  const lastPosRef = useRef(null);
  const pendingRef = useRef(null);
  const flushTimerRef = useRef(null);

  useEffect(() => {
    if (!supabase || !roomId || !user?.id) return;

    const userId = String(user.id);
    const color = colorFromId(userId);

    const channel = supabase.channel(`cursors:${roomId}`, {
      config: {
        presence: { key: userId },
        broadcast: { self: false, ack: false },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const next = {};
        for (const key of Object.keys(state)) {
          const meta = state[key]?.[0];
          if (meta) next[key] = meta;
        }
        setPeers(next);
        // Remove cursors of peers that left
        setCursors(prev => {
          const filtered = {};
          for (const id of Object.keys(prev)) {
            if (next[id]) filtered[id] = prev[id];
          }
          return filtered;
        });
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setCursors(prev => {
          if (!prev[key]) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        });
        setDragStates(prev => {
          if (!prev[key]) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        });
      })
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        if (!payload?.userId || String(payload.userId) === userId) return;
        setCursors(prev => ({
          ...prev,
          [payload.userId]: {
            x: payload.x,
            y: payload.y,
            name: payload.name,
            color: payload.color,
            avatar: payload.avatar || null,
            visible: payload.visible !== false,
            ts: Date.now(),
          },
        }));
      })
      .on('broadcast', { event: 'cursor-hide' }, ({ payload }) => {
        if (!payload?.userId) return;
        setCursors(prev => {
          if (!prev[payload.userId]) return prev;
          return { ...prev, [payload.userId]: { ...prev[payload.userId], visible: false } };
        });
      })
      .on('broadcast', { event: 'drag-start' }, ({ payload }) => {
        if (!payload?.userId || String(payload.userId) === userId) return;
        setDragStates(prev => ({
          ...prev,
          [payload.userId]: {
            type: payload.type,
            id: payload.id,
            title: payload.title || '',
            color: payload.color,
          },
        }));
      })
      .on('broadcast', { event: 'drag-end' }, ({ payload }) => {
        if (!payload?.userId || String(payload.userId) === userId) return;
        setDragStates(prev => {
          if (!prev[payload.userId]) return prev;
          const next = { ...prev };
          delete next[payload.userId];
          return next;
        });
      });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        try {
          await channel.track({
            id: userId,
            name: user.name || 'Anônimo',
            avatar: user.avatar_url || user.avatar || null,
            color,
            joinedAt: Date.now(),
          });
        } catch { /* ignore */ }
      }
    });

    channelRef.current = channel;

    return () => {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      try { channel.untrack(); } catch { /* ignore */ }
      try { channel.unsubscribe(); } catch { /* ignore */ }
      try { supabase.removeChannel(channel); } catch { /* ignore */ }
      channelRef.current = null;
    };
  }, [roomId, user?.id, user?.name, user?.avatar]);

  // Throttled sender: emits at most once per 50ms (~20Hz). If a call happens
  // inside the throttle window, the latest position is queued and flushed
  // when the window closes — ensures the final position isn't dropped.
  const flush = useCallback(() => {
    flushTimerRef.current = null;
    const ch = channelRef.current;
    if (!ch || !pendingRef.current || !user?.id) return;
    const { x, y, visible } = pendingRef.current;
    pendingRef.current = null;
    lastSentRef.current = performance.now();
    lastPosRef.current = { x, y };
    ch.send({
      type: 'broadcast',
      event: 'cursor',
      payload: {
        userId: String(user.id),
        name: user.name || 'Anônimo',
        color: colorFromId(user.id),
        avatar: user.avatar_url || user.avatar || null,
        x, y,
        visible,
      },
    });
  }, [user?.id, user?.name, user?.avatar_url]);

  const sendCursor = useCallback((x, y, visible = true) => {
    const ch = channelRef.current;
    if (!ch || !user?.id) return;

    // Skip near-duplicate positions (sub-pixel) when visibility unchanged
    if (visible && lastPosRef.current
        && Math.abs(lastPosRef.current.x - x) < 0.5
        && Math.abs(lastPosRef.current.y - y) < 0.5) {
      return;
    }

    pendingRef.current = { x, y, visible };

    const now = performance.now();
    const elapsed = now - lastSentRef.current;
    if (elapsed >= 33) {
      flush();
    } else if (!flushTimerRef.current) {
      flushTimerRef.current = setTimeout(flush, 33 - elapsed);
    }
  }, [flush, user?.id]);

  const hideCursor = useCallback(() => {
    const ch = channelRef.current;
    if (!ch || !user?.id) return;
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    pendingRef.current = null;
    ch.send({
      type: 'broadcast',
      event: 'cursor-hide',
      payload: { userId: String(user.id) },
    });
  }, [user?.id]);

  const broadcastDragStart = useCallback((info) => {
    const ch = channelRef.current;
    if (!ch || !user?.id || !info) return;
    ch.send({
      type: 'broadcast',
      event: 'drag-start',
      payload: {
        userId: String(user.id),
        name: user.name || 'Anônimo',
        color: colorFromId(user.id),
        type: info.type,
        id: info.id != null ? String(info.id) : null,
        title: info.title || '',
      },
    });
  }, [user?.id, user?.name]);

  const broadcastDragEnd = useCallback(() => {
    const ch = channelRef.current;
    if (!ch || !user?.id) return;
    ch.send({
      type: 'broadcast',
      event: 'drag-end',
      payload: { userId: String(user.id) },
    });
  }, [user?.id]);

  return {
    cursors,
    peers,
    dragStates,
    sendCursor,
    hideCursor,
    broadcastDragStart,
    broadcastDragEnd,
  };
}
