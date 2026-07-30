import { useState, useEffect } from 'react';
import AdminLogin from '../components/AdminLogin';
import ExcelUpload from '../components/ExcelUpload';
import AIClassifyPanel from '../components/AIClassifyPanel';
import AwardsManager from '../components/AwardsManager';
import { getToken, setToken } from '../api';

export default function Admin() {
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
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <button onClick={handleLogout}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition">
          Logout
        </button>
      </div>

      <ExcelUpload />
      <AIClassifyPanel />
      <AwardsManager />
    </div>
  );
}
