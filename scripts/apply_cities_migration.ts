
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
    await client.connect();
    try {
        // 1. Ensure table exists
        const createSqlPath = path.resolve(__dirname, '../supabase/migrations/20250122_add_cities_table.sql');
        const createSql = fs.readFileSync(createSqlPath, 'utf8');
        console.log('Ensuring cities table exists...');
        await client.query(createSql);

        // 2. Refresh schema cache
        await client.query("NOTIFY pgrst, 'reload config'");

        // 3. Update metadata
        const alterSqlPath = path.resolve(__dirname, '../supabase/migrations/20260123_update_cities_metadata.sql');
        const alterSql = fs.readFileSync(alterSqlPath, 'utf8');
        console.log('Adding metadata columns...');
        await client.query(alterSql);

        await client.query("NOTIFY pgrst, 'reload config'");
        
        console.log('Migration successful.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await client.end();
    }
}

run();
