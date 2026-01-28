-- Add tags and city to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS city TEXT;

-- Add description and is_community to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_community BOOLEAN DEFAULT false;

-- Create an index for tags for faster searching (GIN index)
CREATE INDEX IF NOT EXISTS events_tags_idx ON public.events USING GIN (tags);

-- Create an index for city
CREATE INDEX IF NOT EXISTS events_city_idx ON public.events (city);
