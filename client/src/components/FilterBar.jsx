export default function FilterBar({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="card mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <FilterField label="Start Date">
          <input type="date" value={filters.startDate || ''}
            onChange={e => update('startDate', e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-40" />
        </FilterField>
        <FilterField label="End Date">
          <input type="date" value={filters.endDate || ''}
            onChange={e => update('endDate', e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-40" />
        </FilterField>
        <FilterField label="Status">
          <select value={filters.status || ''} onChange={e => update('status', e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="已关闭">已关闭</option>
          </select>
        </FilterField>
        <FilterField label="Area">
          <input type="text" value={filters.area || ''}
            onChange={e => update('area', e.target.value)} placeholder="e.g. HRSG"
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-32" />
        </FilterField>
        <FilterField label="Keyword">
          <input type="text" value={filters.keyword || ''}
            onChange={e => update('keyword', e.target.value)} placeholder="Search..."
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-48" />
        </FilterField>
        <button onClick={() => onChange({})}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition">
          Reset
        </button>
      </div>
    </div>
  );
}

function FilterField({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      {children}
    </label>
  );
}
