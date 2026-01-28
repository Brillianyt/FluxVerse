import { supabase } from '../src/lib/supabase.ts';

// Script to manage default avatars
async function manageDefaultAvatars() {
  const action = process.argv[2]; // 'add', 'list', 'update'

  if (action === 'add') {
    const url = process.argv[3];
    const name = process.argv[4] || null;

    if (!url) {
      console.error('Usage: tsx scripts/manage_avatars.ts add <url> [name]');
      process.exit(1);
    }

    const { error } = await supabase
      .from('default_avatars')
      .insert({ url, name, is_active: true });

    if (error) {
      console.error('Error adding avatar:', error);
    } else {
      console.log('Avatar added successfully');
    }
  } else if (action === 'list') {
    const { data, error } = await supabase
      .from('default_avatars')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('Error listing avatars:', error);
    } else {
      console.log('Default Avatars:');
      data?.forEach(avatar => {
        console.log(`${avatar.id}: ${avatar.name || 'Unnamed'} - ${avatar.url} (${avatar.is_active ? 'Active' : 'Inactive'})`);
      });
    }
  } else if (action === 'update') {
    const id = process.argv[3];
    const updates: any = {};

    if (process.argv[4]) updates.url = process.argv[4];
    if (process.argv[5]) updates.name = process.argv[5];
    if (process.argv[6]) updates.is_active = process.argv[6] === 'true';

    if (!id || Object.keys(updates).length === 0) {
      console.error('Usage: tsx scripts/manage_avatars.ts update <id> [url] [name] [is_active]');
      process.exit(1);
    }

    const { error } = await supabase
      .from('default_avatars')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating avatar:', error);
    } else {
      console.log('Avatar updated successfully');
    }
  } else {
    console.log('Usage: tsx scripts/manage_avatars.ts <add|list|update> [args]');
  }
}

manageDefaultAvatars().catch(console.error);