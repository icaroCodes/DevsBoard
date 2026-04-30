import { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, FolderKanban, Upload, Search, MoreHorizontal } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmModalContext';
import LoadingSkeleton from '../components/LoadingSkeleton';

const COLORS = ['#0A84FF', '#FF9F0A', '#30D158', '#BF5AF2', '#FF375F', '#5E5CE6', '#64D2FF', '#FFD60A'];

function ProjectModal({ initial, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    color: initial?.color || COLORS[0],
    logo_base64: null,
    logo_url: initial?.logo_url || null,
  });
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file?.type.startsWith('image/')) return;
    const r = new FileReader();
    r.onload = (e) => setForm(f => ({ ...f, logo_base64: e.target.result, logo_url: e.target.result }));
    r.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description,
        color: form.color,
        ...(form.logo_base64 ? { logo_base64: form.logo_base64 } : {}),
      });
      onClose();
    } finally { setSubmitting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}>
      <motion.form onSubmit={submit} onClick={e => e.stopPropagation()}
        initial={{ scale: 0.97, y: 12, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.97, y: 8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="w-full max-w-[440px] bg-[#161618] border border-white/[0.06] rounded-[18px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 className="text-[15px] font-semibold text-[#F5F5F7] tracking-tight">
            {initial ? 'Editar projeto' : 'Novo projeto'}
          </h2>
          <button type="button" onClick={onClose}
            className="text-[#86868B] hover:text-white p-1 -mr-1 rounded-md hover:bg-white/5 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pb-5 space-y-5">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-14 h-14 rounded-[12px] flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:scale-[1.03]"
              style={{ background: form.logo_url ? 'transparent' : form.color }}>
              {form.logo_url
                ? <img src={form.logo_url} alt="" className="w-full h-full object-cover" />
                : <Upload size={18} className="text-white/90" strokeWidth={1.8} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            <div className="flex-1">
              <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#6E6E73] mb-2">Cor de destaque</div>
              <div className="flex gap-1.5">
                {COLORS.map(c => (
                  <button type="button" key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={`w-5 h-5 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white/90 ring-offset-2 ring-offset-[#161618]' : 'hover:scale-110'}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#86868B]">Nome</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              autoFocus placeholder="Nome do projeto"
              className="w-full px-3 py-2.5 bg-[#0E0E10] border border-white/[0.06] rounded-[10px] text-[14px] text-[#F5F5F7] placeholder-[#48484A] outline-none transition-colors focus:border-white/20" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#86868B]">Descrição <span className="text-[#48484A]">(opcional)</span></label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              placeholder="Sobre o que é este projeto?"
              className="w-full px-3 py-2.5 bg-[#0E0E10] border border-white/[0.06] rounded-[10px] text-[14px] text-[#F5F5F7] placeholder-[#48484A] outline-none resize-none transition-colors focus:border-white/20" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-3.5 bg-[#0E0E10]/60 border-t border-white/[0.04]">
          <button type="button" onClick={onClose}
            className="px-3.5 py-1.5 text-[13px] font-medium text-[#A1A1AA] hover:text-white transition-colors rounded-[8px]">
            Cancelar
          </button>
          <button type="submit" disabled={submitting || !form.name.trim()}
            className="px-3.5 py-1.5 text-[13px] font-semibold bg-white text-black rounded-[8px] hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            {submitting ? 'Salvando…' : initial ? 'Salvar' : 'Criar projeto'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function ProjectCard({ project, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const accent = project.color || '#0A84FF';

  return (
    <motion.div layout
      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="group relative">
      <Link to={`/projects/${project.id}`}
        className="block relative rounded-[14px] bg-[#141416] border border-white/[0.05] hover:border-white/[0.1] hover:bg-[#181819] transition-all duration-200 overflow-hidden">
        {/* Subtle accent line on top */}
        <div className="h-[2px] w-full opacity-70" style={{ background: accent }} />

        <div className="p-5">
          <div className="flex items-start gap-3.5 mb-4">
            {project.logo_url ? (
              <img src={project.logo_url} alt={project.name}
                className="w-10 h-10 rounded-[9px] object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-[9px] flex items-center justify-center shrink-0"
                style={{ background: `${accent}1f`, color: accent }}>
                <FolderKanban size={18} strokeWidth={1.8} />
              </div>
            )}
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="text-[14.5px] font-semibold text-[#F5F5F7] tracking-tight truncate">
                {project.name}
              </h3>
              <p className="text-[12px] text-[#86868B] mt-0.5">
                {new Date(project.updated_at || project.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </p>
            </div>
          </div>

          <p className="text-[13px] text-[#86868B] leading-relaxed line-clamp-2 min-h-[36px]">
            {project.description || <span className="text-[#48484A]">Sem descrição</span>}
          </p>
        </div>
      </Link>

      {/* Actions menu */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(v => !v); }}
          className="p-1.5 rounded-[7px] bg-[#1C1C1E]/90 backdrop-blur border border-white/10 text-[#A1A1AA] hover:text-white hover:bg-[#2C2C2E] transition-colors">
          <MoreHorizontal size={14} />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={(e) => { e.preventDefault(); setMenuOpen(false); }} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 mt-1.5 z-20 w-36 bg-[#1C1C1E] border border-white/[0.08] rounded-[10px] shadow-[0_12px_32px_rgba(0,0,0,0.5)] py-1 overflow-hidden">
                <button onClick={(e) => { e.preventDefault(); setMenuOpen(false); onEdit(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12.5px] text-[#F5F5F7] hover:bg-white/5 transition-colors">
                  <Pencil size={12} className="text-[#86868B]" /> Editar
                </button>
                <button onClick={(e) => { e.preventDefault(); setMenuOpen(false); onDelete(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12.5px] text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors">
                  <Trash2 size={12} /> Excluir
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function Projects() {
  const { projects, loading, create, update, remove } = useProjects();
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirm();
  const [modal, setModal] = useState(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  }, [projects, query]);

  const handleCreate = async (payload) => {
    try { await create(payload); showSuccess('Projeto criado'); }
    catch (e) { showError(e.message); throw e; }
  };
  const handleUpdate = async (payload) => {
    try { await update(modal.project.id, payload); showSuccess('Projeto atualizado'); }
    catch (e) { showError(e.message); throw e; }
  };
  const handleDelete = async (p) => {
    const ok = await confirm({ title: 'Excluir projeto?', message: `"${p.name}" e todos seus dados serão removidos.`, confirmText: 'Excluir', danger: true });
    if (!ok) return;
    try { await remove(p.id); showSuccess('Projeto excluído'); }
    catch (e) { showError(e.message); }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="max-w-6xl mx-auto px-1">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-end justify-between gap-6 mb-1">
          <div>
            <h1 className="text-[32px] font-semibold text-[#F5F5F7] tracking-[-0.02em] leading-none">
              Projetos
            </h1>
            <p className="text-[13.5px] text-[#86868B] mt-2.5">
              {projects.length === 0
                ? 'Nenhum projeto ainda. Crie o primeiro para começar.'
                : `${projects.length} ${projects.length === 1 ? 'projeto' : 'projetos'}`}
            </p>
          </div>

          <button onClick={() => setModal({ mode: 'create' })}
            className="shrink-0 flex items-center gap-1.5 h-9 px-3.5 bg-white text-black text-[13px] font-semibold rounded-[9px] hover:bg-white/90 transition-colors shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_8px_24px_-12px_rgba(0,0,0,0.6)]">
            <Plus size={15} strokeWidth={2.2} />
            Novo projeto
          </button>
        </div>
      </div>

      {/* Search */}
      {projects.length > 0 && (
        <div className="relative mb-6 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar projetos…"
            className="w-full pl-9 pr-3 h-9 bg-[#141416] border border-white/[0.05] rounded-[9px] text-[13px] text-[#F5F5F7] placeholder-[#48484A] outline-none transition-colors focus:border-white/15 focus:bg-[#181819]" />
        </div>
      )}

      {/* Grid */}
      {projects.length === 0 ? (
        <motion.button onClick={() => setModal({ mode: 'create' })}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="w-full max-w-md mx-auto block mt-16 p-12 rounded-[16px] border border-dashed border-white/[0.08] hover:border-white/15 bg-[#0E0E10]/40 hover:bg-[#141416] transition-all text-center group">
          <div className="w-12 h-12 mx-auto mb-4 rounded-[12px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.06] transition-colors">
            <Plus size={20} className="text-[#86868B] group-hover:text-white transition-colors" strokeWidth={1.8} />
          </div>
          <div className="text-[14.5px] font-semibold text-[#F5F5F7] mb-1">Criar primeiro projeto</div>
          <div className="text-[12.5px] text-[#86868B]">Organize tarefas, docs e assets em um só lugar.</div>
        </motion.button>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-[13px] text-[#86868B]">
          Nenhum projeto encontrado para "{query}".
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}>
          {filtered.map(p => (
            <ProjectCard key={p.id} project={p}
              onEdit={() => setModal({ mode: 'edit', project: p })}
              onDelete={() => handleDelete(p)} />
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {modal && (
          <ProjectModal
            initial={modal.mode === 'edit' ? modal.project : null}
            onClose={() => setModal(null)}
            onSubmit={modal.mode === 'edit' ? handleUpdate : handleCreate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
