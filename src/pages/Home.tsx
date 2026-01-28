import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Event } from '../types';
import { EventCard } from '../components/EventCard';
import { ParticleAurora } from '../components/ParticleAurora';
import { ArrowRight, Sparkles, Monitor, Palette, Heart, Music, Briefcase, Users, Coffee, Activity, Bitcoin, MapPin } from 'lucide-react';
import { useCities } from '../hooks/useCities';
import { ImageWithFallback } from '../components/ImageWithFallback';

export const Home = () => {
  const { cities } = useCities();
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .limit(4)
          .order('start_time', { ascending: true });
        
        if (error) throw error;
        setFeaturedEvents(data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const categories = [
    { name: 'Tech', label: '科技', icon: Monitor, count: 3308, color: 'from-blue-500 to-cyan-500' },
    { name: 'Food & Drink', label: '美食与饮品', icon: Coffee, count: 5, color: 'from-orange-500 to-amber-500' },
    { name: 'AI', label: '人工智能', icon: Sparkles, count: 1888, color: 'from-pink-500 to-rose-500' },
    { name: 'Art & Culture', label: '艺术与文化', icon: Palette, count: 1028, color: 'from-purple-500 to-pink-500' },
    { name: 'Climate', label: '气候', icon: Heart, count: 445, color: 'from-green-500 to-emerald-500' },
    { name: 'Fitness', label: '健身', icon: Activity, count: 945, color: 'from-orange-600 to-red-600' },
    { name: 'Health', label: '健康', icon: Heart, count: 1315, color: 'from-teal-500 to-green-500' },
    { name: 'Crypto', label: '加密货币', icon: Bitcoin, count: 857, color: 'from-indigo-500 to-violet-500' },
  ];

  const marqueeImages = [
    'https://picsum.photos/seed/tech1/600/400',
    'https://picsum.photos/seed/art1/600/400',
    'https://picsum.photos/seed/music1/600/400',
    'https://picsum.photos/seed/business1/600/400',
    'https://picsum.photos/seed/social1/600/400',
    'https://picsum.photos/seed/health1/600/400',
    'https://picsum.photos/seed/design1/600/400',
    'https://picsum.photos/seed/code1/600/400',
  ];

  return (
    <div className="relative min-h-screen">
      {/* Global Background */}
      <ParticleAurora />

      <div className="relative z-10 space-y-10 pb-20">
        {/* Hero Section */}
        <section className="pt-32 pb-0 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="max-w-5xl mx-auto text-center relative z-20">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/40 backdrop-blur-md border border-white/50 text-primary-800 text-sm font-semibold mb-8 shadow-sm hover:bg-white/50 transition-colors animate-fade-in-up">
              <Sparkles size={16} className="mr-2 text-primary-600" />
              Discover amazing events near you
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 animate-fade-in-up [animation-delay:200ms] opacity-0">
              Find your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 animate-pulse">experience</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl md:text-2xl text-gray-600 mb-12 animate-fade-in-up [animation-delay:400ms] opacity-0 leading-relaxed">
              Join a community of millions discovering the best online and in-person events. 
              From tech meetups to art workshops, find what moves you.
            </p>
            <div className="flex justify-center gap-4 animate-fade-in-up [animation-delay:600ms] opacity-0 mb-20">
              <Link 
                to="/discovery" 
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-primary-600 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 hover:scale-105 active:scale-95 shadow-xl shadow-primary/30 overflow-hidden"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
                <span className="relative z-20 flex items-center">
                  Explore Events <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </div>

          {/* 3D Marquee Section */}
          <div className="relative w-full h-[350px] -mt-10 mb-0 perspective-1000 transform-gpu opacity-0 animate-fade-in-up [animation-delay:800ms] [animation-fill-mode:forwards]">
            
            <div className="flex flex-col rotate-x-12 rotate-y-0 rotate-z-0 scale-110 origin-center opacity-90 transition-opacity duration-700">
              {/* Single Row Marquee */}
              <div className="flex gap-8 animate-marquee w-max hover:[animation-play-state:paused]">
                {[...featuredEvents, ...featuredEvents, ...featuredEvents, ...featuredEvents].map((event, i) => (
                  <Link 
                    key={`marquee-${event.id}-${i}`} 
                    to={`/events/${event.id}`}
                    className="group/item relative w-[350px] h-[250px] rounded-3xl overflow-hidden shadow-2xl transform transition-all duration-500 hover:scale-105 hover:-translate-y-2 border-4 border-white/50"
                  >
                    <ImageWithFallback src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" fallbackSeed={event.id} fallbackWidth={350} fallbackHeight={250} />
                    
                    {/* Hover Info Overlay */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover/item:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                      <div className="transform translate-y-4 group-hover/item:translate-y-0 transition-transform duration-300">
                        <span className="inline-block px-2 py-1 rounded bg-primary text-white text-[10px] font-bold uppercase mb-2">
                          {event.category}
                        </span>
                        <h4 className="text-white font-bold text-xl mb-1 line-clamp-1">{event.title}</h4>
                        <p className="text-gray-300 text-sm mb-3 line-clamp-2">{event.description}</p>
                        <div className="flex items-center justify-between text-white/80 text-xs border-t border-white/20 pt-3">
                           <span>{new Date(event.start_time).toLocaleDateString()}</span>
                           <span className="font-bold text-primary-400">View Detail →</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ... categories code ... */}
        </section>

        {/* Local Cities - NEW SECTION */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">探索本地活动</h2>
            <div className="hidden sm:flex gap-4 text-sm font-medium text-gray-500">
               <span className="px-3 py-1 bg-gray-200 text-gray-900 rounded-full cursor-pointer">北美</span>
               <span className="px-3 py-1 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">亚洲和太平洋</span>
               <span className="px-3 py-1 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">南美洲</span>
               <span className="px-3 py-1 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">欧洲</span>
               <span className="px-3 py-1 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">非洲</span>
            </div>
          </div>
          
          {/* Mobile View: Horizontal Scroll (reusing category-rows class for similar behavior) */}
          <div className="block sm:hidden category-rows">
             <div className="category-row">
               {cities.slice(0, Math.ceil(cities.length / 2)).map((city) => (
                 <Link 
                   key={city.name} 
                   to={`/discovery?city=${city.name}`}
                   className="discover-category group relative p-3 rounded-xl bg-transparent hover:bg-white/40 transition-all duration-300 flex items-center gap-3 overflow-hidden"
                 >
                   <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[#EAB308] flex items-center justify-center text-white shadow-sm">
                     {/* Simplified icon logic - using first letter */}
                     {city.label.charAt(0)}
                   </div>
                   <div className="flex flex-col items-start min-w-0">
                     <span className="font-bold text-gray-900 truncate w-full text-left text-sm">
                       {city.label}
                     </span>
                     <span className="text-xs text-gray-500 truncate w-full text-left">
                       探索活动
                     </span>
                   </div>
                 </Link>
               ))}
             </div>
             <div className="category-row">
               {cities.slice(Math.ceil(cities.length / 2)).map((city) => (
                 <Link 
                   key={city.name} 
                   to={`/discovery?city=${city.name}`}
                   className="discover-category group relative p-3 rounded-xl bg-transparent hover:bg-white/40 transition-all duration-300 flex items-center gap-3 overflow-hidden"
                 >
                   <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[#EAB308] flex items-center justify-center text-white shadow-sm">
                     {/* Simplified icon logic - using first letter */}
                     {city.label.charAt(0)}
                   </div>
                   <div className="flex flex-col items-start min-w-0">
                     <span className="font-bold text-gray-900 truncate w-full text-left text-sm">
                       {city.label}
                     </span>
                     <span className="text-xs text-gray-500 truncate w-full text-left">
                       探索活动
                     </span>
                   </div>
                 </Link>
               ))}
             </div>
          </div>

          {/* Desktop View: Grid */}
          <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {cities.map((city, idx) => {
               // Assign random distinct colors for demo based on index
               const bgColors = ['bg-amber-400', 'bg-orange-400', 'bg-rose-400', 'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-cyan-500', 'bg-fuchsia-500'];
               const colorClass = bgColors[idx % bgColors.length];
               
               return (
                <Link 
                  key={city.name} 
                  to={`/city-events`}
                  className="group relative p-3 rounded-xl hover:bg-white/40 transition-all duration-300 flex items-center gap-3"
                >
                  <div className={`w-12 h-12 flex-shrink-0 rounded-full ${colorClass} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform`}>
                    <MapPin size={20} />
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="font-bold text-gray-900 truncate w-full text-left text-base">
                      {city.label}
                    </span>
                    <span className="text-xs text-gray-500 truncate w-full text-left">
                      探索活动
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Featured Events */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Trending Now</h2>
            <Link to="/discovery" className="text-primary font-medium hover:underline">View all</Link>
          </div>
          
          {loading ? (
            <>
              {/* Mobile Skeleton */}
              <div className="block sm:hidden event-grid-wrapper">
                 <div className="event-grid">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="event-row">
                        <div className="bg-gray-100 rounded-xl h-40 animate-pulse"></div>
                      </div>
                    ))}
                 </div>
              </div>
              {/* Desktop Skeleton */}
              <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-100 rounded-xl h-80 animate-pulse"></div>
                ))}
              </div>
            </>
          ) : featuredEvents.length > 0 ? (
            <>
              {/* Mobile View: Horizontal Scroll */}
              <div className="block sm:hidden event-grid-wrapper">
                <div className="event-grid">
                  {featuredEvents.map((event) => (
                    <div className="event-row" key={event.id}>
                      <EventCard event={event} />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop View: Grid */}
              <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No events found. Be the first to create one!
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white/40 backdrop-blur-md border border-white/40 rounded-2xl p-8 md:p-12 text-center text-gray-900 relative overflow-hidden shadow-lg">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4">Host your own event</h2>
              <p className="text-gray-700 max-w-2xl mx-auto mb-8">
                Create beautiful event pages, manage registrations, and grow your community with FluxVerse.
              </p>
              <Link 
                to="/create" 
                className="inline-block px-8 py-3 rounded-full bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors shadow-lg hover:shadow-gray-900/30"
              >
                Create Event
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
