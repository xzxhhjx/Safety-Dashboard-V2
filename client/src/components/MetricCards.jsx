import { COLORS } from '../config';

export default function MetricCards({ stats, loading }) {
  if (loading || !stats) {
    return <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[1,2,3,4].map(i => <div key={i} className="card animate-pulse h-24" />)}
    </div>;
  }

  const cards = [
    { label: 'Total Records', value: stats.totalCount?.toLocaleString() || '0', color: COLORS.SAFE },
    { label: 'Closure Rate', value: `${stats.closedRate || 0}%`, color: COLORS.SAFE },
    { label: 'Active Areas', value: stats.areaCount || 0, color: COLORS.WARN },
    { label: 'New This Month', value: stats.monthNew || 0, color: COLORS.DANGER },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map(c => (
        <div key={c.label} className="card">
          <div className="text-xs text-gray-500 mb-1">{c.label}</div>
          <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
