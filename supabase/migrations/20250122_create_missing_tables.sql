
-- Create missing tables if they don't exist

-- 4. Community Managers Table
CREATE TABLE IF NOT EXISTS public.community_managers (
  community_id uuid references public.communities(com_id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'admin',
  primary key (community_id, user_id)
);

-- 6. Activity Hosts Table
CREATE TABLE IF NOT EXISTS public.activity_hosts (
  activity_id uuid references public.activities(ac_id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (activity_id, user_id)
);

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  ac_id uuid references public.activities(ac_id) on delete set null,
  information text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.community_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Add Policies

-- Activity Hosts: Everyone can read (to see who is hosting)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'activity_hosts' AND policyname = 'Activity hosts are viewable by everyone'
    ) THEN
        CREATE POLICY "Activity hosts are viewable by everyone" ON public.activity_hosts FOR SELECT USING (true);
    END IF;
END
$$;

-- Activity Hosts: Hosts can insert (or just authenticated users for now)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'activity_hosts' AND policyname = 'Authenticated can insert hosts'
    ) THEN
        CREATE POLICY "Authenticated can insert hosts" ON public.activity_hosts FOR INSERT WITH CHECK (true);
    END IF;
END
$$;

-- Notifications: Users can view their own
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view their own notifications'
    ) THEN
        CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Notifications: Users can insert (for subscribing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can insert their own notifications'
    ) THEN
        CREATE POLICY "Users can insert their own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

-- Notifications: Users can delete (for unsubscribing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can delete their own notifications'
    ) THEN
        CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
    END IF;
END
$$;
