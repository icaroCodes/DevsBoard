import { useIsMobile } from'../hooks/useIsMobile';
import AchievementsDesktop from'./achievements/AchievementsDesktop';
import AchievementsMobile from'./achievements/AchievementsMobile';

export default function Achievements() {
 const isMobile = useIsMobile();

 if (isMobile) {
 return <AchievementsMobile />;
 }

 return <AchievementsDesktop />;
}
