import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Event } from '../types';
import { EventCard } from '../components/EventCard';
import { Link } from 'react-router-dom';
import { Calendar, Loader2 } from 'lucide-react';
import { getUserSubscriptions } from '../lib/database';

export const MyEvents = () => {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyEvents();
    }
  }, [user]);

  const fetchMyEvents = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const subscriptions = await getUserSubscriptions(user.id);
      
      // Extract events and filter out any undefined ones
      const myEvents = subscriptions
        .map((sub: any) => sub.event)
        .filter((e: any) => e !== undefined) as Event[];
      
      // Sort by start time
      myEvents.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      
      setEvents(myEvents);
    } catch (error) {
      console.error('Error fetching my events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  if (!user && !loading && events.length === 0) {
    return (
      <div className="min-h-screen bg-[#111] text-white flex flex-col items-center justify-center pt-20">
        <h2 className="text-2xl font-bold mb-4">请先登录</h2>
        <p className="text-gray-400">登入后即可查看您的活动行程</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] text-white pb-16 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
            <Calendar size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">我的日程</h1>
            <p className="text-gray-400 mt-1">您已加入或感兴趣的活动列表</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} onRemove={handleRemove} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#1a1a1a] rounded-2xl border border-dashed border-white/5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#222] mb-4">
              <Calendar size={20} className="text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">暂无日程</h3>
            <p className="text-gray-500 mb-6">您还没有参加任何活动。去发现页看看吧！</p>
            <button 
              onClick={() => window.location.href = '/discovery'}
              className="px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
            >
              浏览活动
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
