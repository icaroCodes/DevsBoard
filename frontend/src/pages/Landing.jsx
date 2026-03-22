import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ReactLenis } from 'lenis/react';
import { ArrowRight, Code, Zap, Shield, Sparkles, Server, CheckCircle2 } from 'lucide-react';



const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const FinancialChartAnimation = () => {
  return (
    <div className="h-48 relative flex flex-col items-center justify-end p-5 bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden shadow-inner">
      {/* Saldo Header */}
      <div className="absolute top-5 left-5 w-full flex justify-between pr-10 items-start">
        <div>
          <div className="text-[10px] text-zinc-500 font-mono mb-1 uppercase tracking-widest">Saldo Atual</div>
          <div className="text-2xl font-bold text-white tracking-tight flex items-center gap-1">
            <span className="text-zinc-500 text-lg">R$</span> 
            <motion.span 
              animate={{ opacity: [0.6, 1, 0.6] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              8.450
            </motion.span>
            <span className="text-zinc-500 text-lg">,00</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 w-16 mt-1 opacity-70">
          <div className="h-1 w-full bg-[#8E9C78]/50 rounded-full" />
          <div className="h-1 w-2/3 bg-red-500/40 rounded-full" />
          <div className="h-1 w-4/5 bg-[#8E9C78]/50 rounded-full" />
        </div>
      </div>

      {/* Bouncing Chart Bars */}
      <div className="flex items-end gap-1.5 w-full h-20 opacity-80 z-10 relative left-1/2 -translate-x-1/2 pr-3 pl-3">
        {[30, 50, 40, 70, 55, 90, 65, 100].map((height, i) => (
          <motion.div
            key={i}
            animate={{ height: [`${height * 0.4}%`, `${height}%`, `${height * 0.4}%`] }}
            transition={{ duration: 3, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" }}
            className="flex-1 bg-gradient-to-t from-transparent via-[#8E9C78]/40 to-[#8E9C78]/90 rounded-t-sm"
          />
        ))}
      </div>
      
      {/* Fade at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#0A0A0A] to-transparent z-20 pointer-events-none" />
    </div>
  );
};

const TrelloDragAndDropAnimation = () => {
  return (
    <div className="h-48 relative flex items-center justify-center p-4">
      <div className="flex gap-6 w-full max-w-[220px] h-36">
        {/* List 1: To Do */}
        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex flex-col gap-2.5">
          <div className="w-12 h-2 bg-white/10 rounded-full mb-1"></div>
          {/* Drop Target */}
          <div className="w-full h-10 rounded-lg border-2 border-dashed border-[#8E9C78]/20 bg-[#8E9C78]/5"></div>
          {/* Static Card */}
          <div className="w-full h-10 bg-[#111] border border-white/5 rounded-lg shadow-sm opacity-30"></div>
        </div>
        
        {/* List 2: In Progress */}
        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex flex-col gap-2.5 relative">
          <div className="w-12 h-2 bg-[#8E9C78]/30 rounded-full mb-1"></div>
          
          {/* Animated Card that moves from List 2 back to List 1 */}
          <motion.div 
            animate={{ 
              x: [0, -110, -110, 0, 0], 
              y: [0, 8, 8, 0, 0],
              rotate: [0, -4, -4, 0, 0],
              scale: [1, 1.05, 1.05, 1, 1]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-[calc(100%-20px)] h-10 absolute top-9 left-2.5 bg-[#1a1a1a] border border-[#8E9C78]/40 rounded-lg shadow-[0_8px_20px_rgba(0,0,0,0.6)] z-20 flex flex-col px-2 py-1.5 gap-1.5"
          >
             <div className="w-8 h-1 bg-[#8E9C78]/80 rounded-full"></div>
             <div className="w-12 h-1 bg-white/20 rounded-full"></div>
             
             {/* Mouse Cursor */}
             <motion.div
               animate={{ scale: [1, 0.9, 0.9, 1, 1] }} 
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="absolute -right-2 top-4 w-4 h-4 z-30"
             >
               <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white drop-shadow-lg">
                 <path d="M4 4L10.5 21L14 14L21 10.5L4 4Z" fill="white" stroke="black" strokeWidth="1" strokeLinejoin="round"/>
               </svg>
             </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const RoutineDragAndDropAnimation = () => {
  return (
    <div className="h-48 relative flex flex-col items-center justify-center p-4">
      {/* Routine Container */}
      <div className="w-full max-w-[200px] bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col gap-2 shadow-lg relative h-[164px]">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-[#8E9C78]"></div>
             <div className="w-16 h-1.5 bg-white/20 rounded-full"></div>
          </div>
          <div className="w-4 h-1 bg-white/10 rounded-full"></div>
        </div>
        
        {/* Task 1 (Static) */}
        <div className="w-full h-8 bg-white/[0.03] border border-white/5 rounded-lg flex items-center px-3 gap-2">
           <div className="w-3 h-3 rounded-sm border border-white/20"></div>
           <div className="w-16 h-1 bg-white/10 rounded-full"></div>
        </div>

        {/* Slot 2: Placeholder */}
        <div className="w-full h-8 rounded-lg border-2 border-dashed border-[#8E9C78]/20 bg-[#8E9C78]/5"></div>

        {/* Task 3 (Empty Spacer for positioning) */}
        <div className="w-full h-8"></div>

        {/* Animated Dragged Task */}
        <motion.div 
          className="absolute w-[calc(100%-24px)] left-3 h-8 bg-[#1a1a1a] border border-[#8E9C78]/40 shadow-[0_5px_15px_rgba(0,0,0,0.5)] rounded-lg flex items-center px-3 gap-2 z-20"
          animate={{ 
            y: [108, 108, 68, 68, 108], 
            scale: [1, 1.05, 1.05, 1, 1] 
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: 0 }}
        >
           <div className="w-3 h-3 rounded-sm border border-[#8E9C78]/60 bg-[#8E9C78]/10"></div>
           <div className="w-20 h-1 bg-white/20 rounded-full"></div>

           {/* Cursor */}
           <motion.div
             animate={{ scale: [1, 0.9, 0.9, 1, 1] }} 
             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
             className="absolute right-1 top-3.5 w-4 h-4 z-30"
           >
             <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white drop-shadow-lg">
               <path d="M4 4L10.5 21L14 14L21 10.5L4 4Z" fill="white" stroke="black" strokeWidth="1" strokeLinejoin="round"/>
             </svg>
           </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default function Landing() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateScroll = () => {
      // Ativa o estilo de vidro após 20px de scroll
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', updateScroll);
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);
  // Disabling native smooth scrolling when Lenis is active to avoid conflicts
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    return () => {
      document.documentElement.style.scrollBehavior = 'smooth';
    };
  }, []);

  const { scrollY } = useScroll();
  const rotateX = useTransform(scrollY, [0, 500], [25, 0]);
  const scale = useTransform(scrollY, [0, 500], [0.9, 1]);


  return (
    <ReactLenis root>
      <div className="min-h-screen bg-[#0A0A0A] text-zinc-300 font-sans selection:bg-[#8E9C78]/30 selection:text-white">

        {/* Navigation */}
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${isScrolled
            ? "py-3 bg-[#0a0a0a]/60 backdrop-blur-2xl border-b border-white/[0.06]"
            : "py-6 bg-transparent border-b border-transparent"
            }`}
        >
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between relative">

            {/* LOGO AREA */}
            <Link to="/" className="relative z-10">
              <motion.div
                whileHover={{ opacity: 0.7 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2.5"
              >
                <img src="/devsboard.png" alt="Logo" className="w-5 h-5 object-contain" />
                <span className="text-white font-semibold text-[15px] tracking-tight">
                  DevsBoard
                </span>
              </motion.div>
            </Link>

            {/* DESKTOP MENU - Minimalist & Interactive */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8">
              {[
                { name: 'Recursos', id: '#features' },
                { name: 'Experiências', id: '#testimonials' },
                { name: 'Comunidade', id: '#community' }
              ].map((link) => (
                <a
                  key={link.name}
                  href={link.id}
                  className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* ACTIONS AREA */}
            <div className="flex items-center gap-3">
              <Link
                to="/auth"
                className="hidden sm:block px-4 py-2 text-[13px] font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Entrar
              </Link>

              <Link to="/auth">
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: "#A3B58A" }}
                  whileTap={{ scale: 0.98 }}
                  className="relative overflow-hidden px-5 py-2 rounded-full bg-[#8E9C78] text-[#0A0A0A] text-[13px] font-bold transition-colors shadow-[0_10px_20px_rgba(142,156,120,0.2)] group"
                >
                  {/* Shine effect animation */}
                  <motion.span
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  />
                  <span className="relative z-10 text-white">Começar Agora</span>
                </motion.button>
              </Link>

              {/* MOBILE TOGGLE (Opcional, mas profissional) */}
              <button className="md:hidden w-8 h-8 flex flex-col justify-center items-center gap-1.5 px-1">
                <div className="w-full h-[1px] bg-white/60" />
                <div className="w-full h-[1px] bg-white/60" />
              </button>
            </div>
          </div>
        </motion.nav>

        {/* Hero Section */}
        <section className="pt-40 pb-20 px-6 min-h-[90vh] flex flex-col items-center justify-center relative overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8E9C78]/10 rounded-full blur-[120px] pointer-events-none" />

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center relative z-10"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-[#8E9C78] mb-8">
              <Sparkles size={12} />
              <span>100% Gratuito</span>
            </motion.div>

            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
              Organize sua vida <br className="hidden md:block" />
              com o <span className="text-[#8E9C78]">DevsBoard</span>.
            </motion.h1>

            <motion.p variants={fadeIn} className="text-base md:text-lg text-zinc-400 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              plataforma web que centraliza a organização do desenvolvedor em um único ambiente.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/auth"
                className="group flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full text-sm font-medium hover:scale-[1.02] transition-transform"
              >
                Inicie sua jornada
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#features" className="text-sm font-medium text-zinc-400 hover:text-white px-6 py-3 transition-colors">
                Descubra mais
              </a>
            </motion.div>
          </motion.div>

          {/* Hero Image/Preview */}
          <div className="mt-20 w-full max-w-5xl mx-auto relative z-10" style={{ perspective: '1200px' }}>
            <motion.div
              style={{
                rotateX,
                scale,
                transformOrigin: 'top center',
              }}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-xl border border-white/10 bg-[#111] p-2 md:p-3 shadow-[0_0_80px_rgba(142,156,120,0.15)] relative preserve-3d"
            >
              <div className="rounded-lg bg-[#0A0A0A] border border-white/5 overflow-hidden flex flex-col">
                <img
                  src="/capa_notebook.png"
                  alt="DevsBoard App Preview"
                  className="w-full h-auto object-cover opacity-90"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trusted By / Sponsorship Logos */}
        <section className="py-20 border-t border-white/5 bg-[#0A0A0A] flex flex-col justify-center items-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-medium text-zinc-500 tracking-[0.2em] uppercase mb-10"
          >
            Patrocinadores
          </motion.p>
          <div className="max-w-5xl w-full flex flex-col sm:flex-row items-center justify-center gap-16 md:gap-32 px-6 relative z-10">
            <motion.img
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              src="/Denna.png"
              alt="Denna"
              className="h-24 md:h-32 w-auto opacity-50 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-[1.03] transition-all duration-500 object-contain cursor-pointer"
            />
            <motion.img
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              src="/Robson.png"
              alt="Robson"
              className="h-40 md:h-52 w-auto opacity-50 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-[1.03] transition-all duration-500 object-contain cursor-pointer"
            />
          </div>
        </section>

        {/* C. FEATURES - Artefatos Funcionais Interativos */}
        <section id="features" className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="mb-20 text-center md:text-left"
            >
              <motion.h2 variants={fadeIn} className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
                Engenharia de <span className="text-[#8E9C78]">Foco</span>.
              </motion.h2>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Card 1: Diagnostic Shuffler */}
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:border-white/10 transition-colors"
              >
                <div className="mb-12">
                  <FinancialChartAnimation />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Saúde Financeira</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-light">
                  Abandone as planilhas complexas. Registre entradas, categorize despesas e acompanhe sua evolução através de gráficos contínuos e limpos.
                </p>
              </motion.div>

              {/* Card 2: Trello Drag and Drop */}
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:border-white/10 transition-colors"
              >
                <div className="mb-12">
                  <TrelloDragAndDropAnimation />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Gestão de Tarefas</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-light">
                  Organização focada no modelo Trello. Movimente cards e listas fluidamente usando a mecânica clássica e tátil de Drag and Drop.
                </p>
              </motion.div>

              {/* Card 3: Routine Drag and Drop */}
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:border-white/10 transition-colors"
              >
                <div className="mb-12">
                  <RoutineDragAndDropAnimation />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Rotinas e Hábitos</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-light">
                  Estruture sua rotina criando hábitos recorrentes com tarefas internas próprias. Reorganize a ordem ajustando atividades flexivelmente pelo Drag and Drop.
                </p>
              </motion.div>

            </div>
          </div>
        </section>

        {/* D. PHILOSOPHY - O Manifesto */}
        <section className="py-40 px-6 bg-[#000000] relative overflow-hidden border-y border-white/5">
          <div className="absolute inset-0 z-0 pointer-events-none opacity-15" style={{ backgroundImage: 'url("/banner_2.png")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', filter: 'contrast(1.2)' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#000000]/60 to-[#000000] z-0 pointer-events-none" />
          <div className="max-w-4xl mx-auto relative z-10 text-center drop-shadow-2xl">
            <motion.p 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1 }}
              className="text-sm md:text-base text-zinc-400 font-medium mb-8 tracking-wide drop-shadow-md"
            >
              A maioria dos desenvolvedores: <span className="text-white font-bold">usa dez apps pesados ao mesmo tempo.</span>
            </motion.p>
            <motion.h2 
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }}
              className="text-4xl md:text-6xl font-medium text-white leading-tight drop-shadow-lg"
            >
              Nós entregamos: <span className="font-serif italic text-5xl md:text-7xl text-[#8E9C78] pr-2 drop-shadow-[0_0_15px_rgba(142,156,120,0.2)]">tudo em um único painel.</span>
            </motion.h2>
          </div>
        </section>

        {/* E. PROTOCOL - Sticky Stacking Protocol */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="text-3xl font-bold tracking-tight text-white mb-4">A Lógica da Simplicidade</h2>
              <p className="text-zinc-400">Um único ambiente leve e rápido.</p>
            </div>
            
            <div className="space-y-32">
              {[
                { step: "TAREFAS", title: "Organização Kanban", desc: "Separação de tarefas em formato Kanban intuitivo inspirado no Trello, para arrastar, soltar e resolver os tickets dos seus projetos sem menus poluídos.", viz: (
                  <div className="w-full aspect-video rounded-[1rem] border border-white/5 flex items-center justify-center overflow-hidden bg-[#111] relative shadow-inner">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="w-32 h-32 border border-[#8E9C78]/30 rounded-full border-dashed" />
                    <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="w-48 h-48 border border-[#8E9C78]/20 rounded-full border-dashed absolute" />
                  </div>
                )},
                { step: "ORGANIZAÇÃO", title: "Minimalismo", desc: "Plataforma minimalista e leve inspirado no design da apple.", viz: (
                  <div className="w-full aspect-video rounded-[1rem] border border-white/5 flex items-center justify-center overflow-hidden bg-[#111] relative shadow-inner">
                     <div className="w-full h-full bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
                     <motion.div animate={{ y: ["-100%", "100%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute w-full h-[2px] bg-[#8E9C78] shadow-[0_0_15px_#8E9C78]" />
                  </div>
                )},
                { step: "METAS", title: "Acompanhamento Mínimo", desc: "Metas financeiras e metas de desempenho acompanhando seu progresso automaticamente.", viz: (
                  <div className="w-full aspect-video rounded-[1rem] border border-white/5 flex items-center justify-center overflow-hidden bg-[#111] relative shadow-inner">
                    <svg viewBox="0 0 200 50" className="w-full h-24 stroke-[#8E9C78] fill-transparent stroke-[2px]">
                      <motion.path 
                        d="M 0,25 C 25,25 25,5 50,5 C 75,5 75,45 100,45 C 125,45 125,25 150,25 C 175,25 175,25 200,25" 
                        initial={{ strokeDasharray: "400", strokeDashoffset: "400" }}
                        animate={{ strokeDashoffset: 0 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        style={{ filter: 'drop-shadow(0px 0px 4px rgba(142,156,120,0.5))' }}
                      />
                    </svg>
                  </div>
                )},
              ].map((protocol, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20%" }}
                  transition={{ duration: 0.8 }}
                  className="sticky top-32 bg-[#0A0A0A] p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col md:flex-row items-center gap-12 group hover:border-[#8E9C78]/20 transition-colors"
                  style={{ zIndex: 10 + i }}
                >
                  <div className="flex-1 space-y-6">
                    <div className="font-mono text-[#8E9C78] text-xs font-bold tracking-widest border border-[#8E9C78]/30 bg-[#111] px-3 py-1 rounded w-fit">{protocol.step}</div>
                    <h3 className="text-3xl font-semibold text-white tracking-tight">{protocol.title}</h3>
                    <p className="text-zinc-400 leading-relaxed font-light text-sm md:text-base max-w-md">{protocol.desc}</p>
                  </div>
                  <div className="flex-1 w-full">
                    {protocol.viz}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* F. MEMBERSHIP / GET STARTED */}
        <section className="py-32 px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
            className="max-w-5xl mx-auto bg-[#111] border border-white/5 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-[0_0_80px_rgba(142,156,120,0.05)]"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#8E9C78]/10 rounded-[100%] blur-[100px] pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-8">
                Retome o foco agora.
              </h2>
              <p className="text-zinc-400 text-sm md:text-base font-light mb-12 max-w-xl leading-relaxed">
                Organize finanças, tarefas, rotinas, metas e projetos em um único lugar.
              </p>
              <Link
                to="/auth"
                className="group relative overflow-hidden inline-flex items-center gap-3 bg-[#8E9C78] text-[#0A0A0A] px-8 py-4 rounded-full text-[15px] font-bold hover:scale-[1.02] transition-transform"
              >
                <motion.span 
                  initial={{ x: "-100%" }} whileHover={{ x: "100%" }} transition={{ duration: 0.5 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                />
                <span className="relative z-10">Cadastre-se</span>
                <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </section>

        <footer className="relative bg-black pt-20 pb-10 px-6 overflow-hidden">
      {/* Onda Minimalista em SVG */}
      <div className="absolute top-0 left-0 w-full rotate-180 line-height-0">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-full h-[60px] fill-black"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V46.29C28.5,54.16,117.44,71.65,162.92,75c47.85,3.53,105.27-10.05,158.47-18.56Z" 
                className="fill-[#050505] opacity-50"></path>
        </svg>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col items-center gap-12">
          
          {/* Logo Animada */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2"
          >
            <img src="/devsboard.png" alt="Logo" className="w-5 h-5 grayscale opacity-80" />
            <span className="text-white text-sm font-medium tracking-widest uppercase">DevsBoard</span>
          </motion.div>

          {/* Linha Divisória sutil */}
          <div className="w-full h-[1px] bg-white/[0.03]" />

          {/* Bottom Bar */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="w-full flex flex-col md:flex-row justify-between items-center gap-4"
          >
            <p className="text-zinc-600 text-[10px] tracking-[0.1em] uppercase">
              &copy; {new Date().getFullYear()} DevsBoard.
            </p>

            <div className="flex gap-6">
              <p className="text-zinc-700 text-[10px] tracking-[0.1em] uppercase">
                Feito por <a href="https://github.com/icaroCodes" className="text-zinc-500 hover:text-white transition-colors duration-500">IcaroCodes</a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>

      </div>
    </ReactLenis>
  );
}
