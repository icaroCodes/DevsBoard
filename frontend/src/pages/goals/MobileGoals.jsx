import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Target,
  Trophy,
  Loader2,
  ChevronDown,
  Check,
  ArrowRightLeft,
} from 'lucide-react';
import {
  DndContext,
  pointerWithin,
  useDraggable,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import Sheet from '../../components/mobile/Sheet';
import { useRegisterMobileFab } from '../../contexts/MobileFabContext';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

const deadlineLabels = {
  monthly: 'Todo mês',
  yearly: 'Todo ano',
  indefinite: 'Sem pressa',
};

const fmtBRL = (n) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`;

function GoalProgress({ progress, isComplete }) {
  return (
    <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`h-full rounded-full ${
          isComplete ? 'bg-[#30D158]' : 'bg-[#8E9C78]'
        }`}
      />
    </div>
  );
}

function MobileGoalCard({ item, onTap, onAddAmount, isOverlay = false }) {
  const saved = Number(item?.saved_amount) || 0;
  const target = Number(item?.target_value) || 0;
  let progress = 0;
  if (item?.type === 'financial' && target > 0)
    progress = Math.min(100, (saved / target) * 100);
  else if (item?.completed) progress = 100;
  if (isNaN(progress)) progress = 0;

  const isFinancialComplete = item.type === 'financial' && progress >= 100;
  const isComplete = item.type === 'financial' ? isFinancialComplete : item.completed;
  const typeLabel = item.type === 'financial' ? 'Guardando' : 'Esforço';

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `goal-${item.id}`,
    data: { type: 'goal', goal: item },
    disabled: isOverlay,
  });

  const style = isOverlay
    ? undefined
    : {
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        opacity: isDragging ? 0 : 1,
      };

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      {...(!isOverlay && { ...attributes, ...listeners })}
      onClick={!isOverlay ? () => onTap(item) : undefined}
      className={`touch-none p-3.5 rounded-[14px] transition-all ${
        isOverlay
          ? 'bg-[#2C2C2E] border border-white/20 shadow-2xl rotate-1 scale-[1.02]'
          : 'bg-[#1A1A1C] border border-white/[0.05] active:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {isComplete ? (
            <div className="w-[18px] h-[18px] rounded-full bg-[#8E9C78] flex items-center justify-center">
              <Check size={11} className="text-white" strokeWidth={3} />
            </div>
          ) : (
            <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-[#48484A]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span
              className={`text-[14px] font-medium truncate ${
                isComplete ? 'text-[#86868B] line-through' : 'text-[#F5F5F7]'
              }`}
            >
              {item.name}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white/[0.05] text-[9.5px] text-[#86868B] font-bold uppercase tracking-tight">
              {typeLabel}
            </span>
          </div>

          {item.type === 'financial' && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1.5 text-[11px]">
                <span className="text-[#8E9C78] font-semibold">
                  {fmtBRL(saved)}
                </span>
                <span className="text-[#86868B]">
                  meta {fmtBRL(target)}
                </span>
              </div>
              <GoalProgress progress={progress} isComplete={isFinancialComplete} />
              {isFinancialComplete ? (
                <div className="mt-2 flex items-center gap-1.5 text-[10.5px] font-bold text-[#30D158]">
                  <Trophy size={11} /> Meta atingida!
                </div>
              ) : (
                !isOverlay && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddAmount(item);
                    }}
                    className="mt-2 text-[11.5px] font-bold text-[#8E9C78] active:text-white transition-colors"
                  >
                    + Guardar mais
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function YearAccordion({
  year,
  goals,
  isCurrent,
  expanded,
  setExpanded,
  onNewGoal,
  onTap,
  onAddAmount,
}) {
  const isExpanded = expanded[year] ?? isCurrent;
  const { setNodeRef, isOver } = useDroppable({
    id: `container-${year}`,
    data: { type: 'container', year },
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-[18px] border bg-[#1A1A1C] overflow-hidden transition-all ${
        isOver
          ? 'border-[#8E9C78]/50 shadow-[0_0_18px_rgba(142,156,120,0.18)]'
          : 'border-white/[0.05]'
      }`}
    >
      <button
        type="button"
        onClick={() =>
          setExpanded((prev) => ({ ...prev, [year]: !isExpanded }))
        }
        className="flex items-center gap-3 w-full p-4 outline-none active:bg-white/[0.03] transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-full bg-[#2C2C2E] flex items-center justify-center shrink-0">
          <Trophy size={15} className="text-[#8E9C78]" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[14.5px] font-semibold text-[#F5F5F7] tracking-tight">
              {year}
            </p>
            {isCurrent && (
              <span className="shrink-0 px-1.5 py-0.5 rounded-[5px] bg-[#8E9C78]/10 text-[#8E9C78] text-[9.5px] font-bold uppercase tracking-wider">
                Atual
              </span>
            )}
          </div>
          <p className="text-[11.5px] text-[#86868B] mt-0.5">
            {goals.length} {goals.length === 1 ? 'meta' : 'metas'}
          </p>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[#86868B] -mr-1"
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-white/[0.04]"
          >
            <div className="p-2 space-y-2 min-h-[60px]">
              {goals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 gap-1.5">
                  <Target size={22} className="text-[#5A5A5F]" strokeWidth={1.5} />
                  <p className="text-[12px] text-[#86868B] text-center px-4">
                    {isOver
                      ? `Solte aqui para colocar em ${year}`
                      : `Nenhuma meta para ${year} ainda.`}
                  </p>
                </div>
              ) : (
                goals.map((g) => (
                  <MobileGoalCard
                    key={g.id}
                    item={g}
                    onTap={onTap}
                    onAddAmount={onAddAmount}
                  />
                ))
              )}
              <button
                type="button"
                onClick={() => onNewGoal(year)}
                className="flex items-center gap-2 w-full px-3.5 py-2.5 rounded-[10px] text-[13px] font-semibold text-[#8E9C78] active:bg-[#8E9C78]/10 transition-colors outline-none"
              >
                <Plus size={14} strokeWidth={2.4} /> Nova meta para {year}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FreeZone({ goals, onTap, onAddAmount }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'container-free',
    data: { type: 'container', year: null },
  });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-[18px] p-2 transition-all ${
        isOver
          ? 'bg-[#8E9C78]/[0.06] border-2 border-dashed border-[#8E9C78]/40'
          : goals.length === 0
            ? 'border-2 border-dashed border-white/[0.06]'
            : 'border border-white/[0.05] bg-[#1A1A1C]'
      }`}
    >
      {goals.length === 0 ? (
        <div className="flex items-center justify-center py-6 px-4">
          <p className="text-[12px] text-[#86868B] text-center">
            {isOver
              ? 'Solte aqui para tirar do ano'
              : 'Suas metas avulsas aparecem aqui.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1 px-2 pt-1">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#86868B]">
              Avulsas
            </p>
            <span className="text-[10.5px] text-[#86868B] font-semibold">
              {goals.length} {goals.length === 1 ? 'meta' : 'metas'}
            </span>
          </div>
          {goals.map((g) => (
            <MobileGoalCard
              key={g.id}
              item={g}
              onTap={onTap}
              onAddAmount={onAddAmount}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MobileGoals({
  loading,
  freeGoals,
  groupedByYear,
  currentYear,
  expanded,
  setExpanded,
  sensors,
  handleDragEnd,
  activeGoalId,
  setActiveGoalId,
  draggedGoal,
  modalOpen,
  setModalOpen,
  editing,
  setEditing,
  targetYear,
  setTargetYear,
  form,
  setForm,
  handleSubmit,
  toggleComplete,
  handleDelete,
  openNewGoal,
  openEdit,
  addAmount,
  setAddAmount,
  handleAddAmount,
  items,
}) {
  const [goalMenu, setGoalMenu] = useState(null);
  const [moveSheet, setMoveSheet] = useState(null);

  useRegisterMobileFab(
    {
      icon: Plus,
      label: 'Novo objetivo',
      tone: 'accent',
      onClick: () => openNewGoal(null),
    },
    []
  );

  // Years available for "move to" sheet (free + each grouped year)
  const allYears = [
    { label: 'Avulsa', value: null },
    ...groupedByYear.map((g) => ({ label: String(g.year), value: g.year })),
  ];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="px-4 pt-2 pb-6 max-w-[640px] mx-auto"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
      }}
    >
      <motion.div variants={fadeUp} className="mb-5 px-1">
        <p className="text-[12.5px] font-medium text-[#86868B] tracking-tight">
          Meus objetivos
        </p>
        <h1 className="text-[26px] font-semibold text-[#F5F5F7] tracking-tight leading-tight">
          {(items || []).length} meta{(items || []).length !== 1 ? 's' : ''}
        </h1>
      </motion.div>

      {!loading && (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={(e) => setActiveGoalId(e.active.id)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveGoalId(null)}
        >
          <motion.div variants={fadeUp} className="space-y-3">
            <FreeZone
              goals={freeGoals}
              onTap={(g) => setGoalMenu(g)}
              onAddAmount={(g) => setAddAmount({ id: g.id, value: '' })}
            />
            {groupedByYear.map(({ year, goals }) => (
              <YearAccordion
                key={year}
                year={year}
                goals={goals}
                isCurrent={year === currentYear}
                expanded={expanded}
                setExpanded={setExpanded}
                onNewGoal={openNewGoal}
                onTap={(g) => setGoalMenu(g)}
                onAddAmount={(g) => setAddAmount({ id: g.id, value: '' })}
              />
            ))}
          </motion.div>
          <DragOverlay>
            {draggedGoal ? (
              <MobileGoalCard
                item={draggedGoal}
                isOverlay
                onTap={() => {}}
                onAddAmount={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Per-goal action sheet */}
      <Sheet
        open={!!goalMenu}
        onClose={() => setGoalMenu(null)}
        title={goalMenu?.name}
      >
        <div className="px-4 pb-5 space-y-2">
          {goalMenu?.type === 'performance' && (
            <button
              type="button"
              onClick={() => {
                const g = goalMenu;
                setGoalMenu(null);
                if (g) toggleComplete(g);
              }}
              className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-white/[0.04] active:bg-white/[0.08] transition-colors outline-none"
            >
              <Check size={17} className="text-[#30D158]" strokeWidth={2.2} />
              <span className="text-[14px] font-medium text-[#F5F5F7]">
                {goalMenu?.completed ? 'Marcar como pendente' : 'Concluir'}
              </span>
            </button>
          )}
          {goalMenu?.type === 'financial' &&
            !(
              Number(goalMenu?.saved_amount) >= Number(goalMenu?.target_value) &&
              Number(goalMenu?.target_value) > 0
            ) && (
              <button
                type="button"
                onClick={() => {
                  const g = goalMenu;
                  setGoalMenu(null);
                  if (g) setAddAmount({ id: g.id, value: '' });
                }}
                className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-[#8E9C78]/10 active:bg-[#8E9C78]/20 transition-colors outline-none"
              >
                <Plus size={17} className="text-[#8E9C78]" strokeWidth={2.2} />
                <span className="text-[14px] font-semibold text-[#8E9C78]">
                  Guardar mais
                </span>
              </button>
            )}
          <button
            type="button"
            onClick={() => {
              const g = goalMenu;
              setGoalMenu(null);
              if (g) openEdit(g);
            }}
            className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-white/[0.04] active:bg-white/[0.08] transition-colors outline-none"
          >
            <Pencil size={17} className="text-[#E5E5EA]" strokeWidth={2} />
            <span className="text-[14px] font-medium text-[#F5F5F7]">Editar</span>
          </button>
          {allYears.length > 1 && (
            <button
              type="button"
              onClick={() => setMoveSheet(goalMenu)}
              className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-white/[0.04] active:bg-white/[0.08] transition-colors outline-none"
            >
              <ArrowRightLeft size={17} className="text-[#0A84FF]" strokeWidth={2} />
              <span className="text-[14px] font-medium text-[#F5F5F7]">
                Mover para...
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              const g = goalMenu;
              setGoalMenu(null);
              if (g) handleDelete(g);
            }}
            className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-[#FF3B30]/10 active:bg-[#FF3B30]/20 transition-colors outline-none"
          >
            <Trash2 size={17} className="text-[#FF6961]" strokeWidth={2} />
            <span className="text-[14px] font-semibold text-[#FF6961]">Apagar</span>
          </button>
        </div>
      </Sheet>

      {/* Move-to-year sheet */}
      <Sheet
        open={!!moveSheet}
        onClose={() => setMoveSheet(null)}
        title="Mover para qual ano?"
      >
        <div className="px-4 pb-5 space-y-2">
          {allYears
            .filter((y) => y.value !== (moveSheet?.year ?? null))
            .map((y) => (
              <button
                key={String(y.value)}
                type="button"
                onClick={async () => {
                  const g = moveSheet;
                  setMoveSheet(null);
                  setGoalMenu(null);
                  if (!g) return;
                  // Synthesize a drag-end event the parent can handle
                  await handleDragEnd({
                    active: { id: `goal-${g.id}` },
                    over: {
                      id: y.value == null ? 'container-free' : `container-${y.value}`,
                      data: { current: { type: 'container', year: y.value } },
                    },
                  });
                }}
                className="flex items-center justify-between gap-3 w-full p-3.5 rounded-[12px] bg-white/[0.04] active:bg-white/[0.08] transition-colors outline-none"
              >
                <span className="text-[14px] font-medium text-[#F5F5F7]">
                  {y.label}
                </span>
                {y.value === currentYear && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9C78]">
                    Atual
                  </span>
                )}
              </button>
            ))}
        </div>
      </Sheet>

      {/* Add amount sheet */}
      <Sheet
        open={!!addAmount.id}
        onClose={() => setAddAmount({ id: null, value: '' })}
        title="Guardar mais um pouco"
      >
        <form onSubmit={handleAddAmount} className="px-4 pb-5 space-y-3">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#86868B] ml-1">
              Quanto você quer guardar agora?
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868B] text-[14px]">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={addAmount.value}
                onChange={(e) =>
                  setAddAmount({ ...addAmount, value: e.target.value })
                }
                autoFocus
                placeholder="0,00"
                required
                className="w-full pl-11 pr-4 py-3.5 rounded-[14px] bg-[#0F0F11] border border-white/[0.06] text-[16px] text-[#F5F5F7] focus:border-[#8E9C78]/50 focus:outline-none transition-colors placeholder:text-[#5A5A5F]"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!addAmount.value}
            className="w-full py-4 rounded-[16px] bg-[#8E9C78] text-white text-[15px] font-semibold active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#8E9C78]/25"
          >
            Guardar
          </button>
        </form>
      </Sheet>

      {/* Goal form sheet */}
      <Sheet
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
          setTargetYear(null);
        }}
        title={editing ? 'Editar objetivo' : 'Novo objetivo'}
        maxHeight="92dvh"
      >
        <form onSubmit={handleSubmit} className="px-4 pb-6 space-y-4">
          {targetYear != null && !editing && (
            <div className="px-3 py-2 rounded-[10px] bg-[#8E9C78]/10 text-[12px] font-semibold text-[#8E9C78] text-center">
              Para {targetYear}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#86868B] ml-1">
              O que quer conquistar?
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Ler 12 livros"
              autoFocus
              required
              className="w-full px-4 py-3.5 rounded-[14px] bg-[#0F0F11] border border-white/[0.06] text-[15px] text-[#F5F5F7] focus:border-[#0A84FF]/50 focus:outline-none transition-colors placeholder:text-[#5A5A5F]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#86868B] ml-1">
              Como medir?
            </label>
            <div className="relative flex p-1 bg-[#0F0F11] rounded-[14px] border border-white/[0.05]">
              {[
                { id: 'performance', label: 'Pelo esforço' },
                { id: 'financial', label: 'Guardando dinheiro' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setForm({ ...form, type: tab.id })}
                  className={`relative flex-1 py-2.5 rounded-[10px] text-[12.5px] font-semibold transition-colors z-10 outline-none ${
                    form.type === tab.id ? 'text-[#F5F5F7]' : 'text-[#86868B]'
                  }`}
                >
                  {form.type === tab.id && (
                    <motion.div
                      layoutId="mobileGoalType"
                      className="absolute inset-0 bg-[#2C2C2E] rounded-[10px] -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#86868B] ml-1">
              Até quando?
            </label>
            <div className="relative flex p-1 bg-[#0F0F11] rounded-[14px] border border-white/[0.05]">
              {['monthly', 'yearly', 'indefinite'].map((dt) => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => setForm({ ...form, deadline_type: dt })}
                  className={`relative flex-1 py-2.5 rounded-[10px] text-[11.5px] font-semibold transition-colors z-10 outline-none ${
                    form.deadline_type === dt ? 'text-[#F5F5F7]' : 'text-[#86868B]'
                  }`}
                >
                  {form.deadline_type === dt && (
                    <motion.div
                      layoutId="mobileGoalDeadline"
                      className="absolute inset-0 bg-[#2C2C2E] rounded-[10px] -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  {deadlineLabels[dt]}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {form.type === 'financial' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[#86868B] ml-1">
                    Quanto precisa juntar?
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868B] text-[14px]">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={form.target_value}
                      onChange={(e) =>
                        setForm({ ...form, target_value: e.target.value })
                      }
                      placeholder="0,00"
                      required
                      className="w-full pl-11 pr-4 py-3.5 rounded-[14px] bg-[#0F0F11] border border-white/[0.06] text-[15px] text-[#F5F5F7] focus:border-[#0A84FF]/50 focus:outline-none transition-colors placeholder:text-[#5A5A5F]"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={form.submitting || !form.name?.trim()}
            className="w-full py-4 rounded-[16px] bg-[#0A84FF] text-white text-[15px] font-semibold active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0A84FF]/20"
          >
            {form.submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Salvando...</span>
              </>
            ) : editing ? (
              'Pronto, salvar'
            ) : (
              'Começar agora'
            )}
          </button>
        </form>
      </Sheet>
    </motion.div>
  );
}
