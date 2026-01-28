
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
    console.log('--- Testing Tags Table ---');
    const { data: tags, error: tagsError } = await supabase
        .from('tags')
        .select('*');

    if (tagsError) {
        console.error('Error fetching tags:', tagsError);
    } else {
        console.log(`Found ${tags?.length || 0} tags:`);
        tags?.forEach(t => console.log(` - ${t.name} (id: ${t.id})`));
    }

    console.log('\n--- Testing Activity Tags Table ---');
    const { data: actTags, error: actTagsError } = await supabase
        .from('activity_tags')
        .select('*');

    if (actTagsError) {
        console.error('Error fetching activity_tags:', actTagsError);
    } else {
        console.log(`Found ${actTags?.length || 0} activity_tag relations.`);
    }
}

testDatabase();
