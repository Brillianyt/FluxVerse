-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT, -- Lucide icon name
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create junction table for activity tags
CREATE TABLE IF NOT EXISTS activity_tags (
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (activity_id, tag_id)
);

-- Index for performance
CREATE INDEX idx_activity_tags_tag ON activity_tags(tag_id);
CREATE INDEX idx_activity_tags_activity ON activity_tags(activity_id);

-- Seed initial tags (combining previous categories and new tags)
INSERT INTO tags (name, slug, icon, description, sort_order) VALUES
('Tech', 'tech', 'Code', 'Technology and programming events', 10),
('Art', 'art', 'Palette', 'Artistic exhibitions and workshops', 20),
('Music', 'music', 'Music', 'Live music and concerts', 30),
('Business', 'business', 'Briefcase', 'Networking and business summits', 40),
('Social', 'social', 'Users', 'Social gatherings and meetups', 50),
('Health', 'health', 'Activity', 'Health and wellness activities', 60),
('Hackathon', 'hackathon', 'Terminal', '汇聚极客力量，挑战代码极限', 70),
('Web3', 'web3', 'Cpu', '探索去中心化网络的未来与机遇', 80),
('Content', 'content', 'PenTool', '释放创意，打造个人影响力的舞台', 90),
('Workshop', 'workshop', 'Wrench', '动手实战，快速掌握前沿技术技能', 100)
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description;
