import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSlug() {
  console.log('Updating FluxVerse slug to "fluxverse"...');
  
  const { error } = await supabase
    .from('communities')
    .update({ slug: 'fluxverse' })
    .eq('name', 'FluxVerse');

  if (error) {
      console.error('Error updating slug:', error);
  } else {
      console.log('Slug updated successfully.');
  }
}

fixSlug();
