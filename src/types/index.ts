export type UserRole = 'student' | 'admin' | 'guest';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  message: string;
  type: ToastType;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  enrolledCourseIds: string[];
  completedLessonIds: string[];
  createdAt: string;
  lastActive: string;
  bio?: string;
  watchHours?: number;
  activeStreakDays?: number;
  consistencyScore?: 'High' | 'Medium' | 'Needs Reminder';
  isBlocked?: boolean;
}

export interface Lesson {
  id: string;
  chapterId: string;
  courseId: string;
  title: string;
  description: string;
  durationMinutes: number;
  videoUrl: string;
  isFreePreview: boolean;
  order: number;
  notesMarkdown?: string;
  resourcePdfUrl?: string;
  resourceCodeUrl?: string;
  imageUrl?: string;
}

export interface Chapter {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Mentor {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar: string;
  bio: string;
  achievement: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  longDescription: string;
  thumbnail: string;
  promoVideoUrl: string;
  category: 'AI & Web Dev';
  level: 'All Levels';
  language: 'Hinglish' | 'English';
  mentors: Mentor[];
  rating: number;
  reviewsCount: number;
  enrolledStudentsCount: number;
  originalPrice: number;
  discountPercentage: number;
  currentPrice: number;
  isFlagship: boolean;
  learningOutcomes: string[];
  chapters: Chapter[];
  faqs: { question: string; answer: string }[];
  status: 'published' | 'draft';
  createdAt: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  category: 'AI Prompts' | 'Web Templates' | 'Cold Pitch Scripts' | 'Automation Blueprints' | 'Meta Ads Cheat-sheet' | 'Instagram Playbook';
  fileUrl: string;
  fileSizeMB: number;
  downloadsCount: number;
  uploadedAt: string;
  isFree: boolean;
  description?: string;
}

export interface Question {
  id: string;
  testId: string;
  questionText: string;
  codeSnippet?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  marks: number;
}

export interface TestQuiz {
  id: string;
  title: string;
  totalDurationMinutes: number;
  totalMarks: number;
  passingScore: number;
  questions: Question[];
  totalAttempts: number;
  isPublished: boolean;
  createdAt: string;
}

export interface TestResult {
  id: string;
  testId: string;
  userId: string;
  userName: string;
  score: number;
  totalMarks: number;
  accuracyPercentage: number;
  timeSpentSeconds: number;
  userAnswers: Record<string, number>;
  submittedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  courseId: string;
  courseTitle: string;
  amountPaid: number;
  originalPrice: number;
  discountApplied: number;
  couponCode?: string;
  paymentMethod: 'UPI' | 'Card' | 'Netbanking' | 'Razorpay';
  transactionId: string;
  status: 'completed' | 'pending' | 'refunded';
  createdAt: string;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  minOrderAmount: number;
  maxDiscount?: number;
  startDate?: string;
  validUntil?: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount?: number;
  applicableCourseId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'live_masterclass' | 'module_update' | 'bonus_drop';
  createdAt: string;
  isUrgent: boolean;
}

export interface SEOSettings {
  siteTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonicalUrl: string;
  robotsTxt: string;
  sitemapEnabled: boolean;
}

export interface ActionShortcutCard {
  id: string;
  title: string;
  description: string;
  targetTab: string;
  iconName?: string;
  badge?: string;
}

export interface SiteSettings {
  siteName: string;
  logoText: string;
  supportEmail: string;
  supportPhone: string;
  announcementBannerText: string;
  isBannerActive: boolean;
}
