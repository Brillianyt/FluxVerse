import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Search, ChevronDown, Bell } from 'lucide-react';
import { EventCard } from '../components/EventCard';
import { getAllEvents } from '../lib/database';
import { Event } from '../types';
import { useCities, City } from '../hooks/useCities';
import { useParams, useNavigate } from 'react-router-dom';
import { CitySelectorModal } from '../components/CitySelectorModal';
import { pinyin } from 'pinyin-pro';
import { getFallbackImage } from '../lib/utils';

const DEFAULT_CITY_NAME = 'Beijing';

export const CityEvents: React.FC = () => {
  const { cityName } = useParams<{ cityName: string }>();
  const navigate = useNavigate();
  const { cities, loading: loadingCities } = useCities();
  const [activeCity, setActiveCity] = useState<City | null>(null);
  const [cityEvents, setCityEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isCityMenuOpen, setIsCityMenuOpen] = useState(false);
  const [isCitySelectorModalOpen, setIsCitySelectorModalOpen] = useState(false);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [bgImageSrc, setBgImageSrc] = useState<string>('');

  // Helper: Haversine distance
  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    const d = R * c; // Distance in km
    return d;
  }

  useEffect(() => {
    // 0. Fetch real events first
    const fetchRealEvents = async () => {
        try {
            setLoadingEvents(true);
            const data = await getAllEvents();
            setAllEvents(data);
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setLoadingEvents(false);
        }
    };
    fetchRealEvents();
  }, []);

  // Determine Active City based on URL or Geolocation
  useEffect(() => {
    if (loadingCities || cities.length === 0) return;

    if (cityName) {
      // 1. Try to match from URL
      const decodedName = decodeURIComponent(cityName);
      const found = cities.find(c => 
        c.name.toLowerCase() === decodedName.toLowerCase() || 
        c.slug?.toLowerCase() === decodedName.toLowerCase() ||
        c.label === decodedName // Match Chinese Label
      );
      
      if (found) {
        setActiveCity(found);
      } else {
        // If city in URL is not found, DO NOT fallback. 
        // This allows us to show the "City Not Found / Empty" state specific to that city.
        setActiveCity(null);
      }
      return; 
    }

    // 2. Fallback to Geolocation only if NO URL param provided
    if (!activeCity && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          let closest = cities.find(c => c.name === DEFAULT_CITY_NAME) || cities[0];
          let minDist = Infinity;

          cities.forEach(city => {
            if (city.latitude && city.longitude) {
              const dist = getDistanceFromLatLonInKm(latitude, longitude, city.latitude, city.longitude);
              if (dist < minDist) {
                minDist = dist;
                closest = city;
              }
            }
          });
          setActiveCity(closest);
        },
        () => {
          // Geo failed
          setActiveCity(cities.find(c => c.name === DEFAULT_CITY_NAME) || cities[0]);
        }
      );
    } else if (!activeCity) {
      // 3. Fallback default
      setActiveCity(cities.find(c => c.name === DEFAULT_CITY_NAME) || cities[0]);
    }
  }, [cityName, cities, loadingCities]);

  useEffect(() => {
    if (activeCity) {
      // Filter events by city
      const filtered = allEvents.filter(e => 
        (e.city && (e.city.includes(activeCity.label) || e.city.toLowerCase().includes(activeCity.name.toLowerCase()))) ||
        (e.address && (e.address.includes(activeCity.label) || e.address.toLowerCase().includes(activeCity.name.toLowerCase())))
      );
      setCityEvents(filtered);
    }
  }, [activeCity, allEvents]);

  useEffect(() => {
    if (activeCity) {
      const fallbackSrc = getFallbackImage(activeCity.name, 1920, 400);
      if (activeCity.cover_image_url) {
        const img = new Image();
        img.onload = () => setBgImageSrc(activeCity.cover_image_url!);
        img.onerror = () => setBgImageSrc(fallbackSrc);
        img.src = activeCity.cover_image_url;
      } else {
        setBgImageSrc(fallbackSrc);
      }
    }
  }, [activeCity]);

  // Handle outside click to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.city-selector')) {
        setIsCityMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCityChange = (city: City) => {
    setActiveCity(city);
    setIsCityMenuOpen(false);
    navigate(`/city-events/${city.name}`);
  };

  const handleModalCitySelect = (selectedCityName: string) => {
    // Clean suffix for matching (e.g. 上海市 -> 上海)
    const cleanName = selectedCityName.replace(/(市|省|特别行政区|自治州|地区|盟)$/, '');

    // 1. Try to find if this city exists in our DB cities list (Hot Cities)
    const existing = cities.find(c => 
      c.label === selectedCityName || 
      c.name === selectedCityName ||
      c.label === cleanName ||
      c.name.toLowerCase() === selectedCityName.toLowerCase()
    );

    if (existing) {
        handleCityChange(existing);
    } else {
        // 2. If it's a new city not in DB hot list, convert to Pinyin for URL
        // e.g. "上海市" -> "Shanghai", "苏州市" -> "Suzhou"
        const pinyinSlug = pinyin(cleanName, { toneType: 'none', type: 'array' }).join('');
        const formattedSlug = pinyinSlug.charAt(0).toUpperCase() + pinyinSlug.slice(1);

        setIsCityMenuOpen(false);
        navigate(`/city-events/${formattedSlug}`);
    }
  };

  if (loadingCities && !activeCity) return (
    <div className="min-h-screen bg-luma-base flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 bg-slate-100 rounded-full animate-pulse"></div>
      <div className="h-6 bg-slate-100 rounded-lg w-32 animate-pulse"></div>
    </div>
  );

  if (!activeCity) {
    const displayedCityName = cityName ? decodeURIComponent(cityName) : '未知城市';
    return (
      <div className="min-h-screen bg-luma-base text-luma-text-primary flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
             <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-luma-brand/10 rounded-full blur-[100px]" />
             <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
         </div>

        <div className="relative z-10 max-w-md w-full bg-luma-card/50 backdrop-blur-xl border border-luma-border-card p-8 rounded-3xl shadow-2xl text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-luma-gray-10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <MapPin className="text-luma-text-tertiary" size={32} />
            </div>

            <h2 className="text-2xl font-bold mb-2 text-luma-text-primary">
               {displayedCityName} 暂无活动
            </h2>
            <p className="text-luma-text-secondary mb-8 font-light leading-relaxed">
              我们暂时未在这个城市发现任何活动。您可以切换到热门城市查看，或者成为第一个发起活动的人！
            </p>
            <div className="flex flex-col gap-3">
               <button 
                  onClick={() => setIsCitySelectorModalOpen(true)}
                  className="w-full bg-luma-text-primary text-luma-base hover:bg-luma-text-primary/90 font-medium px-6 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Search size={18} />
                  切换其他城市
                </button>
                
                <button 
                  onClick={() => navigate('/create')}
                  className="w-full bg-luma-card hover:bg-luma-gray-20 border border-luma-border-card text-luma-text-primary font-medium px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  在此城市发布活动
                </button>
            </div>
        </div>

        <CitySelectorModal 
            isOpen={isCitySelectorModalOpen}
            onClose={() => setIsCitySelectorModalOpen(false)}
            onSelect={handleModalCitySelect}
            hotCities={cities}
            showHotCities={true}
        />
      </div>
    );
  }

  console.log('Active city:', activeCity.name, 'Image URL:', bgImageSrc);
  console.log('All cities:', cities.map(c => ({ name: c.name, image: c.cover_image_url })));

  return (
    <div className="min-h-screen bg-luma-base text-luma-text-primary font-sans">
      
      {/* Hero Section */}
      <div className="relative h-[400px] w-full transition-all duration-700 ease-in-out group">
        {/* Background Image Container with Overflow Hidden */}
        <div className="absolute inset-0 overflow-hidden rounded-b-[2rem]">
            <div 
              key={bgImageSrc}
              className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out transform scale-105 animate-in fade-in zoom-in duration-1000"
              style={{ backgroundImage: `url(${bgImageSrc})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-luma-base via-luma-base/40 to-transparent" />
            </div>
        </div>

        {/* Content Overlay - Constrained */}
        <div className="absolute inset-0 flex flex-col justify-end pb-12 px-4 max-w-[820px] mx-auto w-full z-10 pointer-events-none">
            <div className="max-w-2xl pointer-events-auto">
                <div className="text-luma-text-tertiary text-sm mb-2 font-medium tracking-wide uppercase">精彩活动尽在</div>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-white drop-shadow-md">{activeCity.label}</h1>
                
                <p className="text-luma-text-secondary text-base leading-relaxed mb-6 line-clamp-2 max-w-lg drop-shadow-sm">
                    {activeCity.description}
                </p>

                <div className="flex items-center gap-4 relative z-50">
                  <button className="bg-luma-text-primary text-luma-base px-6 py-2.5 rounded-full font-medium hover:opacity-90 transition-all shadow-lg flex items-center gap-2 text-sm">
                      <Bell size={16} />
                      订阅本城动态
                  </button>
                  {/* City Switcher Trigger */}
                  <div className="relative city-selector">
                      <button 
                        onClick={() => setIsCityMenuOpen(!isCityMenuOpen)}
                        className="flex items-center gap-2 bg-luma-card/50 backdrop-blur-md px-4 py-2.5 rounded-full hover:bg-luma-card/80 transition-all border border-luma-border-card text-sm font-medium text-white shadow-sm"
                      >
                          <MapPin size={16} />
                          <span>{activeCity.label}</span>
                          <ChevronDown size={14} className={`transition-transform duration-300 ${isCityMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Dropdown menu */}
                      {isCityMenuOpen && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-luma-card backdrop-blur-xl border border-luma-border-card rounded-xl shadow-luma-hover overflow-y-auto max-h-80 animate-in fade-in slide-in-from-top-2 duration-200 z-[9999]">
                            {/* Hot Cities Section */}
                            <div className="px-4 py-2 text-xs font-bold text-luma-text-tertiary border-b border-luma-border">热门城市</div>
                            {cities.map(c => (
                                <button 
                                    key={c.id}
                                    onClick={() => handleCityChange(c)}
                                    className="w-full text-left px-4 py-3 hover:bg-luma-gray-20 text-sm transition-colors flex justify-between items-center group border-b border-luma-border last:border-0"
                                >
                                    <span className="text-luma-text-primary">{c.label}</span>
                                    {activeCity.id === c.id && <div className="w-1.5 h-1.5 rounded-full bg-luma-brand"></div>}
                                </button>
                            ))}
                            {/* ALL Cities Trigger */}
                            <button 
                                onClick={() => {
                                    setIsCityMenuOpen(false);
                                    setIsCitySelectorModalOpen(true);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-luma-brand hover:text-white text-sm transition-colors flex justify-between items-center font-medium text-luma-brand bg-luma-brand/5"
                            >
                                <span>查看全部城市</span>
                                <ChevronDown size={14} className="-rotate-90" />
                            </button>
                        </div>
                      )}
                  </div>
                </div>
            </div>
        </div>
      </div>
      
      <CitySelectorModal 
        isOpen={isCitySelectorModalOpen}
        onClose={() => setIsCitySelectorModalOpen(false)}
        onSelect={handleModalCitySelect}
        hotCities={cities}
        showHotCities={false} // Already showed hot cities in dropdown, or maybe show again inside? User said "View All -> Province/City page", implying full list.
      />

      {/* Main Content - Constrained to 820px */}
      <div className="max-w-[820px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Main Feed (Left 8 cols) -> Changed to Full Width for Luma single column style or keep side widget */}
        {/* Luma often uses a single central column. Let's stick to the 820px constraint which suggests a single column flow or a very tight 2-col. */}
        {/* Let's make it single column for better mobile/desktop consistency in this design system */}
        <div className="lg:col-span-12">
            <header className="flex items-center justify-between mb-8 pb-4 border-b border-luma-border">
                <h2 className="text-xl font-bold flex items-center gap-2 text-luma-text-primary">
                    本周热门活动
                </h2>
                <div className="flex gap-2">
                    <button 
                        onClick={() => navigate('/create')}
                        className="flex items-center gap-2 bg-luma-card hover:bg-luma-gray-20 px-4 py-2 rounded-lg text-sm transition-all border border-luma-border-card text-luma-text-secondary hover:text-luma-text-primary shadow-sm"
                    >
                        <Plus size={16} /> 提交活动
                    </button>
                </div>
            </header>

            <div className="space-y-4">
                {loadingEvents ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="h-48 bg-slate-50 rounded-2xl animate-pulse border border-slate-100"></div>
                  ))
                ) : cityEvents.length > 0 ? (
                    cityEvents.map(event => (
                        <EventCard key={event.id} event={event} />
                    ))
                ) : (
                    <div className="bg-luma-card rounded-2xl p-12 text-center border border-dashed border-luma-border">
                        <div className="w-16 h-16 bg-luma-gray-10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="text-luma-text-tertiary" size={24} />
                        </div>
                        <h3 className="text-luma-text-primary font-medium mb-2">暂无相关活动</h3>
                        <p className="text-luma-text-tertiary mb-6">该城市目前没有热门活动，切换其他城市看看？</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};
