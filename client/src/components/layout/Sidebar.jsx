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
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.18)' }}>
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="text-white text-sm font-semibold leading-tight">HSE Safety</div>
            <div className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.55)' }}>Observation Platform</div>
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

      {/* Bottom — User section placeholder */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-2.5">
          <div className="avatar" style={{ background: 'var(--system-green)' }}>HS</div>
          <div>
            <div className="text-xs font-medium text-white">HSE Manager</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Safety Platform v3.0</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
