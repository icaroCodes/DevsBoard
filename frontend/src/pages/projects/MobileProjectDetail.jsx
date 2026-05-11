import { useEffect, useRef, useState } from'react';
import { useNavigate } from'react-router-dom';
import { motion, AnimatePresence } from'framer-motion';
import {
 ArrowLeft,
 Star,
 MoreHorizontal,
 Loader2,
 Check,
 Smile,
 ImageIcon,
 MessageSquare,
} from'lucide-react';
import EmojiPicker from'../../components/projects/EmojiPicker';
import CoverPicker, { CoverImage } from'../../components/projects/CoverPicker';
import PageComments from'../../components/projects/PageComments';
import Editor from'../../components/projects/editor/Editor';
import Sheet from'../../components/mobile/Sheet';

function relativeTime(iso) {
 if (!iso) return'agora';
 const diff = (Date.now() - new Date(iso).getTime()) / 1000;
 if (diff < 60) return'agora';
 if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
 if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
 if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d atrás`;
 return new Date(iso).toLocaleDateString();
}

export default function MobileProjectDetail({
 project,
 patch,
 doc,
 setContent,
 docLoading,
 savingState,
 fav,
 toggleFav,
 slug,
}) {
 const navigate = useNavigate();
 const titleRef = useRef(null);
 const emojiAnchorRef = useRef(null);
 const coverAnchorRef = useRef(null);
 const commentsRef = useRef(null);
 const [hasComments, setHasComments] = useState(false);
 const [commentInputVisible, setCommentInputVisible] = useState(false);
 const [moreOpen, setMoreOpen] = useState(false);

 useEffect(() => {
 if (
 titleRef.current &&
 project &&
 titleRef.current.textContent !== project.name
 ) {
 titleRef.current.textContent = project.name ||'';
 }
 }, [project?.name]);

 const onTitleBlur = () => {
 const next = titleRef.current?.textContent?.trim() ||'';
 if (next && next !== project.name) patch({ name: next });
 else if (!next && titleRef.current) titleRef.current.textContent = project.name;
 };

 return (
 <div
 className="min-h-[100dvh] flex flex-col bg-[#191919] text-[#E4E4E7]"
 style={{
 fontFamily:
'-apple-system, BlinkMacSystemFont,"SF Pro Text","Segoe UI", Roboto, sans-serif',
 }}
 >
 {/* Top bar */}
 <header
 className="sticky top-0 z-50 border-b border-white/[0.05]"
 style={{
 paddingTop:'env(safe-area-inset-top, 0px)',
 background:'rgba(20,20,20,0.85)',
 backdropFilter:'blur(28px) saturate(180%)',
 WebkitBackdropFilter:'blur(28px) saturate(180%)',
 }}
 >
 <div className="flex items-center gap-2 px-3 h-14">
 <button
 type="button"
 onClick={() => navigate('/projects')}
 aria-label="Voltar"
 className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center active:bg-white/[0.06] outline-none transition-colors"
 >
 <ArrowLeft size={20} className="text-[#E5E5EA]" strokeWidth={2} />
 </button>

 <div className="flex-1 min-w-0 flex items-center gap-1.5">
 {(project.icon || project.logo_url) && (
 <span className="shrink-0 flex items-center justify-center w-[18px] h-[18px]">
 {project.logo_url ? (
 <img
 src={project.logo_url}
 alt=""
 className="w-full h-full object-cover rounded-[3px]"
 />
 ) : (
 <span className="text-[15px] leading-none">{project.icon}</span>
 )}
 </span>
 )}
 <span className="text-[14px] font-semibold text-[#E5E5EA] truncate">
 {project.name}
 </span>
 </div>

 <AnimatePresence mode="wait">
 {savingState !=='idle' && (
 <motion.div
 key={savingState}
 initial={{ opacity: 0, x: 4 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 4 }}
 className="shrink-0 text-[#86868B] mr-1"
 >
 {savingState ==='saving' ? (
 <Loader2 size={13} className="animate-spin" />
 ) : (
 <Check size={13} className="text-[#30D158]" />
 )}
 </motion.div>
 )}
 </AnimatePresence>

 <button
 type="button"
 onClick={() => toggleFav(project.id)}
 aria-label="Favoritar"
 className={`w-9 h-9 rounded-full flex items-center justify-center outline-none transition-colors ${
 fav
 ?'text-[#FFB800] active:bg-[#FFB800]/10'
 :'text-[#A1A1AA] active:bg-white/[0.06]'
 }`}
 >
 <Star size={17} strokeWidth={1.8} fill={fav ?'currentColor' :'none'} />
 </button>

 <button
 type="button"
 onClick={() => setMoreOpen(true)}
 aria-label="Mais"
 className="w-9 h-9 rounded-full flex items-center justify-center text-[#A1A1AA] active:bg-white/[0.06] outline-none transition-colors"
 >
 <MoreHorizontal size={17} strokeWidth={1.8} />
 </button>
 </div>
 </header>

 {/* Cover */}
 <AnimatePresence initial={false} mode="wait">
 {project.cover_url && (
 <motion.div
 key="cover"
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 180 }}
 exit={{ opacity: 0, height: 0 }}
 transition={{ duration: 0.25 }}
 className="relative overflow-hidden w-full"
 >
 <CoverImage value={project.cover_url} className="absolute inset-0" />
 </motion.div>
 )}
 </AnimatePresence>

 {/* Body */}
 <article className="flex-1 px-5 pt-6 pb-10 max-w-[720px] mx-auto w-full">
 {(project.icon || project.logo_url) && (
 <div className={`mb-3 ${project.cover_url ?'-mt-12 relative z-10' :''}`}>
 <EmojiPicker
 anchorRef={emojiAnchorRef}
 value={project.logo_url || project.icon}
 onChange={(v) => {
 if (v?.startsWith('data:image/')) patch({ logo_base64: v, logo_url: v });
 else patch({ icon: v, logo_url: null });
 }}
 onClear={() => patch({ icon: null, logo_url: null })}
 />
 </div>
 )}

 {/* Quick action chips */}
 <div className="flex flex-wrap gap-2 mb-3 text-[12px] text-[#86868B]">
 {!project.icon && !project.logo_url && (
 <EmojiPicker
 anchorRef={emojiAnchorRef}
 value={null}
 onChange={(v) => {
 if (v?.startsWith('data:image/')) patch({ logo_base64: v, logo_url: v });
 else patch({ icon: v, logo_url: null });
 }}
 trigger={
 <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/[0.04] active:bg-white/[0.08] transition-colors">
 <Smile size={13} /> Ícone
 </button>
 }
 />
 )}
 {!project.cover_url && (
 <CoverPicker
 anchorRef={coverAnchorRef}
 value={project.cover_url}
 onChange={(v) => {
 if (v.startsWith('data:image/')) patch({ cover_base64: v, cover_url: v });
 else patch({ cover_url: v });
 }}
 trigger={
 <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/[0.04] active:bg-white/[0.08] transition-colors">
 <ImageIcon size={13} /> Capa
 </button>
 }
 />
 )}
 <button
 type="button"
 onClick={() => {
 setCommentInputVisible(true);
 setTimeout(() => commentsRef.current?.openInput(), 0);
 }}
 className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/[0.04] active:bg-white/[0.08] transition-colors"
 >
 <MessageSquare size={13} /> Comentar
 </button>
 </div>

 {/* Title */}
 <h1
 ref={titleRef}
 contentEditable
 suppressContentEditableWarning
 spellCheck={false}
 onBlur={onTitleBlur}
 onKeyDown={(e) => {
 if (e.key ==='Enter') {
 e.preventDefault();
 titleRef.current.blur();
 }
 }}
 className="text-[30px] font-bold text-[#F5F5F7] tracking-tight leading-[1.15] outline-none focus:outline-none caret-[#F5F5F7] empty:before:content-['Sem_título'] empty:before:text-[#3a3a3c] mb-2"
 >
 {project.name}
 </h1>

 <p className="text-[11.5px] text-[#5A5A5F] mb-4">
 Editada {relativeTime(doc?.updated_at)}
 </p>

 {(hasComments || commentInputVisible) && (
 <div className="mb-5">
 <PageComments
 projectId={slug}
 ref={commentsRef}
 onHasComments={setHasComments}
 />
 <div className="border-b border-white/[0.04] mt-3" />
 </div>
 )}

 {docLoading ? (
 <div className="text-[#63646B] text-[14px] py-4">Carregando…</div>
 ) : (
 <Editor projectId={slug} value={doc.content ||''} onChange={setContent} />
 )}
 </article>

 {/* More sheet */}
 <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Opções">
 <div className="px-4 pb-5 space-y-2">
 <CoverPicker
 anchorRef={coverAnchorRef}
 value={project.cover_url}
 onChange={(v) => {
 if (v.startsWith('data:image/')) patch({ cover_base64: v, cover_url: v });
 else patch({ cover_url: v });
 setMoreOpen(false);
 }}
 onClear={() => {
 patch({ cover_url: null });
 setMoreOpen(false);
 }}
 trigger={
 <button className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-white/[0.04] active:bg-white/[0.08] transition-colors outline-none">
 <ImageIcon size={17} className="text-[#E5E5EA]" strokeWidth={2} />
 <span className="text-[14px] font-medium text-[#F5F5F7]">
 {project.cover_url ?'Trocar capa' :'Adicionar capa'}
 </span>
 </button>
 }
 />
 <EmojiPicker
 anchorRef={emojiAnchorRef}
 value={project.logo_url || project.icon}
 onChange={(v) => {
 if (v?.startsWith('data:image/')) patch({ logo_base64: v, logo_url: v });
 else patch({ icon: v, logo_url: null });
 setMoreOpen(false);
 }}
 onClear={() => {
 patch({ icon: null, logo_url: null });
 setMoreOpen(false);
 }}
 trigger={
 <button className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-white/[0.04] active:bg-white/[0.08] transition-colors outline-none">
 <Smile size={17} className="text-[#E5E5EA]" strokeWidth={2} />
 <span className="text-[14px] font-medium text-[#F5F5F7]">
 {project.icon || project.logo_url ?'Trocar ícone' :'Adicionar ícone'}
 </span>
 </button>
 }
 />
 </div>
 </Sheet>
 </div>
 );
}
