import express from 'express';
import cors from 'cors';
import { pool } from './db.js';

const app = express();
app.set('trust proxy', 1);
const origins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: origins.length ? origins : false }));
app.use(express.json({ limit: '20kb' }));

const PROJECTS_SQL = `
  SELECT p.id, p.slug, p.title, p.subtitle, p.description, p.is_featured,
         p.sort_order, p.project_url AS "projectUrl", p.github_url AS "githubUrl", c.name AS category,
    COALESCE((SELECT json_agg(t.name ORDER BY pt.sort_order)
              FROM project_technologies pt JOIN technologies t ON t.id = pt.technology_id
              WHERE pt.project_id = p.id), '[]') AS technologies,
    COALESCE((SELECT json_agg(json_build_object('label', f.label, 'isAi', f.is_ai) ORDER BY f.sort_order)
              FROM project_features f WHERE f.project_id = p.id), '[]') AS features,
    COALESCE((SELECT json_agg(json_build_object('url', m.url, 'alt', m.alt, 'kind', m.kind) ORDER BY m.sort_order)
              FROM project_media m WHERE m.project_id = p.id), '[]') AS media
  FROM projects p
  LEFT JOIN project_categories c ON c.id = p.category_id
  WHERE p.is_published`;

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/projects', async (req, res) => {
  try {
    const featured = req.query.featured === 'true' ? ' AND p.is_featured' : '';
    const { rows } = await pool.query(`${PROJECTS_SQL}${featured} ORDER BY p.sort_order, p.id`);
    res.json({ projects: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load projects.' });
  }
});

app.get('/api/projects/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query(`${PROJECTS_SQL} AND p.slug = $1`, [req.params.slug]);
    if (!rows[0]) return res.status(404).json({ error: 'Project not found.' });
    res.json({ project: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load project.' });
  }
});

// Basic in-memory rate limit: 5 inquiries per IP per 10 minutes
const hits = new Map();
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

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`NAWA API listening on :${port}`));
