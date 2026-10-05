    import { useEffect, useState } from 'react';
    import AdminLayout from '../../components/admin/AdminLayout/AdminLayout';
    import './AdminCategories.css';

    export default function AdminCategories() {
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const [name, setName] = useState('');
    const [editingId, setEditingId] = useState(null);

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

    async function loadCategories() {
        setLoading(true);
        setError('');

        try {
        const data = await apiRequest(
            '/api/admin/categories'
        );

        setCategories(data);
        } catch (error) {
        setError(error.message);
        } finally {
        setLoading(false);
        }
    }

    useEffect(() => {
        loadCategories();
    }, []);

    function startCreate() {
        setEditingId(null);
        setName('');
        setError('');
        setNotice('');
    }

    function startEdit(category) {
        setEditingId(category.id);
        setName(category.name);
        setError('');
        setNotice('');
    }

    function cancelEdit() {
        setEditingId(null);
        setName('');
        setError('');
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const cleanName = name.trim();

        if (!cleanName) {
        setError('Category name is required.');
        return;
        }

        setSaving(true);
        setError('');
        setNotice('');

        try {
        const url = editingId
            ? `/api/admin/categories/${editingId}`
            : '/api/admin/categories';

        const method = editingId
            ? 'PUT'
            : 'POST';

        await apiRequest(url, {
            method,
            body: JSON.stringify({
            name: cleanName,
            }),
        });

        await loadCategories();

        if (editingId) {
            setNotice(
            'Category updated successfully.'
            );
        } else {
            setNotice(
            'Category created successfully.'
            );
        }

        setName('');
        setEditingId(null);
        } catch (error) {
        setError(error.message);
        } finally {
        setSaving(false);
        }
    }

    async function deleteCategory(category) {
        const message =
        category.projectCount > 0
            ? `"${category.name}" is currently used by ${category.projectCount} project${category.projectCount === 1 ? '' : 's'}.\n\nDeleting it will remove the category from those projects. Continue?`
            : `Delete "${category.name}"?`;

        const confirmed = window.confirm(message);

        if (!confirmed) return;

        setError('');
        setNotice('');

        try {
        await apiRequest(
            `/api/admin/categories/${category.id}`,
            {
            method: 'DELETE',
            }
        );

        setCategories((current) =>
            current.filter(
            (item) => item.id !== category.id
            )
        );

        if (editingId === category.id) {
            cancelEdit();
        }

        setNotice(
            'Category deleted successfully.'
        );
        } catch (error) {
        setError(error.message);
        }
    }

    return (
        <AdminLayout title="Categories">
        <div className="admin-categories">
            <header className="admin-categories__header">
            <div>
                <p className="admin-categories__eyebrow">
                CONTENT STRUCTURE
                </p>

                <h1>Categories</h1>

                <p className="admin-categories__intro">
                Organize the projects displayed across
                the NAWA Technology website.
                </p>
            </div>
            </header>

            {error && (
            <div className="admin-categories__alert admin-categories__alert--error">
                {error}
            </div>
            )}

            {notice && (
            <div className="admin-categories__alert admin-categories__alert--success">
                {notice}
            </div>
            )}

            <div className="admin-categories__layout">
            <section className="admin-categories__panel">
                <div className="admin-categories__panel-header">
                <div>
                    <p>
                    {editingId
                        ? 'EDIT CATEGORY'
                        : 'NEW CATEGORY'}
                    </p>

                    <h2>
                    {editingId
                        ? 'Update category'
                        : 'Create a category'}
                    </h2>
                </div>
                </div>

                <form
                className="admin-categories__form"
                onSubmit={handleSubmit}
                >
                <label>
                    <span>Category name</span>

                    <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                        setName(event.target.value)
                    }
                    placeholder="E-commerce"
                    maxLength="100"
                    autoComplete="off"
                    />
                </label>

                <div className="admin-categories__form-actions">
                    {editingId && (
                    <button
                        type="button"
                        className="secondary"
                        onClick={cancelEdit}
                    >
                        Cancel
                    </button>
                    )}

                    <button
                    type="submit"
                    disabled={saving}
                    >
                    {saving
                        ? 'Saving...'
                        : editingId
                        ? 'Save changes'
                        : 'Add category'}
                    </button>
                </div>
                </form>
            </section>

            <section className="admin-categories__panel admin-categories__list-panel">
                <div className="admin-categories__panel-header">
                <div>
                    <p>CATEGORY LIBRARY</p>

                    <h2>
                    {categories.length}{' '}
                    {categories.length === 1
                        ? 'category'
                        : 'categories'}
                    </h2>
                </div>
                </div>

                {loading ? (
                <div className="admin-categories__loading">
                    <span />
                    Loading categories...
                </div>
                ) : categories.length === 0 ? (
                <div className="admin-categories__empty">
                    <span>◇</span>

                    <h3>No categories yet.</h3>

                    <p>
                    Create your first category to
                    organize your projects.
                    </p>
                </div>
                ) : (
                <div className="admin-categories__list">
                    {categories.map((category, index) => (
                    <article
                        className="admin-category"
                        key={category.id}
                    >
                        <div className="admin-category__index">
                        {String(index + 1).padStart(
                            2,
                            '0'
                        )}
                        </div>

                        <div className="admin-category__info">
                        <h3>{category.name}</h3>

                        <p>
                            {category.projectCount}{' '}
                            {category.projectCount === 1
                            ? 'project'
                            : 'projects'}
                        </p>
                        </div>

                        <div className="admin-category__actions">
                        <button
                            type="button"
                            onClick={() =>
                            startEdit(category)
                            }
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            className="danger"
                            onClick={() =>
                            deleteCategory(category)
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
            </div>
        </div>
        </AdminLayout>
    );
    }