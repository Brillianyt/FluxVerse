import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Shield, CalendarPlus, Check, AlertCircle, Loader2, Image as ImageIcon, MapPin, Clock, Type, Users, Ticket, ToggleLeft, ToggleRight, Shuffle, ChevronDown, Globe, Lock, Plus, Minus, Link as LinkIcon, Trash2 } from 'lucide-react';
import { getCategories } from '../lib/database';
import { getUserCommunityRoles, createEvent, updateEvent, getEventById } from '../lib/database';
import { Category, CommunityRole, Event } from '../types';
import { useCities } from '../hooks/useCities';
import { CitySelectorModal } from '../components/CitySelectorModal';

export const CreateEvent = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { cities } = useCities();
  const [isCitySelectorOpen, setIsCitySelectorOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userRoles, setUserRoles] = useState<CommunityRole[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string>('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop');
  const [isOtherCity, setIsOtherCity] = useState(false);
  const [otherCityLabel, setOtherCityLabel] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    brief: '',
    description: '',
    highlights: [''] as string[],
    external_link: '',
    start_time: '',
    end_time: '',
    location_name: '',
    location_address: '',
    city_id: null as string | null,
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    // Removed price, capacity, needs_approval UI but kept in state potentially for API compatibility if needed
    // or just pass defaults. Let's keep them in state to avoid breaking existing usages in code but ignore in UI
    price: 0,
    capacity: 0,
    community_id: null as string | null,
    selected_category_ids: [] as string[],
    visibility: 'public' as 'public' | 'private', // Default to public
    needs_approval: false, // Default false
    cover_image_url: ''
  });

  useEffect(() => {
    const loadEventForEdit = async () => {
        if (!editId) return;
        setLoading(true);
        try {
            const event = await getEventById(editId);
            if (event) {
                // Check permissions (optional client side check)
                if (user && user.role !== 'admin' && user.id !== event.organizer_id) {
                    setError("您没有权限编辑此活动");
                    return;
                }

                const toLocalISOString = (dateStr: string) => {
                     if (!dateStr) return '';
                     const d = new Date(dateStr);
                     if (isNaN(d.getTime())) return '';
                     const pad = (n: number) => n.toString().padStart(2, '0');
                     return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                };

                setFormData({
                    title: event.title,
                    brief: event.brief || '',
                    description: event.description,
                    highlights: Array.isArray(event.highlights) ? event.highlights : [''],
                    external_link: event.original_link || '',
                    start_time: toLocalISOString(event.start_time), 
                    end_time: toLocalISOString(event.end_time),
                    location_name: event.location_name,
                    location_address: event.address || '',
                    city_id: event.city_id || null,
                    latitude: event.latitude,
                    longitude: event.longitude,
                    price: event.price || 0,
                    capacity: event.capacity || 0,
                    community_id: event.community_id || null,
                    selected_category_ids: event.category_ids || [],
                    visibility: (event.visibility as 'public' | 'private') || 'public',
                    needs_approval: event.needs_approval || false,
                    cover_image_url: event.cover_image_url
                });
                
                if (event.cover_image_url) {
                    setPreviewImage(event.cover_image_url);
                }
            }
        } catch (err) {
            console.error("Error loading event:", err);
            setError("无法加载活动详情: " + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };
    
    if (editId && user) {
        loadEventForEdit();
    }
  }, [editId, user]);

  // Initialize dates if empty AND not editing
  useEffect(() => {
      if (!formData.start_time && !editId) {
          const now = new Date();
          now.setMinutes(0, 0, 0); // Round to hour
          const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
          
          // Helper to format ISO string for inputs
          const toLocalISO = (d: Date) => {
              const pad = (n: number) => n.toString().padStart(2, '0');
              return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          };
          
          setFormData(prev => ({
              ...prev,
              start_time: toLocalISO(now),
              end_time: toLocalISO(nextHour)
          }));
      }
  }, []);

  // Helper to update start_time or end_time
  const updateDateTime = (field: 'start_time' | 'end_time', type: 'date' | 'time', value: string) => {
    let currentStr = formData[field];
    
    // Safety check: if currentStr is invalid or ISO (ends with Z or +xx:xx), try to sanitize for local manipulation
    // The inputs expect YYYY-MM-DDTHH:mm
    if (currentStr && (currentStr.endsWith('Z') || currentStr.includes('+'))) {
        // Simple fallback to current time if parsing fails or just construct new Date 
        // to avoid complicating ISO updates manually
    }
    
    const current = currentStr ? new Date(currentStr) : new Date();
    
    if (isNaN(current.getTime())) {
        // Fallback if currentStr is garbage
        const now = new Date();
        current.setTime(now.getTime());
    }
    
    if (type === 'date') {
        // value is YYYY-MM-DD
        if (!value) return;
        const [year, month, day] = value.split('-').map(Number);
        current.setFullYear(year, month - 1, day);
    } else {
        // value is HH:mm
        if (!value) return;
        const [hours, minutes] = value.split(':').map(Number);
        current.setHours(hours, minutes);
    }
    
    // Format back to YYYY-MM-DDTHH:mm (datetime-local format)
    const pad = (n: number) => n.toString().padStart(2, '0');
    const newStr = `${current.getFullYear()}-${pad(current.getMonth()+1)}-${pad(current.getDate())}T${pad(current.getHours())}:${pad(current.getMinutes())}`;
    
    setFormData(prev => ({ ...prev, [field]: newStr }));
  };

  const getDateValue = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  }

  const getTimeValue = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  // Display helpers
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '选择日期';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '选择日期';
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${date.getMonth() + 1}月${date.getDate()}日 ${dayNames[date.getDay()]}`;
  };

  const formatTimeDisplay = (dateStr: string) => {
    if (!dateStr) return '时间';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '时间';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handleCitySelect = (cityName: string) => {
    // Check against DB Cities (Hot Cities)
    // cityName is typically the Chinese label from CitySelectorModal (e.g., "北京市")
    // but cities.find checks 'name' which is English slug or 'label' which is Chinese.
    const city = cities.find(c => c.label === cityName || c.name === cityName || cityName.includes(c.label));

    if (city) {
        setIsOtherCity(false);
        setFormData(prev => ({
            ...prev,
            city_id: city.id,
            latitude: city.latitude,
            longitude: city.longitude
        }));
    } else {
        // Not in our Database cities table -> Set city_id to null but keep the name for address
        setIsOtherCity(true);
        setOtherCityLabel(cityName);
        setFormData(prev => ({
            ...prev,
            city_id: null,
            latitude: undefined,
            longitude: undefined
        }));
    }
  };

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  const loadInitialData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [cats, roles] = await Promise.all([
        getCategories(),
        getUserCommunityRoles(user.id)
      ]);
      setCategories(cats);
      setUserRoles(roles);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
      setFormData(prev => ({ ...prev, cover_image_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
            break;
          }
        }
      }
    }
  };

  const toggleCategory = (catId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_category_ids: prev.selected_category_ids.includes(catId)
        ? prev.selected_category_ids.filter(id => id !== catId)
        : [...prev.selected_category_ids, catId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start_time) {
      setError('请填写活动标题和开始时间');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      let finalLocationName = formData.location_name;
      let finalLocationAddress = formData.location_address;
      let finalCityId = formData.city_id;

      // Handle "Other City" creation
      if (isOtherCity && otherCityLabel) {
        try {
          const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
          const res = await fetch(`${apiBase}/api/cities/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              name: otherCityLabel, // Backend will use this as name if unique
              label: otherCityLabel,
            })
          });
          const cityResult = await res.json();
          if (cityResult.success && cityResult.data) {
            finalCityId = cityResult.data.id;
            // Also update local label/name if needed, but city_id is most important for index
          }
        } catch (err) {
          console.error("Failed to auto-create city:", err);
        }
      }

      // Construct description from highlights
      const description = formData.highlights.filter(h => h.trim()).join('\n');

      // Create or Update event object
      const payload: Partial<Event> = {
        title: formData.title,
        description: description,
        start_date: formData.start_time.split('T')[0],
        end_date: (formData.end_time || formData.start_time).split('T')[0],
        time_info: `${getTimeValue(formData.start_time)} - ${getTimeValue(formData.end_time || formData.start_time)}`,
        start_time: `${formData.start_time}:00+08:00`,
        end_time: `${formData.end_time || formData.start_time}:00+08:00`,
        location_name: finalLocationName,
        address: finalLocationAddress,
        latitude: formData.latitude,
        longitude: formData.longitude,
        price: Number(formData.price),
        capacity: Number(formData.capacity) === 0 ? null : Number(formData.capacity),
        community_id: formData.community_id || null,
        category_ids: formData.selected_category_ids,
        cover_image_url: formData.cover_image_url || previewImage,
        city_id: finalCityId || null,
        source_type: 'user_submitted',
        is_info_verified: 1,
        supports_site_registration: 0,
        original_link: formData.external_link,
        brief: formData.brief, 
        highlights: formData.highlights.filter(h => h.trim()),
      };

      let resultId;
      if (editId) {
          await updateEvent(editId, payload);
          resultId = editId;
      } else {
          const result = await createEvent(payload, user.id);
          resultId = result?.id;
      }
      
      navigate(`/events/${resultId || ''}`);
    } catch (err: any) {
      setError(err.message || '发布失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield className="h-16 w-16 text-slate-300 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-3">请先登录</h1>
          <p className="text-slate-500 mb-8">登录后即可发布活动并管理您的社区</p>
          <Link
            to="/login"
            className="inline-flex items-center px-6 py-3 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
          >
            去登录
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 pt-24 flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pt-20 pb-20 px-4 sm:px-6">
      <div className="w-full lg:w-[56%] mx-auto">
        <form 
          onSubmit={handleSubmit} 
          onPaste={handlePaste}
          className="grid grid-cols-1 lg:grid-cols-[35.3%_1fr] gap-12 items-start"
        >
          
          {/* Left Column: Image & Theme */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="relative group aspect-square rounded-[2rem] overflow-hidden shadow-xl bg-white border border-slate-200 ring-1 ring-slate-100">
              <img 
                src={previewImage} 
                alt="Event cover" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/50 transition-opacity opacity-0 group-hover:opacity-100 flex items-center justify-center">
                <label className="cursor-pointer bg-white/20 backdrop-blur-md p-4 rounded-full hover:bg-white/30 transition-all transform hover:scale-110 border border-white/40">
                  <ImageIcon className="text-white" size={24} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
              
              <div className="absolute bottom-4 right-4">
                <label className="cursor-pointer bg-white/90 backdrop-blur-md p-2.5 rounded-xl text-slate-700 hover:bg-white transition-all flex items-center justify-center border border-slate-200 shadow-sm">
                   <ImageIcon size={18} />
                   <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 bg-white rounded-xl p-3 flex items-center justify-between border border-slate-200 shadow-sm hover:border-slate-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="bg-teal-50 p-2 rounded-lg">
                    <Type className="text-teal-600" size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium leading-none mb-1">主题</p>
                    <p className="text-sm font-bold text-slate-700">简约</p>
                  </div>
                </div>
                <ChevronDown size={16} className="text-slate-400" />
              </div>
              <button 
                type="button"
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <Shuffle className="text-slate-400" size={20} />
              </button>
            </div>
          </div>

          {/* Right Column: Form Fields */}
          <div className="space-y-6">
            
            {/* Header Identity & Visibility */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select 
                    className="appearance-none bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-1 pr-8 rounded-full focus:outline-none transition-colors border border-slate-200 shadow-sm cursor-pointer"
                    value={formData.community_id}
                    onChange={e => setFormData({...formData, community_id: e.target.value})}
                  >
                    <option value="" className="text-slate-900">个人日历</option>
                    {userRoles.map(role => (
                      <option key={role.community_id} value={role.community_id} className="text-slate-900">
                        {role.community?.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Title & Brief */}
            <div className="space-y-3">
              <input 
                type="text"
                placeholder="活动名称"
                className="w-full bg-transparent border-none text-3xl lg:text-4xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-0 px-0 tracking-tight"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
              
              {/* Event Introduction (Brief) */}
              <div className="bg-white/50 rounded-xl p-1 border border-transparent focus-within:border-slate-200 focus-within:bg-white transition-all">
                <textarea
                    placeholder="活动简介 (简要描述活动内容...)"
                    className="w-full bg-transparent border-none p-1 text-slate-600 text-sm placeholder:text-slate-400 focus:outline-none resize-none m-0"
                    rows={2}
                    value={formData.brief}
                    onChange={e => setFormData({...formData, brief: e.target.value})}
                />
              </div>
            </div>

            {/* DateTime & Location Section */}
            <div className="bg-white rounded-2xl p-1 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-1">
              <div className="flex-1 p-2 space-y-2">
                {/* Start Time Row */}
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 relative">
                    <div className="absolute top-1.5 bottom-[-1rem] left-1/2 -translate-x-1/2 w-px bg-slate-200 dashed-border"></div>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-7">开始</span>
                    <div className="flex-1 grid grid-cols-2 gap-1.5">
                      {/* Date Input */}
                      <div className="relative bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg px-2 py-1 flex items-center justify-center cursor-pointer group h-[32px] auto-shrink-container">
                         <span className="font-bold text-slate-700 pointer-events-none group-hover:text-teal-600 transition-colors auto-shrink-text">
                            {formatDateDisplay(formData.start_time)}
                         </span>
                         <input 
                           type="date"
                           required
                           className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                           value={getDateValue(formData.start_time)}
                           onChange={e => updateDateTime('start_time', 'date', e.target.value)}
                           onClick={(e) => (e.target as any).showPicker?.()}
                         />
                      </div>
                      {/* Time Input */}
                      <div className="relative bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg px-2 py-1 flex items-center justify-center cursor-pointer group h-[32px]">
                         <span className="text-sm font-bold text-slate-700 pointer-events-none group-hover:text-teal-600 transition-colors">
                            {formatTimeDisplay(formData.start_time)}
                         </span>
                         <input 
                           type="time"
                           required
                           className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                           value={getTimeValue(formData.start_time)}
                           onChange={e => updateDateTime('start_time', 'time', e.target.value)}
                           onClick={(e) => (e.target as any).showPicker?.()}
                         />
                      </div>
                    </div>
                  </div>
                </div>

                {/* End Time Row */}
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full border-2 border-slate-300 ml-1"></div>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-7">结束</span>
                    <div className="flex-1 grid grid-cols-2 gap-1.5">
                      {/* Date Input */}
                      <div className="relative bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg px-2 py-1 flex items-center justify-center cursor-pointer group h-[32px] auto-shrink-container">
                         <span className="font-bold text-slate-700 pointer-events-none group-hover:text-teal-600 transition-colors auto-shrink-text">
                            {formatDateDisplay(formData.end_time || formData.start_time)}
                         </span>
                         <input 
                           type="date"
                           className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                           value={getDateValue(formData.end_time || formData.start_time)}
                           onChange={e => updateDateTime('end_time', 'date', e.target.value)}
                           onClick={(e) => (e.target as any).showPicker?.()}
                         />
                      </div>
                      {/* Time Input */}
                      <div className="relative bg-slate-50 hover:bg-slate-100 transition-colors rounded-lg px-2 py-1 flex items-center justify-center cursor-pointer group h-[32px]">
                         <span className="text-sm font-bold text-slate-700 pointer-events-none group-hover:text-teal-600 transition-colors">
                            {formatTimeDisplay(formData.end_time || formData.start_time)}
                         </span>
                         <input 
                           type="time"
                           className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                           value={getTimeValue(formData.end_time || formData.start_time)}
                           onChange={e => updateDateTime('end_time', 'time', e.target.value)}
                           onClick={(e) => (e.target as any).showPicker?.()}
                         />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Input Area */}
              <div className="bg-slate-50 rounded-xl p-2 flex flex-col justify-center gap-2 md:w-64 border border-slate-200/50 relative">
                 
                 {/* City Selector */}
                 <div className="relative self-start">
                    <div 
                        onClick={() => setIsCitySelectorOpen(true)}
                        className="bg-white pl-2 pr-2 py-1 rounded-full shadow-sm flex items-center gap-1 cursor-pointer hover:shadow-md transition-all border border-slate-200"
                    >
                        <div className="bg-teal-50 p-0.5 rounded-full">
                            <MapPin size={10} className="text-teal-600" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                            {isOtherCity ? (otherCityLabel || '其他') : (cities.find(c => c.id === formData.city_id)?.label || '选择城市')}
                        </span>
                        <ChevronDown size={10} className="text-slate-400" />
                    </div>
                 </div>
                 
                 <div className="space-y-1.5 px-1.5">
                    <input 
                      type="text"
                      placeholder="地点名称 (如: 西岸艺术中心)"
                      className="w-full bg-transparent border-none p-0 text-slate-700 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-0 text-sm"
                      value={formData.location_name}
                      onChange={e => setFormData({...formData, location_name: e.target.value})}
                    />
                    <input 
                      type="text"
                      placeholder="详细地址 (可选)"
                      className="w-full bg-transparent border-none p-0 text-slate-400 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-0 text-xs"
                      value={formData.location_address}
                      onChange={e => setFormData({...formData, location_address: e.target.value})}
                    />
                 </div>

              </div>

            </div>

            {/* Event Link */}
            <div className="bg-white rounded-2xl p-3 flex items-center gap-3 border border-slate-200 shadow-sm focus-within:border-teal-500/50 transition-all group">
               <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 group-focus-within:bg-teal-50 group-focus-within:border-teal-100 transition-colors">
                  <LinkIcon size={16} className="text-slate-400 group-focus-within:text-teal-600 transition-colors" />
               </div>
               <div className="flex-1">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">活动链接</p>
                   <input 
                      type="url"
                      placeholder="粘贴活动链接 (如 Luma, 微信公众号...)"
                      className="w-full bg-transparent border-none p-0 text-slate-700 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-0 text-sm"
                      value={formData.external_link}
                      onChange={e => setFormData({...formData, external_link: e.target.value})}
                   />
               </div>
            </div>

            {/* Highlights (replacing Description) */}
            <div className="space-y-2 pt-1">
               <div className="flex items-center justify-between px-1">
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">我能为参与者带来什么</h3>
                 <button type="button" onClick={() => setFormData(prev => ({...prev, highlights: [...prev.highlights, '']}))} className="text-teal-600 text-xs font-bold flex items-center gap-1 hover:bg-teal-50 px-2 py-1 rounded-full transition-colors bg-white shadow-sm border border-slate-200 hover:border-teal-200">
                    <Plus size={12} /> 添加亮点
                 </button>
               </div>
               <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm space-y-2">
                  {formData.highlights.map((item, idx) => (
                      <div key={idx} className="flex gap-2 group relative items-start">
                          <span className="mt-2 text-xs font-bold text-slate-400 w-4 text-right">{idx + 1}.</span>
                          <textarea 
                            rows={1}
                            placeholder={`第 ${idx + 1} 条亮点 (e.g. 认识行业大佬...)`}
                            className="flex-1 bg-transparent border-b border-slate-100 focus:border-teal-500/50 p-1 text-slate-700 font-bold placeholder:text-slate-300 focus:outline-none text-base resize-none overflow-hidden transition-colors rounded hover:bg-slate-50 focus:bg-slate-50"
                            value={item}
                            onChange={e => {
                                const newHighlights = [...formData.highlights];
                                newHighlights[idx] = e.target.value;
                                setFormData(prev => ({...prev, highlights: newHighlights}));
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                          />
                          {formData.highlights.length > 1 && (
                              <button type="button" onClick={() => {
                                  const newHighlights = formData.highlights.filter((_, i) => i !== idx);
                                  setFormData(prev => ({...prev, highlights: newHighlights}));
                              }} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all p-1 bg-white rounded-full shadow-sm hover:shadow-md border border-slate-100">
                                  <Trash2 size={12} />
                              </button>
                          )}
                      </div>
                  ))}
               </div>
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">活动类别</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1 rounded-lg text-sm font-bold transition-all border ${
                      formData.selected_category_ids.includes(cat.id)
                        ? "bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/20"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-500 p-3 rounded-2xl border border-red-100">
                <AlertCircle size={16} />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-2xl shadow-xl shadow-teal-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group text-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>处理中...</span>
                </>
              ) : (
                <>
                  <span>{editId ? '更新活动' : '创建活动'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <CitySelectorModal
        isOpen={isCitySelectorOpen}
        onClose={() => setIsCitySelectorOpen(false)}
        onSelect={handleCitySelect}
        hotCities={cities}
        showHotCities={false} // Requirement: "Two levels: Province -> City". Hot cities can be skipped inside modal if strict 2-level is desired, but usually helpful. User script says "Province then City". I'll hide hot cities in Create flow to be strict.
      />
    </div>
  );
};
