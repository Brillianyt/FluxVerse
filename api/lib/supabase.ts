import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

// Helper to check if key looks like a JWT
const isJwt = (key?: string) => key?.startsWith('eyJ');

let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// If Service Role Key is invalid (not a JWT) or missing, try Anon Key
if (!isJwt(supabaseKey)) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is missing or invalid (not a JWT). Falling back to VITE_SUPABASE_ANON_KEY.');
    supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
}

if (!supabaseUrl || !supabaseKey) {
  // throw new Error('Missing Supabase environment variables in backend');
  console.error('Missing Supabase environment variables in backend. Backend Auth will fail.');
}

// Ensure we don't crash the server if envs are missing, but calls will fail later
export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
