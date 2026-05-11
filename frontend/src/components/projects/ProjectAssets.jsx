import { useState, useRef } from'react';
import { motion, AnimatePresence } from'framer-motion';
import { Plus, Trash2, X, Link as LinkIcon, Image as ImageIcon, Figma, Upload, ExternalLink, Layers, Aperture, Sparkles, Smile } from'lucide-react';
import { useAssets } from'../../hooks/useProjects';
import { useToast } from'../../contexts/ToastContext';
import { useConfirm } from'../../contexts/ConfirmModalContext';

const TYPES = [
 { key:'logo', label:'Logo', icon: Smile, hint:'marca / símbolo', needsImage: true },
 { key:'screen', label:'Tela', icon: Aperture, hint:'screenshot, mockup', needsImage: true },
 { key:'figma', label:'Figma', icon: Figma, hint:'arquivo de design', needsImage: false },
 { key:'inspiration', label:'Inspiração', icon: Sparkles, hint:'referência visual', needsImage: true },
 { key:'link', label:'Link', icon: LinkIcon, hint:'site, doc, repo', needsImage: false },
];

const TYPE_STYLES = {
 logo: { bg:'#FFD60A', soft:'bg-[#FFD60A]/15 text-[#FFE066]' },
 screen: { bg:'#0A84FF', soft:'bg-[#0A84FF]/15 text-[#5AB5FF]' },
 figma: { bg:'#FF375F', soft:'bg-[#FF375F]/15 text-[#FF6B89]' },
 inspiration: { bg:'#BF5AF2', soft:'bg-[#BF5AF2]/15 text-[#D88EFF]' },
 link: { bg:'#30D158', soft:'bg-[#30D158]/15 text-[#5EE08F]' },
};

function AssetModal({ onClose, onSubmit }) {
 const [type, setType] = useState('screen');
 const [title, setTitle] = useState('');
 const [url, setUrl] = useState('');
 const [imageBase64, setImageBase64] = useState(null);
 const [submitting, setSubmitting] = useState(false);
 const [dragOver, setDragOver] = useState(false);
 const fileRef = useRef(null);

 const handleFile = (file) => {
 if (!file?.type.startsWith('image/')) return;
 const r = new FileReader();
 r.onload = (e) => setImageBase64(e.target.result);
 r.readAsDataURL(file);
 };

 const typeMeta = TYPES.find(t => t.key === type);
 const submit = async (e) => {
 e.preventDefault();
 if (!title.trim()) return;
 if (typeMeta.needsImage && !imageBase64 && !url.trim()) return;
 if (!typeMeta.needsImage && !url.trim()) return;
 setSubmitting(true);
 try {
 await onSubmit({
 title: title.trim(),
 type,
 url: url.trim() || null,
 image_base64: imageBase64,
 });
 onClose();
 } finally { setSubmitting(false); }
 };

 return (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
 <motion.form onSubmit={submit} onClick={e => e.stopPropagation()}
 initial={{ scale: 0.94, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.94, y: 20, opacity: 0 }}
 transition={{ type:'spring', stiffness: 360, damping: 30 }}
 className="w-full max-w-md bg-[#202020]/95 backdrop-blur-xl border border-white/[0.08] rounded-[22px] p-6 space-y-4 shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
 <div className="flex items-center justify-between">
 <h2 className="text-[16px] font-bold text-[#F5F5F7] tracking-tight">Novo asset</h2>
 <button type="button" onClick={onClose} className="text-[#86868B] hover:text-white"><X size={18} /></button>
 </div>

 <div className="grid grid-cols-5 gap-1.5">
 {TYPES.map(t => {
 const active = type === t.key;
 const style = TYPE_STYLES[t.key];
 return (
 <motion.button type="button" key={t.key} whileTap={{ scale: 0.95 }}
 onClick={() => setType(t.key)}
 title={t.hint}
 className={`flex flex-col items-center gap-1 py-2.5 rounded-[10px] border transition-colors ${active ?'border-white bg-white/10 text-white' :'bg-[#2C2C2E]/60 text-[#A1A1AA] border-white/[0.06] hover:text-white hover:border-white/15'}`}>
 <t.icon size={16} style={{ color: active ? style.bg : undefined }} />
 <span className="text-[10.5px] font-semibold">{t.label}</span>
 </motion.button>
 );
 })}
 </div>
 <p className="text-[11px] text-[#63646B] -mt-2">{typeMeta.hint}</p>

 <div>
 <label className="text-[11px] font-semibold tracking-normal text-[#86868B]">Nome*</label>
 <input value={title} onChange={e => setTitle(e.target.value)} autoFocus
 placeholder="Ex: Logo principal, Mockup home, Repo do back…"
 className="mt-1 w-full px-3 py-2.5 bg-[#2C2C2E]/80 border border-white/[0.08] rounded-[12px] text-[14px] text-white outline-none focus:border-[#0A84FF] transition-colors" />
 </div>

 {typeMeta.needsImage && (
 <div>
 <label className="text-[11px] font-semibold tracking-normal text-[#86868B]">Imagem{typeMeta.needsImage && !url ?'*' :''}</label>
 <div
 onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
 onDragLeave={() => setDragOver(false)}
 onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
 onClick={() => fileRef.current?.click()}
 className={`mt-1 w-full h-40 rounded-[14px] border-2 border-dashed cursor-pointer flex items-center justify-center overflow-hidden transition-all ${dragOver ?'border-[#0A84FF] bg-[#0A84FF]/10' :'border-white/[0.08] hover:border-white/30 bg-[#2C2C2E]/40'}`}>
 {imageBase64 ? (
 <img src={imageBase64} alt="" className="w-full h-full object-contain" />
 ) : (
 <div className="flex flex-col items-center gap-1.5 text-[#86868B]">
 <Upload size={20} />
 <span className="text-[11.5px]">Arraste ou clique</span>
 </div>
 )}
 </div>
 <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
 </div>
 )}
 <div>
 <label className="text-[11px] font-semibold tracking-normal text-[#86868B]">
 URL{!typeMeta.needsImage ?'*' :' (opcional)'}
 </label>
 <input value={url} onChange={e => setUrl(e.target.value)}
 placeholder={type ==='figma' ?'https://figma.com/file/…' :'https://…'}
 className="mt-1 w-full px-3 py-2.5 bg-[#2C2C2E]/80 border border-white/[0.08] rounded-[12px] text-[14px] text-white outline-none focus:border-[#0A84FF] transition-colors" />
 </div>

 <div className="flex justify-end gap-2 pt-2">
 <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-[#A1A1AA] hover:text-white">Cancelar</button>
 <motion.button whileTap={{ scale: 0.96 }} type="submit" disabled={submitting}
 className="px-5 py-2 text-[13px] font-semibold bg-white text-black rounded-[10px] disabled:opacity-40">
 {submitting ?'Salvando...' :'Adicionar'}
 </motion.button>
 </div>
 </motion.form>
 </motion.div>
 );
}

function Lightbox({ asset, onClose }) {
 return (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 onClick={onClose}
 className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 cursor-zoom-out">
 <motion.img src={asset.image_url} alt={asset.title}
 initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
 transition={{ type:'spring', stiffness: 320, damping: 30 }}
 className="max-w-full max-h-full object-contain rounded-[14px] shadow-2xl" />
 <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"><X size={18} /></button>
 </motion.div>
 );
}

export default function ProjectAssets({ projectId }) {
 const { assets, loading, create, remove } = useAssets(projectId);
 const { showError, showSuccess } = useToast();
 const { confirm } = useConfirm();
 const [open, setOpen] = useState(false);
 const [filter, setFilter] = useState('all');
 const [lightbox, setLightbox] = useState(null);

 const handleDelete = async (a) => {
 const ok = await confirm({ title:'Remover asset?', message: a.title, confirmText:'Remover', danger: true });
 if (!ok) return;
 try { await remove(a.id); showSuccess('Removido'); }
 catch (e) { showError(e.message); }
 };

 if (loading) return <div className="text-[#86868B] text-[13px]">Carregando assets...</div>;

 const filtered = filter ==='all' ? assets : assets.filter(a => a.type === filter);
 const counts = { all: assets.length, logo: 0, screen: 0, figma: 0, inspiration: 0, link: 0 };
 assets.forEach(a => { if (counts[a.type] !== undefined) counts[a.type]++; });

 return (
 <div>
 <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
 <div className="flex items-center gap-2">
 <Layers size={18} className="text-[#F5F5F7]" />
 <h2 className="text-[16px] font-semibold text-[#F5F5F7]">Assets & referências</h2>
 </div>
 <div className="flex items-center gap-2">
 <div className="flex items-center gap-1 p-1 bg-[#191919] rounded-[10px] border border-white/[0.06] overflow-x-auto">
 {[
 { k:'all', l:'Todos' },
 { k:'logo', l:'Logos' },
 { k:'screen', l:'Telas' },
 { k:'figma', l:'Figma' },
 { k:'inspiration', l:'Inspirações' },
 { k:'link', l:'Links' },
 ].map(f => (
 <button key={f.k} onClick={() => setFilter(f.k)}
 className={`px-2.5 py-1 rounded-[7px] text-[11px] font-semibold transition-colors whitespace-nowrap ${filter === f.k ?'bg-white text-black' :'text-[#86868B] hover:text-white'}`}>
 {f.l} <span className="opacity-60 ml-0.5">{counts[f.k]}</span>
 </button>
 ))}
 </div>
 <motion.button whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }} onClick={() => setOpen(true)}
 className="flex items-center gap-2 px-3.5 py-2 bg-white text-black text-[12px] font-semibold rounded-[10px]">
 <Plus size={14} /> Adicionar
 </motion.button>
 </div>
 </div>

 {filtered.length === 0 ? (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
 className="text-center py-20 border border-dashed border-white/[0.08] rounded-[20px]">
 <Layers size={32} className="mx-auto text-[#86868B]" strokeWidth={1.5} />
 <p className="mt-3 text-[13px] text-[#A1A1AA]">Nenhum asset {filter !=='all' ? `do tipo ${filter}` :'ainda'}.</p>
 </motion.div>
 ) : (
 <motion.div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
 initial="hidden" animate="show"
 variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}>
 <AnimatePresence>
 {filtered.map(a => {
 const TypeIcon = TYPES.find(t => t.key === a.type)?.icon || LinkIcon;
 const style = TYPE_STYLES[a.type];
 return (
 <motion.div key={a.id} layout
 variants={{ hidden: { opacity: 0, scale: 0.95, y: 8 }, show: { opacity: 1, scale: 1, y: 0 } }}
 exit={{ opacity: 0, scale: 0.92 }}
 transition={{ type:'spring', stiffness: 320, damping: 28 }}
 whileHover={{ y: -3 }}
 className="group relative rounded-[16px] bg-[#202020] border border-white/[0.06] hover:border-white/20 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] overflow-hidden transition-all">
 <div
 className={`relative w-full aspect-[4/3] bg-[#0F0F10] overflow-hidden ${a.image_url ?'cursor-zoom-in' :''}`}
 onClick={() => a.image_url && setLightbox(a)}>
 {a.image_url ? (
 <img src={a.image_url} alt={a.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
 ) : (
 <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${style.bg}30, transparent)` }}>
 <TypeIcon size={36} className="text-white/30" strokeWidth={1.4} />
 </div>
 )}
 <div className={`absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full backdrop-blur-md text-[10px] font-bold tracking-normal ${style.soft}`}>
 <TypeIcon size={9} /> {a.type}
 </div>
 </div>
 <div className="p-3">
 <p className="text-[13px] font-semibold text-[#F5F5F7] truncate">{a.title}</p>
 {a.url && (
 <a href={a.url} target="_blank" rel="noreferrer"
 onClick={(e) => e.stopPropagation()}
 className="mt-0.5 flex items-center gap-1 text-[11px] text-[#86868B] hover:text-[#0A84FF] truncate">
 <ExternalLink size={10} /> {a.url.replace(/^https?:\/\//,'')}
 </a>
 )}
 </div>
 <button onClick={() => handleDelete(a)}
 className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-[8px] bg-black/60 backdrop-blur text-white/70 hover:text-[#FF453A] transition-all">
 <Trash2 size={12} />
 </button>
 </motion.div>
 );
 })}
 </AnimatePresence>
 </motion.div>
 )}

 <AnimatePresence>
 {open && (
 <AssetModal
 onClose={() => setOpen(false)}
 onSubmit={async (payload) => {
 try { await create(payload); showSuccess('Asset adicionado'); }
 catch (e) { showError(e.message); throw e; }
 }}
 />
 )}
 {lightbox && <Lightbox asset={lightbox} onClose={() => setLightbox(null)} />}
 </AnimatePresence>
 </div>
 );
}
