import { useAuth } from'../contexts/AuthContext';
import LiveCursors from'./LiveCursors';

// Mostra cursores em tempo real só quando há time ativo. Em uso solo, não
// faz sentido (não há ninguém pra mostrar).
export default function TeamLiveCursors({ contentRef, roomId, ...rest }) {
 const { activeTeam } = useAuth();
 if (!activeTeam) return null;
 return (
 <LiveCursors
 contentRef={contentRef}
 roomId={`team:${activeTeam.id}:${roomId}`}
 {...rest}
 />
 );
}
