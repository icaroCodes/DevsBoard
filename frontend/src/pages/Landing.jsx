import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
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

export default function Landing() {
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
      <div className="min-h-screen bg-[#0A0A0A] text-zinc-300 font-sans selection:bg-[#D98A2C]/30 selection:text-white">
        
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/70 backdrop-blur-md border-b border-white/5">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/devsboard.png" alt="DevsBoard Logo" className="w-6 h-6 object-contain" />
              <span className="text-white font-medium text-sm tracking-tight">DevsBoard</span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/auth" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">
                Entrar
              </Link>
              <Link 
                to="/auth" 
                className="text-xs font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors"
              >
                Começar
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-40 pb-20 px-6 min-h-[90vh] flex flex-col items-center justify-center relative overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D98A2C]/10 rounded-full blur-[120px] pointer-events-none" />
          
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center relative z-10"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-[#D98A2C] mb-8">
              <Sparkles size={12} />
              <span>Concebido para excelência</span>
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
              A base definitiva para <br className="hidden md:block" />
              o seu ecossistema.
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-base md:text-lg text-zinc-400 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              O DevsBoard condensa clareza, performance e design de produto. Menos ruído visual, mais eficiência operacional. Experimente a essência do minimalismo funcional.
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
              className="rounded-xl border border-white/10 bg-[#111] p-2 md:p-3 shadow-[0_0_80px_rgba(217,138,44,0.15)] relative preserve-3d"
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

        {/* Social Proof Section */}
        <section className="py-24 px-6 border-t border-white/5 bg-[#0A0A0A]">
          <div className="max-w-4xl mx-auto">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left"
            >
              {[
                { text: "“Pela primeira vez, uma ferramenta que não me sobrecarrega visualmente. O design fala por si.”", author: "Engenheira de Software" },
                { text: "“Absolutamente impecável. A atenção aos detalhes em cada interação é de outro nível.”", author: "Product Designer" },
                { text: "“Elegância que se traduz em produtividade real. Menos cliques, mais resultados.”", author: "Tech Lead" }
              ].map((item, i) => (
                <motion.div key={i} variants={fadeIn} className="flex flex-col justify-between space-y-4">
                  <p className="text-zinc-400 text-sm leading-relaxed font-light">{item.text}</p>
                  <p className="text-xs font-medium text-white tracking-wide">— {item.author}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features / Benefits */}
        <section id="features" className="py-32 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="mb-20 text-center"
            >
              <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-4">
                Reduzido ao essencial.
              </motion.h2>
              <motion.p variants={fadeIn} className="text-zinc-400 text-sm max-w-xl mx-auto font-light">
                Cada funcionalidade foi concebida com um único propósito: entregar valor sem adicionar complexidade desnecessária.
              </motion.p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Zap, title: "Performance Impecável", desc: "Arquitetura otimizada para carregar quase instantaneamente." },
                { icon: CheckCircle2, title: "Clareza Absoluta", desc: "Interfaces livres de ruído. Você encontra apenas o que precisa." },
                { icon: Server, title: "Escalabilidade", desc: "Preparado para crescer do simples projeto ao produto enterprise." }
              ].map((feature, idx) => (
                <motion.div 
                  key={idx}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={fadeIn}
                  className="group p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#111] border border-white/10 flex items-center justify-center mb-6 group-hover:border-[#D98A2C]/30 transition-colors">
                    <feature.icon size={16} className="text-[#D98A2C]" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-zinc-400 font-light leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Callout Section */}
        <section className="py-24 px-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="max-w-5xl mx-auto bg-[#111] border border-white/10 rounded-2xl p-12 md:p-20 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D98A2C]/5 rounded-full blur-[80px]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-6">
                Construído para os exigentes.
              </h2>
              <p className="text-zinc-400 text-sm md:text-base max-w-2xl mx-auto font-light mb-10 leading-relaxed">
                Nós removemos as distrações para que você possa focar no que realmente importa. Menos tempo configurando, mais tempo criando.
              </p>
              <Link 
                to="/auth" 
                className="inline-flex items-center gap-2 bg-[#D98A2C] text-black px-6 py-3 rounded-full text-sm font-medium hover:bg-[#E5A84D] transition-colors"
              >
                Criar conta gratuita
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Differentials */}
        <section className="py-32 px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-12">
            <div className="flex-1">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-2xl md:text-3xl font-semibold text-white mb-4 tracking-tight"
              >
                A diferença está nos detalhes.
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-zinc-400 text-sm font-light leading-relaxed max-w-md"
              >
                Não acreditamos no acúmulo de funcionalidades, mas na execução perfeita das essenciais.
              </motion.p>
            </div>
            
            <div className="flex-1 space-y-8">
              {[
                { title: "Zero Setup", text: "Comece a usar em segundos, sem configurações complexas." },
                { title: "Segurança Padrão Prata", text: "Seus dados protegidos desde o primeiro momento." }
              ].map((diff, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="mt-1">
                    <Shield size={16} className="text-[#D98A2C]" />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-medium mb-1">{diff.title}</h4>
                    <p className="text-zinc-500 text-sm font-light">{diff.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 px-6 border-t border-white/5 bg-[#080808]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/devsboard.png" alt="DevsBoard Logo" className="w-4 h-4 object-contain opacity-50 grayscale" />
              <span className="text-zinc-500 text-xs font-medium">DevsBoard</span>
            </div>
            <p className="text-zinc-600 text-xs font-light">
              &copy; {new Date().getFullYear()} DevsBoard. Feito por <a href="https://github.com/icaroCodes" className='text-[#D98A2C] hover:text-[#E5A84D] transition-colors'>IcaroCodes</a>
            </p>
          </div>
        </footer>

      </div>
    </ReactLenis>
  );
}
