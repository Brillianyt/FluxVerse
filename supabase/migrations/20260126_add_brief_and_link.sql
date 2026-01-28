-- Add new fields to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS brief TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS original_link TEXT;
