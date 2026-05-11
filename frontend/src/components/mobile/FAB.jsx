import { motion, AnimatePresence } from'framer-motion';

/**
 * Floating Action Button — sits above the bottom nav.
 * Driven by MobileFabContext: pages register their primary action.
 */
export default function FAB({ fab }) {
 return (
 <AnimatePresence mode="wait">
 {fab && (
 <motion.button
 key={fab.label ||'fab'}
 type="button"
 onClick={fab.onClick}
 aria-label={fab.label}
 initial={{ opacity: 0, scale: 0.6, y: 12 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.6, y: 12 }}
 whileTap={{ scale: 0.92 }}
 transition={{ type:'spring', stiffness: 420, damping: 28 }}
 className="fixed right-4 z-[60] w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_12px_28px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
 style={{
 bottom:'calc(env(safe-area-inset-bottom, 0px) + 80px)',
 background:
 fab.tone ==='accent'
 ?'linear-gradient(135deg, #8E9C78 0%, #6B7B58 100%)'
 :'linear-gradient(135deg, #2A2A2A 0%, #161616 100%)',
 border:'1px solid rgba(255,255,255,0.08)',
 }}
 >
 {fab.icon && <fab.icon size={22} strokeWidth={2} />}
 </motion.button>
 )}
 </AnimatePresence>
 );
}
