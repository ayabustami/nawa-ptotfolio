    import { useEffect, useState } from 'react';
    import { NavLink, useNavigate } from 'react-router-dom';
    import './AdminLayout.css';

    const navigation = [
    { label: 'Overview', path: '/admin', icon: '⌂' },
    { label: 'Projects', path: '/admin/projects', icon: '◫' },
    { label: 'Categories', path: '/admin/categories', icon: '◇' },
    { label: 'Technologies', path: '/admin/technologies', icon: '⌘' },
    { label: 'Inquiries', path: '/admin/inquiries', icon: '□' },
    ];

    export default function AdminLayout({ children, title, eyebrow = 'NAWA TECHNOLOGY' }) {
    const navigate = useNavigate();

    const [admin, setAdmin] = useState(null);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        async function loadAdmin() {
        try {
            const response = await fetch('/api/admin/me', {
            credentials: 'include',
            });

            if (!response.ok) {
            navigate('/admin/login', { replace: true });
            return;
            }

            const data = await response.json();
            setAdmin(data.admin);
        } catch {
            navigate('/admin/login', { replace: true });
        }
        }

        loadAdmin();
    }, [navigate]);

    async function handleLogout() {
        setLoggingOut(true);

        try {
        await fetch('/api/admin/logout', {
            method: 'POST',
            credentials: 'include',
        });
        } finally {
        navigate('/admin/login', { replace: true });
        }
    }

    return (
        <div className="admin-dashboard">
        <aside className="admin-sidebar">
            <div className="admin-sidebar__top">
            <div className="admin-sidebar__brand">
                <span className="admin-sidebar__mark">N</span>

                <div>
                <span className="admin-sidebar__name">NAWA</span>
                <span className="admin-sidebar__label">TECHNOLOGY</span>
                </div>
            </div>

            <div className="admin-sidebar__section">
                <span>WORKSPACE</span>
            </div>

            <nav className="admin-sidebar__nav">
                {navigation.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/admin'}
                    className={({ isActive }) =>
                    `admin-sidebar__link ${
                        isActive ? 'admin-sidebar__link--active' : ''
                    }`
                    }
                >
                    <span className="admin-sidebar__icon">
                    {item.icon}
                    </span>

                    <span>{item.label}</span>
                </NavLink>
                ))}
            </nav>
            </div>

            <div className="admin-sidebar__bottom">
            <div className="admin-sidebar__user">
                <div className="admin-sidebar__avatar">
                {admin?.email?.charAt(0).toUpperCase() || 'A'}
                </div>

                <div className="admin-sidebar__user-info">
                <span className="admin-sidebar__user-label">
                    ADMIN
                </span>

                <span className="admin-sidebar__email">
                    {admin?.email || 'Loading...'}
                </span>
                </div>
            </div>

            <button
                type="button"
                className="admin-sidebar__logout"
                onClick={handleLogout}
                disabled={loggingOut}
            >
                <span>↗</span>

                {loggingOut ? 'Signing out...' : 'Sign out'}
            </button>
            </div>
        </aside>

        <main className="admin-main">
            <header className="admin-topbar">
            <div>
                <p className="admin-topbar__eyebrow">
                {eyebrow}
                </p>

                <h1>{title}</h1>
            </div>

            <div className="admin-topbar__status">
                <span className="admin-topbar__status-dot" />
                System operational
            </div>
            </header>

            {children}

            <footer className="admin-main__footer">
            <span>NAWA TECHNOLOGY</span>

            <span>
                Admin workspace · {new Date().getFullYear()}
            </span>
            </footer>
        </main>
        </div>
    );
    }