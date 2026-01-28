
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
        // Apply image_url migration
        const sqlPath = path.resolve(__dirname, '../supabase/migrations/20250122_add_image_url.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Adding cover_image_url column...');
        await client.query(sql);

        await client.query("NOTIFY pgrst, 'reload config'");
        
        console.log('Migration successful.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await client.end();
    }
}

run();
