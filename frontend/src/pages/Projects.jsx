import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../lib/api';

const FIELDS = [
  { key: 'concept', label: 'Conceito' },
  { key: 'objective', label: 'Objetivo' },
  { key: 'problem', label: 'Problema que resolve' },
  { key: 'target_audience', label: 'Público-alvo' },
  { key: 'initial_scope', label: 'Escopo inicial' },
  { key: 'functional_requirements', label: 'Requisitos funcionais' },
  { key: 'interface_requirements', label: 'Requisitos de interface' },
];

export default function Projects() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [form, setForm] = useState({
    name: '',
    concept: '',
    objective: '',
    problem: '',
    target_audience: '',
    initial_scope: '',
    functional_requirements: '',
    interface_requirements: '',
  });

  const load = () => api('/projects').then(setItems).catch(console.error).finally(() => setLoading(false));

  useEffect(() => load(), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api(`/projects/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await api('/projects', { method: 'POST', body: JSON.stringify(form) });
      }
      setModalOpen(false);
      setEditing(null);
      setForm({ name: '', concept: '', objective: '', problem: '', target_audience: '', initial_scope: '', functional_requirements: '', interface_requirements: '' });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir este projeto?')) return;
    try {
      await api(`/projects/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      concept: p.concept || '',
      objective: p.objective || '',
      problem: p.problem || '',
      target_audience: p.target_audience || '',
      initial_scope: p.initial_scope || '',
      functional_requirements: p.functional_requirements || '',
      interface_requirements: p.interface_requirements || '',
    });
    setModalOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Projetos</h1>
        <button
          onClick={() => { setEditing(null); setForm({ name: '', concept: '', objective: '', problem: '', target_audience: '', initial_scope: '', functional_requirements: '', interface_requirements: '' }); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-zinc-950 font-medium hover:bg-cyan-400"
        >
          <Plus size={20} /> Novo projeto
        </button>
      </div>

      {loading ? (
        <div className="h-48 bg-zinc-800 rounded-xl animate-pulse" />
      ) : (
        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="text-zinc-500 text-center py-12">Nenhum projeto</p>
          ) : (
            items.map((p) => (
              <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div
                  className="flex justify-between items-center p-4 cursor-pointer"
                  onClick={() => setExpanded({ ...expanded, [p.id]: !expanded[p.id] })}
                >
                  <div className="flex items-center gap-3">
                    {expanded[p.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    <p className="font-medium">{p.name}</p>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEdit(p)} className="p-1 text-zinc-400 hover:text-cyan-400">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1 text-zinc-400 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {expanded[p.id] && (
                  <div className="border-t border-zinc-800 p-4 space-y-3 text-sm">
                    {FIELDS.map(({ key, label }) => (
                      p[key] && (
                        <div key={key}>
                          <p className="text-zinc-500 mb-1">{label}</p>
                          <p className="text-zinc-300 whitespace-pre-wrap">{p[key]}</p>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-2xl my-8"
          >
            <h2 className="text-xl font-bold mb-4">{editing ? 'Editar' : 'Novo'} projeto</h2>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
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
              {FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm text-zinc-400 mb-1">{label}</label>
                  <textarea
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700"
                    rows={2}
                  />
                </div>
              ))}
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
