// 这个page是具体的活动类别点击进去后的页面

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Event, Category } from '../types';
import { getEventsByTag, getTagBySlug, isEventSubscribed, subscribeToEvent, unsubscribeFromEvent } from '../lib/database';
import { Loader2, ArrowLeft, Calendar, MapPin, Check, Plus, Terminal, Cpu, PenTool, Wrench, Hash, Code, Palette, Music, Briefcase, Users, Activity, Coffee, MessageSquare, Rocket, User, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import { ImageWithFallback } from '../components/ImageWithFallback';

// Icon mapper for dynamic icons
const getIcon = (iconName?: string) => {
  switch (iconName) {
    case 'Code': return Code;
    case 'Cpu': return Cpu;
    case 'Wrench': return Wrench;
    case 'MessageSquare': return MessageSquare;
    case 'Rocket': return Rocket;
    case 'User': return User;
    case 'Palette': return Palette;
    case 'Music': return Music;
    case 'Briefcase': return Briefcase;
    case 'Coffee': return Coffee;
    case 'Terminal': return Terminal;
    case 'PenTool': return PenTool;
    case 'Activity': return Activity;
    case 'Users': return Users;
    default: return Hash;
  }
}

interface TimelineEventCardProps {
  event: Event;
}

const TimelineEventCard = ({ event }: TimelineEventCardProps) => {
  const { user } = useAuthStore();
  const [isAdded, setIsAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const startDate = new Date(event.start_time);

  // 这是一个hook函数，只要活动id或者user变了，立即执行
  // 当你看到这个活动卡片时，立刻去数据库查一下“我之前有没有报名过？”，然后把按钮显示对。
  useEffect(() => {
    // 定义一个异步函数来检查“是否已报名”
    const checkAttendance = async () => {
      // 1. 如果用户没登录，直接结束，不查了
      if (!user) return;
      
      try {
        // 2. 去数据库查一下：这个活动是否已经被该用户订阅
        const subscribed = await isEventSubscribed(event.id, user.id);
        
        // 3. 根据查到的结果(true/false)，更新按钮的状态
        // 如果 subscribed 是 true，按钮就会变成橙色的“已加入”
        setIsAdded(subscribed);
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };

    // 执行上面定义的函数
    checkAttendance();
  }, [event.id, user]); // [依赖数组] 只有当“活动ID”或“当前用户”变了，才重新查一遍

  // 点击活动的“+”时的逻辑
  const toggleAdd = async (e: React.MouseEvent) => {
    // 1. 阻止事件冒泡：防止点击按钮时触发卡片的跳转
    // 如果不加这句，点击“加号”的同时，页面会跳转到活动详情页
    e.preventDefault();
    e.stopPropagation();
    
    // 2. 安全检查：没登录或者正在加载中，就什么都不做
    if (!user) return;
    if (loading) return;
    
    // 3. 【乐观更新】(Optimistic UI)
    // 核心思想：先变界面，再发请求。让用户感觉“零延迟”。
    const previousState = isAdded;
    setIsAdded(!previousState); // 立即反转按钮状态（变色）
    
    try {
      // 4. 发送网络请求给服务器
      if (previousState) {
        // 如果之前是已加入，现在就是取消
        await unsubscribeFromEvent(event.id, user.id);
      } else {
        // 如果之前没加入，现在就是加入
        await subscribeToEvent(event.id, user.id);
      }
    } catch (error) {
      // 5. 【错误回滚】
      // 如果请求失败了（比如断网了），把界面变回去，不能骗用户
      console.error('Error toggling subscription:', error);
      setIsAdded(previousState);
    }
  };

  return (
    <div className="relative group">
      <div className="absolute -left-[38px] top-6 w-4 h-4 rounded-full border-2 border-luma-base bg-luma-brand z-10 shadow-sm" />
      {/* 
         [Style] 这里控制活动卡片的样式：
         - border: 边框宽度 (比如改为 border-2 加粗)
         - rounded-2xl: 圆角大小
         - border-luma-border-card: 边框颜色 
      */}
      <div className="flex flex-col md:flex-row gap-6 bg-luma-card p-6 rounded-2xl border border-luma-border-card hover:shadow-luma-hover transition-all">
          <div className="flex-shrink-0 w-24 text-center">
            <div className="text-luma-brand font-bold text-2xl">{format(startDate, 'dd')}</div>
            <div className="text-luma-text-secondary text-sm uppercase">{format(startDate, 'MMM')}</div>
            <div className="text-luma-text-tertiary text-xs mt-2">{format(startDate, 'HH:mm')}</div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <button 
                onClick={toggleAdd}
                disabled={loading}
                className={cn(
                  "p-2 rounded-full transition-all duration-200 flex items-center justify-center border shadow-sm",
                  isAdded 
                    ? "bg-[#ff6600] border-[#ff6600] text-white" 
                    : "bg-white border-gray-200 text-gray-400 hover:border-[#ff6600] hover:text-[#ff6600]"
                )}
                title={isAdded ? "从日程中移除" : "添加到日程"}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isAdded ? (
                  <Check size={16} strokeWidth={3} />
                ) : (
                  <Plus size={16} strokeWidth={3} />
                )}
              </button>
              <Link to={`/events/${event.id}`} className="flex-1">
                <h3 className="text-xl font-bold text-luma-text-primary hover:text-luma-brand transition-colors">{event.title}</h3>
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-luma-text-secondary mb-4">
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} />
                  {event.location_name}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} />
                  {format(startDate, 'EEEE')}
                </div>
            </div>
            <p className="text-luma-text-tertiary text-sm line-clamp-2 mb-4 leading-relaxed">
              {event.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-luma-gray-200 border border-luma-card" />
                  <div className="w-6 h-6 rounded-full bg-luma-gray-100 border border-luma-card" />
                  <span className="ml-4 text-xs text-luma-text-tertiary">FluxVerse 社区</span>
              </div>
              <Link 
                to={`/events/${event.id}`}
                className="text-sm font-bold text-luma-text-primary hover:text-luma-brand transition-colors"
              >
                查看详情 &rarr;
              </Link>
            </div>
          </div>

          {event.cover_image_url && (
            <div className="hidden md:block w-40 h-28 rounded-xl overflow-hidden shrink-0 border border-luma-border-image">
              <ImageWithFallback src={event.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fallbackSeed={event.id} fallbackWidth={160} fallbackHeight={112} />
            </div>
          )}
      </div>
    </div>
  );
};

// [教学] 这是一个“动态路由页面”。
// 比如你访问 /categories/ai，这里的 id 就是 "ai"
export const CategoryDetail = () => {
  const { id } = useParams<{ id: string }>(); // 1. 拿到 URL 里的 id (如 "ai")
  const [category, setCategory] = useState<Category | null>(null); // 存类别信息（标题、描述）
  const [events, setEvents] = useState<Event[]>([]); // 存该类别下的所有活动
  const [loading, setLoading] = useState(true);

  // 2. 当 id 变化时（比如从 AI 切到 Web3），重新去数据库查数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (!id) return;

      try {
        // 2.1 查类别详情（为了显示页面标题和图标）
        const tagData = await getTagBySlug(id);
        if (tagData) {
          setCategory(tagData);
        } else {
           // 兜底：如果数据库里没这个分类，就临时造一个假的显示出来，防止页面空白
           setCategory({
              id: id,
              name: id.charAt(0).toUpperCase() + id.slice(1),
              description: 'Explore events in this category',
              slug: id,
              icon: 'Hash'
           });
        }

        // 2.2 查该类别下的活动列表
        const tagEvents = await getEventsByTag(id);
        setEvents(tagEvents);

      } catch (error) {
        console.error('Error loading category data:', error);
      } finally {
        setLoading(false); // 无论成功失败，都把 loading 关掉
      }
    };

    loadData();
  }, [id]);

  // 3. 加载中显示转圈圈
  if (loading) {
    return (
      <div className="min-h-screen bg-luma-base flex items-center justify-center">
        <Loader2 className="animate-spin text-luma-brand" size={32} />
      </div>
    );
  }

  // 4. 根据类别名找图标，找不到就用默认的 Hash 图标
  const IconComponent = getIcon(category?.icon);
  const isUrl = category?.icon?.startsWith('http');

  if (!category) {
    return (
      <div className="min-h-screen bg-luma-base text-luma-text-primary flex flex-col items-center justify-center pt-20">
        <h2 className="text-2xl font-bold mb-4">未找到该类别</h2>
        <Link to="/home" className="text-luma-brand hover:underline">返回首页</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luma-base text-luma-text-primary pb-20 pt-24 font-sans flex flex-col items-center">
      <div className="w-full max-w-[820px] px-4 sm:px-6">
        {/* Header 区域：显示类别标题、图标、描述 */}
        <div className="mb-12">
          <Link to="/home" className="inline-flex items-center gap-2 text-luma-text-tertiary hover:text-luma-text-primary mb-6 transition-colors font-medium text-sm">
            <ArrowLeft size={16} />
            <span>返回发现</span>
          </Link>
          <div className="flex items-center gap-4 mb-4">
             {/* 类别图标盒子 */}
             <div className="w-16 h-16 bg-luma-card rounded-2xl flex items-center justify-center border border-luma-border-card shadow-sm overflow-hidden text-luma-text-secondary">
                {isUrl ? (
                  <ImageWithFallback src={category.icon} alt={category.name} className="w-full h-full object-cover" fallbackSeed={category.id} fallbackWidth={64} fallbackHeight={64} />
                ) : (
                  <IconComponent size={32} />
                )}
             </div>
             <div>
                <h1 className="text-3xl font-extrabold text-luma-text-primary tracking-tight">{category.name}</h1>
                <div className="text-xs font-bold text-luma-text-tertiary uppercase tracking-widest mt-1">Category</div>
             </div>
          </div>
          <p className="text-lg text-luma-text-secondary leading-relaxed max-w-2xl border-l-2 border-luma-brand pl-6 ml-2">
            {category.description}
          </p>
        </div>

        {/* Timeline of Events：活动列表区域 */}
        <div className="space-y-12">
          <div className="flex items-center justify-between border-b border-luma-border pb-4">
             <h2 className="text-xl font-bold flex items-center gap-2 text-luma-text-primary">
                <span className="w-1.5 h-6 bg-luma-brand rounded-full"></span>
                活动时间轴
             </h2>
             <span className="text-luma-text-tertiary text-sm font-medium">{events.length} 场活动</span>
          </div>
          
          {events.length > 0 ? (
            // 有活动：遍历 events 数组，渲染 TimelineEventCard
            <div className="relative border-l-2 border-luma-border ml-3 space-y-10 pl-8 pb-20">
              {events.map((event) => (
                <TimelineEventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            // 没活动：显示空状态占位图
            <div className="text-center py-24 bg-luma-card rounded-3xl border border-dashed border-luma-border">
              <div className="w-20 h-20 bg-luma-base rounded-full flex items-center justify-center mx-auto mb-6 border border-luma-border">
                <Calendar className="text-luma-text-tertiary" size={32} />
              </div>
              <h3 className="text-xl font-bold text-luma-text-primary mb-2">暂无相关活动</h3>
              <p className="text-luma-text-secondary max-w-md mx-auto">
                该类别下目前没有正在进行的活动。您可以查看其他类别或稍后再来。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};