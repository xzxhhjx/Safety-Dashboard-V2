import { COLORS } from '../config';
import { LayoutList, CheckCircle2, AlertTriangle, MapPin } from 'lucide-react';

const iconCls = "w-5 h-5";

export default function MetricCards({ stats, loading }) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card animate-pulse" style={{ height: 96 }} />
        ))}
      </div>
    );
  }

  const openCount = (stats.totalCount || 0) - (
    stats.totalCount && stats.closedRate ? Math.round(stats.totalCount * stats.closedRate / 100) : 0
  );

  const cards = [
    {
      label: 'Total Records',
      value: stats.totalCount?.toLocaleString() || '0',
      color: COLORS.SAFE,
      icon: <LayoutList className={iconCls} />,
    },
    {
      label: 'Closed This Month',
      value: `${stats.closedRate || 0}%`,
      color: COLORS.SAFE,
      icon: <CheckCircle2 className={iconCls} />,
    },
    {
      label: 'Open Observations',
      value: openCount.toLocaleString(),
      color: COLORS.WARN,
      icon: <AlertTriangle className={iconCls} />,
    },
    {
      label: 'Active Work Areas',
      value: stats.areaCount || 0,
      color: COLORS.NEUTRAL,
      icon: <MapPin className={iconCls} />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
      {cards.map(c => (
        <div key={c.label} className="card" style={{ padding: '20px 24px' }}>
          <div className="flex items-center gap-2 mb-2">
            <span style={{ color: c.color }}>{c.icon}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {c.label}
            </span>
          </div>
          <div className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}
