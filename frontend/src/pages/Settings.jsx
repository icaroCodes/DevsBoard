import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmModalContext';

export default function Settings() {
  const [form, setForm] = useState({ name: '' });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarBase64, setAvatarBase64] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user, logout, updateUser, refreshUser } = useAuth();
  const { success, error } = useToast();
  const { confirm } = useConfirm();
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) return error('Imagem muito grande (máximo 2MB)');

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarBase64(reader.result);
      setAvatarUrl(reader.result); // Preview local
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        avatar_base64: avatarBase64
      };

      // Só enviamos avatar_url se não for um preview Base64 (que gera erro de validação no backend)
      // Se for Base64, o backend vai gerar uma nova URL via avatar_base64
      if (avatarUrl && !avatarUrl.startsWith('data:')) {
        payload.avatar_url = avatarUrl;
      }

      await api('/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      // Força uma nova chamada à API para garantir que o estado está sincronizado
      const updatedUser = await refreshUser();

      success('Perfil atualizado!');
      setAvatarUrl(updatedUser?.avatar_url || null);
      setAvatarBase64(null); // Limpa o base64 após salvar
    } catch (err) {
      error(`Erro ao salvar perfil: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    confirm({
      title: 'Excluir conta?',
      message: 'Tem certeza? Esta ação é irreversível e excluirá todos os seus dados.',
      onConfirm: async () => {
        try {
          await api('/settings', { method: 'DELETE' });
          logout();
          navigate('/');
        } catch (err) {
          error(err.message);
        }
      }
    });
  };

  if (loading) return <div className="h-32 bg-zinc-800 rounded-xl animate-pulse" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-xl">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-6">Perfil</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-input').click()}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Foto de perfil"
                className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700 hover:border-cyan-500 transition-colors"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center group-hover:border-cyan-500 transition-colors">
                <User size={28} className="text-zinc-500" />
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Alterar</span>
            </div>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div>
            <p className="font-medium">{form.name}</p>
            <p className="text-sm text-zinc-500">{user?.email}</p>
            {avatarUrl && !avatarBase64 && avatarUrl.includes('github') && (
              <p className="text-xs text-zinc-600 mt-0.5">Foto sincronizada pelo GitHub</p>
            )}
            {avatarBase64 && (
              <p className="text-xs text-orange-400 mt-0.5">Nova foto (salve para aplicar)</p>
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
          onClick={() => {
            confirm({
              title: 'Sair da conta?',
              message: 'Deseja realmente encerrar sua sessão?',
              type: 'info',
              onConfirm: () => {
                logout();
                navigate('/');
              }
            });
          }}
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
