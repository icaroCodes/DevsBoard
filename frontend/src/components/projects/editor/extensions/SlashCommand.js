import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import SlashMenu from '../SlashMenu.jsx';

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        allowSpaces: false,
        command: ({ editor, range, props }) => props.command({ editor, range }),
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export const slashItems = ({ query }) => {
  const items = [
    { key: 'h1',       title: 'Título 1',     hint: 'Cabeçalho grande',           icon: 'H1', cmd: (e, range) => e.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run() },
    { key: 'h2',       title: 'Título 2',     hint: 'Cabeçalho médio',            icon: 'H2', cmd: (e, range) => e.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run() },
    { key: 'h3',       title: 'Título 3',     hint: 'Cabeçalho pequeno',          icon: 'H3', cmd: (e, range) => e.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run() },
    { key: 'text',     title: 'Texto',        hint: 'Parágrafo simples',          icon: 'T',  cmd: (e, range) => e.chain().focus().deleteRange(range).setNode('paragraph').run() },
    { key: 'todo',     title: 'Lista de tarefas', hint: 'Checkboxes',             icon: '☐',  cmd: (e, range) => e.chain().focus().deleteRange(range).toggleTaskList().run() },
    { key: 'bullet',   title: 'Lista',        hint: 'Marcadores',                 icon: '•',  cmd: (e, range) => e.chain().focus().deleteRange(range).toggleBulletList().run() },
    { key: 'numbered', title: 'Lista numerada', hint: '1. 2. 3.',                 icon: '1.', cmd: (e, range) => e.chain().focus().deleteRange(range).toggleOrderedList().run() },
    { key: 'quote',    title: 'Citação',      hint: 'Bloco em destaque',          icon: '❝', cmd: (e, range) => e.chain().focus().deleteRange(range).toggleBlockquote().run() },
    { key: 'callout',  title: 'Callout',      hint: 'Destaque com ícone',         icon: '💡', cmd: (e, range) => e.chain().focus().deleteRange(range).insertContent({ type: 'callout', attrs: { emoji: '💡' }, content: [{ type: 'paragraph' }] }).run() },
    { key: 'toggle',   title: 'Alternar',     hint: 'Bloco retrátil',             icon: '▸',  cmd: (e, range) => e.chain().focus().deleteRange(range).insertContent({ type: 'toggle', attrs: { open: true }, content: [{ type: 'paragraph' }, { type: 'paragraph' }] }).run() },
    { key: 'code',     title: 'Código',       hint: 'Bloco monoespaço',           icon: '<>', cmd: (e, range) => e.chain().focus().deleteRange(range).toggleCodeBlock().run() },
    { key: 'hr',       title: 'Divisor',      hint: 'Linha separadora',           icon: '─',  cmd: (e, range) => e.chain().focus().deleteRange(range).setHorizontalRule().run() },
  ];
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(i => i.title.toLowerCase().includes(q) || i.key.includes(q));
};

export const slashRender = () => {
  let component;
  let popup;
  return {
    onStart: (props) => {
      component = new ReactRenderer(SlashMenu, { props, editor: props.editor });
      if (!props.clientRect) return;
      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
        animation: 'shift-away-subtle',
        duration: [120, 100],
      });
    },
    onUpdate: (props) => {
      component?.updateProps(props);
      if (!props.clientRect) return;
      popup?.[0]?.setProps({ getReferenceClientRect: props.clientRect });
    },
    onKeyDown: (props) => {
      if (props.event.key === 'Escape') { popup?.[0]?.hide(); return true; }
      return component?.ref?.onKeyDown?.(props) || false;
    },
    onExit: () => {
      popup?.[0]?.destroy();
      component?.destroy();
    },
  };
};
