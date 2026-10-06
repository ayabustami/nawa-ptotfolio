    import { useEffect, useMemo, useState } from 'react';
    import { NavLink } from 'react-router-dom';
    import AdminLayout from '../../components/admin/AdminLayout/AdminLayout';
    import './AdminInquiries.css';
    const API_URL = import.meta.env.VITE_API_URL || '';

    const STATUS_OPTIONS = [
    { value: 'all', label: 'All statuses' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'closed', label: 'Closed' },
    ];

    const statusLabels = {
    new: 'New',
    contacted: 'Contacted',
    in_progress: 'In progress',
    closed: 'Closed',
    };

    function formatDate(value) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return new Intl.DateTimeFormat('en', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
    }

    function StatusBadge({ status }) {
    return (
        <span className={`inquiry-status inquiry-status--${status}`}>
        <span className="inquiry-status__dot" />
        {statusLabels[status] || status}
        </span>
    );
    }

    export default function AdminInquiries() {
    const [inquiries, setInquiries] = useState([]);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    async function loadInquiries() {
        setLoading(true);
        setError('');

        try {
        const params = new URLSearchParams();

        if (search.trim()) {
            params.set('search', search.trim());
        }

        if (status !== 'all') {
            params.set('status', status);
        }

        const query = params.toString();

        const response = await fetch(
            `${API_URL}/api/admin/inquiries${query ? `?${query}` : ''}`,
            {
            credentials: 'include',
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
            window.location.href = '/admin/login';
            return;
            }

            const data = await response.json().catch(() => null);

            throw new Error(
            data?.error || 'Could not load inquiries.'
            );
        }

        const data = await response.json();

        setInquiries(Array.isArray(data) ? data : []);
        } catch (err) {
        setError(
            err.message || 'Could not load inquiries.'
        );
        } finally {
        setLoading(false);
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
        loadInquiries();
        }, 250);

        return () => clearTimeout(timer);
    }, [search, status]);

    async function updateStatus(id, nextStatus) {
        setUpdatingId(id);
        setError('');

        try {
        const response = await fetch(
            `${API_URL}/api/admin/inquiries/${id}/status`,
            {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: nextStatus,
            }),
            }
        );

        if (!response.ok) {
            const data = await response.json().catch(() => null);

            throw new Error(
            data?.error || 'Could not update inquiry.'
            );
        }

        const updated = await response.json();

        setInquiries((current) =>
            current
            .map((item) =>
                item.id === updated.id ? updated : item
            )
            .filter(
                (item) =>
                status === 'all' ||
                item.status === status
            )
        );
        } catch (err) {
        setError(
            err.message || 'Could not update inquiry.'
        );
        } finally {
        setUpdatingId(null);
        }
    }

    async function deleteInquiry(id) {
        const confirmed = window.confirm(
        'Are you sure you want to delete this inquiry? This action cannot be undone.'
        );

        if (!confirmed) return;

        setDeletingId(id);
        setError('');

        try {
        const response = await fetch(
            `${API_URL}/api/admin/inquiries/${id}`,
            {
            method: 'DELETE',
            credentials: 'include',
            }
        );

        if (!response.ok) {
            const data = await response.json().catch(() => null);

            throw new Error(
            data?.error || 'Could not delete inquiry.'
            );
        }

        setInquiries((current) =>
            current.filter((item) => item.id !== id)
        );
        } catch (err) {
        setError(
            err.message || 'Could not delete inquiry.'
        );
        } finally {
        setDeletingId(null);
        }
    }

    const counts = useMemo(() => {
        return {
        total: inquiries.length,
        new: inquiries.filter(
            (item) => item.status === 'new'
        ).length,
        inProgress: inquiries.filter(
            (item) => item.status === 'in_progress'
        ).length,
        closed: inquiries.filter(
            (item) => item.status === 'closed'
        ).length,
        };
    }, [inquiries]);

    return (
        <AdminLayout>
        <div className="admin-page inquiries-page">
            <div className="admin-page__header">
            <div>
                <div className="admin-breadcrumb">
                <NavLink to="/admin">Overview</NavLink>
                <span>/</span>
                <span>Inquiries</span>
                </div>

                <h1>Inquiries</h1>

                <p>
                Manage messages submitted through the NAWA
                website.
                </p>
            </div>
            </div>

            <div className="inquiries-summary">
            <div className="inquiry-summary-card">
                <span>Total</span>
                <strong>{counts.total}</strong>
            </div>

            <div className="inquiry-summary-card">
                <span>New</span>
                <strong>{counts.new}</strong>
            </div>

            <div className="inquiry-summary-card">
                <span>In progress</span>
                <strong>{counts.inProgress}</strong>
            </div>

            <div className="inquiry-summary-card">
                <span>Closed</span>
                <strong>{counts.closed}</strong>
            </div>
            </div>

            <section className="inquiries-panel">
            <div className="inquiries-toolbar">
                <div className="inquiries-search">
                <span className="inquiries-search__icon">
                    ⌕
                </span>

                <input
                    type="search"
                    placeholder="Search inquiries..."
                    value={search}
                    onChange={(event) =>
                    setSearch(event.target.value)
                    }
                />
                </div>

                <select
                value={status}
                onChange={(event) =>
                    setStatus(event.target.value)
                }
                className="inquiries-status-filter"
                >
                {STATUS_OPTIONS.map((option) => (
                    <option
                    key={option.value}
                    value={option.value}
                    >
                    {option.label}
                    </option>
                ))}
                </select>
            </div>

            {error && (
                <div className="admin-error">
                <span>{error}</span>

                <button
                    type="button"
                    onClick={loadInquiries}
                >
                    Retry
                </button>
                </div>
            )}

            {loading ? (
                <div className="inquiries-state">
                <div className="admin-spinner" />
                <p>Loading inquiries...</p>
                </div>
            ) : inquiries.length === 0 ? (
                <div className="inquiries-state inquiries-state--empty">
                <div className="inquiries-empty-icon">
                    □
                </div>

                <h3>No inquiries found</h3>

                <p>
                    {search || status !== 'all'
                    ? 'Try changing your search or status filter.'
                    : 'New contact messages will appear here.'}
                </p>
                </div>
            ) : (
                <div className="inquiries-table-wrap">
                <table className="inquiries-table">
                    <thead>
                    <tr>
                        <th>Contact</th>
                        <th>Message</th>
                        <th>Received</th>
                        <th>Status</th>
                        <th />
                    </tr>
                    </thead>

                    <tbody>
                    {inquiries.map((inquiry) => (
                        <tr key={inquiry.id}>
                        <td>
                            <div className="inquiry-contact">
                            <strong>
                                {inquiry.name}
                            </strong>

                            <a
                                href={`mailto:${inquiry.email}`}
                            >
                                {inquiry.email}
                            </a>

                            {inquiry.company && (
                                <span>
                                {inquiry.company}
                                </span>
                            )}
                            </div>
                        </td>

                        <td>
                            <div className="inquiry-message">
                            {inquiry.message}
                            </div>
                        </td>

                        <td className="inquiry-date">
                            {formatDate(
                            inquiry.createdAt
                            )}
                        </td>

                        <td>
                            <select
                            value={inquiry.status}
                            disabled={
                                updatingId === inquiry.id
                            }
                            onChange={(event) =>
                                updateStatus(
                                inquiry.id,
                                event.target.value
                                )
                            }
                            className={`inquiry-status-select inquiry-status-select--${inquiry.status}`}
                            >
                            <option value="new">
                                New
                            </option>

                            <option value="contacted">
                                Contacted
                            </option>

                            <option value="in_progress">
                                In progress
                            </option>

                            <option value="closed">
                                Closed
                            </option>
                            </select>

                            <div className="inquiry-status-mobile">
                            <StatusBadge
                                status={inquiry.status}
                            />
                            </div>
                        </td>

                        <td>
                            <button
                            type="button"
                            className="inquiry-delete"
                            disabled={
                                deletingId === inquiry.id
                            }
                            onClick={() =>
                                deleteInquiry(inquiry.id)
                            }
                            aria-label={`Delete inquiry from ${inquiry.name}`}
                            >
                            {deletingId === inquiry.id
                                ? '...'
                                : '×'}
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            )}
            </section>
        </div>
        </AdminLayout>
    );
    }