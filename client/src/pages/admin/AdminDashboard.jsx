    import AdminLayout from '../../components/admin/AdminLayout/AdminLayout';
    import './AdminDashboard.css';

    export default function AdminDashboard() {
    return (
        <AdminLayout title="Overview">
        <section className="admin-content">
            <div className="admin-welcome">
            <div>
                <p className="admin-welcome__eyebrow">
                PRIVATE WORKSPACE
                </p>

                <h2>
                Good to see you<span>.</span>
                </h2>

                <p>
                Manage the content and digital work behind
                NAWA Technology.
                </p>
            </div>

            <div className="admin-welcome__mark">
                N
            </div>
            </div>

            <div className="admin-stats">
            <article className="admin-stat">
                <span className="admin-stat__label">
                PROJECTS
                </span>

                <strong>—</strong>

                <span className="admin-stat__note">
                Manage your work
                </span>
            </article>

            <article className="admin-stat">
                <span className="admin-stat__label">
                INQUIRIES
                </span>

                <strong>—</strong>

                <span className="admin-stat__note">
                Client conversations
                </span>
            </article>

            <article className="admin-stat">
                <span className="admin-stat__label">
                TECHNOLOGIES
                </span>

                <strong>—</strong>

                <span className="admin-stat__note">
                Your technology stack
                </span>
            </article>
            </div>

            <section className="admin-quick">
            <div className="admin-section-heading">
                <div>
                <p>QUICK ACCESS</p>
                <h3>Workspace</h3>
                </div>
            </div>

            <div className="admin-quick-grid">
                <a
                href="/admin/projects"
                className="admin-quick-card"
                >
                <span className="admin-quick-card__number">
                    01
                </span>

                <div>
                    <h4>Projects</h4>
                    <p>
                    Add, edit and publish your projects.
                    </p>
                </div>

                <span className="admin-quick-card__arrow">
                    →
                </span>
                </a>

                <a
                href="/admin/inquiries"
                className="admin-quick-card"
                >
                <span className="admin-quick-card__number">
                    02
                </span>

                <div>
                    <h4>Inquiries</h4>
                    <p>
                    Review messages and business conversations.
                    </p>
                </div>

                <span className="admin-quick-card__arrow">
                    →
                </span>
                </a>

                <a
                href="/admin/technologies"
                className="admin-quick-card"
                >
                <span className="admin-quick-card__number">
                    03
                </span>

                <div>
                    <h4>Technologies</h4>
                    <p>
                    Maintain the technology library.
                    </p>
                </div>

                <span className="admin-quick-card__arrow">
                    →
                </span>
                </a>
            </div>
            </section>
        </section>
        </AdminLayout>
    );
    }