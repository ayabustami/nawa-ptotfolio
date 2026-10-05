CREATE TABLE IF NOT EXISTS technology_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO technology_categories (name, sort_order)
VALUES
  ('Frontend', 1),
  ('Backend', 2),
  ('Database', 3),
  ('AI', 4)
ON CONFLICT (name) DO NOTHING;


ALTER TABLE technologies
  ADD COLUMN IF NOT EXISTS category_id INTEGER;


UPDATE technologies t
SET category_id = tc.id
FROM technology_categories tc
WHERE tc.name = t.category
  AND t.category_id IS NULL;


ALTER TABLE technologies
  ALTER COLUMN category_id SET NOT NULL;


ALTER TABLE technologies
  DROP CONSTRAINT IF EXISTS technologies_category_id_fkey;


ALTER TABLE technologies
  ADD CONSTRAINT technologies_category_id_fkey
  FOREIGN KEY (category_id)
  REFERENCES technology_categories(id)
  ON DELETE RESTRICT;


CREATE INDEX IF NOT EXISTS idx_technologies_category_id
  ON technologies(category_id);


CREATE INDEX IF NOT EXISTS idx_technology_categories_sort_order
  ON technology_categories(sort_order);


ALTER TABLE technologies
  DROP CONSTRAINT IF EXISTS technologies_category_check;


ALTER TABLE technologies
  ALTER COLUMN category DROP DEFAULT;


ALTER TABLE technologies
  DROP COLUMN IF EXISTS category;