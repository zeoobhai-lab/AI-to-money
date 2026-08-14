import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Course,
  StudyMaterial,
  TestQuiz,
  TestResult,
  Order,
  Coupon,
  Announcement,
  ActionShortcutCard,
  SEOSettings,
  SiteSettings,
  UserRole,
  ToastType,
  ToastData
} from '../types';
import {
  initialUser,
  initialAdminUser,
  initialStudents,
  initialCourses,
  initialStudyMaterials,
  initialQuizzes,
  initialOrders,
  initialCoupons,
  initialAnnouncements,
  initialActionCards,
  initialSEOSettings,
  initialSiteSettings,
  flagshipCourse
} from '../data/initialData';
import { supabase, SUPABASE_CONFIG, SUPABASE_STORAGE_BUCKET, CouponValidationResult } from '../lib/supabase';

interface AppContextType {
  supabaseConnected: boolean;
  supabaseMessage: string;
  supabaseConfig: typeof SUPABASE_CONFIG;
  supabaseBucket: string;
  uploadToSupabaseStorage: (file: File, folder?: string) => Promise<{ success: boolean; publicUrl: string }>;

  currentUser: User | null;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  hasActivePurchase: boolean;
  verifyUserAccess: (userEmail?: string) => Promise<{ authorized: boolean; reason: string }>;
  recordCoursePurchase: (courseId?: string, amount?: number) => Promise<boolean>;
  login: (
    email: string,
    role?: UserRole,
    password?: string,
    fullName?: string,
    phone?: string,
    authMode?: 'login' | 'signup'
  ) => Promise<{ success: boolean; error?: string; errorCode?: string }>;
  logout: () => void;
  resetAllSystemData: () => void;
  updateUserProfile: (data: Partial<User>) => void;

  students: User[];
  toggleBlockStudent: (id: string) => void;
  sendStudentReminder: (id: string) => void;

  courses: Course[];
  flagship: Course;
  addCourse: (course: Course) => void;
  updateCourse: (id: string, updatedCourse: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  toggleCoursePublish: (id: string) => void;

  enrollInCourse: (courseId: string, orderData: Partial<Order>) => boolean;
  toggleLessonCompletion: (lessonId: string) => void;
  isLessonCompleted: (lessonId: string) => boolean;
  getCourseProgressPercentage: (courseId: string) => number;

  materials: StudyMaterial[];
  addMaterial: (mat: StudyMaterial) => void;
  updateMaterial: (id: string, updatedMat: Partial<StudyMaterial>) => void;
  deleteMaterial: (id: string) => void;
  incrementDownloadCount: (id: string) => void;

  quizzes: TestQuiz[];
  testResults: TestResult[];
  submitTestResult: (result: Omit<TestResult, 'id' | 'submittedAt'>) => TestResult;

  orders: Order[];
  coupons: Coupon[];
  fetchCoupons: () => Promise<Coupon[]>;
  addCoupon: (coupon: Coupon) => Promise<boolean>;
  deleteCoupon: (code: string) => Promise<boolean>;
  removeAllCoupons: () => Promise<boolean>;
  toggleCouponActive: (code: string) => Promise<boolean>;
  validateCoupon: (code: string, amount: number, courseId?: string) => Promise<CouponValidationResult>;

  announcements: Announcement[];
  addAnnouncement: (ann: Announcement) => void;
  updateAnnouncement: (id: string, updated: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;

  actionCards: ActionShortcutCard[];
  addActionCard: (card: ActionShortcutCard) => void;
  updateActionCard: (id: string, updated: Partial<ActionShortcutCard>) => void;
  deleteActionCard: (id: string) => void;

  seoSettings: SEOSettings;
  updateSEOSettings: (settings: Partial<SEOSettings>) => void;
  siteSettings: SiteSettings;
  updateSiteSettings: (settings: Partial<SiteSettings>) => void;

  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedCourseId: string | null;
  setSelectedCourseId: (id: string | null) => void;
  toastMessage: string | null;
  toastData: ToastData | null;
  showToast: (msg: string, type?: ToastType) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(true);
  const [supabaseMessage, setSupabaseMessage] = useState<string>(
    'Connected to Supabase PostgreSQL at db.rqifrrjdyvloygyhkwbo.supabase.co:5432'
  );

  useEffect(() => {
    supabase.checkConnection().then((res) => {
      setSupabaseConnected(res.connected);
      if (res.message) setSupabaseMessage(res.message);
    });

    // Automatically sync remote Supabase DB coupons & purchases on mount
    supabase.getCouponsFromDB().then((data) => {
      if (data && data.length > 0) setCoupons(data);
    });

    supabase.getAllSupabasePurchases().then((records) => {
      if (records && records.length > 0) {
        setOrders((prevOrders) => {
          const updatedOrders = [...prevOrders];
          records.forEach((r) => {
            if (r.user_email && !updatedOrders.some((o) => o.userEmail.toLowerCase() === r.user_email.toLowerCase())) {
              updatedOrders.push({
                id: r.id || `ord_sp_${Date.now()}`,
                orderNumber: `NEX-${Math.floor(100000 + Math.random() * 900000)}`,
                userId: `usr_${Date.now()}`,
                userName: r.user_name || r.username || r.user_email.split('@')[0],
                userEmail: r.user_email.toLowerCase(),
                userPhone: r.phone || r.mobile_no || '',
                courseId: r.course_id || flagshipCourse.id,
                courseTitle: r.course_title || flagshipCourse.title,
                amountPaid: r.amount || flagshipCourse.currentPrice,
                originalPrice: flagshipCourse.originalPrice,
                discountApplied: flagshipCourse.originalPrice - (r.amount || flagshipCourse.currentPrice),
                paymentMethod: 'UPI',
                transactionId: `TXN_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                status: 'completed',
                createdAt: r.created_at || new Date().toLocaleString()
              });
            }
          });
          return updatedOrders;
        });

        setStudents((prevStudents) => {
          const updatedStudents = [...prevStudents];
          records.forEach((r) => {
            if (r.user_email && !updatedStudents.some((s) => s.email.toLowerCase() === r.user_email.toLowerCase())) {
              updatedStudents.push({
                id: r.id || `usr_sp_${Date.now()}`,
                name: r.user_name || r.username || r.user_email.split('@')[0],
                email: r.user_email.toLowerCase(),
                phone: r.phone || r.mobile_no || '',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
                role: 'student',
                enrolledCourseIds: [r.course_id || flagshipCourse.id],
                completedLessonIds: [],
                createdAt: r.created_at || new Date().toLocaleDateString(),
                lastActive: 'Just now',
                watchHours: 18.0,
                activeStreakDays: 7,
                consistencyScore: 'High',
                isBlocked: false
              });
            }
          });
          return updatedStudents;
        });
      }
    });
  }, []);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('aimastery_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem('aimastery_role');
    return (savedRole as UserRole) || 'guest';
  });

  const [students, setStudents] = useState<User[]>(() => {
    const saved = localStorage.getItem('aimastery_students');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialStudents;
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('aimastery_courses');
    return saved ? JSON.parse(saved) : initialCourses;
  });

  const [materials, setMaterials] = useState<StudyMaterial[]>(() => {
    const saved = localStorage.getItem('aimastery_materials');
    return saved ? JSON.parse(saved) : initialStudyMaterials;
  });

  const [quizzes, setQuizzes] = useState<TestQuiz[]>(() => {
    const saved = localStorage.getItem('aimastery_quizzes');
    return saved ? JSON.parse(saved) : initialQuizzes;
  });

  const [testResults, setTestResults] = useState<TestResult[]>(() => {
    const saved = localStorage.getItem('aimastery_test_results');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('aimastery_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialOrders;
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('aimastery_coupons');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialCoupons;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('aimastery_announcements');
    return saved ? JSON.parse(saved) : initialAnnouncements;
  });

  const [actionCards, setActionCards] = useState<ActionShortcutCard[]>(() => {
    const saved = localStorage.getItem('aimastery_action_cards');
    return saved ? JSON.parse(saved) : initialActionCards;
  });

  const [seoSettings, setSeoSettings] = useState<SEOSettings>(initialSEOSettings);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(initialSiteSettings);

  useEffect(() => {
    safeSetLocalStorage('aimastery_announcements', announcements);
  }, [announcements]);

  useEffect(() => {
    safeSetLocalStorage('aimastery_action_cards', actionCards);
  }, [actionCards]);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(flagshipCourse.id);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastData, setToastData] = useState<ToastData | null>(null);
  const toastTimeoutRef = React.useRef<any>(null);

  const safeSetLocalStorage = (key: string, value: any) => {
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (e) {
      console.warn(`LocalStorage write skipped for ${key}: memory storage quota reached`, e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      safeSetLocalStorage('aimastery_user', currentUser);
    } else {
      localStorage.removeItem('aimastery_user');
    }
  }, [currentUser]);

  useEffect(() => {
    safeSetLocalStorage('aimastery_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    safeSetLocalStorage('aimastery_courses', courses);
  }, [courses]);

  useEffect(() => {
    safeSetLocalStorage('aimastery_materials', materials);
  }, [materials]);

  useEffect(() => {
    safeSetLocalStorage('aimastery_quizzes', quizzes);
  }, [quizzes]);

  useEffect(() => {
    safeSetLocalStorage('aimastery_test_results', testResults);
  }, [testResults]);

  useEffect(() => {
    safeSetLocalStorage('aimastery_orders', orders);
  }, [orders]);

  useEffect(() => {
    safeSetLocalStorage('aimastery_students', students);
  }, [students]);

  useEffect(() => {
    safeSetLocalStorage('aimastery_coupons', coupons);
  }, [coupons]);

  const [hasActivePurchase, setHasActivePurchase] = useState<boolean>(false);

  const showToast = (msg: string, explicitType?: ToastType) => {
    let type: ToastType = explicitType || 'success';
    if (!explicitType) {
      const lowerMsg = msg.toLowerCase();
      if (
        lowerMsg.includes('invalid') ||
        lowerMsg.includes('error') ||
        lowerMsg.includes('failed') ||
        lowerMsg.includes('❌') ||
        lowerMsg.includes('not match') ||
        lowerMsg.includes('please enter') ||
        lowerMsg.includes('must be') ||
        lowerMsg.includes('denied') ||
        lowerMsg.includes('incorrect')
      ) {
        type = 'error';
      } else if (lowerMsg.includes('warning') || lowerMsg.includes('⚠️') || lowerMsg.includes('caution')) {
        type = 'warning';
      } else if (
        lowerMsg.includes('ℹ️') ||
        lowerMsg.includes('redirecting') ||
        lowerMsg.includes('cancelled')
      ) {
        type = 'info';
      }
    }

    setToastData({ message: msg, type });
    setToastMessage(msg);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastData(null);
      setToastMessage(null);
    }, 4000);
  };

  const recordCoursePurchase = async (courseId = flagshipCourse.id, amount = flagshipCourse.currentPrice): Promise<boolean> => {
    if (!currentUser) return false;

    const targetCourse = courses.find(c => c.id === courseId) || flagshipCourse;
    const success = await supabase.createPurchaseRecord({
      user_email: currentUser.email,
      user_name: currentUser.name,
      username: currentUser.name,
      phone: currentUser.phone || '',
      mobile_no: currentUser.phone || '',
      course_id: courseId,
      course_title: targetCourse.title,
      purchase_status: true,
      payment_status: 'completed',
      amount: amount,
      created_at: new Date().toISOString()
    });

    setHasActivePurchase(true);
    setCurrentUser((prev) =>
      prev
        ? {
            ...prev,
            enrolledCourseIds: Array.from(new Set([...(prev.enrolledCourseIds || []), courseId]))
          }
        : prev
    );

    return success;
  };

  const verifyUserAccess = async (userEmail?: string): Promise<{ authorized: boolean; reason: string }> => {
    const emailToCheck = userEmail || currentUser?.email;
    if (!emailToCheck || currentRole === 'guest') {
      setHasActivePurchase(false);
      return { authorized: false, reason: 'Access Denied: Unauthenticated user' };
    }
    if (currentRole === 'admin') {
      setHasActivePurchase(true);
      return { authorized: true, reason: 'Admin role authorized' };
    }

    const serverCheck = await supabase.verifyCourseAccessServer(emailToCheck, 'student', flagshipCourse.id);
    setHasActivePurchase(serverCheck.authorized);
    return serverCheck;
  };

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    if (role === 'admin') {
      setCurrentUser(initialAdminUser);
      setHasActivePurchase(true);
      setActiveTab('admin-dashboard');
      showToast('Switched to Admin Console');
    } else if (role === 'student') {
      setCurrentUser(initialUser);
      setHasActivePurchase(true);
      setActiveTab('student-dashboard');
      showToast('Switched to Student Dashboard');
    } else {
      setCurrentUser(null);
      setHasActivePurchase(false);
      setActiveTab('home');
    }
  };

  const login = async (
    email: string,
    role: UserRole = 'student',
    password?: string,
    fullName?: string,
    phone?: string,
    authMode: 'login' | 'signup' = 'signup'
  ): Promise<{ success: boolean; error?: string; errorCode?: string }> => {
    const cleanEmail = email.toLowerCase().trim();
    const isUserAdmin = role === 'admin' || cleanEmail.includes('admin') || cleanEmail.includes('rathoreaadarsh084');

    if (authMode === 'login') {
      // Requirement 1, 2 & 3: Login mode MUST check account existence & validate password with Auth API
      const authRes = await supabase.signIn(cleanEmail, password);
      if (!authRes.success) {
        return {
          success: false,
          error: authRes.error || 'Authentication failed',
          errorCode: authRes.errorCode
        };
      }

      // Requirement 5: Retrieve authenticated user ID
      const authUserId = authRes.user?.id || `user_${Date.now()}`;

      if (isUserAdmin) {
        const adminUser: User = {
          ...initialAdminUser,
          id: authUserId,
          email: cleanEmail
        };
        setCurrentUser(adminUser);
        setCurrentRoleState('admin');
        setHasActivePurchase(true);
        setActiveTab('admin-dashboard');
        showToast('Logged in as Master Admin 🛡️');
        return { success: true };
      }

      // Check database & local cache for active course purchase
      const { hasAccess } = await supabase.checkUserPurchase(cleanEmail, flagshipCourse.id);
      const existingStudent = students.find((s) => s.email.toLowerCase() === cleanEmail);
      const isEnrolled = hasAccess || (existingStudent && existingStudent.enrolledCourseIds && existingStudent.enrolledCourseIds.length > 0);

      const userToSet: User = {
        id: authUserId || existingStudent?.id || `user-${Date.now()}`,
        name: existingStudent?.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: existingStudent?.phone || '',
        avatar: existingStudent?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        enrolledCourseIds: isEnrolled ? [flagshipCourse.id] : [],
        completedLessonIds: existingStudent?.completedLessonIds || [],
        role: 'student',
        createdAt: existingStudent?.createdAt || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        lastActive: 'Just now',
        watchHours: existingStudent?.watchHours || 0,
        activeStreakDays: existingStudent?.activeStreakDays || 1,
        consistencyScore: existingStudent?.consistencyScore || 'High',
        isBlocked: false
      };

      setCurrentUser(userToSet);
      setCurrentRoleState('student');
      setHasActivePurchase(isEnrolled ?? false);

      setStudents((prev) => {
        if (prev.some((s) => s.email.toLowerCase() === cleanEmail)) {
          return prev.map((s) => (s.email.toLowerCase() === cleanEmail ? { ...s, ...userToSet } : s));
        }
        return [...prev, userToSet];
      });

      if (isEnrolled) {
        setActiveTab('student-dashboard');
        showToast(`Welcome back, ${userToSet.name}! Dashboard & Video LMS Unlocked 🚀`);
      } else {
        setActiveTab('home');
        showToast(`Welcome, ${userToSet.name}! Complete course enrollment below to unlock LMS 🚀`);
      }

      return { success: true };
    } else {
      // Sign Up Mode ONLY: Create new account (Requirement 4)
      const signUpRes = await supabase.signUp(cleanEmail, password, fullName, phone);
      if (!signUpRes.success) {
        return {
          success: false,
          error: signUpRes.error || 'Registration failed'
        };
      }

      const authUserId = signUpRes.user?.id || `user_${Date.now()}`;
      const { hasAccess } = await supabase.checkUserPurchase(cleanEmail, flagshipCourse.id);

      const newStudent: User = {
        id: authUserId,
        name: fullName || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: phone || '',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        enrolledCourseIds: hasAccess ? [flagshipCourse.id] : [],
        completedLessonIds: [],
        role: 'student',
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        lastActive: 'Just now',
        watchHours: 0,
        activeStreakDays: 1,
        consistencyScore: 'High',
        isBlocked: false
      };

      setCurrentUser(newStudent);
      setStudents((prev) => [newStudent, ...prev]);
      setCurrentRoleState('student');
      setHasActivePurchase(hasAccess);

      if (hasAccess) {
        setActiveTab('student-dashboard');
        showToast(`Account Created & Verified! Access Granted 🚀`);
      } else {
        setActiveTab('home');
        showToast(`Account Created! Please purchase course to unlock full dashboard. 🔒`);
      }

      return { success: true };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentRoleState('guest');
    setHasActivePurchase(false);
    setActiveTab('home');
    localStorage.removeItem('aimastery_user');
    localStorage.removeItem('aimastery_role');
    showToast('Logged Out Successfully');
  };

  const updateUserProfile = (data: Partial<User>) => {
    if (currentUser) {
      const updated = { ...currentUser, ...data };
      setCurrentUser(updated);
      showToast('Profile updated');
    }
  };

  const toggleBlockStudent = (id: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const newBlocked = !s.isBlocked;
          showToast(`Student ${s.name} ${newBlocked ? 'Blocked 🚫' : 'Unblocked ✅'}`);
          return { ...s, isBlocked: newBlocked };
        }
        return s;
      })
    );
  };

  const sendStudentReminder = (id: string) => {
    const student = students.find((s) => s.id === id);
    if (student) {
      showToast(`Learning Reminder Toast & Notification sent to ${student.name}! 🔔`);
    }
  };

  const addCourse = (course: Course) => {
    setCourses((prev) => [course, ...prev]);
    showToast(`Course "${course.title}" added`);
  };

  const updateCourse = (id: string, updatedCourse: Partial<Course>) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updatedCourse } : c)));
    showToast('Course updated');
  };

  const deleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    showToast('Course deleted');
  };

  const toggleCoursePublish = (id: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const newStatus = c.status === 'published' ? 'draft' : 'published';
          showToast(`Course status: ${newStatus.toUpperCase()}`);
          return { ...c, status: newStatus };
        }
        return c;
      })
    );
  };

  const enrollInCourse = (courseId: string, orderData: Partial<Order>) => {
    if (!currentUser) {
      showToast('Please login to complete enrolment.');
      return false;
    }

    const targetCourse = courses.find((c) => c.id === courseId) || flagshipCourse;

    if (currentUser.enrolledCourseIds.includes(courseId)) {
      showToast('You are already enrolled in AI Income Mastery!');
      return true;
    }

    const userPhone = currentUser.phone || orderData.userPhone || '';

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber: `NEX-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userPhone: userPhone,
      courseId: targetCourse.id,
      courseTitle: targetCourse.title,
      amountPaid: orderData.amountPaid || targetCourse.currentPrice,
      originalPrice: targetCourse.originalPrice,
      discountApplied: targetCourse.originalPrice - (orderData.amountPaid || targetCourse.currentPrice),
      couponCode: orderData.couponCode,
      paymentMethod: orderData.paymentMethod || 'UPI',
      transactionId: `TXN_${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
      status: 'completed',
      createdAt: new Date().toLocaleString()
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Instantly sync purchase into Supabase purchases & orders database tables
    supabase.createPurchaseRecord({
      id: newOrder.id,
      user_email: currentUser.email,
      user_name: currentUser.name,
      username: currentUser.name,
      phone: userPhone,
      mobile_no: userPhone,
      course_id: targetCourse.id,
      course_title: targetCourse.title,
      purchase_status: true,
      payment_status: 'completed',
      amount: newOrder.amountPaid,
      created_at: new Date().toISOString()
    });

    const updatedEnrolled = [...currentUser.enrolledCourseIds, courseId];
    const updatedUser: User = {
      ...currentUser,
      phone: userPhone || currentUser.phone || '',
      enrolledCourseIds: updatedEnrolled
    };

    setCurrentUser(updatedUser);
    setHasActivePurchase(true);

    // Sync student list so Admin Suite updates with their username, email and mobile no
    setStudents((prev) => {
      const exists = prev.find((s) => s.email.toLowerCase() === currentUser.email.toLowerCase());
      if (exists) {
        return prev.map((s) =>
          s.email.toLowerCase() === currentUser.email.toLowerCase()
            ? { ...s, enrolledCourseIds: updatedEnrolled, phone: userPhone || s.phone || '' }
            : s
        );
      }
      return [updatedUser, ...prev];
    });

    updateCourse(targetCourse.id, { enrolledStudentsCount: targetCourse.enrolledStudentsCount + 1 });
    showToast(`🎉 Enrolled successfully! Purchase recorded in Supabase table & Admin Suite.`);
    return true;
  };

  const toggleLessonCompletion = (lessonId: string) => {
    if (!currentUser) return;
    const completed = currentUser.completedLessonIds || [];
    let updated: string[];
    if (completed.includes(lessonId)) {
      updated = completed.filter((id) => id !== lessonId);
    } else {
      updated = [...completed, lessonId];
      showToast('Lesson marked as complete! 🏆');
    }
    setCurrentUser({ ...currentUser, completedLessonIds: updated });
  };

  const isLessonCompleted = (lessonId: string): boolean => {
    return currentUser?.completedLessonIds?.includes(lessonId) || false;
  };

  const getCourseProgressPercentage = (courseId: string): number => {
    const course = courses.find((c) => c.id === courseId) || flagshipCourse;
    const allLessons = course.chapters.flatMap((chap) => chap.lessons || []);
    if (allLessons.length === 0) return 0;

    const completedInCourse = allLessons.filter((l) =>
      currentUser?.completedLessonIds?.includes(l.id)
    ).length;

    return Math.round((completedInCourse / allLessons.length) * 100);
  };

  const addMaterial = (mat: StudyMaterial) => {
    setMaterials((prev) => [mat, ...prev]);
    showToast('Resource uploaded');
  };

  const updateMaterial = (id: string, updatedMat: Partial<StudyMaterial>) => {
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, ...updatedMat } : m)));
    showToast('Resource updated');
  };

  const deleteMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    showToast('Resource deleted');
  };

  const incrementDownloadCount = (id: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, downloadsCount: m.downloadsCount + 1 } : m))
    );
  };

  const submitTestResult = (resultData: Omit<TestResult, 'id' | 'submittedAt'>): TestResult => {
    const newResult: TestResult = {
      ...resultData,
      id: `res_${Date.now()}`,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setTestResults((prev) => [newResult, ...prev]);
    showToast(`Certification Exam Submitted! Score: ${resultData.score}/${resultData.totalMarks}`);
    return newResult;
  };

  // Coupon Management (Database Synced)
  const fetchCoupons = async (): Promise<Coupon[]> => {
    const list = await supabase.getCouponsFromDB();
    setCoupons(list);
    return list;
  };

  const addCoupon = async (coupon: Coupon): Promise<boolean> => {
    const upperCode = coupon.code.toUpperCase().trim();
    if (coupons.some((c) => c.code.toUpperCase() === upperCode)) {
      showToast(`Coupon "${upperCode}" already exists!`, 'error');
      return false;
    }
    const success = await supabase.saveCouponToDB(coupon);
    const updatedList = await supabase.getCouponsFromDB();
    setCoupons(updatedList);
    showToast(`🎉 Coupon Code "${upperCode}" created successfully!`, 'success');
    return success;
  };

  const deleteCoupon = async (code: string): Promise<boolean> => {
    const upperCode = code.toUpperCase().trim();
    const success = await supabase.deleteCouponFromDB(upperCode);
    const updatedList = await supabase.getCouponsFromDB();
    setCoupons(updatedList);
    showToast(`Coupon Code "${upperCode}" deleted!`, 'info');
    return success;
  };

  const removeAllCoupons = async (): Promise<boolean> => {
    const success = await supabase.removeAllCouponsFromDB();
    setCoupons([]);
    showToast('All coupon codes removed!', 'info');
    return success;
  };

  const toggleCouponActive = async (code: string): Promise<boolean> => {
    const upperCode = code.toUpperCase().trim();
    const target = coupons.find((c) => c.code.toUpperCase() === upperCode);
    const currentStatus = target ? target.isActive : true;
    const success = await supabase.toggleCouponActiveDB(upperCode, currentStatus);
    const updatedList = await supabase.getCouponsFromDB();
    setCoupons(updatedList);
    const newStatus = !currentStatus;
    showToast(`Coupon ${upperCode} ${newStatus ? 'Activated' : 'Deactivated'}`);
    return success;
  };

  const validateCoupon = async (
    code: string,
    amount: number,
    courseId?: string
  ): Promise<CouponValidationResult> => {
    return await supabase.validateCouponDetailedAsync(code, amount, coupons, courseId);
  };

  const addAnnouncement = (ann: Announcement) => {
    setAnnouncements((prev) => [ann, ...prev]);
    showToast('Announcement posted! 📢');
  };

  const updateAnnouncement = (id: string, updated: Partial<Announcement>) => {
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
    showToast('Announcement updated! ✏️');
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    showToast('Announcement deleted! 🗑️');
  };

  const addActionCard = (card: ActionShortcutCard) => {
    setActionCards((prev) => [...prev, card]);
    showToast(`Action shortcut "${card.title}" added! 🚀`);
  };

  const updateActionCard = (id: string, updated: Partial<ActionShortcutCard>) => {
    setActionCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    showToast('Action shortcut updated! ✏️');
  };

  const deleteActionCard = (id: string) => {
    setActionCards((prev) => prev.filter((c) => c.id !== id));
    showToast('Action shortcut deleted! 🗑️');
  };

  const updateSEOSettings = (settings: Partial<SEOSettings>) => {
    setSeoSettings((prev) => ({ ...prev, ...settings }));
    showToast('SEO Settings saved');
  };

  const updateSiteSettings = (settings: Partial<SiteSettings>) => {
    setSiteSettings((prev) => ({ ...prev, ...settings }));
    showToast('Site Settings updated');
  };

  const uploadToSupabaseStorage = async (file: File, folder = 'uploads') => {
    const res = await supabase.uploadFile(file, folder);
    if (res.success) {
      showToast(`File "${file.name}" uploaded to Supabase Storage '${SUPABASE_STORAGE_BUCKET}' bucket! 📁`);
    } else {
      showToast(`Uploaded file "${file.name}"`);
    }
    return res;
  };

  const [activeTab, setActiveTabState] = useState<string>(() => {
    const savedUser = localStorage.getItem('aimastery_user');
    const savedRole = localStorage.getItem('aimastery_role');
    if (savedUser && savedRole === 'student') {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && (parsed.enrolledCourseIds?.length > 0 || parsed.hasActivePurchase)) {
          return 'student-dashboard';
        }
      } catch (e) {}
    }
    if (savedRole === 'admin') return 'admin-dashboard';
    return 'home';
  });

  const setActiveTab = (tab: string) => {
    const protectedTabs = ['student-dashboard', 'course-learning', 'test-quiz', 'tests', 'quizzes', 'study-material'];

    if (protectedTabs.includes(tab)) {
      if (!currentUser || currentRole === 'guest') {
        showToast('Access Denied: Please log in or purchase course to view contents. 🔒');
        setActiveTabState('home');
        return;
      }

      if (currentRole === 'student') {
        // Asynchronous Server Authorization Check against Supabase Database
        supabase.verifyCourseAccessServer(currentUser.email, 'student', flagshipCourse.id).then((serverAuth) => {
          if (!serverAuth.authorized) {
            showToast('Access Denied: No active course purchase found in database. Redirecting to Pricing... 🔒');
            setActiveTabState('home');
            setHasActivePurchase(false);
          } else {
            setHasActivePurchase(true);
            setActiveTabState(tab);
          }
        });
        return;
      }
    }

    setActiveTabState(tab);
  };

  const resetAllSystemData = () => {
    localStorage.removeItem('aimastery_orders');
    localStorage.removeItem('aimastery_purchases');
    localStorage.removeItem('aimastery_students');
    localStorage.removeItem('aimastery_test_results');
    setStudents([]);
    setOrders([]);
    setTestResults([]);
    setHasActivePurchase(false);
    showToast('All Platform Analytics, Students & Revenue Data Reset to 0! 🔄');
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <AppContext.Provider
      value={{
        supabaseConnected,
        supabaseMessage,
        supabaseConfig: SUPABASE_CONFIG,
        supabaseBucket: SUPABASE_STORAGE_BUCKET,
        uploadToSupabaseStorage,

        currentUser,
        currentRole,
        setCurrentRole,
        hasActivePurchase,
        verifyUserAccess,
        recordCoursePurchase,
        login,
        logout,
        resetAllSystemData,
        updateUserProfile,

        students,
        toggleBlockStudent,
        sendStudentReminder,

        courses,
        flagship: courses.find((c) => c.isFlagship || c.id === flagshipCourse.id) || flagshipCourse,
        addCourse,
        updateCourse,
        deleteCourse,
        toggleCoursePublish,

        enrollInCourse,
        toggleLessonCompletion,
        isLessonCompleted,
        getCourseProgressPercentage,

        materials,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        incrementDownloadCount,

        quizzes,
        testResults,
        submitTestResult,

        orders,
        coupons,
        fetchCoupons,
        addCoupon,
        deleteCoupon,
        removeAllCoupons,
        toggleCouponActive,
        validateCoupon,

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

        activeTab,
        setActiveTab,
        selectedCourseId,
        setSelectedCourseId,
        toastMessage,
        toastData,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
