import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Trash2, Check, Plus, Loader2 } from 'lucide-react';
import { getUserSubscriptions, unsubscribeFromEvent } from '../lib/database';
import { cn } from '../lib/utils';
import { format, isSameDay, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuthStore } from '../store/authStore';
import { useState, useEffect } from 'react';
import { Event } from '../types';
import { ImageWithFallback } from '../components/ImageWithFallback';

export const MyEventsTimeline = () => {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyEvents = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Use getUserSubscriptions to fetch from notifications table
        const subscriptions = await getUserSubscriptions(user.id);
        
        // Extract events from subscriptions
        // The getUserSubscriptions returns objects with an 'event' property
        const myEvents = subscriptions
          .map((sub: any) => sub.event)
          .filter((e: any) => e !== undefined) as Event[];

        // Sort by start_time
        myEvents.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

        setEvents(myEvents);
      } catch (error) {
        console.error('Error fetching my events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, [user]);

  const handleToggleAttendance = async (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;
    
    try {
      // Since we are in the "My Events" page, we usually just want to remove
      await unsubscribeFromEvent(eventId, user.id);
      setEvents(prev => prev.filter(ev => ev.id !== eventId));
    } catch (error) {
      console.error('Error removing event:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 bg-luma-base text-luma-text-primary">
        <h2 className="text-2xl font-bold text-luma-text-primary mb-4">请先登录</h2>
        <p className="text-luma-text-secondary mb-8">登录后查看您的活动日程</p>
        <Link to="/login" className="px-6 py-3 bg-luma-gray-100 text-white rounded-full font-medium hover:bg-luma-gray-90 transition-colors">
          去登录
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luma-base text-luma-text-primary pt-20 pb-20 flex flex-col items-center">
      <div className="w-full max-w-[820px] px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-luma-text-primary mb-12">我的日程</h1>

        {loading ? (
          <div className="space-y-4">
             {[1,2,3].map(i => <div key={i} className="h-32 bg-luma-card rounded-xl animate-pulse" />)}
          </div>
        ) : events.length > 0 ? (
          <div className="relative border-l-2 border-luma-border ml-3 space-y-12">
            {events.map((event, index) => {
              const startDate = new Date(event.start_time);
              const isPast = startDate < new Date();
              
              return (
                <div key={event.id} className="relative pl-8 group">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[9px] top-6 w-4 h-4 rounded-full border-2 border-luma-base ${isPast ? 'bg-luma-gray-50' : 'bg-[#ff6600]'} shadow-sm z-10`} />
                  
                  <Link to={`/events/${event.id}`} className="block hover:no-underline">
                    <div className={`bg-luma-card p-6 rounded-2xl border border-luma-border-card transition-all duration-300 hover:shadow-luma-hover hover:bg-white`}>
                      <div className="flex flex-col md:flex-row gap-6 items-center">
                        {/* Add/Remove Button on the Left */}
                        <div className="flex-shrink-0">
                           <button
                             onClick={(e) => handleToggleAttendance(e, event.id)}
                             className="p-2 rounded-full border border-luma-brand bg-luma-brand text-white hover:bg-luma-brand/90 transition-all shadow-sm"
                             title="从我的日程中删除"
                           >
                             <Check size={16} strokeWidth={3} />
                           </button>
                        </div>

                        {/* Date Box */}
                        <div className="flex-shrink-0 flex flex-col items-center justify-center bg-luma-gray-10 rounded-xl w-20 h-20 text-center border border-luma-border">
                          <span className="text-sm font-medium text-luma-text-secondary uppercase">{startDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                          <span className="text-2xl font-bold text-luma-text-primary">{startDate.getDate()}</span>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0 w-full">
                          <h3 className="text-xl font-bold text-luma-text-primary mb-2 group-hover:text-luma-brand transition-colors truncate">
                            {event.title}
                          </h3>
                          <div className="flex flex-wrap gap-4 text-sm text-luma-text-secondary">
                            <div className="flex items-center">
                              <Clock size={16} className="mr-1.5" />
                              {startDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {event.location_name && (
                              <div className="flex items-center">
                                <MapPin size={16} className="mr-1.5" />
                                {event.location_name}
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 flex gap-2">
                             {event.tags && event.tags.map(tag => (
                               <span key={tag} className="px-2 py-0.5 bg-luma-gray-20 text-xs text-luma-text-tertiary border border-luma-border rounded-md">
                                 {tag}
                               </span>
                             ))}
                          </div>
                        </div>
                        
                        {/* Image Thumbnail (Desktop) */}
                        <div className="hidden md:block w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-luma-gray-10">
                          <ImageWithFallback src={event.cover_image_url} alt="" className="w-full h-full object-cover" fallbackSeed={event.id} fallbackWidth={128} fallbackHeight={96} />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-luma-card rounded-3xl border border-dashed border-luma-border">
            <Calendar size={48} className="mx-auto text-luma-text-tertiary mb-4" />
            <h3 className="text-lg font-medium text-luma-text-secondary mb-2">暂无活动</h3>
            <p className="text-luma-text-tertiary mb-6">您还没有报名参加任何活动</p>
            <Link to="/home" className="text-luma-brand font-bold hover:underline">
              去发现活动
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
