-- Enable RLS
ALTER TABLE activity_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Activity tags are viewable by everyone" ON activity_tags;
DROP POLICY IF EXISTS "Users can insert activity tags" ON activity_tags;
DROP POLICY IF EXISTS "Public insert access" ON activity_tags;

-- 1. Allow everyone to READ
CREATE POLICY "Activity tags are viewable by everyone" 
ON activity_tags FOR SELECT 
USING (true);

-- 2. Allow authenticated users to INSERT
CREATE POLICY "Users can insert activity tags" 
ON activity_tags FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 3. Allow anonymous/service_role to INSERT (for seeding scripts)
-- WARNING: In production, you might want to restrict this more.
CREATE POLICY "Public insert access" 
ON activity_tags FOR INSERT 
WITH CHECK (true);
