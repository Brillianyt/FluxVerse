import React, { useEffect, useState, useMemo } from 'react';
import { Event, Profile, Category } from '../types';
import { EventCard } from '../components/EventCard';
import { CommunityCard } from '../components/CommunityCard';
import { Terminal, Cpu, PenTool, Wrench, Calendar as CalendarIcon, ArrowLeft, MapPin, Navigation, ChevronDown, ChevronUp, Code, Palette, Music, Briefcase, Coffee, MessageSquare, Rocket, User, Activity, Users } from 'lucide-react';
import { getAllEvents, getAllCommunities, getCategories, getCityStats, getHotEvents, getEventsByCityName } from '../lib/database';
import { useNavigate } from 'react-router-dom';
import { useCities } from '../hooks/useCities';
import { CitySelectorModal } from '../components/CitySelectorModal';
import { ImageWithFallback } from '../components/ImageWithFallback';

export const DiscoveryHome = () => {   // 组件定义开始
  const navigate = useNavigate(); // 路由跳转函数，用于页面跳转
  const { cities } = useCities(); // 获取城市数据，从数据库中把城市数据读出来放到cities变量下使用
  const [hotEvents, setHotEvents] = useState<Event[]>([]); // 热门活动列表
  const [nearbyEvents, setNearbyEvents] = useState<Event[]>([]); // 同城活动列表
  const [communities, setCommunities] = useState<Profile[]>([]); // 社区列表状态，用于存所有社区的信息
  const [categories, setCategories] = useState<Category[]>([]); // 类别列表状态，用于存各种分类标签
  const [cityActivityCounts, setCityActivityCounts] = useState<Record<string, number>>({}); // 城市活动计数
  
  // 独立加载状态，实现渐进式渲染
  const [loadingHot, setLoadingHot] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingNearby, setLoadingNearby] = useState(false);

  const [activeTag, setActiveTag] = useState('All');
  const [activeCity, setActiveCity] = useState('All');
  const [locating, setLocating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

  // 计算两个点之间的距离，为后面城市经纬度服务
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180); 
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    const d = R * c; // Distance in km
    return d;
  };

  // 数据库里存的是图标的名字，在此根据名字匹配图标组件，然后react渲染
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
      default: return CalendarIcon;
    }
  }

  // 这段代码的本质逻辑就是： 输入（你的经纬度） ——> 计算（和所有城市比距离） 
  // ——> 输出（最近的那个城市的名字）
  // 并且页面直接切换至最近的那个城市
  const handleLocation = () => {
      // 1. 【能力检查】
  // navigator.geolocation 是浏览器自带的定位工具。
  // 如果这个东西不存在，说明用户浏览器太老了，或者禁用了定位功能。
    if (!navigator.geolocation) {
      alert('您的浏览器不支持地理位置功能');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Find nearest city
        let minDistance = Infinity;
        let nearestCity = null;

        cities.forEach(city => {
          const distance = calculateDistance(latitude, longitude, city.latitude, city.longitude);
          // If distance is less than 100km, consider it a match
          if (distance < minDistance) {
            minDistance = distance;
            nearestCity = city;
          }
        });

        if (nearestCity && minDistance < 100) {
          setActiveCity(nearestCity.name);
        } else {
          setActiveCity('All'); // Reset if no city is close enough
          alert('未能匹配到附近的城市，显示全部活动');
        }
        setLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocating(false);
        // Fallback for demo purposes or error handling
        alert('无法获取您的位置信息，请检查授权');
      }
    );
  };

  // 只有当[]，即组件第一次挂载到屏幕中，才执行里面代码
  useEffect(() => {
    fetchData();
  }, []); // Fetch once

  const fetchData = async () => {
    // 并行触发所有请求，消除瀑布流阻塞
    
    // 1. 获取热门活动
    getHotEvents(6).then(data => {
      setHotEvents(data);
      setLoadingHot(false);
    }).catch(err => {
      console.error('Hot events error:', err);
      setLoadingHot(false);
    });

    // 2. 获取分类数据
    getCategories().then(data => {
      setCategories(data);
      setLoadingCategories(false);
    }).catch(err => {
      console.error('Categories error:', err);
      setLoadingCategories(false);
    });

    // 3. 获取社区信息
    getAllCommunities().then(data => {
      setCommunities(data);
      setLoadingCommunities(false);
    }).catch(err => {
      console.error('Communities error:', err);
      setLoadingCommunities(false);
    });

    // 4. 获取城市活动统计
    getCityStats().then(data => {
      setCityActivityCounts(data);
      setLoadingStats(false);
    }).catch(err => {
      console.error('City stats error:', err);
      setLoadingStats(false);
    });
  };

  // 当切换城市时，重新获取该城市的活动 (按需加载)
  useEffect(() => {
    const fetchNearby = async () => {
      setLoadingNearby(true);
      try {
        if (activeCity === 'All') {
          // 如果是全选，尝试获取热门活动或前6个
          const data = hotEvents.length > 0 ? hotEvents.slice(0, 6) : await getHotEvents(6);
          setNearbyEvents(data);
        } else {
          const data = await getEventsByCityName(activeCity, 6);
          setNearbyEvents(data);
        }
      } catch (err) {
        console.error('Nearby fetch error:', err);
      } finally {
        setLoadingNearby(false);
      }
    };
    fetchNearby();
  }, [activeCity, hotEvents.length]); // 使用 length 避免不必要的触发

  const handleTagClick = (tagSlug: string) => {
    navigate(`/categories/${tagSlug}`);
  };

  // 计算要显示的分类（如果点击展开显示全部，否则显示前9个）
  const visibleCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    
    // Sort by sort_order or count
    const sorted = [...categories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    
    if (isExpanded) {
        return sorted;
    }
    
    // Show first 9 (3 rows x 3 cols) initially
    return sorted.slice(0, 9);
  }, [categories, isExpanded]);

  const hasMoreCategories = categories.length > 9;

  // 计算城市统计数据 (直接使用异步获取的 count)
  const cityStats = useMemo(() => {
    if (!cities || cities.length === 0) return [];
    
    return cities.map(city => ({
      ...city,
      count: cityActivityCounts[city.id] || 0
    })).sort((a, b) => b.count - a.count);
  }, [cities, cityActivityCounts]);

  return (
     <div 
      className="min-h-screen pb-20 pt-20 font-sans"
      style={{
        background: `linear-gradient(to bottom, 
          var(--blue-10) 0%, 
          var(--blue-5) 8%, 
          var(--white) 20%, 
          var(--white) 100%
        )`
      }}
    >
      {/* Main Container constrained to 820px */}
      <div className="space-y-16 mt-12">
        
        {/* Global Page Header */}
        <div className="max-w-[820px] mx-auto px-4 sm:px-6">
          <header className="mb-8 pt-8">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-extrabold text-luma-text-primary tracking-tight">发现活动</h1>
              </div>
              <p className="text-luma-text-secondary text-lg">探索附近的热门活动</p>
            </div>
          </header>
        </div>

        {/* Section 1: Hot Events (Timeline) */}
        <section>
             {/* Title - Constrained */}
             <div className="max-w-[820px] mx-auto px-4 sm:px-6">
               <div className="flex items-center justify-between mb-5 gap-2 border-b border-luma-border pb-4">
                 <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold text-luma-text-primary tracking-tight">
                      热门活动
                    </h2>
                    <p className="text-luma-text-tertiary text-xs font-medium uppercase tracking-wider">
                      {activeCity === 'All' ? '全球精选' : activeCity}
                    </p>
                 </div>
                 <button 
                  onClick={() => navigate('/city-events')} 
                  className="text-xs font-medium text-luma-text-tertiary hover:text-luma-text-primary transition-colors mb-1"
                 >
                    查看附近热门活动 &rarr;
                 </button>
               </div>
             </div>

             {/* Content - Full Bleed on Mobile, Constrained Grid on Desktop */}
             <div className="w-full overflow-x-auto pb-4 no-scrollbar">
                <div className="flex gap-4 px-4 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-6 md:max-w-[820px] md:mx-auto md:px-6 min-w-max md:min-w-0">
                  {loadingNearby ? (
                    [1,2,3,4,5,6].map(i => (
                      <div key={i} className="w-[300px] md:w-auto h-[120px] bg-luma-card rounded-xl animate-pulse flex-shrink-0 border border-luma-border-card"></div>
                    ))
                  ) : nearbyEvents.length > 0 ? (
                    nearbyEvents.map((event, index) => (
                      <div 
                        key={event.id} 
                        className="w-[300px] md:w-auto flex-shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <EventCard event={event} layout="minimal" />
                      </div>
                    ))
                  ) : (
                    <div className="w-full text-center py-20 bg-luma-card rounded-3xl border border-dashed border-luma-border md:col-span-2">
                      <p className="text-luma-text-tertiary text-lg">暂无相关活动</p>
                    </div>
                  )}
                </div>
             </div>
        </section>

        {/* NEW: Category Section */}
        <section className="mt-12">
            {/* Title */}
            <div className="max-w-[820px] mx-auto px-4 sm:px-6 mb-6 flex justify-between items-end">
              <h2 className="text-xl font-bold text-luma-text-primary tracking-tight">活动类别</h2>
              {hasMoreCategories && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-sm font-medium text-luma-text-tertiary hover:text-luma-text-primary flex items-center gap-1 transition-colors"
                >
                  {isExpanded ? (
                    <>收起 <ChevronUp size={16} /></>
                  ) : (
                    <>更多 <ChevronDown size={16} /></>
                  )}
                </button>
              )}
            </div>

            {/* Container */}
            <div className="w-full overflow-x-auto pb-4 no-scrollbar">
              <div className="flex gap-4 px-4 md:grid md:grid-cols-3 md:gap-6 md:max-w-[820px] md:mx-auto md:px-6 min-w-max md:min-w-0 transition-all duration-300 ease-in-out">
                {loadingCategories ? (
                    [1,2,3,4,5,6].map(i => (
                        <div key={i} className="h-40 bg-luma-card rounded-2xl animate-pulse"></div>
                    ))
                ) : (
                  // map 会自动把visibleCategories数组里的第一个元素拿出来叫 tag （第一次循环），然后拿第二个元素叫 tag （第二次循环）……直到处理完所有数据。
                    visibleCategories.map((tag, index) => {
                    const Icon = getIcon(tag.icon);
                    const isUrl = tag.icon?.startsWith('http');
                    // @ts-ignore - event_count is added in database helper
                    const count = tag.event_count || 0;
                    
                    return (
                        <button
                        key={tag.id}
                        onClick={() => handleTagClick(tag.slug)}
                        className="w-[280px] md:w-auto flex-shrink-0 group relative flex flex-col bg-luma-card p-5 rounded-2xl hover:bg-luma-card-hover hover:shadow-luma-hover transition-all duration-200 border border-luma-border-card h-full text-left animate-in fade-in zoom-in-95 duration-500 fill-mode-both"
                        style={{ animationDelay: `${index * 50}ms` }}
                        >
                        <div className="flex justify-between items-start mb-4">
                            {/* Icon */}
                            <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-luma-base border border-luma-border-image flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                                {isUrl ? (
                                    <ImageWithFallback src={tag.icon} alt={tag.name} className="w-full h-full object-cover" fallbackSeed={tag.id} fallbackWidth={48} fallbackHeight={48} />
                                ) : (
                                    Icon && <Icon size={24} className="text-luma-text-secondary group-hover:text-luma-text-primary transition-colors" />
                                )}
                            </div>
                            
                            {/* Count Badge (Replaces Follow Button style) */}
                            <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-luma-gray-10 text-luma-text-secondary group-hover:bg-luma-gray-20 group-hover:text-luma-text-primary transition-all border border-transparent">
                                {count} 活动
                            </div>
                        </div>
                        
                        {/* Text */}
                        <div className="flex flex-col overflow-hidden w-full">
                            <h3 className="text-base font-bold text-luma-text-primary mb-1 line-clamp-1 group-hover:text-luma-cranberry transition-colors">
                                {tag.name}
                            </h3>
                            <p className="text-sm text-luma-text-secondary line-clamp-2 h-10 leading-relaxed mt-2 italic md:not-italic">
                                {tag.description || '探索更多精彩活动'}
                            </p>
                        </div>
                        </button>
                    );
                    })
                )}
              </div>
            </div>
        </section>


        {/* Section 3: Explore Local Events (China Cities Grid) */}
        <section>
          {/* Title */}
          <div className="max-w-[820px] mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-luma-text-primary tracking-tight">探索城市活动</h2>
              </div>
              <button 
                onClick={() => setIsCityModalOpen(true)}
                className="text-xs font-medium text-luma-text-tertiary hover:text-luma-text-primary transition-colors mb-1"
              >
                查看全部 &rarr;
              </button>
            </div>
          </div>

          {/* City Grid */}
          <div className="w-full overflow-x-auto pb-4 no-scrollbar">
            <div className="flex gap-4 px-4 md:grid md:grid-cols-4 md:gap-x-4 md:gap-y-8 md:max-w-[820px] md:mx-auto md:px-6 min-w-max md:min-w-0">
               {loadingStats ? (
                 [1,2,3,4,5,6,7,8].map(i => (
                   <div key={i} className="flex items-center gap-4 min-w-[200px]">
                     <div className="w-12 h-12 rounded-full bg-luma-card animate-pulse"></div>
                     <div className="flex flex-col gap-2 w-24">
                       <div className="h-4 bg-luma-card animate-pulse rounded"></div>
                       <div className="h-3 bg-luma-card animate-pulse rounded w-2/3"></div>
                     </div>
                   </div>
                 ))
               ) : (
                 cityStats.map((city, index) => (
                 <button 
                   key={city.name}
                   onClick={() => navigate(`/city-events/${city.name}`)}
                   className="flex items-center gap-4 group text-left min-w-[200px] md:min-w-0 animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both"
                   style={{ animationDelay: `${index * 50}ms` }}
                 >
                    {/* Circle Icon */}
                    <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-luma-border shadow-sm group-hover:shadow-md transition-all group-hover:scale-105 bg-slate-100 flex items-center justify-center`}>
                       {city.icon_url || city.cover_image_url ? (
                         <ImageWithFallback
                           src={city.icon_url || city.cover_image_url}
                           alt={city.label}
                           className="w-full h-full object-cover"
                           fallbackSeed={city.name}
                           fallbackWidth={48}
                           fallbackHeight={48}
                         />
                       ) : (
                         <MapPin className="text-slate-400" size={20} />
                       )}
                    </div>
                    
                    {/* Text */}
                    <div className="flex flex-col">
                       <span className="text-base font-bold text-luma-text-primary group-hover:text-luma-brand transition-colors">
                         {city.label}
                       </span>
                       <span className="text-xs text-luma-text-tertiary">
                         {city.count} 场活动
                       </span>
                    </div>
                 </button>
               )))}
            </div>
          </div>
        </section>

{/* Section 4: Featured Communities */}
<section>
  {/* Title */}
  <div className="max-w-[820px] mx-auto px-4 sm:px-6">
     <div className="flex items-end justify-between mb-6 border-b border-luma-border pb-4">
        <h2 className="text-xl font-bold text-luma-text-primary tracking-tight">精选社区</h2>
        <button 
          onClick={() => navigate('/communities')}
          className="text-xs font-medium text-luma-text-tertiary hover:text-luma-text-primary transition-colors mb-1"
        >
          查看全部 &rarr;
        </button>
     </div>
  </div>

  {/* Content */}
  <div className="w-full overflow-x-auto pb-4 no-scrollbar">
     <div className="flex gap-4 px-4 md:grid md:grid-cols-3 md:gap-6 md:max-w-[820px] md:mx-auto md:px-6 min-w-max md:min-w-0">
        {loadingCommunities ? (
           [1, 2, 3].map(i => <div key={i} className="w-[280px] md:w-auto h-40 bg-luma-card rounded-xl animate-pulse flex-shrink-0"></div>)
        ) : (
           communities.slice(0, 3).map((profile, i) => (
             <div 
               key={profile.id} 
               className="w-[280px] md:w-auto flex-shrink-0 animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both"
               style={{ animationDelay: `${i * 150}ms` }}
             >
               <CommunityCard profile={profile} />
             </div>
           ))
        )}
     </div>
  </div>
</section>

      </div>
      
      <CitySelectorModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        onSelect={(cityName) => {
          setIsCityModalOpen(false);
          navigate(`/city-events/${cityName}`);
        }}
        hotCities={cities}
      />
    </div>
  );
};
