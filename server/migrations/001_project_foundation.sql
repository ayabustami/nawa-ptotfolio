-- Rename project_url to live_url without losing existing values.
ALTER TABLE projects
  RENAME COLUMN project_url TO live_url;


-- Add explicit project publication status.
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS status TEXT;

-- Safely backfill status from the existing is_published column.
UPDATE projects
SET status = CASE
  WHEN is_published = TRUE THEN 'published'
  ELSE 'draft'
END
WHERE status IS NULL;

-- New projects default to draft.
ALTER TABLE projects
  ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE projects
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN ('draft', 'published'));


-- Useful indexes for the public project queries and admin filtering.
CREATE INDEX IF NOT EXISTS idx_projects_public_order
  ON projects (status, is_featured, sort_order, created_at, id);

CREATE INDEX IF NOT EXISTS idx_projects_slug
  ON projects (slug);