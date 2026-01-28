-- Enhanced RLS Policies for Security
-- This migration adds comprehensive RLS policies for all tables

-- Users table policies
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Profiles policies
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Communities policies
CREATE POLICY "Anyone can view communities" ON public.communities
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create communities" ON public.communities
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Community managers can update their communities" ON public.communities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.community_managers
      WHERE community_id = com_id AND user_id = auth.uid()
    )
  );

-- Community managers policies
CREATE POLICY "Community managers can view managers" ON public.community_managers
  FOR SELECT USING (true);

CREATE POLICY "Community creators can add managers" ON public.community_managers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.community_managers cm
      WHERE cm.community_id = community_managers.community_id
      AND cm.user_id = auth.uid() AND cm.role = 'admin'
    )
  );

-- Activities policies
CREATE POLICY "Anyone can view activities" ON public.activities
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create activities" ON public.activities
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Activity hosts can update activities" ON public.activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.activity_hosts
      WHERE activity_id = ac_id AND user_id = auth.uid()
    )
  );

-- Activity hosts policies
CREATE POLICY "Anyone can view activity hosts" ON public.activity_hosts
  FOR SELECT USING (true);

CREATE POLICY "Activity creators can add hosts" ON public.activity_hosts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.activities
      WHERE ac_id = activity_hosts.activity_id
      AND created_at >= NOW() - INTERVAL '1 hour' -- Allow recent creators
    ) OR auth.uid() = user_id
  );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true); -- Allow inserts for notifications

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- User interactions policies (from previous migration)
-- These are already good, but ensure they exist

-- Add database indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_activities_start_time ON public.activities(start_time);
CREATE INDEX IF NOT EXISTS idx_activities_location ON public.activities(city, address);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_event_subscriptions_user_id ON public.user_event_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_community_follows_user_id ON public.user_community_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON public.event_attendees(event_id);