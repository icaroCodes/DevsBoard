import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp, FolderKanban, X, Layout, Target, HelpCircle, Users, ListFilter, Monitor, Loader2, Image, Figma, Upload } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmModalContext';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeSubscription } from '../contexts/RealtimeContext';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const FIELDS = [
  { key: 'concept', label: 'O que é isso?', icon: <HelpCircle size={16} /> },
  { key: 'objective', label: 'Para que vou fazer?', icon: <Target size={16} /> },
  { key: 'problem', label: 'O que isso resolve?', icon: <X size={16} /> },
  { key: 'target_audience', label: 'Quem vai participar?', icon: <Users size={16} /> },
  { key: 'initial_scope', label: 'O que pretendo fazer primeiro?', icon: <Layout size={16} /> },
  { key: 'functional_requirements', label: 'O que precisa ter?', icon: <ListFilter size={16} /> },
  { key: 'interface_requirements', label: 'Como deve ser o visual?', icon: <Monitor size={16} /> },
];

function ImageUploadField({ label, icon, value, preview, onChange, onRemove }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  const displayUrl = preview || value;

  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-[#86868B] ml-1 uppercase tracking-wider flex items-center gap-2">
        {icon} {label}
      </label>
      {displayUrl ? (
        <div className="relative group rounded-[16px] overflow-hidden border border-white/[0.08] bg-[#2C2C2E]">
          <img src={displayUrl} alt={label} className="w-full h-[180px] object-contain bg-[#1A1A1C] p-2" />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
            <button type="button" onClick={() => inputRef.current?.click()}
              className="p-1.5 rounded-[8px] bg-black/60 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/80 transition-colors outline-none cursor-pointer">
              <Pencil size={13} />
            </button>
            <button type="button" onClick={onRemove}
              className="p-1.5 rounded-[8px] bg-black/60 backdrop-blur-sm text-white/80 hover:text-[#FF453A] hover:bg-black/80 transition-colors outline-none cursor-pointer">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 py-8 rounded-[16px] border-2 border-dashed cursor-pointer transition-all ${dragOver ? 'border-[#0A84FF] bg-[#0A84FF]/10' : 'border-white/[0.08] hover:border-white/20 bg-[#2C2C2E]/50 hover:bg-[#2C2C2E]'
            }`}
        >
          <Upload size={24} className="text-[#86868B]" strokeWidth={1.5} />
          <span className="text-[13px] text-[#86868B]">Escolha uma imagem aqui</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ''; }} />
    </div>
  );
}

export default function Projects() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  const [figmaPreview, setFigmaPreview] = useState(null);
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
  const { activeTeam } = useAuth();

  const load = () => {
    api('/projects').then(setItems).catch(err => error(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [activeTeam]);

  useRealtimeSubscription(['projects'], () => { load(); });

  const resetForm = () => {
    setForm({ name: '', concept: '', objective: '', problem: '', target_audience: '', initial_scope: '', functional_requirements: '', interface_requirements: '', submitting: false });
    setLogoPreview(null);
    setFigmaPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.submitting) return;
    setForm(prev => ({ ...prev, submitting: true }));
    try {
      const payload = { ...form };
      delete payload.submitting;

      // Attach base64 images if new ones were selected
      if (logoPreview) payload.logo_base64 = logoPreview;
      if (figmaPreview) payload.figma_base64 = figmaPreview;

      if (editing) {
        // If image was explicitly removed (preview is null, but existing had a url)
        if (!logoPreview && !editing.logo_url) payload.logo_url = null;
        if (!figmaPreview && !editing.figma_url) payload.figma_url = null;
        await api(`/projects/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/projects', { method: 'POST', body: JSON.stringify(payload) });
      }
      setModalOpen(false);
      setEditing(null);
      resetForm();
      success(editing ? 'Legal, as informações do projeto foram salvas!' : 'Muito bom! Seu novo projeto foi iniciado.');
      load();
    } catch (err) {
      error(err.message);
      setForm(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleDelete = async (id) => {
    confirm({
      title: 'Apagar este projeto inteiro?',
      message: 'Você tem certeza? Tudo o que você planejou aqui será apagado para sempre.',
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
    setLogoPreview(p.logo_url || null);
    setFigmaPreview(p.figma_url || null);
    setModalOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    resetForm();
    setModalOpen(true);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    if (editing) setEditing({ ...editing, logo_url: null });
  };

  const handleRemoveFigma = () => {
    setFigmaPreview(null);
    if (editing) setEditing({ ...editing, figma_url: null });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
  };

  // Lightbox state
  const [lightbox, setLightbox] = useState(null);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="max-w-4xl mx-auto pb-12 font-sans"
      style={{ fontFamily: FONT }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-[32px] md:text-[40px] leading-tight font-semibold text-[#F5F5F7] tracking-tight">Meus Projetos</h1>
          <p className="text-[17px] text-[#86868B] mt-1">Organize coisas maiores, como uma reforma ou uma viagem longa.</p>
        </div>

        <button
          onClick={openNew}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#0A84FF] text-white font-medium hover:bg-[#007AFF] transition-all focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/50 shadow-sm outline-none"
        >
          <Plus size={18} strokeWidth={2.5} /> Criar Novo Projeto
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
              <p className="text-[17px] font-medium text-[#F5F5F7]">Você ainda não criou nenhum projeto.</p>
              <p className="text-[14px] text-[#86868B] mt-2 text-center max-w-xs">Aqui você pode planejar as etapas de algo grande que queira fazer.</p>
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
                    {p.logo_url ? (
                      <div className="w-12 h-12 rounded-[14px] overflow-hidden bg-white/5 flex items-center justify-center shrink-0 border border-white/[0.08] shadow-sm ring-4 ring-white/[0.02]">
                        <img src={p.logo_url} alt="Logo" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-[14px] bg-white/5 flex items-center justify-center text-[#8E9C78] border border-white/[0.08] shadow-sm">
                        <FolderKanban size={24} />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-[18px] text-[#F5F5F7] tracking-tight">{p.name}</p>
                      <p className="text-[13px] text-[#86868B] mt-0.5">Tudo organizado aqui</p>
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
                      <div className="p-6 space-y-8">
                        {/* Immersive Assets Section */}
                        {(p.logo_url || p.figma_url) && (
                          <div className="flex flex-col gap-6 p-1">
                            {p.logo_url && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/[0.04]"
                              >
                                <div
                                  className="w-24 h-24 rounded-[20px] overflow-hidden border border-white/[0.08] bg-[#1A1A1C] shadow-2xl cursor-pointer hover:border-white/20 transition-all flex items-center justify-center p-2 group"
                                  onClick={() => setLightbox(p.logo_url)}
                                >
                                  <img src={p.logo_url} alt="Logo" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <div className="space-y-1 text-center sm:text-left">
                                  <div className="flex items-center justify-center sm:justify-start gap-2 text-[#86868B] mb-1">
                                    <Image size={14} className="opacity-60" />
                                    <p className="text-[11px] font-bold uppercase tracking-[0.1em]">Foto ou Símbolo</p>
                                  </div>
                                  <h4 className="text-[18px] font-semibold text-[#F5F5F7]">Imagem do Projeto</h4>
                                  <p className="text-[14px] text-[#86868B]">A representação visual central e o DNA da marca.</p>
                                </div>
                              </motion.div>
                            )}

                            {p.figma_url && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-3"
                              >
                                <div className="flex items-center gap-2 text-[#86868B] ml-1">
                                  <Figma size={14} className="opacity-60" />
                                  <p className="text-[11px] font-bold uppercase tracking-[0.1em]">Desenhos ou Fotos extras</p>
                                </div>
                                <div
                                  className="rounded-[24px] overflow-hidden border border-white/[0.08] bg-[#1A1A1C] shadow-2xl cursor-pointer hover:border-white/20 hover:bg-[#212124] transition-all group relative aspect-video"
                                  onClick={() => setLightbox(p.figma_url)}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6 z-10">
                                    <div className="flex items-center gap-2 text-white">
                                      <Layout size={18} />
                                      <span className="font-medium">Abrir visualização completa</span>
                                    </div>
                                  </div>
                                  <img src={p.figma_url} alt="Figma Screen" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                                </div>
                              </motion.div>
                            )}
                          </div>
                        )}

                        {/* Text fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  {editing ? 'Mudar Projeto' : 'Novo Projeto'}
                </h2>
                <button onClick={() => { setModalOpen(false); setEditing(null); resetForm(); }} className="p-2 text-[#86868B] hover:text-[#F5F5F7] rounded-full bg-white/[0.04] hover:bg-white/[0.08]">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-3 thin-scrollbar">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#86868B] ml-1 uppercase tracking-wider">Qual o nome desse projeto?</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-[18px] bg-[#2C2C2E] border border-transparent text-[16px] text-[#F5F5F7] focus:border-[#0A84FF] focus:outline-none transition-all placeholder:text-[#86868B]/50"
                    placeholder="Ex: Meu SaaS, Aplicativo de Dieta..."
                    required
                  />
                </div>

                {/* Image upload fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageUploadField
                    label="Foto ou Símbolo"
                    icon={<Image size={14} />}
                    value={editing?.logo_url}
                    preview={logoPreview}
                    onChange={setLogoPreview}
                    onRemove={handleRemoveLogo}
                  />
                  <ImageUploadField
                    label="Outra imagem (opcional)"
                    icon={<Figma size={14} />}
                    value={editing?.figma_url}
                    preview={figmaPreview}
                    onChange={setFigmaPreview}
                    onRemove={handleRemoveFigma}
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
                        <span>Salvando tudo...</span>
                      </>
                    ) : editing ? 'Pronto, salvar tudo' : 'Começar agora'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox for full-size image view */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[60] p-8 cursor-pointer"
            onClick={() => setLightbox(null)}
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={lightbox}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-[16px] shadow-2xl"
            />
            <button className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
