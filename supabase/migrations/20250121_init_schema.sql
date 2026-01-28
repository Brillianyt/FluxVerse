-- 1. Users Table (Explicit Public Table as requested)
-- Note: In Supabase, auth is usually handled by auth.users. 
-- This table is created to match the specific requirement: user(id, phone, email, hash_password)
create table public.users (
  id uuid default uuid_generate_v4() primary key,
  phone text,
  email text,
  hash_password text, -- Storing passwords in public schema is not recommended if using Supabase Auth
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Profiles Table (Extends public.users)
-- Matches Profile requirements: username, avatar_url, description, tag
create table public.profiles (
  id uuid references public.users(id) on delete cascade primary key, -- FK to public.users.id
  username text,
  avatar_url text,
  description text,
  tag text, -- New field as requested
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Communities Table
create table public.communities (
  com_id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  pic_url text,
  cover_image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Community Managers Table (Many-to-Many)
create table public.community_managers (
  community_id uuid references public.communities(com_id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'admin',
  primary key (community_id, user_id)
);

-- 5. Activities Table (Events)
create table public.activities (
  ac_id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  
  -- Location fields
  city text,
  address text,
  latitude double precision,
  longitude double precision,
  
  -- Optional link to community
  community_id uuid references public.communities(com_id) on delete set null,
  
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Activity Hosts Table (Many-to-Many)
create table public.activity_hosts (
  activity_id uuid references public.activities(ac_id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (activity_id, user_id)
);

-- 7. Notifications Table
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  ac_id uuid references public.activities(ac_id) on delete set null,
  information text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) - Recommended
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.community_managers enable row level security;
alter table public.activities enable row level security;
alter table public.activity_hosts enable row level security;
alter table public.notifications enable row level security;

-- Basic Policies (Examples - Adjust as needed)
-- Profiles: Everyone can read
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);

-- Activities: Everyone can read
create policy "Activities are viewable by everyone" on public.activities for select using (true);
