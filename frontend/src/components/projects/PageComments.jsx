import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Paperclip, ArrowUp, Trash2, X, MoreHorizontal, 
  Smile, Reply, Pencil, ThumbsUp, ThumbsDown, Check, AtSign, CornerDownRight
} from 'lucide-react';
import { commentsService } from '../../services/projects';
import { useAuth } from '../../contexts/AuthContext';

function relTime(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)        return 'Agora há pouco';
  if (diff < 3600)      return `${Math.floor(diff / 60)}min`;
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString();
}

function Avatar({ name, url, size = 22 }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="rounded-full object-cover shrink-0 border border-white/10"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="rounded-full shrink-0 flex items-center justify-center text-white font-semibold border border-white/10"
      style={{
        width: size, height: size,
        background: '#3a3a3c',
        fontSize: Math.round(size * 0.46),
      }}
    >{initial}</span>
  );
}

function splitAttachment(content) {
  const m = content?.match(/!\[anexo\]\((.*?)\)/);
  const text = (content || '').replace(/\n?\n?!\[anexo\]\((.*?)\)/g, '').trim();
  return { text, attachment: m ? m[1] : null };
}

/* ── Inline Reply Input ── */
function InlineReplyInput({ userName, onSubmit, onCancel }) {
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  const submit = () => {
    const content = draft.trim();
    if (!content && !attachment) return;
    onSubmit(content, attachment);
    setDraft('');
    setAttachment(null);
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => setAttachment(ev.target.result);
    r.readAsDataURL(file);
    e.target.value = '';
  };

  const hasContent = draft.trim() || attachment;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="overflow-hidden"
    >
      <div className="flex items-center gap-2 mt-2 ml-[30px]">
        <Avatar name={userName} size={18} />
        <div className="flex-1 min-w-0 flex items-center gap-0 rounded-[8px] border border-white/[0.08] bg-white/[0.02] focus-within:border-[#2383E2]/60 transition-colors">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
              if (e.key === 'Escape') onCancel?.();
            }}
            placeholder="Responder..."
            className="flex-1 min-w-0 bg-transparent px-3 py-1.5 text-[13px] text-[#e9e9e7] placeholder:text-[#6f6e6b] outline-none"
          />
          <div className="flex items-center gap-0.5 pr-1.5 shrink-0">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="p-1 rounded-[4px] text-[#6f6e6b] hover:text-[#e9e9e7] transition-colors"
              title="Anexar"
            >
              <Paperclip size={13} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            <button
              type="button"
              className="p-1 rounded-[4px] text-[#6f6e6b] hover:text-[#e9e9e7] transition-colors"
              title="Mencionar"
            >
              <AtSign size={13} />
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!hasContent}
              className={`p-1 rounded-full transition-all ${hasContent ? 'bg-[#2383E2] text-white hover:bg-[#1A6FCB]' : 'text-[#6f6e6b] bg-white/[0.04] cursor-not-allowed'}`}
              title="Enviar"
            >
              <ArrowUp size={13} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Comment Item ── */
function CommentItem({ c, currentUserId, onDelete, onOpenImage, onReply, onSubmitReply, replies, user }) {
  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const isMine = String(c.user_id) === String(currentUserId);
  const { text, attachment } = splitAttachment(c.content);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setShowReactions(false);
      }
    };
    if (menuOpen || showReactions) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen, showReactions]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setShowReactions(false);
      }
    };
    if (menuOpen || showReactions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, showReactions]);

  const handleMarkAsDone = async () => {
    setIsExiting(true);
    setTimeout(() => {
      onDelete?.(c.id);
    }, 400);
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    setShowReplyInput(true);
  };

  const handleReplySubmit = (content, att) => {
    onSubmitReply?.(c, content, att);
    setShowReplyInput(false);
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 1, x: 0, height: 'auto' }}
        animate={isExiting ? { opacity: 0, x: 50, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 } : { opacity: 1, x: hover ? -8 : 0 }}
        exit={{ opacity: 0, x: 50, height: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="relative group rounded-[12px] bg-[#191919] border border-white/[0.04] transition-[background-color] duration-300 ease-in-out hover:bg-[#202020] px-3 py-2 -mx-3 outline-none"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => {
          if (!menuOpen && !showReactions) setHover(false);
        }}
        tabIndex={0}
        onFocus={() => setHover(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setHover(false);
            setMenuOpen(false);
            setShowReactions(false);
          }
        }}
        onDoubleClick={handleDoubleClick}
        aria-label={`Comentário de ${c.user_name}. Clique duas vezes para responder.`}
      >
        <div className="flex gap-2.5">
          <div className="pt-0.5">
            <Avatar name={c.user_name} url={c.user_avatar} size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13.5px] font-semibold text-[#e9e9e7]">{c.user_name || 'Usuário'}</span>
              <span className="text-[11.5px] text-[#6f6e6b]">{relTime(c.created_at)}</span>
            </div>
            {text && (
              <p className="text-[14px] text-[#e9e9e7] leading-[1.5] whitespace-pre-wrap break-words mt-0.5">
                {text}
              </p>
            )}
            {attachment && (
              <button
                type="button"
                onClick={() => onOpenImage?.(attachment)}
                className="mt-2 inline-block rounded-[12px] overflow-hidden border border-white/10 bg-[#202020] hover:border-white/20 transition-all max-w-[280px] cursor-zoom-in outline-none"
              >
                <img src={attachment} alt="Anexo" className="block w-full h-auto max-h-[260px] object-cover" />
              </button>
            )}
          </div>
        </div>

        {/* Action Menu */}
        <AnimatePresence>
          {hover && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="absolute top-2 right-2 flex items-center gap-0.5 bg-[#252525]/90 backdrop-blur-md rounded-[8px] border border-white/10 p-0.5 shadow-lg z-10"
            >
              <button
                className="p-1.5 rounded-[6px] text-[#6f6e6b] hover:text-[#e9e9e7] hover:bg-white/10 transition-colors"
                title="Reagir"
                aria-label="Reagir"
                onClick={() => setShowReactions(!showReactions)}
              >
                <Smile size={14} />
              </button>
              <button
                className="p-1.5 rounded-[6px] text-[#6f6e6b] hover:text-[#e9e9e7] hover:bg-white/10 transition-colors"
                title="Marcar como concluída"
                aria-label="Marcar como concluída"
                onClick={handleMarkAsDone}
              >
                <Check size={14} />
              </button>
              <div className="relative" ref={menuRef}>
                <button
                  className={`p-1.5 rounded-[6px] transition-colors ${menuOpen ? 'text-[#e9e9e7] bg-white/10' : 'text-[#6f6e6b] hover:text-[#e9e9e7] hover:bg-white/10'}`}
                  onClick={() => setMenuOpen(!menuOpen)}
                  title="Mais opções"
                  aria-label="Mais opções"
                >
                  <MoreHorizontal size={14} />
                </button>

                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute right-0 mt-1 w-32 bg-[#252525] border border-white/10 rounded-[8px] shadow-xl overflow-hidden z-20"
                  >
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#e9e9e7] hover:bg-white/5 transition-colors text-left">
                      <Pencil size={12} /> Editar
                    </button>
                    <button 
                      onClick={() => { setShowReplyInput(true); setMenuOpen(false); setHover(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#e9e9e7] hover:bg-white/5 transition-colors text-left"
                    >
                      <Reply size={12} /> Responder
                    </button>
                    <div className="border-t border-white/5 my-0.5" />
                    <button
                      onClick={() => {
                        onDelete?.(c.id);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors text-left"
                    >
                      <Trash2 size={12} /> Excluir
                    </button>
                  </motion.div>
                )}

                {showReactions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute right-0 mt-1 flex items-center gap-1 bg-[#252525] border border-white/10 rounded-full shadow-xl p-1 z-20"
                  >
                    <button className="p-1.5 hover:bg-white/5 rounded-full transition-colors"><ThumbsUp size={14} className="text-[#e9e9e7]" /></button>
                    <button className="p-1.5 hover:bg-white/5 rounded-full transition-colors"><ThumbsDown size={14} className="text-[#e9e9e7]" /></button>
                    <button className="p-1.5 hover:bg-white/5 rounded-full transition-colors text-[14px]">❤️</button>
                    <button className="p-1.5 hover:bg-white/5 rounded-full transition-colors text-[14px]">🔥</button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Replies */}
      {replies && replies.length > 0 && (
        <div className="mt-1 space-y-1">
          {replies.map(r => (
            <div key={r.id} className="flex items-start gap-1.5 ml-[12px]">
              <CornerDownRight size={14} className="text-[#6f6e6b] mt-2 shrink-0" />
              <div className="flex-1 min-w-0">
                <CommentItem
                  c={r}
                  currentUserId={currentUserId}
                  onDelete={onDelete}
                  onOpenImage={onOpenImage}
                  onReply={onReply}
                  onSubmitReply={onSubmitReply}
                  replies={[]}
                  user={user}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline Reply Input */}
      <AnimatePresence>
        {showReplyInput && (
          <div className="flex items-start gap-1.5 ml-[12px]">
            <CornerDownRight size={14} className="text-[#6f6e6b] mt-3 shrink-0" />
            <div className="flex-1 min-w-0">
              <InlineReplyInput
                userName={user?.name}
                onSubmit={handleReplySubmit}
                onCancel={() => setShowReplyInput(false)}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default forwardRef(function PageComments({ projectId, onHasComments }, ref) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState(null); // base64
  const [submitting, setSubmitting] = useState(false);
  const [lightbox, setLightbox] = useState(null); // url da imagem aberta
  const [forceShowInput, setForceShowInput] = useState(false);
  const taRef = useRef(null);
  const fileRef = useRef(null);

  useImperativeHandle(ref, () => ({
    openInput: () => {
      setForceShowInput(true);
      setTimeout(() => taRef.current?.focus(), 50);
    }
  }));

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightbox]);

  useEffect(() => {
    if (!projectId) return;
    commentsService.list(projectId).then((data) => {
      setComments(data);
      if (onHasComments) onHasComments(data.length > 0);
    }).catch(() => {});
  }, [projectId]);

  const autoResize = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 240) + 'px';
  };

  const submit = async () => {
    const content = draft.trim();
    if ((!content && !attachment) || submitting) return;
    setSubmitting(true);
    try {
      const payload = { content };
      if (attachment) payload.attachment_base64 = attachment;
      const added = await commentsService.create(projectId, payload);
      setComments(prev => {
        const newComments = [...prev, added];
        if (onHasComments) onHasComments(newComments.length > 0);
        return newComments;
      });
      setDraft('');
      setAttachment(null);
      requestAnimationFrame(autoResize);
    } catch {}
    finally { setSubmitting(false); }
  };

  const handleReplySubmit = async (parentComment, content, att) => {
    try {
      const payload = { content: `[reply_to:${parentComment.id}] @${parentComment.user_name} ${content}` };
      if (att) payload.attachment_base64 = att;
      const added = await commentsService.create(projectId, payload);
      setComments(prev => {
        const newComments = [...prev, added];
        if (onHasComments) onHasComments(newComments.length > 0);
        return newComments;
      });
    } catch {}
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => setAttachment(ev.target.result);
    r.readAsDataURL(file);
    e.target.value = '';
  };

  const removeComment = async (id) => {
    const prev = comments;
    setComments(p => p.filter(c => c.id !== id));
    try { await commentsService.remove(projectId, id); } catch { setComments(prev); }
  };

  const showInput = comments.length > 0 || forceShowInput;
  const hasContent = draft.trim() || attachment;

  const topLevel = [];
  const repliesMap = {};

  comments.forEach(c => {
    let content = c.content || '';
    const match = content.match(/^\[reply_to:([^\]]+)\]\s*(.*)$/ms);
    // Also support fallback for parent_id if added later
    if (match || c.parent_id) {
      const parentId = match ? match[1] : c.parent_id;
      const actualContent = match ? match[2] : content;
      const parsedComment = { ...c, content: actualContent, isReply: true };
      if (!repliesMap[parentId]) repliesMap[parentId] = [];
      repliesMap[parentId].push(parsedComment);
    } else {
      topLevel.push(c);
    }
  });

  return (
    <section className="pt-2 pb-1">
      {topLevel.length > 0 && (
        <div className="space-y-1.5 mb-3">
          <AnimatePresence mode="popLayout">
            {topLevel.map(c => (
              <CommentItem 
                key={c.id} 
                c={c} 
                currentUserId={user?.id} 
                onDelete={removeComment} 
                onOpenImage={setLightbox} 
                onReply={(comment) => {
                  setDraft(prev => (prev ? prev + ' ' : '') + `@${comment.user_name} `);
                  setForceShowInput(true);
                  setTimeout(() => taRef.current?.focus(), 100);
                }}
                onSubmitReply={handleReplySubmit}
                replies={repliesMap[c.id] || []}
                user={user}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {showInput && (
        <div className="flex items-center gap-2">
          <div className="pt-0">
            <Avatar name={user?.name} url={user?.avatar_url} size={22} />
          </div>
          <div className="flex-1 min-w-0 flex items-center gap-0 rounded-[8px] border border-white/[0.08] bg-white/[0.02] focus-within:border-[#2383E2]/60 transition-colors">
            <AnimatePresence>
              {attachment && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden pl-2"
                >
                  <div className="relative">
                    <img src={attachment} alt="Preview" className="h-[28px] w-[28px] object-cover rounded-[4px] border border-white/10" />
                    <button
                      onClick={() => setAttachment(null)}
                      className="absolute -top-1 -right-1 bg-[#202020] text-white rounded-full p-0.5 border border-white/10 hover:bg-[#2a2a2a] transition-colors"
                      type="button"
                    >
                      <X size={8} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <input
              ref={taRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Responder..."
              className="flex-1 min-w-0 bg-transparent px-3 py-2 text-[13.5px] text-[#e9e9e7] placeholder:text-[#6f6e6b] outline-none"
            />

            <div className="flex items-center gap-0.5 pr-2 shrink-0">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="p-1.5 rounded-[4px] text-[#6f6e6b] hover:text-[#e9e9e7] hover:bg-white/[0.05] transition-colors"
                title="Anexar imagem"
              >
                <Paperclip size={14} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
              <button
                type="button"
                className="p-1.5 rounded-[4px] text-[#6f6e6b] hover:text-[#e9e9e7] hover:bg-white/[0.05] transition-colors"
                title="Mencionar"
              >
                <AtSign size={14} />
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!hasContent || submitting}
                className={`p-1.5 rounded-full transition-all ${hasContent && !submitting ? 'bg-[#2383E2] text-white hover:bg-[#1A6FCB]' : 'text-[#6f6e6b] bg-white/[0.04] cursor-not-allowed'}`}
                title="Enviar (Enter)"
              >
                <ArrowUp size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 cursor-zoom-out"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-white transition-colors"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
            <motion.img
              key={lightbox}
              src={lightbox}
              alt=""
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-[92vw] max-h-[88vh] object-contain rounded-[10px] shadow-[0_30px_80px_rgba(0,0,0,0.6)] cursor-default"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
});
