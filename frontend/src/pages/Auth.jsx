import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, loginWithToken } = useAuth();
  const navigate = useNavigate();

  // Lida com o redirect do GitHub OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      setError('Erro ao autenticar com GitHub. Tente novamente.');
      window.history.replaceState({}, '', '/auth');
      return;
    }

    if (token) {
      const user = { id: params.get('id'), name: params.get('name'), email: params.get('email') };
      loginWithToken(token, user);
      navigate('/dashboard');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) return setError('Nome é obrigatório');
        await register(name, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="block text-center text-cyan-400 font-bold text-xl mb-8">
          DevsBoard
        </Link>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-6">
            {isLogin ? 'Entrar' : 'Criar conta'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:border-cyan-500 focus:outline-none"
                  placeholder="Seu nome"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:border-cyan-500 focus:outline-none"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:border-cyan-500 focus:outline-none"
                placeholder="••••••••"
                minLength={6}
                required
              />
              {!isLogin && (
                <p className="text-xs text-zinc-500 mt-1">Mínimo 6 caracteres</p>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-cyan-500 text-zinc-950 font-medium hover:bg-cyan-400 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <div className="mt-4 relative flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-500">ou</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <a
            href="http://localhost:3001/auth/github"
            className="mt-4 w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 font-medium hover:bg-zinc-700 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Entrar com GitHub
          </a>

          <p className="mt-6 text-center text-zinc-400 text-sm">
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-cyan-400 hover:underline"
            >
              {isLogin ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
