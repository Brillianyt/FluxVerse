import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ChevronDown, ChevronUp, Plus, Check } from 'lucide-react';
import { Event } from '../types';
import { cn } from '../lib/utils';
import { subscribeToEvent, unsubscribeFromEvent, isEventSubscribed } from '../lib/database';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { ImageWithFallback } from './ImageWithFallback';

interface EventCardProps {
  event: Event;
  className?: string;
  onRemove?: (id: string) => void;
  layout?: 'default' | 'minimal';
}

export const EventCard = ({ event, className, onRemove, layout = 'default' }: EventCardProps) => {
  const { user } = useAuthStore();
  const { openEventSidebar } = useUiStore();
  const startDate = new Date(event.start_time);
  const [expanded, setExpanded] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  //这本质是一个卡片点击函数：每当鼠标触碰按钮，该函数调用全局方法，打开事件侧边栏
  const handleCardClick = (e: React.MouseEvent) => {
    // If user wants to open in new tab (Meta/Ctrl click), we'd need an actual link, 
    // but requirement is to ONLY show sidebar. 
    // We can simulate new tab if absolutely responsible, but strict reading of requirement:
    e.preventDefault(); 
    e.stopPropagation();
    openEventSidebar(event.id);
  };

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      try {
        const subscribed = await isEventSubscribed(event.id, user.id);
        setIsAdded(subscribed);
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };

    if (user) {
      checkStatus();
    }
  }, [event.id, user]);

  const toggleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      alert('请先登录');
      return;
    }

    if (loading) return;
    
    // Optimistic Update: Immediately toggle UI state
    const previousState = isAdded;
    setIsAdded(!previousState);
    
    // Don't set loading to true to keep UI responsive
    // setLoading(true); 

    try {
      if (previousState) {
        await unsubscribeFromEvent(event.id, user.id);
        if (onRemove) onRemove(event.id);
      } else {
        await subscribeToEvent(event.id, user.id);
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
      // Revert UI on error
      setIsAdded(previousState);
      alert('操作失败，请重试');
    }
  };
  
  // Minimal Layout (Hot Events Style)
  if (layout === 'minimal') {
    return (
      <div 
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        className={cn(
          "group flex gap-4 items-start w-full hover:bg-transparent py-3 px-2 -mx-2 rounded-DEFAULT transition-all duration-200 relative cursor-pointer",
          className
        )}
      >
        {/* Left: Square Image */}
        <div className="w-[80px] h-[80px] rounded-sm overflow-hidden flex-shrink-0 bg-luma-base border border-luma-border-image relative group-hover:scale-105 group-hover:shadow-[6px_6px_20px_rgba(0,0,0,0.18)] transition-all duration-300">
          <ImageWithFallback
            src={event.cover_image_url || 'https://via.placeholder.com/80'}
            alt={event.title}
            className="w-full h-full object-cover"
            fallbackSeed={event.id}
            fallbackWidth={80}
            fallbackHeight={80}
          />
        </div>

        {/* Right: Info */}
        <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between h-[80px] relative">
          <div>
            {/* Date Time */}
            <div className="text-luma-text-secondary text-sm font-medium mb-1 tracking-wide auto-shrink-container">
              <span className="auto-shrink-text">
                {startDate.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', weekday: 'short', timeZone: 'Asia/Shanghai' })} {startDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Shanghai' })}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-luma-text-primary font-bold text-lg leading-snug line-clamp-2 tracking-tight pr-8">
              {event.title}
            </h3>
          </div>

          {/* Location */}
          <div className="text-luma-text-tertiary text-sm truncate">
             {event.location_name || event.city || 'Online'}
          </div>

          {/* Subscribe Button - Moved to Right Center */}
          <button 
            onClick={toggleAdd}
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-200 flex items-center justify-center shadow-md z-10 border",
              isAdded 
                ? "bg-[#ff6600] border-[#ff6600] text-white opacity-100" 
                : "bg-white border-gray-200 text-gray-400 hover:bg-[#ff6600] hover:border-[#ff6600] hover:text-white opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
            )}
            title={isAdded ? "取消订阅" : "加入日程"}
          >
            {isAdded ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
          </button>
        </div>
      </div>
    );
  }

  // Default Layout (Timeline Style)
  // Logic moved to top for shared state usage
  
  // Prevent link navigation when clicking expand button
  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };


  return (
    <div 
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      className={cn(
        "group flex w-full bg-luma-card rounded-DEFAULT overflow-hidden hover:bg-transparent transition-all duration-200 border border-luma-border-card relative cursor-pointer text-left",
        className
      )}
    >
      {/* Container Layout: Left (Info) | Right (Image) */}
      <div className="flex w-full p-5 gap-6">
        
        {/* Main Info Section */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Time & Date */}
          <div className="flex items-center text-luma-cranberry font-semibold text-sm mb-2 uppercase tracking-wide">
            <span className="text-luma-cranberry mr-2 whitespace-nowrap">
              {startDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Shanghai' })}
            </span>
            <span className="text-luma-text-tertiary font-normal mx-1">·</span>
            <div className="text-luma-text-tertiary font-normal auto-shrink-container flex-1">
              <span className="auto-shrink-text">
                {startDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short', timeZone: 'Asia/Shanghai' })}
              </span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-luma-text-primary mb-3 line-clamp-2 leading-snug tracking-tight">
            {event.title}
          </h3>
          
          <div className="flex items-center gap-2 mb-4">
             {/* Organizer Mock */}
             <div className="flex -space-x-2">
                <div className="w-5 h-5 rounded-full bg-luma-gray-60 border border-luma-base" />
                <div className="w-5 h-5 rounded-full bg-luma-gray-50 border border-luma-base" />
             </div>
             <span className="text-sm text-luma-text-secondary font-medium">FluxVerse 社区</span>
          </div>

          <div className="flex items-center text-sm text-luma-text-tertiary mb-4">
            <MapPin size={16} className="mr-1.5 flex-shrink-0 opacity-70" />
            <span className="truncate font-medium">{event.location_name || event.city || 'Online'}</span>
          </div>
          
          {/* Description or Brief with auto-fold */}
          <div className="relative mb-4">
            <div className={`text-sm text-luma-text-secondary leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
                {event.brief || event.description || "暂无描述"}
            </div>
             {(event.brief || event.description) && (event.brief?.length || event.description?.length || 0) > 80 && (
               <button 
                 onClick={toggleExpand}
                 className="flex items-center gap-1 text-xs font-medium text-luma-text-tertiary hover:text-luma-text-primary mt-1 w-fit transition-colors"
               >
                 {expanded ? '收起' : '展开'}
               </button>
            )}
          </div>
        
          {/* Price Tag */}
          <div>
             {event.price > 0 ? (
                <span className="inline-flex items-center bg-luma-gray-100/50 text-luma-text-secondary text-xs font-medium px-2.5 py-1 rounded-sm border border-luma-border">
                   US${event.price}
                </span>
             ) : (
                <span className="inline-flex items-center bg-luma-gray-100/50 text-luma-text-secondary text-xs font-medium px-2.5 py-1 rounded-sm border border-luma-border">
                   免费
                </span>
             )}
          </div>
        </div>

        {/* Right Image (Desktop) */}
        <div className="hidden sm:block w-32 h-32 flex-shrink-0 rounded-sm overflow-hidden bg-luma-gray-100 relative border border-luma-border-image transition-all duration-300 group-hover:scale-105 group-hover:shadow-[6px_6px_20px_rgba(0,0,0,0.18)]">
          <ImageWithFallback
            src={event.cover_image_url || 'https://via.placeholder.com/128'}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-700"
            fallbackSeed={event.id}
            fallbackWidth={128}
            fallbackHeight={128}
          />
          <button
            onClick={toggleAdd}
            className={cn(
              "absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200 flex items-center justify-center backdrop-blur-md shadow-sm",
              isAdded 
                ? "bg-luma-cranberry text-white opacity-100" 
                : "bg-black/40 text-white hover:bg-luma-cranberry opacity-0 group-hover:opacity-100"
            )}
            title={isAdded ? "取消订阅" : "加入日程"}
          >
            {isAdded ? <Check size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
          </button>
        </div>
      </div>
    </div>
  );
};
