-- Migration: Supplement missing activity fields
-- Date: 2026-01-27

ALTER TABLE activities ADD COLUMN IF NOT EXISTS brief TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS original_link TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS category TEXT;

-- Comment: These fields were found missing during audit of CreateEvent.tsx and EventDetails.tsx
COMMENT ON COLUMN activities.brief IS '活动简介 (一句话描述)';
COMMENT ON COLUMN activities.original_link IS '原始活动链接';
COMMENT ON COLUMN activities.highlights IS '活动亮点列表 (JSON 数组)';
COMMENT ON COLUMN activities.category IS '活动主要分类 (冗余字段，方便快速查询)';
