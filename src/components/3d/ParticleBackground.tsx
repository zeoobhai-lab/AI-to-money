import React from 'react';

/**
 * Clean, smooth dark background overlay (particles/squares removed per user request)
 */
export const ParticleBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#07080f]">
      {/* Soft Ambient Radial Blur Orbs */}
      <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[160px]" />
      <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-amber-600/5 rounded-full blur-[180px]" />
      <div className="absolute bottom-10 left-1/3 w-[700px] h-[700px] bg-indigo-900/10 rounded-full blur-[200px]" />
    </div>
  );
};
