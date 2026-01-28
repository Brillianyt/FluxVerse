-- Update existing activities to set default source_type to 'scraped'
-- and assign organizer to scraper bot account if not already set

-- 1. Set default source_type to 'scraped' for activities without source_type
UPDATE public.activities 
SET source_type = 'scraped'
WHERE source_type IS NULL;

-- 2. For activities with source_type = 'scraped' that don't have a host,
--    assign the scraper bot account as the host
INSERT INTO public.activity_hosts (activity_id, user_id)
SELECT ac_id, '00000000-0000-0000-0000-000000000001'::uuid
FROM public.activities
WHERE source_type = 'scraped'
  AND ac_id NOT IN (
    SELECT activity_id FROM public.activity_hosts
  )
ON CONFLICT (activity_id, user_id) DO NOTHING;

-- 3. For activities with source_type = 'curated' that don't have a host,
--    assign the curator account as the host
INSERT INTO public.activity_hosts (activity_id, user_id)
SELECT ac_id, '00000000-0000-0000-0000-000000000002'::uuid
FROM public.activities
WHERE source_type = 'curated'
  AND ac_id NOT IN (
    SELECT activity_id FROM public.activity_hosts
  )
ON CONFLICT (activity_id, user_id) DO NOTHING;
