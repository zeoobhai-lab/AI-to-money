import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Star,
  Users,
  Clock,
  Award,
  CheckCircle2,
  PlayCircle,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  Lock,
  Sparkles,
  Flame,
  Gift
} from 'lucide-react';

export const CourseDetailPage: React.FC<{ onOpenAuth: () => void }> = ({ onOpenAuth }) => {
  const { flagship, currentUser, setActiveTab, setSelectedCourseId } = useApp();

  const isEnrolled = currentUser?.enrolledCourseIds?.includes(flagship.id);

  const [expandedChapId, setExpandedChapId] = useState<string>(flagship.chapters?.[0]?.id || '');
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const handleEnrollNow = () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setSelectedCourseId(flagship.id);
    setActiveTab('checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Top Banner */}
      <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-purple-500/30 grid grid-cols-1 lg:grid-cols-12 gap-8 relative overflow-hidden">
        
        <div className="lg:col-span-8 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-amber-400 text-black text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-black" /> FLAGSHIP COURSE
            </span>
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold px-3 py-1 rounded-full">
              7 Modules • 25+ Video Lessons
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            {flagship.title}
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-normal">
            {flagship.subtitle}
          </p>

          {/* Mentors & Stats */}
          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <img
                src={flagship.mentors[0].avatar}
                alt={flagship.mentors[0].name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/40"
              />
              <div>
                <p className="font-bold text-white">{flagship.mentors[0].name}</p>
                <p className="text-[10px] text-amber-400">{flagship.mentors[0].title}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{flagship.rating}</span>
              <span className="text-gray-400 font-normal">({flagship.reviewsCount} reviews)</span>
            </div>

            <div className="flex items-center gap-1.5 text-purple-300 font-bold">
              <Users className="w-4 h-4 text-purple-400" />
              <span>{flagship.enrolledStudentsCount.toLocaleString()} Enrolled</span>
            </div>
          </div>
        </div>

        {/* Right Checkout Widget */}
        <div className="lg:col-span-4 flex flex-col justify-between glass-panel p-6 rounded-2xl border border-amber-500/30 space-y-6">
          <div className="relative aspect-video rounded-xl overflow-hidden group bg-gray-900 border border-gray-800">
            <img src={flagship.thumbnail} alt={flagship.title} className="w-full h-full object-cover" />
            <button
              onClick={() => setPreviewVideoUrl(flagship.promoVideoUrl)}
              className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-xl shadow-amber-400/50 group-hover:scale-110 transition-transform">
                <PlayCircle className="w-8 h-8 fill-black text-amber-400" />
              </div>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-white">
                  ₹{flagship.currentPrice.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  ₹{flagship.originalPrice.toLocaleString()}
                </span>
                <span className="text-xs text-amber-400 font-bold">
                  {flagship.discountPercentage}% OFF
                </span>
              </div>
            </div>

            {isEnrolled ? (
              <button
                onClick={() => {
                  setSelectedCourseId(flagship.id);
                  setActiveTab('course-learning');
                }}
                className="w-full py-4 rounded-xl text-sm font-bold text-black bg-emerald-400 hover:bg-emerald-300 flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Go to Student Learning LMS</span>
              </button>
            ) : (
              <button
                onClick={handleEnrollNow}
                className="w-full py-4 rounded-xl text-sm font-black text-black bg-gradient-to-r from-amber-400 via-orange-400 to-purple-500 hover:shadow-xl hover:shadow-amber-500/30 flex items-center justify-center gap-2 transition-all"
              >
                <span>Enroll Now & Get Instant Access</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <div className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>7-Day 100% Money-Back Guarantee</span>
            </div>
          </div>
        </div>

      </div>

      {/* Curriculum Chapters Breakdown */}
      <div className="space-y-4 max-w-4xl">
        <h3 className="text-xl font-black text-white">All 7 Curriculum Modules</h3>

        {flagship.chapters?.map((chap, idx) => (
          <div key={chap.id} className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
            <button
              onClick={() => setExpandedChapId(expandedChapId === chap.id ? '' : chap.id)}
              className="w-full p-5 text-left font-bold text-sm text-white flex items-center justify-between gap-4 hover:bg-purple-500/10"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">
                  0{idx + 1}
                </span>
                <div>
                  <h4 className="font-bold text-white text-sm">{chap.title}</h4>
                  <p className="text-[11px] text-gray-400 font-normal">{chap.description}</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-amber-400 transition-transform ${expandedChapId === chap.id ? 'rotate-180' : ''}`} />
            </button>

            {expandedChapId === chap.id && (
              <div className="px-5 pb-5 space-y-2 border-t border-gray-800/80 pt-3">
                {chap.lessons?.map((les) => (
                  <div
                    key={les.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <PlayCircle className="w-4 h-4 text-amber-400" />
                      <div>
                        <p className="font-bold text-white">{les.title}</p>
                        <p className="text-[10px] text-gray-400">{les.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">{les.durationMinutes} mins</span>
                      {les.isFreePreview ? (
                        <button
                          onClick={() => setPreviewVideoUrl(les.videoUrl)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-400 text-black shadow"
                        >
                          Free Demo
                        </button>
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewVideoUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl glass-panel rounded-3xl border border-purple-500/30 overflow-hidden p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <PlayCircle className="w-4 h-4" /> Free Class Video Preview
              </span>
              <button
                onClick={() => setPreviewVideoUrl(null)}
                className="text-xs font-bold text-gray-400 hover:text-white px-2.5 py-1 bg-gray-800 rounded-lg"
              >
                Close ✕
              </button>
            </div>
            <div className="aspect-video bg-black rounded-2xl overflow-hidden">
              <video src={previewVideoUrl} controls autoPlay className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
