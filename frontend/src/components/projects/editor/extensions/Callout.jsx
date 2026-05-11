import { Node, mergeAttributes } from'@tiptap/core';
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from'@tiptap/react';
import { useState } from'react';

const EMOJIS = ['💡','🔥','⚠️','✅','❌','⭐','📌','🎯','🚀','📝','🔒','💬','🧠','🎨','🪄','📊'];

function CalloutView({ node, updateAttributes }) {
 const [open, setOpen] = useState(false);
 return (
 <NodeViewWrapper as="div" className="db-callout" data-type="callout">
 <div className="db-callout-emoji-wrap" contentEditable={false}>
 <button
 type="button"
 className="db-callout-emoji"
 onClick={() => setOpen(o => !o)}
 aria-label="Trocar emoji"
 >
 {node.attrs.emoji ||'💡'}
 </button>
 {open && (
 <div className="db-callout-picker">
 {EMOJIS.map(e => (
 <button
 key={e}
 type="button"
 onClick={() => { updateAttributes({ emoji: e }); setOpen(false); }}
 >{e}</button>
 ))}
 </div>
 )}
 </div>
 <NodeViewContent className="db-callout-content" />
 </NodeViewWrapper>
 );
}

export const Callout = Node.create({
 name:'callout',
 group:'block',
 content:'block+',
 defining: true,

 addAttributes() {
 return {
 emoji: { default:'💡', parseHTML: el => el.getAttribute('data-emoji') ||'💡', renderHTML: attrs => ({'data-emoji': attrs.emoji }) },
 };
 },

 parseHTML() { return [{ tag:'div[data-type="callout"]' }]; },
 renderHTML({ HTMLAttributes }) {
 return ['div', mergeAttributes(HTMLAttributes, {'data-type':'callout', class:'db-callout' }), 0];
 },
 addNodeView() { return ReactNodeViewRenderer(CalloutView); },
});
