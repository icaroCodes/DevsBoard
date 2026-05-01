import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Typography from '@tiptap/extension-typography';
import GlobalDragHandle from 'tiptap-extension-global-drag-handle';
import AutoJoiner from 'tiptap-extension-auto-joiner';

import { SlashCommand, slashItems, slashRender } from './extensions/SlashCommand.js';
import { Callout } from './extensions/Callout.jsx';
import { Toggle } from './extensions/Toggle.jsx';
import { CustomCodeBlock } from './extensions/CodeBlock.jsx';
import { CustomImage } from './extensions/Image.jsx';
import { CustomAudio } from './extensions/Audio.jsx';
import { CustomVideo } from './extensions/Video.jsx';
import './editor.css';

export default function Editor({ value, onChange, placeholder = 'Barra de espaço ou “/” para acessar os comandos', autoFocus = false }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
        horizontalRule: { HTMLAttributes: { class: 'db-hr' } },
        blockquote: { HTMLAttributes: { class: 'db-quote' } },
        bulletList: { HTMLAttributes: { class: 'db-ul' } },
        orderedList: { HTMLAttributes: { class: 'db-ol' } },
      }),
      TaskList.configure({ HTMLAttributes: { class: 'db-tasklist' } }),
      TaskItem.configure({ nested: true, HTMLAttributes: { class: 'db-taskitem' } }),
      Placeholder.configure({
        placeholder: ({ node, editor: ed }) => {
          if (node.type.name === 'heading') return `Título ${node.attrs.level}`;
          if (ed.isEmpty) return placeholder;
          return 'Barra de espaço ou “/” para acessar os comandos';
        },
        showOnlyCurrent: true,
        includeChildren: true,
      }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { class: 'db-link' } }),
      Typography,
      GlobalDragHandle.configure({
        dragHandleWidth: 100,
        dragHandleSelector: '.drag-handle',
        excludedTags: [],
        customNodes: ['callout', 'toggle', 'customImage', 'customAudio', 'customVideo'],
      }),
      AutoJoiner.configure({ elementsToJoin: ['bulletList', 'orderedList', 'taskList'] }),
      Callout,
      Toggle,
      CustomCodeBlock,
      CustomImage,
      CustomAudio,
      CustomVideo,
      SlashCommand.configure({
        suggestion: { items: slashItems, render: slashRender },
      }),
    ],
    content: value || '',
    autofocus: autoFocus,
    editorProps: {
      attributes: {
        class: 'db-prose',
        spellcheck: 'false',
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  // Mantém em sync se o conteúdo externo mudar drasticamente (ex: troca de projeto).
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      editor.commands.setContent(value, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, !!editor]);

  // Drag handle proporcional + botão "+" (estilo Notion) ao lado do handle.
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;

    const blockSelector = 'p, h1, h2, h3, ul, ol, blockquote, pre, hr, [data-type="callout"], [data-type="toggle"], li';

    // Cria botão "+" fixo (uma vez)
    const plusBtn = document.createElement('button');
    plusBtn.type = 'button';
    plusBtn.className = 'db-add-block hide';
    plusBtn.setAttribute('aria-label', 'Adicionar bloco abaixo');
    plusBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2.5v9M2.5 7h9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    document.body.appendChild(plusBtn);

    let activeBlockPos = null;

    plusBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      if (activeBlockPos == null) return;
      const $pos = editor.state.doc.resolve(activeBlockPos);
      const after = $pos.after($pos.depth || 1);
      editor.chain().focus().insertContentAt(after, { type: 'paragraph' }).setTextSelection(after + 1).run();
      // Abre o slash menu logo em seguida
      setTimeout(() => editor.chain().focus().insertContent('/').run(), 30);
    });

    let dragY = 0;
    let isDragging = false;
    let scrollAnimationFrame = null;

    const scrollLoop = () => {
      if (!isDragging) return;
      const threshold = 120;
      const maxSpeed = 18;
      
      const scrollContainer = dom.closest('.overflow-y-auto') || window;
      const containerRect = scrollContainer === window ? { top: 0, bottom: window.innerHeight } : scrollContainer.getBoundingClientRect();
      
      const distanceFromTop = dragY - containerRect.top;
      const distanceFromBottom = containerRect.bottom - dragY;

      let speed = 0;
      if (distanceFromTop < threshold) {
        const intensity = Math.pow((threshold - distanceFromTop) / threshold, 2);
        speed = -maxSpeed * intensity;
      } else if (distanceFromBottom < threshold) {
        const intensity = Math.pow((threshold - distanceFromBottom) / threshold, 2);
        speed = maxSpeed * intensity;
      }

      if (speed !== 0) {
        scrollContainer.scrollBy(0, speed);
      }
      
      scrollAnimationFrame = requestAnimationFrame(scrollLoop);
    };

    const onDragOver = (e) => {
      dragY = e.clientY;
      if (!isDragging) {
        isDragging = true;
        scrollLoop();
      }
    };

    const onDragEnd = () => {
      isDragging = false;
      cancelAnimationFrame(scrollAnimationFrame);
    };

    document.addEventListener('dragover', onDragOver);
    document.addEventListener('dragend', onDragEnd);
    document.addEventListener('drop', onDragEnd);

    const onMove = (e) => {
      const dragHandle = document.querySelector('.drag-handle');
      const target = document.elementFromPoint(e.clientX, e.clientY);

      // Se o mouse estiver sobre um controle, mantemos o estado atual
      if (target && (target.closest('.drag-handle') || target.closest('.db-add-block'))) {
        return;
      }

      let block = target ? target.closest(blockSelector) : null;

      // Se não achou o bloco exato (ex: mouse está na gutter esquerda ou nos espaços entre blocos)
      // Cria um "campo maior" (bounding box expandida) em volta de cada elemento
      if (!block) {
         const blocks = Array.from(dom.querySelectorAll(blockSelector));
         let minDistance = Infinity;
         let closestBlock = null;

         for (const b of blocks) {
           const r = b.getBoundingClientRect();
           
           // Campo extra/maior do elemento para ativar o hover
           // 30px extra no topo e base. 120px extra na esquerda (pra alcançar os botões) e 40px na direita.
           const hitArea = {
             top: r.top - 30,
             bottom: r.bottom + 30,
             left: r.left - 120,
             right: r.right + 40
           };

           // Verifica se o mouse está DENTRO desse campo maior
           if (e.clientX >= hitArea.left && e.clientX <= hitArea.right &&
               e.clientY >= hitArea.top && e.clientY <= hitArea.bottom) {
             
             const centerY = r.top + (r.height / 2);
             const distance = Math.abs(e.clientY - centerY);
             
             if (distance < minDistance) {
               minDistance = distance;
               closestBlock = b;
             }
           }
         }
         block = closestBlock;
      }

      if (!block) {
        plusBtn.classList.add('hide');
        if (dragHandle) dragHandle.classList.add('db-drag-disabled');
        return;
      }

      // Previne que espaços vazios sejam tratáveis
      if (block.textContent.trim() === '' && block.tagName !== 'HR') {
        plusBtn.classList.add('hide');
        if (dragHandle) dragHandle.classList.add('db-drag-disabled');
        return;
      }

      if (dragHandle) dragHandle.classList.remove('db-drag-disabled');

      const r = block.getBoundingClientRect();
      const style = window.getComputedStyle(block);
      const lineH = parseInt(style.lineHeight, 10) || 24;
      const padTop = parseInt(style.paddingTop, 10) || 0;

      const top = r.top + padTop + (lineH / 2) - 12;

      plusBtn.classList.remove('hide');
      plusBtn.style.opacity = '0.4';
      plusBtn.style.top = `${top}px`;
      plusBtn.style.left = `${r.left - 50}px`;

      if (dragHandle) {
        // Usamos !important para forçar a posição visual,
        // enquanto o plugin ainda acha que está em -100px (para a área de hit funcionar)
        dragHandle.style.setProperty('top', `${top - 2}px`, 'important');
        dragHandle.style.setProperty('left', `${r.left - 28}px`, 'important');
        dragHandle.style.opacity = '0.4';
      }

      const posInfo = editor.view.posAtCoords({ left: r.left + 5, top: r.top + 5 });
      if (posInfo) activeBlockPos = posInfo.inside >= 0 ? posInfo.inside : posInfo.pos;
    };

    const onClickDragHandle = (e) => {
      // Evita disparar se estiver arrastando
      if (isDragging) return;
      e.preventDefault();
      e.stopPropagation();

      const dragHandle = document.querySelector('.drag-handle');
      if (!dragHandle) return;

      const rect = dragHandle.getBoundingClientRect();
      document.querySelector('.db-block-menu')?.remove();

      const menu = document.createElement('div');
      menu.className = 'db-block-menu solid-modal';
      menu.style.position = 'fixed';
      menu.style.top = `${rect.bottom + 5}px`;
      menu.style.left = `${rect.left}px`;
      menu.style.zIndex = '1000';
      menu.style.minWidth = '140px';
      menu.style.padding = '5px';
      menu.style.borderRadius = '10px';
      menu.style.display = 'flex';
      menu.style.flexDirection = 'column';
      menu.style.gap = '2px';
      menu.style.background = 'rgba(28, 28, 30, 0.98)';
      menu.style.backdropFilter = 'blur(20px)';
      menu.style.border = '1px solid rgba(255, 255, 255, 0.08)';

      const createItem = (label, icon, action, color = 'inherit') => {
        const item = document.createElement('button');
        item.className = 'db-block-menu-item';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.gap = '10px';
        item.style.padding = '8px 12px';
        item.style.borderRadius = '6px';
        item.style.fontSize = '13px';
        item.style.fontWeight = '500';
        item.style.border = 'none';
        item.style.background = 'transparent';
        item.style.color = color;
        item.style.cursor = 'pointer';
        item.style.textAlign = 'left';
        item.innerHTML = `<span style="opacity: 0.7">${icon}</span> ${label}`;
        item.onclick = () => {
          action();
          menu.remove();
        };
        return item;
      };

      menu.appendChild(createItem('Duplicar', '&#x23F5;', () => {
        editor.chain().focus(activeBlockPos).setNodeSelection(activeBlockPos).run();
        const node = editor.state.selection.$from.node();
        editor.chain().insertContentAt(activeBlockPos + node.nodeSize, node.toJSON()).run();
      }, '#E5E5EA'));

      menu.appendChild(createItem('Excluir', '&#x1F5D1;', () => {
        editor.chain().focus(activeBlockPos).setNodeSelection(activeBlockPos).deleteSelection().run();
      }, '#FF453A'));

      document.body.appendChild(menu);

      const closeMenu = (ev) => {
        if (!menu.contains(ev.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      };
      setTimeout(() => document.addEventListener('click', closeMenu), 10);
    };

    // Anexa o evento de click ao drag handle no documento inteiro
    const onDocClick = (e) => {
      if (e.target.closest('.drag-handle')) {
        onClickDragHandle(e);
      }
    };
    document.addEventListener('click', onDocClick);

    const onLeave = () => {
      plusBtn.classList.add('hide');
      const dragHandle = document.querySelector('.drag-handle');
      if (dragHandle) dragHandle.classList.add('db-drag-disabled');
    };

    const container = dom.parentElement || dom;
    const scrollContainer = dom.closest('.overflow-y-auto') || window;
    
    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseleave', onLeave);
    scrollContainer.addEventListener('scroll', onLeave, { passive: true });
    
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('dragend', onDragEnd);
      document.removeEventListener('drop', onDragEnd);
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseleave', onLeave);
      scrollContainer.removeEventListener('scroll', onLeave);
      plusBtn.remove();
      cancelAnimationFrame(scrollAnimationFrame);
    };
  }, [editor]);

  return <EditorContent editor={editor} />;
}
