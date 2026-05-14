import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Camera, Trash2, Star, ChevronDown } from 'lucide-react';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const INITIAL_LIMIT = 6;

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

const COLORS = ['#8E9C78', '#A8B8CC', '#CD7F32', '#C8D0FF', '#D4B895', '#9CB4A8'];

function pickColor(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
}

function formatWhen(iso, lang = 'pt') {
  try {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return lang === 'pt' ? 'agora' : 'now';
    if (diff < 3600) {
      const m = Math.floor(diff / 60);
      return lang === 'pt' ? `há ${m}min` : `${m}m ago`;
    }
    if (diff < 86400) {
      const h = Math.floor(diff / 3600);
      return lang === 'pt' ? `há ${h}h` : `${h}h ago`;
    }
    if (diff < 86400 * 7) {
      const dd = Math.floor(diff / 86400);
      return lang === 'pt' ? `há ${dd}d` : `${dd}d ago`;
    }
    return d.toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return '';
  }
}

function Avatar({ name, photoUrl, size = 36 }) {
  const [errored, setErrored] = useState(false);
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  const color = pickColor(name || '');

  if (photoUrl && !errored) {
    return (
      <img
        src={photoUrl}
        alt={name}
        onError={() => setErrored(true)}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 text-white font-medium tracking-tight"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}33 0%, ${color}11 100%)`,
        border: `1px solid ${color}44`,
        fontSize: size * 0.42,
        color: color,
      }}
    >
      {initial}
    </div>
  );
}

function StarsDisplay({ value = 5 }) {
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={12}
          strokeWidth={1.2}
          className={n <= value ? 'text-[#E8C266]' : 'text-white/15'}
          fill={n <= value ? '#E8C266' : 'transparent'}
        />
      ))}
    </div>
  );
}

function StarsInput({ value, onChange, lang }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="inline-flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(n)}
          aria-label={`${n} ${lang === 'pt' ? 'estrela' : 'star'}${n > 1 ? 's' : ''}`}
          className="p-1 -m-1 transition-transform hover:scale-110 focus:outline-none focus:ring-1 focus:ring-[#E8C266]/40 rounded-full"
        >
          <Star
            size={20}
            strokeWidth={1.3}
            className={n <= active ? 'text-[#E8C266]' : 'text-white/25'}
            fill={n <= active ? '#E8C266' : 'transparent'}
          />
        </button>
      ))}
    </div>
  );
}

function FeedbackCard({ fb, lang, index }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: Math.min(index, 6) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="break-inside-avoid mb-3 md:mb-5 group relative bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] rounded-[16px] md:rounded-[18px] p-4 md:p-6 transition-colors"
    >
      {fb.rating != null && (
        <div className="mb-2.5 md:mb-3">
          <StarsDisplay value={fb.rating} />
        </div>
      )}
      <blockquote className="text-[13.5px] md:text-[15px] leading-[1.55] md:leading-[1.6] text-white/80 font-light tracking-[-0.005em]">
        {fb.text}
      </blockquote>
      <figcaption className="mt-4 md:mt-5 flex items-center gap-2.5 md:gap-3">
        <Avatar name={fb.name} photoUrl={fb.photo_url} size={28} />
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] md:text-[13px] text-white/90 font-normal truncate">{fb.name}</p>
          <p className="text-[10.5px] md:text-[11px] text-white/35 font-light tabular-nums">{formatWhen(fb.created_at, lang)}</p>
        </div>
      </figcaption>
    </motion.figure>
  );
}

function FeedbackSkeleton({ heights = [120, 160, 100, 140, 110, 150] }) {
  return (
    <>
      {heights.map((h, i) => (
        <div
          key={i}
          className="break-inside-avoid mb-4 md:mb-5 bg-white/[0.02] border border-white/[0.04] rounded-[18px] animate-pulse"
          style={{ height: h }}
        />
      ))}
    </>
  );
}

function FeedbackModal({ open, onClose, onSubmit, t, status, error, lang }) {
  const [name, setName] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [photoMeta, setPhotoMeta] = useState(null); // { name, sizeKb }
  const [photoError, setPhotoError] = useState(null);
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setName('');
      setPhotoDataUrl('');
      setPhotoMeta(null);
      setPhotoError(null);
      setText('');
      setRating(5);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const canSubmit = name.trim().length > 0 && text.trim().length > 0 && status !== 'submitting';
  const remaining = 280 - text.length;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);

    if (!ALLOWED_MIMES.includes(file.type)) {
      setPhotoError(lang === 'pt' ? 'Use JPG, PNG ou WebP.' : 'Use JPG, PNG, or WebP.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(lang === 'pt' ? 'Imagem maior que 2 MB.' : 'Image larger than 2 MB.');
      e.target.value = '';
      return;
    }

    try {
      const dataUrl = await readFileAsDataURL(file);
      setPhotoDataUrl(dataUrl);
      setPhotoMeta({ name: file.name, sizeKb: Math.round(file.size / 1024) });
    } catch {
      setPhotoError(lang === 'pt' ? 'Não consegui ler a imagem.' : "Couldn't read the image.");
    }
  };

  const removePhoto = () => {
    setPhotoDataUrl('');
    setPhotoMeta(null);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handle = (e) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      text: text.trim(),
      photo_base64: photoDataUrl || null,
      rating,
    });
  };

  // Enter envia (Shift+Enter quebra linha quando o foco está na textarea).
  // Em inputs single-line o submit nativo já cobre, mas adicionamos handler
  // explícito para evitar comportamentos diferentes entre browsers.
  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    const isTextarea = e.target.tagName === 'TEXTAREA';
    if (isTextarea && e.shiftKey) return; // permite nova linha
    e.preventDefault();
    handle();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-6 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.form
            onSubmit={handle}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full md:max-w-[460px] bg-[#0c0c0c] border border-white/[0.08] md:rounded-[24px] rounded-t-[24px] p-6 md:p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
          >
            {/* Top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#8E9C78]/30 to-transparent rounded-t-[24px]" />

            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white/90 hover:bg-white/[0.05] transition-colors"
            >
              <X size={16} />
            </button>

            <h3 className="text-[22px] md:text-[26px] font-light text-white tracking-[-0.02em] mb-1.5 leading-tight">
              {t.fbModalTitle}
            </h3>
            <p className="text-[13px] text-white/45 font-light leading-snug mb-6">
              {t.fbModalDesc}
            </p>

            <div className="space-y-5">
              {/* Photo uploader — large avatar slot with click-to-upload */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative shrink-0 w-[56px] h-[56px] rounded-full overflow-hidden group focus:outline-none focus:ring-2 focus:ring-[#8E9C78]/40"
                  aria-label={t.fbPhoto}
                >
                  {photoDataUrl ? (
                    <img src={photoDataUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Avatar name={name} size={56} />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={18} className="text-white" strokeWidth={1.6} />
                  </div>
                </button>

                <div className="flex-1 min-w-0">
                  <label className="block text-[10.5px] text-white/40 font-light mb-1">{t.fbName}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.fbNamePh}
                    maxLength={60}
                    className="w-full bg-transparent border-b border-white/10 focus:border-[#8E9C78]/50 text-[14px] text-white placeholder:text-white/25 font-light py-1.5 outline-none transition-colors"
                  />
                  {photoMeta ? (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-white/45 font-light">
                      <span className="truncate max-w-[180px]">{photoMeta.name}</span>
                      <span className="text-white/25 tabular-nums">· {photoMeta.sizeKb} KB</span>
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="ml-auto inline-flex items-center gap-1 text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={11} />
                        <span>{lang === 'pt' ? 'remover' : 'remove'}</span>
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-white/30 font-light">
                      {t.fbPhotoPh}
                    </p>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFile}
                />
              </div>

              {photoError && (
                <p className="text-[12px] text-red-400/90 -mt-2">{photoError}</p>
              )}

              {/* Rating */}
              <div className="flex items-center justify-between gap-3">
                <label className="text-[10.5px] text-white/40 font-light">{t.fbRating}</label>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-white/35 font-light tabular-nums">{rating}/5</span>
                  <StarsInput value={rating} onChange={setRating} lang={lang} />
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <label className="block text-[10.5px] text-white/40 font-light">{t.fbText}</label>
                  <span className={`text-[10px] font-light tabular-nums ${remaining < 0 ? 'text-red-400' : 'text-white/30'}`}>
                    {remaining}
                  </span>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t.fbTextPh}
                  maxLength={280}
                  rows={3}
                  className="w-full bg-transparent border border-white/10 rounded-[10px] focus:border-[#8E9C78]/50 text-[14px] text-white placeholder:text-white/25 font-light p-3 outline-none transition-colors resize-none leading-[1.5]"
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-[12px] text-red-400/90 mt-4 overflow-hidden"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-end gap-2 mt-7">
              <button
                type="button"
                onClick={onClose}
                className="text-[13px] text-white/45 hover:text-white/80 px-4 py-2 transition-colors"
              >
                {t.fbCancel}
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full text-[13px] font-medium hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_8px_24px_-8px_rgba(142,156,120,0.45)]"
              >
                {status === 'submitting' ? (
                  <span>{t.fbSubmitting}</span>
                ) : (
                  <>
                    <span>{t.fbSubmit}</span>
                    <Send size={12} />
                  </>
                )}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function FeedbackWall({ t, lang = 'pt' }) {
  const [items, setItems] = useState(null); // null = loading
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`${API_URL}/public/feedbacks?limit=24`);
      if (!res.ok) throw new Error('fetch_failed');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (payload) => {
    setStatus('submitting');
    setError(null);
    try {
      const res = await fetch(`${API_URL}/public/feedbacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus('error');
        setError(data?.error || t.fbErrorGeneric);
        return;
      }
      setItems((prev) => [data, ...(prev || [])]);
      setStatus('success');
      setOpen(false);
      setToast(t.fbThanks);
      setTimeout(() => setToast(null), 3000);
    } catch {
      setStatus('error');
      setError(t.fbErrorGeneric);
    }
  };

  const hasItems = items && items.length > 0;
  const visibleItems = useMemo(() => {
    if (!items) return [];
    return expanded ? items : items.slice(0, INITIAL_LIMIT);
  }, [items, expanded]);
  const hiddenCount = hasItems ? Math.max(0, items.length - INITIAL_LIMIT) : 0;

  return (
    <section className="relative py-14 md:py-36 px-4 sm:px-6 border-t border-white/[0.04] bg-[#0a0a0a]">
      {/* Subtle sage line at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-8 md:h-12 bg-gradient-to-b from-[#8E9C78]/40 to-transparent" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 md:gap-10 mb-8 md:mb-16">
          <div>
            <p className="text-[10.5px] md:text-[11px] text-[#8E9C78]/80 font-light tracking-[0.06em] mb-2 md:mb-3">
              {t.fbLabel}
            </p>
            <h2 className="text-[26px] md:text-[52px] font-light text-white tracking-[-0.025em] leading-[1.05]">
              {t.fbTitle}
            </h2>
            <p className="mt-3 md:mt-4 max-w-[440px] text-[13px] md:text-[15px] leading-[1.5] md:leading-[1.55] text-white/50 font-light">
              {t.fbDesc}
            </p>
          </div>

          <div className="flex items-center gap-3 md:gap-4 self-start md:self-end">
            {hasItems && (
              <span className="text-[11px] text-white/35 font-light tabular-nums hidden sm:block">
                {String(items.length).padStart(2, '0')} {lang === 'pt' ? 'no mural' : 'on the wall'}
              </span>
            )}
            <button
              onClick={() => { setStatus('idle'); setError(null); setOpen(true); }}
              className="group inline-flex items-center gap-2 bg-white text-black px-4 md:px-5 py-2 md:py-2.5 rounded-full text-[12.5px] md:text-[13px] font-medium hover:bg-white/90 transition-all shadow-[0_14px_40px_-10px_rgba(142,156,120,0.4)] hover:shadow-[0_18px_50px_-10px_rgba(142,156,120,0.7)]"
            >
              <span>{t.fbWrite}</span>
              <span className="text-[14px] md:text-[15px] -mt-0.5 group-hover:translate-x-0.5 transition-transform">→</span>
            </button>
          </div>
        </div>

        {/* Wall */}
        {items === null ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-3 md:gap-5">
            <FeedbackSkeleton />
          </div>
        ) : !hasItems ? (
          <div className="border border-dashed border-white/[0.08] rounded-[18px] py-14 md:py-20 text-center">
            <p className="text-[13px] md:text-[14px] text-white/40 font-light">{t.fbEmpty}</p>
          </div>
        ) : (
          <>
            <div className="columns-1 md:columns-2 lg:columns-3 gap-3 md:gap-5">
              {visibleItems.map((fb, i) => (
                <FeedbackCard key={fb.id} fb={fb} lang={lang} index={i} />
              ))}
            </div>

            {hiddenCount > 0 && !expanded && (
              <div className="mt-8 md:mt-10 flex justify-center">
                <button
                  onClick={() => setExpanded(true)}
                  className="group inline-flex items-center gap-2 text-[12.5px] md:text-[13px] text-white/55 hover:text-white border border-white/[0.08] hover:border-white/[0.18] rounded-full px-5 py-2.5 transition-colors backdrop-blur-sm"
                >
                  <span>
                    {lang === 'pt' ? `Ver mais ${hiddenCount}` : `Show ${hiddenCount} more`}
                  </span>
                  <ChevronDown size={13} className="group-hover:translate-y-0.5 transition-transform" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <FeedbackModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={submit}
        t={t}
        status={status}
        error={error}
        lang={lang}
      />

      {/* Success toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] bg-[#0c0c0c]/95 border border-[#8E9C78]/30 backdrop-blur-xl text-white text-[13px] font-light px-5 py-3 rounded-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7),0_0_30px_-10px_rgba(142,156,120,0.4)]"
          >
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8E9C78]" />
              {toast}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
