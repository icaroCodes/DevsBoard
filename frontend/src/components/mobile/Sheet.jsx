import { motion, AnimatePresence } from'framer-motion';
import { useEffect } from'react';

/**
 * Premium iOS-style bottom sheet.
 * Drag down to dismiss. Backdrop tap closes.
 * Use for secondary nav, contextual menus, picker UIs.
 */
export default function Sheet({
 open,
 onClose,
 title,
 children,
 maxHeight ='85dvh',
 showHandle = true,
}) {
 useEffect(() => {
 if (!open) return;
 const prev = document.body.style.overflow;
 document.body.style.overflow ='hidden';
 return () => {
 document.body.style.overflow = prev;
 };
 }, [open]);

 return (
 <AnimatePresence>
 {open && (
 <>
 <motion.div
 key="sheet-backdrop"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.2 }}
 onClick={onClose}
 className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-[2px]"
 />
 <motion.div
 key="sheet-panel"
 initial={{ y:'100%' }}
 animate={{ y: 0 }}
 exit={{ y:'100%' }}
 transition={{ type:'spring', stiffness: 380, damping: 38, mass: 0.9 }}
 drag="y"
 dragConstraints={{ top: 0, bottom: 0 }}
 dragElastic={{ top: 0, bottom: 0.6 }}
 onDragEnd={(_, info) => {
 if (info.offset.y > 120 || info.velocity.y > 600) onClose?.();
 }}
 className="fixed inset-x-0 bottom-0 z-[100] flex flex-col rounded-t-[24px] border-t border-white/[0.08] bg-[#161616] shadow-[0_-24px_64px_rgba(0,0,0,0.6)]"
 style={{
 maxHeight,
 paddingBottom:'env(safe-area-inset-bottom, 0px)',
 }}
 >
 {showHandle && (
 <div className="pt-2.5 pb-1 flex justify-center shrink-0">
 <div className="w-9 h-[5px] rounded-full bg-white/15" />
 </div>
 )}
 {title && (
 <div className="px-5 pt-2 pb-3 shrink-0">
 <h2 className="text-[17px] font-semibold tracking-tight text-[#F5F5F7]">
 {title}
 </h2>
 </div>
 )}
 <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain">
 {children}
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>
 );
}
