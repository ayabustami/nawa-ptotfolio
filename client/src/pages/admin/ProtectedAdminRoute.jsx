    import { useEffect, useState } from 'react';
    import { Navigate, Outlet } from 'react-router-dom';

    export default function ProtectedAdminRoute() {
    const [status, setStatus] = useState('checking');

    useEffect(() => {
        let active = true;

        async function checkSession() {
        try {
            const response = await fetch('/api/admin/me', {
            credentials: 'include',
            });

            if (!active) return;

            setStatus(response.ok ? 'authenticated' : 'unauthenticated');
        } catch {
            if (active) {
            setStatus('unauthenticated');
            }
        }
        }

        checkSession();

        return () => {
        active = false;
        };
    }, []);

    if (status === 'checking') {
        return (
        <main className="min-h-screen bg-[#0b0b0a] text-[#f4f0e8] flex items-center justify-center">
            <p className="text-sm text-[#8f8b82]">
            Checking session...
            </p>
        </main>
        );
    }

    if (status === 'unauthenticated') {
        return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
    }