
import { supabase } from '../api/lib/supabase';

const cleanupUsers = async () => {
  console.log('Starting cleanup of dirty user data...');
  
  try {
    // 1. Delete users with 'unknown' email
    const { error: deleteUnknownError, count: unknownCount } = await supabase
      .from('users')
      .delete({ count: 'exact' })
      .eq('email', 'unknown');

    if (deleteUnknownError) {
      console.error('Error deleting unknown users:', deleteUnknownError);
    } else {
      console.log(`Deleted ${unknownCount} users with 'unknown' email.`);
    }

    // 2. Delete users with 'placeholder_hash' password (double check)
    const { error: deleteHashError, count: hashCount } = await supabase
      .from('users')
      .delete({ count: 'exact' })
      .eq('hash_password', 'placeholder_hash');

    if (deleteHashError) {
      console.error('Error deleting placeholder hash users:', deleteHashError);
    } else {
      console.log(`Deleted ${hashCount} users with 'placeholder_hash' password.`);
    }

    console.log('Cleanup completed successfully.');
  } catch (error) {
    console.error('Unexpected error during cleanup:', error);
  }
};

cleanupUsers();
