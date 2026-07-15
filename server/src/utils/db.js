import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || null;

if (!connectionString) {
  console.warn('[PayRemind] No DATABASE_URL found in environment — falling back to in-memory (no DB).');
}

const pool = connectionString ? new Pool({ connectionString }) : null;

async function query(text, params) {
  if (!pool) throw new Error('No database configured (DATABASE_URL missing)');
  const res = await pool.query(text, params);
  return res.rows;
}

// Ensure invoices table exists (reminder_history as jsonb for now)
async function ensureSchema() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id text PRIMARY KEY,
      client_name text,
      client_email text,
      amount numeric,
      currency text,
      due_date date,
      status text,
      reminder_history jsonb,
      created_at timestamptz DEFAULT now()
    );
  `);
}

if (pool) {
  ensureSchema().catch((err) => {
    console.error('[PayRemind] Failed to ensure DB schema', err);
  });
}

export { query, pool };
