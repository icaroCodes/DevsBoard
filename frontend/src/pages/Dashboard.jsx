import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet,
  CheckSquare,
  Repeat,
  Target,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ListTodo,
  GripVertical,
} from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeSubscription } from '../contexts/RealtimeContext';
import { useTranslation } from '../utils/translations';
import LoadingSkeleton from '../components/LoadingSkeleton';

/* ─────────────────────────────────────────────────────────
   TaskStatusCheck — checkbox visual, mantém comportamento original.
   ───────────────────────────────────────────────────────── */
function TaskStatusCheck({ completed, priority, colorClass = "bg-[#0A84FF]" }) {
  if (completed) {
    return (
      <div className={`w-6 h-6 rounded-full ${colorClass} flex items-center justify-center shrink-0 shadow-sm transition-all`}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
          <CheckSquare size={14} className="text-white" strokeWidth={3} />
        </motion.div>
      </div>
    );
  }
  if (priority === 'high')   return <div className="w-6 h-6 rounded-full border-[2px] border-[#FF453A] shrink-0 transition-all hover:bg-[#FF453A]/20" />;
  if (priority === 'medium') return <div className="w-6 h-6 rounded-full border-[2px] border-[#FF9F0A] shrink-0 transition-all hover:bg-[#FF9F0A]/20" />;
  if (priority === 'low')    return <div className="w-6 h-6 rounded-full border-[2px] border-[#32D74B] shrink-0 transition-all hover:bg-[#32D74B]/20" />;
  return <div className="w-6 h-6 rounded-full border-[2px] border-[#86868B]/50 shrink-0 transition-all hover:bg-white/10" />;
}

/* ─────────────────────────────────────────────────────────
   sortByOrder — reconcilia items do servidor com ordem salva.
   IDs conhecidos ficam na ordem salva; IDs novos aparecem no fim;
   IDs que sumiram do servidor são descartados.
   ───────────────────────────────────────────────────────── */
function sortByOrder(items, order, idOf = (it) => it.id) {
  if (!order?.length) return items;
  const byId = new Map(items.map(it => [String(idOf(it)), it]));
  const known = [];
  for (const id of order) {
    const hit = byId.get(String(id));
    if (hit) {
      known.push(hit);
      byId.delete(String(id));
    }
  }
  // byId agora só tem os novos — mantém ordem original do servidor pra eles
  const fresh = items.filter(it => byId.has(String(idOf(it))));
  return [...known, ...fresh];
}

/* ─────────────────────────────────────────────────────────
   SortableRow — envolve cada item da lista com grip + useSortable.
   Grip é um botão separado do conteúdo clicável (evita conflito
   entre drag e click-to-toggle).
   ───────────────────────────────────────────────────────── */
function SortableRow({ id, children, className = '' }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 10 : 'auto',
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-start gap-2 mx-2 my-1 rounded-[16px] transition-colors group ${isDragging ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'} ${className}`}>
      <button
        {...attributes}
        {...listeners}
        aria-label="Arrastar para reordenar"
        className="shrink-0 w-6 h-8 mt-3 flex items-center justify-center opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none outline-none"
      >
        <GripVertical size={14} className="text-[#86868B]" />
      </button>
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Dashboard
   ───────────────────────────────────────────────────────── */

const TASK_ORDER_KEY = 'dashboard:taskOrder:v1';
const ROUTINE_ORDER_KEY = (tab) => `dashboard:routineOrder:v1:${tab}`;

function readOrder(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routineTab, setRoutineTab] = useState('daily');
  const [taskOrder, setTaskOrder] = useState(() => readOrder(TASK_ORDER_KEY));
  const [routineOrderByTab, setRoutineOrderByTab] = useState(() => ({
    daily: readOrder(ROUTINE_ORDER_KEY('daily')),
    weekly: readOrder(ROUTINE_ORDER_KEY('weekly')),
  }));
  const { error: showError } = useToast();
  const { user, activeTeam } = useAuth();
  const { t } = useTranslation();

  const load = () => {
    api('/dashboard')
      .then(setData)
      .catch(err => showError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeam]);

  useRealtimeSubscription(
    ['finances', 'tasks', 'goals', 'routines', 'routine_tasks', 'task_boards', 'task_lists', 'task_cards', 'projects'],
    () => { load(); }
  );

  // Persistência de ordem
  useEffect(() => {
    localStorage.setItem(TASK_ORDER_KEY, JSON.stringify(taskOrder));
  }, [taskOrder]);
  useEffect(() => {
    localStorage.setItem(ROUTINE_ORDER_KEY('daily'), JSON.stringify(routineOrderByTab.daily));
    localStorage.setItem(ROUTINE_ORDER_KEY('weekly'), JSON.stringify(routineOrderByTab.weekly));
  }, [routineOrderByTab]);

  const toggleTaskComplete = async (task) => {
    try {
      setData(prev => ({
        ...prev,
        tasks: {
          ...prev.tasks,
          items: prev.tasks.items.map(it => it.id === task.id ? { ...it, completed: !it.completed } : it)
        }
      }));
      await api(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !task.completed }),
      });
      api('/dashboard').then(setData);
    } catch (err) {
      showError(err.message);
      load();
    }
  };

  const toggleRoutineTaskComplete = async (routineId, task) => {
    try {
      setData(prev => ({
        ...prev,
        routines: prev.routines.map(r => r.id === routineId ? {
          ...r,
          tasks: r.tasks.map(it => it.id === task.id ? { ...it, completed: !it.completed } : it)
        } : r)
      }));
      await api(`/routines/${routineId}/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !task.completed }),
      });
      api('/dashboard').then(setData);
    } catch (err) {
      showError(err.message);
      load();
    }
  };

  // DnD sensors — mesmos params que Goals.jsx usa, iOS-safe.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (loading) return <LoadingSkeleton variant="dashboard" />;
  if (!data) return <div style={{position: 'fixed', top: 100, left: 300, zIndex: 99999, background: 'red', color: 'white', fontSize: 40}}>DATA IS NULL! Dashboard not rendering.</div>;

  const { finance, tasks, goals, routines } = data;
  const displayName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário';
  const routineTypeTabs = ['daily', 'weekly'];


  // Rotinas achatadas → chave composta `${routineId}-${taskId}` evita colisão
  // entre tasks de rotinas diferentes. Ordenação base (start_time) aplicada
  // ANTES da reconciliação com a ordem salva.
  const filteredRoutines = routines?.filter(r => r.visual_type === routineTab) || [];
  const routineTasksBase = filteredRoutines
    .flatMap(r => (r.tasks || []).map(it => ({ ...it, routineId: r.id, _key: `${r.id}-${it.id}` })))
    .sort((a, b) => {
      if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
      if (a.start_time) return -1;
      if (b.start_time) return 1;
      return 0;
    });

  // Aplica ordem persistida + reconcilia IDs novos/removidos
  const sortedTasks = sortByOrder(tasks.items || [], taskOrder, it => it.id);
  const sortedRoutineTasks = sortByOrder(routineTasksBase, routineOrderByTab[routineTab], it => it._key);

  const handleTaskDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const currentIds = sortedTasks.map(it => String(it.id));
    const from = currentIds.indexOf(String(active.id));
    const to = currentIds.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    setTaskOrder(arrayMove(currentIds, from, to));
  };

  const handleRoutineDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const currentKeys = sortedRoutineTasks.map(it => it._key);
    const from = currentKeys.indexOf(String(active.id));
    const to = currentKeys.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    const next = arrayMove(currentKeys, from, to);
    setRoutineOrderByTab(prev => ({ ...prev, [routineTab]: next }));
  };

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
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto pb-12 font-sans"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-1 mb-8">
        <h1 className="text-[32px] md:text-[40px] leading-tight font-semibold text-[#F5F5F7] tracking-tight text-center">
          {t.dashHello}, {displayName}
        </h1>
      </motion.div>

      {/* Finance Section */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet size={20} className="text-[#F5F5F7]" />
            <h2 className="text-[20px] font-semibold text-[#F5F5F7] tracking-tight">{t.dashFinances}</h2>
          </div>
          <Link to="/finances" className="text-[14px] font-medium text-[#0A84FF] hover:text-[#5E94FF] transition-colors">
            {t.viewAll}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link to="/finances" className="block outline-none group">
            <div className="glass-card bg-[#1C1C1E] rounded-[24px] p-6 border border-white/[0.04] flex flex-col justify-between h-[150px] shadow-sm relative overflow-hidden transition-all duration-300 group-hover:bg-[#2C2C2E]/60">
              <div className="flex items-center gap-2 text-[#86868B] z-10">
                <span className="text-[14px] font-medium">{t.dashBalance}</span>
              </div>
              <p className={`text-[36px] font-semibold tracking-tight z-10 ${finance.balance >= 0 ? 'text-[#F5F5F7]' : 'text-[#FF453A]'}`}>
                R$ {finance.balance.toFixed(2).replace('.', ',')}
              </p>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#0A84FF] opacity-[0.03] blur-3xl rounded-full pointer-events-none transition-opacity group-hover:opacity-[0.05]"></div>
            </div>
          </Link>

          <Link to="/finances" className="block outline-none group">
            <div className="glass-card bg-[#1C1C1E] rounded-[24px] p-6 border border-white/[0.04] flex flex-col justify-between h-[150px] shadow-sm relative overflow-hidden transition-all duration-300 group-hover:bg-[#2C2C2E]/60">
              <div className="flex items-center gap-2 text-[#86868B] z-10">
                <ArrowUpRight size={16} className="text-[#30D158]" />
                <span className="text-[14px] font-medium">{t.dashIncome}</span>
              </div>
              <p className="text-[32px] font-medium text-[#F5F5F7] tracking-tight z-10">
                R$ {finance.income.toFixed(2).replace('.', ',')}
              </p>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#30D158] opacity-[0.03] blur-3xl rounded-full pointer-events-none transition-opacity group-hover:opacity-[0.05]"></div>
            </div>
          </Link>

          <Link to="/finances" className="block outline-none group">
            <div className="glass-card bg-[#1C1C1E] rounded-[24px] p-6 border border-white/[0.04] flex flex-col justify-between h-[150px] shadow-sm relative overflow-hidden transition-all duration-300 group-hover:bg-[#2C2C2E]/60">
              <div className="flex items-center gap-2 text-[#86868B] z-10">
                <ArrowDownRight size={16} className="text-[#FF453A]" />
                <span className="text-[14px] font-medium">{t.dashExpense}</span>
              </div>
              <p className="text-[32px] font-medium text-[#F5F5F7] tracking-tight z-10">
                R$ {finance.expense.toFixed(2).replace('.', ',')}
              </p>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FF453A] opacity-[0.03] blur-3xl rounded-full pointer-events-none transition-opacity group-hover:opacity-[0.05]"></div>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Grid: Tasks & Routines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">

        {/* Tarefas com DnD */}
        <motion.div variants={itemVariants} className="glass-card bg-[#1C1C1E] rounded-[24px] border border-white/[0.04] shadow-sm flex flex-col min-h-[420px]">
          <div className="px-6 py-5 border-b border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} className="text-[#F5F5F7]" />
              <h3 className="text-[17px] font-semibold text-[#F5F5F7]">{t.dashTasksPending}</h3>
            </div>
            <Link to="/tasks" className="text-[14px] font-medium text-[#0A84FF] hover:text-[#5E94FF] transition-colors">
              {t.manage}
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {sortedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-60 space-y-3 py-10">
                <ListTodo size={40} className="text-[#86868B]" strokeWidth={1.5} />
                <p className="text-[15px] text-[#86868B]">{t.dashTasksClean}</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleTaskDragEnd}
              >
                <SortableContext
                  items={sortedTasks.map(it => String(it.id))}
                  strategy={verticalListSortingStrategy}
                >
                  {sortedTasks.map((it) => (
                    <SortableRow key={it.id} id={String(it.id)}>
                      <div
                        className="flex items-center gap-4 py-2.5 pr-3 cursor-pointer"
                        onClick={() => toggleTaskComplete(it)}
                      >
                        <TaskStatusCheck completed={it.completed} priority={it.priority} colorClass="bg-[#0A84FF]" />
                        <span className={`flex-1 text-[15px] font-medium transition-colors ${it.completed ? 'line-through text-[#86868B]' : 'text-[#F5F5F7]'}`}>
                          {it.title}
                        </span>
                      </div>
                    </SortableRow>
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </motion.div>

        {/* Rotinas com DnD */}
        <motion.div variants={itemVariants} className="glass-card bg-[#1C1C1E] rounded-[24px] border border-white/[0.04] shadow-sm flex flex-col min-h-[420px]">
          <div className="px-6 py-5 border-b border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat size={18} className="text-[#F5F5F7]" />
              <h3 className="text-[17px] font-semibold text-[#F5F5F7]">{t.dashHabits}</h3>
            </div>
            <Link to="/routines" className="text-[14px] font-medium text-[#0A84FF] hover:text-[#5E94FF] transition-colors">
              {t.manage}
            </Link>
          </div>

          {/* Segmented Control */}
          <div className="px-6 py-4">
            <div className="flex p-1 bg-[#2C2C2E] rounded-[12px] shadow-sm border border-white/[0.02] relative w-full mb-2">
              {routineTypeTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRoutineTab(tab)}
                  className={`relative flex-1 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors z-10 outline-none ${routineTab === tab ? 'text-[#F5F5F7]' : 'text-[#86868B] hover:text-[#F5F5F7]'}`}
                >
                  {routineTab === tab && (
                    <motion.div
                      layoutId="activeRoutineTabDashboard"
                      className="absolute inset-0 bg-[#3A3A3C] rounded-[8px] shadow-sm -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {t.routineType[tab] || tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-2">
            {sortedRoutineTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-60 space-y-3 py-6">
                <Clock size={40} className="text-[#86868B]" strokeWidth={1.5} />
                <p className="text-[15px] text-[#86868B]">{t.dashNoRoutine} {t.routineType[routineTab]?.toLowerCase()}.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleRoutineDragEnd}
              >
                <SortableContext
                  items={sortedRoutineTasks.map(it => it._key)}
                  strategy={verticalListSortingStrategy}
                >
                  {sortedRoutineTasks.map((it) => (
                    <SortableRow key={it._key} id={it._key}>
                      <div
                        className="flex items-start gap-4 py-2.5 pr-3 cursor-pointer"
                        onClick={() => toggleRoutineTaskComplete(it.routineId, it)}
                      >
                        <div className="mt-0.5">
                          <TaskStatusCheck completed={it.completed} priority={it.priority} colorClass="bg-[#8E9C78]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[15px] font-medium truncate transition-colors ${it.completed ? 'line-through text-[#86868B]' : 'text-[#F5F5F7]'}`}>
                              {it.title}
                            </span>
                            {it.start_time && !it.completed && (
                              <span className="flex items-center gap-1 text-[11px] font-medium text-[#8E9C78]">
                                <Clock size={10} /> {it.start_time.substring(0, 5)}
                              </span>
                            )}
                            {it.priority === 'high' && !it.completed && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FF453A] shrink-0" />
                            )}
                          </div>
                          {it.description && (
                            <p className={`text-[13px] line-clamp-1 transition-colors ${it.completed ? 'text-[#86868B]/50' : 'text-[#86868B]'}`}>
                              {it.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </SortableRow>
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </motion.div>
      </div>

      {/* Goals Section */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target size={20} className="text-[#F5F5F7]" />
            <h2 className="text-[20px] font-semibold text-[#F5F5F7] tracking-tight">{t.dashGoals}</h2>
          </div>
          <Link to="/goals" className="text-[14px] font-medium text-[#0A84FF] hover:text-[#5E94FF] transition-colors">
            {t.viewAll}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.items?.length === 0 ? (
            <div className="glass-card col-span-full bg-[#1C1C1E] border border-white/[0.04] rounded-[24px] flex flex-col items-center justify-center py-12 px-6">
              <Target size={48} strokeWidth={1.5} className="text-[#86868B] mb-4 opacity-60" />
              <p className="text-[15px] text-[#86868B]">{t.dashNoGoals}</p>
              <Link to="/goals" className="mt-4 px-5 py-2 rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[14px] font-medium text-[#F5F5F7] transition-colors flex items-center gap-2">
                <Plus size={16} /> {t.dashCreateGoal}
              </Link>
            </div>
          ) : (
            goals.items?.map(g => (
              <Link to="/goals" key={g.id} className="block group outline-none">
                <div className="glass-card bg-[#1C1C1E] rounded-[24px] p-6 border border-white/[0.04] shadow-sm relative overflow-hidden transition-all duration-300 group-hover:bg-[#2C2C2E]/60 h-full flex flex-col justify-between min-h-[160px]">
                  <div className="flex-1 z-10">
                    <div className="mb-3 inline-block px-2.5 py-1 rounded-[6px] bg-[#FF9F0A]/10 text-[#FF9F0A] text-[12px] font-semibold tracking-wide uppercase">
                      {t.goalType[g.type] || g.type}
                    </div>
                    <h3 className="text-[17px] font-medium text-[#F5F5F7] leading-tight line-clamp-2">{g.name}</h3>
                  </div>

                  <div className="mt-4 z-10">
                    <p className="text-[13px] text-[#86868B] mb-0.5">{t.dashGoalAccum}</p>
                    <p className="text-[24px] font-semibold text-[#FF9F0A] tracking-tight">R$ {Number(g.saved_amount || 0).toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#FF9F0A] opacity-[0.02] blur-3xl rounded-full pointer-events-none transition-opacity group-hover:opacity-[0.04]"></div>
                </div>
              </Link>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
