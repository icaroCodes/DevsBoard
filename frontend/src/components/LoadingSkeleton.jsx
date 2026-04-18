import { motion } from 'framer-motion';

/**
 * LoadingSkeleton — único loader do app.
 * Minimalista, com shimmer suave no tema dark.
 */
export default function LoadingSkeleton({ fullScreen = true }) {
  const shimmer = {
    background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 100%)',
    backgroundSize: '200% 100%',
  };

  const shimmerAnim = {
    animate: { backgroundPosition: ['200% 0%', '-200% 0%'] },
    transition: { duration: 1.6, repeat: Infinity, ease: 'linear' },
  };

  const Block = ({ className }) => (
    <motion.div
      {...shimmerAnim}
      style={shimmer}
      className={`rounded-xl ${className}`}
    />
  );

  return (
    <div
      className={
        fullScreen
          ? 'min-h-screen bg-zinc-950 flex items-center justify-center px-6'
          : 'w-full flex items-center justify-center px-6 py-16'
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md flex flex-col items-center gap-6"
      >
        <div className="text-[15px] font-bold tracking-wider text-white/90">
          Devs<span className="text-[#8E9C78]">Board</span>
        </div>

        <div className="w-full flex flex-col gap-3">
          <Block className="h-10 w-3/5" />
          <Block className="h-3 w-4/5" />
          <Block className="h-3 w-2/3" />
        </div>

        <div className="w-full grid grid-cols-3 gap-3 mt-2">
          <Block className="h-20" />
          <Block className="h-20" />
          <Block className="h-20" />
        </div>

        <div className="w-full flex flex-col gap-2 mt-2">
          <Block className="h-14" />
          <Block className="h-14" />
        </div>
      </motion.div>
    </div>
  );
}
