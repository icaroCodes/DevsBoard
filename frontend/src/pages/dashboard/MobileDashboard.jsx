import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet,
  CheckSquare,
  Repeat,
  Target,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ListTodo,
  ChevronRight,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useRegisterMobileFab } from '../../contexts/MobileFabContext';

/* ─────────────────────────────────────────────────────────
   Bare-mobile checkbox (no shadow, slimmer ring) — same
   semantics as desktop's TaskStatusCheck.
   ───────────────────────────────────────────────────────── */
function MobileCheck({ completed, priority, color = '#0A84FF' }) {
  if (completed) {
    return (
      <div
        className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0"
        style={{ background: color }}
      >
        <CheckSquare size={12} className="text-white" strokeWidth={3.2} />
      </div>
    );
  }
  const ring =
    priority === 'high'
      ? '#FF453A'
      : priority === 'medium'
        ? '#FF9F0A'
        : priority === 'low'
          ? '#32D74B'
          : '#5A5A5F';
  return (
    <div
      className="w-[22px] h-[22px] rounded-full shrink-0 transition-colors"
      style={{ border: `2px solid ${ring}` }}
    />
  );
}

function MobileSortableRow({ id, useSortable, CSS, children, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 active:bg-white/[0.04] transition-colors touch-none ${
        isDragging ? 'bg-white/[0.05]' : ''
      }`}
    >
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, to, viewAllLabel }) {
  return (
    <div className="flex items-center justify-between px-1 mb-2.5">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-[#F5F5F7]" strokeWidth={2} />
        <h2 className="text-[15px] font-semibold text-[#F5F5F7] tracking-tight">
          {title}
        </h2>
      </div>
      {to && (
        <Link
          to={to}
          className="flex items-center gap-0.5 text-[12.5px] font-medium text-[#0A84FF] active:opacity-70 transition-opacity"
        >
          {viewAllLabel}
          <ChevronRight size={13} strokeWidth={2.4} />
        </Link>
      )}
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

export default function MobileDashboard({
  data,
  displayName,
  t,
  routineTab,
  setRoutineTab,
  sortedTasks,
  sortedRoutineTasks,
  sensors,
  handleTaskDragEnd,
  handleRoutineDragEnd,
  toggleTaskComplete,
  toggleRoutineTaskComplete,
  useSortable,
  CSS,
}) {
  const { finance, goals } = data;

  // Page-contextual FAB → quickest path: jump to Tasks where the user can create.
  useRegisterMobileFab(
    {
      icon: Plus,
      label: 'Nova tarefa',
      onClick: () => {
        window.location.href = '/tasks';
      },
      tone: 'accent',
    },
    []
  );

  const fmtBRL = (n) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`;
  const routineTypeTabs = ['daily', 'weekly'];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="px-4 pt-4 pb-6 max-w-[640px] mx-auto"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Greeting */}
      <motion.div variants={fadeUp} className="mb-5 px-1">
        <p className="text-[12.5px] font-medium text-[#86868B] tracking-tight">
          {t.dashHello}
        </p>
        <h1 className="text-[26px] font-semibold text-[#F5F5F7] tracking-tight leading-tight">
          {displayName}
        </h1>
      </motion.div>

      {/* Finance hero */}
      <motion.section variants={fadeUp} className="mb-6">
        <SectionHeader
          icon={Wallet}
          title={t.dashFinances}
          to="/finances"
          viewAllLabel={t.viewAll}
        />

        <Link to="/finances" className="block outline-none">
          <div className="relative overflow-hidden rounded-[20px] p-5 border border-white/[0.06] bg-gradient-to-br from-[#202022] to-[#161618] shadow-[0_8px_24px_rgba(0,0,0,0.35)] active:scale-[0.99] transition-transform">
            <p className="text-[12px] font-medium text-[#86868B] tracking-tight mb-1">
              {t.dashBalance}
            </p>
            <p
              className={`text-[34px] font-semibold tracking-tight leading-none ${
                finance.balance >= 0 ? 'text-[#F5F5F7]' : 'text-[#FF453A]'
              }`}
            >
              {fmtBRL(finance.balance)}
            </p>
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#0A84FF] opacity-[0.07] blur-3xl rounded-full pointer-events-none" />

            <div className="grid grid-cols-2 gap-2 mt-5">
              <div className="rounded-[12px] bg-white/[0.03] border border-white/[0.04] p-3">
                <div className="flex items-center gap-1 text-[#30D158] mb-1">
                  <ArrowUpRight size={13} strokeWidth={2.2} />
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider">
                    {t.dashIncome}
                  </span>
                </div>
                <p className="text-[16px] font-semibold text-[#F5F5F7] tracking-tight">
                  {fmtBRL(finance.income)}
                </p>
              </div>
              <div className="rounded-[12px] bg-white/[0.03] border border-white/[0.04] p-3">
                <div className="flex items-center gap-1 text-[#FF453A] mb-1">
                  <ArrowDownRight size={13} strokeWidth={2.2} />
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider">
                    {t.dashExpense}
                  </span>
                </div>
                <p className="text-[16px] font-semibold text-[#F5F5F7] tracking-tight">
                  {fmtBRL(finance.expense)}
                </p>
              </div>
            </div>
          </div>
        </Link>
      </motion.section>

      {/* Tasks */}
      <motion.section variants={fadeUp} className="mb-6">
        <SectionHeader
          icon={CheckSquare}
          title={t.dashTasksPending}
          to="/projects"
          viewAllLabel={t.manage}
        />
        <div className="rounded-[18px] border border-white/[0.05] bg-[#1A1A1C] overflow-hidden">
          {sortedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <ListTodo size={28} className="text-[#5A5A5F]" strokeWidth={1.5} />
              <p className="text-[13px] text-[#86868B]">{t.dashTasksClean}</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleTaskDragEnd}
            >
              <SortableContext
                items={sortedTasks.map((it) => String(it.id))}
                strategy={verticalListSortingStrategy}
              >
                <ul className="divide-y divide-white/[0.04]">
                  {sortedTasks.map((it) => (
                    <li key={it.id}>
                      <MobileSortableRow
                        id={String(it.id)}
                        useSortable={useSortable}
                        CSS={CSS}
                        onClick={() => toggleTaskComplete(it)}
                      >
                        <MobileCheck
                          completed={it.completed}
                          priority={it.priority}
                          color="#0A84FF"
                        />
                        <span
                          className={`flex-1 min-w-0 text-[14px] font-medium truncate ${
                            it.completed
                              ? 'line-through text-[#86868B]'
                              : 'text-[#F5F5F7]'
                          }`}
                        >
                          {it.title}
                        </span>
                      </MobileSortableRow>
                    </li>
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </motion.section>

      {/* Routines */}
      <motion.section variants={fadeUp} className="mb-6">
        <SectionHeader
          icon={Repeat}
          title={t.dashHabits}
          to="/routines"
          viewAllLabel={t.manage}
        />

        <div className="rounded-[18px] border border-white/[0.05] bg-[#1A1A1C] overflow-hidden">
          {/* segmented control */}
          <div className="px-3 pt-3">
            <div className="relative flex p-1 bg-[#0F0F11] rounded-[10px] border border-white/[0.04]">
              {routineTypeTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRoutineTab(tab)}
                  className={`relative flex-1 py-1.5 rounded-[7px] text-[12.5px] font-semibold tracking-tight transition-colors z-10 outline-none ${
                    routineTab === tab ? 'text-[#F5F5F7]' : 'text-[#86868B]'
                  }`}
                >
                  {routineTab === tab && (
                    <motion.div
                      layoutId="mobileRoutineTab"
                      className="absolute inset-0 bg-[#2C2C2E] rounded-[7px] -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  {t.routineType?.[tab] || tab}
                </button>
              ))}
            </div>
          </div>

          {sortedRoutineTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Clock size={28} className="text-[#5A5A5F]" strokeWidth={1.5} />
              <p className="text-[13px] text-[#86868B] text-center px-6">
                {t.dashNoRoutine} {t.routineType?.[routineTab]?.toLowerCase()}.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleRoutineDragEnd}
            >
              <SortableContext
                items={sortedRoutineTasks.map((it) => it._key)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="mt-2 divide-y divide-white/[0.04]">
                  {sortedRoutineTasks.map((it) => (
                    <li key={it._key}>
                      <MobileSortableRow
                        id={it._key}
                        useSortable={useSortable}
                        CSS={CSS}
                        onClick={() => toggleRoutineTaskComplete(it.routineId, it)}
                      >
                        <MobileCheck
                          completed={it.completed}
                          priority={it.priority}
                          color="#8E9C78"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`text-[14px] font-medium truncate ${
                                it.completed
                                  ? 'line-through text-[#86868B]'
                                  : 'text-[#F5F5F7]'
                              }`}
                            >
                              {it.title}
                            </span>
                            {it.priority === 'high' && !it.completed && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FF453A] shrink-0" />
                            )}
                          </div>
                          {it.start_time && !it.completed && (
                            <p className="text-[11px] text-[#8E9C78] mt-0.5 flex items-center gap-1">
                              <Clock size={10} strokeWidth={2.2} />
                              {it.start_time.substring(0, 5)}
                            </p>
                          )}
                        </div>
                      </MobileSortableRow>
                    </li>
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </motion.section>

      {/* Goals — horizontal snap carousel */}
      <motion.section variants={fadeUp} className="mb-2">
        <SectionHeader
          icon={Target}
          title={t.dashGoals}
          to="/goals"
          viewAllLabel={t.viewAll}
        />

        {goals.items?.length === 0 ? (
          <Link
            to="/goals"
            className="flex flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-white/[0.08] bg-[#1A1A1C] py-10 px-6 active:bg-white/[0.02] transition-colors"
          >
            <Target size={32} strokeWidth={1.5} className="text-[#5A5A5F]" />
            <p className="text-[13px] text-[#86868B] text-center">{t.dashNoGoals}</p>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2C2C2E] text-[13px] font-semibold text-[#F5F5F7]">
              <Plus size={14} strokeWidth={2.4} /> {t.dashCreateGoal}
            </span>
          </Link>
        ) : (
          <div
            className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 snap-x snap-mandatory"
            style={{ scrollPaddingLeft: 16, scrollPaddingRight: 16 }}
          >
            {goals.items?.map((g) => (
              <Link
                key={g.id}
                to="/goals"
                className="snap-start shrink-0 w-[78%] max-w-[320px] outline-none"
              >
                <div className="relative h-[160px] rounded-[20px] p-5 border border-white/[0.06] bg-gradient-to-br from-[#1F1F22] to-[#15151A] flex flex-col justify-between overflow-hidden active:scale-[0.99] transition-transform">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-[6px] bg-[#FF9F0A]/15 text-[#FF9F0A] text-[10px] font-bold tracking-wider uppercase">
                      {t.goalType?.[g.type] || g.type}
                    </span>
                    <h3 className="mt-2 text-[15px] font-semibold text-[#F5F5F7] leading-tight line-clamp-2">
                      {g.name}
                    </h3>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#86868B]">{t.dashGoalAccum}</p>
                    <p className="text-[20px] font-semibold text-[#FF9F0A] tracking-tight">
                      {fmtBRL(g.saved_amount)}
                    </p>
                  </div>
                  <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-[#FF9F0A] opacity-[0.06] blur-3xl rounded-full pointer-events-none" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}
