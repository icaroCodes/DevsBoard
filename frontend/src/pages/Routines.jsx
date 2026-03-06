import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../lib/api';

export default function Routines() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [form, setForm] = useState({ name: '', visual_type: 'daily' });
  const [taskForm, setTaskForm] = useState({ routineId: null, title: '', description: '', priority: 'medium' });

  const load = () => {
    api('/routines').then(setItems).catch(console.error).finally(() => setLoading(false));
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
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      await api(`/routines/${taskForm.routineId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({ title: taskForm.title, description: taskForm.description, priority: taskForm.priority }),
      });
      setTaskForm({ routineId: null, title: '', description: '', priority: 'medium' });
      load();
    } catch (err) {
      alert(err.message);
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
      alert(err.message);
    }
  };

  const deleteTask = async (routineId, taskId) => {
    try {
      await api(`/routines/${routineId}/tasks/${taskId}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta rotina?')) return;
    try {
      await api(`/routines/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const visualLabels = { daily: 'Diária', weekly: 'Semanal', monthly: 'Mensal' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Rotinas</h1>
        <button
          onClick={() => { setEditing(null); setForm({ name: '', visual_type: 'daily' }); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-zinc-950 font-medium hover:bg-cyan-400"
        >
          <Plus size={20} /> Nova rotina
        </button>
      </div>

      {loading ? (
        <div className="h-48 bg-zinc-800 rounded-xl animate-pulse" />
      ) : (
        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="text-zinc-500 text-center py-12">Nenhuma rotina</p>
          ) : (
            items.map((r) => (
              <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div
                  className="flex justify-between items-center p-4 cursor-pointer"
                  onClick={() => setExpanded({ ...expanded, [r.id]: !expanded[r.id] })}
                >
                  <div className="flex items-center gap-3">
                    {expanded[r.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-sm text-zinc-500">{visualLabels[r.visual_type]}</p>
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { setEditing(r); setForm({ name: r.name, visual_type: r.visual_type }); setModalOpen(true); }} className="p-1 text-zinc-400 hover:text-cyan-400">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="p-1 text-zinc-400 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {expanded[r.id] && (
                  <div className="border-t border-zinc-800 p-4 space-y-2">
                    {(r.tasks || []).map((t) => (
                      <div key={t.id} className="flex items-center gap-3 p-2 bg-zinc-800 rounded-lg">
                        <button onClick={() => toggleTask(r.id, t)} className={`text-sm ${t.completed ? 'text-cyan-500 line-through' : ''}`}>
                          {t.completed ? '✓' : '○'} {t.title}
                        </button>
                        <button onClick={() => deleteTask(r.id, t.id)} className="ml-auto text-zinc-400 hover:text-red-400 text-sm">
                          Excluir
                        </button>
                      </div>
                    ))}
                    {taskForm.routineId === r.id ? (
                      <form onSubmit={handleTaskSubmit} className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Título da tarefa"
                          value={taskForm.title}
                          onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                          className="px-3 py-2 rounded bg-zinc-800 border border-zinc-700"
                          required
                        />
                        <div className="flex gap-2">
                          <button type="submit" className="px-3 py-1 rounded bg-cyan-500 text-zinc-950 text-sm">Adicionar</button>
                          <button type="button" onClick={() => setTaskForm({ routineId: null, title: '', description: '', priority: 'medium' })} className="px-3 py-1 rounded bg-zinc-700 text-sm">Cancelar</button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setTaskForm({ ...taskForm, routineId: r.id })}
                        className="text-sm text-cyan-400 hover:underline"
                      >
                        + Adicionar tarefa
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">{editing ? 'Editar' : 'Nova'} rotina</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Tipo visual</label>
                <select
                  value={form.visual_type}
                  onChange={(e) => setForm({ ...form, visual_type: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700"
                >
                  <option value="daily">Diária</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 py-2 rounded-lg bg-cyan-500 text-zinc-950 font-medium">Salvar</button>
                <button type="button" onClick={() => { setModalOpen(false); setEditing(null); }} className="px-4 py-2 rounded-lg bg-zinc-700">Cancelar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
