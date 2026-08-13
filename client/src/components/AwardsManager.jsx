import { useState, useEffect } from 'react';
import { fetchAwards, updateAwards } from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function AwardsManager() {
  const { t } = useLanguage();
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAwards().then(data => {
      setAwards(data.map(a => ({ ...a })));
      setLoading(false);
    });
  }, []);

  const updateAward = (id, field, value) => {
    setAwards(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const addNew = () => {
    const name = prompt(t('awards.teamName'));
    if (name) setAwards(prev => [...prev, { id: name, score: 0, level: 'normal' }]);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateAwards(awards);
      alert(t('awards.saved'));
    } catch (err) {
      alert(t('awards.errorPrefix') + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="card" style={{ color: 'var(--text-secondary)' }}>{t('awards.loading')}</div>;

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('awards.title')}
        </h2>
        <div className="flex gap-2">
          <button onClick={addNew} className="btn-secondary">{t('awards.add')}</button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? t('awards.saving') : t('awards.save')}
          </button>
        </div>
      </div>

      <table className="data-table w-full">
        <thead>
          <tr>
            <th>{t('awards.team')}</th>
            <th>{t('awards.score')}</th>
            <th>{t('awards.level')}</th>
          </tr>
        </thead>
        <tbody>
          {awards.map(a => (
            <tr key={a.id}>
              <td className="font-medium">{a.id}</td>
              <td>
                <input
                  type="number"
                  value={a.score}
                  onChange={e => updateAward(a.id, 'score', parseInt(e.target.value) || 0)}
                  className="input-apple w-24"
                  style={{ height: 32, fontSize: 13 }}
                />
              </td>
              <td>
                <select
                  value={a.level}
                  onChange={e => updateAward(a.id, 'level', e.target.value)}
                  className="input-apple"
                  style={{ height: 32, fontSize: 13 }}
                >
                  <option value="gold">{t('awards.gold')}</option>
                  <option value="silver">{t('awards.silver')}</option>
                  <option value="normal">{t('awards.normal')}</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
