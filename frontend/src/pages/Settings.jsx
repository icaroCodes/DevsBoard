import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, User, Camera, Mail, ShieldAlert, Trash2,
  Clock, Calendar, Timer, Flame, Globe, Palette,
  Check, ChevronRight, Sparkles, Image, Upload, X, Film,
  Music, Play, Pause
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
  const [wallpaperPreview, setWallpaperPreview] = useState(null);
  const [wallpaperBase64, setWallpaperBase64] = useState(null);
  const [wallpaperOpacity, setWallpaperOpacity] = useState(15);
  const [wallpaperType, setWallpaperType] = useState('image'); 
  const [savingWallpaper, setSavingWallpaper] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBase64, setAudioBase64] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioFileName, setAudioFileName] = useState('');
  const [audioName, setAudioName] = useState('');
  const [audioArtist, setAudioArtist] = useState('');
  const [audioCoverUrl, setAudioCoverUrl] = useState(null);
  const [audioCoverBase64, setAudioCoverBase64] = useState(null);
  const [savingAudio, setSavingAudio] = useState(false);
  const [audioPreviewPlaying, setAudioPreviewPlaying] = useState(false);
  const audioPreviewRef = useRef(null);

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
      api('/sessions/stats').catch(() => ({})), 
    ])
      .then(([settingsData, statsData]) => {
        setForm({ name: settingsData.name || '' });
        setAvatarUrl(settingsData.avatar_url || null);
        setWallpaperPreview(settingsData.wallpaper_url || null);
        setWallpaperOpacity(settingsData.wallpaper_opacity ?? 15);
        setWallpaperType(settingsData.wallpaper_type || 'image');
        setAudioUrl(settingsData.audio_url || null);
        setAudioEnabled(settingsData.audio_enabled ?? true);
        setAudioName(settingsData.audio_name || '');
        setAudioArtist(settingsData.audio_artist || '');
        setAudioCoverUrl(settingsData.audio_cover_url || null);
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

  if (loading) return <LoadingSkeleton variant="settings" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-8 md:py-12"
    >
      {}
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

        {}
        <div className="lg:col-span-8 space-y-8">

          {}
          <section className="glass-target relative bg-[var(--db-surface)] border border-[var(--db-border)] rounded-[32px] p-8 shadow-xl">
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

          {}
          <section className="glass-target relative bg-[var(--db-surface)] border border-[var(--db-border)] rounded-[32px] p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#8E9C78]/10">
                  <Palette size={20} className="text-[#8E9C78]" />
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
                    className={`relative p-5 rounded-[24px] text-left transition-all border-2 group overflow-hidden ${isActive
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

          {}
          <section className="glass-target relative bg-[var(--db-surface)] border border-[var(--db-border)] rounded-[32px] p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#FF9F0A]/10">
                  <Image size={20} className="text-[#FF9F0A]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[var(--db-text)]">Wallpaper</h2>
                  <p className="text-[13px] text-[var(--db-text-3)]">Escolha uma imagem ou vídeo de fundo para todas as páginas</p>
                </div>
              </div>
              {(wallpaperPreview || wallpaperBase64) && (
                <button
                  onClick={async () => {
                    setSavingWallpaper(true);
                    try {
                      await api('/settings', {
                        method: 'PUT',
                        body: JSON.stringify({ name: form.name || user?.name || 'Dev', wallpaper_url: null, wallpaper_type: 'image' }),
                      });
                      setWallpaperPreview(null);
                      setWallpaperBase64(null);
                      setWallpaperType('image');
                      await refreshUser();
                      success('Wallpaper removido!');
                    } catch (err) {
                      error(err.message);
                    } finally {
                      setSavingWallpaper(false);
                    }
                  }}
                  disabled={savingWallpaper}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[var(--db-red)] bg-[var(--db-red)]/5 hover:bg-[var(--db-red)]/10 border border-[var(--db-red)]/10 text-[12px] font-bold transition-all"
                >
                  <Trash2 size={14} /> Remover
                </button>
              )}
            </div>

            {}
            {wallpaperPreview || wallpaperBase64 ? (
              <div className="space-y-6">
                {}
                <div className="relative rounded-[24px] overflow-hidden border border-[var(--db-border)] bg-black aspect-video group">
                  {wallpaperType === 'video' ? (
                    <video
                      src={wallpaperBase64 || wallpaperPreview}
                      className="w-full h-full object-cover transition-opacity"
                      style={{ opacity: wallpaperOpacity / 100 }}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={wallpaperBase64 || wallpaperPreview}
                      alt="Wallpaper preview"
                      className="w-full h-full object-cover transition-opacity"
                      style={{ opacity: wallpaperOpacity / 100 }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {}
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 text-white/80 text-[11px] font-bold uppercase tracking-wider">
                    {wallpaperType === 'video' ? <><Film size={12} /> Vídeo</> : <><Image size={12} /> Imagem</>}
                  </div>
                  <button
                    onClick={() => document.getElementById('wallpaper-input').click()}
                    className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[12px] font-bold opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20"
                  >
                    <Camera size={14} /> Trocar
                  </button>
                </div>

                {}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-bold text-[var(--db-text-2)] uppercase tracking-wider">Intensidade</label>
                    <span className="text-[14px] font-bold text-[var(--db-text)] tabular-nums">{wallpaperOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="60"
                    value={wallpaperOpacity}
                    onChange={(e) => setWallpaperOpacity(parseInt(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[var(--db-accent)]"
                    style={{
                      background: `linear-gradient(to right, var(--db-accent) 0%, var(--db-accent) ${((wallpaperOpacity - 3) / 57) * 100}%, var(--db-border-2) ${((wallpaperOpacity - 3) / 57) * 100}%, var(--db-border-2) 100%)`
                    }}
                  />
                  <p className="text-[11px] text-[var(--db-text-3)]">Quanto menor o valor, mais sutil o efeito. Recomendado: 10-25%</p>
                </div>

                {}
                <button
                  onClick={async () => {
                    setSavingWallpaper(true);
                    try {
                      const payload = { name: form.name || user?.name || 'Dev', wallpaper_opacity: wallpaperOpacity, wallpaper_type: wallpaperType };
                      if (wallpaperBase64) payload.wallpaper_base64 = wallpaperBase64;
                      await api('/settings', {
                        method: 'PUT',
                        body: JSON.stringify(payload),
                      });
                      setWallpaperBase64(null);
                      await refreshUser();
                      success('Wallpaper atualizado!');
                    } catch (err) {
                      error(err.message);
                    } finally {
                      setSavingWallpaper(false);
                    }
                  }}
                  disabled={savingWallpaper}
                  className="w-full py-4 rounded-2xl bg-[var(--db-accent)] text-[var(--db-bg)] font-bold text-sm hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 shadow-lg shadow-[var(--db-accent)]/10 flex items-center justify-center gap-2"
                >
                  {savingWallpaper ? (
                    <div className="w-4 h-4 border-2 border-[var(--db-bg)]/30 border-t-[var(--db-bg)] rounded-full animate-spin" />
                  ) : (
                    <Check size={18} />
                  )}
                  {savingWallpaper ? 'Salvando...' : 'Salvar Wallpaper'}
                </button>
              </div>
            ) : (
                            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files[0];
                  const isImage = file && file.type.startsWith('image/');
                  const isVideo = file && file.type.startsWith('video/');
                  if (isImage || isVideo) {
                    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
                    if (file.size > maxSize) return error(isVideo ? 'Vídeo muito grande (máx 50MB)' : 'Imagem muito grande (máx 5MB)');
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setWallpaperBase64(reader.result);
                      setWallpaperPreview(reader.result);
                      setWallpaperType(isVideo ? 'video' : 'image');
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                onClick={() => document.getElementById('wallpaper-input').click()}
                className={`flex flex-col items-center justify-center gap-4 py-16 rounded-[24px] border-2 border-dashed cursor-pointer transition-all ${dragOver
                    ? 'border-[var(--db-accent)] bg-[var(--db-accent)]/5'
                    : 'border-[var(--db-border-2)] hover:border-[var(--db-text-3)] bg-[var(--db-bg-secondary)] hover:bg-[var(--db-surface-2)]'
                  }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-[var(--db-surface-2)] flex items-center justify-center">
                  <Upload size={28} className="text-[var(--db-text-3)]" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-semibold text-[var(--db-text-2)]">Arraste uma imagem ou vídeo, ou clique para escolher</p>
                  <p className="text-[12px] text-[var(--db-text-3)] mt-1">JPG, PNG, WebP, MP4 ou WebM • Imagem até 5MB • Vídeo até 50MB</p>
                </div>
              </div>
            )}

            <input
              id="wallpaper-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const isVideo = file.type.startsWith('video/');
                const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
                if (file.size > maxSize) return error(isVideo ? 'Vídeo muito grande (máx 50MB)' : 'Imagem muito grande (máx 5MB)');
                const reader = new FileReader();
                reader.onloadend = () => {
                  setWallpaperBase64(reader.result);
                  setWallpaperPreview(reader.result);
                  setWallpaperType(isVideo ? 'video' : 'image');
                };
                reader.readAsDataURL(file);
                e.target.value = '';
              }}
            />
          </section>

          {/* Áudio de fundo — 1 música em loop */}
          <section className="glass-target relative bg-[var(--db-surface)] border border-[var(--db-border)] rounded-[32px] p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#8E9C78]/10">
                  <Music size={20} className="text-[#8E9C78]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[var(--db-text)]">Áudio de fundo</h2>
                  <p className="text-[13px] text-[var(--db-text-3)]">Uma música em loop, com player minimalista</p>
                </div>
              </div>
              {(audioUrl && !audioBase64) && (
                <button
                  onClick={async () => {
                    setSavingAudio(true);
                    try {
                      await api('/settings', { method: 'PUT', body: JSON.stringify({ audio_url: null }) });
                      setAudioUrl(null); setAudioBase64(null); setAudioFileName('');
                      setAudioName(''); setAudioArtist(''); setAudioCoverUrl(null); setAudioCoverBase64(null);
                      await refreshUser();
                      success('Áudio removido!');
                    } catch (err) { error(err.message); }
                    finally { setSavingAudio(false); }
                  }}
                  disabled={savingAudio}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[var(--db-red)] bg-[var(--db-red)]/5 hover:bg-[var(--db-red)]/10 border border-[var(--db-red)]/10 text-[12px] font-bold transition-all"
                >
                  <Trash2 size={14} /> Remover
                </button>
              )}
            </div>

            {audioUrl || audioBase64 ? (
              <div className="space-y-5">

                {/* ── Capa da música ── */}
                <div className="flex flex-col items-center gap-3">
                  {/* Quadrado da capa */}
                  <div
                    className="relative w-full rounded-[20px] overflow-hidden cursor-pointer group"
                    style={{ aspectRatio: '1/1', maxHeight: 200 }}
                    onClick={() => document.getElementById('audio-cover-input').click()}
                  >
                    {audioCoverBase64 || audioCoverUrl ? (
                      <img
                        src={audioCoverBase64 || audioCoverUrl}
                        alt="capa"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex flex-col items-center justify-center gap-2"
                        style={{ background: 'rgba(142,156,120,0.06)', border: '2px dashed rgba(142,156,120,0.25)' }}
                      >
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(142,156,120,0.12)' }}>
                          <Camera size={22} className="text-[#8E9C78]" />
                        </div>
                        <p className="text-[12px] font-semibold text-[var(--db-text-3)]">Adicionar capa</p>
                        <p className="text-[11px] text-[var(--db-text-3)] opacity-60">JPG, PNG ou WebP • até 3MB</p>
                      </div>
                    )}
                    {}
                    {(audioCoverBase64 || audioCoverUrl) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
                        <Camera size={24} className="text-white" />
                        <p className="text-[12px] font-semibold text-white">Trocar foto</p>
                      </div>
                    )}
                  </div>

                  {}
                  <button
                    type="button"
                    onClick={() => document.getElementById('audio-cover-input').click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all hover:scale-[1.02] active:scale-95"
                    style={{
                      color: '#8E9C78',
                      background: 'rgba(142,156,120,0.1)',
                      border: '1px solid rgba(142,156,120,0.2)',
                    }}
                  >
                    <Upload size={13} />
                    {audioCoverBase64 || audioCoverUrl ? 'Trocar foto da capa' : 'Adicionar foto da capa'}
                  </button>
                </div>

                {}
                <div className="flex gap-4 p-4 rounded-[20px] bg-[var(--db-bg-secondary)] border border-[var(--db-border)]">
                  {}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                    {audioCoverBase64 || audioCoverUrl ? (
                      <img src={audioCoverBase64 || audioCoverUrl} alt="capa" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(142,156,120,0.08)' }}>
                        <Music size={18} className="text-[#8E9C78]/40" />
                      </div>
                    )}
                  </div>

                  {}
                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-[var(--db-text)] truncate">{audioName || audioFileName || 'Sem título'}</p>
                      <p className="text-[11px] text-[var(--db-text-3)] truncate mt-0.5">{audioArtist || 'Artista desconhecido'}</p>
                    </div>
                    <button
                      onClick={() => {
                        const el = audioPreviewRef.current;
                        if (!el) return;
                        if (el.paused) el.play().then(() => setAudioPreviewPlaying(true)).catch(() => { });
                        else { el.pause(); setAudioPreviewPlaying(false); }
                      }}
                      className="self-start w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 hover:scale-105"
                      style={{ background: audioPreviewPlaying ? 'linear-gradient(135deg,#8E9C78,#6B7A5E)' : 'rgba(142,156,120,0.15)' }}
                    >
                      {audioPreviewPlaying
                        ? <Pause size={13} className="text-white" fill="currentColor" />
                        : <Play size={13} className="text-[#8E9C78] ml-0.5" fill="currentColor" />}
                    </button>
                  </div>
                  <audio ref={audioPreviewRef} src={audioBase64 || audioUrl}
                    onEnded={() => setAudioPreviewPlaying(false)}
                    onPause={() => setAudioPreviewPlaying(false)}
                    onPlay={() => setAudioPreviewPlaying(true)} />
                </div>

                {}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--db-text-3)] uppercase tracking-wider mb-1.5">Nome da música</label>
                    <input
                      type="text"
                      value={audioName}
                      onChange={(e) => setAudioName(e.target.value)}
                      placeholder="Ex: Ghousting"
                      className="w-full px-3 py-2.5 rounded-xl text-[13px] text-[var(--db-text)] placeholder-[var(--db-text-3)] outline-none transition-all focus:ring-2 focus:ring-[#8E9C78]/30"
                      style={{ background: 'var(--db-bg-secondary)', border: '1px solid var(--db-border)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--db-text-3)] uppercase tracking-wider mb-1.5">Artista</label>
                    <input
                      type="text"
                      value={audioArtist}
                      onChange={(e) => setAudioArtist(e.target.value)}
                      placeholder="Ex: Azeakuma"
                      className="w-full px-3 py-2.5 rounded-xl text-[13px] text-[var(--db-text)] placeholder-[var(--db-text-3)] outline-none transition-all focus:ring-2 focus:ring-[#8E9C78]/30"
                      style={{ background: 'var(--db-bg-secondary)', border: '1px solid var(--db-border)' }}
                    />
                  </div>
                </div>

                {}
                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--db-bg-secondary)] border border-[var(--db-border)]">
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--db-text-2)]">Iniciar tocando automaticamente</p>
                    <p className="text-[11px] text-[var(--db-text-3)] mt-0.5">Browsers podem bloquear na primeira visita</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAudioEnabled(v => !v)}
                    className="relative w-12 h-7 rounded-full transition-colors shrink-0"
                    style={{ background: audioEnabled ? 'var(--db-accent)' : 'rgba(255,255,255,0.1)' }}
                  >
                    <span 
                      className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-300 ${audioEnabled ? 'translate-x-[20px]' : 'translate-x-0'}`} 
                    />
                  </button>
                </div>

                <button
                  onClick={async () => {
                    setSavingAudio(true);
                    try {
                      const payload = {
                        audio_enabled: audioEnabled,
                        audio_name: audioName,
                        audio_artist: audioArtist,
                      };
                      if (audioBase64) payload.audio_base64 = audioBase64;
                      if (audioCoverBase64) payload.audio_cover_base64 = audioCoverBase64;
                      await api('/settings', { method: 'PUT', body: JSON.stringify(payload) });
                      setAudioBase64(null);
                      setAudioCoverBase64(null);
                      await refreshUser();
                      success('Áudio salvo!');
                    } catch (err) { error(err.message); }
                    finally { setSavingAudio(false); }
                  }}
                  disabled={savingAudio}
                  className="w-full py-4 rounded-2xl bg-[var(--db-accent)] text-[var(--db-bg)] font-bold text-sm hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 shadow-lg shadow-[var(--db-accent)]/10 flex items-center justify-center gap-2"
                >
                  {savingAudio
                    ? <div className="w-4 h-4 border-2 border-[var(--db-bg)]/30 border-t-[var(--db-bg)] rounded-full animate-spin" />
                    : <Check size={18} />}
                  {savingAudio ? 'Salvando...' : 'Salvar áudio'}
                </button>
              </div>
            ) : (
              <div
                onClick={() => document.getElementById('audio-input').click()}
                className="flex flex-col items-center justify-center gap-4 py-16 rounded-[24px] border-2 border-dashed cursor-pointer transition-all border-[var(--db-border-2)] hover:border-[#8E9C78]/40 bg-[var(--db-bg-secondary)] hover:bg-[var(--db-surface-2)]"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(191,90,242,0.08)' }}>
                  <Music size={28} className="text-[#8E9C78]/60" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-semibold text-[var(--db-text-2)]">Clique para escolher um áudio</p>
                  <p className="text-[12px] text-[var(--db-text-3)] mt-1">MP3, OGG, WAV, M4A • até 10MB</p>
                </div>
              </div>
            )}

            {}
            <input id="audio-input" type="file"
              accept="audio/mpeg,audio/mp3,audio/ogg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,audio/aac"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!file.type.startsWith('audio/')) return error('Arquivo precisa ser de áudio');
                if (file.size > 10 * 1024 * 1024) return error('Áudio muito grande (máx 10MB)');
                const reader = new FileReader();
                reader.onloadend = () => {
                  setAudioBase64(reader.result);
                  setAudioUrl(reader.result);
                  const base = file.name.replace(/\.[^/.]+$/, '');
                  setAudioFileName(file.name);
                  if (!audioName) setAudioName(base);
                };
                reader.readAsDataURL(file);
                e.target.value = '';
              }}
            />

            {/* Input capa */}
            <input id="audio-cover-input" type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!file.type.startsWith('image/')) return error('Capa precisa ser uma imagem');
                if (file.size > 3 * 1024 * 1024) return error('Imagem muito grande (máx 3MB)');
                const reader = new FileReader();
                reader.onloadend = () => {
                  setAudioCoverBase64(reader.result);
                  setAudioCoverUrl(reader.result);
                };
                reader.readAsDataURL(file);
                e.target.value = '';
              }}
            />
          </section>

          {/* Idioma */}
          <section className="glass-target relative bg-[var(--db-surface)] border border-[var(--db-border)] rounded-[32px] p-8 shadow-xl">
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
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all border-2 ${lang === code
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

        {}
        <div className="lg:col-span-4 space-y-8">

          {}
          {usageStats && (
            <div className="glass-target bg-[var(--db-surface)] border border-[var(--db-border)] rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--db-accent)]/20 to-[var(--db-accent-hover)]/10 z-0 pointer-events-none" />
              <div className="relative z-10 text-[var(--db-text)]">
                <div className="flex items-center gap-2 mb-6">
                  <Flame size={20} />
                  <span className="font-bold text-[12px] uppercase tracking-widest opacity-80 text-[var(--db-accent)]">Impacto Total</span>
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
            </div>
          )}

          {}
          <div className="glass-target relative bg-[var(--db-surface)] border border-[var(--db-border)] rounded-[32px] p-8 shadow-xl">
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

    </motion.div>
  );
}
