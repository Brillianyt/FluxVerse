-- Disable RLS on tags table to ensure public access
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;

-- Disable RLS on activity_tags table to ensure public access
ALTER TABLE activity_tags DISABLE ROW LEVEL SECURITY;

-- Alternatively, if we want to keep RLS but ensure access:
-- ENABLE RLS and ADD POLICIES
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON tags;
CREATE POLICY "Public read access" ON tags FOR SELECT USING (true);

ALTER TABLE activity_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON activity_tags;
CREATE POLICY "Public read access" ON activity_tags FOR SELECT USING (true);
