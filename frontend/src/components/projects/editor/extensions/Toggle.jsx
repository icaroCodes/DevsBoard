import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react';

function ToggleView({ node, updateAttributes }) {
  const open = !!node.attrs.open;
  return (
    <NodeViewWrapper as="div" className={`db-toggle ${open ? 'is-open' : 'is-closed'}`} data-type="toggle">
      <button
        type="button"
        className="db-toggle-handle"
        contentEditable={false}
        onClick={() => updateAttributes({ open: !open })}
        aria-label={open ? 'Fechar' : 'Abrir'}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)' }}>
          <path d="M3 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <NodeViewContent className="db-toggle-content" />
    </NodeViewWrapper>
  );
}

export const Toggle = Node.create({
  name: 'toggle',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      open: { default: true, parseHTML: el => el.getAttribute('data-open') === 'true', renderHTML: attrs => ({ 'data-open': attrs.open ? 'true' : 'false' }) },
    };
  },

  parseHTML() { return [{ tag: 'div[data-type="toggle"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'toggle', class: 'db-toggle' }), 0];
  },
  addNodeView() { return ReactNodeViewRenderer(ToggleView); },
});
