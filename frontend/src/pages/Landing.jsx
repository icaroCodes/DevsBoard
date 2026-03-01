import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet, CheckSquare2, RotateCw, Target, FolderKanban, Code2,
  Star, ChevronRight, CheckCircle2, Menu, X, ArrowRight, LayoutGrid
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
              Começar
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
              {['Recursos', 'Benefícios', 'Preços', 'Login'].map((item) => (
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
              Plataforma all-in-one
            </span>
            <h2 className="text-4xl md:text-6xl font-bold text-[#0e3b44] tracking-tight leading-[1.05]">
              Tudo que você precisa,<br /> <span className="text-[#8e9c78]">nada do que não precisa.</span>
            </h2>
          </div>
          <p className="text-slate-500 font-medium max-w-md text-lg leading-relaxed">
            Um ecossistema desenhado para reduzir o atrito entre o seu planejamento e a sua execução.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Wallet, title: "Finanças Inteligentes", desc: "Controle de receitas, despesas e fluxo de caixa com gráficos limpos e direto ao ponto." },
            { icon: CheckSquare2, title: "Tarefas & Kanban", desc: "Prioridades ágeis, tags inteligentes e status moldáveis ao seu próprio fluxo de trabalho." },
            { icon: RotateCw, title: "Hábitos e Rotinas", desc: "Acompanhe e consolide a consistência das rotinas que alavancam a sua produtividade." },
            { icon: Target, title: "Metas (OKRs)", desc: "Traduza objetivos grandiosos em execuções métricas através do sistema de OKRs." },
            { icon: FolderKanban, title: "Workspace Projetos", desc: "Repositórios, documentações e anotações técnicas, lado a lado com suas pendências." },
            { icon: Code2, title: "Filosofia Open Source", desc: "Audite o código. Contribua com a comunidade. Seus dados e a plataforma pertencem a você." },
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

      {/* Cinematic Benefits Section */}
      <section id="beneficios" className="py-32 px-6 bg-[#030303] text-white relative overflow-hidden border-t border-white/5">
        {/* Abstract minimalistic background blurs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#8e9c78]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#485c10]/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col h-full justify-center"
          >
            <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-[1.05] tracking-tight text-white">
              Arquitetura de <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8e9c78] to-[#485c10]">
                Alta Performance.
              </span>
            </h2>
            <p className="text-xl text-white/50 max-w-md leading-relaxed font-medium mb-12">
              Não somos mais um app de to-do list genérico. Somos o cockpit de comando projetado milimetricamente para desenvolvedores e mentes criativas.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-5 bg-white text-black rounded-full font-bold inline-flex items-center justify-center gap-3 w-fit hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300"
            >
              Criar Base Gratuita
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Minimalist Interactive List */}
          <div className="relative">
            {/* Decorational line connecting items */}
            <div className="absolute left-[27px] top-6 bottom-10 w-px bg-white/10 hidden md:block" />

            <div className="space-y-12">
              {[
                {
                  title: "Single Source of Truth",
                  desc: "Substitua dezenas de abas por um ecossistema que integra seus dados, rotinas e metas de forma nativa.",
                  num: "01"
                },
                {
                  title: "Design Minimalista Ativo",
                  desc: "A interface recua quando você precisa focar. Menos menus hambúrgueres suspensos, mais atalhos globais.",
                  num: "02"
                },
                {
                  title: "Privacidade e Posse Autêntica",
                  desc: "Sem tracking invisível. Suas anotações, métricas financeiras e rotinas criptografadas. Você é o dono dos seus dados.",
                  num: "03"
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.15, duration: 0.8, ease: "easeOut" }}
                  className="group flex gap-8 items-start relative bg-white/[0.01] p-6 rounded-3xl border border-white/5 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-14 h-14 rounded-2xl bg-black border border-white/10 flex items-center justify-center flex-shrink-0 relative z-10 shadow-xl group-hover:border-[#8e9c78]/50 transition-colors">
                    <span className="font-mono font-bold text-[#8e9c78] text-lg">{item.num}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{item.title}</h3>
                    <p className="text-lg text-white/40 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#030303] border-t border-white/5 py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/devsboard.png" alt="DevsBoard Logo" className="w-8 h-8 object-contain brightness-0 invert opacity-80" />
            <span className="text-sm font-bold text-white/70 tracking-widest uppercase">® 2026 DEVSBOARD</span>
          </div>
          <p className="text-sm font-medium text-white/40">
            Crafted by <a href="https://github.com/icarocodes" className='font-bold text-[#8e9c78] hover:text-[#485c10] transition-colors'>IcaroCodes</a>
          </p>
        </div>
      </footer>
    </div>
  );
}