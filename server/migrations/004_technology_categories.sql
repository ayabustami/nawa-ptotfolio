ALTER TABLE technologies
  ADD COLUMN IF NOT EXISTS category TEXT;

UPDATE technologies
SET category = CASE
  WHEN LOWER(name) IN (
    'react.js',
    'javascript',
    'html',
    'css',
    'react',
    'next.js',
    'nextjs',
    'vite'
  ) THEN 'Frontend'

  WHEN LOWER(name) IN (
    'node.js',
    'nodejs',
    'rest apis',
    'rest api',
    'express.js',
    'express'
  ) THEN 'Backend'

  WHEN LOWER(name) IN (
    'postgresql',
    'postgres',
    'mysql',
    'mongodb'
  ) THEN 'Database'

  WHEN LOWER(name) IN (
    'llm integrations',
    'prompt engineering',
    'ai-powered application features',
    'ai integration',
    'ai integrations'
  ) THEN 'AI'

  ELSE 'Frontend'
END
WHERE category IS NULL;

ALTER TABLE technologies
  ALTER COLUMN category SET DEFAULT 'Frontend';

ALTER TABLE technologies
  ALTER COLUMN category SET NOT NULL;

ALTER TABLE technologies
  DROP CONSTRAINT IF EXISTS technologies_category_check;

ALTER TABLE technologies
  ADD CONSTRAINT technologies_category_check
  CHECK (
    category IN (
      'Frontend',
      'Backend',
      'Database',
      'AI'
    )
  );

CREATE INDEX IF NOT EXISTS idx_technologies_category
  ON technologies (category);