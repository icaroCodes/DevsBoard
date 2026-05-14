import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, CheckCircle2, Users, Check, X, AlertTriangle, ChevronDown, Menu } from 'lucide-react';
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

const translations = {
  pt: {
    heroFree: "100% Grátis",
    heroTitle1: "Organize sua vida",
    heroTitle2: "com o",
    heroDesc: "Cuide das suas tarefas, do seu dinheiro e das suas metas em um só lugar.",
    heroBtnStart: "Criar minha conta",
    heroBtnDash: "Ver meu progresso",
    heroBtnDiscover: "Saber mais",
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
    coffeeEyebrow: "",
    coffeeTitle1: "Movido a café.",
    coffeeTitle2: "",
    coffeeDesc: "Um dev solo, sem anúncios e sem paywall. Se o DevsBoard te ajuda, um café mantém ele de pé.",
    coffeeBtn: "Pague um café",
    coffeeMeta: "PIX · sem valor mínimo",
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
    fbPhotoPh: "Toque no avatar para enviar uma foto · JPG, PNG ou WebP até 2 MB",
    fbRating: "Sua avaliação",
    fbText: "Sua mensagem",
    fbTextPh: "O que você quer dizer?",
    fbCancel: "Cancelar",
    fbSubmit: "Publicar",
    fbSubmitting: "Enviando…",
    fbThanks: "Publicado. Obrigado por compartilhar.",
    fbErrorGeneric: "Não foi possível enviar. Tente novamente.",
    footerMade: "Criado por",
    chartBalance: "Meu saldo",
    socialProof1: "Mais de 50 usuários já organizam projetos, finanças e rotina no DevsBoard.",
    socialProof2: "Desenvolvido por um dev indie solo, sem anúncios e sem paywall.",
    socialProof3: "Open source, gratuito e evoluindo constantemente.",
    vsTitle: "Você não deveria precisar de vários apps pra ser produtivo.",
    vsBottom: "Enquanto outras plataformas focam em uma única coisa, o DevsBoard conecta tudo em um único workspace.",
    feat5Title: "Produtividade que recompensa.",
    feat5Desc: "Complete tarefas, alcance metas e desbloqueie conquistas inspiradas na PlayStation.",
    feat6Title: "Seu workspace do seu jeito.",
    feat6Desc: "Customize aparência, áudio e ambiente para criar uma experiência imersiva.",
    testi1: "“Finalmente uma plataforma que junta produtividade pessoal e trabalho em equipe sem virar uma bagunça.”",
    testi1Author: "— Usuário DevsBoard",
    testi2: "“O realtime do DevsBoard é absurdo. Parece um mix de Linear, Notion e Discord.”",
    testi2Author: "— Desenvolvedor frontend",
    testi3: "“Uso diariamente pra organizar freelas, rotina e metas financeiras.”",
    testi3Author: "— Indie hacker",
    targetTitle: "Feito para pessoas que constroem coisas.",
    targetIdeal: "Ideal para:",
    targets: ["Desenvolvedores", "Times pequenos", "Startups", "Freelancers", "Estudantes", "Indie hackers", "Criadores", "Pessoas organizadas", "Quem odeia trocar de apps"],
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
    faq7Q: "Substitui Notion ou Trello?",
    faq7A: "A proposta é centralizar produtividade, projetos e organização em um único workspace moderno."
  },
  en: {
    heroFree: "100% Free",
    heroTitle1: "Organize your life",
    heroTitle2: "with",
    heroDesc: "Manage your tasks, money and goals in one place.",
    heroBtnStart: "Create my account",
    heroBtnDash: "Go to dashboard",
    heroBtnDiscover: "Learn more",
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
    coffeeEyebrow: "",
    coffeeTitle1: "Fueled by coffee.",
    coffeeTitle2: "",
    coffeeDesc: "One developer, no ads, no paywall. If DevsBoard helps you, a coffee keeps it going.",
    coffeeBtn: "Buy me a coffee",
    coffeeMeta: "PIX · no minimum",
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
    fbPhotoPh: "Tap the avatar to upload · JPG, PNG, or WebP up to 2 MB",
    fbRating: "Your rating",
    fbText: "Your message",
    fbTextPh: "What do you want to say?",
    fbCancel: "Cancel",
    fbSubmit: "Publish",
    fbSubmitting: "Sending…",
    fbThanks: "Published. Thanks for sharing.",
    fbErrorGeneric: "Couldn't send. Please try again.",
    ctaTitle: "Get your routine in order.",
    ctaDesc: "Your tasks and money organized now.",
    ctaBtn: "Start now",
    footerMade: "Made by",
    chartBalance: "Balance",
    socialProof1: "Over 50 users already organize projects, finances, and routines in DevsBoard.",
    socialProof2: "Built by a solo indie dev, ad-free, no investors, and no hidden paywalls.",
    socialProof3: "Open source, free, and constantly evolving with community feedback.",
    vsTitle: "You shouldn't need multiple apps.",
    vsBottom: "While other platforms focus on a single thing, DevsBoard connects everything in one workspace.",
    feat5Title: "Productivity that rewards you.",
    feat5Desc: "Complete tasks, reach goals, and unlock PlayStation-inspired achievements.",
    feat6Title: "Your workspace, your way.",
    feat6Desc: "Customize appearance, audio, and environment to create an immersive experience.",
    testi1: "“Finally a platform that brings personal productivity and teamwork together without becoming a mess.”",
    testi1Author: "— DevsBoard User",
    testi2: "“DevsBoard's real-time is absurd. It feels like a mix of Linear, Notion, and Discord.”",
    testi2Author: "— Frontend Developer",
    testi3: "“I use it daily to organize freelancing, routines, and financial goals.”",
    testi3Author: "— Indie hacker",
    targetTitle: "Built for people who build things.",
    targetIdeal: "Ideal for:",
    targets: ["Developers", "Small teams", "Startups", "Freelancers", "Students", "Indie hackers", "Creators", "Organized people", "Anyone who hates switching apps"],
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

const FinancialChartAnimation = ({ lang = 'pt' }) => {
  const t = translations[lang];
  return (
    <div className="h-40 relative flex flex-col items-center justify-end p-4 bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden shadow-inner">
      <div className="absolute top-4 left-4 w-full flex justify-between pr-8 items-start">
        <div>
          <div className="text-[10px] text-zinc-500 font-mono mb-1">{t.chartBalance}</div>
          <div className="text-xl font-bold text-white tracking-tight flex items-center gap-1">
            <span className="text-zinc-500 text-sm">R$</span>
            <span>8.450</span>
            <span className="text-zinc-500 text-sm">,00</span>
          </div>
        </div>
      </div>
      <div className="flex items-end gap-1.5 w-full h-16 opacity-80 z-10 relative left-1/2 -translate-x-1/2 px-2">
        {[30, 50, 40, 70, 55, 90, 65].map((height, i) => (
          <div key={i} style={{ height: `${height}%` }} className="flex-1 bg-gradient-to-t from-transparent via-[#8E9C78]/40 to-[#8E9C78]/90 rounded-t-sm" />
        ))}
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#0A0A0A] to-transparent z-20 pointer-events-none" />
    </div>
  );
};

const TrelloDragAndDropAnimation = () => {
  return (
    <div className="h-40 relative flex items-center justify-center p-2">
      <div className="flex gap-4 w-full max-w-[200px] h-32">
        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl p-2 flex flex-col gap-2">
          <div className="w-10 h-1.5 bg-white/10 rounded-full mb-1"></div>
          <div className="w-full h-8 rounded-lg border-2 border-dashed border-[#8E9C78]/20 bg-[#8E9C78]/5"></div>
          <div className="w-full h-8 bg-[#111] border border-white/5 rounded-lg shadow-sm opacity-30"></div>
        </div>
        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl p-2 flex flex-col gap-2 relative">
          <div className="w-10 h-1.5 bg-[#8E9C78]/30 rounded-full mb-1"></div>
          <motion.div
            animate={{ x: [0, -90, -90, 0, 0], y: [0, 6, 6, 0, 0], rotate: [0, -4, -4, 0, 0], scale: [1, 1.05, 1.05, 1, 1] }}
            transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
            className="w-[calc(100%-16px)] h-8 absolute top-8 left-2 bg-[#1a1a1a] border border-[#8E9C78]/40 rounded-lg shadow-[0_8px_20px_rgba(0,0,0,0.6)] z-20 flex flex-col px-2 py-1.5 gap-1.5"
          >
            <div className="w-6 h-1 bg-[#8E9C78]/80 rounded-full"></div>
            <div className="w-10 h-1 bg-white/20 rounded-full"></div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

function LoginBottomSheet({ visible, onClose, onLogin, lang }) {
  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/10 rounded-t-3xl p-6 z-[201] pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
            <h3 className="text-white font-bold text-xl mb-2 text-center">
              {lang === 'pt' ? 'Acessar DevsBoard' : 'Sign in to DevsBoard'}
            </h3>
            <p className="text-zinc-400 text-sm text-center mb-6">
              {lang === 'pt' ? 'Escolha como deseja continuar.' : 'Choose how you want to continue.'}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { onLogin('github'); onClose(); }}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-[1rem] bg-white text-black font-bold text-[15px] active:scale-[0.98] transition-transform"
              >
                <IconGitHub />
                <span>{lang === 'pt' ? 'Continuar com GitHub' : 'Continue with GitHub'}</span>
              </button>
              <button
                onClick={() => { onLogin('google'); onClose(); }}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-[1rem] bg-[#111] text-white border border-white/10 font-bold text-[15px] active:scale-[0.98] transition-transform"
              >
                <IconGoogle />
                <span>{lang === 'pt' ? 'Continuar com Google' : 'Continue with Google'}</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const FAQItem = ({ faq }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 cursor-pointer font-medium text-white select-none text-left focus:outline-none focus:bg-white/[0.02] transition-colors"
      >
        <span className="text-sm pr-4">{faq.q}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex-shrink-0 text-[#8E9C78]"
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
            <div className="px-4 pb-4 pt-0 text-zinc-400 text-sm leading-relaxed">
              {faq.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function LandingMobile() {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'pt');
  const t = translations[lang];
  const { user, loginWithOAuth } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const toggleLang = () => setLang(prev => prev === 'pt' ? 'en' : 'pt');

  const scrollToSection = (e, id) => {
    e.preventDefault();
    setIsMenuOpen(false);
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const comparisonData = [
    { label: lang === 'pt' ? '100% gratuito' : '100% Free', vals: [1, 2, 2, 2] },
    { label: lang === 'pt' ? 'Sem anúncios' : 'Ad-free', vals: [1, 1, 0, 1] },
    { label: lang === 'pt' ? 'Finanças integradas' : 'Integrated Finances', vals: [1, 0, 0, 0] },
    { label: lang === 'pt' ? 'Rotinas e hábitos' : 'Routines & Habits', vals: [1, 0, 0, 0] },
    { label: lang === 'pt' ? 'Projetos completos' : 'Full Projects', vals: [1, 2, 0, 1] },
    { label: lang === 'pt' ? 'Realtime colaborativo' : 'Real-time Collaboration', vals: [1, 1, 1, 1] },
    { label: lang === 'pt' ? 'Gamificação' : 'Gamification', vals: [1, 0, 0, 0] },
    { label: lang === 'pt' ? 'Wallpaper + áudio' : 'Wallpaper + Audio', vals: [1, 0, 0, 0] },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-300 font-sans selection:bg-[#8E9C78]/30 selection:text-white pb-20 overflow-x-hidden">
      
      {/* Mobile Header */}
      <nav className="fixed top-0 left-0 right-0 z-[60] bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/[0.06] py-3 px-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/devsboard.png" alt="Logo" className="w-7 h-7 object-contain" />
            <span className="text-white font-bold text-[15px] tracking-tight">DevsBoard</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex relative items-center bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.05] rounded-full p-[2px] transition-colors">
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
              <Link to="/dashboard" className="px-4 py-1.5 rounded-full bg-[#8E9C78]/10 text-[#8E9C78] text-[12px] font-bold border border-[#8E9C78]/30">
                Menu
              </Link>
            ) : (
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="px-4 py-1.5 rounded-full bg-white text-black text-[12px] font-bold shadow-md"
              >
                {lang === 'pt' ? 'Entrar' : 'Sign in'}
              </button>
            )}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="w-8 h-8 flex flex-col justify-center items-center gap-1.5 relative z-[60] group ml-1"
            >
              <div className="w-5 h-[1.5px] transition-colors duration-300 bg-white/60 group-hover:bg-white" />
              <div className="w-5 h-[1.5px] transition-colors duration-300 bg-white/60 group-hover:bg-white" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 flex flex-col items-center text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[radial-gradient(circle,_rgba(142,156,120,0.15)_0%,_transparent_70%)] rounded-full pointer-events-none" />
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8E9C78]/10 border border-[#8E9C78]/20 text-[11px] font-bold text-[#8E9C78] mb-6 relative z-10">
          <Sparkles size={12} />
          <span>{t.heroFree}</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-white mb-4 leading-[1.1] relative z-10 px-2">
          {t.heroTitle1} <br />
          {t.heroTitle2} <span className="text-[#8E9C78]">DevsBoard</span>.
        </h1>

        <p className="text-[15px] text-zinc-400 mb-8 max-w-[280px] mx-auto leading-relaxed relative z-10">
          {t.heroDesc}
        </p>

        <div className="flex flex-col gap-3 w-full max-w-[280px] relative z-10">
          {user ? (
            <Link
              to="/dashboard"
              className="w-full flex items-center justify-center gap-2 bg-white text-black py-3.5 rounded-xl text-sm font-bold active:scale-[0.98] transition-transform"
            >
              {t.heroBtnDash}
              <ArrowRight size={16} />
            </Link>
          ) : (
            <button
              onClick={() => setIsLoginOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-white text-black py-3.5 rounded-xl text-sm font-bold active:scale-[0.98] transition-transform shadow-lg shadow-white/5"
            >
              {t.heroBtnStart}
              <ArrowRight size={16} />
            </button>
          )}
          <a 
            href="#features" 
            onClick={(e) => scrollToSection(e, '#features')} 
            className="w-full flex items-center justify-center py-3.5 rounded-xl text-sm font-medium text-zinc-400 bg-white/[0.02] border border-white/5"
          >
            {t.heroBtnDiscover}
          </a>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 relative z-10">
          <div className="flex -space-x-2">
            {['/icaro.png', '/nobre.png', '/emanuel.png'].map((src, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0A0A0A] overflow-hidden bg-zinc-800 shadow-sm">
                <img src={src} alt="Membro" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 font-medium">
            {lang === 'pt' ? 'Mais de 50 membros' : 'Over 50 members'}
          </p>
        </div>
      </section>

      {/* App Preview */}
      <section className="px-4 mb-16 max-w-md mx-auto">
        <div className="rounded-2xl border border-white/10 bg-[#111] p-1.5 shadow-[0_0_40px_rgba(142,156,120,0.15)] overflow-hidden">
          <img src="/capa_notebook.png" alt="App" className="w-full h-auto rounded-xl object-cover opacity-90" />
        </div>
      </section>

      {/* Mobile-Optimized Comparison Table */}
      <section className="py-12 px-4 bg-[#0a0a0a] border-y border-white/5">
        <div className="text-center mb-8 max-w-sm mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-3">{t.vsTitle}</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">{t.vsBottom}</p>
        </div>
        
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          {comparisonData.map((item, i) => (
            <div key={i} className="bg-[#111] border border-white/5 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-bold text-white">{item.label}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center justify-center p-2 bg-[#8E9C78]/10 border border-[#8E9C78]/20 rounded-lg">
                  <span className="text-[9px] font-bold text-[#8E9C78] mb-1 uppercase tracking-wider">DevsBoard</span>
                  {item.vals[0] === 1 ? <Check size={16} className="text-[#8E9C78]" /> : item.vals[0] === 2 ? <AlertTriangle size={16} className="text-yellow-500" /> : <X size={16} className="text-red-500/50" />}
                </div>
                <div className="flex flex-col items-center justify-center p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                  <span className="text-[9px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Notion</span>
                  {item.vals[1] === 1 ? <Check size={16} className="text-zinc-600" /> : item.vals[1] === 2 ? <AlertTriangle size={16} className="text-yellow-500/50" /> : <X size={16} className="text-red-500/50" />}
                </div>
                <div className="flex flex-col items-center justify-center p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                  <span className="text-[9px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Trello</span>
                  {item.vals[2] === 1 ? <Check size={16} className="text-zinc-600" /> : item.vals[2] === 2 ? <AlertTriangle size={16} className="text-yellow-500/50" /> : <X size={16} className="text-red-500/50" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features List */}
      <section id="features" className="py-16 px-4">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-8 text-center leading-tight">
          {t.featTitle1} <br/><span className="text-[#8E9C78]">{t.featTitle2}</span>.
        </h2>

        <div className="flex flex-col gap-6 max-w-sm mx-auto">
          {/* Feature 1 */}
          <div className="bg-[#111] border border-white/5 rounded-[2rem] p-6 shadow-lg">
            <FinancialChartAnimation lang={lang} />
            <div className="mt-6">
              <h3 className="text-lg font-bold text-white mb-2">{t.feat1Title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{t.feat1Desc}</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#111] border border-white/5 rounded-[2rem] p-6 shadow-lg">
            <TrelloDragAndDropAnimation />
            <div className="mt-6">
              <h3 className="text-lg font-bold text-white mb-2">{t.feat2Title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{t.feat2Desc}</p>
            </div>
          </div>

          {/* Teamwork (Feature 4 translated) */}
          <div className="bg-[#111] border border-[#8E9C78]/20 rounded-[2rem] p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#8E9C78]/10 blur-3xl rounded-full" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8E9C78]/20 text-[#8E9C78] text-[10px] font-bold mb-4">
              <Sparkles size={12} />
              <span>{t.feat4Tag}</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{t.feat4Title}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-6">{t.feat4Desc}</p>
            <div className="flex flex-col gap-3">
              {[t.feat4L1, t.feat4L2, t.feat4L3].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                  <CheckCircle2 size={16} className="text-[#8E9C78]" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Feature 5 — Conquistas (Platina) */}
          <div className="bg-[#111] border border-white/5 rounded-[2rem] p-6 shadow-lg">
            <div className="h-44 relative flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute w-32 h-32 rounded-full border border-dashed border-[#8E9C78]/30"
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-28 h-28 bg-gradient-to-br from-[#8E9C78]/20 to-[#8E9C78]/5 rounded-2xl border border-[#8E9C78]/40 shadow-[0_0_30px_rgba(142,156,120,0.3)] flex items-center justify-center rotate-12"
              >
                <img src="/platina.svg" alt="Platina" className="w-20 h-20 object-contain -rotate-12" />
              </motion.div>
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-1 bg-[#0a0a0a] border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg"
              >
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-[10px] font-bold font-mono text-zinc-300">PLATINA</span>
              </motion.div>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-bold text-white mb-2">{t.feat5Title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{t.feat5Desc}</p>
            </div>
          </div>

          {/* Feature 6 — Customização */}
          <div className="bg-[#111] border border-white/5 rounded-[2rem] p-6 shadow-lg">
            <div className="h-44 relative flex items-center justify-center">
              <div className="w-full max-w-[200px] h-32 bg-[#0a0a0a] border border-white/10 rounded-xl relative overflow-hidden flex flex-col shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10" />
                <div className="relative flex items-center gap-1.5 px-3 py-2 border-b border-white/5">
                  <div className="w-2 h-2 rounded-full bg-red-500/60" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                  <div className="w-2 h-2 rounded-full bg-green-500/60" />
                </div>
                <div className="relative flex-1 flex items-center justify-center gap-2">
                  {['#8E9C78', '#a78bfa', '#60a5fa', '#f472b6'].map((c, i) => (
                    <motion.div
                      key={c}
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                      className="w-5 h-5 rounded-full"
                      style={{ background: c, boxShadow: `0 0 12px ${c}55` }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-bold text-white mb-2">{t.feat6Title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{t.feat6Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Compact */}
      <section className="py-16 px-6 bg-[#000] border-y border-white/5 text-center">
        <div className="max-w-sm mx-auto">
          <p className="text-[10px] text-zinc-500 font-bold mb-3 uppercase tracking-widest">{t.phil1}</p>
          <h2 className="text-xl font-bold text-white leading-tight mb-2">{t.phil2}</h2>
          <div className="w-12 h-[1px] bg-white/10 mx-auto my-6" />
          <p className="text-[10px] text-[#8E9C78] font-bold mb-3 uppercase tracking-widest">{t.phil3}</p>
          <h2 className="text-2xl font-serif italic text-white leading-tight">{t.phil4}</h2>
        </div>
      </section>

      {/* Mobile Target Audience */}
      <section className="py-12 px-4 bg-[#0a0a0a]">
        <h2 className="text-2xl font-bold text-white text-center mb-6">{t.targetTitle}</h2>
        <div className="flex flex-wrap justify-center gap-2 max-w-sm mx-auto">
          {t.targets.map((target, i) => (
            <div key={i} className="px-3 py-1.5 rounded-lg bg-[#111] border border-white/5 text-zinc-300 text-xs font-medium">
              {target}
            </div>
          ))}
        </div>
      </section>

      {/* Ask anything — interactive chat (replaces classic FAQ) */}
      <AskAnything t={t} lang={lang} />

      {/* Feedback wall */}
      <FeedbackWall t={t} lang={lang} />

      {/* Buy me a coffee — compact spotlight */}
      <section className="pt-12 pb-6 px-6 text-center relative overflow-hidden">
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[radial-gradient(circle,_rgba(142,156,120,0.20)_0%,_rgba(142,156,120,0.05)_30%,_transparent_65%)] rounded-full pointer-events-none blur-[32px]"
        />
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[160px] bg-[radial-gradient(circle,_rgba(142,156,120,0.22)_0%,_transparent_70%)] rounded-full pointer-events-none blur-[20px]"
        />

        <div className="relative">
          <div className="inline-flex items-center gap-1.5 mb-3.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#8E9C78] opacity-70 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#8E9C78]" />
            </span>
            <span className="text-[10px] text-[#8E9C78]/80 font-light tracking-wide">PIX</span>
          </div>

          <h3 className="text-[24px] font-light text-white tracking-[-0.025em] leading-[1.1]">
            {t.coffeeTitle1}
          </h3>
          <p className="mt-2.5 mx-auto max-w-[300px] text-[13px] leading-[1.5] text-white/55 font-light">
            {t.coffeeDesc}
          </p>
          <Link
            to="/support"
            className="mt-5 inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full text-[12.5px] font-medium active:scale-[0.99] transition-transform shadow-[0_12px_32px_-10px_rgba(142,156,120,0.6)]"
          >
            <span>{t.coffeeBtn}</span>
            <ArrowRight size={12} />
          </Link>
          <p className="mt-3 text-[10.5px] text-white/35 font-light">{t.coffeeMeta}</p>
        </div>
      </section>

      {/* Footer CTA Mobile */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-sm mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">{t.ctaTitle}</h2>
          <p className="text-sm text-zinc-400 mb-8">{t.ctaDesc}</p>
          <button
            onClick={() => setIsLoginOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#8E9C78] text-black py-4 rounded-xl text-base font-bold shadow-lg"
          >
            {t.ctaBtn}
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Mobile Footer */}
      <footer className="pt-8 pb-12 px-6 border-t border-white/5 flex flex-col items-center gap-4">
        <img src="/devsboard.png" alt="Logo" className="w-6 h-6 grayscale opacity-60" />
        <p className="text-xs text-zinc-600 font-medium">&copy; {new Date().getFullYear()} DevsBoard</p>
        <p className="text-[10px] text-zinc-700">{t.footerMade} <span className="text-zinc-500">IcaroCodes</span></p>
      </footer>

      {/* Bottom Sheet Modal */}
      <LoginBottomSheet 
        visible={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onLogin={loginWithOAuth} 
        lang={lang} 
      />

      {/* Full Screen Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] bg-[#050505] flex flex-col overflow-hidden p-6 sm:p-8"
          >
            <div className="flex justify-between items-start w-full relative z-10 mb-12">
              <div className="flex flex-col">
                <span className="text-white font-bold text-[18px] sm:text-[20px] tracking-tight leading-none font-sans">
                  DevsBoard
                </span>
                <span className="text-zinc-500 text-[8px] sm:text-[9px] mt-2 font-mono">
                  {t.mobileFocus || (lang === 'pt' ? 'Simples e direto' : 'Simple and direct')}
                </span>
              </div>

              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-10 h-10 flex flex-col items-center justify-start group pl-3 pt-0.5"
              >
                <X className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-8 w-full relative z-10 max-w-sm mx-auto pl-2">
              {[
                { name: t.navHow || (lang === 'pt' ? 'Recursos' : 'Features'), id: '#features' },
                { name: t.navVision || (lang === 'pt' ? 'Filosofia' : 'Vision'), id: '#philosophy' },
                { name: t.navStep || (lang === 'pt' ? 'Como Funciona' : 'Protocol'), id: '#protocol' }
              ].map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-5"
                >
                  <span className="text-zinc-600 font-mono text-[10px] font-medium w-4 opacity-70">
                    0{i + 1}
                  </span>
                  <a
                    href={link.id}
                    onClick={(e) => scrollToSection(e, link.id)}
                    className="text-[2.5rem] font-bold text-white tracking-[-0.04em] hover:text-[#8E9C78] transition-colors block leading-none"
                  >
                    {link.name}
                  </a>
                </motion.div>
              ))}
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex flex-col gap-4 relative z-10 mt-auto"
            >
              <div className="flex justify-center mb-6">
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
                {user ? (
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="w-full py-4 rounded-[1.2rem] bg-white text-black text-[15px] font-bold text-center border border-white/10 hover:scale-[1.02] transition-transform">
                    {lang === 'pt' ? 'Acessar Dashboard' : 'Go to Dashboard'}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => { setIsMenuOpen(false); loginWithOAuth('github'); }}
                      className="w-full py-4 rounded-[1.2rem] bg-white text-black text-[15px] font-bold tracking-[-0.01em] text-center hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 cursor-pointer"
                    >
                      <IconGitHub />
                      <span>{lang === 'pt' ? 'Entrar com GitHub' : 'Sign in with GitHub'}</span>
                    </button>
                    <button
                      onClick={() => { setIsMenuOpen(false); loginWithOAuth('google'); }}
                      className="w-full py-4 rounded-[1.2rem] bg-[#1a1a1a] text-white border border-white/10 text-[15px] font-bold tracking-[-0.01em] text-center hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 cursor-pointer"
                    >
                      <IconGoogle />
                      <span>{lang === 'pt' ? 'Entrar com Google' : 'Sign in with Google'}</span>
                    </button>
                  </>
                )}
              </div>
              <div className="flex justify-between items-center w-full px-1 mt-4">
                <span className="text-zinc-600 font-medium text-[9px]">DevsBoard</span>
                <span className="text-zinc-600 font-medium text-[9px]">&copy; {new Date().getFullYear()}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
