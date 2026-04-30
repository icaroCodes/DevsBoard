import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, ArrowUp, Trash2, X } from 'lucide-react';
import { commentsService } from '../../services/projects';
import { useAuth } from '../../contexts/AuthContext';

function relTime(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)        return 'agora';
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

function CommentItem({ c, currentUserId, onDelete, onOpenImage }) {
  const [hover, setHover] = useState(false);
  const isMine = String(c.user_id) === String(currentUserId);
  const { text, attachment } = splitAttachment(c.content);
  return (
    <div
      className="flex gap-2.5 group"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="pt-0.5">
        <Avatar name={c.user_name} url={c.user_avatar} size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[13.5px] font-semibold text-[#e9e9e7]">{c.user_name || 'Usuário'}</span>
          <span className="text-[11.5px] text-[#6f6e6b]">{relTime(c.created_at)}</span>
          {isMine && hover && (
            <button
              type="button"
              onClick={() => onDelete?.(c.id)}
              className="ml-auto p-1 rounded-[4px] text-[#6f6e6b] hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors"
              title="Excluir"
            >
              <Trash2 size={11} />
            </button>
          )}
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
            className="mt-2 inline-block rounded-[12px] overflow-hidden border border-white/10 bg-[#1C1C1E] hover:border-white/20 transition-all max-w-[280px] cursor-zoom-in outline-none"
          >
            <img src={attachment} alt="Anexo" className="block w-full h-auto max-h-[260px] object-cover" />
          </button>
        )}
      </div>
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

  return (
    <section className="pt-2 pb-1">
      {comments.length > 0 && (
        <div className="space-y-3 mb-3">
          {comments.map(c => (
            <CommentItem key={c.id} c={c} currentUserId={user?.id} onDelete={removeComment} onOpenImage={setLightbox} />
          ))}
        </div>
      )}

      {showInput && (
        <div className="flex gap-2.5">
        <div className="pt-1">
          <Avatar name={user?.name} url={user?.avatar_url} size={22} />
        </div>
        <div className="flex-1 min-w-0 rounded-[8px] border border-white/[0.07] bg-white/[0.02] focus-within:border-white/[0.14] transition-colors">
          <AnimatePresence>
            {attachment && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden px-2 pt-2"
              >
                <div className="relative inline-block">
                  <img src={attachment} alt="Preview" className="h-[72px] w-[72px] object-cover rounded-[6px] border border-white/10" />
                  <button
                    onClick={() => setAttachment(null)}
                    className="absolute -top-1.5 -right-1.5 bg-[#202020] text-white rounded-full p-0.5 border border-white/10 hover:bg-[#2a2a2a] transition-colors"
                    type="button"
                  >
                    <X size={11} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <textarea
            ref={taRef}
            value={draft}
            onChange={(e) => { setDraft(e.target.value); autoResize(); }}
            onKeyDown={onKeyDown}
            placeholder="Adicionar um comentário..."
            rows={1}
            className="w-full bg-transparent px-3 pt-2 pb-1 text-[14px] text-[#e9e9e7] placeholder:text-[#6f6e6b] outline-none resize-none leading-[1.5]"
          />

          <div className="flex items-center justify-between px-2 pb-1.5">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="p-1.5 rounded-[4px] text-[#6f6e6b] hover:text-[#e9e9e7] hover:bg-white/[0.05] transition-colors"
                title="Anexar imagem"
              >
                <Paperclip size={13} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={(!draft.trim() && !attachment) || submitting}
              className={`p-1.5 rounded-full transition-all ${(draft.trim() || attachment) && !submitting ? 'bg-[#2383E2] text-white hover:bg-[#1A6FCB]' : 'text-[#6f6e6b] bg-white/[0.04] cursor-not-allowed'}`}
              title="Enviar (Enter)"
            >
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
