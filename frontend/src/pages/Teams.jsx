import { useIsMobile } from'../hooks/useIsMobile';
import TeamsDesktop from'./teams/TeamsDesktop';
import TeamsMobile from'./teams/TeamsMobile';

export default function Teams() {
 const isMobile = useIsMobile();

 if (isMobile) {
 return <TeamsMobile />;
 }

 return <TeamsDesktop />;
}
