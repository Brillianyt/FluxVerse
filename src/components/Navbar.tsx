import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, Calendar, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import { ImageWithFallback } from './ImageWithFallback';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discovery?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
    }
  };

  const isLanding = location.pathname === '/';
  
  let navBgClass = 'bg-transparent';
  if (isScrolled) {
    navBgClass = 'bg-white/80 backdrop-blur-md border-b border-gray-100';
  }

  return (
    <nav className={cn("fixed top-0 w-full z-50 transition-all duration-300", navBgClass)}>
      <div className="max-w-7xl mx-auto px-8 py-4 sm:py-6">
        <div className="flex justify-between items-center h-12">
          {/* Left: Logo & Nav Links */}
          <div className="flex items-center space-x-12">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 text-purple-600 font-bold text-xl cursor-pointer">
              <Sparkles className="w-6 h-6 fill-current text-purple-500" />
              <span className="text-gray-900 font-bold text-lg">FluxVerse</span>
            </Link>

            {/* Desktop Menu - Left Aligned */}
            <div className="hidden md:flex items-center space-x-8 text-gray-600 text-base font-medium">
              <Link 
                to="/home" 
                className="hover:text-gray-900 transition-colors"
              >
                活动
              </Link>
              <Link 
                to="/my-events" 
                className="flex items-center space-x-2 hover:text-gray-900 transition-colors"
              >
                <Calendar className="w-5 h-5" />
                <span>日历</span>
              </Link>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center space-x-8 text-sm text-gray-500">
             {/* Time (Mock) */}
             <span className="font-medium text-gray-400 hidden lg:block">
                GMT+8 {new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', hour12: false})}
             </span>

             <Link
                to="/create"
                className="text-gray-900 hover:text-gray-700 font-medium transition-colors"
             >
                创建活动
             </Link>

             <button onClick={() => setIsMenuOpen(true)} className="text-gray-800 cursor-pointer hover:text-gray-600 transition-colors">
                <Search className="w-5 h-5" />
             </button>
             
            {user ? (
               <Link to="/profile" className="flex items-center ml-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-purple-500">
                    {user.user_metadata?.avatar_url && (
                      <ImageWithFallback src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" fallbackSeed={user.id} fallbackWidth={32} fallbackHeight={32} />
                    )}
                  </div>
               </Link>
            ) : (
              <Link
                to="/login"
                className="text-gray-900 hover:text-gray-700 font-medium transition-colors"
              >
                登录
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md focus:outline-none text-gray-600"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="pt-2 pb-3 space-y-1 px-4">
            <form onSubmit={handleSearch} className="mb-4">
              <input
                type="text"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="搜索活动..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <Link
              to="/home"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              活动
            </Link>
            <Link
              to="/my-events"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              我的日程
            </Link>
            <Link
              to="/create"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              发布活动
            </Link>
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  个人中心
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  退出登录
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block w-full text-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 shadow-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                登录
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
