import React, { useRef, useState, useEffect } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { Event } from '../types';
import { EventDetailCard } from './EventDetailCard/EventDetailCard';
import html2canvas from 'html2canvas';
import { getEventById, getCategories } from '../lib/database';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string | null;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({ isOpen, onClose, eventId }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);
  const [categoryName, setCategoryName] = useState<string>('');

  useEffect(() => {
    if (isOpen && eventId) {
      document.body.style.overflow = 'hidden';
      // Fetch event data
      setLoading(true);
      
      Promise.all([
        getEventById(eventId),
        getCategories()
      ])
        .then(([eventData, categoriesData]) => {
            if (eventData) {
               setEvent(eventData);
               
               // Resolve category name if it's an ID
               if (eventData.category) {
                   const matched = categoriesData.find(c => c.id === eventData.category || c.name === eventData.category);
                   if (matched) {
                       setCategoryName(matched.name);
                   } else {
                       // If not UUID (already a name) or not found, use original
                       // Check if it looks like UUID
                       const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventData.category);
                       setCategoryName(isUUID ? '活动' : eventData.category);
                   }
               }
            }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      document.body.style.overflow = 'unset';
      setEvent(null);
      setCategoryName('');
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, eventId]);

  if (!isOpen || !eventId) return null;

  const handleGenerateImage = async () => {
    if (!cardRef.current) return;
    
    try {
      setGenerating(true);
      // Wait a bit for images to load if needed, but usually natural flow handles it
      
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: null, 
        scale: 3, 
        logging: false,
      });
      
      const url = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `fluxverse-${event?.title || 'event'}.png`;
      link.click();
      
    } catch (err) {
      console.error('Failed to generate image', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-md mx-auto overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <h3 className="font-bold text-gray-900">分享活动卡片</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-gray-50 relative">
            <div className="flex items-center justify-center min-h-[400px] p-6">
                {loading || !event ? (
                   <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Loader2 className="animate-spin text-gray-300" size={32} />
                      Loading...
                   </div>
                ) : (
                  <div style={{ width: '100%', maxWidth: '375px' }}>
                      <EventDetailCard 
                          event={event} 
                          ref={cardRef} 
                          displayCategory={categoryName}
                      />
                  </div>
                )}
           </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex flex-col gap-3 shrink-0">
          <button 
            onClick={handleGenerateImage}
            disabled={generating || loading || !event}
            className="w-full flex items-center justify-center gap-2 bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-70 active:scale-[0.98]"
          >
            {generating ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            {generating ? '正在生成图片...' : '保存图片'}
          </button>
          <p className="text-center text-xs text-gray-400">
            生成图片后可发送给好友或分享到朋友圈
          </p>
        </div>
      </div>
    </div>
  );
};
