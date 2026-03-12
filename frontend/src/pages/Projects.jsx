import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp, FolderKanban, X, Layout, Target, HelpCircle, Users, ListFilter, Monitor, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmModalContext';

const FIELDS = [
  { key: 'concept', label: 'Conceito', icon: <HelpCircle size={16} /> },
  { key: 'objective', label: 'Objetivo', icon: <Target size={16} /> },
  { key: 'problem', label: 'Problema que resolve', icon: <X size={16} /> },
  { key: 'target_audience', label: 'Público-alvo', icon: <Users size={16} /> },
  { key: 'initial_scope', label: 'Escopo inicial', icon: <Layout size={16} /> },
  { key: 'functional_requirements', label: 'Requisitos funcionais', icon: <ListFilter size={16} /> },
  { key: 'interface_requirements', label: 'Requisitos de interface', icon: <Monitor size={16} /> },
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
    submitting: false,
  });
  const { success, error } = useToast();
  const { confirm } = useConfirm();

  const load = () => {
    api('/projects').then(setItems).catch(err => error(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.submitting) return;
    setForm(prev => ({ ...prev, submitting: true }));
    try {
      const payload = { ...form };
      delete payload.submitting;

      if (editing) {
        await api(`/projects/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/projects', { method: 'POST', body: JSON.stringify(payload) });
      }
      setModalOpen(false);
      setEditing(null);
      setForm({ name: '', concept: '', objective: '', problem: '', target_audience: '', initial_scope: '', functional_requirements: '', interface_requirements: '', submitting: false });
      success(editing ? 'Projeto atualizado!' : 'Projeto criou!');
      load();
    } catch (err) {
      error(err.message);
      setForm(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleDelete = async (id) => {
    confirm({
      title: 'Excluir projeto?',
      message: 'Tem certeza que deseja excluir este projeto e todo o seu planejamento?',
      onConfirm: async () => {
        try {
          await api(`/projects/${id}`, { method: 'DELETE' });
          success('Projeto excluído!');
          load();
        } catch (err) {
          error(err.message);
        }
      }
    });
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
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="max-w-4xl mx-auto pb-12 font-sans"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-[32px] md:text-[40px] leading-tight font-semibold text-[#F5F5F7] tracking-tight">Projetos</h1>
          <p className="text-[17px] text-[#86868B] mt-1">Planeje e visualize suas grandes ideias</p>
        </div>

        <button
          onClick={() => { setEditing(null); setForm({ name: '', concept: '', objective: '', problem: '', target_audience: '', initial_scope: '', functional_requirements: '', interface_requirements: '' }); setModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#0A84FF] text-white font-medium hover:bg-[#007AFF] transition-all focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/50 shadow-sm outline-none"
        >
          <Plus size={18} strokeWidth={2.5} /> Novo Projeto
        </button>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-2 border-[#0A84FF] border-t-transparent rounded-full"
          />
          <p className="text-[14px] text-[#86868B] font-medium tracking-wide">Carregando projetos...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#1C1C1E] rounded-[24px] border border-white/[0.04]">
              <FolderKanban size={48} className="text-[#86868B] mb-4 opacity-50" strokeWidth={1.5} />
              <p className="text-[17px] font-medium text-[#F5F5F7]">Nenhum projeto no radar</p>
              <p className="text-[14px] text-[#86868B] mt-2 text-center max-w-xs">Organize seus recursos e requisitos em um só lugar.</p>
            </div>
          ) : (
            items.map((p) => (
              <motion.div
                key={p.id}
                variants={itemVariants}
                className="bg-[#1C1C1E] border border-white/[0.04] rounded-[24px] overflow-hidden shadow-sm hover:border-white/10 transition-all duration-300 group"
              >
                <div
                  className="flex justify-between items-center p-6 cursor-pointer select-none"
                  onClick={() => setExpanded({ ...expanded, [p.id]: !expanded[p.id] })}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#8E9C78]">
                      <FolderKanban size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-[18px] text-[#F5F5F7] tracking-tight">{p.name}</p>
                      <p className="text-[13px] text-[#86868B] mt-0.5">Planejamento detalhado</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEdit(p)} className="p-2 text-[#86868B] hover:text-[#0A84FF] rounded-full hover:bg-[#0A84FF]/10 transition-colors">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-[#86868B] hover:text-[#FF453A] rounded-full hover:bg-[#FF453A]/10 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <motion.div
                      animate={{ rotate: expanded[p.id] ? 180 : 0 }}
                      className="text-[#86868B]"
                    >
                      <ChevronDown size={20} />
                    </motion.div>
                  </div>
                </div>

                <AnimatePresence>
                  {expanded[p.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="border-t border-white/[0.04] bg-[#161618]/50"
                    >
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {FIELDS.map(({ key, label, icon }) => (
                          p[key] && (
                            <div key={key} className="space-y-1.5">
                              <div className="flex items-center gap-2 text-[#86868B]">
                                {icon}
                                <p className="text-[12px] font-bold uppercase tracking-wider">{label}</p>
                              </div>
                              <p className="text-[15px] text-[#F5F5F7] leading-relaxed whitespace-pre-wrap pl-1">{p[key]}</p>
                            </div>
                          )
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#1C1C1E] border border-white/[0.08] rounded-[32px] p-7 w-full max-w-2xl my-8 shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[20px] font-semibold text-[#F5F5F7] tracking-tight">
                  {editing ? 'Editar Projeto' : 'Novo Projeto'}
                </h2>
                <button onClick={() => { setModalOpen(false); setEditing(null); }} className="p-2 text-[#86868B] hover:text-[#F5F5F7] rounded-full bg-white/[0.04] hover:bg-white/[0.08]">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-3 thin-scrollbar">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#86868B] ml-1 uppercase tracking-wider">Nome do Projeto</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-[18px] bg-[#2C2C2E] border border-transparent text-[16px] text-[#F5F5F7] focus:border-[#0A84FF] focus:outline-none transition-all placeholder:text-[#86868B]/50"
                    placeholder="Ex: Meu SaaS, Aplicativo de Dieta..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FIELDS.map(({ key, label }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#86868B] ml-1 uppercase tracking-wider">{label}</label>
                      <textarea
                        value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="w-full px-4 py-3 rounded-[16px] bg-[#2C2C2E] border border-transparent text-[14px] text-[#F5F5F7] focus:border-[#0A84FF] focus:outline-none transition-all placeholder:text-[#86868B]/30 resize-none"
                        rows={3}
                        placeholder="..."
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4 sticky bottom-0 bg-[#1C1C1E] pb-2">
                  <button
                    type="submit"
                    disabled={form.submitting}
                    className="w-full py-4 rounded-[20px] bg-[#0A84FF] text-white text-[16px] font-semibold hover:bg-[#007AFF] transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-[#0A84FF]/20 flex items-center justify-center gap-2"
                  >
                    {form.submitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : editing ? 'Salvar Planejamento' : 'Iniciar Projeto'}
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
