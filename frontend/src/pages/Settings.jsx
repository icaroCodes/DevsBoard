import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const [form, setForm] = useState({ name: '' });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api('/settings')
      .then((data) => {
        setForm({ name: data.name });
        setAvatarUrl(data.avatar_url || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/settings', { method: 'PUT', body: JSON.stringify(form) });
      alert('Perfil atualizado!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza? Esta ação é irreversível e excluirá todos os seus dados.')) return;
    try {
      await api('/settings', { method: 'DELETE' });
      logout();
      navigate('/');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="h-32 bg-zinc-800 rounded-xl animate-pulse" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-xl">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-6">Perfil</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Foto de perfil"
              className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
              <User size={28} className="text-zinc-500" />
            </div>
          )}
          <div>
            <p className="font-medium">{form.name}</p>
            <p className="text-sm text-zinc-500">{user?.email}</p>
            {avatarUrl && (
              <p className="text-xs text-zinc-600 mt-0.5">Foto sincronizada pelo GitHub</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              value={user?.email}
              disabled
              className="w-full px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-500"
            />
            <p className="text-xs text-zinc-500 mt-1">O email não pode ser alterado</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-cyan-500 text-zinc-950 font-medium hover:bg-cyan-400 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        >
          <LogOut size={18} /> Sair
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
        >
          Excluir conta
        </button>
      </div>
    </motion.div>
  );
}
