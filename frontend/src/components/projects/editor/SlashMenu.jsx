import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

const SlashMenu = forwardRef(({ items, command }, ref) => {
  const [selected, setSelected] = useState(0);

  useEffect(() => setSelected(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowDown') { setSelected(i => (i + 1) % items.length); return true; }
      if (event.key === 'ArrowUp')   { setSelected(i => (i - 1 + items.length) % items.length); return true; }
      if (event.key === 'Enter')     { const it = items[selected]; if (it) command({ command: ({ editor, range }) => it.cmd(editor, range) }); return true; }
      return false;
    },
  }));

  if (!items.length) {
    return (
      <div className="db-slash-menu db-slash-empty">
        <p>Sem resultados</p>
      </div>
    );
  }

  return (
    <div className="db-slash-menu">
      <div className="db-slash-header">Bloco</div>
      <div className="db-slash-list">
        {items.map((item, i) => (
          <button
            key={item.key}
            type="button"
            onMouseEnter={() => setSelected(i)}
            onMouseDown={(e) => { e.preventDefault(); command({ command: ({ editor, range }) => item.cmd(editor, range) }); }}
            className={`db-slash-item ${i === selected ? 'is-selected' : ''}`}
          >
            <span className="db-slash-icon">{item.icon}</span>
            <span className="db-slash-text">
              <span className="db-slash-title">{item.title}</span>
              <span className="db-slash-hint">{item.hint}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="db-slash-footer">
        <span>↑↓ navegar</span><span>↵ inserir</span><span>esc fechar</span>
      </div>
    </div>
  );
});
SlashMenu.displayName = 'SlashMenu';
export default SlashMenu;
