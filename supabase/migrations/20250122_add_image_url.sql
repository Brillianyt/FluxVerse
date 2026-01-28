
-- Add cover_image_url to activities table
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
