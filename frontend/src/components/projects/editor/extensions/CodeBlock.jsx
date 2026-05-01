import React, { useState, useMemo, useEffect, useRef } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import CodeBlock from '@tiptap/extension-code-block';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Copy, Check, MoreHorizontal, ChevronDown } from 'lucide-react';

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
    keyword:  '#C77F95',   // import, from, export, const, function, return, if …
    string:   '#D08955',   // 'react', '@tiptap/starter-kit' …
    number:   '#D08955',   // 42, 3.14 …
    function: '#DDDA16',   // useEditor(), configure() …
    type:     '#90DDDB',   // StarterKit, TaskList, Placeholder (capitalized identifiers)
    special:  '#55C3FF',   // true, false, null, undefined
    operator: '#C77F95',   // =>, =, +, -, …
    punct:    '#9899A0',   // { } [ ] ( ) , ;
    param:    '#9CDCFE',   // parameters / variable references
  },
  typescript: null, // alias → filled below

  // HTML / XML
  html: {
    tag:       '#E06C75',
    attr:      '#D19A66',
    string:    '#98C379',
    bracket:   '#ABB2BF',
    special:   '#61AFEF',
    entity:    '#C678DD',
    punct:     '#9899A0',
  },
  xml: null,

  // CSS
  css: {
    selector:  '#E06C75',
    property:  '#D19A66',
    value:     '#98C379',
    unit:      '#E5C07B',
    special:   '#C678DD',
    string:    '#98C379',
    number:    '#D19A66',
    punct:     '#9899A0',
  },

  // Python
  python: {
    keyword:  '#FF6B9D',
    string:   '#A8DB8F',
    number:   '#FFB86C',
    function: '#BD93F9',
    builtin:  '#8BE9FD',
    decorator:'#FF79C6',
    operator: '#FFB86C',
    punct:    '#9899A0',
  },

  // Java
  java: {
    keyword:  '#CF8E6D',
    string:   '#6A8759',
    number:   '#6897BB',
    type:     '#FFC66D',
    annotation:'#BBB529',
    operator: '#CF8E6D',
    punct:    '#9899A0',
  },

  // C
  c: {
    keyword:     '#569CD6',
    string:      '#CE9178',
    number:      '#B5CEA8',
    preprocessor:'#C586C0',
    type:        '#4EC9B0',
    operator:    '#569CD6',
    punct:       '#9899A0',
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
  if (n === 'html' || n === 'xml')     return tokenizeHTML(text, theme || THEMES.html);
  if (n === 'css')                     return tokenizeCSS(text, THEMES.css);
  if (n === 'python')                  return tokenizePython(text, THEMES.python);
  if (n === 'java' || n === 'c#')      return tokenizeJava(text, theme || THEMES.java);
  if (n === 'c' || n === 'c++')        return tokenizeC(text, theme || THEMES.c);
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
   REACT NODE VIEW COMPONENT
   ================================================================ */
function CodeBlockComponent({ node, updateAttributes, editor, getPos }) {
  const [copied, setCopied] = useState(false);
  const [showLangs, setShowLangs] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedLinesCount, setSelectedLinesCount] = useState(0);
  const langSelectorRef = useRef(null);
  const listRef = useRef(null);

  // Total lines count
  const totalLines = useMemo(() => {
    return node.textContent.split('\n').length;
  }, [node.textContent]);

  // Handle selection line count
  useEffect(() => {
    if (!editor) return;

    const updateSelectionCount = () => {
      const { from, to } = editor.state.selection;
      const pos = getPos();
      if (typeof pos !== 'number') return;
      
      const start = pos + 1;
      const end = start + node.nodeSize - 2;

      const selStart = Math.max(from, start);
      const selEnd = Math.min(to, end);

      if (selStart < selEnd) {
        const text = editor.state.doc.textBetween(selStart, selEnd, '\n');
        setSelectedLinesCount(text ? text.split('\n').length : 0);
      } else {
        setSelectedLinesCount(0);
      }
    };

    editor.on('selectionUpdate', updateSelectionCount);
    // Initial check
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
    };
    if (showLangs) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLangs]);

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
          <button title="Opções">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>
      
      <pre>
        <NodeViewContent as="code" className={`language-${currentLang}`} />
      </pre>
    </NodeViewWrapper>
  );
}

/* ================================================================
   EXTENSION
   ================================================================ */
export const CustomCodeBlock = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent, {
      stopEvent: (event) => {
        // Se o evento vier de dentro do seletor de linguagem, paramos ele aqui
        // para que o ProseMirror não tente processar as setinhas/enter
        return event.target.closest('.db-codeblock-lang-selector') !== null;
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
