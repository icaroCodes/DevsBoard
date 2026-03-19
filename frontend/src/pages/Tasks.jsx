import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Pencil, X, Loader2, LayoutList,
  GripVertical, Check, CheckSquare, ListTodo, Kanban, Circle
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
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
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmModalContext';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/* ──────────────────────────────────────────────────────
   VIEW TOGGLE
────────────────────────────────────────────────────── */
function ViewToggle({ view, onChange }) {
  return (
    <div className="flex p-1 bg-[#1C1C1E]/80 backdrop-blur-md rounded-[12px] shadow-sm border border-white/[0.04] relative">
      {[
        { id: 'list', label: 'Lista', Icon: LayoutList },
        { id: 'board', label: 'Quadro', Icon: Kanban },
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

  const load = () => {
    setLoading(true);
    api('/tasks').then(data => { setItems(data); setLoading(false); }).catch(err => { showError(err.message); setLoading(false); });
  };

  useEffect(() => load(), []); // eslint-disable-line

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
      success(editing ? 'Tarefa atualizada' : 'Tarefa criada');
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
        <p className="text-[14px] text-[#86868B] font-medium tracking-wide">Carregando tarefas...</p>
      </div>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
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
              setFormParams({ title: '', description: '', priority: 'medium', submitting: false });
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-5 py-2 rounded-[12px] bg-[#F5F5F7] text-[#000000] text-[14px] font-medium hover:bg-white transition-colors cursor-pointer shadow-sm"
          >
            <Plus size={16} strokeWidth={2.5} /> Nova Tarefa
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
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

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="bg-[#1C1C1E] rounded-[24px] border border-white/[0.04] flex flex-col min-h-[400px] shadow-sm">
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
                    <input type="text" value={formParams.title} onChange={(e) => setFormParams({ ...formParams, title: e.target.value })} className="w-full px-4 py-3.5 rounded-[16px] bg-[#2C2C2E] border border-transparent text-[15px] text-[#F5F5F7] focus:border-[#0A84FF] focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0A84FF]/10 focus:outline-none transition-all placeholder:text-[#86868B]/50" placeholder="Ex: Pagar a conta de luz" required />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#86868B] ml-1">Descrição detalhada</label>
                    <textarea value={formParams.description} onChange={(e) => setFormParams({ ...formParams, description: e.target.value })} className="w-full px-4 py-3.5 rounded-[16px] bg-[#2C2C2E] border border-transparent text-[15px] text-[#F5F5F7] focus:border-[#0A84FF] focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0A84FF]/10 focus:outline-none transition-all placeholder:text-[#86868B]/50 resize-none" rows={3} placeholder="Notas adicionais..." />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#86868B] ml-1">Prioridade</label>
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
    </>
  );
}

/* ──────────────────────────────────────────────────────
   BOARD VIEW — Kanban
────────────────────────────────────────────────────── */
function SortableCard({ card, listId, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', card, listId },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      className="group"
    >
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-[12px] border border-white/[0.05] hover:border-white/[0.10] transition-all" style={{ background: '#2C2C2E' }}>
        <button type="button" {...attributes} {...listeners}
          className="text-[#48484A] hover:text-[#86868B] cursor-grab active:cursor-grabbing outline-none shrink-0 touch-none transition-colors">
          <GripVertical size={14} strokeWidth={2} />
        </button>
        <span className="flex-1 text-[14px] font-medium text-[#E5E5EA] truncate min-w-0">{card.name}</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button type="button" onClick={() => onEdit(card)} className="p-1.5 rounded-[6px] text-[#86868B] hover:text-[#F5F5F7] hover:bg-white/[0.08] transition-colors outline-none cursor-pointer"><Pencil size={13} /></button>
          <button type="button" onClick={() => onDelete(card.id)} className="p-1.5 rounded-[6px] text-[#86868B] hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors outline-none cursor-pointer"><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  );
}

function CardOverlay({ card }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-[12px] border border-white/[0.15] cursor-grabbing shadow-2xl" style={{ background: '#3A3A3C' }}>
      <GripVertical size={14} className="text-[#86868B] shrink-0" />
      <span className="flex-1 text-[14px] font-medium text-[#F5F5F7] truncate">{card.name}</span>
    </div>
  );
}

function KanbanList({ list, onRename, onDelete, onCardAdded, onEditCard, onDeleteCard }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(list.name);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [cardName, setCardName] = useState('');
  const [addingCard, setAddingCard] = useState(false);
  const titleRef = useRef(null);
  const cardRef = useRef(null);
  const { error: showError } = useToast();

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
      className="w-full flex-shrink-0"
    >
      <div className="rounded-[18px] border border-white/[0.06] flex flex-col shadow-lg" style={{ background: 'rgba(28,28,30,0.92)', maxHeight: '60vh' }}>
        <div className="flex items-center gap-2 px-4 pt-3.5 pb-3 border-b border-white/[0.05]">
          <button type="button" {...attributes} {...listeners}
            className="text-[#48484A] hover:text-[#86868B] cursor-grab active:cursor-grabbing outline-none shrink-0 touch-none transition-colors">
            <GripVertical size={15} strokeWidth={2} />
          </button>

          {editingTitle ? (
            <div className="flex-1 flex items-center gap-1">
              <input ref={titleRef} value={titleVal} onChange={e => setTitleVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitleVal(list.name); setEditingTitle(false); } }}
                onBlur={saveTitle}
                className="flex-1 rounded-[8px] px-2 py-1 text-[14px] font-semibold text-[#F5F5F7] outline-none border border-[#0A84FF]/60 min-w-0"
                style={{ background: '#2C2C2E' }} />
              {saving && <Loader2 size={13} className="animate-spin text-[#86868B] shrink-0" />}
            </div>
          ) : (
            <h3 onDoubleClick={() => setEditingTitle(true)}
              className="flex-1 text-[14px] font-semibold text-[#F5F5F7] truncate select-none cursor-default">
              {list.name}
            </h3>
          )}

          <span className="text-[11px] font-medium text-[#48484A] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: '#2C2C2E' }}>
            {list.cards.length}
          </span>
          <button type="button" onClick={() => setEditingTitle(true)} className="p-1 rounded-[6px] text-[#48484A] hover:text-[#86868B] hover:bg-white/[0.06] transition-colors outline-none cursor-pointer"><Pencil size={12} /></button>
          <button type="button" onClick={() => onDelete(list.id)} className="p-1 rounded-[6px] text-[#48484A] hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors outline-none cursor-pointer"><Trash2 size={12} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {list.cards.map(card => (
              <SortableCard key={card.id} card={card} listId={list.id} onEdit={onEditCard} onDelete={onDeleteCard} />
            ))}
          </SortableContext>

          {list.cards.length === 0 && !showAdd && (
            <div className="py-5 flex items-center justify-center rounded-[10px] border border-dashed border-white/[0.06]">
              <p className="text-[12px] text-[#48484A]">Sem cartões</p>
            </div>
          )}

          {showAdd && (
            <div className="mt-1">
              <div className="px-3 py-2.5 rounded-[12px] border border-[#0A84FF]/50" style={{ background: '#2C2C2E' }}>
                <input ref={cardRef} value={cardName} onChange={e => setCardName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addCard(); if (e.key === 'Escape') { setShowAdd(false); setCardName(''); } }}
                  placeholder="Nome do cartão..."
                  className="w-full bg-transparent text-[14px] text-[#E5E5EA] placeholder:text-[#48484A] outline-none" />
              </div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={addCard} disabled={addingCard || !cardName.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-medium text-white disabled:opacity-40 transition-colors outline-none cursor-pointer hover:opacity-90"
                  style={{ background: '#0A84FF' }}>
                  {addingCard ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2.5} />}
                  Adicionar
                </button>
                <button type="button" onClick={() => { setShowAdd(false); setCardName(''); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[13px] text-[#86868B] hover:text-[#F5F5F7] hover:bg-white/[0.06] transition-colors outline-none cursor-pointer">
                  <X size={13} /> Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {!showAdd && (
          <div className="px-3 pb-3 pt-1">
            <button type="button" onClick={() => setShowAdd(true)}
              className="w-full flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-medium text-[#48484A] hover:text-[#86868B] hover:bg-white/[0.04] transition-colors outline-none cursor-pointer">
              <Plus size={14} strokeWidth={2.5} /> Adicionar cartão
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EditCardModal({ card, onSave, onClose }) {
  const [name, setName] = useState(card.name);
  const [saving, setSaving] = useState(false);
  const { error: showError } = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    const v = name.trim();
    if (!v) return;
    setSaving(true);
    try {
      const upd = await api(`/task-cards/${card.id}`, { method: 'PUT', body: JSON.stringify({ name: v }) });
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
          <h2 className="text-[18px] font-semibold text-[#F5F5F7]">Editar Cartão</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-[8px] text-[#86868B] hover:text-[#F5F5F7] hover:bg-white/[0.08] transition-colors outline-none cursor-pointer"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input autoFocus value={name} onChange={e => setName(e.target.value)} required
            className="w-full px-4 py-3 rounded-[14px] text-[15px] text-[#F5F5F7] outline-none border border-transparent focus:border-[#0A84FF] transition-all"
            style={{ background: '#2C2C2E' }}
            placeholder="Nome do cartão" />
          <button type="submit" disabled={saving || !name.trim()}
            className="w-full py-3 rounded-[14px] text-white text-[15px] font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            style={{ background: '#0A84FF' }}>
            {saving && <Loader2 size={18} className="animate-spin" />}
            Salvar
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function BoardView() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddList, setShowAddList] = useState(false);
  const [listName, setListName] = useState('');
  const [addingList, setAddingList] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [activeList, setActiveList] = useState(null);
  const listInputRef = useRef(null);
  const dragOriginListId = useRef(null); // captures listId at drag-start, immune to re-renders
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function load() {
    setLoading(true);
    api('/task-lists')
      .then(data => { setLists(data); setLoading(false); })
      .catch(err => { showError(err.message); setLoading(false); });
  }

  useEffect(() => { load(); }, []); // eslint-disable-line
  useEffect(() => { if (showAddList) listInputRef.current?.focus(); }, [showAddList]);

  async function addList() {
    const v = listName.trim();
    if (!v) return;
    setAddingList(true);
    try {
      const list = await api('/task-lists', { method: 'POST', body: JSON.stringify({ name: v }) });
      setLists(prev => [...prev, list]);
      setListName('');
      setShowAddList(false);
      success('Lista criada');
    } catch (err) { showError(err.message); }
    finally { setAddingList(false); }
  }

  function handleRenameList(upd) {
    setLists(prev => prev.map(l => l.id === upd.id ? { ...l, name: upd.name } : l));
    success('Lista renomeada');
  }

  function handleDeleteList(id) {
    confirm({
      title: 'Excluir lista?',
      message: 'Todos os cartões desta lista serão removidos permanentemente.',
      onConfirm: async () => {
        try {
          await api(`/task-lists/${id}`, { method: 'DELETE' });
          setLists(prev => prev.filter(l => l.id !== id));
          success('Lista excluída');
        } catch (err) { showError(err.message); }
      },
    });
  }

  function handleCardAdded(listId, card) {
    setLists(prev => prev.map(l => l.id !== listId ? l : { ...l, cards: [...l.cards, card] }));
  }

  function handleCardSaved(upd) {
    setLists(prev => prev.map(l => ({ ...l, cards: l.cards.map(c => c.id === upd.id ? { ...c, name: upd.name } : c) })));
    setEditingCard(null);
    success('Cartão atualizado');
  }

  function handleDeleteCard(cardId) {
    confirm({
      title: 'Excluir cartão?',
      message: 'Este cartão será removido permanentemente.',
      onConfirm: async () => {
        try {
          await api(`/task-cards/${cardId}`, { method: 'DELETE' });
          setLists(prev => prev.map(l => ({ ...l, cards: l.cards.filter(c => c.id !== cardId) })));
          success('Cartão excluído');
        } catch (err) { showError(err.message); }
      },
    });
  }

  function findListByCard(cardId) {
    return lists.find(l => l.cards.some(c => c.id === cardId));
  }

  function onDragStart({ active }) {
    const d = active.data.current;
    if (d?.type === 'card') {
      setActiveCard(d.card);
      dragOriginListId.current = d.listId; // snapshot BEFORE any re-render
    }
    if (d?.type === 'list') setActiveList(d.list);
  }

  function onDragOver({ active, over }) {
    if (!over) return;
    const aData = active.data.current;
    const oData = over.data.current;
    if (!aData || aData.type !== 'card') return;

    const cardId = Number(active.id);
    const aList = lists.find(l => l.cards.some(c => Number(c.id) === cardId));
    if (!aList) return;

    let targetId = null;
    if (oData?.type === 'card') targetId = Number(oData.listId);
    else if (oData?.type === 'list') targetId = Number(oData.list.id);

    if (!targetId || targetId === Number(aList.id)) return;

    setLists(prev => {
      const card = aList.cards.find(c => Number(c.id) === cardId);
      if (!card) return prev;
      return prev.map(l => {
        if (Number(l.id) === Number(aList.id)) return { ...l, cards: l.cards.filter(c => Number(c.id) !== cardId) };
        if (Number(l.id) === targetId) return { ...l, cards: [...l.cards, card] };
        return l;
      });
    });
  }


  async function onDragEnd({ active, over }) {
    setActiveCard(null);
    setActiveList(null);

    const aData = active.data.current;
    const oData = over?.data.current;

    // --- List reorder ---
    if (aData?.type === 'list') {
      dragOriginListId.current = null;
      if (!over) return;
      const ai = lists.findIndex(l => `list-${l.id}` === active.id);
      const oi = lists.findIndex(l => `list-${l.id}` === over.id);
      if (ai !== -1 && oi !== -1 && ai !== oi) {
        setLists(prev => arrayMove(prev, ai, oi));
      }
      return;
    }

    // --- Card move ---
    if (aData?.type === 'card') {
      // Use ref (captured at drag-start) — always the ORIGINAL list ID
      // Coerce to Number to avoid string/number === mismatch
      const originalListId = Number(dragOriginListId.current);
      dragOriginListId.current = null;
      const cardId = Number(active.id);

      if (!originalListId || !over) return;

      // Determine target list — coerce to Number
      let targetListId = originalListId;
      let overCardId = null;

      if (oData?.type === 'card') {
        targetListId = Number(oData.listId);
        overCardId = Number(over.id);
      } else if (oData?.type === 'list') {
        targetListId = Number(oData.list.id);
      }

      const isMove = targetListId !== originalListId;

      if (isMove) {
        // Cross-list move: send list_id to the database
        const targetList = lists.find(l => Number(l.id) === targetListId);
        const newPos = targetList ? Math.max(0, targetList.cards.length - 1) : 0;
        try {
          await api(`/task-cards/${cardId}`, {
            method: 'PUT',
            body: JSON.stringify({ list_id: targetListId, position: newPos }),
          });
        } catch (err) {
          showError(err.message);
          load(); // revert UI on failure
        }
      } else {
        // Same-list reorder: update ALL card positions so refresh preserves order
        const targetList = lists.find(l => Number(l.id) === targetListId);
        if (!targetList) return;
        const oldIdx = targetList.cards.findIndex(c => Number(c.id) === cardId);
        const newIdx = overCardId
          ? targetList.cards.findIndex(c => Number(c.id) === overCardId)
          : targetList.cards.length - 1;

        if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;

        // Update local state immediately
        const reordered = arrayMove(targetList.cards, oldIdx, newIdx);
        setLists(prev => prev.map(l =>
          Number(l.id) === targetListId ? { ...l, cards: reordered } : l
        ));

        // Persist ALL positions to the database
        const items = reordered.map((c, i) => ({ id: c.id, position: i }));
        try {
          await api('/task-cards/reorder', {
            method: 'POST',
            body: JSON.stringify({ items }),
          });
        } catch { /* silent — UI already updated */ }
      }
    }
  }


  const listIds = lists.map(l => `list-${l.id}`);
  const dropAnimation = { sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-[#0A84FF] border-t-transparent rounded-full"
        />
        <p className="text-[14px] text-[#86868B] font-medium tracking-wide">Carregando quadro...</p>
      </div>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-[32px] md:text-[40px] leading-tight font-semibold text-[#F5F5F7] tracking-tight">O Quadro</h1>
          <p className="text-[17px] text-[#86868B]">{lists.length} lista{lists.length !== 1 ? 's' : ''} · {lists.reduce((a, l) => a + l.cards.length, 0)} cartão/cartões</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button type="button" onClick={() => setShowAddList(true)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-[12px] bg-[#F5F5F7] text-[#000000] text-[14px] font-medium hover:bg-white transition-colors cursor-pointer shadow-sm">
            <Plus size={16} strokeWidth={2.5} /> Nova Lista
          </button>
        </div>
      </motion.div>

      <DndContext sensors={sensors} collisionDetection={closestCorners}
        onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-6 items-start"
        >
          <SortableContext items={listIds} strategy={rectSortingStrategy}>
            {lists.map(list => (
              <KanbanList key={list.id} list={list}
                onRename={handleRenameList}
                onDelete={handleDeleteList}
                onCardAdded={handleCardAdded}
                onEditCard={setEditingCard}
                onDeleteCard={handleDeleteCard} />
            ))}
          </SortableContext>

          {showAddList ? (
            <div className="w-full">
              <div className="rounded-[18px] border border-[#0A84FF]/40 p-4 shadow-lg" style={{ background: 'rgba(28,28,30,0.92)' }}>
                <input ref={listInputRef} value={listName} onChange={e => setListName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addList(); if (e.key === 'Escape') { setShowAddList(false); setListName(''); } }}
                  placeholder="Nome da lista..."
                  className="w-full rounded-[10px] px-3 py-2.5 text-[14px] text-[#F5F5F7] placeholder:text-[#48484A] outline-none border border-transparent focus:border-[#0A84FF]/50 transition-colors"
                  style={{ background: '#2C2C2E' }} />
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={addList} disabled={addingList || !listName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white disabled:opacity-40 transition-colors outline-none cursor-pointer hover:opacity-90"
                    style={{ background: '#0A84FF' }}>
                    {addingList && <Loader2 size={14} className="animate-spin" />}
                    Adicionar Lista
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
              className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-[16px] text-[14px] font-medium text-[#48484A] hover:text-[#86868B] border border-dashed border-white/[0.08] hover:bg-white/[0.04] transition-all cursor-pointer outline-none self-start"
              style={{ background: 'transparent' }}>
              <Plus size={16} strokeWidth={2} /> Adicionar lista
            </button>
          )}
        </motion.div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeCard ? <div style={{ width: 256 }}><CardOverlay card={activeCard} /></div> : null}
          {activeList ? (
            <div style={{ width: 280 }}>
              <div className="rounded-[18px] p-4 border border-white/[0.10] shadow-2xl" style={{ background: '#1C1C1E' }}>
                <span className="text-[14px] font-semibold text-[#F5F5F7]">{activeList.name}</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {lists.length === 0 && !showAddList && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-60">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <Kanban size={28} strokeWidth={1.2} className="text-[#86868B]" />
          </div>
          <p className="text-[15px] text-[#86868B]">Crie sua primeira lista para começar.</p>
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
