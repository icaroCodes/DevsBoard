import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  Check,
  X,
  Clock,
  MailPlus,
  Shield,
  Send,
  ChevronDown,
} from 'lucide-react';
import Sheet from './Sheet';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmModalContext';
import { useRealtime, useRealtimeSubscription } from '../../contexts/RealtimeContext';

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function InboxSheet({ open, onClose }) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const { confirm } = useConfirm();

  const [inbox, setInbox] = useState([]);
  const [sentInvites, setSentInvites] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('received'); // 'received' | 'sent'

  const fetchInbox = useCallback(async () => {
    try {
      const data = await api('/teams/invitations/inbox');
      setInbox(data || []);
    } catch (err) {
      console.error('Erro ao carregar inbox:', err);
    }
  }, []);

  const fetchSent = useCallback(async () => {
    try {
      const data = await api('/teams/invitations/sent');
      setSentInvites(data || []);
    } catch (err) {
      console.error('Erro ao carregar convites enviados:', err);
    }
  }, []);

  const fetchChangeRequests = useCallback(async () => {
    try {
      const data = await api('/teams/change-requests/inbox');
      setChangeRequests(data || []);
    } catch (err) {
      console.error('Erro ao buscar requests:', err);
    }
  }, []);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    Promise.all([fetchInbox(), fetchSent(), fetchChangeRequests()]).finally(() =>
      setLoading(false)
    );
  }, [open, user, fetchInbox, fetchSent, fetchChangeRequests]);

  // Realtime updates
  useRealtimeSubscription(
    ['team_invitations', 'team_invitations_sent', 'change_requests'],
    () => {
      if (open) {
        fetchInbox();
        fetchSent();
        fetchChangeRequests();
      }
    }
  );

  const handleAccept = async (invitationId) => {
    try {
      const result = await api(`/teams/invitations/${invitationId}/accept`, {
        method: 'POST',
      });
      success(result.message || 'Convite aceito!');
      fetchInbox();
    } catch (err) {
      toastError(err.message);
    }
  };

  const handleReject = async (invitationId) => {
    confirm({
      title: 'Rejeitar convite?',
      message: 'Tem certeza que deseja rejeitar este convite?',
      onConfirm: async () => {
        try {
          await api(`/teams/invitations/${invitationId}/reject`, { method: 'POST' });
          success('Convite rejeitado.');
          fetchInbox();
        } catch (err) {
          toastError(err.message);
        }
      },
    });
  };

  const handleApproveChange = async (reqId) => {
    try {
      await api(`/teams/change-requests/${reqId}/approve`, { method: 'POST' });
      success('Alteração aprovada.');
      fetchChangeRequests();
    } catch (err) {
      toastError(err.message);
    }
  };

  const handleRejectChange = async (reqId) => {
    try {
      await api(`/teams/change-requests/${reqId}/reject`, { method: 'POST' });
      success('Alteração rejeitada.');
      fetchChangeRequests();
    } catch (err) {
      toastError(err.message);
    }
  };

  const receivedCount = inbox.length + changeRequests.length;
  const sentCount = sentInvites.length;
  const totalCount = receivedCount + sentCount;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Caixa de Entrada"
      maxHeight="90dvh"
    >
      <div className="px-4 pb-6">
        {/* Segmented tabs */}
        <div className="relative flex p-1 mb-4 bg-[#0F0F11] rounded-[12px] border border-white/[0.04]">
          {[
            { id: 'received', label: 'Recebidos', count: receivedCount },
            { id: 'sent', label: 'Enviados', count: sentCount },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative flex-1 py-2 rounded-[8px] text-[12.5px] font-semibold tracking-tight transition-colors z-10 outline-none flex items-center justify-center gap-1.5 ${
                tab === t.id ? 'text-[#F5F5F7]' : 'text-[#86868B]'
              }`}
            >
              {tab === t.id && (
                <motion.div
                  layoutId="inboxTab"
                  className="absolute inset-0 bg-[#2C2C2E] rounded-[8px] -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              {t.label}
              {t.count > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9.5px] font-bold ${
                    tab === t.id
                      ? 'bg-white/20 text-white'
                      : 'bg-white/[0.06] text-[#86868B]'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'received' && (
            <motion.div
              key="received"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {/* Change requests */}
              {changeRequests.map((req) => (
                <div
                  key={`cr-${req.id}`}
                  className="rounded-[14px] bg-white/[0.03] border border-white/[0.05] p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[10px] bg-[#0A84FF]/10 flex items-center justify-center shrink-0">
                      <Shield size={16} className="text-[#0A84FF]" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-[#F5F5F7] truncate">
                        {req.user?.name || 'Membro'}
                      </p>
                      <p className="text-[11px] text-[#86868B] truncate">
                        Solicitação no time{' '}
                        <span className="text-white/70">{req.team?.name}</span>
                      </p>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-[#0A84FF]/10 text-[#0A84FF] text-[9px] font-black uppercase shrink-0">
                      {req.action_type === 'create'
                        ? 'CRIAR'
                        : req.action_type === 'delete'
                          ? 'APAGAR'
                          : 'EDITAR'}
                    </span>
                  </div>

                  {/* Payload preview */}
                  <div className="bg-black/30 rounded-[10px] p-3 border border-white/[0.04]">
                    <p className="text-[10px] font-mono text-[#86868B] line-clamp-3 leading-relaxed break-all">
                      {JSON.stringify(req.payload, null, 2)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApproveChange(req.id)}
                      className="flex-1 py-2.5 rounded-[10px] bg-white text-black text-[13px] font-bold active:scale-[0.97] transition-transform"
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectChange(req.id)}
                      className="flex-1 py-2.5 rounded-[10px] bg-[#2C2C2E] text-[#86868B] text-[13px] font-bold active:scale-[0.97] transition-transform border border-white/[0.05]"
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              ))}

              {/* Invitations */}
              {inbox.map((invitation) => (
                <div
                  key={`inv-${invitation.id}`}
                  className="rounded-[14px] bg-white/[0.03] border border-white/[0.05] p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#FF9F0A]/15 to-[#FF375F]/15 border border-white/[0.06] flex items-center justify-center shrink-0">
                      <MailPlus size={18} className="text-amber-400" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#F5F5F7]">
                        Convite para{' '}
                        <span className="text-[#0A84FF]">
                          {invitation.team?.name || 'Time'}
                        </span>
                      </p>
                      <p className="text-[12px] text-[#86868B] mt-0.5 line-clamp-2">
                        <span className="text-zinc-300 font-medium">
                          {invitation.invited_by_user?.name || 'Alguém'}
                        </span>{' '}
                        convidou você para{' '}
                        {invitation.team?.type === 'family'
                          ? 'a família'
                          : 'o time'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock size={10} className="text-[#86868B]" />
                        <span className="text-[10.5px] text-[#86868B]">
                          {timeAgo(invitation.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAccept(invitation.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-[#30D158] text-white text-[13px] font-bold active:scale-[0.97] transition-transform"
                    >
                      <Check size={14} strokeWidth={2.5} /> Aceitar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(invitation.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-[#FF3B30]/10 text-[#FF6961] text-[13px] font-bold active:scale-[0.97] transition-transform border border-[#FF3B30]/20"
                    >
                      <X size={14} strokeWidth={2.5} /> Rejeitar
                    </button>
                  </div>
                </div>
              ))}

              {/* Empty state */}
              {receivedCount === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-12">
                  <div className="w-12 h-12 rounded-[14px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <Inbox size={22} className="text-[#5A5A5F]" strokeWidth={1.5} />
                  </div>
                  <p className="text-[13.5px] font-medium text-[#86868B] text-center">
                    Caixa de entrada vazia
                  </p>
                  <p className="text-[12px] text-[#5A5A5F] text-center px-6">
                    Convites e solicitações de times aparecerão aqui.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'sent' && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-2"
            >
              {sentInvites.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12">
                  <div className="w-12 h-12 rounded-[14px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <Send size={20} className="text-[#5A5A5F]" strokeWidth={1.5} />
                  </div>
                  <p className="text-[13.5px] font-medium text-[#86868B] text-center">
                    Nenhum convite enviado
                  </p>
                </div>
              ) : (
                sentInvites.map((inv) => (
                  <div
                    key={`sent-${inv.id}`}
                    className="flex items-center gap-3 p-3.5 rounded-[14px] bg-white/[0.03] border border-white/[0.05]"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#2C2C2E] flex items-center justify-center shrink-0 border border-white/[0.06]">
                      <Send size={14} className="text-[#86868B]" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-medium text-[#F5F5F7] truncate">
                        {inv.invited_email || inv.email || 'Convidado'}
                      </p>
                      <p className="text-[11px] text-[#86868B] truncate">
                        {inv.team?.name || 'Time'} · {inv.status || 'pendente'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={10} className="text-[#5A5A5F]" />
                      <span className="text-[10px] text-[#5A5A5F] font-medium">
                        {timeAgo(inv.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  );
}
