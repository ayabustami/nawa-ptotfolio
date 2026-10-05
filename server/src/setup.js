import { readFile } from 'node:fs/promises';
import { pool } from './db.js';

const dir = new URL('../', import.meta.url);
for (const file of ['schema.sql', 'seed.sql']) {
  await pool.query(await readFile(new URL(file, dir), 'utf8'));
  console.log(`Applied ${file}`);
}
await pool.end();
