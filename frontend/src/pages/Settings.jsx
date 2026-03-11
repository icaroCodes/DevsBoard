import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Camera, Mail, ShieldAlert, Trash2 } from 'lucide-react';
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

      if (avatarUrl && !avatarUrl.startsWith('data:')) {
        payload.avatar_url = avatarUrl;
      }

      await api('/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      const updatedUser = await refreshUser();

      success('Perfil atualizado!');
      setAvatarUrl(updatedUser?.avatar_url || null);
      setAvatarBase64(null);
    } catch (err) {
      error(`Erro ao salvar perfil: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    confirm({
      title: 'Excluir conta?',
      message: 'Esta ação é irreversível e excluirá todos os seus dados. Tem certeza?',
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

  if (loading) {
    return (
      <div className="flex gap-2 items-center justify-center h-[40vh]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#86868B] animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2.5 h-2.5 rounded-full bg-[#86868B] animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2.5 h-2.5 rounded-full bg-[#86868B] animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-2xl mx-auto pb-12 font-sans"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      <div className="mb-10">
        <h1 className="text-[32px] font-semibold text-[#F5F5F7] tracking-tight">Configurações</h1>
        <p className="text-[17px] text-[#86868B] mt-1">Gerencie sua identidade e preferências</p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <section className="bg-[#1C1C1E] border border-white/[0.04] rounded-[28px] overflow-hidden shadow-sm p-8">
          <div className="flex flex-col sm:flex-row items-center gap-8 mb-10">
            <div className="relative group">
              <div 
                className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/5 bg-[#2C2C2E] flex items-center justify-center cursor-pointer transition-all hover:border-[#0A84FF]"
                onClick={() => document.getElementById('avatar-input').click()}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-[#86868B]" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera size={24} className="text-white" />
                </div>
              </div>
              <input id="avatar-input" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
            
            <div className="text-center sm:text-left">
              <h2 className="text-[20px] font-semibold text-[#F5F5F7] tracking-tight">{form.name}</h2>
              <p className="text-[14px] text-[#86868B] flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                <Mail size={14} /> {user?.email}
              </p>
              {avatarBase64 && (
                <span className="inline-block mt-3 px-3 py-1 bg-[#FF9F0A]/10 text-[#FF9F0A] text-[11px] font-bold uppercase rounded-full">Nova imagem pendente</span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#86868B] ml-1 uppercase tracking-wider">Seu Nome</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-5 py-3.5 rounded-[18px] bg-[#2C2C2E] border border-transparent text-[16px] text-[#F5F5F7] focus:border-[#0A84FF] focus:outline-none transition-all placeholder:text-[#86868B]/50"
                required
              />
            </div>
            
            <div className="pt-2">
               <button
                type="submit"
                disabled={saving}
                className="px-8 py-3.5 rounded-[18px] bg-[#0A84FF] text-white text-[16px] font-semibold hover:bg-[#007AFF] transition-all disabled:opacity-50 shadow-lg shadow-[#0A84FF]/10 active:scale-[0.98]"
              >
                {saving ? 'Atualizando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </section>

        {/* Danger Zone */}
        <section className="bg-[#1C1C1E] border border-white/[0.04] rounded-[28px] overflow-hidden shadow-sm p-8">
           <div className="flex items-center gap-2 mb-6">
              <ShieldAlert size={20} className="text-[#FF453A]" />
              <h2 className="text-[17px] font-semibold text-[#F5F5F7]">Zona de Perigo</h2>
           </div>
           
           <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-[#FF453A]/5 border border-[#FF453A]/10 rounded-[20px]">
              <div>
                <p className="text-[15px] font-medium text-[#F5F5F7]">Excluir minha conta</p>
                <p className="text-[13px] text-[#86868B] mt-0.5">Todos os seus projetos, rotinas e finanças serão apagados.</p>
              </div>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF453A] text-white text-[13px] font-bold hover:bg-[#FF3B30] transition-colors whitespace-nowrap"
              >
                <Trash2 size={16} /> Excluir permanentemente
              </button>
           </div>
        </section>

        <div className="pt-4 flex justify-center">
           <button
            onClick={() => {
              confirm({
                title: 'Sair da conta?',
                message: 'Deseja realmente encerrar sua sessão?',
                onConfirm: () => { logout(); navigate('/'); }
              });
            }}
            className="flex items-center gap-2 text-[#86868B] hover:text-[#F5F5F7] font-medium transition-colors p-2"
          >
            <LogOut size={18} /> Encerrar Sessão
          </button>
        </div>
      </div>
    </motion.div>
  );
}
