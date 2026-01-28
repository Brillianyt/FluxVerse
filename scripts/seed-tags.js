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

async function checkAndSeed() {
  // 1. Check activities
  const { data: activities } = await supabase.from('activities').select('id, title').limit(5);
  console.log('Found activities:', activities?.length);

  // 2. Check tags
  const { data: tags } = await supabase.from('tags').select('id, name, slug').limit(5);
  console.log('Found tags:', tags?.length);

  // 3. Check connections
  const { data: connections } = await supabase.from('activity_tags').select('*');
  console.log('Found connections (activity_tags):', connections?.length);

  if (activities && activities.length === 0) {
      console.log('No activities found. Creating dummy activity...');
      const { data: activity, error } = await supabase.from('activities').insert({
          title: 'FluxVerse Launch Party',
          description: 'Join us for the launch of FluxVerse!',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          city_id: null, // Optional
          location_name: 'Virtual',
          status: 'published'
      }).select().single();
      
      if (error) {
          console.error('Error creating dummy activity:', error);
          return;
      }
      activities.push(activity);
      console.log('Created dummy activity:', activity.id);
  }

  if (activities && activities.length > 0 && tags && tags.length > 0 && (!connections || connections.length === 0)) {
    console.log('No connections found. Seeding dummy connections...');
    
    const newConnections = [];
    
    // Assign random tags to first few activities
    for (const activity of activities) {
      // Pick 1-2 random tags
      const randomTags = tags.sort(() => 0.5 - Math.random()).slice(0, 2);
      
      for (const tag of randomTags) {
        newConnections.push({
          activity_id: activity.id,
          tag_id: tag.id
        });
      }
    }
    
    const { error } = await supabase.from('activity_tags').insert(newConnections);
    if (error) console.error('Error seeding connections:', error);
    else console.log('Successfully seeded', newConnections.length, 'connections.');
  }
}

checkAndSeed();
