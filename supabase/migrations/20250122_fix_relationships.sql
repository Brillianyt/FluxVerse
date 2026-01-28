
-- Re-create the foreign key relationship to ensure PostgREST detects it
-- This is for the activities -> activity_hosts relationship

-- 1. Drop existing constraint if it exists (we might need to guess the name or just alter column)
--    We'll try to explicitly add it with a known name.

DO $$
BEGIN
    -- Try to drop constraint if we can find its name, or just alter the column
    -- It's safer to just ADD it if missing, or Drop/Add.
    -- Let's assume the standard naming convention or just try to add a new explicit one.
    
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'activity_hosts_activity_id_fkey' 
        AND table_name = 'activity_hosts'
    ) THEN
        ALTER TABLE public.activity_hosts DROP CONSTRAINT activity_hosts_activity_id_fkey;
    END IF;
END $$;

-- 2. Add the constraint explicitly
ALTER TABLE public.activity_hosts
ADD CONSTRAINT activity_hosts_activity_id_fkey
FOREIGN KEY (activity_id)
REFERENCES public.activities(ac_id)
ON DELETE CASCADE;

-- 3. Also check the user_id FK just in case
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'activity_hosts_user_id_fkey' 
        AND table_name = 'activity_hosts'
    ) THEN
        ALTER TABLE public.activity_hosts DROP CONSTRAINT activity_hosts_user_id_fkey;
    END IF;
END $$;

ALTER TABLE public.activity_hosts
ADD CONSTRAINT activity_hosts_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 4. Notify PostgREST to reload schema (Not possible via SQL directly on Supabase usually, but DDL often triggers it)
COMMENT ON TABLE public.activity_hosts IS 'Junction table for event hosts. Triggers schema refresh.';
