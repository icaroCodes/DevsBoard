import { Node, mergeAttributes } from'@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from'@tiptap/react';
import { MediaPlaceholder } from'./MediaPlaceholder.jsx';
import { MediaWrapper } from'./MediaWrapper.jsx';

function CustomImageView({ node, updateAttributes, deleteNode }) {
 const handleUrlSubmit = (url) => {
 updateAttributes({ src: url });
 };

 const handleFileUpload = (file) => {
 const url = URL.createObjectURL(file);
 updateAttributes({ src: url });
 };

 const handleCaptionChange = (e) => {
 updateAttributes({ caption: e.target.value });
 };

 return (
 <NodeViewWrapper as="div" className="db-image-block" data-type="custom-image">
 <div className="db-image-container" style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
 {node.attrs.src ? (
 <MediaWrapper onEdit={() => updateAttributes({ src: null })} onDelete={deleteNode}>
 <img src={node.attrs.src} alt={node.attrs.caption ||"Imagem do projeto"} className="db-image" />
 </MediaWrapper>
 ) : (
 <MediaPlaceholder 
 type="image" 
 onUrlSubmit={handleUrlSubmit} 
 onFileUpload={handleFileUpload} 
 />
 )}
 
 <input
 type="text"
 className="db-image-caption-input"
 placeholder="Nome da imagem (ex: Tela Dashboard)..."
 value={node.attrs.caption ||''}
 onChange={handleCaptionChange}
 style={{
 background:'transparent',
 border:'none',
 color:'rgba(255, 255, 255, 0.5)',
 fontSize:'12px',
 fontFamily:'inherit',
 outline:'none',
 padding:'2px 4px',
 width:'100%',
 transition:'color 0.2s'
 }}
 />
 </div>
 </NodeViewWrapper>
 );
}

export const CustomImage = Node.create({
 name:'customImage',
 group:'block',
 atom: true,
 draggable: true,

 addAttributes() {
 return {
 src: {
 default: null,
 parseHTML: el => el.getAttribute('src'),
 renderHTML: attrs => attrs.src ? { src: attrs.src } : {},
 },
 caption: {
 default:'',
 parseHTML: el => el.getAttribute('data-caption'),
 renderHTML: attrs => attrs.caption ? {'data-caption': attrs.caption } : {},
 },
 };
 },

 parseHTML() {
 return [
 { tag:'div[data-type="custom-image"]' },
 { tag:'img[src]' }
 ];
 },

 renderHTML({ HTMLAttributes }) {
 return ['div', mergeAttributes(HTMLAttributes, {'data-type':'custom-image', class:'db-image-block' })];
 },

 addNodeView() {
 return ReactNodeViewRenderer(CustomImageView);
 },
});
