import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { EventDetailContent } from '../components/EventDetailContent';

export const EventDetails = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className='min-h-screen bg-luma-base flex items-center justify-center text-luma-text-primary'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold'>无效的活动ID</h2>
          <Link to='/' className='text-luma-brand hover:text-luma-brand-dark mt-4 inline-block underline'>
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <EventDetailContent 
      eventId={id} 
      className='min-h-screen pt-20 pb-8 px-4 sm:px-6 lg:px-8'
    />
  );
};
