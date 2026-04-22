import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Pencil, Target, Check, X, ChevronDown,
  Loader2, Trophy, GripVertical
} from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
  defaultDropAnimationSideEffects,
  pointerWithin,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmModalContext';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeSubscription } from '../contexts/RealtimeContext';
import LoadingSkeleton from '../components/LoadingSkeleton';

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0.5' } },
  }),
};

function GoalStatusCheck({ completed }) {
  if (completed) {
    return (
      <div className="w-5 h-5 rounded-full bg-[#8E9C78] flex items-center justify-center shrink-0 shadow-sm transition-all">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
          <Check size={12} className="text-white" strokeWidth={3} />
        </motion.div>
      </div>
    );
  }
  return <div className="w-5 h-5 rounded-full border-[2px] border-[#86868B]/50 shrink-0 transition-all hover:bg-white/10" />;
}

function GoalRow({
  item,
  onEdit,
  onDelete,
  onToggleComplete,
  addAmount,
  setAddAmount,
  handleAddAmount,
  isOverlay = false,
}) {
  const saved = Number(item?.saved_amount) || 0;
  const target = Number(item?.target_value) || 0;
  let progress = 0;
  if (item?.type === 'financial' && target > 0) progress = Math.min(100, (saved / target) * 100);
  else if (item?.completed) progress = 100;
  if (isNaN(progress)) progress = 0;

  const isFinancialComplete = item.type === 'financial' && progress >= 100;
  const isComplete = item.type === 'financial' ? isFinancialComplete : item.completed;
  const typeLabel = item.type === 'financial' ? 'Guardando dinheiro' : 'Pelo esforço';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `goal-${item.id}`,
    data: { type: 'goal', goal: item },
    disabled: isOverlay,
  });

  const style = isOverlay
    ? undefined
    : {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0 : 1,
      };

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      className={`group flex flex-col gap-2 p-3.5 rounded-[16px] transition-all duration-200 ${
        isOverlay
          ? 'bg-[#222224] border border-white/20 shadow-2xl rotate-1 scale-[1.02]'
          : 'glass-card bg-[#1C1C1E]/60 border border-white/[0.04] hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="p-1 mt-0.5 cursor-grab active:cursor-grabbing text-[#86868B] opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0 touch-none"
          >
            <GripVertical size={16} />
          </div>
          <div
            className="mt-1 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              if (item.type === 'performance' && !isOverlay) onToggleComplete(item);
            }}
          >
            <GoalStatusCheck completed={isComplete} />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className={`text-[15px] font-medium truncate transition-colors ${isComplete ? 'text-[#86868B] line-through' : 'text-[#F5F5F7]'}`}>
                {item.name}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-[#86868B] font-bold uppercase tracking-tight">
                {typeLabel}
              </span>
              {item.type === 'financial' && (
                <span className="text-[11px] font-medium text-[#8E9C78]">
                  R$ {saved.toFixed(0)} / R$ {target.toFixed(0)}
                </span>
              )}
            </div>
          </div>
        </div>

        {!isOverlay && (
          <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
            <button
              onClick={() => onEdit(item)}
              className="p-2 lg:p-1.5 text-[#86868B] hover:text-[#0A84FF] rounded-md active:bg-[#0A84FF]/10 transition-colors"
            >
              <Pencil size={18} className="lg:size-4" />
            </button>
            <button
              onClick={() => onDelete(item)}
              className="p-2 lg:p-1.5 text-[#86868B] hover:text-[#FF453A] rounded-md active:bg-[#FF453A]/10 transition-colors"
            >
              <Trash2 size={18} className="lg:size-4" />
            </button>
          </div>
        )}
      </div>

      {item.type === 'financial' && (
        <div className="pl-12">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full rounded-full ${isFinancialComplete ? 'bg-[#30D158]' : 'bg-[#8E9C78]'}`}
            />
          </div>

          {!isOverlay && (
            isFinancialComplete ? (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-[#30D158]">
                <Trophy size={11} /> Meta atingida!
              </div>
            ) : (
              <div className="mt-2">
                {addAmount.id === item.id ? (
                  <form onSubmit={handleAddAmount} className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Valor..."
                      autoFocus
                      value={addAmount.value}
                      onChange={(e) => setAddAmount({ ...addAmount, value: e.target.value })}
                      className="flex-1 px-3 py-1.5 rounded-full bg-[#2C2C2E] border border-transparent focus:border-[#8E9C78] text-[#F5F5F7] text-[13px] outline-none transition-all"
                      required
                    />
                    <button type="submit" className="px-3 py-1.5 rounded-full bg-[#8E9C78] text-white text-[12px] font-bold hover:bg-[#9EAC88]">Guardar</button>
                    <button type="button" onClick={() => setAddAmount({ id: null, value: '' })} className="p-1.5 text-[#86868B] hover:text-[#F5F5F7]"><X size={16} /></button>
                  </form>
                ) : (
                  <button
                    onClick={() => setAddAmount({ id: item.id, value: '' })}
                    className="text-[12px] font-bold text-[#86868B] hover:text-[#8E9C78] transition-colors"
                  >
                    + Guardar mais um pouco
                  </button>
                )}
              </div>
            )
          )}
        </div>
      )}

      {item.type === 'performance' && !isComplete && !isOverlay && (
        <div className="pl-12">
          <button
            onClick={() => onToggleComplete(item)}
            className="text-[12px] font-bold text-[#86868B] hover:text-[#8E9C78] transition-colors"
          >
            ✓ Marcar como concluída
          </button>
        </div>
      )}
    </div>
  );
}

function FreeGoalsZone({
  goals,
  onEdit,
  onDelete,
  onToggleComplete,
  addAmount,
  setAddAmount,
  handleAddAmount,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'container-free',
    data: { type: 'container', year: null },
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-[24px] p-4 sm:p-5 transition-all duration-200 ${
        isOver
          ? 'bg-[#8E9C78]/5 border-2 border-dashed border-[#8E9C78]/40'
          : goals.length === 0
            ? 'border-2 border-dashed border-white/[0.06]'
            : 'border border-transparent'
      }`}
    >
      {goals.length === 0 ? (
        <div className="flex items-center justify-center py-6 text-center">
          <p className="text-[13px] text-[#86868B]">
            {isOver ? 'Solte aqui para tirar do ano' : 'Suas metas avulsas aparecem aqui. Arraste para um ano para organizar.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1 px-1">
            <p className="text-[12px] font-bold uppercase tracking-wider text-[#86868B]">
              Metas avulsas
            </p>
            <span className="text-[12px] text-[#86868B]">
              {goals.length} {goals.length === 1 ? 'meta' : 'metas'}
            </span>
          </div>
          {goals.map((g) => (
            <GoalRow
              key={g.id}
              item={g}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleComplete={onToggleComplete}
              addAmount={addAmount}
              setAddAmount={setAddAmount}
              handleAddAmount={handleAddAmount}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function YearContainer({
  year,
  goals,
  isCurrent,
  expanded,
  setExpanded,
  onNewGoal,
  onEdit,
  onDelete,
  onToggleComplete,
  addAmount,
  setAddAmount,
  handleAddAmount,
}) {
  const isExpanded = expanded[year] ?? isCurrent;

  const { setNodeRef, isOver } = useDroppable({
    id: `container-${year}`,
    data: { type: 'container', year },
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative rounded-[24px] overflow-hidden transition-all duration-300 glass-card bg-[#1C1C1E] border ${
        isOver
          ? 'border-2 border-[#8E9C78]/50 shadow-[0_0_20px_rgba(142,156,120,0.15)]'
          : 'border-white/[0.04] shadow-sm hover:border-white/10'
      }`}
    >
      <div
        className="flex justify-between items-center p-4 sm:p-5 lg:px-6 cursor-pointer select-none group gap-2 sm:gap-4"
        onClick={() => setExpanded(prev => ({ ...prev, [year]: !isExpanded }))}
      >
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#2C2C2E] flex items-center justify-center shrink-0">
            <Trophy size={14} className="sm:size-[18px] text-[#8E9C78]" />
          </div>
          <div>
            <div className="flex items-center gap-2 min-w-0">
              <p className="font-semibold text-[15px] sm:text-[17px] text-[#F5F5F7] tracking-tight truncate flex-1 min-w-0">{year}</p>
              {isCurrent && (
                <span className="shrink-0 px-1.5 py-0.5 rounded-[6px] bg-[#8E9C78]/10 text-[#8E9C78] text-[10px] sm:text-[12px] font-medium tracking-wide">
                  Ano atual
                </span>
              )}
            </div>
            <p className="text-[14px] text-[#86868B] mt-0.5">
              {goals.length} {goals.length === 1 ? 'meta' : 'metas'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-[#86868B] p-1 hover:bg-white/5 rounded-full shrink-0"
          >
            <ChevronDown size={18} className="sm:size-5" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-white/[0.04]"
          >
            <div className="p-4 sm:p-6 bg-[#161618] space-y-2 min-h-[80px]">
              {goals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Target size={28} className="text-[#86868B]/40 mb-2" strokeWidth={1.5} />
                  <p className="text-[13px] text-[#86868B]">
                    {isOver ? 'Solte aqui para colocar em ' + year : 'Nenhuma meta para ' + year + ' ainda.'}
                  </p>
                </div>
              ) : (
                goals.map((g) => (
                  <GoalRow
                    key={g.id}
                    item={g}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleComplete={onToggleComplete}
                    addAmount={addAmount}
                    setAddAmount={setAddAmount}
                    handleAddAmount={handleAddAmount}
                  />
                ))
              )}

              <button
                onClick={() => onNewGoal(year)}
                className="flex items-center gap-2 mt-2 px-3 py-2 text-[14px] font-medium text-[#8E9C78] hover:bg-[#8E9C78]/10 rounded-[12px] transition-colors"
              >
                <Plus size={16} /> Nova meta para {year}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Goals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState(() => {
    try {
      const raw = localStorage.getItem('goals_expanded_years');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('goals_expanded_years', JSON.stringify(expanded));
    } catch {}
  }, [expanded]);
  const [form, setForm] = useState({ name: '', type: 'performance', deadline_type: 'indefinite', target_value: '', submitting: false });
  const [targetYear, setTargetYear] = useState(null);
  const [addAmount, setAddAmount] = useState({ id: null, value: '' });
  const [activeGoalId, setActiveGoalId] = useState(null);
  const { success, error } = useToast();
  const { confirm } = useConfirm();
  const { activeTeam } = useAuth();

  const currentYear = new Date().getFullYear();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = () => {
    setLoading(true);
    const timeoutId = setTimeout(() => setLoading(false), 8000);

    api('/goals')
      .then((data) => {
        const goalsArray = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : (data?.items && Array.isArray(data.items) ? data.items : []));
        setItems(goalsArray || []);
      })
      .catch((err) => {
        console.error('Erro ao buscar metas:', err);
        error(err.message);
        setItems([]);
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, [activeTeam]);
  useRealtimeSubscription(['goals'], () => { load(); });

  const { freeGoals, groupedByYear } = useMemo(() => {
    const free = [];
    const map = new Map();
    map.set(currentYear, []);
    (items || []).filter(Boolean).forEach((g) => {
      if (g.year == null) {
        free.push(g);
      } else {
        const yr = Number(g.year);
        if (!map.has(yr)) map.set(yr, []);
        map.get(yr).push(g);
      }
    });
    const grouped = Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, goals]) => ({ year, goals }));
    return { freeGoals: free, groupedByYear: grouped };
  }, [items, currentYear]);

  const openNewGoal = (year = null) => {
    setEditing(null);
    setTargetYear(year);
    setForm({ name: '', type: 'performance', deadline_type: 'indefinite', target_value: '', submitting: false });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setTargetYear(item.year ?? null);
    setForm({
      name: item.name,
      type: item.type,
      deadline_type: item.deadline_type,
      target_value: item.target_value || '',
      submitting: false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.submitting) return;
    setForm(prev => ({ ...prev, submitting: true }));
    try {
      const payload = { ...form };
      delete payload.submitting;

      if (form.type === 'financial') {
        const val = parseFloat(form.target_value);
        payload.target_value = isNaN(val) ? 0 : val;
      } else {
        payload.target_value = 0;
      }

      payload.year = targetYear ?? null;

      if (editing) {
        await api(`/goals/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/goals', { method: 'POST', body: JSON.stringify(payload) });
      }

      setModalOpen(false);
      setEditing(null);
      setTargetYear(null);
      setForm({ name: '', type: 'performance', deadline_type: 'indefinite', target_value: '', submitting: false });
      success(editing ? 'Pronto, tudo atualizado!' : 'Legal! Você começou um novo objetivo!');
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
    } catch (err) { error(err.message); }
  };

  const handleAddAmount = async (e) => {
    e.preventDefault();
    try {
      await api(`/goals/${addAmount.id}`, {
        method: 'PUT',
        body: JSON.stringify({ add_amount: parseFloat(addAmount.value) }),
      });
      setAddAmount({ id: null, value: '' });
      success('Muito bem! Esse dinheiro foi guardado.');
      load();
    } catch (err) { error(err.message); }
  };

  const handleDelete = async (item) => {
    confirm({
      title: 'Apagar este objetivo?',
      message: item.saved_amount > 0
        ? `Você já guardou R$ ${Number(item.saved_amount).toFixed(2)} para isso. Se apagar agora, esse dinheiro volta para o seu saldo total. Quer mesmo apagar?`
        : 'Você tem certeza que deseja apagar este objetivo?',
      onConfirm: async () => {
        try {
          await api(`/goals/${item.id}`, { method: 'DELETE' });
          success('Objetivo apagado.');
          load();
        } catch (err) { error(err.message); }
      }
    });
  };

  const handleDragEnd = async (event) => {
    setActiveGoalId(null);
    const { active, over } = event;
    if (!over) return;

    const goalId = Number(active.id.toString().replace('goal-', ''));
    const goal = items.find(g => g.id === goalId);
    if (!goal) return;

    const overData = over.data?.current;
    if (!overData || overData.type !== 'container') return;

    const newYear = overData.year;
    const currentGoalYear = goal.year ?? null;
    if (newYear === currentGoalYear) return;

    setItems(prev => prev.map(g => g.id === goalId ? { ...g, year: newYear } : g));

    try {
      await api(`/goals/${goalId}`, { method: 'PUT', body: JSON.stringify({ year: newYear }) });
      success(newYear == null ? 'Meta tirada do ano.' : `Meta movida para ${newYear}.`);
    } catch (err) {
      error(err.message);
      load();
    }
  };

  const deadlineLabels = { monthly: 'Todo mês', yearly: 'Todo ano', indefinite: 'Sem pressa' };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const draggedGoal = activeGoalId
    ? items.find(g => `goal-${g.id}` === activeGoalId)
    : null;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="max-w-4xl mx-auto pb-12 font-sans"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8 lg:mb-10 px-1 sm:px-0">
        <div className="space-y-1">
          <h1 className="text-[32px] md:text-[40px] leading-tight font-semibold text-[#F5F5F7] tracking-tight">
            Meus Objetivos
          </h1>
          <p className="text-[15px] sm:text-[17px] text-[#86868B]">Escolha o que você quer conquistar e acompanhe o progresso.</p>
        </div>

        <button
          onClick={() => openNewGoal(null)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#0A84FF] text-white text-[12px] sm:text-[14px] font-bold sm:font-medium hover:bg-[#5E94FF] transition-all shadow-lg shadow-[#0A84FF]/20 active:scale-95 self-start sm:self-auto"
        >
          <Plus size={16} strokeWidth={3} className="sm:size-[18px] sm:stroke-[2.5]" /> Novo Objetivo
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton variant="goals" />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={(e) => setActiveGoalId(e.active.id)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveGoalId(null)}
        >
          <div className="space-y-4">
            <FreeGoalsZone
              goals={freeGoals}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleComplete={toggleComplete}
              addAmount={addAmount}
              setAddAmount={setAddAmount}
              handleAddAmount={handleAddAmount}
            />

            {groupedByYear.map(({ year, goals }) => (
              <YearContainer
                key={year}
                year={year}
                goals={goals}
                isCurrent={year === currentYear}
                expanded={expanded}
                setExpanded={setExpanded}
                onNewGoal={openNewGoal}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleComplete={toggleComplete}
                addAmount={addAmount}
                setAddAmount={setAddAmount}
                handleAddAmount={handleAddAmount}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {draggedGoal ? (
              <GoalRow
                item={draggedGoal}
                isOverlay
                addAmount={{ id: null, value: '' }}
                setAddAmount={() => {}}
                handleAddAmount={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
                onToggleComplete={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
              onClick={() => { setModalOpen(false); setEditing(null); setTargetYear(null); }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
              className="solid-modal relative w-full max-w-[440px] bg-[#1C1C1E] border border-white/[0.08] shadow-2xl rounded-[24px] overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-white/[0.04] flex items-center justify-between">
                <div>
                  <h2 className="text-[17px] font-semibold text-[#F5F5F7]">
                    {editing ? 'Editar Objetivo' : 'Novo Objetivo'}
                  </h2>
                  {targetYear != null && !editing && (
                    <p className="text-[12px] text-[#8E9C78] mt-0.5">Para {targetYear}</p>
                  )}
                </div>
                <button onClick={() => { setModalOpen(false); setEditing(null); setTargetYear(null); }} className="text-[#86868B] hover:text-[#F5F5F7] transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-[13px] font-medium text-[#86868B] mb-2 uppercase tracking-wider">O que você quer conquistar?</label>
                  <input
                    type="text"
                    value={form.name}
                    placeholder="Ex: Ler 12 livros, Guardar para viagem"
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-[12px] bg-[#2C2C2E] border border-transparent focus:border-[#0A84FF] text-[#F5F5F7] text-[15px] outline-none transition-colors placeholder:text-[#86868B]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#86868B] mb-3 uppercase tracking-wider">Como você quer medir?</label>
                  <div className="flex p-1 bg-[#2C2C2E] rounded-[16px] border border-white/[0.04] relative">
                    {['performance', 'financial'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm({ ...form, type })}
                        className={`relative flex-1 py-2.5 rounded-[12px] text-[13px] font-medium transition-colors z-10 outline-none ${form.type === type ? 'text-[#F5F5F7]' : 'text-[#86868B] hover:text-[#F5F5F7]'}`}
                      >
                        {form.type === type && (
                          <motion.div
                            layoutId="goalTypeTab"
                            className="absolute inset-0 bg-[#3A3A3C] rounded-[12px] shadow-sm -z-10"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        {type === 'performance' ? 'Pelo esforço' : 'Guardando dinheiro'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#86868B] mb-3 uppercase tracking-wider">Até quando você quer conseguir?</label>
                  <div className="flex p-1 bg-[#2C2C2E] rounded-[16px] border border-white/[0.04] relative">
                    {['monthly', 'yearly', 'indefinite'].map((dType) => (
                      <button
                        key={dType}
                        type="button"
                        onClick={() => setForm({ ...form, deadline_type: dType })}
                        className={`relative flex-1 py-2.5 rounded-[12px] text-[13px] font-medium transition-colors z-10 outline-none ${form.deadline_type === dType ? 'text-[#F5F5F7]' : 'text-[#86868B] hover:text-[#F5F5F7]'}`}
                      >
                        {form.deadline_type === dType && (
                          <motion.div
                            layoutId="deadlineTypeTab"
                            className="absolute inset-0 bg-[#3A3A3C] rounded-[12px] shadow-sm -z-10"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        {deadlineLabels[dType]}
                      </button>
                    ))}
                  </div>
                </div>

                {form.type === 'financial' && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-[13px] font-medium text-[#86868B] mb-2 uppercase tracking-wider">Quanto dinheiro você precisa juntar? (R$)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-[#86868B] text-[15px]">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={form.target_value}
                        onChange={(e) => setForm({ ...form, target_value: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 rounded-[12px] bg-[#2C2C2E] border border-transparent focus:border-[#0A84FF] text-[#F5F5F7] text-[15px] outline-none transition-colors placeholder:text-[#86868B]"
                        placeholder="0,00"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={form.submitting}
                    className="w-full py-4 rounded-[16px] bg-[#0A84FF] hover:bg-[#007AFF] text-white text-[16px] font-semibold transition-all shadow-lg shadow-[#0A84FF]/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {form.submitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : editing ? 'Pronto, salvar' : 'Começar agora'}
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
