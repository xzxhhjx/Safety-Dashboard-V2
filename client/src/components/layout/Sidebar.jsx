import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, ClipboardList, Shield, Sun, Moon, Clock, HardHat } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const NAV_ITEMS = [
  { path: '/',              label: 'Overview',        icon: LayoutDashboard },
  { path: '/analytics',     label: 'Analytics',       icon: BarChart3 },
  { path: '/observations',  label: 'Observations',    icon: ClipboardList },
];

const EXTERNAL_NAV_ITEMS = [
  { label: '加班申请系统', icon: Clock,   path: '/overtime' },
  { label: '施工日报系统', icon: HardHat, path: '/daily' },
];

export default function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { dark, toggle } = useTheme();

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

        {EXTERNAL_NAV_ITEMS.map(item => {
          const isActive = currentPath === item.path || currentPath.startsWith(item.path);
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

      {/* Bottom — macOS Appearance Switcher */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border-subtle)', WebkitAppRegion: 'no-drag' }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>外观</span>

          {/* macOS Control Center style appearance toggle */}
          <div
            role="radiogroup"
            aria-label="外观模式"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              width: 64,
              height: 32,
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.20)',
              background: 'rgba(59, 130, 246, 0.25)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.10)',
              position: 'relative',
              padding: 2,
              cursor: 'default',
            }}
          >
            {/* Active indicator — white circle that slides */}
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#FFFFFF',
                position: 'absolute',
                top: 3,
                left: dark ? 35 : 3,
                transition: 'left 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.08)',
                zIndex: 1,
              }}
            />

            {/* Light option */}
            <button
              onClick={() => dark && toggle()}
              aria-label="日间模式"
              aria-pressed={!dark}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                border: 'none', background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative', zIndex: 2,
                padding: 0,
              }}
            >
              <Sun
                strokeWidth={1.5}
                className="w-3.5 h-3.5"
                style={{ color: dark ? 'rgba(255,255,255,0.55)' : '#1D1D1F', transition: 'color 0.2s ease' }}
              />
            </button>

            {/* Dark option */}
            <button
              onClick={() => !dark && toggle()}
              aria-label="夜间模式"
              aria-pressed={dark}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                border: 'none', background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative', zIndex: 2,
                padding: 0, marginLeft: 4,
              }}
            >
              <Moon
                strokeWidth={1.5}
                className="w-3.5 h-3.5"
                style={{ color: dark ? '#1D1D1F' : 'rgba(255,255,255,0.55)', transition: 'color 0.2s ease' }}
              />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
