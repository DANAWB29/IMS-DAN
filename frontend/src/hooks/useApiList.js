import { useCallback, useEffect, useState } from 'react';

// Wraps a paginated list endpoint following the API's { data, meta } envelope.
export function useApiList(fetcher, initialParams = {}, deps = []) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [params, setParams] = useState({ page: 1, limit: 20, ...initialParams });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = useCallback(() => setReloadTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher(params)
      .then((res) => {
        if (cancelled) return;
        const data = res.data;
        setItems(Array.isArray(data) ? data : data?.items || []);
        setMeta(res.meta || { total: Array.isArray(data) ? data.length : 0, page: 1, limit: params.limit, totalPages: 1 });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params), reloadTick, ...deps]);

  const updateParams = useCallback((patch) => {
    setParams((p) => ({ ...p, ...patch, ...(patch.page ? {} : { page: 1 }) }));
  }, []);

  const setPage = useCallback((page) => setParams((p) => ({ ...p, page })), []);

  return { items, meta, params, setParams: updateParams, setPage, loading, error, reload };
}
