import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet, CheckSquare2, RotateCw, Target, FolderKanban, Code2,
  Star, ChevronRight, CheckCircle2, Menu, X, ArrowRight, LayoutGrid, ChevronDown
} from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence, useSpring, useInView } from 'framer-motion';

// --- Components ---

// Navbar - Floating Pill Style (Adjusted for Top Banner)
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
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
          className={`
            pointer-events-auto flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500
            ${isScrolled
              ? 'bg-[#0e3b44]/80 backdrop-blur-2xl text-white shadow-2xl border border-white/10 w-full max-w-xl'
              : 'bg-white/60 backdrop-blur-xl text-[#0e3b44] border border-[#0e3b44]/5 w-full max-w-5xl'
            }
          `}
        >

          <div className="flex items-center gap-2 font-semibold text-lg tracking-tight group cursor-pointer" style={{ perspective: "1000px" }}>

            {/* A Imagem da logo solta (transparente), com animação 3D */}
            <img
              src="/devsboard.png" // Caminho para imagem na pasta public
              alt="DevsBoard Logo"
              className={`w-8 h-8 object-contain transition-all duration-500 ease-out
      ${isScrolled ? 'brightness-0 invert' : ''} // Ajuste de cor condicional se necessário
      group-hover:scale-110 group-hover:rotate-[-5deg]`}
              style={{
                transformStyle: "preserve-3d",
                transform: "translateZ(30px)", // Efeito de flutuação 3D no hover
                filter: isScrolled ? 'drop-shadow(0 2px 4px rgba(255,255,255,0.2))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}
            />

            {/* Texto da logo */}
            <span className={`hidden sm:inline transition-colors duration-500 ${isScrolled ? 'text-white' : 'text-[#0e3b44]'}`}>
              DevsBoard
            </span>
          </div>

          {/* Desktop Links */}
          <div className={`hidden md:flex items-center gap-6 text-[13px] font-medium transition-colors duration-500 ${isScrolled ? 'text-white/80' : 'text-[#0e3b44]/80'}`}>
            <a href="#recursos" className="hover:text-[#485c10] transition-colors">Recursos</a>
            <a href="#beneficios" className="hover:text-[#485c10] transition-colors">Benefícios</a>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              className={`
                px-5 py-2 rounded-full text-[13px] font-semibold transition-all duration-500
                ${isScrolled ? 'bg-[#485c10] text-white hover:bg-[#3d4a0c]' : 'bg-[#0e3b44] text-white hover:bg-[#092a31]'}
              `}
            >
              <a href="/auth">Começar</a>
            </motion.button>

            {/* Mobile Toggle */}
            <button className="md:hidden ml-2" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={20} className={isScrolled ? "text-white" : "text-[#0e3b44]"} />
            </button>
          </div>
        </motion.nav>
      </div>

      {/* Mobile Full Screen Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, clipPath: "circle(0% at 100% 0%)" }}
            animate={{ opacity: 1, clipPath: "circle(150% at 100% 0%)" }}
            exit={{ opacity: 0, clipPath: "circle(0% at 100% 0%)" }}
            transition={{ type: "spring", damping: 30, stiffness: 100 }}
            className="fixed inset-0 z-[60] bg-[#f5f5dc] flex flex-col p-8 pt-24"
          >
            <div className="flex justify-between items-center mb-12">
              <span className="text-2xl font-bold text-[#0e3b44]">DevsBoard</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-3 bg-[#0e3b44]/5 rounded-full hover:bg-[#0e3b44]/10 transition-colors">
                <X size={24} className="text-[#0e3b44]" />
              </button>
            </div>
            <nav className="flex flex-col gap-6">
              {['Recursos', 'Benefícios'].map((item) => (
                <a
                  key={item}
                  href="#"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-4xl font-bold text-[#0e3b44] hover:text-[#485c10] transition-colors tracking-tight"
                >
                  {item}
                </a>
              ))}
            </nav>
            <div className="mt-auto">
              <button className="w-full py-5 bg-[#0e3b44] text-white rounded-[24px] font-bold text-lg">
                Criar Conta Gratuita
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Animated Counter Component with Design Fixes
const Counter = ({ from = 0, to, suffix = "", label }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });

  const springValue = useSpring(from, {
    stiffness: 50,
    damping: 15,
    mass: 1
  });

  const [displayValue, setDisplayValue] = useState(from);

  useEffect(() => {
    if (inView) {
      springValue.set(to);
    }
  }, [inView, to, springValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setDisplayValue(Math.floor(latest));
    });
  }, [springValue]);

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Number and Suffix Container */}
      <div className="flex items-baseline leading-none relative">
        <span ref={ref} className="text-[3.5rem] md:text-[5rem] font-semibold text-[#0f172a] tabular-nums tracking-tighter">
          {displayValue}
        </span>
        {suffix && (
          <span className="text-xl md:text-3xl text-[#485c10] font-semibold ml-1">
            {suffix}
          </span>
        )}
      </div>

      {/* Label */}
      <span className="text-sm md:text-lg text-gray-500 font-medium mt-2 tracking-wide">
        {label}
      </span>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, description, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-[#0e3b44] rounded-[24px] p-8 text-white relative overflow-hidden group cursor-pointer border border-white/10"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-white/10" />

      <div className="w-14 h-14 bg-[#8e9c78]/20 rounded-2xl flex items-center justify-center mb-6 text-[#8e9c78] group-hover:bg-[#485c10] group-hover:text-white transition-all duration-300">
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="text-xl font-bold font-sans mb-3 tracking-tight">{title}</h3>
      <p className="text-sm font-sans text-gray-300 leading-relaxed opacity-90">{description}</p>

      <div className="mt-6 flex items-center text-xs font-bold text-[#8e9c78] opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
        Saiba mais <ArrowRight className="w-3 h-3 ml-1" />
      </div>
    </motion.div>
  );
};

const differentiators = [
  {
    title: "Tudo em um só lugar",
    description: "Centralize tarefas, finanças, metas e projetos em uma única plataforma integrada, eliminando ferramentas dispersas e garantindo total controle da sua rotina."
  },
  {
    title: "Foco para Devs",
    description: "Interface pensada para desenvolvedores: objetiva, minimalista e orientada à produtividade, reduzindo distrações e priorizando performance e clareza."
  },
  {
    title: "Organização em KanBan",
    description: "Gerencie fluxos de trabalho com visualização Kanban intuitiva, permitindo acompanhamento preciso de tarefas, prioridades e entregas em tempo real."
  },
  {
    title: "Projetos organizados",
    description: "Estruture projetos com organização lógica, divisão por etapas e acompanhamento estratégico, facilitando execução consistente e evolução contínua."
  }
];

const Differentiators = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleIndex = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

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
                <motion.div
                  animate={{ rotate: expandedIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="text-[#b47045]/50 w-5 h-5" />
                </motion.div>
              </div>

              <AnimatePresence>
                {expandedIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
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

// Main App Component
export default function App() {
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

      {/* Hero Section - Padding adjusted to move content up (pt-24/md:pt-32) */}
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
            transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
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
              className="px-8 py-4 bg-[#485c10] rounded-full text-white font-bold flex items-center gap-2 shadow-xl shadow-[#485c10]/25 hover:bg-[#3d4a0c] transition-colors"
            >
              Começar Agora
              <ArrowRight className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.05)" }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-transparent border-2 border-slate-200 text-slate-700 rounded-full font-bold hover:border-slate-300 transition-colors"
            >
              Ver Benefícios
            </motion.button>
          </motion.div>

          {/* Stats - Refined to match image exactly */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-row justify-center gap-12 md:gap-32 pt-8"
          >
            {[
              { label: "Usuários", value: 20, suffix: "+" },
              { label: "Gratuito", value: 100, suffix: "%" },
              { label: "Anúncios", value: 0, suffix: "" },
            ].map((stat, i) => (
              <Counter key={i} from={0} to={stat.value} suffix={stat.suffix} label={stat.label} />
            ))}
          </motion.div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#485c10]/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      </section>

      {/* Elegant Resources Grid Section */}
      <section id="recursos" className="py-32 px-6 md:px-12 max-w-7xl mx-auto z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-20 text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between gap-8"
        >
          <div>
            <span className="text-[#485c10] font-bold tracking-widest text-[11px] uppercase mb-4 block">
              Recursos
            </span>
            <h2 className="text-4xl md:text-6xl font-bold text-[#0e3b44] tracking-tight leading-[1.05]">
              Tudo que você precisa.
            </h2>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Wallet, title: "Finanças", desc: "Gerencie receitas, despesas e tenha visão clara do seu dinheiro." },
            { icon: CheckSquare2, title: "Tarefas", desc: "Organize tarefas com prioridades e status." },
            { icon: RotateCw, title: "Hábitos", desc: "Crie rotinas e acompanhe hábitos no dia a dia." },
            { icon: Target, title: "Metas", desc: "Defina metas financeiras e metas de desempenho e acompanhe seu progresso." },
            { icon: FolderKanban, title: "Projetos", desc: "Planeje e organize projetos de forma simples." },
            { icon: Code2, title: "Código Aberto", desc: "Projeto aberto para issues, PRs e contribuições." },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-[32px] p-10 relative overflow-hidden group border border-[#0e3b44]/5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(14,59,68,0.08)] transition-all duration-500 cursor-default"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <item.icon className="w-32 h-32 text-[#0e3b44] transform rotate-12 group-hover:rotate-0 transition-transform duration-700" />
              </div>

              <div className="w-14 h-14 bg-[#0e3b44]/5 rounded-2xl flex items-center justify-center mb-8 text-[#0e3b44] group-hover:bg-[#485c10] group-hover:text-white transition-all duration-500">
                <item.icon className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold font-sans text-[#0e3b44] mb-3 tracking-tight relative z-10">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium relative z-10">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Differentiators Section (Replacing Benefits) */}
      <Differentiators />

      {/* Footer */}
      <footer className="bg-[#f5f5dc] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/devsboard.png"
              alt="DevsBoard Logo"
              className="w-8 h-8 object-contain"
            />
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
