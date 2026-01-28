import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// 使用 Service Role Key 以确保有权限读取所有数据（如果 RLS 开启）
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log(`Connecting to ${supabaseUrl}...`);
  
  // 查询 public.users 表的所有数据
  const { data, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log(`Successfully retrieved ${data?.length || 0} records from 'users' table:`);
  console.log(JSON.stringify(data, null, 2));
}

main();
