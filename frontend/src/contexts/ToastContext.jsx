import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const success = (msg) => addToast(msg, 'success');
    const error = (msg) => {
        if (msg?.startsWith('CHANGE_REQUEST:')) {
            addToast(msg.replace('CHANGE_REQUEST:', ''), 'success');
            return;
        }
        addToast(msg, 'error');
    };
    const info = (msg) => addToast(msg, 'info');

    return (
        <ToastContext.Provider value={{ success, error, info }}>
            {children}
            <div className="fixed top-6 right-6 z-[120] flex flex-col gap-3 pointer-events-none min-w-[320px]">
                <AnimatePresence mode='popLayout'>
                    {toasts.map((toast) => (
                        <ToastItem key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ message, type, onClose }) {
    const icons = {
        success: <CheckCircle className="text-[#32D74B]" size={20} strokeWidth={2.5} />,
        error: <AlertCircle className="text-[#FF453A]" size={20} strokeWidth={2.5} />,
        info: <Info className="text-[#0A84FF]" size={20} strokeWidth={2.5} />,
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 1, transition: { duration: 0.2 } }}
            whileHover={{ scale: 1.01 }}
            className={`solid-modal pointer-events-auto relative overflow-hidden flex items-center gap-3.5 px-4 py-4 rounded-[20px] border border-white/[0.08] bg-[#1C1C1E]/80 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] min-w-[300px] max-w-md`}
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif' }}
        >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center">
                {icons[type]}
            </div>
            
            <div className="flex-1 pr-2">
                <p className="text-[15px] font-semibold text-[#F5F5F7] leading-tight">
                    {type === 'success' ? 'Sucesso' : type === 'error' ? 'Erro' : 'Informação'}
                </p>
                <p className="text-[13px] text-[#A1A1A6] mt-0.5 line-clamp-2 leading-snug">
                    {message}
                </p>
            </div>

            <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-[#86868B] transition-colors"
            >
                <X size={14} strokeWidth={2.5} />
            </button>

            {}
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/[0.03]">
                <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    className={`h-full ${type === 'success' ? 'bg-[#32D74B]' : type === 'error' ? 'bg-[#FF453A]' : 'bg-[#0A84FF]'} opacity-50`}
                />
            </div>
        </motion.div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}
