import { useState, useEffect } from 'react';
import { fetchAwards, updateAwards } from '../api';

export default function AwardsManager() {
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
    const name = prompt('Team name:');
    if (name) setAwards(prev => [...prev, { id: name, score: 0, level: 'normal' }]);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateAwards(awards);
      alert('Saved!');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="card" style={{ color: 'var(--text-secondary)' }}>Loading awards...</div>;

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Safety Awards
        </h2>
        <div className="flex gap-2">
          <button onClick={addNew} className="btn-secondary">+ Add</button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <table className="data-table w-full">
        <thead>
          <tr>
            <th>Team</th>
            <th>Score</th>
            <th>Level</th>
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
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                  <option value="normal">Normal</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
