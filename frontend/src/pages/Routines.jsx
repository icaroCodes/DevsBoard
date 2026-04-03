import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, ChevronDown, CheckSquare, GripVertical, Repeat, X, Clock, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmModalContext';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeSubscription } from '../contexts/RealtimeContext';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

function TaskStatusCheck({ completed, colorClass = "bg-[#8E9C78]" }) {
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

function TaskPreview({ task, isOverlay = false }) {
  const priorityColors = {
    high: '#FF453A',
    medium: '#FF9F0A',
    low: '#32D74B',
    none: 'transparent'
  };

  const formatTime = (time) => {
    if (!time) return null;
    return time.substring(0, 5);
  };

  return (
    <div className={`flex items-start justify-between p-3.5 rounded-[12px] border shadow-xl ${isOverlay ? 'rotate-2 opacity-95 scale-[1.02] bg-[#222224] border-white/20' : 'bg-[#161618] border-white/[0.08]'}`}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="p-1 mt-0.5 text-[#86868B] shrink-0">
          <GripVertical size={16} />
        </div>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-1">
            <TaskStatusCheck completed={task.completed} colorClass="bg-[#8E9C78]" />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className={`text-[15px] font-medium truncate transition-colors ${task.completed ? 'text-[#86868B] line-through' : 'text-[#F5F5F7]'}`}>
                {task.title}
              </span>
              {task.start_time && !task.completed && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-[#8E9C78]">
                  <Clock size={10} /> {formatTime(task.start_time)}
                </span>
              )}
              {task.priority && task.priority !== 'none' && !task.completed && (
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: priorityColors[task.priority] }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableTask({ routineId, task, onToggle, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver
  } = useSortable({ id: `task-${task.id}`, data: { type: 'task', task, routineId } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const priorityColors = {
    high: '#FF453A',
    medium: '#FF9F0A',
    low: '#32D74B',
    none: 'transparent'
  };

  const formatDay = (day) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    return days[day];
  };

  const formatTime = (time) => {
    if (!time) return null;
    return time.substring(0, 5); // HH:mm
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-start justify-between p-3.5 rounded-[16px] transition-all duration-200 ${isDragging
          ? 'bg-transparent border-2 border-dashed border-[#8E9C78]/20 opacity-40'
          : isOver
            ? 'bg-[#8E9C78]/5 border border-[#8E9C78]/30 scale-[0.98]'
            : 'bg-transparent hover:bg-white/[0.03]'
        }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="p-1 mt-0.5 cursor-grab active:cursor-grabbing text-[#86868B] opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
        >
          <GripVertical size={16} />
        </div>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-1" onClick={(e) => { e.preventDefault(); onToggle(routineId, task); }}>
            <TaskStatusCheck completed={task.completed} colorClass="bg-[#8E9C78]" />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className={`text-[15px] font-medium truncate transition-colors ${task.completed ? 'text-[#86868B] line-through' : 'text-[#F5F5F7]'}`}>
                {task.title}
              </span>
              {(task.start_time || task.day_of_week !== null) && !task.completed && (
                <div className="flex gap-1.5 items-center">
                  {task.day_of_week !== null && (
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-[#86868B] font-bold uppercase tracking-tight">
                      {formatDay(task.day_of_week)}
                    </span>
                  )}
                  {task.start_time && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-[#8E9C78]">
                      <Clock size={10} /> {formatTime(task.start_time)}
                    </span>
                  )}
                </div>
              )}
              {task.priority && task.priority !== 'none' && !task.completed && (
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: priorityColors[task.priority] }}
                  title={`Importância ${task.priority === 'high' ? 'Urgente' : task.priority === 'medium' ? 'Importante' : 'Normal'}`}
                />
              )}
            </div>
            {task.description && (
              <p className={`text-[13px] line-clamp-1 transition-colors ${task.completed ? 'text-[#86868B]/50' : 'text-[#86868B]'}`}>
                {task.description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
        <button
          onClick={() => onEdit(routineId, task)}
          className="p-2 lg:p-1.5 text-[#86868B] hover:text-[#0A84FF] rounded-md active:bg-[#0A84FF]/10 transition-colors"
        >
          <Pencil size={18} className="lg:size-4" />
        </button>
        <button
          onClick={() => onDelete(routineId, task.id)}
          className="p-2 lg:p-1.5 text-[#86868B] hover:text-[#FF453A] rounded-md active:bg-[#FF453A]/10 transition-colors"
        >
          <Trash2 size={18} className="lg:size-4" />
        </button>
      </div>
    </div>
  );
}

function RoutinePreview({ r, visualLabels, isOverlay = false }) {
  if (!r) return null;

  return (
    <div className={`flex flex-col rounded-[16px] border transition-all overflow-hidden ${isOverlay ? 'rotate-1 scale-[1.05] bg-[#111111] border-white/30 ring-1 ring-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.5)] opacity-95' : 'bg-[#1C1C1E] border-white/[0.08] shadow-2xl'}`}>
      <div className={`flex justify-between items-center p-4 sm:p-5 lg:px-6 ${isOverlay && r.tasks?.length > 0 ? 'border-b border-white/[0.04]' : ''}`}>
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div className="p-1 text-[#86868B] shrink-0">
            <GripVertical size={18} className="sm:size-5" />
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#2C2C2E] flex items-center justify-center shrink-0">
            <Repeat size={14} className="sm:size-[18px] text-[#8E9C78]" />
          </div>
          <div>
            <div className="flex items-center gap-2 min-w-0">
              <p className="font-semibold text-[14px] sm:text-[15px] text-[#F5F5F7] tracking-tight truncate flex-1 min-w-0 uppercase font-bold">{r.name}</p>
            </div>
            <p className="text-[12px] text-[#86868B] mt-0.5">
              {r.tasks?.length || 0} {(r.tasks?.length === 1) ? 'atividade' : 'atividades'}
            </p>
          </div>
        </div>
      </div>

      {isOverlay && r.tasks && r.tasks.length > 0 && (
        <div className="p-2 space-y-2 bg-[#111111] max-h-[300px] overflow-y-auto overflow-x-hidden scrollbar-hide">
          {r.tasks.map(t => (
            <div key={t.id} className="flex items-center gap-2 px-3 py-2.5 rounded-[12px] bg-[#222224] border border-white/20 shadow-md">
              <div className="w-3.5 h-3.5 rounded-full border border-white/10 shrink-0" />
              <span className="text-[13px] text-[#E5E5EA] font-medium truncate flex-1">{t.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SortableRoutine({
  r,
  expanded,
  setExpanded,
  setEditing,
  setModalOpen,
  setForm,
  handleDelete,
  taskForm,
  setTaskForm,
  handleTaskSubmit,
  toggleTask,
  deleteTask,
  onTaskDragEnd,
  sensors,
  visualLabels
}) {
  const [activeTaskId, setActiveTaskId] = useState(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver
  } = useSortable({ id: `routine-${r.id}`, data: { type: 'routine', routine: r } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const isExpanded = expanded[r.id];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative rounded-[24px] overflow-hidden transition-all duration-300 ${isDragging
          ? 'bg-transparent border-2 border-dashed border-[#8E9C78]/40 shadow-none z-0'
          : isOver 
            ? 'bg-[#1C1C1E] border-2 border-[#0A84FF]/50 shadow-[0_0_15px_rgba(10,132,255,0.1)] scale-[0.98]'
            : 'bg-[#1C1C1E] border border-white/[0.04] shadow-sm hover:border-white/10'
        }`}
    >
      {/* Indicador visual de inserção estilo "glow" quando o item é o destino do drop */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#8E9C78]/5 pointer-events-none animate-pulse" />
      )}

      <div
        className="flex justify-between items-center p-4 sm:p-5 lg:px-6 cursor-pointer select-none group gap-2 sm:gap-4"
        onClick={() => setExpanded(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
      >
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="p-1 cursor-grab active:cursor-grabbing text-[#86868B] opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0"
          >
            <GripVertical size={18} className="sm:size-5" />
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#2C2C2E] flex items-center justify-center shrink-0">
            <Repeat size={14} className="sm:size-[18px] text-[#8E9C78]" />
          </div>
          <div>
            <div className="flex items-center gap-2 min-w-0">
              <p className="font-semibold text-[15px] sm:text-[17px] text-[#F5F5F7] tracking-tight truncate flex-1 min-w-0">{r.name}</p>
              <span className="shrink-0 px-1.5 py-0.5 rounded-[6px] bg-[#8E9C78]/10 text-[#8E9C78] text-[10px] sm:text-[12px] font-medium tracking-wide">
                {visualLabels[r.visual_type]}
              </span>
            </div>
            <p className="text-[14px] text-[#86868B] mt-0.5">
              {r.tasks?.length || 0} {(r.tasks?.length === 1) ? 'atividade' : 'atividades'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <div className="flex gap-0.5 sm:gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity mr-1 sm:mr-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setEditing(r); setForm({ name: r.name, visual_type: r.visual_type }); setModalOpen(true); }}
              className="p-1.5 text-[#86868B] hover:text-[#0A84FF] hover:bg-[#0A84FF]/10 rounded-full transition-colors active:scale-95"
            >
              <Pencil size={15} className="sm:size-4" />
            </button>
            <button
              onClick={() => handleDelete(r.id)}
              className="p-1.5 text-[#86868B] hover:text-[#FF453A] hover:bg-[#FF453A]/10 rounded-full transition-colors active:scale-95"
            >
              <Trash2 size={15} className="sm:size-4" />
            </button>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-[#86868B] p-1 hover:bg-white/5 rounded-full shrink-0"
          >
            <ChevronDown size={18} className="sm:size-5" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-white/[0.04]"
          >
            <div className="p-4 sm:p-6 bg-[#161618] space-y-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}

                onDragStart={(e) => setActiveTaskId(e.active.id)}
                onDragEnd={(e) => { setActiveTaskId(null); onTaskDragEnd(e, r.id); }}
                onDragCancel={() => setActiveTaskId(null)}
              >
                <SortableContext
                  items={(r.tasks || []).map(t => `task-${t.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  {(r.tasks || []).map((t) => (
                    <SortableTask
                      key={t.id}
                      routineId={r.id}
                      task={t}
                      onToggle={toggleTask}
                      onEdit={(rid, task) => setTaskForm({
                        routineId: rid,
                        id: task.id,
                        title: task.title,
                        description: task.description || '',
                        priority: task.priority || 'medium',
                        start_time: task.start_time || '',
                        day_of_week: task.day_of_week
                      })}
                      onDelete={deleteTask}
                    />
                  ))}
                </SortableContext>
                <DragOverlay dropAnimation={dropAnimation}>
                  {activeTaskId ? (
                    <TaskPreview 
                      task={r.tasks.find(t => `task-${t.id}` === activeTaskId)} 
                      isOverlay={true} 
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>

              {taskForm.routineId === r.id ? (
                <motion.form
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleTaskSubmit}
                  className="flex flex-col gap-4 p-5 bg-[#2C2C2E] border border-white/[0.08] rounded-[24px] mt-2 shadow-2xl relative z-20"
                >
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="O que você faz? (Ex: Tomar remédio)"
                      value={taskForm.title}
                      autoFocus
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      className="w-full bg-transparent border-none outline-none text-[17px] font-semibold text-[#F5F5F7] placeholder:text-[#86868B]"
                      required
                    />
                    <textarea
                      placeholder="Quer escrever alguma anotação sobre isso?"
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      className="w-full bg-transparent border-none outline-none text-[15px] text-[#86868B] placeholder:text-[#86868B]/50 resize-none h-16"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-1.5 ml-1">Em qual horário você começa?</label>
                      <input
                        type="time"
                        value={taskForm.start_time || ''}
                        onChange={(e) => setTaskForm({ ...taskForm, start_time: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-[12px] px-3 py-2 text-[14px] text-[#F5F5F7] outline-none focus:border-[#8E9C78]/30 transition-colors"
                      />
                    </div>
                    {r.visual_type === 'weekly' && (
                      <div className="col-span-1 sm:col-span-2">
                        <label className="block text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-2.5 ml-1">Em qual dia da semana ocorre?</label>
                        <div className="flex justify-between items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
                          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setTaskForm({ ...taskForm, day_of_week: taskForm.day_of_week === idx ? null : idx })}
                              className={`w-9 h-9 sm:w-9 sm:h-9 rounded-full shrink-0 flex items-center justify-center text-[12px] sm:text-[13px] font-bold transition-all duration-200 border ${taskForm.day_of_week === idx
                                  ? 'bg-[#8E9C78] border-[#8E9C78] text-white shadow-lg shadow-[#8E9C78]/20 scale-105 sm:scale-110'
                                  : 'bg-white/5 border-transparent text-[#86868B] hover:bg-white/10'
                                }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/[0.04]">
                    <div className="w-full sm:w-auto">
                      <label className="block sm:hidden text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-2 ml-1">Qual a importância disso?</label>
                      <div className="grid grid-cols-4 sm:flex gap-1.5 w-full sm:w-auto">
                        {['none', 'low', 'medium', 'high'].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setTaskForm({ ...taskForm, priority: p })}
                            className={`flex flex-1 sm:flex-none justify-center px-1 sm:px-3 py-2 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${taskForm.priority === p
                                ? p === 'high' ? 'bg-[#FF453A] text-white shadow-lg shadow-[#FF453A]/20' : p === 'medium' ? 'bg-[#FF9F0A] text-white shadow-lg shadow-[#FF9F0A]/20' : p === 'low' ? 'bg-[#32D74B] text-white shadow-lg shadow-[#32D74B]/20' : 'bg-white/20 text-white'
                                : 'bg-white/5 text-[#86868B] hover:bg-white/10'
                              }`}
                          >
                            <span className="truncate">{p === 'high' ? 'Urgente' : p === 'medium' ? 'Importante' : p === 'low' ? 'Normal' : 'Tanto faz'}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setTaskForm({ routineId: null, title: '', description: '', priority: 'medium', start_time: '', day_of_week: null })}
                        className="flex-1 sm:flex-none px-4 py-3 sm:py-2 rounded-full text-[13px] sm:text-[14px] font-medium text-[#86868B] bg-white/5 sm:bg-transparent hover:bg-white/10 sm:hover:bg-white/5 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={taskForm.submitting}
                        className={`flex-1 sm:flex-none px-6 py-3 sm:py-2 rounded-full bg-[#8E9C78] text-white text-[13px] sm:text-[14px] font-bold hover:bg-[#9EAC88] transition-all shadow-lg shadow-[#8E9C78]/10 disabled:opacity-50 flex items-center justify-center gap-2`}
                      >
                        {taskForm.submitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Salvando...</span>
                          </>
                        ) : 'Salvar'}
                      </button>
                    </div>
                  </div>
                </motion.form>
              ) : (
                <button
                  onClick={() => setTaskForm({ ...taskForm, routineId: r.id })}
                  className="flex items-center gap-2 mt-2 px-3 py-2 text-[14px] font-medium text-[#8E9C78] hover:bg-[#8E9C78]/10 rounded-[12px] transition-colors"
                >
                  <Plus size={16} /> Nova atividade na rotina
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Routines() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [form, setForm] = useState({ name: '', visual_type: 'daily', submitting: false });
  const [taskForm, setTaskForm] = useState({ routineId: null, id: null, title: '', description: '', priority: 'medium', start_time: '', day_of_week: null, submitting: false });
  const [activeId, setActiveId] = useState(null);
  const { success, error } = useToast();
  const { confirm } = useConfirm();
  const { activeTeam } = useAuth();

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const load = () => {
    api('/routines').then(setItems).catch(err => error(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [activeTeam]);

  useRealtimeSubscription(['routines', 'routine_tasks'], () => { load(); });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.submitting) return;
    setForm(prev => ({ ...prev, submitting: true }));
    try {
      if (editing) {
        await api(`/routines/${editing.id}`, { method: 'PUT', body: JSON.stringify({ name: form.name, visual_type: form.visual_type }) });
      } else {
        await api('/routines', { method: 'POST', body: JSON.stringify({ name: form.name, visual_type: form.visual_type }) });
      }
      setModalOpen(false);
      setEditing(null);
      setForm({ name: '', visual_type: 'daily', submitting: false });
      success(editing ? 'Rotina atualizada!' : 'Rotina criada!');
      load();
    } catch (err) {
      error(err.message);
      setForm(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || taskForm.submitting) return;
    setTaskForm(prev => ({ ...prev, submitting: true }));
    try {
      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        start_time: taskForm.start_time || null,
        day_of_week: taskForm.day_of_week ?? null
      };

      if (taskForm.id) {
        await api(`/routines/${taskForm.routineId}/tasks/${taskForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await api(`/routines/${taskForm.routineId}/tasks`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setTaskForm({ routineId: null, id: null, title: '', description: '', priority: 'medium', start_time: '', day_of_week: null, submitting: false });
      success(taskForm.id ? 'Anotação atualizada!' : 'Legal, atividade colocada na rotina!');
      load();
    } catch (err) {
      error(err.message);
      setTaskForm(prev => ({ ...prev, submitting: false }));
    }
  };

  const toggleTask = async (routineId, task) => {
    try {
      setItems(prev => prev.map(r => r.id === routineId ? {
        ...r,
        tasks: r.tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t)
      } : r));

      await api(`/routines/${routineId}/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !task.completed }),
      });
    } catch (err) {
      error(err.message);
      load();
    }
  };

  const handleTaskDragEnd = async (event, routineId) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const routine = items.find(r => r.id === routineId);
    if (!routine) return;

    const oldIndex = routine.tasks.findIndex(t => `task-${t.id}` === active.id);
    const newIndex = routine.tasks.findIndex(t => `task-${t.id}` === over.id);

    const newTasks = arrayMove(routine.tasks, oldIndex, newIndex);

    // Check if we should auto-sort by time instead
    const sortedTasks = [...newTasks].sort((a, b) => {
      if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
      if (a.start_time) return -1;
      if (b.start_time) return 1;
      return 0;
    });

    const reorderedTasks = sortedTasks.map((t, idx) => ({ ...t, position: idx }));

    setItems(prev => prev.map(r => r.id === routineId ? { ...r, tasks: reorderedTasks } : r));

    try {
      await api(`/routines/${routineId}/tasks/reorder`, {
        method: 'POST',
        body: JSON.stringify({ items: reorderedTasks.map(t => ({ id: t.id, position: t.position })) })
      });
    } catch (err) {
      error('Erro ao salvar nova ordem das tarefas');
      load();
    }
  };

  const handleRoutineDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(r => `routine-${r.id}` === active.id);
    const newIndex = items.findIndex(r => `routine-${r.id}` === over.id);

    const newItems = arrayMove(items, oldIndex, newIndex);
    const reorderedItems = newItems.map((item, idx) => ({ ...item, position: idx }));

    setItems(reorderedItems);

    try {
      await api('/routines/reorder', {
        method: 'POST',
        body: JSON.stringify({ items: reorderedItems.map(r => ({ id: r.id, position: r.position })) })
      });
    } catch (err) {
      error('Erro ao salvar nova ordem das rotinas');
      load();
    }
  };

  const deleteTask = async (routineId, taskId) => {
    confirm({
      title: 'Remover isso da rotina?',
      message: 'Você quer mesmo tirar isso da sua rotina?',
      onConfirm: async () => {
        try {
          await api(`/routines/${routineId}/tasks/${taskId}`, { method: 'DELETE' });
          success('Atividade removida!');
          load();
        } catch (err) {
          error(err.message);
        }
      }
    });
  };

  const handleDelete = async (id) => {
    confirm({
      title: 'Apagar esta rotina inteira?',
      message: 'Você tem certeza? Todas as atividades dessa rotina serão apagadas também.',
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

  const visualLabels = { daily: 'Todo dia', weekly: 'Toda semana' };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

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
            Minha Rotina
          </h1>
          <p className="text-[15px] sm:text-[17px] text-[#86868B]">Acompanhe o que você faz no seu dia a dia.</p>
        </div>

        <button
          onClick={() => { setEditing(null); setForm({ name: '', visual_type: 'daily' }); setModalOpen(true); }}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#0A84FF] text-white text-[12px] sm:text-[14px] font-bold sm:font-medium hover:bg-[#5E94FF] transition-all shadow-lg shadow-[#0A84FF]/20 active:scale-95 self-start sm:self-auto"
        >
          <Plus size={16} strokeWidth={3} className="sm:size-[18px] sm:stroke-[2.5]" /> Criar Nova Rotina
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
            <div className="flex flex-col items-center justify-center py-20 bg-[#1C1C1E] rounded-[24px] border border-white/[0.04]">
              <Repeat size={48} className="text-[#86868B] mb-4 opacity-50" strokeWidth={1.5} />
              <p className="text-[17px] font-medium text-[#F5F5F7]">Você ainda não criou nenhuma rotina.</p>
              <p className="text-[14px] text-[#86868B] mt-2 text-center max-w-sm">Coloque aqui as coisas que você faz sempre para não esquecer (como remédios, exercícios ou limpar a casa).</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={(e) => setActiveId(e.active.id)}
              onDragEnd={handleRoutineDragEnd}
              onDragCancel={() => setActiveId(null)}
            >
              <SortableContext
                items={items.map(r => `routine-${r.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((r, i) => (
                  <SortableRoutine
                    key={r.id}
                    r={r}
                    expanded={expanded}
                    setExpanded={setExpanded}
                    setEditing={setEditing}
                    setModalOpen={setModalOpen}
                    setForm={setForm}
                    handleDelete={handleDelete}
                    taskForm={taskForm}
                    setTaskForm={setTaskForm}
                    handleTaskSubmit={handleTaskSubmit}
                    toggleTask={toggleTask}
                    deleteTask={deleteTask}
                    onTaskDragEnd={handleTaskDragEnd}
                    sensors={sensors}
                    visualLabels={visualLabels}
                  />
                ))}
              </SortableContext>

              <DragOverlay dropAnimation={dropAnimation}>
                {activeId && activeId.toString().startsWith('routine-') ? (
                  <RoutinePreview 
                    r={items.find(r => `routine-${r.id}` === activeId)} 
                    visualLabels={visualLabels} 
                    isOverlay={true} 
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      )}

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
                  <label className="block text-[13px] font-medium text-[#86868B] mb-3 uppercase tracking-wider">Frequência</label>
                  <div className="flex p-1 bg-[#2C2C2E] rounded-[16px] border border-white/[0.04] relative">
                    {['daily', 'weekly'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm({ ...form, visual_type: type })}
                        className={`relative flex-1 py-2.5 rounded-[12px] text-[14px] font-medium transition-colors z-10 outline-none ${form.visual_type === type ? 'text-[#F5F5F7]' : 'text-[#86868B] hover:text-[#F5F5F7]'
                          }`}
                      >
                        {form.visual_type === type && (
                          <motion.div
                            layoutId="routineTypeBg"
                            className="absolute inset-0 bg-[#3A3A3C] rounded-[12px] shadow-sm -z-10"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        {type === 'daily' ? 'Diária' : 'Semanal'}
                      </button>
                    ))}
                  </div>
                </div>

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
                    ) : editing ? 'Salvar Alterações' : 'Criar Rotina'}
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
