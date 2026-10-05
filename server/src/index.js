import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import { verifyPassword } from './auth.js';
import {
  createAdminSession,
  requireAdmin,
  deleteAdminSession,
  getSessionCookieName
} from './adminAuth.js';

const app = express();
app.set('trust proxy', 1);
const origins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: origins.length ? origins : false }));
app.use(express.json({ limit: '20kb' }));

const PROJECTS_SQL = `
  SELECT
    p.id,
    p.slug,
    p.title,
    p.subtitle,
    p.description,
    p.is_featured,
    p.sort_order,
    p.live_url AS "liveUrl",
    p.github_url AS "githubUrl",
    c.name AS category,

    COALESCE(
      (
        SELECT json_agg(
          t.name
          ORDER BY pt.sort_order
        )
        FROM project_technologies pt
        JOIN technologies t
          ON t.id = pt.technology_id
        WHERE pt.project_id = p.id
      ),
      '[]'
    ) AS technologies,

    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'label', f.label,
            'isAi', f.is_ai
          )
          ORDER BY f.sort_order
        )
        FROM project_features f
        WHERE f.project_id = p.id
      ),
      '[]'
    ) AS features,

    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'url', m.url,
            'alt', m.alt,
            'kind', m.kind
          )
          ORDER BY m.sort_order
        )
        FROM project_media m
        WHERE m.project_id = p.id
      ),
      '[]'
    ) AS media

  FROM projects p
  LEFT JOIN project_categories c
    ON c.id = p.category_id

  WHERE 1 = 1
`;

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/projects', async (req, res) => {
  try {
    const featured =
    req.query.featured === 'true'
      ? ' AND p.is_featured = TRUE'
      : '';

    const { rows } = await pool.query(
      `
        ${PROJECTS_SQL}
        ${featured}
        ORDER BY
          p.is_featured DESC,
          p.sort_order ASC,
          p.created_at ASC,
          p.id ASC
      `
    );
    res.json({ projects: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load projects.' });
  }
});

app.get('/api/projects/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
        ${PROJECTS_SQL}
        AND p.slug = $1
      `,
      [req.params.slug]
    );

    if (!rows[0]) {
      return res.status(404).json({
        error: 'Project not found.'
      });
    }

    res.json({
      project: rows[0]
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Could not load project.'
    });
  }
});

// Basic in-memory rate limit: 5 inquiries per IP per 10 minutes
const hits = new Map();
setInterval(() => {
  const now = Date.now();

  for (const [ip, timestamps] of hits) {
    if (timestamps.every((timestamp) => now - timestamp >= 600000)) {
      hits.delete(ip);
    }
  }
}, 600000).unref();
const limited = (ip) => {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 600000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
};

app.post('/api/contact', async (req, res) => {
  const { name, email, company, message, website } = req.body || {};
  if (website) return res.status(201).json({ ok: true }); // honeypot: silently drop bots
  if (limited(req.ip)) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const data = { name: clean(name, 120), email: clean(email, 200), company: clean(company, 160), message: clean(message, 4000) };
  if (!data.name || !data.message) return res.status(400).json({ error: 'Name and message are required.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return res.status(400).json({ error: 'Enter a valid email address.' });

  try {
    await pool.query(
      'INSERT INTO contact_inquiries (name, email, company, message) VALUES ($1,$2,$3,$4)',
      [data.name, data.email, data.company || null, data.message]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save your message. Please try again.' });
  }
});
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const cleanEmail =
      typeof email === 'string'
        ? email.trim().toLowerCase()
        : '';

    if (!cleanEmail || typeof password !== 'string') {
      return res.status(400).json({
        error: 'Email and password are required.'
      });
    }

    const adminEmail =
      (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

    const passwordHash =
      process.env.ADMIN_PASSWORD_HASH || '';

    if (!adminEmail || !passwordHash) {
      console.error('Admin credentials are not configured.');
      return res.status(500).json({
        error: 'Admin authentication is not configured.'
      });
    }

    if (cleanEmail !== adminEmail) {
      return res.status(401).json({
        error: 'Invalid email or password.'
      });
    }

    const validPassword = await verifyPassword(
      password,
      passwordHash
    );

    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid email or password.'
      });
    }

    const { token, expiresAt } =
      await createAdminSession(adminEmail);

    const secure =
      process.env.NODE_ENV === 'production'
        ? ' Secure;'
        : '';

    res.setHeader(
      'Set-Cookie',
      `${getSessionCookieName()}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200;${secure}`
    );

    res.json({
      ok: true,
      admin: {
        email: adminEmail
      },
      expiresAt
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Could not log in.'
    });
  }
});
app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({
    authenticated: true,
    admin: {
      email: req.admin.email
    }
  });
});
app.post('/api/admin/logout', deleteAdminSession);
// ============================================================
// ADMIN PROJECTS MANAGEMENT
// ============================================================

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function validateProjectPayload(body = {}) {
  const title =
    typeof body.title === 'string'
      ? body.title.trim()
      : '';

  const slug = normalizeSlug(body.slug || title);

  const subtitle =
    typeof body.subtitle === 'string'
      ? body.subtitle.trim()
      : '';

  const description =
    typeof body.description === 'string'
      ? body.description.trim()
      : '';

  const status =
    body.status === 'published'
      ? 'published'
      : 'draft';

  const categoryId =
    body.categoryId === '' ||
    body.categoryId === null ||
    body.categoryId === undefined
      ? null
      : Number(body.categoryId);

  const sortOrder =
    Number.isFinite(Number(body.sortOrder))
      ? Number(body.sortOrder)
      : 0;

  const isFeatured =
    body.isFeatured === true;

  const liveUrl =
    typeof body.liveUrl === 'string'
      ? body.liveUrl.trim()
      : '';

  const githubUrl =
    typeof body.githubUrl === 'string'
      ? body.githubUrl.trim()
      : '';

  const technologies = Array.isArray(body.technologies)
    ? body.technologies
        .map(Number)
        .filter(Number.isInteger)
    : [];

  const features = Array.isArray(body.features)
    ? body.features
        .map((feature, index) => ({
          label:
            typeof feature?.label === 'string'
              ? feature.label.trim()
              : '',
          isAi: feature?.isAi === true,
          sortOrder:
            Number.isFinite(Number(feature?.sortOrder))
              ? Number(feature.sortOrder)
              : index,
        }))
        .filter((feature) => feature.label)
    : [];

  const media = Array.isArray(body.media)
    ? body.media
        .map((item, index) => ({
          url:
            typeof item?.url === 'string'
              ? item.url.trim()
              : '',
          alt:
            typeof item?.alt === 'string'
              ? item.alt.trim()
              : '',
          kind:
            typeof item?.kind === 'string' &&
            item.kind.trim()
              ? item.kind.trim()
              : 'image',
          sortOrder:
            Number.isFinite(Number(item?.sortOrder))
              ? Number(item.sortOrder)
              : index,
        }))
        .filter((item) => item.url)
    : [];

  const errors = [];

  if (!title) {
    errors.push('Title is required.');
  }

  if (!slug) {
    errors.push('Slug is required.');
  }

  if (categoryId !== null && !Number.isInteger(categoryId)) {
    errors.push('Category must be valid.');
  }

  if (
    liveUrl &&
    !/^https?:\/\/.+/i.test(liveUrl)
  ) {
    errors.push('Live URL must start with http:// or https://.');
  }

  if (
    githubUrl &&
    !/^https?:\/\/.+/i.test(githubUrl)
  ) {
    errors.push(
      'GitHub URL must start with http:// or https://.'
    );
  }

  return {
    errors,
    data: {
      title,
      slug,
      subtitle,
      description,
      categoryId,
      status,
      sortOrder,
      isFeatured,
      liveUrl: liveUrl || null,
      githubUrl: githubUrl || null,
      technologies,
      features,
      media,
    },
  };
}

async function getAdminProjectById(id) {
  const { rows } = await pool.query(
    `
      SELECT
        p.id,
        p.slug,
        p.title,
        p.subtitle,
        p.description,
        p.category_id AS "categoryId",
        p.is_featured AS "isFeatured",
        p.sort_order AS "sortOrder",
        p.live_url AS "liveUrl",
        p.github_url AS "githubUrl",
        p.status,
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt",
        c.name AS category,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', t.id,
                'name', t.name
              )
              ORDER BY pt.sort_order, t.name
            )
            FROM project_technologies pt
            JOIN technologies t
              ON t.id = pt.technology_id
            WHERE pt.project_id = p.id
          ),
          '[]'::json
        ) AS technologies,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', f.id,
                'label', f.label,
                'isAi', f.is_ai,
                'sortOrder', f.sort_order
              )
              ORDER BY f.sort_order, f.id
            )
            FROM project_features f
            WHERE f.project_id = p.id
          ),
          '[]'::json
        ) AS features,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', m.id,
                'url', m.url,
                'alt', m.alt,
                'kind', m.kind,
                'sortOrder', m.sort_order
              )
              ORDER BY m.sort_order, m.id
            )
            FROM project_media m
            WHERE m.project_id = p.id
          ),
          '[]'::json
        ) AS media

      FROM projects p
      LEFT JOIN project_categories c
        ON c.id = p.category_id
      WHERE p.id = $1
      LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
}


// ------------------------------------------------------------
// Admin project list
// ------------------------------------------------------------

app.get(
  '/api/admin/projects',
  requireAdmin,
  async (_req, res) => {
    try {
      const { rows } = await pool.query(
        `
          SELECT
            p.id,
            p.slug,
            p.title,
            p.subtitle,
            p.description,
            p.category_id AS "categoryId",
            c.name AS category,
            p.is_featured AS "isFeatured",
            p.sort_order AS "sortOrder",
            p.live_url AS "liveUrl",
            p.github_url AS "githubUrl",
            p.status,
            p.created_at AS "createdAt",
            p.updated_at AS "updatedAt",

            COALESCE(
              (
                SELECT json_agg(t.name ORDER BY pt.sort_order, t.name)
                FROM project_technologies pt
                JOIN technologies t
                  ON t.id = pt.technology_id
                WHERE pt.project_id = p.id
              ),
              '[]'::json
            ) AS technologies,

            (
              SELECT COUNT(*)
              FROM project_features f
              WHERE f.project_id = p.id
            )::int AS "featureCount",

            (
              SELECT COUNT(*)
              FROM project_media m
              WHERE m.project_id = p.id
            )::int AS "mediaCount"

          FROM projects p
          LEFT JOIN project_categories c
            ON c.id = p.category_id

          ORDER BY
            CASE
              WHEN p.status = 'published' THEN 0
              ELSE 1
            END,
            p.is_featured DESC,
            p.sort_order ASC,
            p.created_at ASC,
            p.id ASC
        `
      );

      res.json(rows);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Could not load projects.',
      });
    }
  }
);


// ------------------------------------------------------------
// Admin project details
// ------------------------------------------------------------

app.get(
  '/api/admin/projects/:id',
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          error: 'Invalid project ID.',
        });
      }

      const project =
        await getAdminProjectById(id);

      if (!project) {
        return res.status(404).json({
          error: 'Project not found.',
        });
      }

      res.json(project);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Could not load project.',
      });
    }
  }
);


// ------------------------------------------------------------
// Create project
// ------------------------------------------------------------

app.post(
  '/api/admin/projects',
  requireAdmin,
  async (req, res) => {
    const {
      errors,
      data,
    } = validateProjectPayload(req.body);

    if (errors.length) {
      return res.status(400).json({
        error: errors[0],
        errors,
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const existing =
        await client.query(
          `
            SELECT id
            FROM projects
            WHERE slug = $1
            LIMIT 1
          `,
          [data.slug]
        );

      if (existing.rows[0]) {
        await client.query('ROLLBACK');

        return res.status(409).json({
          error:
            'A project with this slug already exists.',
        });
      }

      const projectResult =
        await client.query(
          `
            INSERT INTO projects (
              slug,
              title,
              subtitle,
              description,
              category_id,
              is_featured,
              is_published,
              sort_order,
              live_url,
              github_url,
              status
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              FALSE,
              $7,
              $8,
              $9,
              $10
            )
            RETURNING id
          `,
          [
            data.slug,
            data.title,
            data.subtitle || null,
            data.description || null,
            data.categoryId,
            data.isFeatured,
            data.sortOrder,
            data.liveUrl,
            data.githubUrl,
            data.status,
          ]
        );

      const projectId =
        projectResult.rows[0].id;

      for (
        let index = 0;
        index < data.technologies.length;
        index += 1
      ) {
        await client.query(
          `
            INSERT INTO project_technologies (
              project_id,
              technology_id,
              sort_order
            )
            VALUES ($1, $2, $3)
          `,
          [
            projectId,
            data.technologies[index],
            index,
          ]
        );
      }

      for (const feature of data.features) {
        await client.query(
          `
            INSERT INTO project_features (
              project_id,
              label,
              is_ai,
              sort_order
            )
            VALUES ($1, $2, $3, $4)
          `,
          [
            projectId,
            feature.label,
            feature.isAi,
            feature.sortOrder,
          ]
        );
      }

      for (const item of data.media) {
        await client.query(
          `
            INSERT INTO project_media (
              project_id,
              url,
              alt,
              kind,
              sort_order
            )
            VALUES ($1, $2, $3, $4, $5)
          `,
          [
            projectId,
            item.url,
            item.alt || null,
            item.kind,
            item.sortOrder,
          ]
        );
      }

      await client.query('COMMIT');

      const project =
        await getAdminProjectById(projectId);

      res.status(201).json(project);
    } catch (error) {
      await client.query('ROLLBACK');

      console.error(error);

      if (error.code === '23505') {
        return res.status(409).json({
          error:
            'A project with this slug already exists.',
        });
      }

      res.status(500).json({
        error: 'Could not create project.',
      });
    } finally {
      client.release();
    }
  }
);


// ------------------------------------------------------------
// Update project
// ------------------------------------------------------------

app.put(
  '/api/admin/projects/:id',
  requireAdmin,
  async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: 'Invalid project ID.',
      });
    }

    const {
      errors,
      data,
    } = validateProjectPayload(req.body);

    if (errors.length) {
      return res.status(400).json({
        error: errors[0],
        errors,
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const existing =
        await client.query(
          `
            SELECT id
            FROM projects
            WHERE id = $1
            LIMIT 1
          `,
          [id]
        );

      if (!existing.rows[0]) {
        await client.query('ROLLBACK');

        return res.status(404).json({
          error: 'Project not found.',
        });
      }

      const duplicate =
        await client.query(
          `
            SELECT id
            FROM projects
            WHERE slug = $1
              AND id <> $2
            LIMIT 1
          `,
          [data.slug, id]
        );

      if (duplicate.rows[0]) {
        await client.query('ROLLBACK');

        return res.status(409).json({
          error:
            'A project with this slug already exists.',
        });
      }

      await client.query(
        `
          UPDATE projects
          SET
            slug = $1,
            title = $2,
            subtitle = $3,
            description = $4,
            category_id = $5,
            is_featured = $6,
            sort_order = $7,
            live_url = $8,
            github_url = $9,
            status = $10,
            updated_at = now()
          WHERE id = $11
        `,
        [
          data.slug,
          data.title,
          data.subtitle || null,
          data.description || null,
          data.categoryId,
          data.isFeatured,
          data.sortOrder,
          data.liveUrl,
          data.githubUrl,
          data.status,
          id,
        ]
      );

      await client.query(
        `
          DELETE FROM project_technologies
          WHERE project_id = $1
        `,
        [id]
      );

      for (
        let index = 0;
        index < data.technologies.length;
        index += 1
      ) {
        await client.query(
          `
            INSERT INTO project_technologies (
              project_id,
              technology_id,
              sort_order
            )
            VALUES ($1, $2, $3)
          `,
          [
            id,
            data.technologies[index],
            index,
          ]
        );
      }

      await client.query(
        `
          DELETE FROM project_features
          WHERE project_id = $1
        `,
        [id]
      );

      for (const feature of data.features) {
        await client.query(
          `
            INSERT INTO project_features (
              project_id,
              label,
              is_ai,
              sort_order
            )
            VALUES ($1, $2, $3, $4)
          `,
          [
            id,
            feature.label,
            feature.isAi,
            feature.sortOrder,
          ]
        );
      }

      await client.query(
        `
          DELETE FROM project_media
          WHERE project_id = $1
        `,
        [id]
      );

      for (const item of data.media) {
        await client.query(
          `
            INSERT INTO project_media (
              project_id,
              url,
              alt,
              kind,
              sort_order
            )
            VALUES ($1, $2, $3, $4, $5)
          `,
          [
            id,
            item.url,
            item.alt || null,
            item.kind,
            item.sortOrder,
          ]
        );
      }

      await client.query('COMMIT');

      const project =
        await getAdminProjectById(id);

      res.json(project);
    } catch (error) {
      await client.query('ROLLBACK');

      console.error(error);

      if (error.code === '23505') {
        return res.status(409).json({
          error:
            'A project with this slug already exists.',
        });
      }

      res.status(500).json({
        error: 'Could not update project.',
      });
    } finally {
      client.release();
    }
  }
);


// ------------------------------------------------------------
// Delete project
// ------------------------------------------------------------

app.delete(
  '/api/admin/projects/:id',
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          error: 'Invalid project ID.',
        });
      }

      const result = await pool.query(
        `
          DELETE FROM projects
          WHERE id = $1
          RETURNING id
        `,
        [id]
      );

      if (!result.rows[0]) {
        return res.status(404).json({
          error: 'Project not found.',
        });
      }

      res.json({
        ok: true,
        id,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Could not delete project.',
      });
    }
  }
);


// ------------------------------------------------------------
// Categories
// ------------------------------------------------------------

// ------------------------------------------------------------
// Categories
// ------------------------------------------------------------

function validateCategoryName(value) {
  const name =
    typeof value === 'string'
      ? value.trim()
      : '';

  if (!name) {
    return {
      error: 'Category name is required.',
      name: '',
    };
  }

  if (name.length > 100) {
    return {
      error: 'Category name must be 100 characters or less.',
      name,
    };
  }

  return {
    error: null,
    name,
  };
}


// ------------------------------------------------------------
// Get categories
// ------------------------------------------------------------

app.get(
  '/api/admin/categories',
  requireAdmin,
  async (_req, res) => {
    try {
      const { rows } = await pool.query(
        `
          SELECT
            c.id,
            c.name,
            COUNT(p.id)::int AS "projectCount"
          FROM project_categories c
          LEFT JOIN projects p
            ON p.category_id = c.id
          GROUP BY c.id, c.name
          ORDER BY c.name ASC
        `
      );

      res.json(rows);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Could not load categories.',
      });
    }
  }
);


// ------------------------------------------------------------
// Create category
// ------------------------------------------------------------

app.post(
  '/api/admin/categories',
  requireAdmin,
  async (req, res) => {
    const { error, name } =
      validateCategoryName(req.body?.name);

    if (error) {
      return res.status(400).json({
        error,
      });
    }

    try {
      const { rows } = await pool.query(
        `
          INSERT INTO project_categories (name)
          VALUES ($1)
          RETURNING
            id,
            name
        `,
        [name]
      );

      res.status(201).json({
        ...rows[0],
        projectCount: 0,
      });
    } catch (error) {
      console.error(error);

      if (error.code === '23505') {
        return res.status(409).json({
          error:
            'A category with this name already exists.',
        });
      }

      res.status(500).json({
        error: 'Could not create category.',
      });
    }
  }
);


// ------------------------------------------------------------
// Update category
// ------------------------------------------------------------

app.put(
  '/api/admin/categories/:id',
  requireAdmin,
  async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: 'Invalid category ID.',
      });
    }

    const { error, name } =
      validateCategoryName(req.body?.name);

    if (error) {
      return res.status(400).json({
        error,
      });
    }

    try {
      const { rows } = await pool.query(
        `
          UPDATE project_categories
          SET name = $1
          WHERE id = $2
          RETURNING
            id,
            name
        `,
        [name, id]
      );

      if (!rows[0]) {
        return res.status(404).json({
          error: 'Category not found.',
        });
      }

      const countResult = await pool.query(
        `
          SELECT COUNT(*)::int AS "projectCount"
          FROM projects
          WHERE category_id = $1
        `,
        [id]
      );

      res.json({
        ...rows[0],
        projectCount:
          countResult.rows[0].projectCount,
      });
    } catch (error) {
      console.error(error);

      if (error.code === '23505') {
        return res.status(409).json({
          error:
            'A category with this name already exists.',
        });
      }

      res.status(500).json({
        error: 'Could not update category.',
      });
    }
  }
);


// ------------------------------------------------------------
// Delete category
// ------------------------------------------------------------

app.delete(
  '/api/admin/categories/:id',
  requireAdmin,
  async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: 'Invalid category ID.',
      });
    }

    try {
      const result = await pool.query(
        `
          DELETE FROM project_categories
          WHERE id = $1
          RETURNING id
        `,
        [id]
      );

      if (!result.rows[0]) {
        return res.status(404).json({
          error: 'Category not found.',
        });
      }

      res.json({
        ok: true,
        id,
      });
    } catch (error) {
      console.error(error);

      // projects.category_id uses ON DELETE SET NULL,
      // so deleting a category will not delete projects.
      if (error.code === '23503') {
        return res.status(409).json({
          error:
            'This category cannot be deleted because it is currently in use.',
        });
      }

      res.status(500).json({
        error: 'Could not delete category.',
      });
    }
  }
);

app.get('/api/admin/technology-categories', requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        name,
        sort_order AS "sortOrder"
      FROM technology_categories
      ORDER BY sort_order ASC, name ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Could not load technology categories.',
    });
  }
});
app.get('/api/admin/technology-categories', requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        name,
        sort_order AS "sortOrder"
      FROM technology_categories
      ORDER BY sort_order ASC, name ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Could not load technology categories.',
    });
  }
});
app.post('/api/admin/technology-categories', requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    const cleanName = String(name || '').trim();

    if (!cleanName || cleanName.length > 100) {
      return res.status(400).json({
        error: 'Category name must be between 1 and 100 characters.',
      });
    }

    const { rows } = await pool.query(
      `
        INSERT INTO technology_categories (name)
        VALUES ($1)
        RETURNING
          id,
          name,
          sort_order AS "sortOrder"
      `,
      [cleanName]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'This category already exists.',
      });
    }

    res.status(500).json({
      error: 'Could not create technology category.',
    });
  }
});
app.put('/api/admin/technology-categories/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body;

    const cleanName = String(name || '').trim();

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: 'Invalid category ID.',
      });
    }

    if (!cleanName || cleanName.length > 100) {
      return res.status(400).json({
        error: 'Category name must be between 1 and 100 characters.',
      });
    }

    const { rows } = await pool.query(
      `
        UPDATE technology_categories
        SET name = $1
        WHERE id = $2
        RETURNING
          id,
          name,
          sort_order AS "sortOrder"
      `,
      [cleanName, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Category not found.',
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'This category already exists.',
      });
    }

    res.status(500).json({
      error: 'Could not update technology category.',
    });
  }
});
app.delete('/api/admin/technology-categories/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: 'Invalid category ID.',
      });
    }

    const usageResult = await pool.query(
      `
        SELECT COUNT(*)::int AS count
        FROM technologies
        WHERE category_id = $1
      `,
      [id]
    );

    const technologyCount = usageResult.rows[0].count;

    if (technologyCount > 0) {
      return res.status(409).json({
        error: `Cannot delete this category because ${technologyCount} technology(ies) use it.`,
      });
    }

    const result = await pool.query(
      `
        DELETE FROM technology_categories
        WHERE id = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'Category not found.',
      });
    }

    res.json({
      message: 'Category deleted successfully.',
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Could not delete technology category.',
    });
  }
});
// ------------------------------------------------------------
// Technologies
// ------------------------------------------------------------

app.get('/api/admin/technologies', requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        t.id,
        t.name,
        tc.id AS "categoryId",
        tc.name AS "category",
        COUNT(pt.project_id)::int AS "projectCount"
      FROM technologies t
      INNER JOIN technology_categories tc
        ON tc.id = t.category_id
      LEFT JOIN project_technologies pt
        ON pt.technology_id = t.id
      GROUP BY
        t.id,
        t.name,
        tc.id,
        tc.name,
        tc.sort_order
      ORDER BY
        tc.sort_order ASC,
        t.name ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Could not load technologies.',
    });
  }
});
app.get('/api/technologies', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        t.id,
        t.name,
        tc.id AS "categoryId",
        tc.name AS category
      FROM technologies t
      INNER JOIN technology_categories tc
        ON tc.id = t.category_id
      ORDER BY
        tc.sort_order ASC,
        t.name ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Could not load technologies.',
    });
  }
});
app.post('/api/admin/technologies', requireAdmin, async (req, res) => {
  try {
    const { name, categoryId } = req.body;

    const cleanName = String(name || '').trim();
    const cleanCategoryId = Number(categoryId);

    if (!cleanName || cleanName.length > 100) {
      return res.status(400).json({
        error: 'Technology name must be between 1 and 100 characters.',
      });
    }

    if (!Number.isInteger(cleanCategoryId)) {
      return res.status(400).json({
        error: 'Invalid technology category.',
      });
    }

    const categoryResult = await pool.query(
      `
        SELECT id, name
        FROM technology_categories
        WHERE id = $1
      `,
      [cleanCategoryId]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Technology category not found.',
      });
    }

    const { rows } = await pool.query(
      `
        INSERT INTO technologies (
          name,
          category_id
        )
        VALUES ($1, $2)
        RETURNING id, name, category_id AS "categoryId"
      `,
      [cleanName, cleanCategoryId]
    );

    res.status(201).json({
      ...rows[0],
      category: categoryResult.rows[0].name,
      projectCount: 0,
    });
  } catch (error) {
    console.error(error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'This technology already exists.',
      });
    }

    res.status(500).json({
      error: 'Could not create technology.',
    });
  }
});

app.put('/api/admin/technologies/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, categoryId } = req.body;

    const cleanName = String(name || '').trim();
    const cleanCategoryId = Number(categoryId);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: 'Invalid technology ID.',
      });
    }

    if (!cleanName || cleanName.length > 100) {
      return res.status(400).json({
        error: 'Technology name must be between 1 and 100 characters.',
      });
    }

    if (!Number.isInteger(cleanCategoryId)) {
      return res.status(400).json({
        error: 'Invalid technology category.',
      });
    }

    const categoryResult = await pool.query(
      `
        SELECT id, name
        FROM technology_categories
        WHERE id = $1
      `,
      [cleanCategoryId]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Technology category not found.',
      });
    }

    const { rows } = await pool.query(
      `
        UPDATE technologies
        SET
          name = $1,
          category_id = $2
        WHERE id = $3
        RETURNING
          id,
          name,
          category_id AS "categoryId"
      `,
      [cleanName, cleanCategoryId, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Technology not found.',
      });
    }

    const countResult = await pool.query(
      `
        SELECT COUNT(*)::int AS "projectCount"
        FROM project_technologies
        WHERE technology_id = $1
      `,
      [id]
    );

    res.json({
      ...rows[0],
      category: categoryResult.rows[0].name,
      projectCount: countResult.rows[0].projectCount,
    });
  } catch (error) {
    console.error(error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'This technology already exists.',
      });
    }

    res.status(500).json({
      error: 'Could not update technology.',
    });
  }
});

app.delete(
  '/api/admin/technologies/:id',
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          error: 'Invalid technology ID.',
        });
      }

      const result = await pool.query(
        `
          DELETE FROM technologies
          WHERE id = $1
        `,
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: 'Technology not found.',
        });
      }

      res.json({
        ok: true,
        id,
      });
    } catch (error) {
      console.error(error);

      if (error.code === '23503') {
        return res.status(409).json({
          error:
            'This technology cannot be deleted because it is still in use.',
        });
      }

      res.status(500).json({
        error: 'Could not delete technology.',
      });
    }
  }
);
app.get(
  '/api/admin/inquiries',
  requireAdmin,
  async (req, res) => {
    try {
      const search = String(req.query.search || '').trim();
      const status = String(req.query.status || '').trim();

      const values = [];
      const conditions = [];

      if (search) {
        values.push(`%${search}%`);

        conditions.push(`
          (
            name ILIKE $${values.length}
            OR email ILIKE $${values.length}
            OR company ILIKE $${values.length}
            OR message ILIKE $${values.length}
          )
        `);
      }

      if (
        status &&
        ['new', 'contacted', 'in_progress', 'closed'].includes(status)
      ) {
        values.push(status);
        conditions.push(`status = $${values.length}`);
      }

      const whereClause =
        conditions.length > 0
          ? `WHERE ${conditions.join(' AND ')}`
          : '';

      const { rows } = await pool.query(
        `
          SELECT
            id,
            name,
            email,
            company,
            message,
            created_at AS "createdAt",
            status
          FROM contact_inquiries
          ${whereClause}
          ORDER BY created_at DESC, id DESC
        `,
        values
      );

      res.json(rows);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Could not load inquiries.',
      });
    }
  }
);

app.get(
  '/api/admin/inquiries/:id',
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          error: 'Invalid inquiry ID.',
        });
      }

      const { rows } = await pool.query(
        `
          SELECT
            id,
            name,
            email,
            company,
            message,
            created_at AS "createdAt",
            status
          FROM contact_inquiries
          WHERE id = $1
          LIMIT 1
        `,
        [id]
      );

      if (!rows[0]) {
        return res.status(404).json({
          error: 'Inquiry not found.',
        });
      }

      res.json(rows[0]);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Could not load inquiry.',
      });
    }
  }
);

app.patch(
  '/api/admin/inquiries/:id/status',
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const status = String(req.body?.status || '').trim();

      const allowedStatuses = [
        'new',
        'contacted',
        'in_progress',
        'closed',
      ];

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          error: 'Invalid inquiry ID.',
        });
      }

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid inquiry status.',
        });
      }

      const { rows } = await pool.query(
        `
          UPDATE contact_inquiries
          SET status = $1
          WHERE id = $2
          RETURNING
            id,
            name,
            email,
            company,
            message,
            created_at AS "createdAt",
            status
        `,
        [status, id]
      );

      if (!rows[0]) {
        return res.status(404).json({
          error: 'Inquiry not found.',
        });
      }

      res.json(rows[0]);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Could not update inquiry status.',
      });
    }
  }
);

app.delete(
  '/api/admin/inquiries/:id',
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          error: 'Invalid inquiry ID.',
        });
      }

      const result = await pool.query(
        `
          DELETE FROM contact_inquiries
          WHERE id = $1
        `,
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: 'Inquiry not found.',
        });
      }

      res.json({
        ok: true,
        id,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Could not delete inquiry.',
      });
    }
  }
);

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`NAWA API listening on :${port}`));
