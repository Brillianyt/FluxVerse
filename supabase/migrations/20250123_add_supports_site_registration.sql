-- Add supports_site_registration column to activities table
-- 0 = not supported (redirect to external link)
-- 1 = supported (use site registration)
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS supports_site_registration INTEGER DEFAULT 1 CHECK (supports_site_registration IN (0, 1));
