import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shuffle, Trash2, Upload } from 'lucide-react';

const CATEGORIES = {
  Recentes: [],
  Trabalho: ['📁','📂','🗂️','📊','📈','📉','📋','📝','📌','📎','🔖','💼','🗃️','🗄️','🖇️','✂️'],
  Objetos:  ['💡','⚙️','🔧','🔨','🛠️','🧰','🔬','🔭','🧪','🧫','🧬','💻','⌨️','🖥️','🖱️','💾'],
  Ideias:   ['✨','🚀','🔥','⭐','🌟','💫','⚡','🎯','🏆','🥇','🎨','🎭','🎬','🎮','🎲','🎰'],
  Pessoas:  ['👤','👥','🧑‍💻','👨‍💻','👩‍💻','🧑‍🎨','🧑‍🔬','🧑‍🚀','🧑‍🏫','🧑‍🍳','🧑‍🌾','👮','🕵️','🧙','🦸','🧑‍⚕️'],
  Natureza: ['🌱','🌲','🌳','🌴','🌵','🌷','🌸','🌹','🌺','🌻','🌼','🍀','🍁','🍂','🌍','🌎'],
  Comida:   ['🍎','🍊','🍋','🍌','🍇','🍓','🍒','🍑','🥑','🌶️','🥕','🥦','🍞','🧀','🍕','🍣'],
  Símbolos: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💯','✅','❌','⚠️','🔴','🟠','🟢','🔵'],
};

const ALL = Object.values(CATEGORIES).flat();

const RECENT_KEY = 'db.emoji.recent';
function loadRecent() {
  try { 
    const data = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); 
    const valid = data.filter(e => typeof e === 'string' && e.length < 20 && !e.startsWith('data:'));
    if (valid.length !== data.length) localStorage.setItem(RECENT_KEY, JSON.stringify(valid));
    return valid;
  } catch { return []; }
}
function pushRecent(e) {
  const next = [e, ...loadRecent().filter(x => x !== e)].slice(0, 16);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}

export default function EmojiPicker({ value, onChange, onClear, anchorRef, trigger }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState(loadRecent());
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

  const pick = (e) => {
    if (typeof e === 'string' && !e.startsWith('data:') && !e.startsWith('http')) {
      setRecent(pushRecent(e));
    }
    onChange(e);
    setOpen(false);
  };

  const filtered = q.trim()
    ? ALL.filter(e => e.codePointAt(0).toString(16).includes(q.toLowerCase()))
    : null;

  return (
    <div className="relative inline-block">
      {trigger ? (
        <div ref={anchorRef} className="inline-block" onClick={() => setOpen(o => !o)}>
          {trigger}
        </div>
      ) : (
        <motion.button
          ref={anchorRef}
          type="button"
          onClick={() => setOpen(o => !o)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className={`leading-none select-none cursor-pointer hover:bg-white/[0.04] transition-colors outline-none flex items-center justify-center shrink-0 ${
            (value?.startsWith('http') || value?.startsWith('data:image/'))
              ? 'w-[124px] h-[124px] p-0 rounded-[4px] bg-[#191919] overflow-hidden'
              : 'text-[124px] rounded-[4px] p-1'
          }`}
          aria-label="Trocar ícone"
        >
          {(value?.startsWith('http') || value?.startsWith('data:image/')) ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            value || '📁'
          )}
        </motion.button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            ref={popRef}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="absolute z-50 mt-2 w-[340px] rounded-[12px] border border-white/[0.08] shadow-[0_24px_48px_rgba(0,0,0,0.5)] overflow-hidden"
            style={{
              background: 'rgba(22, 23, 23, 0.98)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            }}
          >
            <div className="p-2 border-b border-white/[0.06] flex items-center gap-2">
              <Search size={13} className="text-[#86868B] ml-1.5" />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Filtrar emojis..."
                className="flex-1 bg-transparent text-[13px] text-[#F5F5F7] placeholder:text-[#63646B] outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => pick(ALL[Math.floor(Math.random() * ALL.length)])}
                className="p-1.5 text-[#86868B] hover:text-[#F5F5F7] hover:bg-white/[0.04] rounded-[6px] transition-colors"
                title="Aleatório"
              >
                <Shuffle size={13} />
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="p-1.5 text-[#86868B] hover:text-[#F5F5F7] hover:bg-white/[0.04] rounded-[6px] transition-colors"
                title="Upload"
              >
                <Upload size={13} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
                if (e.target.files[0]) {
                  const r = new FileReader();
                  r.onload = ev => pick(ev.target.result);
                  r.readAsDataURL(e.target.files[0]);
                }
              }} />
              {value && (
                <button
                  type="button"
                  onClick={() => { onClear?.(); setOpen(false); }}
                  className="p-1.5 text-[#86868B] hover:text-[#FF453A] hover:bg-[#FF453A]/10 rounded-[6px] transition-colors"
                  title="Remover"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-2">
              {filtered ? (
                <div className="grid grid-cols-8 gap-0.5">
                  {filtered.map((e, i) => (
                    <button key={i} onClick={() => pick(e)}
                      className="text-[20px] hover:bg-white/[0.06] rounded-[6px] p-1.5 transition-colors leading-none">
                      {e}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  {recent.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#63646B] px-1.5 pb-1">Recentes</p>
                      <div className="grid grid-cols-8 gap-0.5">
                        {recent.map((e, i) => (
                          <button key={i} onClick={() => pick(e)}
                            className="text-[20px] hover:bg-white/[0.06] rounded-[6px] p-1.5 transition-colors leading-none">
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {Object.entries(CATEGORIES).filter(([k]) => k !== 'Recentes').map(([cat, list]) => (
                    <div key={cat} className="mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#63646B] px-1.5 pb-1">{cat}</p>
                      <div className="grid grid-cols-8 gap-0.5">
                        {list.map((e, i) => (
                          <button key={i} onClick={() => pick(e)}
                            className="text-[20px] hover:bg-white/[0.06] rounded-[6px] p-1.5 transition-colors leading-none">
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
