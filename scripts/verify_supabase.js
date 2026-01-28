import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('Testing connection to Supabase...');
  console.log('URL:', supabaseUrl);

  // 1. Check if we can query 'activities' (mapped to 'events' in app)
  console.log('\nQuerying "activities" table...');
  const { data: activities, error: actError } = await supabase
    .from('activities')
    .select('*');

  if (actError) {
    console.error('FAILED to query activities:', actError.message);
    if (actError.code === '42P01') {
      console.error('  -> Table "activities" does not exist!');
    }
  } else {
    console.log(`SUCCESS: Found ${activities.length} activities.`);
    if (activities.length > 0) {
      console.log('  Sample:', activities[0].title);
    } else {
      console.log('  (Table is empty, which is expected for a fresh DB)');
    }
  }

  // 2. Check 'communities'
  console.log('\nQuerying "communities" table...');
  const { data: communities, error: comError } = await supabase
    .from('communities')
    .select('*');

  if (comError) {
    console.error('FAILED to query communities:', comError.message);
  } else {
    console.log(`SUCCESS: Found ${communities.length} communities.`);
  }

  // 3. Check 'profiles'
  console.log('\nQuerying "profiles" table...');
  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('*');

  if (profError) {
    console.error('FAILED to query profiles:', profError.message);
  } else {
    console.log(`SUCCESS: Found ${profiles.length} profiles.`);
  }
}

verify().catch(console.error);
