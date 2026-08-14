import React from 'react';
import { useApp } from '../context/AppContext';
import { CourseCard } from '../components/courses/CourseCard';
import { Sparkles, Flame, Layers, Bot, Zap, Globe, DollarSign } from 'lucide-react';

export const CoursesPage: React.FC = () => {
  const { flagship, setSelectedCourseId, setActiveTab } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header Banner */}
      <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-purple-500/30 relative overflow-hidden space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
          <Flame className="w-3.5 h-3.5 fill-amber-400" />
          <span>Flagship Program</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          AI Income Mastery Modules
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
          The complete 7-module training program covering AI tools, 3D WebGL design, full-stack web development, Make.com automations, Meta Ads, and high-ticket client acquisition.
        </p>
      </div>

      {/* Flagship Course Showcase Card */}
      <div className="max-w-4xl mx-auto">
        <CourseCard course={flagship} />
      </div>

    </div>
  );
};
