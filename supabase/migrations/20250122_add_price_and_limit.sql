
-- Add price and people_limitation columns to activities table
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS price DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS people_limitation INTEGER DEFAULT 0;
