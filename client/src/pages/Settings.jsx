import Toolbar from '../components/layout/Toolbar';
import { Settings as SettingsIcon, Users, MapPin, Bell, Download, Palette } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Settings() {
  const { t } = useLanguage();

  const SETTING_SECTIONS = [
    { icon: Users,    label: t('settings.userManagement'), desc: t('settings.comingSoon') },
    { icon: MapPin,   label: t('settings.riskCategory'),   desc: t('settings.comingSoon') },
    { icon: MapPin,   label: t('settings.workArea'),       desc: t('settings.comingSoon') },
    { icon: Bell,     label: t('settings.notification'),   desc: t('settings.comingSoon') },
    { icon: Download, label: t('settings.export'),         desc: t('settings.comingSoon') },
    { icon: Palette,  label: t('settings.preferences'),    desc: t('settings.comingSoon') },
  ];

  return (
    <div>
      <Toolbar title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SETTING_SECTIONS.map(s => (
            <div key={s.label} className="card flex items-start gap-4 opacity-60" style={{ padding: '20px' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(0,122,255,0.08)' }}>
                <s.icon className="w-4 h-4" style={{ color: 'var(--system-blue)' }} />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
