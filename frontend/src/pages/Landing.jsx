import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, CheckCircle2, Users, Check, X, AlertTriangle, ChevronDown } from 'lucide-react';
import LandingMobile from './LandingMobile';
import FeedbackWall from '../components/FeedbackWall';
import AskAnything from '../components/AskAnything';

const IconGitHub = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const IconGoogle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

function OAuthLoginDropdown({ visible, onLogin, align = 'right', lang = 'pt' }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute top-full mt-2 z-[99999] w-[260px] ${align === 'right' ? 'right-0' : 'left-0'
            }`}
          style={{ pointerEvents: 'auto' }}
        >
          <div className="bg-[#111] border border-white/10 rounded-2xl p-3 shadow-[0_16px_48px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl">
            <p className="text-[10px] font-semibold text-zinc-500 px-2 mb-2">
              {lang === 'pt' ? 'Entrar com' : 'Sign in with'}
            </p>
            <button
              onClick={() => onLogin('github')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] text-white text-[13px] font-medium transition-all duration-200 mb-1.5 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.1] transition-colors">
                <IconGitHub />
              </div>
              <span>GitHub</span>
            </button>
            <button
              onClick={() => onLogin('google')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] text-white text-[13px] font-medium transition-all duration-200 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.1] transition-colors">
                <IconGoogle />
              </div>
              <span>Google</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


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
    coffeeTitle1: "Movido a café.",
    coffeeDesc: "O DevsBoard é feito por um dev solo, sem anúncios e sem paywall. Se ele te ajuda, um café mantém ele de pé.",
    coffeeBtn: "Pague um café",
    coffeeMeta: "PIX · sem valor mínimo",
    footerMade: "Criado por",
    chartBalance: "Meu saldo",
    socialProof1: "Mais de 50 usuários já organizam projetos, finanças e rotina no DevsBoard.",
    socialProof2: "Desenvolvido por um dev indie solo, sem anúncios, sem investidores e sem paywall escondido.",
    socialProof3: "Open source, gratuito e evoluindo constantemente com feedback da comunidade.",
    vsTitle: "Você não deveria precisar de vários apps pra ser produtivo.",
    vsBottom: "Enquanto outras plataformas focam em uma única coisa, o DevsBoard conecta produtividade pessoal, colaboração e organização em um único workspace.",
    feat5Title: "Produtividade que recompensa.",
    feat5Desc: "Complete tarefas, alcance metas e desbloqueie conquistas inspiradas na PlayStation.",
    feat6Title: "Seu workspace do seu jeito.",
    feat6Desc: "Customize aparência, áudio e ambiente para criar uma experiência imersiva.",
    fbLabel: "Mural",
    fbTitle: "Vozes de quem usa.",
    fbDesc: "Sem testemunhos fabricados. Cada palavra abaixo foi deixada por alguém de verdade.",
    fbEmpty: "Sem feedbacks ainda. Seja o primeiro.",
    fbWrite: "Deixar feedback",
    fbModalTitle: "Deixe seu feedback",
    fbModalDesc: "Conte em poucas palavras o que o DevsBoard mudou no seu dia.",
    fbName: "Seu nome",
    fbNamePh: "Como gostaria de ser creditado",
    fbPhoto: "Foto (opcional)",
    fbPhotoPh: "Clique no avatar para enviar uma foto · JPG, PNG ou WebP até 2 MB",
    fbRating: "Sua avaliação",
    fbText: "Sua mensagem",
    fbTextPh: "O que você quer dizer?",
    fbCancel: "Cancelar",
    fbSubmit: "Publicar",
    fbSubmitting: "Enviando…",
    fbThanks: "Publicado. Obrigado por compartilhar.",
    fbErrorGeneric: "Não foi possível enviar. Tente novamente.",
    targetTitle: "Feito para pessoas que constroem coisas.",
    targetIdeal: "Ideal para:",
    targets: ["Desenvolvedores", "Times pequenos", "Startups", "Freelancers", "Estudantes", "Indie hackers", "Criadores", "Pessoas organizadas", "Quem odeia trocar entre 15 apps"],
    faqTitle: "Perguntas Frequentes",
    faq1Q: "O DevsBoard é realmente gratuito?",
    faq1A: "Sim. Não existe assinatura, paywall escondido ou venda de recursos premium.",
    faq2Q: "Tem anúncios?",
    faq2A: "Não. O DevsBoard não possui anúncios.",
    faq3Q: "Posso usar com minha equipe?",
    faq3A: "Sim. Você pode criar times, convidar membros e colaborar em tempo real.",
    faq4Q: "O projeto é open source?",
    faq4A: "Sim. O código é aberto e o desenvolvimento acontece publicamente.",
    faq5Q: "Funciona no celular?",
    faq5A: "Sim. A interface é adaptada para mobile e desktop.",
    faq6Q: "Posso usar para produtividade pessoal?",
    faq6A: "Sim. Você pode usar sozinho ou em equipe.",
    faq7Q: "O DevsBoard substitui Notion ou Trello?",
    faq7A: "A proposta é centralizar produtividade pessoal, colaboração, projetos e organização em um único workspace moderno."
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
    coffeeTitle1: "Fueled by coffee.",
    coffeeDesc: "DevsBoard is built by one developer, no ads and no paywall. If it helps you, a coffee keeps it going.",
    coffeeBtn: "Buy me a coffee",
    coffeeMeta: "PIX · no minimum",
    footerMade: "Made by",
    chartBalance: "Balance",
    socialProof1: "Over 50 users already organize projects, finances, and routines in DevsBoard.",
    socialProof2: "Built by a solo indie dev, ad-free, no investors, and no hidden paywalls.",
    socialProof3: "Open source, free, and constantly evolving with community feedback.",
    vsTitle: "You shouldn't need multiple apps to be productive.",
    vsBottom: "While other platforms focus on a single thing, DevsBoard connects personal productivity, collaboration, and organization in one workspace.",
    feat5Title: "Productivity that rewards you.",
    feat5Desc: "Complete tasks, reach goals, and unlock PlayStation-inspired achievements.",
    feat6Title: "Your workspace, your way.",
    feat6Desc: "Customize appearance, audio, and environment to create an immersive experience.",
    fbLabel: "Wall",
    fbTitle: "Voices from real users.",
    fbDesc: "No fabricated testimonials. Every word below was left by someone real.",
    fbEmpty: "No feedback yet. Be the first.",
    fbWrite: "Leave feedback",
    fbModalTitle: "Leave your feedback",
    fbModalDesc: "In a few words, tell us what DevsBoard changed in your day.",
    fbName: "Your name",
    fbNamePh: "How you'd like to be credited",
    fbPhoto: "Photo (optional)",
    fbPhotoPh: "Click the avatar to upload · JPG, PNG, or WebP up to 2 MB",
    fbRating: "Your rating",
    fbText: "Your message",
    fbTextPh: "What do you want to say?",
    fbCancel: "Cancel",
    fbSubmit: "Publish",
    fbSubmitting: "Sending…",
    fbThanks: "Published. Thanks for sharing.",
    fbErrorGeneric: "Couldn't send. Please try again.",
    targetTitle: "Built for people who build things.",
    targetIdeal: "Ideal for:",
    targets: ["Developers", "Small teams", "Startups", "Freelancers", "Students", "Indie hackers", "Creators", "Organized people", "Anyone who hates switching between 15 apps"],
    faqTitle: "Frequently Asked Questions",
    faq1Q: "Is DevsBoard really free?",
    faq1A: "Yes. There is no subscription, hidden paywall, or premium features for sale.",
    faq2Q: "Are there ads?",
    faq2A: "No. DevsBoard has no ads.",
    faq3Q: "Can I use it with my team?",
    faq3A: "Yes. You can create teams, invite members, and collaborate in real time.",
    faq4Q: "Is the project open source?",
    faq4A: "Yes. The code is open and development happens publicly.",
    faq5Q: "Does it work on mobile?",
    faq5A: "Yes. The interface is adapted for mobile and desktop.",
    faq6Q: "Can I use it for personal productivity?",
    faq6A: "Yes. You can use it alone or with a team.",
    faq7Q: "Does DevsBoard replace Notion or Trello?",
    faq7A: "The goal is to centralize personal productivity, collaboration, projects, and organization in a single modern workspace."
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
          <div className="text-[10px] text-zinc-500 font-mono mb-1">{t.chartBalance}</div>
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

const AchievementAnimation = () => {
  return (
    <div className="h-48 relative flex items-center justify-center p-4">
      <div className="w-full h-full max-w-[220px] relative flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute w-32 h-32 rounded-full border border-dashed border-[#8E9C78]/30"
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-20 h-20 bg-gradient-to-br from-[#8E9C78]/20 to-[#8E9C78]/5 rounded-2xl border border-[#8E9C78]/40 shadow-[0_0_30px_rgba(142,156,120,0.3)] flex items-center justify-center rotate-12"
        >
          <Sparkles size={32} className="text-[#8E9C78]" />
        </motion.div>
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-2 bg-[#111] border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg"
        >
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-[10px] font-bold font-mono text-zinc-300">PLATINA</span>
        </motion.div>
      </div>
    </div>
  );
};

const CustomizationAnimation = () => {
  return (
    <div className="h-48 relative flex items-center justify-center p-4">
      <div className="w-full max-w-[200px] h-32 bg-[#111] border border-white/10 rounded-xl relative overflow-hidden flex flex-col shadow-lg">
        {/* Fake wallpaper */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 to-transparent" />
        
        {/* Fake topbar */}
        <div className="w-full h-8 bg-black/40 backdrop-blur-md flex items-center justify-between px-3 relative z-10 border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white/20"></div>
            <div className="w-2 h-2 rounded-full bg-white/20"></div>
          </div>
          <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
        </div>
        
        {/* Fake content */}
        <div className="flex-1 p-3 flex flex-col gap-2 relative z-10">
          <div className="w-20 h-4 bg-white/10 rounded"></div>
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10"></div>
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10"></div>
          </div>
        </div>
        
        {/* Music Player Mini */}
        <motion.div 
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-2 right-2 w-24 h-8 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg flex items-center px-2 gap-2"
        >
          <div className="w-4 h-4 rounded-full bg-[#8E9C78]/50 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <div className="w-full h-1 bg-white/20 rounded-full"></div>
            <div className="w-2/3 h-1 bg-white/10 rounded-full"></div>
          </div>
        </motion.div>
      </div>
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

const FAQItem = ({ faq }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 cursor-pointer font-medium text-white select-none text-left focus:outline-none focus:bg-white/[0.02] transition-colors"
      >
        <span className="text-base md:text-lg pr-4">{faq.q}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex-shrink-0 text-zinc-500"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-6 pb-6 pt-0 text-zinc-400 text-sm md:text-base leading-relaxed">
              {faq.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Landing() {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'pt');
  const t = translations[lang];
  const [searchParams] = useSearchParams();

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const toggleLang = () => setLang((prev) => (prev === 'pt' ? 'en' : 'pt'));

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loginWithOAuth } = useAuth();

  // Login dropdown state
  const [loginDropdown, setLoginDropdown] = useState(null); //'enter' |'create' | null
  const dropdownTimeoutRef = useRef(null);

  const showDropdown = (id) => {
    clearTimeout(dropdownTimeoutRef.current);
    setLoginDropdown(id);
  };
  const hideDropdown = () => {
    dropdownTimeoutRef.current = setTimeout(() => setLoginDropdown(null), 200);
  };

  // Login error from OAuth redirect
  const [loginError, setLoginError] = useState(null);
  useEffect(() => {
    const err = searchParams.get('login_error');
    if (err) {
      setLoginError(
        err === 'auth_failed'
          ? (lang === 'pt' ? 'Falha na autenticação. Tente novamente.' : 'Authentication failed. Try again.')
          : (lang === 'pt' ? 'Erro no login. Tente novamente.' : 'Login error. Try again.')
      );
      // Auto-dismiss after 5s
      const t = setTimeout(() => setLoginError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [searchParams, lang]);

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

  if (isMobile) {
    return <LandingMobile />;
  }

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
              <img src="/devsboard.png" alt="Logo" className="w-8 h-8 object-contain" />
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
                  className="relative px-6 py-2 rounded-xl border border-[#8E9C78]/30 bg-[#8E9C78]/10 text-[#8E9C78] text-[13px] font-bold transition-colors hover:border-[#8E9C78]/50 whitespace-nowrap"
                >
                  {t.navDashboard}
                </motion.button>
              </Link>
            ) : (
              <>
                <div
                  className="hidden sm:block relative"
                  onMouseEnter={() => showDropdown('enter')}
                  onMouseLeave={hideDropdown}
                >
                  <button
                    className="px-4 py-2 text-[13px] font-medium text-zinc-400 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {t.navLogin}
                  </button>
                  <OAuthLoginDropdown
                    visible={loginDropdown === 'enter'}
                    onLogin={loginWithOAuth}
                    align="right"
                    lang={lang}
                  />
                </div>

                <div
                  className="relative"
                  onMouseEnter={() => showDropdown('create')}
                  onMouseLeave={hideDropdown}
                >
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.03)" }}
                    whileTap={{ scale: 0.98 }}
                    className="relative px-5 py-2 rounded-xl border border-white/10 text-zinc-300 text-[13px] font-medium transition-colors hover:border-white/30 hover:text-white whitespace-nowrap cursor-pointer"
                  >
                    {t.navStart}
                  </motion.button>
                  <OAuthLoginDropdown
                    visible={loginDropdown === 'create'}
                    onLogin={loginWithOAuth}
                    align="right"
                    lang={lang}
                  />
                </div>
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
          className="hidden md:block w-full bg-[#8E9C78]/10 border-t border-white/[0.05] overflow-hidden"
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
            <a
              href="#features"
              onClick={(e) => scrollToSection(e, '#features')}
              className="text-[9.5px] sm:text-[11px] md:text-[12px] font-bold text-[#8E9C78] hover:text-white transition-colors flex items-center gap-1 group whitespace-nowrap"
            >
              {t.bannerLink}
              <ArrowRight size={10} className="md:w-3 md:h-3 group-hover:translate-x-0.5 transition-transform" />
            </a>
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
                <span className="text-white font-bold text-[18px] sm:text-[20px] tracking-tight leading-none font-sans">
                  DevsBoard
                </span>
                <span className="text-zinc-500 text-[8px] sm:text-[9px] mt-2 font-mono">
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
                  <span className="text-zinc-600 font-mono text-[10px] sm:text-[11px] font-medium w-4 opacity-70">
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

              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={() => { setIsMobileMenuOpen(false); loginWithOAuth('github'); }}
                  className="w-full py-4 sm:py-5 rounded-[1.2rem] bg-white text-black text-[15px] font-bold tracking-[-0.01em] text-center hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 cursor-pointer"
                >
                  <IconGitHub />
                  <span>{lang === 'pt' ? 'Entrar com GitHub' : 'Sign in with GitHub'}</span>
                </button>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); loginWithOAuth('google'); }}
                  className="w-full py-4 sm:py-5 rounded-[1.2rem] bg-[#1a1a1a] text-white border border-white/10 text-[15px] font-bold tracking-[-0.01em] text-center hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 cursor-pointer"
                >
                  <IconGoogle />
                  <span>{lang === 'pt' ? 'Entrar com Google' : 'Sign in with Google'}</span>
                </button>
              </div>

              <div className="flex justify-between items-center w-full px-1 mb-2">
                <span className="text-zinc-600 font-medium text-[9px]">
                  DevsBoard
                </span>
                <span className="text-zinc-600 font-medium text-[9px]">
                  &copy; {new Date().getFullYear()}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      { }
      <section className="pt-24 md:pt-40 pb-16 md:pb-20 px-4 sm:px-6 min-h-[90vh] md:min-h-[95vh] flex flex-col items-center justify-center relative z-[50]">
        { }
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-[radial-gradient(circle,_rgba(142,156,120,0.1)_0%,_transparent_70%)] rounded-full pointer-events-none" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-4xl mx-auto text-center relative z-30 motion-gpu"
        >
          <motion.div variants={fadeIn} className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3 py-1.5 sm:py-1 rounded-full bg-white/5 border border-white/10 text-[11px] md:text-xs font-medium text-[#8E9C78] mb-5 md:mb-8 shadow-[0_0_20px_rgba(142,156,120,0.15)] md:shadow-none">
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
            {user ? (
              <Link
                to="/dashboard"
                className="group flex items-center justify-center gap-1.5 sm:gap-2 bg-white text-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-[12px] sm:text-sm font-medium hover:scale-[1.02] transition-transform whitespace-nowrap"
              >
                {t.heroBtnDash}
                <ArrowRight className="w-[14px] h-[14px] sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <div
                className="relative"
                onMouseEnter={() => showDropdown('hero')}
                onMouseLeave={hideDropdown}
              >
                <button
                  className="group flex items-center justify-center gap-1.5 sm:gap-2 bg-white text-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-[12px] sm:text-sm font-medium hover:scale-[1.02] transition-transform whitespace-nowrap cursor-pointer"
                >
                  {t.heroBtnStart}
                  <ArrowRight className="w-[14px] h-[14px] sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <OAuthLoginDropdown
                  visible={loginDropdown === 'hero'}
                  onLogin={loginWithOAuth}
                  align="left"
                  lang={lang}
                />
              </div>
            )}
            <a href="#features" onClick={(e) => scrollToSection(e, '#features')} className="text-[12px] sm:text-sm font-medium text-zinc-400 hover:text-white px-3 sm:px-6 py-2.5 sm:py-3 transition-colors whitespace-nowrap">
              {t.heroBtnDiscover}
            </a>
          </motion.div>

          { }
          <motion.div variants={fadeIn} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 opacity-80">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex -space-x-2">
                {['/icaro.png', '/nobre.png', '/emanuel.png'].map((src, i) => (
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
          className="hidden sm:block text-[10px] md:text-xs font-medium text-zinc-500 mb-8 md:mb-10 text-center px-4"
        >
          {t.sponsors}
        </motion.p>
        <InfiniteSponsors />
      </section>

      {/* Social Proof */}
      <section className="py-12 md:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { text: t.socialProof1, icon: <Users size={20} className="text-[#8E9C78]" /> },
              { text: t.socialProof2, icon: <Sparkles size={20} className="text-[#8E9C78]" /> },
              { text: t.socialProof3, icon: <IconGitHub /> }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-[#111] border border-white/5 rounded-2xl p-6 text-center flex flex-col items-center gap-4 hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#8E9C78]/10 flex items-center justify-center">
                  {item.icon}
                </div>
                <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 md:py-24 px-4 sm:px-6 bg-[#0a0a0a] border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white mb-4">{t.vsTitle}</h2>
          </div>
          
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[600px] w-full bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="grid grid-cols-5 border-b border-white/10 bg-white/[0.02]">
                <div className="p-4 md:p-6 font-semibold text-zinc-300 text-left"></div>
                <div className="p-4 md:p-6 font-bold text-white text-center flex flex-col items-center justify-center border-l border-white/5 bg-[#8E9C78]/5">DevsBoard</div>
                <div className="p-4 md:p-6 font-medium text-zinc-500 text-center border-l border-white/5">Notion</div>
                <div className="p-4 md:p-6 font-medium text-zinc-500 text-center border-l border-white/5">Trello</div>
                <div className="p-4 md:p-6 font-medium text-zinc-500 text-center border-l border-white/5">Linear</div>
              </div>
              
              {[
                { label: lang === 'pt' ? '100% gratuito' : '100% Free', vals: [1, 2, 2, 2] },
                { label: lang === 'pt' ? 'Sem anúncios' : 'Ad-free', vals: [1, 1, 0, 1] },
                { label: lang === 'pt' ? 'Finanças integradas' : 'Integrated Finances', vals: [1, 0, 0, 0] },
                { label: lang === 'pt' ? 'Rotinas e hábitos' : 'Routines & Habits', vals: [1, 0, 0, 0] },
                { label: lang === 'pt' ? 'Projetos completos' : 'Full Projects', vals: [1, 2, 0, 1] },
                { label: lang === 'pt' ? 'Realtime colaborativo' : 'Real-time Collaboration', vals: [1, 1, 1, 1] },
                { label: lang === 'pt' ? 'Gamificação' : 'Gamification', vals: [1, 0, 0, 0] },
                { label: lang === 'pt' ? 'Wallpaper + áudio' : 'Wallpaper + Audio', vals: [1, 0, 0, 0] },
                { label: lang === 'pt' ? 'Feito por dev indie' : 'Made by indie dev', vals: [1, 0, 0, 0] },
              ].map((row, i) => (
                <div key={i} className={`grid grid-cols-5 border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i === 8 ? 'border-none' : ''}`}>
                  <div className="p-4 text-sm md:text-base font-medium text-zinc-400 text-left flex items-center">{row.label}</div>
                  <div className="p-4 flex items-center justify-center border-l border-white/5 bg-[#8E9C78]/5">
                    {row.vals[0] === 1 ? <Check size={20} className="text-[#8E9C78]" /> : row.vals[0] === 2 ? <AlertTriangle size={20} className="text-yellow-500" /> : <X size={20} className="text-red-500/50" />}
                  </div>
                  <div className="p-4 flex items-center justify-center border-l border-white/5">
                    {row.vals[1] === 1 ? <Check size={20} className="text-zinc-600" /> : row.vals[1] === 2 ? <AlertTriangle size={20} className="text-yellow-500/50" /> : <X size={20} className="text-red-500/50" />}
                  </div>
                  <div className="p-4 flex items-center justify-center border-l border-white/5">
                    {row.vals[2] === 1 ? <Check size={20} className="text-zinc-600" /> : row.vals[2] === 2 ? <AlertTriangle size={20} className="text-yellow-500/50" /> : <X size={20} className="text-red-500/50" />}
                  </div>
                  <div className="p-4 flex items-center justify-center border-l border-white/5">
                    {row.vals[3] === 1 ? <Check size={20} className="text-zinc-600" /> : row.vals[3] === 2 ? <AlertTriangle size={20} className="text-yellow-500/50" /> : <X size={20} className="text-red-500/50" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-8 text-center max-w-2xl mx-auto">
            <p className="text-sm md:text-base text-zinc-400 font-light leading-relaxed">
              {t.vsBottom}
            </p>
          </div>
        </div>
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

            {/* Feature 5 - Achievements */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
              className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:border-white/10 transition-colors"
            >
              <div className="mb-12">
                <AchievementAnimation />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{t.feat5Title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                {t.feat5Desc}
              </p>
            </motion.div>

            {/* Feature 6 - Customization */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
              className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:border-white/10 transition-colors lg:col-span-2"
            >
              <div className="mb-12">
                <CustomizationAnimation />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{t.feat6Title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                {t.feat6Desc}
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
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8E9C78]/10 text-[#8E9C78] text-[11px] font-bold border border-[#8E9C78]/20 mb-4 xl:mb-6">
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
        <div className="absolute inset-0 z-0 pointer-events-none opacity-35" style={{ backgroundImage: 'url("/background.png")', backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', filter: 'contrast(1.05)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/70 via-[#000000]/40 to-[#000000] z-0 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.5)_70%,_#000_100%)] z-0 pointer-events-none" />
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
                  <div className="font-mono text-[#8E9C78] text-[10px] md:text-xs font-bold border border-[#8E9C78]/30 bg-[#111] px-2 md:px-3 py-1 rounded w-fit">{protocol.step}</div>
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

      <FeedbackWall t={t} lang={lang} />

      {/* Target Audience */}
      <section className="py-20 md:py-32 px-4 sm:px-6 bg-[#000000] border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-6"
          >
            {t.targetTitle}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-500 font-medium mb-12 text-sm md:text-base uppercase tracking-widest"
          >
            {t.targetIdeal}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex flex-wrap justify-center gap-3 md:gap-4"
          >
            {t.targets.map((target, i) => (
              <div key={i} className="px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-sm md:text-base font-medium hover:bg-white/10 transition-colors hover:text-white cursor-default">
                {target}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Ask anything — interactive chat (replaces classic FAQ) */}
      <AskAnything t={t} lang={lang} />

      {/* Buy me a coffee — sage spotlight */}
      <section className="pt-32 md:pt-48 pb-24 md:pb-32 px-6 relative z-[50] bg-black overflow-hidden">
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] md:w-[720px] aspect-square bg-[radial-gradient(circle,_rgba(142,156,120,0.22)_0%,_rgba(142,156,120,0.08)_35%,_transparent_70%)] rounded-full pointer-events-none blur-[50px]"
        />
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] md:w-[320px] aspect-square bg-[radial-gradient(circle,_rgba(142,156,120,0.28)_0%,_transparent_70%)] rounded-full pointer-events-none blur-[30px]"
        />
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-[720px] mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 mb-7 md:mb-9">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#8E9C78] opacity-70 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#8E9C78]" />
            </span>
            <span className="text-[11px] text-[#8E9C78]/80 font-light tracking-wide">PIX</span>
          </div>
          <h2 className="text-[36px] sm:text-[48px] md:text-[60px] font-light text-white tracking-[-0.025em] leading-[1.05]">
            {t.coffeeTitle1}
          </h2>
          <p className="mt-6 md:mt-7 mx-auto max-w-[480px] text-[15px] md:text-[16px] leading-[1.55] text-white/55 font-light">
            {t.coffeeDesc}
          </p>
          <Link
            to="/support"
            className="group mt-10 md:mt-12 inline-flex items-center gap-2 bg-white text-black px-7 py-3.5 rounded-full text-[14px] font-medium hover:bg-white active:scale-[0.99] transition-all shadow-[0_0_0_1px_rgba(142,156,120,0.0),0_18px_50px_-12px_rgba(142,156,120,0.55)] hover:shadow-[0_0_0_1px_rgba(142,156,120,0.4),0_22px_60px_-12px_rgba(142,156,120,0.75)]"
          >
            <span>{t.coffeeBtn}</span>
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <p className="mt-6 text-[12px] text-white/35 font-light">{t.coffeeMeta}</p>
        </motion.div>
      </section>

      { }
      <section className="py-20 md:py-32 px-4 sm:px-6 relative z-[50] bg-black">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
          className="max-w-5xl mx-auto bg-[#111] border border-white/5 rounded-[2rem] md:rounded-[3rem] p-8 sm:p-12 md:p-24 text-center relative shadow-[0_0_80px_rgba(142,156,120,0.05)] will-change-transform will-change-opacity"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] md:w-[80%] md:h-[80%] bg-[radial-gradient(circle,_rgba(142,156,120,0.1)_0%,_transparent_70%)] rounded-[100%] pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4 md:mb-8 leading-tight">
              {t.ctaTitle}
            </h2>
            <p className="text-zinc-400 text-[13px] sm:text-sm md:text-base font-light mb-8 md:mb-12 max-w-xl leading-relaxed">
              {t.ctaDesc}
            </p>
            <div
              className="relative inline-block"
              onMouseEnter={() => showDropdown('cta')}
              onMouseLeave={hideDropdown}
            >
              <button
                className="group relative overflow-hidden inline-flex items-center gap-3 bg-[#8E9C78] text-[#0A0A0A] px-8 py-4 rounded-[1.2rem] text-[15px] font-bold hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <span className="relative z-10">{t.ctaBtn}</span>
                <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>
              <OAuthLoginDropdown
                visible={loginDropdown === 'cta'}
                onLogin={loginWithOAuth}
                align="left"
                lang={lang}
              />
            </div>
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
              <span className="text-white text-sm font-medium">DevsBoard</span>
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
              <p className="text-zinc-600 text-[10px]">
                &copy; {new Date().getFullYear()} DevsBoard.
              </p>

              <div className="flex gap-6">
                <p className="text-zinc-700 text-[10px]">
                  {t.footerMade} <a href="https://github.com/icaroCodes" className="text-zinc-500 hover:text-white transition-colors duration-500">IcaroCodes</a>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </footer>

      {/* Login error toast */}
      <AnimatePresence>
        {loginError && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl bg-red-500/15 border border-red-500/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          >
            <p className="text-sm text-red-400 font-medium">{loginError}</p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
