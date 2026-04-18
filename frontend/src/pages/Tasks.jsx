import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Pencil, X, Loader2, LayoutList,
  GripVertical, Check, CheckSquare, ListTodo, Kanban, Circle, Clock, MoreHorizontal, CopyPlus, CheckCircle2
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmModalContext';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeSubscription } from '../contexts/RealtimeContext';
import { useTranslation } from '../utils/translations';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/* ──────────────────────────────────────────────────────
   VIEW TOGGLE
────────────────────────────────────────────────────── */
function ViewToggle({ view, onChange }) {
  const { t } = useTranslation();
  return (
    <div className="flex p-1 bg-[#1C1C1E]/80 backdrop-blur-md rounded-[12px] shadow-sm border border-white/[0.04] relative">
      {[
<<<<<<< HEAD
        { id: 'list', label: 'Ver em Lista', Icon: LayoutList },
        { id: 'board', label: 'Ver em Blocos', Icon: Kanban },
=======
        { id: 'list', label: t.viewList, Icon: LayoutList },
        { id: 'board', label: t.viewBoard, Icon: Kanban },
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
      ].map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors outline-none cursor-pointer z-10 ${view === id ? 'text-[#F5F5F7]' : 'text-[#86868B] hover:text-[#F5F5F7]'}`}
        >
          {view === id && (
            <motion.div
              layoutId="activeViewFilter"
              className="absolute inset-0 bg-[#3A3A3C] rounded-[8px] shadow-sm -z-10"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <Icon size={14} strokeWidth={2} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   TASK STATUS CHECK (list view)
────────────────────────────────────────────────────── */
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

<<<<<<< HEAD
const priorityLabels = { none: 'Não marcado', low: 'Pode esperar', medium: 'Importante', high: 'Muito Urgente' };
=======
const getPriorityLabels = (t) => ({ none: t.priorityNone, low: t.priorityLow, medium: t.priorityMedium, high: t.priorityHigh });
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
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

/* ──────────────────────────────────────────────────────
   LIST VIEW
────────────────────────────────────────────────────── */
function ListView() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formParams, setFormParams] = useState({ title: '', description: '', priority: 'medium', submitting: false });
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();
  const { activeTeam } = useAuth();
  const { t } = useTranslation();
  const priorityLabels = getPriorityLabels(t);

  const load = () => {
    setLoading(true);
    api('/tasks').then(data => { setItems(data); setLoading(false); }).catch(err => { showError(err.message); setLoading(false); });
  };

  useEffect(() => {
    load();
  }, [activeTeam]);

  useRealtimeSubscription(['tasks'], () => { load(); });

  const filteredItems = items.filter(i => {
    if (filter === 'completed') return i.completed;
    if (filter === 'pending') return !i.completed;
    return true;
  });

  const pendingCount = items.filter(i => !i.completed).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formParams.submitting) return;
    setFormParams(prev => ({ ...prev, submitting: true }));
    try {
      const payload = { ...formParams };
      delete payload.submitting;

      if (editing) {
        await api(`/tasks/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/tasks', { method: 'POST', body: JSON.stringify(payload) });
      }
      setModalOpen(false);
      setEditing(null);
      setFormParams({ title: '', description: '', priority: 'medium', submitting: false });
<<<<<<< HEAD
      success(editing ? 'Pronto, atualizado!' : 'Pronto, criado!');
=======
      success(editing ? t.taskUpdated : t.taskCreated);
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
      load();
    } catch (err) {
      showError(err.message);
      setFormParams(prev => ({ ...prev, submitting: false }));
    }
  };

  const toggleComplete = async (item) => {
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
<<<<<<< HEAD
      title: 'Apagar esta atividade?',
      message: 'Você tem certeza? Isso vai remover a atividade da lista para sempre.',
      onConfirm: async () => {
        try {
          await api(`/tasks/${id}`, { method: 'DELETE' });
          success('Atividade removida');
=======
      title: t.taskDelConfirm,
      message: t.taskDelText,
      onConfirm: async () => {
        try {
          await api(`/tasks/${id}`, { method: 'DELETE' });
          success(t.taskDeleted);
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
          load();
        } catch (err) {
          showError(err.message);
        }
      }
    });
  };

  const openEdit = (item) => {
    setEditing(item);
    setFormParams({ title: item.title, description: item.description || '', priority: item.priority || 'medium', submitting: false });
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-[#0A84FF] border-t-transparent rounded-full"
        />
<<<<<<< HEAD
        <p className="text-[14px] text-[#86868B] font-medium tracking-wide">Organizando suas atividades...</p>
=======
        <p className="text-[14px] text-[#86868B] font-medium tracking-wide">{t.taskLoading}</p>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
      </div>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 lg:mb-10">
        <div className="space-y-1">
<<<<<<< HEAD
          <h1 className="text-[32px] md:text-[40px] leading-tight font-semibold text-[#F5F5F7] tracking-tight">Minhas Atividades</h1>
          <p className="text-[15px] sm:text-[17px] text-[#86868B]">Você tem {pendingCount} atividade{pendingCount !== 1 && 's'} para concluir.</p>
=======
          <h1 className="text-[32px] md:text-[40px] leading-tight font-semibold text-[#F5F5F7] tracking-tight">{t.taskTitle}</h1>
          <p className="text-[15px] sm:text-[17px] text-[#86868B]">{pendingCount} {pendingCount !== 1 ? t.taskFilterPending.toLowerCase() : t.taskFilterPending.toLowerCase()}.</p>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex p-1 bg-[#1C1C1E]/80 backdrop-blur-md rounded-[12px] shadow-sm border border-white/[0.04] relative">
            {['all', 'pending', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`relative flex-1 sm:flex-none px-2 sm:px-5 py-2 sm:py-1.5 rounded-[8px] text-[12px] sm:text-[13px] font-medium transition-colors z-10 outline-none ${filter === f ? 'text-[#F5F5F7]' : 'text-[#86868B] hover:text-[#F5F5F7]'}`}
              >
                {filter === f && (
                  <motion.div layoutId="activeTaskFilter" className="absolute inset-0 bg-[#3A3A3C] rounded-[8px] shadow-sm -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                )}
<<<<<<< HEAD
                <span className="whitespace-nowrap">{f === 'all' ? 'Tudo' : f === 'pending' ? 'Para fazer' : 'Terminadas'}</span>
=======
                <span className="whitespace-nowrap">{f === 'all' ? t.taskFilterAll : f === 'pending' ? t.taskFilterPending : t.taskFilterCompleted}</span>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setFormParams({ title: '', description: '', priority: 'medium', submitting: false });
              setModalOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-3 sm:py-2 rounded-[12px] sm:rounded-[10px] bg-[#F5F5F7] text-[#000000] text-[14px] sm:text-[13px] font-bold hover:bg-white transition-all cursor-pointer shadow-sm active:scale-95"
          >
<<<<<<< HEAD
            <Plus size={16} strokeWidth={3} className="sm:w-4 sm:h-4" /> Nova Atividade
=======
            <Plus size={14} strokeWidth={3} /> {t.taskNewBtn}
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-5 mb-8">
        <div className="bg-[#1C1C1E] rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 border border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between shadow-sm relative overflow-hidden group h-[100px] sm:h-[120px]">
          <div className="z-10">
<<<<<<< HEAD
            <span className="text-[12px] sm:text-[14px] font-medium text-[#86868B]">Para fazer</span>
=======
            <span className="text-[12px] sm:text-[14px] font-medium text-[#86868B]">{t.taskPendingLabel}</span>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
            <p className="text-[24px] sm:text-[32px] font-semibold text-[#F5F5F7] tracking-tight mt-0.5 sm:mt-1">{pendingCount}</p>
          </div>
          <div className="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#0A84FF]/10 flex items-center justify-center text-[#0A84FF] z-10 transition-transform group-hover:scale-110">
            <ListTodo size={18} className="sm:hidden" strokeWidth={2} />
            <ListTodo size={24} className="hidden sm:block" strokeWidth={2} />
          </div>
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#0A84FF] opacity-[0.03] blur-3xl rounded-full pointer-events-none transition-opacity group-hover:opacity-[0.05]" />
        </div>
        <div className="bg-[#1C1C1E] rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 border border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between shadow-sm relative overflow-hidden group h-[100px] sm:h-[120px]">
          <div className="z-10">
<<<<<<< HEAD
            <span className="text-[12px] sm:text-[14px] font-medium text-[#86868B]">Terminadas</span>
=======
            <span className="text-[12px] sm:text-[14px] font-medium text-[#86868B]">{t.taskCompletedLabel}</span>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
            <p className="text-[24px] sm:text-[32px] font-semibold text-[#F5F5F7] tracking-tight mt-0.5 sm:mt-1">{items.length - pendingCount}</p>
          </div>
          <div className="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#30D158]/10 flex items-center justify-center text-[#30D158] z-10 transition-transform group-hover:scale-110">
            <CheckSquare size={18} className="sm:hidden" strokeWidth={2} />
            <CheckSquare size={24} className="hidden sm:block" strokeWidth={2} />
          </div>
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#30D158] opacity-[0.03] blur-3xl rounded-full pointer-events-none transition-opacity group-hover:opacity-[0.05]" />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="bg-[#1C1C1E] rounded-[24px] border border-white/[0.04] flex flex-col min-h-[400px] shadow-sm">
        {filteredItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3 opacity-60 py-20">
            <ListTodo size={48} strokeWidth={1} className="text-[#86868B]" />
<<<<<<< HEAD
            <p className="text-[15px] text-[#86868B]">Ainda não há atividades aqui.</p>
=======
            <p className="text-[15px] text-[#86868B]">{t.taskNone}</p>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 sm:py-4 space-y-1">
            {filteredItems.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex items-center justify-between p-3 sm:p-4 rounded-[16px] hover:bg-white/[0.03] transition-colors group cursor-default border border-transparent ${item.completed ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="mt-0.5 sm:mt-0 shrink-0">
                    <TaskStatusCheck completed={item.completed} priority={item.priority} onClick={() => toggleComplete(item)} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 pr-2 sm:pr-4">
                    <span className={`text-[15px] sm:text-[16px] font-medium truncate transition-colors ${item.completed ? 'line-through text-[#86868B]' : 'text-[#F5F5F7]'}`}>
                      {item.title}
                    </span>
                    {item.description && (
                      <span className={`text-[12px] sm:text-[13px] mt-0.5 line-clamp-2 transition-colors ${item.completed ? 'text-[#86868B]/70' : 'text-[#86868B]'}`}>
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-[6px] text-[12px] font-semibold tracking-wide uppercase ${priorityBg[item.priority] || ''} ${priorityColors[item.priority] || ''}`}>
                    {priorityLabels[item.priority] || item.priority}
                  </span>

                  <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(item)} className="p-2 sm:p-2 text-[#86868B] hover:text-[#F5F5F7] rounded-[8px] hover:bg-white/10 transition-colors outline-none cursor-pointer">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 sm:p-2 text-[#86868B] hover:text-[#FF453A] rounded-[8px] hover:bg-[#FF453A]/10 transition-colors outline-none cursor-pointer">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans" style={{ fontFamily: FONT }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#1C1C1E] border border-white/[0.08] rounded-[28px] p-7 w-full max-w-md shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[20px] font-semibold text-[#F5F5F7] tracking-tight">
<<<<<<< HEAD
                  {editing ? 'Mudar Atividade' : 'Nova Atividade'}
=======
                  {editing ? t.taskEditTitle : t.taskNewTitle}
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
                </h2>
                <button onClick={() => { setModalOpen(false); setEditing(null); }} className="p-2 text-[#86868B] hover:text-[#F5F5F7] rounded-[8px] bg-white/[0.04] hover:bg-white/[0.08] transition-colors outline-none cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-1.5">
<<<<<<< HEAD
                    <label className="text-[13px] font-medium text-[#86868B] ml-1">O que precisa ser feito?</label>
                    <input type="text" value={formParams.title} onChange={(e) => setFormParams({ ...formParams, title: e.target.value })} className="w-full px-4 py-3.5 rounded-[16px] bg-[#2C2C2E] border border-transparent text-[15px] text-[#F5F5F7] focus:border-[#0A84FF] focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0A84FF]/10 focus:outline-none transition-all placeholder:text-[#86868B]/50" placeholder="Ex: Comprar pão, Pagar conta..." required />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#86868B] ml-1">Mais detalhes (Opcional)</label>
                    <textarea value={formParams.description} onChange={(e) => setFormParams({ ...formParams, description: e.target.value })} className="w-full px-4 py-3.5 rounded-[16px] bg-[#2C2C2E] border border-transparent text-[15px] text-[#F5F5F7] focus:border-[#0A84FF] focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0A84FF]/10 focus:outline-none transition-all placeholder:text-[#86868B]/50 resize-none" rows={3} placeholder="Escreva aqui mais informações..." />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#86868B] ml-1">Importância</label>
=======
                    <label className="text-[13px] font-medium text-[#86868B] ml-1">{t.taskTitleLabel}</label>
                    <input type="text" value={formParams.title} onChange={(e) => setFormParams({ ...formParams, title: e.target.value })} className="w-full px-4 py-3.5 rounded-[16px] bg-[#2C2C2E] border border-transparent text-[15px] text-[#F5F5F7] focus:border-[#0A84FF] focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0A84FF]/10 focus:outline-none transition-all placeholder:text-[#86868B]/50" placeholder={t.taskTitlePh} required />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#86868B] ml-1">{t.taskDescLabel}</label>
                    <textarea value={formParams.description} onChange={(e) => setFormParams({ ...formParams, description: e.target.value })} className="w-full px-4 py-3.5 rounded-[16px] bg-[#2C2C2E] border border-transparent text-[15px] text-[#F5F5F7] focus:border-[#0A84FF] focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0A84FF]/10 focus:outline-none transition-all placeholder:text-[#86868B]/50 resize-none" rows={3} placeholder={t.taskDescPh} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#86868B] ml-1">{t.taskPriorityLabel}</label>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
                    <div className="flex p-1 bg-[#2C2C2E] rounded-[16px] border border-white/[0.02] relative">
                      {['low', 'medium', 'high'].map(pLevel => (
                        <button type="button" key={pLevel} onClick={() => setFormParams({ ...formParams, priority: pLevel })} className={`relative flex-1 py-3 rounded-[12px] text-[13px] font-medium transition-colors z-10 outline-none ${formParams.priority === pLevel ? 'text-[#F5F5F7]' : 'text-[#86868B] hover:text-[#F5F5F7]'}`}>
                          {formParams.priority === pLevel && (
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
                    disabled={formParams.submitting}
                    className="w-full py-4 rounded-[18px] bg-[#0A84FF] text-white text-[16px] font-semibold hover:bg-[#007AFF] transition-all shadow-lg shadow-[#0A84FF]/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {formParams.submitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>{t.taskSaving}</span>
                      </>
<<<<<<< HEAD
                    ) : editing ? 'Salvar mudanças' : 'Criar Atividade'}
=======
                    ) : editing ? t.taskSaveEdits : t.taskCreateBtn}
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ──────────────────────────────────────────────────────
   BOARD VIEW — Kanban
────────────────────────────────────────────────────── */
function SortableCard({ card, listId, onEdit, onDelete, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', card, listId },
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr + 'T12:00:00'); // enforce local timezone parsing avoidance
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      className="group outline-none pb-2"
      {...attributes} {...listeners}
    >
      <div className="flex flex-col relative rounded-[12px] transition-all overflow-hidden border border-transparent hover:border-white/80 touch-none shadow-[0_2px_4px_rgba(0,0,0,0.12)] cursor-grab active:cursor-grabbing" style={{ background: '#222224' }}>
        {card.cover_url && (
          <div className="w-full h-[120px] bg-[#1C1C1E] relative group/cover shrink-0 pointer-events-none">
            <img src={card.cover_url} alt="Cover" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex flex-col gap-1.5 px-3 py-3">
          <div className="flex items-center gap-2">
            <button type="button" onPointerDown={e => e.stopPropagation()} onClick={() => onToggle(card)} className="text-[#86868B] hover:text-[#32D74B] transition-colors outline-none shrink-0" title="Marcar como concluída">
              {card.completed ? <CheckCircle2 size={16} className="text-[#32D74B]" /> : <Circle size={16} className="text-[#86868B]" />}
            </button>
            <div className="flex-1 flex flex-col min-w-0 pr-6">
              <span className={`text-[14px] font-medium leading-tight truncate transition-colors ${card.completed ? 'line-through text-[#86868B]' : 'text-[#E5E5EA]'}`}>
                {card.name}
              </span>
            </div>
          </div>

          {card.due_date && (
            <div className="mt-1 flex pl-6">
              <span className="flex items-center gap-1.5 text-[12px] px-2 py-0.5 rounded-[4px] font-medium" style={{ background: '#FACC15', color: '#111111' }}>
                <Clock size={12} strokeWidth={2.5} /> {formatDate(card.due_date)}
              </span>
            </div>
          )}
        </div>

        {/* Edit Button matching Trello's hover icon on cards */}
        <div className="absolute top-2.5 right-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button type="button" onPointerDown={e => e.stopPropagation()} onClick={() => onEdit(card)} className="p-2 sm:p-1.5 rounded-[6px] text-[#A1A1AA] hover:text-white hover:bg-white/10 transition-colors outline-none bg-black/40 backdrop-blur-sm shadow-lg" title="Editar"><Pencil size={14} /></button>
          <button type="button" onPointerDown={e => e.stopPropagation()} onClick={() => onDelete(card.id)} className="p-2 sm:p-1.5 rounded-[6px] text-[#A1A1AA] hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors outline-none bg-black/40 backdrop-blur-sm shadow-lg" title="Excluir"><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  );
}

function CardPreview({ card, isOverlay = false }) {
  return (
    <div className={`flex flex-col relative rounded-[12px] overflow-hidden border border-white/20 shadow-xl pb-2 ${isOverlay ? 'rotate-2 opacity-95 scale-[1.02]' : ''}`} style={{ background: '#222224' }}>
      {card.cover_url && (
        <div className="w-full h-[100px] bg-[#1C1C1E] relative shrink-0">
          <img src={card.cover_url} alt="Cover" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Circle size={14} className="text-[#86868B] shrink-0" />
        <span className="flex-1 text-[13px] font-medium leading-tight text-[#E5E5EA] truncate">{card.name}</span>
      </div>
    </div>
  );
}

function ListOverlay({ list }) {
  return (
    <div className="w-[280px] flex-shrink-0 rotate-1 opacity-95 shadow-2xl scale-[1.05] cursor-grabbing">
      <div className="rounded-[16px] flex flex-col pt-3 border border-white/30 ring-1 ring-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.5)]" style={{ background: '#111111', maxHeight: '60vh' }}>
        <div className="flex items-center justify-between px-4 pb-3">
          <h3 className="text-[14px] font-semibold text-[#F5F5F7] truncate">{list.name}</h3>
          <MoreHorizontal size={16} className="text-[#A1A1AA] opacity-70" />
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-2 pb-3 scrollbar-hide">
          {list.cards?.map(card => (
            <CardPreview key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CardOverlay({ card }) {
  return <CardPreview card={card} isOverlay />;
}

function KanbanList({ list, onRename, onDelete, onCardAdded, onEditCard, onDeleteCard, onToggleCard }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(list.name);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [cardName, setCardName] = useState('');
  const [addingCard, setAddingCard] = useState(false);
  const titleRef = useRef(null);
  const cardRef = useRef(null);
  const { error: showError } = useToast();
  const { t } = useTranslation();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `list-${list.id}`,
    data: { type: 'list', list },
  });

  useEffect(() => { if (editingTitle) titleRef.current?.focus(); }, [editingTitle]);
  useEffect(() => { if (showAdd) cardRef.current?.focus(); }, [showAdd]);

  async function saveTitle() {
    const v = titleVal.trim();
    if (!v || v === list.name) { setTitleVal(list.name); setEditingTitle(false); return; }
    setSaving(true);
    try {
      const upd = await api(`/task-lists/${list.id}`, { method: 'PUT', body: JSON.stringify({ name: v }) });
      onRename(upd);
      setEditingTitle(false);
    } catch (err) { showError(err.message); setTitleVal(list.name); }
    finally { setSaving(false); }
  }

  async function addCard() {
    const v = cardName.trim();
    if (!v) return;
    setAddingCard(true);
    try {
      const card = await api('/task-cards', { method: 'POST', body: JSON.stringify({ name: v, list_id: list.id }) });
      onCardAdded(list.id, card);
      setCardName('');
      cardRef.current?.focus();
    } catch (err) { showError(err.message); }
    finally { setAddingCard(false); }
  }

  const cardIds = list.cards.map(c => c.id);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="w-[280px] sm:w-[300px] flex-shrink-0 snap-center sm:snap-align-none"
    >
      <div className="rounded-[16px] flex flex-col pt-3 shadow-xl backdrop-blur-sm border border-transparent ring-1 ring-white/[0.03]" style={{ background: '#111111', maxHeight: '75vh' }}>
        <div className="flex items-center justify-between px-4 pb-3 cursor-grab active:cursor-grabbing touch-none" {...attributes} {...listeners}>
          {editingTitle ? (
            <div className="flex-1 flex items-center gap-2">
              <input ref={titleRef} value={titleVal} onChange={e => setTitleVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitleVal(list.name); setEditingTitle(false); } }}
                onBlur={saveTitle} onPointerDown={e => e.stopPropagation()}
                className="flex-1 rounded-[8px] px-2 py-1 text-[14px] font-semibold text-[#F5F5F7] outline-none border border-[#0A84FF]/60 min-w-0"
                style={{ background: '#222224' }} />
              {saving && <Loader2 size={13} className="animate-spin text-[#86868B] shrink-0" />}
            </div>
          ) : (
            <h3 onDoubleClick={() => setEditingTitle(true)}
              className="text-[14px] font-semibold text-[#F5F5F7] truncate cursor-default select-none pointer-events-auto">
              {list.name}
            </h3>
          )}

          <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
            <button type="button" onPointerDown={e => e.stopPropagation()} onClick={() => onDelete(list.id)} className="p-1 rounded-[6px] text-[#A1A1AA] hover:text-white hover:bg-white/10 transition-colors outline-none cursor-pointer group/options tooltip" title="Deletar Lista">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-0 scrollbar-hide pb-2">
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {list.cards.map(card => (
              <SortableCard key={card.id} card={card} listId={list.id} onEdit={onEditCard} onDelete={onDeleteCard} onToggle={onToggleCard} />
            ))}
          </SortableContext>

          {showAdd ? (
            <div className="mt-1 pb-2 px-1">
              <div className="p-2 py-2 rounded-[12px] border border-[#0A84FF]/50" style={{ background: '#222224' }}>
                <input ref={cardRef} value={cardName} onChange={e => setCardName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addCard(); if (e.key === 'Escape') { setShowAdd(false); setCardName(''); } }}
                  placeholder={t.boardCardPh}
                  className="w-full bg-transparent text-[14px] text-[#E5E5EA] placeholder:text-[#86868B] outline-none" />
              </div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={addCard} disabled={addingCard || !cardName.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-medium text-white disabled:opacity-40 transition-colors outline-none cursor-pointer hover:bg-opacity-80"
                  style={{ background: '#0A84FF' }}>
                  {addingCard ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2.5} />}
                  {t.boardAdd}
                </button>
                <button type="button" onClick={() => { setShowAdd(false); setCardName(''); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[13px] text-[#86868B] hover:text-[#F5F5F7] hover:bg-white/[0.06] transition-colors outline-none cursor-pointer">
                  <X size={13} /> {t.boardCancel}
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-1 pb-2">
              <button type="button" onClick={() => setShowAdd(true)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-[12px] text-[14px] font-medium text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/5 transition-colors outline-none cursor-pointer group/add">
<<<<<<< HEAD
                <span className="flex items-center gap-2"><Plus size={16} strokeWidth={2} className="opacity-80 group-hover/add:opacity-100 transition-opacity" /> Colocar um novo recado</span>
=======
                <span className="flex items-center gap-2"><Plus size={16} strokeWidth={2} className="opacity-80 group-hover/add:opacity-100 transition-opacity" /> {t.boardAddCard}</span>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
                <CopyPlus size={15} strokeWidth={1.5} className="opacity-60 group-hover/add:opacity-100 transition-opacity" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditCardModal({ card, onSave, onClose }) {
  const [name, setName] = useState(card.name || '');
  const [coverUrl, setCoverUrl] = useState(card.cover_url || '');
  const [dueDate, setDueDate] = useState(card.due_date || '');
  const [saving, setSaving] = useState(false);
  const { error: showError } = useToast();
  const { t } = useTranslation();

  async function handleSubmit(e) {
    e.preventDefault();
    const v = name.trim();
    if (!v) return;
    setSaving(true);
    try {
      const payload = { name: v };
      if (coverUrl.trim()) payload.cover_url = coverUrl.trim();
      else payload.cover_url = null;
      if (dueDate) payload.due_date = dueDate;
      else payload.due_date = null;

      const upd = await api(`/task-cards/${card.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      onSave(upd);
    } catch (err) { showError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ fontFamily: FONT, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm rounded-[22px] p-6 shadow-2xl border border-white/[0.08]"
        style={{ background: '#1C1C1E' }}>
        <div className="flex justify-between items-center mb-5">
<<<<<<< HEAD
          <h2 className="text-[18px] font-semibold text-[#F5F5F7]">Editar Recado</h2>
=======
          <h2 className="text-[18px] font-semibold text-[#F5F5F7]">{t.cardEditTitle}</h2>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
          <button type="button" onClick={onClose} className="p-1.5 rounded-[8px] text-[#86868B] hover:text-[#F5F5F7] hover:bg-white/[0.08] transition-colors outline-none cursor-pointer"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
<<<<<<< HEAD
            <label className="text-[13px] font-medium text-[#86868B] ml-1">O que está escrito no recado?</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-4 py-3 rounded-[14px] text-[15px] text-[#F5F5F7] outline-none border border-transparent focus:border-[#0A84FF] transition-all"
              style={{ background: '#2C2C2E' }}
              placeholder="Ex: Não esquecer de levar o documento" />
=======
            <label className="text-[13px] font-medium text-[#86868B] ml-1">{t.cardNameLabel}</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-4 py-3 rounded-[14px] text-[15px] text-[#F5F5F7] outline-none border border-transparent focus:border-[#0A84FF] transition-all"
              style={{ background: '#2C2C2E' }}
              placeholder={t.cardNamePh} />
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
          </div>

          <div className="space-y-1.5 flex flex-col">
            <label className="text-[13px] font-medium text-[#86868B] ml-1">{t.cardCoverLabel}</label>
            {coverUrl && (
              <div className="relative w-full h-24 rounded-[12px] border border-white/[0.05] overflow-hidden mb-2 group">
                <img src={coverUrl} alt="Capa" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setCoverUrl('')} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity outline-none cursor-pointer"><X size={14} /></button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setCoverUrl(reader.result);
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full text-[13px] text-[#86868B] file:mr-3 file:py-2 file:px-4 file:rounded-[8px] file:border-0 file:text-[13px] file:font-semibold file:bg-[#0A84FF]/10 file:text-[#0A84FF] hover:file:bg-[#0A84FF]/20 cursor-pointer outline-none"
            />
          </div>

          <div className="flex flex-col gap-4 pt-1">
            <h3 className="text-[14px] font-semibold text-[#86868B] uppercase tracking-wider mb-0">{t.cardDatesLabel}</h3>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-[#86868B]">{t.cardDueDateLabel}</label>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={!!dueDate} onChange={(e) => {
                  if (!e.target.checked) setDueDate('');
                  else setDueDate(new Date().toISOString().slice(0, 10));
                }} className="w-4 h-4 rounded-sm border-white/20 accent-[#0A84FF] cursor-pointer" />
                <div className="flex items-center gap-2">
                  <input value={dueDate} onChange={e => setDueDate(e.target.value)} type="date" disabled={!dueDate} className={`px-3 py-1.5 text-[#F5F5F7] text-[14px] outline-none border transition-all w-[140px] [color-scheme:dark] ${dueDate ? 'border-[#0A84FF]' : 'border-transparent opacity-50 cursor-not-allowed'}`} style={{ background: '#2C2C2E', borderRadius: '4px' }} />
                  <input type="time" defaultValue="20:59" disabled={!dueDate} className={`px-3 py-1.5 text-[#F5F5F7] text-[14px] outline-none border border-transparent focus:border-[#0A84FF] transition-all w-[90px] [color-scheme:dark] ${!dueDate && 'opacity-50 cursor-not-allowed'}`} style={{ background: '#2C2C2E', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving || !name.trim()}
            className="w-full py-3 rounded-[14px] text-white text-[15px] font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            style={{ background: '#0A84FF' }}>
            {saving && <Loader2 size={18} className="animate-spin" />}
            {t.cardSave}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   BOARD GALLERY — shows all boards, click to enter
────────────────────────────────────────────────────── */
const BOARD_COLORS = [
  '#2C2C2E', '#1A3A2A', '#2A1A3A', '#3A2A1A', '#1A2A3A', '#3A1A2A',
  '#0A84FF', '#32D74B', '#FF9F0A', '#FF453A', '#BF5AF2', '#AC8E68',
];

function BoardGallery({ onOpenBoard }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [boardColor, setBoardColor] = useState('#2C2C2E');
  const [adding, setAdding] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const inputRef = useRef(null);
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();

  const { activeTeam } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    api('/task-boards')
      .then(data => { setBoards(data); setLoading(false); })
      .catch(err => { showError(err.message); setLoading(false); });
  }, [activeTeam]); // eslint-disable-line

  useRealtimeSubscription(
    ['task_boards', 'task_lists', 'task_cards'],
    () => { api('/task-boards').then(setBoards).catch(console.error); }
  );

  useEffect(() => { if (showAdd) inputRef.current?.focus(); }, [showAdd]);

  async function addBoard() {
    const v = boardName.trim();
    if (!v) return;
    setAdding(true);
    try {
      const board = await api('/task-boards', { method: 'POST', body: JSON.stringify({ name: v, color: boardColor }) });
      setBoards(prev => [...prev, board]);
      setBoardName('');
      setBoardColor('#2C2C2E');
      setShowAdd(false);
<<<<<<< HEAD
      success('Mural criado com sucesso');
=======
      success(t.boardCreated);
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
    } catch (err) { showError(err.message); }
    finally { setAdding(false); }
  }

  function deleteBoard(id) {
    confirm({
<<<<<<< HEAD
      title: 'Apagar este mural?',
      message: 'Todos os recados e colunas deste mural serão removidos permanentemente.',
=======
      title: t.boardDelConfirm,
      message: t.boardDelText,
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
      onConfirm: async () => {
        try {
          await api(`/task-boards/${id}`, { method: 'DELETE' });
          setBoards(prev => prev.filter(b => b.id !== id));
          success(t.boardDeleted);
        } catch (err) { showError(err.message); }
      },
    });
  }

  async function handleUpdateBoard(updatedBoard) {
    setBoards(prev => prev.map(b => b.id === updatedBoard.id ? updatedBoard : b));
    setEditingBoard(null);
<<<<<<< HEAD
    success('Mural atualizado');
=======
    success(t.boardUpdated);
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-[#0A84FF] border-t-transparent rounded-full" />
<<<<<<< HEAD
        <p className="text-[14px] text-[#86868B] font-medium tracking-wide">Organizando seus murais...</p>
=======
        <p className="text-[14px] text-[#86868B] font-medium tracking-wide">{t.boardLoading}</p>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
      </div>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 lg:mb-10">
        <div className="space-y-1">
<<<<<<< HEAD
          <h1 className="text-[32px] md:text-[40px] leading-tight font-semibold text-[#F5F5F7] tracking-tight">Meus Murais</h1>
          <p className="text-[15px] sm:text-[17px] text-[#86868B]">{boards.length} mural de recados{boards.length !== 1 ? 's' : ''}</p>
        </div>
        <button type="button" onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-4 rounded-[10px] bg-[#F5F5F7] text-[#000000] text-[12px] sm:text-[13px] font-bold hover:bg-white transition-all cursor-pointer shadow-sm active:scale-95 self-start sm:self-auto">
          <Plus size={14} strokeWidth={3} /> Novo Mural
=======
          <h1 className="text-[32px] md:text-[40px] leading-tight font-semibold text-[#F5F5F7] tracking-tight">{t.boardTitle}</h1>
          <p className="text-[15px] sm:text-[17px] text-[#86868B]">{boards.length} {boards.length !== 1 ? t.boardsUnit : t.boardUnit}</p>
        </div>
        <button type="button" onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-4 rounded-[10px] bg-[#F5F5F7] text-[#000000] text-[12px] sm:text-[13px] font-bold hover:bg-white transition-all cursor-pointer shadow-sm active:scale-95 self-start sm:self-auto">
          <Plus size={14} strokeWidth={3} /> {t.boardNewBtn}
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {boards.map(board => (
          <motion.div key={board.id} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}
            className="group relative rounded-[16px] overflow-hidden cursor-pointer shadow-lg border border-white/[0.04] hover:border-white/[0.12] transition-all"
            style={{ background: board.color || '#2C2C2E', minHeight: 84 }}
            onClick={() => onOpenBoard(board)}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
            <div className="relative z-10 p-3 flex flex-col justify-end h-full" style={{ minHeight: 84 }}>
              <h3 className="text-[14px] sm:text-[16px] font-bold text-white truncate drop-shadow-md tracking-tight">{board.name}</h3>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-1">
              <button type="button" onClick={(e) => { e.stopPropagation(); setEditingBoard(board); }}
                className="p-1.5 rounded-[8px] bg-black/50 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/70 transition-colors outline-none cursor-pointer">
                <Pencil size={14} />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); deleteBoard(board.id); }}
                className="p-1.5 rounded-[8px] bg-black/50 backdrop-blur-sm text-white/70 hover:text-[#FF453A] hover:bg-black/70 transition-colors outline-none cursor-pointer">
                <Trash2 size={14} />
              </button>
            </div>
          </motion.div>
        ))}

        {/* Add board card */}
        {showAdd ? (
          <div className="rounded-[16px] border border-[#0A84FF]/40 p-4 shadow-lg flex flex-col gap-3" style={{ background: '#111111' }}>
            <input ref={inputRef} value={boardName} onChange={e => setBoardName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addBoard(); if (e.key === 'Escape') { setShowAdd(false); setBoardName(''); } }}
<<<<<<< HEAD
              placeholder="Nome do seu mural..."
=======
              placeholder={t.boardNamePh}
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
              className="w-full rounded-[10px] px-3 py-2.5 text-[14px] text-[#F5F5F7] placeholder:text-[#86868B] outline-none border border-transparent focus:border-[#0A84FF]/50 transition-colors"
              style={{ background: '#222224' }} />
            <div className="flex flex-wrap gap-2">
              {BOARD_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setBoardColor(c)}
                  className={`w-6 h-6 rounded-full transition-all outline-none cursor-pointer ${boardColor === c ? 'ring-2 ring-[#0A84FF] ring-offset-2 ring-offset-[#111111] scale-110' : 'hover:scale-110'}`}
                  style={{ background: c }} />
              ))}
              <div className="flex items-center gap-2 ml-1">
                <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/20 group cursor-pointer" style={{ background: boardColor }}>
                  <input type="color" value={boardColor} onChange={e => setBoardColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-[2]" title="Escolher cor personalizada" />
                </div>
                <input type="text" value={boardColor}
                  onChange={e => {
                    let val = e.target.value;
                    if (val && !val.startsWith('#')) val = '#' + val;
                    setBoardColor(val.substring(0, 7));
                  }}
                  placeholder="#000000"
                  className="w-[75px] bg-[#222224] text-[11px] text-[#F5F5F7] px-2 py-1 rounded-[6px] border border-white/10 outline-none focus:border-[#0A84FF]/50 transition-colors uppercase font-mono" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={addBoard} disabled={adding || !boardName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white disabled:opacity-40 transition-colors outline-none cursor-pointer hover:opacity-90"
                style={{ background: '#0A84FF' }}>
                {adding && <Loader2 size={14} className="animate-spin" />}
<<<<<<< HEAD
                Criar Mural
=======
                {t.boardCreateBtn}
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setBoardName(''); }}
                className="p-2 rounded-[10px] text-[#86868B] hover:text-[#F5F5F7] hover:bg-white/[0.06] transition-colors outline-none cursor-pointer">
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setShowAdd(true)}
            className="flex flex-col items-center justify-center gap-1.5 px-3 py-6 rounded-[16px] text-[12px] sm:text-[14px] font-medium text-[#48484A] hover:text-[#86868B] border border-dashed border-white/[0.08] hover:bg-white/[0.02] transition-all cursor-pointer outline-none"
            style={{ minHeight: 84 }}>
            <Plus size={18} strokeWidth={1.5} />
<<<<<<< HEAD
            <span className="text-center line-clamp-1 px-2">Novo mural</span>
=======
            <span className="text-center line-clamp-1 px-2">{t.boardNewInlineBtn}</span>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
          </button>
        )}
      </motion.div>

      {boards.length === 0 && !showAdd && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-60">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <Kanban size={28} strokeWidth={1.2} className="text-[#86868B]" />
          </div>
<<<<<<< HEAD
          <p className="text-[15px] text-[#86868B]">Crie seu primeiro mural de recados para começar.</p>
=======
          <p className="text-[15px] text-[#86868B]">{t.boardFirstHint}</p>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
        </div>
      )}

      <AnimatePresence>
        {editingBoard && (
          <EditBoardModal board={editingBoard} onSave={handleUpdateBoard} onClose={() => setEditingBoard(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

function EditBoardModal({ board, onSave, onClose }) {
  const [name, setName] = useState(board.name);
  const [color, setColor] = useState(board.color || '#2C2C2E');
  const [saving, setSaving] = useState(false);
  const { error: showError } = useToast();
  const { t } = useTranslation();

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving || !name.trim()) return;
    setSaving(true);
    try {
      const resp = await api(`/task-boards/${board.id}`, { method: 'PUT', body: JSON.stringify({ name, color }) });
      onSave(resp);
    } catch (err) { showError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-md flex items-center justify-center z-50 p-4" style={{ fontFamily: FONT }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#1C1C1E] border border-white/[0.08] rounded-[28px] p-7 w-full max-w-md shadow-2xl relative">
        <div className="flex justify-between items-center mb-6">
<<<<<<< HEAD
          <h2 className="text-[20px] font-semibold text-[#F5F5F7]">Editar Mural</h2>
=======
          <h2 className="text-[20px] font-semibold text-[#F5F5F7]">{t.boardEditTitle}</h2>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
          <button onClick={onClose} className="p-2 text-[#86868B] hover:text-[#F5F5F7] rounded-[8px] transition-colors outline-none cursor-pointer"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
<<<<<<< HEAD
            <label className="text-[13px] font-medium text-[#86868B] ml-1">Nome do mural</label>
=======
            <label className="text-[13px] font-medium text-[#86868B] ml-1">{t.boardNameLabel}</label>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3.5 rounded-[16px] bg-[#2C2C2E] border border-transparent text-[#F5F5F7] focus:border-[#0A84FF] focus:outline-none transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#86868B] ml-1">{t.boardColorLabel}</label>
            <div className="flex flex-wrap gap-2.5 p-1 items-center">
              {BOARD_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all outline-none cursor-pointer ${color === c ? 'ring-2 ring-[#0A84FF] ring-offset-2 ring-offset-[#1C1C1E] scale-110' : 'hover:scale-110'}`}
                  style={{ background: c }} />
              ))}
              <div className="flex items-center gap-3 ml-2 bg-[#2C2C2E] px-3 py-1.5 rounded-[12px] border border-white/5">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow-inner" style={{ background: color }}>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-[3]" title="Paleta de cores" />
                </div>
                <input type="text" value={color}
                  onChange={e => {
                    let val = e.target.value;
                    if (val && !val.startsWith('#')) val = '#' + val;
                    setColor(val.substring(0, 7));
                  }}
                  placeholder="#HEX"
                  className="w-[90px] bg-transparent text-[13px] text-[#F5F5F7] outline-none uppercase font-mono tracking-tighter" />
              </div>
            </div>
          </div>
          <button type="submit" disabled={saving || !name.trim()}
            className="w-full py-4 rounded-[18px] bg-[#0A84FF] text-white text-[16px] font-semibold hover:bg-[#007AFF] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={20} className="animate-spin" /> : t.boardSaveEdits}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   BOARD KANBAN — lists & cards inside a specific board
────────────────────────────────────────────────────── */
function BoardKanban({ board, onBack }) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddList, setShowAddList] = useState(false);
  const [listName, setListName] = useState('');
  const [addingList, setAddingList] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [activeList, setActiveList] = useState(null);
  const listInputRef = useRef(null);
  const dragOriginListId = useRef(null);
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();
  const { activeTeam } = useAuth();
  const { t } = useTranslation();

  const scrollRef = useRef(null);
  const animationFrameId = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    mousePos.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const autoScroll = () => {
      const { x } = mousePos.current;
      const rect = scrollContainer.getBoundingClientRect();
      const edgeSize = 150; // Distance from edge to start scrolling
      const speed = 10; // Scroll speed multiplier

      if (x < rect.left + edgeSize) {
        const intensity = (rect.left + edgeSize - x) / edgeSize;
        scrollContainer.scrollLeft -= speed * intensity;
      } else if (x > rect.right - edgeSize) {
        const intensity = (x - (rect.right - edgeSize)) / edgeSize;
        scrollContainer.scrollLeft += speed * intensity;
      }

      animationFrameId.current = requestAnimationFrame(autoScroll);
    };

    animationFrameId.current = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(animationFrameId.current);
  }, []);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 10 },
  });
  
  const touchSensor = useSensor(TouchSensor, {
    // Delay of 250ms and 5px tolerance allows for scrolling before drag starts
    activationConstraint: { delay: 250, tolerance: 5 },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  function load() {
    setLoading(true);
    api(`/task-lists?board_id=${board.id}`)
      .then(data => { setLists(data); setLoading(false); })
      .catch(err => { showError(err.message); setLoading(false); });
  }

  useEffect(() => { load(); }, [board.id, activeTeam]); // eslint-disable-line

  useRealtimeSubscription(
    ['task_lists', 'task_cards', 'task_boards'],
    (detail) => {
      const { table, payload } = detail;
      if (['task_lists', 'task_cards'].includes(table)) {
        load();
      }
      if (table === 'task_boards' && payload?.eventType === 'DELETE' && payload?.old?.id === board.id) {
<<<<<<< HEAD
        success('Este mural foi apagado.');
=======
        success(t.boardDeleted);
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
        onBack();
      }
    },
    [board.id, onBack]
  );
  useEffect(() => { if (showAddList) listInputRef.current?.focus(); }, [showAddList]);

  async function addList() {
    const v = listName.trim();
    if (!v) return;
    setAddingList(true);
    try {
      const list = await api('/task-lists', { method: 'POST', body: JSON.stringify({ name: v, board_id: board.id }) });
      setLists(prev => [...prev, list]);
      setListName('');
      setShowAddList(false);
      success(t.boardListCreated);
    } catch (err) { showError(err.message); }
    finally { setAddingList(false); }
  }

  function handleRenameList(upd) {
    setLists(prev => prev.map(l => l.id === upd.id ? { ...l, name: upd.name } : l));
    success(t.boardListRenamed);
  }

  function handleDeleteList(id) {
    confirm({
      title: t.boardListDelConfirm,
      message: t.boardListDelText,
      onConfirm: async () => {
        try {
          await api(`/task-lists/${id}`, { method: 'DELETE' });
          setLists(prev => prev.filter(l => l.id !== id));
          success(t.boardListDeleted);
        } catch (err) { showError(err.message); }
      },
    });
  }

  function handleCardAdded(listId, card) {
    setLists(prev => prev.map(l => l.id !== listId ? l : { ...l, cards: [...l.cards, card] }));
  }

  function handleCardSaved(upd) {
    setLists(prev => prev.map(l => ({ ...l, cards: l.cards.map(c => c.id === upd.id ? { ...c, ...upd } : c) })));
    setEditingCard(null);
    success(t.boardCardUpdated);
  }

  function handleDeleteCard(cardId) {
    confirm({
<<<<<<< HEAD
      title: 'Apagar este recado?',
      message: 'Este recado será removido permanentemente.',
=======
      title: t.boardCardDelConfirm,
      message: t.boardCardDelText,
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
      onConfirm: async () => {
        try {
          await api(`/task-cards/${cardId}`, { method: 'DELETE' });
          setLists(prev => prev.map(l => ({ ...l, cards: l.cards.filter(c => c.id !== cardId) })));
<<<<<<< HEAD
          success('Recado apagado');
=======
          success(t.boardCardDeleted);
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
        } catch (err) { showError(err.message); }
      },
    });
  }

  async function handleToggleCard(card) {
    const newStatus = !card.completed;
    setLists(prev => prev.map(l => ({ ...l, cards: l.cards.map(c => c.id === card.id ? { ...c, completed: newStatus } : c) })));
    try {
      await api(`/task-cards/${card.id}`, { method: 'PUT', body: JSON.stringify({ completed: newStatus }) });
      success(newStatus ? t.boardCardDone : t.boardCardPending);
    } catch (err) {
      showError(err.message);
      load();
    }
  }

  function findListByCard(cardId) {
    return lists.find(l => l.cards.some(c => c.id === cardId));
  }

  function onDragStart({ active }) {
    const d = active.data.current;
    if (d?.type === 'card') {
      setActiveCard(d.card);
      dragOriginListId.current = d.listId;
    }
    if (d?.type === 'list') setActiveList(d.list);
  }

  function onDragOver({ active, over }) {
    if (!over) return;
    const aData = active.data.current;
    const oData = over.data.current;
    if (!aData) return;

    if (aData.type === 'list') {
      let overListId = null;
      if (oData?.type === 'list') overListId = over.id;
      else if (oData?.type === 'card') overListId = `list-${oData.listId}`;

      if (overListId && active.id !== overListId) {
        const ai = lists.findIndex(l => `list-${l.id}` === active.id);
        const oi = lists.findIndex(l => `list-${l.id}` === overListId);
        if (ai !== -1 && oi !== -1) {
          setLists(prev => arrayMove(prev, ai, oi));
        }
      }
      return;
    }

    if (aData.type !== 'card') return;

    const cardId = Number(active.id);
    const aList = lists.find(l => l.cards.some(c => Number(c.id) === cardId));
    if (!aList) return;

    let targetId = null;
    let overIndex = -1;

    if (oData?.type === 'card') {
      targetId = Number(oData.listId);
      const targetList = lists.find(l => Number(l.id) === targetId);
      if (targetList) {
        overIndex = targetList.cards.findIndex(c => Number(c.id) === Number(over.id));
      }
    } else if (oData?.type === 'list') {
      targetId = Number(oData.list.id);
    }

    if (!targetId || targetId === Number(aList.id)) return;

    setLists(prev => {
      const card = aList.cards.find(c => Number(c.id) === cardId);
      if (!card) return prev;
      return prev.map(l => {
        if (Number(l.id) === Number(aList.id)) {
          return { ...l, cards: l.cards.filter(c => Number(c.id) !== cardId) };
        }
        if (Number(l.id) === targetId) {
          const newCards = [...l.cards];
          const isBelowOverItem =
            over &&
            active.rect.current.translated &&
            active.rect.current.translated.top > over.rect.top + over.rect.height;
          const modifier = isBelowOverItem ? 1 : 0;
          const insertIndex = overIndex >= 0 ? overIndex + modifier : newCards.length;
          newCards.splice(insertIndex, 0, card);
          return { ...l, cards: newCards };
        }
        return l;
      });
    });
  }

  async function onDragEnd({ active, over }) {
    setActiveCard(null);
    setActiveList(null);

    const aData = active.data.current;
    const oData = over?.data.current;

    if (aData?.type === 'list') {
      dragOriginListId.current = null;
      // Since sorting happened in onDragOver, we just persist the current state
      try {
        const items = lists.map((l, i) => ({ id: l.id, position: i }));
        await api('/task-lists/reorder', { method: 'POST', body: JSON.stringify({ items }) });
      } catch (err) {
        showError(err.message);
        load();
      }
      return;
    }

    if (aData?.type === 'card') {
      const originalListId = Number(dragOriginListId.current);
      dragOriginListId.current = null;
      const cardId = Number(active.id);

      if (!originalListId || !over) return;

      let targetListId = originalListId;
      let overCardId = null;

      if (oData?.type === 'card') {
        targetListId = Number(oData.listId);
        overCardId = Number(over.id);
      } else if (oData?.type === 'list') {
        targetListId = Number(oData.list.id);
      }

      const isMove = targetListId !== originalListId;
      const targetList = lists.find(l => Number(l.id) === targetListId);
      if (!targetList) return;

      const oldIdx = targetList.cards.findIndex(c => Number(c.id) === cardId);
      const newIdx = overCardId ? targetList.cards.findIndex(c => Number(c.id) === overCardId) : targetList.cards.length - 1;

      const reordered = arrayMove(targetList.cards, oldIdx < 0 ? 0 : oldIdx, newIdx < 0 ? 0 : newIdx);
      setLists(prev => prev.map(l => Number(l.id) === targetListId ? { ...l, cards: reordered } : l));

      if (isMove) {
        try {
          await api(`/task-cards/${cardId}`, {
            method: 'PUT',
            body: JSON.stringify({ list_id: targetListId, position: newIdx }),
          });
          const items = reordered.map((c, i) => ({ id: c.id, position: i }));
          await api('/task-cards/reorder', { method: 'POST', body: JSON.stringify({ items }) });
        } catch (err) {
          showError(err.message);
          load();
        }
      } else {
        if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;
        try {
          const items = reordered.map((c, i) => ({ id: c.id, position: i }));
          await api('/task-cards/reorder', { method: 'POST', body: JSON.stringify({ items }) });
        } catch { /* suppress */ }
      }
    }
  }

  const listIds = lists.map(l => `list-${l.id}`);
  const dropAnimation = { sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-[#0A84FF] border-t-transparent rounded-full" />
<<<<<<< HEAD
        <p className="text-[14px] text-[#86868B] font-medium tracking-wide">Organizando o mural...</p>
=======
        <p className="text-[14px] text-[#86868B] font-medium tracking-wide">{t.boardLoadingBoard}</p>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
      </div>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onBack}
            className="p-2 rounded-[10px] text-[#86868B] hover:text-[#F5F5F7] hover:bg-white/[0.06] transition-colors outline-none cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-[4px] shrink-0" style={{ background: board.color || '#2C2C2E' }} />
              <h1 className="text-[32px] md:text-[40px] leading-tight font-semibold text-[#F5F5F7] tracking-tight">{board.name}</h1>
            </div>
<<<<<<< HEAD
            <p className="text-[17px] text-[#86868B] pl-7">{lists.length} coluna{lists.length !== 1 ? 's' : ''} · {lists.reduce((a, l) => a + l.cards.length, 0)} recados</p>
=======
            <p className="text-[17px] text-[#86868B] pl-7">{lists.length} {lists.length !== 1 ? t.boardListsUnit : t.boardListUnit} · {lists.reduce((a, l) => a + l.cards.length, 0)} {t.boardCardsUnit}</p>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button type="button" onClick={() => setShowAddList(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 rounded-[10px] bg-[#F5F5F7] text-[#000000] text-[12px] sm:text-[13px] font-bold hover:bg-white transition-all cursor-pointer shadow-sm active:scale-95 self-start sm:self-auto">
            <Plus size={14} strokeWidth={3} /> {t.boardNewListBtn}
          </button>
        </div>
      </motion.div>

      <DndContext sensors={sensors} collisionDetection={closestCorners}
        onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
        <div
          ref={scrollRef}
          onMouseMove={handleMouseMove}
          className="flex-1 overflow-x-auto overflow-y-hidden flex items-start gap-4 sm:gap-6 pb-20 scrollbar-board cursor-default snap-x snap-mandatory sm:snap-none px-4 sm:px-0"
        >
          <div className="flex gap-6 items-start min-w-full">
            <SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
              {lists.map(list => (
                <KanbanList key={list.id} list={list}
                  onRename={handleRenameList}
                  onDelete={handleDeleteList}
                  onCardAdded={handleCardAdded}
                  onEditCard={setEditingCard}
                  onDeleteCard={handleDeleteCard}
                  onToggleCard={handleToggleCard} />
              ))}
            </SortableContext>

            {showAddList ? (
              <div className="w-[300px] shrink-0">
                <div className="rounded-[16px] border border-[#0A84FF]/40 p-4 shadow-lg" style={{ background: '#111111' }}>
                  <input ref={listInputRef} value={listName} onChange={e => setListName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addList(); if (e.key === 'Escape') { setShowAddList(false); setListName(''); } }}
                    placeholder={t.boardListPh}
                    className="w-full rounded-[10px] px-3 py-2.5 text-[14px] text-[#F5F5F7] placeholder:text-[#86868B] outline-none border border-transparent focus:border-[#0A84FF]/50 transition-colors"
                    style={{ background: '#222224' }} />
                  <div className="flex gap-2 mt-3">
                    <button type="button" onClick={addList} disabled={addingList || !listName.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white disabled:opacity-40 transition-colors outline-none cursor-pointer hover:opacity-90"
                      style={{ background: '#0A84FF' }}>
                      {addingList && <Loader2 size={14} className="animate-spin" />}
                      {t.boardAddList}
                    </button>
                    <button type="button" onClick={() => { setShowAddList(false); setListName(''); }}
                      className="p-2 rounded-[10px] text-[#86868B] hover:text-[#F5F5F7] hover:bg-white/[0.06] transition-colors outline-none cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setShowAddList(true)}
                className="w-[300px] shrink-0 flex items-center justify-center gap-2 px-4 py-4 rounded-[16px] text-[14px] font-medium text-[#48484A] hover:text-[#86868B] border border-dashed border-white/[0.08] hover:bg-white/[0.04] transition-all cursor-pointer outline-none self-start"
                style={{ background: 'transparent' }}>
                <Plus size={16} strokeWidth={2} /> {t.boardAddListInline}
              </button>
            )}
          </div>
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeCard ? <CardOverlay card={lists.flatMap(l => l.cards).find(c => c.id === activeCard.id) || activeCard} /> : null}
          {activeList ? <ListOverlay list={lists.find(l => l.id === activeList.id) || activeList} /> : null}
        </DragOverlay>
      </DndContext>

      {lists.length === 0 && !showAddList && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-60">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <Kanban size={28} strokeWidth={1.2} className="text-[#86868B]" />
          </div>
          <p className="text-[15px] text-[#86868B]">{t.boardFirstListHint}</p>
        </div>
      )}

      <AnimatePresence>
        {editingCard && (
          <EditCardModal key={editingCard.id} card={editingCard} onSave={handleCardSaved} onClose={() => setEditingCard(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ──────────────────────────────────────────────────────
   BOARD VIEW — router between gallery and kanban
────────────────────────────────────────────────────── */
function BoardView() {
  const [activeBoard, setActiveBoard] = useState(() => {
    const saved = localStorage.getItem('active_board');
    return saved ? JSON.parse(saved) : null;
  });

  const handleOpenBoard = (board) => {
    localStorage.setItem('active_board', JSON.stringify(board));
    setActiveBoard(board);
  };

  const handleBack = () => {
    localStorage.removeItem('active_board');
    setActiveBoard(null);
  };

  if (activeBoard) {
    return (
      <BoardKanban board={activeBoard} onBack={handleBack} />
    );
  }

  return <BoardGallery onOpenBoard={handleOpenBoard} />;
}

/* ──────────────────────────────────────────────────────
   ROOT PAGE
────────────────────────────────────────────────────── */
export default function Tasks() {
  const [view, setView] = useState(() => localStorage.getItem('tasks_view') || 'list');

  const handleViewChange = (v) => {
    localStorage.setItem('tasks_view', v);
    setView(v);
  };

  return (
    <div
      className="max-w-5xl mx-auto pb-12 font-sans relative"
      style={{ fontFamily: FONT }}
    >
      {/* View toggle — sits above content, top-right corner */}
      <div className="flex justify-end mb-6">
        <ViewToggle view={view} onChange={handleViewChange} />
      </div>

      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div key="list"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}>
            <ListView />
          </motion.div>
        ) : (
          <motion.div key="board"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}>
            <BoardView />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
