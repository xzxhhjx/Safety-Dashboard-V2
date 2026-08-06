export default function Toolbar({ title, subtitle, actions, filters, onFilterChange }) {
  const update = (key, value) => {
    if (onFilterChange) onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="toolbar">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {onFilterChange && (
          <>
            <label className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>从</span>
              <input
                type="date"
                value={filters?.startDate || ''}
                onChange={e => update('startDate', e.target.value)}
                className="input-apple"
                style={{ width: 140, height: 30, fontSize: 12 }}
              />
            </label>
            <label className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>至</span>
              <input
                type="date"
                value={filters?.endDate || ''}
                onChange={e => update('endDate', e.target.value)}
                className="input-apple"
                style={{ width: 140, height: 30, fontSize: 12 }}
              />
            </label>
          </>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
