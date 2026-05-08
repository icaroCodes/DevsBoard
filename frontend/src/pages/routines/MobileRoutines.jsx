import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Repeat,
  ChevronDown,
  Clock,
  Loader2,
  CircleDashed,
  Check,
  GripVertical,
  X as XIcon,
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Sheet from '../../components/mobile/Sheet';
import { useRegisterMobileFab } from '../../contexts/MobileFabContext';

const PRIORITIES = [
  { id: 'none', label: 'Tanto faz', color: '#86868B' },
  { id: 'low', label: 'Normal', color: '#32D74B' },
  { id: 'medium', label: 'Importante', color: '#FF9F0A' },
  { id: 'high', label: 'Urgente', color: '#FF453A' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

const visualLabels = { daily: 'Todo dia', weekly: 'Toda semana' };
const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function SortableRoutineCard({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, data: { type: 'routine' } });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      {typeof children === 'function' ? children({ attributes, listeners }) : children}
    </div>
  );
}

function MobileTaskRow({ id, task, onTap }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, data: { type: 'task' } });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onTap(task)}
      className="touch-none flex items-start gap-3 px-3.5 py-3 rounded-[12px] active:bg-white/[0.04] transition-colors"
    >
      <div className="mt-[2px] shrink-0">
        <CircleDashed
          size={18}
          strokeWidth={2}
          className={
            task.completed ? 'text-[#10B981]' : 'text-[#5A5A5F]'
          }
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span
            className={`text-[14px] font-medium truncate ${
              task.completed
                ? 'text-[#86868B] line-through'
                : 'text-[#F5F5F7]'
            }`}
          >
            {task.title}
          </span>
          {task.start_time && !task.completed && (
            <span className="flex items-center gap-1 text-[10.5px] font-medium text-[#8E9C78]">
              <Clock size={10} strokeWidth={2.2} />
              {task.start_time.substring(0, 5)}
            </span>
          )}
          {task.day_of_week !== null && task.day_of_week !== undefined && (
            <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9.5px] text-[#86868B] font-bold uppercase tracking-tight">
              {DAY_NAMES[task.day_of_week]}
            </span>
          )}
          {task.priority && task.priority !== 'none' && !task.completed && (
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                backgroundColor:
                  task.priority === 'high'
                    ? '#FF453A'
                    : task.priority === 'medium'
                      ? '#FF9F0A'
                      : '#32D74B',
              }}
            />
          )}
        </div>
        {task.description && (
          <p
            className={`text-[12px] line-clamp-1 mt-0.5 ${
              task.completed ? 'text-[#86868B]/60' : 'text-[#86868B]'
            }`}
          >
            {task.description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function MobileRoutines({
  items,
  loading,
  expanded,
  setExpanded,
  modalOpen,
  setModalOpen,
  editing,
  setEditing,
  form,
  setForm,
  handleSubmit,
  handleDelete,
  taskForm,
  setTaskForm,
  handleTaskSubmit,
  toggleTask,
  deleteTask,
  handleTaskDragEnd,
  handleRoutineDragEnd,
  sensors,
}) {
  const [routineMenu, setRoutineMenu] = useState(null);
  const [taskMenu, setTaskMenu] = useState(null);
  const [activeRoutineId, setActiveRoutineId] = useState(null);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', visual_type: 'daily', submitting: false });
    setModalOpen(true);
  };

  useRegisterMobileFab(
    { icon: Plus, label: 'Nova rotina', tone: 'accent', onClick: openNew },
    []
  );

  const taskFormOpen = !!taskForm.routineId;
  const taskFormRoutine = items.find((r) => r.id === taskForm.routineId);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="px-4 pt-2 pb-6 max-w-[640px] mx-auto"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Greeting */}
      <motion.div variants={fadeUp} className="mb-5 px-1">
        <p className="text-[12.5px] font-medium text-[#86868B] tracking-tight">
          Minha rotina
        </p>
        <h1 className="text-[26px] font-semibold text-[#F5F5F7] tracking-tight leading-tight">
          {items.length} rotina{items.length !== 1 ? 's' : ''}
        </h1>
      </motion.div>

      {loading ? null : items.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center justify-center gap-3 py-14 rounded-[18px] border border-white/[0.05] bg-[#1A1A1C]"
        >
          <Repeat size={32} strokeWidth={1.4} className="text-[#5A5A5F]" />
          <p className="text-[13.5px] text-[#86868B] text-center px-6">
            Você ainda não criou nenhuma rotina.
          </p>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2C2C2E] text-[13px] font-semibold text-[#F5F5F7] active:scale-95 transition-transform"
          >
            <Plus size={14} strokeWidth={2.4} /> Criar rotina
          </button>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="space-y-2.5">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={(e) => setActiveRoutineId(e.active.id)}
            onDragEnd={(e) => {
              setActiveRoutineId(null);
              handleRoutineDragEnd?.(e);
            }}
            onDragCancel={() => setActiveRoutineId(null)}
          >
            <SortableContext
              items={items.map((r) => `routine-${r.id}`)}
              strategy={verticalListSortingStrategy}
            >
          {items.map((r) => {
            const isExpanded = !!expanded[r.id];
            return (
              <SortableRoutineCard key={r.id} id={`routine-${r.id}`}>
                {({ attributes, listeners }) => (
              <div
                className="rounded-[18px] border border-white/[0.05] bg-[#1A1A1C] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpanded((prev) => ({ ...prev, [r.id]: !prev[r.id] }))
                  }
                  className="flex items-center gap-3 w-full p-4 outline-none active:bg-white/[0.03] transition-colors text-left"
                >
                  <div
                    {...attributes}
                    {...listeners}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Arrastar rotina"
                    className="-ml-1 mr-1 p-1.5 rounded-md text-[#5A5A5F] active:bg-white/[0.05] active:text-[#A1A1AA] cursor-grab touch-none shrink-0 outline-none"
                  >
                    <GripVertical size={15} strokeWidth={2} />
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#2C2C2E] flex items-center justify-center shrink-0">
                    <Repeat size={15} className="text-[#8E9C78]" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-[14.5px] font-semibold text-[#F5F5F7] tracking-tight truncate">
                        {r.name}
                      </p>
                      <span className="shrink-0 px-1.5 py-0.5 rounded-[5px] bg-[#8E9C78]/10 text-[#8E9C78] text-[9.5px] font-bold uppercase tracking-wider">
                        {visualLabels[r.visual_type]}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[#86868B] mt-0.5">
                      {r.tasks?.length || 0}{' '}
                      {r.tasks?.length === 1 ? 'atividade' : 'atividades'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRoutineMenu(r);
                    }}
                    aria-label="Opções"
                    className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-[#86868B] active:bg-white/[0.06] outline-none"
                  >
                    <Pencil size={14} strokeWidth={1.9} />
                  </button>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[#86868B] -mr-1"
                  >
                    <ChevronDown size={18} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden border-t border-white/[0.04]"
                    >
                      <div className="p-2 space-y-1">
                        {(r.tasks || []).length === 0 ? (
                          <p className="text-[12.5px] text-[#86868B] text-center py-5 px-4">
                            Nenhuma atividade nesta rotina ainda.
                          </p>
                        ) : (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCorners}
                            onDragEnd={(e) => handleTaskDragEnd(e, r.id)}
                          >
                            <SortableContext
                              items={(r.tasks || []).map((t) => `task-${t.id}`)}
                              strategy={verticalListSortingStrategy}
                            >
                              {(r.tasks || []).map((task) => (
                                <MobileTaskRow
                                  key={task.id}
                                  id={`task-${task.id}`}
                                  task={task}
                                  onTap={(tk) =>
                                    setTaskMenu({ routineId: r.id, task: tk })
                                  }
                                />
                              ))}
                            </SortableContext>
                          </DndContext>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setTaskForm({
                              routineId: r.id,
                              id: null,
                              title: '',
                              description: '',
                              priority: 'medium',
                              start_time: '',
                              day_of_week: null,
                              submitting: false,
                            })
                          }
                          className="flex items-center gap-2 w-full px-3.5 py-2.5 rounded-[10px] text-[13px] font-semibold text-[#8E9C78] active:bg-[#8E9C78]/10 transition-colors outline-none"
                        >
                          <Plus size={14} strokeWidth={2.4} /> Nova atividade
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
                )}
              </SortableRoutineCard>
            );
          })}
            </SortableContext>
            <DragOverlay>
              {activeRoutineId ? (
                <div className="rounded-[18px] border border-white/15 bg-[#2C2C2E] shadow-2xl rotate-1 scale-[1.02] opacity-95">
                  <div className="flex items-center gap-3 p-4">
                    <GripVertical size={15} className="text-[#5A5A5F]" />
                    <div className="w-9 h-9 rounded-full bg-[#202020] flex items-center justify-center shrink-0">
                      <Repeat size={15} className="text-[#8E9C78]" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14.5px] font-semibold text-[#F5F5F7] truncate">
                        {items.find((r) => `routine-${r.id}` === activeRoutineId)?.name}
                      </p>
                      <p className="text-[11.5px] text-[#86868B]">
                        {items.find((r) => `routine-${r.id}` === activeRoutineId)?.tasks
                          ?.length || 0}{' '}
                        atividades
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </motion.div>
      )}

      {/* Routine action sheet */}
      <Sheet
        open={!!routineMenu}
        onClose={() => setRoutineMenu(null)}
        title={routineMenu?.name}
      >
        <div className="px-4 pb-5 space-y-2">
          <button
            type="button"
            onClick={() => {
              const r = routineMenu;
              setRoutineMenu(null);
              if (!r) return;
              setEditing(r);
              setForm({ name: r.name, visual_type: r.visual_type });
              setModalOpen(true);
            }}
            className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-white/[0.04] active:bg-white/[0.08] transition-colors outline-none"
          >
            <Pencil size={17} className="text-[#E5E5EA]" strokeWidth={2} />
            <span className="text-[14px] font-medium text-[#F5F5F7]">Editar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const id = routineMenu?.id;
              setRoutineMenu(null);
              if (id != null) handleDelete(id);
            }}
            className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-[#FF3B30]/10 active:bg-[#FF3B30]/20 transition-colors outline-none"
          >
            <Trash2 size={17} className="text-[#FF6961]" strokeWidth={2} />
            <span className="text-[14px] font-semibold text-[#FF6961]">Apagar rotina</span>
          </button>
        </div>
      </Sheet>

      {/* Task action sheet */}
      <Sheet
        open={!!taskMenu}
        onClose={() => setTaskMenu(null)}
        title={taskMenu?.task?.title}
      >
        <div className="px-4 pb-5 space-y-2">
          <button
            type="button"
            onClick={() => {
              const m = taskMenu;
              setTaskMenu(null);
              if (m) toggleTask(m.routineId, m.task);
            }}
            className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-white/[0.04] active:bg-white/[0.08] transition-colors outline-none"
          >
            <Check size={17} className="text-[#30D158]" strokeWidth={2.2} />
            <span className="text-[14px] font-medium text-[#F5F5F7]">
              {taskMenu?.task?.completed ? 'Marcar como pendente' : 'Concluir'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              const m = taskMenu;
              setTaskMenu(null);
              if (!m) return;
              setTaskForm({
                routineId: m.routineId,
                id: m.task.id,
                title: m.task.title,
                description: m.task.description || '',
                priority: m.task.priority || 'medium',
                start_time: m.task.start_time || '',
                day_of_week: m.task.day_of_week,
              });
            }}
            className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-white/[0.04] active:bg-white/[0.08] transition-colors outline-none"
          >
            <Pencil size={17} className="text-[#E5E5EA]" strokeWidth={2} />
            <span className="text-[14px] font-medium text-[#F5F5F7]">Editar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const m = taskMenu;
              setTaskMenu(null);
              if (m) deleteTask(m.routineId, m.task.id);
            }}
            className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-[#FF3B30]/10 active:bg-[#FF3B30]/20 transition-colors outline-none"
          >
            <Trash2 size={17} className="text-[#FF6961]" strokeWidth={2} />
            <span className="text-[14px] font-semibold text-[#FF6961]">Apagar</span>
          </button>
        </div>
      </Sheet>

      {/* Routine form sheet */}
      <Sheet
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Editar rotina' : 'Nova rotina'}
      >
        <form onSubmit={handleSubmit} className="px-4 pb-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#86868B] ml-1">
              Como vai chamar?
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Manhã saudável"
              autoFocus
              required
              className="w-full px-4 py-3.5 rounded-[14px] bg-[#0F0F11] border border-white/[0.06] text-[15px] text-[#F5F5F7] focus:border-[#0A84FF]/50 focus:outline-none transition-colors placeholder:text-[#5A5A5F]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#86868B] ml-1">
              Frequência
            </label>
            <div className="relative flex p-1 bg-[#0F0F11] rounded-[14px] border border-white/[0.05]">
              {['daily', 'weekly'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, visual_type: type })}
                  className={`relative flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold transition-colors z-10 outline-none ${
                    form.visual_type === type ? 'text-[#F5F5F7]' : 'text-[#86868B]'
                  }`}
                >
                  {form.visual_type === type && (
                    <motion.div
                      layoutId="mobileRoutineFreq"
                      className="absolute inset-0 bg-[#2C2C2E] rounded-[10px] -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  {visualLabels[type]}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={form.submitting || !form.name?.trim()}
            className="w-full py-4 rounded-[16px] bg-[#0A84FF] text-white text-[15px] font-semibold active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0A84FF]/20"
          >
            {form.submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Salvando...</span>
              </>
            ) : editing ? (
              'Salvar mudanças'
            ) : (
              'Criar rotina'
            )}
          </button>
        </form>
      </Sheet>

      {/* Task form sheet */}
      <Sheet
        open={taskFormOpen}
        onClose={() =>
          setTaskForm({
            routineId: null,
            id: null,
            title: '',
            description: '',
            priority: 'medium',
            start_time: '',
            day_of_week: null,
            submitting: false,
          })
        }
        title={taskForm.id ? 'Editar atividade' : 'Nova atividade'}
        maxHeight="92dvh"
      >
        <form onSubmit={handleTaskSubmit} className="px-4 pb-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#86868B] ml-1">
              O que você faz?
            </label>
            <input
              type="text"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="Ex: Tomar remédio"
              autoFocus
              required
              className="w-full px-4 py-3.5 rounded-[14px] bg-[#0F0F11] border border-white/[0.06] text-[15px] text-[#F5F5F7] focus:border-[#0A84FF]/50 focus:outline-none transition-colors placeholder:text-[#5A5A5F]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#86868B] ml-1">
              Anotação (opcional)
            </label>
            <textarea
              rows={2}
              value={taskForm.description}
              onChange={(e) =>
                setTaskForm({ ...taskForm, description: e.target.value })
              }
              placeholder="Detalhes..."
              className="w-full px-4 py-3 rounded-[14px] bg-[#0F0F11] border border-white/[0.06] text-[14.5px] text-[#F5F5F7] focus:border-[#0A84FF]/50 focus:outline-none transition-colors resize-none placeholder:text-[#5A5A5F]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#86868B] ml-1">
              Em qual horário?
            </label>
            <input
              type="time"
              value={taskForm.start_time || ''}
              onChange={(e) =>
                setTaskForm({ ...taskForm, start_time: e.target.value })
              }
              className="w-full px-4 py-3 rounded-[14px] bg-[#0F0F11] border border-white/[0.06] text-[15px] text-[#F5F5F7] focus:border-[#0A84FF]/50 focus:outline-none transition-colors [color-scheme:dark]"
            />
          </div>

          {taskFormRoutine?.visual_type === 'weekly' && (
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#86868B] ml-1">
                Em qual dia?
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS.map((day, idx) => {
                  const active = taskForm.day_of_week === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setTaskForm({
                          ...taskForm,
                          day_of_week: active ? null : idx,
                        })
                      }
                      className={`h-10 rounded-full flex items-center justify-center text-[12.5px] font-bold transition-all border ${
                        active
                          ? 'bg-[#8E9C78] border-[#8E9C78] text-white shadow-md shadow-[#8E9C78]/25'
                          : 'bg-[#0F0F11] border-white/[0.05] text-[#86868B]'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#86868B] ml-1">
              Importância
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {PRIORITIES.map((p) => {
                const active = taskForm.priority === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setTaskForm({ ...taskForm, priority: p.id })
                    }
                    className={`px-1 py-2.5 rounded-[10px] text-[10.5px] font-bold uppercase tracking-tight transition-all border text-center leading-tight ${
                      active
                        ? 'border-transparent text-white shadow-md'
                        : 'bg-[#0F0F11] border-white/[0.05] text-[#86868B]'
                    }`}
                    style={
                      active
                        ? {
                            background: p.color,
                            boxShadow: `0 4px 14px ${p.color}40`,
                          }
                        : undefined
                    }
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={taskForm.submitting || !taskForm.title?.trim()}
            className="w-full py-4 rounded-[16px] bg-[#8E9C78] text-white text-[15px] font-semibold active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#8E9C78]/25"
          >
            {taskForm.submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Salvando...</span>
              </>
            ) : taskForm.id ? (
              'Salvar'
            ) : (
              'Adicionar'
            )}
          </button>
        </form>
      </Sheet>
    </motion.div>
  );
}
