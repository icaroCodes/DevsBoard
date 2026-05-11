import { useState } from'react';
import { api } from'../lib/api';
import { useAuth } from'../contexts/AuthContext';
import UsernameField from'./UsernameField';

const slugify = (s) =>
 String(s ??'')
 .toLowerCase()
 .normalize('NFKD')
 .replace(/[̀-ͯ]/g,'')
 .replace(/[^a-z0-9]+/g,'_')
 .replace(/^_+|_+$/g,'')
 .slice(0, 30);

/**
 * Full-screen onboarding gate. Renders when the authenticated user does not
 * yet have a username (`user.needs_onboarding === true` from /settings or
 * /profiles/me). Submitting calls PUT /profiles/me, then refreshes the user
 * so the gate goes away.
 *
 * Kept intentionally short: just username + display name. Bio, links and
 * avatar belong on /settings later — we don't want to gate dashboard access
 * on filling out a CV.
 */
export default function Onboarding() {
 const { user, refreshUser } = useAuth();
 const [username, setUsername] = useState(() => {
 const seed = user?.name || user?.email?.split('@')[0] ||'';
 let candidate = slugify(seed).replace(/^[^a-z]+/,'');
 if (candidate.length < 3) candidate = `user_${candidate}`.slice(0, 30);
 return candidate;
 });
 const [displayName, setDisplayName] = useState(user?.name ||'');
 const [validity, setValidity] = useState({ ok: false });
 const [submitting, setSubmitting] = useState(false);
 const [error, setError] = useState(null);

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!validity.ok || submitting) return;
 setSubmitting(true);
 setError(null);
 try {
 await api('/profiles/me', {
 method:'PUT',
 body: JSON.stringify({
 username: validity.username,
 display_name: displayName.trim() || null,
 }),
 });
 await refreshUser();
 } catch (err) {
 const msg = err.message ||'Erro ao salvar';
 // Map backend errors to friendly messages.
 const map = {
 username_taken:'Esse username acabou de ser pego — escolha outro.',
 invalid_username:'Username inválido.',
 reserved_username:'Username reservado pelo sistema.',
 username_unavailable:'Username indisponível.',
 };
 setError(map[msg] || msg);
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className="fixed inset-0 z-[9999] bg-zinc-950/95 backdrop-blur-sm flex items-center justify-center p-4">
 <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 sm:p-8">
 <div className="mb-6">
 <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100">
 Bem-vindo ao DevsBoard
 </h1>
 <p className="text-sm text-zinc-400 mt-1">
 Escolha um username — ele será sua identidade pública (
 <span className="text-zinc-300">/@seuusername</span>) e como times
 te convidam.
 </p>
 </div>

 <form onSubmit={handleSubmit} className="space-y-4">
 <UsernameField
 value={username}
 onChange={setUsername}
 onValidityChange={setValidity}
 autoFocus
 disabled={submitting}
 />

 <div>
 <label className="block text-sm font-medium text-zinc-300 mb-1.5">
 Nome para exibição
 <span className="text-zinc-500 font-normal"> (opcional)</span>
 </label>
 <input
 type="text"
 value={displayName}
 onChange={(e) => setDisplayName(e.target.value)}
 maxLength={80}
 disabled={submitting}
 placeholder="Como você quer ser chamado"
 className="w-full bg-zinc-900/60 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 disabled:opacity-50"
 />
 </div>

 {error && (
 <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
 {error}
 </div>
 )}

 <button
 type="submit"
 disabled={!validity.ok || submitting}
 className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-zinc-950 font-medium rounded-md py-2.5 transition-colors"
 >
 {submitting ?'Salvando…' :'Continuar'}
 </button>
 </form>

 <p className="text-xs text-zinc-500 mt-4 text-center">
 Você poderá trocar o username depois (1x a cada 30 dias).
 </p>
 </div>
 </div>
 );
}
