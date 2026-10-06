    import { useEffect, useState } from 'react';
    import { Navigate, Outlet } from 'react-router-dom';

    const API_URL = import.meta.env.VITE_API_URL || '';

    export default function ProtectedAdminRoute() {
    const [status, setStatus] = useState('checking');

  useEffect(() => {
  let cancelled = false;

  console.log('[PROTECTED ROUTE] mounted');

  async function checkAuth() {
    console.log('[PROTECTED ROUTE] checking /api/admin/me');

    try {
      const response = await fetch(
        `${API_URL}/api/admin/me`,
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }
      );

      console.log(
        '[PROTECTED ROUTE] /me status:',
        response.status
      );

      console.log(
        '[PROTECTED ROUTE] /me ok:',
        response.ok
      );

      if (cancelled) {
        console.log(
          '[PROTECTED ROUTE] request cancelled'
        );
        return;
      }

      if (response.status === 401) {
        console.log(
          '[PROTECTED ROUTE] 401 → redirecting to login'
        );

        setStatus('unauthenticated');
        return;
      }

      if (!response.ok) {
        console.log(
          '[PROTECTED ROUTE] non-OK → redirecting to login'
        );

        setStatus('unauthenticated');
        return;
      }

      const data = await response.json();

      console.log(
        '[PROTECTED ROUTE] /me data:',
        {
          authenticated: data?.authenticated,
          adminEmail: data?.admin?.email,
        }
      );

      if (data?.authenticated === true) {
        console.log(
          '[PROTECTED ROUTE] authenticated → allowing /admin'
        );

        setStatus('authenticated');
      } else {
        console.log(
          '[PROTECTED ROUTE] authenticated=false → login'
        );

        setStatus('unauthenticated');
      }
    } catch (error) {
      console.error(
        '[PROTECTED ROUTE] /me ERROR:',
        error
      );

      if (!cancelled) {
        setStatus('unauthenticated');
      }
    }
  }

  checkAuth();

  return () => {
    cancelled = true;

    console.log(
      '[PROTECTED ROUTE] unmounted'
    );
  };
}, []);

    if (status === 'checking') {
        return null;
    }

    if (status === 'unauthenticated') {
        return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
    }