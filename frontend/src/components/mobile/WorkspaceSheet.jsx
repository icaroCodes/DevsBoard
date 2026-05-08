import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Check } from 'lucide-react';
import Sheet from './Sheet';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

export default function WorkspaceSheet({ open, onClose }) {
  const { user, activeTeam, switchTeam } = useAuth();
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (!open || !user) return;
    api('/teams').then(setTeams).catch(console.error);
  }, [open, user]);

  const Item = ({ active, avatar, fallbackBg, fallbackChar, title, subtitle, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-3 rounded-[12px] transition-colors outline-none ${
        active ? 'bg-white/[0.06]' : 'active:bg-white/[0.04]'
      }`}
    >
      <div
        className="w-10 h-10 rounded-[10px] overflow-hidden flex items-center justify-center shrink-0 border border-white/[0.06]"
        style={{ background: avatar ? 'transparent' : fallbackBg }}
      >
        {avatar ? (
          <img src={avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[13px] font-bold text-white">{fallbackChar}</span>
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[14px] font-semibold text-[#F5F5F7] truncate">{title}</p>
        <p className="text-[11.5px] text-[#86868B] truncate">{subtitle}</p>
      </div>
      {active && <Check size={16} className="text-[#30D158] shrink-0" strokeWidth={2.4} />}
    </button>
  );

  return (
    <Sheet open={open} onClose={onClose} title="Workspaces">
      <div className="px-3 pb-4 space-y-1">
        <Item
          active={!activeTeam}
          avatar={user?.avatar_url}
          fallbackBg="#202020"
          fallbackChar={user?.name?.[0]?.toUpperCase() || 'P'}
          title={user?.name || 'Pessoal'}
          subtitle="Workspace pessoal"
          onClick={() => {
            switchTeam(null);
            onClose?.();
          }}
        />
        {teams.map((team) => (
          <Item
            key={team.id}
            active={activeTeam?.id === team.id}
            avatar={team.avatar_url}
            fallbackBg={team.type === 'family' ? '#FF375F' : '#0A84FF'}
            fallbackChar={team.name?.[0]?.toUpperCase()}
            title={team.name}
            subtitle={`${team.type === 'family' ? 'família' : 'equipe'} · ${
              team.my_role === 'owner' ? 'dono' : team.my_role === 'admin' ? 'admin' : 'membro'
            }`}
            onClick={() => {
              switchTeam(team);
              onClose?.();
            }}
          />
        ))}

        <Link
          to="/teams"
          onClick={onClose}
          className="flex items-center gap-2.5 w-full p-3 mt-2 rounded-[12px] border border-dashed border-white/[0.08] text-[13px] font-medium text-[#A1A1AA] active:bg-white/[0.04] transition-colors"
        >
          <Users size={16} strokeWidth={1.9} />
          Gerenciar times
        </Link>
      </div>
    </Sheet>
  );
}
