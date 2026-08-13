import { useState, useEffect } from 'react';
import AdminLogin from '../components/AdminLogin';
import ExcelUpload from '../components/ExcelUpload';
import AIClassifyPanel from '../components/AIClassifyPanel';
import AwardsManager from '../components/AwardsManager';
import { getToken, setToken } from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function Admin() {
  const { t } = useLanguage();
  const [authenticated, setAuthenticated] = useState(!!getToken());

  useEffect(() => {
    const onLogout = () => setAuthenticated(false);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  if (!authenticated) {
    return <AdminLogin onSuccess={() => setAuthenticated(true)} />;
  }

  const handleLogout = () => {
    setToken('');
    setAuthenticated(false);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{t('admin.panel')}</h1>
          <button onClick={handleLogout} className="btn-secondary">
            {t('admin.logout')}
          </button>
        </div>

        <ExcelUpload />
        <AIClassifyPanel />
        <AwardsManager />
      </div>
    </div>
  );
}
