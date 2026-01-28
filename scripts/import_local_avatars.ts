import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Script to import local SVG avatars to database
async function importLocalAvatars() {
  const avatarsDir = path.join(process.cwd(), 'public', 'avatars');

  if (!fs.existsSync(avatarsDir)) {
    console.error('Avatars directory not found:', avatarsDir);
    console.log('Please create public/avatars/ directory and add your SVG files there.');
    process.exit(1);
  }

  const files = fs.readdirSync(avatarsDir).filter(file => file.endsWith('.svg'));

  if (files.length === 0) {
    console.log('No SVG files found in public/avatars/');
    process.exit(1);
  }

  console.log(`Found ${files.length} SVG files. Syncing with database...`);

  // 1. Get all current DB avatars
  const { data: dbAvatars, error: fetchError } = await supabase
    .from('default_avatars')
    .select('*');

  if (fetchError) {
    console.error('Failed to fetch existing avatars:', fetchError);
    process.exit(1);
  }

  const dbAvatarMap = new Map(dbAvatars.map(a => [a.url, a]));
  const fileUrls = new Set(files.map(f => `/avatars/${f}`));

  // 2. Process Files (Insert or Reactivate)
  for (const file of files) {
    const fileUrl = `/avatars/${file}`;
    const name = path.parse(file).name;
    const formattedName = name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    if (dbAvatarMap.has(fileUrl)) {
      const existing = dbAvatarMap.get(fileUrl);
      if (!existing.is_active) {
        console.log(`Reactivating ${name}...`);
        await supabase
          .from('default_avatars')
          .update({ is_active: true })
          .eq('id', existing.id);
      }
    } else {
      console.log(`Inserting new ${name}...`);
      await supabase
        .from('default_avatars')
        .insert({
          url: fileUrl,
          name: formattedName,
          is_active: true,
          sort_order: 0
        });
    }
  }

  // 3. Deactivate missing files
  for (const dbAvatar of dbAvatars) {
    // Only manage local avatars (starting with /avatars/)
    if (dbAvatar.url.startsWith('/avatars/') && !fileUrls.has(dbAvatar.url) && dbAvatar.is_active) {
       console.log(`Deactivating missing avatar: ${dbAvatar.url}`);
       await supabase
         .from('default_avatars')
         .update({ is_active: false })
         .eq('id', dbAvatar.id);
    }
  }

  console.log('\nSync completed!');
  console.log('You can now manage avatars with: npx tsx scripts/manage_avatars.ts list');
}

// Usage: tsx scripts/import_local_avatars.ts
importLocalAvatars().catch(console.error);