import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Plus, Trash2, Pencil, Wallet, TrendingUp, TrendingDown, X, BarChart3, Clock, ArrowUpRight, ArrowDownRight, Loader2, Repeat, Calendar, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmModalContext';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeSubscription } from '../contexts/RealtimeContext';
import { useTranslation } from '../utils/translations';

const CATEGORIES = ['Salário', 'Ganhos Extras', 'Mercado/Comida', 'Ônibus/Carro', 'Luz/Água/Casa', 'Saúde/Médico', 'Lazer/Diversão', 'Presentes', 'Outros'];

const CAT_KEY_MAP = {
  'Salário': 'catSalary',
  'Freelance': 'catFreelance',
  'Investimentos': 'catInvestments',
  'Alimentação': 'catFood',
  'Transporte': 'catTransport',
  'Moradia': 'catHousing',
  'Saúde': 'catHealth',
  'Lazer': 'catLeisure',
  'Outros': 'catOthers',
};

export default function Finances() {
  const [items, setItems] = useState([]);
  const [recurringItems, setRecurringItems] = useState([]);
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
    is_recurring: false,
    recurrence_interval: 'monthly',
    day_of_month: new Date().getDate(),
    day_of_week: new Date().getDay(),
    submitting: false,
  });
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();
  const { activeTeam } = useAuth();
  const { t } = useTranslation();

  const getCatLabel = (raw) => t[CAT_KEY_MAP[raw]] || raw;

  const load = () => {
    setLoading(true);
    Promise.all([
      api('/finances'),
      api('/finances/recurring/list')
    ]).then(([finances, recurring]) => {
      setItems(finances);
      setRecurringItems(recurring);
    }).catch(err => showError(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [activeTeam]);

  useRealtimeSubscription(['finances'], () => { load(); });

  const filtered = items.filter((i) => {
    if (filter === 'all') return true;
    return i.type === filter;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.submitting) return;
    setForm(prev => ({ ...prev, submitting: true }));
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      delete payload.submitting;

      if (editing) {
        await api(`/finances/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else if (form.is_recurring) {
        // Criar transação recorrente
        await api('/finances/recurring', {
          method: 'POST',
          body: JSON.stringify({
            ...payload,
            start_date: payload.transaction_date,
            day_of_month: parseInt(form.day_of_month),
            day_of_week: parseInt(form.day_of_week),
          }),
        });
      } else {
        await api('/finances', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
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
        submitting: false
      });
      success(editing ? 'Pronto, atualizado!' : 'Pronto, anotado!');
      load();
    } catch (err) {
      showError(err.message);
      setForm(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleDelete = async (id) => {
    confirm({
      title: 'Apagar esta anotação?',
      message: 'Você tem certeza? Isso vai remover o valor dos seus cálculos.',
      onConfirm: async () => {
        try {
          await api(`/finances/${id}`, { method: 'DELETE' });
          success('Anotação removida');
          load();
        } catch (err) {
          showError(err.message);
        }
      }
    });
  };

  const handleDeleteRecurring = async (id) => {
    confirm({
      title: 'O que deseja fazer?',
      message: 'Deseja apagar apenas a regra de repetição (manter histórico) ou apagar todas as transações já geradas?',
      confirmText: 'Apagar Tudo',
      cancelText: 'Apenas Próximas (Manter histórico)',
      onConfirm: async () => {
        // Apaga tudo
        try {
          await api(`/finances/recurring/${id}?deleteAll=true`, { method: 'DELETE' });
          success('Recorrência e histórico removidos');
          load();
        } catch (err) {
          showError(err.message);
        }
      },
      onCancel: async () => {
        // Apaga apenas a regra
        try {
          await api(`/finances/recurring/${id}`, { method: 'DELETE' });
          success('Apenas as próximas foram canceladas');
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

  const modalOverlayRef = useRef(null);

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
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-[#0A84FF] border-t-transparent rounded-full"
        />
        <p className="text-[14px] text-[#86868B] font-medium tracking-wide font-sans">Organizando suas contas...</p>
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
          <h1 className="text-[32px] leading-tight font-semibold text-[#F5F5F7] tracking-tight">Meu Dinheiro</h1>
          <p className="text-[15px] text-[#86868B]">Veja para onde seu dinheiro está indo e quanto você ainda tem.</p>
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
                {f === 'all' ? 'Tudo' : f === 'income' ? 'O que entrou' : 'O que saiu'}
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
            <Plus size={16} strokeWidth={2.5} /> Anotar novo gasto ou ganho
          </button>
        </div>
      </motion.div>

      {/* Overview Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-[#1C1C1E] rounded-[24px] p-6 border border-white/[0.04] flex flex-col justify-between h-[150px] shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-[#86868B]">
              <Wallet size={16} />
              <span className="text-[14px] font-medium">Quanto tenho agora</span>
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
              <span className="text-[14px] font-medium">O que entrou</span>
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
              <span className="text-[14px] font-medium">O que saiu</span>
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
            <h2 className="text-[17px] font-semibold text-[#F5F5F7]">Últimas anotações</h2>
            <div className="text-[13px] text-[#86868B] bg-[#2C2C2E] px-3 py-1 rounded-full">
              {filtered.length} anotação{filtered.length !== 1 && 'ões'}
            </div>
          </div>

          {/* Seção de Recorrências se houver */}
          {recurringItems.length > 0 && (
            <div className="px-6 py-4 bg-[#0A84FF]/[0.02] border-b border-white/[0.04]">
              <div className="flex items-center gap-2 mb-3">
                <Repeat size={14} className="text-[#0A84FF]" />
                <h3 className="text-[12px] font-bold text-[#F5F5F7] uppercase tracking-wider">Repetições Automáticas</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {recurringItems.map(rec => (
                  <div key={rec.id} className="flex items-center gap-3 bg-[#2C2C2E]/60 border border-white/5 py-2 px-3 rounded-[12px] relative group hover:border-[#0A84FF]/20 transition-all">
                    <div className={`p-1.5 rounded-[8px] ${rec.type === 'income' ? 'bg-[#30D158]/20 text-[#30D158]' : 'bg-[#FF453A]/20 text-[#FF453A]'}`}>
                      <Repeat size={12} />
                    </div>
                    <div>
                      <p className="text-[12px] font-medium text-[#F5F5F7] leading-none mb-1">{rec.category}</p>
                      <p className="text-[10px] text-[#86868B] leading-none">
                        R$ {Number(rec.amount).toFixed(2)} • {rec.recurrence_interval === 'monthly' ? `Dia ${rec.day_of_month}` : rec.recurrence_interval === 'weekly' ? 'Semanal' : 'Quinzenal'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteRecurring(rec.id)}
                      className="ml-2 w-6 h-6 flex items-center justify-center rounded-full bg-[#FF453A]/10 text-[#FF453A] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#FF453A]/20"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 opacity-60 py-20">
              <Clock size={40} strokeWidth={1.5} className="text-[#86868B]" />
              <p className="text-[15px] text-[#86868B]">Você ainda não anotou nada sobre seu dinheiro.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {filtered.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 sm:p-4 my-1 rounded-[16px] hover:bg-white/[0.03] transition-colors group cursor-default">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-[12px] flex items-center justify-center ${item.type === 'income' ? 'bg-[#30D158]/[0.08] text-[#30D158]' : 'bg-[#FF453A]/[0.08] text-[#FF453A]'}`}>
                      {item.type === 'income' ? <ArrowUpRight size={18} className="sm:w-5 sm:h-5" /> : <ArrowDownRight size={18} className="sm:w-5 sm:h-5" />}
                    </div>
                    <div className="flex flex-col min-w-0 w-full">
                      <span className="text-[14px] sm:text-[15px] font-medium text-[#F5F5F7] truncate">{item.description || 'Gasto ou Ganho'}</span>
                      <span className="text-[12px] sm:text-[13px] text-[#86868B] mt-0.5 truncate">{item.category} • {formatDate(item.transaction_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-5 ml-2 sm:ml-4 shrink-0">
                    <span className={`text-[14px] sm:text-[15px] font-medium whitespace-nowrap ${item.type === 'income' ? 'text-[#30D158]' : 'text-[#F5F5F7]'}`}>
                      {item.type === 'income' ? '+' : '-'}R$ {Number(item.amount).toFixed(2).replace('.', ',')}
                    </span>
                    <div className="flex items-center gap-0.5 sm:gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(item)} className="p-1.5 sm:p-2 text-[#86868B] hover:text-[#F5F5F7] rounded-[8px] hover:bg-white/10 transition-colors outline-none cursor-pointer">
                        <Pencil size={14} className="sm:w-[15px] sm:h-[15px]" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 sm:p-2 text-[#86868B] hover:text-[#FF453A] rounded-[8px] hover:bg-[#FF453A]/10 transition-colors outline-none cursor-pointer">
                        <Trash2 size={14} className="sm:w-[15px] sm:h-[15px]" />
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
              <h2 className="text-[17px] font-semibold text-[#F5F5F7]">Onde gastei mais</h2>
            </div>
            <div className="p-6 h-[250px] w-full mt-2">
              {expensesData.length === 0 ? (
                <div className="flex items-center justify-center opacity-60 h-full">
                  <p className="text-[14px] text-[#86868B]">Ainda não há gastos anotados.</p>
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
              <h2 className="text-[17px] font-semibold text-[#F5F5F7]">De onde veio mais dinheiro</h2>
            </div>
            <div className="p-6 h-[250px] w-full mt-2">
              {incomesData.length === 0 ? (
                <div className="flex items-center justify-center opacity-60 h-full">
                  <p className="text-[14px] text-[#86868B]">Ainda não há ganhos anotados.</p>
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
          <div className="fixed inset-0 bg-[#000000]/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#1C1C1E] border border-white/[0.08] rounded-[28px] p-7 w-full max-w-md shadow-2xl relative my-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[20px] font-semibold text-[#F5F5F7] tracking-tight">
                  {editing ? 'Editar anotação' : 'Anotar novo gasto ou ganho'}
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
                        className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-[14px] font-medium transition-colors z-10 outline-none ${form.type === type ? 'text-[#F5F5F7]' : 'text-[#86868B] hover:text-[#F5F5F7]'
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
                            Dinheiro que entrou
                          </>
                        ) : (
                          <>
                            <ArrowDownRight size={16} className={form.type === 'expense' ? 'text-[#FF453A]' : ''} />
                            Dinheiro que saiu
                          </>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#86868B] ml-1">O que é? (Ex: Mercado, Conta de Luz...)</label>
                      <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3.5 rounded-[16px] bg-[#2C2C2E] border border-transparent text-[15px] text-[#F5F5F7] focus:border-[#0A84FF] focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0A84FF]/10 focus:outline-none transition-all placeholder:text-[#86868B]/50" placeholder="Ex: Compra de pão" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-[#86868B] ml-1">Quanto (Valor)?</label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-[#86868B] text-[15px]">R$</span>
                          <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full pl-11 pr-4 py-3.5 rounded-[16px] bg-[#2C2C2E] border border-transparent text-[15px] text-[#F5F5F7] focus:border-[#0A84FF] focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0A84FF]/10 focus:outline-none transition-all placeholder:text-[#86868B]/50" placeholder="0,00" required />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-[#86868B] ml-1">Quando (Data)?</label>
                        <input type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} className="w-full px-4 py-3.5 rounded-[16px] bg-[#2C2C2E] border border-transparent text-[15px] text-[#F5F5F7] focus:border-[#0A84FF] focus:bg-[#1C1C1E] focus:ring-4 focus:ring-[#0A84FF]/10 focus:outline-none transition-all [color-scheme:dark]" required />
                      </div>
                    </div>

                    {!editing && (
                      <div className="p-4 bg-[#2C2C2E]/50 rounded-[20px] border border-white/[0.04] space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={form.is_recurring}
                              onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-6 bg-[#3A3A3C] rounded-full peer peer-checked:bg-[#0A84FF] transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#F5F5F7] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"></div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] font-semibold text-[#F5F5F7]">Repetir automaticamente</span>
                            <span className="text-[12px] text-[#86868B]">Crie uma transação recorrente</span>
                          </div>
                        </label>

                        {form.is_recurring && (
                          <div className="space-y-4 pt-2 border-t border-white/5">
                            <div className="space-y-1.5">
                              <label className="text-[13px] font-medium text-[#86868B] ml-1">Frequência</label>
                              <div className="flex p-1 bg-[#1C1C1E] rounded-[12px] border border-white/[0.04]">
                                {['weekly', 'biweekly', 'monthly'].map((int) => (
                                  <button
                                    key={int}
                                    type="button"
                                    onClick={() => setForm({ ...form, recurrence_interval: int })}
                                    className={`flex-1 py-1.5 rounded-[8px] text-[11px] font-bold uppercase tracking-tight transition-all ${form.recurrence_interval === int
                                      ? 'bg-[#3A3A3C] text-[#F5F5F7]'
                                      : 'text-[#86868B] hover:text-[#F5F5F7]'
                                      }`}
                                  >
                                    {int === 'weekly' ? 'Semanal' : int === 'biweekly' ? 'Quinzenal' : 'Mensal'}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {form.recurrence_interval === 'monthly' && (
                              <div className="space-y-1.5">
                                <label className="text-[13px] font-medium text-[#86868B] ml-1">Dia do mês (1-31)</label>
                                 <input
                                  type="number"
                                  min="1"
                                  max="31"
                                  value={form.day_of_month}
                                  onChange={(e) => {
                                    let val = e.target.value;
                                    if (val === '') {
                                      setForm({ ...form, day_of_month: '' });
                                      return;
                                    }
                                    let n = parseInt(val, 10);
                                    if (n > 31) n = 31;
                                    if (n < 1) n = 1;
                                    setForm({ ...form, day_of_month: n });
                                  }}
                                  className="w-full px-4 py-3 rounded-[12px] bg-[#1C1C1E] border border-transparent text-[15px] text-[#F5F5F7] focus:border-[#0A84FF] focus:outline-none transition-all"
                                />
                              </div>
                            )}

                            {form.recurrence_interval === 'weekly' && (
                              <div className="space-y-1.5">
                                <label className="text-[13px] font-medium text-[#86868B] ml-1">Dia da semana</label>
                                <select
                                  value={form.day_of_week}
                                  onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
                                  className="w-full px-4 py-3 rounded-[12px] bg-[#1C1C1E] border border-transparent text-[15px] text-[#F5F5F7] focus:border-[#0A84FF] focus:outline-none transition-all"
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
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[13px] font-medium text-[#86868B] ml-1">Tipo da anotação (Categoria)</label>
                      <div className="grid grid-cols-3 gap-2">
                        {CATEGORIES.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setForm({ ...form, category: c })}
                            className={`py-2 px-1 rounded-[12px] text-[11px] font-bold uppercase tracking-tight transition-all duration-200 border ${form.category === c
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

                  <div className="pt-4 pb-2">
                    <button
                      type="submit"
                      disabled={form.submitting}
                      className="w-full py-4 rounded-[20px] bg-[#0A84FF] text-white text-[16px] font-semibold hover:bg-[#007AFF] transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-[#0A84FF]/20 flex items-center justify-center gap-2"
                    >
                      {form.submitting ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          <span>Guardando anotação...</span>
                        </>
                      ) : editing ? 'Salvar mudanças' : 'Pronto, anotar'}
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
