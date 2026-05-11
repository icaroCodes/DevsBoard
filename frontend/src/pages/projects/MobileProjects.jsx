import { useMemo, useRef, useState } from'react';
import { Link } from'react-router-dom';
import { motion, AnimatePresence } from'framer-motion';
import {
 Plus,
 Pencil,
 Trash2,
 FolderKanban,
 Search,
 Upload,
 X,
 MoreHorizontal,
} from'lucide-react';
import Sheet from'../../components/mobile/Sheet';
import { useRegisterMobileFab } from'../../contexts/MobileFabContext';

const COLORS = [
'#0A84FF',
'#FF9F0A',
'#30D158',
'#BF5AF2',
'#FF375F',
'#5E5CE6',
'#64D2FF',
'#FFD60A',
];

const fadeUp = {
 hidden: { opacity: 0, y: 12 },
 show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
 hidden: { opacity: 0 },
 show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
};

function MobileProjectFormSheet({ open, initial, onClose, onSubmit }) {
 const [form, setForm] = useState({
 name: initial?.name ||'',
 description: initial?.description ||'',
 color: initial?.color || COLORS[0],
 logo_base64: null,
 logo_url: initial?.logo_url || null,
 });
 const [submitting, setSubmitting] = useState(false);
 const fileRef = useRef(null);

 // Reset when sheet reopens
 useMemo(() => {
 if (open) {
 setForm({
 name: initial?.name ||'',
 description: initial?.description ||'',
 color: initial?.color || COLORS[0],
 logo_base64: null,
 logo_url: initial?.logo_url || null,
 });
 setSubmitting(false);
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [open]);

 const handleFile = (file) => {
 if (!file?.type.startsWith('image/')) return;
 const r = new FileReader();
 r.onload = (e) =>
 setForm((f) => ({ ...f, logo_base64: e.target.result, logo_url: e.target.result }));
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
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <Sheet
 open={open}
 onClose={onClose}
 title={initial ?'Editar projeto' :'Novo projeto'}
 maxHeight="90dvh"
 >
 <form onSubmit={submit} className="px-4 pb-6 space-y-4">
 <div className="flex items-center gap-3">
 <button
 type="button"
 onClick={() => fileRef.current?.click()}
 className="w-14 h-14 rounded-[14px] flex items-center justify-center overflow-hidden active:scale-95 transition-transform"
 style={{ background: form.logo_url ?'transparent' : form.color }}
 >
 {form.logo_url ? (
 <img src={form.logo_url} alt="" className="w-full h-full object-cover" />
 ) : (
 <Upload size={18} className="text-white/90" strokeWidth={1.8} />
 )}
 </button>
 <input
 ref={fileRef}
 type="file"
 accept="image/*"
 className="hidden"
 onChange={(e) => handleFile(e.target.files[0])}
 />
 <div className="flex-1">
 <p className="text-[10px] font-bold text-[#86868B] mb-2">
 Cor de destaque
 </p>
 <div className="flex flex-wrap gap-1.5">
 {COLORS.map((c) => (
 <button
 key={c}
 type="button"
 onClick={() => setForm((f) => ({ ...f, color: c }))}
 className={`w-6 h-6 rounded-full transition-all outline-none ${
 form.color === c
 ?'ring-2 ring-white/90 ring-offset-2 ring-offset-[#161616] scale-110'
 :'active:scale-95'
 }`}
 style={{ background: c }}
 />
 ))}
 </div>
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-[12px] font-medium text-[#86868B] ml-1">Nome</label>
 <input
 type="text"
 value={form.name}
 onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
 placeholder="Nome do projeto"
 autoFocus
 required
 className="w-full px-4 py-3.5 rounded-[14px] bg-[#0F0F11] border border-white/[0.06] text-[15px] text-[#F5F5F7] focus:border-[#0A84FF]/50 focus:outline-none transition-colors placeholder:text-[#5A5A5F]"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-[12px] font-medium text-[#86868B] ml-1">
 Descrição <span className="text-[#5A5A5F]">(opcional)</span>
 </label>
 <textarea
 rows={3}
 value={form.description}
 onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
 placeholder="Sobre o que é este projeto?"
 className="w-full px-4 py-3 rounded-[14px] bg-[#0F0F11] border border-white/[0.06] text-[14.5px] text-[#F5F5F7] focus:border-[#0A84FF]/50 focus:outline-none transition-colors resize-none placeholder:text-[#5A5A5F]"
 />
 </div>

 <button
 type="submit"
 disabled={submitting || !form.name.trim()}
 className="w-full py-4 rounded-[16px] bg-white text-black text-[15px] font-bold active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg"
 >
 {submitting ?'Salvando...' : initial ?'Salvar' :'Criar projeto'}
 </button>
 </form>
 </Sheet>
 );
}

export default function MobileProjects({
 projects,
 filtered,
 query,
 setQuery,
 modal,
 setModal,
 handleCreate,
 handleUpdate,
 handleDelete,
}) {
 const [actionProject, setActionProject] = useState(null);

 useRegisterMobileFab(
 {
 icon: Plus,
 label:'Novo projeto',
 tone:'accent',
 onClick: () => setModal({ mode:'create' }),
 },
 [setModal]
 );

 return (
 <motion.div
 variants={stagger}
 initial="hidden"
 animate="show"
 className="px-4 pt-2 pb-6 max-w-[640px] mx-auto"
 style={{
 fontFamily:
'-apple-system, BlinkMacSystemFont,"SF Pro Text","Segoe UI", Roboto, sans-serif',
 }}
 >
 <motion.div variants={fadeUp} className="mb-5 px-1">
 <p className="text-[12.5px] font-medium text-[#86868B] tracking-tight">
 Projetos
 </p>
 <h1 className="text-[26px] font-semibold text-[#F5F5F7] tracking-tight leading-tight">
 {projects.length === 0
 ?'Nenhum ainda'
 : `${projects.length} ${projects.length === 1 ?'projeto' :'projetos'}`}
 </h1>
 </motion.div>

 {projects.length > 0 && (
 <motion.div variants={fadeUp} className="relative mb-4">
 <Search
 size={14}
 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73] pointer-events-none"
 />
 <input
 type="text"
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder="Buscar projetos..."
 className="w-full pl-10 pr-3 h-11 rounded-[12px] bg-[#0F0F11] border border-white/[0.05] text-[14px] text-[#F5F5F7] placeholder-[#5A5A5F] outline-none focus:border-white/15 transition-colors"
 />
 {query && (
 <button
 type="button"
 onClick={() => setQuery('')}
 aria-label="Limpar busca"
 className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-[#86868B] active:bg-white/[0.05]"
 >
 <X size={14} />
 </button>
 )}
 </motion.div>
 )}

 {projects.length === 0 ? (
 <motion.button
 type="button"
 variants={fadeUp}
 onClick={() => setModal({ mode:'create' })}
 className="w-full mt-6 p-10 rounded-[18px] border border-dashed border-white/[0.08] bg-[#1A1A1C]/40 active:bg-[#1A1A1C] transition-colors text-center"
 >
 <div className="w-12 h-12 mx-auto mb-3 rounded-[14px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
 <Plus size={20} className="text-[#86868B]" strokeWidth={1.8} />
 </div>
 <p className="text-[14.5px] font-semibold text-[#F5F5F7] mb-1">
 Criar primeiro projeto
 </p>
 <p className="text-[12.5px] text-[#86868B]">
 Organize tarefas, docs e assets num só lugar.
 </p>
 </motion.button>
 ) : filtered.length === 0 ? (
 <motion.div variants={fadeUp} className="text-center py-16 text-[13px] text-[#86868B]">
 Nenhum projeto encontrado para"{query}".
 </motion.div>
 ) : (
 <motion.div variants={fadeUp} className="space-y-2.5">
 {filtered.map((p) => {
 const accent = p.color ||'#0A84FF';
 return (
 <div
 key={p.id}
 className="relative rounded-[16px] bg-[#1A1A1C] border border-white/[0.05] overflow-hidden active:bg-[#202022] transition-colors"
 >
 <div className="h-[2px] w-full opacity-70" style={{ background: accent }} />
 <Link
 to={`/projects/${p.slug}`}
 className="flex items-center gap-3 p-4 outline-none"
 >
 {p.logo_url ? (
 <img
 src={p.logo_url}
 alt={p.name}
 className="w-11 h-11 rounded-[10px] object-cover shrink-0"
 />
 ) : (
 <div
 className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
 style={{ background: `${accent}1f`, color: accent }}
 >
 <FolderKanban size={20} strokeWidth={1.8} />
 </div>
 )}
 <div className="flex-1 min-w-0">
 <h3 className="text-[14.5px] font-semibold text-[#F5F5F7] tracking-tight truncate">
 {p.name}
 </h3>
 {p.description ? (
 <p className="text-[12px] text-[#86868B] line-clamp-1 mt-0.5">
 {p.description}
 </p>
 ) : (
 <p className="text-[11.5px] text-[#5A5A5F] mt-0.5">
 {new Date(p.updated_at || p.created_at).toLocaleDateString(
'pt-BR',
 { day:'2-digit', month:'short' }
 )}
 </p>
 )}
 </div>
 <button
 type="button"
 onClick={(e) => {
 e.preventDefault();
 e.stopPropagation();
 setActionProject(p);
 }}
 aria-label="Opções"
 className="w-9 h-9 -mr-1 rounded-full flex items-center justify-center text-[#86868B] active:bg-white/[0.06] outline-none"
 >
 <MoreHorizontal size={16} />
 </button>
 </Link>
 </div>
 );
 })}
 </motion.div>
 )}

 {/* Project action sheet */}
 <Sheet
 open={!!actionProject}
 onClose={() => setActionProject(null)}
 title={actionProject?.name}
 >
 <div className="px-4 pb-5 space-y-2">
 <button
 type="button"
 onClick={() => {
 const p = actionProject;
 setActionProject(null);
 if (p) setModal({ mode:'edit', project: p });
 }}
 className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-white/[0.04] active:bg-white/[0.08] transition-colors outline-none"
 >
 <Pencil size={17} className="text-[#E5E5EA]" strokeWidth={2} />
 <span className="text-[14px] font-medium text-[#F5F5F7]">Editar</span>
 </button>
 <button
 type="button"
 onClick={() => {
 const p = actionProject;
 setActionProject(null);
 if (p) handleDelete(p);
 }}
 className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-[#FF3B30]/10 active:bg-[#FF3B30]/20 transition-colors outline-none"
 >
 <Trash2 size={17} className="text-[#FF6961]" strokeWidth={2} />
 <span className="text-[14px] font-semibold text-[#FF6961]">Excluir</span>
 </button>
 </div>
 </Sheet>

 <AnimatePresence>
 {modal && (
 <MobileProjectFormSheet
 open={!!modal}
 initial={modal.mode ==='edit' ? modal.project : null}
 onClose={() => setModal(null)}
 onSubmit={modal.mode ==='edit' ? handleUpdate : handleCreate}
 />
 )}
 </AnimatePresence>
 </motion.div>
 );
}
