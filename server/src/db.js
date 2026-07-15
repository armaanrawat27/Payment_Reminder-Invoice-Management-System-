import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',          
  database: 'payremind',
  password: 'armaan23',
  port: 5432,                 
});

pool.connect()
  .then(() => console.log('[PayRemind] Successfully connected to PostgreSQL!'))
  .catch((err) => console.error('[PayRemind] PostgreSQL connection error:', err.stack));

export default pool;