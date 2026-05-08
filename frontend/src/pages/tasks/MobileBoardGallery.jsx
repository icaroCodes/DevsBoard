import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Loader2, Kanban, MoreHorizontal } from 'lucide-react';
import Sheet from '../../components/mobile/Sheet';
import { useRegisterMobileFab } from '../../contexts/MobileFabContext';

const BOARD_COLORS = [
  '#2C2C2E', '#1A3A2A', '#2A1A3A', '#3A2A1A', '#1A2A3A', '#3A1A2A',
  '#0A84FF', '#32D74B', '#FF9F0A', '#FF453A', '#BF5AF2', '#AC8E68',
];

export default function MobileBoardGallery({
  boards,
  showAdd,
  setShowAdd,
  boardName,
  setBoardName,
  boardColor,
  setBoardColor,
  adding,
  addBoard,
  deleteBoard,
  setEditingBoard,
  onOpenBoard,
}) {
  const [actionBoard, setActionBoard] = useState(null);

  useRegisterMobileFab(
    {
      icon: Plus,
      label: 'Novo mural',
      onClick: () => setShowAdd(true),
      tone: 'accent',
    },
    [setShowAdd]
  );

  return (
    <div className="px-4 pt-2 pb-6 max-w-[640px] mx-auto">
      <div className="mb-5 px-1">
        <p className="text-[12.5px] font-medium text-[#86868B] tracking-tight">
          Meus murais
        </p>
        <h1 className="text-[26px] font-semibold text-[#F5F5F7] tracking-tight leading-tight">
          {boards.length} mural{boards.length !== 1 ? 'es' : ''} de recados
        </h1>
      </div>

      {boards.length === 0 ? (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex flex-col items-center justify-center gap-3 w-full rounded-[18px] border border-dashed border-white/[0.08] bg-[#1A1A1C] py-16 active:bg-white/[0.02] transition-colors"
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white/[0.04]">
            <Kanban size={26} strokeWidth={1.4} className="text-[#86868B]" />
          </div>
          <p className="text-[13px] text-[#86868B] text-center px-6">
            Crie seu primeiro mural para começar.
          </p>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2C2C2E] text-[13px] font-semibold text-[#F5F5F7]">
            <Plus size={14} strokeWidth={2.4} /> Novo mural
          </span>
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {boards.map((board) => (
            <motion.div
              key={board.id}
              whileTap={{ scale: 0.97 }}
              className="relative rounded-[18px] overflow-hidden border border-white/[0.05] shadow-lg"
              style={{ background: board.color || '#2C2C2E', minHeight: 110 }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
              <button
                type="button"
                onClick={() => onOpenBoard(board)}
                className="absolute inset-0 z-10 flex flex-col justify-end p-3 outline-none text-left"
              >
                <h3 className="text-[14.5px] font-bold text-white truncate drop-shadow-md tracking-tight">
                  {board.name}
                </h3>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActionBoard(board);
                }}
                aria-label="Opções"
                className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-black/45 backdrop-blur-md text-white/85 active:scale-90 transition-transform"
              >
                <MoreHorizontal size={15} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Per-board action sheet */}
      <Sheet
        open={!!actionBoard}
        onClose={() => setActionBoard(null)}
        title={actionBoard?.name}
      >
        <div className="px-4 pb-5 space-y-2">
          <button
            type="button"
            onClick={() => {
              const t = actionBoard;
              setActionBoard(null);
              setEditingBoard(t);
            }}
            className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-white/[0.04] active:bg-white/[0.08] transition-colors outline-none"
          >
            <Pencil size={17} className="text-[#E5E5EA]" strokeWidth={2} />
            <span className="text-[14px] font-medium text-[#F5F5F7]">Editar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const id = actionBoard?.id;
              setActionBoard(null);
              if (id != null) deleteBoard(id);
            }}
            className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-[#FF3B30]/10 active:bg-[#FF3B30]/20 transition-colors outline-none"
          >
            <Trash2 size={17} className="text-[#FF6961]" strokeWidth={2} />
            <span className="text-[14px] font-semibold text-[#FF6961]">Apagar</span>
          </button>
        </div>
      </Sheet>

      {/* New board sheet */}
      <Sheet
        open={showAdd}
        onClose={() => {
          setShowAdd(false);
          setBoardName('');
        }}
        title="Novo mural"
        maxHeight="80dvh"
      >
        <div className="px-4 pb-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#86868B] ml-1">Nome</label>
            <input
              type="text"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addBoard();
              }}
              placeholder="Nome do seu mural..."
              autoFocus
              className="w-full px-4 py-3.5 rounded-[14px] bg-[#0F0F11] border border-white/[0.06] text-[15px] text-[#F5F5F7] focus:border-[#0A84FF]/50 focus:outline-none transition-colors placeholder:text-[#5A5A5F]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#86868B] ml-1">Cor</label>
            <div className="flex flex-wrap gap-2">
              {BOARD_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setBoardColor(c)}
                  className={`w-9 h-9 rounded-full transition-transform outline-none ${
                    boardColor === c
                      ? 'ring-2 ring-[#0A84FF] ring-offset-2 ring-offset-[#161616] scale-110'
                      : 'active:scale-95'
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={addBoard}
            disabled={adding || !boardName.trim()}
            className="w-full py-4 rounded-[16px] bg-[#0A84FF] text-white text-[15px] font-semibold active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0A84FF]/20"
          >
            {adding && <Loader2 size={18} className="animate-spin" />}
            Criar mural
          </button>
        </div>
      </Sheet>
    </div>
  );
}
