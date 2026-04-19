import { useEffect, useRef } from 'react';
import { useTheme, THEMES } from '../contexts/ThemeContext';

// Tuning rationale:
//  - Reduced blur and refraction to prevent "milky" or washed-out areas, keeping text behind it readable.
//  - Lowered fresnel and edgeHighlight for subtle, refined reflections without harsh lighting.
//  - Added slight background darkening (brightness: -0.02) to boost contrast for readability.
const GLASS_CONFIG = {
  floating: false,
  blurAmount: 0.035,
  refraction: 0.55,
  chromAberration: 0.015,
  edgeHighlight: 0.01,
  specular: 0,
  fresnel: 0.25,
  distortion: 0,
  cornerRadius: 32,
  zRadius: 15,
  opacity: 1.0,
  saturation: 0.05,
  brightness: -0.02,
  shadowOpacity: 0.3,
  shadowSpread: 12,
  bevelMode: 0,
};

const GLASS_SELECTOR = '.glass-target, .glass-card, .glass-panel';

function shouldUseFallback() {
  if (typeof window === 'undefined') return true;
  const ua = navigator.userAgent;

  const isIOS = /iP(hone|ad|od)/.test(ua) && !window.MSStream;
  if (isIOS) return true;

  const isAndroid = /Android/.test(ua);
  if (isAndroid && window.innerWidth < 1024) return true;

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true;

  if (navigator.deviceMemory && navigator.deviceMemory < 4) return true;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return true;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
  } catch {
    return true;
  }

  return false;
}

function makeGhost(target, rootRect) {
  const rect = target.getBoundingClientRect();
  const top = rect.top - rootRect.top;
  const left = rect.left - rootRect.left;

  const ghost = document.createElement('div');
  ghost.dataset.glass = 'true';
  ghost.dataset.config = JSON.stringify(GLASS_CONFIG);
  ghost.style.position = 'absolute';
  ghost.style.top = '0';
  ghost.style.left = '0';
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  ghost.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  ghost.style.willChange = 'transform';
  ghost.style.contain = 'layout paint';
  ghost.style.borderRadius = window.getComputedStyle(target).borderRadius;
  ghost.style.pointerEvents = 'none';
  // Born invisible: the WebGL canvas the lib injects renders its first
  // (default-cleared) frame as opaque white. Stay hidden until init()
  // resolves and the first refraction pass has actually painted.
  ghost.style.opacity = '0';
  ghost.style.transition = 'opacity 120ms ease-out';
  return ghost;
}

export function useLiquidGlass(rootRef) {
  const { theme } = useTheme();
  const instanceRef = useRef(null);
  const ghostContainerRef = useRef([]);
  const targetsRef = useRef([]);
  const isGlass = THEMES[theme]?.isGlass === true;

  useEffect(() => {
    const body = document.body;

    if (!isGlass || !rootRef.current) {
      body.classList.remove('glass-webgl-active', 'glass-fallback-mode');
      if (instanceRef.current) {
        try { instanceRef.current.destroy(); } catch (_) {}
        instanceRef.current = null;
      }
      ghostContainerRef.current.forEach(g => g.remove());
      ghostContainerRef.current = [];
      targetsRef.current = [];
      return;
    }

    if (shouldUseFallback()) {
      body.classList.add('glass-fallback-mode');
      body.classList.remove('glass-webgl-active');
      return () => {
        body.classList.remove('glass-fallback-mode');
      };
    }

    body.classList.remove('glass-fallback-mode');

    let cancelled = false;
    let LiquidGlassRef = null;
    let isSyncing = false;
    let pendingSync = false;
    let isScrolling = false;
    let scrollIdleTimer = null;
    let debounceTimer = null;

    const targetsEqual = (a, b) => {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
      return true;
    };

    // Double-buffered sync: build new ghosts + new instance BEFORE
    // destroying the old. Eliminates the "white flash" gap that the
    // previous destroy-then-recreate approach caused on every re-sync.
    const syncGhostElements = async () => {
      if (cancelled || !rootRef.current) return;
      if (isSyncing) { pendingSync = true; return; }
      if (isScrolling) { pendingSync = true; return; }

      isSyncing = true;
      try {
        if (!LiquidGlassRef) {
          const module = await import('@ybouane/liquidglass');
          LiquidGlassRef = module.LiquidGlass;
          if (cancelled) return;
        }

        const targets = Array.from(document.querySelectorAll(GLASS_SELECTOR));

        // If the SET of targets is unchanged, skip the re-init entirely
        // and just re-paint at current positions. No white flash possible.
        if (instanceRef.current && targetsEqual(targets, targetsRef.current)) {
          updatePositions();
          markGlassDirty();
          return;
        }

        if (targets.length === 0) {
          // No glass targets on this page → tear down silently.
          if (instanceRef.current) {
            try { instanceRef.current.destroy(); } catch (_) {}
            instanceRef.current = null;
          }
          ghostContainerRef.current.forEach(g => g.remove());
          ghostContainerRef.current = [];
          targetsRef.current = [];
          body.classList.remove('glass-webgl-active');
          return;
        }

        // Build new ghosts (alongside any existing ones, in the same root).
        const rootRect = rootRef.current.getBoundingClientRect();
        const newGhosts = targets.map(t => makeGhost(t, rootRect));
        newGhosts.forEach(g => rootRef.current.appendChild(g));

        let newInstance = null;
        try {
          newInstance = await LiquidGlassRef.init({
            root: rootRef.current,
            glassElements: newGhosts,
          });
        } catch (e) {
          // New init failed — clean up new ghosts, KEEP old instance running.
          // This is the key win: a transient failure doesn't blank the screen.
          newGhosts.forEach(g => g.remove());
          console.warn('[LiquidGlass] re-init failed; keeping previous instance', e);
          if (!instanceRef.current) {
            // We had nothing to fall back to → flip to CSS mode.
            body.classList.remove('glass-webgl-active');
            body.classList.add('glass-fallback-mode');
          }
          return;
        }

        if (cancelled) {
          try { newInstance.destroy(); } catch (_) {}
          newGhosts.forEach(g => g.remove());
          return;
        }

        // Atomic swap in one frame: tear down old AFTER new is fully ready.
        const oldInstance = instanceRef.current;
        const oldGhosts = ghostContainerRef.current;
        instanceRef.current = newInstance;
        ghostContainerRef.current = newGhosts;
        targetsRef.current = targets;
        body.classList.add('glass-webgl-active');

        // Force one render so the WebGL canvas has actual content (not
        // the default white framebuffer) BEFORE we reveal the ghosts.
        if (typeof newInstance.markChanged === 'function') newInstance.markChanged();
        else if (typeof newInstance.update === 'function') newInstance.update();
        else if (typeof newInstance.render === 'function') newInstance.render();

        // Wait one rAF: the lib's first frame paints, THEN we fade the
        // new ghosts in and tear down the old ones in the same tick.
        requestAnimationFrame(() => {
          newGhosts.forEach(g => { g.style.opacity = '1'; });
          requestAnimationFrame(() => {
            if (oldInstance) {
              try { oldInstance.destroy(); } catch (_) {}
            }
            oldGhosts.forEach(g => g.remove());
          });
        });
      } finally {
        isSyncing = false;
        if (pendingSync && !cancelled) {
          pendingSync = false;
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(syncGhostElements, 250);
        }
      }
    };

    debounceTimer = setTimeout(syncGhostElements, 100);

    // Observer is intentionally narrow: only fires on actual childList
    // changes that touch a glass element. Hover/class changes do NOT
    // trigger sync. The set-equality check inside sync is the second
    // line of defense — even if observer fires, identical target sets
    // skip re-init entirely.
    const observer = new MutationObserver((mutations) => {
      let needsSync = false;
      for (const m of mutations) {
        if (m.type !== 'childList') continue;
        for (const node of m.addedNodes) {
          if (node.nodeType === 1 && (node.matches?.(GLASS_SELECTOR) || node.querySelector?.(GLASS_SELECTOR))) {
            needsSync = true;
            break;
          }
        }
        if (needsSync) break;
        for (const node of m.removedNodes) {
          if (node.nodeType === 1 && (node.matches?.(GLASS_SELECTOR) || node.querySelector?.(GLASS_SELECTOR))) {
            needsSync = true;
            break;
          }
        }
        if (needsSync) break;
      }
      if (needsSync) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(syncGhostElements, 600);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const lastPos = new WeakMap();

    const updatePositions = () => {
      if (!rootRef.current) return false;
      const targets = targetsRef.current;
      const ghosts = ghostContainerRef.current;
      if (!targets.length || !ghosts.length) return false;
      const rootRect = rootRef.current.getBoundingClientRect();
      let anyChanged = false;

      for (let i = 0; i < targets.length; i++) {
        const ghost = ghosts[i];
        const target = targets[i];
        if (!ghost || !target || !target.isConnected) continue;
        const rect = target.getBoundingClientRect();
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
          ghost.style.transform = `translate3d(${left}px, ${top}px, 0)`;
          ghost.style.width = `${width}px`;
          ghost.style.height = `${height}px`;
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

    const onScrollLike = () => {
      isScrolling = true;
      clearTimeout(scrollIdleTimer);
      scrollIdleTimer = setTimeout(() => {
        isScrolling = false;
        if (pendingSync) {
          pendingSync = false;
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(syncGhostElements, 250);
        }
      }, 250);
      wakeLoop(300);
    };

    const onResize = () => {
      updatePositions();
      markGlassDirty();
      wakeLoop(400);
    };
    const handleWallpaperLoad = () => markGlassDirty();

    window.addEventListener('scroll', onScrollLike, { capture: true, passive: true });
    window.addEventListener('wheel', onScrollLike, { capture: true, passive: true });
    window.addEventListener('touchmove', onScrollLike, { capture: true, passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('wallpaperLoaded', handleWallpaperLoad);

    return () => {
      cancelled = true;
      clearTimeout(debounceTimer);
      clearTimeout(scrollIdleTimer);
      if (rafId != null) cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('scroll', onScrollLike, { capture: true });
      window.removeEventListener('wheel', onScrollLike, { capture: true });
      window.removeEventListener('touchmove', onScrollLike, { capture: true });
      window.removeEventListener('resize', onResize);
      window.removeEventListener('wallpaperLoaded', handleWallpaperLoad);

      body.classList.remove('glass-webgl-active', 'glass-fallback-mode');
      if (instanceRef.current) {
        try { instanceRef.current.destroy(); } catch (_) {}
        instanceRef.current = null;
      }
      ghostContainerRef.current.forEach(g => g.remove());
      ghostContainerRef.current = [];
      targetsRef.current = [];
    };
  }, [isGlass, rootRef]);

  return { isGlass, glassConfig: GLASS_CONFIG };
}
