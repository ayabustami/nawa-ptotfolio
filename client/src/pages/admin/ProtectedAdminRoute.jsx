    import { useEffect, useState } from 'react';
    import { Navigate, Outlet } from 'react-router-dom';

    const API_URL = import.meta.env.VITE_API_URL || '';

    export default function ProtectedAdminRoute() {
    const [status, setStatus] = useState('checking');

    useEffect(() => {
        let cancelled = false;

        async function checkAuth() {
        try {
            const response = await fetch(
            `${API_URL}/api/admin/me`,
            {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
            }
            );

            if (cancelled) return;

            if (response.status === 401) {
            setStatus('unauthenticated');
            return;
            }

            if (!response.ok) {
            setStatus('unauthenticated');
            return;
            }

            const data = await response.json();

            if (data?.authenticated === true) {
            setStatus('authenticated');
            } else {
            setStatus('unauthenticated');
            }
        } catch (error) {
            console.error('Auth check failed:', error);

            if (!cancelled) {
            setStatus('unauthenticated');
            }
        }
        }

        checkAuth();

        return () => {
        cancelled = true;
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