import { useState, useEffect, useRef } from'react';
import { motion, AnimatePresence } from'framer-motion';
import { useNavigate } from'react-router-dom';
import {
 LogOut, User, Camera, Mail, ShieldAlert, Trash2,
 Clock, Calendar, Timer, Flame, Globe, Palette,
 Check, ChevronRight, Sparkles, Image, Upload, X, Film,
 Music, Play, Pause, Bell, Shield, Smartphone, ArrowLeft
} from'lucide-react';
import { api } from'../../lib/api';
import { useAuth } from'../../contexts/AuthContext';
import { useToast } from'../../contexts/ToastContext';
import { useConfirm } from'../../contexts/ConfirmModalContext';
import { useTranslation } from'../../utils/translations';
import { useTheme, THEMES } from'../../contexts/ThemeContext';
import LoadingSkeleton from'../../components/LoadingSkeleton';
import { processAvatar } from'../../lib/imageProcessing';

export default function SettingsMobile() {
 const [form, setForm] = useState({ name:'' });
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
 const [audioUrl, setAudioUrl] = useState(null);
 const [audioBase64, setAudioBase64] = useState(null);
 const [audioEnabled, setAudioEnabled] = useState(true);
 const [audioName, setAudioName] = useState('');
 const [audioArtist, setAudioArtist] = useState('');
 const [audioCoverUrl, setAudioCoverUrl] = useState(null);
 const [audioCoverBase64, setAudioCoverBase64] = useState(null);
 const [savingAudio, setSavingAudio] = useState(false);
 const [activeSection, setActiveSection] = useState('main'); // main, profile, appearance, audio, language

 const { user, logout, updateUser, refreshUser } = useAuth();
 const { success, error } = useToast();
 const { confirm } = useConfirm();
 const navigate = useNavigate();
 const { t, lang, setLang } = useTranslation();
 const { theme, setTheme } = useTheme();

 useEffect(() => {
 setLoading(true);
 api('/settings')
 .then((settingsData) => {
 setForm({ name: settingsData.name ||'' });
 setAvatarUrl(settingsData.avatar_url || null);
 setWallpaperPreview(settingsData.wallpaper_url || null);
 setWallpaperOpacity(settingsData.wallpaper_opacity ?? 15);
 setWallpaperType(settingsData.wallpaper_type ||'image');
 setAudioUrl(settingsData.audio_url || null);
 setAudioEnabled(settingsData.audio_enabled ?? true);
 setAudioName(settingsData.audio_name ||'');
 setAudioArtist(settingsData.audio_artist ||'');
 setAudioCoverUrl(settingsData.audio_cover_url || null);
 
 return api('/sessions/stats').catch(() => ({}));
 })
 .then((statsData) => {
 // We'll fetch stats from the first API call response which actually has them in DevsBoard
 // But the desktop code has a separate call too. I'll just use the first one's mapping
 })
 .catch((err) => {
 error("Erro ao carregar configurações.");
 })
 .finally(() => setLoading(false));
 }, []);

 const handleProfileUpdate = async (e) => {
 e.preventDefault();
 setSaving(true);
 try {
 const payload = { ...form, avatar_base64: avatarBase64 };
 await api('/settings', { method:'PUT', body: JSON.stringify(payload) });
 await refreshUser();
 success(t.settingsProfileUpdated);
 setAvatarBase64(null);
 setActiveSection('main');
 } catch (err) {
 error(err.message);
 } finally {
 setSaving(false);
 }
 };

 const handleDeleteAccount = () => {
 confirm({
 title:'Deletar conta?',
 message:'Esta ação é irreversível.',
 onConfirm: async () => {
 await api('/settings', { method:'DELETE' });
 logout();
 navigate('/');
 }
 });
 };

 if (loading) return <LoadingSkeleton variant="settings" />;

 const NavigationItem = ({ icon: Icon, label, sublabel, onClick, color ="var(--db-accent)" }) => (
 <button
 onClick={onClick}
 className="w-full flex items-center gap-4 p-5 bg-[#202020] rounded-[28px] border border-white/[0.03] active:scale-[0.98] transition-all"
 >
 <div className="w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0" style={{ background: `${color}15`, color }}>
 <Icon size={20} />
 </div>
 <div className="flex-1 text-left">
 <p className="text-[15px] font-bold text-white">{label}</p>
 {sublabel && <p className="text-[12px] text-white/40">{sublabel}</p>}
 </div>
 <ChevronRight size={18} className="text-white/20" />
 </button>
 );

 return (
 <div className="px-5 py-8 pb-32 overflow-hidden">
 <AnimatePresence mode="wait">
 {activeSection ==='main' ? (
 <motion.div
 key="main"
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 className="space-y-8"
 >
 {/* Header / Profile Summary */}
 <div className="flex flex-col items-center text-center">
 <div className="relative mb-4">
 <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-[#202020] shadow-2xl">
 {avatarUrl ? (
 <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full bg-[#202020] flex items-center justify-center">
 <User size={40} className="text-white/20" />
 </div>
 )}
 </div>
 <button 
 onClick={() => setActiveSection('profile')}
 className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-[var(--db-accent)] text-white flex items-center justify-center border-4 border-[#121212]"
 >
 <Camera size={18} />
 </button>
 </div>
 <h1 className="text-[24px] font-bold text-white">{user?.name}</h1>
 <p className="text-[13px] text-white/40">{user?.email}</p>
 </div>

 {/* Menu Sections */}
 <div className="space-y-3">
 <p className="text-[11px] font-semibold text-white/20 ml-2 mb-1">Preferências</p>
 <NavigationItem 
 icon={User} 
 label="Perfil" 
 sublabel="Nome e foto de perfil" 
 onClick={() => setActiveSection('profile')} 
 />
 <NavigationItem 
 icon={Palette} 
 label="Aparência" 
 sublabel="Temas e personalização" 
 onClick={() => setActiveSection('appearance')} 
 color="#8E9C78"
 />
 <NavigationItem 
 icon={Music} 
 label="Áudio" 
 sublabel="Música de fundo e player" 
 onClick={() => setActiveSection('audio')} 
 color="#BF5AF2"
 />
 <NavigationItem 
 icon={Globe} 
 label="Idioma" 
 sublabel={lang ==='pt' ?'Português' :'English'} 
 onClick={() => setActiveSection('language')} 
 color="#007AFF"
 />
 </div>

 <div className="space-y-3">
 <p className="text-[11px] font-semibold text-white/20 ml-2 mb-1">Sistema</p>
 <button
 onClick={() => {
 confirm({
 title:"Sair?",
 message:"Deseja encerrar sua sessão?",
 onConfirm: () => { logout(); navigate('/'); }
 });
 }}
 className="w-full flex items-center gap-4 p-5 bg-[#202020] rounded-[28px] border border-white/[0.03] active:scale-[0.98] transition-all"
 >
 <div className="w-12 h-12 rounded-[18px] bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
 <LogOut size={20} />
 </div>
 <div className="flex-1 text-left">
 <p className="text-[15px] font-bold text-white">Sair da Conta</p>
 </div>
 </button>
 <button
 onClick={handleDeleteAccount}
 className="w-full text-center py-4 text-[13px] font-bold text-red-500/40"
 >
 Deletar Conta Permanentemente
 </button>
 </div>
 </motion.div>
 ) : activeSection ==='profile' ? (
 <motion.div
 key="profile"
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 20 }}
 >
 <button onClick={() => setActiveSection('main')} className="flex items-center gap-2 text-white/40 mb-8 font-bold">
 <ArrowLeft size={18} /> Voltar
 </button>
 <h2 className="text-[28px] font-bold text-white mb-6">Editar Perfil</h2>
 
 <div className="flex flex-col items-center mb-8">
 <div 
 className="w-32 h-32 rounded-[40px] overflow-hidden bg-[#202020] border-2 border-white/5 relative group mb-4"
 onClick={() => document.getElementById('avatar-input').click()}
 >
 {avatarUrl ? (
 <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full flex items-center justify-center">
 <User size={40} className="text-white/10" />
 </div>
 )}
 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-active:opacity-100 transition-all">
 <Camera size={24} className="text-white" />
 </div>
 </div>
 <input id="avatar-input" type="file" accept="image/*" className="hidden" onChange={async (e) => {
 const file = e.target.files?.[0];
 if (!file) return;
 // Cap pre-conversion: iPhone HEIC photos are large but
 // we always re-encode to compressed JPEG before sending.
 if (file.size > 12 * 1024 * 1024) {
 error('Imagem muito grande (máx 12MB).');
 e.target.value ='';
 return;
 }
 try {
 const dataUrl = await processAvatar(file);
 setAvatarBase64(dataUrl);
 setAvatarUrl(dataUrl);
 } catch (err) {
 error(
 err.message ==='unsupported_image_format'
 ?'Formato de imagem não suportado neste navegador. Tente JPG ou PNG.'
 :'Não foi possível processar a imagem.'
 );
 } finally {
 e.target.value ='';
 }
 }} />
 </div>

 <div className="space-y-6">
 <div className="space-y-2">
 <label className="text-[11px] font-semibold tracking-normal text-white/40 ml-2">Nome de Exibição</label>
 <input
 type="text"
 value={form.name}
 onChange={(e) => setForm({ ...form, name: e.target.value })}
 className="w-full bg-[#202020] border border-white/5 rounded-[24px] px-6 py-5 text-white font-bold focus:outline-none focus:border-[var(--db-accent)] transition-all"
 placeholder="Seu nome"
 />
 </div>
 <button
 onClick={handleProfileUpdate}
 disabled={saving}
 className="w-full bg-[var(--db-accent)] text-black py-5 rounded-[24px] font-semibold text-[15px] shadow-lg shadow-[var(--db-accent)]/10"
 >
 {saving ?"Salvando..." :"Salvar Alterações"}
 </button>
 </div>
 </motion.div>
 ) : activeSection ==='appearance' ? (
 <motion.div
 key="appearance"
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 20 }}
 >
 <button onClick={() => setActiveSection('main')} className="flex items-center gap-2 text-white/40 mb-8 font-bold">
 <ArrowLeft size={18} /> Voltar
 </button>
 <h2 className="text-[28px] font-bold text-white mb-6">Aparência</h2>

 <p className="text-[11px] font-semibold tracking-normal text-white/40 ml-2 mb-4">Tema do Sistema</p>
 <div className="grid grid-cols-2 gap-3 mb-8">
 {Object.entries(THEMES).map(([key, def]) => (
 <button
 key={key}
 onClick={() => setTheme(key)}
 className={`p-4 rounded-[24px] border-2 transition-all text-left ${
 theme === key ?'border-[var(--db-blue)] bg-[#202020]' :'border-transparent bg-[#202020]/40'
 }`}
 >
 <div className="flex gap-1.5 mb-3">
 {def.preview.map((c, i) => (
 <div key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />
 ))}
 </div>
 <span className="text-[13px] font-bold text-white">{def.label}</span>
 </button>
 ))}
 </div>

 <p className="text-[11px] font-semibold tracking-normal text-white/40 ml-2 mb-4">Papel de Parede</p>
 <div className="bg-[#202020] p-6 rounded-[32px] border border-white/5 space-y-6">
 <div className="aspect-video rounded-2xl bg-black overflow-hidden relative border border-white/10">
 {wallpaperPreview && (
 wallpaperType ==='video' ? (
 <video src={wallpaperPreview} className="w-full h-full object-cover" style={{ opacity: wallpaperOpacity/100 }} autoPlay loop muted playsInline />
 ) : (
 <img src={wallpaperPreview} className="w-full h-full object-cover" style={{ opacity: wallpaperOpacity/100 }} alt="" />
 )
 )}
 <button 
 onClick={() => document.getElementById('wall-input-mob').click()}
 className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] opacity-0 active:opacity-100 transition-all"
 >
 <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/20 text-white text-[12px] font-bold">
 Trocar Fundo
 </div>
 </button>
 </div>
 <input id="wall-input-mob" type="file" className="hidden" onChange={(e) => {
 const file = e.target.files?.[0];
 if (file) {
 const reader = new FileReader();
 reader.onloadend = () => { setWallpaperBase64(reader.result); setWallpaperPreview(reader.result); setWallpaperType(file.type.startsWith('video/') ?'video' :'image'); };
 reader.readAsDataURL(file);
 }
 }} />

 <div className="space-y-3">
 <div className="flex justify-between items-center px-1">
 <span className="text-[11px] font-semibold text-white/40">Opacidade</span>
 <span className="text-[14px] font-bold text-white">{wallpaperOpacity}%</span>
 </div>
 <input 
 type="range" min="3" max="60" value={wallpaperOpacity} 
 onChange={(e) => setWallpaperOpacity(parseInt(e.target.value))}
 className="w-full accent-[var(--db-accent)]"
 />
 </div>

 <button
 onClick={async () => {
 setSavingWallpaper(true);
 try {
 const payload = { wallpaper_opacity: wallpaperOpacity, wallpaper_type: wallpaperType };
 if (wallpaperBase64) payload.wallpaper_base64 = wallpaperBase64;
 await api('/settings', { method:'PUT', body: JSON.stringify(payload) });
 success('Wallpaper salvo!');
 } catch(e) { error(e.message); }
 finally { setSavingWallpaper(false); }
 }}
 className="w-full bg-white text-black py-4 rounded-[20px] font-bold text-[14px]"
 >
 {savingWallpaper ?"Sincronizando..." :"Salvar Wallpaper"}
 </button>
 </div>
 </motion.div>
 ) : activeSection ==='language' ? (
 <motion.div
 key="language"
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 20 }}
 >
 <button onClick={() => setActiveSection('main')} className="flex items-center gap-2 text-white/40 mb-8 font-bold">
 <ArrowLeft size={18} /> Voltar
 </button>
 <h2 className="text-[28px] font-bold text-white mb-6">Idioma</h2>
 
 <div className="space-y-3">
 {[
 { code:'pt', label:'Português (Brasil)', flag:'🇧🇷' },
 { code:'en', label:'English (US)', flag:'🇺🇸' }
 ].map(l => (
 <button
 key={l.code}
 onClick={() => { setLang(l.code); success('Idioma alterado'); setActiveSection('main'); }}
 className={`w-full flex items-center gap-4 p-6 rounded-[28px] border-2 transition-all ${
 lang === l.code ?'border-[var(--db-blue)] bg-[#202020]' :'border-transparent bg-[#202020]/40'
 }`}
 >
 <span className="text-2xl">{l.flag}</span>
 <span className="text-[16px] font-bold text-white">{l.label}</span>
 {lang === l.code && <Check size={20} className="ml-auto text-[var(--db-blue)]" />}
 </button>
 ))}
 </div>
 </motion.div>
 ) : null}
 </AnimatePresence>
 </div>
 );
}
