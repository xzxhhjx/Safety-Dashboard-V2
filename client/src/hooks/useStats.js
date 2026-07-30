import { useState, useEffect } from 'react';
import { fetchStats } from '../api';

export function useStats(filters) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchStats(filters)
      .then(d => { if (!cancelled) { setData(d); setError(null); } })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [
    filters?.status, filters?.area, filters?.hazard,
    filters?.startDate, filters?.endDate,
  ]);

  return { stats: data, loading, error };
}
