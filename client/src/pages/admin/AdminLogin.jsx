    import { useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import './AdminLogin.css';

    export default function AdminLogin() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
            email,
            password,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
            data.error || 'Unable to sign in.'
            );
        }

        navigate('/admin', { replace: true });
        } catch (error) {
        setError(error.message);
        } finally {
        setLoading(false);
        }
    }

    return (
        <main className="admin-login">
        <div className="admin-login__noise" />

        <section className="admin-login__visual">
            <div className="admin-login__brand">
            <span className="admin-login__brand-mark">
                N
            </span>

            <span className="admin-login__brand-name">
                NAWA
            </span>
            </div>

            <div className="admin-login__visual-content">
            <p className="admin-login__eyebrow">
                NAWA TECHNOLOGY
            </p>

            <h1>
                Build what
                <br />
                <span>matters.</span>
            </h1>

            <p className="admin-login__visual-description">
                A private workspace for managing NAWA's
                digital products, projects, and business
                inquiries.
            </p>
            </div>

            <div className="admin-login__visual-footer">
            <span>SOFTWARE</span>
            <span>AI</span>
            <span>DIGITAL PRODUCTS</span>
            </div>
        </section>

        <section className="admin-login__panel">
            <div className="admin-login__panel-inner">
            <div className="admin-login__mobile-brand">
                <span className="admin-login__brand-mark">
                N
                </span>

                <span className="admin-login__brand-name">
                NAWA
                </span>
            </div>

            <div className="admin-login__header">
                <p className="admin-login__eyebrow">
                PRIVATE ACCESS
                </p>

                <h2>Welcome back.</h2>

                <p>
                Sign in to access the NAWA Technology
                workspace.
                </p>
            </div>

            <form
                className="admin-login__form"
                onSubmit={handleSubmit}
            >
                <div className="admin-login__field">
                <label htmlFor="admin-email">
                    Email address
                </label>

                <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                    setEmail(event.target.value)
                    }
                    autoComplete="username"
                    placeholder="admin@nawa.tech.com"
                    required
                />
                </div>

                <div className="admin-login__field">
                <div className="admin-login__label-row">
                    <label htmlFor="admin-password">
                    Password
                    </label>
                </div>

                <div className="admin-login__password">
                    <input
                    id="admin-password"
                    type={
                        showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={password}
                    onChange={(event) =>
                        setPassword(event.target.value)
                    }
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    required
                    />

                    <button
                    type="button"
                    className="admin-login__password-toggle"
                    onClick={() =>
                        setShowPassword(
                        (current) => !current
                        )
                    }
                    aria-label={
                        showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                    >
                    {showPassword ? 'HIDE' : 'SHOW'}
                    </button>
                </div>
                </div>

                {error && (
                <div className="admin-login__error">
                    <span className="admin-login__error-dot" />
                    <span>{error}</span>
                </div>
                )}

                <button
                type="submit"
                className="admin-login__submit"
                disabled={loading}
                >
                <span>
                    {loading
                    ? 'AUTHENTICATING'
                    : 'SIGN IN'}
                </span>

                {!loading && (
                    <span className="admin-login__arrow">
                    →
                    </span>
                )}
                </button>
            </form>

            <div className="admin-login__footer">
                <span>
                Authorized access only.
                </span>

                <span>
                © {new Date().getFullYear()} NAWA
                Technology
                </span>
            </div>
            </div>
        </section>
        </main>
    );
    }