import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Profile } from '../types';
import { cn } from '../lib/utils';
import { MapPin } from 'lucide-react';
import { followCommunity, unfollowCommunity, isCommunityFollowed } from '../lib/database';
import { useAuthStore } from '../store/authStore';
import { ImageWithFallback } from './ImageWithFallback';

interface CommunityCardProps {
  profile: Profile;
  className?: string;
}

export const CommunityCard = ({ profile, className }: CommunityCardProps) => {
  const { user } = useAuthStore();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkFollowStatus();
    }
  }, [profile.id, user]);

  const checkFollowStatus = async () => {
    if (!user) return;
    try {
      const followed = await isCommunityFollowed(profile.id, user.id);
      setSubscribed(followed);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleSubscribe = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('请先登录');
      return;
    }

    if (loading) return;
    
    setLoading(true);
    try {
      if (subscribed) {
        await unfollowCommunity(profile.id, user.id);
        setSubscribed(false);
      } else {
        await followCommunity(profile.id, user.id);
        setSubscribed(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link 
      to={`/profile/${profile.id}`} 
      className={cn(
        "group relative flex flex-col bg-luma-card p-5 rounded-2xl hover:bg-luma-card-hover hover:shadow-luma-hover transition-all duration-200 border border-luma-border-card h-full",
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        {/* Avatar / Icon */}
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-luma-base border border-luma-border-image">
          <ImageWithFallback
            src={profile.avatar_url || 'https://via.placeholder.com/150'}
            alt={profile.full_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            fallbackSeed={profile.id}
            fallbackWidth={48}
            fallbackHeight={48}
          />
        </div>
        
        {/* Subscribe Button */}
        <button 
          onClick={handleSubscribe}
          disabled={loading}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-transparent",
            subscribed 
              ? "bg-luma-gray-20 text-luma-text-primary hover:bg-luma-gray-30 border-luma-border" 
              : "bg-luma-gray-10 text-luma-text-secondary hover:bg-luma-gray-20 hover:text-luma-text-primary"
          )}
        >
          {loading ? '...' : subscribed ? '已关注' : '关注'}
        </button>
      </div>
      
      <h3 className="text-base font-bold text-luma-text-primary mb-1 line-clamp-1 group-hover:text-luma-cranberry transition-colors">
        {profile.full_name}
      </h3>
      
      {/* Location (Hidden as per request) */}
      {/* <div className="flex items-center text-xs text-luma-text-tertiary mb-3">
         <MapPin size={12} className="mr-1" />
         Shanghai · AI
      </div> */}

      <p className="text-sm text-luma-text-secondary line-clamp-2 h-10 leading-relaxed mt-2">
        {profile.description || "探索 AI 的无限可能与创新边界"}
      </p>
    </Link>
  );
};
