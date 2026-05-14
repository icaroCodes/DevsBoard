import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Copy, Check } from 'lucide-react';

const PIX_KEY = '00020101021126580014br.gov.bcb.pix01361ff28fc3-607f-4108-a270-e83e86b185dc5204000053039865802BR5918ROBSON I B MACHADO6009FORTALEZA62070503***63046757';

function getBrasiliaGreeting() {
  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: 'numeric',
      hour12: false,
    }).format(now)
  );
  if (hour >= 6 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  if (hour >= 18) return 'Boa noite';
  return 'Boa madrugada';
}

export default function Support() {
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState('pt');
  const [greeting] = useState(() => getBrasiliaGreeting());

  useEffect(() => {
    const saved = (typeof window !== 'undefined' && localStorage.getItem('devsboard_lang')) || 'pt';
    setLang(saved === 'en' ? 'en' : 'pt');
  }, []);

  const t = lang === 'en'
    ? {
        back: 'Back',
        title: 'Buy me a coffee.',
        lede: 'DevsBoard is a personal project. No ads, no paywall, no investors — just one developer building in late nights.',
        lede2: 'If it helps you, a coffee keeps it going.',
        qrLabel: 'Scan to pay',
        copyLabel: 'Or paste this code in your bank app',
        copyBtn: 'Copy code',
        copiedBtn: 'Copied',
        recipientLabel: 'Recipient',
        recipient: 'Robson Machado',
        recipientNote: 'My brother — the account holder I send this through.',
        madeBy: 'Built by',
        creator: 'Ícaro Machado',
      }
    : {
        back: 'Voltar',
        title: 'Pague um café.',
        lede: 'O DevsBoard é um projeto pessoal. Sem anúncios, sem paywall, sem investidor — apenas um dev construindo nas madrugadas.',
        lede2: 'Se ele te ajuda, um café mantém ele de pé.',
        qrLabel: 'Aponte a câmera para pagar',
        copyLabel: 'Ou cole este código no app do seu banco',
        copyBtn: 'Copiar código',
        copiedBtn: 'Copiado',
        recipientLabel: 'Recebido por',
        recipient: 'Robson Machado',
        recipientNote: 'Meu irmão — a conta pela qual recebo.',
        madeBy: 'Feito por',
        creator: 'Ícaro Machado',
      };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = PIX_KEY;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Stagger reveal
  const fade = {
    hidden: { opacity: 0, y: 12 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      {/* Back link */}
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-[1100px] mx-auto px-6 md:px-10 pt-8">
          <Link
            to="/"
            className="group inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/80 transition-colors"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>{t.back}</span>
          </Link>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 md:px-10 pt-32 md:pt-40 pb-24">
        {/* Hero — single confident line */}
        <motion.div initial="hidden" animate="visible" className="text-center">
          {lang === 'pt' && (
            <motion.p
              variants={fade}
              custom={0}
              className="mb-4 text-[14px] md:text-[15px] text-white/40 font-light tracking-wide"
            >
              {greeting}, Ícaro Machado.
            </motion.p>
          )}
          <motion.h1
            variants={fade}
            custom={lang === 'pt' ? 1 : 0}
            className="text-[42px] sm:text-[56px] md:text-[72px] font-light text-white tracking-[-0.025em] leading-[1.05]"
          >
            {t.title}
          </motion.h1>

          <motion.p
            variants={fade}
            custom={lang === 'pt' ? 2 : 1}
            className="mt-6 md:mt-7 mx-auto max-w-[480px] text-[15px] md:text-[16px] leading-[1.55] text-white/55 font-light"
          >
            {t.lede}
          </motion.p>
          <motion.p
            variants={fade}
            custom={lang === 'pt' ? 3 : 2}
            className="mt-2 mx-auto max-w-[480px] text-[15px] md:text-[16px] leading-[1.55] text-white/85 font-light"
          >
            {t.lede2}
          </motion.p>
        </motion.div>

        {/* QR — clean centered, sage spotlight behind */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fade}
          custom={3}
          className="relative mt-16 md:mt-24 flex flex-col items-center"
        >
          {/* Spotlight glow — same language as hero */}
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] md:w-[820px] h-[560px] md:h-[820px] bg-[radial-gradient(circle,_rgba(142,156,120,0.18)_0%,_rgba(142,156,120,0.05)_35%,_transparent_65%)] rounded-full pointer-events-none blur-[50px]"
          />
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[380px] h-[300px] md:h-[380px] bg-[radial-gradient(circle,_rgba(142,156,120,0.22)_0%,_transparent_70%)] rounded-full pointer-events-none blur-[28px]"
          />

          <div className="relative bg-white rounded-[22px] p-5 md:p-6 shadow-[0_30px_80px_-20px_rgba(142,156,120,0.45),0_10px_30px_-10px_rgba(0,0,0,0.5)]">
            <img
              src="/pix.png"
              alt="QR code PIX"
              className="block w-[220px] h-[220px] md:w-[260px] md:h-[260px] object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          <p className="relative mt-7 text-[13px] text-white/45 font-light">{t.qrLabel}</p>
        </motion.div>

        {/* Copy key — quiet, single row */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fade}
          custom={4}
          className="mt-16 md:mt-20 mx-auto max-w-[640px]"
        >
          <p className="text-center text-[13px] text-white/40 font-light mb-4">
            {t.copyLabel}
          </p>

          <div className="group relative">
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.07] rounded-[14px] p-1.5 pl-4 transition-colors hover:border-white/[0.12]">
              <code
                className="flex-1 truncate text-[12.5px] md:text-[13px] text-white/55 font-mono select-all"
                style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace" }}
              >
                {PIX_KEY}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 inline-flex items-center gap-1.5 bg-white text-black px-4 py-2.5 rounded-[10px] text-[13px] font-medium hover:bg-white/90 active:scale-[0.98] transition-all"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {copied ? (
                    <motion.span
                      key="ok"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className="inline-flex items-center gap-1.5"
                    >
                      <Check size={14} strokeWidth={2.5} />
                      <span>{t.copiedBtn}</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className="inline-flex items-center gap-1.5"
                    >
                      <Copy size={13.5} />
                      <span>{t.copyBtn}</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Recipient + author — quiet meta block */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fade}
          custom={5}
          className="mt-20 md:mt-24 mx-auto max-w-[640px]"
        >
          <div className="h-px w-full bg-white/[0.06]" />

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
            <div>
              <p className="text-[12px] text-white/35 font-light mb-1.5">{t.recipientLabel}</p>
              <p className="text-[15px] text-white/90 font-normal">{t.recipient}</p>
              <p className="mt-1.5 text-[12.5px] text-white/40 leading-[1.5] font-light">
                {t.recipientNote}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-[12px] text-white/35 font-light mb-1.5">{t.madeBy}</p>
              <p className="text-[15px] text-white/90 font-normal">{t.creator}</p>
              <p className="mt-1.5 text-[12.5px] text-white/40 font-light">DevsBoard</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
