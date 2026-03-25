import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  CheckSquare,
  Repeat,
  Target,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ListTodo
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeSubscription } from '../contexts/RealtimeContext';

const ROUTINE_TYPE_LABELS = {
  daily: 'Diária',
  weekly: 'Semanal',
};

const GOAL_TYPE_LABELS = {
  financial: 'Financeira',
  performance: 'Desempenho',
};

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

  if (priority === 'high') {
    return <div className="w-6 h-6 rounded-full border-[2px] border-[#FF453A] shrink-0 transition-all hover:bg-[#FF453A]/20" />;
  }
  if (priority === 'medium') {
    return <div className="w-6 h-6 rounded-full border-[2px] border-[#FF9F0A] shrink-0 transition-all hover:bg-[#FF9F0A]/20" />;
  }
  if (priority === 'low') {
    return <div className="w-6 h-6 rounded-full border-[2px] border-[#32D74B] shrink-0 transition-all hover:bg-[#32D74B]/20" />;
  }
  return <div className={`w-6 h-6 rounded-full border-[2px] border-[#86868B]/50 shrink-0 transition-all hover:bg-white/10`} />;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routineTab, setRoutineTab] = useState('daily');
  const { error: showError } = useToast();
  const { user, activeTeam } = useAuth();

  const load = () => {
    api('/dashboard')
      .then(setData)
      .catch(err => showError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [activeTeam]);

  useRealtimeSubscription(
    ['finances', 'tasks', 'goals', 'routines', 'routine_tasks', 'task_boards', 'task_lists', 'task_cards', 'projects'],
    () => { load(); }
  );

  const toggleTaskComplete = async (task) => {
    try {
      // Optimistic update
      setData(prev => ({
        ...prev,
        tasks: {
          ...prev.tasks,
          items: prev.tasks.items.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t)
        }
      }));
      await api(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !task.completed }),
      });
      // reload silently
      api('/dashboard').then(setData);
    } catch (err) {
      showError(err.message);
      load(); // revert on err
    }
  };

  const toggleRoutineTaskComplete = async (routineId, task) => {
    try {
      // Optimistic update
      setData(prev => ({
        ...prev,
        routines: prev.routines.map(r => r.id === routineId ? {
          ...r,
          tasks: r.tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t)
        } : r)
      }));
      await api(`/routines/${routineId}/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !task.completed }),
      });
      // reload silently
      api('/dashboard').then(setData);
    } catch (err) {
      showError(err.message);
      load(); // revert on err
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-[#0A84FF] border-t-transparent rounded-full"
        />
        <p className="text-[14px] text-[#86868B] font-medium tracking-wide">Preparando seu dashboard...</p>
      </div>
    );
  }

  if (!data) return null;

  const { finance, tasks, goals, routines } = data;
  const displayName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário';
  const routineTypeTabs = ['daily', 'weekly'];
  const filteredRoutines = routines?.filter(r => r.visual_type === routineTab) || [];
  const routineTasks = filteredRoutines
    .flatMap(r => (r.tasks || []).map(t => ({ ...t, routineId: r.id })))
    .sort((a, b) => {
      if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
      if (a.start_time) return -1;
      if (b.start_time) return 1;
      return 0;
    });

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
          Olá, {displayName}
        </h1>
      </motion.div>

      {/* Finance Section */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet size={20} className="text-[#F5F5F7]" />
            <h2 className="text-[20px] font-semibold text-[#F5F5F7] tracking-tight">Finanças</h2>
          </div>
          <Link to="/finances" className="text-[14px] font-medium text-[#0A84FF] hover:text-[#5E94FF] transition-colors">
            Ver todas
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link to="/finances" className="block outline-none group">
            <div className="bg-[#1C1C1E] rounded-[24px] p-6 border border-white/[0.04] flex flex-col justify-between h-[150px] shadow-sm relative overflow-hidden transition-all duration-300 group-hover:bg-[#2C2C2E]/60">
              <div className="flex items-center gap-2 text-[#86868B] z-10">
                <span className="text-[14px] font-medium">Saldo Atual</span>
              </div>
              <p className={`text-[36px] font-semibold tracking-tight z-10 ${finance.balance >= 0 ? 'text-[#F5F5F7]' : 'text-[#FF453A]'}`}>
                R$ {finance.balance.toFixed(2).replace('.', ',')}
              </p>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#0A84FF] opacity-[0.03] blur-3xl rounded-full pointer-events-none transition-opacity group-hover:opacity-[0.05]"></div>
            </div>
          </Link>

          <Link to="/finances" className="block outline-none group">
            <div className="bg-[#1C1C1E] rounded-[24px] p-6 border border-white/[0.04] flex flex-col justify-between h-[150px] shadow-sm relative overflow-hidden transition-all duration-300 group-hover:bg-[#2C2C2E]/60">
              <div className="flex items-center gap-2 text-[#86868B] z-10">
                <ArrowUpRight size={16} className="text-[#30D158]" />
                <span className="text-[14px] font-medium">Receitas</span>
              </div>
              <p className="text-[32px] font-medium text-[#F5F5F7] tracking-tight z-10">
                R$ {finance.income.toFixed(2).replace('.', ',')}
              </p>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#30D158] opacity-[0.03] blur-3xl rounded-full pointer-events-none transition-opacity group-hover:opacity-[0.05]"></div>
            </div>
          </Link>

          <Link to="/finances" className="block outline-none group">
            <div className="bg-[#1C1C1E] rounded-[24px] p-6 border border-white/[0.04] flex flex-col justify-between h-[150px] shadow-sm relative overflow-hidden transition-all duration-300 group-hover:bg-[#2C2C2E]/60">
              <div className="flex items-center gap-2 text-[#86868B] z-10">
                <ArrowDownRight size={16} className="text-[#FF453A]" />
                <span className="text-[14px] font-medium">Despesas</span>
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

        {/* Tarefas */}
        <motion.div variants={itemVariants} className="bg-[#1C1C1E] rounded-[24px] border border-white/[0.04] shadow-sm flex flex-col min-h-[420px]">
          <div className="px-6 py-5 border-b border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} className="text-[#F5F5F7]" />
              <h3 className="text-[17px] font-semibold text-[#F5F5F7]">Tarefas Pendentes</h3>
            </div>
            <Link to="/tasks" className="text-[14px] font-medium text-[#0A84FF] hover:text-[#5E94FF] transition-colors">
              Gerenciar
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {tasks.items?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-60 space-y-3 py-10">
                <ListTodo size={40} className="text-[#86868B]" strokeWidth={1.5} />
                <p className="text-[15px] text-[#86868B]">Tudo limpo por aqui.</p>
              </div>
            ) : (
              tasks.items?.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-4 p-3.5 mx-2 my-1 bg-transparent hover:bg-white/[0.03] rounded-[16px] cursor-pointer transition-colors group"
                  onClick={() => toggleTaskComplete(t)}
                >
                  <TaskStatusCheck completed={t.completed} priority={t.priority} colorClass="bg-[#0A84FF]" />
                  <span className={`flex-1 text-[15px] font-medium transition-colors ${t.completed ? 'line-through text-[#86868B]' : 'text-[#F5F5F7]'}`}>
                    {t.title}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Routines */}
        <motion.div variants={itemVariants} className="bg-[#1C1C1E] rounded-[24px] border border-white/[0.04] shadow-sm flex flex-col min-h-[420px]">
          <div className="px-6 py-5 border-b border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat size={18} className="text-[#F5F5F7]" />
              <h3 className="text-[17px] font-semibold text-[#F5F5F7]">Hábitos e Rotinas</h3>
            </div>
            <Link to="/routines" className="text-[14px] font-medium text-[#0A84FF] hover:text-[#5E94FF] transition-colors">
              Gerenciar
            </Link>
          </div>

          {/* Segmented Control using framer motion */}
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
                  {ROUTINE_TYPE_LABELS[tab]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {routineTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-60 space-y-3 py-6">
                <Clock size={40} className="text-[#86868B]" strokeWidth={1.5} />
                <p className="text-[15px] text-[#86868B]">Nenhuma rotina {ROUTINE_TYPE_LABELS[routineTab].toLowerCase()}.</p>
              </div>
            ) : (
              routineTasks.map((t) => (
                <div
                  key={`${t.routineId}-${t.id}`}
                  className="flex items-start gap-4 p-3.5 mx-2 my-1 bg-transparent hover:bg-white/[0.03] rounded-[16px] cursor-pointer transition-colors group"
                  onClick={() => toggleRoutineTaskComplete(t.routineId, t)}
                >
                  <div className="mt-0.5">
                    <TaskStatusCheck completed={t.completed} priority={t.priority} colorClass="bg-[#8E9C78]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[15px] font-medium truncate transition-colors ${t.completed ? 'line-through text-[#86868B]' : 'text-[#F5F5F7]'}`}>
                        {t.title}
                      </span>
                      {t.start_time && !t.completed && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-[#8E9C78]">
                          <Clock size={10} /> {t.start_time.substring(0, 5)}
                        </span>
                      )}
                      {t.priority === 'high' && !t.completed && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF453A] shrink-0" />
                      )}
                    </div>
                    {t.description && (
                      <p className={`text-[13px] line-clamp-1 transition-colors ${t.completed ? 'text-[#86868B]/50' : 'text-[#86868B]'}`}>
                        {t.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Goals Section */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target size={20} className="text-[#F5F5F7]" />
            <h2 className="text-[20px] font-semibold text-[#F5F5F7] tracking-tight">Metas Ativas</h2>
          </div>
          <Link to="/goals" className="text-[14px] font-medium text-[#0A84FF] hover:text-[#5E94FF] transition-colors">
            Ver todas
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.items?.length === 0 ? (
            <div className="col-span-full bg-[#1C1C1E] border border-white/[0.04] rounded-[24px] flex flex-col items-center justify-center py-12 px-6">
              <Target size={48} strokeWidth={1.5} className="text-[#86868B] mb-4 opacity-60" />
              <p className="text-[15px] text-[#86868B]">Você não possui metas em andamento.</p>
              <Link to="/goals" className="mt-4 px-5 py-2 rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[14px] font-medium text-[#F5F5F7] transition-colors flex items-center gap-2">
                <Plus size={16} /> Criar Meta
              </Link>
            </div>
          ) : (
            goals.items?.map(g => (
              <Link to="/goals" key={g.id} className="block group outline-none">
                <div className="bg-[#1C1C1E] rounded-[24px] p-6 border border-white/[0.04] shadow-sm relative overflow-hidden transition-all duration-300 group-hover:bg-[#2C2C2E]/60 h-full flex flex-col justify-between min-h-[160px]">
                  <div className="flex-1 z-10">
                    <div className="mb-3 inline-block px-2.5 py-1 rounded-[6px] bg-[#FF9F0A]/10 text-[#FF9F0A] text-[12px] font-semibold tracking-wide uppercase">
                      {GOAL_TYPE_LABELS[g.type] || g.type}
                    </div>
                    <h3 className="text-[17px] font-medium text-[#F5F5F7] leading-tight line-clamp-2">{g.name}</h3>
                  </div>

                  <div className="mt-4 z-10">
                    <p className="text-[13px] text-[#86868B] mb-0.5">Acumulado</p>
                    <p className="text-[24px] font-semibold text-[#FF9F0A] tracking-tight">R$ {Number(g.saved_amount || 0).toFixed(2).replace('.', ',')}</p>
                  </div>
                  {/* decorative background glow */}
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
