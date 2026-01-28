-- Add source_type, is_info_verified, and original_link columns to activities table
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS source_type TEXT CHECK (source_type IN ('curated', 'scraped', 'user_submitted')),
ADD COLUMN IF NOT EXISTS is_info_verified INTEGER DEFAULT 1 CHECK (is_info_verified IN (0, 1)),
ADD COLUMN IF NOT EXISTS original_link TEXT;
