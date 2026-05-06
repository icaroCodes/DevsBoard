import { useEffect, memo, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLiveCursors, colorFromId } from '../hooks/useLiveCursors';


// Renders other connected users' cursors over a content region. Listens for
// mousemove on `eventTargetRef` (default: window) so the cursor follows the
// user across the whole page; positions are stored relative to `contentRef`
// so they stay aligned with the same logical content for everyone.
//
// Use a ref to call drag broadcast methods from a parent that owns DnD:
//
//   const liveRef = useRef(null);
//   <LiveCursors ref={liveRef} roomId="..." contentRef={pageRef} />
//   // inside onDragStart:
//   liveRef.current?.broadcastDragStart({ type: 'card', id, title });
//   // inside onDragEnd:
//   liveRef.current?.broadcastDragEnd();
const LiveCursors = forwardRef(function LiveCursors(
  { roomId, contentRef, eventTargetRef, renderDragGhost },
  ref
) {
  const { user } = useAuth();
  const {
    cursors,
    dragStates,
    sendCursor,
    hideCursor,
    broadcastDragStart,
    broadcastDragEnd,
  } = useLiveCursors(roomId, user);

  useImperativeHandle(ref, () => ({
    broadcastDragStart,
    broadcastDragEnd,
  }), [broadcastDragStart, broadcastDragEnd]);

  useEffect(() => {
    const originNode = contentRef?.current;
    if (!originNode) return;

    const target = eventTargetRef?.current || window;

    function onMove(e) {
      const rect = originNode.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      sendCursor(x, y, true);
    }
    function onLeave() { hideCursor(); }
    function onBlur() { hideCursor(); }
    function onVisibility() {
      if (document.hidden) hideCursor();
    }

    target.addEventListener('mousemove', onMove, { passive: true });
    if (target !== window) target.addEventListener('mouseleave', onLeave);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      target.removeEventListener('mousemove', onMove);
      if (target !== window) target.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [contentRef, eventTargetRef, sendCursor, hideCursor]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 50 }}
    >
      {Object.entries(cursors).map(([userId, c]) => (
        c.visible !== false ? (
          <RemoteCursor
            key={userId}
            x={c.x}
            y={c.y}
            name={c.name}
            color={c.color || colorFromId(userId)}
            drag={dragStates[userId]}
            renderDragGhost={renderDragGhost}
          />
        ) : null
      ))}
    </div>
  );
});

const RemoteCursor = memo(function RemoteCursor({ x, y, name, color, drag, renderDragGhost }) {
  // SVG path is shifted so the arrow tip is at exactly (0,0) — that way the
  // remote cursor's tip lands at the precise coordinate sent by the peer,
  // matching where their pointer actually is.
  return (
    <div
      className="absolute top-0 left-0 will-change-transform"
      style={{
        transform: `translate3d(${x}px, ${y}px, 0)`,
        transition: 'transform 50ms linear',
      }}
    >
      <svg
        width="18"
        height="20"
        viewBox="0 0 18 20"
        fill="none"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.45))', display: 'block' }}
      >
        <path
          d="M0 0 L14.7 9.6 L7.1 10.8 L4.5 17.7 Z"
          fill={color}
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      <div
        className="absolute left-3 top-[15px] inline-flex items-center px-2 py-[3px] rounded-md text-[11px] font-semibold text-white whitespace-nowrap select-none"
        style={{
          background: color,
          boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
          letterSpacing: '-0.01em',
        }}
      >
        {name || 'Anônimo'}
      </div>

      {drag && (
        <div
          className="absolute pointer-events-none select-none"
          style={{
            left: 14,
            top: 30,
            // Polished overlay: pulsing ring + slight rotation, mimicking
            // the local dnd-kit drag overlay vibe.
            filter: `drop-shadow(0 12px 28px rgba(0,0,0,0.55)) drop-shadow(0 0 0 1px ${color}88)`,
            transform: 'rotate(2deg) scale(0.95)',
            transformOrigin: 'top left',
          }}
        >
          {renderDragGhost
            ? renderDragGhost(drag)
            : <FallbackDragGhost type={drag.type} title={drag.title} color={color} />}
        </div>
      )}
    </div>
  );
});

// Fallback used when the parent doesn't supply a renderDragGhost prop. For
// kanbans we pass a render-prop that reuses the local dnd-kit overlay so the
// remote ghost looks identical to the local one.
const FallbackDragGhost = memo(function FallbackDragGhost({ type, title, color }) {
  if (type === 'list') {
    return (
      <div
        className="absolute left-3 top-[42px] flex flex-col gap-1.5 px-3 py-2.5 rounded-[12px] backdrop-blur-md select-none"
        style={{
          background: 'rgba(28,28,30,0.92)',
          border: `1.5px solid ${color}`,
          boxShadow: `0 8px 24px rgba(0,0,0,0.45), 0 0 0 1px ${color}40`,
          minWidth: 140,
          maxWidth: 220,
        }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: color }}
          />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white truncate">
            {title || 'Coluna'}
          </span>
        </div>
        <div className="h-1 w-2/3 rounded-full bg-white/15" />
        <div className="h-1 w-1/2 rounded-full bg-white/10" />
      </div>
    );
  }

  // default: card
  return (
    <div
      className="absolute left-3 top-[42px] px-3 py-2 rounded-[10px] backdrop-blur-md select-none"
      style={{
        background: 'rgba(28,28,30,0.92)',
        border: `1.5px solid ${color}`,
        boxShadow: `0 8px 24px rgba(0,0,0,0.45), 0 0 0 1px ${color}40`,
        minWidth: 120,
        maxWidth: 240,
      }}
    >
      <div className="text-[12.5px] font-medium text-white truncate" style={{ letterSpacing: '-0.01em' }}>
        {title || 'Cartão'}
      </div>
    </div>
  );
});

export default memo(LiveCursors);
