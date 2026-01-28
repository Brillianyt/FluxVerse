
import { supabase } from '../api/lib/supabase';

async function checkNotifications() {
  try {
    // 1. Get User ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', '1195222690@qq.com')
      .single();

    if (userError || !user) {
      console.log('User not found');
      return;
    }

    console.log('User ID:', user.id);

    // 2. Check notifications
    // Note: Assuming table name is 'notifications' based on request, 
    // but looking at migrations, we haven't seen a notifications table created yet.
    // Let's try to query it, if it fails, it means table doesn't exist.
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id);

    if (notifError) {
      console.error('Error fetching notifications:', notifError);
    } else {
      console.log('Notifications:', notifications);
    }

  } catch (err) {
    console.error('Script error:', err);
  }
}

checkNotifications();
