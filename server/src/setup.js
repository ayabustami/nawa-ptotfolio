import { readFile } from 'node:fs/promises';
import { pool } from './db.js';
import { spawn } from 'node:child_process';

async function tableExists(tableName) {
  const { rows } = await pool.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS exists;
    `,
    [tableName]
  );

  return rows[0].exists;
}

async function runMigrations() {
  await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['--env-file=../.env', 'src/migrate.js'],
      {
        cwd: new URL('../', import.meta.url),
        stdio: 'inherit'
      }
    );

    child.on('error', reject);

    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Migration process exited with code ${code}`));
    });
  });
}

async function run() {
  const hasProjectsTable = await tableExists('projects');

  if (!hasProjectsTable) {
    console.log('Fresh database detected.');

    const schemaUrl = new URL('../schema.sql', import.meta.url);
    const schema = await readFile(schemaUrl, 'utf8');

    await pool.query(schema);

    console.log('Applied schema.sql');

    await runMigrations();

    const { rows } = await pool.query(
      'SELECT 1 FROM seed_runs WHERE name = $1',
      ['seed:initial']
    );

    if (rows.length === 0) {
      const seedUrl = new URL('../seed.sql', import.meta.url);
      const seed = await readFile(seedUrl, 'utf8');

      await pool.query('BEGIN');

      try {
        await pool.query(seed);

        await pool.query(
          'INSERT INTO seed_runs (name) VALUES ($1)',
          ['seed:initial']
        );

        await pool.query('COMMIT');

        console.log('Applied seed.sql');
        console.log('Recorded seed:initial');
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    } else {
      console.log('Initial seed already applied. Skipped seed.sql');
    }

    return;
  }

  console.log('Existing database detected.');
  console.log('Running migrations only. Seed will NOT run.');

  await runMigrations();
}

try {
  await run();
  console.log('Database setup completed.');
} catch (error) {
  console.error('Database setup failed:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}