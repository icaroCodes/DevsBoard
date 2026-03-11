import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, Wallet, TrendingUp, TrendingDown, X, BarChart3, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmModalContext';

const CATEGORIES = ['Salário', 'Freelance', 'Investimentos', 'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Outros'];

export default function Finances() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    category: '',
    description: '',
    amount: '',
    type: 'expense',
    transaction_date: new Date().toISOString().slice(0, 10),
  });
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();

  const load = () => {
    api('/finances').then(setItems).catch(err => showError(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const filtered = items.filter((i) => {
    if (filter === 'all') return true;
    return i.type === filter;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api(`/finances/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
        });
      } else {
        await api('/finances', {
          method: 'POST',
          body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
        });
      }
      setModalOpen(false);
      setEditing(null);
      setForm({ category: '', description: '', amount: '', type: 'expense', transaction_date: new Date().toISOString().slice(0, 10) });
      success(editing ? 'Transação atualizada' : 'Transação registrada');
      load();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDelete = async (id) => {
    confirm({
      title: 'Excluir transação?',
      message: 'Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        try {
          await api(`/finances/${id}`, { method: 'DELETE' });
          success('Transação excluída');
          load();
        } catch (err) {
          showError(err.message);
        }
      }
    });
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      category: item.category,
      description: item.description || '',
      amount: String(item.amount),
      type: item.type,
      transaction_date: item.transaction_date,
    });
    setModalOpen(true);
  };

  const income = items.filter((i) => i.type === 'income').reduce((s, i) => s + Number(i.amount), 0);
  const expense = items.filter((i) => i.type === 'expense').reduce((s, i) => s + Number(i.amount), 0);
  const balance = income - expense;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  // Apple dark mode aesthetic values
  // bg app: #000000
  // container cards: #1C1C1E
  // elevated fields: #2C2C2E
  // primary text: #F5F5F7
  // secondary text: #86868B
  // blue accent: #0A84FF
  // green accent: #30D158
  // red accent: #FF453A

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#86868B] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-[#86868B] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-[#86868B] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  const categoryStats = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = { income: 0, expense: 0 };
    acc[item.category][item.type] += Number(item.amount);
    return acc;
  }, {});

  const maxExpense = Math.max(...Object.values(categoryStats).map(c => c.expense), 1);
  const maxIncome = Math.max(...Object.values(categoryStats).map(c => c.income), 1);

  // Recharts Data Prep
  const expensesData = Object.entries(categoryStats)
    .filter(([, s]) => s.expense > 0)
    .map(([name, value]) => ({ name, value: value.expense }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const incomesData = Object.entries(categoryStats)
    .filter(([, s]) => s.income > 0)
    .map(([name, value]) => ({ name, value: value.income }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const OPACITY_COLORS = ['#FF453A', '#FF453Ccc', '#FF453Caa', '#FF453C88', '#FF453C66'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#2C2C2E]/90 backdrop-blur-md border border-white/10 p-3 rounded-[12px] shadow-xl">
          <p className="text-[13px] font-medium text-[#F5F5F7] mb-1">{payload[0].name}</p>
          <p className="text-[15px] font-semibold tracking-tight" style={{ color: payload[0].color || payload[0].fill }}>
            R$ {payload[0].value.toFixed(2).replace('.', ',')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto pb-12 font-sans"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-[32px] leading-tight font-semibold text-[#F5F5F7] tracking-tight">Finanças</h1>
          <p className="text-[15px] text-[#86868B]">Acompanhe seu fluxo de caixa detalhado.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex p-1 bg-[#1C1C1E]/80 backdrop-blur-md rounded-[12px] shadow-sm border border-white/[0.04] relative">
            {['all', 'income', 'expense'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`relative px-5 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors z-10 outline-none ${filter === f
                  ? 'text-[#F5F5F7]'
                  : 'text-[#86868B] hover:text-[#F5F5F7]'
                  }`}
              >
                {filter === f && (
                  <motion.div
                    layoutId="activeFilter"
                    className="absolute inset-0 bg-[#3A3A3C] rounded-[8px] shadow-sm -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {f === 'all' ? 'Todas' : f === 'income' ? 'Entradas' : 'Despesas'}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setForm({ category: '', description: '', amount: '', type: 'expense', transaction_date: new Date().toISOString().slice(0, 10) });
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-5 py-2 rounded-[12px] bg-[#F5F5F7] text-[#000000] text-[14px] font-medium hover:bg-white transition-colors cursor-pointer shadow-sm"
          >
            <Plus size={16} strokeWidth={2.5} /> Novo Registro
          </button>
        </div>
      </motion.div>

      {/* Overview Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-[#1C1C1E] rounded-[24px] p-6 border border-white/[0.04] flex flex-col justify-between h-[150px] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-[#86868B]">
              <Wallet size={16} />
              <span className="text-[14px] font-medium">Saldo Atual</span>
            </div>
          </div>
          <p className={`text-[36px] font-semibold tracking-tight z-10 ${balance >= 0 ? 'text-[#F5F5F7]' : 'text-[#FF453A]'}`}>
            R$ {balance.toFixed(2).replace('.', ',')}
          </p>
          {/* Subtle gradient blob for aesthetic */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#0A84FF] opacity-[0.03] blur-3xl rounded-full pointer-events-none transition-opacity group-hover:opacity-[0.06]"></div>
        </div>

        <div className="bg-[#1C1C1E] rounded-[24px] p-6 border border-white/[0.04] flex flex-col justify-between h-[150px] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-[#86868B]">
              <ArrowUpRight size={16} className="text-[#30D158]" />
              <span className="text-[14px] font-medium">Entradas</span>
            </div>
          </div>
          <p className="text-[32px] font-medium text-[#F5F5F7] tracking-tight z-10">
            R$ {income.toFixed(2).replace('.', ',')}
          </p>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#30D158] opacity-[0.03] blur-3xl rounded-full pointer-events-none transition-opacity group-hover:opacity-[0.06]"></div>
        </div>

        <div className="bg-[#1C1C1E] rounded-[24px] p-6 border border-white/[0.04] flex flex-col justify-between h-[150px] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-[#86868B]">
              <ArrowDownRight size={16} className="text-[#FF453A]" />
              <span className="text-[14px] font-medium">Despesas</span>
            </div>
          </div>
          <p className="text-[32px] font-medium text-[#F5F5F7] tracking-tight z-10">
            R$ {expense.toFixed(2).replace('.', ',')}
          </p>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FF453A] opacity-[0.03] blur-3xl rounded-full pointer-events-none transition-opacity group-hover:opacity-[0.06]"></div>
        </div>
      </motion.div>

      <div className="flex flex-col gap-5">
        {/* Transactions Formatted specifically for SaaS look */}
        <motion.div variants={itemVariants} className="bg-[#1C1C1E] rounded-[24px] border border-white/[0.04] flex flex-col min-h-[500px] shadow-sm">
          <div className="px-6 py-5 border-b border-white/[0.04] flex items-center justify-between">
            <h2 className="text-[17px] font-semibold text-[#F5F5F7]">Transações Recentes</h2>
            <div className="text-[13px] text-[#86868B] bg-[#2C2C2E] px-3 py-1 rounded-full">
              {filtered.length} registro{filtered.length !== 1 && 's'}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 opacity-60 py-20">
              <Clock size={40} strokeWidth={1.5} className="text-[#86868B]" />
              <p className="text-[15px] text-[#86868B]">Nenhuma transação registrada.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {filtered.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 my-1 rounded-[16px] hover:bg-white/[0.03] transition-colors group cursor-default">
                  <div className="flex items-center gap-4 border border-transparent">
                    <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center ${item.type === 'income' ? 'bg-[#30D158]/[0.08] text-[#30D158]' : 'bg-[#FF453A]/[0.08] text-[#FF453A]'}`}>
                      {item.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[15px] font-medium text-[#F5F5F7] truncate max-w-[200px] sm:max-w-xs">{item.description || 'Transação genérica'}</span>
                      <span className="text-[13px] text-[#86868B] mt-0.5">{item.category} • {formatDate(item.transaction_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <span className={`text-[15px] font-medium ${item.type === 'income' ? 'text-[#30D158]' : 'text-[#F5F5F7]'}`}>
                      {item.type === 'income' ? '+' : '-'}R$ {Number(item.amount).toFixed(2).replace('.', ',')}
                    </span>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(item)} className="p-2 text-[#86868B] hover:text-[#F5F5F7] rounded-[8px] hover:bg-white/10 transition-colors outline-none cursor-pointer">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-[#86868B] hover:text-[#FF453A] rounded-[8px] hover:bg-[#FF453A]/10 transition-colors outline-none cursor-pointer">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Charts Sections - Side by Side on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top Expenses */}
          <motion.div variants={itemVariants} className="bg-[#1C1C1E] rounded-[24px] border border-white/[0.04] flex flex-col shadow-sm">
            <div className="px-6 py-5 border-b border-white/[0.04] flex items-center gap-2">
              <ArrowDownRight size={18} className="text-[#FF453A]" />
              <h2 className="text-[17px] font-semibold text-[#F5F5F7]">Top Despesas</h2>
            </div>
            <div className="p-6 h-[250px] w-full mt-2">
              {expensesData.length === 0 ? (
                <div className="flex items-center justify-center opacity-60 h-full">
                  <p className="text-[14px] text-[#86868B]">Sem despesas registradas.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {expensesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={OPACITY_COLORS[index % OPACITY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Top Incomes */}
          <motion.div variants={itemVariants} className="bg-[#1C1C1E] rounded-[24px] border border-white/[0.04] flex flex-col shadow-sm">
            <div className="px-6 py-5 border-b border-white/[0.04] flex items-center gap-2">
              <ArrowUpRight size={18} className="text-[#30D158]" />
              <h2 className="text-[17px] font-semibold text-[#F5F5F7]">Top Entradas (R$)</h2>
            </div>
            <div className="p-6 h-[250px] w-full mt-2">
              {incomesData.length === 0 ? (
                <div className="flex items-center justify-center opacity-60 h-full">
                  <p className="text-[14px] text-[#86868B]">Sem entradas registradas.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#86868B', fontSize: 12, fontWeight: 500 }}
                      dy={10}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="value" fill="#30D158" radius={[6, 6, 6, 6]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#1C1C1E] border border-white/[0.08] rounded-[28px] p-7 w-full max-w-md shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[20px] font-semibold text-[#F5F5F7] tracking-tight">
                  {editing ? 'Editar Transação' : 'Nova Transação'}
                </h2>
                <button onClick={() => { setModalOpen(false); setEditing(null); }} className="p-2 text-[#86868B] hover:text-[#F5F5F7] rounded-[8px] bg-white/[0.04] hover:bg-white/[0.08] transition-colors outline-none cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Segmented Control */}
                <div className="flex p-1 bg-[#2C2C2E] rounded-[16px] border border-white/[0.04] relative">
                  {['income', 'expense'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, type })}
                      className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-[14px] font-medium transition-colors z-10 outline-none ${
                        form.type === type ? 'text-[#F5F5F7]' : 'text-[#86868B] hover:text-[#F5F5F7]'
                      }`}
                    >
                      {form.type === type && (
                        <motion.div
                          layoutId="transactionTypeBg"
                          className="absolute inset-0 bg-[#3A3A3C] rounded-[12px] shadow-sm -z-10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      {type === 'income' ? (
                        <>
                          <ArrowUpRight size={16} className={form.type === 'income' ? 'text-[#30D158]' : ''} />
                          Entrada
                        </>
                      ) : (
                        <>
                          <ArrowDownRight size={16} className={form.type === 'expense' ? 'text-[#FF453A]' : ''} />
                          Despesa
                        </>
                      )}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#86868B] ml-1">Descrição</label>
                    <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3.5 rounded-[16px] bg-[#2C2C2E] border border-transparent text-[15px] text-[#F5F5F7] focus:border-[#0A84FF] focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0A84FF]/10 focus:outline-none transition-all placeholder:text-[#86868B]/50" placeholder="Ex: Conta de Luz" required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#86868B] ml-1">Valor</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-[#86868B] text-[15px]">R$</span>
                        <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full pl-11 pr-4 py-3.5 rounded-[16px] bg-[#2C2C2E] border border-transparent text-[15px] text-[#F5F5F7] focus:border-[#0A84FF] focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0A84FF]/10 focus:outline-none transition-all placeholder:text-[#86868B]/50" placeholder="0,00" required />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#86868B] ml-1">Data</label>
                      <input type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} className="w-full px-4 py-3.5 rounded-[16px] bg-[#2C2C2E] border border-transparent text-[15px] text-[#F5F5F7] focus:border-[#0A84FF] focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0A84FF]/10 focus:outline-none transition-all [color-scheme:dark]" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-[#86868B] ml-1">Categoria</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setForm({ ...form, category: c })}
                          className={`py-2 px-1 rounded-[12px] text-[11px] font-bold uppercase tracking-tight transition-all duration-200 border ${
                            form.category === c 
                              ? 'bg-[#0A84FF] border-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/20' 
                              : 'bg-white/5 border-transparent text-[#86868B] hover:bg-white/10'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full py-3.5 rounded-[16px] bg-[#0A84FF] text-white text-[16px] font-medium hover:bg-[#007AFF] transition-colors focus:ring-4 focus:ring-[#0A84FF]/30 active:scale-[0.98]">
                    {editing ? 'Salvar Alterações' : 'Adicionar Transação'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
