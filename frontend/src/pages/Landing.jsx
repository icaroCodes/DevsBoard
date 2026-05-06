import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, CheckCircle2, Users } from 'lucide-react';


const translations = {
  pt: {
    bannerText: "Organize projetos em equipe.",
    bannerLink: "Saber mais",
    navHow: "Como funciona",
    navVision: "Para que serve",
    navStep: "Passo a passo",
    navDashboard: "Minha página",
    navLogin: "Entrar",
    navStart: "Criar conta",
    mobileFocus: "Simples e direto",
    mobileJourney: "Começar agora",
    heroFree: "100% Grátis",
    heroTitle1: "Organize sua vida",
    heroTitle2: "com o",
    heroDesc: "Cuide das suas tarefas, do seu dinheiro e das suas metas em um só lugar.",
    heroBtnStart: "Criar minha conta",
    heroBtnDash: "Ver meu progresso",
    heroBtnDiscover: "Saber mais",
    heroSocial: "Junte-se a mais de 50 pessoas",
    sponsors: "Parceiros",
    featTitle1: "Tudo no seu",
    featTitle2: "lugar certo",
    feat1Title: "Controle do dinheiro",
    feat1Desc: "Anote o que entra e o que sai. Veja tudo em gráficos simples.",
    feat2Title: "Minhas atividades",
    feat2Desc: "Arraste e solte os cartões. Suas tarefas sempre em ordem.",
    feat3Title: "Tarefas do dia",
    feat3Desc: "Monte sua rotina do seu jeito e crie bons hábitos.",
    feat4Tag: "Novidade",
    feat4Title: "Trabalhar em equipe ficou fácil.",
    feat4Desc: "Acompanhe tarefas e contas da sua casa ou do seu time em tempo real.",
    feat4L1: "Convites rápidos",
    feat4L2: "Controle de acesso",
    feat4L3: "Atualizado na hora",
    phil1: "A maioria das pessoas:",
    phil2: "se perde em vários apps.",
    phil3: "Aqui você tem:",
    phil4: "tudo em uma só tela.",
    protTitle: "Por que o DevsBoard?",
    protDesc: "Fácil de usar e leve.",
    prot1Tag: "ATIVIDADES",
    prot1Title: "Mural de recados",
    prot1Desc: "Arraste e solte os cartões. Igual a um mural.",
    prot2Tag: "CLAREZA",
    prot2Title: "Visual limpo",
    prot2Desc: "Leve, fácil de ler e que não cansa a vista.",
    prot3Tag: "CONQUISTAS",
    prot3Title: "Minhas metas",
    prot3Desc: "Defina o que quer conquistar e veja seu progresso em gráficos.",
    ctaTitle: "Coloque sua rotina em ordem.",
    ctaDesc: "Suas tarefas e seu dinheiro organizados agora.",
    ctaBtn: "Começar agora",
    footerMade: "Criado por",
    chartBalance: "Meu saldo"
  },
  en: {
    bannerText: "Organize team projects.",
    bannerLink: "Learn more",
    navHow: "How it works",
    navVision: "What it's for",
    navStep: "Step by step",
    navDashboard: "Dashboard",
    navLogin: "Sign in",
    navStart: "Sign up",
    mobileFocus: "Simple and clear",
    mobileJourney: "Start now",
    heroFree: "100% Free",
    heroTitle1: "Organize your life",
    heroTitle2: "with",
    heroDesc: "Manage your tasks, money and goals in one place.",
    heroBtnStart: "Create my account",
    heroBtnDash: "Go to dashboard",
    heroBtnDiscover: "Learn more",
    heroSocial: "Join over 50 members",
    sponsors: "Sponsors",
    featTitle1: "Everything in its",
    featTitle2: "right place",
    feat1Title: "Money control",
    feat1Desc: "Track income and spending. See it all in simple charts.",
    feat2Title: "My tasks",
    feat2Desc: "Drag and drop cards. Always in order.",
    feat3Title: "Daily routine",
    feat3Desc: "Build your routine your way and create good habits.",
    feat4Tag: "New",
    feat4Title: "Teamwork made easy.",
    feat4Desc: "Track your team's or family's tasks and bills in real time.",
    feat4L1: "Quick invites",
    feat4L2: "Access control",
    feat4L3: "Real-time updates",
    phil1: "Most people:",
    phil2: "get lost across many apps.",
    phil3: "Here you have:",
    phil4: "everything on one screen.",
    protTitle: "Why DevsBoard?",
    protDesc: "Easy to use and lightweight.",
    prot1Tag: "TASKS",
    prot1Title: "Task board",
    prot1Desc: "Drag and drop cards. Just like a sticky-note board.",
    prot2Tag: "CLARITY",
    prot2Title: "Clean look",
    prot2Desc: "Light, easy to read, and easy on the eyes.",
    prot3Tag: "PROGRESS",
    prot3Title: "My goals",
    prot3Desc: "Set what you want to achieve and see your progress in charts.",
    ctaTitle: "Get your routine in order.",
    ctaDesc: "Your tasks and money organized now.",
    ctaBtn: "Start now",
    footerMade: "Made by",
    chartBalance: "Balance"
  }
};



const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const FinancialChartAnimation = ({ lang = 'pt' }) => {
  const t = translations[lang];
  return (
    <div className="h-48 relative flex flex-col items-center justify-end p-5 bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden shadow-inner">
      { }
      <div className="absolute top-5 left-5 w-full flex justify-between pr-10 items-start">
        <div>
          <div className="text-[10px] text-zinc-500 font-mono mb-1 uppercase tracking-widest">{t.chartBalance}</div>
          <div className="text-2xl font-bold text-white tracking-tight flex items-center gap-1">
            <span className="text-zinc-500 text-lg">R$</span>
            <span>
              8.450
            </span>
            <span className="text-zinc-500 text-lg">,00</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-16 mt-1 opacity-70">
          <div className="h-1 w-full bg-[#8E9C78]/50 rounded-full" />
          <div className="h-1 w-2/3 bg-red-500/40 rounded-full" />
          <div className="h-1 w-4/5 bg-[#8E9C78]/50 rounded-full" />
        </div>
      </div>

      { }
      <div className="flex items-end gap-1.5 w-full h-20 opacity-80 z-10 relative left-1/2 -translate-x-1/2 pr-3 pl-3">
        {[30, 50, 40, 70, 55, 90, 65, 100].map((height, i) => (
          <div
            key={i}
            style={{ height: `${height}%` }}
            className="flex-1 bg-gradient-to-t from-transparent via-[#8E9C78]/40 to-[#8E9C78]/90 rounded-t-sm"
          />
        ))}
      </div>

      { }
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#0A0A0A] to-transparent z-20 pointer-events-none" />
    </div>
  );
};

const TrelloDragAndDropAnimation = () => {
  return (
    <div className="h-48 relative flex items-center justify-center p-4">
      <div className="flex gap-6 w-full max-w-[220px] h-36">
        { }
        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex flex-col gap-2.5">
          <div className="w-12 h-2 bg-white/10 rounded-full mb-1"></div>
          { }
          <div className="w-full h-10 rounded-lg border-2 border-dashed border-[#8E9C78]/20 bg-[#8E9C78]/5"></div>
          { }
          <div className="w-full h-10 bg-[#111] border border-white/5 rounded-lg shadow-sm opacity-30"></div>
        </div>

        { }
        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex flex-col gap-2.5 relative">
          <div className="w-12 h-2 bg-[#8E9C78]/30 rounded-full mb-1"></div>

          { }
          <motion.div
            animate={{
              x: [0, -110, -110, 0, 0],
              y: [0, 8, 8, 0, 0],
              rotate: [0, -4, -4, 0, 0],
              scale: [1, 1.05, 1.05, 1, 1]
            }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className="w-[calc(100%-20px)] h-10 absolute top-9 left-2.5 bg-[#1a1a1a] border border-[#8E9C78]/40 rounded-lg shadow-[0_8px_20px_rgba(0,0,0,0.6)] z-20 flex flex-col px-2 py-1.5 gap-1.5"
          >
            <div className="w-8 h-1 bg-[#8E9C78]/80 rounded-full"></div>
            <div className="w-12 h-1 bg-white/20 rounded-full"></div>

            { }
            <motion.div
              animate={{ scale: [1, 0.9, 0.9, 1, 1] }}
              transition={{ duration: 4, ease: "easeInOut" }}
              className="absolute -right-2 top-4 w-4 h-4 z-30"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white drop-shadow-lg">
                <path d="M4 4L10.5 21L14 14L21 10.5L4 4Z" fill="white" stroke="black" strokeWidth="1" strokeLinejoin="round" />
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
      { }
      <div className="w-full max-w-[200px] bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col gap-2 shadow-lg relative h-[164px]">

        { }
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#8E9C78]"></div>
            <div className="w-16 h-1.5 bg-white/20 rounded-full"></div>
          </div>
          <div className="w-4 h-1 bg-white/10 rounded-full"></div>
        </div>

        { }
        <div className="w-full h-8 bg-white/[0.03] border border-white/5 rounded-lg flex items-center px-3 gap-2">
          <div className="w-3 h-3 rounded-sm border border-white/20"></div>
          <div className="w-16 h-1 bg-white/10 rounded-full"></div>
        </div>

        { }
        <div className="w-full h-8 rounded-lg border-2 border-dashed border-[#8E9C78]/20 bg-[#8E9C78]/5"></div>

        { }
        <div className="w-full h-8"></div>

        { }
        <motion.div
          className="absolute w-[calc(100%-24px)] left-3 h-8 bg-[#1a1a1a] border border-[#8E9C78]/40 shadow-[0_5px_15px_rgba(0,0,0,0.5)] rounded-lg flex items-center px-3 gap-2 z-20"
          animate={{
            y: [108, 108, 68, 68, 108],
            scale: [1, 1.05, 1.05, 1, 1]
          }}
          transition={{ duration: 4, ease: "easeInOut" }}
          style={{ top: 0 }}
        >
          <div className="w-3 h-3 rounded-sm border border-[#8E9C78]/60 bg-[#8E9C78]/10"></div>
          <div className="w-20 h-1 bg-white/20 rounded-full"></div>

          { }
          <motion.div
            animate={{ scale: [1, 0.9, 0.9, 1, 1] }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className="absolute right-1 top-3.5 w-4 h-4 z-30"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white drop-shadow-lg">
              <path d="M4 4L10.5 21L14 14L21 10.5L4 4Z" fill="white" stroke="black" strokeWidth="1" strokeLinejoin="round" />
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

const InfiniteSponsors = () => {
  return (
    <div className="w-full relative z-10 block overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-24 md:w-32 bg-gradient-to-r from-[#0A0A0A] to-transparent z-20 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-24 md:w-32 bg-gradient-to-l from-[#0A0A0A] to-transparent z-20 pointer-events-none"></div>

      { }
      <div className="flex flex-row items-center w-[200%] animate-marquee will-change-transform gap-16 sm:gap-24 md:gap-40">
        {[1, 2, 3].map((group) => (
          <div key={group} className="flex items-center shrink-0 gap-16 sm:gap-24 md:gap-40">
            <img draggable="false" loading="lazy" decoding="async" className="h-20 sm:h-24 md:h-32 w-auto opacity-50 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-[1.03] transition-all duration-500 object-contain cursor-pointer shrink-0" src="/Denna.png" alt="Denna" />
            <img draggable="false" loading="lazy" decoding="async" className="h-32 sm:h-40 md:h-52 w-auto opacity-50 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-[1.03] transition-all duration-500 object-contain cursor-pointer shrink-0" src="/Robson.png" alt="Robson" />
            <img draggable="false" loading="lazy" decoding="async" className="h-16 sm:h-20 md:h-28 w-auto opacity-50 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-[1.03] transition-all duration-500 object-contain cursor-pointer shrink-0" src="/cleansite.png" alt="Cleansite" />
            <img draggable="false" loading="lazy" decoding="async" className="h-32 sm:h-44 md:h-56 w-auto opacity-50 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-[1.03] transition-all duration-500 object-contain cursor-pointer shrink-0" src="/im_transparente.png" alt="IM" />
          </div>
        ))}
      </div>
    </div>
  );
};

const TeamCollaborationAnimation = () => {
  return (
    <div className="h-64 md:h-full min-h-[250px] relative flex items-center justify-center p-4 bg-[#0A0A0A] rounded-[1.5rem] overflow-hidden shadow-inner border border-white/5">
      <div className="absolute inset-0 bg-[#8E9C78]/[0.02]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />

      { }
      <div className="w-full max-w-[280px] h-36 bg-[#111] border border-white/10 rounded-xl relative z-10 shadow-2xl flex flex-col p-4 gap-2.5">
        <div className="w-1/3 h-2 bg-white/20 rounded-full mb-2"></div>
        <div className="w-full h-9 bg-white/5 border border-white/10 rounded-lg flex items-center px-3">
          <div className="w-4/5 h-1.5 bg-white/20 rounded-full"></div>
        </div>
        <div className="w-full h-9 bg-[#8E9C78]/10 border border-[#8E9C78]/20 rounded-lg flex items-center px-3">
          <div className="w-3/5 h-1.5 bg-[#8E9C78]/80 rounded-full"></div>
        </div>
      </div>

      { }
      <motion.div
        animate={{
          x: [-90, -30, -30, -90],
          y: [-30, 30, 30, -30]
        }}
        transition={{ duration: 4, ease: "easeInOut" }}
        className="absolute z-20"
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] z-20 relative">
          <path d="M4 4L10.5 21L14 14L21 10.5L4 4Z" fill="#0A84FF" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <div className="bg-[#0A84FF] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg absolute top-4 left-4 z-10">Admin</div>
      </motion.div>

      { }
      <motion.div
        animate={{
          x: [90, 30, 30, 90],
          y: [40, -10, -10, 40]
        }}
        transition={{ duration: 5, ease: "easeInOut", delay: 1 }}
        className="absolute z-20"
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] z-20 relative">
          <path d="M4 4L10.5 21L14 14L21 10.5L4 4Z" fill="#30D158" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <div className="bg-[#30D158] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg absolute top-4 left-4 z-10">Membro</div>
      </motion.div>

      { }
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[radial-gradient(circle,_rgba(142,156,120,0.15)_0%,_transparent_60%)] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-0" />
    </div>
  );
};

export default function Landing() {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'pt');
  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const toggleLang = () => setLang((prev) => (prev === 'pt' ? 'en' : 'pt'));

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const scrollToSection = (e, id) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const updateScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
  }, [isMobileMenuOpen]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  return (
      <div className="min-h-screen bg-[#0A0A0A] text-zinc-300 font-sans selection:bg-[#8E9C78]/30 selection:text-white">

        { }
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`fixed top-0 left-0 right-0 z-[60] transition-colors duration-200 will-change-transform ${isScrolled
            ? "bg-[#0a0a0a]/85 backdrop-blur-md border-b border-white/[0.06]"
            : "bg-transparent border-b border-transparent"
            }`}
        >
          <div className={`max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between relative transition-all duration-500 ${isScrolled ? "py-3" : "py-6"}`}>

            { }
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

            { }
            <div className="hidden min-[824px]:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8">
              {[
                { name: t.navHow, id: '#features' },
                { name: t.navVision, id: '#philosophy' },
                { name: t.navStep, id: '#protocol' }
              ].map((link) => (
                <a
                  key={link.name}
                  href={link.id}
                  onClick={(e) => scrollToSection(e, link.id)}
                  className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>

            { }
            <div className="flex items-center gap-2 sm:gap-3">
              { }
              <div className="hidden sm:flex relative items-center bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.05] rounded-full p-[2px] transition-colors mr-1 sm:mr-3">
                <motion.div
                  className="absolute h-6 bg-white/[0.12] rounded-full shadow-sm"
                  layout
                  initial={false}
                  animate={{
                    width: "28px",
                    x: lang === 'pt' ? 0 : 28
                  }}
                  transition={{ type: "spring", stiffness: 600, damping: 35 }}
                />

                <button
                  onClick={() => setLang('pt')}
                  className={`relative z-10 w-7 h-6 flex items-center justify-center rounded-full transition-all duration-300 ${lang === 'pt' ? 'opacity-100 grayscale-0' : 'opacity-30 grayscale hover:opacity-60 hover:grayscale-[0.5]'}`}
                >
                  <img src="https://flagcdn.com/br.svg" alt="PT" className="w-[14px] h-[14px] rounded-full object-cover shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
                </button>

                <button
                  onClick={() => setLang('en')}
                  className={`relative z-10 w-7 h-6 flex items-center justify-center rounded-full transition-all duration-300 ${lang === 'en' ? 'opacity-100 grayscale-0' : 'opacity-30 grayscale hover:opacity-60 hover:grayscale-[0.5]'}`}
                >
                  <img src="https://flagcdn.com/us.svg" alt="EN" className="w-[14px] h-[14px] rounded-full object-cover shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
                </button>
              </div>

              {user ? (
                <Link to="/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(142,156,120,0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    className="relative px-6 py-2 rounded-full border border-[#8E9C78]/30 bg-[#8E9C78]/10 text-[#8E9C78] text-[13px] font-bold transition-colors hover:border-[#8E9C78]/50 whitespace-nowrap"
                  >
                    {t.navDashboard}
                  </motion.button>
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="hidden sm:block px-4 py-2 text-[13px] font-medium text-zinc-400 hover:text-white transition-colors whitespace-nowrap"
                  >
                    {t.navLogin}
                  </Link>

                  <Link to="/auth">
                    <motion.button
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.03)" }}
                      whileTap={{ scale: 0.98 }}
                      className="relative px-5 py-2 rounded-full border border-white/10 text-zinc-300 text-[13px] font-medium transition-colors hover:border-white/30 hover:text-white whitespace-nowrap"
                    >
                      {t.navStart}
                    </motion.button>
                  </Link>
                </>
              )}

              { }
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="min-[824px]:hidden w-10 h-10 flex flex-col justify-center items-center gap-1.5 relative z-[60] group"
              >
                <div className="w-5 h-[1px] transition-colors duration-300 bg-white/60 group-hover:bg-white" />
                <div className="w-5 h-[1px] transition-colors duration-300 bg-white/60 group-hover:bg-white" />
              </button>
            </div>
          </div>

          { }
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="w-full bg-[#8E9C78]/10 border-t border-white/[0.05] overflow-hidden"
          >
            <div className="max-w-6xl mx-auto px-2 sm:px-6 py-2 md:py-2.5 flex flex-row flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Users size={12} className="text-[#8E9C78] shrink-0 md:w-3.5 md:h-3.5" />
                <div className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8E9C78] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-[#8E9C78]"></span>
                </div>
                <p className="text-[9.5px] sm:text-[11px] md:text-[13px] font-medium text-zinc-300 tracking-tight leading-tight max-w-[240px] sm:max-w-none line-clamp-1 sm:line-clamp-none">
                  {t.bannerText}
                </p>
              </div>
              <Link
                to="/auth"
                className="text-[9.5px] sm:text-[11px] md:text-[12px] font-bold text-[#8E9C78] hover:text-white transition-colors flex items-center gap-1 group whitespace-nowrap"
              >
                {t.bannerLink}
                <ArrowRight size={10} className="md:w-3 md:h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </motion.nav>

        { }
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-[100] bg-[#050505] flex flex-col min-[824px]:hidden overflow-hidden p-6 sm:p-8"
            >
              { }
              <div className="flex justify-between items-start w-full relative z-10 mb-12">
                <div className="flex flex-col">
                  <span className="text-white font-bold text-[18px] sm:text-[20px] tracking-tight leading-none font-sans uppercase">
                    DevsBoard
                  </span>
                  <span className="text-zinc-500 text-[8px] sm:text-[9px] tracking-[0.2em] mt-2 uppercase font-mono">
                    {t.mobileFocus}
                  </span>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-10 h-10 flex flex-col items-center justify-start group pl-3 pt-0.5"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-zinc-400 group-hover:text-white transition-colors" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              { }
              <div className="flex-1 flex flex-col justify-center gap-8 sm:gap-10 w-full relative z-10 max-w-sm mx-auto pl-2">
                {[
                  { name: t.navHow, id: '#features' },
                  { name: t.navVision, id: '#philosophy' },
                  { name: t.navStep, id: '#protocol' }
                ].map((link, i) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-5"
                  >
                    <span className="text-zinc-600 font-mono text-[10px] sm:text-[11px] font-medium tracking-widest w-4 opacity-70">
                      0{i + 1}
                    </span>
                    <a
                      href={link.id}
                      onClick={(e) => scrollToSection(e, link.id)}
                      className="text-[2.5rem] sm:text-5xl font-bold text-white tracking-[-0.04em] hover:text-[#8E9C78] transition-colors block leading-none"
                    >
                      {link.name}
                    </a>
                  </motion.div>
                ))}
              </div>

              { }
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full flex flex-col gap-6 relative z-10 mt-auto"
              >
                <div className="flex justify-center mb-4">
                  <div className="relative flex items-center bg-white/[0.03] border border-white/[0.05] rounded-full p-[3px]">
                    <motion.div
                      className="absolute h-8 bg-white/[0.12] rounded-full shadow-sm"
                      layout
                      initial={false}
                      animate={{
                        width: "36px",
                        x: lang === 'pt' ? 0 : 36
                      }}
                      transition={{ type: "spring", stiffness: 600, damping: 35 }}
                    />

                    <button
                      onClick={() => setLang('pt')}
                      className={`relative z-10 w-9 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${lang === 'pt' ? 'opacity-100 grayscale-0' : 'opacity-30 grayscale hover:opacity-60 hover:grayscale-[0.5]'}`}
                    >
                      <img src="https://flagcdn.com/br.svg" alt="PT" className="w-[16px] h-[16px] rounded-full object-cover shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
                    </button>

                    <button
                      onClick={() => setLang('en')}
                      className={`relative z-10 w-9 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${lang === 'en' ? 'opacity-100 grayscale-0' : 'opacity-30 grayscale hover:opacity-60 hover:grayscale-[0.5]'}`}
                    >
                      <img src="https://flagcdn.com/us.svg" alt="EN" className="w-[16px] h-[16px] rounded-full object-cover shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
                    </button>
                  </div>
                </div>

                <Link
                  to="/auth"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-4 sm:py-5 rounded-[1.2rem] bg-white text-black text-[15px] font-bold tracking-[-0.01em] text-center hover:scale-[1.02] transition-transform"
                >
                  {t.mobileJourney}
                </Link>

                <div className="flex justify-between items-center w-full px-1 mb-2">
                  <span className="text-zinc-600 font-medium text-[9px] tracking-[0.14em] uppercase">
                    DevsBoard
                  </span>
                  <span className="text-zinc-600 font-medium text-[9px] tracking-[0.14em] uppercase">
                    &copy; {new Date().getFullYear()}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        { }
        <section className="pt-32 md:pt-40 pb-16 md:pb-20 px-4 sm:px-6 min-h-[90vh] md:min-h-[95vh] flex flex-col items-center justify-center relative overflow-hidden">
          { }
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-[radial-gradient(circle,_rgba(142,156,120,0.1)_0%,_transparent_70%)] rounded-full pointer-events-none" />

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center relative z-10 motion-gpu"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] md:text-xs font-medium text-[#8E9C78] mb-6 md:mb-8">
              <Sparkles size={12} />
              <span>{t.heroFree}</span>
            </motion.div>

            <motion.h1
              variants={fadeIn}
              className="text-fluid-h1 font-bold tracking-tight text-white mb-4 md:mb-6 leading-[1.1] px-2"
            >
              {t.heroTitle1} <br className="hidden md:block" />
              {t.heroTitle2} <span className="text-[#8E9C78]">DevsBoard</span>.
            </motion.h1>

            <motion.p variants={fadeIn} className="text-base sm:text-lg md:text-xl text-zinc-300 mb-8 md:mb-10 max-w-2xl mx-auto font-normal leading-relaxed px-4">
              {t.heroDesc}
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-row items-center justify-center gap-3 sm:gap-4 w-full px-4 sm:px-0">
              <Link
                to={user ? "/dashboard" : "/auth"}
                className="group flex items-center justify-center gap-1.5 sm:gap-2 bg-white text-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-[12px] sm:text-sm font-medium hover:scale-[1.02] transition-transform whitespace-nowrap"
              >
                {user ? t.heroBtnDash : t.heroBtnStart}
                <ArrowRight className="w-[14px] h-[14px] sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#features" onClick={(e) => scrollToSection(e, '#features')} className="text-[12px] sm:text-sm font-medium text-zinc-400 hover:text-white px-3 sm:px-6 py-2.5 sm:py-3 transition-colors whitespace-nowrap">
                {t.heroBtnDiscover}
              </a>
            </motion.div>

            { }
            <motion.div variants={fadeIn} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 opacity-80">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex -space-x-2">
                  {['/icaro.png', '/lidia.jfif', '/nobre.png', '/emanuel.png'].map((src, i) => (
                    <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-[#0A0A0A] overflow-hidden bg-zinc-800">
                      <img src={src} alt="Membro" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 translate-y-[1px]">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8E9C78] fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-xs text-zinc-400 font-medium tracking-wide">
                {lang === 'pt' ? (
                  <>Junte-se a <span className="text-zinc-200">mais de 50 membros</span></>
                ) : (
                  <>Join <span className="text-zinc-200">over 50 members</span></>
                )}
              </p>
            </motion.div>
          </motion.div>

          { }
          <div className="mt-20 w-full max-w-5xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.01 }}
              transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
              className="rounded-xl border border-white/10 bg-[#111] p-2 md:p-3 shadow-[0_0_80px_rgba(142,156,120,0.15)] relative motion-gpu"
            >
              <div className="rounded-lg bg-[#0A0A0A] border border-white/5 overflow-hidden flex flex-col">
                <img
                  src="/capa_notebook.png"
                  alt="DevsBoard App Preview"
                  className="w-full h-auto object-cover opacity-90"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
            </motion.div>
          </div>
        </section>

        { }
        <section className="py-16 md:py-20 border-t border-white/5 bg-[#0A0A0A] flex flex-col justify-center items-center overflow-hidden">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="hidden sm:block text-[10px] md:text-xs font-medium text-zinc-500 tracking-[0.2em] uppercase mb-8 md:mb-10 text-center px-4"
          >
            {t.sponsors}
          </motion.p>
          <InfiniteSponsors />
        </section>

        { }
        <section id="features" className="py-20 md:py-32 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="mb-12 md:mb-20 text-center md:text-left"
            >
              <motion.h2 variants={fadeIn} className="text-3xl lg:text-5xl font-bold text-white tracking-tight mb-4 px-2">
                {t.featTitle1} <span className="text-[#8E9C78]">{t.featTitle2}</span>.
              </motion.h2>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              { }
              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:border-white/10 transition-colors"
              >
                <div className="mb-12">
                  <FinancialChartAnimation lang={lang} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{t.feat1Title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-light">
                  {t.feat1Desc}
                </p>
              </motion.div>

              { }
              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:border-white/10 transition-colors"
              >
                <div className="mb-12">
                  <TrelloDragAndDropAnimation />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{t.feat2Title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-light">
                  {t.feat2Desc}
                </p>
              </motion.div>

              { }
              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:border-white/10 transition-colors"
              >
                <div className="mb-12">
                  <RoutineDragAndDropAnimation />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{t.feat3Title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-light">
                  {t.feat3Desc}
                </p>
              </motion.div>

              { }
              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                className="lg:col-span-3 bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 md:p-12 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:border-white/10 transition-colors flex flex-col md:flex-row items-center gap-8 md:gap-16"
              >
                <div className="flex-1 w-full order-2 md:order-1">
                  <TeamCollaborationAnimation />
                </div>
                <div className="flex-1 w-full order-1 md:order-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8E9C78]/10 text-[#8E9C78] text-[11px] font-bold uppercase tracking-widest border border-[#8E9C78]/20 mb-4 xl:mb-6">
                    <Sparkles size={12} />
                    <span>{t.feat4Tag}</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl xl:text-4xl font-semibold text-white mb-4 tracking-tight">
                    {t.feat4Title}
                  </h3>
                  <p className="text-sm md:text-base text-zinc-400 leading-relaxed font-light mb-6">
                    {t.feat4Desc}
                  </p>
                  <ul className="space-y-3">
                    {[t.feat4L1, t.feat4L2, t.feat4L3].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                        <CheckCircle2 size={18} className="text-[#8E9C78]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        { }
        <section id="philosophy" className="py-24 md:py-40 px-4 sm:px-6 bg-[#000000] relative overflow-hidden border-y border-white/5">
          <div className="absolute inset-0 z-0 pointer-events-none opacity-15" style={{ backgroundImage: 'url("/banner.png")', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', filter: 'contrast(1.2)' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#000000]/60 to-[#000000] z-0 pointer-events-none" />
          <div className="max-w-4xl mx-auto relative z-10 text-center drop-shadow-2xl motion-gpu">
            <motion.p
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1 }}
              className="text-xs sm:text-sm md:text-base text-zinc-400 font-medium mb-6 md:mb-8 tracking-wide drop-shadow-md px-2"
            >
              {t.phil1} <br className="sm:hidden" /><span className="text-white font-bold inline-block mt-1 sm:mt-0">{t.phil2}</span>
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }}
              className="text-3xl sm:text-4xl md:text-6xl font-medium text-white leading-tight drop-shadow-lg flex flex-col gap-1 md:gap-3"
            >
              <span>{t.phil3}</span>
              <span className="text-fluid-drama font-serif italic text-[#8E9C78] drop-shadow-[0_0_15px_rgba(142,156,120,0.2)]">{t.phil4}</span>
            </motion.h2>
          </div>
        </section>

        { }
        <section id="protocol" className="py-20 md:py-32 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16 md:mb-24 px-2">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3 md:mb-4">{t.protTitle}</h2>
              <p className="text-zinc-400 text-sm md:text-base">{t.protDesc}</p>
            </div>

            <div className="space-y-16 md:space-y-32">
              {[
                {
                  step: t.prot1Tag, title: t.prot1Title, desc: t.prot1Desc, viz: (
                    <div className="w-full aspect-video rounded-[1rem] border border-white/5 flex items-center justify-center overflow-hidden bg-[#111] relative shadow-inner">
                      <div className="w-32 h-32 border border-[#8E9C78]/30 rounded-full border-dashed" />
                      <div className="w-48 h-48 border border-[#8E9C78]/20 rounded-full border-dashed absolute" />
                    </div>
                  )
                },
                {
                  step: t.prot2Tag, title: t.prot2Title, desc: t.prot2Desc, viz: (
                    <div className="w-full aspect-video rounded-[1rem] border border-white/5 flex items-center justify-center overflow-hidden bg-[#111] relative shadow-inner">
                      <div className="w-full h-full bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
                      <div className="absolute w-full h-[2px] bg-[#8E9C78] shadow-[0_0_15px_#8E9C78]" />
                    </div>
                  )
                },
                {
                  step: t.prot3Tag, title: t.prot3Title, desc: t.prot3Desc, viz: (
                    <div className="w-full aspect-video rounded-[1rem] border border-white/5 flex items-center justify-center overflow-hidden bg-[#111] relative shadow-inner">
                      <svg viewBox="0 0 200 50" className="w-full h-24 stroke-[#8E9C78] fill-transparent stroke-[2px]">
                        <motion.path
                          d="M 0,25 C 25,25 25,5 50,5 C 75,5 75,45 100,45 C 125,45 125,25 150,25 C 175,25 175,25 200,25"
                          initial={{ strokeDasharray: "400", strokeDashoffset: "400" }}
                          animate={{ strokeDashoffset: 0 }}
                          transition={{ duration: 3, ease: "easeInOut" }}
                          style={{ filter: 'drop-shadow(0px 0px 4px rgba(142,156,120,0.5))' }}
                        />
                      </svg>
                    </div>
                  )
                },
              ].map((protocol, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20%" }}
                  transition={{ duration: isMobile ? 0.5 : 0.8 }}
                  className="sticky top-16 md:top-32 bg-[#0A0A0A] p-6 sm:p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col md:flex-row items-center gap-8 md:gap-12 group hover:border-[#8E9C78]/20 transition-colors motion-gpu"
                  style={{ zIndex: 10 + i }}
                >
                  <div className="flex-1 space-y-4 md:space-y-6 w-full">
                    <div className="font-mono text-[#8E9C78] text-[10px] md:text-xs font-bold tracking-widest border border-[#8E9C78]/30 bg-[#111] px-2 md:px-3 py-1 rounded w-fit">{protocol.step}</div>
                    <h3 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">{protocol.title}</h3>
                    <p className="text-zinc-400 leading-relaxed font-light text-[13px] md:text-base max-w-md">{protocol.desc}</p>
                  </div>
                  <div className="flex-1 w-full">
                    {protocol.viz}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        { }
        <section className="py-20 md:py-32 px-4 sm:px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
            className="max-w-5xl mx-auto bg-[#111] border border-white/5 rounded-[2rem] md:rounded-[3rem] p-8 sm:p-12 md:p-24 text-center relative overflow-hidden shadow-[0_0_80px_rgba(142,156,120,0.05)] will-change-transform will-change-opacity"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] md:w-[80%] md:h-[80%] bg-[radial-gradient(circle,_rgba(142,156,120,0.1)_0%,_transparent_70%)] rounded-[100%] pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4 md:mb-8 leading-tight">
                {t.ctaTitle}
              </h2>
              <p className="text-zinc-400 text-[13px] sm:text-sm md:text-base font-light mb-8 md:mb-12 max-w-xl leading-relaxed">
                {t.ctaDesc}
              </p>
              <Link
                to="/auth"
                className="group relative overflow-hidden inline-flex items-center gap-3 bg-[#8E9C78] text-[#0A0A0A] px-8 py-4 rounded-full text-[15px] font-bold hover:scale-[1.02] transition-transform"
              >

                <span className="relative z-10">{t.ctaBtn}</span>
                <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </section>

        <footer className="relative bg-black pt-20 pb-10 px-6 overflow-hidden">
          { }
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

              { }
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex items-center gap-2"
              >
                <img src="/devsboard.png" alt="Logo" className="w-5 h-5 grayscale opacity-80" />
                <span className="text-white text-sm font-medium tracking-widest uppercase">DevsBoard</span>
              </motion.div>

              { }
              <div className="w-full h-[1px] bg-white/[0.03]" />

              { }
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
                    {t.footerMade} <a href="https://github.com/icaroCodes" className="text-zinc-500 hover:text-white transition-colors duration-500">IcaroCodes</a>
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </footer>

      </div>
  );
}
