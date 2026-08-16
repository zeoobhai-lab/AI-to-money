import { Course, StudyMaterial, TestQuiz, User, Order, Coupon, Announcement, SEOSettings, SiteSettings } from '../types';

export const initialUser: User = {
  id: 'usr_student_1',
  name: 'Aadarsh Sharma',
  email: 'aadarsh@sawadhsera.com',
  phone: '+91 98765 43210',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  role: 'student',
  enrolledCourseIds: ['course_income_from_ai'],
  completedLessonIds: [],
  createdAt: '2026-01-15',
  lastActive: 'Just now',
  bio: 'AI Automation Enthusiast & Freelance Developer',
  watchHours: 0,
  activeStreakDays: 0,
  consistencyScore: 'High',
  isBlocked: false
};

export const initialStudents: User[] = [
  initialUser,
  {
    id: 'usr_student_2',
    name: 'Rohan Verma',
    email: 'rohan.verma@example.com',
    phone: '+91 98123 45678',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    role: 'student',
    enrolledCourseIds: ['course_income_from_ai'],
    completedLessonIds: ['les_1_1', 'les_1_2', 'les_1_3'],
    createdAt: '2026-02-10',
    lastActive: '2 hours ago',
    watchHours: 24.5,
    activeStreakDays: 12,
    consistencyScore: 'High',
    isBlocked: false
  },
  {
    id: 'usr_student_3',
    name: 'Priya Patel',
    email: 'priya.patel@gmail.com',
    phone: '+91 97890 12345',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    role: 'student',
    enrolledCourseIds: ['course_income_from_ai'],
    completedLessonIds: ['les_1_1'],
    createdAt: '2026-02-14',
    lastActive: 'Yesterday',
    watchHours: 14.0,
    activeStreakDays: 5,
    consistencyScore: 'High',
    isBlocked: false
  }
];

export const initialAdminUser: User = {
  id: 'usr_admin_1',
  name: 'Aadarsh Rathore (Master Admin)',
  email: 'rathoreaadarsh084@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  role: 'admin',
  enrolledCourseIds: [],
  completedLessonIds: [],
  createdAt: '2025-01-01',
  lastActive: 'Just now',
  bio: 'Founder & Lead Instructor @ Sawadh Sera'
};

export const flagshipCourse: Course = {
  id: 'course_income_from_ai',
  title: 'Income From AI: Complete Blueprint',
  slug: 'income-from-ai',
  subtitle: 'Master 3D Website Making, Full Web Development, AI Automation, Meta Ads, Instagram Growth, & Digital Products',
  description: 'The definitive end-to-end practical system to build, launch, scale, and automate your high-income online business using AI, modern 3D websites, and client acquisition funnels.',
  longDescription: 'Income From AI by Sawadh Sera is engineered for creators, developers, freelancers, and entrepreneurs who want to dominate the digital economy. You will learn step-by-step 3D Website Making, Full Web Development, AI Automation, Meta Ads, Instagram Growth, Digital Products, with 1-to-1 Mentorship, Live Sessions, Community Support, and Lifetime Access.',
  thumbnail: '/hero-poster.jpg',
  promoVideoUrl: '',
  category: 'AI & Web Dev',
  level: 'All Levels',
  language: 'Hinglish',
  mentors: [
    {
      id: 'm1',
      name: 'Aadarsh Rathore',
      title: 'Founder & AI Architect',
      company: 'Founder @ Sawadh Sera',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      bio: 'Built & scaled 3 AI micro-SaaS startups to $50k/mo revenue. Expert in 3D WebGL, LLMs, and high-ticket client acquisition.',
      achievement: 'Generated ₹3.5 Crore in digital sales'
    }
  ],
  rating: 4.98,
  reviewsCount: 0,
  enrolledStudentsCount: 0,
  originalPrice: 14999,
  discountPercentage: 91,
  currentPrice: 1299,
  isFlagship: true,
  learningOutcomes: [
    '✔ 3D Website Making (Website from AI)',
    '✔ Full Web Development (React & TailwindCSS)',
    '✔ AI Automation (Make.com, n8n & Agents)',
    '✔ Meta Ads (High-ROAS Ad Copy & Funnels)',
    '✔ Instagram Growth (Viral Reels & Auto-DMs)',
    '✔ Digital Products (Templates & Storefront Launch)',
    '✔ 1-to-1 Mentorship, Live Sessions & Lifetime Access'
  ],
  chapters: [
    {
      id: 'mod_3d_website',
      courseId: 'course_income_from_ai',
      title: 'Module 1: 3D Website Making',
      description: 'Website from AI',
      order: 1,
      lessons: []
    },
    {
      id: 'mod_full_web',
      courseId: 'course_income_from_ai',
      title: 'Module 2: Full Web Development',
      description: 'Build modern responsive startup landing pages using React 19, Next.js, and TailwindCSS',
      order: 2,
      lessons: []
    },
    {
      id: 'mod_ai_auto',
      courseId: 'course_income_from_ai',
      title: 'Module 3: AI Automation',
      description: 'Automate business workflows with Make.com, n8n, custom webhooks, and autonomous AI agents',
      order: 3,
      lessons: []
    },
    {
      id: 'mod_meta_ads',
      courseId: 'course_income_from_ai',
      title: 'Module 4: Meta Ads Mastery',
      description: 'Run Facebook & Instagram ad campaigns with high-converting creative hooks and 4x–8x ROAS',
      order: 4,
      lessons: []
    },
    {
      id: 'mod_insta_growth',
      courseId: 'course_income_from_ai',
      title: 'Module 5: Instagram Growth',
      description: 'Scale your personal brand organically to 100k+ followers using AI video editing and ManyChat DMs',
      order: 5,
      lessons: []
    },
    {
      id: 'mod_digital_prod',
      courseId: 'course_income_from_ai',
      title: 'Module 6: Digital Products',
      description: 'Create and launch high-margin digital products, ebooks, templates, and automated storefronts',
      order: 6,
      lessons: []
    },
    {
      id: 'mod_live_mentor',
      courseId: 'course_income_from_ai',
      title: 'Module 7: Live Sessions & 1-to-1 Mentorship',
      description: 'Weekly interactive live Q&A sessions, direct portfolio feedback, community support, and lifetime access',
      order: 7,
      lessons: []
    }
  ],
  faqs: [
    { question: 'Is this course suitable for complete beginners?', answer: 'Yes! We start from fundamental principles and build up to advanced 3D website design, AI workflows, and client acquisition step-by-step.' },
    { question: 'How does the Golden Ticket Opportunity work?', answer: 'From every batch, 1 exceptional student is selected based on consistency, project quality, and creativity to collaborate directly with Aadarsh Rathore on a real startup.' },
    { question: 'Do I get lifetime access to all course updates and bonuses?', answer: 'Yes! You get lifetime access to all modules, future AI model updates, and all ₹70,000+ worth of free bonus toolkits.' },
    { question: 'What is the refund policy?', answer: 'We offer a 7-day 100% money-back guarantee if you are not satisfied with the course.' }
  ],
  status: 'published',
  createdAt: '2026-01-10'
};

export const initialCourses: Course[] = [];

export const initialStudyMaterials: StudyMaterial[] = [];

export const initialQuizzes: TestQuiz[] = [];

export const initialOrders: Order[] = [
  {
    id: 'ord_101',
    orderNumber: 'NEX-782910',
    userId: 'usr_student_1',
    userName: 'Aadarsh Sharma',
    userEmail: 'aadarsh@sawadhsera.com',
    userPhone: '+91 98765 43210',
    courseId: 'course_income_from_ai',
    courseTitle: 'Income From AI: Complete Blueprint',
    amountPaid: 4999,
    originalPrice: 14999,
    discountApplied: 10000,
    couponCode: 'LAUNCH50',
    paymentMethod: 'UPI',
    transactionId: 'TXN_8921A90B',
    status: 'completed',
    createdAt: '2026-02-01 14:30'
  },
  {
    id: 'ord_102',
    orderNumber: 'NEX-981245',
    userId: 'usr_student_2',
    userName: 'Rohan Verma',
    userEmail: 'rohan.verma@example.com',
    userPhone: '+91 98123 45678',
    courseId: 'course_income_from_ai',
    courseTitle: 'Income From AI: Complete Blueprint',
    amountPaid: 4999,
    originalPrice: 14999,
    discountApplied: 10000,
    paymentMethod: 'Card',
    transactionId: 'TXN_7712C32D',
    status: 'completed',
    createdAt: '2026-02-10 09:15'
  },
  {
    id: 'ord_103',
    orderNumber: 'NEX-341902',
    userId: 'usr_student_3',
    userName: 'Priya Patel',
    userEmail: 'priya.patel@gmail.com',
    userPhone: '+91 97890 12345',
    courseId: 'course_income_from_ai',
    courseTitle: 'Income From AI: Complete Blueprint',
    amountPaid: 4999,
    originalPrice: 14999,
    discountApplied: 10000,
    couponCode: 'EARLYBIRD',
    paymentMethod: 'UPI',
    transactionId: 'TXN_5541F81E',
    status: 'completed',
    createdAt: '2026-02-14 18:45'
  }
];

export const initialCoupons: Coupon[] = [
  {
    code: 'SAWADSERA3020091',
    discountPercent: 0,
    discountType: 'fixed',
    discountValue: 1298,
    minOrderAmount: 0,
    validUntil: '2028-12-31',
    isActive: true
  },
  {
    code: 'SAWADSERA302009',
    discountPercent: 0,
    discountType: 'fixed',
    discountValue: 1298,
    minOrderAmount: 0,
    validUntil: '2028-12-31',
    isActive: true
  }
];

export const initialAnnouncements: Announcement[] = [];

export const initialSEOSettings: SEOSettings = {
  siteTitle: 'Income From AI | Sawadh Sera - Build Your Online Income',
  metaDescription: 'Income From AI by Sawadh Sera. Master 3D Website Making, Full Web Development, AI Automation, Meta Ads, Instagram Growth & Digital Products.',
  metaKeywords: 'Sawadh Sera, Income From AI, 3D Website Making, Full Web Development, AI Automation, Meta Ads, Instagram Growth, Digital Products, Lifetime Access',
  ogTitle: 'Income From AI by Sawadh Sera',
  ogDescription: 'The practical system to launch and scale your high-income online business using AI, modern 3D websites, and client funnels.',
  ogImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
  canonicalUrl: 'https://sawadhsera.com',
  robotsTxt: 'User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: https://sawadhsera.com/sitemap.xml',
  sitemapEnabled: true
};

export const initialSiteSettings: SiteSettings = {
  siteName: 'Sawadh Sera',
  logoText: 'SAWADH SERA',
  supportEmail: 'support@sawadhsera.com',
  supportPhone: '+91 1800 900 7000',
  announcementBannerText: '🎁 Enroll Today in "Income From AI" & Get ₹70,000+ Worth Free Bonuses + Golden Ticket Opportunity!',
  isBannerActive: true
};

export const initialActionCards = [
  {
    id: 'action_01',
    title: 'Download AI Toolkits & Prompts',
    description: '500+ ChatGPT prompts, WebGL templates & cold pitch scripts.',
    targetTab: 'study-material',
    iconName: 'file-text'
  },
  {
    id: 'action_02',
    title: 'Take Skill Certification Exam',
    description: 'Validate your AI engineering & 3D web skills to earn certificate.',
    targetTab: 'tests',
    iconName: 'award'
  }
];
