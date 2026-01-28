import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTags() {
  console.log('Testing tags query...');
  const { data, error } = await supabase.from('tags').select('*');

  if (error) {
    console.error('Error fetching tags:', error);
  } else {
    console.log('Tags fetched successfully:', data);
    console.log('Count:', data.length);
  }

  console.log('\nTesting activity_tags query...');
  const { data: atData, error: atError } = await supabase.from('activity_tags').select('*').limit(5);

  if (atError) {
    console.error('Error fetching activity_tags:', atError);
  } else {
    console.log('Activity tags fetched successfully (first 5):', atData);
  }
}

testTags();
