import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, Link as LinkIcon, Trash2, Sparkles, Upload, Palette } from 'lucide-react';

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
];

const SOLIDS = [
  '#1F1F1F', '#2C2C2E', '#3A3A3C', '#48484A',
  '#0A84FF', '#5E5CE6', '#BF5AF2', '#FF375F',
  '#FF9F0A', '#FFD60A', '#30D158', '#64D2FF',
  '#A1856B', '#A28C5A', '#5D6D7E', '#7F8C8D',
];

const PALETTE = [
  '#000000', '#1F1F1F', '#3A3A3C', '#6E6E73', '#A1A1AA', '#D1D1D6', '#FFFFFF',
  '#FF453A', '#FF9F0A', '#FFD60A', '#30D158', '#64D2FF', '#0A84FF', '#5E5CE6', '#BF5AF2', '#FF2D55',
  '#7F1D1D', '#9A3412', '#854D0E', '#14532D', '#0C4A6E', '#1E3A8A', '#581C87', '#831843',
  '#FCA5A5', '#FDBA74', '#FDE68A', '#86EFAC', '#7DD3FC', '#93C5FD', '#C4B5FD', '#F9A8D4',
];

function isHex(v) {
  return /^#([0-9A-F]{3}|[0-9A-F]{6}|[0-9A-F]{8})$/i.test(v);
}

export default function CoverPicker({ value, onChange, onClear, anchorRef, align = 'right', trigger }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('gallery');
  const [url, setUrl] = useState('');
  const [hex, setHex] = useState('#1F1F1F');
  const popRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (popRef.current?.contains(e.target)) return;
      if (anchorRef?.current?.contains(e.target)) return;
      setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open, anchorRef]);

  const apply = (v) => { onChange(v); setOpen(false); };

  const handleFile = (file) => {
    if (!file?.type.startsWith('image/')) return;
    const r = new FileReader();
    r.onload = (e) => {
      apply(e.target.result);
    };
    r.readAsDataURL(file);
  };

  return (
    <div className="relative">
      {trigger ? (
        <div ref={anchorRef} className="inline-block" onClick={() => setOpen(o => !o)}>
          {trigger}
        </div>
      ) : (
        <button
          ref={anchorRef}
          type="button"
          onClick={() => setOpen(o => !o)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/[0.06] rounded-[6px] transition-colors outline-none cursor-pointer"
        >
          <ImagePlus size={13} strokeWidth={1.8} />
          {value ? 'Trocar capa' : 'Adicionar capa'}
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            ref={popRef}
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className={`absolute z-50 mt-2 w-[420px] rounded-[12px] border border-white/[0.08] shadow-[0_24px_48px_rgba(0,0,0,0.5)] overflow-hidden ${align === 'right' ? 'right-0' : 'left-0'}`}
            style={{
              background: 'rgba(22, 23, 23, 0.98)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            }}
          >
            <div className="flex items-center border-b border-white/[0.06] px-1.5 pt-1.5">
              {[
                { id: 'gallery', label: 'Galeria', icon: Sparkles },
                { id: 'color',   label: 'Cor',     icon: Palette },
                { id: 'upload',  label: 'Upload',  icon: Upload },
                { id: 'url',     label: 'Link',    icon: LinkIcon },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-t-[6px] transition-colors ${tab === t.id ? 'text-[#F5F5F7] bg-white/[0.04]' : 'text-[#86868B] hover:text-[#F5F5F7]'}`}
                >
                  <t.icon size={12} /> {t.label}
                </button>
              ))}
              <div className="ml-auto" />
              {value && (
                <button
                  type="button"
                  onClick={() => { onClear?.(); setOpen(false); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 mb-1 text-[11px] font-medium text-[#FF453A] hover:bg-[#FF453A]/10 rounded-[6px] transition-colors"
                >
                  <Trash2 size={11} /> Remover
                </button>
              )}
            </div>

            <div className="p-3">
              {tab === 'gallery' && (
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#63646B] px-1 pb-1.5">Gradientes</p>
                    <div className="grid grid-cols-4 gap-2">
                      {GRADIENTS.map((g, i) => (
                        <motion.button
                          key={i}
                          onClick={() => apply(g)}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          className="h-[44px] rounded-[7px] border border-white/[0.06] cursor-pointer outline-none"
                          style={{ background: g }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#63646B] px-1 pb-1.5">Cores sólidas</p>
                    <div className="grid grid-cols-8 gap-2">
                      {SOLIDS.map((c, i) => (
                        <motion.button
                          key={i}
                          onClick={() => apply(c)}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          className="aspect-square rounded-[6px] border border-white/[0.06] cursor-pointer outline-none"
                          style={{ background: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {tab === 'color' && (
                <div className="space-y-3 py-1">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#63646B] px-1 pb-1.5">Paleta</p>
                    <div className="grid grid-cols-8 gap-1.5">
                      {PALETTE.map((c, i) => (
                        <motion.button
                          key={i}
                          onClick={() => { setHex(c); apply(c); }}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          className="aspect-square rounded-[6px] border border-white/[0.06] cursor-pointer outline-none"
                          style={{ background: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#63646B] px-1 pb-1.5">Hex</p>
                    <form
                      onSubmit={(e) => { e.preventDefault(); if (isHex(hex)) apply(hex); }}
                      className="flex items-center gap-2"
                    >
                      <label
                        className="relative shrink-0 w-9 h-9 rounded-[7px] border border-white/[0.06] overflow-hidden cursor-pointer"
                        style={{ background: isHex(hex) ? hex : '#1F1F1F' }}
                        title="Escolher cor"
                      >
                        <input
                          type="color"
                          value={isHex(hex) && hex.length === 7 ? hex : '#1f1f1f'}
                          onChange={(e) => setHex(e.target.value.toUpperCase())}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </label>
                      <input
                        value={hex}
                        onChange={(e) => {
                          let v = e.target.value.toUpperCase();
                          if (v && !v.startsWith('#')) v = '#' + v;
                          setHex(v);
                        }}
                        placeholder="#1F1F1F"
                        spellCheck={false}
                        className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-[7px] px-3 py-2 text-[13px] font-mono text-[#F5F5F7] placeholder:text-[#63646B] outline-none focus:border-white/[0.14] uppercase tracking-wider"
                      />
                      <button
                        type="submit"
                        disabled={!isHex(hex)}
                        className="px-3 py-2 text-[12px] font-semibold text-[#F5F5F7] bg-white/[0.06] hover:bg-white/[0.10] disabled:opacity-40 disabled:cursor-not-allowed border border-white/[0.06] rounded-[7px] transition-colors"
                      >
                        Aplicar
                      </button>
                    </form>
                    {hex && !isHex(hex) && (
                      <p className="text-[11px] text-[#FF453A] mt-1.5 px-1">Hex inválido. Use formato #RRGGBB.</p>
                    )}
                  </div>
                </div>
              )}
              {tab === 'upload' && (
                <div className="py-4 px-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full h-[60px] rounded-[8px] border border-dashed border-white/[0.15] bg-white/[0.02] hover:bg-white/[0.05] transition-colors flex flex-col items-center justify-center gap-1.5 text-[#A1A1AA] hover:text-[#F5F5F7] outline-none"
                  >
                    <Upload size={16} strokeWidth={1.8} />
                    <span className="text-[12px] font-medium">Fazer upload de imagem</span>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleFile(e.target.files[0])}
                  />
                </div>
              )}
              {tab === 'url' && (
                <form
                  onSubmit={(e) => { e.preventDefault(); if (url.trim()) apply(url.trim()); }}
                  className="space-y-2"
                >
                  <input
                    autoFocus
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-[8px] px-3 py-2 text-[13px] text-[#F5F5F7] placeholder:text-[#63646B] outline-none focus:border-white/[0.12] transition-colors"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 text-[12px] font-semibold text-[#F5F5F7] bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.06] rounded-[8px] transition-colors"
                  >
                    Aplicar
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CoverImage({ value, className = '' }) {
  if (!value) return null;
  const isUrl = /^(https?:|data:|\/)/i.test(value);
  return (
    <div className={className} style={isUrl ? { backgroundImage: `url(${value})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: value }} />
  );
}
