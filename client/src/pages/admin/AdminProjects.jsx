    import { useEffect, useMemo, useState } from 'react';
    import AdminLayout from '../../components/admin/AdminLayout/AdminLayout';
    import './AdminProjects.css';

    const emptyForm = {
    title: '',
    slug: '',
    subtitle: '',
    description: '',
    categoryId: '',
    status: 'draft',
    isFeatured: false,
    sortOrder: 0,
    liveUrl: '',
    githubUrl: '',
    technologies: [],
    features: [],
    media: [],
    };

    function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    export default function AdminProjects() {
    const [projects, setProjects] = useState([]);
    const [categories, setCategories] = useState([]);
    const [technologies, setTechnologies] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [editorOpen, setEditorOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState(emptyForm);

    const filteredProjects = useMemo(() => {
        const query = search.trim().toLowerCase();

        return projects.filter((project) => {
        const matchesStatus =
            statusFilter === 'all' ||
            project.status === statusFilter;

        const matchesSearch =
            !query ||
            project.title?.toLowerCase().includes(query) ||
            project.slug?.toLowerCase().includes(query) ||
            project.category?.toLowerCase().includes(query);

        return matchesStatus && matchesSearch;
        });
    }, [projects, search, statusFilter]);

    async function apiRequest(url, options = {}) {
        const response = await fetch(url, {
        credentials: 'include',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        });

        const data = await response.json();

        if (!response.ok) {
        throw new Error(
            data.error || 'Something went wrong.'
        );
        }

        return data;
    }

    async function loadData() {
        setLoading(true);
        setError('');

        try {
        const [
            projectsData,
            categoriesData,
            technologiesData,
        ] = await Promise.all([
            apiRequest('/api/admin/projects'),
            apiRequest('/api/admin/categories'),
            apiRequest('/api/admin/technologies'),
        ]);

        setProjects(projectsData);
        setCategories(categoriesData);
        setTechnologies(technologiesData);
        } catch (error) {
        setError(error.message);
        } finally {
        setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    function openCreate() {
        setEditingId(null);
        setForm(emptyForm);
        setError('');
        setNotice('');
        setEditorOpen(true);
    }

    async function openEdit(projectId) {
        setError('');
        setNotice('');

        try {
        const project = await apiRequest(
            `/api/admin/projects/${projectId}`
        );

        setEditingId(project.id);

        setForm({
            title: project.title || '',
            slug: project.slug || '',
            subtitle: project.subtitle || '',
            description: project.description || '',
            categoryId: project.categoryId ?? '',
            status: project.status || 'draft',
            isFeatured: project.isFeatured === true,
            sortOrder: project.sortOrder ?? 0,
            liveUrl: project.liveUrl || '',
            githubUrl: project.githubUrl || '',
            technologies:
            project.technologies?.map(
                (item) => item.id
            ) || [],
            features:
            project.features?.map((item) => ({
                label: item.label || '',
                isAi: item.isAi === true,
            })) || [],
            media:
            project.media?.map((item) => ({
                url: item.url || '',
                alt: item.alt || '',
                kind: item.kind || 'image',
            })) || [],
        });

        setEditorOpen(true);
        } catch (error) {
        setError(error.message);
        }
    }

    function updateField(field, value) {
        setForm((current) => ({
        ...current,
        [field]: value,
        }));
    }

    function updateTitle(value) {
        setForm((current) => ({
        ...current,
        title: value,
        slug:
            editingId || current.slug
            ? current.slug
            : slugify(value),
        }));
    }

    function toggleTechnology(id) {
        setForm((current) => {
        const exists = current.technologies.includes(id);

        return {
            ...current,
            technologies: exists
            ? current.technologies.filter(
                (item) => item !== id
                )
            : [...current.technologies, id],
        };
        });
    }

    function addFeature() {
        setForm((current) => ({
        ...current,
        features: [
            ...current.features,
            {
            label: '',
            isAi: false,
            },
        ],
        }));
    }

    function updateFeature(index, field, value) {
        setForm((current) => ({
        ...current,
        features: current.features.map(
            (feature, featureIndex) =>
            featureIndex === index
                ? {
                    ...feature,
                    [field]: value,
                }
                : feature
        ),
        }));
    }

    function removeFeature(index) {
        setForm((current) => ({
        ...current,
        features: current.features.filter(
            (_, featureIndex) =>
            featureIndex !== index
        ),
        }));
    }

    function addMedia() {
        setForm((current) => ({
        ...current,
        media: [
            ...current.media,
            {
            url: '',
            alt: '',
            kind: 'image',
            },
        ],
        }));
    }

    function updateMedia(index, field, value) {
        setForm((current) => ({
        ...current,
        media: current.media.map(
            (item, mediaIndex) =>
            mediaIndex === index
                ? {
                    ...item,
                    [field]: value,
                }
                : item
        ),
        }));
    }

    function removeMedia(index) {
        setForm((current) => ({
        ...current,
        media: current.media.filter(
            (_, mediaIndex) =>
            mediaIndex !== index
        ),
        }));
    }

    async function handleSave(event) {
        event.preventDefault();

        setSaving(true);
        setError('');
        setNotice('');

        try {
        const payload = {
            ...form,
            slug: slugify(form.slug || form.title),
            categoryId:
            form.categoryId === ''
                ? null
                : Number(form.categoryId),
            sortOrder: Number(form.sortOrder) || 0,
        };

        const url = editingId
            ? `/api/admin/projects/${editingId}`
            : '/api/admin/projects';

        const method = editingId ? 'PUT' : 'POST';

        await apiRequest(url, {
            method,
            body: JSON.stringify(payload),
        });

        await loadData();

        setEditorOpen(false);
        setEditingId(null);
        setForm(emptyForm);

        setNotice(
            editingId
            ? 'Project updated successfully.'
            : 'Project created successfully.'
        );
        } catch (error) {
        setError(error.message);
        } finally {
        setSaving(false);
        }
    }

    async function deleteProject(project) {
        const confirmed = window.confirm(
        `Delete "${project.title}"?\n\nThis will also remove its features, technologies and media relationships.`
        );

        if (!confirmed) return;

        setError('');
        setNotice('');

        try {
        await apiRequest(
            `/api/admin/projects/${project.id}`,
            {
            method: 'DELETE',
            }
        );

        setProjects((current) =>
            current.filter(
            (item) => item.id !== project.id
            )
        );

        setNotice('Project deleted successfully.');
        } catch (error) {
        setError(error.message);
        }
    }

    async function togglePublish(project) {
        setError('');
        setNotice('');

        try {
        const details = await apiRequest(
            `/api/admin/projects/${project.id}`
        );

        await apiRequest(
            `/api/admin/projects/${project.id}`,
            {
            method: 'PUT',
            body: JSON.stringify({
                title: details.title,
                slug: details.slug,
                subtitle: details.subtitle || '',
                description: details.description || '',
                categoryId: details.categoryId ?? null,
                status:
                details.status === 'published'
                    ? 'draft'
                    : 'published',
                isFeatured: details.isFeatured === true,
                sortOrder: details.sortOrder ?? 0,
                liveUrl: details.liveUrl || '',
                githubUrl: details.githubUrl || '',
                technologies:
                details.technologies?.map(
                    (item) => item.id
                ) || [],
                features:
                details.features?.map((item) => ({
                    label: item.label,
                    isAi: item.isAi === true,
                })) || [],
                media:
                details.media?.map((item) => ({
                    url: item.url,
                    alt: item.alt || '',
                    kind: item.kind || 'image',
                })) || [],
            }),
            }
        );

        await loadData();

        setNotice(
            project.status === 'published'
            ? 'Project moved to draft.'
            : 'Project published successfully.'
        );
        } catch (error) {
        setError(error.message);
        }
    }

    return (
        <AdminLayout title="Projects">
        <div className="admin-projects">
            <header className="admin-projects__header">
            <div>
                <p className="admin-projects__eyebrow">
                CONTENT MANAGEMENT
                </p>

                <h1>Projects</h1>

                <p className="admin-projects__intro">
                Manage the work displayed across
                the NAWA Technology website.
                </p>
            </div>

            <button
                type="button"
                className="admin-projects__create"
                onClick={openCreate}
            >
                <span>+</span>
                New Project
            </button>
            </header>

            {error && (
            <div className="admin-projects__alert admin-projects__alert--error">
                {error}
            </div>
            )}

            {notice && (
            <div className="admin-projects__alert admin-projects__alert--success">
                {notice}
            </div>
            )}

            <section className="admin-projects__toolbar">
            <div className="admin-projects__search">
                <span>⌕</span>

                <input
                value={search}
                onChange={(event) =>
                    setSearch(event.target.value)
                }
                placeholder="Search projects..."
                />
            </div>

            <div className="admin-projects__filters">
                {[
                ['all', 'All'],
                ['published', 'Published'],
                ['draft', 'Drafts'],
                ].map(([value, label]) => (
                <button
                    key={value}
                    type="button"
                    className={
                    statusFilter === value
                        ? 'active'
                        : ''
                    }
                    onClick={() =>
                    setStatusFilter(value)
                    }
                >
                    {label}
                </button>
                ))}
            </div>
            </section>

            <section className="admin-projects__table-wrap">
            {loading ? (
                <div className="admin-projects__loading">
                <span />
                Loading projects...
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="admin-projects__empty">
                <span>◫</span>

                <h2>No projects found.</h2>

                <p>
                    Create your first project or
                    adjust the current filter.
                </p>

                <button
                    type="button"
                    onClick={openCreate}
                >
                    Create Project
                </button>
                </div>
            ) : (
                <div className="admin-projects__table">
                <div className="admin-projects__row admin-projects__row--head">
                    <span>PROJECT</span>
                    <span>STATUS</span>
                    <span>CATEGORY</span>
                    <span>TECHNOLOGIES</span>
                    <span>ACTIONS</span>
                </div>

                {filteredProjects.map((project) => (
                    <article
                    className="admin-projects__row"
                    key={project.id}
                    >
                    <div className="admin-projects__project">
                        <div className="admin-projects__project-index">
                        {String(project.id).padStart(
                            2,
                            '0'
                        )}
                        </div>

                        <div>
                        <div className="admin-projects__project-title">
                            {project.title}

                            {project.isFeatured && (
                            <span className="admin-projects__featured">
                                FEATURED
                            </span>
                            )}
                        </div>

                        <p>
                            /projects/{project.slug}
                        </p>
                        </div>
                    </div>

                    <div>
                        <span
                        className={`admin-projects__status admin-projects__status--${project.status}`}
                        >
                        <span />
                        {project.status}
                        </span>
                    </div>

                    <div className="admin-projects__category">
                        {project.category ||
                        'Uncategorized'}
                    </div>

                    <div className="admin-projects__technologies">
                        {project.technologies?.length ? (
                        project.technologies
                            .slice(0, 3)
                            .map((technology) => (
                            <span key={technology}>
                                {technology}
                            </span>
                            ))
                        ) : (
                        <span className="muted">
                            No technologies
                        </span>
                        )}

                        {project.technologies?.length >
                        3 && (
                        <span className="more">
                            +
                            {project.technologies
                            .length - 3}
                        </span>
                        )}
                    </div>

                    <div className="admin-projects__actions">
                        <button
                        type="button"
                        onClick={() =>
                            openEdit(project.id)
                        }
                        >
                        Edit
                        </button>

                        <button
                        type="button"
                        onClick={() =>
                            togglePublish(project)
                        }
                        >
                        {project.status ===
                        'published'
                            ? 'Unpublish'
                            : 'Publish'}
                        </button>

                        <button
                        type="button"
                        className="danger"
                        onClick={() =>
                            deleteProject(project)
                        }
                        >
                        Delete
                        </button>
                    </div>
                    </article>
                ))}
                </div>
            )}
            </section>

            {editorOpen && (
            <div
                className="admin-projects__overlay"
                onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    setEditorOpen(false);
                }
                }}
            >
                <section className="admin-projects__editor">
                <div className="admin-projects__editor-header">
                    <div>
                    <p>
                        {editingId
                        ? 'EDIT PROJECT'
                        : 'NEW PROJECT'}
                    </p>

                    <h2>
                        {editingId
                        ? 'Project details'
                        : 'Create a project'}
                    </h2>
                    </div>

                    <button
                    type="button"
                    onClick={() =>
                        setEditorOpen(false)
                    }
                    className="admin-projects__close"
                    >
                    ×
                    </button>
                </div>

                <form onSubmit={handleSave}>
                    <div className="admin-projects__editor-body">
                    <section className="editor-section">
                        <div className="editor-section__heading">
                        <span>01</span>

                        <div>
                            <h3>Basic information</h3>

                            <p>
                            The core information shown
                            across the website.
                            </p>
                        </div>
                        </div>

                        <div className="editor-grid">
                        <label>
                            <span>Title *</span>

                            <input
                            value={form.title}
                            onChange={(event) =>
                                updateTitle(
                                event.target.value
                                )
                            }
                            placeholder="LUMIERE"
                            required
                            />
                        </label>

                        <label>
                            <span>Slug *</span>

                            <input
                            value={form.slug}
                            onChange={(event) =>
                                updateField(
                                'slug',
                                event.target.value
                                )
                            }
                            placeholder="lumiere"
                            required
                            />
                        </label>

                        <label className="full">
                            <span>Subtitle</span>

                            <input
                            value={form.subtitle}
                            onChange={(event) =>
                                updateField(
                                'subtitle',
                                event.target.value
                                )
                            }
                            placeholder="Luxury Beauty E-commerce Platform"
                            />
                        </label>

                        <label className="full">
                            <span>Description</span>

                            <textarea
                            value={form.description}
                            onChange={(event) =>
                                updateField(
                                'description',
                                event.target.value
                                )
                            }
                            rows="5"
                            placeholder="Describe what the project does..."
                            />
                        </label>
                        </div>
                    </section>

                    <section className="editor-section">
                        <div className="editor-section__heading">
                        <span>02</span>

                        <div>
                            <h3>Publishing</h3>

                            <p>
                            Control how the project
                            appears publicly.
                            </p>
                        </div>
                        </div>

                        <div className="editor-grid">
                        <label>
                            <span>Status</span>

                            <select
                            value={form.status}
                            onChange={(event) =>
                                updateField(
                                'status',
                                event.target.value
                                )
                            }
                            >
                            <option value="draft">
                                Draft
                            </option>

                            <option value="published">
                                Published
                            </option>
                            </select>
                        </label>

                        <label>
                            <span>Category</span>

                            <select
                            value={form.categoryId}
                            onChange={(event) =>
                                updateField(
                                'categoryId',
                                event.target.value
                                )
                            }
                            >
                            <option value="">
                                No category
                            </option>

                            {categories.map(
                                (category) => (
                                <option
                                    key={category.id}
                                    value={category.id}
                                >
                                    {category.name}
                                </option>
                                )
                            )}
                            </select>
                        </label>

                        <label>
                            <span>Sort order</span>

                            <input
                            type="number"
                            min="0"
                            value={form.sortOrder}
                            onChange={(event) =>
                                updateField(
                                'sortOrder',
                                event.target.value
                                )
                            }
                            />
                        </label>

                        <label className="editor-checkbox">
                            <input
                            type="checkbox"
                            checked={form.isFeatured}
                            onChange={(event) =>
                                updateField(
                                'isFeatured',
                                event.target.checked
                                )
                            }
                            />

                            <span>
                            <strong>
                                Featured project
                            </strong>

                            <small>
                                Give this project priority
                                on the public Work section.
                            </small>
                            </span>
                        </label>
                        </div>
                    </section>

                    <section className="editor-section">
                        <div className="editor-section__heading">
                        <span>03</span>

                        <div>
                            <h3>Links</h3>

                            <p>
                            Optional public project
                            destinations.
                            </p>
                        </div>
                        </div>

                        <div className="editor-grid">
                        <label>
                            <span>
                            Live project URL
                            </span>

                            <input
                            type="url"
                            value={form.liveUrl}
                            onChange={(event) =>
                                updateField(
                                'liveUrl',
                                event.target.value
                                )
                            }
                            placeholder="https://..."
                            />
                        </label>

                        <label>
                            <span>GitHub URL</span>

                            <input
                            type="url"
                            value={form.githubUrl}
                            onChange={(event) =>
                                updateField(
                                'githubUrl',
                                event.target.value
                                )
                            }
                            placeholder="https://github.com/..."
                            />
                        </label>
                        </div>
                    </section>

                    <section className="editor-section">
                        <div className="editor-section__heading">
                        <span>04</span>

                        <div>
                            <h3>Technologies</h3>

                            <p>
                            Select technologies actually
                            used by this project.
                            </p>
                        </div>
                        </div>

                        <div className="technology-picker">
                        {technologies.length === 0 ? (
                            <p className="editor-empty">
                            No technologies available.
                            </p>
                        ) : (
                            technologies.map(
                            (technology) => {
                                const selected =
                                form.technologies.includes(
                                    technology.id
                                );

                                return (
                                <button
                                    type="button"
                                    key={technology.id}
                                    className={
                                    selected
                                        ? 'selected'
                                        : ''
                                    }
                                    onClick={() =>
                                    toggleTechnology(
                                        technology.id
                                    )
                                    }
                                >
                                    <span>
                                    {selected
                                        ? '✓'
                                        : '+'}
                                    </span>

                                    {technology.name}
                                </button>
                                );
                            }
                            )
                        )}
                        </div>
                    </section>

                    <section className="editor-section">
                        <div className="editor-section__heading">
                        <span>05</span>

                        <div>
                            <h3>Features</h3>

                            <p>
                            Highlight the project's
                            capabilities.
                            </p>
                        </div>
                        </div>

                        <div className="repeatable-list">
                        {form.features.map(
                            (feature, index) => (
                            <div
                                className="repeatable-item"
                                key={index}
                            >
                                <input
                                value={feature.label}
                                onChange={(event) =>
                                    updateFeature(
                                    index,
                                    'label',
                                    event.target.value
                                    )
                                }
                                placeholder="AI Beauty Concierge"
                                />

                                <label className="mini-checkbox">
                                <input
                                    type="checkbox"
                                    checked={
                                    feature.isAi
                                    }
                                    onChange={(event) =>
                                    updateFeature(
                                        index,
                                        'isAi',
                                        event.target
                                        .checked
                                    )
                                    }
                                />

                                AI
                                </label>

                                <button
                                type="button"
                                onClick={() =>
                                    removeFeature(
                                    index
                                    )
                                }
                                >
                                ×
                                </button>
                            </div>
                            )
                        )}

                        <button
                            type="button"
                            className="add-row"
                            onClick={addFeature}
                        >
                            + Add feature
                        </button>
                        </div>
                    </section>

                    <section className="editor-section">
                        <div className="editor-section__heading">
                        <span>06</span>

                        <div>
                            <h3>Media</h3>

                            <p>
                            Store image or media URLs.
                            Files are not stored in
                            PostgreSQL.
                            </p>
                        </div>
                        </div>

                        <div className="repeatable-list">
                        {form.media.map(
                            (item, index) => (
                            <div
                                className="media-item"
                                key={index}
                            >
                                <input
                                value={item.url}
                                onChange={(event) =>
                                    updateMedia(
                                    index,
                                    'url',
                                    event.target.value
                                    )
                                }
                                placeholder="https://..."
                                />

                                <input
                                value={item.alt}
                                onChange={(event) =>
                                    updateMedia(
                                    index,
                                    'alt',
                                    event.target.value
                                    )
                                }
                                placeholder="Alt text"
                                />

                                <select
                                value={item.kind}
                                onChange={(event) =>
                                    updateMedia(
                                    index,
                                    'kind',
                                    event.target.value
                                    )
                                }
                                >
                                <option value="image">
                                    Image
                                </option>

                                <option value="video">
                                    Video
                                </option>
                                </select>

                                <button
                                type="button"
                                onClick={() =>
                                    removeMedia(
                                    index
                                    )
                                }
                                >
                                ×
                                </button>
                            </div>
                            )
                        )}

                        <button
                            type="button"
                            className="add-row"
                            onClick={addMedia}
                        >
                            + Add media
                        </button>
                        </div>
                    </section>
                    </div>

                    <div className="admin-projects__editor-footer">
                    <button
                        type="button"
                        onClick={() =>
                        setEditorOpen(false)
                        }
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={saving}
                    >
                        {saving
                        ? 'Saving...'
                        : editingId
                        ? 'Save changes'
                        : 'Create project'}
                    </button>
                    </div>
                </form>
                </section>
            </div>
            )}
        </div>
        </AdminLayout>
    );
    }