import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, CheckSquare, Target } from 'lucide-react';
import { api } from '../lib/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-zinc-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  const { finance, tasks, goals } = data;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <Wallet size={20} />
            <span>Saldo</span>
          </div>
          <p className={`text-2xl font-bold ${finance.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            R$ {finance.balance.toFixed(2)}
          </p>
        </div>
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <TrendingUp size={20} />
            <span>Entradas</span>
          </div>
          <p className="text-2xl font-bold text-green-500">R$ {finance.income.toFixed(2)}</p>
        </div>
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <TrendingDown size={20} />
            <span>Despesas</span>
          </div>
          <p className="text-2xl font-bold text-red-500">R$ {finance.expense.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-2 text-zinc-400 mb-4">
            <CheckSquare size={20} />
            <span>Tarefas</span>
          </div>
          <p className="text-3xl font-bold">
            {tasks.completed ?? 0} / {tasks.total ?? 0}
          </p>
          <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full"
              style={{ width: `${tasks.total ? (tasks.completed / tasks.total) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-2 text-zinc-400 mb-4">
            <Target size={20} />
            <span>Metas</span>
          </div>
          <p className="text-3xl font-bold">
            {goals.completed ?? 0} / {goals.total ?? 0}
          </p>
          <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full"
              style={{ width: `${goals.total ? (goals.completed / goals.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Últimas transações</h2>
        <div className="space-y-2">
          {finance.recentTransactions?.length === 0 ? (
            <p className="text-zinc-500">Nenhuma transação recente</p>
          ) : (
            finance.recentTransactions?.map((t) => (
              <div
                key={t.id}
                className="flex justify-between items-center p-4 bg-zinc-900 border border-zinc-800 rounded-lg"
              >
                <div>
                  <p className="font-medium">{t.category}</p>
                  <p className="text-sm text-zinc-500">{t.description || '—'}</p>
                </div>
                <p className={t.type === 'income' ? 'text-green-500' : 'text-red-500'}>
                  {t.type === 'income' ? '+' : '-'} R$ {Number(t.amount).toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
