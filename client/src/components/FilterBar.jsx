import { useLanguage } from '../context/LanguageContext';

export default function FilterBar({ filters, onChange }) {
  const { t } = useLanguage();
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <FilterField label={t('filter.status')}>
        <select value={filters.status || ''} onChange={e => update('status', e.target.value)}
          className="input-apple">
          <option value="">{t('filter.all')}</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
          <option value="Overdue">Overdue</option>
        </select>
      </FilterField>
      <FilterField label={t('filter.riskCategory')}>
        <select value={filters.riskCategory || ''} onChange={e => update('riskCategory', e.target.value)}
          className="input-apple">
          <option value="">{t('filter.allCategories')}</option>
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
      <FilterField label={t('filter.department')}>
        <input type="text" value={filters.dept || ''}
          onChange={e => update('dept', e.target.value)} placeholder={t('filter.deptPlaceholder')}
          className="input-apple w-32" />
      </FilterField>
      <FilterField label={t('filter.area')}>
        <input type="text" value={filters.area || ''}
          onChange={e => update('area', e.target.value)} placeholder={t('filter.areaPlaceholder')}
          className="input-apple w-32" />
      </FilterField>
      <FilterField label={t('filter.keyword')}>
        <input type="text" value={filters.keyword || ''}
          onChange={e => update('keyword', e.target.value)} placeholder={t('common.search')}
          className="input-apple w-40" />
      </FilterField>
      <button onClick={() => onChange({})} className="btn-secondary">{t('common.reset')}</button>
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
