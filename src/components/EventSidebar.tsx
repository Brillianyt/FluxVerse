import React, { useEffect, useState } from 'react';
import { useUiStore } from '../store/uiStore';
import { EventDetailContent } from './EventDetailContent';
import { ChevronsRight, Link as LinkIcon, ExternalLink, X, Share2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { ShareCardModal } from './ShareCardModal';

export const EventSidebar = () => {
  const { selectedEventId, closeEventSidebar } = useUiStore();
  const [isVisible, setIsVisible] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (selectedEventId) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300); // Wait for animation
      document.body.style.overflow = 'unset';
      setShowShareModal(false);
      return () => clearTimeout(timer);
    }
  }, [selectedEventId]);

  if (!isVisible && !selectedEventId) return null;

  if (!isVisible && !selectedEventId) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex justify-end transition-opacity duration-300",
      selectedEventId ? "pointer-events-auto" : "pointer-events-none"
    )}>
      <ShareCardModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)}
        eventId={selectedEventId}
      />
      
      {/* Overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          selectedEventId ? "opacity-100" : "opacity-0"
        )}
        onClick={closeEventSidebar}
      />

      {/* Sidebar */}
      <div 
        className={cn(
          "relative w-full max-w-[480px] bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col overflow-hidden border border-gray-200 h-full sm:h-[calc(100vh-2rem)] sm:my-4 sm:mr-4 sm:rounded-2xl",
          selectedEventId ? "translate-x-0" : "translate-x-[calc(100%+2rem)]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-md z-10 shrink-0 sticky top-0">
          <div className="flex items-center gap-2">
            <button 
              onClick={closeEventSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
              title="Close Sidebar"
            >
              <ChevronsRight size={20} />
            </button>
            <div className="h-4 w-px bg-gray-200 mx-1"></div>
             <button 
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-lg text-sm text-gray-600 font-medium transition-colors"
            >
              <Share2 size={14} />
              <span>分享卡片</span>
            </button>
            <Link 
              to={`/events/${selectedEventId}`}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-lg text-sm text-gray-600 font-medium transition-colors"
              onClick={closeEventSidebar} // Close sidebar if navigating to full page
            >
              <span>活动页面</span>
              <ExternalLink size={14} />
            </Link>
          </div>
          
          {/* Mock nav arrows for visual parity */}
          <div className="flex items-center gap-1 text-gray-400">
             {/* Could add Prev/Next buttons here if functional */}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          {selectedEventId && (
            <EventDetailContent 
              eventId={selectedEventId} 
              className="min-h-full py-6 px-6 sm:px-8 bg-transparent"
            />
          )}
        </div>
      </div>
    </div>
  );
};
