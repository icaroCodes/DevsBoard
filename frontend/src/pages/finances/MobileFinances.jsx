import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Repeat,
  Clock,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Sheet from '../../components/mobile/Sheet';
import { useRegisterMobileFab } from '../../contexts/MobileFabContext';

const CATEGORIES = [
  'Salário',
  'Ganhos Extras',
  'Mercado/Comida',
  'Ônibus/Carro',
  'Luz/Água/Casa',
  'Saúde/Médico',
  'Lazer/Diversão',
  'Presentes',
  'Outros',
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

const fmtBRL = (n) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`;

function MobileTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#1F1F22]/95 backdrop-blur-md border border-white/[0.08] py-2 px-3 rounded-[10px] shadow-xl">
      <p className="text-[11.5px] font-medium text-[#F5F5F7] mb-0.5">
        {payload[0].name}
      </p>
      <p
        className="text-[13px] font-semibold tracking-tight"
        style={{ color: payload[0].color || payload[0].fill }}
      >
        {fmtBRL(payload[0].value)}
      </p>
    </div>
  );
}

const PIE_COLORS = ['#FF453A', '#FF6961', '#FF8E85', '#FFB1AA', '#FFC9C5'];

export default function MobileFinances({
  items,
  recurringItems,
  filter,
  setFilter,
  income,
  expense,
  balance,
  filtered,
  expensesData,
  incomesData,
  formatDate,
  openEdit,
  handleDelete,
  handleDeleteRecurring,
  modalOpen,
  setModalOpen,
  editing,
  setEditing,
  form,
  setForm,
  handleSubmit,
}) {
  const [actionItem, setActionItem] = useState(null);
  const [chartTab, setChartTab] = useState('expense');

  const openNew = () => {
    setEditing(null);
    setForm({
      category: '',
      description: '',
      amount: '',
      type: 'expense',
      transaction_date: new Date().toISOString().slice(0, 10),
      is_recurring: false,
      recurrence_interval: 'monthly',
      day_of_month: new Date().getDate(),
      day_of_week: new Date().getDay(),
      submitting: false,
    });
    setModalOpen(true);
  };

  useRegisterMobileFab(
    { icon: Plus, label: 'Nova anotação', tone: 'accent', onClick: openNew },
    []
  );

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
      {/* Greeting */}
      <motion.div variants={fadeUp} className="mb-5 px-1">
        <p className="text-[12.5px] font-medium text-[#86868B] tracking-tight">
          Meu dinheiro
        </p>
        <h1 className="text-[26px] font-semibold text-[#F5F5F7] tracking-tight leading-tight">
          {fmtBRL(balance)}
        </h1>
      </motion.div>

      {/* Balance hero card */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden rounded-[20px] p-5 border border-white/[0.06] bg-gradient-to-br from-[#202022] to-[#161618] shadow-[0_8px_24px_rgba(0,0,0,0.35)] mb-5"
      >
        <div className="flex items-center gap-2 text-[#86868B] mb-1">
          <Wallet size={14} strokeWidth={1.9} />
          <span className="text-[11.5px] font-medium tracking-tight">
            Quanto tenho agora
          </span>
        </div>
        <p
          className={`text-[34px] font-semibold tracking-tight leading-none ${
            balance >= 0 ? 'text-[#F5F5F7]' : 'text-[#FF453A]'
          }`}
        >
          {fmtBRL(balance)}
        </p>
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#0A84FF] opacity-[0.08] blur-3xl rounded-full pointer-events-none" />

        <div className="grid grid-cols-2 gap-2 mt-5">
          <div className="rounded-[12px] bg-white/[0.03] border border-white/[0.04] p-3">
            <div className="flex items-center gap-1 text-[#30D158] mb-1">
              <ArrowUpRight size={13} strokeWidth={2.2} />
              <span className="text-[10.5px] font-semibold uppercase tracking-wider">
                Entrou
              </span>
            </div>
            <p className="text-[16px] font-semibold text-[#F5F5F7] tracking-tight">
              {fmtBRL(income)}
            </p>
          </div>
          <div className="rounded-[12px] bg-white/[0.03] border border-white/[0.04] p-3">
            <div className="flex items-center gap-1 text-[#FF453A] mb-1">
              <ArrowDownRight size={13} strokeWidth={2.2} />
              <span className="text-[10.5px] font-semibold uppercase tracking-wider">
                Saiu
              </span>
            </div>
            <p className="text-[16px] font-semibold text-[#F5F5F7] tracking-tight">
              {fmtBRL(expense)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filter */}
      <motion.div variants={fadeUp} className="relative flex p-1 mb-4 bg-[#0F0F11] rounded-[12px] border border-white/[0.04]">
        {[
          { id: 'all', label: 'Tudo' },
          { id: 'income', label: 'Entrou' },
          { id: 'expense', label: 'Saiu' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`relative flex-1 py-2 rounded-[8px] text-[12.5px] font-semibold tracking-tight transition-colors z-10 outline-none ${
              filter === f.id ? 'text-[#F5F5F7]' : 'text-[#86868B]'
            }`}
          >
            {filter === f.id && (
              <motion.div
                layoutId="mobileFinanceFilter"
                className="absolute inset-0 bg-[#2C2C2E] rounded-[8px] -z-10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              />
            )}
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* Recurring chips */}
      {recurringItems.length > 0 && (
        <motion.section variants={fadeUp} className="mb-5">
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <Repeat size={13} className="text-[#0A84FF]" strokeWidth={2.2} />
            <h3 className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">
              Repetições automáticas
            </h3>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 snap-x">
            {recurringItems.map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => handleDeleteRecurring(rec.id)}
                className="snap-start shrink-0 flex items-center gap-2.5 bg-[#1A1A1C] border border-white/[0.05] py-2 px-3 rounded-[14px] active:bg-white/[0.04] transition-colors outline-none"
              >
                <div
                  className={`w-7 h-7 rounded-[8px] flex items-center justify-center ${
                    rec.type === 'income'
                      ? 'bg-[#30D158]/20 text-[#30D158]'
                      : 'bg-[#FF453A]/20 text-[#FF453A]'
                  }`}
                >
                  <Repeat size={13} strokeWidth={2.2} />
                </div>
                <div className="text-left">
                  <p className="text-[12px] font-semibold text-[#F5F5F7] leading-tight">
                    {rec.category}
                  </p>
                  <p className="text-[10.5px] text-[#86868B] leading-tight mt-0.5">
                    {fmtBRL(rec.amount)} ·{' '}
                    {rec.recurrence_interval === 'monthly'
                      ? `Dia ${rec.day_of_month}`
                      : rec.recurrence_interval === 'weekly'
                        ? 'Semanal'
                        : 'Quinzenal'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </motion.section>
      )}

      {/* Transactions */}
      <motion.section variants={fadeUp} className="mb-6">
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-[15px] font-semibold text-[#F5F5F7] tracking-tight">
            Últimas anotações
          </h2>
          <span className="text-[11px] font-semibold text-[#86868B] bg-[#1A1A1C] border border-white/[0.05] px-2 py-0.5 rounded-full">
            {filtered.length}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 rounded-[18px] border border-white/[0.05] bg-[#1A1A1C]">
            <Clock size={28} className="text-[#5A5A5F]" strokeWidth={1.5} />
            <p className="text-[13px] text-[#86868B] text-center px-6">
              Você ainda não anotou nada.
            </p>
          </div>
        ) : (
          <div className="rounded-[18px] border border-white/[0.05] bg-[#1A1A1C] overflow-hidden">
            <ul className="divide-y divide-white/[0.04]">
              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setActionItem(item)}
                    className="flex items-center gap-3 w-full px-3.5 py-3 text-left active:bg-white/[0.04] transition-colors outline-none"
                  >
                    <div
                      className={`w-10 h-10 shrink-0 rounded-[12px] flex items-center justify-center ${
                        item.type === 'income'
                          ? 'bg-[#30D158]/[0.10] text-[#30D158]'
                          : 'bg-[#FF453A]/[0.10] text-[#FF453A]'
                      }`}
                    >
                      {item.type === 'income' ? (
                        <ArrowUpRight size={17} strokeWidth={2.2} />
                      ) : (
                        <ArrowDownRight size={17} strokeWidth={2.2} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-[#F5F5F7] truncate">
                        {item.description || 'Gasto ou Ganho'}
                      </p>
                      <p className="text-[11.5px] text-[#86868B] truncate mt-0.5">
                        {item.category} · {formatDate(item.transaction_date)}
                      </p>
                    </div>
                    <span
                      className={`text-[14px] font-semibold whitespace-nowrap shrink-0 ${
                        item.type === 'income' ? 'text-[#30D158]' : 'text-[#F5F5F7]'
                      }`}
                    >
                      {item.type === 'income' ? '+' : '−'}
                      {fmtBRL(item.amount).replace('R$ ', '')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.section>

      {/* Charts — tabbed */}
      <motion.section variants={fadeUp} className="mb-2">
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-[15px] font-semibold text-[#F5F5F7] tracking-tight">
            Análise
          </h2>
        </div>

        <div className="rounded-[18px] border border-white/[0.05] bg-[#1A1A1C] overflow-hidden">
          <div className="px-3 pt-3">
            <div className="relative flex p-1 bg-[#0F0F11] rounded-[10px] border border-white/[0.04]">
              {[
                { id: 'expense', label: 'Onde gastei', Icon: PieIcon },
                { id: 'income', label: 'De onde veio', Icon: BarChart3 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setChartTab(tab.id)}
                  className={`relative flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[7px] text-[12px] font-semibold transition-colors z-10 outline-none ${
                    chartTab === tab.id ? 'text-[#F5F5F7]' : 'text-[#86868B]'
                  }`}
                >
                  {chartTab === tab.id && (
                    <motion.div
                      layoutId="mobileFinanceChartTab"
                      className="absolute inset-0 bg-[#2C2C2E] rounded-[7px] -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <tab.Icon size={13} strokeWidth={2.2} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[260px] w-full px-3 pt-2 pb-3">
            <AnimatePresence mode="wait">
              {chartTab === 'expense' ? (
                <motion.div
                  key="exp"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {expensesData.length === 0 ? (
                    <div className="flex items-center justify-center opacity-60 h-full">
                      <p className="text-[12.5px] text-[#86868B]">
                        Ainda não há gastos anotados.
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expensesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={56}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {expensesData.map((entry, i) => (
                            <Cell
                              key={`c-${i}`}
                              fill={PIE_COLORS[i % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={<MobileTooltip />}
                          cursor={{ fill: 'transparent' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="inc"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {incomesData.length === 0 ? (
                    <div className="flex items-center justify-center opacity-60 h-full">
                      <p className="text-[12.5px] text-[#86868B]">
                        Ainda não há ganhos anotados.
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={incomesData}
                        margin={{ top: 14, right: 6, left: -16, bottom: 4 }}
                      >
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#86868B', fontSize: 10, fontWeight: 500 }}
                          dy={6}
                          interval={0}
                          height={40}
                        />
                        <Tooltip
                          content={<MobileTooltip />}
                          cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                        />
                        <Bar
                          dataKey="value"
                          fill="#30D158"
                          radius={[6, 6, 6, 6]}
                          maxBarSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Legend for pie chart */}
          {chartTab === 'expense' && expensesData.length > 0 && (
            <ul className="px-3 pb-4 space-y-1.5">
              {expensesData.map((d, i) => (
                <li
                  key={d.name}
                  className="flex items-center justify-between text-[12px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-[#E5E5EA] truncate">{d.name}</span>
                  </div>
                  <span className="text-[#86868B] font-semibold tabular-nums shrink-0 ml-2">
                    {fmtBRL(d.value)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.section>

      {/* Action sheet (per item) */}
      <Sheet
        open={!!actionItem}
        onClose={() => setActionItem(null)}
        title={actionItem?.description || actionItem?.category}
      >
        <div className="px-4 pb-5 space-y-2">
          <div className="px-3.5 py-3 rounded-[12px] bg-white/[0.03] border border-white/[0.04] mb-1">
            <p className="text-[11px] text-[#86868B] uppercase tracking-wider font-semibold">
              {actionItem?.type === 'income' ? 'Entrou' : 'Saiu'} ·{' '}
              {actionItem?.category}
            </p>
            <p
              className={`text-[20px] font-semibold tracking-tight mt-0.5 ${
                actionItem?.type === 'income' ? 'text-[#30D158]' : 'text-[#F5F5F7]'
              }`}
            >
              {actionItem?.type === 'income' ? '+' : '−'}
              {actionItem ? fmtBRL(actionItem.amount).replace('R$ ', '') : ''}
            </p>
            {actionItem?.transaction_date && (
              <p className="text-[11.5px] text-[#86868B] mt-0.5">
                {formatDate(actionItem.transaction_date)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              const it = actionItem;
              setActionItem(null);
              if (it) openEdit(it);
            }}
            className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-white/[0.04] active:bg-white/[0.08] transition-colors outline-none"
          >
            <Pencil size={17} className="text-[#E5E5EA]" strokeWidth={2} />
            <span className="text-[14px] font-medium text-[#F5F5F7]">Editar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const id = actionItem?.id;
              setActionItem(null);
              if (id != null) handleDelete(id);
            }}
            className="flex items-center gap-3 w-full p-3.5 rounded-[12px] bg-[#FF3B30]/10 active:bg-[#FF3B30]/20 transition-colors outline-none"
          >
            <Trash2 size={17} className="text-[#FF6961]" strokeWidth={2} />
            <span className="text-[14px] font-semibold text-[#FF6961]">Apagar</span>
          </button>
        </div>
      </Sheet>

      {/* Form sheet */}
      <Sheet
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Editar anotação' : 'Novo gasto ou ganho'}
        maxHeight="92dvh"
      >
        <form onSubmit={handleSubmit} className="px-4 pb-6 space-y-4">
          {/* Type segmented */}
          <div className="relative flex p-1 bg-[#0F0F11] rounded-[14px] border border-white/[0.05]">
            {['income', 'expense'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, type })}
                className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-[13px] font-semibold transition-colors z-10 outline-none ${
                  form.type === type ? 'text-[#F5F5F7]' : 'text-[#86868B]'
                }`}
              >
                {form.type === type && (
                  <motion.div
                    layoutId="mobileTransactionType"
                    className="absolute inset-0 bg-[#2C2C2E] rounded-[10px] -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                {type === 'income' ? (
                  <>
                    <ArrowUpRight
                      size={14}
                      strokeWidth={2.4}
                      className={form.type === 'income' ? 'text-[#30D158]' : ''}
                    />
                    Entrou
                  </>
                ) : (
                  <>
                    <ArrowDownRight
                      size={14}
                      strokeWidth={2.4}
                      className={form.type === 'expense' ? 'text-[#FF453A]' : ''}
                    />
                    Saiu
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#86868B] ml-1">
              O que é?
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ex: Compra de pão"
              required
              autoFocus
              className="w-full px-4 py-3.5 rounded-[14px] bg-[#0F0F11] border border-white/[0.06] text-[15px] text-[#F5F5F7] focus:border-[#0A84FF]/50 focus:outline-none transition-colors placeholder:text-[#5A5A5F]"
            />
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#86868B] ml-1">
                Valor
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868B] text-[14px]">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0,00"
                  required
                  className="w-full pl-11 pr-3 py-3.5 rounded-[14px] bg-[#0F0F11] border border-white/[0.06] text-[15px] text-[#F5F5F7] focus:border-[#0A84FF]/50 focus:outline-none transition-colors placeholder:text-[#5A5A5F]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#86868B] ml-1">
                Quando
              </label>
              <input
                type="date"
                value={form.transaction_date}
                onChange={(e) =>
                  setForm({ ...form, transaction_date: e.target.value })
                }
                required
                className="w-full px-3 py-3.5 rounded-[14px] bg-[#0F0F11] border border-white/[0.06] text-[15px] text-[#F5F5F7] focus:border-[#0A84FF]/50 focus:outline-none transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Recurring */}
          {!editing && (
            <div className="rounded-[14px] bg-[#0F0F11] border border-white/[0.05] p-3.5 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.is_recurring}
                    onChange={(e) =>
                      setForm({ ...form, is_recurring: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-[#3A3A3C] rounded-full peer peer-checked:bg-[#0A84FF] transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#F5F5F7] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13.5px] font-semibold text-[#F5F5F7]">
                    Repetir automaticamente
                  </span>
                  <span className="text-[11.5px] text-[#86868B]">
                    Crie uma transação recorrente
                  </span>
                </div>
              </label>

              <AnimatePresence initial={false}>
                {form.is_recurring && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pt-3 border-t border-white/[0.04]">
                      <div className="space-y-1.5">
                        <label className="text-[11.5px] font-medium text-[#86868B] ml-1">
                          Frequência
                        </label>
                        <div className="flex p-1 bg-[#161618] rounded-[10px] border border-white/[0.04]">
                          {['weekly', 'biweekly', 'monthly'].map((int) => (
                            <button
                              key={int}
                              type="button"
                              onClick={() =>
                                setForm({ ...form, recurrence_interval: int })
                              }
                              className={`flex-1 py-1.5 rounded-[7px] text-[10.5px] font-bold uppercase tracking-tight transition-all ${
                                form.recurrence_interval === int
                                  ? 'bg-[#2C2C2E] text-[#F5F5F7]'
                                  : 'text-[#86868B]'
                              }`}
                            >
                              {int === 'weekly'
                                ? 'Semanal'
                                : int === 'biweekly'
                                  ? 'Quinzenal'
                                  : 'Mensal'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {form.recurrence_interval === 'monthly' && (
                        <div className="space-y-1.5">
                          <label className="text-[11.5px] font-medium text-[#86868B] ml-1">
                            Dia do mês (1-31)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            inputMode="numeric"
                            value={form.day_of_month}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v === '') {
                                setForm({ ...form, day_of_month: '' });
                                return;
                              }
                              let n = parseInt(v, 10);
                              if (n > 31) n = 31;
                              if (n < 1) n = 1;
                              setForm({ ...form, day_of_month: n });
                            }}
                            className="w-full px-3 py-2.5 rounded-[10px] bg-[#161618] border border-white/[0.04] text-[14px] text-[#F5F5F7] focus:border-[#0A84FF]/50 focus:outline-none transition-colors"
                          />
                        </div>
                      )}

                      {form.recurrence_interval === 'weekly' && (
                        <div className="space-y-1.5">
                          <label className="text-[11.5px] font-medium text-[#86868B] ml-1">
                            Dia da semana
                          </label>
                          <select
                            value={form.day_of_week}
                            onChange={(e) =>
                              setForm({ ...form, day_of_week: e.target.value })
                            }
                            className="w-full px-3 py-2.5 rounded-[10px] bg-[#161618] border border-white/[0.04] text-[14px] text-[#F5F5F7] focus:border-[#0A84FF]/50 focus:outline-none transition-colors"
                          >
                            <option value="0">Domingo</option>
                            <option value="1">Segunda-feira</option>
                            <option value="2">Terça-feira</option>
                            <option value="3">Quarta-feira</option>
                            <option value="4">Quinta-feira</option>
                            <option value="5">Sexta-feira</option>
                            <option value="6">Sábado</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Category grid */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#86868B] ml-1">
              Categoria
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => {
                const active = form.category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, category: c })}
                    className={`px-1.5 py-2.5 rounded-[10px] text-[10.5px] font-bold uppercase tracking-tight transition-all border text-center leading-tight ${
                      active
                        ? 'bg-[#0A84FF] border-[#0A84FF] text-white shadow-md shadow-[#0A84FF]/20'
                        : 'bg-[#0F0F11] border-white/[0.05] text-[#86868B]'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={form.submitting || !form.amount || !form.description}
            className="w-full py-4 rounded-[16px] bg-[#0A84FF] text-white text-[15px] font-semibold active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0A84FF]/20"
          >
            {form.submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Guardando...</span>
              </>
            ) : editing ? (
              'Salvar mudanças'
            ) : (
              'Pronto, anotar'
            )}
          </button>
        </form>
      </Sheet>
    </motion.div>
  );
}
