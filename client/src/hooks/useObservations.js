import { useState, useEffect } from 'react';
import { fetchObservations } from '../api';

export function useObservations(page, pageSize, filters) {
  const [data, setData] = useState({ data: [], total: 0, page: 1, pageSize: 50 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchObservations(page, pageSize, filters)
      .then(d => { if (!cancelled) { setData(d); setError(null); } })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [
    page, pageSize,
    filters?.status, filters?.area, filters?.hazard, filters?.keyword,
    filters?.startDate, filters?.endDate,
  ]);

  return { observations: data.data, total: data.total, page: data.page, loading, error };
}
