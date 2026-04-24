import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, X, Music, Volume2, VolumeX, GripHorizontal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

const POSITION_KEY = 'audio_position';
const PLAYER_POS_KEY = 'audio_player_position';
const ACCENT = '#8E9C78';
const FADE_DURATION = 400; 

export default function AudioPlayer() {
  const { user } = useAuth();
  const audioRef = useRef(null);
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(true);
  const [volume, setVolume] = useState(user?.audio_volume ?? 60);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showVolume, setShowVolume] = useState(false);
  const saveTimer = useRef(null);
  const volumeTimer = useRef(null);
  const volumeTimeout = useRef(null);
  const fadeInterval = useRef(null);

  
  const [pos, setPos] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PLAYER_POS_KEY));
      if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') return saved;
    } catch {}
    return null; 
  });
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  
  const [seeking, setSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const seekBarRef = useRef(null);

  
  useEffect(() => {
    if (!playing) return;
    saveTimer.current = setInterval(() => {
      if (audioRef.current && user?.audio_url)
        localStorage.setItem(POSITION_KEY, audioRef.current.currentTime);
    }, 2000);
    return () => clearInterval(saveTimer.current);
  }, [playing, user?.audio_url]);

  useEffect(() => {
    const save = () => {
      if (audioRef.current && user?.audio_url)
        localStorage.setItem(POSITION_KEY, audioRef.current.currentTime);
    };
    window.addEventListener('beforeunload', save);
    const onVis = () => { if (document.hidden) save(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('beforeunload', save);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [user?.audio_url]);

  useEffect(() => {
    setReady(false);
    setPlaying(false);
    setProgress(0);
    if (user?.audio_volume !== undefined) setVolume(user.audio_volume);
  }, [user?.audio_url, user?.id]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume / 100;
  }, [volume, muted]);

  useEffect(() => {
    if (!ready || !audioRef.current) return;
    const saved = parseFloat(localStorage.getItem(POSITION_KEY) || '0');
    if (saved > 0) audioRef.current.currentTime = saved;
    if (user?.audio_enabled === false) return;
    audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [ready, user?.audio_enabled]);

  
  useEffect(() => {
    if (!pos) return;
    const handleResize = () => {
      setPos(prev => {
        if (!prev || !playerRef.current) return prev;
        const rect = playerRef.current.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;
        return {
          x: Math.max(0, Math.min(prev.x, maxX)),
          y: Math.max(0, Math.min(prev.y, maxY)),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pos]);

  
  const fadeOutAndPause = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    clearInterval(fadeInterval.current);

    const startVol = el.volume;
    const steps = 20;
    const stepTime = FADE_DURATION / steps;
    let step = 0;

    fadeInterval.current = setInterval(() => {
      step++;
      const t = step / steps;
      
      el.volume = Math.max(0, startVol * (1 - t * t));
      if (step >= steps) {
        clearInterval(fadeInterval.current);
        el.pause();
        el.volume = startVol; 
        setPlaying(false);
      }
    }, stepTime);
  }, []);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      clearInterval(fadeInterval.current); 
      el.volume = muted ? 0 : volume / 100;
      el.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      fadeOutAndPause();
    }
  };

  const restart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
  };

  
  const getSeekPct = useCallback((clientX) => {
    if (!seekBarRef.current) return 0;
    const rect = seekBarRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const handleSeekStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pct = getSeekPct(clientX);
    setSeeking(true);
    setSeekValue(pct * duration);
  }, [duration, getSeekPct]);

  const handleSeekMove = useCallback((e) => {
    if (!seeking) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pct = getSeekPct(clientX);
    setSeekValue(pct * duration);
  }, [seeking, duration, getSeekPct]);

  const handleSeekEnd = useCallback(() => {
    if (!seeking) return;
    if (audioRef.current) audioRef.current.currentTime = seekValue;
    setProgress(seekValue);
    setSeeking(false);
  }, [seeking, seekValue]);

  useEffect(() => {
    if (!seeking) return;
    const move = (e) => handleSeekMove(e);
    const up = () => handleSeekEnd();
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [seeking, handleSeekMove, handleSeekEnd]);

  
  const handleDragStart = useCallback((e) => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const rect = playerRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragState.current = {
      dragging: true,
      startX: clientX,
      startY: clientY,
      originX: rect.left,
      originY: rect.top,
    };

    const handleMove = (ev) => {
      if (!dragState.current.dragging) return;
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const dx = cx - dragState.current.startX;
      const dy = cy - dragState.current.startY;
      let nx = dragState.current.originX + dx;
      let ny = dragState.current.originY + dy;
      
      nx = Math.max(0, Math.min(nx, window.innerWidth - rect.width));
      ny = Math.max(0, Math.min(ny, window.innerHeight - rect.height));
      setPos({ x: nx, y: ny });
    };

    const handleUp = () => {
      dragState.current.dragging = false;
      
      setPos(prev => {
        if (prev) localStorage.setItem(PLAYER_POS_KEY, JSON.stringify(prev));
        return prev;
      });
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
  }, []);

  
  const handleVolumeChange = (v) => {
    setVolume(v);
    setMuted(false);
    clearTimeout(volumeTimer.current);
    volumeTimer.current = setTimeout(() => {
      api('/settings', { method: 'PUT', body: JSON.stringify({ audio_volume: v }) }).catch(() => {});
    }, 600);
  };

  if (!user?.audio_url || !visible) return null;

  const displayProgress = seeking ? seekValue : progress;
  const pct = duration > 0 ? (displayProgress / duration) * 100 : 0;
  const cover = user.audio_cover_url;
  const songName = user.audio_name || 'Música';
  const artist = user.audio_artist || '';

  const fmt = (s) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  
  const positionStyle = pos
    ? { position: 'fixed', left: pos.x, top: pos.y, bottom: 'auto', right: 'auto' }
    : { position: 'fixed', bottom: 20, right: 20 };

  return (
    <>
      <audio
        ref={audioRef}
        src={user.audio_url}
        loop preload="auto"
        onCanPlay={() => setReady(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => {
          if (!seeking) setProgress(audioRef.current?.currentTime ?? 0);
        }}
        onDurationChange={() => setDuration(audioRef.current?.duration ?? 0)}
      />

      <AnimatePresence>
        <motion.div
          ref={playerRef}
          key="player"
          initial={{ opacity: 0, y: 16, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          className="z-70 select-none"
          style={{
            ...positionStyle,
            width: 280,
            borderRadius: 24,
            overflow: 'hidden',
            background: 'rgba(8, 8, 10, 0.92)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 1px 0 rgba(255,255,255,0.06) inset',
          }}
        >
          {}
          <div
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className="flex items-center justify-center py-1.5 cursor-grab active:cursor-grabbing"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <GripHorizontal size={14} style={{ color: 'rgba(255,255,255,0.18)' }} />
          </div>

          {}
          <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
            {cover ? (
              <img
                src={cover}
                alt={songName}
                className="w-full h-full object-cover"
                draggable={false}
                style={{ display: 'block' }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: 'linear-gradient(160deg, #1a1a1e 0%, #0e0e10 100%)' }}
              >
                <Music size={48} strokeWidth={0.8} style={{ color: 'rgba(255,255,255,0.08)' }} />
              </div>
            )}

            {}
            <div
              className="absolute inset-x-0 bottom-0 pointer-events-none"
              style={{
                height: '65%',
                background: 'linear-gradient(to top, rgba(8,8,10,0.98) 0%, rgba(8,8,10,0.7) 40%, transparent 100%)',
              }}
            />

            {}
            <AnimatePresence>
              {playing && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute top-3 left-3.5 flex items-end gap-[3px]"
                >
                  {[5, 9, 6, 8].map((h, i) => (
                    <motion.div
                      key={i}
                      className="rounded-full"
                      style={{ width: 3, backgroundColor: ACCENT }}
                      animate={{ height: [h, h + 6, h] }}
                      transition={{ repeat: Infinity, duration: 0.45 + i * 0.1, ease: 'easeInOut' }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {}
            <button
              onClick={() => { audioRef.current?.pause(); setVisible(false); }}
              aria-label="Fechar"
              className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)' }}
            >
              <X size={12} className="text-white/70" />
            </button>

            {}
            <div className="absolute bottom-0 inset-x-0 px-5 pb-4 pointer-events-none">
              <p
                className="text-[16px] font-bold leading-tight truncate text-white"
                style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)', letterSpacing: '-0.01em' }}
              >
                {songName}
              </p>
              {artist && (
                <p
                  className="text-[13px] mt-0.5 truncate"
                  style={{ color: 'rgba(255,255,255,0.5)', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}
                >
                  {artist}
                </p>
              )}
            </div>
          </div>

          {}
          <div className="px-5 pt-3 pb-4 space-y-3">

            {}
            <div className="space-y-1.5">
              <div
                ref={seekBarRef}
                className="relative h-[5px] rounded-full cursor-pointer group"
                style={{ background: 'rgba(255,255,255,0.1)' }}
                onMouseDown={handleSeekStart}
                onTouchStart={handleSeekStart}
              >
                {}
                <div
                  className="h-full rounded-full pointer-events-none"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT}dd)`,
                    transition: seeking ? 'none' : 'width 0.15s linear',
                  }}
                />
                {}
                <div
                  className="absolute top-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-transform"
                  style={{
                    width: 13,
                    height: 13,
                    left: `${pct}%`,
                    transform: `translate(-50%, -50%) scale(${seeking ? 1.3 : 1})`,
                    background: 'white',
                    boxShadow: `0 0 8px rgba(0,0,0,0.4), 0 0 0 2px ${ACCENT}50`,
                    opacity: seeking ? 1 : 0,
                    transition: 'opacity 0.15s, transform 0.15s',
                  }}
                />
                {}
                <div
                  className="absolute inset-0 group-hover:opacity-100 opacity-0 pointer-events-none transition-opacity"
                >
                  <div
                    className="absolute top-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      width: 13,
                      height: 13,
                      left: `${pct}%`,
                      transform: 'translate(-50%, -50%)',
                      background: 'white',
                      boxShadow: `0 0 8px rgba(0,0,0,0.4), 0 0 0 2px ${ACCENT}50`,
                      display: seeking ? 'none' : 'block',
                    }}
                  />
                </div>
              </div>
              {}
              <div className="flex items-center justify-between">
                <span className="text-[10px] tabular-nums" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {fmt(displayProgress)}
                </span>
                <span className="text-[10px] tabular-nums" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {fmt(duration)}
                </span>
              </div>
            </div>

            {}
            <div className="flex items-center justify-center gap-5">
              {}
              <div
                className="relative"
                onMouseEnter={() => { clearTimeout(volumeTimeout.current); setShowVolume(true); }}
                onMouseLeave={() => { volumeTimeout.current = setTimeout(() => setShowVolume(false), 400); }}
              >
                <button
                  onClick={() => setMuted(m => !m)}
                  aria-label={muted ? 'Desmutar' : 'Mutar'}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:bg-white/[0.06] active:scale-90"
                  style={{ color: muted ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)' }}
                >
                  {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>

                {}
                <AnimatePresence>
                  {showVolume && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 flex items-center px-3 py-2.5 rounded-2xl"
                      style={{
                        background: 'rgba(14,14,16,0.97)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(24px)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                      }}
                    >
                      <input
                        type="range" min={0} max={100}
                        value={muted ? 0 : volume}
                        onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                        className="cursor-pointer"
                        style={{
                          writingMode: 'vertical-lr',
                          direction: 'rtl',
                          accentColor: ACCENT,
                          width: 4,
                          height: 72,
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {}
              <button
                onClick={restart}
                aria-label="Reiniciar"
                className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/[0.06] active:scale-90"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                <SkipBack size={20} fill="currentColor" />
              </button>

              {}
              <button
                onClick={toggle}
                aria-label={playing ? 'Pausar' : 'Tocar'}
                className="w-14 h-14 shrink-0 aspect-square rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{
                  background: `radial-gradient(circle at 40% 30%, rgba(255,255,255,0.18) 0%, transparent 70%), ${ACCENT}`,
                  boxShadow: `0 6px 28px ${ACCENT}55, 0 0 0 1px rgba(255,255,255,0.08) inset`,
                }}
              >
                {playing
                  ? <Pause size={22} strokeWidth={2.5} className="text-white" />
                  : <Play size={22} fill="white" className="text-white ml-0.5" />}
              </button>

              {}
              <button
                onClick={restart}
                aria-label="Repetir"
                className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/[0.06] active:scale-90"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                <SkipForward size={20} fill="currentColor" />
              </button>

              {}
              <div className="w-8 h-8" />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
