import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Star, Share2, MoreHorizontal, Lock, Loader2, Check, Smile, ImageIcon, MessageSquare } from 'lucide-react';
import { projectsService } from '../services/projects';
import { useToast } from '../contexts/ToastContext';
import LoadingSkeleton from '../components/LoadingSkeleton';
import TeamLiveCursors from '../components/TeamLiveCursors';
import { useRealtimeSubscription } from '../contexts/RealtimeContext';
import EmojiPicker from '../components/projects/EmojiPicker';
import CoverPicker, { CoverImage } from '../components/projects/CoverPicker';
import ProjectSidebar from '../components/projects/FavoritesPanel';
import PageComments from '../components/projects/PageComments';
import { useFavorites } from '../hooks/useFavorites';
import Editor from '../components/projects/editor/Editor';
import { useProjectDoc } from '../hooks/useProjects';
import { useIsMobile } from '../hooks/useIsMobile';
import MobileProjectDetail from './projects/MobileProjectDetail';

function relativeTime(iso) {
  if (!iso) return 'agora';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d atrás`;
  return new Date(iso).toLocaleDateString();
}

export default function ProjectDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const pageRef = useRef(null);
  const titleRef = useRef(null);
  const emojiAnchorRef = useRef(null);
  const coverAnchorRef = useRef(null);
  const commentsRef = useRef(null);
  const { isFav, toggle: toggleFav } = useFavorites();
  const { doc, setContent, loading: docLoading, savingState } = useProjectDoc(slug);
  const [hasComments, setHasComments] = useState(false);
  const [commentInputVisible, setCommentInputVisible] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setLoading(true);
    projectsService.get(slug)
      .then(setProject)
      .catch(e => { showError(e.message); navigate('/projects'); })
      .finally(() => setLoading(false));
  }, [slug, navigate, showError]);

  useRealtimeSubscription(['projects'], () => {
    projectsService.get(slug).then(setProject).catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (titleRef.current && project && titleRef.current.textContent !== project.name) {
      titleRef.current.textContent = project.name || '';
    }

    let iconLink = document.querySelector("link[rel~='icon']");
    if (!iconLink) {
      iconLink = document.createElement('link');
      iconLink.rel = 'shortcut icon';
      document.head.appendChild(iconLink);
    }

    if (project) {
      document.title = `${project.name || 'Sem título'} - DevsBoard`;

      if (project.logo_url) {
        iconLink.href = project.logo_url;
      } else if (project.icon) {
        iconLink.href = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${project.icon}</text></svg>`;
      } else {
        iconLink.href = '/devsboard.png';
      }
    }

    return () => {
      document.title = 'DevsBoard';
      if (iconLink) iconLink.href = '/devsboard.png';
    };
  }, [project?.name, project?.icon, project?.logo_url]);

  if (loading) return <LoadingSkeleton />;
  if (!project) return null;

  const patch = async (payload) => {
    const optimistic = { ...project, ...payload };
    setProject(optimistic);
    window.dispatchEvent(new CustomEvent('project-updated', { detail: optimistic }));
    try {
      const updated = await projectsService.update(slug, payload);
      setProject(updated);
      window.dispatchEvent(new CustomEvent('project-updated', { detail: updated }));
    } catch (e) {
      showError('Erro ao atualizar. Verifique sua conexão.');
      setProject(project); // revert
      window.dispatchEvent(new CustomEvent('project-updated', { detail: project }));
    }
  };

  const onTitleBlur = () => {
    const next = titleRef.current?.textContent?.trim() || '';
    if (next && next !== project.name) patch({ name: next });
    else if (!next && titleRef.current) titleRef.current.textContent = project.name;
  };

  const fav = isFav(project.id);

  if (isMobile) {
    return (
      <MobileProjectDetail
        project={project}
        patch={patch}
        doc={doc}
        setContent={setContent}
        docLoading={docLoading}
        savingState={savingState}
        fav={fav}
        toggleFav={toggleFav}
        slug={slug}
      />
    );
  }

  return (
    <>
      <ProjectSidebar />
      <div ref={pageRef} className="ml-[260px] min-h-screen flex flex-col pb-24 relative" style={{ background: '#191919' }}>
        <TeamLiveCursors roomId={`project:${slug}`} contentRef={pageRef} />
        {/* TOP BAR */}
        <div className="flex items-center gap-2 px-8 pt-4 pb-2 mb-2 select-none h-10 w-full">
          <nav className="flex-1 min-w-0 flex items-center gap-1.5 text-[13px] font-medium text-[#A1A1AA]">
            {(project.icon || project.logo_url) && (
              <span className="shrink-0 flex items-center justify-center w-[16px] h-[16px]">
                {project.logo_url ? (
                  <img src={project.logo_url} alt="" className="w-full h-full object-cover rounded-[3px]" />
                ) : (
                  <span className="text-[14px] leading-none">{project.icon}</span>
                )}
              </span>
            )}
            <span className="text-[#E5E5EA] truncate">{project.name}</span>
            <button
              type="button"
              className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded text-[12px] text-[#86868B] hover:bg-white/[0.04] hover:text-[#E5E5EA] transition-colors"
            >
              <Lock size={11} strokeWidth={2} /> Particular
              <ChevronDown size={10} className="opacity-60" />
            </button>
          </nav>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[12px] text-[#63646B] mr-2">Editada {relativeTime(doc?.updated_at)}</span>

            <AnimatePresence mode="wait">
              {savingState !== 'idle' && (
                <motion.div
                  key={savingState}
                  initial={{ opacity: 0, x: 4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 4 }}
                  className="flex items-center gap-1 text-[11px] text-[#86868B] mr-1"
                >
                  {savingState === 'saving' ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} className="text-[#30D158]" />}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              className="px-2.5 py-1 text-[13px] font-medium text-[#E5E5EA] hover:bg-white/[0.06] rounded-[6px] transition-colors outline-none cursor-pointer inline-flex items-center gap-1.5"
            >
              Compartilhar
              <ChevronDown size={11} className="opacity-60" />
            </button>
            <button
              type="button"
              onClick={() => toggleFav(project.id)}
              className={`p-1.5 rounded-[6px] transition-colors outline-none cursor-pointer ${fav ? 'text-[#FFB800] hover:bg-[#FFB800]/10' : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/[0.06]'}`}
              aria-label="Favoritar"
            >
              <Star size={15} strokeWidth={1.8} fill={fav ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              className="p-1.5 text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/[0.06] rounded-[6px] transition-colors outline-none cursor-pointer"
              aria-label="Mais"
            >
              <MoreHorizontal size={15} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div className="border-b border-white/[0.04] mb-1" />

        {/* COVER (opcional) */}
        <AnimatePresence initial={false} mode="wait">
          {project.cover_url && (
            <div className="relative mb-2 group">
              <motion.div
                key="cover"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 280 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="relative overflow-hidden w-full"
              >
                <CoverImage value={project.cover_url} className="absolute inset-0" />
              </motion.div>

              <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity z-10"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 8, padding: 2 }}>
                <CoverPicker
                  anchorRef={coverAnchorRef}
                  value={project.cover_url}
                  onChange={(v) => {
                    if (v.startsWith('data:image/')) patch({ cover_base64: v, cover_url: v });
                    else patch({ cover_url: v });
                  }}
                  onClear={() => patch({ cover_url: null })}
                />
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* PAGE BODY */}
        <article className="px-[96px] py-10 max-w-[900px] mx-auto group/page">
          {/* Emoji grande */}
          {(project.icon || project.logo_url) && (
            <div className={`mb-2 ${project.cover_url ? '-mt-[100px] relative z-10' : '-ml-2'}`}>
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

          {/* Action row sobre o título — aparece no hover da página inteira ou do título */}
          <div className="flex items-center gap-2 mb-2 text-[12.5px] text-[#86868B] opacity-0 group-hover/page:opacity-100 transition-opacity min-h-[28px]">
            {!project.icon && !project.logo_url && (
              <EmojiPicker
                anchorRef={emojiAnchorRef}
                value={null}
                onChange={(v) => {
                  if (v?.startsWith('data:image/')) patch({ logo_base64: v, logo_url: v });
                  else patch({ icon: v, logo_url: null });
                }}
                trigger={<button className="flex items-center gap-1.5 hover:text-[#E5E5EA] hover:bg-white/[0.06] px-1.5 py-1 rounded transition-colors"><Smile size={14} /> Adicionar ícone</button>}
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
                trigger={<button className="flex items-center gap-1.5 hover:text-[#E5E5EA] hover:bg-white/[0.06] px-1.5 py-1 rounded transition-colors"><ImageIcon size={14} /> Adicionar capa</button>}
              />
            )}
            <button 
              onClick={() => {
                setCommentInputVisible(true);
                setTimeout(() => commentsRef.current?.openInput(), 0);
              }}
              className="flex items-center gap-1.5 hover:text-[#E5E5EA] hover:bg-white/[0.06] px-1.5 py-1 rounded transition-colors"
            >
              <MessageSquare size={14} /> Adicionar comentário
            </button>
          </div>

          {/* Título grande inline */}
          <h1
            ref={titleRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onBlur={onTitleBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); titleRef.current.blur(); } }}
            className="text-[40px] font-bold text-[#F5F5F7] tracking-tight leading-[1.2] outline-none focus:outline-none caret-[#F5F5F7] empty:before:content-['Sem_título'] empty:before:text-[#3a3a3c] mb-3"
          >
            {project.name}
          </h1>

          {/* Comentários */}
          <div className={`${(hasComments || commentInputVisible) ? 'mb-6 mt-4' : ''}`}>
            <div className={!(hasComments || commentInputVisible) ? 'hidden' : 'block'}>
              <PageComments projectId={slug} ref={commentsRef} onHasComments={setHasComments} />
              <div className="border-b border-white/[0.04] mt-4" />
            </div>
          </div>

          {/* EDITOR — corpo da página */}
          {docLoading ? (
            <div className="text-[#63646B] text-[14px] py-4">Carregando…</div>
          ) : (
            <Editor
              projectId={slug}
              value={doc.content || ''}
              onChange={setContent}
            />
          )}
        </article>
      </div>
    </>
  );
}
