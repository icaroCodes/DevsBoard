import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  X, Plus, Trash2, Pencil, Github, RefreshCw, GitCommit, Activity,
  Layout, Loader2, Check, Circle, ExternalLink, ChevronDown, ChevronRight,
  Link2, Unlink, AlertTriangle, Sparkles, Bug, Zap, Wrench, Star, Flag,
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmModalContext';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const TYPES = [
  { key: 'feature',     label: 'Feature',    icon: Sparkles, color: '#0A84FF' },
  { key: 'fix',         label: 'Fix',        icon: Bug,      color: '#FF9F0A' },
  { key: 'urgent',      label: 'Urgente',    icon: Zap,      color: '#FF453A' },
  { key: 'critical',    label: 'Crítica',    icon: AlertTriangle, color: '#FF375F' },
  { key: 'improvement', label: 'Melhoria',   icon: Star,     color: '#BF5AF2' },
  { key: 'common',      label: 'Comum',      icon: Wrench,   color: '#86868B' },
];
const TYPE_BY_KEY = Object.fromEntries(TYPES.map(t => [t.key, t]));

const PRIORITIES = [
  { key: 'low',      label: 'Baixa',    color: '#30D158' },
  { key: 'medium',   label: 'Média',    color: '#0A84FF' },
  { key: 'high',     label: 'Alta',     color: '#FF9F0A' },
  { key: 'critical', label: 'Crítica',  color: '#FF453A' },
];
const PRIO_BY_KEY = Object.fromEntries(PRIORITIES.map(p => [p.key, p]));

const STATUSES = [
  { key: 'todo',        label: 'A fazer' },
  { key: 'in_progress', label: 'Em andamento' },
  { key: 'in_review',   label: 'Em review' },
  { key: 'blocked',     label: 'Bloqueada' },
  { key: 'done',        label: 'Concluída' },
];

const DEFAULT_COLUMNS = [
  { name: 'Backlog',     status: 'todo' },
  { name: 'Em andamento', status: 'in_progress' },
  { name: 'Em review',   status: 'in_review' },
  { name: 'Concluído',   status: 'done', is_done_col: true },
];

const API = '/project-board';
const GH_API = '/project-github';


export default function ProjectBoard({ project, onClose, onProjectUpdated }) {
  const { success, error } = useToast();
  const { confirm } = useConfirm();

  const [tab, setTab] = useState('board'); // board | commits | activity
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [commits, setCommits] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // GitHub
  const [ghStatus, setGhStatus] = useState({ connected: false });
  const [repoModalOpen, setRepoModalOpen] = useState(false);
  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Task modal
  const [taskModal, setTaskModal] = useState(null); // task object or {column_id} for new

  // DnD
  const [activeDrag, setActiveDrag] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const projectId = project?.id;

  const loadAll = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [cols, ts, gh] = await Promise.all([
        api(`${API}/projects/${projectId}/columns`),
        api(`${API}/projects/${projectId}/tasks`),
        api(`${GH_API}/status`).catch(() => ({ connected: false })),
      ]);
      setColumns(cols);
      setTasks(ts);
      setGhStatus(gh);

      // bootstrap colunas padrão se vazio
      if (!cols || cols.length === 0) {
        const created = [];
        for (const c of DEFAULT_COLUMNS) {
          const r = await api(`${API}/projects/${projectId}/columns`, {
            method: 'POST', body: JSON.stringify({ name: c.name, is_done_col: !!c.is_done_col }),
          });
          created.push(r);
        }
        setColumns(created);
      }
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, error]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (tab === 'commits' && projectId) {
      api(`${GH_API}/projects/${projectId}/commits`).then(setCommits).catch(e => error(e.message));
    }
    if (tab === 'activity' && projectId) {
      api(`${API}/projects/${projectId}/activity`).then(setActivity).catch(e => error(e.message));
    }
  }, [tab, projectId, error]);

  const tasksByColumn = useMemo(() => {
    const map = new Map();
    columns.forEach(c => map.set(c.id, []));
    tasks.forEach(t => {
      const arr = map.get(t.column_id) || [];
      arr.push(t);
      map.set(t.column_id, arr);
    });
    map.forEach(arr => arr.sort((a, b) => a.position - b.position));
    return map;
  }, [columns, tasks]);

  // ------ GitHub
  const connectGithub = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || '/api'}${GH_API}/connect?redirect=/projects`;
  };

  const openRepoPicker = async () => {
    setRepoModalOpen(true);
    setReposLoading(true);
    try {
      const r = await api(`${GH_API}/repos`);
      setRepos(r);
    } catch (e) { error(e.message); }
    finally { setReposLoading(false); }
  };

  const linkRepo = async (repo) => {
    try {
      await api(`${GH_API}/projects/${projectId}/repo`, {
        method: 'POST', body: JSON.stringify({ id: repo.id, full_name: repo.full_name }),
      });
      success(`Repo ${repo.full_name} conectado.`);
      setRepoModalOpen(false);
      onProjectUpdated?.();
      // sync inicial
      doSync();
    } catch (e) { error(e.message); }
  };

  const unlinkRepo = () => {
    confirm({
      title: 'Desvincular repositório?',
      message: 'Os commits já sincronizados serão mantidos.',
      onConfirm: async () => {
        try {
          await api(`${GH_API}/projects/${projectId}/repo`, { method: 'DELETE' });
          success('Repositório desvinculado.');
          onProjectUpdated?.();
        } catch (e) { error(e.message); }
      },
    });
  };

  const doSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const r = await api(`${GH_API}/projects/${projectId}/sync`, { method: 'POST' });
      success(`Sincronizado: ${r.upserted} commits.`);
      // recarrega tarefas (commits podem ter sido auto-linkados / fechado tarefas)
      const ts = await api(`${API}/projects/${projectId}/tasks`);
      setTasks(ts);
      if (tab === 'commits') {
        const c = await api(`${GH_API}/projects/${projectId}/commits`);
        setCommits(c);
      }
    } catch (e) { error(e.message); }
    finally { setSyncing(false); }
  };

  // ------ DnD
  const handleDragStart = (e) => {
    const task = tasks.find(t => t.id === e.active.id);
    if (task) setActiveDrag(task);
  };

  const findContainer = useCallback((id) => {
    if (columns.some(c => `col-${c.id}` === id)) return id;
    const t = tasks.find(t => t.id === id);
    return t?.column_id ? `col-${t.column_id}` : null;
  }, [columns, tasks]);

  const handleDragOver = (e) => {
    const { active, over } = e;
    if (!over) return;
    const overContainer = findContainer(over.id);
    const activeContainer = findContainer(active.id);
    if (!overContainer || !activeContainer || activeContainer === overContainer) return;

    setTasks(prev => {
      const activeTask = prev.find(t => t.id === active.id);
      if (!activeTask) return prev;
      const newColId = parseInt(overContainer.replace('col-', ''));
      return prev.map(t => t.id === active.id ? { ...t, column_id: newColId } : t);
    });
  };

  const handleDragEnd = async (e) => {
    const { active, over } = e;
    setActiveDrag(null);
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    const overContainerId = findContainer(over.id);
    if (!overContainerId) return;
    const newColId = parseInt(overContainerId.replace('col-', ''));

    // recompute positions in target column
    const inCol = tasks
      .filter(t => t.column_id === newColId)
      .sort((a, b) => a.position - b.position);

    let targetIndex = inCol.findIndex(t => t.id === over.id);
    if (targetIndex < 0) targetIndex = inCol.length - 1;
    const reordered = arrayMove(
      inCol,
      inCol.findIndex(t => t.id === active.id),
      targetIndex < 0 ? 0 : targetIndex
    ).filter(Boolean);

    const targetCol = columns.find(c => c.id === newColId);
    const newStatus = targetCol?.is_done_col ? 'done'
      : (activeTask.column_id !== newColId && activeTask.status === 'done' ? 'in_progress' : activeTask.status);

    // optimistic position update
    setTasks(prev => prev.map(t => {
      const idx = reordered.findIndex(r => r.id === t.id);
      if (idx >= 0) return { ...t, position: idx, column_id: newColId, status: t.id === active.id ? newStatus : t.status };
      return t;
    }));

    try {
      // bulk reorder + status update for the moved one
      await api(`${API}/tasks/reorder`, {
        method: 'POST',
        body: JSON.stringify({
          items: reordered.map((t, idx) => ({ id: t.id, position: idx, column_id: newColId })),
        }),
      });
      if (newStatus !== activeTask.status) {
        await api(`${API}/tasks/${active.id}`, {
          method: 'PUT', body: JSON.stringify({ status: newStatus }),
        });
      }
    } catch (e) {
      error(e.message);
      loadAll();
    }
  };

  // ------ Task ops
  const moveTask = async (task, newColumnId) => {
    if (task.column_id === newColumnId) return;
    const targetCol = columns.find(c => c.id === newColumnId);
    const newStatus = targetCol?.is_done_col ? 'done'
      : (task.status === 'done' ? 'in_progress' : task.status);
    setTasks(prev => prev.map(t => t.id === task.id
      ? { ...t, column_id: newColumnId, status: newStatus }
      : t));
    try {
      await api(`${API}/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ column_id: newColumnId, status: newStatus }),
      });
    } catch (e) {
      error(e.message);
      loadAll();
    }
  };

  const deleteTask = (task) => {
    confirm({
      title: 'Apagar tarefa?',
      message: `"${task.title}" e suas subtarefas serão removidas.`,
      onConfirm: async () => {
        try {
          await api(`${API}/tasks/${task.id}`, { method: 'DELETE' });
          setTasks(prev => prev.filter(t => t.id !== task.id));
          success('Tarefa removida.');
        } catch (e) { error(e.message); }
      },
    });
  };

  const upsertTask = async (payload, taskId) => {
    try {
      if (taskId) {
        const updated = await api(`${API}/tasks/${taskId}`, {
          method: 'PUT', body: JSON.stringify(payload),
        });
        setTasks(prev => prev.map(t => t.id === taskId ? { ...updated, commits: t.commits || [] } : t));
      } else {
        const created = await api(`${API}/projects/${projectId}/tasks`, {
          method: 'POST', body: JSON.stringify(payload),
        });
        setTasks(prev => [...prev, { ...created, project_subtasks: [], commits: [] }]);
      }
      setTaskModal(null);
    } catch (e) { error(e.message); }
  };

  // detect ?gh=connected
  useEffect(() => {
    const url = new URL(window.location.href);
    const gh = url.searchParams.get('gh');
    if (gh === 'connected') {
      success('GitHub conectado!');
      url.searchParams.delete('gh');
      window.history.replaceState({}, '', url.pathname + (url.search ? '?' + url.searchParams : ''));
      api(`${GH_API}/status`).then(setGhStatus);
    } else if (gh === 'falhou' || gh === 'erro' || gh === 'expired') {
      error('Falha na conexão com o GitHub.');
      url.searchParams.delete('gh');
      window.history.replaceState({}, '', url.pathname);
    }
  }, [success, error]);


  if (!project) return null;

  const progress = project.progress || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0A0A0C]/95 backdrop-blur-xl overflow-hidden flex flex-col"
      style={{ fontFamily: FONT }}
    >
      {/* Header */}
      <div className="border-b border-white/[0.06] px-6 py-4 flex items-center gap-4">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/[0.06] text-[#86868B] hover:text-white transition">
          <X size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-semibold text-[#F5F5F7] tracking-tight truncate">{project.name}</h1>
            <StatusPill status={project.status} />
            <PriorityPill priority={project.priority} />
          </div>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="flex-1 max-w-xs h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#0A84FF] to-[#5E5CE6]" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[12px] text-[#86868B] tabular-nums">{progress}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!ghStatus.connected ? (
            <button onClick={connectGithub}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white text-[13px] transition">
              <Github size={15} /> Conectar GitHub
            </button>
          ) : !project.github_repo_name ? (
            <button onClick={openRepoPicker}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A84FF] hover:bg-[#007AFF] text-white text-[13px] transition">
              <Github size={15} /> Conectar repositório
            </button>
          ) : (
            <>
              <a href={project.github_repo_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white text-[13px] transition">
                <Github size={14} /> {project.github_repo_name}
                <ExternalLink size={12} className="opacity-60" />
              </a>
              <button onClick={doSync} disabled={syncing}
                className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white transition disabled:opacity-50">
                {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              </button>
              <button onClick={unlinkRepo}
                className="p-2 rounded-full hover:bg-[#FF453A]/10 text-[#86868B] hover:text-[#FF453A] transition">
                <Unlink size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/[0.06] px-6 flex items-center gap-1">
        {[
          { key: 'board',    label: 'Quadro',   icon: Layout },
          { key: 'commits',  label: 'Commits',  icon: GitCommit },
          { key: 'activity', label: 'Atividade', icon: Activity },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition ${
              tab === t.key
                ? 'text-white border-[#0A84FF]'
                : 'text-[#86868B] border-transparent hover:text-white/80'
            }`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[#86868B]" />
          </div>
        ) : tab === 'board' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="p-6 flex gap-4 overflow-x-auto h-full">
              {columns.map(col => (
                <ColumnView
                  key={col.id}
                  column={col}
                  columns={columns}
                  tasks={tasksByColumn.get(col.id) || []}
                  onAddTask={() => setTaskModal({ column_id: col.id })}
                  onOpenTask={(t) => setTaskModal(t)}
                  onMoveTask={moveTask}
                  onDeleteTask={deleteTask}
                />
              ))}
            </div>
            <DragOverlay>
              {activeDrag && (
                <div className="rotate-2 opacity-90">
                  <TaskCard task={activeDrag} columns={columns}
                    onOpen={() => {}} onMove={() => {}} onDelete={() => {}} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        ) : tab === 'commits' ? (
          <CommitsView commits={commits} tasks={tasks} projectId={projectId}
            onLinked={loadAll} />
        ) : (
          <ActivityView activity={activity} />
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {taskModal && (
          <TaskModal
            task={taskModal.id ? taskModal : null}
            defaultColumnId={taskModal.column_id}
            columns={columns}
            projectId={projectId}
            onClose={() => setTaskModal(null)}
            onSave={upsertTask}
            onChanged={loadAll}
          />
        )}
        {repoModalOpen && (
          <RepoPickerModal
            repos={repos}
            loading={reposLoading}
            onClose={() => setRepoModalOpen(false)}
            onPick={linkRepo}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}


// =====================================================================
// Column
// =====================================================================
function ColumnView({ column, columns, tasks, onAddTask, onOpenTask, onMoveTask, onDeleteTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${column.id}` });
  const taskIds = tasks.map(t => t.id);

  return (
    <div className={`w-[320px] shrink-0 flex flex-col bg-[#1C1C1E]/60 rounded-[20px] border overflow-hidden transition-colors ${
      isOver ? 'border-[#0A84FF]/60' : 'border-white/[0.04]'
    }`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[14px] text-[#F5F5F7]">{column.name}</span>
          <span className="text-[11px] text-[#86868B] bg-white/[0.06] px-1.5 py-0.5 rounded-full tabular-nums">
            {tasks.length}
          </span>
          {column.is_done_col && <Check size={12} className="text-[#30D158]" />}
        </div>
        <button onClick={onAddTask}
          className="p-1.5 rounded-full hover:bg-white/[0.08] text-[#86868B] hover:text-white transition">
          <Plus size={14} />
        </button>
      </div>
      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[120px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="text-[12px] text-[#86868B] text-center py-6">Sem tarefas</div>
          ) : (
            tasks.map(t => (
              <SortableTaskCard key={t.id} task={t} columns={columns}
                onOpen={() => onOpenTask(t)}
                onMove={(colId) => onMoveTask(t, colId)}
                onDelete={() => onDeleteTask(t)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}


function SortableTaskCard(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard {...props} />
    </div>
  );
}


function TaskCard({ task, columns, onOpen, onMove, onDelete }) {
  const type = TYPE_BY_KEY[task.type] || TYPE_BY_KEY.common;
  const prio = PRIO_BY_KEY[task.priority] || PRIO_BY_KEY.medium;
  const Icon = type.icon;
  const subtasks = task.project_subtasks || [];
  const subTotal = subtasks.length;
  const subDone = subtasks.filter(s => s.completed).length;
  const commitCount = (task.commits || []).length;

  return (
    <div onClick={onOpen}
      className="group p-3 rounded-[14px] bg-[#2C2C2E]/70 border border-white/[0.04] hover:border-white/[0.12] cursor-pointer transition">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold"
          style={{ color: type.color }}>
          <Icon size={12} /> {type.label}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <select
            value={task.column_id || ''}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onMove(parseInt(e.target.value))}
            className="text-[11px] bg-white/[0.06] text-white rounded px-1 py-0.5 outline-none cursor-pointer">
            {columns.map(c => <option key={c.id} value={c.id} className="bg-[#1C1C1E]">{c.name}</option>)}
          </select>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded hover:bg-[#FF453A]/15 text-[#86868B] hover:text-[#FF453A]">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      <p className="text-[14px] text-[#F5F5F7] font-medium mt-1.5 leading-snug">{task.title}</p>
      {task.description && (
        <p className="text-[12px] text-[#86868B] mt-1 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center gap-3 mt-2.5 text-[11px] text-[#86868B]">
        <span className="flex items-center gap-1">
          <Flag size={10} style={{ color: prio.color }} /> {prio.label}
        </span>
        {subTotal > 0 && (
          <span className="flex items-center gap-1">
            <Check size={10} /> {subDone}/{subTotal}
          </span>
        )}
        {commitCount > 0 && (
          <span className="flex items-center gap-1">
            <GitCommit size={10} /> {commitCount}
          </span>
        )}
        {task.due_date && (
          <span className="ml-auto text-[10px]">{new Date(task.due_date).toLocaleDateString('pt-BR')}</span>
        )}
      </div>
      {subTotal > 0 && (
        <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full bg-[#0A84FF]" style={{ width: `${(subDone / subTotal) * 100}%` }} />
        </div>
      )}
    </div>
  );
}


// =====================================================================
// Task Modal
// =====================================================================
function TaskModal({ task, defaultColumnId, columns, projectId, onClose, onSave, onChanged }) {
  const { error, success } = useToast();
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    type: task?.type || 'feature',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    column_id: task?.column_id || defaultColumnId || (columns[0]?.id),
    due_date: task?.due_date ? task.due_date.slice(0, 10) : '',
  });
  const [subtasks, setSubtasks] = useState(task?.project_subtasks || []);
  const [newSub, setNewSub] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.title.trim()) return error('Título é obrigatório');
    setSaving(true);
    const payload = {
      ...form,
      due_date: form.due_date || null,
    };
    await onSave(payload, task?.id);
    setSaving(false);
  };

  const addSub = async () => {
    if (!task?.id || !newSub.trim()) return;
    try {
      const s = await api(`${API}/tasks/${task.id}/subtasks`, {
        method: 'POST', body: JSON.stringify({ title: newSub.trim() }),
      });
      setSubtasks(prev => [...prev, s]);
      setNewSub('');
      onChanged?.();
    } catch (e) { error(e.message); }
  };

  const toggleSub = async (s) => {
    try {
      const updated = await api(`${API}/subtasks/${s.id}`, {
        method: 'PUT', body: JSON.stringify({ completed: !s.completed }),
      });
      setSubtasks(prev => prev.map(x => x.id === s.id ? updated : x));
      onChanged?.();
    } catch (e) { error(e.message); }
  };

  const deleteSub = async (s) => {
    try {
      await api(`${API}/subtasks/${s.id}`, { method: 'DELETE' });
      setSubtasks(prev => prev.filter(x => x.id !== s.id));
      onChanged?.();
    } catch (e) { error(e.message); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[640px] max-h-[90vh] overflow-y-auto bg-[#1C1C1E] border border-white/[0.06] rounded-[24px] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[20px] font-semibold text-[#F5F5F7]">
            {task ? 'Editar tarefa' : 'Nova tarefa'}
          </h2>
          <button onClick={onClose}
            className="p-2 rounded-full hover:bg-white/[0.06] text-[#86868B] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Título">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 rounded-[12px] bg-[#2C2C2E] border border-white/[0.04] text-white outline-none focus:border-[#0A84FF] text-[14px]" />
          </Field>

          <Field label="Descrição">
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 rounded-[12px] bg-[#2C2C2E] border border-white/[0.04] text-white outline-none focus:border-[#0A84FF] resize-none text-[14px]" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <SelectPills value={form.type} options={TYPES}
                onChange={v => setForm({ ...form, type: v })} />
            </Field>
            <Field label="Prioridade">
              <SelectPills value={form.priority} options={PRIORITIES}
                onChange={v => setForm({ ...form, priority: v })} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Coluna">
              <select value={form.column_id || ''} onChange={e => setForm({ ...form, column_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-[12px] bg-[#2C2C2E] border border-white/[0.04] text-white outline-none focus:border-[#0A84FF] text-[14px]">
                {columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Prazo">
              <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-3 py-2.5 rounded-[12px] bg-[#2C2C2E] border border-white/[0.04] text-white outline-none focus:border-[#0A84FF] text-[14px]" />
            </Field>
          </div>

          {task && (
            <Field label={`Subtarefas (${subtasks.filter(s => s.completed).length}/${subtasks.length})`}>
              <div className="space-y-1.5">
                {subtasks.map(s => (
                  <div key={s.id} className="flex items-center gap-2 group px-2 py-1.5 rounded-[10px] hover:bg-white/[0.04]">
                    <button onClick={() => toggleSub(s)}>
                      {s.completed
                        ? <Check size={16} className="text-[#30D158]" />
                        : <Circle size={16} className="text-[#86868B]" />}
                    </button>
                    <span className={`flex-1 text-[13px] ${s.completed ? 'text-[#86868B] line-through' : 'text-white'}`}>
                      {s.title}
                    </span>
                    <button onClick={() => deleteSub(s)}
                      className="opacity-0 group-hover:opacity-100 text-[#86868B] hover:text-[#FF453A]">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input value={newSub} onChange={e => setNewSub(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSub()}
                    placeholder="Adicionar subtarefa…"
                    className="flex-1 px-3 py-2 rounded-[10px] bg-[#2C2C2E] border border-white/[0.04] text-white text-[13px] outline-none focus:border-[#0A84FF]" />
                  <button onClick={addSub}
                    className="px-3 py-2 rounded-[10px] bg-[#0A84FF] hover:bg-[#007AFF] text-white text-[13px]">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </Field>
          )}

          {task?.commits?.length > 0 && (
            <Field label={`Commits (${task.commits.length})`}>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {task.commits.map(c => (
                  <a key={c.id} href={c.html_url} target="_blank" rel="noreferrer"
                    className="flex items-start gap-2 p-2 rounded-[10px] bg-[#2C2C2E]/50 hover:bg-[#2C2C2E] transition">
                    <GitCommit size={14} className="text-[#86868B] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-white truncate">{c.message?.split('\n')[0]}</p>
                      <p className="text-[10px] text-[#86868B] mt-0.5">
                        {c.author_login || c.author_name} · {c.sha?.slice(0, 7)}
                        {c.closes_task && <span className="ml-2 text-[#30D158]">closes</span>}
                      </p>
                    </div>
                    <ExternalLink size={11} className="text-[#86868B] mt-0.5" />
                  </a>
                ))}
              </div>
            </Field>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose}
            className="px-5 py-2 rounded-full text-[#86868B] hover:bg-white/[0.06] text-[13px]">
            Cancelar
          </button>
          <button onClick={submit} disabled={saving}
            className="px-5 py-2 rounded-full bg-[#0A84FF] hover:bg-[#007AFF] text-white text-[13px] font-medium disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : (task ? 'Salvar' : 'Criar')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}


// =====================================================================
// Commits / Activity / Repo picker
// =====================================================================
function CommitsView({ commits, tasks, projectId, onLinked }) {
  const { success, error } = useToast();
  const [linkingCommit, setLinkingCommit] = useState(null);

  const linkToTask = async (commit, taskId) => {
    try {
      await api(`${GH_API}/tasks/${taskId}/commits/${commit.id}`, {
        method: 'POST', body: JSON.stringify({ closes_task: false }),
      });
      success('Commit vinculado.');
      setLinkingCommit(null);
      onLinked?.();
    } catch (e) { error(e.message); }
  };

  if (!commits.length) {
    return (
      <div className="p-12 text-center text-[#86868B]">
        <GitCommit size={32} className="mx-auto mb-3 opacity-40" />
        <p>Nenhum commit ainda. Conecte um repositório e clique em sincronizar.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-2 max-w-[900px] mx-auto">
      {commits.map(c => {
        const links = c.project_task_commits || [];
        return (
          <div key={c.id} className="p-4 rounded-[16px] bg-[#1C1C1E] border border-white/[0.04]">
            <div className="flex items-start gap-3">
              {c.author_avatar_url ? (
                <img src={c.author_avatar_url} className="w-8 h-8 rounded-full" alt="" />
              ) : <div className="w-8 h-8 rounded-full bg-white/10" />}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] text-white font-medium truncate">{c.message?.split('\n')[0]}</p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-[#86868B]">
                  <span>{c.author_login || c.author_name}</span>
                  <span>·</span>
                  <a href={c.html_url} target="_blank" rel="noreferrer" className="hover:text-white font-mono">
                    {c.sha?.slice(0, 7)}
                  </a>
                  <span>·</span>
                  <span>{new Date(c.committed_at).toLocaleString('pt-BR')}</span>
                </div>
                {links.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {links.map(l => {
                      const t = tasks.find(x => x.id === l.task_id);
                      return (
                        <span key={l.task_id}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-[#0A84FF]/15 text-[#0A84FF] flex items-center gap-1">
                          <Link2 size={9} />
                          #task-{l.task_id} {t ? `· ${t.title.slice(0, 24)}` : ''}
                          {l.closes_task && <Check size={9} />}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="relative">
                <button onClick={() => setLinkingCommit(linkingCommit === c.id ? null : c.id)}
                  className="p-1.5 rounded-full hover:bg-white/[0.08] text-[#86868B] hover:text-white">
                  <Link2 size={14} />
                </button>
                {linkingCommit === c.id && (
                  <div className="absolute right-0 top-8 z-10 w-[260px] max-h-[300px] overflow-y-auto bg-[#2C2C2E] border border-white/[0.08] rounded-[12px] shadow-xl p-1">
                    {tasks.length === 0 ? (
                      <div className="p-3 text-[12px] text-[#86868B]">Sem tarefas</div>
                    ) : tasks.map(t => (
                      <button key={t.id} onClick={() => linkToTask(c, t.id)}
                        className="w-full text-left px-3 py-2 rounded-[8px] hover:bg-white/[0.06] text-[12px] text-white truncate">
                        #{t.id} · {t.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


function ActivityView({ activity }) {
  if (!activity?.length) {
    return (
      <div className="p-12 text-center text-[#86868B]">
        <Activity size={32} className="mx-auto mb-3 opacity-40" />
        <p>Sem atividade ainda.</p>
      </div>
    );
  }
  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-2">
      {activity.map(a => (
        <div key={a.id} className="flex items-center gap-3 p-3 rounded-[12px] bg-[#1C1C1E]/60 border border-white/[0.04]">
          <ActivityIcon type={a.type} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-white">{describeActivity(a)}</p>
            <p className="text-[11px] text-[#86868B] mt-0.5">{new Date(a.created_at).toLocaleString('pt-BR')}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityIcon({ type }) {
  const map = {
    task_created: { Icon: Plus, color: '#0A84FF' },
    task_status_changed: { Icon: ChevronRight, color: '#FF9F0A' },
    task_completed: { Icon: Check, color: '#30D158' },
    subtask_completed: { Icon: Check, color: '#30D158' },
    commit_pushed: { Icon: GitCommit, color: '#BF5AF2' },
    commit_linked: { Icon: Link2, color: '#0A84FF' },
    pr_opened: { Icon: ExternalLink, color: '#0A84FF' },
    pr_merged: { Icon: Check, color: '#30D158' },
    project_status_changed: { Icon: Flag, color: '#FF9F0A' },
  };
  const m = map[type] || { Icon: Circle, color: '#86868B' };
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${m.color}20`, color: m.color }}>
      <m.Icon size={13} />
    </div>
  );
}

function describeActivity(a) {
  const p = a.payload || {};
  switch (a.type) {
    case 'task_created':         return `Tarefa criada: "${p.title || ''}"`;
    case 'task_status_changed':  return `Status mudou de ${p.from} para ${p.to}`;
    case 'task_completed':       return `Tarefa concluída`;
    case 'commit_pushed':        return `Commit ${p.sha?.slice(0, 7)} por ${p.author || '—'}`;
    case 'commit_linked':        return `Commit ${p.sha?.slice(0, 7)} vinculado${p.closes ? ' (fechou tarefa)' : ''}`;
    default: return a.type;
  }
}


function RepoPickerModal({ repos, loading, onClose, onPick }) {
  const [q, setQ] = useState('');
  const filtered = repos.filter(r => r.full_name.toLowerCase().includes(q.toLowerCase()));
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[560px] max-h-[80vh] flex flex-col bg-[#1C1C1E] border border-white/[0.06] rounded-[24px] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-semibold text-white">Conectar repositório</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/[0.06] text-[#86868B]">
            <X size={18} />
          </button>
        </div>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar…"
          className="px-3 py-2.5 rounded-[12px] bg-[#2C2C2E] border border-white/[0.04] text-white text-[14px] outline-none focus:border-[#0A84FF]" />
        <div className="mt-3 flex-1 overflow-y-auto space-y-1">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#86868B]" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-[#86868B] py-8 text-[13px]">Nenhum repositório encontrado.</div>
          ) : filtered.map(r => (
            <button key={r.id} onClick={() => onPick(r)}
              className="w-full text-left px-3 py-2.5 rounded-[12px] hover:bg-white/[0.06] flex items-center gap-3 transition">
              <Github size={16} className="text-[#86868B] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-white font-medium truncate">{r.full_name}</p>
                {r.description && <p className="text-[11px] text-[#86868B] truncate">{r.description}</p>}
              </div>
              {r.private && <span className="text-[10px] text-[#FF9F0A]">privado</span>}
              {r.language && <span className="text-[10px] text-[#86868B]">{r.language}</span>}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}


// =====================================================================
// Pills / pequenos
// =====================================================================
function StatusPill({ status }) {
  const map = {
    active:    { label: 'Ativo',     color: '#30D158' },
    paused:    { label: 'Pausado',   color: '#FF9F0A' },
    completed: { label: 'Concluído', color: '#0A84FF' },
    archived:  { label: 'Arquivado', color: '#86868B' },
  };
  const s = map[status] || map.active;
  return (
    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `${s.color}22`, color: s.color }}>{s.label}</span>
  );
}

function PriorityPill({ priority }) {
  const p = PRIO_BY_KEY[priority] || PRIO_BY_KEY.medium;
  return (
    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `${p.color}22`, color: p.color }}>{p.label}</span>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider ml-0.5">{label}</label>
      {children}
    </div>
  );
}

function SelectPills({ value, options, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => {
        const active = value === o.key;
        const Icon = o.icon;
        return (
          <button key={o.key} type="button" onClick={() => onChange(o.key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] transition border ${
              active ? 'border-transparent text-white' : 'border-white/[0.06] text-[#86868B] hover:text-white hover:border-white/20'
            }`}
            style={active ? { backgroundColor: `${o.color}33`, color: o.color } : {}}>
            {Icon && <Icon size={11} />} {o.label}
          </button>
        );
      })}
    </div>
  );
}
