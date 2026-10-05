-- NAWA Technology portfolio schema (PostgreSQL / Neon). Safe to re-run.

-- Sets updated_at to the current time whenever a row is updated.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TABLE IF NOT EXISTS project_categories (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS projects (
  id           SERIAL PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  subtitle     TEXT,
  description  TEXT NOT NULL,
  category_id  INTEGER REFERENCES project_categories(id) ON DELETE SET NULL,
  is_featured  BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  project_url  TEXT,               -- only set when verified and approved
  github_url   TEXT,               -- optional; only set when the URL is explicitly approved
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS technologies (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS project_technologies (
  project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  technology_id INTEGER NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, technology_id)
);

-- Verified feature highlights (e.g. AI features) shown on a project
CREATE TABLE IF NOT EXISTS project_features (
  id         SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  is_ai      BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- References to real media (screenshots etc.). Empty until real assets exist.
CREATE TABLE IF NOT EXISTS project_media (
  id         SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  alt        TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'screenshot',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contact_inquiries (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  company    TEXT,
  message    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contact_inquiries_status_check
    CHECK (status IN ('new', 'contacted', 'in_progress', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_projects_order ON projects (is_published, sort_order);

-- Trigger: keep projects.updated_at current on every UPDATE
DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Upgrade path: adds the newer columns to tables created by an earlier version of this file.
-- No-ops on a fresh database, where CREATE TABLE above already includes them.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE contact_inquiries
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new'
  CONSTRAINT contact_inquiries_status_check
    CHECK (status IN ('new', 'contacted', 'in_progress', 'closed'));
