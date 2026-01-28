import React, { useEffect, useState } from 'react';
import { Event } from '../../types';
import './EventDetailCard.css';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import QRCode from 'qrcode';

interface EventDetailCardProps {
  event: Event;
  brandName?: string;
  className?: string;
  displayCategory?: string;
}

export const EventDetailCard = React.forwardRef<HTMLDivElement, EventDetailCardProps>(({ 
  event, 
  brandName = 'FluxVerse',
  className,
  displayCategory
}, ref) => {
  const {
    title,
    category = '活动',
    start_time,
    start_date,
    end_time,
    location_name,
    city,
    address,
    brief,
    description,
    cover_image_url,
    id
  } = event;

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/events/${id}` : '';
    console.log(url);
    if (url) {
      QRCode.toDataURL(url, { 
        margin: 0,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
      .then(setQrCodeUrl)
      .catch(err => console.error(err));
    }
  }, [id]);

  // Format time
  let timeDisplay = '';
  const dateObj = new Date(start_time || start_date);
  
  if (!isNaN(dateObj.getTime())) {
    const dateStr = format(dateObj, 'M月d日', { locale: zhCN });
    
    // Add end date if exists and different
    // Simplified logic for card
    timeDisplay = dateStr;
    
    if (end_time) {
        const endDateObj = new Date(end_time);
        if (!isNaN(endDateObj.getTime()) && endDateObj.getDate() !== dateObj.getDate()) {
            timeDisplay += ` - ${format(endDateObj, 'M月d日', { locale: zhCN })}`;
        }
    }
  } else {
    timeDisplay = start_date || '待定';
  }

  const locationLine = [city, location_name].filter(Boolean).join(' ');

  return (
    // Note: The outer .event-detail-page wrapper handles centering, but for the card capture we focus on the glass part
    <div className={`event-detail-page ${className || ''}`} style={{ minHeight: 'auto', padding: 0, background: 'transparent' }}>
      <div className="event-detail-card-glass" ref={ref}>
        <article className="event-detail-card">
          <header className="event-detail-card__header">
             <div className="event-detail-card__logo">
                <span className="logo-flux">FLUX</span>
                <span className="logo-verse">VERSE</span>
             </div>
          </header>

          <div className="event-detail-card__visual">
            <img
              src={cover_image_url || '/placeholder.png'}
              alt={title}
              className="event-detail-card__cover"
              crossOrigin="anonymous" // Important for html2canvas
            />
            <div className="event-detail-card__cover-overlay" aria-hidden />
          </div>

          <div className="event-detail-card__body">
            <span className="event-detail-card__category">{displayCategory || category}</span>
            <h1 className="event-detail-card__title">{title}</h1>

            <div className="event-detail-card__when-where">
              <div className="event-detail-card__row">
                <span className="event-detail-card__label">时间</span>
                <span className="event-detail-card__value">{timeDisplay}</span>
              </div>
              <div className="event-detail-card__row">
                <span className="event-detail-card__label">地点</span>
                <span className="event-detail-card__value">{locationLine}</span>
              </div>
              {address && (
                <div className="event-detail-card__row event-detail-card__row--sub">
                  <span className="event-detail-card__value">{address}</span>
                </div>
              )}
            </div>

            {(brief || description) && (
              <div className="event-detail-card__detail">
                <span className="event-detail-card__detail-label">活动详情</span>
                <p className="event-detail-card__detail-text">{brief || description}</p>
              </div>
            )}
            
          </div>

          <footer className="event-detail-card__footer">
             <div className="footer-left">
                <span className="footer-brand">FluxVerse</span>
                <span className="footer-domain">fluxverse.com</span>
                <span className="footer-slogan">探索 AI 与创新的未来</span>
             </div>
             {qrCodeUrl && (
               <div className="footer-right">
                  <div className="qr-container">
                    <img src={qrCodeUrl} alt="QR Code" />
                  </div>
                  <span className="qr-text">扫码查看详情</span>
               </div>
             )}
          </footer>
        </article>
      </div>
    </div>
  );
});

EventDetailCard.displayName = 'EventDetailCard';
