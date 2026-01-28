
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Search, Loader2 } from 'lucide-react';
import { getAllCommunities } from '../lib/database';
import { Profile } from '../types';
import { CommunityCard } from '../components/CommunityCard';

export const AllCommunities = () => {
  const [communities, setCommunities] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const data = await getAllCommunities();
        setCommunities(data);
      } catch (error) {
        console.error('Failed to fetch communities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunities();
  }, []);

  const filteredCommunities = communities.filter(c => 
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="max-w-[820px] mx-auto px-4 sm:px-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-luma-border pb-8 pt-8">
          <div>
            <Link to="/home" className="inline-flex items-center gap-2 text-luma-text-tertiary hover:text-luma-text-primary mb-4 transition-colors text-sm">
              <ArrowLeft size={16} />
              <span>返回发现</span>
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2 flex items-center gap-3 text-luma-text-primary">
              <Users className="text-luma-brand" size={32} />
              精选社区
            </h1>
            <p className="text-luma-text-secondary max-w-xl text-lg">
              加入感兴趣的社区，与志同道合的伙伴一起成长。
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-luma-text-tertiary" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-luma-border rounded-xl leading-5 bg-white text-luma-text-primary placeholder-luma-text-tertiary focus:outline-none focus:ring-2 focus:ring-luma-brand/20 focus:border-luma-brand sm:text-sm transition-all shadow-sm"
              placeholder="搜索社区名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-[180px] bg-luma-card rounded-2xl animate-pulse border border-luma-border-card"></div>
            ))}
          </div>
        ) : filteredCommunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCommunities.map((community, index) => (
              <div 
                key={community.id} 
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CommunityCard profile={community} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-luma-card rounded-3xl border border-dashed border-luma-border">
            <div className="w-16 h-16 bg-luma-gray-10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="text-luma-text-tertiary" size={24} />
            </div>
            <h3 className="text-xl font-bold text-luma-text-primary mb-2">未找到相关社区</h3>
            <p className="text-luma-text-secondary">
              尝试更换搜索关键词，或者浏览全部社区。
            </p>
            <button 
                onClick={() => setSearchTerm('')}
                className="mt-6 px-6 py-2.5 bg-luma-text-primary text-white rounded-full text-sm font-bold hover:opacity-90 transition-all shadow-lg"
            >
                清除搜索
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
