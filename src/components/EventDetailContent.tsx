import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Event } from '../types';
import { useAuthStore } from '../store/authStore';
import {
  Video,
  ExternalLink,
  MapPin,
  Calendar,
  Link as LinkIcon,
  Edit
} from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import { getEventById } from '../lib/database';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '../lib/utils';

interface EventDetailContentProps {
  eventId: string;
  className?: string; // For overriding container styles (e.g. padding/background)
}

export const EventDetailContent = ({ eventId, className }: EventDetailContentProps) => {
  const { user } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      try {
        setLoading(true);
        // 并行化逻辑：虽然目前只有一个主请求，但我们可以为未来扩展留出空间
        // 并且通过分步设置状态来触发渲染
        const foundEvent = await getEventById(eventId);
        setEvent(foundEvent || null);
      } catch (error) {
        console.error('Error fetching event details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  // Progressive Loading Simulation: Show skeleton for data-heavy parts if needed
  // But here we'll focus on the overall layout stability
  
  if (loading && !event) {
    return (
      <div className={cn("w-full h-full p-8", className)}>
        <div className="max-w-md mx-auto space-y-8">
          {/* Cover Image Skeleton */}
          <div className="w-[70%] mx-auto aspect-square bg-slate-100 rounded-[24px] animate-pulse"></div>
          
          {/* Title & Info Skeleton */}
          <div className="space-y-4">
            <div className="h-10 bg-slate-100 rounded-xl w-full animate-pulse"></div>
            <div className="h-4 bg-slate-100 rounded-xl w-2/3 animate-pulse"></div>
          </div>

          {/* Meta Info Skeleton */}
          <div className="space-y-6 pt-4">
            <div className="flex gap-4 items-center">
              <div className="h-14 w-14 bg-slate-100 rounded-2xl animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-slate-100 rounded-lg w-1/2 animate-pulse"></div>
                <div className="h-4 bg-slate-100 rounded-lg w-1/3 animate-pulse"></div>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="h-14 w-14 bg-slate-100 rounded-2xl animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-slate-100 rounded-lg w-1/2 animate-pulse"></div>
                <div className="h-4 bg-slate-100 rounded-lg w-1/3 animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* Description Skeleton */}
          <div className="space-y-3 pt-8 border-t border-slate-50">
            <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className={cn("w-full h-full flex items-center justify-center text-gray-500", className)}>
        <div className="text-center">
          <h2 className="text-2xl font-bold">未找到该活动</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white text-gray-900", className)}>
      <div className="max-w-md mx-auto flex flex-col gap-6">
        
        {/* 1. Image */}
        <div className="relative group w-[70%] mx-auto pt-2">
          <div className="w-full aspect-square rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-gray-100 border border-gray-100">
             <ImageWithFallback
               src={event.cover_image_url || 'https://via.placeholder.com/400'}
               alt={event.title}
               className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
               fallbackSeed={event.id}
               fallbackWidth={400}
               fallbackHeight={400}
             />
          </div>
        </div>

        {/* 2. Title */}
        <div className="flex justify-between items-start gap-4">
          <h1 className="text-[28px] leading-[1.15] font-[800] tracking-tight text-gray-900 flex-1">
            {event.title}
          </h1>
          {user && (user.role === 'admin' || user.id === event.organizer_id) && (
            <Link 
              to={`/create?edit=${event.id}`}
              className="mt-1 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              title="编辑活动"
            >
              <Edit className="w-5 h-5" />
            </Link>
          )}
        </div>

        {/* 3. Intro/Brief - Only showing brief as requested */}
        {event.brief && (
          <p className="text-[15px] text-gray-500 leading-relaxed font-normal">
            {event.brief}
          </p>
        )}

        {/* 4. Time & Location */}
        <div className="space-y-4 pt-1">
          {/* Time */}
          <div className="flex items-center gap-5 group">
            <div className="bg-gray-100 rounded-2xl flex flex-col items-center justify-center min-w-[56px] h-[56px] border border-gray-100 shadow-sm shrink-0">
              <span className="text-[11px] font-bold text-gray-500 uppercase leading-none mb-0.5">
                {new Date(event.start_time || event.start_date).toLocaleDateString('zh-CN', { month: 'short', timeZone: 'Asia/Shanghai' })}
              </span>
              <span className="text-[19px] font-extrabold text-gray-900 leading-none">
                {new Date(event.start_time || event.start_date).toLocaleDateString('zh-CN', { day: '2-digit', timeZone: 'Asia/Shanghai' })}
              </span>
            </div>
            <div>
              <div className="text-[16px] font-bold text-gray-900 auto-shrink-container">
                <span className="auto-shrink-text">
                  {new Date(event.start_time || event.start_date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Asia/Shanghai' })}
                </span>
              </div>
              <div className="text-gray-500 font-medium text-[14px] mt-0.5">
                {event.time_info || (
                  event.start_time && event.end_time 
                    ? `${new Date(event.start_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Shanghai' })} - ${new Date(event.end_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Shanghai' })} (北京时间)`
                    : 'Time TBD'
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-5 group">
            <div className="bg-white rounded-2xl flex items-center justify-center min-w-[56px] h-[56px] border border-gray-200 shadow-sm shrink-0">
              <MapPin className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <div className="text-[16px] font-bold flex items-center gap-2 text-gray-900 cursor-pointer hover:underline">
                {event.location_name}
                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <div className="text-gray-500 font-medium text-[14px] mt-0.5">
                {event.city ? `${event.city}, ` : ''}{event.address || 'Address'}
              </div>
            </div>
          </div>
        </div>

        {/* 5. Event Link - Renamed from Registration */}
        <div className="pt-2">
           <div className="bg-[#f7f7f7] rounded-2xl p-4 border border-gray-100">
              <div className="text-sm font-medium text-gray-500 mb-3 px-1">活动链接</div>
              
              <div className="space-y-3">
                 {/* Removed Fake Ticket Row */}

                 {event.original_link ? (
                    <a 
                      href={event.original_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 bg-[#333333] text-white font-bold rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] text-[15px]"
                    >
                      访问链接 <ExternalLink className="h-4 w-4 opacity-70" />
                    </a>
                 ) : (
                    <button disabled className="w-full py-3.5 bg-gray-200 text-gray-400 font-bold rounded-xl cursor-not-allowed">
                       暂无链接
                    </button>
                 )}
              </div>
           </div>
        </div>

        {/* 6. Highlights / Details - Showing description or structured highlights */}
        <section className="pt-8 border-t border-gray-100 mt-2">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-medium text-gray-500">
                {event.highlights && event.highlights.length > 0 ? '我能为您带来什么' : '活动详情'}
              </h2>
          </div>
          
          {event.highlights && event.highlights.length > 0 ? (
            <div className="space-y-4">
              {event.highlights.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-teal-600 font-bold shrink-0">{i + 1}.</span>
                  <p className="text-gray-800 leading-relaxed">{h}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-800 leading-7 text-[16px] whitespace-pre-wrap font-serif">
              {event.description}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};
