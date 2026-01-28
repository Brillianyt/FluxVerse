export interface Event {
  id: string;
  title: string;
  description: string;
  
  // 时间相关 (适配 activities 表)
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  time_info?: string; // e.g. "14:00 - 16:00"

  // 兼容前端组件的计算字段 (在数据层转换)
  start_time?: string; // ISO String for sorting/calendar
  end_time?: string;   // ISO String
  
  location_name: string;
  address?: string;     // 对应 address
  latitude?: number;
  longitude?: number;
  
  cover_image_url: string; // 对应 DB
  
  price: number;
  currency?: string;
  capacity: number;
  
  // 关联
  city_id?: string;
  community_id?: string;
  organizer_id?: string;
  
  // 状态
  status?: 'draft' | 'published' | 'cancelled';

  // 额外字段 (可能需要 join 或保留用于 UI)
  category?: string;
  category_ids?: string[];
  tags?: string[];
  city?: string; // 城市名称
  
  visibility?: 'public' | 'private';
  needs_approval?: boolean;
  source_type?: 'curated' | 'scraped' | 'user_submitted'; 
  is_info_verified?: number; 
  original_link?: string; 
  supports_site_registration?: number; 
  brief?: string;
  highlights?: string[];
}

export interface City {
  id: string;
  name: string;
  label: string;
  slug: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  icon_url?: string;
  cover_image_url?: string;
  description?: string;
  sort_order?: number;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar_url?: string;
  cover_image_url?: string;
  owner_id?: string;
  is_verified?: boolean;
  created_at?: string;
}

export interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  website?: string;
  description?: string;
  social_links?: any;
  // 兼容旧字段
  email?: string;
  is_community?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sort_order?: number;
  event_count?: number; // Optional count for UI
}

export interface CommunityRole {
  id: string;
  user_id: string;
  community_id: string;
  role: 'member' | 'admin' | 'moderator' | 'owner';
  joined_at: string;
  community?: Community;
}

// 兼容旧代码的别名
export type UserEventSubscription = any; 
export type UserCommunityFollow = any;
export type EventAttendee = any;
