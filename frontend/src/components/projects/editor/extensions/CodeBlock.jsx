import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import CodeBlock from '@tiptap/extension-code-block';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Copy, Check, MoreHorizontal, ChevronDown, Smile, Paperclip, ArrowUp, AtSign, Reply, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useCodeComments } from '../../../../hooks/useProjects';

function relTime(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString();
}

function splitAttachment(content) {
  const m = content?.match(/!\[anexo\]\((.*?)\)/);
  const text = (content || '').replace(/\n?\n?!\[anexo\]\((.*?)\)/g, '').trim();
  return { text, attachment: m ? m[1] : null };
}

/* ================================================================
   LANGUAGE LIST
   ================================================================ */
const LANGUAGES = [
  'ABAP', 'AutoHotkey', 'Bash', 'Basic', 'C', 'C#', 'C++', 'CSS', 'Dart', 'Docker',
  'Elixir', 'Erlang', 'Flow', 'Fortran', 'Fórmula do Notion', 'Gherkin', 'GLSL', 'Go',
  'GraphQL', 'Groovy', 'Haskell', 'HCL', 'HTML', 'Idris', 'Java', 'JavaScript', 'JSON',
  'Julia', 'Kotlin', 'LaTeX', 'Lisp', 'Lua', 'Markdown', 'MATLAB', 'Nix', 'Objective-C',
  'OCaml', 'Pascal', 'Perl', 'PHP', 'PowerShell', 'Prolog', 'Python', 'R', 'Ruby',
  'Rust', 'Scala', 'HolyC', 'Shell', 'SQL', 'Swift', 'TypeScript', 'Visual Basic', 'WebAssembly',
  'XML', 'YAML'
];

/* ================================================================
   COLOR THEMES — per language
   ================================================================ */
const COMMENT_COLOR = '#75A263';

const THEMES = {
  // JavaScript / TypeScript — matches the VS Code screenshot
  javascript: {
    keyword: '#C77F95',   // import, from, export, const, function, return, if …
    string: '#D08955',   // 'react', '@tiptap/starter-kit' …
    number: '#D08955',   // 42, 3.14 …
    function: '#DDDA16',   // useEditor(), configure() …
    type: '#90DDDB',   // StarterKit, TaskList, Placeholder (capitalized identifiers)
    special: '#55C3FF',   // true, false, null, undefined
    operator: '#C77F95',   // =>, =, +, -, …
    punct: '#9899A0',   // { } [ ] ( ) , ;
    param: '#9CDCFE',   // parameters / variable references
  },
  typescript: null, // alias → filled below

  // HTML / XML
  html: {
    tag: '#E06C75',   // <div>, </span>, tag names …
    attr: '#D19A66',   // id, class, href … (attribute keys)
    string: '#98C379',   // "…", '…' (attribute values)
    bracket: '#ABB2BF',   // <, >, /
    special: '#61AFEF',   // DOCTYPE, embedded expressions …
    entity: '#C678DD',   // &amp;, &#160; …
    punct: '#9899A0',   // =, whitespace between tokens
  },
  xml: null, // alias → filled below

  // CSS
  css: {
    selector: '#E06C75',   // .class, #id, h1 …
    property: '#D19A66',   // margin, color, display …
    value: '#98C379',   // red, flex, 1fr …
    unit: '#E5C07B',   // px, em, rem, % …
    special: '#C678DD',   // !important, inherit, none …
    string: '#98C379',   // 'Segoe UI' …
    number: '#D19A66',   // 12, 0.5 …
    punct: '#9899A0',   // { } : ; ,
  },

  // Python
  python: {
    keyword: '#FF6B9D',   // def, class, if, import …
    string: '#A8DB8F',   // '…', """…"""
    number: '#FFB86C',   // 42, 3.14 …
    function: '#BD93F9',   // foo(, calls
    builtin: '#8BE9FD',   // len, range, print …
    decorator: '#FF79C6',   // @staticmethod …
    operator: '#FFB86C',   // +, ==, := …
    punct: '#9899A0',   // ( ) [ ] : ,
  },

  // Java
  java: {
    keyword: '#CF8E6D',   // public, static, void …
    string: '#6A8759',   // "…"
    number: '#6897BB',   // literals
    type: '#FFC66D',   // String, int, List …
    annotation: '#BBB529',   // @Override …
    operator: '#CF8E6D',   // +, ==, instanceof …
    punct: '#9899A0',   // { } ; .
  },

  // C
  c: {
    keyword: '#569CD6',   // int, return, struct …
    string: '#CE9178',   // "…"
    number: '#B5CEA8',   // literals
    preprocessor: '#C586C0',   // #include, #define …
    type: '#4EC9B0',   // size_t, uint8_t …
    operator: '#569CD6',   // +, ->, :: …
    punct: '#9899A0',   // { } ; *
  },

  // C++
  'c++': null, // alias → filled below
};

// Aliases
THEMES.typescript = { ...THEMES.javascript };
THEMES.xml = { ...THEMES.html };
THEMES['c++'] = { ...THEMES.c };
THEMES['c#'] = { ...THEMES.java };

/* ================================================================
   CONTEXT-AWARE LEXER
   Single-pass scan finds strings AND comments together so that
   a "//" or "/*" inside a string is never misidentified as a comment.
   ================================================================ */

// C-style: strings + // + /* */  (for JS, Java, C, CSS)
function scanBase(text) {
  const tokens = [];
  const re = /`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/\/[^\n]*|\/\*[\s\S]*?\*\//g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const s = m[0];
    const isComment = s.startsWith('//') || s.startsWith('/*');
    tokens.push({ from: m.index, to: m.index + s.length, type: isComment ? 'comment' : 'string' });
  }
  return tokens;
}

// Python: strings + # + /* */
function scanPython(text) {
  const tokens = [];
  const re = /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|#[^\n]*/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const s = m[0];
    const isComment = s.startsWith('#');
    tokens.push({ from: m.index, to: m.index + s.length, type: isComment ? 'comment' : 'string' });
  }
  return tokens;
}

// HTML: strings + <!-- -->
function scanHTML(text) {
  const tokens = [];
  const re = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|<!--[\s\S]*?-->|\/\*[\s\S]*?\*\//g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const s = m[0];
    const isComment = s.startsWith('<!--') || s.startsWith('/*');
    tokens.push({ from: m.index, to: m.index + s.length, type: isComment ? 'comment' : 'string' });
  }
  return tokens;
}

// Check if a position overlaps with any existing token
function overlaps(tokens, from, to) {
  return tokens.some(t => !(to <= t.from || from >= t.to));
}

function addIfFree(tokens, from, to, color) {
  if (!overlaps(tokens, from, to)) {
    tokens.push({ from, to, color });
  }
}

// ── JavaScript / TypeScript ──
function tokenizeJS(text, theme) {
  // Single-pass: find all strings & comments together (context-aware)
  const scanned = scanBase(text);
  const tokens = [];
  for (const t of scanned) {
    tokens.push({ from: t.from, to: t.to, color: t.type === 'comment' ? COMMENT_COLOR : theme.string });
  }

  let m;
  // Numbers
  const numRe = /\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g;
  while ((m = numRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.number);

  // Keywords
  const kwRe = /\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|extends|new|this|super|import|export|from|default|async|await|yield|throw|try|catch|finally|typeof|instanceof|in|of|delete|void|static|get|set)\b/g;
  while ((m = kwRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.keyword);

  // Special values (blue)
  const specRe = /\b(?:true|false|null|undefined|NaN|Infinity)\b/g;
  while ((m = specRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.special);

  // Capitalized identifiers → types/classes (teal)
  const typeRe = /\b([A-Z][a-zA-Z0-9_$]*)\b/g;
  while ((m = typeRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.type);

  // Function calls — word(
  const fnRe = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g;
  while ((m = fnRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[1].length, theme.function);

  // Dot-accessed methods — .configure(
  const dotFnRe = /\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g;
  while ((m = dotFnRe.exec(text)) !== null) addIfFree(tokens, m.index + 1, m.index + 1 + m[1].length, theme.function);

  // Arrow + operators
  const opRe = /=>|[+\-*/%=!<>&|^~?:]+/g;
  while ((m = opRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.operator);

  return tokens;
}

// ── HTML / XML ──
function tokenizeHTML(text, theme) {
  const scanned = scanHTML(text);
  const tokens = [];
  for (const t of scanned) {
    tokens.push({ from: t.from, to: t.to, color: t.type === 'comment' ? COMMENT_COLOR : theme.string });
  }

  let m;

  // Tags (opening and closing)
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9-]*)/g;
  while ((m = tagRe.exec(text)) !== null) {
    addIfFree(tokens, m.index, m.index + (m[0].startsWith('</') ? 2 : 1), theme.bracket);
    const nameStart = m.index + (m[0].startsWith('</') ? 2 : 1);
    addIfFree(tokens, nameStart, nameStart + m[1].length, theme.tag);
  }
  const closeRe = /\/?>/g;
  while ((m = closeRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.bracket);

  // Attributes
  const attrRe = /\b([a-zA-Z_:][a-zA-Z0-9_.:-]*)\s*(?==)/g;
  while ((m = attrRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[1].length, theme.attr);

  // Entities
  const entRe = /&[a-zA-Z0-9#]+;/g;
  while ((m = entRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.entity);

  return tokens;
}

// ── CSS ──
function tokenizeCSS(text, theme) {
  const scanned = scanBase(text);
  const tokens = [];
  for (const t of scanned) {
    tokens.push({ from: t.from, to: t.to, color: t.type === 'comment' ? COMMENT_COLOR : theme.string });
  }

  let m;
  // Properties (word followed by :)
  const propRe = /([a-zA-Z-]+)\s*(?=:)/g;
  while ((m = propRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[1].length, theme.property);

  // Numbers + units
  const numRe = /\b(\d+(?:\.\d+)?)(px|em|rem|%|vh|vw|vmin|vmax|deg|s|ms|fr|ch|ex)?\b/g;
  while ((m = numRe.exec(text)) !== null) {
    addIfFree(tokens, m.index, m.index + m[1].length, theme.number);
    if (m[2]) addIfFree(tokens, m.index + m[1].length, m.index + m[0].length, theme.unit);
  }

  // Hex colors
  const hexRe = /#[0-9a-fA-F]{3,8}\b/g;
  while ((m = hexRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.value);

  // Selectors
  const selRe = /[.#@][a-zA-Z_-][a-zA-Z0-9_-]*/g;
  while ((m = selRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.selector);

  // Special keywords
  const kwRe = /\b(?:important|inherit|initial|unset|none|auto|flex|grid|block|inline|solid|dashed|dotted|transparent)\b|!important/g;
  while ((m = kwRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.special);

  return tokens;
}

// ── Python ──
function tokenizePython(text, theme) {
  const scanned = scanPython(text);
  const tokens = [];
  for (const t of scanned) {
    tokens.push({ from: t.from, to: t.to, color: t.type === 'comment' ? COMMENT_COLOR : theme.string });
  }

  let m;
  // Decorators
  const decRe = /@[a-zA-Z_][a-zA-Z0-9_.]*/g;
  while ((m = decRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.decorator);

  // Numbers
  const numRe = /\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?j?)\b/g;
  while ((m = numRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.number);

  // Keywords
  const kwRe = /\b(?:def|class|return|if|elif|else|for|while|try|except|finally|with|as|import|from|pass|break|continue|raise|yield|lambda|and|or|not|is|in|del|global|nonlocal|assert|async|await|True|False|None)\b/g;
  while ((m = kwRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.keyword);

  // Built-ins
  const biRe = /\b(?:print|len|range|int|str|float|list|dict|set|tuple|type|isinstance|hasattr|getattr|setattr|super|property|staticmethod|classmethod|enumerate|zip|map|filter|sorted|reversed|open|input|abs|max|min|sum|all|any|iter|next)\b/g;
  while ((m = biRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.builtin);

  // Function calls
  const fnRe = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g;
  while ((m = fnRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[1].length, theme.function);

  return tokens;
}

// ── Java ──
function tokenizeJava(text, theme) {
  const scanned = scanBase(text);
  const tokens = [];
  for (const t of scanned) {
    tokens.push({ from: t.from, to: t.to, color: t.type === 'comment' ? COMMENT_COLOR : theme.string });
  }

  let m;
  // Annotations
  const annRe = /@[a-zA-Z_][a-zA-Z0-9_]*/g;
  while ((m = annRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.annotation);

  // Numbers
  const numRe = /\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[fFdDlL]?)\b/g;
  while ((m = numRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.number);

  // Keywords
  const kwRe = /\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while|true|false|null)\b/g;
  while ((m = kwRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.keyword);

  // Types (uppercase start)
  const typeRe = /\b([A-Z][a-zA-Z0-9_]*)\b/g;
  while ((m = typeRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.type);

  return tokens;
}

// ── C / C++ ──
function tokenizeC(text, theme) {
  const scanned = scanBase(text);
  const tokens = [];
  for (const t of scanned) {
    tokens.push({ from: t.from, to: t.to, color: t.type === 'comment' ? COMMENT_COLOR : theme.string });
  }

  let m;
  // Preprocessor directives
  const ppRe = /#\s*(?:include|define|undef|ifdef|ifndef|if|else|elif|endif|pragma|error|warning|line)\b[^\n]*/g;
  while ((m = ppRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.preprocessor);

  // Includes <...>
  const incRe = /<[a-zA-Z0-9_./]+>/g;
  while ((m = incRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.string);

  // Numbers
  const numRe = /\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[uUlLfF]*)\b/g;
  while ((m = numRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.number);

  // Keywords
  const kwRe = /\b(?:auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|restrict|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|class|namespace|template|typename|virtual|override|public|private|protected|new|delete|try|catch|throw|using|bool|true|false|nullptr|constexpr|noexcept|decltype|static_cast|dynamic_cast|reinterpret_cast|const_cast|nullptr_t)\b/g;
  while ((m = kwRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.keyword);

  // Types
  const typeRe = /\b(?:int8_t|int16_t|int32_t|int64_t|uint8_t|uint16_t|uint32_t|uint64_t|size_t|ptrdiff_t|FILE|string|vector|map|set|list|deque|queue|stack|pair|array|shared_ptr|unique_ptr|weak_ptr|optional|variant|tuple|span|string_view)\b/g;
  while ((m = typeRe.exec(text)) !== null) addIfFree(tokens, m.index, m.index + m[0].length, theme.type);

  return tokens;
}

// Generic fallback: only comments highlighted (context-aware)
function tokenizeGeneric(text) {
  const scanned = scanBase(text);
  const tokens = [];
  for (const t of scanned) {
    if (t.type === 'comment') tokens.push({ from: t.from, to: t.to, color: COMMENT_COLOR });
  }
  return tokens;
}

/* ================================================================
   DISPATCH — pick tokenizer by language
   ================================================================ */
function normLang(lang) {
  return (lang || '').toLowerCase().trim();
}

function tokenize(text, lang) {
  const n = normLang(lang);
  const theme = THEMES[n];

  if (n === 'javascript' || n === 'typescript' || n === 'json') return tokenizeJS(text, theme || THEMES.javascript);
  if (n === 'html' || n === 'xml') return tokenizeHTML(text, theme || THEMES.html);
  if (n === 'css') return tokenizeCSS(text, THEMES.css);
  if (n === 'python') return tokenizePython(text, THEMES.python);
  if (n === 'java' || n === 'c#') return tokenizeJava(text, theme || THEMES.java);
  if (n === 'c' || n === 'c++') return tokenizeC(text, theme || THEMES.c);
  return tokenizeGeneric(text);
}

/* ================================================================
   PROSEMIRROR DECORATION PLUGIN
   ================================================================ */
const highlightPluginKey = new PluginKey('codeBlockHighlight');

function buildDecorations(doc) {
  const decorations = [];

  doc.descendants((node, pos) => {
    if (node.type.name !== 'codeBlock') return;

    const lang = node.attrs.language || '';
    const text = node.textContent;
    if (!text) return;

    const tokens = tokenize(text, lang);
    const startPos = pos + 1; // skip the opening of the code_block node

    for (const token of tokens) {
      if (token.from >= token.to) continue;
      decorations.push(
        Decoration.inline(
          startPos + token.from,
          startPos + token.to,
          { style: `color: ${token.color}` }
        )
      );
    }
  });

  return DecorationSet.create(doc, decorations);
}

/* ================================================================
   COMMENT BOXES — framer-motion + menu modal estilo Apple
   ================================================================ */
const COMMENT_BOX_GAP = 6;
const REACTIONS = ['👍', '❤️', '🔥', '👀', '🎉', '😂'];

function ThreadAvatar({ name, url, size = 22 }) {
  const initial = (name || '?').trim().charAt(0) || '?';
  if (url) {
    return (
      <img src={url} alt="" className="db-codeblock-thread-avatar-img" style={{ width: size, height: size }} />
    );
  }
  return (
    <span
      className="db-codeblock-thread-avatar-letter"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.46) }}
    >{initial}</span>
  );
}

function parseMoreMenu(key) {
  if (!key) return null;
  if (key.startsWith('root:')) return { kind: 'root', commentId: key.slice(5) };
  if (key.startsWith('reply:')) {
    const rest = key.slice(6);
    const idx = rest.indexOf(':');
    if (idx === -1) return null;
    return { kind: 'reply', commentId: rest.slice(0, idx), replyId: rest.slice(idx + 1) };
  }
  return null;
}

function CommentBoxes({ comments, onUpdate, onDelete, onReply, onUpdateReply, onRemoveReply, currentUser }) {
  const boxRefs = useRef({});
  const menuRef = useRef(null);
  const replyFileRef = useRef(null);
  const [offsets, setOffsets] = useState({});
  const [hoveredId, setHoveredId] = useState(null);
  const [hoveredReply, setHoveredReply] = useState(null); // `${cid}:${rid}`
  const [moreMenu, setMoreMenu] = useState(null); // root:<cid> | reply:<cid>:<rid>
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editingReply, setEditingReply] = useState(null); // { commentId, replyId }
  const [editReplyText, setEditReplyText] = useState('');
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyAttachment, setReplyAttachment] = useState(null);
  const [reactPickerCommentId, setReactPickerCommentId] = useState(null);
  const [replyEmojiPickerFor, setReplyEmojiPickerFor] = useState(null); // `${cid}:${rid}`
  const [exitingIds, setExitingIds] = useState(new Set());

  const sorted = useMemo(() => {
    return [...comments].sort((a, b) => {
      const la = a.lineStart ?? a.line ?? 0;
      const lb = b.lineStart ?? b.line ?? 0;
      return la - lb;
    });
  }, [comments]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const newOffsets = {};
      let prevBottom = -Infinity;
      for (const c of sorted) {
        const ls = c.lineStart ?? c.line ?? 0;
        const naturalTop = 14 + ls * 21;
        const el = boxRefs.current[c.id];
        const h = el ? el.offsetHeight : 80;
        const actualTop = Math.max(naturalTop, prevBottom + COMMENT_BOX_GAP);
        newOffsets[c.id] = actualTop;
        prevBottom = actualTop + h;
      }
      setOffsets(prev => {
        const changed = sorted.some(x => prev[x.id] !== newOffsets[x.id]);
        return changed ? newOffsets : prev;
      });
    });
  }, [sorted, editingId, replyingId, replyText]);

  useEffect(() => {
    if (!reactPickerCommentId && !replyEmojiPickerFor) return;
    const handler = () => {
      setReactPickerCommentId(null);
      setReplyEmojiPickerFor(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [reactPickerCommentId, replyEmojiPickerFor]);

  useEffect(() => {
    if (!moreMenu) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMoreMenu(null);
    };
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMoreMenu(null);
      }
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [moreMenu]);

  const handleReact = (commentId, emoji) => {
    const c = comments.find(x => x.id === commentId);
    if (!c) return;
    const reactions = { ...(c.reactions || {}) };
    reactions[emoji] = (reactions[emoji] || 0) + 1;
    onUpdate?.(commentId, { reactions });
    setReactPickerCommentId(null);
    setReplyEmojiPickerFor(null);
  };

  const handleResolve = (commentId) => {
    const c = comments.find(x => x.id === commentId);
    if (!c) return;
    
    // Animação de saída para "concluído"
    setExitingIds(prev => new Set(prev).add(commentId));
    
    setTimeout(() => {
      onDelete?.(commentId);
      setExitingIds(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }, 300);
  };

  const handleEditSave = (commentId) => {
    if (!editText.trim()) return;
    onUpdate?.(commentId, { text: editText });
    setEditingId(null);
  };

  const handleReplySave = (commentId) => {
    const base = replyText.trim();
    if (!base && !replyAttachment) return;
    let payload = base;
    if (replyAttachment) {
      payload = (base ? `${base}\n\n` : '') + `![anexo](${replyAttachment})`;
    }
    if (onReply) {
      onReply(commentId, payload);
    } else {
      const c = comments.find(x => x.id === commentId);
      if (!c) return;
      const replies = [...(c.replies || []), { text: payload, author: 'Você', time: 'agora' }];
      onUpdate?.(commentId, { replies });
    }
    setReplyingId(null);
    setReplyText('');
    setReplyAttachment(null);
  };

  const openReplyComposer = (commentId) => {
    setReplyingId(commentId);
    setReplyText('');
    setReplyAttachment(null);
    setMoreMenu(null);
    setReactPickerCommentId(null);
    setReplyEmojiPickerFor(null);
  };

  const handleReplyEditSave = async () => {
    if (!editingReply || !editReplyText.trim() || !onUpdateReply) return;
    try {
      await onUpdateReply(editingReply.commentId, editingReply.replyId, { content: editReplyText.trim() });
      setEditingReply(null);
      setEditReplyText('');
    } catch (e) { console.error(e); }
  };

  const onReplyFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => setReplyAttachment(ev.target.result);
    r.readAsDataURL(file);
    e.target.value = '';
  };

  const menuParsed = parseMoreMenu(moreMenu);
  const modalComment = menuParsed ? comments.find(x => String(x.id) === String(menuParsed.commentId)) : null;

  return (
    <>
      {sorted.map(c => {
        const ls = c.lineStart ?? c.line ?? 0;
        const le = c.lineEnd ?? c.line ?? 0;
        const label = ls === le ? `L${ls + 1}` : `L${ls + 1}–${le + 1}`;
        const topPx = offsets[c.id];
        const isHovered = hoveredId === c.id;
        const style = topPx != null
          ? { top: `${topPx}px` }
          : { top: `calc(14px + ${ls * 1.5}em)` };

        const replies = c.replies || [];
        const hasThreadBelow = replies.length > 0 || replyingId === c.id;
        const replyHasContent = !!(replyText.trim() || replyAttachment);

        const menuForCard = moreMenu && (
          moreMenu === `root:${c.id}` ||
          moreMenu.startsWith(`reply:${c.id}:`)
        );
        const showRootToolbar = (isHovered || menuForCard || reactPickerCommentId === c.id) && editingId !== c.id;

        const doubleClickOpenReply = (e) => {
          if (editingId === c.id) return;
          if (editingReply?.commentId === c.id) return;
          if (e.target.closest('button, a, input, textarea, [role="dialog"]')) return;
          openReplyComposer(c.id);
        };

        const isExiting = exitingIds.has(c.id);

        return (
          <motion.div
            key={c.id}
            ref={el => { boxRefs.current[c.id] = el; }}
            className={`db-codeblock-comment-box ${c.resolved ? 'is-resolved' : ''}`}
            style={{ 
              ...style, 
              position: 'absolute', 
              right: 0, 
              width: '100%',
              pointerEvents: isExiting ? 'none' : 'auto'
            }}
            initial={false}
            animate={{
              backgroundColor: isHovered || menuForCard ? '#202020' : '#191919',
              opacity: isExiting ? 0 : 1,
              scale: isExiting ? 0.95 : 1,
              y: isExiting ? 12 : 0,
            }}
            transition={{ 
              backgroundColor: { duration: 0.2, ease: "easeInOut" },
              default: { type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }
            }}
            onMouseEnter={() => setHoveredId(c.id)}
            onMouseLeave={() => {
              setHoveredId(null);
              setHoveredReply(null);
              if (!moreMenu || !String(moreMenu).includes(String(c.id))) {
                setReactPickerCommentId(null);
              }
            }}
            onDoubleClick={doubleClickOpenReply}
          >
            <div className="flex items-start gap-3">
              <ThreadAvatar name={c.author} url={c.avatar} size={22} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[13.5px] font-semibold text-[#e9e9e7]">{c.author || 'Usuário'}</span>
                  <span className="text-[11.5px] text-[#6f6e6b]">{relTime(c.created_at)}</span>
                </div>
                {editingId === c.id ? (
                  <div className="mt-2">
                    <textarea
                      autoFocus
                      className="db-codeblock-comment-input w-full bg-[#1C1C1E] border border-white/10 rounded-[8px] p-2 text-[13.5px] text-[#e9e9e7] outline-none"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => {
                        e.stopPropagation();
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(c.id); }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button type="button" className="text-[12px] text-[#86868b] hover:text-[#e9e9e7]" onClick={() => setEditingId(null)}>Cancelar</button>
                      <button type="button" className="text-[12px] text-[#2383E2] font-semibold" onClick={() => handleEditSave(c.id)}>Salvar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const { text: bodyText, attachment: bodyAtt } = splitAttachment(c.text);
                      return (
                        <>
                          {bodyText ? <div className="text-[14px] text-[#e9e9e7] leading-relaxed">{bodyText}</div> : null}
                          {bodyAtt ? (
                            <button type="button" className="mt-2 block rounded-[10px] overflow-hidden border border-white/10" onClick={() => window.open(bodyAtt, '_blank')}>
                              <img src={bodyAtt} alt="" className="max-w-full h-auto max-h-[160px] object-cover" />
                            </button>
                          ) : null}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>

              {/* Action Menu - Inside the box on the right */}
              <div className="shrink-0 flex items-center gap-0.5 bg-white/[0.03] border border-white/[0.08] rounded-[10px] p-0.5">
                <button
                  type="button"
                  title="Reagir"
                  className="p-1.5 rounded-[7px] text-[#6f6e6b] hover:text-[#e9e9e7] hover:bg-white/5 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReplyEmojiPickerFor(null);
                    setReactPickerCommentId(reactPickerCommentId === c.id ? null : c.id);
                  }}
                >
                  <Smile size={14} />
                </button>
                <button
                  type="button"
                  title="Concluir"
                  className="p-1.5 rounded-[7px] text-[#6f6e6b] hover:text-[#e9e9e7] hover:bg-white/5 transition-colors"
                  onClick={(e) => { e.stopPropagation(); handleResolve(c.id); }}
                >
                  <Check size={14} />
                </button>
                <div className="relative" ref={moreMenu === `root:${c.id}` ? menuRef : null}>
                  <button
                    type="button"
                    title="Mais opções"
                    className={`p-1.5 rounded-[7px] transition-colors ${moreMenu === `root:${c.id}` ? 'text-[#e9e9e7] bg-white/5' : 'text-[#6f6e6b] hover:text-[#e9e9e7] hover:bg-white/5'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setReplyEmojiPickerFor(null);
                      setMoreMenu(moreMenu === `root:${c.id}` ? null : `root:${c.id}`);
                      setReactPickerCommentId(null);
                    }}
                  >
                    <MoreHorizontal size={14} />
                  </button>

                  {moreMenu === `root:${c.id}` && (
                    <div className="absolute right-0 mt-1.5 w-32 bg-[#1C1C1E] border border-white/[0.08] rounded-[10px] shadow-2xl overflow-hidden z-20" onMouseDown={e => e.stopPropagation()}>
                      <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#e9e9e7] hover:bg-white/5 transition-colors text-left" onClick={(e) => { e.stopPropagation(); setEditingId(c.id); setEditText(c.text || ''); setMoreMenu(null); }}>
                        <Pencil size={12} /> Editar
                      </button>
                      <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#e9e9e7] hover:bg-white/5 transition-colors text-left" onClick={(e) => { e.stopPropagation(); openReplyComposer(c.id); }}>
                        <Reply size={12} /> Responder
                      </button>
                      <div className="border-t border-white/5 my-0.5" />
                      <button type="button" className="delete" onClick={(e) => { e.stopPropagation(); onDelete?.(c.id); setMoreMenu(null); }}>
                        <Trash2 size={12} /> Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reactions */}
            {c.reactions && Object.keys(c.reactions).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 ml-[34px]">
                {Object.entries(c.reactions).map(([emoji, count]) => (
                  <button type="button" key={emoji} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[12px] hover:bg-white/[0.1] transition-colors" onClick={() => handleReact(c.id, emoji)}>
                    <span>{emoji}</span>
                    <span className="text-[#6f6e6b] font-medium">{count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Replies */}
            {replies.length > 0 && (
              <div className="mt-4 space-y-4 ml-[34px]">
                {replies.map((r, i) => {
                  const { text: rText, attachment: rAtt } = splitAttachment(r.text);
                  return (
                    <div key={r.id ?? `r-${i}`} className="flex items-start gap-3">
                      <ThreadAvatar name={r.author} url={r.avatar} size={20} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[13px] font-semibold text-[#e9e9e7]">{r.author || 'Usuário'}</span>
                          <span className="text-[11px] text-[#6f6e6b]">{relTime(r.created_at)}</span>
                        </div>
                        {rText ? <div className="text-[13.5px] text-[#e9e9e7] leading-relaxed">{rText}</div> : null}
                        {rAtt && (
                          <button type="button" className="mt-2 block rounded-[8px] overflow-hidden border border-white/10" onClick={() => window.open(rAtt, '_blank')}>
                            <img src={rAtt} alt="" className="max-w-full h-auto max-h-[120px] object-cover" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Reply Input */}
            {replyingId === c.id && (
              <div className="mt-4 flex items-center gap-3">
                <ThreadAvatar name={currentUser?.name} url={currentUser?.avatar_url} size={22} />
                <div className="db-codeblock-pill-input flex-1">
                  <input
                    autoFocus
                    placeholder="Adicionar um comentário..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => {
                      e.stopPropagation();
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReplySave(c.id); }
                      if (e.key === 'Escape') { setReplyingId(null); setReplyText(''); setReplyAttachment(null); }
                    }}
                  />
                  <div className="db-codeblock-pill-actions">
                    <button type="button" className="db-codeblock-pill-btn" title="Anexar imagem" onClick={() => replyFileRef.current?.click()}>
                      <Paperclip size={16} />
                    </button>
                    <button type="button" className="db-codeblock-pill-btn" title="Mencionar" onClick={() => setReplyText(t => `${t}@`)}>
                      <AtSign size={16} />
                    </button>
                    <button
                      type="button"
                      className={`db-codeblock-pill-send ${replyText.trim() || replyAttachment ? 'is-active' : ''}`}
                      disabled={!(replyText.trim() || replyAttachment)}
                      onClick={() => handleReplySave(c.id)}
                    >
                      <ArrowUp size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                  <input type="file" ref={replyFileRef} className="hidden" accept="image/*" onChange={onReplyFile} />
                </div>
              </div>
            )}

            {reactPickerCommentId === c.id && (
              <div className="absolute top-[44px] right-3 flex items-center gap-1 bg-[#1C1C1E] border border-white/[0.08] rounded-full shadow-2xl p-1 z-30" onMouseDown={e => e.stopPropagation()}>
                {REACTIONS.map(emoji => (
                  <button type="button" key={emoji} className="p-1.5 hover:bg-white/5 rounded-full transition-colors text-[14px]" onClick={(e) => { e.stopPropagation(); handleReact(c.id, emoji); }}>{emoji}</button>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}

      {createPortal(
        <AnimatePresence>
          {moreMenu && modalComment && (
            <motion.div
              key={moreMenu}
              className="db-codeblock-modal-root"
              role="presentation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <motion.div
                role="presentation"
                className="db-codeblock-modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onMouseDown={() => setMoreMenu(null)}
              />
              <div className="db-codeblock-modal-center">
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Opções do comentário"
                  className="db-codeblock-apple-menu"
                  initial={{ opacity: 0, scale: 0.94, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 12 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  onMouseDown={e => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="db-codeblock-apple-menu-item"
                    onClick={() => {
                      openReplyComposer(menuParsed.commentId);
                      setMoreMenu(null);
                    }}
                  >
                    <Reply size={17} strokeWidth={2} /> Responder
                  </button>
                  <button
                    type="button"
                    className="db-codeblock-apple-menu-item"
                    onClick={() => {
                      if (menuParsed.kind === 'root') {
                        setEditingId(menuParsed.commentId);
                        setEditText(modalComment.text);
                      } else if (menuParsed.kind === 'reply') {
                        const r = (modalComment.replies || []).find(x => String(x.id) === String(menuParsed.replyId));
                        if (r) {
                          setEditingReply({ commentId: menuParsed.commentId, replyId: menuParsed.replyId });
                          setEditReplyText(r.text || '');
                        }
                      }
                      setMoreMenu(null);
                    }}
                  >
                    <Pencil size={17} strokeWidth={2} /> Editar
                  </button>
                  <div className="db-codeblock-apple-menu-sep" />
                  <button
                    type="button"
                    className="db-codeblock-apple-menu-item is-danger"
                    onClick={() => {
                      if (menuParsed.kind === 'root') {
                        onDelete?.(menuParsed.commentId);
                      } else if (menuParsed.kind === 'reply' && onRemoveReply) {
                        onRemoveReply(menuParsed.commentId, menuParsed.replyId);
                      }
                      setMoreMenu(null);
                    }}
                  >
                    <Trash2 size={17} strokeWidth={2} /> Excluir
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

/* ================================================================
   REACT NODE VIEW COMPONENT
   ================================================================ */
function CodeBlockComponent({ node, updateAttributes, editor, getPos, deleteNode, extension }) {
  const [copied, setCopied] = useState(false);
  const [showLangs, setShowLangs] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedLinesCount, setSelectedLinesCount] = useState(0);
  const [activeLineStart, setActiveLineStart] = useState(null);
  const [activeLineEnd, setActiveLineEnd] = useState(null);
  const [activeHighlight, setActiveHighlight] = useState(null); // { top, height }
  const [draftRange, setDraftRange] = useState(null); // { start, end }
  const [draftText, setDraftText] = useState('');
  const [draftAttachment, setDraftAttachment] = useState(null);
  const draftFileRef = useRef(null);
  const draftContainerRef = useRef(null);
  const preRef = useRef(null);
  const bodyRef = useRef(null);

  const langSelectorRef = useRef(null);
  const listRef = useRef(null);
  const menuRef = useRef(null);
  const { user } = useAuth();

  const projectId = extension.options.projectId;
  const { comments: allComments, create, update, remove, reply, updateReply, removeReply } = useCodeComments(projectId);

  // Initialize block ID if missing
  useEffect(() => {
    if (!node.attrs.id) {
      updateAttributes({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8) });
    }
  }, [node.attrs.id, updateAttributes]);

  const blockId = node.attrs.id;
  const comments = useMemo(() => {
    if (!allComments) return [];
    return allComments.filter(c => c.block_id === blockId).map(c => ({
      id: c.id,
      lineStart: c.line_start,
      lineEnd: c.line_end,
      text: c.content,
      author: c.user_name || 'Usuário',
      avatar: c.user_avatar,
      created_at: c.created_at,
      resolved: c.resolved,
      reactions: c.reactions || {},
      replies: (c.replies || []).map(r => ({
        id: r.id,
        user_id: r.user_id,
        text: r.content,
        author: r.user_name,
        avatar: r.user_avatar,
        created_at: r.created_at,
      }))
    }));
  }, [allComments, blockId]);

  // Total lines count
  const totalLines = useMemo(() => {
    return node.textContent.split('\n').length;
  }, [node.textContent]);

  // Handle selection line count and active line
  useEffect(() => {
    if (!editor) return;

    const updateSelectionCount = () => {
      const { from, to } = editor.state.selection;
      const pos = getPos();
      if (typeof pos !== 'number' || !bodyRef.current) return;

      const start = pos + 1;
      const end = start + node.nodeSize - 2;

      if (from !== to && from >= start && to <= end) {
        // 1. Logical line numbers for metadata and labels
        const textBefore = editor.state.doc.textBetween(start, from, '\n');
        const textInSelection = editor.state.doc.textBetween(from, to, '\n');
        
        const lStart = (textBefore.match(/\n/g) || []).length;
        let lEnd = lStart + (textInSelection.match(/\n/g) || []).length;
        if (textInSelection.endsWith('\n') && lEnd > lStart) lEnd--;

        setActiveLineStart(lStart);
        setActiveLineEnd(Math.max(lStart, lEnd));
        setSelectedLinesCount(lEnd - lStart + 1);

        // 2. Physical DOM coordinates for the highlight (Pixel Perfect)
        try {
          const view = editor.view;
          const startCoords = view.coordsAtPos(from);
          const endCoords = view.coordsAtPos(to);
          const bodyRect = bodyRef.current.getBoundingClientRect();
          
          setActiveHighlight({
            top: startCoords.top - bodyRect.top,
            height: endCoords.bottom - startCoords.top
          });
        } catch (e) {
          setActiveHighlight(null);
        }
      } else {
        setActiveLineStart(null);
        setActiveLineEnd(null);
        setSelectedLinesCount(0);
        setActiveHighlight(null);
      }
    };

    editor.on('selectionUpdate', updateSelectionCount);
    updateSelectionCount();

    return () => {
      editor.off('selectionUpdate', updateSelectionCount);
    };
  }, [editor, getPos, node.nodeSize]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langSelectorRef.current && !langSelectorRef.current.contains(e.target)) {
        setShowLangs(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
      if (draftContainerRef.current && !draftContainerRef.current.contains(e.target)) {
        // Only close if we are not clicking the "add comment" button itself
        if (!e.target.closest('.db-codeblock-add-comment-btn')) {
          setDraftRange(null);
          setDraftText('');
          setDraftAttachment(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(node.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentLang = node.attrs.language || 'JavaScript';

  const filteredLangs = useMemo(() => {
    const list = !search
      ? LANGUAGES
      : LANGUAGES.filter(l => l.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [search]);

  // Reset index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Scroll into view
  useEffect(() => {
    if (showLangs && listRef.current) {
      const selectedItem = listRef.current.children[selectedIndex];
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, showLangs]);

  const onKeyDown = (e) => {
    if (filteredLangs.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setSelectedIndex(prev => (prev + 1) % filteredLangs.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setSelectedIndex(prev => (prev - 1 + filteredLangs.length) % filteredLangs.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const lang = filteredLangs[selectedIndex];
      if (lang) {
        updateAttributes({ language: lang });
        setShowLangs(false);
        setSearch('');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setShowLangs(false);
    }
  };

  return (
    <NodeViewWrapper className="db-codeblock-wrapper">
      <div className="db-codeblock-header">
        <div className="db-codeblock-lang-selector" ref={langSelectorRef} onClick={() => setShowLangs(!showLangs)}>
          <span>{currentLang}</span>
          <ChevronDown size={14} />

          {showLangs && (
            <div className="db-codeblock-langs-menu" onClick={(e) => e.stopPropagation()}>
              <div className="db-codeblock-langs-search">
                <input
                  type="text"
                  placeholder="Procure uma linguagem..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={onKeyDown}
                  autoFocus
                />
              </div>
              <div className="db-codeblock-langs-list" ref={listRef}>
                {filteredLangs.map((l, index) => (
                  <button
                    key={l}
                    className={`${l === currentLang ? 'is-active' : ''} ${index === selectedIndex ? 'is-selected' : ''}`}
                    onClick={() => {
                      updateAttributes({ language: l });
                      setShowLangs(false);
                      setSearch('');
                    }}
                  >
                    {l} {l === currentLang && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="db-codeblock-info">
          <span><strong>{totalLines}</strong> {totalLines === 1 ? 'linha' : 'linhas'}</span>
          {selectedLinesCount > 0 && (
            <span><strong>{selectedLinesCount}</strong> {selectedLinesCount === 1 ? 'selecionada' : 'selecionadas'}</span>
          )}
        </div>

        <div className="db-codeblock-actions">
          <button onClick={copyToClipboard} title="Copiar código">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>

          <div className="db-codeblock-more" ref={menuRef}>
            <button onClick={() => setShowMenu(!showMenu)} title="Opções">
              <MoreHorizontal size={14} />
            </button>
            {showMenu && (
              <div className="db-codeblock-menu" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => {
                  editor.chain().focus().setTextSelection(getPos() + 1).run();
                  setShowMenu(false);
                }}>
                  Editar
                </button>
                <button onClick={() => {
                  deleteNode();
                  setShowMenu(false);
                }} className="delete">
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="db-codeblock-body" ref={bodyRef} style={{ position: 'relative', fontSize: '14px', lineHeight: 1.5 }}>
        <div className="db-codeblock-bg-layer" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          {/* Saved comment highlights (logical lines) */}
          {comments.map(c => {
            const ls = c.lineStart ?? c.line ?? 0;
            const le = c.lineEnd ?? c.line ?? 0;
            const count = le - ls + 1;
            return (
              <div key={c.id} className="db-codeblock-line-highlight" style={{ top: `calc(14px + ${ls * 1.5}em)`, height: `${count * 1.5}em` }} />
            );
          })}
          
          {/* Pixel-perfect hover highlight for active selection */}
          {activeHighlight && !draftRange && (
            <div 
              className="db-codeblock-line-hover" 
              style={{ 
                position: 'absolute', 
                left: 0, 
                right: 0, 
                top: activeHighlight.top,
                height: activeHighlight.height,
                background: 'rgba(255, 212, 0, 0.08)', 
                borderLeft: '2px solid rgba(255, 212, 0, 0.5)',
                pointerEvents: 'none'
              }} 
            />
          )}

          {/* Draft highlight — uses logical lines for simplicity as it anchors the UI */}
          {draftRange && (() => {
            const count = draftRange.end - draftRange.start + 1;
            return (
              <div className="db-codeblock-line-highlight is-drafting" style={{ position: 'absolute', left: 0, right: 0, height: `${count * 1.5}em`, top: `calc(14px + ${draftRange.start * 1.5}em)`, background: 'rgba(255, 212, 0, 0.12)', borderLeft: '2px solid rgba(255, 212, 0, 0.7)' }} />
            );
          })()}
        </div>

        <pre 
          ref={preRef}
          className="db-codeblock-pre" 
          style={{ 
            position: 'relative', 
            zIndex: 1, 
            fontSize: '14px',
            whiteSpace: 'pre', // Disable wrapping to ensure line-height parity
            overflowX: 'auto'
          }}
        >
          <NodeViewContent as="code" className={`language-${currentLang}`} />
        </pre>

        {/* Add comment button — appears at the start of the selection */}
        {activeLineStart !== null && !draftRange && (
          <button
            className="db-codeblock-add-comment-btn"
            style={{ top: `calc(14px + ${activeLineStart * 1.5}em)` }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDraftRange({ start: activeLineStart, end: activeLineEnd });
              setDraftText('');
            }}
            title={activeLineStart === activeLineEnd ? 'Comentar esta linha' : `Comentar linhas ${activeLineStart + 1}–${activeLineEnd + 1}`}
          >
            +
          </button>
        )}

        <div className="db-codeblock-comments-layer">
          {/* Saved comments — stacked to avoid overlap */}
          <CommentBoxes
            comments={comments}
            currentUser={user}
            onUpdate={(id, patch) => {
              const apiPatch = {};
              if (patch.text !== undefined) apiPatch.content = patch.text;
              if (patch.resolved !== undefined) apiPatch.resolved = patch.resolved;
              if (patch.reactions !== undefined) apiPatch.reactions = patch.reactions;
              update(id, apiPatch);
            }}
            onDelete={remove}
            onReply={(id, text) => reply(id, { content: text })}
            onUpdateReply={(commentId, replyId, payload) => updateReply(commentId, replyId, payload)}
            onRemoveReply={(commentId, replyId) => removeReply(commentId, replyId)}
          />

          {/* Draft comment — same visual language as reply bar */}
          {draftRange && (
            <div
              ref={draftContainerRef}
              className="db-codeblock-draft-wrapper"
              style={{ top: `calc(14px + ${draftRange.start * 1.5}em)` }}
            >
              <div className="db-codeblock-draft-pill-container">
                <div className="db-codeblock-draft-badge">
                  {draftRange.start === draftRange.end ? `Linha ${draftRange.start + 1}` : `Linhas ${draftRange.start + 1}–${draftRange.end + 1}`}
                </div>
                <div className="db-codeblock-pill-input">
                  <input
                    autoFocus
                    placeholder="Adicionar um comentário..."
                    value={draftText}
                    onChange={e => setDraftText(e.target.value)}
                    onKeyDown={e => {
                      e.stopPropagation();
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const base = draftText.trim();
                        if ((!base && !draftAttachment) || !blockId) return;
                        let content = base;
                        if (draftAttachment) content = (base ? `${base}\n\n` : '') + `![anexo](${draftAttachment})`;
                        create({
                          block_id: blockId,
                          line_start: draftRange.start,
                          line_end: draftRange.end,
                          content
                        }).then(() => {
                          setDraftRange(null);
                          setDraftText('');
                          setDraftAttachment(null);
                        }).catch(err => console.error(err));
                      }
                      if (e.key === 'Escape') {
                        setDraftRange(null);
                        setDraftText('');
                        setDraftAttachment(null);
                      }
                    }}
                  />
                  <div className="db-codeblock-pill-actions">
                    <button type="button" className="db-codeblock-pill-btn" title="Anexar imagem" onClick={() => draftFileRef.current?.click()}>
                      <Paperclip size={16} />
                    </button>
                    <button type="button" className="db-codeblock-pill-btn" title="Mencionar" onClick={() => setDraftText(t => `${t}@`)}>
                      <AtSign size={16} />
                    </button>
                    <button
                      type="button"
                      className={`db-codeblock-pill-send ${(draftText.trim() || draftAttachment) ? 'is-active' : ''}`}
                      disabled={!draftText.trim() && !draftAttachment}
                      onClick={async () => {
                        const base = draftText.trim();
                        if ((!base && !draftAttachment) || !blockId) return;
                        let content = base;
                        if (draftAttachment) content = (base ? `${base}\n\n` : '') + `![anexo](${draftAttachment})`;
                        try {
                          await create({
                            block_id: blockId,
                            line_start: draftRange.start,
                            line_end: draftRange.end,
                            content
                          });
                          setDraftRange(null);
                          setDraftText('');
                          setDraftAttachment(null);
                        } catch (e) { console.error('Erro ao salvar comentário', e); }
                      }}
                    >
                      <ArrowUp size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                  <input type="file" ref={draftFileRef} className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const r = new FileReader();
                    r.onload = (ev) => setDraftAttachment(ev.target.result);
                    r.readAsDataURL(file);
                    e.target.value = '';
                  }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

/* ================================================================
   EXTENSION
   ================================================================ */
export const CustomCodeBlock = CodeBlock.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      projectId: null,
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
      },
      comments: {
        default: [],
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent, {
      stopEvent: (event) => {
        // Stop events from language selector and comments UI
        if (event.target.closest('.db-codeblock-lang-selector') || event.target.closest('.db-codeblock-comments-layer')) {
          return true;
        }
        return false;
      },
    });
  },

  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() || []),
      new Plugin({
        key: highlightPluginKey,
        state: {
          init(_, { doc }) {
            return buildDecorations(doc);
          },
          apply(tr, decorationSet) {
            if (tr.docChanged) {
              return buildDecorations(tr.doc);
            }
            return decorationSet;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
