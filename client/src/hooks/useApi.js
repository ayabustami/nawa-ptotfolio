import { useEffect, useState } from 'react';

export const API_URL = import.meta.env.VITE_API_URL || '';

export function useApi(path) {
  const [state, setState] = useState({ status: 'loading', data: null });
  useEffect(() => {
    const ctrl = new AbortController();
    setState({ status: 'loading', data: null });
    fetch(`${API_URL}${path}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then((data) => setState({ status: 'ready', data }))
      .catch((e) => e.name !== 'AbortError' && setState({ status: 'error', data: null }));
    return () => ctrl.abort();
  }, [path]);
  return state;
}
