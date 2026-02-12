import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Pencil, Wallet } from 'lucide-react';
import { api } from '../lib/api';

const CATEGORIES = ['Salário', 'Freelance', 'Investimentos', 'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Outros'];

export default function Finances() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    category: '',
    description: '',
    amount: '',
    type: 'expense',
    transaction_date: new Date().toISOString().slice(0, 10),
  });

  const load = () => {
    api('/finances').then(setItems).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const filtered = items.filter((i) => {
    if (filter === 'all') return true;
    return i.type === filter;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api(`/finances/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
        });
      } else {
        await api('/finances', {
          method: 'POST',
          body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
        });
      }
      setModalOpen(false);
      setEditing(null);
      setForm({ category: '', description: '', amount: '', type: 'expense', transaction_date: new Date().toISOString().slice(0, 10) });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta transação?')) return;
    try {
      await api(`/finances/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      category: item.category,
      description: item.description || '',
      amount: String(item.amount),
      type: item.type,
      transaction_date: item.transaction_date,
    });
    setModalOpen(true);
  };

  const income = items.filter((i) => i.type === 'income').reduce((s, i) => s + Number(i.amount), 0);
  const expense = items.filter((i) => i.type === 'expense').reduce((s, i) => s + Number(i.amount), 0);
  const balance = income - expense;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Finanças</h1>
        <button
          onClick={() => { setEditing(null); setForm({ category: '', description: '', amount: '', type: 'expense', transaction_date: new Date().toISOString().slice(0, 10) }); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-zinc-950 font-medium hover:bg-cyan-400"
        >
          <Plus size={20} /> Nova transação
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <p className="text-zinc-400 text-sm">Saldo</p>
          <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>R$ {balance.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <p className="text-zinc-400 text-sm">Entradas</p>
          <p className="text-xl font-bold text-green-500">R$ {income.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <p className="text-zinc-400 text-sm">Despesas</p>
          <p className="text-xl font-bold text-red-500">R$ {expense.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'income', 'expense'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg ${filter === f ? 'bg-cyan-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          >
            {f === 'all' ? 'Todas' : f === 'income' ? 'Entradas' : 'Despesas'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-48 bg-zinc-800 rounded-xl animate-pulse" />
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-zinc-500 text-center py-12">Nenhuma transação</p>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-4 bg-zinc-900 border border-zinc-800 rounded-lg"
              >
                <div>
                  <p className="font-medium">{item.category}</p>
                  <p className="text-sm text-zinc-500">{item.description || '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className={item.type === 'income' ? 'text-green-500' : 'text-red-500'}>
                    {item.type === 'income' ? '+' : '-'} R$ {Number(item.amount).toFixed(2)}
                  </p>
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
            <h2 className="text-xl font-bold mb-4">{editing ? 'Editar' : 'Nova'} transação</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700"
                >
                  <option value="income">Entrada</option>
                  <option value="expense">Despesa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Categoria</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700"
                  required
                >
                  <option value="">Selecione</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Descrição</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Data</label>
                <input
                  type="date"
                  value={form.transaction_date}
                  onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 py-2 rounded-lg bg-cyan-500 text-zinc-950 font-medium">
                  Salvar
                </button>
                <button type="button" onClick={() => { setModalOpen(false); setEditing(null); }} className="px-4 py-2 rounded-lg bg-zinc-700">
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
