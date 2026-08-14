import React, { useState } from 'react';
import { Course } from '../../types';
import { useApp } from '../../context/AppContext';
import { Star, Users, Clock, PlayCircle, ShieldCheck, Sparkles, CheckCircle2, ArrowRight, Flame } from 'lucide-react';

export const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
  const { setSelectedCourseId, setActiveTab, currentUser } = useApp();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: (y / (rect.height / 2)) * -6,
      y: (x / (rect.width / 2)) * 6
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const isEnrolled = currentUser?.enrolledCourseIds?.includes(course.id);

  const handleCardClick = () => {
    setSelectedCourseId(course.id);
    setActiveTab('course-detail');
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: tilt.x === 0 ? 'all 0.5s ease' : 'none'
      }}
      className="glass-panel glass-card-hover rounded-3xl overflow-hidden border border-purple-500/20 hover:border-purple-400/60 flex flex-col group relative"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-gray-900 cursor-pointer" onClick={handleCardClick}>
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04050a] via-transparent to-black/40" />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className="bg-amber-400 text-black text-[10px] font-black px-2.5 py-0.5 rounded-md tracking-wider uppercase shadow-md shadow-amber-500/30 flex items-center gap-1">
            <Flame className="w-3 h-3 fill-black" /> FLAGSHIP COURSE
          </span>
          <span className="bg-purple-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-400/40">
            7 FULL MODULES
          </span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs">
          <div className="w-14 h-14 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-xl shadow-amber-400/50 scale-90 group-hover:scale-100 transition-transform">
            <PlayCircle className="w-8 h-8 fill-black text-amber-400" />
          </div>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{course.rating}</span>
              <span className="text-gray-500 font-normal">({course.reviewsCount})</span>
            </div>
            <div className="flex items-center gap-1 text-purple-300 font-bold">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>{course.enrolledStudentsCount.toLocaleString()} Enrolled</span>
            </div>
          </div>

          <h3
            onClick={handleCardClick}
            className="font-black text-lg text-white group-hover:text-amber-400 transition-colors line-clamp-2 cursor-pointer leading-snug"
          >
            {course.title}
          </h3>

          <p className="text-xs text-gray-300 line-clamp-2 mt-2 leading-relaxed font-normal">
            {course.subtitle}
          </p>
        </div>

        {/* Price & Action */}
        <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-white">
                ₹{course.currentPrice.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 line-through">
                ₹{course.originalPrice.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">
              SAVE {course.discountPercentage}% OFF LAUNCH OFFER
            </span>
          </div>

          {isEnrolled ? (
            <button
              onClick={() => {
                setSelectedCourseId(course.id);
                setActiveTab('course-learning');
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 flex items-center gap-1.5 transition-all shadow-md"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Launch LMS
            </button>
          ) : (
            <button
              onClick={handleCardClick}
              className="px-4 py-2.5 rounded-xl text-xs font-black text-black bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 flex items-center gap-1 shadow-lg shadow-amber-500/30 hover:scale-105 transition-all"
            >
              <span>Explore Course</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
