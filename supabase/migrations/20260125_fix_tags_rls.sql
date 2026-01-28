-- Enable RLS on tags table
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to view tags
CREATE POLICY "Tags are viewable by everyone" 
ON tags FOR SELECT 
USING (true);

-- Allow authenticated users to insert tags (optional, if you want users to create new tags)
-- CREATE POLICY "Users can insert tags" ON tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Ensure activity_tags is also viewable
ALTER TABLE activity_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity tags are viewable by everyone" 
ON activity_tags FOR SELECT 
USING (true);

CREATE POLICY "Users can insert activity tags" 
ON activity_tags FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Verify data exists (optional seed again if empty)
INSERT INTO tags (name, slug, icon, description, sort_order) 
SELECT 'Tech', 'tech', 'Code', 'Technology and programming events', 10
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug = 'tech');

INSERT INTO tags (name, slug, icon, description, sort_order) 
SELECT 'Art', 'art', 'Palette', 'Artistic exhibitions and workshops', 20
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug = 'art');

INSERT INTO tags (name, slug, icon, description, sort_order) 
SELECT 'Music', 'music', 'Music', 'Live music and concerts', 30
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug = 'music');

INSERT INTO tags (name, slug, icon, description, sort_order) 
SELECT 'Business', 'business', 'Briefcase', 'Networking and business summits', 40
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug = 'business');

INSERT INTO tags (name, slug, icon, description, sort_order) 
SELECT 'Social', 'social', 'Users', 'Social gatherings and meetups', 50
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug = 'social');

INSERT INTO tags (name, slug, icon, description, sort_order) 
SELECT 'Health', 'health', 'Activity', 'Health and wellness activities', 60
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug = 'health');

INSERT INTO tags (name, slug, icon, description, sort_order) 
SELECT 'Hackathon', 'hackathon', 'Terminal', '汇聚极客力量，挑战代码极限', 70
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug = 'hackathon');

INSERT INTO tags (name, slug, icon, description, sort_order) 
SELECT 'Web3', 'web3', 'Cpu', '探索去中心化网络的未来与机遇', 80
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug = 'web3');

INSERT INTO tags (name, slug, icon, description, sort_order) 
SELECT 'Content', 'content', 'PenTool', '释放创意，打造个人影响力的舞台', 90
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug = 'content');

INSERT INTO tags (name, slug, icon, description, sort_order) 
SELECT 'Workshop', 'workshop', 'Wrench', '动手实战，快速掌握前沿技术技能', 100
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE slug = 'workshop');
