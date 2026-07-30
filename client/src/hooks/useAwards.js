import { useState, useEffect } from 'react';
import { fetchAwards } from '../api';

export function useAwards() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAwards().then(setData).finally(() => setLoading(false));
  }, []);

  return { awards: data, loading };
}
