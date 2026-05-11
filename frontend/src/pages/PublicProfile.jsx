import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Globe, Calendar, Flame } from 'lucide-react';
import { api } from '../lib/api';
import NotFound from './NotFound';

const SOCIAL_ICONS = {
  github: Github,
  twitter: Twitter,
  linkedin: Linkedin,
  website: Globe,
};

const formatDate = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
    });
  } catch {
    return null;
  }
};

/**
 * Public profile page — mounted at /:atUsername. The URL segment must start
 * with `@` (e.g. /@icarocodes); anything else falls through to NotFound so
 * we don't accidentally swallow misspelled app routes.
 *
 * Anonymous-friendly: the API call hits /public/profile/:username which is
 * mounted before the auth middleware on the backend.
 */
export default function PublicProfile() {
  const { atUsername } = useParams();
  const [state, setState] = useState({ loading: true, profile: null, error: null });

  // Reject anything that isn't `@something`. NotFound handles it.
  const username =
    typeof atUsername === 'string' && atUsername.startsWith('@')
      ? atUsername.slice(1)
      : null;

  useEffect(() => {
    if (!username) {
      setState({ loading: false, profile: null, error: 'invalid' });
      return;
    }

    let cancelled = false;
    setState({ loading: true, profile: null, error: null });

    api(`/public/profile/${encodeURIComponent(username)}`)
      .then((data) => {
        if (cancelled) return;
        setState({ loading: false, profile: data, error: null });
        document.title = `@${data.username} · DevsBoard`;
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ loading: false, profile: null, error: err.message || 'erro' });
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  if (!username) return <NotFound />;
  if (state.loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="text-zinc-500">Carregando…</div>
      </div>
    );
  }
  if (state.error || !state.profile) return <NotFound />;

  const p = state.profile;
  const memberSince = formatDate(p.created_at);
  const links = Object.entries(p.social_links || {}).filter(([, v]) => v);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="text-sm font-semibold text-zinc-400 hover:text-zinc-200">
            DevsBoard
          </Link>
          <Link
            to="/"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="shrink-0">
            {p.avatar_url ? (
              <img
                src={p.avatar_url}
                alt={`Avatar de ${p.display_name || p.username}`}
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-2 border-zinc-800 object-cover"
              />
            ) : (
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-4xl font-semibold text-zinc-400">
                {(p.display_name || p.username || '?').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">
              {p.display_name || p.username}
            </h1>
            <p className="text-zinc-400 text-base mt-0.5">@{p.username}</p>

            {p.bio && (
              <p className="text-zinc-300 mt-4 leading-relaxed whitespace-pre-line">
                {p.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 text-sm text-zinc-400">
              {memberSince && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} />
                  Membro desde {memberSince}
                </span>
              )}
              {p.longest_streak > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Flame size={14} className="text-orange-400" />
                  {p.longest_streak} dias de streak máximo
                </span>
              )}
            </div>

            {links.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {links.map(([key, url]) => {
                  const Icon = SOCIAL_ICONS[key] || Globe;
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer me"
                      className="inline-flex items-center gap-2 text-sm bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 rounded-md px-3 py-1.5 text-zinc-300 transition-colors"
                    >
                      <Icon size={14} />
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
