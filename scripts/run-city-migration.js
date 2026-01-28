import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use service role key if available, otherwise anon key (but anon key might fail for insertions depending on RLS)
// Note: In production, you should use service role key for migrations.
// For this script, we'll try to read both but prefer service role.
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if service role key is valid JWT
const isJwt = (key) => key?.startsWith('eyJ');

if (!isJwt(supabaseKey)) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is missing or invalid (not a JWT). Falling back to VITE_SUPABASE_ANON_KEY. This might fail due to RLS.');
    supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('Running city insertion migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../supabase/migrations/20260126_insert_more_cities.sql');
    let sqlContent;
    try {
        sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    } catch (err) {
        console.error('Error reading SQL file:', err);
        return;
    }

    // Since Supabase JS client doesn't support executing raw SQL directly via public API easily without an RPC function,
    // and we don't have direct SQL access here, we will parse the SQL and use the JS API to insert.
    // This is a workaround for the pair-programming environment where we can't just pipe psql.
    
    // Actually, looking at the SQL, it's just an INSERT ... ON CONFLICT. We can map this to .upsert().
    
    const citiesToInsert = [
        { name: 'Nanjing', label: '南京', slug: 'nanjing', region: 'China', description: '六朝古都，历史与现代交织的科教名城', icon_url: 'https://images.unsplash.com/photo-1721021181177-1f8ad8ee81d7?w=200&fit=crop', cover_image_url: 'https://images.unsplash.com/photo-1721021181177-1f8ad8ee81d7?w=1200&fit=crop', sort_order: 10 },
        { name: 'Shenzhen', label: '深圳', slug: 'shenzhen', region: 'China', description: '中国硅谷，创新与活力的代名词', icon_url: 'https://images.unsplash.com/photo-1634647626782-f5fffa9fd9b1?w=200&fit=crop', cover_image_url: 'https://images.unsplash.com/photo-1634647626782-f5fffa9fd9b1?w=1200&fit=crop', sort_order: 20 },
        { name: 'Guangzhou', label: '广州', slug: 'guangzhou', region: 'China', description: '千年商都，岭南文化中心', icon_url: 'https://images.unsplash.com/photo-1553826059-7a090c4a3447?w=200&fit=crop', cover_image_url: 'https://images.unsplash.com/photo-1553826059-7a090c4a3447?w=1200&fit=crop', sort_order: 30 },
        { name: 'Suzhou', label: '苏州', slug: 'suzhou', region: 'China', description: '东方威尼斯，园林之城', icon_url: 'https://images.unsplash.com/photo-1548625361-8889ee393a65?w=200&fit=crop', cover_image_url: 'https://images.unsplash.com/photo-1548625361-8889ee393a65?w=1200&fit=crop', sort_order: 40 },
        { name: 'Hangzhou', label: '杭州', slug: 'hangzhou', region: 'China', description: '人间天堂，数字经济高地', icon_url: 'https://images.unsplash.com/photo-1640100385267-4b935d8ef86c?w=200&fit=crop', cover_image_url: 'https://images.unsplash.com/photo-1640100385267-4b935d8ef86c?w=1200&fit=crop', sort_order: 50 },
        { name: 'Chengdu', label: '成都', slug: 'chengdu', region: 'China', description: '天府之国，美食与休闲之都', icon_url: 'https://images.unsplash.com/photo-1693858325816-b7a7c1066838?w=200&fit=crop', cover_image_url: 'https://images.unsplash.com/photo-1693858325816-b7a7c1066838?w=1200&fit=crop', sort_order: 60 },
        { name: 'Tianjin', label: '天津', slug: 'tianjin', region: 'China', description: '渤海明珠，中西合璧的近代名城', icon_url: 'https://images.unsplash.com/photo-1627918524673-8b776269204e?w=200&fit=crop', cover_image_url: 'https://images.unsplash.com/photo-1627918524673-8b776269204e?w=1200&fit=crop', sort_order: 70 }
    ];

    const { data, error } = await supabase
        .from('cities')
        .upsert(citiesToInsert, { onConflict: 'slug' })
        .select();

    if (error) {
        console.error('Migration failed:', error);
    } else {
        console.log('Successfully inserted/updated cities:', data.length);
        console.log('City names:', data.map(c => c.name).join(', '));
    }
}

runMigration();
