-- =============================================
-- FluxVerse Database Schema (Standard Production)
-- Version: 3.0
-- Description: 独立账号体系 + 城市/社群/活动系统 (日期级精度)
-- =============================================

-- 0. 扩展准备
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- 用于密码哈希加密

-- =============================================
-- 1. 用户与认证系统 (Accounts & Profiles)
-- =============================================

-- 1.1 账号表：仅存储登录核心凭证
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- 使用 crypt() 处理后的哈希
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.2 个人资料表：存储公开信息
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    description TEXT,
    social_links JSONB DEFAULT '{}'::jsonb, -- e.g. {"wechat": "xxx", "twitter": "xxx"}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 1.3 默认头像库：存储SVG头像URL
CREATE TABLE IF NOT EXISTS default_avatars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL UNIQUE,
    name TEXT, -- 可选：头像名称，如 "avatar-001"
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. 城市系统 (Cities)
-- =============================================

CREATE TABLE IF NOT EXISTS cities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,       -- e.g. "Shanghai"
    label TEXT NOT NULL,      -- e.g. "上海"
    slug TEXT UNIQUE NOT NULL, -- 路径名 e.g. "shanghai"
    region TEXT,              -- e.g. "China"
    latitude FLOAT,
    longitude FLOAT,
    icon_url TEXT,
    cover_image_url TEXT,
    description TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. 社群系统 (Communities)
-- =============================================

CREATE TABLE IF NOT EXISTS communities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    avatar_url TEXT,
    cover_image_url TEXT,
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 社群成员关系
CREATE TABLE IF NOT EXISTS community_members (
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- 'owner', 'admin', 'moderator', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (community_id, user_id)
);

-- =============================================
-- 4. 活动系统 (Activities)
-- =============================================

CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    
    -- 时间维度
    start_time TIMESTAMP WITH TIME ZONE, -- 为了精确排序和日历功能，建议增加精确时间字段
    end_time TIMESTAMP WITH TIME ZONE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    time_info TEXT, -- 补充具体时间描述，如 "10:00 - 18:00" 或 "周末全天"
    
    -- 关联
    city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
    community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
    organizer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- 地点与元数据
    location_name TEXT, -- 地点名称 e.g. "西岸艺术中心"
    address TEXT,       -- 详细地址
    latitude FLOAT,     -- 经度
    longitude FLOAT,    -- 纬度
    
    cover_image_url TEXT,
    image_url TEXT,     -- 前端主要使用的图片字段别名
    
    price DECIMAL(10, 2) DEFAULT 0,
    currency TEXT DEFAULT 'CNY',
    capacity INT,       -- NULL 代表无限制
    
    -- 链接与详情
    brief TEXT,          -- 活动简介（一句话描述）
    original_link TEXT,  -- 原始活动链接/报名链接
    
    -- 原系统字段
    source_type TEXT DEFAULT 'user_submitted', -- 'curated' | 'scraped' | 'user_submitted'
    is_info_verified INT DEFAULT 0,
    supports_site_registration INT DEFAULT 0,
    visibility TEXT DEFAULT 'public',
    needs_approval BOOLEAN DEFAULT FALSE,
    
    -- 扩展字段
    highlights JSONB DEFAULT '[]'::jsonb,
    category TEXT,
    
    status TEXT DEFAULT 'published', -- 'draft', 'published', 'cancelled'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 活动报名/参与关系
CREATE TABLE IF NOT EXISTS activity_participants (
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'going', -- 'going', 'interested', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (activity_id, user_id)
);

-- =============================================
-- 5. 性能与自动化 (Indexes & Triggers)
-- =============================================

-- 索引：优化检索效率
CREATE INDEX idx_activities_dates ON activities(start_date, end_date);
CREATE INDEX idx_activities_city ON activities(city_id);
CREATE INDEX idx_activities_community ON activities(community_id);
CREATE INDEX idx_profiles_username ON profiles(username);

-- 自动更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_profiles_at ON profiles;
CREATE TRIGGER trg_update_profiles_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

DROP TRIGGER IF EXISTS trg_update_activities_at ON activities;
CREATE TRIGGER trg_update_activities_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- =============================================
-- 6. 初始化种子数据 (Seeds)
-- =============================================

INSERT INTO cities (name, label, slug, region, description, icon_url, cover_image_url) VALUES
('Shanghai', '上海', 'shanghai', 'China', '魔都，当代艺术与商业的中心', 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9?w=200&fit=crop', 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9?w=1200&fit=crop'),
('Beijing', '北京', 'beijing', 'China', '帝都，深厚的历史文化底蕴', 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=200&fit=crop', 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200&fit=crop')
ON CONFLICT (slug) DO NOTHING;

-- 插入管理员账户 (密码: FluxPass123)
-- 注意：如果 email 已存在会报错，实际使用中可以加 ON CONFLICT
INSERT INTO accounts (email, password_hash)
VALUES ('admin@fluxverse.com', crypt('FluxPass123', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;






























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






CREATE TABLE IF NOT EXISTS community_subscriptions (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, community_id)
);

-- =============================================
-- 种子数据：默认头像库
-- =============================================

-- 插入一些示例SVG头像（使用DiceBear Avataaars API的不同种子）
INSERT INTO default_avatars (url, name, sort_order) VALUES
('https://api.dicebear.com/7.x/avataaars/svg?seed=avatar-001', 'Avatar 001', 1),
('https://api.dicebear.com/7.x/avataaars/svg?seed=avatar-002', 'Avatar 002', 2),
('https://api.dicebear.com/7.x/avataaars/svg?seed=avatar-003', 'Avatar 003', 3),
('https://api.dicebear.com/7.x/avataaars/svg?seed=avatar-004', 'Avatar 004', 4),
('https://api.dicebear.com/7.x/avataaars/svg?seed=avatar-005', 'Avatar 005', 5),
('https://api.dicebear.com/7.x/avataaars/svg?seed=avatar-006', 'Avatar 006', 6),
('https://api.dicebear.com/7.x/avataaars/svg?seed=avatar-007', 'Avatar 007', 7),
('https://api.dicebear.com/7.x/avataaars/svg?seed=avatar-008', 'Avatar 008', 8),
('https://api.dicebear.com/7.x/avataaars/svg?seed=avatar-009', 'Avatar 009', 9),
('https://api.dicebear.com/7.x/avataaars/svg?seed=avatar-010', 'Avatar 010', 10)
ON CONFLICT (url) DO NOTHING;