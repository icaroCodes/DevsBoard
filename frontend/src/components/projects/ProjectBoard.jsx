import { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Plus, Trash2, X, GripVertical, Trello } from 'lucide-react';
import { useTasks } from '../../hooks/useProjects';
import { useToast } from '../../contexts/ToastContext';

const COLUMNS = [
  { key: 'todo', label: 'A fazer', color: '#86868B', accent: 'from-zinc-500/10' },
  { key: 'doing', label: 'Em progresso', color: '#FF9F0A', accent: 'from-amber-500/10' },
  { key: 'done', label: 'Concluído', color: '#30D158', accent: 'from-emerald-500/10' },
];

function TaskModal({ initial, onClose, onSubmit }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [status, setStatus] = useState(initial?.status || 'todo');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try { await onSubmit({ title: title.trim(), description, status }); onClose(); }
    finally { setSubmitting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <motion.form onSubmit={submit} onClick={e => e.stopPropagation()}
        initial={{ scale: 0.94, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.94, y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
        className="w-full max-w-md bg-[#1C1C1E]/95 backdrop-blur-xl border border-white/[0.08] rounded-[22px] p-6 space-y-4 shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-[#F5F5F7] tracking-tight">{initial ? 'Editar tarefa' : 'Nova tarefa'}</h2>
          <button type="button" onClick={onClose} className="text-[#86868B] hover:text-white"><X size={18} /></button>
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">Título*</label>
          <input value={title} onChange={e => setTitle(e.target.value)} autoFocus
            className="mt-1 w-full px-3 py-2.5 bg-[#2C2C2E]/80 border border-white/[0.08] rounded-[12px] text-[14px] text-white outline-none focus:border-[#0A84FF] focus:bg-[#2C2C2E] transition-colors" />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">Descrição</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
            className="mt-1 w-full px-3 py-2.5 bg-[#2C2C2E]/80 border border-white/[0.08] rounded-[12px] text-[14px] text-white outline-none focus:border-[#0A84FF] focus:bg-[#2C2C2E] resize-none leading-relaxed transition-colors" />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">Status</label>
          <div className="mt-1.5 flex gap-1.5 p-1 bg-[#2C2C2E]/60 rounded-[12px] border border-white/[0.06]">
            {COLUMNS.map(c => (
              <button type="button" key={c.key} onClick={() => setStatus(c.key)}
                className={`flex-1 px-3 py-2 rounded-[8px] text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 ${status === c.key ? 'bg-white text-black shadow' : 'text-[#A1A1AA] hover:text-white'}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-[#A1A1AA] hover:text-white">Cancelar</button>
          <motion.button type="submit" disabled={submitting || !title.trim()}
            whileTap={{ scale: 0.96 }}
            className="px-5 py-2 text-[13px] font-semibold bg-white text-black rounded-[10px] disabled:opacity-40">
            {submitting ? 'Salvando...' : 'Salvar'}
          </motion.button>
        </div>
      </motion.form>
    </motion.div>
  );
}

export default function ProjectBoard({ projectId }) {
  const { tasks, loading, create, update, remove } = useTasks(projectId);
  const { showError } = useToast();
  const [modal, setModal] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [dragId, setDragId] = useState(null);

  const onDragStart = (e, task) => {
    setDragId(task.id);
    e.dataTransfer.setData('text/plain', String(task.id));
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragEnd = () => { setDragId(null); setDragOver(null); };
  const onDrop = async (e, status) => {
    e.preventDefault();
    setDragOver(null);
    setDragId(null);
    const id = Number(e.dataTransfer.getData('text/plain'));
    const task = tasks.find(t => t.id === id);
    if (!task || task.status === status) return;
    try { await update(id, { status }); }
    catch (err) { showError(err.message); }
  };

  if (loading) return <div className="text-[#86868B] text-[13px]">Carregando tarefas...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Trello size={18} className="text-[#F5F5F7]" />
          <h2 className="text-[16px] font-semibold text-[#F5F5F7]">Board</h2>
          <span className="text-[11px] text-[#63646B] ml-2">{tasks.length} tarefa{tasks.length !== 1 ? 's' : ''}</span>
        </div>
        <motion.button whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }} onClick={() => setModal({ mode: 'create' })}
          className="flex items-center gap-2 px-3.5 py-2 bg-white text-black text-[12px] font-semibold rounded-[10px] shadow-sm">
          <Plus size={14} /> Nova tarefa
        </motion.button>
      </div>

      <LayoutGroup>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => {
            const list = tasks.filter(t => t.status === col.key);
            const isDragOver = dragOver === col.key;
            return (
              <motion.div key={col.key} layout
                onDragOver={(e) => { e.preventDefault(); setDragOver(col.key); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => onDrop(e, col.key)}
                animate={{ scale: isDragOver ? 1.01 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={`relative rounded-[18px] p-3 min-h-[420px] border bg-gradient-to-b ${col.accent} to-transparent transition-colors ${isDragOver ? 'border-white/30 bg-white/[0.04]' : 'border-white/[0.06]'}`}>
                <div className="flex items-center justify-between mb-3 px-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shadow-[0_0_8px]" style={{ background: col.color, boxShadow: `0 0 10px ${col.color}80` }} />
                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#A1A1AA]">{col.label}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#63646B] bg-white/[0.04] px-1.5 py-0.5 rounded-full">{list.length}</span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {list.map(task => (
                      <motion.div key={task.id}
                        layout
                        layoutId={`task-${task.id}`}
                        initial={{ opacity: 0, scale: 0.95, y: 6 }}
                        animate={{ opacity: dragId === task.id ? 0.4 : 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        whileHover={{ y: -2 }}
                        draggable
                        onDragStart={(e) => onDragStart(e, task)}
                        onDragEnd={onDragEnd}
                        onClick={() => setModal({ mode: 'edit', task })}
                        className="group relative p-3 rounded-[12px] bg-[#1C1C1E] border border-white/[0.06] hover:border-white/15 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] cursor-pointer">
                        <div className="absolute left-1 top-3 opacity-0 group-hover:opacity-50 transition-opacity">
                          <GripVertical size={12} className="text-white/40" />
                        </div>
                        <p className="text-[13px] font-semibold text-[#F5F5F7] pr-6 leading-snug">{task.title}</p>
                        {task.description && <p className="text-[12px] text-[#86868B] mt-1.5 line-clamp-2 leading-relaxed">{task.description}</p>}
                        <button onClick={(e) => { e.stopPropagation(); remove(task.id).catch(err => showError(err.message)); }}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md text-white/50 hover:text-[#FF453A] hover:bg-white/[0.06] transition-all">
                          <Trash2 size={12} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {list.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-center py-10 text-[11px] text-[#63646B] border border-dashed border-white/[0.06] rounded-[12px]">
                      Solte aqui ou crie uma tarefa
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </LayoutGroup>

      <AnimatePresence>
        {modal && (
          <TaskModal
            initial={modal.mode === 'edit' ? modal.task : null}
            onClose={() => setModal(null)}
            onSubmit={async (payload) => {
              try {
                if (modal.mode === 'edit') await update(modal.task.id, payload);
                else await create(payload);
              } catch (e) { showError(e.message); throw e; }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
