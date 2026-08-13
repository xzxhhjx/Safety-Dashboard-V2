import { useLanguage } from '../../context/LanguageContext';

export default function EmptyState({ icon, title, description }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--text-tertiary)' }}>
      {icon && <div className="mb-3 opacity-40">{icon}</div>}
      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{title || t('common.noData')}</p>
      {description && <p className="text-xs mt-1">{description}</p>}
    </div>
  );
}
