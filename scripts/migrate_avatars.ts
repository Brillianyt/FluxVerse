import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateAvatars() {
  console.log('Starting avatar migration...');

  // 1. Get local avatars
  const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
  if (!fs.existsSync(avatarsDir)) {
    console.error(`Avatars directory not found at: ${avatarsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(avatarsDir).filter(f => f.endsWith('.svg'));
  if (files.length === 0) {
    console.log('No local SVG avatars found.');
    process.exit(1);
  }
  
  const localAvatars = files.map(f => `/avatars/${f}`);
  console.log(`Found ${localAvatars.length} local avatars.`);

  // 2. Fetch all profiles
  // Using limit just in case, but pagination would be better for massive DBs
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, avatar_url, username');

  if (error) {
    console.error('Error fetching profiles:', error);
    process.exit(1);
  }

  console.log(`Found ${profiles.length} profiles.`);

  let updatedCount = 0;

  for (const profile of profiles) {
    const currentAvatar = profile.avatar_url;
    
    // Check if avatar needs update
    // Criteria: 
    // - is null/empty
    // - contains dicebear
    // - fails placeholder check (simple string check)
    // - doesn't start with /avatars/ (optional, depending on if we want to force everyone to local)
    
    // Let's be aggressive: Update EVERYONE who isn't already using a local avatar
    // OR if they are using a local avatar that doesn't exist anymore? (Too complex for now)
    
    const isLocal = currentAvatar && currentAvatar.startsWith('/avatars/');
    
    if (!isLocal) {
        // Pick random
        const randomAvatar = localAvatars[Math.floor(Math.random() * localAvatars.length)];
        
        console.log(`Updating user ${profile.username || profile.id}: ${currentAvatar} -> ${randomAvatar}`);
        
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: randomAvatar })
            .eq('id', profile.id);
            
        if (updateError) {
            console.error(`Failed to update ${profile.id}:`, updateError);
        } else {
            updatedCount++;
        }
    }
  }

  console.log(`Migration complete. Updated ${updatedCount} profiles.`);
}

migrateAvatars().catch(console.error);
