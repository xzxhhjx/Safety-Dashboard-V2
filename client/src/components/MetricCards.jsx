import { COLORS } from '../config';
import { LayoutList, Target, MapPin, CalendarPlus } from 'lucide-react';

const iconCls = "w-4 h-4";

export default function MetricCards({ stats, loading }) {
  if (loading || !stats) {
    return <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[1,2,3,4].map(i => <div key={i} className="card animate-pulse h-24" />)}
    </div>;
  }

  const cards = [
    { label: 'Total Records', value: stats.totalCount?.toLocaleString() || '0', color: COLORS.SAFE, icon: <LayoutList className={iconCls} /> },
    { label: 'Closure Rate', value: `${stats.closedRate || 0}%`, color: COLORS.SAFE, icon: <Target className={iconCls} /> },
    { label: 'Active Areas', value: stats.areaCount || 0, color: COLORS.WARN, icon: <MapPin className={iconCls} /> },
    { label: 'New This Month', value: stats.monthNew || 0, color: COLORS.DANGER, icon: <CalendarPlus className={iconCls} /> },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map(c => (
        <div key={c.label} className="card">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <span style={{ color: c.color }}>{c.icon}</span>
            {c.label}
          </div>
          <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
