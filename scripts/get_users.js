import { supabase } from '../src/lib/supabase.js';

async function getUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log('Users in the database:');
  data.forEach(user => {
    console.log(`ID: ${user.id}, Email: ${user.email}, Full Name: ${user.full_name}`);
  });
}

getUsers();