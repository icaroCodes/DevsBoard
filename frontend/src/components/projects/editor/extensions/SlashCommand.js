import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import SlashMenu from '../SlashMenu.jsx';

const PROJETO_TEMPLATE = [
  {
    type: 'heading',
    attrs: { level: 1 },
    content: [{ type: 'text', text: '🟢 Nome do Projeto' }]
  },
  {
    type: 'paragraph',
    content: [{ type: 'text', text: 'Esta é uma descrição curta do projeto (2–3 linhas). Explique o valor principal aqui.' }]
  },
  {
    type: 'customImage',
    attrs: { src: null }
  },
  {
    type: 'callout',
    attrs: { emoji: '🟡' },
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '1. VISÃO GERAL' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Objetivo' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Explicação clara do propósito do projeto.' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Problema que resolve' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '[Descreva o problema aqui]' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Público-alvo' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '[Descreva o público aqui]' }] },
    ]
  },
  {
    type: 'callout',
    attrs: { emoji: '🟣' },
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '2. FUNCIONALIDADES' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Nome da funcionalidade' }] },
      { type: 'heading', attrs: { level: 4 }, content: [{ type: 'text', text: 'Descrição' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '[Breve explicação]' }] },
      { type: 'heading', attrs: { level: 4 }, content: [{ type: 'text', text: 'Regras de negócio' }] },
      { type: 'bulletList', content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Regra 1' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Regra 2' }] }] }
      ]},
      { type: 'heading', attrs: { level: 4 }, content: [{ type: 'text', text: 'Estados' }] },
      { type: 'bulletList', content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Loading' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Empty' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Error' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Success' }] }] }
      ]}
    ]
  },
  {
    type: 'callout',
    attrs: { emoji: '🔵' },
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '3. INTERFACE (UI/UX)' }] },
      { type: 'customImage', attrs: { src: null, caption: 'Tela Dashboard' } },
      { type: 'customImage', attrs: { src: null, caption: 'Tela Projeto' } },
      { type: 'customImage', attrs: { src: null, caption: 'Tela Configurações' } },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Estrutura das telas' }] },
      { type: 'bulletList', content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Header fixo' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Navegação lateral' }] }] }
      ]}
    ]
  },
  {
    type: 'callout',
    attrs: { emoji: '🟠' },
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '4. SISTEMA DE DESIGN' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Tipografia' }] },
      { type: 'bulletList', content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'H1 → títulos principais' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'H2 → seções' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'P → texto' }] }] }
      ]},
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Componentes' }] },
      { type: 'bulletList', content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Botões (Primary, Secondary)' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Inputs' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cards' }] }] }
      ]}
    ]
  },
  {
    type: 'callout',
    attrs: { emoji: '🔴' },
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '5. ARQUITETURA FRONTEND' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Estrutura de pastas' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '/src/components, /src/pages, /src/hooks' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Tecnologias' }] },
      { type: 'bulletList', content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'React' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Tailwind CSS' }] }] }
      ]}
    ]
  },
  {
    type: 'callout',
    attrs: { emoji: '⚫' },
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '6. BACKEND' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Estrutura' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '/server/routes, /server/controllers, /server/services' }] }
    ]
  },
  {
    type: 'callout',
    attrs: { emoji: '🟤' },
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '7. BANCO DE DADOS' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Nome da tabela' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Campos: id, created_at, ... | Tipo: UUID, Timestamp | Relações: ...' }] }
    ]
  },
  {
    type: 'callout',
    attrs: { emoji: '🔐' },
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '8. AUTENTICAÇÃO' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Tipo: JWT / OAuth | Regras: RBAC | Segurança: HTTPS' }] }
    ]
  },
  {
    type: 'callout',
    attrs: { emoji: '⚙️' },
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '9. VARIÁVEIS DE AMBIENTE' }] },
      { type: 'codeBlock', content: [{ type: 'text', text: 'API_URL=\nDATABASE_URL=' }] }
    ]
  },
  {
    type: 'callout',
    attrs: { emoji: '🚀' },
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '10. DEPLOY' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Frontend: Vercel | Backend: Docker/Fly.io | Banco: Neon' }] }
    ]
  },
  {
    type: 'callout',
    attrs: { emoji: '📸' },
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '11. IMAGENS DO PROJETO' }] },
      { type: 'bulletList', content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Tela 1' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Tela 2' }] }] }
      ]}
    ]
  },
  {
    type: 'callout',
    attrs: { emoji: '📊' },
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '12. ESTADOS DA UI' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Tela Principal' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Loading, Empty, Error, Success' }] }
    ]
  },
  {
    type: 'callout',
    attrs: { emoji: '🧠' },
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '13. ROADMAP' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'v1: MVP | v2: Beta | v3: Launch' }] }
    ]
  },
];

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

  addKeyboardShortcuts() {
    return {
      'Space': ({ editor }) => {
        const { selection } = editor.state;
        // Se a seleção for vazia e estiver num parágrafo completamente vazio
        if (selection.empty && selection.$head.parent.textContent === '' && selection.$head.parent.type.name === 'paragraph') {
          editor.chain().focus().insertContent('/').run();
          return true; // Intercepta o espaço
        }
        return false;
      }
    };
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
    { key: 'image',    title: 'Foto',         hint: 'Adicionar imagem',           icon: '🖼️', cmd: (e, range) => e.chain().focus().deleteRange(range).insertContent({ type: 'customImage' }).run() },
    { key: 'video',    title: 'Vídeo',        hint: 'Integrar ou carregar vídeo', icon: '▶️', cmd: (e, range) => e.chain().focus().deleteRange(range).insertContent({ type: 'customVideo' }).run() },
    { key: 'audio',    title: 'Áudio',        hint: 'Adicionar player de áudio',  icon: '🎵', cmd: (e, range) => e.chain().focus().deleteRange(range).insertContent({ type: 'customAudio' }).run() },
    { key: 'hr',       title: 'Divisor',      hint: 'Linha separadora',           icon: '─',  cmd: (e, range) => e.chain().focus().deleteRange(range).setHorizontalRule().run() },
    { key: 'projeto',  title: 'Projeto',      hint: 'Estrutura técnica completa', icon: '🚀', cmd: (e, range) => e.chain().focus().deleteRange(range).insertContent(PROJETO_TEMPLATE).run() },
    { key: 'excluir',  title: 'Excluir tudo', hint: 'Limpar página inteira',      icon: '🗑️', cmd: (e, range) => e.chain().focus().clearContent(true).run() },
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
