export default function FilterBar({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <FilterField label="Status">
        <select value={filters.status || ''} onChange={e => update('status', e.target.value)}
          className="input-apple">
          <option value="">All</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
          <option value="Overdue">Overdue</option>
        </select>
      </FilterField>
      <FilterField label="Risk Category">
        <select value={filters.riskCategory || ''} onChange={e => update('riskCategory', e.target.value)}
          className="input-apple">
          <option value="">All Categories</option>
          <option value="Working at Height">Working at Height</option>
          <option value="Electrical Safety">Electrical Safety</option>
          <option value="PPE">PPE</option>
          <option value="Scaffolding">Scaffolding</option>
          <option value="Fire & Hot Work">Fire & Hot Work</option>
          <option value="Lifting & Rigging">Lifting & Rigging</option>
          <option value="Confined Space">Confined Space</option>
          <option value="Excavation & Trenching">Excavation & Trenching</option>
          <option value="Housekeeping & Slip/Trip">Housekeeping & Slip/Trip</option>
        </select>
      </FilterField>
      <FilterField label="Department">
        <input type="text" value={filters.dept || ''}
          onChange={e => update('dept', e.target.value)} placeholder="e.g. HSE"
          className="input-apple w-32" />
      </FilterField>
      <FilterField label="Area">
        <input type="text" value={filters.area || ''}
          onChange={e => update('area', e.target.value)} placeholder="e.g. HRSG"
          className="input-apple w-32" />
      </FilterField>
      <FilterField label="Keyword">
        <input type="text" value={filters.keyword || ''}
          onChange={e => update('keyword', e.target.value)} placeholder="Search..."
          className="input-apple w-40" />
      </FilterField>
      <button onClick={() => onChange({})} className="btn-secondary">Reset</button>
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
