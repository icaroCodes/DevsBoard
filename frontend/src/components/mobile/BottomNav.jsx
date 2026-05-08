import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, CheckSquare, Folder, Users, MoreHorizontal } from 'lucide-react';

const TABS = [
  { to: '/dashboard', icon: Flame, label: 'Início' },
  { to: '/tasks', icon: CheckSquare, label: 'Tarefas' },
  { to: '/projects', icon: Folder, label: 'Projetos' },
  { to: '/teams', icon: Users, label: 'Equipes' },
  { key: 'more', icon: MoreHorizontal, label: 'Mais' },
];

/**
 * Bottom tab bar. Five thumb-zone targets.
 * The fifth slot opens the More sheet (passed via onMoreClick).
 * Active tab is matched by pathname prefix so /projects/:slug stays active.
 */
export default function BottomNav({ onMoreClick, moreOpen = false }) {
  const location = useLocation();

  const isActive = (to) => {
    if (!to) return false;
    if (to === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(to);
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[55] border-t border-white/[0.06]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'rgba(20,20,20,0.85)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
      }}
    >
      <ul className="grid grid-cols-5 px-2 pt-1.5 pb-1.5">
        {TABS.map((tab) => {
          const active = tab.key === 'more' ? moreOpen : isActive(tab.to);
          const Icon = tab.icon;

          const content = (
            <div className="relative flex flex-col items-center justify-center gap-1 py-1.5 select-none">
              {active && (
                <motion.div
                  layoutId="bottom-nav-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-x-3 top-0 h-[3px] rounded-full bg-[#F5F5F7]"
                />
              )}
              <motion.div
                whileTap={{ scale: 0.86 }}
                transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                className="flex items-center justify-center"
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.7}
                  className={active ? 'text-[#F5F5F7]' : 'text-[#86868B]'}
                />
              </motion.div>
              <span
                className={`text-[10.5px] font-medium tracking-tight transition-colors ${
                  active ? 'text-[#F5F5F7]' : 'text-[#86868B]'
                }`}
              >
                {tab.label}
              </span>
            </div>
          );

          return (
            <li key={tab.to || tab.key} className="min-w-0">
              {tab.key === 'more' ? (
                <button
                  type="button"
                  onClick={onMoreClick}
                  aria-label="Mais opções"
                  aria-expanded={moreOpen}
                  className="w-full outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-lg"
                >
                  {content}
                </button>
              ) : (
                <Link
                  to={tab.to}
                  className="block outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-lg"
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
