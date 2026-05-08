import { Link } from 'react-router-dom';
import {
  Wallet,
  RefreshCw,
  Target,
  Trophy,
  Settings as SettingsIcon,
  Moon,
  Languages,
  LogOut,
} from 'lucide-react';
import Sheet from './Sheet';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../utils/translations';

const SECONDARY_LINKS = [
  { to: '/finances', icon: Wallet, label: 'Finanças', tone: '#34C759' },
  { to: '/routines', icon: RefreshCw, label: 'Rotinas', tone: '#F59E0B' },
  { to: '/goals', icon: Target, label: 'Metas', tone: '#10B981' },
  { to: '/achievements', icon: Trophy, label: 'Conquistas', tone: '#FFD60A' },
  { to: '/settings', icon: SettingsIcon, label: 'Configurações', tone: '#A1A1AA' },
];

const THEMES = ['obsidian', 'midnight', 'arctic', 'forest', 'liquidglass'];

export default function MoreSheet({ open, onClose }) {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useTranslation();

  const cycleTheme = () => {
    const idx = THEMES.indexOf(theme);
    setTheme(THEMES[(idx + 1) % THEMES.length]);
  };

  const cycleLang = () => setLang(lang === 'pt' ? 'en' : 'pt');

  return (
    <Sheet open={open} onClose={onClose} title="Mais">
      <div className="px-4 pt-1 pb-6 space-y-5">
        <div className="grid grid-cols-2 gap-2">
          {SECONDARY_LINKS.map(({ to, icon: Icon, label, tone }) => (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className="flex items-center gap-3 p-3.5 rounded-[14px] bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] active:bg-white/[0.08] transition-colors outline-none"
            >
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: `${tone}1A`, color: tone }}
              >
                <Icon size={18} strokeWidth={1.8} />
              </div>
              <span className="text-[14px] font-medium text-[#F5F5F7] truncate">{label}</span>
            </Link>
          ))}
        </div>

        <div className="rounded-[14px] bg-white/[0.03] border border-white/[0.05] divide-y divide-white/[0.04]">
          <button
            type="button"
            onClick={cycleTheme}
            className="flex items-center gap-3 w-full p-3.5 active:bg-white/[0.04] transition-colors outline-none"
          >
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-white/[0.05]">
              <Moon size={17} className="text-[#E5E5EA]" strokeWidth={1.8} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[14px] font-medium text-[#F5F5F7]">Tema</p>
              <p className="text-[11.5px] text-[#86868B] capitalize">{theme}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={cycleLang}
            className="flex items-center gap-3 w-full p-3.5 active:bg-white/[0.04] transition-colors outline-none"
          >
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-white/[0.05]">
              <Languages size={17} className="text-[#E5E5EA]" strokeWidth={1.8} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[14px] font-medium text-[#F5F5F7]">Idioma</p>
              <p className="text-[11.5px] text-[#86868B] uppercase">{lang}</p>
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onClose?.();
            logout?.();
          }}
          className="flex items-center justify-center gap-2 w-full p-3.5 rounded-[14px] bg-[#FF3B30]/10 text-[#FF6961] border border-[#FF3B30]/20 active:bg-[#FF3B30]/15 transition-colors outline-none"
        >
          <LogOut size={17} strokeWidth={1.9} />
          <span className="text-[14px] font-semibold">Sair</span>
        </button>
      </div>
    </Sheet>
  );
}
