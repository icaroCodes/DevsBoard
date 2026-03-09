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
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10, transition: { duration: 0.15 } }}
                            className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg ${modal.type === 'danger' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    <AlertCircle size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-zinc-100">{modal.title}</h3>
                                <button onClick={handleCancel} className="ml-auto p-1 text-zinc-500 hover:text-zinc-300 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                                {modal.message}
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 py-2 px-4 rounded-xl font-medium text-zinc-400 hover:bg-zinc-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={`flex-1 py-2 px-4 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 ${modal.type === 'danger'
                                            ? 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30'
                                            : 'bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-lg shadow-cyan-500/30'
                                        }`}
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
