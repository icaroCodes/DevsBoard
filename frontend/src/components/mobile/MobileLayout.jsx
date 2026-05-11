import { useState } from'react';
import { useLocation } from'react-router-dom';
import { MobileFabProvider, useMobileFab } from'../../contexts/MobileFabContext';
import MobileTopBar from'./MobileTopBar';
import BottomNav from'./BottomNav';
import MoreSheet from'./MoreSheet';
import WorkspaceSheet from'./WorkspaceSheet';
import InboxSheet from'./InboxSheet';
import FAB from'./FAB';

/**
 * Routes where chrome (top bar / bottom nav) should be hidden so the
 * page can take over the full viewport. ProjectDetail is the canonical
 * example — it gets its own back button.
 */
const FULLSCREEN_ROUTES = [/^\/projects\/[\w-]+$/];

function isFullscreen(pathname) {
 return FULLSCREEN_ROUTES.some((rx) => rx.test(pathname));
}

function MobileShell({ children }) {
 const location = useLocation();
 const [moreOpen, setMoreOpen] = useState(false);
 const [workspaceOpen, setWorkspaceOpen] = useState(false);
 const [inboxOpen, setInboxOpen] = useState(false);
 const { fab } = useMobileFab();

 const fullscreen = isFullscreen(location.pathname);

 return (
 <div className="min-h-[100dvh] flex flex-col bg-[#191919] text-[#E4E4E7]">
 {!fullscreen && (
 <MobileTopBar
 onWorkspaceClick={() => setWorkspaceOpen(true)}
 onNotificationsClick={() => setInboxOpen(true)}
 onAvatarClick={() => setMoreOpen(true)}
 />
 )}

 <main
 className="flex-1 min-h-0"
 style={{
 paddingBottom: fullscreen
 ?'env(safe-area-inset-bottom, 0px)'
 :'calc(env(safe-area-inset-bottom, 0px) + 64px)',
 }}
 >
 {children}
 </main>

 {!fullscreen && (
 <>
 <FAB fab={fab} />
 <BottomNav onMoreClick={() => setMoreOpen(true)} moreOpen={moreOpen} />
 </>
 )}

 <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
 <WorkspaceSheet open={workspaceOpen} onClose={() => setWorkspaceOpen(false)} />
 <InboxSheet open={inboxOpen} onClose={() => setInboxOpen(false)} />
 </div>
 );
}

export default function MobileLayout({ children }) {
 return (
 <MobileFabProvider>
 <MobileShell>{children}</MobileShell>
 </MobileFabProvider>
 );
}
