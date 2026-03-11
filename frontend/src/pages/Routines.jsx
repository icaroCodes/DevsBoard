import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, ChevronDown, Repeat, CheckSquare, X } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmModalContext';

function TaskStatusCheck({ completed, colorClass = "bg-[#BF5AF2]" }) {
  if (completed) {
    return (
      <div className={`w-5 h-5 rounded-full ${colorClass} flex items-center justify-center shrink-0 shadow-sm transition-all`}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
          <CheckSquare size={12} className="text-white" strokeWidth={3} />
        </motion.div>
      </div>
    );
  }
  return <div className={`w-5 h-5 rounded-full border-[2px] border-[#86868B]/50 shrink-0 transition-all hover:bg-white/10`} />;
}

export default function Routines() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [form, setForm] = useState({ name: '', visual_type: 'daily' });
  const [taskForm, setTaskForm] = useState({ routineId: null, title: '', description: '', priority: 'medium' });
  const { success, error } = useToast();
  const { confirm } = useConfirm();

  const load = () => {
    api('/routines').then(setItems).catch(err => error(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api(`/routines/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await api('/routines', { method: 'POST', body: JSON.stringify(form) });
      }
      setModalOpen(false);
      setEditing(null);
      setForm({ name: '', visual_type: 'daily' });
      success(editing ? 'Rotina atualizada!' : 'Rotina criada!');
      load();
    } catch (err) {
      error(err.message);
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    try {
      await api(`/routines/${taskForm.routineId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({ title: taskForm.title, description: taskForm.description, priority: taskForm.priority }),
      });
      setTaskForm({ routineId: null, title: '', description: '', priority: 'medium' });
      success('Tarefa adicionada à rotina!');
      load();
    } catch (err) {
      error(err.message);
    }
  };

  const toggleTask = async (routineId, task) => {
    try {
      await api(`/routines/${routineId}/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !task.completed }),
      });
      load();
    } catch (err) {
      error(err.message);
    }
  };

  const deleteTask = async (routineId, taskId) => {
    confirm({
      title: 'Excluir tarefa?',
      message: 'Deseja remover esta tarefa desta rotina?',
      onConfirm: async () => {
        try {
          await api(`/routines/${routineId}/tasks/${taskId}`, { method: 'DELETE' });
          success('Tarefa removida!');
          load();
        } catch (err) {
          error(err.message);
        }
      }
    });
  };

  const handleDelete = async (id) => {
    confirm({
      title: 'Excluir rotina?',
      message: 'Tem certeza que deseja excluir esta rotina inteira? Todas as tarefas associadas serão perdidas.',
      onConfirm: async () => {
        try {
          await api(`/routines/${id}`, { method: 'DELETE' });
          success('Rotina excluída!');
          load();
        } catch (err) {
          error(err.message);
        }
      }
    });
  };

  const visualLabels = { daily: 'Diária', weekly: 'Semanal', monthly: 'Mensal' };
  
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
          <h1 className="text-[32px] md:text-[40px] leading-tight font-semibold text-[#F5F5F7] tracking-tight">
             Rotinas
          </h1>
          <p className="text-[15px] text-[#86868B] mt-1">Gerencie seus hábitos recorrentes</p>
        </div>
        
        <button
          onClick={() => { setEditing(null); setForm({ name: '', visual_type: 'daily' }); setModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#0A84FF] text-white font-medium hover:bg-[#5E94FF] transition-all focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/50 shadow-sm"
        >
          <Plus size={18} strokeWidth={2.5} /> Nova Rotina
        </button>
      </div>

      {loading ? (
        <div className="flex gap-2 items-center justify-center h-[40vh]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#86868B] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-[#86868B] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-[#86868B] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      ) : (
        <div className="space-y-4">
          {items.length === 0 ? (
            <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-20 bg-[#1C1C1E] rounded-[24px] border border-white/[0.04]">
              <Repeat size={48} className="text-[#86868B] mb-4 opacity-50" strokeWidth={1.5} />
              <p className="text-[17px] font-medium text-[#F5F5F7]">Nenhuma rotina configurada</p>
              <p className="text-[14px] text-[#86868B] mt-2 text-center max-w-sm">Crie rotinas diárias, semanais ou mensais para acompanhar seus hábitos consistentes.</p>
            </motion.div>
          ) : (
            items.map((r, i) => (
              <motion.div 
                key={r.id} 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
                className="bg-[#1C1C1E] border border-white/[0.04] rounded-[24px] overflow-hidden shadow-sm transition-all duration-300 hover:border-white/10"
              >
                <div
                  className="flex justify-between items-center p-5 sm:px-6 cursor-pointer select-none group"
                  onClick={() => setExpanded({ ...expanded, [r.id]: !expanded[r.id] })}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#2C2C2E] flex items-center justify-center shrink-0">
                       <Repeat size={18} className="text-[#BF5AF2]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-[17px] text-[#F5F5F7] tracking-tight">{r.name}</p>
                        <span className="px-2 py-0.5 rounded-[6px] bg-[#BF5AF2]/10 text-[#BF5AF2] text-[12px] font-medium tracking-wide">
                          {visualLabels[r.visual_type]}
                        </span>
                      </div>
                      <p className="text-[14px] text-[#86868B] mt-0.5">
                        {r.tasks?.length || 0} {(r.tasks?.length === 1) ? 'tarefa' : 'tarefas'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                       <button 
                         onClick={() => { setEditing(r); setForm({ name: r.name, visual_type: r.visual_type }); setModalOpen(true); }} 
                         className="p-2 text-[#86868B] hover:text-[#0A84FF] hover:bg-[#0A84FF]/10 rounded-full transition-colors"
                       >
                         <Pencil size={16} />
                       </button>
                       <button 
                         onClick={() => handleDelete(r.id)} 
                         className="p-2 text-[#86868B] hover:text-[#FF453A] hover:bg-[#FF453A]/10 rounded-full transition-colors"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                    
                    <motion.div
                       animate={{ rotate: expanded[r.id] ? 180 : 0 }}
                       transition={{ duration: 0.2 }}
                       className="text-[#86868B]"
                    >
                      <ChevronDown size={20} />
                    </motion.div>
                  </div>
                </div>
                
                <AnimatePresence>
                  {expanded[r.id] && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden border-t border-white/[0.04]"
                    >
                      <div className="p-4 sm:p-6 bg-[#161618] space-y-2">
                        {(r.tasks || []).map((t) => (
                          <div 
                            key={t.id} 
                            className="group flex items-center justify-between p-3.5 bg-transparent hover:bg-white/[0.03] rounded-[16px] transition-colors"
                          >
                            <label className="flex items-center gap-3 cursor-pointer flex-1" onClick={(e) => { e.preventDefault(); toggleTask(r.id, t); }}>
                              <TaskStatusCheck completed={t.completed} colorClass="bg-[#BF5AF2]" />
                              <span className={`text-[15px] font-medium transition-colors ${t.completed ? 'text-[#86868B] line-through' : 'text-[#F5F5F7]'}`}>
                                {t.title}
                              </span>
                            </label>
                            <button 
                              onClick={() => deleteTask(r.id, t.id)} 
                              className="ml-auto p-1.5 text-[#86868B] hover:text-[#FF453A] opacity-0 group-hover:opacity-100 transition-all rounded-md"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        
                        {taskForm.routineId === r.id ? (
                          <motion.form 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onSubmit={handleTaskSubmit} 
                            className="flex items-center gap-3 p-2 bg-[#2C2C2E] border border-white/[0.08] rounded-[16px] mt-2"
                          >
                            <div className="flex-1 ml-2">
                              <input
                                type="text"
                                placeholder="O que precisa ser feito?"
                                value={taskForm.title}
                                autoFocus
                                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                className="w-full bg-transparent border-none outline-none text-[15px] text-[#F5F5F7] placeholder:text-[#86868B]"
                                required
                              />
                            </div>
                            <div className="flex gap-1">
                              <button type="submit" className="p-2 rounded-full bg-[#BF5AF2] text-white hover:bg-[#D47FFF] transition-colors">
                                <Plus size={16} strokeWidth={2.5} />
                              </button>
                              <button type="button" onClick={() => setTaskForm({ routineId: null, title: '', description: '', priority: 'medium' })} className="p-2 rounded-full text-[#86868B] hover:bg-white/10 hover:text-[#F5F5F7] transition-colors">
                                <X size={16} />
                              </button>
                            </div>
                          </motion.form>
                        ) : (
                          <button
                            onClick={() => setTaskForm({ ...taskForm, routineId: r.id })}
                            className="flex items-center gap-2 mt-2 px-3 py-2 text-[14px] font-medium text-[#BF5AF2] hover:bg-[#BF5AF2]/10 rounded-[12px] transition-colors"
                          >
                            <Plus size={16} /> Nova Tarefa
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/40 backdrop-blur-md"
               onClick={() => { setModalOpen(false); setEditing(null); }}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="relative w-full max-w-[400px] bg-[#1C1C1E] border border-white/[0.08] shadow-2xl rounded-[24px] overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-white/[0.04] flex items-center justify-between">
                 <h2 className="text-[17px] font-semibold text-[#F5F5F7]">
                    {editing ? 'Editar Rotina' : 'Nova Rotina'}
                 </h2>
                 <button onClick={() => { setModalOpen(false); setEditing(null); }} className="text-[#86868B] hover:text-[#F5F5F7] transition-colors">
                    <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-[13px] font-medium text-[#86868B] mb-2 uppercase tracking-wider">Nome da Rotina</label>
                  <input
                    type="text"
                    value={form.name}
                    placeholder="Ex: Treino, Leitura, Finanças"
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-[12px] bg-[#2C2C2E] border border-transparent focus:border-[#0A84FF] text-[#F5F5F7] text-[15px] outline-none transition-colors placeholder:text-[#86868B]"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[13px] font-medium text-[#86868B] mb-2 uppercase tracking-wider">Frequência</label>
                  <div className="relative">
                    <select
                      value={form.visual_type}
                      onChange={(e) => setForm({ ...form, visual_type: e.target.value })}
                      className="w-full px-4 py-3 rounded-[12px] bg-[#2C2C2E] border border-transparent focus:border-[#0A84FF] text-[#F5F5F7] text-[15px] outline-none transition-colors appearance-none"
                    >
                      <option value="daily">Diária</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensal</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#86868B] pointer-events-none" />
                  </div>
                </div>
                
                <div className="pt-2">
                  <button type="submit" className="w-full py-3 rounded-[12px] bg-[#0A84FF] hover:bg-[#5E94FF] text-white text-[15px] font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/50 outline-none">
                    {editing ? 'Salvar Alterações' : 'Criar Rotina'}
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
