import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, User, Camera, Mail, ShieldAlert, Trash2, 
  Clock, Calendar, Timer, Flame, Globe, Palette, 
  Check, ChevronRight, Sparkles
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmModalContext';
import { useTranslation } from '../utils/translations';
import { useTheme, THEMES } from '../contexts/ThemeContext';
import LoadingSkeleton from '../components/LoadingSkeleton';

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
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api('/settings'),
      api('/sessions/stats').catch(() => ({})), // Fallback if stats fail
    ])
      .then(([settingsData, statsData]) => {
        setForm({ name: settingsData.name || '' });
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
      .catch((err) => {
        console.error('Settings load error:', err);
        error("Erro ao carregar configurações. Verifique o banco de dados.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return error(t.settingsImgMax);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarBase64(reader.result);
      setAvatarUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, avatar_base64: avatarBase64 };
      if (avatarUrl && !avatarUrl.startsWith('data:')) payload.avatar_url = avatarUrl;

      await api('/settings', { method: 'PUT', body: JSON.stringify(payload) });
      const updatedUser = await refreshUser();
      if (updatedUser?.name) localStorage.setItem('_userName', updatedUser.name);
      success(t.settingsProfileUpdated);
      setAvatarBase64(null);
    } catch (err) {
      error(`${t.settingsUpdateError} ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    confirm({
      title: t.settingsConfirmDelAcc || 'Deletar conta?',
      message: t.settingsConfirmDelMsg || 'Esta ação é permanente e todos os seus dados serão apagados.',
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

  if (loading) return <LoadingSkeleton fullScreen={false} />;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-8 md:py-12"
    >
      {/* Header Cinematográfico */}
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-[var(--db-accent-muted)]">
            <User size={20} className="text-[var(--db-accent)]" />
          </div>
          <span className="text-[13px] font-bold uppercase tracking-[0.2em] text-[var(--db-accent)]">Preferências</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--db-text)] tracking-tight">
          Configurações
        </h1>
        <p className="text-[var(--db-text-2)] text-lg mt-3 max-w-xl">
          Personalize sua experiência e gerencie sua identidade digital no DevsBoard.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Coluna Esquerda: Perfil e Aparência */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Sessão Perfil */}
          <section className="bg-[var(--db-surface)] border border-[var(--db-border)] rounded-[32px] p-8 shadow-xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="relative group">
                <div 
                  className="w-24 h-24 rounded-3xl overflow-hidden bg-[var(--db-surface-2)] border-2 border-[var(--db-border)] group-hover:border-[var(--db-accent)] transition-all cursor-pointer shadow-inner"
                  onClick={() => document.getElementById('avatar-input').click()}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={32} className="text-[var(--db-text-3)]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
                <input id="avatar-input" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--db-text)]">{form.name || "Seu Nome"}</h2>
                <p className="text-[var(--db-text-3)] flex items-center gap-1.5 mt-0.5">
                  <Mail size={14} /> {user?.email}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[var(--db-text-2)] ml-1 uppercase tracking-wider">
                  Nome de Exibição
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Como devemos chamar você?"
                  className="w-full bg-[var(--db-bg-secondary)] border border-[var(--db-border-2)] rounded-2xl px-6 py-4 text-[var(--db-text)] focus:outline-none focus:ring-2 focus:ring-[var(--db-accent)]/20 focus:border-[var(--db-accent)] transition-all"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-[12px] text-[var(--db-text-3)] max-w-[60%]">
                  Suas alterações são sincronizadas em todos os seus dispositivos instantaneamente.
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[var(--db-accent)] text-[var(--db-bg)] px-8 py-4 rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-[var(--db-accent)]/10 flex items-center gap-2"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-[var(--db-bg)]/30 border-t-[var(--db-bg)] rounded-full animate-spin" /> : <Check size={18} />}
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </section>

          {/* Sessão Aparência (Temas) */}
          <section className="bg-[var(--db-surface)] border border-[var(--db-border)] rounded-[32px] p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#BF5AF2]/10">
                  <Palette size={20} className="text-[#BF5AF2]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[var(--db-text)]">Aparência</h2>
                  <p className="text-[13px] text-[var(--db-text-3)]">Escolha a alma do seu dashboard</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(THEMES).map(([key, def]) => {
                const isActive = theme === key;
                return (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`relative p-5 rounded-[24px] text-left transition-all border-2 group overflow-hidden ${
                      isActive 
                        ? 'border-[var(--db-blue)] shadow-lg shadow-[var(--db-blue)]/10' 
                        : 'border-transparent hover:border-[var(--db-border-2)] bg-[var(--db-bg-secondary)]'
                    }`}
                  >
                    <div className="flex gap-1.5 mb-4 items-center">
                      {def.preview.map((color, i) => (
                        <div key={i} className="w-4 h-4 rounded-full border border-black/5" style={{ background: color }} />
                      ))}
                      {isActive && <Sparkles size={12} className="ml-auto text-[var(--db-blue)] animate-pulse" />}
                    </div>
                    <span className="text-[13px] font-bold text-[var(--db-text)]">{def.label}</span>
                    
                    {isActive && (
                      <motion.div 
                        layoutId="active-theme-glow"
                        className="absolute inset-0 bg-[var(--db-blue)]/5 pointer-events-none"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Idioma */}
          <section className="bg-[var(--db-surface)] border border-[var(--db-border)] rounded-[32px] p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-xl bg-[var(--db-blue)]/10">
                <Globe size={20} className="text-[var(--db-blue)]" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--db-text)]">Idioma</h2>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {[
                { code: 'pt', label: 'Português', flag: '🇧🇷' },
                { code: 'en', label: 'English', flag: '🇺🇸' }
              ].map(({ code, label, flag }) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all border-2 ${
                    lang === code 
                    ? 'bg-[var(--db-blue)] text-white border-[var(--db-blue)] shadow-md shadow-[var(--db-blue)]/20' 
                    : 'bg-[var(--db-bg-secondary)] text-[var(--db-text-2)] border-transparent hover:text-[var(--db-text)]'
                  }`}
                >
                  <span className="text-xl">{flag}</span>
                  {label}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Coluna Direita: Stats e Danger */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Estatísticas Rápidas */}
          {usageStats && (
            <div className="bg-gradient-to-br from-[var(--db-accent)] to-[var(--db-accent-hover)] rounded-[32px] p-8 text-[var(--db-bg)] shadow-2xl">
              <div className="flex items-center gap-2 mb-6">
                <Flame size={20} />
                <span className="font-bold text-[12px] uppercase tracking-widest opacity-80">Impacto Total</span>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-5xl font-black tracking-tighter">
                    {Math.floor(usageStats.totalSeconds / 3600)}h
                  </p>
                  <p className="text-sm font-bold opacity-70 mt-1 uppercase tracking-wider">Produtividade Acumulada</p>
                </div>

                <div className="pt-6 border-t border-[var(--db-bg)]/10 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xl font-bold">{usageStats.currentStreak}d</p>
                    <p className="text-[10px] uppercase font-bold opacity-60">Streak Atual</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">{usageStats.accountAgeDays}d</p>
                    <p className="text-[10px] uppercase font-bold opacity-60">Na plataforma</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="bg-[var(--db-surface)] border border-[var(--db-border)] rounded-[32px] p-8">
             <div className="flex items-center gap-2 mb-6 text-[var(--db-red)]">
                <ShieldAlert size={18} />
                <h3 className="font-bold text-sm uppercase tracking-wider">Zona Crítica</h3>
             </div>
             
             <div className="space-y-4">
                <button 
                  onClick={() => {
                    confirm({
                      title: "Sair do sistema?",
                      message: "Sua sessão será encerrada com segurança.",
                      onConfirm: () => { logout(); navigate('/'); }
                    });
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-[var(--db-bg-secondary)] hover:bg-[var(--db-surface-3)] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <LogOut size={18} className="text-[var(--db-text-3)]" />
                    <span className="text-sm font-bold text-[var(--db-text-2)]">Encerrar Sessão</span>
                  </div>
                  <ChevronRight size={16} className="text-[var(--db-text-3)] group-hover:translate-x-1 transition-transform" />
                </button>

                <button 
                  onClick={handleDelete}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-[var(--db-red)]/5 hover:bg-[var(--db-red)]/10 border border-[var(--db-red)]/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 size={18} className="text-[var(--db-red)]" />
                    <span className="text-sm font-bold text-[var(--db-red)]">Deletar Conta</span>
                  </div>
                  <ChevronRight size={16} className="text-[var(--db-red)]/40 group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
          </div>

        </div>
      </div>
      
      {/* Footer Branding */}
      <footer className="mt-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--db-surface-2)] border border-[var(--db-border)]">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[11px] font-bold text-[var(--db-text-3)] uppercase tracking-widest">
            DevsBoard System v2.0 • Online
          </span>
        </div>
      </footer>
    </motion.div>
  );
}
