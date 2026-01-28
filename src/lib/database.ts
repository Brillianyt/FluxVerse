import { supabase } from './supabase.ts';
import { Event, City, Community, Profile, Category } from '../types/index.ts';

// --- Helpers for Schema Adaptation ---

/**
 * Maps a DB 'activities' row to an App 'Event' object.
 */
const toEvent = (activity: any): Event => {
  // Prefer direct timestamp fields if available, otherwise fallback to date fields
  const startTimeIso = activity.start_time 
    ? new Date(activity.start_time).toISOString() 
    : (activity.start_date ? new Date(activity.start_date).toISOString() : new Date().toISOString());
    
  const endTimeIso = activity.end_time 
    ? new Date(activity.end_time).toISOString() 
    : (activity.end_date ? new Date(activity.end_date).toISOString() : startTimeIso);

  return {
    id: activity.id,
    title: activity.title,
    description: activity.description,
    
    // Time fields
    start_date: activity.start_date,
    end_date: activity.end_date,
    time_info: activity.time_info,
    start_time: startTimeIso,
    end_time: endTimeIso,

    location_name: activity.location_name || activity.city?.name || 'Unknown Location',
    address: activity.address,
    
    // Coordinates: validation to ensure non-zero if possible, or allow 0
    latitude: activity.latitude !== undefined ? activity.latitude : (activity.city?.latitude || 0),
    longitude: activity.longitude !== undefined ? activity.longitude : (activity.city?.longitude || 0),
    
    cover_image_url: activity.cover_image_url || activity.image_url || 'https://via.placeholder.com/800x600?text=No+Image',
    
    price: activity.price || 0,
    currency: activity.currency || 'CNY',
    capacity: activity.capacity || 0,
    
    status: activity.status as any,
    
    // Relations
    city_id: activity.city_id,
    community_id: activity.community_id,
    organizer_id: activity.organizer_id,
    
    // Joined data (if available)
    city: activity.city?.name, // Flatten city name
    
    // Extended fields (assuming they exist in DB via migrations)
    source_type: activity.source_type || 'scraped',
    is_info_verified: activity.is_info_verified ?? 1,
    original_link: activity.original_link,
    supports_site_registration: activity.supports_site_registration ?? 0,
    
    // Map category field
    category: activity.category || 'General',
    category_ids: activity.category ? [activity.category] : [],
    
    // New fields
    brief: activity.brief,
    visibility: activity.visibility || 'public',
    needs_approval: activity.needs_approval,
    highlights: activity.highlights || [],
  };
};

// --- User & Profiles ---

export const getProfileById = async (id: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  if (!data) return null;

  return {
    id: data.id,
    username: data.username,
    full_name: data.full_name,
    avatar_url: data.avatar_url,
    website: data.website,
    description: data.description,
    social_links: data.social_links,
    is_community: false 
  };
};

/**
 * Gets the current user's profile
 */
export const getCurrentProfile = async (): Promise<Profile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return getProfileById(user.id);
};

// --- Activities ---

export const getAllEvents = async (): Promise<Event[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select(`
      *,
      city:cities(name, latitude, longitude),
      community:communities(name, avatar_url),
      organizer:profiles!organizer_id(full_name, avatar_url)
    `)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  return data.map(toEvent);
};

export const getEventById = async (id: string): Promise<Event | null> => {
  const { data, error } = await supabase
    .from('activities')
    .select(`
      *,
      city:cities(name, latitude, longitude),
      community:communities(name, avatar_url),
      organizer:profiles!organizer_id(full_name, avatar_url)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? toEvent(data) : null;
};

export const createEvent = async (eventData: Partial<Event>, userId: string): Promise<Event | null> => {
  // Prepare payload for 'activities' table
  const payload: any = {
    title: eventData.title,
    description: eventData.description,
    start_date: eventData.start_date, // Expecting YYYY-MM-DD
    end_date: eventData.end_date || eventData.start_date,
    time_info: eventData.time_info,
    
    // Exact timestamps and location for migration
    start_time: eventData.start_time,
    end_time: eventData.end_time || eventData.start_time,
    latitude: eventData.latitude,
    longitude: eventData.longitude,
    
    city_id: eventData.city_id,
    community_id: eventData.community_id,
    organizer_id: userId, // Set current user as organizer
    
    location_name: eventData.location_name,
    address: eventData.address, // Changed from location_address
    cover_image_url: eventData.cover_image_url,
    
    price: eventData.price || 0,
    capacity: eventData.capacity,
    
    status: 'published', // Default to published
    
    // Extended fields
    source_type: eventData.source_type || 'user_submitted',
    is_info_verified: eventData.is_info_verified ?? 1,
    original_link: eventData.original_link,
    supports_site_registration: eventData.supports_site_registration ?? 0,
    brief: eventData.brief,
    visibility: eventData.visibility || 'public',
    needs_approval: eventData.needs_approval ?? false,
    
    // New fields
    highlights: eventData.highlights || [],
    
    // Category Handling (Using 'category' field for now as primary tag)
    category: (eventData.category_ids && eventData.category_ids.length > 0) ? eventData.category_ids[0] : 'Other'
  };

  const { data: activity, error } = await supabase
    .from('activities')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error creating event:', error);
    throw error;
  }

  // Insert Tags (activity_tags)
  if (activity && eventData.category_ids && eventData.category_ids.length > 0) {
    const tagInserts = eventData.category_ids.map(tagId => ({
      activity_id: activity.id,
      tag_id: tagId
    }));
    
    const { error: tagError } = await supabase
      .from('activity_tags')
      .insert(tagInserts);
      
    if (tagError) {
      console.error('Error linking tags:', tagError);
      // We don't throw here to avoid failing the whole event creation if tagging fails
    }
  }

  return toEvent(activity);
};

export const updateEvent = async (eventId: string, eventData: Partial<Event>): Promise<Event | null> => {
  const payload: any = {};
  
  // Generic mapping - could be optimized
  if (eventData.title !== undefined) payload.title = eventData.title;
  if (eventData.description !== undefined) payload.description = eventData.description;
  if (eventData.brief !== undefined) payload.brief = eventData.brief;
  
  if (eventData.start_date !== undefined) payload.start_date = eventData.start_date;
  if (eventData.end_date !== undefined) payload.end_date = eventData.end_date;
  if (eventData.time_info !== undefined) payload.time_info = eventData.time_info;
  
  if (eventData.start_time !== undefined) payload.start_time = eventData.start_time;
  if (eventData.end_time !== undefined) payload.end_time = eventData.end_time;
  
  if (eventData.latitude !== undefined) payload.latitude = eventData.latitude;
  if (eventData.longitude !== undefined) payload.longitude = eventData.longitude;
  
  if (eventData.city_id !== undefined) payload.city_id = eventData.city_id;
  if (eventData.community_id !== undefined) payload.community_id = eventData.community_id;
  
  if (eventData.location_name !== undefined) payload.location_name = eventData.location_name;
  if (eventData.address !== undefined) payload.address = eventData.address;
  if (eventData.cover_image_url !== undefined) payload.cover_image_url = eventData.cover_image_url;
  
  if (eventData.price !== undefined) payload.price = eventData.price;
  if (eventData.capacity !== undefined) payload.capacity = eventData.capacity;
  
  if (eventData.visibility !== undefined) payload.visibility = eventData.visibility;
  if (eventData.original_link !== undefined) payload.original_link = eventData.original_link;
  if (eventData.highlights !== undefined) payload.highlights = eventData.highlights;

  if (eventData.category_ids && eventData.category_ids.length > 0) {
      payload.category = eventData.category_ids[0];
  }

  const { data: activity, error } = await supabase
    .from('activities')
    .update(payload)
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    console.error('Error updating event:', error);
    throw error;
  }

  // Update Tags
  if (activity && eventData.category_ids) {
    await supabase.from('activity_tags').delete().eq('activity_id', eventId);
    
    if (eventData.category_ids.length > 0) {
        const tagInserts = eventData.category_ids.map(tagId => ({
            activity_id: activity.id,
            tag_id: tagId
        }));
        await supabase.from('activity_tags').insert(tagInserts);
    }
  }

  return toEvent(activity);
};

export const getEventsByOrganizer = async (organizerId: string): Promise<Event[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('organizer_id', organizerId)
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data.map(toEvent);
};

export const getEventsByCommunity = async (communityId: string): Promise<Event[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('community_id', communityId)
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data.map(toEvent);
};

// --- Communities ---

export const getAllCommunities = async (): Promise<Community[]> => {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data; // Community interface matches DB columns mostly
};

export const getCommunityById = async (idOrSlug: string): Promise<Community | null> => {
  // Check if input is a valid UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq(isUuid ? 'id' : 'slug', idOrSlug)
    .maybeSingle();

  if (error) {
      console.warn('Error fetching community:', error);
      return null;
  }
  return data;
};

// --- Cities ---

export const getCities = async (): Promise<City[]> => {
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data;
};

/**
 * Optimized City Statistics
 * Fetches only city_id from activities to count in memory, 
 * or uses a more targeted query if cities are many.
 */
export const getCityStats = async (): Promise<Record<string, number>> => {
  // We only select the city_id column to minimize data transfer
  const { data, error } = await supabase
    .from('activities')
    .select('city_id')
    .not('city_id', 'is', null);

  if (error) {
    console.error('Error fetching city stats:', error);
    return {};
  }

  const stats: Record<string, number> = {};
  data.forEach((item: any) => {
    if (item.city_id) {
      stats[item.city_id] = (stats[item.city_id] || 0) + 1;
    }
  });

  return stats;
};

/**
 * Efficient Hot Events Fetching
 * Fetches only the top N events, sorted by start time or other criteria
 */
export const getHotEvents = async (limit = 6): Promise<Event[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select(`
      *,
      city:cities(name, latitude, longitude),
      community:communities(name, avatar_url),
      organizer:profiles!organizer_id(full_name, avatar_url)
    `)
    .order('start_time', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching hot events:', error);
    return [];
  }

  return data.map(toEvent);
};

/**
 * Efficient Nearby/City Events Fetching
 */
export const getEventsByCityName = async (cityName: string, limit = 6): Promise<Event[]> => {
  // First find the city ID
  const { data: city } = await supabase
    .from('cities')
    .select('id')
    .eq('name', cityName)
    .maybeSingle();

  if (!city) return [];

  const { data, error } = await supabase
    .from('activities')
    .select(`
      *,
      city:cities(name, latitude, longitude),
      community:communities(name, avatar_url),
      organizer:profiles!organizer_id(full_name, avatar_url)
    `)
    .eq('city_id', city.id)
    .order('start_time', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching events by city:', error);
    return [];
  }

  return data.map(toEvent);
};

// --- Attendance / Participation ---

export const joinEvent = async (eventId: string, userId: string, status: 'going' | 'interested' = 'going') => {
  const { error } = await supabase
    .from('activity_participants')
    .upsert({
      activity_id: eventId,
      user_id: userId,
      status: status
    });

  if (error) throw error;
};

export const leaveEvent = async (eventId: string, userId: string) => {
  const { error } = await supabase
    .from('activity_participants')
    .delete()
    .eq('activity_id', eventId)
    .eq('user_id', userId);

  if (error) throw error;
};

export const getUserAttendance = async (userId: string) => {
  const { data, error } = await supabase
    .from('activity_participants')
    .select(`
      *,
      activity:activities(*)
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return data.map((item: any) => ({
    ...item,
    event: toEvent(item.activity)
  }));
};

// --- Compatibility & Legacy Helpers ---

const FALLBACK_TAGS: Category[] = [
  { id: '1', name: 'Tech', slug: 'tech', icon: 'Code', description: 'Technology and programming events', sort_order: 10 },
  { id: '2', name: 'Art', slug: 'art', icon: 'Palette', description: 'Artistic exhibitions and workshops', sort_order: 20 },
  { id: '3', name: 'Music', slug: 'music', icon: 'Music', description: 'Live music and concerts', sort_order: 30 },
  { id: '4', name: 'Business', slug: 'business', icon: 'Briefcase', description: 'Networking and business summits', sort_order: 40 },
  { id: '5', name: 'Social', slug: 'social', icon: 'Users', description: 'Social gatherings and meetups', sort_order: 50 },
  { id: '6', name: 'Health', slug: 'health', icon: 'Activity', description: 'Health and wellness activities', sort_order: 60 },
  { id: '7', name: 'Hackathon', slug: 'hackathon', icon: 'Terminal', description: '汇聚极客力量，挑战代码极限', sort_order: 70 },
  { id: '8', name: 'Web3', slug: 'web3', icon: 'Cpu', description: '探索去中心化网络的未来与机遇', sort_order: 80 },
  { id: '9', name: 'Content', slug: 'content', icon: 'PenTool', description: '释放创意，打造个人影响力的舞台', sort_order: 90 },
  { id: '10', name: 'Workshop', slug: 'workshop', icon: 'Wrench', description: '动手实战，快速掌握前沿技术技能', sort_order: 100 }
];

export const getCategories = async (): Promise<Category[]> => {
  // 1. Fetch all tags
  const { data: tags, error } = await supabase
    .from('tags')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error || !tags || tags.length === 0) {
    if (error) console.error('Error fetching categories (using fallback):', error);
    // Fallback if table doesn't exist or error, to ensure UI looks good
    return FALLBACK_TAGS;
  }
  
  // console.log('Fetched tags:', tags);


  // 2. Fetch event counts for each tag
  // This is an aggregation query. Supabase/PostgREST doesn't support complex joins + count easily in one go for this structure
  // without a view or RPC. We will do it in code for now or use a raw RPC if performance is needed.
  // For small scale, we can just query activity_tags.
  
  // NOTE: activity_tags view policy must be public for this to work
  const { data: tagCounts, error: countError } = await supabase
    .from('activity_tags')
    .select('tag_id');

  if (countError) {
      console.error('Error fetching tag counts:', countError);
      // Return tags anyway, just without counts
      return tags;
  }

  // Count locally
  const counts: Record<string, number> = {};
  tagCounts.forEach((item: any) => {
      counts[item.tag_id] = (counts[item.tag_id] || 0) + 1;
  });

  return tags.map((tag: any) => ({
      ...tag,
      event_count: counts[tag.id] || 0
  }));
};

// New function to fetch events by tag slug
export const getEventsByTag = async (tagSlug: string): Promise<Event[]> => {
  // Find the tag first
  const { data: tag } = await supabase
    .from('tags')
    .select('id')
    .eq('slug', tagSlug)
    .single();

  if (!tag) return [];

  // Find activities linked to this tag
  const { data, error } = await supabase
    .from('activity_tags')
    .select(`
      activity:activities(
        *,
        city:cities(name, latitude, longitude),
        community:communities(name, avatar_url),
        organizer:profiles!organizer_id(full_name, avatar_url)
      )
    `)
    .eq('tag_id', tag.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching events by tag:', error);
    return [];
  }

  // Map nested activity object
  return data.map((item: any) => toEvent(item.activity));
};

export const getTagBySlug = async (slug: string): Promise<Category | null> => {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching tag:', error);
    return null;
  }
  return data;
};

export const subscribeToEvent = async (eventId: string, userId: string) => {
  return joinEvent(eventId, userId, 'interested');
};

export const unsubscribeFromEvent = async (eventId: string, userId: string) => {
  return leaveEvent(eventId, userId);
};

export const isEventSubscribed = async (eventId: string, userId: string) => {
   const { data } = await supabase
     .from('activity_participants')
     .select('*')
     .eq('activity_id', eventId)
     .eq('user_id', userId)
     .maybeSingle();
   return !!data;
};

export const getUserSubscriptions = async (userId: string) => {
   // Map attendance to subscription format if needed by UI
   const attendance = await getUserAttendance(userId);
   return attendance.map((a: any) => ({
     id: `${a.activity_id}_${a.user_id}`,
     user_id: a.user_id,
     event_id: a.activity_id,
     event: a.event,
     subscribed_at: a.created_at
   }));
};

export const getUserCommunityRoles = async (userId: string) => {
  const { data } = await supabase
    .from('community_members')
    .select('*, community:communities(*)')
    .eq('user_id', userId);
    
  return (data || []).map((item: any) => ({
    id: `${item.community_id}_${item.user_id}`,
    user_id: item.user_id,
    community_id: item.community_id,
    role: item.role,
    joined_at: item.joined_at,
    community: item.community
  }));
};

export const followCommunity = async (communityId: string, userId: string) => {
  const { error } = await supabase
    .from('community_subscriptions')
    .upsert({
      community_id: communityId,
      user_id: userId
    });

  if (error) throw error;
};

export const unfollowCommunity = async (communityId: string, userId: string) => {
  const { error } = await supabase
    .from('community_subscriptions')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', userId);

  if (error) throw error;
};

export const isCommunityFollowed = async (communityId: string, userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('community_subscriptions')
    .select('*')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
      console.error('Error checking community follow status:', error);
      return false;
  }
  return !!data;
};

export const getCommunityStats = async (communityId: string) => {
    // Get subscriber count
    const { count: subscriberCount, error: subError } = await supabase
        .from('community_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId);
    
    // Get event count
    const { count: eventCount, error: eventError } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId);

    return {
        subscribers: subscriberCount || 0,
        events: eventCount || 0
    };
};
