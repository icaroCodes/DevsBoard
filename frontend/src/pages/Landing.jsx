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
          {/* Logo */}
          <div className="flex items-center gap-2 font-semibold text-lg tracking-tight">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-500 ${isScrolled ? 'bg-white text-[#0e3b44]' : 'bg-[#0e3b44] text-white'}`}>
              <LayoutGrid size={16} />
            </div>
            <span className="hidden sm:inline">DevsBoard</span>
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
            Menos bagunça mental. Mais execução diária. A plataforma definitiva para desenvolvedores que querem performar.
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
              { label: "Clientes", value: 20, suffix: "+" },
              { label: "Gratuito", value: 100, suffix: "%" },
              { label: "Anúncios", value: 0, suffix: "" },
            ].map((stat, i) => (
              <Counter key={i} from={0} to={stat.value} suffix={stat.suffix} label={stat.label} />
            ))}
          </motion.div>
        </div>
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#485c10]/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      </section>

      {/* Resources Section */}
      <section id="recursos" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center md:text-left"
        >
          <span className="text-[#485c10] font-bold uppercase tracking-wider text-sm">Recursos Premium</span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mt-3">O que a plataforma oferece</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            icon={Wallet} 
            title="Finanças" 
            description="Gerencie receitas, despesas e tenha uma visão clara do seu fluxo de caixa pessoal."
            delay={0}
          />
          <FeatureCard 
            icon={CheckSquare2} 
            title="Tarefas" 
            description="Organize tarefas com prioridades, tags e status personalizados em um quadro Kanban."
            delay={0.1}
          />
          <FeatureCard 
            icon={RotateCw} 
            title="Rotinas" 
            description="Crie rotinas diárias e acompanhe a consistência dos seus hábitos ao longo do tempo."
            delay={0.2}
          />
          <FeatureCard 
            icon={Target} 
            title="Metas" 
            description="Defina OKRs, metas financeiras e de desempenho e visualize seu progresso."
            delay={0.3}
          />
          <FeatureCard 
            icon={FolderKanban} 
            title="Projetos" 
            description="Centralize documentação, links e tarefas de seus projetos paralelos."
            delay={0.4}
          />
          <FeatureCard 
            icon={Code2} 
            title="Open Source" 
            description="Contribua com o desenvolvimento da plataforma. Código aberto para a comunidade."
            delay={0.5}
          />
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-24 bg-[#0e3b44] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              Por que escolher<br />
              <span className="text-[#b47045]">DevsBoard?</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-md leading-relaxed">
              Construído para quem constrói o futuro. Uma ferramenta simples, poderosa e focada no que importa.
            </p>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-10 px-8 py-3 bg-white text-[#0e3b44] rounded-full font-bold inline-flex items-center gap-2 hover:bg-gray-100 transition-colors"
            >
              Criar conta gratuita
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </motion.div>

          <div className="space-y-8">
            {[
              { title: "TUDO EM UM SÓ LUGAR", desc: "Chega de alternar entre 5 apps diferentes." },
              { title: "FOCO E FLUXO PARA DEVS", desc: "Interface limpa, atalhos intuitivos e zero distrações." },
              { title: "SUA BASE SÓLIDA", desc: "Dados seguros e exportáveis a qualquer momento." },
              { title: "PROJETOS ORGANIZADOS", desc: "Da ideia ao deploy, acompanhe cada etapa." }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="group cursor-default"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-[#8e9c78]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#b47045] transition-colors duration-300">
                    <CheckCircle2 className="w-5 h-5 text-[#8e9c78] group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-[#b47045] transition-colors duration-300">{item.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{item.desc}</p>
                    <div className="w-full h-px bg-white/10 mt-6 group-hover:bg-[#b47045]/50 transition-colors duration-500" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#f5f5dc] border-t border-[#485c10]/10 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#485c10] rounded-lg flex items-center justify-center">
              <div className="w-5 h-1.5 bg-white rounded-full" />
            </div>
            <span className="text-sm font-medium font-mono text-[#485c10]">© 2026 DevsBoard Inc.</span>
          </div>

          <div className="flex gap-6">
             <a href="#" className="text-[#485c10] hover:text-[#3d4a0c] transition-colors font-mono text-xs font-bold">GITHUB</a>
             <a href="#" className="text-[#485c10] hover:text-[#3d4a0c] transition-colors font-mono text-xs font-bold">TWITTER</a>
             <a href="#" className="text-[#485c10] hover:text-[#3d4a0c] transition-colors font-mono text-xs font-bold">LINKEDIN</a>
          </div>

          <p className="text-xs font-mono text-[#485c10]/80">
            Desenvolvido por <span className="font-bold">IcaroCodes</span>
          </p>
        </div>
      </footer>
    </div>
  );
}