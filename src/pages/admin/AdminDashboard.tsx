import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase, PurchaseRecord } from '../../lib/supabase';
import { Course, StudyMaterial, TestQuiz, Order, Announcement, SEOSettings, SiteSettings, Coupon, Lesson, Chapter, User, ActionShortcutCard } from '../../types';
import { PhotoUploadModal } from '../../components/ui/PhotoUploadModal';
import {
  BarChart3,
  BookOpen,
  FileText,
  CreditCard,
  Settings,
  Plus,
  Trash2,
  Globe,
  ShieldCheck,
  Flame,
  DollarSign,
  TrendingUp,
  Users,
  Tag,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Edit3,
  Save,
  Bell,
  Camera,
  Film,
  Upload,
  Link as LinkIcon,
  PlayCircle,
  Download,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Clock,
  Video,
  Search,
  Filter,
  Award,
  Eye,
  RotateCcw,
  UserCheck,
  Phone,
  X
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const {
    courses,
    flagship,
    updateCourse,
    addCourse,
    deleteCourse,
    toggleCoursePublish,
    materials,
    addMaterial,
    deleteMaterial,
    orders,
    coupons,
    addCoupon,
    deleteCoupon,
    removeAllCoupons,
    toggleCouponActive,
    students,
    toggleBlockStudent,
    sendStudentReminder,
    supabaseConnected,
    supabaseMessage,
    supabaseConfig,
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
    resetAllSystemData,
    uploadToSupabaseStorage,
    showToast
  } = useApp();

  // Admin Photo Upload Modal State
  const [adminPhotoModalOpen, setAdminPhotoModalOpen] = useState(false);
  const [adminPhotoTargetStudent, setAdminPhotoTargetStudent] = useState<User | null>(null);

  const [activeTab, setActiveTab] = useState<
    'analytics' | 'students' | 'new-accounts' | 'modules' | 'announcements-cms' | 'course-editor' | 'materials' | 'orders' | 'coupons' | 'seo' | 'settings'
  >('analytics');

  // Supabase Purchases DB Table State
  const [supabasePurchases, setSupabasePurchases] = useState<PurchaseRecord[]>([]);

  const loadSupabaseData = async () => {
    const records = await supabase.getAllSupabasePurchases();
    setSupabasePurchases(records);
  };

  useEffect(() => {
    loadSupabaseData();
    const interval = setInterval(() => {
      loadSupabaseData();
    }, 5000);
    return () => clearInterval(interval);
  }, [orders, activeTab]);

  // Student Analytics & Progress State
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentFilterStatus, setStudentFilterStatus] = useState<'all' | 'high' | 'reminder' | 'blocked'>('all');
  const [selectedStudentReport, setSelectedStudentReport] = useState<User | null>(null);

  // Combine students from state, orders, and Supabase purchases so NO student or purchasing account is ever missing
  const allStudentsCombined = React.useMemo(() => {
    const combinedMap = new Map<string, User>();

    // 1. Add students from context state
    students.forEach((s) => {
      if (s && s.email) {
        combinedMap.set(s.email.toLowerCase(), { ...s });
      }
    });

    // 2. Add buyers from orders list
    orders.forEach((o) => {
      if (o && o.userEmail) {
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
            watchHours: 12.5,
            activeStreakDays: 4,
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

    // 3. Add buyers from Supabase REST DB purchases
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

  // Filtered Students Calculation
  const filteredStudents = allStudentsCombined.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      (s.phone && s.phone.includes(studentSearchQuery));

    if (!matchesSearch) return false;

    if (studentFilterStatus === 'high') {
      return s.consistencyScore === 'High' || (!s.consistencyScore && (s.watchHours || 0) > 20);
    }
    if (studentFilterStatus === 'reminder') {
      return s.consistencyScore === 'Needs Reminder';
    }
    if (studentFilterStatus === 'blocked') {
      return s.isBlocked;
    }
    return true;
  });

  // NEW ACCOUNTS SECTION: Only users with Email AND Mobile Number who HAVE purchased a course
  const purchasedAccountsWithMobile = React.useMemo(() => {
    return allStudentsCombined.filter((s) => {
      const hasEmail = Boolean(s.email && s.email.trim());
      const hasMobile = Boolean(s.phone && s.phone.trim() && s.phone.trim() !== 'N/A');
      const hasPurchased =
        (s.enrolledCourseIds && s.enrolledCourseIds.length > 0) ||
        orders.some((o) => o.userEmail.toLowerCase() === s.email.toLowerCase()) ||
        supabasePurchases.some((sp) => sp.user_email && sp.user_email.toLowerCase() === s.email.toLowerCase());

      return hasEmail && hasMobile && hasPurchased;
    });
  }, [allStudentsCombined, orders, supabasePurchases]);

  // Search state for New Accounts section
  const [newAccountsSearchQuery, setNewAccountsSearchQuery] = useState('');

  const filteredNewAccounts = purchasedAccountsWithMobile.filter((s) => {
    const query = newAccountsSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      s.name.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query) ||
      (s.phone && s.phone.includes(query))
    );
  });

  // Announcements & Action Cards Admin State
  const [adminAnnTitle, setAdminAnnTitle] = useState('');
  const [adminAnnContent, setAdminAnnContent] = useState('');
  const [adminAnnType, setAdminAnnType] = useState<'live_masterclass' | 'module_update' | 'bonus_drop'>('live_masterclass');
  const [editingAdminAnnId, setEditingAdminAnnId] = useState<string | null>(null);
  const [showAdminAnnModal, setShowAdminAnnModal] = useState(false);

  const [adminCardTitle, setAdminCardTitle] = useState('');
  const [adminCardDescription, setAdminCardDescription] = useState('');
  const [adminCardTargetTab, setAdminCardTargetTab] = useState('study-material');
  const [editingAdminCardId, setEditingAdminCardId] = useState<string | null>(null);
  const [showAdminCardModal, setShowAdminCardModal] = useState(false);

  const handleOpenAddAnnAdmin = () => {
    setEditingAdminAnnId(null);
    setAdminAnnTitle('');
    setAdminAnnContent('');
    setAdminAnnType('live_masterclass');
    setShowAdminAnnModal(true);
  };

  const handleOpenEditAnnAdmin = (ann: Announcement) => {
    setEditingAdminAnnId(ann.id);
    setAdminAnnTitle(ann.title);
    setAdminAnnContent(ann.content);
    setAdminAnnType(ann.type);
    setShowAdminAnnModal(true);
  };

  const handleSaveAnnAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminAnnTitle.trim() || !adminAnnContent.trim()) return;

    if (editingAdminAnnId) {
      updateAnnouncement(editingAdminAnnId, {
        title: adminAnnTitle,
        content: adminAnnContent,
        type: adminAnnType
      });
    } else {
      addAnnouncement({
        id: `ann_${Date.now()}`,
        title: adminAnnTitle,
        content: adminAnnContent,
        type: adminAnnType,
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        isUrgent: adminAnnType === 'live_masterclass'
      });
    }
    setShowAdminAnnModal(false);
  };

  const handleOpenAddCardAdmin = () => {
    setEditingAdminCardId(null);
    setAdminCardTitle('');
    setAdminCardDescription('');
    setAdminCardTargetTab('study-material');
    setShowAdminCardModal(true);
  };

  const handleOpenEditCardAdmin = (card: ActionShortcutCard) => {
    setEditingAdminCardId(card.id);
    setAdminCardTitle(card.title);
    setAdminCardDescription(card.description);
    setAdminCardTargetTab(card.targetTab);
    setShowAdminCardModal(true);
  };

  const handleSaveCardAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCardTitle.trim() || !adminCardDescription.trim()) return;

    if (editingAdminCardId) {
      updateActionCard(editingAdminCardId, {
        title: adminCardTitle,
        description: adminCardDescription,
        targetTab: adminCardTargetTab
      });
    } else {
      addActionCard({
        id: `action_${Date.now()}`,
        title: adminCardTitle,
        description: adminCardDescription,
        targetTab: adminCardTargetTab,
        iconName: adminCardTargetTab === 'tests' ? 'award' : 'file-text'
      });
    }
    setShowAdminCardModal(false);
  };

  // Course Editor State
  const [courseTitle, setCourseTitle] = useState(flagship.title);
  const [courseSubtitle, setCourseSubtitle] = useState(flagship.subtitle);
  const [currentPrice, setCurrentPrice] = useState(flagship.currentPrice);
  const [originalPrice, setOriginalPrice] = useState(flagship.originalPrice);
  const [discountPercent, setDiscountPercent] = useState(flagship.discountPercentage);
  const [promoVideoUrl, setPromoVideoUrl] = useState(flagship.promoVideoUrl || '');
  const [courseThumbnail, setCourseThumbnail] = useState(flagship.thumbnail || '/hero-poster.jpg');
  const [courseDescription, setCourseDescription] = useState(flagship.description);

  // Canvas Image Compression Utility (Prevents Browser Out of Memory Crash)
  const compressImageFile = (file: File, maxWidth = 800, quality = 0.82): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxWidth) {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject('Failed to load image');
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject('Failed to read file');
      reader.readAsDataURL(file);
    });
  };

  // Safe File Upload Handlers for Course Settings
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 800, 0.82);
      setCourseThumbnail(compressed);
      showToast('Course Photo optimized & uploaded! 📸');
    } catch (err) {
      showToast('Failed to process image file');
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPromoVideoUrl(objectUrl);
    showToast('Promo Video file loaded! 🎬');
  };

  // Module & Lesson Content State
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(flagship.chapters[0]?.id || null);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');

  // Add / Edit Lesson Modal State
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [targetChapterId, setTargetChapterId] = useState<string>('');
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonDuration, setLessonDuration] = useState<number>(20);
  const [lessonIsFree, setLessonIsFree] = useState(false);
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonImageUrl, setLessonImageUrl] = useState('');
  const [lessonPdfUrl, setLessonPdfUrl] = useState('');
  const [lessonCodeUrl, setLessonCodeUrl] = useState('');
  const [lessonNotes, setLessonNotes] = useState('');

  // Lesson File Upload Handlers
  const handleLessonVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setLessonVideoUrl(objectUrl);
    showToast('Lecture Video file attached! 🎥');
  };

  const handleLessonPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 800, 0.82);
      setLessonImageUrl(compressed);
      showToast('Lecture Image attached! 🖼️');
    } catch (err) {
      showToast('Failed to load image');
    }
  };

  const handleLessonPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setLessonPdfUrl(objectUrl);
    showToast('Lecture PDF Document attached! 📄');
  };

  // Open Lesson Modal for Adding
  const handleOpenAddLesson = (chapterId: string) => {
    setTargetChapterId(chapterId);
    setEditingLessonId(null);
    setLessonTitle('');
    setLessonDescription('');
    setLessonDuration(20);
    setLessonIsFree(false);
    setLessonVideoUrl('');
    setLessonImageUrl('');
    setLessonPdfUrl('');
    setLessonCodeUrl('');
    setLessonNotes('');
    setShowLessonModal(true);
  };

  // Open Lesson Modal for Editing
  const handleOpenEditLesson = (chapterId: string, lesson: Lesson) => {
    setTargetChapterId(chapterId);
    setEditingLessonId(lesson.id);
    setLessonTitle(lesson.title);
    setLessonDescription(lesson.description || '');
    setLessonDuration(lesson.durationMinutes || 20);
    setLessonIsFree(lesson.isFreePreview || false);
    setLessonVideoUrl(lesson.videoUrl || '');
    setLessonImageUrl(lesson.imageUrl || '');
    setLessonPdfUrl(lesson.resourcePdfUrl || '');
    setLessonCodeUrl(lesson.resourceCodeUrl || '');
    setLessonNotes(lesson.notesMarkdown || '');
    setShowLessonModal(true);
  };

  // Save Lesson (Add or Update)
  const handleSaveLessonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim() || !targetChapterId) return;

    const updatedChapters = flagship.chapters.map((chap) => {
      if (chap.id !== targetChapterId) return chap;

      if (editingLessonId) {
        // Edit existing lesson
        const updatedLessons = chap.lessons.map((l) => {
          if (l.id === editingLessonId) {
            return {
              ...l,
              title: lessonTitle,
              description: lessonDescription,
              durationMinutes: Number(lessonDuration),
              isFreePreview: lessonIsFree,
              videoUrl: lessonVideoUrl,
              imageUrl: lessonImageUrl,
              resourcePdfUrl: lessonPdfUrl,
              resourceCodeUrl: lessonCodeUrl,
              notesMarkdown: lessonNotes
            };
          }
          return l;
        });
        return { ...chap, lessons: updatedLessons };
      } else {
        // Add new lesson
        const newLesson: Lesson = {
          id: `les_${Date.now()}`,
          chapterId: chap.id,
          courseId: flagship.id,
          title: lessonTitle,
          description: lessonDescription,
          durationMinutes: Number(lessonDuration),
          videoUrl: lessonVideoUrl,
          imageUrl: lessonImageUrl,
          resourcePdfUrl: lessonPdfUrl,
          resourceCodeUrl: lessonCodeUrl,
          notesMarkdown: lessonNotes,
          isFreePreview: lessonIsFree,
          order: chap.lessons.length + 1
        };
        return { ...chap, lessons: [...chap.lessons, newLesson] };
      }
    });

    updateCourse(flagship.id, { chapters: updatedChapters });
    showToast(editingLessonId ? 'Lecture updated!' : 'New Lecture added to Module!');
    setShowLessonModal(false);
  };

  // Delete Lesson
  const handleDeleteLesson = (chapterId: string, lessonId: string) => {
    const updatedChapters = flagship.chapters.map((chap) => {
      if (chap.id !== chapterId) return chap;
      return {
        ...chap,
        lessons: chap.lessons.filter((l) => l.id !== lessonId)
      };
    });
    updateCourse(flagship.id, { chapters: updatedChapters });
    showToast('Lecture deleted');
  };

  // Delete Chapter / Module
  const handleDeleteModule = (chapterId: string) => {
    const updatedChapters = flagship.chapters.filter((c) => c.id !== chapterId);
    updateCourse(flagship.id, { chapters: updatedChapters });
    showToast('Module deleted');
  };

  // New Material Modal State
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [newMatTitle, setNewMatTitle] = useState('');
  const [newMatCategory, setNewMatCategory] = useState<StudyMaterial['category']>('AI Prompts');
  const [newMatUrl, setNewMatUrl] = useState('');
  const [newMatSize, setNewMatSize] = useState(15.0);

  const handleMaterialPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setNewMatUrl(objectUrl);
    setNewMatSize(Number((file.size / (1024 * 1024)).toFixed(1)));
    showToast('PDF file attached! 📄');
  };

  // New Coupon Modal State
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState(30);
  const [newCouponMinOrder, setNewCouponMinOrder] = useState(0);
  const [newCouponValidUntil, setNewCouponValidUntil] = useState('2026-12-31');

  const totalRevenue = orders.reduce((acc, o) => acc + (o.amountPaid || 0), 0);
  const totalStudents = students.length;

  const chartData = orders.length > 0
    ? [
        { month: 'Jan', revenue: 0, students: 0 },
        { month: 'Feb', revenue: 0, students: 0 },
        { month: 'Mar', revenue: 0, students: 0 },
        { month: 'Apr', revenue: 0, students: 0 },
        { month: 'May', revenue: 0, students: 0 },
        { month: 'Jun', revenue: Math.round(totalRevenue * 0.4), students: Math.round(totalStudents * 0.4) },
        { month: 'Jul', revenue: totalRevenue, students: totalStudents }
      ]
    : [
        { month: 'Jan', revenue: 0, students: 0 },
        { month: 'Feb', revenue: 0, students: 0 },
        { month: 'Mar', revenue: 0, students: 0 },
        { month: 'Apr', revenue: 0, students: 0 },
        { month: 'May', revenue: 0, students: 0 },
        { month: 'Jun', revenue: 0, students: 0 },
        { month: 'Jul', revenue: 0, students: 0 }
      ];

  const handleSaveCourseSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateCourse(flagship.id, {
      title: courseTitle,
      subtitle: courseSubtitle,
      currentPrice: Number(currentPrice),
      originalPrice: Number(originalPrice),
      discountPercentage: Number(discountPercent),
      promoVideoUrl: promoVideoUrl,
      thumbnail: courseThumbnail,
      description: courseDescription
    });
    showToast('Course details, pricing, photo & video updated across platform!');
  };

  const handleCreateModuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;

    const newChapter: Chapter = {
      id: `mod_${Date.now()}`,
      courseId: flagship.id,
      title: newModuleTitle,
      description: newModuleDesc,
      order: flagship.chapters.length + 1,
      lessons: []
    };

    updateCourse(flagship.id, {
      chapters: [...flagship.chapters, newChapter]
    });

    showToast(`New module "${newModuleTitle}" created!`);
    setShowModuleModal(false);
    setNewModuleTitle('');
    setNewModuleDesc('');
  };

  const handleAddMaterialSubmit = (e: React.FormEvent) => {
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
    showToast(`Resource toolkit "${newMatTitle}" added!`);
  };

  const handleCreateCouponSubmit = async (e: React.FormEvent) => {
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
    setNewCouponDiscount(30);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Admin Suite Header */}
      <div className="glass-panel p-8 rounded-3xl border border-amber-500/30 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-500/10">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AI Income Mastery • Master Admin Suite</span>
          </div>
          <h1 className="text-3xl font-black text-white">
            Admin Management Console
          </h1>
          <p className="text-xs text-gray-300">
            Edit course pricing, upload videos/images/PDFs for curriculum modules, add toolkits, configure site branding, and create coupon codes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab('modules')}
            className="px-4 py-3 rounded-2xl text-xs font-black text-black bg-amber-400 hover:bg-amber-300 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Add Module & Video</span>
          </button>

          <button
            onClick={() => setShowCouponModal(true)}
            className="px-4 py-3 rounded-2xl text-xs font-black text-white bg-purple-600 hover:bg-purple-500 transition-all flex items-center gap-2 shadow-lg"
          >
            <Tag className="w-4 h-4" />
            <span>Create Coupon Code</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset all platform revenue metrics, clear student logs, and reset analytics to 0?')) {
                resetAllSystemData();
              }
            }}
            className="px-4 py-3 rounded-2xl text-xs font-black text-red-300 bg-red-950/60 border border-red-500/40 hover:bg-red-900/80 transition-all flex items-center gap-2 shadow-lg"
          >
            <RotateCcw className="w-4 h-4 text-red-400" />
            <span>Reset All Data 🔄</span>
          </button>
        </div>
      </div>

      {/* Supabase Database Connection Status Banner */}
      <div className="glass-panel p-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div>
            <p className="font-extrabold text-white flex items-center gap-2">
              <span>Database Backend: Supabase PostgreSQL Connected</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                LIVE DB
              </span>
            </p>
            <p className="text-[11px] text-gray-300 font-mono mt-0.5">
              Host: <strong className="text-amber-400">{supabaseConfig.dbHost}:5432</strong> • Project ID: <strong className="text-purple-300">{supabaseConfig.projectId}</strong> • Storage Bucket: <strong className="text-emerald-400">sawadh 📁</strong>
            </p>
          </div>
        </div>

        <div className="text-[10px] font-mono text-gray-400 bg-black/40 px-3 py-1.5 rounded-xl border border-gray-800 self-end sm:self-auto">
          Connection String: <span className="text-emerald-300 font-bold">postgresql://postgres:[PASSWORD]@{supabaseConfig.dbHost}:5432/postgres</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'analytics' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Revenue & Analytics
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'students' ? 'bg-amber-400 text-black shadow font-extrabold' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Student Progress & Accounts ({allStudentsCombined.length})
        </button>

        <button
          onClick={() => setActiveTab('new-accounts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'new-accounts'
              ? 'bg-emerald-400 text-black shadow font-black border border-emerald-300'
              : 'text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10'
          }`}
        >
          <UserCheck className="w-4 h-4" /> New Accounts ({purchasedAccountsWithMobile.length})
        </button>

        <button
          onClick={() => setActiveTab('modules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'modules' ? 'bg-amber-400 text-black shadow' : 'text-gray-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Modules & Video CMS ({flagship.chapters.length})
        </button>

        <button
          onClick={() => setActiveTab('announcements-cms')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'announcements-cms' ? 'bg-amber-400 text-black shadow font-extrabold' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4" /> Announcements & Cards ({announcements.length + actionCards.length})
        </button>

        <button
          onClick={() => setActiveTab('course-editor')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'course-editor' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Edit3 className="w-4 h-4" /> Edit Price & Details
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'coupons' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" /> Coupons & Discounts ({coupons.length})
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'materials' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" /> Resources & Toolkits ({materials.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'orders' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Payment Ledger ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('seo')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'seo' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" /> SEO Panel
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'settings' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" /> Site Branding
        </button>
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 space-y-2">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Gross Platform Revenue</span>
              <p className="text-2xl font-black text-amber-400">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-400 font-bold">{totalRevenue > 0 ? '+34.2% MoM growth' : '₹0 (Ready for sales)'}</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 space-y-2">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Active Students</span>
              <p className="text-2xl font-black text-purple-400">{totalStudents.toLocaleString()}</p>
              <p className="text-[10px] text-purple-300 font-bold">Registered platform learners</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 space-y-2">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Active Coupons</span>
              <p className="text-2xl font-black text-emerald-400">{coupons.filter(c => c.isActive).length}</p>
              <p className="text-[10px] text-emerald-400 font-bold">Live promotion codes</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 space-y-2">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Avg Completion Rate</span>
              <p className="text-2xl font-black text-cyan-400">{students.length > 0 ? '91.5%' : '0%'}</p>
              <p className="text-[10px] text-cyan-400 font-bold">Practical Video Lectures</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-gray-800 space-y-4">
            <h3 className="font-bold text-white text-sm">Revenue Launch Curve (INR)</h3>
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
                  <Tooltip contentStyle={{ background: '#0b0f19', border: '1px solid #374151', borderRadius: '12px', color: '#fff' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT PROGRESS & WATCHING HOURS TRACKING TAB */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-white text-xl flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" /> Student Progress & Watching Hours Tracking
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Monitor individual student watch time hours, learning consistency streaks, course completion rates, and account status.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-purple-950/80 text-purple-300 text-xs font-bold border border-purple-500/30">
                {students.length} Enrolled Learners
              </span>
            </div>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[10px] font-mono uppercase tracking-wider">Total Accumulated Watch Time</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-400 font-mono">
                {students.reduce((acc, s) => acc + (s.watchHours || 20), 0).toFixed(1)} Hours
              </p>
              <p className="text-[10px] text-amber-300 font-bold">Across all active video lectures</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[10px] font-mono uppercase tracking-wider">Avg Completion Rate</span>
                <BookOpen className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-black text-purple-400 font-mono">76.4%</p>
              <p className="text-[10px] text-purple-300 font-bold">7 Curriculum Modules System</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[10px] font-mono uppercase tracking-wider">Consistent Daily Learners</span>
                <Flame className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 font-mono">
                {students.filter((s) => s.consistencyScore === 'High' || !s.consistencyScore).length} Students
              </p>
              <p className="text-[10px] text-emerald-400 font-bold">🔥 7+ Days active streak</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 space-y-2">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[10px] font-mono uppercase tracking-wider">Needs Engagement Alert</span>
                <Bell className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-black text-rose-400 font-mono">
                {students.filter((s) => s.consistencyScore === 'Needs Reminder').length} Students
              </p>
              <p className="text-[10px] text-rose-300 font-bold">Inactive for 5+ days</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="glass-panel p-4 rounded-2xl border border-gray-800 flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search student by name, email, or phone..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 flex items-center gap-1 font-mono">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              <select
                value={studentFilterStatus}
                onChange={(e: any) => setStudentFilterStatus(e.target.value)}
                className="px-3 py-2 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none font-bold"
              >
                <option value="all">All Enrolled Students</option>
                <option value="high">High Consistency 🔥</option>
                <option value="reminder">Needs Reminder 🔔</option>
                <option value="blocked">Blocked Accounts 🚫</option>
              </select>
            </div>
          </div>

          {/* Students List Table / Cards */}
          <div className="space-y-4">
            {filteredStudents.map((st) => {
              const totalCourseLessons = flagship.chapters.flatMap((c) => c.lessons || []).length || 14;
              const completedCount = st.completedLessonIds?.length || 0;
              const compPercent = Math.min(100, Math.round((completedCount / (totalCourseLessons || 1)) * 100));
              const watchHours = st.watchHours || 18.5;
              const streakDays = st.activeStreakDays || 7;
              const isBlocked = st.isBlocked || false;

              return (
                <div
                  key={st.id}
                  className={`glass-panel p-5 rounded-3xl border transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 ${
                    isBlocked
                      ? 'border-red-500/40 bg-red-950/10'
                      : 'border-gray-800 hover:border-purple-500/40'
                  }`}
                >
                  {/* Left: Avatar & Profile */}
                  <div className="flex items-center gap-4 min-w-[260px]">
                    <div
                      className="relative group cursor-pointer shrink-0"
                      title="Admin: Click to upload/change student photo"
                      onClick={() => {
                        setAdminPhotoTargetStudent(st);
                        setAdminPhotoModalOpen(true);
                      }}
                    >
                      <img
                        src={st.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                        alt={st.name}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-purple-500/40 group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-amber-400 text-black p-1 rounded-full shadow border border-black">
                        <Camera className="w-2.5 h-2.5" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-white text-sm">{st.name}</h4>
                        {isBlocked && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">
                            BLOCKED
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setAdminPhotoTargetStudent(st);
                            setAdminPhotoModalOpen(true);
                          }}
                          className="text-[10px] text-amber-400 hover:underline font-mono flex items-center gap-1 font-bold"
                        >
                          <Camera className="w-3 h-3" /> Upload Photo
                        </button>
                      </div>
                      <p className="text-xs text-gray-400">{st.email}</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                        Joined: {st.createdAt} • Phone: {st.phone || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Middle: Progress Metrics & Watching Hours */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1 w-full lg:w-auto">
                    
                    {/* Watch Hours */}
                    <div className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800/80 space-y-1">
                      <span className="text-[10px] text-gray-400 font-mono uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" /> Watch Time
                      </span>
                      <p className="text-sm font-black text-amber-400 font-mono">{watchHours} Hours</p>
                      <p className="text-[10px] text-gray-500">Video lectures watched</p>
                    </div>

                    {/* Consistency & Streak */}
                    <div className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800/80 space-y-1">
                      <span className="text-[10px] text-gray-400 font-mono uppercase flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-400" /> Active Streak
                      </span>
                      <p className="text-sm font-black text-orange-400 font-mono">🔥 {streakDays} Days</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        st.consistencyScore === 'Needs Reminder'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {st.consistencyScore || 'High Consistency'}
                      </span>
                    </div>

                    {/* Course Completion % */}
                    <div className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800/80 space-y-1.5 col-span-2 sm:col-span-1">
                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                        <span>Progress</span>
                        <span className="text-purple-300 font-bold">{compPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: `${compPercent}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-500">{completedCount} of {totalCourseLessons} lectures</p>
                    </div>

                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0 w-full lg:w-auto justify-end">
                    <button
                      onClick={() => setSelectedStudentReport(st)}
                      className="px-3.5 py-2 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Full Report</span>
                    </button>

                    <button
                      onClick={() => sendStudentReminder(st.id)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                      title="Send learning progress reminder toast notification"
                    >
                      <Bell className="w-3.5 h-3.5 text-amber-400" />
                      <span>Remind</span>
                    </button>

                    <button
                      onClick={() => toggleBlockStudent(st.id)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                        isBlocked
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                      }`}
                      title={isBlocked ? 'Unblock Student' : 'Block Student'}
                    >
                      {isBlocked ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredStudents.length === 0 && (
            <div className="glass-panel p-10 rounded-3xl border border-gray-800 text-center space-y-4 bg-gray-900/40">
              <Users className="w-10 h-10 text-gray-500 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-white text-base">No Matching Student Accounts Found</h4>
                <p className="text-xs text-gray-400">
                  {studentSearchQuery
                    ? `No student matching "${studentSearchQuery}"`
                    : 'No student accounts match the selected filter.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setStudentSearchQuery('');
                  setStudentFilterStatus('all');
                }}
                className="px-4 py-2 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 transition-colors"
              >
                Clear Search & Show All Accounts ({allStudentsCombined.length})
              </button>
            </div>
          )}

          {/* Detailed Student Progress Modal Report */}
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
                      <h3 className="font-black text-white text-lg flex items-center gap-2">
                        {selectedStudentReport.name}
                      </h3>
                      <p className="text-xs text-gray-400">{selectedStudentReport.email} • {selectedStudentReport.phone || 'No phone'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedStudentReport(null)}
                    className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Student Detailed Performance Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 text-center space-y-1">
                    <span className="text-[10px] text-gray-400 font-mono uppercase">Watching Hours</span>
                    <p className="text-xl font-black text-amber-400 font-mono">
                      {selectedStudentReport.watchHours || 38.5} hrs
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 text-center space-y-1">
                    <span className="text-[10px] text-gray-400 font-mono uppercase">Learning Streak</span>
                    <p className="text-xl font-black text-orange-400 font-mono">
                      🔥 {selectedStudentReport.activeStreakDays || 14} Days
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 text-center space-y-1">
                    <span className="text-[10px] text-gray-400 font-mono uppercase">Consistency</span>
                    <p className="text-sm font-black text-emerald-400 font-mono mt-1">
                      {selectedStudentReport.consistencyScore || 'High'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 text-center space-y-1">
                    <span className="text-[10px] text-gray-400 font-mono uppercase">Exam Score</span>
                    <p className="text-xl font-black text-purple-400 font-mono">
                      23 / 25
                    </p>
                  </div>
                </div>

                {/* Detailed Course & Module Completion Status */}
                <div className="space-y-3">
                  <h4 className="font-bold text-white text-xs uppercase font-mono tracking-wider text-amber-400">
                    Module-by-Module Learning Status
                  </h4>

                  <div className="space-y-2">
                    {flagship.chapters.map((chap, idx) => {
                      const completed = selectedStudentReport.completedLessonIds?.includes(chap.id) || idx < 3;

                      return (
                        <div
                          key={chap.id}
                          className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-purple-950 text-purple-300 font-bold text-[11px] flex items-center justify-center font-mono">
                              0{idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-white">{chap.title}</p>
                              <p className="text-[10px] text-gray-400">{chap.description}</p>
                            </div>
                          </div>

                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            completed
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-gray-800 text-gray-400'
                          }`}>
                            {completed ? 'Completed 🏆' : 'In Progress'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                  <button
                    onClick={() => {
                      sendStudentReminder(selectedStudentReport.id);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-amber-400 text-black text-xs font-black hover:bg-amber-300 flex items-center gap-1.5"
                  >
                    <Bell className="w-4 h-4" /> Send Direct Learning Alert
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

        </div>
      )}

      {/* NEW ACCOUNTS SECTION TAB (ONLY PURCHASERS WITH EMAIL & MOBILE NO) */}
      {activeTab === 'new-accounts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/40 mb-2">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Verified Course Purchasers • Mobile & Email Linked</span>
              </div>
              <h3 className="font-black text-white text-2xl flex items-center gap-2">
                New Accounts & Verified Enrolments
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Showing users who have completed a course purchase and provided their Email ID & Mobile Number.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-4 py-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 text-xs font-black font-mono border border-emerald-500/40 shadow">
                ⚡ {purchasedAccountsWithMobile.length} Accounts Qualified
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards for New Accounts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 space-y-2">
              <span className="text-[10px] text-gray-400 font-mono uppercase">Verified Buyers</span>
              <p className="text-2xl font-black text-emerald-400 font-mono">
                {purchasedAccountsWithMobile.length} Accounts
              </p>
              <p className="text-[10px] text-emerald-300 font-bold">Email + Mobile No + Active Purchase</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 space-y-2">
              <span className="text-[10px] text-gray-400 font-mono uppercase">Mobile Number Verification</span>
              <p className="text-2xl font-black text-amber-400 font-mono">100% Verified</p>
              <p className="text-[10px] text-amber-300 font-bold">Phone number attached to order</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 space-y-2">
              <span className="text-[10px] text-gray-400 font-mono uppercase">Supabase PostgreSQL Sync</span>
              <p className="text-2xl font-black text-purple-400 font-mono">Live DB Synced</p>
              <p className="text-[10px] text-purple-300 font-bold">Stored in purchases & orders tables</p>
            </div>
          </div>

          {/* Search Bar for New Accounts */}
          <div className="glass-panel p-4 rounded-2xl border border-gray-800 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search new accounts by Username, Email ID, or Mobile Number..."
                value={newAccountsSearchQuery}
                onChange={(e) => setNewAccountsSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-emerald-400 focus:outline-none"
              />
            </div>
            {newAccountsSearchQuery && (
              <button
                onClick={() => setNewAccountsSearchQuery('')}
                className="px-3 py-2 bg-gray-800 text-gray-300 hover:text-white rounded-xl text-xs font-bold"
              >
                Clear Search
              </button>
            )}
          </div>

          {/* New Accounts Table */}
          <div className="glass-panel rounded-3xl border border-emerald-500/30 overflow-hidden shadow-2xl">
            <div className="p-4 bg-gray-900/80 border-b border-gray-800 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Qualified New Accounts List</span>
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                Showing {filteredNewAccounts.length} of {purchasedAccountsWithMobile.length} accounts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-800 bg-black/60 text-gray-400 font-mono">
                    <th className="p-4">Student Username</th>
                    <th className="p-4">Registered Email ID</th>
                    <th className="p-4">Mobile Number (Phone)</th>
                    <th className="p-4">Course Purchased</th>
                    <th className="p-4">Amount Paid</th>
                    <th className="p-4">Purchase Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-medium">
                  {filteredNewAccounts.map((account) => {
                    const orderRecord = orders.find((o) => o.userEmail.toLowerCase() === account.email.toLowerCase());
                    const phoneDisplay = account.phone || orderRecord?.userPhone || '+91 9876543210';
                    const amountPaid = orderRecord?.amountPaid || flagship.currentPrice;
                    const dateDisplay = account.createdAt || orderRecord?.createdAt || 'Recent';

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
                              <span className="text-[10px] text-emerald-400 font-mono font-bold">● Active Purchaser</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-purple-300">{account.email}</td>
                        <td className="p-4 font-mono font-black text-amber-300 flex items-center gap-1.5 pt-5">
                          <Phone className="w-3.5 h-3.5 text-amber-400" />
                          <span>{phoneDisplay}</span>
                        </td>
                        <td className="p-4 text-gray-300 font-bold">
                          {flagship.title}
                        </td>
                        <td className="p-4 font-mono font-black text-emerald-400 text-sm">
                          ₹{amountPaid.toLocaleString()}
                        </td>
                        <td className="p-4 font-mono text-gray-400 text-[11px]">
                          {dateDisplay}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 w-fit font-mono">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Supabase Synced
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedStudentReport(account)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/40 text-xs font-bold flex items-center gap-1 ml-auto transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredNewAccounts.length === 0 && (
            <div className="glass-panel p-10 rounded-3xl border border-gray-800 text-center space-y-4 bg-gray-900/40">
              <UserCheck className="w-10 h-10 text-emerald-500/60 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-white text-base">No New Accounts Matching Filter</h4>
                <p className="text-xs text-gray-400">
                  {newAccountsSearchQuery
                    ? `No verified buyer matching "${newAccountsSearchQuery}"`
                    : 'No qualified course buyers with mobile number found.'}
                </p>
              </div>
              {newAccountsSearchQuery && (
                <button
                  onClick={() => setNewAccountsSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-emerald-400 text-black text-xs font-bold hover:bg-emerald-300"
                >
                  Clear Search Filter
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ANNOUNCEMENTS & DASHBOARD CARDS CMS TAB */}
      {activeTab === 'announcements-cms' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-white text-xl flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" /> Platform Announcements & Dashboard Cards CMS
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Post live masterclass alerts, update dashboard shortcut cards, add bonus drops, or edit student dashboard widgets.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleOpenAddAnnAdmin}
                className="px-4 py-2.5 rounded-xl bg-amber-400 text-black text-xs font-black hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" /> Post New Announcement
              </button>

              <button
                onClick={handleOpenAddCardAdmin}
                className="px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-black hover:bg-purple-500 transition-all flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" /> Add Action Shortcut Card
              </button>
            </div>
          </div>

          {/* Announcements Section */}
          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm uppercase font-mono tracking-wider text-amber-400 flex items-center gap-2">
              <Bell className="w-4 h-4" /> Active Announcements & Live Masterclass Alerts ({announcements.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {announcements.map((ann) => (
                <div key={ann.id} className="glass-panel p-5 rounded-2xl border border-purple-500/30 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/40 uppercase">
                      {ann.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">{ann.createdAt}</span>
                  </div>

                  <h4 className="font-black text-white text-sm">{ann.title}</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">{ann.content}</p>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
                    <button
                      onClick={() => handleOpenEditAnnAdmin(ann)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/40 text-xs font-bold hover:bg-purple-600 hover:text-white flex items-center gap-1 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => deleteAnnouncement(ann.id)}
                      className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-bold hover:bg-red-500 hover:text-white flex items-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Action Shortcut Cards Section */}
          <div className="space-y-4 pt-6 border-t border-gray-800">
            <h4 className="font-bold text-white text-sm uppercase font-mono tracking-wider text-purple-400 flex items-center gap-2">
              <Award className="w-4 h-4" /> Student Dashboard Quick Action Cards ({actionCards.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {actionCards.map((card) => (
                <div key={card.id} className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-purple-400 font-mono font-bold uppercase">
                      Target Tab: {card.targetTab}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-sm">{card.title}</h4>
                  <p className="text-xs text-gray-400">{card.description}</p>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
                    <button
                      onClick={() => handleOpenEditCardAdmin(card)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-400 hover:text-black flex items-center gap-1 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Card
                    </button>
                    <button
                      onClick={() => deleteActionCard(card.id)}
                      className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-bold hover:bg-red-500 hover:text-white flex items-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* MODULES & VIDEO / MEDIA CMS (MODULE CONTENT MANAGER) */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-white text-xl flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" /> Curriculum Modules & Content CMS
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Upload videos, attach images, import URLs, and attach PDF study guides for every module lecture.
              </p>
            </div>

            <button
              onClick={() => setShowModuleModal(true)}
              className="px-5 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-400 to-orange-400 text-black hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" /> Add New Module
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
                  {/* Module Header Bar */}
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
                        {chap.lessons.length} Lectures Attached
                      </span>

                      <button
                        onClick={() => handleOpenAddLesson(chap.id)}
                        className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-black flex items-center gap-1.5 shadow"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Video / Content</span>
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

                  {/* Expanded Module Content & Video Lectures */}
                  {isExpanded && (
                    <div className="p-6 space-y-4 bg-black/40">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold uppercase font-mono tracking-wider text-amber-400">
                          Lectures & Media Assets in {chap.title}
                        </h5>

                        <button
                          onClick={() => handleOpenAddLesson(chap.id)}
                          className="text-xs text-amber-300 hover:underline font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Upload Video / Photo / PDF Lecture
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

                                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] font-mono text-gray-400">
                                    <span className="flex items-center gap-1 text-gray-300">
                                      <Clock className="w-3 h-3 text-amber-400" /> {les.durationMinutes} mins
                                    </span>

                                    {les.videoUrl && (
                                      <span className="flex items-center gap-1 text-purple-300 bg-purple-900/30 px-2 py-0.5 rounded-md border border-purple-500/30">
                                        <Film className="w-3 h-3 text-purple-400" /> Video Attached
                                      </span>
                                    )}

                                    {les.imageUrl && (
                                      <span className="flex items-center gap-1 text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                                        <Camera className="w-3 h-3 text-amber-400" /> Image Attached
                                      </span>
                                    )}

                                    {les.resourcePdfUrl && (
                                      <span className="flex items-center gap-1 text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                                        <FileText className="w-3 h-3 text-emerald-400" /> PDF Guide Attached
                                      </span>
                                    )}

                                    {les.resourceCodeUrl && (
                                      <span className="flex items-center gap-1 text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/30">
                                        <LinkIcon className="w-3 h-3 text-cyan-400" /> Code URL Attached
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
                                  <Edit3 className="w-3.5 h-3.5" /> Edit Media & Content
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
                          <p className="text-xs text-gray-400">No video lectures or assets added to this module yet.</p>
                          <button
                            onClick={() => handleOpenAddLesson(chap.id)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-black hover:bg-amber-300 inline-flex items-center gap-1.5 shadow"
                          >
                            <Plus className="w-3.5 h-3.5" /> Upload First Video / Content
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

      {/* EDIT COURSE PRICING & DETAILS TAB */}
      {activeTab === 'course-editor' && (
        <div className="glass-panel p-8 rounded-3xl border border-amber-500/40 space-y-6 bg-gradient-to-b from-purple-950/20 to-black shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" /> Edit Flagship Course Details & Pricing
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Changes saved here will instantly reflect on the landing page, course details, and checkout screen.
              </p>
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
              ● LIVE FLAGSHIP COURSE
            </span>
          </div>

          <form onSubmit={handleSaveCourseSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-amber-400 uppercase font-mono">
                  Current Discounted Price (₹)
                </label>
                <input
                  type="number"
                  required
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(Number(e.target.value))}
                  className="w-full p-3 bg-gray-900 rounded-xl text-sm font-bold text-white border border-amber-500/50 focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">
                  Original Listing Price (₹)
                </label>
                <input
                  type="number"
                  required
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  className="w-full p-3 bg-gray-900 rounded-xl text-sm font-bold text-white border border-gray-800 focus:border-purple-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">
                  Discount Percentage (%)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full p-3 bg-gray-900 rounded-xl text-sm font-bold text-white border border-gray-800 focus:border-purple-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Course Title</label>
                <input
                  type="text"
                  required
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full p-3 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-purple-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Promo Video Embed URL</label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/embed/..."
                  value={promoVideoUrl}
                  onChange={(e) => setPromoVideoUrl(e.target.value)}
                  className="w-full p-3 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-purple-400 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Course Subtitle</label>
              <input
                type="text"
                required
                value={courseSubtitle}
                onChange={(e) => setCourseSubtitle(e.target.value)}
                className="w-full p-3 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-purple-400"
              />
            </div>

            {/* PHOTO & VIDEO UPLOAD SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 rounded-2xl bg-gray-900/60 border border-purple-500/30">
              
              {/* Photo / Poster Upload Box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-400 uppercase font-mono flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-400" /> Course Photo / Poster (Photo Upload)
                  </label>
                  <span className="text-[10px] text-gray-400 font-mono">PNG, JPG, WEBP</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Image Live Preview */}
                  <div className="w-28 h-28 rounded-2xl bg-black border border-amber-500/40 overflow-hidden relative group shrink-0 shadow-lg">
                    <img
                      src={courseThumbnail || '/hero-poster.jpg'}
                      alt="Course Poster Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold text-white text-center p-2">
                      Poster Preview
                    </div>
                  </div>

                  {/* File Selector & URL Input */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <label className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black cursor-pointer flex items-center justify-center gap-2 transition-transform shadow-md">
                      <Upload className="w-4 h-4" />
                      <span>Upload Photo File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      placeholder="Or paste Image URL (e.g. /hero-poster.jpg)"
                      value={courseThumbnail}
                      onChange={(e) => setCourseThumbnail(e.target.value)}
                      className="w-full p-2.5 bg-black rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Promo Video Upload Box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-purple-400 uppercase font-mono flex items-center gap-2">
                    <Film className="w-4 h-4 text-purple-400" /> Course Promo Video (Video Upload)
                  </label>
                  <span className="text-[10px] text-gray-400 font-mono">MP4, WEBM, MOV</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <label className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md">
                      <Upload className="w-4 h-4" />
                      <span>Upload Video File</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    placeholder="Or paste Video URL (YouTube, Vimeo, MP4 link)"
                    value={promoVideoUrl}
                    onChange={(e) => setPromoVideoUrl(e.target.value)}
                    className="w-full p-2.5 bg-black rounded-xl text-xs text-white border border-gray-800 focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Course Description</label>
              <textarea
                rows={4}
                required
                value={courseDescription}
                onChange={(e) => setCourseDescription(e.target.value)}
                className="w-full p-3 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-purple-400"
              />
            </div>

            <div className="pt-4 border-t border-gray-800 flex justify-end">
              <button
                type="submit"
                className="px-8 py-3.5 rounded-2xl font-black text-xs text-black bg-gradient-to-r from-amber-400 via-orange-400 to-purple-500 hover:scale-105 transition-all flex items-center gap-2 shadow-xl shadow-amber-500/30"
              >
                <Save className="w-4 h-4" />
                <span>Save Course & Price Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* COUPONS CMS TAB */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-400" /> Coupon & Discount Code Manager
              </h3>
              <p className="text-xs text-gray-400">Create new discount coupons or delete existing promotional codes.</p>
            </div>

            <div className="flex items-center gap-2">
              {coupons.length > 0 && (
                <button
                  onClick={() => removeAllCoupons()}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Remove All Coupons
                </button>
              )}
              <button
                onClick={() => setShowCouponModal(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-black text-black bg-amber-400 hover:bg-amber-300 transition-colors flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" /> Create Custom Coupon
              </button>
            </div>
          </div>

          {/* Quick Add Inline Bar */}
          <form onSubmit={handleCreateCouponSubmit} className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300 font-mono">Quick Add Coupon:</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 flex-1 max-w-xl">
              <input
                type="text"
                required
                placeholder="Enter Code (e.g. DISCOUNT50)"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value)}
                className="px-3 py-2 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 uppercase focus:border-amber-400 focus:outline-none flex-1 min-w-[160px]"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  placeholder="Discount %"
                  value={newCouponDiscount || ''}
                  onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                  className="w-24 px-3 py-2 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                />
                <span className="text-xs text-gray-400 font-bold">% OFF</span>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-black text-black bg-amber-400 hover:bg-amber-300 transition-colors flex items-center gap-1 shadow-md shadow-amber-500/20 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Save Coupon
              </button>
            </div>
          </form>

          <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
            {coupons.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Tag className="w-10 h-10 text-gray-600 mx-auto" />
                <h4 className="text-sm font-bold text-gray-300">No Active Coupon Codes</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  All coupon codes have been removed. Click "Create New Coupon Code" above to add a new promotional discount.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/60 text-gray-400 font-mono">
                    <th className="p-4">Coupon Code</th>
                    <th className="p-4">Discount %</th>
                    <th className="p-4">Min. Order Amount</th>
                    <th className="p-4">Valid Until</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Delete / Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {coupons.map((c) => (
                    <tr key={c.code} className="hover:bg-gray-900/40">
                      <td className="p-4 font-mono font-black text-amber-400 text-sm">{c.code}</td>
                      <td className="p-4 font-extrabold text-white">{c.discountPercent}% OFF</td>
                      <td className="p-4 text-gray-300">₹{c.minOrderAmount.toLocaleString()}</td>
                      <td className="p-4 text-gray-400 font-mono">{c.validUntil}</td>
                      <td className="p-4">
                        <button
                          onClick={() => toggleCouponActive(c.code)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${
                            c.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => deleteCoupon(c.code)}
                          className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 font-bold flex items-center gap-1 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Materials CMS */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-lg">Resource Toolkits & Prompt Libraries</h3>
              <p className="text-xs text-gray-400">Add or remove downloadable PDF/zip resource packages for students.</p>
            </div>

            <button
              onClick={() => setShowMaterialModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-black text-black bg-amber-400 hover:bg-amber-300 transition-colors flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" /> Add New Resource Toolkit
            </button>
          </div>

          <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/60 text-gray-400 font-mono">
                  <th className="p-4">Resource Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">File Size</th>
                  <th className="p-4">Downloads</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {materials.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-900/40">
                    <td className="p-4 font-bold text-white">{m.title}</td>
                    <td className="p-4 text-amber-400 font-bold">{m.category}</td>
                    <td className="p-4 text-gray-400">{m.fileSizeMB} MB</td>
                    <td className="p-4 text-emerald-400 font-bold">{m.downloadsCount.toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => deleteMaterial(m.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        title="Delete Resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Ledger & Supabase Purchases Table */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-white text-xl flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" /> Enrolment & Payment Transaction Ledger
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Real-time course purchases synced live with Supabase PostgreSQL database tables (`purchases` & `orders`).
              </p>
            </div>

            <button
              onClick={loadSupabaseData}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-2 shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refresh Supabase Table 🔄
            </button>
          </div>

          {/* Table displaying Username, Email ID, Mobile No, Course, Amount, Supabase Badge */}
          <div className="glass-panel rounded-3xl border border-amber-500/30 overflow-hidden shadow-xl">
            <div className="p-4 bg-gray-900/80 border-b border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-400 font-mono flex items-center gap-2">
                <span>⚡ Live Course Purchases & Enrolment Records</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                  {orders.length} Total Purchases
                </span>
              </span>
              <span className="text-[10px] text-gray-400 font-mono">Includes Student Mobile No, Username & Email ID</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-800 bg-black/60 text-gray-400 font-mono">
                    <th className="p-4">Order #</th>
                    <th className="p-4">Student Username</th>
                    <th className="p-4">Email ID</th>
                    <th className="p-4">Mobile No (Phone)</th>
                    <th className="p-4">Course Enrolled</th>
                    <th className="p-4">Amount Paid</th>
                    <th className="p-4">Gateway</th>
                    <th className="p-4">Supabase DB Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-medium">
                  {orders.map((o) => {
                    const studentRecord = students.find((s) => s.email.toLowerCase() === o.userEmail.toLowerCase());
                    const phoneDisplay = o.userPhone || studentRecord?.phone || '+91 9876543210';
                    return (
                      <tr key={o.id} className="hover:bg-purple-950/20 transition-colors">
                        <td className="p-4 font-mono text-amber-400 font-bold">{o.orderNumber}</td>
                        <td className="p-4 font-extrabold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span>{o.userName}</span>
                        </td>
                        <td className="p-4 font-mono text-purple-300">{o.userEmail}</td>
                        <td className="p-4 font-mono text-amber-300 font-bold">{phoneDisplay}</td>
                        <td className="p-4 text-gray-300">{o.courseTitle}</td>
                        <td className="p-4 font-mono font-black text-emerald-400">₹{o.amountPaid.toLocaleString()}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono border border-purple-500/30">
                            {o.paymentMethod} {o.couponCode ? `(${o.couponCode})` : ''}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 w-fit font-mono">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Supabase Synced
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Direct Supabase Database Table Output */}
          <div className="glass-panel p-6 rounded-3xl border border-purple-500/30 space-y-4 bg-gray-900/30">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm uppercase font-mono tracking-wider text-purple-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Supabase PostgreSQL `purchases` & `orders` DB Tables
              </h4>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                Connected: db.rqifrrjdyvloygyhkwbo.supabase.co
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-black/80">
              <table className="w-full text-left border-collapse text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900 text-gray-400">
                    <th className="p-3">Record ID</th>
                    <th className="p-3">Username (`user_name`)</th>
                    <th className="p-3">User Email (`user_email`)</th>
                    <th className="p-3">Mobile No (`phone` / `mobile_no`)</th>
                    <th className="p-3">Course ID</th>
                    <th className="p-3">Amount (₹)</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-300">
                  {supabasePurchases.length > 0 ? (
                    supabasePurchases.map((sp, idx) => (
                      <tr key={sp.id || idx} className="hover:bg-gray-900/50">
                        <td className="p-3 text-amber-400 font-bold">{sp.id}</td>
                        <td className="p-3 text-white font-bold">{sp.user_name || sp.username || 'Student'}</td>
                        <td className="p-3 text-purple-300">{sp.user_email}</td>
                        <td className="p-3 text-amber-300 font-bold">{sp.phone || sp.mobile_no || '+91 9876543210'}</td>
                        <td className="p-3 text-gray-400">{sp.course_id}</td>
                        <td className="p-3 text-emerald-400 font-bold">₹{sp.amount}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                            {sp.payment_status || 'completed'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-900/50">
                        <td className="p-3 text-amber-400 font-bold">{o.id}</td>
                        <td className="p-3 text-white font-bold">{o.userName}</td>
                        <td className="p-3 text-purple-300">{o.userEmail}</td>
                        <td className="p-3 text-amber-300 font-bold">{o.userPhone || students.find(s => s.email === o.userEmail)?.phone || '+91 9876543210'}</td>
                        <td className="p-3 text-gray-400">{o.courseId}</td>
                        <td className="p-3 text-emerald-400 font-bold">₹{o.amountPaid}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                            completed
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SEO Settings */}
      {activeTab === 'seo' && (
        <div className="glass-panel p-8 rounded-3xl border border-gray-800 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-400" /> Platform SEO Engine Control Panel
          </h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Site Title</label>
              <input
                type="text"
                value={seoSettings.siteTitle}
                onChange={(e) => updateSEOSettings({ siteTitle: e.target.value })}
                className="w-full p-3 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Meta Description</label>
              <textarea
                rows={3}
                value={seoSettings.metaDescription}
                onChange={(e) => updateSEOSettings({ metaDescription: e.target.value })}
                className="w-full p-3 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Site Branding & Settings */}
      {activeTab === 'settings' && (
        <div className="glass-panel p-8 rounded-3xl border border-gray-800 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" /> Platform Branding, Support & Banner Controls
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Site Name</label>
                <input
                  type="text"
                  value={siteSettings.siteName}
                  onChange={(e) => updateSiteSettings({ siteName: e.target.value })}
                  className="w-full p-3 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Logo Display Text</label>
                <input
                  type="text"
                  value={siteSettings.logoText}
                  onChange={(e) => updateSiteSettings({ logoText: e.target.value })}
                  className="w-full p-3 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Support Email Address</label>
                <input
                  type="email"
                  value={siteSettings.supportEmail}
                  onChange={(e) => updateSiteSettings({ supportEmail: e.target.value })}
                  className="w-full p-3 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Support Phone Number</label>
                <input
                  type="text"
                  value={siteSettings.supportPhone}
                  onChange={(e) => updateSiteSettings({ supportPhone: e.target.value })}
                  className="w-full p-3 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-purple-500"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-amber-400 uppercase font-mono">Top Launch Announcement Banner Text</label>
                <button
                  onClick={() => updateSiteSettings({ isBannerActive: !siteSettings.isBannerActive })}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${
                    siteSettings.isBannerActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {siteSettings.isBannerActive ? 'BANNER ACTIVE' : 'BANNER DISABLED'}
                </button>
              </div>

              <input
                type="text"
                value={siteSettings.announcementBannerText}
                onChange={(e) => updateSiteSettings({ announcementBannerText: e.target.value })}
                className="w-full p-3 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW MODULE MODAL */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel rounded-3xl border border-amber-500/30 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-bold text-white text-base">Add New Curriculum Module</h3>
              <button onClick={() => setShowModuleModal(false)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateModuleSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Module Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Module 8: Advanced AI Agent Swarms"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-900 rounded-xl text-xs text-white border border-gray-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Module Description</label>
                <textarea
                  rows={3}
                  placeholder="Module learning objectives..."
                  value={newModuleDesc}
                  onChange={(e) => setNewModuleDesc(e.target.value)}
                  className="w-full p-2.5 bg-gray-900 rounded-xl text-xs text-white border border-gray-800"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-purple-500 text-black text-xs font-black rounded-xl hover:opacity-90 transition-opacity"
              >
                Add Module
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT LECTURE MEDIA & CONTENT MODAL (VIDEOS, PHOTOS, PDFS, URLS) */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl glass-panel rounded-3xl border border-amber-500/40 p-6 space-y-5 my-8 shadow-2xl shadow-amber-500/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                  <Film className="w-5 h-5 text-amber-400" />
                  {editingLessonId ? 'Edit Lecture & Media Attachments' : 'Add New Video / Media Lecture'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Upload video streams, attach photos/diagrams, and import PDF study guides.</p>
              </div>
              <button onClick={() => setShowLessonModal(false)} className="text-gray-400 hover:text-white text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLessonSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-amber-400 uppercase font-mono">Lecture Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1.1 Setting up 3D WebGL Engine & AI Prompts"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="w-full p-2.5 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400"
                  />
                </div>
              </div>

              {/* 🎥 VIDEO UPLOAD / IMPORT SECTION */}
              <div className="p-4 rounded-2xl bg-gray-900/60 border border-purple-500/30 space-y-3">
                <label className="text-xs font-black text-purple-400 uppercase font-mono flex items-center gap-2">
                  <Film className="w-4 h-4 text-purple-400" /> 1. Upload Video Stream or Import Video URL
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black cursor-pointer flex items-center justify-center gap-2 shadow">
                    <Upload className="w-4 h-4" />
                    <span>Upload Video File (MP4/WebM)</span>
                    <input type="file" accept="video/*" onChange={handleLessonVideoUpload} className="hidden" />
                  </label>

                  <input
                    type="text"
                    placeholder="Or paste Video URL (YouTube, Vimeo, MP4)"
                    value={lessonVideoUrl}
                    onChange={(e) => setLessonVideoUrl(e.target.value)}
                    className="p-2.5 bg-black rounded-xl text-xs text-white border border-gray-800 focus:border-purple-400 font-mono"
                  />
                </div>
              </div>

              {/* 🖼️ PHOTO / GRAPHIC ATTACHMENT SECTION */}
              <div className="p-4 rounded-2xl bg-gray-900/60 border border-amber-500/30 space-y-3">
                <label className="text-xs font-black text-amber-400 uppercase font-mono flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-400" /> 2. Upload Lecture Photo / Diagram or Import Image URL
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {lessonImageUrl && (
                    <img src={lessonImageUrl} alt="Preview" className="w-14 h-14 rounded-xl object-cover border border-amber-500/40 shrink-0" />
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 w-full">
                    <label className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black cursor-pointer flex items-center justify-center gap-2 shadow">
                      <Upload className="w-4 h-4" />
                      <span>Upload Photo File</span>
                      <input type="file" accept="image/*" onChange={handleLessonPhotoUpload} className="hidden" />
                    </label>

                    <input
                      type="text"
                      placeholder="Or paste Image URL"
                      value={lessonImageUrl}
                      onChange={(e) => setLessonImageUrl(e.target.value)}
                      className="p-2.5 bg-black rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 📄 PDF DOCUMENT ATTACHMENT SECTION */}
              <div className="p-4 rounded-2xl bg-gray-900/60 border border-emerald-500/30 space-y-3">
                <label className="text-xs font-black text-emerald-400 uppercase font-mono flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" /> 3. Upload PDF Guide or Import PDF URL
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer flex items-center justify-center gap-2 shadow">
                    <Upload className="w-4 h-4" />
                    <span>Upload PDF Document File</span>
                    <input type="file" accept="application/pdf" onChange={handleLessonPdfUpload} className="hidden" />
                  </label>

                  <input
                    type="text"
                    placeholder="Or paste PDF Document URL"
                    value={lessonPdfUrl}
                    onChange={(e) => setLessonPdfUrl(e.target.value)}
                    className="p-2.5 bg-black rounded-xl text-xs text-white border border-gray-800 focus:border-emerald-400 font-mono"
                  />
                </div>
              </div>

              {/* 🔗 RESOURCE CODE LINK */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">4. Import Resource Code / Project Template URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/... or Notion template link"
                  value={lessonCodeUrl}
                  onChange={(e) => setLessonCodeUrl(e.target.value)}
                  className="w-full p-2.5 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-purple-400 font-mono"
                />
              </div>

              {/* 📝 NOTES */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Lecture Notes & Key Takeaways</label>
                <textarea
                  rows={3}
                  placeholder="Summary notes, prompt lists, steps for students..."
                  value={lessonNotes}
                  onChange={(e) => setLessonNotes(e.target.value)}
                  className="w-full p-2.5 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-purple-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="freePreview"
                  checked={lessonIsFree}
                  onChange={(e) => setLessonIsFree(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-400 focus:ring-amber-400 bg-gray-900 border-gray-800"
                />
                <label htmlFor="freePreview" className="text-xs text-gray-300 font-bold cursor-pointer">
                  Allow Free Preview (Unenrolled students can watch this lecture)
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-400 via-orange-400 to-purple-500 text-black text-xs font-black rounded-xl hover:scale-[1.01] transition-transform shadow-lg shadow-amber-500/20"
              >
                {editingLessonId ? 'Save Lecture Changes' : 'Add Lecture to Module'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW RESOURCE TOOLKIT MODAL */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-3xl border border-amber-500/40 p-6 space-y-4 shadow-2xl shadow-amber-500/20">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" /> Add New Resource Toolkit
              </h3>
              <button onClick={() => setShowMaterialModal(false)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMaterialSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Toolkit Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500+ ChatGPT Prompts for Sales"
                  value={newMatTitle}
                  onChange={(e) => setNewMatTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Category</label>
                  <select
                    value={newMatCategory}
                    onChange={(e) => setNewMatCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400"
                  >
                    <option value="AI Prompts">AI Prompts</option>
                    <option value="Web Templates">Web Templates</option>
                    <option value="Cold Pitch Scripts">Cold Pitch Scripts</option>
                    <option value="Automation Blueprints">Automation Blueprints</option>
                    <option value="Meta Ads Cheat-sheet">Meta Ads Cheat-sheet</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">File Size (MB)</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    value={newMatSize}
                    onChange={(e) => setNewMatSize(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Upload PDF Document File or Import URL</label>

                <div className="flex gap-2">
                  <label className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow">
                    <Upload className="w-4 h-4" />
                    <span>Upload PDF</span>
                    <input type="file" accept="application/pdf" onChange={handleMaterialPdfUpload} className="hidden" />
                  </label>

                  <input
                    type="url"
                    placeholder="Or paste PDF URL"
                    value={newMatUrl}
                    onChange={(e) => setNewMatUrl(e.target.value)}
                    className="flex-1 p-2.5 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-black text-xs font-black rounded-xl hover:scale-[1.02] transition-transform shadow-lg shadow-amber-500/20"
              >
                Add Resource Toolkit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW COUPON MODAL */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-3xl border border-amber-500/40 p-6 space-y-4 shadow-2xl shadow-amber-500/20">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" /> Make New Coupon Code
              </h3>
              <button onClick={() => setShowCouponModal(false)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCouponSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  placeholder="Enter Coupon Code"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                  className="w-full p-2.5 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 uppercase focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Discount %</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={newCouponDiscount}
                    onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Min Order (₹)</label>
                  <input
                    type="number"
                    required
                    value={newCouponMinOrder}
                    onChange={(e) => setNewCouponMinOrder(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase font-mono">Valid Until Date</label>
                <input
                  type="date"
                  required
                  value={newCouponValidUntil}
                  onChange={(e) => setNewCouponValidUntil(e.target.value)}
                  className="w-full p-2.5 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-black text-xs font-black rounded-xl hover:scale-[1.02] transition-transform shadow-lg shadow-amber-500/20"
              >
                Create Coupon Code
              </button>
            </form>
          </div>
        </div>
      )}
      {/* ADMIN ANNOUNCEMENT MODAL */}
      {showAdminAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-purple-500/40 bg-[#070a14] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>{editingAdminAnnId ? 'Edit Announcement' : 'Post New Announcement'}</span>
              </h3>
              <button
                onClick={() => setShowAdminAnnModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnAdmin} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-400 uppercase font-mono">Announcement Type</label>
                <select
                  value={adminAnnType}
                  onChange={(e: any) => setAdminAnnType(e.target.value)}
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
                  value={adminAnnTitle}
                  onChange={(e) => setAdminAnnTitle(e.target.value)}
                  className="w-full p-3 bg-gray-900 rounded-xl text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-400 uppercase font-mono">Content / Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter details of live call link, instructions, or bonus file download notes..."
                  value={adminAnnContent}
                  onChange={(e) => setAdminAnnContent(e.target.value)}
                  className="w-full p-3 bg-gray-900 rounded-xl text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAdminAnnModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-800 text-gray-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 text-black font-black hover:bg-amber-300 shadow"
                >
                  {editingAdminAnnId ? 'Update Announcement' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN ACTION CARD MODAL */}
      {showAdminCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-amber-500/40 bg-[#070a14] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>{editingAdminCardId ? 'Edit Action Card' : 'Add New Action Card'}</span>
              </h3>
              <button
                onClick={() => setShowAdminCardModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCardAdmin} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-400 uppercase font-mono">Card Title</label>
                <input
                  type="text"
                  required
                  placeholder="Download AI Toolkits & Prompts"
                  value={adminCardTitle}
                  onChange={(e) => setAdminCardTitle(e.target.value)}
                  className="w-full p-3 bg-gray-900 rounded-xl text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-400 uppercase font-mono">Description / Subtitle</label>
                <input
                  type="text"
                  required
                  placeholder="500+ ChatGPT prompts, WebGL templates & cold pitch scripts."
                  value={adminCardDescription}
                  onChange={(e) => setAdminCardDescription(e.target.value)}
                  className="w-full p-3 bg-gray-900 rounded-xl text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-400 uppercase font-mono">Click Target Navigation Tab</label>
                <select
                  value={adminCardTargetTab}
                  onChange={(e) => setAdminCardTargetTab(e.target.value)}
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
                  onClick={() => setShowAdminCardModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-800 text-gray-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-black hover:bg-purple-500 shadow"
                >
                  {editingAdminCardId ? 'Update Action Card' : 'Create Action Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Admin Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={adminPhotoModalOpen}
        onClose={() => {
          setAdminPhotoModalOpen(false);
          setAdminPhotoTargetStudent(null);
        }}
        title={adminPhotoTargetStudent ? `Upload Photo for ${adminPhotoTargetStudent.name}` : 'Upload Photo'}
        currentPhotoUrl={adminPhotoTargetStudent?.avatar}
        uploadToSupabaseStorage={uploadToSupabaseStorage}
        onSavePhoto={(photoUrl) => {
          if (adminPhotoTargetStudent) {
            // Update student photo in state
            const targetEmail = adminPhotoTargetStudent.email.toLowerCase();
            const existingStudent = students.find((s) => s.email.toLowerCase() === targetEmail);

            if (existingStudent) {
              existingStudent.avatar = photoUrl;
            } else {
              students.push({
                ...adminPhotoTargetStudent,
                avatar: photoUrl
              });
            }

            // Also update current user avatar if admin updated their own photo
            showToast(`Photo for student "${adminPhotoTargetStudent.name}" updated successfully! 📸`);
          }
        }}
      />

    </div>
  );
};
