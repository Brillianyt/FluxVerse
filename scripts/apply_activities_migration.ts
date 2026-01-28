
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Missing DATABASE_URL in .env');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to database...');

    const queries = [
      // 1. 时间精度
      `ALTER TABLE activities ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE;`,
      `ALTER TABLE activities ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;`,
      
      // 2. 地理位置
      `ALTER TABLE activities ADD COLUMN IF NOT EXISTS latitude FLOAT;`,
      `ALTER TABLE activities ADD COLUMN IF NOT EXISTS longitude FLOAT;`,
      
      // 3. 图片与详情
      `ALTER TABLE activities ADD COLUMN IF NOT EXISTS image_url TEXT;`,
      `ALTER TABLE activities ADD COLUMN IF NOT EXISTS brief TEXT;`,
      `ALTER TABLE activities ADD COLUMN IF NOT EXISTS original_link TEXT;`,
      
      // 4. 业务控制字段
      `ALTER TABLE activities ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'user_submitted';`,
      `ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_info_verified INT DEFAULT 0;`,
      `ALTER TABLE activities ADD COLUMN IF NOT EXISTS supports_site_registration INT DEFAULT 0;`,
      `ALTER TABLE activities ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';`,
      `ALTER TABLE activities ADD COLUMN IF NOT EXISTS needs_approval BOOLEAN DEFAULT FALSE;`
    ];

    for (const query of queries) {
      console.log(`Executing: ${query}`);
      await client.query(query);
    }

    console.log('✅ Activities table migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();
