import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getEventsByOrganizer, getEventsByCommunity, getCommunityById, getProfileById, followCommunity, unfollowCommunity, isCommunityFollowed, getCommunityStats } from '../lib/database';
import { Event, Profile } from '../types';
import { Loader2, MapPin, Calendar, Globe, Users, Instagram, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import { ImageWithFallback } from '../components/ImageWithFallback';

export const CommunityProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hostedEvents, setHostedEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  
  // 独立加载状态
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  const [extendedDescription, setExtendedDescription] = useState<string>('');
  
  // Follow/Subscribe state
  const [isFollowed, setIsFollowed] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [stats, setStats] = useState({ subscribers: 0, events: 0 });

  useEffect(() => {
    const loadData = async () => {
      const communityId = id || '';
      if (!communityId) return;

      // 1. 获取基本资料 (最快)
      const fetchProfile = async () => {
        try {
          let foundProfile: any = await getCommunityById(communityId);
          let isCommunity = false;
          
          if (!foundProfile) {
            foundProfile = await getProfileById(communityId);
          } else {
            isCommunity = true;
          }
          
          if (!foundProfile) {
            foundProfile = {
              id: communityId,
              full_name: 'Unknown Community',
              avatar_url: '',
              description: 'Profile not found'
            };
          } else {
            if (isCommunity && foundProfile.name && !foundProfile.full_name) {
              foundProfile.full_name = foundProfile.name;
            }
            setExtendedDescription(foundProfile.description || '');
          }
          
          setProfile(foundProfile);
          setLoadingProfile(false);

          // 基于资料获取后触发后续逻辑
          if (user && foundProfile.id) {
            isCommunityFollowed(foundProfile.id, user.id).then(setIsFollowed);
          }

          if (isCommunity && foundProfile.id) {
            getCommunityStats(foundProfile.id).then(setStats).finally(() => setLoadingStats(false));
          } else {
            setLoadingStats(false);
          }

          return { foundProfile, isCommunity };
        } catch (err) {
          console.error('Profile fetch error:', err);
          setLoadingProfile(false);
          setLoadingStats(false);
          return null;
        }
      };

      // 2. 并行获取活动列表 (可能较慢)
      const fetchEvents = async (isComm: boolean, pId: string) => {
        try {
          let relevantEvents: Event[] = [];
          if (isComm) {
            relevantEvents = await getEventsByCommunity(pId);
          } else {
            relevantEvents = await getEventsByOrganizer(pId);
          }
          
          const now = new Date();
          const upcoming = relevantEvents.filter(e => new Date(e.start_time) >= now);
          const past = relevantEvents.filter(e => new Date(e.start_time) < now);

          setHostedEvents(upcoming.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
          setPastEvents(past.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()));
          
          if (!isComm) {
            setStats(prev => ({ ...prev, events: relevantEvents.length }));
          }
        } catch (err) {
          console.error('Events fetch error:', err);
        } finally {
          setLoadingEvents(false);
        }
      };

      // 执行请求
      fetchProfile().then(res => {
        if (res) {
          fetchEvents(res.isCommunity, res.foundProfile.id);
        } else {
          setLoadingEvents(false);
        }
      });
    };

    loadData();
  }, [id, user]);

  const handleFollowToggle = async () => {
      if (!user) {
          alert('请先登录');
          return;
      }
      if (!profile) return;

      setFollowLoading(true);
      try {
          if (isFollowed) {
              await unfollowCommunity(profile.id, user.id);
              setIsFollowed(false);
              setStats(prev => ({ ...prev, subscribers: Math.max(0, prev.subscribers - 1) }));
          } else {
              await followCommunity(profile.id, user.id);
              setIsFollowed(true);
              setStats(prev => ({ ...prev, subscribers: prev.subscribers + 1 }));
          }
      } catch (error) {
          console.error('Error toggling follow:', error);
      } finally {
          setFollowLoading(false);
      }
  };

  if (loadingProfile && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-luma-base space-y-6">
        <div className="w-24 h-24 rounded-full bg-slate-100 animate-pulse"></div>
        <div className="h-8 bg-slate-100 rounded-xl w-48 animate-pulse"></div>
        <div className="h-4 bg-slate-100 rounded-xl w-64 animate-pulse"></div>
      </div>
    );
  }

  if (!profile && !loadingProfile) return <div className="min-h-screen bg-luma-base flex items-center justify-center text-luma-text-primary">Profile not found</div>;

  return (
    <div className="min-h-screen bg-luma-base text-luma-text-primary pb-20 pt-24 font-sans">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        
        {/* Header Section - 完全居中对齐 */}
        <div className="pb-12 text-center">
           {/* Logo and Name */}
           <div className="flex items-center justify-center gap-4 mb-6">
             <ImageWithFallback
               src={profile.avatar_url || "https://via.placeholder.com/48"}
               alt={profile.full_name}
               className="w-12 h-12 rounded-full border-2 border-luma-border"
               fallbackSeed={profile.id}
               fallbackWidth={48}
               fallbackHeight={48}
             />
             <h1 className="text-4xl font-bold tracking-tight text-luma-text-primary">{profile.full_name}</h1>
           </div>

           {/* Stats - 水平排列并居中 */}
           <div className="flex items-center justify-center gap-6 text-luma-text-secondary mb-6 text-sm font-medium h-5">
             {loadingStats ? (
                <div className="w-32 h-4 bg-slate-100 animate-pulse rounded"></div>
             ) : (
               <>
                 <div className="flex items-center gap-1.5">
                   <Calendar size={16} />
                   <span className="text-luma-text-primary font-bold">{stats.events}</span>
                   <span>场活动</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                   <Users size={16} />
                   <span className="text-luma-text-primary font-bold">{stats.subscribers}</span>
                   <span>名订阅者</span>
                 </div>
               </>
             )}
           </div>

           {/* Subscribe Button - 居中 */}
           <div className="mb-10">
             <button 
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2 mx-auto ${
                    isFollowed 
                        ? 'bg-luma-text-primary text-white hover:bg-luma-text-primary/90' 
                        : 'bg-luma-brand text-white hover:bg-luma-brand-dark'
                }`}
             >
                {followLoading ? (
                    <span>处理中...</span>
                ) : isFollowed ? (
                    <>
                        <span>已订阅</span>
                        <CheckCircle2 size={18} />
                    </>
                ) : (
                    <span>订阅</span>
                )}
             </button>
           </div>

           {/* About Section */}
           <div className="border-t border-luma-border pt-10 text-left">
              <h2 className="text-xl font-bold text-luma-text-primary mb-6 text-center">关于我们</h2>
              
              <div className="relative mb-8">
                 {/* 装饰性引号 - 根据图片调整 */}
                 <span className="absolute -top-2 -left-2 text-4xl text-luma-gray-200 font-serif">"</span>
                 
                 {extendedDescription ? (
                    <p className="text-luma-text-secondary text-lg leading-relaxed font-light whitespace-pre-wrap px-2">
                      {extendedDescription}
                    </p>
                 ) : (
                    <p className="text-luma-text-tertiary text-lg px-2">暂无详细介绍</p>
                 )}
                 
                 <span className="absolute -bottom-4 -right-2 text-4xl text-luma-gray-200 font-serif transform rotate-180">"</span>
              </div>
              
              {/* Social & Meta Info - 水平居中排列 */}
              <div className="mt-12 flex flex-wrap justify-center gap-6">
                 <a href="#" className="group flex items-center gap-3 text-luma-text-tertiary hover:text-luma-text-primary transition-colors">
                   <div className="w-10 h-10 rounded-full bg-luma-card border border-luma-border flex items-center justify-center group-hover:border-luma-brand/50 group-hover:text-luma-brand transition-all">
                      <Globe size={18} />
                   </div>
                   <span className="font-medium text-sm">官方网站</span>
                 </a>
                 
                 <a href="#" className="group flex items-center gap-3 text-luma-text-tertiary hover:text-luma-text-primary transition-colors">
                   <div className="w-10 h-10 rounded-full bg-luma-card border border-luma-border flex items-center justify-center group-hover:border-pink-500/50 group-hover:text-pink-500 transition-all">
                      <Instagram size={18} />
                   </div>
                   <span className="font-medium text-sm">Instagram</span>
                 </a>

                 <div className="flex items-center gap-3 text-luma-text-tertiary">
                   <div className="w-10 h-10 rounded-full bg-luma-card border border-luma-border flex items-center justify-center">
                      <MapPin size={18} />
                   </div>
                   <span className="font-medium text-sm">Shanghai, China</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Main Content - Events */}
        <div className="flex flex-col gap-12">
          
          {/* Hosted Events */}
          <section>
            <h2 className="text-xl font-bold mb-6 text-luma-text-primary text-center">
              主办活动
            </h2>
            {loadingEvents ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-32 bg-slate-50 rounded-xl animate-pulse border border-slate-100"></div>
                ))}
              </div>
            ) : hostedEvents.length > 0 ? (
              <div className="space-y-4">
                 {hostedEvents.map(event => (
                   <EventHorizontalCard key={event.id} event={event} />
                 ))}
              </div>
            ) : (
              <div className="text-luma-text-tertiary py-12 text-center bg-luma-card rounded-2xl border border-luma-border border-dashed">
                暂无即将举办的活动
              </div>
            )}
          </section>

           {/* Past Events */}
           <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-luma-text-secondary">
                 往期活动
              </h2>
              <button className="text-sm text-luma-text-tertiary hover:text-luma-text-primary transition-colors">查看全部 &rarr;</button>
            </div>
            
            {loadingEvents ? (
               <div className="h-32 bg-slate-50 rounded-xl animate-pulse border border-slate-100"></div>
            ) : pastEvents.length > 0 ? (
              <div className="space-y-4">
                 {pastEvents.map(event => (
                   <EventHorizontalCard key={event.id} event={event} />
                 ))}
              </div>
            ) : (
               <div className="text-luma-text-tertiary py-12 text-center bg-luma-card rounded-2xl border border-luma-border border-dashed">
                暂无往期活动
              </div>
            )}
          </section>
        </div>

      </div>
    </div>
  );
};

// Mini component for the horizontal list style seen in screenshot
const EventHorizontalCard = ({ event }: { event: Event }) => {
  return (
    <Link to={`/events/${event.id}`} className="flex gap-4 group cursor-pointer hover:bg-luma-gray-50 p-4 rounded-xl transition-colors border border-luma-border hover:border-luma-border-card">
      {/* Event Image */}
      <div className="w-24 h-24 sm:w-32 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-luma-gray-100 border border-luma-border-image">
        <ImageWithFallback
          src={event.cover_image_url}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          fallbackSeed={event.id}
          fallbackWidth={128}
          fallbackHeight={96}
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="text-luma-brand text-xs font-semibold mb-2 uppercase tracking-wide flex items-center gap-2">
           <Calendar size={12} />
           {format(new Date(event.start_time), 'MM月dd日 EEEE HH:mm')}
        </div>
        <h3 className="text-luma-text-primary font-bold text-lg mb-2 leading-tight line-clamp-1 group-hover:text-luma-brand transition-colors">
          {event.title}
        </h3>
        
        {/* Organizers and Location */}
        <div className="flex flex-col gap-1.5 text-sm text-luma-text-tertiary">
           <div className="flex items-center gap-2 line-clamp-1">
             <div className="flex -space-x-2">
                <div className="w-5 h-5 rounded-full bg-luma-gray-200 border border-luma-card" />
                <div className="w-5 h-5 rounded-full bg-luma-gray-300 border border-luma-card" />
             </div>
             <span className="text-luma-text-tertiary">由 <span className="text-luma-text-secondary hover:underline">Reading Rhythms</span>, <span className="text-luma-text-secondary hover:underline">Ellen Le</span>... 等主办</span>
           </div>
           
           <div className="text-luma-text-tertiary flex items-center gap-1.5">
             <MapPin size={12} />
             {event.location_name}
           </div>
        </div>
      </div>
    </Link>
  );
};