
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create a pool instance to manage connections
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase connection sometimes
  }
});

// Export a query function
export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool: pool
};
