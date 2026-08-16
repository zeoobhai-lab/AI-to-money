import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Course,
  StudyMaterial,
  TestQuiz,
  Order,
  Announcement,
  SEOSettings,
  SiteSettings,
  Coupon,
  Lesson,
  Chapter,
  User,
  ActionShortcutCard
} from '../../types';
import { PhotoUploadModal } from '../../components/ui/PhotoUploadModal';
import { supabase } from '../../lib/supabase';
import {
  ShieldCheck,
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Tag,
  FileText,
  CreditCard,
  Globe,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Bell,
  Sparkles,
  Phone,
  UserCheck,
  Video,
  PlayCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Flame,
  Award,
  Link as LinkIcon,
  Film,
  Camera,
  X,
  RefreshCw,
  Zap,
  Check,
  MessageSquare,
  Lock,
  Unlock,
  Download
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminControlPanel: React.FC = () => {
  const {
    currentUser,
    courses,
    flagship,
    updateCourse,
    students,
    toggleBlockStudent,
    sendStudentReminder,
    orders,
    coupons,
    addCoupon,
    deleteCoupon,
    toggleCouponActive,
    materials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    announcements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    actionCards,
    addActionCard,
    updateActionCard,
    deleteActionCard,
    seoSettings,
    updateSEOSettings,
    siteSettings,
    updateSiteSettings,
    showToast,
    getCourseProgressPercentage,
    setActiveTab: setGlobalActiveTab,
    uploadToSupabaseStorage
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'new-users' | 'purchases' | 'modules-cms' | 'announcements-cms' | 'coupons' | 'course-settings' | 'resources' | 'seo' | 'settings'
  >('overview');

  // Supabase Remote Sync State
  const [supabasePurchases, setSupabasePurchases] = useState<any[]>([]);
  const [syncingSupabase, setSyncingSupabase] = useState(false);

  const fetchLatestSupabaseData = React.useCallback(async () => {
    setSyncingSupabase(true);
    const records = await supabase.getAllSupabasePurchases();
    setSupabasePurchases(records || []);
    setSyncingSupabase(false);
  }, []);

  React.useEffect(() => {
    fetchLatestSupabaseData();
  }, [fetchLatestSupabaseData]);

  // Unified Registered Students List (Combines Local AppContext + Orders + Supabase DB)
  const allStudentsCombined = useMemo(() => {
    const combinedMap = new Map<string, User>();

    // 1. Add students from local context
    students.forEach((s) => {
      if (s.email) {
        combinedMap.set(s.email.toLowerCase(), { ...s });
      }
    });

    // 2. Add buyers from Orders
    orders.forEach((o) => {
      if (o.userEmail) {
        const cleanEmail = o.userEmail.toLowerCase();
        const existing = combinedMap.get(cleanEmail);
        if (!existing) {
          combinedMap.set(cleanEmail, {
            id: o.userId || `usr_${Date.now()}`,
            name: o.userName || cleanEmail.split('@')[0],
            email: cleanEmail,
            phone: o.userPhone || '',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
            role: 'student',
            enrolledCourseIds: [o.courseId || flagship.id],
            completedLessonIds: [],
            createdAt: o.createdAt || new Date().toLocaleDateString(),
            lastActive: 'Just now',
            watchHours: 12.0,
            activeStreakDays: 5,
            consistencyScore: 'High',
            isBlocked: false
          });
        } else {
          if (!existing.phone && o.userPhone) existing.phone = o.userPhone;
          if (o.courseId && !existing.enrolledCourseIds.includes(o.courseId)) {
            existing.enrolledCourseIds.push(o.courseId);
          }
        }
      }
    });

    // 3. Add buyers from Supabase REST DB
    supabasePurchases.forEach((sp) => {
      if (sp && sp.user_email) {
        const cleanEmail = sp.user_email.toLowerCase();
        const existing = combinedMap.get(cleanEmail);
        const name = sp.user_name || sp.username || cleanEmail.split('@')[0];
        const phone = sp.phone || sp.mobile_no || '';
        if (!existing) {
          combinedMap.set(cleanEmail, {
            id: sp.id || `usr_sp_${Date.now()}`,
            name: name,
            email: cleanEmail,
            phone: phone,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
            role: 'student',
            enrolledCourseIds: [sp.course_id || flagship.id],
            completedLessonIds: [],
            createdAt: sp.created_at || new Date().toLocaleDateString(),
            lastActive: 'Just now',
            watchHours: 16.0,
            activeStreakDays: 6,
            consistencyScore: 'High',
            isBlocked: false
          });
        } else {
          if (!existing.phone && phone) existing.phone = phone;
          if (sp.course_id && !existing.enrolledCourseIds.includes(sp.course_id)) {
            existing.enrolledCourseIds.push(sp.course_id);
          }
        }
      }
    });

    return Array.from(combinedMap.values());
  }, [students, orders, supabasePurchases, flagship.id]);

  // Verified Course Purchasers (Users with Email & Active Purchase/Mobile)
  const verifiedPurchasers = useMemo(() => {
    return allStudentsCombined.filter((s) => {
      const hasEmail = Boolean(s.email && s.email.trim());
      const hasPurchased =
        (s.enrolledCourseIds && s.enrolledCourseIds.length > 0) ||
        orders.some((o) => o.userEmail.toLowerCase() === s.email.toLowerCase()) ||
        supabasePurchases.some((sp) => sp.user_email && sp.user_email.toLowerCase() === s.email.toLowerCase());
      return hasEmail && hasPurchased;
    });
  }, [allStudentsCombined, orders, supabasePurchases]);

  // Search & Filter States
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilterStatus, setUserFilterStatus] = useState<'all' | 'high' | 'reminder' | 'blocked'>('all');
  const [purchasesSearchQuery, setPurchasesSearchQuery] = useState('');
  const [selectedStudentReport, setSelectedStudentReport] = useState<User | null>(null);

  // Admin Photo Upload Modal State
  const [adminPhotoModalOpen, setAdminPhotoModalOpen] = useState(false);
  const [adminPhotoTargetStudent, setAdminPhotoTargetStudent] = useState<User | null>(null);

  // Filtered lists
  const filteredUsers = useMemo(() => {
    return allStudentsCombined.filter((s) => {
      const query = userSearchQuery.toLowerCase().trim();
      const matches =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        (s.phone && s.phone.includes(query));
      if (!matches) return false;

      if (userFilterStatus === 'high') return s.consistencyScore === 'High' || (!s.consistencyScore && (s.watchHours || 0) > 20);
      if (userFilterStatus === 'reminder') return s.consistencyScore === 'Needs Reminder';
      if (userFilterStatus === 'blocked') return s.isBlocked;
      return true;
    });
  }, [allStudentsCombined, userSearchQuery, userFilterStatus]);

  const filteredPurchases = useMemo(() => {
    return verifiedPurchasers.filter((s) => {
      const query = purchasesSearchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        (s.phone && s.phone.includes(query))
      );
    });
  }, [verifiedPurchasers, purchasesSearchQuery]);

  // Module & Video CMS State
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(flagship.chapters[0]?.id || null);

  // Create/Edit Module Modal
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');

  // Create/Edit Video Lecture Modal
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [targetChapterId, setTargetChapterId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonDuration, setLessonDuration] = useState<number>(15);
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonImageUrl, setLessonImageUrl] = useState('');
  const [lessonPdfUrl, setLessonPdfUrl] = useState('');
  const [lessonCodeUrl, setLessonCodeUrl] = useState('');
  const [lessonNotes, setLessonNotes] = useState('');
  const [lessonIsFree, setLessonIsFree] = useState(false);

  // Announcement CMS State
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState<'live_masterclass' | 'module_update' | 'bonus_drop'>('live_masterclass');

  // Coupon Modal State
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState(30);
  const [newCouponMinOrder, setNewCouponMinOrder] = useState(0);
  const [newCouponValidUntil, setNewCouponValidUntil] = useState('2028-12-31');

  // Resource Material Modal State
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [newMatTitle, setNewMatTitle] = useState('');
  const [newMatCategory, setNewMatCategory] = useState<StudyMaterial['category']>('AI Prompts');
  const [newMatUrl, setNewMatUrl] = useState('');
  const [newMatSize, setNewMatSize] = useState(15.0);

  // Course Settings State
  const [courseTitle, setCourseTitle] = useState(flagship.title);
  const [courseSubtitle, setCourseSubtitle] = useState(flagship.subtitle);
  const [currentPrice, setCurrentPrice] = useState(flagship.currentPrice);
  const [originalPrice, setOriginalPrice] = useState(flagship.originalPrice);
  const [discountPercent, setDiscountPercent] = useState(flagship.discountPercentage);
  const [promoVideoUrl, setPromoVideoUrl] = useState(flagship.promoVideoUrl || '');
  const [courseThumbnail, setCourseThumbnail] = useState(flagship.thumbnail || '/hero-poster.jpg');
  const [courseDescription, setCourseDescription] = useState(flagship.description || '');

  // Revenue & Statistics
  const totalRevenue = orders.reduce((acc, o) => acc + (o.amountPaid || 0), 0);
  const totalStudentsCount = allStudentsCombined.length;

  const chartData = orders.length > 0
    ? [
        { month: 'Jan', revenue: 0, students: 0 },
        { month: 'Feb', revenue: 0, students: 0 },
        { month: 'Mar', revenue: 0, students: 0 },
        { month: 'Apr', revenue: 0, students: 0 },
        { month: 'May', revenue: Math.round(totalRevenue * 0.2), students: Math.round(totalStudentsCount * 0.2) },
        { month: 'Jun', revenue: Math.round(totalRevenue * 0.5), students: Math.round(totalStudentsCount * 0.5) },
        { month: 'Jul', revenue: totalRevenue, students: totalStudentsCount }
      ]
    : [
        { month: 'Jan', revenue: 0 },
        { month: 'Feb', revenue: 0 },
        { month: 'Mar', revenue: 0 },
        { month: 'Apr', revenue: 0 },
        { month: 'May', revenue: 0 },
        { month: 'Jun', revenue: 0 },
        { month: 'Jul', revenue: 0 }
      ];

  // Module Submit Handler
  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;

    if (editingModuleId) {
      const updatedChapters = flagship.chapters.map((chap) =>
        chap.id === editingModuleId
          ? { ...chap, title: moduleTitle.trim(), description: moduleDesc.trim() }
          : chap
      );
      updateCourse(flagship.id, { chapters: updatedChapters });
      showToast(`Module "${moduleTitle}" updated!`);
    } else {
      const newChapter: Chapter = {
        id: `mod_${Date.now()}`,
        courseId: flagship.id,
        title: moduleTitle.trim(),
        description: moduleDesc.trim(),
        order: flagship.chapters.length + 1,
        lessons: []
      };
      updateCourse(flagship.id, { chapters: [...flagship.chapters, newChapter] });
      setExpandedChapterId(newChapter.id);
      showToast(`New Module "${moduleTitle}" uploaded & published!`);
    }
    setShowModuleModal(false);
    setModuleTitle('');
    setModuleDesc('');
    setEditingModuleId(null);
  };

  const handleOpenAddModule = () => {
    setEditingModuleId(null);
    setModuleTitle('');
    setModuleDesc('');
    setShowModuleModal(true);
  };

  const handleOpenEditModule = (chap: Chapter) => {
    setEditingModuleId(chap.id);
    setModuleTitle(chap.title);
    setModuleDesc(chap.description);
    setShowModuleModal(true);
  };

  const handleDeleteModule = (chapId: string) => {
    const updated = flagship.chapters.filter((c) => c.id !== chapId);
    updateCourse(flagship.id, { chapters: updated });
    showToast('Module deleted');
  };

  // Video Lecture Submit Handler
  const handleOpenAddLesson = (chapId: string) => {
    setTargetChapterId(chapId);
    setEditingLessonId(null);
    setLessonTitle('');
    setLessonDescription('');
    setLessonDuration(15);
    setLessonVideoUrl('');
    setLessonImageUrl('');
    setLessonPdfUrl('');
    setLessonCodeUrl('');
    setLessonNotes('');
    setLessonIsFree(false);
    setShowLessonModal(true);
  };

  const handleOpenEditLesson = (chapId: string, les: Lesson) => {
    setTargetChapterId(chapId);
    setEditingLessonId(les.id);
    setLessonTitle(les.title);
    setLessonDescription(les.description || '');
    setLessonDuration(les.durationMinutes || 15);
    setLessonVideoUrl(les.videoUrl || '');
    setLessonImageUrl(les.imageUrl || '');
    setLessonPdfUrl(les.resourcePdfUrl || '');
    setLessonCodeUrl(les.resourceCodeUrl || '');
    setLessonNotes(les.notesMarkdown || '');
    setLessonIsFree(les.isFreePreview || false);
    setShowLessonModal(true);
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim() || !targetChapterId) return;

    const updatedChapters = flagship.chapters.map((chap) => {
      if (chap.id !== targetChapterId) return chap;

      if (editingLessonId) {
        const updatedLessons = chap.lessons.map((l) =>
          l.id === editingLessonId
            ? {
                ...l,
                title: lessonTitle.trim(),
                description: lessonDescription.trim(),
                durationMinutes: Number(lessonDuration),
                videoUrl: lessonVideoUrl.trim(),
                imageUrl: lessonImageUrl.trim(),
                resourcePdfUrl: lessonPdfUrl.trim(),
                resourceCodeUrl: lessonCodeUrl.trim(),
                notesMarkdown: lessonNotes.trim(),
                isFreePreview: lessonIsFree
              }
            : l
        );
        return { ...chap, lessons: updatedLessons };
      } else {
        const newLesson: Lesson = {
          id: `les_${Date.now()}`,
          chapterId: chap.id,
          courseId: flagship.id,
          title: lessonTitle.trim(),
          description: lessonDescription.trim(),
          durationMinutes: Number(lessonDuration),
          videoUrl: lessonVideoUrl.trim(),
          imageUrl: lessonImageUrl.trim(),
          resourcePdfUrl: lessonPdfUrl.trim(),
          resourceCodeUrl: lessonCodeUrl.trim(),
          notesMarkdown: lessonNotes.trim(),
          isFreePreview: lessonIsFree,
          order: chap.lessons.length + 1
        };
        return { ...chap, lessons: [...chap.lessons, newLesson] };
      }
    });

    updateCourse(flagship.id, { chapters: updatedChapters });
    showToast(editingLessonId ? 'Video lecture updated!' : 'New video lecture uploaded & published!');
    setShowLessonModal(false);
  };

  const handleDeleteLesson = (chapId: string, lesId: string) => {
    const updated = flagship.chapters.map((chap) => {
      if (chap.id !== chapId) return chap;
      return { ...chap, lessons: chap.lessons.filter((l) => l.id !== lesId) };
    });
    updateCourse(flagship.id, { chapters: updated });
    showToast('Lecture deleted');
  };

  // Video File Upload Handler
  const handleLessonVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast('Uploading video to Supabase Cloud Storage...', 'info');
    const res = await uploadToSupabaseStorage(file, 'course-videos');
    if (res.success && res.publicUrl) {
      setLessonVideoUrl(res.publicUrl);
      showToast('🎉 Video uploaded & URL attached successfully!');
    } else {
      const localUrl = URL.createObjectURL(file);
      setLessonVideoUrl(localUrl);
      showToast('Video attached locally!', 'success');
    }
  };

  // Promo Video Upload Handler
  const handlePromoVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast('Uploading promo video...', 'info');
    const res = await uploadToSupabaseStorage(file, 'course-promos');
    if (res.success && res.publicUrl) {
      setPromoVideoUrl(res.publicUrl);
      showToast('Promo video uploaded!');
    } else {
      const localUrl = URL.createObjectURL(file);
      setPromoVideoUrl(localUrl);
      showToast('Promo video attached!');
    }
  };

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
        title: annTitle.trim(),
        content: annContent.trim(),
        type: annType
      });
    } else {
      addAnnouncement({
        id: `ann_${Date.now()}`,
        title: annTitle.trim(),
        content: annContent.trim(),
        type: annType,
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        isUrgent: annType === 'live_masterclass'
      });
    }
    setShowAnnModal(false);
  };

  // Coupon Submit Handler
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;

    await addCoupon({
      code: newCouponCode.trim().toUpperCase(),
      discountPercent: newCouponDiscount,
      discountType: 'percentage',
      discountValue: newCouponDiscount,
      minOrderAmount: newCouponMinOrder,
      validUntil: newCouponValidUntil,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0]
    });

    setShowCouponModal(false);
    setNewCouponCode('');
  };

  // Material Submit Handler
  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatTitle.trim()) return;

    addMaterial({
      id: `mat_${Date.now()}`,
      title: newMatTitle.trim(),
      category: newMatCategory,
      fileUrl: newMatUrl.trim() || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileSizeMB: Number(newMatSize),
      downloadsCount: 0,
      uploadedAt: new Date().toISOString().split('T')[0],
      isFree: true
    });

    setShowMaterialModal(false);
    setNewMatTitle('');
    setNewMatUrl('');
  };

  // Course Settings Save Handler
  const handleSaveCourseSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateCourse(flagship.id, {
      title: courseTitle.trim(),
      subtitle: courseSubtitle.trim(),
      currentPrice: Number(currentPrice),
      originalPrice: Number(originalPrice),
      discountPercentage: Number(discountPercent),
      promoVideoUrl: promoVideoUrl.trim(),
      thumbnail: courseThumbnail.trim(),
      description: courseDescription.trim()
    });
    showToast('Course settings, price & video updated across platform!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Admin Control Panel Banner Header */}
      <div className="glass-panel p-8 rounded-3xl border border-amber-500/40 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-amber-500/10 bg-gradient-to-r from-[#0d0a1a] via-[#080711] to-[#04040a]">
        <div className="space-y-2 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 text-xs font-mono font-bold border border-amber-400/30">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>SAWADH SERA • Admin Control Panel</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Live Platform Command Center ⚡
          </h1>
          <p className="text-xs text-gray-300 max-w-xl leading-relaxed">
            Real-time analytics, user account manager, video LMS CMS, push announcement notifications, and discount coupons engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 z-10">
          <button
            onClick={fetchLatestSupabaseData}
            disabled={syncingSupabase}
            className="px-4 py-2.5 rounded-2xl bg-gray-900 border border-gray-800 text-gray-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${syncingSupabase ? 'animate-spin' : ''}`} />
            <span>{syncingSupabase ? 'Syncing DB...' : 'Sync Supabase DB'}</span>
          </button>

          <button
            onClick={handleOpenAddModule}
            className="px-5 py-2.5 rounded-2xl font-black text-xs text-black bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:scale-105 transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4 fill-black" />
            <span>+ Add Module</span>
          </button>
        </div>
      </div>

      {/* Control Panel Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar border-b border-gray-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-amber-400 text-black font-black shadow-lg shadow-amber-400/20'
              : 'text-gray-400 hover:text-white hover:bg-gray-900/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Overview
        </button>

        <button
          onClick={() => setActiveTab('new-users')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'new-users'
              ? 'bg-amber-400 text-black font-black shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-900/60'
          }`}
        >
          <Users className="w-4 h-4" /> Registered Users ({allStudentsCombined.length})
        </button>

        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'purchases'
              ? 'bg-emerald-400 text-black font-black shadow-lg'
              : 'text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10'
          }`}
        >
          <UserCheck className="w-4 h-4" /> Verified Buyers ({verifiedPurchasers.length})
        </button>

        <button
          onClick={() => setActiveTab('modules-cms')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'modules-cms'
              ? 'bg-purple-600 text-white font-black shadow-lg shadow-purple-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-900/60'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Modules & Video CMS ({flagship.chapters.length})
        </button>

        <button
          onClick={() => setActiveTab('announcements-cms')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'announcements-cms'
              ? 'bg-purple-600 text-white font-black shadow-lg shadow-purple-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-900/60'
          }`}
        >
          <Bell className="w-4 h-4" /> Announcements CMS ({announcements.length})
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'coupons'
              ? 'bg-purple-600 text-white font-black shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-900/60'
          }`}
        >
          <Tag className="w-4 h-4" /> Coupons & Discounts ({coupons.length})
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'resources'
              ? 'bg-purple-600 text-white font-black shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-900/60'
          }`}
        >
          <FileText className="w-4 h-4" /> Study Toolkits ({materials.length})
        </button>

        <button
          onClick={() => setActiveTab('course-settings')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'course-settings'
              ? 'bg-purple-600 text-white font-black shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-900/60'
          }`}
        >
          <Edit3 className="w-4 h-4" /> Price & Course Settings
        </button>

        <button
          onClick={() => setActiveTab('seo')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'seo'
              ? 'bg-purple-600 text-white font-black shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-900/60'
          }`}
        >
          <Globe className="w-4 h-4" /> SEO Panel
        </button>
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 space-y-2 bg-gradient-to-b from-amber-950/20 to-black">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Gross Platform Revenue</span>
              <p className="text-3xl font-black text-amber-400 font-mono">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-amber-300 font-bold">Total sales recorded</p>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-purple-500/30 space-y-2 bg-gradient-to-b from-purple-950/20 to-black">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Registered Accounts</span>
              <p className="text-3xl font-black text-purple-400 font-mono">{totalStudentsCount}</p>
              <p className="text-[10px] text-purple-300 font-bold">Total students in database</p>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 space-y-2 bg-gradient-to-b from-emerald-950/20 to-black">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Verified Buyers</span>
              <p className="text-3xl font-black text-emerald-400 font-mono">{verifiedPurchasers.length}</p>
              <p className="text-[10px] text-emerald-300 font-bold">Paid enrolled learners</p>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 space-y-2 bg-gradient-to-b from-cyan-950/20 to-black">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Curriculum Modules</span>
              <p className="text-3xl font-black text-cyan-400 font-mono">{flagship.chapters.length}</p>
              <p className="text-[10px] text-cyan-300 font-bold">{flagship.chapters.flatMap(c => c.lessons || []).length} Video Lectures</p>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-gray-800 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" /> Platform Revenue & Student Enrolment Curve
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} domain={[0, Math.max(10000, totalRevenue)]} />
                  <Tooltip contentStyle={{ background: '#0b0f19', border: '1px solid #374151', borderRadius: '16px', color: '#fff' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 2. NEW USERS & REGISTERED ACCOUNTS TAB */}
      {activeTab === 'new-users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-white text-xl flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" /> All Registered Student Accounts ({allStudentsCombined.length})
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                View, monitor, filter, and manage all student profiles registered on the Sawadh Sera platform.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={userFilterStatus}
                onChange={(e: any) => setUserFilterStatus(e.target.value)}
                className="px-3.5 py-2 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none font-bold"
              >
                <option value="all">All Registered Students</option>
                <option value="high">High Consistency 🔥</option>
                <option value="reminder">Needs Engagement Alert 🔔</option>
                <option value="blocked">Blocked Accounts 🚫</option>
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="glass-panel p-4 rounded-2xl border border-gray-800 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search user by name, email, or phone..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            {filteredUsers.map((st) => {
              const isBlocked = st.isBlocked || false;
              return (
                <div
                  key={st.id}
                  className={`glass-panel p-5 rounded-3xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
                    isBlocked ? 'border-red-500/40 bg-red-950/10' : 'border-gray-800 hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={st.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                      alt={st.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-purple-500/40 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-white text-sm">{st.name}</h4>
                        {isBlocked && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">
                            BLOCKED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{st.email}</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                        Joined: {st.createdAt} • Phone: {st.phone || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedStudentReport(st)}
                      className="px-3.5 py-2 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/40 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Full Profile
                    </button>

                    <button
                      onClick={() => sendStudentReminder(st.id)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Bell className="w-3.5 h-3.5 text-amber-400" /> Remind
                    </button>

                    <button
                      onClick={() => toggleBlockStudent(st.id)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                        isBlocked
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {isBlocked ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. VERIFIED PURCHASES & ORDERS TAB */}
      {activeTab === 'purchases' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-white text-xl flex items-center gap-2 text-emerald-400">
                <UserCheck className="w-5 h-5 text-emerald-400" /> Verified Course Purchasers & Orders
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Showing all students who have completed course enrolment and paid via Razorpay.
              </p>
            </div>
            <span className="px-4 py-2 rounded-2xl bg-emerald-500/20 text-emerald-300 text-xs font-black font-mono border border-emerald-500/40">
              ⚡ {verifiedPurchasers.length} Verified Buyers
            </span>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-gray-800 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search purchaser by Name, Email, or Phone..."
                value={purchasesSearchQuery}
                onChange={(e) => setPurchasesSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="glass-panel rounded-3xl border border-emerald-500/30 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-800 bg-black/60 text-gray-400 font-mono">
                    <th className="p-4">Student</th>
                    <th className="p-4">Email ID</th>
                    <th className="p-4">Mobile Phone</th>
                    <th className="p-4">Course</th>
                    <th className="p-4">Amount Paid</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-medium">
                  {filteredPurchases.map((account) => {
                    const orderRecord = orders.find((o) => o.userEmail.toLowerCase() === account.email.toLowerCase());
                    const phoneDisplay = account.phone || orderRecord?.userPhone || 'N/A';
                    const amountPaid = orderRecord?.amountPaid || flagship.currentPrice;

                    return (
                      <tr key={account.id} className="hover:bg-emerald-950/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={account.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                              alt={account.name}
                              className="w-9 h-9 rounded-xl object-cover ring-2 ring-emerald-500/40 shrink-0"
                            />
                            <div>
                              <p className="font-extrabold text-white text-xs">{account.name}</p>
                              <span className="text-[10px] text-emerald-400 font-mono font-bold">● Active Enrolled Buyer</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-purple-300">{account.email}</td>
                        <td className="p-4 font-mono font-black text-amber-300">{phoneDisplay}</td>
                        <td className="p-4 text-gray-300 font-bold">{flagship.title}</td>
                        <td className="p-4 font-mono font-black text-emerald-400 text-sm">₹{amountPaid.toLocaleString()}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                            ✓ Verified & Synced
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedStudentReport(account)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/40 text-xs font-bold ml-auto"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODULES & VIDEO CMS TAB */}
      {activeTab === 'modules-cms' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-white text-xl flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" /> Curriculum Modules & Video Lectures CMS
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Upload videos, attach study guides, add descriptions, and publish modules instantly to students.
              </p>
            </div>

            <button
              onClick={handleOpenAddModule}
              className="px-5 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-400 to-orange-400 text-black hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4 fill-black" /> Add New Module
            </button>
          </div>

          <div className="space-y-6">
            {flagship.chapters.map((chap, idx) => {
              const isExpanded = expandedChapterId === chap.id;

              return (
                <div
                  key={chap.id}
                  className={`glass-panel rounded-3xl border transition-all overflow-hidden ${
                    isExpanded ? 'border-amber-500/50 bg-gradient-to-b from-purple-950/20 to-black' : 'border-gray-800'
                  }`}
                >
                  <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-800/80">
                    <div className="flex items-start gap-4">
                      <span className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 font-black text-sm flex items-center justify-center shrink-0 border border-amber-500/40">
                        0{idx + 1}
                      </span>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-white text-base leading-tight">{chap.title}</h4>
                        <p className="text-xs text-gray-400">{chap.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                      <span className="px-3 py-1 rounded-full bg-purple-900/40 text-purple-300 text-xs font-bold border border-purple-500/30">
                        {chap.lessons.length} Video Lectures
                      </span>

                      <button
                        onClick={() => handleOpenAddLesson(chap.id)}
                        className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-black flex items-center gap-1.5 shadow"
                      >
                        <Plus className="w-4 h-4 fill-black" /> Upload Video
                      </button>

                      <button
                        onClick={() => handleOpenEditModule(chap)}
                        className="p-2 rounded-xl bg-gray-800 text-purple-300 hover:bg-purple-600 hover:text-white"
                        title="Edit Module"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteModule(chap.id)}
                        className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                        title="Delete Module"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setExpandedChapterId(isExpanded ? null : chap.id)}
                        className="p-2 rounded-xl glass-panel text-gray-300 hover:text-white border border-gray-800"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-6 space-y-4 bg-black/40">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold uppercase font-mono tracking-wider text-amber-400">
                          Video Lectures in {chap.title}
                        </h5>
                        <button
                          onClick={() => handleOpenAddLesson(chap.id)}
                          className="text-xs text-amber-300 hover:underline font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Upload Video / Attach Guide
                        </button>
                      </div>

                      {chap.lessons.length > 0 ? (
                        <div className="space-y-3">
                          {chap.lessons.map((les, lIdx) => (
                            <div
                              key={les.id}
                              className="p-4 rounded-2xl glass-panel border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-purple-500/30 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-xl bg-purple-950 text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">
                                  {lIdx + 1}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h6 className="font-extrabold text-white text-sm">{les.title}</h6>
                                    {les.isFreePreview && (
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                                        FREE PREVIEW
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-400 line-clamp-1">{les.description}</p>
                                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] font-mono text-gray-400">
                                    <span className="flex items-center gap-1 text-gray-300">
                                      <Clock className="w-3 h-3 text-amber-400" /> {les.durationMinutes || 15} mins
                                    </span>
                                    {les.videoUrl && (
                                      <span className="flex items-center gap-1 text-purple-300 bg-purple-900/30 px-2 py-0.5 rounded-md border border-purple-500/30">
                                        <Film className="w-3 h-3 text-purple-400" /> Video Attached
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleOpenEditLesson(chap.id, les)}
                                  className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/40 text-xs font-bold flex items-center gap-1 transition-all"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> Edit Video & Details
                                </button>
                                <button
                                  onClick={() => handleDeleteLesson(chap.id, les.id)}
                                  className="p-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                                  title="Delete Lecture"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl border border-dashed border-gray-800 text-center space-y-3 bg-black/30">
                          <p className="text-xs text-gray-400">No video lectures added to this module yet.</p>
                          <button
                            onClick={() => handleOpenAddLesson(chap.id)}
                            className="px-4 py-2 rounded-xl bg-amber-400 text-black text-xs font-black hover:bg-amber-300"
                          >
                            + Upload First Video Lecture
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. ANNOUNCEMENTS CMS TAB */}
      {activeTab === 'announcements-cms' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-white text-xl flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" /> Platform Announcements CMS
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Post new announcements that push notifications and alert pop-ups to the student dashboard.
              </p>
            </div>

            <button
              onClick={handleOpenAddAnn}
              className="px-5 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-400 to-orange-400 text-black hover:scale-105 transition-all flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4 fill-black" /> Post New Announcement
            </button>
          </div>

          <div className="space-y-4">
            {announcements.map((ann) => (
              <div key={ann.id} className="glass-panel p-6 rounded-3xl border border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 text-xs font-bold font-mono uppercase border border-amber-400/30">
                    {ann.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">{ann.createdAt}</span>
                </div>
                <h4 className="font-black text-white text-lg">{ann.title}</h4>
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">{ann.content}</p>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
                  <button
                    onClick={() => handleOpenEditAnn(ann)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1 hover:bg-purple-600 hover:text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => deleteAnnouncement(ann.id)}
                    className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold flex items-center gap-1 hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. COUPONS & DISCOUNTS TAB */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-white text-xl flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-400" /> Coupons & Discount Codes Engine
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Manage promotional discount codes (including sawadsera3020091 for ₹1 final price).
              </p>
            </div>

            <button
              onClick={() => setShowCouponModal(true)}
              className="px-5 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-400 to-orange-400 text-black hover:scale-105 transition-all flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4 fill-black" /> Create New Coupon
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coupons.map((c) => (
              <div key={c.code} className="glass-panel p-6 rounded-3xl border border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-amber-400 text-lg">{c.code}</span>
                  <button
                    onClick={() => toggleCouponActive(c.code)}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      c.isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {c.isActive ? '● Active' : '○ Disabled'}
                  </button>
                </div>
                <p className="text-xs text-white font-bold">
                  {c.discountType === 'fixed' || c.discountValue ? `₹${c.discountValue || 1298} OFF` : `${c.discountPercent}% OFF`}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-gray-800 text-xs text-gray-400 font-mono">
                  <span>Valid until: {c.validUntil}</span>
                  <button
                    onClick={() => deleteCoupon(c.code)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. COURSE SETTINGS & PRICING TAB */}
      {activeTab === 'course-settings' && (
        <div className="space-y-6 max-w-4xl">
          <div>
            <h3 className="font-black text-white text-xl flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-400" /> Course Details & Pricing Settings
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Update course title, price (₹1,299), discount percentage, thumbnail image, and promo video URL.
            </p>
          </div>

          <form onSubmit={handleSaveCourseSettings} className="glass-panel p-8 rounded-3xl border border-purple-500/30 space-y-6 bg-gradient-to-b from-[#0f0a20] to-black shadow-2xl">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300">Course Title</label>
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                className="w-full p-3.5 bg-gray-900 rounded-2xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300">Subtitle / Headline</label>
              <textarea
                rows={2}
                value={courseSubtitle}
                onChange={(e) => setCourseSubtitle(e.target.value)}
                className="w-full p-3.5 bg-gray-900 rounded-2xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">Current Price (INR ₹)</label>
                <input
                  type="number"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(Number(e.target.value))}
                  className="w-full p-3.5 bg-gray-900 rounded-2xl text-xs text-amber-400 font-mono font-bold border border-gray-800 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">Original Price (INR ₹)</label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  className="w-full p-3.5 bg-gray-900 rounded-2xl text-xs text-gray-400 font-mono border border-gray-800 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">Discount Badge (% OFF)</label>
                <input
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full p-3.5 bg-gray-900 rounded-2xl text-xs text-emerald-400 font-mono border border-gray-800 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300">Promo Video URL or Upload File</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={promoVideoUrl}
                  onChange={(e) => setPromoVideoUrl(e.target.value)}
                  placeholder="https://commondatastorage.googleapis.com/... or uploaded video URL"
                  className="w-full p-3.5 bg-gray-900 rounded-2xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                />
                <label className="px-4 py-3.5 rounded-2xl bg-purple-600 text-white text-xs font-bold cursor-pointer hover:bg-purple-500 shrink-0">
                  <span>Upload MP4</span>
                  <input type="file" accept="video/*" onChange={handlePromoVideoUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300">Course Description</label>
              <textarea
                rows={4}
                value={courseDescription}
                onChange={(e) => setCourseDescription(e.target.value)}
                className="w-full p-3.5 bg-gray-900 rounded-2xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-black font-black text-sm hover:scale-[1.02] transition-all shadow-xl shadow-amber-500/20"
            >
              Save Course Price & Details Platform-Wide
            </button>
          </form>
        </div>
      )}

      {/* 8. STUDY TOOLKITS TAB */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-white text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" /> Study Resources & Toolkits
            </h3>
            <button
              onClick={() => setShowMaterialModal(true)}
              className="px-5 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-400 to-orange-400 text-black shadow-lg"
            >
              + Add Resource PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materials.map((m) => (
              <div key={m.id} className="glass-panel p-6 rounded-3xl border border-gray-800 space-y-2">
                <span className="text-[10px] font-mono text-amber-400 font-bold">{m.category}</span>
                <h4 className="font-bold text-white text-base">{m.title}</h4>
                <p className="text-xs text-gray-400 font-mono">{m.fileSizeMB} MB • {m.downloadsCount} Downloads</p>
                <button
                  onClick={() => deleteMaterial(m.id)}
                  className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 text-xs font-bold hover:bg-red-500 hover:text-white mt-2"
                >
                  Delete Resource
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. SEO PANEL TAB */}
      {activeTab === 'seo' && (
        <div className="space-y-6 max-w-3xl">
          <h3 className="font-black text-white text-xl flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-400" /> SEO & Meta Tag Management
          </h3>

          <div className="glass-panel p-8 rounded-3xl border border-gray-800 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300">Site Title</label>
              <input
                type="text"
                value={seoSettings.siteTitle}
                onChange={(e) => updateSEOSettings({ siteTitle: e.target.value })}
                className="w-full p-3.5 bg-gray-900 rounded-2xl text-xs text-white border border-gray-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300">Meta Description</label>
              <textarea
                rows={3}
                value={seoSettings.metaDescription}
                onChange={(e) => updateSEOSettings({ metaDescription: e.target.value })}
                className="w-full p-3.5 bg-gray-900 rounded-2xl text-xs text-white border border-gray-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT MODULE */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleSaveModule} className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl border border-amber-400/50 bg-[#070a14] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>{editingModuleId ? 'Edit Module' : 'Add New Curriculum Module'}</span>
              </h3>
              <button onClick={() => setShowModuleModal(false)} className="p-1 rounded-xl text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300">Module Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Module 8: Advanced AI SaaS Architecture"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                className="w-full p-3 bg-gray-900 rounded-2xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300">Module Description</label>
              <textarea
                rows={3}
                placeholder="Brief summary of what students will learn in this module..."
                value={moduleDesc}
                onChange={(e) => setModuleDesc(e.target.value)}
                className="w-full p-3 bg-gray-900 rounded-2xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-amber-400 text-black font-black text-xs hover:bg-amber-300 shadow-lg"
            >
              {editingModuleId ? 'Save Module Changes' : 'Publish New Module'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL: UPLOAD / EDIT VIDEO LECTURE */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleSaveLesson} className="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-purple-500/50 bg-[#070a14] space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-400" />
                <span>{editingLessonId ? 'Edit Video Lecture' : 'Upload New Video Lecture'}</span>
              </h3>
              <button onClick={() => setShowLessonModal(false)} className="p-1 rounded-xl text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300">Lecture Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Building 3D Canvas with Three.js & WebGL"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                className="w-full p-3 bg-gray-900 rounded-2xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300">Lecture Description</label>
              <textarea
                rows={2}
                placeholder="Overview of topic covered in this video..."
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                className="w-full p-3 bg-gray-900 rounded-2xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">Duration (Minutes)</label>
                <input
                  type="number"
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(Number(e.target.value))}
                  className="w-full p-3 bg-gray-900 rounded-2xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">Free Preview Access</label>
                <button
                  type="button"
                  onClick={() => setLessonIsFree(!lessonIsFree)}
                  className={`w-full p-3 rounded-2xl text-xs font-bold border transition-all ${
                    lessonIsFree ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-gray-900 text-gray-400 border-gray-800'
                  }`}
                >
                  {lessonIsFree ? '✓ Free Preview Enabled' : '🔒 Locked (Enrolled Only)'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300">Video File Upload or URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="https://commondatastorage.googleapis.com/... or uploaded URL"
                  value={lessonVideoUrl}
                  onChange={(e) => setLessonVideoUrl(e.target.value)}
                  className="w-full p-3 bg-gray-900 rounded-2xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                />
                <label className="px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-bold cursor-pointer shrink-0">
                  <span>Upload Video</span>
                  <input type="file" accept="video/*" onChange={handleLessonVideoFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-amber-400 text-black font-black text-xs hover:bg-amber-300 shadow-lg"
            >
              {editingLessonId ? 'Save Video Lecture' : 'Publish Video Lecture'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL: POST / EDIT ANNOUNCEMENT */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleSaveAnn} className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl border border-amber-400/50 bg-[#070a14] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>{editingAnnId ? 'Edit Announcement' : 'Post New Announcement'}</span>
              </h3>
              <button onClick={() => setShowAnnModal(false)} className="p-1 rounded-xl text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300">Announcement Type</label>
              <select
                value={annType}
                onChange={(e: any) => setAnnType(e.target.value)}
                className="w-full p-3 bg-gray-900 rounded-2xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
              >
                <option value="live_masterclass">Live Masterclass / Session Alert</option>
                <option value="module_update">New Video / Module Release</option>
                <option value="bonus_drop">Bonus Toolkit / Resource Drop</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300">Announcement Title</label>
              <input
                type="text"
                required
                placeholder="e.g. 🚨 Live Q&A Session Today at 8 PM!"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                className="w-full p-3 bg-gray-900 rounded-2xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300">Announcement Content</label>
              <textarea
                rows={4}
                required
                placeholder="Full details of the announcement to push to student dashboard..."
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                className="w-full p-3 bg-gray-900 rounded-2xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-amber-400 text-black font-black text-xs hover:bg-amber-300 shadow-lg"
            >
              {editingAnnId ? 'Save Changes' : 'Push Announcement & Alert Students'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL: CREATE COUPON */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleSaveCoupon} className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl border border-amber-400/50 bg-[#070a14] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>Create New Discount Coupon</span>
              </h3>
              <button onClick={() => setShowCouponModal(false)} className="p-1 rounded-xl text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300">Coupon Code</label>
              <input
                type="text"
                required
                placeholder="e.g. SAWADSERA3020091"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                className="w-full p-3 bg-gray-900 rounded-2xl text-xs text-amber-400 font-mono font-bold border border-gray-800 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">Discount (%)</label>
                <input
                  type="number"
                  value={newCouponDiscount}
                  onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                  className="w-full p-3 bg-gray-900 rounded-2xl text-xs text-white border border-gray-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300">Valid Until</label>
                <input
                  type="text"
                  value={newCouponValidUntil}
                  onChange={(e) => setNewCouponValidUntil(e.target.value)}
                  className="w-full p-3 bg-gray-900 rounded-2xl text-xs text-white border border-gray-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-amber-400 text-black font-black text-xs hover:bg-amber-300 shadow-lg"
            >
              Create Coupon
            </button>
          </form>
        </div>
      )}

      {/* MODAL: STUDENT DETAILED REPORT */}
      {selectedStudentReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl glass-panel p-6 sm:p-8 rounded-3xl border border-purple-500/40 space-y-6 bg-[#070a14] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedStudentReport.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                  alt={selectedStudentReport.name}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-400"
                />
                <div>
                  <h3 className="font-black text-white text-lg">{selectedStudentReport.name}</h3>
                  <p className="text-xs text-gray-400">{selectedStudentReport.email} • {selectedStudentReport.phone || 'No Phone'}</p>
                </div>
              </div>

              <button onClick={() => setSelectedStudentReport(null)} className="p-2 rounded-xl text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 text-center space-y-1">
                <span className="text-[10px] text-gray-400 font-mono uppercase">Watch Hours</span>
                <p className="text-xl font-black text-amber-400 font-mono">{selectedStudentReport.watchHours || 24.5} hrs</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 text-center space-y-1">
                <span className="text-[10px] text-gray-400 font-mono uppercase">Streak</span>
                <p className="text-xl font-black text-orange-400 font-mono">🔥 {selectedStudentReport.activeStreakDays || 7} Days</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 text-center space-y-1">
                <span className="text-[10px] text-gray-400 font-mono uppercase">Status</span>
                <p className="text-sm font-black text-emerald-400 font-mono mt-1">Active Learner</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 text-center space-y-1">
                <span className="text-[10px] text-gray-400 font-mono uppercase">Course</span>
                <p className="text-xs font-bold text-purple-300 mt-1">{flagship.title}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <button
                onClick={() => sendStudentReminder(selectedStudentReport.id)}
                className="px-4 py-2.5 rounded-xl bg-amber-400 text-black text-xs font-black hover:bg-amber-300 flex items-center gap-1.5"
              >
                <Bell className="w-4 h-4" /> Send Direct Reminder Alert
              </button>

              <button
                onClick={() => setSelectedStudentReport(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-800 text-gray-300 hover:text-white text-xs font-bold"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PHOTO UPLOAD MODAL */}
      <PhotoUploadModal
        isOpen={adminPhotoModalOpen}
        onClose={() => {
          setAdminPhotoModalOpen(false);
          setAdminPhotoTargetStudent(null);
        }}
        onSavePhoto={(url: string) => {
          if (adminPhotoTargetStudent) {
            showToast(`Photo updated for ${adminPhotoTargetStudent.name}!`);
          }
        }}
        title={`Upload Photo for ${adminPhotoTargetStudent?.name || 'Student'}`}
      />
    </div>
  );
};

export default AdminControlPanel;
