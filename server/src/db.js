import pg from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.');
  process.exit(1);
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Idle DB client error:', err.message);
});
