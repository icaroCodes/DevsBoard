import { useEffect, useState } from'react';
import { useParams, useNavigate, Link } from'react-router-dom';
import { Users, Check, AlertCircle } from'lucide-react';
import { api } from'../lib/api';
import { useAuth } from'../contexts/AuthContext';

const ERROR_MESSAGES = {
 invite_link_invalid:'Este link de convite é inválido.',
 invite_link_expired:'Este link de convite expirou. Peça um novo ao admin do time.',
 team_not_found:'O time não existe mais.',
 token_missing:'Link de convite incompleto.',
};

/**
 * /invite/:token — handles the full invite-link flow.
 *
 * 1. Fetch a public preview (team + inviter) via GET /public/invite/:token.
 * That works for anonymous visitors so we can show"Alice invited you to
 * Acme Inc." before they sign in.
 * 2. If the visitor is logged in → POST /teams/invitations/accept-link;
 * on success, redirect to /teams (or dashboard).
 * 3. If logged out → show a"Sign in to join" button that takes them to
 * /auth and comes back to this page after auth (we stash the token in
 * sessionStorage; the post-auth redirect picks it back up).
 */
export default function InviteLink() {
 const { token } = useParams();
 const { user } = useAuth();
 const navigate = useNavigate();
 const [preview, setPreview] = useState(null);
 const [error, setError] = useState(null);
 const [loading, setLoading] = useState(true);
 const [accepting, setAccepting] = useState(false);
 const [accepted, setAccepted] = useState(false);

 useEffect(() => {
 if (!token) {
 setError('token_missing');
 setLoading(false);
 return;
 }

 let cancelled = false;
 api(`/public/invite/${encodeURIComponent(token)}`)
 .then((data) => {
 if (cancelled) return;
 setPreview(data);
 setLoading(false);
 })
 .catch((err) => {
 if (cancelled) return;
 setError(err.message ||'invite_link_invalid');
 setLoading(false);
 });

 return () => {
 cancelled = true;
 };
 }, [token]);

 const handleAccept = async () => {
 if (accepting || !user) return;
 setAccepting(true);
 setError(null);
 try {
 const result = await api('/teams/invitations/accept-link', {
 method:'POST',
 body: JSON.stringify({ token }),
 });
 setAccepted(true);
 // Brief pause so the user sees the confirmation before we redirect.
 setTimeout(() => {
 navigate('/teams', {
 state: { joinedTeamId: result?.team?.id, alreadyMember: result?.already_member },
 });
 }, 800);
 } catch (err) {
 setError(err.message ||'invite_link_invalid');
 setAccepting(false);
 }
 };

 const handleSignIn = () => {
 sessionStorage.setItem('devsboard:pendingInvite', token);
 navigate('/auth');
 };

 if (loading) {
 return (
 <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
 <div className="text-zinc-500">Carregando convite…</div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
 <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 sm:p-8">
 {error ? (
 <div className="text-center">
 <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
 <AlertCircle size={24} className="text-red-400" />
 </div>
 <h1 className="text-lg font-semibold text-zinc-100 mb-2">Convite indisponível</h1>
 <p className="text-sm text-zinc-400 mb-6">
 {ERROR_MESSAGES[error] ||'Não foi possível abrir este convite.'}
 </p>
 <Link
 to="/"
 className="inline-block bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md px-4 py-2 text-sm transition-colors"
 >
 Voltar ao início
 </Link>
 </div>
 ) : accepted ? (
 <div className="text-center">
 <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
 <Check size={24} className="text-emerald-400" />
 </div>
 <h1 className="text-lg font-semibold text-zinc-100 mb-1">Você entrou no time!</h1>
 <p className="text-sm text-zinc-400">Redirecionando…</p>
 </div>
 ) : (
 <>
 <div className="flex flex-col items-center text-center mb-6">
 {preview?.team?.avatar_url ? (
 <img
 src={preview.team.avatar_url}
 alt=""
 className="w-16 h-16 rounded-full border-2 border-zinc-800 object-cover mb-3"
 />
 ) : (
 <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center mb-3">
 <Users size={26} className="text-zinc-400" />
 </div>
 )}
 <h1 className="text-xl font-semibold text-zinc-100">
 {preview?.team?.name ||'Time'}
 </h1>
 <p className="text-sm text-zinc-400 mt-1">
 {preview?.inviter ? (
 <>
 <span className="text-zinc-200">
 {preview.inviter.name}
 {preview.inviter.username ? ` (@${preview.inviter.username})` :''}
 </span>{''}
 convidou você para entrar como{''}
 <span className="text-zinc-200">{preview?.role ||'membro'}</span>.
 </>
 ) : (
 <>Você foi convidado para este time.</>
 )}
 </p>
 </div>

 {user ? (
 <button
 onClick={handleAccept}
 disabled={accepting}
 className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-zinc-950 font-medium rounded-md py-2.5 transition-colors"
 >
 {accepting ?'Entrando…' :'Aceitar convite'}
 </button>
 ) : (
 <>
 <button
 onClick={handleSignIn}
 className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium rounded-md py-2.5 transition-colors"
 >
 Faça login para entrar
 </button>
 <p className="text-xs text-zinc-500 text-center mt-3">
 Você voltará automaticamente aqui após entrar.
 </p>
 </>
 )}
 </>
 )}
 </div>
 </div>
 );
}
