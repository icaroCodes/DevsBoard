import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, ChevronDown, FolderKanban, X, Layout, Target, HelpCircle, Users, ListFilter, Monitor, Loader2, Image, Figma, Upload, ExternalLink, Link } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmModalContext';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeSubscription } from '../contexts/RealtimeContext';
import { useTranslation } from '../utils/translations';

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
  const { t } = useTranslation();

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
          className={`flex flex-col items-center justify-center gap-2 py-8 rounded-[16px] border-2 border-dashed cursor-pointer transition-all ${dragOver ? 'border-[#0A84FF] bg-[#0A84FF]/10' : 'border-white/[0.08] hover:border-white/20 bg-[#2C2C2E]/50 hover:bg-[#2C2C2E]'}`}
        >
          <Upload size={24} className="text-[#86868B]" strokeWidth={1.5} />
          <span className="text-[13px] text-[#86868B]">{t.projUploadHint}</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ''; }} />
    </div>
  );
}

// Compact image upload for extra images / reference images
function CompactImageUpload({ value, onChange, onRemove }) {
  const inputRef = useRef(null);
  const { t } = useTranslation();

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <div>
      {value ? (
        <div className="relative group rounded-[12px] overflow-hidden border border-white/[0.08] bg-[#2C2C2E]">
          <img src={value} alt="" className="w-full h-[120px] object-contain bg-[#1A1A1C] p-2" />
          <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button type="button" onClick={() => inputRef.current?.click()}
              className="p-1 rounded-[6px] bg-black/60 text-white/80 hover:text-white hover:bg-black/80 transition-colors outline-none cursor-pointer">
              <Pencil size={11} />
            </button>
            <button type="button" onClick={onRemove}
              className="p-1 rounded-[6px] bg-black/60 text-white/80 hover:text-[#FF453A] hover:bg-black/80 transition-colors outline-none cursor-pointer">
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center gap-2 py-4 rounded-[12px] border-2 border-dashed border-white/[0.08] hover:border-white/20 bg-[#2C2C2E]/50 hover:bg-[#2C2C2E] cursor-pointer transition-all"
        >
          <Upload size={16} className="text-[#86868B]" strokeWidth={1.5} />
          <span className="text-[12px] text-[#86868B]">{t.projUploadHint}</span>
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

  // Extra images: { id (existing), title, url (existing), preview (new base64) }
  const [extraImages, setExtraImages] = useState([]);
  // Removed existing image IDs
  const [removedImageIds, setRemovedImageIds] = useState([]);

  // References: { id (existing), title, url, imageUrl (existing), imagePreview (new base64) }
  const [references, setReferences] = useState([]);
  const [removedRefIds, setRemovedRefIds] = useState([]);

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
  const { t } = useTranslation();
  const [lightbox, setLightbox] = useState(null);

  const load = () => {
    api('/projects').then(setItems).catch(err => error(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [activeTeam]);
  useRealtimeSubscription(['projects'], () => { load(); });

  const resetForm = () => {
    setForm({ name: '', concept: '', objective: '', problem: '', target_audience: '', initial_scope: '', functional_requirements: '', interface_requirements: '', submitting: false });
    setLogoPreview(null);
    setFigmaPreview(null);
    setExtraImages([]);
    setRemovedImageIds([]);
    setReferences([]);
    setRemovedRefIds([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.submitting) return;
    setForm(prev => ({ ...prev, submitting: true }));
    try {
      const payload = { ...form };
      delete payload.submitting;

      if (logoPreview && logoPreview.startsWith('data:')) payload.logo_base64 = logoPreview;
      if (figmaPreview && figmaPreview.startsWith('data:')) payload.figma_base64 = figmaPreview;

      let projectId;
      if (editing) {
        if (!logoPreview && !editing.logo_url) payload.logo_url = null;
        if (!figmaPreview && !editing.figma_url) payload.figma_url = null;
        await api(`/projects/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        projectId = editing.id;
      } else {
        const created = await api('/projects', { method: 'POST', body: JSON.stringify(payload) });
        projectId = created.id;
      }

      // Delete removed images
      await Promise.all(removedImageIds.map(imgId =>
        api(`/projects/${projectId}/images/${imgId}`, { method: 'DELETE' })
      ));

      // Delete removed references
      await Promise.all(removedRefIds.map(refId =>
        api(`/projects/${projectId}/references/${refId}`, { method: 'DELETE' })
      ));

      // Upload new extra images
      await Promise.all(
        extraImages
          .filter(img => !img.id && img.preview)
          .map(img =>
            api(`/projects/${projectId}/images`, {
              method: 'POST',
              body: JSON.stringify({ title: img.title, image_base64: img.preview }),
            })
          )
      );

      // Upload new references
      await Promise.all(
        references
          .filter(ref => !ref.id)
          .map(ref =>
            api(`/projects/${projectId}/references`, {
              method: 'POST',
              body: JSON.stringify({ title: ref.title, url: ref.url || null, image_base64: ref.imagePreview || null }),
            })
          )
      );

      setModalOpen(false);
      setEditing(null);
      resetForm();
<<<<<<< HEAD
      success(editing ? 'Legal, as informações do projeto foram salvas!' : 'Muito bom! Seu novo projeto foi iniciado.');
=======
      success(editing ? t.projUpdated : t.projCreated);
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
      load();
    } catch (err) {
      error(err.message);
      setForm(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleDelete = async (id) => {
    confirm({
<<<<<<< HEAD
      title: 'Apagar este projeto inteiro?',
      message: 'Você tem certeza? Tudo o que você planejou aqui será apagado para sempre.',
=======
      title: t.projDelConfirm,
      message: t.projDelText,
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
      onConfirm: async () => {
        try {
          await api(`/projects/${id}`, { method: 'DELETE' });
          success(t.projDeleted);
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
    // Load existing extra images
    setExtraImages((p.project_images || []).map(img => ({
      id: img.id, title: img.title, url: img.image_url, preview: null,
    })));
    setRemovedImageIds([]);
    // Load existing references
    setReferences((p.project_references || []).map(ref => ({
      id: ref.id, title: ref.title, url: ref.url || '', imageUrl: ref.image_url, imagePreview: null,
    })));
    setRemovedRefIds([]);
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

  // Extra images handlers
  const addExtraImage = () => setExtraImages(prev => [...prev, { id: null, title: '', preview: null, url: null }]);

  const updateExtraImage = (idx, patch) => setExtraImages(prev => prev.map((img, i) => i === idx ? { ...img, ...patch } : img));

  const removeExtraImage = (idx) => {
    const img = extraImages[idx];
    if (img.id) setRemovedImageIds(prev => [...prev, img.id]);
    setExtraImages(prev => prev.filter((_, i) => i !== idx));
  };

  // References handlers
  const addReference = () => setReferences(prev => [...prev, { id: null, title: '', url: '', imageUrl: null, imagePreview: null }]);

  const updateReference = (idx, patch) => setReferences(prev => prev.map((ref, i) => i === idx ? { ...ref, ...patch } : ref));

  const removeReference = (idx) => {
    const ref = references[idx];
    if (ref.id) setRemovedRefIds(prev => [...prev, ref.id]);
    setReferences(prev => prev.filter((_, i) => i !== idx));
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
      style={{ fontFamily: FONT }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
<<<<<<< HEAD
          <h1 className="text-[32px] md:text-[40px] leading-tight font-semibold text-[#F5F5F7] tracking-tight">Meus Projetos</h1>
          <p className="text-[17px] text-[#86868B] mt-1">Organize coisas maiores, como uma reforma ou uma viagem longa.</p>
=======
          <h1 className="text-[32px] md:text-[40px] leading-tight font-semibold text-[#F5F5F7] tracking-tight">{t.projTitle}</h1>
          <p className="text-[17px] text-[#86868B] mt-1">{t.projSubtitle}</p>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
        </div>
        <button
          onClick={openNew}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#0A84FF] text-white font-medium hover:bg-[#007AFF] transition-all focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/50 shadow-sm outline-none"
        >
<<<<<<< HEAD
          <Plus size={18} strokeWidth={2.5} /> Criar Novo Projeto
=======
          <Plus size={18} strokeWidth={2.5} /> {t.projNewBtn}
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
        </button>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-2 border-[#0A84FF] border-t-transparent rounded-full"
          />
          <p className="text-[14px] text-[#86868B] font-medium tracking-wide">{t.projLoading}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#1C1C1E] rounded-[24px] border border-white/[0.04]">
              <FolderKanban size={48} className="text-[#86868B] mb-4 opacity-50" strokeWidth={1.5} />
<<<<<<< HEAD
              <p className="text-[17px] font-medium text-[#F5F5F7]">Você ainda não criou nenhum projeto.</p>
              <p className="text-[14px] text-[#86868B] mt-2 text-center max-w-xs">Aqui você pode planejar as etapas de algo grande que queira fazer.</p>
=======
              <p className="text-[17px] font-medium text-[#F5F5F7]">{t.projEmpty}</p>
              <p className="text-[14px] text-[#86868B] mt-2 text-center max-w-xs">{t.projEmptySubtitle}</p>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
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
<<<<<<< HEAD
                      <p className="text-[13px] text-[#86868B] mt-0.5">Tudo organizado aqui</p>
=======
                      <p className="text-[13px] text-[#86868B] mt-0.5">{t.projDetailed}</p>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
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
                        {/* Logo + Figma */}
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
<<<<<<< HEAD
                                    <p className="text-[11px] font-bold uppercase tracking-[0.1em]">Foto ou Símbolo</p>
                                  </div>
                                  <h4 className="text-[18px] font-semibold text-[#F5F5F7]">Imagem do Projeto</h4>
                                  <p className="text-[14px] text-[#86868B]">A representação visual central e o DNA da marca.</p>
=======
                                    <p className="text-[11px] font-bold uppercase tracking-[0.1em]">{t.projBrandSection}</p>
                                  </div>
                                  <h4 className="text-[18px] font-semibold text-[#F5F5F7]">{t.projLogoTitle}</h4>
                                  <p className="text-[14px] text-[#86868B]">{t.projLogoDesc}</p>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
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
<<<<<<< HEAD
                                  <p className="text-[11px] font-bold uppercase tracking-[0.1em]">Desenhos ou Fotos extras</p>
=======
                                  <p className="text-[11px] font-bold uppercase tracking-[0.1em]">{t.projInterfaceSection}</p>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
                                </div>
                                <div
                                  className="rounded-[24px] overflow-hidden border border-white/[0.08] bg-[#1A1A1C] shadow-2xl cursor-pointer hover:border-white/20 hover:bg-[#212124] transition-all group relative aspect-video"
                                  onClick={() => setLightbox(p.figma_url)}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6 z-10">
                                    <div className="flex items-center gap-2 text-white">
                                      <Layout size={18} />
                                      <span className="font-medium">{t.projViewFull}</span>
                                    </div>
                                  </div>
                                  <img src={p.figma_url} alt="Figma Screen" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                                </div>
                              </motion.div>
                            )}
                          </div>
                        )}

                        {/* Extra Images Grid */}
                        {p.project_images && p.project_images.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[#86868B] ml-1">
                              <Image size={14} className="opacity-60" />
                              <p className="text-[11px] font-bold uppercase tracking-[0.1em]">{t.projExtraImagesSection}</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {p.project_images.map((img) => (
                                <div
                                  key={img.id}
                                  className="group cursor-pointer rounded-[16px] overflow-hidden border border-white/[0.08] bg-[#1A1A1C] hover:border-white/20 transition-all"
                                  onClick={() => setLightbox(img.image_url)}
                                >
                                  <div className="aspect-video relative">
                                    <img src={img.image_url} alt={img.title} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <div className="px-3 py-2">
                                    <p className="text-[12px] font-medium text-[#F5F5F7] truncate">{img.title}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* References */}
                        {p.project_references && p.project_references.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[#86868B] ml-1">
                              <Link size={14} className="opacity-60" />
                              <p className="text-[11px] font-bold uppercase tracking-[0.1em]">{t.projRefsSection}</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {p.project_references.map((ref) => (
                                <div
                                  key={ref.id}
                                  className="rounded-[16px] border border-white/[0.08] bg-[#1A1A1C] overflow-hidden hover:border-white/20 transition-all"
                                >
                                  {ref.image_url && (
                                    <div
                                      className="cursor-pointer group relative"
                                      onClick={() => setLightbox(ref.image_url)}
                                    >
                                      <img src={ref.image_url} alt={ref.title} className="w-full h-[120px] object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  )}
                                  <div className="px-3 py-2.5 flex items-center justify-between gap-2">
                                    <p className="text-[13px] font-medium text-[#F5F5F7] truncate">{ref.title}</p>
                                    {ref.url && (
                                      <a
                                        href={ref.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="shrink-0 p-1.5 rounded-[8px] text-[#86868B] hover:text-[#0A84FF] hover:bg-[#0A84FF]/10 transition-colors"
                                      >
                                        <ExternalLink size={13} />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Text fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {FIELDS.map(({ key, icon }) => (
                            p[key] && (
                              <div key={key} className="space-y-1.5">
                                <div className="flex items-center gap-2 text-[#86868B]">
                                  {icon}
                                  <p className="text-[12px] font-bold uppercase tracking-wider">{t.projFields[key]}</p>
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
<<<<<<< HEAD
                  {editing ? 'Mudar Projeto' : 'Novo Projeto'}
=======
                  {editing ? t.projEditTitle : t.projNewTitle}
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
                </h2>
                <button onClick={() => { setModalOpen(false); setEditing(null); resetForm(); }} className="p-2 text-[#86868B] hover:text-[#F5F5F7] rounded-full bg-white/[0.04] hover:bg-white/[0.08]">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-3 thin-scrollbar">
                {/* Name */}
                <div className="space-y-1.5">
<<<<<<< HEAD
                  <label className="text-[13px] font-medium text-[#86868B] ml-1 uppercase tracking-wider">Qual o nome desse projeto?</label>
=======
                  <label className="text-[13px] font-medium text-[#86868B] ml-1 uppercase tracking-wider">{t.projNameLabel}</label>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-[18px] bg-[#2C2C2E] border border-transparent text-[16px] text-[#F5F5F7] focus:border-[#0A84FF] focus:outline-none transition-all placeholder:text-[#86868B]/50"
                    placeholder={t.projNamePh}
                    required
                  />
                </div>

                {/* Logo + Figma */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageUploadField
<<<<<<< HEAD
                    label="Foto ou Símbolo"
=======
                    label={t.projLogoLabel}
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
                    icon={<Image size={14} />}
                    value={editing?.logo_url}
                    preview={logoPreview}
                    onChange={setLogoPreview}
                    onRemove={handleRemoveLogo}
                  />
                  <ImageUploadField
<<<<<<< HEAD
                    label="Outra imagem (opcional)"
=======
                    label={t.projFigmaLabel}
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
                    icon={<Figma size={14} />}
                    value={editing?.figma_url}
                    preview={figmaPreview}
                    onChange={setFigmaPreview}
                    onRemove={handleRemoveFigma}
                  />
                </div>

                {/* ── Extra Images ── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-medium text-[#86868B] ml-1 uppercase tracking-wider flex items-center gap-2">
                      <Image size={14} /> {t.projExtraImagesSection}
                    </label>
                    <button
                      type="button"
                      onClick={addExtraImage}
                      className="flex items-center gap-1.5 text-[12px] font-medium text-[#0A84FF] hover:text-[#007AFF] transition-colors px-3 py-1.5 rounded-full hover:bg-[#0A84FF]/10"
                    >
                      <Plus size={14} strokeWidth={2.5} /> {t.projExtraImagesAdd}
                    </button>
                  </div>

                  {extraImages.map((img, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-[18px] bg-[#2C2C2E]/60 border border-white/[0.06] space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={img.title}
                          onChange={(e) => updateExtraImage(idx, { title: e.target.value })}
                          placeholder={t.projExtraImageTitlePh}
                          className="flex-1 px-4 py-2.5 rounded-[12px] bg-[#1C1C1E] border border-transparent text-[14px] text-[#F5F5F7] focus:border-[#0A84FF] focus:outline-none placeholder:text-[#86868B]/40 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => removeExtraImage(idx)}
                          className="p-2 text-[#86868B] hover:text-[#FF453A] rounded-full hover:bg-[#FF453A]/10 transition-colors shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <CompactImageUpload
                        value={img.preview || img.url}
                        onChange={(base64) => updateExtraImage(idx, { preview: base64 })}
                        onRemove={() => updateExtraImage(idx, { preview: null, url: null })}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* ── References ── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-medium text-[#86868B] ml-1 uppercase tracking-wider flex items-center gap-2">
                      <Link size={14} /> {t.projRefsSection}
                    </label>
                    <button
                      type="button"
                      onClick={addReference}
                      className="flex items-center gap-1.5 text-[12px] font-medium text-[#0A84FF] hover:text-[#007AFF] transition-colors px-3 py-1.5 rounded-full hover:bg-[#0A84FF]/10"
                    >
                      <Plus size={14} strokeWidth={2.5} /> {t.projRefsAdd}
                    </button>
                  </div>

                  {references.map((ref, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-[18px] bg-[#2C2C2E]/60 border border-white/[0.06] space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={ref.title}
                          onChange={(e) => updateReference(idx, { title: e.target.value })}
                          placeholder={t.projRefTitlePh}
                          className="flex-1 px-4 py-2.5 rounded-[12px] bg-[#1C1C1E] border border-transparent text-[14px] text-[#F5F5F7] focus:border-[#0A84FF] focus:outline-none placeholder:text-[#86868B]/40 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => removeReference(idx)}
                          className="p-2 text-[#86868B] hover:text-[#FF453A] rounded-full hover:bg-[#FF453A]/10 transition-colors shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-[#1C1C1E] border border-transparent focus-within:border-[#0A84FF] transition-all">
                        <ExternalLink size={14} className="text-[#86868B] shrink-0" />
                        <input
                          type="url"
                          value={ref.url}
                          onChange={(e) => updateReference(idx, { url: e.target.value })}
                          placeholder={t.projRefUrlPh}
                          className="flex-1 bg-transparent text-[14px] text-[#F5F5F7] focus:outline-none placeholder:text-[#86868B]/40"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] text-[#86868B] ml-1 uppercase tracking-wider">{t.projRefImage}</p>
                        <CompactImageUpload
                          value={ref.imagePreview || ref.imageUrl}
                          onChange={(base64) => updateReference(idx, { imagePreview: base64 })}
                          onRemove={() => updateReference(idx, { imagePreview: null, imageUrl: null })}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Text fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FIELDS.map(({ key }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#86868B] ml-1 uppercase tracking-wider">{t.projFields[key]}</label>
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
<<<<<<< HEAD
                    ) : editing ? 'Pronto, salvar tudo' : 'Começar agora'}
=======
                    ) : editing ? t.projSaveBtn : t.projCreateBtn}
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
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
