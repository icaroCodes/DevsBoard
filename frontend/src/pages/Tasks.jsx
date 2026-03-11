import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, CheckSquare, X, ListTodo, Search, Filter, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmModalContext';

function TaskStatusCheck({ completed, priority, onClick }) {
  const getBorderColor = () => {
    if (priority === 'high') return 'border-[#FF453A] group-hover:bg-[#FF453A]/20';
    if (priority === 'medium') return 'border-[#FF9F0A] group-hover:bg-[#FF9F0A]/20';
    if (priority === 'low') return 'border-[#32D74B] group-hover:bg-[#32D74B]/20';
    return 'border-[#86868B]/50 group-hover:bg-white/10';
  };

  if (completed) {
    return (
      <button type="button" onClick={onClick} className="w-6 h-6 rounded-full bg-[#0A84FF] flex items-center justify-center shrink-0 shadow-sm transition-all outline-none cursor-pointer">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
          <CheckSquare size={14} className="text-white" strokeWidth={3} />
        </motion.div>
      </button>
    );
  }
  
  return (
    <button type="button" onClick={onClick} className={`w-6 h-6 rounded-full border-[2px] ${getBorderColor()} shrink-0 transition-all outline-none cursor-pointer`} />
  );
}

export default function Tasks() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', submitting: false });
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();

  const load = () => {
    api('/tasks').then(setItems).catch(err => showError(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const filteredItems = items.filter(i => {
    if (filter === 'completed') return i.completed;
    if (filter === 'pending') return !i.completed;
    return true;
  });

  const pendingCount = items.filter(i => !i.completed).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.submitting) return;
    setForm(prev => ({ ...prev, submitting: true }));
    try {
      const payload = { ...form };
      delete payload.submitting;

      if (editing) {
        await api(`/tasks/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/tasks', { method: 'POST', body: JSON.stringify(payload) });
      }
      setModalOpen(false);
      setEditing(null);
      setForm({ title: '', description: '', priority: 'medium', submitting: false });
      success(editing ? 'Tarefa atualizada' : 'Tarefa criada');
      load();
    } catch (err) {
      showError(err.message);
      setForm(prev => ({ ...prev, submitting: false }));
    }
  };

  const toggleComplete = async (item) => {
    // Optimistic update
    setItems(items.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i));
    try {
      await api(`/tasks/${item.id}`, { method: 'PUT', body: JSON.stringify({ completed: !item.completed }) });
      setItems(await api('/tasks'));
    } catch (err) {
      showError(err.message);
      load(); // revert
    }
  };

  const handleDelete = async (id) => {
    confirm({
      title: 'Excluir tarefa?',
      message: 'Esta ação não pode ser desfeita e a tarefa será permanentemente removida.',
      onConfirm: async () => {
        try {
          await api(`/tasks/${id}`, { method: 'DELETE' });
          success('Tarefa excluída');
          load();
        } catch (err) {
          showError(err.message);
        }
      }
    });
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ title: item.title, description: item.description || '', priority: item.priority });
    setModalOpen(true);
  };

  const priorityLabels = { none: 'Nenhuma', low: 'Baixa', medium: 'Média', high: 'Alta' };
  const priorityColors = { none: 'text-[#86868B]', low: 'text-[#32D74B]', medium: 'text-[#FF9F0A]', high: 'text-[#FF453A]' };
  const priorityBg = { none: 'bg-[#86868B]/10', low: 'bg-[#32D74B]/10', medium: 'bg-[#FF9F0A]/10', high: 'bg-[#FF453A]/10' };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-[#0A84FF] border-t-transparent rounded-full"
        />
        <p className="text-[14px] text-[#86868B] font-medium tracking-wide">Carregando tarefas...</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto pb-12 font-sans"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-[32px] md:text-[40px] leading-tight font-semibold text-[#F5F5F7] tracking-tight">Tarefas</h1>
          <p className="text-[17px] text-[#86868B]">Você tem {pendingCount} tarefa{pendingCount !== 1 && 's'} pendente{pendingCount !== 1 && 's'}.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex p-1 bg-[#1C1C1E]/80 backdrop-blur-md rounded-[12px] shadow-sm border border-white/[0.04] relative">
            {['all', 'pending', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`relative px-5 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors z-10 outline-none ${filter === f ? 'text-[#F5F5F7]' : 'text-[#86868B] hover:text-[#F5F5F7]'}`}
              >
                {filter === f && (
                  <motion.div layoutId="activeTaskFilter" className="absolute inset-0 bg-[#3A3A3C] rounded-[8px] shadow-sm -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                )}
                {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendentes' : 'Concluídas'}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setForm({ title: '', description: '', priority: 'medium' });
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-5 py-2 rounded-[12px] bg-[#F5F5F7] text-[#000000] text-[14px] font-medium hover:bg-white transition-colors cursor-pointer shadow-sm"
          >
            <Plus size={16} strokeWidth={2.5} /> Nova Tarefa
          </button>
        </div>
      </motion.div>

      {/* Overview Status (Optional extra visual) */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-5 mb-8">
        <div className="bg-[#1C1C1E] rounded-[24px] p-6 border border-white/[0.04] flex items-center justify-between shadow-sm relative overflow-hidden group h-[120px]">
           <div className="z-10">
              <span className="text-[14px] font-medium text-[#86868B]">Pendentes</span>
              <p className="text-[32px] font-semibold text-[#F5F5F7] tracking-tight mt-1">{pendingCount}</p>
           </div>
           <div className="w-12 h-12 rounded-full bg-[#0A84FF]/10 flex items-center justify-center text-[#0A84FF] z-10">
              <ListTodo size={24} strokeWidth={2} />
           </div>
           <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#0A84FF] opacity-[0.03] blur-3xl rounded-full pointer-events-none transition-opacity group-hover:opacity-[0.05]" />
        </div>
        <div className="bg-[#1C1C1E] rounded-[24px] p-6 border border-white/[0.04] flex items-center justify-between shadow-sm relative overflow-hidden group h-[120px]">
           <div className="z-10">
              <span className="text-[14px] font-medium text-[#86868B]">Concluídas</span>
              <p className="text-[32px] font-semibold text-[#F5F5F7] tracking-tight mt-1">{items.length - pendingCount}</p>
           </div>
           <div className="w-12 h-12 rounded-full bg-[#30D158]/10 flex items-center justify-center text-[#30D158] z-10">
              <CheckSquare size={24} strokeWidth={2} />
           </div>
           <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#30D158] opacity-[0.03] blur-3xl rounded-full pointer-events-none transition-opacity group-hover:opacity-[0.05]" />
        </div>
      </motion.div>

      {/* Task List */}
      <motion.div variants={itemVariants} className="bg-[#1C1C1E] rounded-[24px] border border-white/[0.04] flex flex-col min-h-[400px] shadow-sm">
        {filteredItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3 opacity-60 py-20">
            <ListTodo size={48} strokeWidth={1} className="text-[#86868B]" />
            <p className="text-[15px] text-[#86868B]">Nenhuma tarefa encontrada.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {filteredItems.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex items-center justify-between p-4 my-1 rounded-[16px] hover:bg-white/[0.03] transition-colors group cursor-default border border-transparent ${item.completed ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                  <div className="mt-1 sm:mt-0">
                     <TaskStatusCheck completed={item.completed} priority={item.priority} onClick={() => toggleComplete(item)} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 pr-4">
                    <span className={`text-[16px] font-medium truncate transition-colors ${item.completed ? 'line-through text-[#86868B]' : 'text-[#F5F5F7]'}`}>
                      {item.title}
                    </span>
                    {item.description && (
                       <span className={`text-[13px] mt-0.5 line-clamp-2 transition-colors ${item.completed ? 'text-[#86868B]/70' : 'text-[#86868B]'}`}>
                         {item.description}
                       </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-[6px] text-[12px] font-semibold tracking-wide uppercase ${priorityBg[item.priority] || ''} ${priorityColors[item.priority] || ''}`}>
                     {priorityLabels[item.priority] || item.priority}
                  </span>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(item)} className="p-2 text-[#86868B] hover:text-[#F5F5F7] rounded-[8px] hover:bg-white/10 transition-colors outline-none cursor-pointer">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-[#86868B] hover:text-[#FF453A] rounded-[8px] hover:bg-[#FF453A]/10 transition-colors outline-none cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#1C1C1E] border border-white/[0.08] rounded-[28px] p-7 w-full max-w-md shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[20px] font-semibold text-[#F5F5F7] tracking-tight">
                  {editing ? 'Editar Tarefa' : 'Nova Tarefa'}
                </h2>
                <button onClick={() => { setModalOpen(false); setEditing(null); }} className="p-2 text-[#86868B] hover:text-[#F5F5F7] rounded-[8px] bg-white/[0.04] hover:bg-white/[0.08] transition-colors outline-none cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#86868B] ml-1">Título da tarefa</label>
                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3.5 rounded-[16px] bg-[#2C2C2E] border border-transparent text-[15px] text-[#F5F5F7] focus:border-[#0A84FF] focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0A84FF]/10 focus:outline-none transition-all placeholder:text-[#86868B]/50" placeholder="Ex: Pagar a conta de luz" required />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#86868B] ml-1">Descrição detalhada</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3.5 rounded-[16px] bg-[#2C2C2E] border border-transparent text-[15px] text-[#F5F5F7] focus:border-[#0A84FF] focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0A84FF]/10 focus:outline-none transition-all placeholder:text-[#86868B]/50 resize-none" rows={3} placeholder="Notas adicionais..." />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#86868B] ml-1">Prioridade</label>
                    <div className="flex p-1 bg-[#2C2C2E] rounded-[16px] border border-white/[0.02] relative">
                      {['none', 'low', 'medium', 'high'].map(pLevel => (
                        <button type="button" key={pLevel} onClick={() => setForm({ ...form, priority: pLevel })} className={`relative flex-1 py-3 rounded-[12px] text-[13px] font-medium transition-colors z-10 outline-none ${form.priority === pLevel ? 'text-[#F5F5F7]' : 'text-[#86868B] hover:text-[#F5F5F7]'}`}>
                          {form.priority === pLevel && (
                             <motion.div layoutId="activePriority" className="absolute inset-0 bg-[#3A3A3C] rounded-[12px] shadow-sm -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                          )}
                          {priorityLabels[pLevel]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={form.submitting}
                    className="w-full py-4 rounded-[18px] bg-[#0A84FF] text-white text-[16px] font-semibold hover:bg-[#007AFF] transition-all shadow-lg shadow-[#0A84FF]/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {form.submitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : editing ? 'Salvar Alterações' : 'Criar Tarefa'}
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
