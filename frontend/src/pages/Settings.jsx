import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Camera, Mail, ShieldAlert, Trash2, Clock, Calendar, Timer, Flame } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmModalContext';
import { useTranslation } from '../utils/translations';

export default function Settings() {
  const [form, setForm] = useState({ name: '' });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarBase64, setAvatarBase64] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usageStats, setUsageStats] = useState(null);
  const { user, logout, updateUser, refreshUser } = useAuth();
  const { success, error } = useToast();
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const { t, lang, setLang } = useTranslation();

  useEffect(() => {
    Promise.all([
      api('/settings'),
      api('/sessions/stats'),
    ])
      .then(([settingsData, statsData]) => {
        setForm({ name: settingsData.name });
        setAvatarUrl(settingsData.avatar_url || null);
        setUsageStats({
          totalSeconds: settingsData.total_usage_seconds || 0,
          accountAgeDays: settingsData.account_age_days || 0,
          createdAt: settingsData.created_at,
          longestSessionSeconds: statsData.longest_session_seconds || 0,
          currentStreak: settingsData.current_streak || 0,
          longestStreak: settingsData.longest_streak || 0,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) return error(t.settingsImgMax);

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

      success(t.settingsProfileUpdated);
      setAvatarUrl(updatedUser?.avatar_url || null);
      setAvatarBase64(null);
    } catch (err) {
      error(`${t.settingsUpdateError} ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    confirm({
      title: t.settingsConfirmDelAcc,
      message: t.settingsConfirmDelMsg,
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
        <h1 className="text-[32px] font-semibold text-[#F5F5F7] tracking-tight">{t.settingsTitle}</h1>
        <p className="text-[17px] text-[#86868B] mt-1">{t.settingsSubtitle}</p>
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
                <span className="inline-block mt-3 px-3 py-1 bg-[#FF9F0A]/10 text-[#FF9F0A] text-[11px] font-bold uppercase rounded-full">{t.settingsNewImg}</span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#86868B] ml-1 uppercase tracking-wider">{t.settingsYourName}</label>
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
                {saving ? t.settingsUpdating : t.settingsSave}
              </button>
            </div>
          </form>
        </section>

<<<<<<< HEAD
        {/* Usage Stats */}
        {usageStats && (
          <section className="bg-[#1C1C1E] border border-white/[0.04] rounded-[28px] overflow-hidden shadow-sm p-8">
            <div className="flex items-center gap-2 mb-6">
              <Timer size={20} className="text-[#30D158]" />
              <h2 className="text-[17px] font-semibold text-[#F5F5F7]">Sua Jornada</h2>
            </div>

            {/* Streak */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-[#2C2C2E] rounded-[20px] border border-white/4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0">
                <Flame size={24} className="text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">Sequência Atual</p>
                <p className="text-[22px] font-bold text-[#F5F5F7] leading-tight">
                  {usageStats.currentStreak} {usageStats.currentStreak === 1 ? 'dia' : 'dias'}
                  {usageStats.currentStreak >= 7 && <span className="ml-2 text-[13px] text-orange-400">🔥</span>}
                </p>
                <p className="text-[12px] text-[#86868B]">
                  Maior sequência: <span className="text-[#F5F5F7] font-medium">{usageStats.longestStreak} {usageStats.longestStreak === 1 ? 'dia' : 'dias'}</span>
                </p>
              </div>
              {usageStats.currentStreak > 0 && (
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(usageStats.currentStreak, 7) }).map((_, i) => (
                    <div key={i} className="w-2 h-8 rounded-full bg-orange-400/80" style={{ opacity: 0.4 + (i / Math.min(usageStats.currentStreak, 7)) * 0.6 }} />
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tempo total */}
              <div className="p-5 bg-[#2C2C2E] rounded-[20px] border border-white/[0.04]">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-[#0A84FF]" />
                  <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">Tempo Total</span>
                </div>
                <p className="text-[24px] font-bold text-[#F5F5F7] tracking-tight">
                  {Math.floor(usageStats.totalSeconds / 3600)}h {Math.floor((usageStats.totalSeconds % 3600) / 60)}min
                </p>
                <p className="text-[12px] text-[#86868B] mt-1">investidos na plataforma</p>
              </div>

              {/* Idade da conta */}
              <div className="p-5 bg-[#2C2C2E] rounded-[20px] border border-white/[0.04]">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={16} className="text-[#FF9F0A]" />
                  <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">Conta criada</span>
                </div>
                <p className="text-[24px] font-bold text-[#F5F5F7] tracking-tight">
                  {usageStats.accountAgeDays} {usageStats.accountAgeDays === 1 ? 'dia' : 'dias'}
                </p>
                <p className="text-[12px] text-[#86868B] mt-1">
                  desde {usageStats.createdAt ? new Date(usageStats.createdAt).toLocaleDateString('pt-BR') : '—'}
                </p>
              </div>

              {/* Maior sessão */}
              <div className="p-5 bg-[#2C2C2E] rounded-[20px] border border-white/[0.04]">
                <div className="flex items-center gap-2 mb-3">
                  <Timer size={16} className="text-[#BF5AF2]" />
                  <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">Maior sessão</span>
                </div>
                <p className="text-[24px] font-bold text-[#F5F5F7] tracking-tight">
                  {usageStats.longestSessionSeconds >= 3600
                    ? `${Math.floor(usageStats.longestSessionSeconds / 3600)}h ${Math.floor((usageStats.longestSessionSeconds % 3600) / 60)}min`
                    : `${Math.floor(usageStats.longestSessionSeconds / 60)}min`}
                </p>
                <p className="text-[12px] text-[#86868B] mt-1">de foco contínuo</p>
              </div>
            </div>
          </section>
        )}
=======
        {/* Language Section */}
        <section className="bg-[#1C1C1E] border border-white/[0.04] rounded-[28px] overflow-hidden shadow-sm p-8">
          <h2 className="text-[17px] font-semibold text-[#F5F5F7] mb-4">{t.settingsLang}</h2>
          <div className="flex p-1 bg-[#2C2C2E] rounded-[16px] border border-white/[0.04] relative max-w-xs">
            {['pt', 'en'].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`relative flex-1 py-2.5 rounded-[12px] text-[13px] font-medium transition-colors z-10 outline-none cursor-pointer ${lang === l ? 'text-[#F5F5F7]' : 'text-[#86868B] hover:text-[#F5F5F7]'}`}
              >
                {lang === l && (
                  <motion.div layoutId="activeLang" className="absolute inset-0 bg-[#3A3A3C] rounded-[12px] shadow-sm -z-10" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
                )}
                {l === 'pt' ? 'Português' : 'English'}
              </button>
            ))}
          </div>
        </section>
>>>>>>> be25828 ([FIX] Adicionar ponto de entrada index.js para o deploy do Render.)

        {/* Danger Zone */}
        <section className="bg-[#1C1C1E] border border-white/[0.04] rounded-[28px] overflow-hidden shadow-sm p-8">
          <div className="flex items-center gap-2 mb-6">
            <ShieldAlert size={20} className="text-[#FF453A]" />
            <h2 className="text-[17px] font-semibold text-[#F5F5F7]">{t.settingsDangerZone}</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-[#FF453A]/5 border border-[#FF453A]/10 rounded-[20px]">
            <div>
              <p className="text-[15px] font-medium text-[#F5F5F7]">{t.settingsDelAccount}</p>
              <p className="text-[13px] text-[#86868B] mt-0.5">{t.settingsDelWarning}</p>
            </div>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF453A] text-white text-[13px] font-bold hover:bg-[#FF3B30] transition-colors whitespace-nowrap"
            >
              <Trash2 size={16} /> {t.settingsDelBtn}
            </button>
          </div>
        </section>

        <div className="pt-4 flex justify-center">
          <button
            onClick={() => {
              confirm({
                title: t.settingsConfirmSignOut,
                message: t.settingsConfirmSignOutMsg,
                onConfirm: () => { logout(); navigate('/'); }
              });
            }}
            className="flex items-center gap-2 text-[#86868B] hover:text-[#F5F5F7] font-medium transition-colors p-2"
          >
            <LogOut size={18} /> {t.settingsSignOutText}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
