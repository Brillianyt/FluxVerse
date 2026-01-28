-- Create profiles table (renamed from users to avoid conflict with auth.users, but mapping is 1:1)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create events table
CREATE TABLE public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location_name TEXT,
  location_address TEXT,
  latitude FLOAT,
  longitude FLOAT,
  image_url TEXT,
  category TEXT,
  price DECIMAL DEFAULT 0,
  capacity INTEGER,
  organizer_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "Events are viewable by everyone" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Organizers can update their own events" ON public.events
  FOR UPDATE USING (auth.uid() = organizer_id);

-- Create registrations table
CREATE TABLE public.registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  event_id UUID REFERENCES public.events(id) NOT NULL,
  status TEXT DEFAULT 'confirmed', -- confirmed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Enable RLS on registrations
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for registrations
CREATE POLICY "Users can view their own registrations" ON public.registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Organizers can view registrations for their events" ON public.registrations
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = registrations.event_id
    AND events.organizer_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can register" ON public.registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations" ON public.registrations
  FOR UPDATE USING (auth.uid() = user_id);

-- Create bookmarks table
CREATE TABLE public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  event_id UUID REFERENCES public.events(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Enable RLS on bookmarks
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies for bookmarks
CREATE POLICY "Users can view their own bookmarks" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can bookmark" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" ON public.bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Insert some seed data (only if tables are empty, but for migration we just insert)
-- Note: We can't easily insert users since they need to be in auth.users first.
-- So we will just insert some events without organizer_id for now, or assume a dummy one if we could.
-- Actually, for public events, organizer_id can be nullable or we can just skip it for the seed data if RLS allows.
-- But RLS for insert requires authenticated role.
-- We will skip seeding via SQL for now and let the user create events, or I can create a script to seed data via API later.
-- Actually, let's insert some "System" events.

INSERT INTO public.events (title, description, start_time, end_time, location_name, location_address, image_url, category, price, capacity)
VALUES 
(
  'Tech Startup Mixer 2026', 
  'Join us for an evening of networking with the brightest minds in the startup ecosystem. Meet founders, investors, and tech enthusiasts.', 
  NOW() + INTERVAL '2 days', 
  NOW() + INTERVAL '2 days 4 hours', 
  'Innovation Hub', 
  '123 Tech Park, Silicon Valley, CA', 
  'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80', 
  'Tech', 
  0, 
  100
),
(
  'Digital Art Exhibition', 
  'Explore the boundaries of digital art and creativity. Featuring works from top digital artists around the world.', 
  NOW() + INTERVAL '5 days', 
  NOW() + INTERVAL '5 days 6 hours', 
  'Modern Art Gallery', 
  '456 Art District, New York, NY', 
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80', 
  'Art', 
  25.00, 
  50
),
(
  'Yoga & Mindfulness Workshop', 
  'A relaxing session to rejuvenate your mind and body. Suitable for all levels.', 
  NOW() + INTERVAL '1 week', 
  NOW() + INTERVAL '1 week 2 hours', 
  'Serenity Studio', 
  '789 Wellness Blvd, Austin, TX', 
  'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&q=80', 
  'Health', 
  15.00, 
  20
),
(
  'Future of AI Conference', 
  'Deep dive into the latest advancements in Artificial Intelligence and Machine Learning.', 
  NOW() + INTERVAL '10 days', 
  NOW() + INTERVAL '12 days', 
  'Convention Center', 
  '101 AI Way, San Francisco, CA', 
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80', 
  'Tech', 
  299.00, 
  500
);
