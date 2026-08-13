import { Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function SearchInput({ value, onChange, placeholder }) {
  const { t } = useLanguage();
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-tertiary)' }} />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || t('common.search')}
        className="input-apple"
        style={{ paddingLeft: 28 }}
      />
    </div>
  );
}
