import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaPlaceholder } from './MediaPlaceholder.jsx';
import { MediaWrapper } from './MediaWrapper.jsx';

/* ─── Waveform Generator ─── */
function generateWaveformBars(count) {
  // Generate a natural-looking static waveform pattern
  const bars = [];
  for (let i = 0; i < count; i++) {
    const t = i / count;
    // Create an organic pattern using overlapping sine waves
    const base = 0.15;
    const wave1 = Math.sin(t * Math.PI * 6) * 0.25;
    const wave2 = Math.sin(t * Math.PI * 14 + 1.2) * 0.15;
    const wave3 = Math.sin(t * Math.PI * 22 + 2.8) * 0.1;
    const noise = (Math.random() - 0.5) * 0.12;
    bars.push(Math.max(0.08, Math.min(1, base + wave1 + wave2 + wave3 + noise)));
  }
  return bars;
}

/* ─── Apple-style Audio Player ─── */
function AppleAudioPlayer({ src }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const audioRef = useRef(null);
  const timelineRef = useRef(null);
  const barsRef = useRef(generateWaveformBars(64));

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (!isDragging) setProgress(audio.currentTime);
    };
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isDragging]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const seekTo = useCallback((e) => {
    if (!timelineRef.current || !audioRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = x / rect.width;
    const time = pct * duration;
    audioRef.current.currentTime = time;
    setProgress(time);
  }, [duration]);

  const handleMouseDown = useCallback((e) => {
    e.stopPropagation();
    setIsDragging(true);
    seekTo(e);

    const handleMove = (ev) => seekTo(ev);
    const handleUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [seekTo]);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const pct = duration ? (progress / duration) * 100 : 0;

  return (
    <motion.div
      className="db-apple-player"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play / Pause */}
      <motion.button
        className="db-apple-play-btn"
        onClick={togglePlay}
        onMouseDown={(e) => e.stopPropagation()}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
      >
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.div key="pause" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
              <Pause size={15} fill="currentColor" stroke="currentColor" strokeWidth={0.5} />
            </motion.div>
          ) : (
            <motion.div key="play" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
              <Play size={16} fill="currentColor" stroke="currentColor" strokeWidth={1} style={{ marginLeft: '2px' }} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Waveform */}
      <div
        ref={timelineRef}
        className="db-apple-waveform"
        onMouseDown={handleMouseDown}
      >
        {barsRef.current.map((val, i) => {
          const barPct = (i / (barsRef.current.length - 1)) * 100;
          const played = barPct <= pct;
          return (
            <div
              key={i}
              className={`db-apple-bar ${played ? 'db-apple-bar--played' : ''}`}
              style={{ height: `${val * 100}%` }}
            />
          );
        })}
        {/* Scrubber Dot */}
        <motion.div
          className="db-apple-scrubber"
          style={{ left: `${pct}%` }}
          animate={{ scale: isDragging ? 1.5 : 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>

      {/* Time */}
      <div className="db-apple-time">
        <span>{formatTime(progress)}</span>
        <span className="db-apple-time-sep">/</span>
        <span>{formatTime(duration)}</span>
      </div>
    </motion.div>
  );
}

/* ─── Node View ─── */
function CustomAudioView({ node, updateAttributes, deleteNode }) {
  const handleUrlSubmit = (url) => {
    updateAttributes({ src: url });
  };

  const handleFileUpload = (file) => {
    const url = URL.createObjectURL(file);
    updateAttributes({ src: url });
  };

  return (
    <NodeViewWrapper as="div" className="db-audio-block" data-type="custom-audio">
      {node.attrs.src ? (
        <MediaWrapper onEdit={() => updateAttributes({ src: null })} onDelete={deleteNode}>
          <div className="db-audio-player-wrapper" contentEditable={false}>
            <AppleAudioPlayer src={node.attrs.src} />
          </div>
        </MediaWrapper>
      ) : (
        <MediaPlaceholder
          type="audio"
          onUrlSubmit={handleUrlSubmit}
          onFileUpload={handleFileUpload}
        />
      )}
    </NodeViewWrapper>
  );
}

export const CustomAudio = Node.create({
  name: 'customAudio',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: el => el.getAttribute('src'),
        renderHTML: attrs => attrs.src ? { src: attrs.src } : {},
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="custom-audio"]' },
      { tag: 'audio[src]' }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'custom-audio', class: 'db-audio-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomAudioView);
  },
});
