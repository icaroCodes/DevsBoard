import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Pencil, Target, Check } from 'lucide-react';
import { api } from '../lib/api';

export default function Goals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'performance', deadline_type: 'indefinite', target_value: '' });
  const [addAmount, setAddAmount] = useState({ id: null, value: '' });

  const load = () => {
    api('/goals').then(setItems).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (form.type === 'financial' && form.target_value) payload.target_value = parseFloat(form.target_value);
      if (editing) {
        await api(`/goals/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/goals', { method: 'POST', body: JSON.stringify(payload) });
      }
      setModalOpen(false);
      setEditing(null);
      setForm({ name: '', type: 'performance', deadline_type: 'indefinite', target_value: '' });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleComplete = async (item) => {
    try {
      await api(`/goals/${item.id}`, { method: 'PUT', body: JSON.stringify({ completed: !item.completed }) });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddAmount = async (e) => {
    e.preventDefault();
    try {
      await api(`/goals/${addAmount.id}`, {
        method: 'PUT',
        body: JSON.stringify({ add_amount: parseFloat(addAmount.value) }),
      });
      setAddAmount({ id: null, value: '' });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (item) => {
    if (item.type === 'financial' && Number(item.saved_amount) > 0) {
      alert('Deposite os valores guardados antes de excluir a meta');
      return;
    }
    if (!confirm('Excluir esta meta?')) return;
    try {
      await api(`/goals/${item.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const deadlineLabels = { monthly: 'Mensal', yearly: 'Anual', indefinite: 'Indefinido' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Metas</h1>
        <button
          onClick={() => { setEditing(null); setForm({ name: '', type: 'performance', deadline_type: 'indefinite', target_value: '' }); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-zinc-950 font-medium hover:bg-cyan-400"
        >
          <Plus size={20} /> Nova meta
        </button>
      </div>

      {loading ? (
        <div className="h-48 bg-zinc-800 rounded-xl animate-pulse" />
      ) : (
        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="text-zinc-500 text-center py-12">Nenhuma meta</p>
          ) : (
            items.map((item) => {
              const progress = item.type === 'financial' && item.target_value > 0
                ? Math.min(100, (Number(item.saved_amount) / Number(item.target_value)) * 100)
                : 0;
              return (
                <div
                  key={item.id}
                  className={`p-4 bg-zinc-900 border border-zinc-800 rounded-xl ${item.completed ? 'opacity-60' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleComplete(item)} className="text-cyan-500">
                        {item.completed ? <Check size={20} /> : <Target size={20} className="text-zinc-500" />}
                      </button>
                      <div>
                        <p className={`font-medium ${item.completed ? 'line-through' : ''}`}>{item.name}</p>
                        <p className="text-sm text-zinc-500">
                          {item.type === 'performance' ? 'Desempenho' : 'Financeira'} • {deadlineLabels[item.deadline_type]}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditing(item); setForm({ name: item.name, type: item.type, deadline_type: item.deadline_type, target_value: item.target_value || '' }); setModalOpen(true); }} className="p-1 text-zinc-400 hover:text-cyan-400">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(item)} className="p-1 text-zinc-400 hover:text-red-400">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {item.type === 'financial' && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>R$ {Number(item.saved_amount).toFixed(2)} / R$ {Number(item.target_value).toFixed(2)}</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-cyan-500 rounded-full"
                        />
                      </div>
                      {addAmount.id === item.id ? (
                        <form onSubmit={handleAddAmount} className="flex gap-2 mt-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Valor"
                            value={addAmount.value}
                            onChange={(e) => setAddAmount({ ...addAmount, value: e.target.value })}
                            className="flex-1 px-3 py-1 rounded bg-zinc-800 border border-zinc-700"
                            required
                          />
                          <button type="submit" className="px-3 py-1 rounded bg-cyan-500 text-zinc-950 text-sm">Adicionar</button>
                          <button type="button" onClick={() => setAddAmount({ id: null, value: '' })} className="px-3 py-1 rounded bg-zinc-700 text-sm">Cancelar</button>
                        </form>
                      ) : (
                        <button onClick={() => setAddAmount({ id: item.id, value: '' })} className="mt-2 text-sm text-cyan-400 hover:underline">
                          + Adicionar valor
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
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
            <h2 className="text-xl font-bold mb-4">{editing ? 'Editar' : 'Nova'} meta</h2>
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
                <label className="block text-sm text-zinc-400 mb-1">Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700"
                >
                  <option value="performance">Meta de Desempenho</option>
                  <option value="financial">Meta Financeira</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Prazo</label>
                <select
                  value={form.deadline_type}
                  onChange={(e) => setForm({ ...form, deadline_type: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700"
                >
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                  <option value="indefinite">Indefinido</option>
                </select>
              </div>
              {form.type === 'financial' && (
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Valor da meta (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.target_value}
                    onChange={(e) => setForm({ ...form, target_value: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700"
                  />
                </div>
              )}
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
