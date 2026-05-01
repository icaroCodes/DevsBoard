import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { MediaPlaceholder } from './MediaPlaceholder.jsx';
import { MediaWrapper } from './MediaWrapper.jsx';

function CustomVideoView({ node, updateAttributes, deleteNode }) {
  const handleUrlSubmit = (url) => {
    updateAttributes({ src: url });
  };

  const handleFileUpload = (file) => {
    const url = URL.createObjectURL(file);
    updateAttributes({ src: url });
  };

  return (
    <NodeViewWrapper as="div" className="db-video-block" data-type="custom-video">
      {node.attrs.src ? (
        <MediaWrapper onEdit={() => updateAttributes({ src: null })} onDelete={deleteNode}>
          <div className="db-video-player-wrapper" contentEditable={false}>
              <video controls src={node.attrs.src} className="db-video-player w-full outline-none" style={{ width: '100%', borderRadius: '8px', background: '#000' }} />
          </div>
        </MediaWrapper>
      ) : (
        <MediaPlaceholder 
          type="video" 
          onUrlSubmit={handleUrlSubmit} 
          onFileUpload={handleFileUpload} 
        />
      )}
    </NodeViewWrapper>
  );
}

export const CustomVideo = Node.create({
  name: 'customVideo',
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
      { tag: 'div[data-type="custom-video"]' },
      { tag: 'video[src]' }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'custom-video', class: 'db-video-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomVideoView);
  },
});
