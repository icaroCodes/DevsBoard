import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Pencil, Check, Circle } from 'lucide-react';
import { api } from '../lib/api';

export default function Tasks() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' });

  const load = () => {
    api('/tasks').then(setItems).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api(`/tasks/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await api('/tasks', { method: 'POST', body: JSON.stringify(form) });
      }
      setModalOpen(false);
      setEditing(null);
      setForm({ title: '', description: '', priority: 'medium' });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleComplete = async (item) => {
    try {
      await api(`/tasks/${item.id}`, { method: 'PUT', body: JSON.stringify({ completed: !item.completed }) });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta tarefa?')) return;
    try {
      await api(`/tasks/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ title: item.title, description: item.description || '', priority: item.priority });
    setModalOpen(true);
  };

  const priorityColors = { low: 'text-zinc-500', medium: 'text-amber-500', high: 'text-red-500' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ title: '', description: '', priority: 'medium' });
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-zinc-950 font-medium hover:bg-cyan-400"
        >
          <Plus size={20} /> Nova tarefa
        </button>
      </div>

      {loading ? (
        <div className="h-48 bg-zinc-800 rounded-xl animate-pulse" />
      ) : (
        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-zinc-500 text-center py-12">Nenhuma tarefa</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-lg ${item.completed ? 'opacity-60' : ''}`}
              >
                <button onClick={() => toggleComplete(item)} className="mt-0.5 text-cyan-500">
                  {item.completed ? <Check size={20} /> : <Circle size={20} className="text-zinc-500" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${item.completed ? 'line-through text-zinc-500' : ''}`}>{item.title}</p>
                  {item.description && <p className="text-sm text-zinc-500 mt-1">{item.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${priorityColors[item.priority]}`}>{item.priority}</span>
                  <button onClick={() => openEdit(item)} className="p-1 text-zinc-400 hover:text-cyan-400">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1 text-zinc-400 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
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
            <h2 className="text-xl font-bold mb-4">{editing ? 'Editar' : 'Nova'} tarefa</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Prioridade</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 py-2 rounded-lg bg-cyan-500 text-zinc-950 font-medium">
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setEditing(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-zinc-700"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
