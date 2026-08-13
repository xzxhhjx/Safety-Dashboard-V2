import { ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function EmbeddedApp({ title, src }) {
  const { t } = useLanguage();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 24px',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</span>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-nav-item"
          style={{ margin: 0, width: 'auto' }}
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          <span>{t('embedded.openNewTab')}</span>
        </a>
      </div>
      <iframe
        src={src}
        title={title}
        style={{ flex: 1, width: '100%', border: 'none', display: 'block' }}
      />
    </div>
  );
}
