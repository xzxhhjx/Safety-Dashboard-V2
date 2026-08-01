import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, BarChart3, MapPin, Users, Settings, Shield } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/',              label: 'Overview',        icon: LayoutDashboard },
  { path: '/observations',  label: 'Observations',    icon: ClipboardList },
  { path: '/analytics',     label: 'Analytics',       icon: BarChart3 },
  { path: '/work-areas',    label: 'Work Areas',      icon: MapPin },
  { path: '/people-teams',  label: 'People & Teams',  icon: Users },
  { path: '/settings',      label: 'Settings',        icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <aside className="sidebar">
      {/* Logo / Brand */}
      <div className="px-5 py-6" style={{ WebkitAppRegion: 'no-drag' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0, 122, 255, 0.10)' }}>
            <Shield className="w-4.5 h-4.5" style={{ color: 'var(--system-blue)' }} />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>HSE Safety</div>
            <div className="text-xs leading-tight" style={{ color: 'var(--text-secondary)' }}>Observation Platform</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        {NAV_ITEMS.map(item => {
          const isActive = item.path === '/'
            ? currentPath === '/'
            : currentPath.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item${isActive ? ' active' : ''}`}
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom — User section */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', WebkitAppRegion: 'no-drag' }}>
        <div className="flex items-center gap-2.5">
          <div className="avatar" style={{ background: 'var(--system-green)' }}>HS</div>
          <div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>HSE Manager</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Safety Platform v3.0</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
