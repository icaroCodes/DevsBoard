import { useState, useEffect, useRef } from 'react';
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
  Bell,
  Plus,
  Command,
  ChevronsUpDown,
  Flame,
  Layers,
  Key,
  Webhook,
  Moon,
  Languages,
  CreditCard,
  CircleDashed,
  CheckCircle2,
  MoreHorizontal,
  Heart,
  Briefcase,
  LogOut,
  Trophy,
  Timer
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../contexts/RealtimeContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSessionTracker } from '../hooks/useSessionTracker';
import { useLiquidGlass } from '../hooks/useLiquidGlass';
import { api } from '../lib/api';
import { useTranslation } from '../utils/translations';
import AudioPlayer from './AudioPlayer';

const navSections = [
  {
    items: [
      { to: '/dashboard', icon: Flame, key: 'navHome', label: 'Dashboard' },
    ]
  },
  {
    title: 'Feedbacks',
    items: [
      { to: '/tasks', icon: CircleDashed, key: 'navTasks', label: 'Recebidos' },
      { to: '/routines', icon: RefreshCw, key: 'navRoutines', label: 'In Progress' },
      { to: '/goals', icon: Target, key: 'navGoals', label: 'Done' },
    ]
  },
  {
    title: 'Gerenciamento',
    items: [
      { to: '/finances', icon: Wallet, key: 'navFinances', label: 'Finanças' },
      { to: '/projects', icon: Folder, key: 'navProjects', label: 'Projetos' },
      { to: '/teams', icon: Users, key: 'navTeams', label: 'Equipes' },
      { to: '/achievements', icon: Trophy, key: 'navAchievements', label: 'Conquistas' },
    ]
  },
  {
    title: 'Personalizar',
    items: [
      { to: '/settings', icon: Layers, key: 'navSettings', label: 'Widget' },
    ]
  }
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { user, activeTeam, switchAccount, switchTeam, logout } = useAuth();
  const { notifications } = useRealtime();
  const { theme, setTheme } = useTheme();
  const { formattedTime } = useSessionTracker(!!user, user?.id);
  const { t, lang, setLang } = useTranslation();

  const handleToggleTheme = () => {
    const themes = ['obsidian', 'midnight', 'arctic', 'forest', 'liquidglass'];
    const currentIdx = themes.indexOf(theme);
    const nextIdx = (currentIdx + 1) % themes.length;
    setTheme(themes[nextIdx]);
  };

  const handleToggleLang = () => {
    const nextLang = lang === 'pt' ? 'en' : 'pt';
    setLang(nextLang);
  };
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showWorkspaceSwitcher, setShowWorkspaceSwitcher] = useState(false);
  const [teams, setTeams] = useState([]);
  const [recentAccounts, setRecentAccounts] = useState([]);
  const [glassFallback, setGlassFallback] = useState(false);
  const rootRef = useRef(null);

  useLiquidGlass(rootRef, user?.wallpaper_type);

  useEffect(() => {
    if (user?.wallpaper_type) {
      document.documentElement.setAttribute('data-wallpaper-type', user.wallpaper_type);
    } else {
      document.documentElement.removeAttribute('data-wallpaper-type');
    }
  }, [user?.wallpaper_type]);





  useEffect(() => {
    const body = document.body;
    const sync = () => setGlassFallback(body.classList.contains('glass-fallback-mode'));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const isGlassTheme = theme === 'liquidglass';

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
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


  useEffect(() => {
    if (!showSwitcher) return;
    const handleClick = () => setShowSwitcher(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showSwitcher]);

  useEffect(() => {
    if (!showWorkspaceSwitcher) return;
    const handleClick = () => setShowWorkspaceSwitcher(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showWorkspaceSwitcher]);

  const handleToggleExpand = (e) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  const sidebarWidth = isMobile
    ? (window.innerWidth < 640 ? 'calc(100vw - 48px)' : '340px')
    : (isExpanded ? 224 : 84);
  const sidebarX = isMobile ? (sidebarOpen ? 24 : -500) : 0;
  const contentMargin = isMobile ? 0 : (isExpanded ? 224 : 84);


  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  const sidebarContent = (
    <motion.aside
      initial={false}
      animate={{
        width: isMobile ? sidebarWidth : sidebarWidth,
        x: sidebarX,
        y: isMobile ? (sidebarOpen ? 24 : -20) : 0,
        height: isMobile ? 'calc(100dvh - 48px)' : '100dvh',
      }}
      transition={{ type: 'spring', stiffness: 350, damping: 40, mass: 1 }}
      className={`!fixed z-40 flex flex-col glass-panel ${isMobile ? 'overflow-visible' : (isExpanded ? 'overflow-visible' : 'overflow-x-hidden overflow-y-visible')} ${isMobile
        ? 'bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_32px_64px_rgba(0,0,0,0.6)]'
        : 'inset-y-0 left-0 bg-[#161717] border-r border-[#2C2C2C] shadow-2xl lg:shadow-none'
        }`}
    >
      <div className="pt-8 pb-4 px-4 shrink-0 relative">
        {(!isExpanded && !isMobile) ? (
          // Colapsado: ícone único que expande ao clicar.
          <button
            onClick={handleToggleExpand}
            aria-label="Expandir sidebar"
            className="mx-auto w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 cursor-pointer shadow-lg overflow-hidden border border-white/[0.08] bg-[#1C1C1E]"
          >
            {activeTeam?.avatar_url ? (
              <img src={activeTeam.avatar_url} alt={activeTeam.name} className="w-full h-full object-cover" />
            ) : (
              <img src="/devsboard.png" alt="DevsBoard" className="w-full h-full object-cover rounded-[10px]" />
            )}
          </button>
        ) : (
          // Expandido: icon = colapsa sidebar; texto + chevron = abre switcher.
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleExpand}
              aria-label="Recolher sidebar"
              className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 shadow-lg overflow-hidden border border-white/[0.08] bg-[#1C1C1E] hover:opacity-90 transition-opacity cursor-pointer"
            >
              {activeTeam?.avatar_url ? (
                <img src={activeTeam.avatar_url} alt={activeTeam.name} className="w-full h-full object-cover" />
              ) : (
                <img src="/devsboard.png" alt="DevsBoard" className="w-full h-full object-cover rounded-[10px]" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowWorkspaceSwitcher(v => !v);
              }}
              className="flex-1 flex items-center justify-between min-w-0 p-2 -ml-1 hover:bg-white/[0.04] rounded-[10px] transition-colors group outline-none"
            >
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-[15px] font-bold text-[#F5F5F7] tracking-tight leading-tight truncate">
                  {activeTeam ? activeTeam.name : (user?.name || 'DevsBoard')}
                </span>
                <span className="text-[12px] text-[#A1A1AA] leading-tight truncate mt-0.5">
                  {activeTeam
                    ? (activeTeam.my_role === 'owner' ? 'dono' : activeTeam.my_role === 'admin' ? 'admin' : 'membro')
                    : 'pessoal'}
                </span>
              </div>
              <motion.div animate={{ rotate: showWorkspaceSwitcher ? 180 : 0 }} transition={{ duration: 0.15 }}>
                <ChevronsUpDown size={14} className="text-[#86868B] shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showWorkspaceSwitcher && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -6 }}
                  transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-4 right-4 mt-1 border border-white/[0.08] rounded-[12px] overflow-hidden z-50 shadow-[0_24px_48px_rgba(0,0,0,0.6)]"
                  style={{
                    background: 'rgba(18, 18, 20, 0.98)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                  }}
                >
                  <div className="p-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#63646B] px-2.5 pt-1.5 pb-1.5">Workspaces</p>

                    {/* Pessoal */}
                    <button
                      onClick={() => { switchTeam(null); setShowWorkspaceSwitcher(false); }}
                      className={`flex items-center gap-2.5 px-2 py-2 w-full text-[13px] font-medium rounded-[8px] transition-colors outline-none ${!activeTeam ? 'bg-white/[0.06] text-[#F5F5F7]' : 'text-[#E5E5EA] hover:bg-white/[0.04]'}`}
                    >
                      <div className="w-7 h-7 rounded-[6px] bg-[#1C1C1E] border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden">
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <img src="/devsboard.png" alt="DevsBoard" className="w-full h-full object-cover rounded-[6px]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="truncate font-semibold">{user?.name || 'Pessoal'}</p>
                        <p className="text-[11px] text-[#86868B] truncate">Workspace pessoal</p>
                      </div>
                      {!activeTeam && <div className="w-1.5 h-1.5 rounded-full bg-[#30D158] shrink-0" />}
                    </button>

                    {/* Times */}
                    {teams.length > 0 && teams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => { switchTeam(team); setShowWorkspaceSwitcher(false); }}
                        className={`flex items-center gap-2.5 px-2 py-2 w-full text-[13px] font-medium rounded-[8px] transition-colors outline-none ${activeTeam?.id === team.id ? 'bg-white/[0.06] text-[#F5F5F7]' : 'text-[#E5E5EA] hover:bg-white/[0.04]'}`}
                      >
                        <div
                          className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 overflow-hidden"
                          style={{ background: team.avatar_url ? 'transparent' : (team.type === 'family' ? '#FF375F' : '#0A84FF') }}
                        >
                          {team.avatar_url ? (
                            <img src={team.avatar_url} alt={team.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[11px] font-bold text-white">{team.name?.[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="truncate font-semibold">{team.name}</p>
                          <p className="text-[11px] text-[#86868B] truncate">
                            {team.type === 'family' ? 'família' : 'equipe'} · {team.my_role === 'owner' ? 'dono' : team.my_role === 'admin' ? 'admin' : 'membro'}
                          </p>
                        </div>
                        {activeTeam?.id === team.id && <div className="w-1.5 h-1.5 rounded-full bg-[#30D158] shrink-0" />}
                      </button>
                    ))}
                  </div>

                  <Link
                    to="/teams"
                    onClick={() => setShowWorkspaceSwitcher(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 w-full text-[12.5px] font-medium text-[#A1A1AA] hover:text-[#E5E5EA] hover:bg-white/[0.04] border-t border-white/[0.04] transition-colors outline-none"
                  >
                    <Users size={14} /> Gerenciar times
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <motion.nav
        variants={isMobile ? containerVariants : {}}
        initial="hidden"
        animate="show"
        className={`flex-1 px-4 py-2 space-y-6 overflow-y-auto custom-scrollbar overflow-x-hidden ${(isExpanded || isMobile) ? 'min-w-[224px]' : ''}`}
      >
        {navSections.map((section, idx) => (
          <div key={idx} className="flex flex-col space-y-1">
            {section.title && (isExpanded || isMobile) && (
              <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-[12px] font-bold text-[#86868B]">{section.title}</span>
                {idx === 1 && <Plus size={14} className="text-[#86868B] cursor-pointer hover:text-white transition-colors" />}
              </div>
            )}
            {section.items.map(({ to, icon: Icon, key, label: fallbackLabel }) => {
              const label = t[key] || fallbackLabel;
              const isActive = location.pathname === to;


              let iconColor = isActive ? 'text-[#F5F5F7]' : 'text-[#A1A1AA] group-hover:text-[#F5F5F7]';
              if (label === 'Recebidos') iconColor = 'text-[#86868B] group-hover:text-[#F5F5F7]';
              if (label === 'In Progress') iconColor = 'text-[#F59E0B] group-hover:text-[#F59E0B]';
              if (label === 'Done') iconColor = 'text-[#10B981] group-hover:text-[#10B981]';

              const content = (
                <Link
                  key={to}
                  to={to}
                  onClick={() => isMobile && setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-all duration-200 group relative ${isActive ? 'bg-white/[0.06] shadow-sm' : 'hover:bg-white/[0.03]'}`}
                  title={(!isExpanded && !isMobile) ? label : ''}
                  style={{ width: isExpanded || isMobile ? '100%' : '56px', margin: (!isExpanded && !isMobile) ? '0 auto' : undefined }}
                >
                  <Icon
                    size={18}
                    className={`shrink-0 ${iconColor}`}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  <AnimatePresence initial={false}>
                    {(isExpanded || isMobile) && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`whitespace-nowrap overflow-hidden text-[13px] ${isActive ? 'font-semibold text-[#F5F5F7]' : 'font-medium text-[#A1A1AA] group-hover:text-[#F5F5F7]'}`}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {to === '/teams' && (notifications?.length > 0) && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex h-1.5 w-1.5 rounded-full bg-[#FF453A] animate-pulse" />
                  )}
                  {label === 'Done' && (isExpanded || isMobile) && (
                    <MoreHorizontal size={14} className="ml-auto text-[#A1A1AA] opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  {label === 'In Progress' && (isExpanded || isMobile) && (
                    <MoreHorizontal size={14} className="ml-auto text-[#A1A1AA] opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </Link>
              );

              return isMobile ? (
                <motion.div key={to} variants={itemVariants}>{content}</motion.div>
              ) : content;
            })}
          </div>
        ))}
      </motion.nav>

      { }
      <div className={`px-4 pb-2 space-y-1 ${(isExpanded || isMobile) ? '' : 'hidden'}`}>
        <button onClick={handleToggleTheme} className="flex items-center justify-between px-3 py-2 text-[#A1A1AA] hover:text-[#F5F5F7] rounded-[8px] hover:bg-white/[0.03] transition-colors w-full outline-none group cursor-pointer">
          <div className="flex items-center gap-3">
            <Moon size={18} strokeWidth={1.5} className="group-active:scale-95 transition-transform" />
            <span className="text-[13px] font-medium tracking-wide">Tema</span>
          </div>
          <span className="text-[10px] text-[#86868B] uppercase font-bold tracking-wider opacity-30 group-hover:opacity-100 transition-opacity">{theme}</span>
        </button>
        <button onClick={handleToggleLang} className="flex items-center justify-between px-3 py-2 text-[#A1A1AA] hover:text-[#F5F5F7] rounded-[8px] hover:bg-white/[0.03] transition-colors w-full outline-none group cursor-pointer">
          <div className="flex items-center gap-3">
            <Languages size={18} strokeWidth={1.5} className="group-active:scale-95 transition-transform" />
            <span className="text-[13px] font-medium tracking-wide">Idioma</span>
          </div>
          <span className="text-[10px] text-[#86868B] uppercase font-bold tracking-wider opacity-30 group-hover:opacity-100 transition-opacity">{lang}</span>
        </button>
      </div>

      { }
      {user && (
        <div className={`mx-3 mb-1 ${(isExpanded || isMobile) ? 'min-w-[200px]' : ''}`}>
          <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#1C1C1E]/60 border border-white/[0.04] ${isExpanded || isMobile ? '' : 'justify-center'}`}>
            <div className="relative shrink-0">
              <Timer size={14} className="text-[#30D158]" />
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
            </div>
            <AnimatePresence initial={false}>
              {(isExpanded || isMobile) && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="text-[11px] text-[#86868B] whitespace-nowrap">Ativo há <span className="text-[#30D158] font-semibold">{formattedTime}</span></p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {user && (
        <div className="relative mx-4 mb-4 mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSwitcher(!showSwitcher);
            }}
            className={`w-full p-2 flex items-center gap-3 overflow-hidden shrink-0 transition-colors rounded-[12px] outline-none ${(isExpanded || isMobile) ? 'border border-[#5E5CE6] bg-[#5E5CE6]/5 hover:bg-[#5E5CE6]/10 shadow-[0_0_15px_rgba(94,92,230,0.1)]' : 'justify-center border border-transparent hover:bg-white/5'}`}
          >
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="w-9 h-9 aspect-square rounded-[8px] shrink-0 object-cover" />
            ) : (
              <div className="w-9 h-9 aspect-square rounded-[8px] bg-[#1C1C1E] border border-white/[0.08] flex items-center justify-center shrink-0">
                <img src="/devsboard.png" alt="DevsBoard" className="w-full h-full object-cover rounded-[8px]" />
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
                    <p className="text-[14px] font-bold text-[#F5F5F7] truncate leading-tight">
                      {user.name}
                    </p>
                    <p className="text-[12px] text-[#A1A1AA] truncate leading-tight mt-0.5">{user.email}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {(isExpanded || isMobile) && (
              <motion.div
                animate={{ rotate: showSwitcher ? 180 : 0 }}
                className="text-[#86868B] pr-1"
              >
                <ChevronsUpDown size={14} />
              </motion.div>
            )}
          </button>

          <AnimatePresence>
            {showSwitcher && (isExpanded || isMobile) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
                className="absolute bottom-[calc(100%+8px)] left-0 w-[260px] border border-white/[0.08] shadow-[0_20px_40px_rgba(0,0,0,0.5)] rounded-[12px] overflow-hidden z-50 flex flex-col"
                style={{
                  background: 'rgba(18, 18, 20, 0.98)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                }}
              >
                { }
                <div className="flex items-center gap-3 p-4 border-b border-white/[0.04]">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} className="w-10 h-10 rounded-[8px] object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-[8px] bg-[#1C1C1E] border border-white/[0.08] flex items-center justify-center shrink-0">
                      <img src="/devsboard.png" alt="DevsBoard" className="w-full h-full object-cover rounded-[8px]" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 overflow-hidden">
                    <span className="text-[14px] font-bold text-[#F5F5F7] truncate leading-tight">{activeTeam ? activeTeam.name : user.name}</span>
                    <span className="text-[12px] text-[#A1A1AA] truncate leading-tight mt-0.5">{user.email}</span>
                  </div>
                </div>

                <div className="p-1.5 space-y-0.5">
                  <Link to="/settings" onClick={() => setShowSwitcher(false)} className="flex items-center gap-3 px-3 py-2.5 w-full text-[13px] font-medium text-[#E5E5EA] hover:bg-white/[0.06] rounded-[8px] transition-colors outline-none cursor-pointer">
                    <Settings size={16} className="text-[#A1A1AA]" strokeWidth={2} /> {t.navSettings || 'Configurações'}
                  </Link>
                </div>

                {teams.length > 0 && (
                  <div className="p-1.5 border-t border-white/[0.04] space-y-0.5">
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => { switchTeam(team); setShowSwitcher(false); }}
                        className="flex items-center gap-3 px-3 py-2 w-full text-[13px] font-medium text-[#A1A1AA] hover:text-[#E5E5EA] hover:bg-white/[0.06] rounded-[8px] transition-colors outline-none cursor-pointer"
                      >
                        <Users size={16} /> Alternar: {team.name}
                      </button>
                    ))}
                    {activeTeam && (
                      <button onClick={() => { switchTeam(null); setShowSwitcher(false); }} className="flex items-center gap-3 px-3 py-2 w-full text-[13px] font-medium text-[#A1A1AA] hover:text-[#E5E5EA] hover:bg-white/[0.06] rounded-[8px] transition-colors outline-none cursor-pointer">
                        <X size={16} /> Voltar para Pessoal
                      </button>
                    )}
                  </div>
                )}

                <div className="p-1.5 border-t border-white/[0.04]">
                  <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 w-full text-[13px] font-medium text-[#E5E5EA] hover:bg-[#FF453A]/10 hover:text-[#FF453A] rounded-[8px] transition-colors outline-none cursor-pointer group">
                    <LogOut size={16} className="text-[#A1A1AA] group-hover:text-[#FF453A]" strokeWidth={2} /> Sair
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
    <div className="relative w-screen h-screen overflow-hidden selection:bg-[var(--db-accent-muted)] font-[Poppins,sans-serif]" style={{ backgroundColor: 'var(--db-bg)' }}>

      { }
      {isGlassTheme && glassFallback && user?.wallpaper_url && (
        user?.wallpaper_type === 'video' ? (
          <video
            src={user.wallpaper_url}
            className="fixed inset-0 w-screen h-screen object-cover pointer-events-none z-0"
            style={{ opacity: (user.wallpaper_opacity ?? 15) / 100 }}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={user.wallpaper_url}
            className="fixed inset-0 w-screen h-screen object-cover pointer-events-none z-0"
            style={{ opacity: (user.wallpaper_opacity ?? 15) / 100 }}
            alt=""
          />
        )
      )}

      {/* 1. ROOT WEBGL PURO (z-0 to z-10) */}
      <div
        ref={rootRef}
        id="glass-root"
        className="fixed z-10 pointer-events-none"
        style={{



          top: '-15vh',
          left: '-15vw',
          bottom: '-15vh',
          right: '-15vw',
          overflow: 'hidden',

          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
      >
        { }
        {user?.wallpaper_url && (
          user?.wallpaper_type === 'video' ? (
            <video
              src={user.wallpaper_url}
              className="absolute inset-0 w-full h-full object-cover z-0"
              style={{ opacity: (user.wallpaper_opacity ?? 15) / 100 }}
              crossOrigin="anonymous"
              data-dynamic="true"
              autoPlay
              loop
              muted
              playsInline
              onLoadedData={() => window.dispatchEvent(new Event('wallpaperLoaded'))}
            />
          ) : (
            <img
              src={user.wallpaper_url}
              className="absolute inset-0 w-full h-full object-cover z-0"
              style={{ opacity: (user.wallpaper_opacity ?? 15) / 100 }}
              crossOrigin="anonymous"
              alt=""
              onLoad={() => window.dispatchEvent(new Event('wallpaperLoaded'))}
            />
          )
        )}
        {/* Os fantasmas do useLiquidGlass.js serão injetados acima da imagem aqui! */}
      </div>

      {/* 2. SIDEBAR (z-40) */}
      {sidebarContent}

      {/* 3. CONTEÚDO SCROLLÁVEL (z-20) */}
      <div
        className="relative z-20 w-full h-full overflow-y-auto overflow-x-hidden"
        style={{ overscrollBehavior: 'none', backgroundColor: 'transparent' }}
      >
        { }
        {isMobile && (
          <motion.button
            onClick={() => setSidebarOpen(v => !v)}
            className="fixed top-5 left-4 z-[60] w-10 h-10 rounded-[12px] flex items-center justify-center active:scale-90 transition-transform"
            style={{
              background: sidebarOpen ? 'rgba(255,255,255,0.1)' : 'rgba(28,28,30,0.85)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
            animate={{ rotate: sidebarOpen ? 90 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {sidebarOpen ? (
                <motion.div
                  key="close"
                  initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
                  transition={{ duration: 0.18 }}
                >
                  <X size={18} color="#fff" strokeWidth={2.5} />
                </motion.div>
              ) : (
                <motion.div
                  key="open"
                  initial={{ opacity: 0, rotate: 90, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: -90, scale: 0.6 }}
                  transition={{ duration: 0.18 }}
                >
                  <Menu size={18} color="#A1A1AA" strokeWidth={2} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )}

        { }
        <AnimatePresence>
          {sidebarOpen && isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-30 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            />
          )}
        </AnimatePresence>

        { }
        <motion.main
          key={activeTeam?.id || user?.id || 'personal'}
          initial={false}
          animate={{ marginLeft: contentMargin }}
          transition={{ type: 'spring', stiffness: 350, damping: 40, mass: 1 }}
          className="p-6 pt-20 lg:pt-8 min-h-screen relative overflow-x-hidden"
        >
          { }
          <AnimatePresence>
            {activeTeam && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden"
              >
                <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-[0.03] ${activeTeam.type === 'family' ? 'bg-rose-500' : 'bg-[#0A84FF]'}`} />
                <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-[0.03] ${activeTeam.type === 'family' ? 'bg-rose-500' : 'bg-[#0A84FF]'}`} />
              </motion.div>
            )}
          </AnimatePresence>

          { }
          <AnimatePresence>
            {activeTeam && (
              <motion.div
                initial={{ y: -50, opacity: 0, x: '-50%' }}
                animate={{ y: 0, opacity: 1, x: '-50%' }}
                exit={{ y: -50, opacity: 0, x: '-50%' }}
                className="fixed top-6 left-1/2 z-30 pointer-events-none hidden sm:block"
              >
                <div className="pointer-events-auto bg-[#1C1C1E]/80 backdrop-blur-xl border border-white/[0.08] px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 pr-2">
                  <div className={`w-2 h-2 rounded-full ${activeTeam.type === 'family' ? 'bg-rose-500' : 'bg-[#0A84FF]'} animate-pulse`} />
                  <span className="text-[12px] font-semibold text-white/90">
                    {t.layoutTeamMode} <span className="text-white font-bold">{activeTeam.name}</span>
                  </span>
                  <button
                    onClick={() => switchTeam(null)}
                    className="bg-white/5 hover:bg-white/10 text-white/40 hover:text-white px-3 py-1 rounded-full text-[10px] font-bold transition-all border border-white/5 active:scale-95"
                  >
                    {t.layoutBackPersonal}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {children}
        </motion.main>
      </div>

      { }
      <AudioPlayer />
    </div>
  );
}
