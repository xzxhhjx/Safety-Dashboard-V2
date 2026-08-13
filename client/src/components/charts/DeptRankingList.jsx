import { useLanguage } from '../../context/LanguageContext';

/**
 * Department Ranking — Apple-style horizontal progress bars.
 * Compact list with department name, progress bar, count + percentage.
 */
export default function DeptRankingList({ data }) {
  const { t } = useLanguage();

  if (!data?.length) {
    return <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('common.noData')}</div>;
  }

  const items = data.slice(0, 8);
  const max = items[0].value;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const BAR_COLORS = ['#007AFF', '#5856D6', '#AF52DE', '#34C759', '#FF9F0A', '#FF453A', '#FF6B35', '#00C7BE'];

  return (
    <div className="flex flex-col gap-1.5">
      {items.map((d, i) => {
        const pct = max > 0 ? (d.value / max) * 100 : 0;
        const share = total > 0 ? Math.round((d.value / total) * 100) : 0;
        return (
          <div key={d.name} className="flex items-center gap-2.5">
            <span
              className="text-xs font-medium truncate flex-shrink-0"
              style={{ width: 100, color: 'var(--text-primary)' }}
              title={d.name}
            >
              {d.name}
            </span>
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
              />
            </div>
            <span className="text-xs font-medium tabular-nums flex-shrink-0" style={{ color: 'var(--text-primary)', width: 30, textAlign: 'right' }}>
              {d.value}
            </span>
            <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-secondary)', width: 32, textAlign: 'right' }}>
              {share}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
