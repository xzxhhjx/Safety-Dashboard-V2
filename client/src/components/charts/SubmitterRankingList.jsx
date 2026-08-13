import { useLanguage } from '../../context/LanguageContext';

/**
 * Top Submitters — Apple Reminders-style list.
 * Avatar circle (first letter) + name + submission count.
 */
export default function SubmitterRankingList({ data }) {
  const { t } = useLanguage();

  if (!data?.length) {
    return <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('common.noData')}</div>;
  }

  const AVATAR_COLORS = [
    '#007AFF', '#34C759', '#FF9F0A', '#FF453A', '#5856D6',
    '#FF6B35', '#AF52DE', '#00C7BE', '#FF2D55', '#30B0C7',
  ];

  const avatarBg = (name) => {
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  };

  const initial = (name) => (name || '?')[0].toUpperCase();

  const items = data?.slice(0, 8) || [];

  return (
    <div className="flex flex-col">
      {items.map((d, i) => (
        <div
          key={d.name}
          className="flex items-center gap-3 py-2"
          style={{
            borderBottom: i < items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
            style={{ background: avatarBg(d.name), fontSize: 11 }}
          >
            {initial(d.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {d.name}
            </div>
          </div>
          <span className="text-sm font-semibold tabular-nums flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}
