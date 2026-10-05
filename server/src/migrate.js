    import { readdir, readFile } from 'node:fs/promises';
    import { pool } from './db.js';

    async function ensureMigrationsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    `);
    }

    async function runMigrations() {
    await ensureMigrationsTable();

    const migrationsDir = new URL('../migrations/', import.meta.url);

    const files = (await readdir(migrationsDir))
        .filter((file) => file.endsWith('.sql'))
        .sort();

    for (const file of files) {
        const { rows } = await pool.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [file]
        );

        if (rows.length > 0) {
        console.log(`Skipped ${file}`);
        continue;
        }

        const sql = await readFile(new URL(file, migrationsDir), 'utf8');

        const client = await pool.connect();

        try {
        await client.query('BEGIN');
        await client.query(sql);

        await client.query(
            'INSERT INTO schema_migrations (filename) VALUES ($1)',
            [file]
        );

        await client.query('COMMIT');

        console.log(`Applied ${file}`);
        } catch (error) {
        await client.query('ROLLBACK');
        throw error;
        } finally {
        client.release();
        }
    }
    }

    try {
    await runMigrations();
    console.log('Migrations completed.');
    } catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
    } finally {
    await pool.end();
    }