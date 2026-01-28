
-- Enable RLS for communities table
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if any (to avoid conflicts)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'Communities are viewable by everyone'
    ) THEN
        CREATE POLICY "Communities are viewable by everyone" ON public.communities FOR SELECT USING (true);
    END IF;
END
$$;
