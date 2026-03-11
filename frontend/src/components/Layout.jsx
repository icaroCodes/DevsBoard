import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Wallet,
  CheckSquare,
  RefreshCw,
  Target,
  Folder,
  Settings,
  Info,
  Menu,
  X,
  Scan
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Início' },
  { to: '/finances', icon: Wallet, label: 'Finanças' },
  { to: '/tasks', icon: CheckSquare, label: 'Tarefas' },
  { to: '/routines', icon: RefreshCw, label: 'Rotinas' },
  { to: '/goals', icon: Target, label: 'Metas' },
  { to: '/projects', icon: Folder, label: 'Projetos' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize(); // set initial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleExpand = (e) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  const sidebarWidth = isMobile ? 240 : (isExpanded ? 224 : 84);
  const sidebarX = isMobile ? (sidebarOpen ? 0 : -240) : 0;
  const contentMargin = isMobile ? 0 : (isExpanded ? 224 : 84);

  const Sidebar = () => (
    <motion.aside 
      initial={false}
      animate={{ 
        width: sidebarWidth,
        x: sidebarX
      }}
      transition={{ type: 'spring', stiffness: 350, damping: 35, mass: 1 }}
      className="fixed inset-y-0 left-0 z-40 bg-[#161717] border-r border-[#2C2C2C] flex flex-col shadow-2xl lg:shadow-none overflow-hidden"
    >
      <div className="p-6 border-b border-transparent flex items-center justify-start h-[88px] shrink-0 min-w-[240px]">
        <div className="flex items-center gap-4 w-full">
          {!isMobile && (
            <button onClick={handleToggleExpand} className="text-white hover:text-zinc-300 transition-colors p-1 -ml-1 rounded-md outline-none shrink-0 cursor-pointer">
              <Scan size={22} strokeWidth={1.5} />
            </button>
          )}
          <div className="overflow-hidden">
            <AnimatePresence initial={false}>
              {(isExpanded || isMobile) && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link to="/dashboard" className="text-[16px] font-semibold text-white tracking-wide whitespace-nowrap block">
                    DevsBoard
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden min-w-[224px]">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={() => isMobile && setSidebarOpen(false)}
              className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-colors duration-200 group relative ${
                isActive 
                ? 'bg-white/5 text-white' 
                : 'text-[#A1A1A1] hover:text-white hover:bg-white/5'
              }`}
              title={(!isExpanded && !isMobile) ? label : ''}
              style={{ width: isExpanded || isMobile ? '100%' : '60px' }}
            >
              <Icon size={22} className={`shrink-0 ${isActive ? 'text-white' : 'text-[#A1A1A1] group-hover:text-white'}`} strokeWidth={isActive ? 2 : 1.5} />
              <AnimatePresence initial={false}>
                {(isExpanded || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`whitespace-nowrap overflow-hidden text-[14px] ${isActive ? 'font-medium' : 'font-normal'}`}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="p-4 border-t border-[#2C2C2C] mx-3 mb-3 mt-4 flex items-center gap-3 overflow-hidden min-w-[200px] shrink-0">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="w-[36px] h-[36px] aspect-square rounded-full border border-zinc-700 shrink-0 object-cover" />
          ) : (
            <div className="w-[36px] h-[36px] aspect-square rounded-full bg-[#1e1e1e] flex items-center justify-center border border-zinc-700 shrink-0">
              <span className="text-xs font-bold text-zinc-300">{user.name?.[0]?.toUpperCase()}</span>
            </div>
          )}
          <AnimatePresence initial={false}>
            {(isExpanded || isMobile) && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <div className="whitespace-nowrap flex flex-col justify-center">
                  <p className="text-[14px] font-medium text-zinc-200 truncate">{user.name}</p>
                  <p className="text-[12px] text-zinc-500 truncate">{user.email}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.aside>
  );

  return (
    <div className="min-h-screen bg-zinc-950 selection:bg-cyan-500/30 font-[Poppins,sans-serif]">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-zinc-900/80 backdrop-blur border border-white/10 text-zinc-300 lg:hidden shadow-lg"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar />

      {/* Main content */}
      <motion.main 
        initial={false}
        animate={{ marginLeft: contentMargin }}
        transition={{ type: 'spring', stiffness: 350, damping: 35, mass: 1 }}
        className="p-6 pt-20 lg:pt-8 min-h-screen"
      >
        {children}
      </motion.main>
    </div>
  );
}
