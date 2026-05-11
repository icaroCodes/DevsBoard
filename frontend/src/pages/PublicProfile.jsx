import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Github, Twitter, Linkedin, Globe, Calendar, Flame, Search, Loader2, Trophy, Clock, Target, ArrowRight } from 'lucide-react';
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

const TIER_COLORS = {
  bronze: 'text-[#CD7F32]',
  prata: 'text-[#C0C0C0]',
  ouro: 'text-[#FFD700]',
  platina: 'text-[#E5E4E2]'
};

export default function PublicProfile() {
  const { atUsername } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, profile: null, error: null });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

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
    setSearchQuery('');
    setShowDropdown(false);

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

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const timer = setTimeout(() => {
      setIsSearching(true);
      api(`/public/search/users?q=${encodeURIComponent(searchQuery)}`)
        .then(res => {
          setSearchResults(res);
          setIsSearching(false);
          setShowDropdown(true);
        })
        .catch(() => setIsSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!username) return <NotFound />;
  
  if (state.loading) {
    return (
      <div className="min-h-screen font-[Poppins,sans-serif]" style={{ backgroundColor: '#191919' }}>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
        </div>
      </div>
    );
  }
  
  if (state.error || !state.profile) return <NotFound />;

  const p = state.profile;
  const memberSince = formatDate(p.created_at);
  const links = Object.entries(p.social_links || {}).filter(([, v]) => v);

  return (
    <div className="min-h-screen font-[Poppins,sans-serif] text-zinc-100" style={{ backgroundColor: '#191919' }}>
      {/* HEADER WITH APPLE-STYLE SEARCH */}
      <header className="border-b border-white/5 bg-[#1C1C1E]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4 sm:gap-8">
          <Link to="/" className="shrink-0">
            <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center font-bold text-white tracking-tighter">
              DB
            </div>
          </Link>
          
          <div className="flex-1 max-w-md relative" ref={searchRef}>
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Pesquisar usuários..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                className="w-full bg-[#2C2C2E] border border-transparent focus:border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-all"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 w-4 h-4 text-zinc-500 animate-spin" />
              )}
            </div>

            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#2C2C2E] border border-white/10 shadow-2xl rounded-2xl overflow-hidden z-50 py-2">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setShowDropdown(false);
                      setSearchQuery('');
                      navigate(`/@${user.username}`);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors text-left"
                  >
                    {user.avatar_url ? (
                      <img src={user.avatar_url} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#1C1C1E] flex items-center justify-center font-semibold text-xs text-white">
                        {(user.display_name || user.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{user.display_name}</div>
                      <div className="text-xs text-zinc-500 truncate">@{user.username}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex flex-col md:flex-row gap-10">
          {/* SIDEBAR: Avatar & Bio */}
          <div className="md:w-72 shrink-0">
            <div className="relative group">
              {p.avatar_url ? (
                <img
                  src={p.avatar_url}
                  alt={p.display_name}
                  className="w-full aspect-square rounded-[2rem] object-cover border-4 border-[#1C1C1E] shadow-2xl"
                />
              ) : (
                <div className="w-full aspect-square rounded-[2rem] bg-[#2C2C2E] border-4 border-[#1C1C1E] shadow-2xl flex items-center justify-center text-7xl font-bold text-white/20">
                  {(p.display_name || p.username || '?').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-6 tracking-tight">
              {p.display_name || p.username}
            </h1>
            <p className="text-lg text-zinc-400 mt-1">@{p.username}</p>

            {p.bio && (
              <p className="text-zinc-300 mt-5 leading-relaxed whitespace-pre-line text-[15px]">
                {p.bio}
              </p>
            )}

            <div className="flex items-center gap-2 mt-6 text-sm text-zinc-500 font-medium">
              <Calendar size={16} />
              Membro desde {memberSince}
            </div>

            {links.length > 0 && (
              <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-white/5">
                {links.map(([key, url]) => {
                  const Icon = SOCIAL_ICONS[key] || Globe;
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer me"
                      className="flex items-center gap-3 text-[14px] font-medium text-zinc-400 hover:text-white transition-colors group"
                    >
                      <Icon size={18} className="group-hover:scale-110 transition-transform" />
                      {url.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* MAIN CONTENT: Stats & Achievements */}
          <div className="flex-1 min-w-0">
            {p.stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#1C1C1E] rounded-3xl p-5 border border-white/[0.04]">
                  <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Clock size={12} /> Horas no Projeto
                  </div>
                  <div className="text-3xl font-black text-white tracking-tight">
                    {p.stats.total_hours}<span className="text-base font-semibold text-zinc-500 ml-0.5">h</span>
                  </div>
                </div>

                <div className="bg-[#1C1C1E] rounded-3xl p-5 border border-white/[0.04]">
                  <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Target size={12} /> Maior Sessão
                  </div>
                  <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-1">
                    {p.stats.longest_session_hours}<span className="text-base font-semibold text-zinc-500 mr-1">h</span>
                    {p.stats.longest_session_minutes}<span className="text-base font-semibold text-zinc-500">m</span>
                  </div>
                </div>

                <div className="bg-[#1C1C1E] rounded-3xl p-5 border border-white/[0.04] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-[11px] font-bold text-orange-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Flame size={12} /> Streak Atual
                  </div>
                  <div className="text-3xl font-black text-white tracking-tight">
                    {p.current_streak} <span className="text-base font-semibold text-zinc-500">dias</span>
                  </div>
                </div>

                <div className="bg-[#1C1C1E] rounded-3xl p-5 border border-white/[0.04]">
                  <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Trophy size={12} /> Conquistas
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white tracking-tight">{p.stats.achievements_unlocked}</span>
                    <span className="text-sm font-semibold text-zinc-500">/ {p.stats.achievements_total}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-3 overflow-hidden">
                    <div 
                      className="bg-[#30D158] h-full rounded-full" 
                      style={{ width: `${p.stats.achievements_percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {p.stats?.top_achievements?.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[15px] font-bold text-white">Principais Conquistas</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {p.stats.top_achievements.map((ach) => (
                    <div key={ach.slug} className="bg-[#1C1C1E] rounded-3xl p-5 border border-white/[0.04] flex flex-col items-center text-center group hover:bg-[#2C2C2E] transition-colors">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform shadow-inner">
                        {ach.icon}
                      </div>
                      <h3 className="font-bold text-white text-[15px] mb-1">{ach.name}</h3>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${TIER_COLORS[ach.tier] || 'text-zinc-500'}`}>
                        {ach.tier}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
