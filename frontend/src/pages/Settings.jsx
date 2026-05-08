import { useIsMobile } from '../hooks/useIsMobile';
import SettingsDesktop from './settings/SettingsDesktop';
import SettingsMobile from './settings/SettingsMobile';

export default function Settings() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <SettingsMobile />;
  }

  return <SettingsDesktop />;
}
