import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, Target, Check, X, Target as TargetIcon, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmModalContext';

export default function Goals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'performance', deadline_type: 'indefinite', target_value: '', submitting: false });
  const [addAmount, setAddAmount] = useState({ id: null, value: '' });
  const { success, error } = useToast();
  const { confirm } = useConfirm();

  const load = () => {
    setLoading(true);
    api('/goals')
      .then(data => {
        // Garantir que items seja sempre um array
        const goalsArray = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
        setItems(goalsArray);
      })
      .catch(err => {
        console.error('Erro ao buscar metas:', err);
        error(err.message);
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.submitting) return;
    setForm(prev => ({ ...prev, submitting: true }));
    try {
      const payload = { ...form };
      delete payload.submitting;

      // Converte para número apenas se for meta financeira e houver valor
      if (form.type === 'financial') {
        const val = parseFloat(form.target_value);
        payload.target_value = isNaN(val) ? 0 : val;
      } else {
        payload.target_value = 0;
      }

      if (editing) {
        await api(`/goals/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/goals', { method: 'POST', body: JSON.stringify(payload) });
      }

      setModalOpen(false);
      setEditing(null);
      setForm({ name: '', type: 'performance', deadline_type: 'indefinite', target_value: '', submitting: false });
      success(editing ? 'Meta atualizada!' : 'Meta criada!');
      load();
    } catch (err) {
      error(err.message);
      setForm(prev => ({ ...prev, submitting: false }));
    }
  };

  const toggleComplete = async (item) => {
    try {
      await api(`/goals/${item.id}`, { method: 'PUT', body: JSON.stringify({ completed: !item.completed }) });
      load();
    } catch (err) {
      error(err.message);
    }
  };

  const handleAddAmount = async (e) => {
    e.preventDefault();
    try {
      await api(`/goals/${addAmount.id}`, {
        method: 'PUT',
        body: JSON.stringify({ add_amount: parseFloat(addAmount.value) }),
      });
      setAddAmount({ id: null, value: '' });
      success('Valor adicionado!');
      load();
    } catch (err) {
      error(err.message);
    }
  };

  const handleDelete = async (item) => {
    confirm({
      title: 'Excluir meta?',
      message: item.saved_amount > 0
        ? `Esta meta possui R$ ${Number(item.saved_amount).toFixed(2)} guardados. Ao excluir, este valor será devolvido ao seu saldo. Deseja continuar?`
        : 'Tem certeza que deseja excluir esta meta?',
      onConfirm: async () => {
        try {
          await api(`/goals/${item.id}`, { method: 'DELETE' });
          success('Meta excluída e saldo devolvido!');
          load();
        } catch (err) {
          error(err.message);
        }
      }
    });
  };

  const deadlineLabels = { monthly: 'Mensal', yearly: 'Anual', indefinite: 'Livre' };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="max-w-4xl mx-auto pb-12 font-sans"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[32px] md:text-[40px] leading-tight font-semibold text-[#F5F5F7] tracking-tight">Metas</h1>
          <p className="text-[17px] text-[#86868B] mt-1">Defina e alcance seus objetivos</p>
        </div>

        <button
          onClick={() => { setEditing(null); setForm({ name: '', type: 'performance', deadline_type: 'indefinite', target_value: '' }); setModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#0A84FF] text-white font-medium hover:bg-[#007AFF] transition-all focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/50 shadow-sm outline-none"
        >
          <Plus size={18} strokeWidth={2.5} /> Nova Meta
        </button>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-2 border-[#0A84FF] border-t-transparent rounded-full"
          />
          <p className="text-[14px] text-[#86868B] font-medium tracking-wide">Buscando seus objetivos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[100px]">
          {(!items || items.length === 0) ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-full flex flex-col items-center justify-center py-24 bg-[#1C1C1E]/40 backdrop-blur-md rounded-[32px] border border-white/[0.04] border-dashed"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/[0.02] flex items-center justify-center mb-6">
                <TargetIcon size={32} className="text-[#86868B] opacity-40" />
              </div>
              <p className="text-[19px] font-semibold text-[#F5F5F7] tracking-tight">Comece sua jornada</p>
              <p className="text-[14px] text-[#86868B] mt-2 text-center max-w-[280px] leading-relaxed">
                Você ainda não tem metas definidas. Crie seu primeiro objetivo para começar a acompanhar seu progresso.
              </p>
            </motion.div>
          ) : (
            items.filter(Boolean).map((item) => {
              const saved = Number(item?.saved_amount) || 0;
              const target = Number(item?.target_value) || 0;
              let progress = 0;

              if (item?.type === 'financial' && target > 0) {
                progress = Math.min(100, (saved / target) * 100);
              } else if (item?.completed) {
                progress = 100;
              }

              if (isNaN(progress)) progress = 0;

              return (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  className={`relative p-6 bg-[#1C1C1E] border border-white/[0.04] rounded-[28px] shadow-sm overflow-hidden group transition-all duration-300 hover:border-white/10 ${item.completed ? 'opacity-60' : ''}`}
                >
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-start gap-4 flex-1">
                      <button
                        onClick={() => toggleComplete(item)}
                        className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center transition-all ${item.completed ? 'bg-[#30D158] text-zinc-950 shadow-lg shadow-[#30D158]/20' : 'bg-white/5 text-[#86868B] hover:bg-white/10'}`}
                      >
                        {item.completed ? <Check size={18} strokeWidth={3} /> : <Target size={18} />}
                      </button>
                      <div className="min-w-0">
                        <p className={`text-[17px] font-semibold text-[#F5F5F7] tracking-tight truncate ${item.completed ? 'line-through text-[#86868B]' : ''}`}>{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[12px] font-bold uppercase tracking-wider text-[#86868B]">{item.type === 'performance' ? 'Desempenho' : 'Financeira'}</span>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span className="text-[12px] font-bold uppercase tracking-wider text-[#8E9C78]">{deadlineLabels[item.deadline_type]}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditing(item); setForm({ name: item.name, type: item.type, deadline_type: item.deadline_type, target_value: item.target_value || '' }); setModalOpen(true); }} className="p-2 text-[#86868B] hover:text-[#0A84FF] rounded-full hover:bg-[#0A84FF]/10 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(item)} className="p-2 text-[#86868B] hover:text-[#FF453A] rounded-full hover:bg-[#FF453A]/10 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {item.type === 'financial' && (
                    <div className="mt-6 relative z-10">
                      <div className="flex justify-between items-end mb-2.5">
                        <div className="space-y-0.5">
                          <p className="text-[12px] font-medium text-[#86868B]">Progresso</p>
                          <p className="text-[15px] font-semibold text-[#F5F5F7]">R$ {saved.toFixed(0)} <span className="text-[#86868B] font-normal text-[13px]">/ R$ {target.toFixed(0)}</span></p>
                        </div>
                        <span className="text-[17px] font-bold text-[#F5F5F7] tracking-tight">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/[0.02]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                          className={`h-full rounded-full ${item.completed ? 'bg-[#30D158]' : 'bg-[#0A84FF]'} shadow-lg`}
                        />
                      </div>

                      {!item.completed && (
                        <div className="mt-4">
                          {addAmount.id === item.id ? (
                            <form onSubmit={handleAddAmount} className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Valor..."
                                autoFocus
                                value={addAmount.value}
                                onChange={(e) => setAddAmount({ ...addAmount, value: e.target.value })}
                                className="flex-1 px-4 py-2 rounded-full bg-[#2C2C2E] border border-transparent focus:border-[#0A84FF] text-[#F5F5F7] text-[14px] outline-none transition-all"
                                required
                              />
                              <button type="submit" className="px-4 py-2 rounded-full bg-[#F5F5F7] text-[#000000] text-[13px] font-bold hover:bg-white">Salvar</button>
                              <button type="button" onClick={() => setAddAmount({ id: null, value: '' })} className="p-2 text-[#86868B] hover:text-[#F5F5F7]"><X size={18} /></button>
                            </form>
                          ) : (
                            <button onClick={() => setAddAmount({ id: item.id, value: '' })} className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-[13px] font-bold text-[#86868B] hover:text-[#F5F5F7] transition-all">
                              + Adicionar Montante
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Aesthetic gradient blob */}
                  <div className={`absolute -top-12 -right-12 w-32 h-32 blur-3xl opacity-[0.03] rounded-full pointer-events-none group-hover:opacity-[0.06] transition-opacity ${item.completed ? 'bg-[#30D158]' : 'bg-[#0A84FF]'}`} />
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#1C1C1E] border border-white/[0.08] rounded-[32px] p-7 w-full max-w-md shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[20px] font-semibold text-[#F5F5F7] tracking-tight">
                  {editing ? 'Editar Meta' : 'Nova Meta'}
                </h2>
                <button onClick={() => { setModalOpen(false); setEditing(null); }} className="p-2 text-[#86868B] hover:text-[#F5F5F7] rounded-full bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#86868B] ml-1 uppercase tracking-wider">O que você quer alcançar?</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-[18px] bg-[#2C2C2E] border border-transparent text-[16px] text-[#F5F5F7] focus:border-[#0A84FF] focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0A84FF]/10 focus:outline-none transition-all placeholder:text-[#86868B]/50"
                    placeholder="Ex: Ler 12 livros, Guardar p/ iPhone"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#86868B] ml-1 uppercase tracking-wider">Tipo de Meta</label>
                  <div className="flex p-1 bg-[#2C2C2E] rounded-[16px] border border-white/[0.04] relative">
                    {['performance', 'financial'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm({ ...form, type })}
                        className={`relative flex-1 py-2.5 rounded-[12px] text-[13px] font-medium transition-colors z-10 outline-none ${form.type === type ? 'text-[#F5F5F7]' : 'text-[#86868B] hover:text-[#F5F5F7]'
                          }`}
                      >
                        {form.type === type && (
                          <motion.div
                            layoutId="goalTypeTab"
                            className="absolute inset-0 bg-[#3A3A3C] rounded-[12px] shadow-sm -z-10"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        {type === 'performance' ? 'Desempenho' : 'Financeira'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center justify-between ml-1 mb-1">
                    <label className="text-[13px] font-medium text-[#86868B] uppercase tracking-wider">Prazo da Meta</label>
                  </div>
                  <div className="flex p-1 bg-[#2C2C2E] rounded-[16px] border border-white/[0.04] relative">
                    {['monthly', 'yearly', 'indefinite'].map((dType) => (
                      <button
                        key={dType}
                        type="button"
                        onClick={() => setForm({ ...form, deadline_type: dType })}
                        className={`relative flex-1 py-2.5 rounded-[12px] text-[13px] font-medium transition-colors z-10 outline-none ${form.deadline_type === dType ? 'text-[#F5F5F7]' : 'text-[#86868B] hover:text-[#F5F5F7]'
                          }`}
                      >
                        {form.deadline_type === dType && (
                          <motion.div
                            layoutId="deadlineTypeTab"
                            className="absolute inset-0 bg-[#3A3A3C] rounded-[12px] shadow-sm -z-10"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        {deadlineLabels[dType]}
                      </button>
                    ))}
                  </div>
                </div>

                {form.type === 'financial' && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[13px] font-medium text-[#86868B] ml-1 uppercase tracking-wider">Valor do Objetivo (R$)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-[#86868B] text-[16px]">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={form.target_value}
                        onChange={(e) => setForm({ ...form, target_value: e.target.value })}
                        className="w-full pl-11 pr-5 py-3.5 rounded-[18px] bg-[#2C2C2E] border border-transparent text-[16px] text-[#F5F5F7] focus:border-[#0A84FF] focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0A84FF]/10 focus:outline-none transition-all placeholder:text-[#86868B]/50"
                        placeholder="0,00"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={form.submitting}
                    className="w-full py-4 rounded-[20px] bg-[#0A84FF] text-white text-[16px] font-semibold hover:bg-[#007AFF] transition-all active:scale-[0.98] shadow-lg shadow-[#0A84FF]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {form.submitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : editing ? 'Salvar Alterações' : 'Criar Objetivo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
