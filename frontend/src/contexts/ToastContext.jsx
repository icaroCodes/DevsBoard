import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const success = (msg) => addToast(msg, 'success');
    const error = (msg) => addToast(msg, 'error');
    const info = (msg) => addToast(msg, 'info');

    return (
        <ToastContext.Provider value={{ success, error, info }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
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
        success: <CheckCircle className="text-green-400" size={20} />,
        error: <AlertCircle className="text-red-400" size={20} />,
        info: <Info className="text-blue-400" size={20} />,
    };

    const bgColors = {
        success: 'bg-zinc-900 border-green-500/20',
        error: 'bg-zinc-900 border-red-500/20',
        info: 'bg-zinc-900 border-blue-500/20',
    };

    const barColors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.2, ease: 'easeIn' } }}
            drag="x"
            dragConstraints={{ left: -100, right: 100 }}
            whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
            onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 60) onClose();
            }}
            className={`pointer-events-auto relative overflow-hidden flex items-center gap-3 px-4 py-4 rounded-xl border shadow-2xl min-w-[300px] max-w-md ${bgColors[type]}`}
        >
            <div className="flex-shrink-0">{icons[type]}</div>
            <p className="text-sm font-medium text-zinc-100 flex-1">{message}</p>
            <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 transition-colors"
            >
                <X size={16} />
            </button>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-zinc-800/50">
                <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    className={`h-full ${barColors[type]}`}
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
