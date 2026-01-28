import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
});

const sql = `
-- =============================================
-- RLS Policies Setup Script
-- Updated for 'accounts' table structure
-- =============================================

-- 1. Accounts Table Policies
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can access their own account" ON public.accounts;

-- Allow users to access/edit only their own account data
CREATE POLICY "Users can access their own account"
ON public.accounts
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );


-- 2. Profiles Table Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Everyone can read profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING ( true );

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK ( auth.uid() = id );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING ( auth.uid() = id );


-- 3. Activities Policies
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Activities are viewable by everyone" ON public.activities;
DROP POLICY IF EXISTS "Authenticated users can create activities" ON public.activities;
DROP POLICY IF EXISTS "Owners and Admins can update activities" ON public.activities;
DROP POLICY IF EXISTS "Owners and Admins can delete activities" ON public.activities;

-- Everyone can read activities (respect visibility handled in app logic or add AND visibility = 'public' here)
CREATE POLICY "Activities are viewable by everyone"
ON public.activities FOR SELECT
USING ( true );

-- Authenticated users can create activities
-- Force organizer_id to be auth.uid() is good practice, but simplistic check here:
CREATE POLICY "Authenticated users can create activities"
ON public.activities FOR INSERT
TO authenticated
WITH CHECK ( auth.uid() = organizer_id );

-- Owners and Admins can update activities
-- Note: This requires the JWT or auth context to map correctly to auth.uid()
CREATE POLICY "Owners and Admins can update activities"
ON public.activities FOR UPDATE
TO authenticated
USING ( 
  auth.uid() = organizer_id 
  OR 
  EXISTS (SELECT 1 FROM public.accounts WHERE id = auth.uid() AND role = 'admin')
);

-- Owners and Admins can delete activities
CREATE POLICY "Owners and Admins can delete activities"
ON public.activities FOR DELETE
TO authenticated
USING ( 
  auth.uid() = organizer_id 
  OR 
  EXISTS (SELECT 1 FROM public.accounts WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Community Members Policies (Example)
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Community members viewable by everyone" ON public.community_members;
CREATE POLICY "Community members viewable by everyone"
ON public.community_members FOR SELECT
USING ( true );

-- Add more policies as needed for other tables...
`;

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');
    
    await client.query(sql);
    console.log('Successfully applied RLS policies.');
    
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();
