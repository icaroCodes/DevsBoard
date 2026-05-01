import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { MediaPlaceholder } from './MediaPlaceholder.jsx';
import { MediaWrapper } from './MediaWrapper.jsx';

function CustomImageView({ node, updateAttributes, deleteNode }) {
  const handleUrlSubmit = (url) => {
    updateAttributes({ src: url });
  };

  const handleFileUpload = (file) => {
    const url = URL.createObjectURL(file);
    updateAttributes({ src: url });
  };

  return (
    <NodeViewWrapper as="div" className="db-image-block" data-type="custom-image">
      {node.attrs.src ? (
        <MediaWrapper onEdit={() => updateAttributes({ src: null })} onDelete={deleteNode}>
          <img src={node.attrs.src} alt="Imagem do projeto" className="db-image" />
        </MediaWrapper>
      ) : (
        <MediaPlaceholder 
          type="image" 
          onUrlSubmit={handleUrlSubmit} 
          onFileUpload={handleFileUpload} 
        />
      )}
    </NodeViewWrapper>
  );
}

export const CustomImage = Node.create({
  name: 'customImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: el => el.getAttribute('src'),
        renderHTML: attrs => attrs.src ? { src: attrs.src } : {},
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="custom-image"]' },
      { tag: 'img[src]' }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'custom-image', class: 'db-image-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomImageView);
  },
});
