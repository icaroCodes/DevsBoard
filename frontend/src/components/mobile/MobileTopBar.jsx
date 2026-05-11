import { Bell, ChevronDown } from'lucide-react';
import { motion } from'framer-motion';
import { useAuth } from'../../contexts/AuthContext';
import { useRealtime } from'../../contexts/RealtimeContext';

/**
 * Sticky glass top bar.
 * Left: workspace switcher trigger (name + chevron) — opens WorkspaceSheet
 * Right: notifications bell, avatar
 */
export default function MobileTopBar({ onWorkspaceClick, onNotificationsClick, onAvatarClick }) {
 const { user, activeTeam } = useAuth();
 const { notifications } = useRealtime();
 const unread = (notifications || []).filter((n) => !n.read).length;

 const workspaceName = activeTeam ? activeTeam.name : user?.name ||'DevsBoard';
 const workspaceSub = activeTeam
 ? activeTeam.my_role ==='owner'
 ?'dono'
 : activeTeam.my_role ==='admin'
 ?'admin'
 :'membro'
 :'pessoal';

 return (
 <header
 className="sticky top-0 z-[50] border-b border-white/[0.05]"
 style={{
 paddingTop:'env(safe-area-inset-top, 0px)',
 background:'rgba(20,20,20,0.78)',
 backdropFilter:'blur(28px) saturate(180%)',
 WebkitBackdropFilter:'blur(28px) saturate(180%)',
 }}
 >
 <div className="flex items-center justify-between gap-2 px-4 h-14">
 <button
 type="button"
 onClick={onWorkspaceClick}
 className="flex items-center gap-2 min-w-0 px-2 py-1.5 -ml-2 rounded-[10px] hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors outline-none"
 >
 <div className="w-7 h-7 rounded-[7px] overflow-hidden bg-[#202020] border border-white/[0.08] shrink-0 flex items-center justify-center">
 {activeTeam?.avatar_url ? (
 <img src={activeTeam.avatar_url} alt="" className="w-full h-full object-cover" />
 ) : user?.avatar_url ? (
 <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
 ) : (
 <img src="/devsboard.png" alt="" className="w-full h-full object-cover" />
 )}
 </div>
 <div className="flex flex-col min-w-0 text-left">
 <span className="text-[14px] font-semibold tracking-tight text-[#F5F5F7] leading-tight truncate max-w-[140px]">
 {workspaceName}
 </span>
 <span className="text-[10.5px] text-[#86868B] leading-tight truncate">
 {workspaceSub}
 </span>
 </div>
 <ChevronDown size={14} className="text-[#86868B] shrink-0" strokeWidth={2} />
 </button>

 <div className="flex items-center gap-1">
 <button
 type="button"
 onClick={onNotificationsClick}
 aria-label="Notificações"
 className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors outline-none"
 >
 <Bell size={19} className="text-[#E5E5EA]" strokeWidth={1.8} />
 {unread > 0 && (
 <motion.span
 initial={{ scale: 0 }}
 animate={{ scale: 1 }}
 className="absolute top-2 right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-[#FF3B30] text-[9.5px] font-bold text-white flex items-center justify-center"
 >
 {unread > 9 ?'9+' : unread}
 </motion.span>
 )}
 </button>

 <button
 type="button"
 onClick={onAvatarClick}
 aria-label="Perfil"
 className="w-9 h-9 rounded-full overflow-hidden border border-white/[0.08] bg-[#202020] flex items-center justify-center outline-none active:scale-95 transition-transform"
 >
 {user?.avatar_url ? (
 <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
 ) : (
 <span className="text-[12px] font-semibold text-[#F5F5F7]">
 {user?.name?.[0]?.toUpperCase() ||'D'}
 </span>
 )}
 </button>
 </div>
 </div>
 </header>
 );
}
