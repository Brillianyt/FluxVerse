import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Mail, Shield } from 'lucide-react';
import { getUserCommunityRoles } from '../lib/database';
import { CommunityRole } from '../types';

export const Profile = () => {
  const { user } = useAuthStore();
  const [communityRoles, setCommunityRoles] = useState<CommunityRole[]>([]);

  const getRoleLabel = (role: CommunityRole['role']) => {
    return role === 'moderator' ? '版主' : '小管理员';
  };

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    try {
      const roles = await getUserCommunityRoles(user.id);
      setCommunityRoles(roles);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">请先登录</h2>
          <p className="text-gray-600">登录后查看您的个人资料和活动</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex items-start space-x-6">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-100 uppercase">
              {user.email[0]}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.email.split('@')[0]}</h1>
              <div className="flex items-center text-gray-600 mb-4">
                <Mail className="h-4 w-4 mr-2" />
                {user.email}
              </div>
              <p className="text-gray-600">FluxVerse 平台的活跃用户</p>

              {communityRoles.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {communityRoles.map((role) => (
                    <span
                      key={role.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 text-gray-700 px-3 py-1 text-xs font-semibold"
                    >
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      {role.community?.name || '未知社区'} · {getRoleLabel(role.role)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
