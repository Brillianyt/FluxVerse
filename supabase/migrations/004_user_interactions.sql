-- Create user_event_subscriptions table (用户订阅活动日程)
CREATE TABLE public.user_event_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  reminder_enabled BOOLEAN DEFAULT true,
  UNIQUE(user_id, event_id)
);

-- Create user_community_follows table (用户关注社区)
CREATE TABLE public.user_community_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  community_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  followed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, community_id)
);

-- Create event_attendees table (活动参与者)
CREATE TABLE public.event_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'going' CHECK (status IN ('going', 'interested', 'not_going')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.user_event_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_community_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- Policies for user_event_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.user_event_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" ON public.user_event_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions" ON public.user_event_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for user_community_follows
CREATE POLICY "Users can view their own follows" ON public.user_community_follows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view follow counts" ON public.user_community_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own follows" ON public.user_community_follows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own follows" ON public.user_community_follows
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for event_attendees
CREATE POLICY "Anyone can view attendees" ON public.event_attendees
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own attendance" ON public.event_attendees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance" ON public.event_attendees
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attendance" ON public.event_attendees
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX user_event_subscriptions_user_id_idx ON public.user_event_subscriptions(user_id);
CREATE INDEX user_event_subscriptions_event_id_idx ON public.user_event_subscriptions(event_id);
CREATE INDEX user_community_follows_user_id_idx ON public.user_community_follows(user_id);
CREATE INDEX user_community_follows_community_id_idx ON public.user_community_follows(community_id);
CREATE INDEX event_attendees_event_id_idx ON public.event_attendees(event_id);
CREATE INDEX event_attendees_user_id_idx ON public.event_attendees(user_id);

-- Create views for easier querying
CREATE VIEW public.event_stats AS
SELECT 
  e.id,
  e.title,
  COUNT(DISTINCT ea.user_id) FILTER (WHERE ea.status = 'going') as going_count,
  COUNT(DISTINCT ea.user_id) FILTER (WHERE ea.status = 'interested') as interested_count,
  COUNT(DISTINCT ues.user_id) as subscribed_count
FROM public.events e
LEFT JOIN public.event_attendees ea ON e.id = ea.event_id
LEFT JOIN public.user_event_subscriptions ues ON e.id = ues.event_id
GROUP BY e.id, e.title;

CREATE VIEW public.community_stats AS
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  COUNT(DISTINCT ucf.user_id) as followers_count,
  COUNT(DISTINCT e.id) as events_count
FROM public.profiles p
LEFT JOIN public.user_community_follows ucf ON p.id = ucf.community_id
LEFT JOIN public.events e ON p.id = e.organizer_id
WHERE p.is_community = true
GROUP BY p.id, p.full_name, p.avatar_url;
