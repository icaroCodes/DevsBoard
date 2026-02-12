import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Wallet, CheckSquare, Target } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="p-6 flex justify-between items-center">
        <span className="text-xl font-bold text-cyan-400">DevsBoard</span>
        <Link
          to="/auth"
          className="px-4 py-2 rounded-lg bg-cyan-500 text-zinc-950 font-medium hover:bg-cyan-400 transition-colors"
        >
          Entrar
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-6xl font-bold max-w-3xl mb-6"
        >
          Seu ambiente único de organização{' '}
          <span className="text-cyan-400">real</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-zinc-400 text-lg md:text-xl max-w-2xl mb-12"
        >
          Finanças, tarefas, rotinas, metas e projetos — tudo em um único lugar.
          Pensado para devs que valorizam produtividade real e clareza total.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap gap-8 justify-center mb-16"
        >
          {[
            { icon: Wallet, label: 'Finanças' },
            { icon: CheckSquare, label: 'Tarefas' },
            { icon: Target, label: 'Metas' },
            { icon: LayoutDashboard, label: 'Dashboard' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-zinc-500">
              <Icon size={20} className="text-cyan-500" />
              <span>{label}</span>
            </div>
          ))}
        </motion.div>

        <Link
          to="/auth"
          className="px-8 py-4 rounded-xl bg-cyan-500 text-zinc-950 font-semibold text-lg hover:bg-cyan-400 transition-colors"
        >
          Começar agora
        </Link>
      </main>
    </div>
  );
}
