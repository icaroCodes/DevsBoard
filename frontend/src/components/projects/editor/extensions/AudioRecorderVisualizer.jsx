import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AudioRecorderVisualizer({ onCancel, onSave }) {
  const canvasRef = useRef(null);
  const [time, setTime] = useState(0);
  const [ready, setReady] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const historyRef = useRef([]);
  const lastPushTimeRef = useRef(0);
  const containerRef = useRef(null);

  const drawVisualizer = useCallback((timestamp) => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    animationRef.current = requestAnimationFrame(drawVisualizer);

    analyser.getByteTimeDomainData(dataArray);

    // Calculate RMS for accurate volume representation
    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / dataArray.length);
    const amplitude = Math.min(1, rms * 5);

    // Push ~20 samples per second
    if (timestamp - lastPushTimeRef.current > 50) {
      historyRef.current.push(amplitude);
      const barW = 3;
      const gap = 2;
      const maxBars = Math.floor(width / (barW + gap));
      if (historyRef.current.length > maxBars) {
        historyRef.current.shift();
      }
      lastPushTimeRef.current = timestamp;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const barW = 3;
    const gap = 2;
    const totalBars = historyRef.current.length;

    for (let i = 0; i < totalBars; i++) {
      const val = historyRef.current[i];
      const minH = 2;
      const barH = Math.max(minH, val * height * 0.95);
      const x = i * (barW + gap);
      const y = (height - barH) / 2;

      // Gradient: brighter for louder bars
      const brightness = 200 + Math.floor(val * 55);
      ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${0.4 + val * 0.6})`;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 1.5);
      ctx.fill();
    }

    ctx.restore();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(prev => prev + 1), 1000);

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.3;
        source.connect(analyser);
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

        // Setup canvas DPR
        if (canvasRef.current) {
          const dpr = window.devicePixelRatio || 1;
          const rect = canvasRef.current.getBoundingClientRect();
          canvasRef.current.width = rect.width * dpr;
          canvasRef.current.height = rect.height * dpr;
        }

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], `gravacao_${Date.now()}.webm`, { type: 'audio/webm' });
          onSave(audioFile);
        };

        mediaRecorder.start();
        setReady(true);
        animationRef.current = requestAnimationFrame(drawVisualizer);
      } catch (err) {
        console.error('Microphone access denied:', err);
        alert('Não foi possível acessar o microfone. Verifique as permissões.');
        onCancel();
      }
    };

    startRecording();

    return () => {
      clearInterval(timer);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [drawVisualizer, onCancel, onSave]);

  const handleCancel = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    onCancel();
  };

  const handleSave = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <motion.div
      ref={containerRef}
      className="db-recorder-pill"
      contentEditable={false}
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Mic icon with glow */}
      <motion.div
        className="db-recorder-mic"
        animate={{ boxShadow: ['0 0 0 0 rgba(239,68,68,0.4)', '0 0 0 8px rgba(239,68,68,0)', '0 0 0 0 rgba(239,68,68,0.4)'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Mic size={14} />
      </motion.div>

      {/* Timer */}
      <span className="db-recorder-time">{formatTime(time)}</span>

      {/* Waveform canvas */}
      <div className="db-recorder-waveform">
        <canvas ref={canvasRef} className="db-recorder-canvas" />
      </div>

      {/* Actions */}
      <div className="db-recorder-actions">
        <motion.button
          className="db-recorder-btn db-recorder-btn--cancel"
          onClick={handleCancel}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
          whileTap={{ scale: 0.92 }}
          title="Cancelar"
        >
          <X size={16} />
        </motion.button>
        <motion.button
          className="db-recorder-btn db-recorder-btn--save"
          onClick={handleSave}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          title="Salvar"
        >
          <Check size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}
