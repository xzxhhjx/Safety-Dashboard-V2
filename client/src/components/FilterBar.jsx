export default function FilterBar({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <FilterField label="Start Date">
        <input type="date" value={filters.startDate || ''}
          onChange={e => update('startDate', e.target.value)}
          className="input-apple w-36" />
      </FilterField>
      <FilterField label="End Date">
        <input type="date" value={filters.endDate || ''}
          onChange={e => update('endDate', e.target.value)}
          className="input-apple w-36" />
      </FilterField>
      <FilterField label="Status">
        <select value={filters.status || ''} onChange={e => update('status', e.target.value)}
          className="input-apple">
          <option value="">All</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
          <option value="已关闭">已关闭</option>
        </select>
      </FilterField>
      <FilterField label="Area">
        <input type="text" value={filters.area || ''}
          onChange={e => update('area', e.target.value)} placeholder="e.g. HRSG"
          className="input-apple w-28" />
      </FilterField>
      <FilterField label="Keyword">
        <input type="text" value={filters.keyword || ''}
          onChange={e => update('keyword', e.target.value)} placeholder="Search..."
          className="input-apple w-40" />
      </FilterField>
      <button onClick={() => onChange({})}
        className="btn-secondary">
        Reset
      </button>
    </div>
  );
}

function FilterField({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      {children}
    </label>
  );
}
