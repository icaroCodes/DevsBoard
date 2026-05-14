import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, X } from 'lucide-react';

/**
 * Floating ask-anything widget — four reveal phases, each with its own
 * minimalist framer-motion animation:
 *
 *   1. Hidden          — page top, nothing on screen
 *   2. Pill            — user scrolls down a bit, the input slides up
 *   3. Suggestions     — user clicks the input, chips fade up above
 *   4. Chat            — user picks a chip, the conversation card lifts in
 *
 * Closing reverses each layer with the same easing curve so it never
 * feels stuck.
 */
export default function AskAnything({ t, lang = 'pt' }) {
  const allQuestions = useMemo(
    () => [
      { q: t.faq1Q, a: t.faq1A },
      { q: t.faq2Q, a: t.faq2A },
      { q: t.faq3Q, a: t.faq3A },
      { q: t.faq4Q, a: t.faq4A },
      { q: t.faq5Q, a: t.faq5A },
      { q: t.faq6Q, a: t.faq6A },
      { q: t.faq7Q, a: t.faq7A },
    ],
    [t]
  );

  const placeholder = lang === 'pt' ? 'Pergunte qualquer coisa…' : 'Ask me anything…';
  const welcomeText = lang === 'pt' ? 'Olá. Sou o atendente do DevsBoard.' : 'Welcome back.';
  const roleText = lang === 'pt' ? 'Atendente · Q&A' : 'Q&A assistant';
  const suggestionsLabel = lang === 'pt' ? 'Sugestões' : 'Suggestions';
  const cannedReply = lang === 'pt'
    ? 'Eu só respondo perguntas prontas. Toque numa das sugestões acima.'
    : 'I only answer pre-written questions. Tap one of the suggestions above.';

  const [pillVisible, setPillVisible] = useState(false);
  const [chipsOpen, setChipsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [asked, setAsked] = useState(() => new Set());
  const [inputValue, setInputValue] = useState('');

  const containerRef = useRef(null);
  const threadRef = useRef(null);
  const inputRef = useRef(null);

  const available = useMemo(
    () => allQuestions.filter((q) => !asked.has(q.q)),
    [allQuestions, asked]
  );

  // Phase 1 → 2: scroll past a small threshold reveals the pill.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 220) setPillVisible(true);
      else if (y < 60 && !chatOpen && !chipsOpen) setPillVisible(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [chatOpen, chipsOpen]);

  // Click outside collapses chips (but not while the chat sits over it).
  useEffect(() => {
    if (!chipsOpen || chatOpen) return;
    const onDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setChipsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [chipsOpen, chatOpen]);

  // ESC peels the top layer off, one at a time.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (chatOpen) setChatOpen(false);
      else if (chipsOpen) {
        setChipsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chatOpen, chipsOpen]);

  // Welcome line on first chat open.
  useEffect(() => {
    if (chatOpen && messages.length === 0) {
      const id = setTimeout(() => {
        setMessages([{ role: 'assistant', text: welcomeText, id: 'welcome' }]);
      }, 280);
      return () => clearTimeout(id);
    }
  }, [chatOpen, messages.length, welcomeText]);

  // Pin thread to its latest entry.
  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleAsk = async (item) => {
    if (loading || asked.has(item.q)) return;
    if (!chatOpen) setChatOpen(true);
    setAsked((prev) => {
      const next = new Set(prev);
      next.add(item.q);
      return next;
    });
    const stamp = Date.now();
    await new Promise((r) => setTimeout(r, 120));
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: item.q, id: `u-${stamp}` },
    ]);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 950 + Math.random() * 550));
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', text: item.a, id: `a-${stamp}` },
    ]);
    setLoading(false);
  };

  const handleSubmit = async () => {
    const text = inputValue.trim();
    if (!text || loading) return;
    if (!chatOpen) setChatOpen(true);
    setInputValue('');
    const stamp = Date.now();
    await new Promise((r) => setTimeout(r, 120));
    setMessages((prev) => [
      ...prev,
      { role: 'user', text, id: `u-${stamp}` },
    ]);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 850 + Math.random() * 450));
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', text: cannedReply, id: `a-${stamp}` },
    ]);
    setLoading(false);
  };

  const ease = [0.22, 1, 0.36, 1];

  return (
    <>
      {/* Invisible click-catcher — closes the chat when the user
          clicks outside the widget. No visual blur/dim. */}
      {chatOpen && (
        <div
          aria-hidden
          onClick={() => setChatOpen(false)}
          className="fixed inset-0 z-[130]"
        />
      )}

      {/* Stacked layers — chat on top, chips middle, pill bottom */}
      <div
        ref={containerRef}
        className="fixed left-1/2 -translate-x-1/2 bottom-3 sm:bottom-5 w-[calc(100vw-20px)] max-w-[720px] z-[140] pointer-events-none flex flex-col items-stretch gap-2.5"
      >
        {/* PHASE 4 — Chat */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 26, scale: 0.96 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.5, ease },
              }}
              exit={{
                opacity: 0,
                y: 22,
                scale: 0.97,
                transition: { duration: 0.32, ease },
              }}
              className="pointer-events-auto bg-[rgba(14,14,14,0.92)] backdrop-blur-2xl border border-white/[0.07] rounded-[26px] shadow-[0_28px_80px_-22px_rgba(0,0,0,0.7),0_8px_24px_-8px_rgba(142,156,120,0.18)] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-white/[0.05] bg-gradient-to-b from-white/[0.025] to-transparent">
                <div className="relative w-11 h-11 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#a4b291] to-[#5a6849] shrink-0 shadow-[0_6px_18px_-4px_rgba(142,156,120,0.55)]">
                  <img src="/devsboard.png" alt="" className="w-[26px] h-[26px] object-contain" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#8E9C78] border-[2px] border-[#0e0e0e]" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-[15px] sm:text-[16px] font-medium text-white leading-tight tracking-[-0.01em]">
                    DevsBoard
                  </p>
                  <p className="text-[12.5px] sm:text-[13px] text-white/45 font-light mt-0.5">
                    {roleText}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setChatOpen(false)}
                  aria-label="Close"
                  className="shrink-0 w-8 h-8 -mr-1 flex items-center justify-center rounded-full hover:bg-white/[0.06] transition-colors"
                >
                  <X size={17} className="text-white/55" strokeWidth={1.8} />
                </motion.button>
              </div>

              {/* Thread */}
              <div
                ref={threadRef}
                className="px-5 sm:px-6 py-5 max-h-[min(52vh,400px)] min-h-[200px] overflow-y-auto flex flex-col gap-2.5 ask-thread"
              >
                <AnimatePresence initial={false}>
                  {messages.map((m) => (
                    <motion.div
                      key={m.id}
                      layout
                      initial={{ opacity: 0, y: 10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4, ease }}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={
                          m.role === 'user'
                            ? 'max-w-[80%] px-4 py-2.5 rounded-[20px] rounded-br-[6px] text-[13.5px] sm:text-[14px] leading-[1.45] bg-[#8E9C78] text-black shadow-[0_8px_24px_-10px_rgba(142,156,120,0.55)]'
                            : 'max-w-[82%] px-4 py-2.5 rounded-[20px] rounded-bl-[6px] text-[13.5px] sm:text-[14px] leading-[1.55] font-light bg-white/[0.05] text-white/85 border border-white/[0.04]'
                        }
                      >
                        {m.text}
                      </div>
                    </motion.div>
                  ))}

                  {loading && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.22 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white/[0.05] border border-white/[0.04] rounded-[20px] rounded-bl-[6px] px-4 py-3 flex items-center gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-white/60"
                            animate={{
                              y: [0, -3, 0],
                              opacity: [0.4, 1, 0.4],
                            }}
                            transition={{
                              duration: 1.05,
                              repeat: Infinity,
                              delay: i * 0.16,
                              ease: 'easeInOut',
                            }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PHASE 3 — Suggestion chips */}
        <AnimatePresence>
          {chipsOpen && available.length > 0 && (
            <motion.div
              key="chips"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease } }}
              exit={{ opacity: 0, y: 12, transition: { duration: 0.24, ease } }}
              className="pointer-events-auto"
            >
              {chatOpen && (
                <p className="text-[10.5px] text-white/35 tracking-[0.16em] uppercase mb-2 px-1 font-light">
                  {suggestionsLabel}
                </p>
              )}
              <div
                className="flex gap-2 overflow-x-auto pb-1 ask-chips"
                style={{
                  maskImage:
                    'linear-gradient(to right, transparent 0, black 14px, black calc(100% - 22px), transparent 100%)',
                  WebkitMaskImage:
                    'linear-gradient(to right, transparent 0, black 14px, black calc(100% - 22px), transparent 100%)',
                }}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {available.map((item, i) => (
                    <motion.button
                      key={item.q}
                      layout
                      initial={{ opacity: 0, y: 10, scale: 0.94 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: { duration: 0.38, delay: i * 0.045, ease },
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.86,
                        transition: { duration: 0.18, ease },
                      }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleAsk(item)}
                      disabled={loading}
                      className="shrink-0 px-3.5 py-2 rounded-full bg-[#141414]/90 backdrop-blur-md border border-white/[0.08] hover:border-white/[0.18] hover:bg-white/[0.06] text-[13px] text-white/70 hover:text-white whitespace-nowrap font-light shadow-[0_6px_18px_-8px_rgba(0,0,0,0.6)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {item.q}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PHASE 2 — Floating input pill */}
        <AnimatePresence>
          {pillVisible && (
            <motion.form
              key="pill"
              initial={{ opacity: 0, y: 90 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  type: 'spring',
                  stiffness: 280,
                  damping: 30,
                  mass: 0.9,
                },
              }}
              exit={{
                opacity: 0,
                y: 60,
                transition: { duration: 0.32, ease },
              }}
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="pointer-events-auto flex items-center gap-2 bg-[rgba(14,14,14,0.92)] backdrop-blur-2xl border border-white/[0.08] rounded-full pl-5 pr-1.5 py-1.5 shadow-[0_18px_48px_-12px_rgba(0,0,0,0.7),0_4px_14px_-4px_rgba(142,156,120,0.12)] transition-colors focus-within:border-[#8E9C78]/40"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setChipsOpen(true)}
                onClick={() => setChipsOpen(true)}
                placeholder={placeholder}
                aria-label={placeholder}
                className="flex-1 bg-transparent text-[14px] sm:text-[14.5px] text-white/90 placeholder:text-white/35 placeholder:font-light font-light py-1.5 outline-none border-none caret-[#8E9C78]"
              />
              <motion.button
                type="submit"
                disabled={loading || !inputValue.trim()}
                whileTap={{ scale: 0.92 }}
                animate={{
                  backgroundColor: inputValue.trim() ? '#8E9C78' : 'rgba(255,255,255,0.10)',
                  opacity: loading ? 0.5 : 1,
                }}
                transition={{ duration: 0.22 }}
                className="w-9 h-9 rounded-full flex items-center justify-center disabled:cursor-not-allowed"
                aria-label="Send"
              >
                <ArrowUp
                  size={15}
                  className={inputValue.trim() ? 'text-black' : 'text-white/55'}
                  strokeWidth={2.6}
                />
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .ask-thread::-webkit-scrollbar { width: 4px; }
        .ask-thread::-webkit-scrollbar-track { background: transparent; }
        .ask-thread::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 999px; }
        .ask-chips::-webkit-scrollbar { display: none; }
        .ask-chips { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>
    </>
  );
}
