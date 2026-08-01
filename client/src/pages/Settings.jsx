import Toolbar from '../components/layout/Toolbar';
import { Settings as SettingsIcon, Users, MapPin, Bell, Download, Palette } from 'lucide-react';

const SETTING_SECTIONS = [
  { icon: Users, label: 'User Management', desc: 'Coming soon' },
  { icon: MapPin, label: 'Risk Category Configuration', desc: 'Coming soon' },
  { icon: MapPin, label: 'Work Area Configuration', desc: 'Coming soon' },
  { icon: Bell, label: 'Notification Rules', desc: 'Coming soon' },
  { icon: Download, label: 'Export Settings', desc: 'Coming soon' },
  { icon: Palette, label: 'System Preferences', desc: 'Coming soon' },
];

export default function Settings() {
  return (
    <div>
      <Toolbar title="Settings" subtitle="Platform configuration" />

      <div className="px-6 py-5" style={{ maxWidth: 1440 }}>
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
