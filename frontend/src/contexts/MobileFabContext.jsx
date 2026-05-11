import { createContext, useContext, useEffect, useState, useCallback } from'react';

const MobileFabContext = createContext(null);

export function MobileFabProvider({ children }) {
 const [fab, setFab] = useState(null);

 const registerFab = useCallback((config) => setFab(config), []);
 const clearFab = useCallback(() => setFab(null), []);

 return (
 <MobileFabContext.Provider value={{ fab, registerFab, clearFab }}>
 {children}
 </MobileFabContext.Provider>
 );
}

export function useMobileFab() {
 const ctx = useContext(MobileFabContext);
 if (!ctx) throw new Error('useMobileFab must be used inside MobileFabProvider');
 return ctx;
}

// Convenience hook: pages call this once to publish a FAB while mounted.
// config: { icon: LucideIcon, label: string, onClick: () => void, tone?:'primary' |'accent' }
export function useRegisterMobileFab(config, deps = []) {
 const { registerFab, clearFab } = useContext(MobileFabContext) || {};
 useEffect(() => {
 if (!registerFab) return;
 if (!config) {
 clearFab();
 return;
 }
 registerFab(config);
 return () => clearFab();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, deps);
}
