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

const navRoutes = [
  { to: '/dashboard', icon: Home, key: 'navHome' },
  { to: '/finances', icon: Wallet, key: 'navFinances' },
  { to: '/tasks', icon: CheckSquare, key: 'navTasks' },
  { to: '/routines', icon: RefreshCw, key: 'navRoutines' },
  { to: '/goals', icon: Target, key: 'navGoals' },
  { to: '/projects', icon: Folder, key: 'navProjects' },
  { to: '/teams', icon: Users, key: 'navTeams' },
  { to: '/achievements', icon: Trophy, key: 'navAchievements' },
  { to: '/settings', icon: Settings, key: 'navSettings' },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { user, activeTeam, switchAccount, switchTeam, logout } = useAuth();
  const { notifications } = useRealtime();
  const { theme } = useTheme();
  const { formattedTime } = useSessionTracker(!!user, user?.id);
  const { t } = useTranslation();
  const [showSwitcher, setShowSwitcher] = useState(false);
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

  // Track CSS-fallback mode set by useLiquidGlass so we can render the
  // wallpaper outside #glass-root — mobile Safari's backdrop-filter cannot
  // sample through the transform/isolation stacking context that #glass-root
  // creates, so cards in fallback mode see only the dark base color.
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

  const sidebarWidth = isMobile
    ? (window.innerWidth < 640 ? 'calc(100vw - 48px)' : '340px')
    : (isExpanded ? 224 : 84);
  const sidebarX = isMobile ? (sidebarOpen ? 24 : -500) : 0;
  const contentMargin = isMobile ? 0 : (isExpanded ? 224 : 84);

  // Animation variants for nav items
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
      transition={{ type: 'spring', stiffness: 400, damping: 40, mass: 1 }}
      className={`glass-target fixed z-40 flex flex-col overflow-visible ${isMobile
        ? 'bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_32px_64px_rgba(0,0,0,0.6)]'
        : 'inset-y-0 left-0 bg-[#161717] border-r border-[#2C2C2C] shadow-2xl lg:shadow-none'
        }`}
    >
      <div className="p-6 border-b border-transparent flex items-center justify-start h-[88px] shrink-0 min-w-[240px]">
        <div className="flex items-center gap-4 w-full">
          {!isMobile && (
            <button onClick={handleToggleExpand} className="text-white hover:text-zinc-300 transition-colors p-1 -ml-1 rounded-md outline-none shrink-0 cursor-pointer">
              <Scan size={22} strokeWidth={1.5} />
            </button>
          )}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTeam ? (
                <motion.div
                  key="team-logo"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex flex-col"
                >
                  <span className="text-[13px] font-bold text-white tracking-tight truncate max-w-[120px]">
                    {activeTeam.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTeam.type === 'family' ? 'bg-rose-500' : 'bg-[#0A84FF]'} shadow-[0_0_8px_rgba(10,132,255,0.4)]`} />
                    <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                      {activeTeam.type === 'family' ? t.layoutFamily : t.layoutTeam}
                    </span>
                  </div>
                </motion.div>
              ) : (
                (isExpanded || isMobile) && (
                  <motion.div
                    key="personal-logo"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link to="/dashboard" className="text-[16px] font-bold text-white tracking-wider whitespace-nowrap block">
                      Devs<span className="text-[#8E9C78]">Board</span>
                    </Link>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <motion.nav
        variants={isMobile ? containerVariants : {}}
        initial="hidden"
        animate="show"
        className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden min-w-[224px]"
      >
        {navRoutes.map(({ to, icon: Icon, key }) => {
          const label = t[key] || key;
          const isActive = location.pathname === to;
          const content = (
            <Link
              key={to}
              to={to}
              onClick={() => isMobile && setSidebarOpen(false)}
              className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group relative ${isMobile
                ? (isActive ? 'bg-white text-zinc-950 shadow-[0_8px_20px_rgba(255,255,255,0.1)]' : 'text-[#A1A1A1] hover:text-white hover:bg-white/5')
                : (isActive ? 'bg-white/5 text-white' : 'text-[#A1A1A1] hover:text-white hover:bg-white/5')
                }`}
              title={(!isExpanded && !isMobile) ? label : ''}
              style={{ width: isExpanded || isMobile ? '100%' : '60px' }}
            >
              <Icon
                size={22}
                className={`shrink-0 ${isActive
                  ? (isMobile ? 'text-zinc-950' : 'text-white')
                  : 'text-[#A1A1A1] group-hover:text-white'
                  }`}
                strokeWidth={isActive ? 2 : 1.5}
              />
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
                <div className={`absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF453A] text-[10px] font-bold text-white shadow-lg animate-pulse`}>
                  {notifications.length}
                </div>
              )}
            </Link>
          );

          return isMobile ? (
            <motion.div key={to} variants={itemVariants}>{content}</motion.div>
          ) : content;
        })}
      </motion.nav>

      {/* Session Timer */}
      {user && (
        <div className="mx-3 mb-1 min-w-[200px]">
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
                      {activeTeam && <span className="ml-2 text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded uppercase tracking-wider">{t.layoutTeamBadge}</span>}
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
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
                className="absolute bottom-[calc(100%+8px)] left-0 w-[260px] border border-white/[0.08] rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 p-2"
                style={{
                  background: 'rgba(18, 18, 20, 0.98)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                }}
              >
                {/* Section: Accounts */}
                <div className="px-3 pt-3 pb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-[0.05em]">{t.layoutProfiles}</span>
                  <Link
                    to="/auth"
                    className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                    title={t.layoutAddAccount}
                  >
                    <Plus size={14} />
                  </Link>
                </div>

                <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                  {recentAccounts.map((acc) => {
                    const isSelected = acc.user.id === user.id && !activeTeam;
                    return (
                      <button
                        key={acc.user.id}
                        onClick={() => {
                          switchAccount();
                          setShowSwitcher(false);
                        }}
                        className={`w-full p-2.5 flex items-center gap-3 rounded-[16px] transition-all relative group ${isSelected ? 'bg-white/[0.06] border border-white/10' : 'hover:bg-white/[0.03] border border-transparent'}`}
                      >
                        <div className="relative shrink-0">
                          {acc.user.avatar_url ? (
                            <img src={acc.user.avatar_url} alt={acc.user.name} className="w-8 h-8 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3A3A3C] to-[#2C2C2E] flex items-center justify-center text-[11px] font-bold text-zinc-400">
                              {acc.user.name?.[0]?.toUpperCase()}
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#30D158] border-2 border-[#1C1C1E]" />
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className={`text-[13px] truncate ${isSelected ? 'font-semibold text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{acc.user.name}</p>
                          <p className="text-[10px] text-zinc-600 truncate">{acc.user.email}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Section: Teams */}
                <div className="mt-3 pt-3 border-t border-white/[0.05]">
                  <div className="px-3 pb-2 text-[11px] font-bold text-[#86868B] uppercase tracking-[0.05em]">
                    {t.layoutTeamSpaces}
                  </div>
                  <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                    {teams.length === 0 ? (
                      <div className="px-3 py-4 text-center">
                        <p className="text-[12px] text-zinc-600 italic">{t.layoutNoTeams}</p>
                      </div>
                    ) : (
                      teams.map((team) => {
                        const isSelected = activeTeam?.id === team.id;
                        return (
                          <button
                            key={team.id}
                            onClick={() => {
                              switchTeam(team);
                              setShowSwitcher(false);
                            }}
                            className={`w-full p-2.5 flex items-center gap-3 rounded-[16px] transition-all group ${isSelected ? 'bg-white/[0.06] border border-white/10' : 'hover:bg-white/[0.03] border border-transparent'}`}
                          >
                            <div className={`w-8 h-8 rounded-[12px] shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 ${team.type === 'family' ? 'bg-rose-500/15 text-rose-400' : 'bg-[#0A84FF]/15 text-[#0A84FF]'}`}>
                              {team.type === 'family' ? <Heart size={14} /> : <Briefcase size={14} />}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className={`text-[13px] truncate ${isSelected ? 'font-semibold text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{team.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-tight">{team.type === 'family' ? t.layoutFamily : 'Business'}</span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] shadow-[0_0_10px_rgba(10,132,255,0.6)]" />
                            )}
                          </button>
                        );
                      })
                    )}

                    {activeTeam && (
                      <button
                        onClick={() => {
                          switchTeam(null);
                          setShowSwitcher(false);
                        }}
                        className="w-full mt-1 p-2.5 flex items-center gap-3 rounded-[16px] text-zinc-500 hover:text-white hover:bg-white/5 transition-all border border-dashed border-white/10 group"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:rotate-90 transition-transform">
                          <X size={14} />
                        </div>
                        <span className="text-[12px] font-medium">{t.layoutPersonal}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-2 p-1 border-t border-white/[0.05]">
                  <button
                    onClick={logout}
                    className="w-full p-2 flex items-center gap-3 text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 rounded-[14px] transition-all text-[12px] font-semibold"
                  >
                    <div className="w-8 h-8 flex items-center justify-center">
                      <LogOut size={14} />
                    </div>
                    {t.layoutSignOut}
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
    <div className="relative w-screen h-screen overflow-hidden bg-zinc-950 selection:bg-cyan-500/30 font-[Poppins,sans-serif]">

      {/* Fallback wallpaper for mobile/iOS: rendered OUTSIDE #glass-root so
          backdrop-filter on glass cards can sample it (the WebGL root creates
          a stacking context that blocks backdrop sampling on Safari).
          Painting on <body> doesn't work here because #root has an opaque
          background in the liquidglass theme and covers the body entirely. */}
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
        className="fixed z-10 pointer-events-none bg-[var(--db-bg)]"
        style={{
          // OVER-SCAN FIX: Expand the render area beyond the viewport bounds
          // This prevents the WebGL refraction shader / compositor from sampling invalid (not rendered)
          // pixels when elements scroll partially out of screen, eliminating the white border artifacts.
          top: '-15vh',
          left: '-15vw',
          bottom: '-15vh',
          right: '-15vw',
          overflow: 'hidden',
          // Force hardware compositing and prevent aggressive browser clipping at viewport bounds
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
      >
        {/* A imagem DEVE estar dentro do rootRef para que o html-to-image a capture! */}
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

      {/* 2. CONTEÚDO SCROLLÁVEL (z-20) */}
      <div
        className="relative z-20 w-full h-full overflow-y-auto overflow-x-hidden"
        style={{ overscrollBehavior: 'none', backgroundColor: 'transparent' }}
      >
        {/* Hamburger — canto superior esquerdo, só mobile */}
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

        {/* Overlay com desfoque */}
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

        {sidebarContent}

        {/* Main content */}
        <motion.main
          key={activeTeam?.id || user?.id || 'personal'}
          initial={false}
          animate={{ marginLeft: contentMargin }}
          transition={{ type: 'spring', stiffness: 350, damping: 35, mass: 1 }}
          className="p-6 pt-20 lg:pt-8 min-h-screen relative overflow-x-hidden"
        >
          {/* Background Decorative Glow for Team Mode */}
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

          {/* Global Team Indicator Pill */}
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

      {/* Audio player flutuante — 1 música em loop, play/pause/hide */}
      <AudioPlayer />
    </div>
  );
}
