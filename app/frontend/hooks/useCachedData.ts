import { useState, useEffect, useCallback, useRef } from 'react';
import { setCache, getCache } from '../services/cache';

interface UseCachedDataOptions {
  cacheKey: string;
  ttlMinutes?: number;
  enabled?: boolean;
}

export function useCachedData<T>(
  fetcher: () => Promise<T>,
  { cacheKey, ttlMinutes = 30, enabled = true }: UseCachedDataOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetcher();
      if (mountedRef.current) {
        setData(response);
        setFromCache(false);
        setLoading(false);
        setCache(cacheKey, response, ttlMinutes);
      }
    } catch {
      const cached = await getCache<T>(cacheKey);
      if (mountedRef.current) {
        if (cached) {
          setData(cached);
          setFromCache(true);
          setError(null);
        } else {
          setError('Sem conexão e sem dados em cache');
        }
        setLoading(false);
      }
    }
  }, [fetcher, cacheKey, ttlMinutes, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => { mountedRef.current = false; };
  }, [fetchData]);

  return { data, loading, error, fromCache, refetch: fetchData };
}
