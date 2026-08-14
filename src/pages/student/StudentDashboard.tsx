import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Announcement, ActionShortcutCard } from '../../types';
import { PhotoUploadModal } from '../../components/ui/PhotoUploadModal';
import {
  GraduationCap,
  PlayCircle,
  BookOpen,
  FileText,
  Award,
  Bell,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Flame,
  Bot,
  Plus,
  Trash2,
  Edit3,
  X,
  ShieldCheck,
  Camera
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const {
    currentUser,
    currentRole,
    flagship,
    announcements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    actionCards,
    addActionCard,
    updateActionCard,
    deleteActionCard,
    getCourseProgressPercentage,
    setSelectedCourseId,
    setActiveTab,
    updateUserProfile,
    uploadToSupabaseStorage,
    showToast
  } = useApp();

  const [studentTab, setStudentTab] = useState<'overview' | 'modules' | 'announcements'>('overview');

  // Photo Upload Modal State
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Announcement Modal State
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState<'live_masterclass' | 'module_update' | 'bonus_drop'>('live_masterclass');

  // Action Card Modal State
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardTitle, setCardTitle] = useState('');
  const [cardDescription, setCardDescription] = useState('');
  const [cardTargetTab, setCardTargetTab] = useState('study-material');

  const isAdmin = currentRole === 'admin';

  if (!currentUser && !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="glass-panel p-10 rounded-3xl border border-purple-500/30 space-y-6 bg-gradient-to-b from-purple-950/40 to-black shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Student Dashboard</span>
          </div>
          <h2 className="text-3xl font-black text-white">Student Login Required</h2>
          <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
            You need to be logged in as a student to view your dashboard, track course progress, and access learning materials.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setActiveTab('home')}
              className="px-8 py-3.5 rounded-2xl font-black text-xs text-black bg-gradient-to-r from-amber-400 to-orange-400 hover:scale-105 transition-all shadow-lg shadow-amber-500/30"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = getCourseProgressPercentage(flagship.id);

  // Announcement Handlers
  const handleOpenAddAnn = () => {
    setEditingAnnId(null);
    setAnnTitle('');
    setAnnContent('');
    setAnnType('live_masterclass');
    setShowAnnModal(true);
  };

  const handleOpenEditAnn = (ann: Announcement) => {
    setEditingAnnId(ann.id);
    setAnnTitle(ann.title);
    setAnnContent(ann.content);
    setAnnType(ann.type);
    setShowAnnModal(true);
  };

  const handleSaveAnn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    if (editingAnnId) {
      updateAnnouncement(editingAnnId, {
        title: annTitle,
        content: annContent,
        type: annType
      });
    } else {
      addAnnouncement({
        id: `ann_${Date.now()}`,
        title: annTitle,
        content: annContent,
        type: annType,
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        isUrgent: annType === 'live_masterclass'
      });
    }
    setShowAnnModal(false);
  };

  // Action Card Handlers
  const handleOpenAddCard = () => {
    setEditingCardId(null);
    setCardTitle('');
    setCardDescription('');
    setCardTargetTab('study-material');
    setShowCardModal(true);
  };

  const handleOpenEditCard = (card: ActionShortcutCard) => {
    setEditingCardId(card.id);
    setCardTitle(card.title);
    setCardDescription(card.description);
    setCardTargetTab(card.targetTab);
    setShowCardModal(true);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardTitle.trim() || !cardDescription.trim()) return;

    if (editingCardId) {
      updateActionCard(editingCardId, {
        title: cardTitle,
        description: cardDescription,
        targetTab: cardTargetTab
      });
    } else {
      addActionCard({
        id: `action_${Date.now()}`,
        title: cardTitle,
        description: cardDescription,
        targetTab: cardTargetTab,
        iconName: cardTargetTab === 'tests' ? 'award' : 'file-text'
      });
    }
    setShowCardModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Welcome Header & Profile Photo Upload */}
      <div className="glass-panel p-8 rounded-3xl border border-purple-500/30 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-purple-500/10">
        
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left z-10">
          
          {/* Avatar with Camera Upload Trigger */}
          <div className="relative group cursor-pointer" onClick={() => setShowPhotoModal(true)}>
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
              alt={currentUser?.name || 'User Avatar'}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-amber-400/80 shadow-2xl group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-black p-1.5 rounded-full shadow-lg border border-black">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>AI Income Mastery Student</span>
              {isAdmin && (
                <span className="ml-2 px-2 py-0.5 rounded-md bg-amber-400 text-black font-mono text-[10px] uppercase font-black">
                  Admin Access Enabled
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black text-white flex items-center justify-center sm:justify-start gap-2">
              <span>Welcome Back, {currentUser?.name || 'Student'}!</span> 🚀
            </h1>
            <p className="text-xs text-gray-300 flex items-center justify-center sm:justify-start gap-2">
              <span>Student ID: <code className="text-amber-400 font-mono">{currentUser?.id || 'usr_active'}</code></span>
              <span>•</span>
              <button
                onClick={() => setShowPhotoModal(true)}
                className="text-amber-400 hover:underline font-bold flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5" /> Change Profile Photo
              </button>
            </p>
          </div>

        </div>

        <button
          onClick={() => {
            setSelectedCourseId(flagship.id);
            setActiveTab('course-learning');
          }}
          className="px-6 py-3.5 rounded-2xl font-black text-xs text-black bg-gradient-to-r from-amber-400 via-orange-400 to-purple-500 hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-amber-500/20 shrink-0"
        >
          <PlayCircle className="w-4 h-4 fill-black" />
          <span>Launch Video LMS Deck</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
        <button
          onClick={() => setStudentTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            studentTab === 'overview'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Dashboard Overview
        </button>
        <button
          onClick={() => setStudentTab('modules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            studentTab === 'modules'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Curriculum Modules ({flagship.chapters.length})
        </button>
        <button
          onClick={() => setStudentTab('announcements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            studentTab === 'announcements'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Announcements ({announcements.length})
        </button>
      </div>

      {/* Overview Tab */}
      {studentTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-6">
            {/* Resume Last Lesson Card */}
            <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 font-mono uppercase flex items-center gap-1.5">
                  <PlayCircle className="w-4 h-4" /> Continue Learning
                </span>
                <span className="text-[11px] text-gray-400">Last Active Video</span>
              </div>

              <div className="flex items-center gap-4">
                <img
                  src={flagship.thumbnail}
                  alt={flagship.title}
                  className="w-24 h-16 rounded-xl object-cover ring-1 ring-amber-500/40"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-white text-sm">{flagship.title}</h3>
                  <p className="text-xs text-gray-400">Module 1: Advanced ChatGPT & Prompt Architecture</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCourseId(flagship.id);
                    setActiveTab('course-learning');
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-400 text-black flex items-center gap-1 hover:bg-amber-300 transition-colors shadow-md"
                >
                  <span>Resume</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1 pt-2 border-t border-gray-800">
                <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                  <span>Overall Program Completion</span>
                  <span className="text-amber-400 font-bold">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Action Shortcuts Section (EDITABLE BY ADMIN) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Resource & Exam Shortcuts ({actionCards.length})
                </h4>
                {isAdmin && (
                  <button
                    onClick={handleOpenAddCard}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 text-black text-xs font-extrabold flex items-center gap-1 hover:bg-amber-300 shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Action Card</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {actionCards.map((card) => {
                  const isCert = card.targetTab === 'tests' || card.iconName === 'award';
                  return (
                    <div
                      key={card.id}
                      className={`glass-panel p-5 rounded-2xl border transition-all relative group flex flex-col justify-between ${
                        isCert
                          ? 'border-amber-500/20 hover:border-amber-400/50'
                          : 'border-purple-500/20 hover:border-purple-400/50'
                      }`}
                    >
                      <div
                        onClick={() => setActiveTab(card.targetTab)}
                        className="cursor-pointer space-y-2"
                      >
                        {isCert ? (
                          <Award className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                        ) : (
                          <FileText className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                        )}
                        <h4 className="font-bold text-white text-sm">{card.title}</h4>
                        <p className="text-xs text-gray-400">{card.description}</p>
                      </div>

                      {/* Admin Quick Card Controls */}
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800/80 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditCard(card);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-gray-800 text-amber-300 text-[10px] font-bold hover:bg-amber-400 hover:text-black flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" /> Edit Card
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteActionCard(card.id);
                            }}
                            className="p-1 rounded-lg bg-red-500/20 text-red-300 text-[10px] hover:bg-red-500 hover:text-white transition-colors"
                            title="Delete Action Card"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Announcements & Live Calls Panel (EDITABLE BY ADMIN) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-xs uppercase font-mono tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Bell className="w-4 h-4" /> Announcements & Live Calls
                </h3>
                {isAdmin && (
                  <button
                    onClick={handleOpenAddAnn}
                    className="p-1.5 rounded-lg bg-purple-600 text-white text-[10px] font-extrabold flex items-center gap-1 hover:bg-purple-500 shadow"
                    title="Add New Announcement"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 space-y-1.5 relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-300 font-mono uppercase">
                        {ann.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">{ann.createdAt}</span>
                    </div>

                    <h4 className="font-bold text-white text-xs">{ann.title}</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{ann.content}</p>

                    {/* Admin Announcement Controls */}
                    {isAdmin && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800/60 mt-2">
                        <button
                          onClick={() => handleOpenEditAnn(ann)}
                          className="px-2 py-0.5 rounded-md bg-gray-800 text-purple-300 text-[10px] font-bold hover:bg-purple-600 hover:text-white flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => deleteAnnouncement(ann.id)}
                          className="p-1 rounded-md bg-red-500/20 text-red-300 text-[10px] hover:bg-red-500 hover:text-white"
                          title="Delete Announcement"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Curriculum Modules Tab */}
      {studentTab === 'modules' && (
        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm">Curriculum Modules Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flagship.chapters.map((chap, idx) => (
              <div key={chap.id} className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-2">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">Module 0{idx + 1}</span>
                <h4 className="font-bold text-white text-sm">{chap.title}</h4>
                <p className="text-xs text-gray-400">{chap.description}</p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedCourseId(flagship.id);
                      setActiveTab('course-learning');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-bold hover:bg-purple-600 hover:text-white transition-colors"
                  >
                    Open Module Lessons
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Announcements Full Tab */}
      {studentTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">All Platform Announcements</h3>
            {isAdmin && (
              <button
                onClick={handleOpenAddAnn}
                className="px-4 py-2 rounded-xl bg-amber-400 text-black text-xs font-black flex items-center gap-1 hover:bg-amber-300 shadow"
              >
                <Plus className="w-4 h-4" /> Add New Announcement
              </button>
            )}
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 font-mono uppercase">{ann.type}</span>
                  <span className="text-xs text-gray-500">{ann.createdAt}</span>
                </div>
                <h4 className="font-black text-white text-base">{ann.title}</h4>
                <p className="text-xs text-gray-300 leading-relaxed">{ann.content}</p>

                {isAdmin && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                    <button
                      onClick={() => handleOpenEditAnn(ann)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-bold hover:bg-purple-600 hover:text-white flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => deleteAnnouncement(ann.id)}
                      className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold hover:bg-red-500 hover:text-white flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADMIN ANNOUNCEMENT MODAL */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-purple-500/40 bg-[#070a14] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>{editingAnnId ? 'Edit Announcement' : 'Post New Announcement'}</span>
              </h3>
              <button
                onClick={() => setShowAnnModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAnn} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-400 uppercase font-mono">Announcement Type</label>
                <select
                  value={annType}
                  onChange={(e: any) => setAnnType(e.target.value)}
                  className="w-full p-3 bg-gray-900 rounded-xl text-white border border-gray-800 focus:border-amber-400 focus:outline-none font-bold"
                >
                  <option value="live_masterclass">LIVE MASTERCLASS (Urgent Alert)</option>
                  <option value="bonus_drop">BONUS DROP (Toolkits & Downloads)</option>
                  <option value="module_update">MODULE UPDATE (Curriculum Release)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-400 uppercase font-mono">Announcement Title</label>
                <input
                  type="text"
                  required
                  placeholder="🚀 Live Q&A Masterclass with Aadarsh Rathore - Tomorrow at 8 PM IST"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full p-3 bg-gray-900 rounded-xl text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-400 uppercase font-mono">Content / Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter details of live call link, instructions, or bonus file download notes..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full p-3 bg-gray-900 rounded-xl text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAnnModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-800 text-gray-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 text-black font-black hover:bg-amber-300 shadow"
                >
                  {editingAnnId ? 'Update Announcement' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN ACTION CARD MODAL */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-amber-500/40 bg-[#070a14] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>{editingCardId ? 'Edit Action Card' : 'Add New Action Card'}</span>
              </h3>
              <button
                onClick={() => setShowCardModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-400 uppercase font-mono">Card Title</label>
                <input
                  type="text"
                  required
                  placeholder="Download AI Toolkits & Prompts"
                  value={cardTitle}
                  onChange={(e) => setCardTitle(e.target.value)}
                  className="w-full p-3 bg-gray-900 rounded-xl text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-400 uppercase font-mono">Description / Subtitle</label>
                <input
                  type="text"
                  required
                  placeholder="500+ ChatGPT prompts, WebGL templates & cold pitch scripts."
                  value={cardDescription}
                  onChange={(e) => setCardDescription(e.target.value)}
                  className="w-full p-3 bg-gray-900 rounded-xl text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-400 uppercase font-mono">Click Target Navigation Tab</label>
                <select
                  value={cardTargetTab}
                  onChange={(e) => setCardTargetTab(e.target.value)}
                  className="w-full p-3 bg-gray-900 rounded-xl text-white border border-gray-800 focus:border-amber-400 focus:outline-none font-bold"
                >
                  <option value="study-material">Study Material & Toolkit Downloads</option>
                  <option value="tests">Certification Exam & Tests</option>
                  <option value="course-learning">Video LMS Learning Deck</option>
                  <option value="courses">All Courses Page</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCardModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-800 text-gray-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-black hover:bg-purple-500 shadow"
                >
                  {editingCardId ? 'Update Action Card' : 'Create Action Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        title="Upload Student Profile Photo"
        currentPhotoUrl={currentUser?.avatar}
        uploadToSupabaseStorage={uploadToSupabaseStorage}
        onSavePhoto={(photoUrl) => {
          updateUserProfile({ avatar: photoUrl });
          showToast('Profile photo updated successfully! 📸');
        }}
      />

    </div>
  );
};

export default StudentDashboard;

