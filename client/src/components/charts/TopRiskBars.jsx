import { CHART_COLORS } from '../../config';

/**
 * Top Risk Categories — Apple Reminders-style horizontal progress bars.
 * Replaces the WordCloud for a more professional enterprise look.
 */
export default function TopRiskBars({ data }) {
  if (!data?.length) {
    return (
      <div className="chart-container flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
        No data
      </div>
    );
  }

  const items = data.slice(0, 8);
  const max = items[0].value;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col gap-2">
      {items.map((d, i) => {
        const pct = max > 0 ? (d.value / max) * 100 : 0;
        const share = total > 0 ? Math.round((d.value / total) * 100) : 0;
        return (
          <div key={d.name} className="flex items-center gap-2.5">
            <span
              className="text-xs font-medium truncate flex-shrink-0"
              style={{ width: 120, color: 'var(--text-primary)' }}
              title={d.name}
            >
              {d.name}
            </span>
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(0,0,0,0.05)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-600"
                style={{
                  width: `${pct}%`,
                  background: CHART_COLORS[i % CHART_COLORS.length],
                }}
              />
            </div>
            <span
              className="text-xs font-medium tabular-nums flex-shrink-0 text-right"
              style={{ width: 32, color: 'var(--text-primary)' }}
            >
              {d.value}
            </span>
            <span
              className="text-xs flex-shrink-0 text-right"
              style={{ width: 36, color: 'var(--text-secondary)' }}
            >
              {share}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
