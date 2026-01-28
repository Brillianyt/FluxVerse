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

async function checkCommunity() {
  console.log('Checking FluxVerse community...');
  
  // Try to find by slug 'fluxverse'
  const { data: bySlug, error: slugError } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', 'fluxverse')
    .maybeSingle();

  if (bySlug) {
      console.log('Found FluxVerse community by slug:', bySlug.id);
      
      // Check events for this community
      const { data: events, error: eventsError } = await supabase
        .from('activities')
        .select('id, title, community_id')
        .eq('community_id', bySlug.id);
        
      console.log('Events with this community_id:', events?.length);
      if (events?.length > 0) {
          console.log('Event example:', events[0]);
      } else {
          console.log('No events found for this community ID.');
          
          // Check if there are any events at all
          const { count } = await supabase.from('activities').select('*', { count: 'exact', head: true });
          console.log('Total activities in DB:', count);
      }
  } else {
      console.log('FluxVerse community not found by slug "fluxverse".');
      console.log('Error if any:', slugError);
      
      // List all communities
      const { data: all } = await supabase.from('communities').select('id, name, slug');
      console.log('All communities:', all);

      if (all && all.length > 0) {
          const fluxId = all[0].id;
          console.log('Checking events for community ID:', fluxId);
          const { data: events } = await supabase.from('activities').select('id, title, community_id').eq('community_id', fluxId);
          console.log('Events found:', events?.length);
          if (events && events.length > 0) console.log(events);
          
          // Also check by title
          const { data: party } = await supabase.from('activities').select('id, title, community_id').ilike('title', '%Launch Party%');
          console.log('Launch Party event:', party);
      }
  }
}

checkCommunity();
