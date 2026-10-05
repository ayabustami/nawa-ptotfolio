    import { useEffect, useMemo, useState } from 'react';
    import AdminLayout from '../../components/admin/AdminLayout/AdminLayout';
    import './AdminTechnologies.css';

    export default function AdminTechnologies() {
    const [technologies, setTechnologies] = useState([]);
    const [categories, setCategories] = useState([]);

    // Technology form
    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState('');

    // Technology editing
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');

    // Category form
    const [categoryName, setCategoryName] = useState('');

    // Category editing
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');

    const [search, setSearch] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function loadData() {
        try {
        setLoading(true);
        setError('');

        const [
            technologiesResponse,
            categoriesResponse,
        ] = await Promise.all([
            fetch('/api/admin/technologies', {
            credentials: 'include',
            }),
            fetch('/api/admin/technology-categories', {
            credentials: 'include',
            }),
        ]);

        const technologiesData =
            await technologiesResponse.json();

        const categoriesData =
            await categoriesResponse.json();

        if (!technologiesResponse.ok) {
            throw new Error(
            technologiesData.error ||
                'Could not load technologies.'
            );
        }

        if (!categoriesResponse.ok) {
            throw new Error(
            categoriesData.error ||
                'Could not load technology categories.'
            );
        }

        setTechnologies(technologiesData);
        setCategories(categoriesData);

        // Select first category by default
        if (
            categoriesData.length > 0 &&
            !categoryId
        ) {
            setCategoryId(
            String(categoriesData[0].id)
            );
        }
        } catch (err) {
        setError(err.message);
        } finally {
        setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    // =========================================================
    // CATEGORY FUNCTIONS
    // =========================================================

    async function handleAddCategory(event) {
        event.preventDefault();

        const cleanName = categoryName.trim();

        if (!cleanName) {
        setError('Please enter a category name.');
        return;
        }

        try {
        setSaving(true);
        setError('');

        const response = await fetch(
            '/api/admin/technology-categories',
            {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: cleanName,
            }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
            data.error ||
                'Could not add technology category.'
            );
        }

        setCategories((current) =>
            [...current, data].sort(
            (a, b) =>
                a.sortOrder - b.sortOrder ||
                a.name.localeCompare(b.name)
            )
        );

        setCategoryName('');

        // Automatically select the new category
        setCategoryId(String(data.id));
        } catch (err) {
        setError(err.message);
        } finally {
        setSaving(false);
        }
    }

    function startEditingCategory(category) {
        setEditingCategoryId(category.id);
        setEditingCategoryName(category.name);
        setError('');
    }

    function cancelEditingCategory() {
        setEditingCategoryId(null);
        setEditingCategoryName('');
    }

    async function handleUpdateCategory(id) {
        const cleanName =
        editingCategoryName.trim();

        if (!cleanName) {
        setError('Please enter a category name.');
        return;
        }

        try {
        setSaving(true);
        setError('');

        const response = await fetch(
            `/api/admin/technology-categories/${id}`,
            {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: cleanName,
            }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
            data.error ||
                'Could not update technology category.'
            );
        }

        setCategories((current) =>
            current
            .map((category) =>
                category.id === id
                ? data
                : category
            )
            .sort(
                (a, b) =>
                a.sortOrder - b.sortOrder ||
                a.name.localeCompare(b.name)
            )
        );

        // Update displayed category name
        // for existing technologies
        setTechnologies((current) =>
            current.map((technology) =>
            technology.categoryId === id
                ? {
                    ...technology,
                    category: data.name,
                }
                : technology
            )
        );

        cancelEditingCategory();
        } catch (err) {
        setError(err.message);
        } finally {
        setSaving(false);
        }
    }

    async function handleDeleteCategory(id) {
        const category = categories.find(
        (item) => item.id === id
        );

        const technologyCount =
        technologies.filter(
            (technology) =>
            technology.categoryId === id
        ).length;

        if (technologyCount > 0) {
        setError(
            `Cannot delete "${category?.name}" because it is used by ${technologyCount} technology(ies).`
        );

        return;
        }

        const confirmed = window.confirm(
        `Delete "${category?.name || 'this category'}"?`
        );

        if (!confirmed) {
        return;
        }

        try {
        setError('');

        const response = await fetch(
            `/api/admin/technology-categories/${id}`,
            {
            method: 'DELETE',
            credentials: 'include',
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
            data.error ||
                'Could not delete technology category.'
            );
        }

        setCategories((current) =>
            current.filter(
            (category) => category.id !== id
            )
        );

        if (Number(categoryId) === id) {
            const remainingCategories =
            categories.filter(
                (category) => category.id !== id
            );

            setCategoryId(
            remainingCategories.length > 0
                ? String(remainingCategories[0].id)
                : ''
            );
        }

        if (editingCategoryId === id) {
            cancelEditingCategory();
        }
        } catch (err) {
        setError(err.message);
        }
    }

    // =========================================================
    // TECHNOLOGY FUNCTIONS
    // =========================================================

    async function handleAddTechnology(event) {
        event.preventDefault();

        const cleanName = name.trim();

        if (!cleanName) {
        setError('Please enter a technology name.');
        return;
        }

        if (!categoryId) {
        setError('Please select a category.');
        return;
        }

        try {
        setSaving(true);
        setError('');

        const response = await fetch(
            '/api/admin/technologies',
            {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: cleanName,
                categoryId: Number(categoryId),
            }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
            data.error ||
                'Could not add technology.'
            );
        }

        setTechnologies((current) => [
            ...current,
            data,
        ]);

        setName('');
        } catch (err) {
        setError(err.message);
        } finally {
        setSaving(false);
        }
    }

    function startEditingTechnology(technology) {
        setEditingId(technology.id);
        setEditingName(technology.name);
        setEditingCategoryId(
        String(technology.categoryId)
        );
        setError('');
    }

    function cancelEditingTechnology() {
        setEditingId(null);
        setEditingName('');
        setEditingCategoryId('');
    }

    async function handleUpdateTechnology(id) {
        const cleanName =
        editingName.trim();

        if (!cleanName) {
        setError('Please enter a technology name.');
        return;
        }

        if (!editingCategoryId) {
        setError('Please select a category.');
        return;
        }

        try {
        setSaving(true);
        setError('');

        const response = await fetch(
            `/api/admin/technologies/${id}`,
            {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: cleanName,
                categoryId: Number(
                editingCategoryId
                ),
            }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
            data.error ||
                'Could not update technology.'
            );
        }

        setTechnologies((current) =>
            current.map((technology) =>
            technology.id === id
                ? data
                : technology
            )
        );

        cancelEditingTechnology();
        } catch (err) {
        setError(err.message);
        } finally {
        setSaving(false);
        }
    }

    async function handleDeleteTechnology(id) {
        const technology = technologies.find(
        (item) => item.id === id
        );

        const confirmed = window.confirm(
        `Delete "${technology?.name || 'this technology'}"?`
        );

        if (!confirmed) {
        return;
        }

        try {
        setError('');

        const response = await fetch(
            `/api/admin/technologies/${id}`,
            {
            method: 'DELETE',
            credentials: 'include',
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
            data.error ||
                'Could not delete technology.'
            );
        }

        setTechnologies((current) =>
            current.filter(
            (technology) =>
                technology.id !== id
            )
        );

        if (editingId === id) {
            cancelEditingTechnology();
        }
        } catch (err) {
        setError(err.message);
        }
    }

    // =========================================================
    // FILTERING
    // =========================================================

    const filteredTechnologies = useMemo(() => {
        const query =
        search.trim().toLowerCase();

        if (!query) {
        return technologies;
        }

        return technologies.filter(
        (technology) =>
            `${technology.name} ${technology.category}`
            .toLowerCase()
            .includes(query)
        );
    }, [technologies, search]);

    // =========================================================
    // CATEGORY COUNTS
    // =========================================================

    const categoryCounts = useMemo(() => {
        return categories.reduce(
        (result, category) => {
            result[category.id] =
            technologies.filter(
                (technology) =>
                technology.categoryId ===
                category.id
            ).length;

            return result;
        },
        {}
        );
    }, [categories, technologies]);

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <AdminLayout>
        <div className="admin-technologies">

            {/* PAGE HEADER */}
            <div className="admin-page-header">
            <div>
                <span className="admin-eyebrow">
                CONTENT MANAGEMENT
                </span>

                <h1>Technologies</h1>

                <p>
                Manage technology categories and
                the technologies used across the
                NAWA website.
                </p>
            </div>

            <div className="admin-page-count">
                {technologies.length} technologies
            </div>
            </div>

            {/* ================================================= */}
            {/* TECHNOLOGY CATEGORIES */}
            {/* ================================================= */}

            <section className="technology-list-card">
            <div className="technology-list-header">
                <div>
                <span className="admin-eyebrow">
                    TECHNOLOGY STRUCTURE
                </span>

                <h2>Technology categories</h2>
                </div>
            </div>

            {/* Add category */}
            <div className="technology-category-form">
                <form
                onSubmit={handleAddCategory}
                className="category-inline-form"
                >
                <input
                    type="text"
                    value={categoryName}
                    onChange={(event) =>
                    setCategoryName(
                        event.target.value
                    )
                    }
                    placeholder="New category name..."
                    maxLength={100}
                />

                <button
                    type="submit"
                    disabled={saving}
                >
                    {saving
                    ? 'Adding...'
                    : 'Add Category'}
                </button>
                </form>
            </div>

            {/* Categories */}
            {loading ? (
                <div className="admin-empty-state">
                Loading categories...
                </div>
            ) : categories.length === 0 ? (
                <div className="admin-empty-state">
                No technology categories found.
                </div>
            ) : (
                <div className="technology-category-list">
                {categories.map((category) => {
                    const isEditing =
                    editingCategoryId ===
                    category.id;

                    return (
                    <div
                        className="technology-category-row"
                        key={category.id}
                    >
                        {isEditing ? (
                        <>
                            <input
                            type="text"
                            value={
                                editingCategoryName
                            }
                            onChange={(event) =>
                                setEditingCategoryName(
                                event.target.value
                                )
                            }
                            maxLength={100}
                            />

                            <span>
                            {categoryCounts[
                                category.id
                            ] || 0}{' '}
                            technologies
                            </span>

                            <div className="technology-actions">
                            <button
                                type="button"
                                onClick={() =>
                                handleUpdateCategory(
                                    category.id
                                )
                                }
                                disabled={saving}
                            >
                                Save
                            </button>

                            <button
                                type="button"
                                onClick={
                                cancelEditingCategory
                                }
                            >
                                Cancel
                            </button>
                            </div>
                        </>
                        ) : (
                        <>
                            <strong>
                            {category.name}
                            </strong>

                            <span>
                            {categoryCounts[
                                category.id
                            ] || 0}{' '}
                            technologies
                            </span>

                            <div className="technology-actions">
                            <button
                                type="button"
                                onClick={() =>
                                startEditingCategory(
                                    category
                                )
                                }
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                className="danger"
                                onClick={() =>
                                handleDeleteCategory(
                                    category.id
                                )
                                }
                            >
                                Delete
                            </button>
                            </div>
                        </>
                        )}
                    </div>
                    );
                })}
                </div>
            )}
            </section>

            {/* ERROR */}
            {error && (
            <div className="admin-error">
                {error}
            </div>
            )}

            {/* ================================================= */}
            {/* ADD TECHNOLOGY */}
            {/* ================================================= */}

            <section className="technology-form-card">
            <div className="technology-form-header">
                <div>
                <span className="admin-eyebrow">
                    ADD TECHNOLOGY
                </span>

                <h2>New technology</h2>
                </div>
            </div>

            <form
                className="technology-form"
                onSubmit={handleAddTechnology}
            >
                <div className="technology-field">
                <label htmlFor="technology-name">
                    Technology name
                </label>

                <input
                    id="technology-name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                    setName(event.target.value)
                    }
                    placeholder="e.g. Next.js"
                    maxLength={100}
                />
                </div>

                <div className="technology-field">
                <label htmlFor="technology-category">
                    Category
                </label>

                <select
                    id="technology-category"
                    value={categoryId}
                    onChange={(event) =>
                    setCategoryId(
                        event.target.value
                    )
                    }
                    disabled={
                    categories.length === 0
                    }
                >
                    {categories.length === 0 ? (
                    <option value="">
                        No categories available
                    </option>
                    ) : (
                    categories.map((category) => (
                        <option
                        key={category.id}
                        value={category.id}
                        >
                        {category.name}
                        </option>
                    ))
                    )}
                </select>
                </div>

                <button
                className="technology-primary-button"
                type="submit"
                disabled={
                    saving ||
                    categories.length === 0
                }
                >
                {saving
                    ? 'Adding...'
                    : 'Add Technology'}
                </button>
            </form>
            </section>

            {/* ================================================= */}
            {/* ALL TECHNOLOGIES */}
            {/* ================================================= */}

            <section className="technology-list-card">
            <div className="technology-list-header">
                <div>
                <span className="admin-eyebrow">
                    TECHNOLOGY STACK
                </span>

                <h2>All technologies</h2>
                </div>

                <input
                className="technology-search"
                type="search"
                placeholder="Search technologies..."
                value={search}
                onChange={(event) =>
                    setSearch(event.target.value)
                }
                />
            </div>

            {loading ? (
                <div className="admin-empty-state">
                Loading technologies...
                </div>
            ) : filteredTechnologies.length ===
                0 ? (
                <div className="admin-empty-state">
                No technologies found.
                </div>
            ) : (
                <div className="technology-table">

                <div className="technology-table-head">
                    <span>Technology</span>
                    <span>Category</span>
                    <span>Projects</span>
                    <span>Actions</span>
                </div>

                {filteredTechnologies.map(
                    (technology) => {
                    const isEditing =
                        editingId ===
                        technology.id;

                    return (
                        <div
                        className="technology-table-row"
                        key={technology.id}
                        >
                        {isEditing ? (
                            <>
                            <div className="technology-edit-name">
                                <input
                                type="text"
                                value={editingName}
                                onChange={(event) =>
                                    setEditingName(
                                    event.target.value
                                    )
                                }
                                maxLength={100}
                                />
                            </div>

                            <div>
                                <select
                                value={
                                    editingCategoryId
                                }
                                onChange={(event) =>
                                    setEditingCategoryId(
                                    event.target.value
                                    )
                                }
                                >
                                {categories.map(
                                    (category) => (
                                    <option
                                        key={
                                        category.id
                                        }
                                        value={
                                        category.id
                                        }
                                    >
                                        {category.name}
                                    </option>
                                    )
                                )}
                                </select>
                            </div>

                            <span>
                                {
                                technology.projectCount
                                }
                            </span>

                            <div className="technology-actions">
                                <button
                                type="button"
                                onClick={() =>
                                    handleUpdateTechnology(
                                    technology.id
                                    )
                                }
                                disabled={saving}
                                >
                                Save
                                </button>

                                <button
                                type="button"
                                onClick={
                                    cancelEditingTechnology
                                }
                                >
                                Cancel
                                </button>
                            </div>
                            </>
                        ) : (
                            <>
                            <strong>
                                {technology.name}
                            </strong>

                            <span className="technology-category">
                                {technology.category}
                            </span>

                            <span>
                                {
                                technology.projectCount
                                }
                            </span>

                            <div className="technology-actions">
                                <button
                                type="button"
                                onClick={() =>
                                    startEditingTechnology(
                                    technology
                                    )
                                }
                                >
                                Edit
                                </button>

                                <button
                                type="button"
                                className="danger"
                                onClick={() =>
                                    handleDeleteTechnology(
                                    technology.id
                                    )
                                }
                                >
                                Delete
                                </button>
                            </div>
                            </>
                        )}
                        </div>
                    );
                    }
                )}

                </div>
            )}
            </section>

        </div>
        </AdminLayout>
    );
    }