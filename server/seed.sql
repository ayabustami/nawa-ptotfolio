-- Verified data only. LUMIERE is the only project provided so far.
-- No media rows are inserted: no real screenshots have been supplied.
INSERT INTO project_categories (name) VALUES ('E-commerce') ON CONFLICT (name) DO NOTHING;

INSERT INTO technologies (name) VALUES ('React.js'), ('Node.js'), ('PostgreSQL'), ('REST API')
ON CONFLICT (name) DO NOTHING;

INSERT INTO projects (slug, title, subtitle, description, category_id, is_featured, sort_order)
SELECT 'lumiere', 'LUMIERE', 'Luxury Beauty E-commerce Platform',
  'A full-stack e-commerce platform built with React.js, Node.js, PostgreSQL, and REST APIs, featuring AI-powered beauty assistance and scent discovery.',
  c.id, TRUE, 1
FROM project_categories c WHERE c.name = 'E-commerce'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO project_technologies (project_id, technology_id, sort_order)
SELECT p.id, t.id, x.ord FROM projects p
JOIN (VALUES ('React.js',1),('Node.js',2),('PostgreSQL',3),('REST API',4)) AS x(name, ord) ON TRUE
JOIN technologies t ON t.name = x.name
WHERE p.slug = 'lumiere'
ON CONFLICT DO NOTHING;

INSERT INTO project_features (project_id, label, is_ai, sort_order)
SELECT p.id, x.label, TRUE, x.ord FROM projects p
JOIN (VALUES ('AI Beauty Concierge',1),('AI Scent Finder',2)) AS x(label, ord) ON TRUE
WHERE p.slug = 'lumiere'
AND NOT EXISTS (SELECT 1 FROM project_features f WHERE f.project_id = p.id);
