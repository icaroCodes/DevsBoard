import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet, CheckSquare2, RotateCw, Target, FolderKanban, Code2,
  Star, CheckCircle2, Menu, X, ArrowRight, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence, useSpring, useInView } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Função auxiliar para navegação suave âncora usando GSAP ScrollToPlugin
const scrollToSection = (e, targetId) => {
  e.preventDefault();
  gsap.to(window, {
    duration: 1.2,
    scrollTo: { y: targetId, autoKill: false },
    ease: 'power3.inOut'
  });
};

// ─── Navbar ──────────────────────────────────────────────────────────────────
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className="fixed top-10 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none transition-all duration-300">
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className={`pointer-events-auto flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500
            ${isScrolled
              ? 'bg-[#0e3b44]/80 backdrop-blur-2xl text-white shadow-2xl border border-white/10 w-full max-w-xl'
              : 'bg-white/60 backdrop-blur-xl text-[#0e3b44] border border-[#0e3b44]/5 w-full max-w-5xl'}`}
        >
          <div className="flex items-center gap-2 font-semibold text-lg tracking-tight group cursor-pointer">
            <img
              src="/devsboard.png"
              alt="DevsBoard Logo"
              className={`w-8 h-8 object-contain transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-[-5deg]
                ${isScrolled ? 'brightness-0 invert' : ''}`}
              style={{ filter: isScrolled ? 'drop-shadow(0 2px 4px rgba(255,255,255,0.2))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
            />
            <span className={`hidden sm:inline transition-colors duration-500 ${isScrolled ? 'text-white' : 'text-[#0e3b44]'}`}>
              DevsBoard
            </span>
          </div>

          <div className={`hidden md:flex items-center gap-6 text-[13px] font-medium transition-colors duration-500 ${isScrolled ? 'text-white/80' : 'text-[#0e3b44]/80'}`}>
            <a href="#recursos" onClick={(e) => scrollToSection(e, '#recursos')} className="hover:text-[#485c10] transition-colors">Recursos</a>
            <a href="#beneficios" onClick={(e) => scrollToSection(e, '#beneficios')} className="hover:text-[#485c10] transition-colors">Benefícios</a>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all duration-500
                ${isScrolled ? 'bg-[#485c10] text-white hover:bg-[#3d4a0c]' : 'bg-[#0e3b44] text-white hover:bg-[#092a31]'}`}
              onClick={() => window.location.href = '/auth'}
            >
              Começar
            </motion.button>
            <button className="md:hidden ml-2" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={20} className={isScrolled ? 'text-white' : 'text-[#0e3b44]'} />
            </button>
          </div>
        </motion.nav>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, clipPath: 'circle(0% at 100% 0%)' }}
            animate={{ opacity: 1, clipPath: 'circle(150% at 100% 0%)' }}
            exit={{ opacity: 0, clipPath: 'circle(0% at 100% 0%)' }}
            transition={{ type: 'spring', damping: 30, stiffness: 100 }}
            className="fixed inset-0 z-[60] bg-[#f5f5dc] flex flex-col p-8 pt-24"
          >
            <div className="flex justify-between items-center mb-12">
              <span className="text-2xl font-bold text-[#0e3b44]">DevsBoard</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-3 bg-[#0e3b44]/5 rounded-full hover:bg-[#0e3b44]/10 transition-colors">
                <X size={24} className="text-[#0e3b44]" />
              </button>
            </div>
            <nav className="flex flex-col gap-6">
              {[
                { name: 'Recursos', id: '#recursos' },
                { name: 'Benefícios', id: '#beneficios' }
              ].map((item) => (
                <a key={item.name} href={item.id} onClick={(e) => {
                  setMobileMenuOpen(false);
                  scrollToSection(e, item.id);
                }}
                  className="text-4xl font-bold text-[#0e3b44] hover:text-[#485c10] transition-colors tracking-tight">
                  {item.name}
                </a>
              ))}
            </nav>
            <div className="mt-auto">
              <button onClick={() => window.location.href = '/auth'} className="w-full py-5 bg-[#0e3b44] text-white rounded-[24px] font-bold text-lg">
                Criar Conta Gratuita
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Counter (Framer Motion) ──────────────────────────────────────────────────
const Counter = ({ from = 0, to, suffix = '', label }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const springValue = useSpring(from, { stiffness: 40, damping: 15, mass: 1 });
  const [displayValue, setDisplayValue] = useState(from);

  useEffect(() => { if (inView) springValue.set(to); }, [inView, to, springValue]);
  useEffect(() => springValue.on('change', (v) => setDisplayValue(Math.floor(v))), [springValue]);

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className="flex flex-col items-center justify-center p-6 bg-white/40 backdrop-blur-md border border-[#0e3b44]/5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-w-[140px]"
    >
      <div className="flex items-baseline leading-none mb-2">
        <span
          ref={ref}
          className="text-[3.5rem] md:text-[4.5rem] font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#0e3b44] to-[#1c5c68] tabular-nums tracking-tighter drop-shadow-sm"
        >
          {displayValue}
        </span>
        {suffix && (
          <span className="text-xl md:text-3xl text-[#485c10] font-bold ml-1 tracking-tighter">
            {suffix}
          </span>
        )}
      </div>
      <div className="h-px w-8 bg-[#485c10]/20 mb-3 rounded-full" />
      <span className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-[0.2em]">
        {label}
      </span>
    </motion.div>
  );
};

// ─── Apple-Style Horizontal Scroll (GSAP + ScrollTrigger) ────────────────────
const features = [
  {
    icon: Wallet,
    title: 'Finanças',
    num: '01',
    desc: 'Gerencie receitas, despesas e visualize seu fluxo de caixa em tempo real.',
    bg: '#0e3b44',
    accent: '#8e9c78',
    tag: 'Gestão financeira',
  },
  {
    icon: CheckSquare2,
    title: 'Tarefas',
    num: '02',
    desc: 'Organize tudo com prioridades claras, status e prazos definidos. Em KanBan',
    bg: '#1a1a2e',
    accent: '#b47045',
    tag: 'Produtividade',
  },
  {
    icon: RotateCw,
    title: 'Hábitos',
    num: '03',
    desc: 'Construa consistência diária com rastreamento de hábitos e rotinas.',
    bg: '#2d1b00',
    accent: '#c9863e',
    tag: 'Rotinas & Disciplina',
  },
  {
    icon: Target,
    title: 'Metas',
    num: '04',
    desc: 'Defina metas e acompanhe cada segundo do seu progresso.',
    bg: '#0d1f12',
    accent: '#6a8226',
    tag: 'Objetivos',
  },
  {
    icon: FolderKanban,
    title: 'Projetos',
    num: '05',
    desc: 'Kanban visual, e sprints para execução de projetos reais.',
    bg: '#1c1035',
    accent: '#9b7fcb',
    tag: 'Gestão de projetos',
  },
  {
    icon: Code2,
    title: 'Open Source',
    num: '06',
    desc: 'Código aberto. Contribua, fork, reporte issues e evolua junto.',
    bg: '#0f0f0f',
    accent: '#4ade80',
    tag: 'Comunidade',
  },
];

const HorizontalScrollSection = () => {
  const containerRef = useRef(null); // container natural, sem altura forçada
  const stickyRef = useRef(null); // pinned wrapper (100vh)
  const trackRef = useRef(null); // faixa com as telas horizontais
  const progressRef = useRef(null); // barra de progresso no topo

  const panelRefs = useRef([]);
  const numRefs = useRef([]);
  const tagRefs = useRef([]);
  const titleRefs = useRef([]);
  const descRefs = useRef([]);
  const iconRefs = useRef([]);
  const lineRefs = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    const sticky = stickyRef.current;
    const track = trackRef.current;
    const bar = progressRef.current;
    if (!container || !sticky || !track) return;

    // Distância total do deslize (scrollWidth menos viewport width original)
    const getAmount = () => -(track.scrollWidth - window.innerWidth);

    // ── O Scroll horizontal central ──────────────────────────────────────────
    const hTween = gsap.to(track, {
      x: getAmount,
      ease: 'none',
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: () => `+=${Math.abs(getAmount())}`, // GSAP vai injetar um pin-spacer idêntico a este valor pro "scrollar"
        pin: sticky,
        anticipatePin: 1,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate(self) {
          if (bar) bar.style.transform = `scaleX(${self.progress})`;
        },
      },
    });

    // ── Animações internas dos paineis de Reveal vinculadas ao ScrollVertical 
    panelRefs.current.forEach((panel, i) => {
      if (!panel) return;

      const total = features.length;
      // Define os pontos de entrada em pixels de cada "slide" na barra do scroll vertical
      const startPx = () => (i / total) * Math.abs(getAmount());
      const endPx = () => startPx() + window.innerWidth * 0.6;

      const els = [
        numRefs.current[i],
        tagRefs.current[i],
        titleRefs.current[i],
        descRefs.current[i],
        iconRefs.current[i],
      ].filter(Boolean);

      // Sobe os elementos suavemente quando chegar na área do seu painel
      gsap.fromTo(
        els,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.06,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: container,
            start: () => `top+=${startPx()} top`,
            end: () => `top+=${endPx()} top`,
            scrub: 1.2,
            invalidateOnRefresh: true,
          },
        }
      );

      // Faz a linha de cor crescer da esquerda pra direita
      if (lineRefs.current[i]) {
        gsap.fromTo(
          lineRefs.current[i],
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'power2.out',
            transformOrigin: 'left center',
            scrollTrigger: {
              trigger: container,
              start: () => `top+=${startPx()} top`,
              end: () => `top+=${endPx()} top`,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          }
        );
      }
    });

    return () => {
      hTween.scrollTrigger?.kill();
      ScrollTrigger.getAll().forEach(t => {
        if (t.trigger === container) t.kill();
      });
    };
  }, []);

  return (
    <section id="recursos" className="relative">
      {/* ── Cabeçalho dos Recursos (ele não fica colado, scrolla natural viaja até o topo e some) ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-16 pt-28 pb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <motion.span
            initial={{ x: -30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="block text-[#485c10] font-bold tracking-widest text-[11px] uppercase mb-3"
          >
            Recursos
          </motion.span>
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-[#0e3b44] tracking-tight leading-[1.05]"
          >
            Tudo que você<br />precisa.
          </motion.h2>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-sm text-slate-400 font-medium hidden md:block"
        >
          Role a página para explorar →
        </motion.p>
      </div>

      {/* ── Barra de progresso visível acima da área "presa" ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-16 mb-2">
        <div className="h-[2px] bg-[#0e3b44]/8 rounded-full overflow-hidden">
          <div
            ref={progressRef}
            className="h-full w-full bg-gradient-to-r from-[#485c10] via-[#8e9c78] to-[#b47045] origin-left"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      </div>

      {/* ── Container natural para o scrollTrigger. (SEM height manual!) ── */}
      <div ref={containerRef} className="relative w-full">

        {/* ── Sticky wrapper: este cara é colado (pinned) na tela pela GSAP ── */}
        <div
          ref={stickyRef}
          className="w-full overflow-hidden"
          style={{ height: '100vh' }}
        >
          {/* ── Pista horizontal. Vai deslizar seu X negativo equivalente a todas as telas. ── */}
          <div
            ref={trackRef}
            className="flex h-full will-change-transform"
            style={{ width: `${features.length * 100}vw` }} // 600vw default!
          >
            {features.map((feat, i) => (
              <div
                key={i}
                ref={el => panelRefs.current[i] = el}
                className="relative flex-shrink-0 w-screen h-full flex items-center justify-center overflow-hidden"
                style={{ background: feat.bg }}
              >
                {/* ── Clarão do fundo (Glow Ambient) ── */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse 70% 60% at 60% 50%, ${feat.accent}18 0%, transparent 70%)`,
                  }}
                />

                {/* ── Ícone imenso de fundo ── */}
                <div
                  ref={el => iconRefs.current[i] = el}
                  className="absolute right-[8%] bottom-[8%] opacity-[0.04]"
                  style={{ color: feat.accent }}
                >
                  <feat.icon size={320} strokeWidth={0.6} />
                </div>

                {/* ── Conteúdo Central do Cartão ── */}
                <div className="relative z-10 max-w-2xl px-10 md:px-20 select-none">
                  {/* Numeração de Paginação */}
                  <span
                    ref={el => numRefs.current[i] = el}
                    className="block font-mono text-[11px] font-bold tracking-[0.3em] uppercase mb-6"
                    style={{ color: `${feat.accent}80` }}
                  >
                    {feat.num} / 0{features.length}
                  </span>

                  {/* Pílula / Categoria */}
                  <span
                    ref={el => tagRefs.current[i] = el}
                    className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-8 border"
                    style={{ color: feat.accent, borderColor: `${feat.accent}30`, background: `${feat.accent}10` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: feat.accent }} />
                    {feat.tag}
                  </span>

                  {/* Linha de Charme (Cresce de width: 0->100) */}
                  <div
                    ref={el => lineRefs.current[i] = el}
                    className="h-px w-16 mb-8 origin-left"
                    style={{ background: feat.accent }}
                  />

                  {/* Título Grandioso */}
                  <h3
                    ref={el => titleRefs.current[i] = el}
                    className="text-[3.5rem] md:text-[5.5rem] font-black leading-none tracking-tighter text-white mb-6"
                  >
                    {feat.title}
                  </h3>

                  {/* Descrição em Cinza */}
                  <p
                    ref={el => descRefs.current[i] = el}
                    className="text-base md:text-lg leading-relaxed max-w-md font-medium"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {feat.desc}
                  </p>
                </div>

                {/* ── Indicadores de bolinha na base ── */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                  {features.map((_, dotI) => (
                    <div
                      key={dotI}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: dotI === i ? '20px' : '6px',
                        height: '6px',
                        background: dotI === i ? feat.accent : `${feat.accent}30`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Differentiators ─────────────────────────────────────────────────────────
const differentiators = [
  { title: 'Tudo em um só lugar', description: 'Centralize tarefas, finanças, metas e projetos em uma única plataforma integrada, eliminando ferramentas dispersas e garantindo total controle da sua rotina.' },
  { title: 'Foco para Devs', description: 'Interface pensada para desenvolvedores: objetiva, minimalista e orientada à produtividade, reduzindo distrações e priorizando performance e clareza.' },
  { title: 'Organização em KanBan', description: 'Gerencie fluxos de trabalho com visualização Kanban intuitiva, permitindo acompanhamento preciso de tarefas, prioridades e entregas em tempo real.' },
  { title: 'Projetos organizados', description: 'Estruture projetos com organização lógica, divisão por etapas e acompanhamento estratégico, facilitando execução consistente e evolução contínua.' },
];

const Differentiators = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const toggleIndex = (i) => setExpandedIndex(expandedIndex === i ? null : i);

  return (
    <section id="beneficios" className="py-24 bg-[#0e3b44] text-[#f5f5dc] overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-start justify-between gap-12">
        <div className="md:w-1/3">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-6"
          >
            Por que escolher <br />
            <span className="text-[#b47045]">DevsBoard?</span>
          </motion.h2>
        </div>

        <div className="md:w-1/2 flex flex-col space-y-4">
          {differentiators.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              className="border-b border-[#f5f5dc]/10 pb-6 group cursor-pointer"
              onClick={() => toggleIndex(index)}
            >
              <div className="flex items-center justify-between space-x-6">
                <div className="flex items-center space-x-6">
                  <CheckCircle2 className="text-[#b47045] w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="text-xl md:text-3xl font-light tracking-wide">{item.title}</span>
                </div>
                <motion.div animate={{ rotate: expandedIndex === index ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <ChevronDown className="text-[#b47045]/50 w-5 h-5" />
                </motion.div>
              </div>

              <AnimatePresence>
                {expandedIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <p className="text-[#f5f5dc]/60 text-sm md:text-base leading-relaxed pl-12 max-w-md">
                      {item.description}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => {
    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  return (
    <div className="w-full bg-[#f5f5dc] min-h-screen text-slate-900 overflow-x-hidden selection:bg-[#485c10] selection:text-white">

      {/* Top Banner */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
        className="fixed top-0 left-0 right-0 z-[60] bg-[#8e9c78] py-2 flex justify-center items-center shadow-sm"
      >
        <p className="text-white text-xs font-bold font-sans tracking-wide">
          Acelere sua produtividade no Devsboard 🚀
        </p>
      </motion.div>

      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-32 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center z-10 relative">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-white border border-[#485c10]/20 rounded-full px-4 py-1.5 mb-8 shadow-sm"
          >
            <Star className="w-3.5 h-3.5 text-[#485c10] fill-[#485c10]" />
            <span className="text-xs font-semibold text-[#485c10] uppercase tracking-wide">100% Gratuito</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, type: 'spring' }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-slate-900 mb-6 leading-[1.1] tracking-tight"
          >
            Organize sua vida<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#485c10] to-[#6a8226]">
              em um só lugar.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl font-medium text-slate-600 mb-10 max-w-2xl leading-relaxed"
          >
            Menos bagunça mental. Mais execução diária.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-16"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/auth'}
              className="px-8 py-4 bg-[#485c10] rounded-full text-white font-bold flex items-center gap-2 shadow-xl shadow-[#485c10]/25 hover:bg-[#3d4a0c] transition-colors"
            >
              Começar Agora <ArrowRight className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.05)' }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => scrollToSection(e, '#recursos')}
              className="px-8 py-4 bg-transparent border-2 border-slate-200 text-slate-700 rounded-full font-bold hover:border-slate-300 transition-colors"
            >
              Ver Recursos
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-row justify-center gap-12 md:gap-32 pt-8"
          >
            {[
              { label: 'Usuários', value: 20, suffix: '+' },
              { label: 'Plataforma', value: 1, suffix: '' },
              { label: 'Anúncios', value: 0, suffix: '' },
            ].map((stat, i) => (
              <Counter key={i} from={0} to={stat.value} suffix={stat.suffix} label={stat.label} />
            ))}
          </motion.div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#485c10]/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Scroll cue */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-400"
        >
          <span className="text-[10px] font-semibold tracking-widest uppercase">Scroll down</span>
          <ChevronDown size={16} />
        </motion.div>
      </section>

      {/* ── Horizontal Scroll Recursos ── */}
      <HorizontalScrollSection />

      {/* ── Differentiators ── */}
      <Differentiators />

      {/* ── Footer ── */}
      <footer className="bg-[#f5f5dc] py-8 px-6 border-t border-[#0e3b44]/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/devsboard.png" alt="DevsBoard Logo" className="w-8 h-8 object-contain" />
            <span className="text-xs font-mono font-medium text-[#485c10]/80">© 2026 DevsBoard</span>
          </div>
          <p className="text-xs font-mono text-[#485c10]/60">
            Desenvolvido por <a href="https://github.com/IcaroCodes/" className="font-semibold text-[#485c10]">IcaroCodes</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
