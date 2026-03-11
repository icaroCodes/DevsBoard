import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null, type: 'danger' });

    const confirm = useCallback(({ title, message, onConfirm, onCancel, type = 'danger' }) => {
        setModal({ isOpen: true, title, message, onConfirm, onCancel, type });
    }, []);

    const closeModal = useCallback(() => {
        setModal((prev) => ({ ...prev, isOpen: false }));
    }, []);

    const handleConfirm = () => {
        if (modal.onConfirm) modal.onConfirm();
        closeModal();
    };

    const handleCancel = () => {
        if (modal.onCancel) modal.onCancel();
        closeModal();
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AnimatePresence>
                {modal.isOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCancel}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 1.05, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.05, y: 10, transition: { duration: 0.15, ease: "easeIn" } }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-[340px] bg-[#1C1C1E]/80 backdrop-blur-xl border border-white/[0.08] rounded-[22px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif' }}
                        >
                            <div className="p-6 text-center">
                                <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${modal.type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-[#0A84FF]/10 text-[#0A84FF]'}`}>
                                    <AlertCircle size={28} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-[19px] font-semibold text-[#F5F5F7] tracking-tight mb-2 leading-tight">
                                    {modal.title}
                                </h3>
                                <p className="text-[14px] text-[#A1A1A6] leading-snug px-2">
                                    {modal.message}
                                </p>
                            </div>

                            <div className="flex border-t border-white/[0.06]">
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 py-3.5 text-[17px] font-medium text-[#0A84FF] hover:bg-white/[0.04] transition-colors border-r border-white/[0.06]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={`flex-1 py-3.5 text-[17px] font-semibold transition-colors hover:bg-white/[0.04] ${modal.type === 'danger' ? 'text-[#FF453A]' : 'text-[#0A84FF]'}`}
                                >
                                    Confirmar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
    return context;
}
