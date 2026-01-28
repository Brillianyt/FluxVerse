import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from root .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Missing DATABASE_URL. Please set it in .env');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
});

async function createTable() {
  try {
    await client.connect();
    console.log('Connected to database.');

    const sql = `
      -- Create table if not exists (using gen_random_uuid() for pgcrypto independence if needed, 
      -- but usually uuid-ossp is available. Fallback to gen_random_uuid() which is native in recent PG)
      
      -- Ensure uuid-ossp extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS public.default_avatars (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          url TEXT NOT NULL UNIQUE,
          name TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          sort_order INT DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Enable RLS
      ALTER TABLE public.default_avatars ENABLE ROW LEVEL SECURITY;

      -- Drop policy if exists to avoid error
      DROP POLICY IF EXISTS "Allow public read access" ON public.default_avatars;

      -- Create Policy
      CREATE POLICY "Allow public read access" ON public.default_avatars FOR SELECT USING (true);
      
      -- Grant access to anon/authenticated roles (Supabase specific usually)
      GRANT SELECT ON public.default_avatars TO anon, authenticated, service_role;
    `;

    console.log('Executing SQL to create default_avatars table...');
    await client.query(sql);
    console.log('Table created successfully.');

  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    await client.end();
  }
}

createTable();
