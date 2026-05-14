import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', confirmText: '', type: 'danger', requireInput: '', onConfirm: null, onCancel: null });
  const [inputValue, setInputValue] = useState('');
  const resolveRef = useRef(null);

  const confirm = useCallback(({ title, message, confirmText, type = 'danger', requireInput = '', onConfirm, onCancel }) => {
    setInputValue('');
    if (onConfirm) {
      setModal({ isOpen: true, title, message, confirmText, type, requireInput, onConfirm, onCancel });
      return;
    }
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModal({ isOpen: true, title, message, confirmText, type, requireInput, onConfirm: null, onCancel: null });
    });
  }, []);

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, isOpen: false }));
    setInputValue('');
  }, []);

  const handleConfirm = () => {
    if (modal.requireInput && inputValue !== modal.requireInput) return;
    if (modal.onConfirm) {
      modal.onConfirm(inputValue);
    } else if (resolveRef.current) {
      resolveRef.current(true);
    }
    resolveRef.current = null;
    closeModal();
  };

  const handleCancel = () => {
    if (modal.onCancel) {
      modal.onCancel();
    } else if (resolveRef.current) {
      resolveRef.current(false);
    }
    resolveRef.current = null;
    closeModal();
  };

  const isConfirmDisabled = modal.requireInput ? inputValue !== modal.requireInput : false;

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
              className="solid-modal relative w-full max-w-[340px] bg-[#202020]/80 backdrop-blur-xl border border-white/[0.08] rounded-[22px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif' }}
            >
              <div className="p-6 text-center">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${modal.type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-[#0A84FF]/10 text-[#0A84FF]'}`}>
                  <AlertCircle size={28} strokeWidth={2.5} />
                </div>
                <h3 className="text-[19px] font-semibold text-[#F5F5F7] tracking-tight mb-2 leading-tight">
                  {modal.title}
                </h3>
                <p className="text-[14px] text-[#A1A1A6] leading-snug px-2 mb-4">
                  {modal.message}
                </p>
                {modal.requireInput && (
                  <div className="mt-4 text-left">
                    <label className="block text-xs text-[#A1A1A6] mb-1.5 ml-1">Digite <strong>{modal.requireInput}</strong> para confirmar:</label>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={modal.requireInput}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[15px] text-white placeholder-white/20 outline-none focus:border-red-500/50 transition-colors"
                      autoFocus
                    />
                  </div>
                )}
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
                  disabled={isConfirmDisabled}
                  className={`flex-1 py-3.5 text-[17px] font-semibold transition-colors hover:bg-white/[0.04] ${modal.type === 'danger' ? 'text-[#FF453A]' : 'text-[#0A84FF]'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {modal.confirmText || 'Confirmar'}
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

