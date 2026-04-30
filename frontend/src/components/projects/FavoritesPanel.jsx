import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Search, ChevronRight, ChevronLeft, Plus, Inbox, Bell, Trash2, BookOpen, HelpCircle, Home,
} from 'lucide-react';
import { projectsService } from '../../services/projects';
import { useFavorites } from '../../hooks/useFavorites';
import { useAuth } from '../../contexts/AuthContext';

export default function ProjectSidebar() {
  const { id: currentId } = useParams();
  const navigate = useNavigate();
  const { user, activeTeam } = useAuth();
  const [projects, setProjects] = useState([]);
  const [q, setQ] = useState('');
  const { favs, isFav, toggle } = useFavorites();

  useEffect(() => {
    projectsService.list().then(setProjects).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const updated = e.detail;
      setProjects(prev => prev.map(p => String(p.id) === String(updated.id) ? { ...p, ...updated } : p));
    };
    window.addEventListener('project-updated', handler);
    return () => window.removeEventListener('project-updated', handler);
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter(p => p.name.toLowerCase().includes(term));
  }, [projects, q]);

  const favorites = filtered.filter(p => favs.has(p.id));
  const others    = filtered.filter(p => !favs.has(p.id));

  const createProject = async () => {
    try {
      const p = await projectsService.create({ name: 'Sem título' });
      setProjects(prev => [p, ...prev]);
      navigate(`/projects/${p.id}`);
    } catch {}
  };

  const Item = ({ p }) => {
    const active = String(p.id) === String(currentId);
    return (
      <div className="group relative flex items-center">
        <Link
          to={`/projects/${p.id}`}
          className={`flex-1 min-w-0 flex items-center gap-1.5 pl-2 pr-1 py-[5px] rounded-[6px] transition-colors text-[14px] ${active ? 'bg-white/[0.07] text-[#F5F5F7]' : 'text-[#9b9a97] hover:text-[#F5F5F7] hover:bg-white/[0.035]'}`}
        >
          <ChevronRight size={12} className="shrink-0 text-[#6f6e6b] opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="shrink-0 flex items-center justify-center -ml-0.5 w-[16px] h-[16px]">
            {p.logo_url ? (
              <img src={p.logo_url} alt="" className="w-full h-full object-cover rounded-[3px]" />
            ) : (
              <span className="text-[15px] leading-none">{p.icon || '📄'}</span>
            )}
          </span>
          <span className="truncate font-normal">{p.name || 'Sem título'}</span>
        </Link>
        <button
          type="button"
          onClick={() => toggle(p.id)}
          className={`absolute right-1 p-1 rounded-[4px] transition-all ${isFav(p.id) ? 'text-[#FFB800] opacity-100' : 'text-[#6f6e6b] opacity-0 group-hover:opacity-100 hover:bg-white/[0.06] hover:text-[#FFB800]'}`}
          aria-label="Favoritar"
        >
          <Star size={12} strokeWidth={2} fill={isFav(p.id) ? 'currentColor' : 'none'} />
        </button>
      </div>
    );
  };

  return (
    <aside
      className="fixed top-0 left-0 z-40 h-screen w-[260px] flex flex-col border-r border-black/40"
      style={{ background: '#202020' }}
    >
      {/* HEADER — workspace + voltar */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <button
          onClick={() => navigate('/projects')}
          className="w-full flex items-center gap-2 px-1.5 py-1 rounded-[6px] text-[#9b9a97] hover:text-[#F5F5F7] hover:bg-white/[0.04] transition-colors group"
          title="Voltar para Projetos"
        >
          <ChevronLeft size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[13.5px] font-semibold text-[#F5F5F7] truncate leading-tight">
              {activeTeam?.name || user?.name || 'Workspace'}
            </p>
          </div>
        </button>
      </div>

      {/* AÇÕES rápidas (busca / nova página) */}
      <div className="px-3 pb-2 shrink-0 space-y-0.5">
        <div className="flex items-center gap-2 px-2 py-1 rounded-[6px] hover:bg-white/[0.035] transition-colors">
          <Search size={14} className="text-[#9b9a97] shrink-0" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar"
            className="flex-1 bg-transparent text-[14px] text-[#F5F5F7] placeholder:text-[#6f6e6b] outline-none"
          />
        </div>
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-2 py-1 rounded-[6px] text-[14px] text-[#9b9a97] hover:text-[#F5F5F7] hover:bg-white/[0.035] transition-colors"
        >
          <Home size={14} className="shrink-0" />
          <span>Início</span>
        </Link>
        <Link
          to="/tasks"
          className="flex items-center gap-2 px-2 py-1 rounded-[6px] text-[14px] text-[#9b9a97] hover:text-[#F5F5F7] hover:bg-white/[0.035] transition-colors"
        >
          <Inbox size={14} className="shrink-0" />
          <span>Tarefas</span>
        </Link>
      </div>

      {/* PÁGINAS */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-2 min-h-0">
        <AnimatePresence initial={false}>
          {favorites.length > 0 && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 38 }}
              className="overflow-hidden mt-3"
            >
              <header className="flex items-center justify-between px-2 mb-1">
                <span className="text-[12px] font-medium text-[#6f6e6b]">Favoritos</span>
              </header>
              <div className="space-y-0.5">
                {favorites.map(p => <Item key={p.id} p={p} />)}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <section className="mt-3">
          <header className="group flex items-center justify-between px-2 mb-1">
            <span className="text-[12px] font-medium text-[#6f6e6b]">Particular</span>
            <button
              onClick={createProject}
              className="p-0.5 rounded-[4px] text-[#6f6e6b] hover:text-[#F5F5F7] hover:bg-white/[0.06] transition-colors opacity-0 group-hover:opacity-100"
              title="Nova página"
            >
              <Plus size={12} />
            </button>
          </header>
          <div className="space-y-0.5">
            {others.length > 0
              ? others.map(p => <Item key={p.id} p={p} />)
              : <p className="text-[12.5px] text-[#6f6e6b] px-2 py-1 italic">Sem páginas.</p>}
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <div className="shrink-0 px-3 py-2 border-t border-black/30 space-y-0.5">
        <Link to="/achievements" className="flex items-center gap-2 px-2 py-1 rounded-[6px] text-[14px] text-[#9b9a97] hover:text-[#F5F5F7] hover:bg-white/[0.035] transition-colors">
          <BookOpen size={14} /> Conquistas
        </Link>
        <Link to="/settings" className="flex items-center gap-2 px-2 py-1 rounded-[6px] text-[14px] text-[#9b9a97] hover:text-[#F5F5F7] hover:bg-white/[0.035] transition-colors">
          <HelpCircle size={14} /> Configurações
        </Link>
      </div>
    </aside>
  );
}
