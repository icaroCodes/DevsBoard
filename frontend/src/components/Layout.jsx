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
  Scan,
  Users,
  Bell
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../contexts/RealtimeContext';
import { api } from '../lib/api';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Início' },
  { to: '/finances', icon: Wallet, label: 'Finanças' },
  { to: '/tasks', icon: CheckSquare, label: 'Tarefas' },
  { to: '/routines', icon: RefreshCw, label: 'Rotinas' },
  { to: '/goals', icon: Target, label: 'Metas' },
  { to: '/projects', icon: Folder, label: 'Projetos' },
  { to: '/teams', icon: Users, label: 'Times' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { user, activeTeam, switchAccount, switchTeam, logout } = useAuth();
  const { notifications } = useRealtime();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [teams, setTeams] = useState([]);
  const [recentAccounts, setRecentAccounts] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize(); // set initial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user) {
      const recent = JSON.parse(localStorage.getItem('recentAccounts') || '[]');
      setRecentAccounts(recent);
      
      api('/teams').then(setTeams).catch(console.error);
    }
  }, [user]);

  // Fechar switcher ao clicar fora (opcional, mas bom pra UX)
  useEffect(() => {
    if (!showSwitcher) return;
    const handleClick = () => setShowSwitcher(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showSwitcher]);

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
              className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-colors duration-200 group relative ${isActive
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
              {to === '/teams' && (notifications?.length > 0) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF453A] text-[10px] font-bold text-white shadow-lg animate-pulse">
                  {notifications.length}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="relative border-t border-[#2C2C2C] mx-3 mb-3 mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSwitcher(!showSwitcher);
            }}
            className="w-full p-4 flex items-center gap-3 overflow-hidden min-w-[200px] shrink-0 hover:bg-white/5 transition-colors rounded-xl outline-none"
          >
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
                  <div className="whitespace-nowrap flex flex-col justify-center text-left">
                    <p className="text-[14px] font-medium text-zinc-200 truncate">
                      {activeTeam ? activeTeam.name : user.name}
                      {activeTeam && <span className="ml-2 text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded uppercase tracking-wider">Time</span>}
                    </p>
                    <p className="text-[12px] text-zinc-500 truncate">{user.email}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {(isExpanded || isMobile) && (
              <motion.div
                animate={{ rotate: showSwitcher ? 180 : 0 }}
                className="text-zinc-500"
              >
                <Folder size={14} className="rotate-90" />
              </motion.div>
            )}
          </button>

          <AnimatePresence>
            {showSwitcher && (isExpanded || isMobile) && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-0 w-full mb-2 bg-[#1C1C1E] border border-[#2C2C2C] rounded-2xl shadow-2xl overflow-hidden z-50 p-2"
              >
                <div className="px-3 py-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Suas Contas</span>
                  <Link to="/auth" className="text-cyan-500 hover:text-cyan-400" title="Adicionar Conta">
                    <X size={12} className="rotate-45" />
                  </Link>
                </div>
                
                <div className="space-y-1 max-h-[160px] overflow-y-auto custom-scrollbar">
                  {recentAccounts.map((acc) => (
                    <button
                      key={acc.user.id}
                      onClick={() => {
                        switchAccount(acc.token, acc.user);
                        setShowSwitcher(false);
                      }}
                      className={`w-full p-2 flex items-center gap-3 rounded-xl transition-colors ${acc.user.id === user.id && !activeTeam ? 'bg-white/5 border border-white/10' : 'hover:bg-white/5 border border-transparent'}`}
                    >
                      {acc.user.avatar_url ? (
                        <img src={acc.user.avatar_url} alt={acc.user.name} className="w-[28px] h-[28px] rounded-full object-cover" />
                      ) : (
                        <div className="w-[28px] h-[28px] rounded-full bg-[#2C2C2C] flex items-center justify-center text-[10px] text-zinc-400">
                          {acc.user.name?.[0]}
                        </div>
                      )}
                      <div className="flex-1 text-left truncate">
                        <p className="text-[13px] text-zinc-200 truncate">{acc.user.name}</p>
                      </div>
                      {acc.user.id === user.id && !activeTeam && (
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-[#2C2C2C]">
                  <div className="px-3 py-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Equipes & Famílias
                  </div>
                  <div className="space-y-1 max-h-[160px] overflow-y-auto custom-scrollbar">
                    {teams.length === 0 ? (
                      <p className="px-3 py-2 text-[12px] text-zinc-600 italic">Nenhuma equipe encontrada</p>
                    ) : (
                      teams.map((team) => (
                        <button
                          key={team.id}
                          onClick={() => {
                            switchTeam(team);
                            setShowSwitcher(false);
                          }}
                          className={`w-full p-2 flex items-center gap-3 rounded-xl transition-colors ${activeTeam?.id === team.id ? 'bg-white/5 border border-white/10' : 'hover:bg-white/5 border border-transparent'}`}
                        >
                          <div className={`w-[28px] h-[28px] rounded-full ${team.type === 'family' ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/20 text-cyan-400'} flex items-center justify-center`}>
                            <Users size={14} />
                          </div>
                          <div className="flex-1 text-left truncate">
                            <p className="text-[13px] text-zinc-200 truncate">{team.name}</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">{team.type === 'family' ? 'Família' : 'Equipe'}</p>
                          </div>
                          {activeTeam?.id === team.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                          )}
                        </button>
                      ))
                    )}
                    {activeTeam && (
                      <button
                        onClick={() => {
                          switchTeam(null);
                          setShowSwitcher(false);
                        }}
                        className="w-full mt-2 p-2 flex items-center gap-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-dashed border-[#2C2C2C]"
                      >
                        <div className="w-[28px] h-[28px] rounded-full bg-[#2C2C2C] flex items-center justify-center">
                          <X size={14} />
                        </div>
                        <span className="text-[12px]">Voltar para conta pessoal</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-[#2C2C2C]">
                  <button
                    onClick={logout}
                    className="w-full p-2.5 flex items-center gap-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-[13px] font-medium"
                  >
                    <X size={16} />
                    Sair
                  </button>
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
        key={activeTeam?.id || user?.id || 'personal'}
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
