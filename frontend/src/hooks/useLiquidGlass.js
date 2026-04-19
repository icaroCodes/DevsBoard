import { useEffect, useRef } from 'react';
import { useTheme, THEMES } from '../contexts/ThemeContext';

const GLASS_CONFIG = {
  floating: false,
  blurAmount: 0.07,
  refraction: 1.08,
  chromAberration: 0.05,
  edgeHighlight: 0.05,
  specular: 0,
  fresnel: 1,
  distortion: 0,
  cornerRadius: 20,
  zRadius: 40,
  opacity: 1,
  saturation: 0,
  brightness: 0,
  shadowOpacity: 0.3,
  shadowSpread: 10,
  bevelMode: 0,
};

export function useLiquidGlass(rootRef, wallpaperType = 'image') {
  const { theme } = useTheme();
  const instanceRef = useRef(null);
  const ghostContainerRef = useRef(null);
  const isGlass = THEMES[theme]?.isGlass === true;

  useEffect(() => {
    if (!isGlass || !rootRef.current || wallpaperType === 'video') {
      if (instanceRef.current) {
        try { instanceRef.current.destroy(); } catch (_) {}
        instanceRef.current = null;
      }
      if (ghostContainerRef.current) {
        ghostContainerRef.current.forEach(g => g.remove());
        ghostContainerRef.current = [];
      }
      return;
    }

    let cancelled = false;
    let LiquidGlassRef = null;
    ghostContainerRef.current = ghostContainerRef.current || [];

    const syncGhostElements = async () => {
      if (cancelled || !rootRef.current) return;
      
      if (!LiquidGlassRef) {
        const module = await import('@ybouane/liquidglass');
        LiquidGlassRef = module.LiquidGlass;
      }

      if (instanceRef.current) {
        try { instanceRef.current.destroy(); } catch (_) {}
        instanceRef.current = null;
      }

      // Clear old ghosts
      ghostContainerRef.current.forEach(g => g.remove());
      ghostContainerRef.current = [];

      // Find all nested targets anywhere in the REAL DOM (not rootRef, but document.body, since targets are outside rootRef in Layout!)
      // Wait, Layout.jsx puts rootRef as a sibling of the content.
      // The observer was watching rootRef, but targets are outside rootRef.
      // So document.body is where targets are!
      const targets = document.querySelectorAll('.glass-target, .glass-card, .glass-panel');
      
      const ghostEls = [];
      const rootRect = rootRef.current.getBoundingClientRect();

      targets.forEach(target => {
        const rect = target.getBoundingClientRect();
        const top = rect.top - rootRect.top;
        const left = rect.left - rootRect.left;

        const ghost = document.createElement('div');
        ghost.dataset.glass = "true";
        ghost.dataset.config = JSON.stringify(GLASS_CONFIG);
        ghost.style.position = 'absolute';
        ghost.style.top = '0';
        ghost.style.left = '0';
        ghost.style.width = `${rect.width}px`;
        ghost.style.height = `${rect.height}px`;
        ghost.style.transform = `translate3d(${left}px, ${top}px, 0)`;
        ghost.style.willChange = 'transform';

        const computedStyle = window.getComputedStyle(target);
        ghost.style.borderRadius = computedStyle.borderRadius;
        ghost.style.pointerEvents = 'none';

        rootRef.current.appendChild(ghost);
        ghostEls.push(ghost);
        ghostContainerRef.current.push(ghost);
      });

      if (ghostEls.length > 0) {
        try {
          instanceRef.current = await LiquidGlassRef.init({
            root: rootRef.current,
            glassElements: ghostEls
          });
        } catch (e) {
          console.warn('[LiquidGlass] init error', e);
        }
      }
    };

    let debounceTimer = setTimeout(syncGhostElements, 100);

    const GLASS_SELECTOR = '.glass-target, .glass-card, .glass-panel';
    const observer = new MutationObserver((mutations) => {
      let needsSync = false;
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach(node => {
            if (node.nodeType === 1 && (node.matches?.(GLASS_SELECTOR) || node.querySelector?.(GLASS_SELECTOR))) {
              needsSync = true;
            }
          });
          m.removedNodes.forEach(node => {
            if (node.nodeType === 1 && (node.matches?.(GLASS_SELECTOR) || node.querySelector?.(GLASS_SELECTOR))) {
              needsSync = true;
            }
          });
        }
      }
      if (needsSync) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(syncGhostElements, 500);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Cache da última posição de cada ghost para evitar writes desnecessários no DOM
    const lastPos = new WeakMap();

    const updatePositions = () => {
      if (!rootRef.current) return false;
      const targets = document.querySelectorAll('.glass-target, .glass-card, .glass-panel');
      const rootRect = rootRef.current.getBoundingClientRect();
      const ghosts = ghostContainerRef.current;
      let anyChanged = false;

      for (let i = 0; i < targets.length; i++) {
        const ghost = ghosts[i];
        if (!ghost) continue;
        const rect = targets[i].getBoundingClientRect();
        const top = rect.top - rootRect.top;
        const left = rect.left - rootRect.left;
        const width = rect.width;
        const height = rect.height;

        const prev = lastPos.get(ghost);
        if (
          !prev ||
          prev.top !== top ||
          prev.left !== left ||
          prev.width !== width ||
          prev.height !== height
        ) {
          // translate3d entra no compositor — bem mais barato que top/left
          ghost.style.transform = `translate3d(${left}px, ${top}px, 0)`;
          ghost.style.width = `${width}px`;
          ghost.style.height = `${height}px`;
          ghost.style.top = '0';
          ghost.style.left = '0';
          lastPos.set(ghost, { top, left, width, height });
          anyChanged = true;
        }
      }
      return anyChanged;
    };

    const markGlassDirty = () => {
      const inst = instanceRef.current;
      if (!inst) return;
      if (typeof inst.markChanged === 'function') inst.markChanged();
      else if (typeof inst.update === 'function') inst.update();
      else if (typeof inst.render === 'function') inst.render();
    };

    // rAF loop ativo durante interações para tracking sub-frame.
    let rafId = null;
    let interactingUntil = 0;
    const tick = () => {
      const changed = updatePositions();
      if (changed) markGlassDirty();
      if (performance.now() < interactingUntil) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    };
    const wakeLoop = (durationMs = 250) => {
      interactingUntil = performance.now() + durationMs;
      if (rafId == null) rafId = requestAnimationFrame(tick);
    };

    const onScroll = () => wakeLoop(250);
    const onResize = () => {
      // resize pode mudar layout drasticamente — força sync imediato + loop curto
      updatePositions();
      markGlassDirty();
      wakeLoop(400);
    };
    const handleWallpaperLoad = () => markGlassDirty();

    // Captura scroll de QUALQUER elemento (incluindo o overflow-y-auto irmão do rootRef)
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('wheel', onScroll, { capture: true, passive: true });
    window.addEventListener('touchmove', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('wallpaperLoaded', handleWallpaperLoad);

    return () => {
      cancelled = true;
      clearTimeout(debounceTimer);
      if (rafId != null) cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('wheel', onScroll, { capture: true });
      window.removeEventListener('touchmove', onScroll, { capture: true });
      window.removeEventListener('resize', onResize);
      window.removeEventListener('wallpaperLoaded', handleWallpaperLoad);

      if (instanceRef.current) {
        try { instanceRef.current.destroy(); } catch (_) {}
      }
      if (ghostContainerRef.current) {
        ghostContainerRef.current.forEach(g => g.remove());
        ghostContainerRef.current = [];
      }
    };
  }, [isGlass, rootRef]);

  return { isGlass, glassConfig: GLASS_CONFIG };
}
