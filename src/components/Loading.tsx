import React from 'react';

export const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-[50vh] w-full">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  );
};
