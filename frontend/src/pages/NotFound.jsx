import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  // Pre-generate random bubbles safely once so both light and dark sides match perfectly
  const bubbles = useMemo(() => {
    return Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // horizontal position percentage
      size: Math.random() * 20 + 8, // diameter
      delay: Math.random() * 8, // animation delay
      duration: Math.random() * 10 + 15, // float duration
      wiggle: Math.random() * 20 - 10 // horizontal sway
    }));
  }, []);

  // The content is rendered twice exactly the same way but with different 
  // colors/styles for dark and light themes. We use CSS clip-path on the 
  // light container to create the perfect 50/50 split effect.
  const Content = ({ isLight }) => {
    return (
      <div 
        className={`w-screen min-h-screen flex flex-col items-center justify-center relative ${
          isLight ? 'bg-[#FAFAFA]' : 'bg-[#050508]'
        }`}
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
      >
        {/* Giant Background 404 */}
        <div 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-black text-[45vw] md:text-[38vw] leading-none z-0 tracking-tighter ${
            isLight ? 'text-[#F3F4F6]' : 'text-[#0D0E15]'
          }`}
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)'
          }}
        >
          404
        </div>

        {/* Main Foreground Content */}
        <div className="z-10 flex flex-col items-center text-center w-full px-6 mt-[-4%] max-w-xl">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={`text-[42px] md:text-[64px] font-bold tracking-tight mb-4 ${
              isLight ? 'text-[#111827]' : 'text-[#FFFFFF]'
            }`}
          >
            Not found
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className={`text-[15px] md:text-[17px] mb-12 font-medium ${
              isLight ? 'text-[#6B7280]' : 'text-[#86868B]'
            }`}
          >
            A página que você está procurando não existe.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            {/* Voltar button */}
            <button 
              onClick={() => navigate(-1)} 
              className={`flex flex-1 sm:flex-none items-center justify-center gap-2 w-full sm:w-[160px] h-[52px] rounded-[6px] text-[15px] font-semibold transition-transform duration-300 outline-none cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                isLight 
                  ? 'bg-white text-[#111827] border border-[#E5E7EB] shadow-sm hover:shadow-md' 
                  : 'bg-[#0E1015] text-white border border-[#1E293B] hover:bg-[#151821]'
              }`}
            >
              <ArrowLeft size={18} strokeWidth={2.5} /> Voltar
            </button>

            {/* Início button */}
            <button 
              onClick={() => navigate('/')} 
              className={`flex flex-1 sm:flex-none items-center justify-center gap-2 w-full sm:w-[160px] h-[52px] rounded-[6px] text-[15px] font-semibold transition-transform duration-300 outline-none cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                isLight 
                  ? 'bg-[#2563EB] text-white shadow-md hover:shadow-lg' 
                  : 'bg-white text-[#050508] border border-white hover:bg-[#F3F4F6]'
              }`}
            >
              <Home size={18} strokeWidth={2.5} /> Início
            </button>
          </motion.div>
        </div>

        {/* Rising Foam Bubbles (Desktop Only) */}
        <div className="hidden md:block absolute bottom-0 left-0 w-full h-[40vh] overflow-hidden pointer-events-none z-0">
          {bubbles.map((b) => (
            <motion.div
              key={b.id}
              className={`absolute rounded-full filter blur-[2px] ${
                isLight ? 'bg-black opacity-10' : 'bg-white opacity-10'
              }`}
              style={{
                width: b.size,
                height: b.size,
                left: `${b.x}%`,
                bottom: -50,
              }}
              animate={{
                y: ["0vh", "-45vh"],
                x: [0, b.wiggle, -b.wiggle, 0],
                opacity: [0, 0.4, 0.6, 0]
              }}
              transition={{
                y: { duration: b.duration, repeat: Infinity, delay: b.delay, ease: "linear" },
                x: { duration: b.duration / 2, repeat: Infinity, delay: b.delay, ease: "easeInOut" },
                opacity: { duration: b.duration, repeat: Infinity, delay: b.delay, ease: "easeInOut" }
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050508]">
      {/* Dark Side (Acts as base) */}
      <div className="absolute inset-0 z-0">
        <Content isLight={false} />
      </div>

      {/* Light Side (Overlay clipped exactly at 50% width) */}
      <div 
        className="absolute inset-0 z-10 pointer-events-auto"
        style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}
      >
        <Content isLight={true} />
      </div>
    </div>
  );
}
