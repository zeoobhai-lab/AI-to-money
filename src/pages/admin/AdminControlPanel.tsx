import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  supabase,
  ProfileRecord,
  ProductRecord,
  OrderRecord,
  PaymentEventRecord,
  RefundRecord,
  DashboardStats,
  RevenueAnalytics
} from '../../lib/supabase';
import {
  ShieldCheck,
  Users,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  RotateCcw,
  BarChart3,
  Settings as SettingsIcon,
  Search,
  Download,
  Plus,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  FileText,
  Lock,
  ArrowUpRight,
  Copy,
  Check,
  Sparkles,
  UserCheck
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export const AdminControlPanel: React.FC = () => {
  const { currentUser, currentRole, showToast, setActiveTab: setGlobalActiveTab } = useApp();

  // Active Admin Sidebar Tab (Phases 4-9)
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'new-registrations'
    | 'all-customers'
    | 'all-purchases'
    | 'products'
    | 'payments'
    | 'refunds'
    | 'revenue-analytics'
    | 'settings'
  >('overview');

  // Loading & Refresh State
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Data States
  const [stats, setStats] = useState<DashboardStats>({
    totalRegistrations: 0,
    registrationsToday: 0,
    registrationsThisMonth: 0,
    totalOrders: 0,
    successfulPurchases: 0,
    pendingPayments: 0,
    failedPayments: 0,
    totalRevenuePaise: 0,
    totalRefundsPaise: 0,
    netRevenuePaise: 0,
    totalRevenueInr: 0,
    totalRefundsInr: 0,
    netRevenueInr: 0
  });

  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [paymentEvents, setPaymentEvents] = useState<PaymentEventRecord[]>([]);
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [analytics, setAnalytics] = useState<RevenueAnalytics>({
    revenueTrend: [],
    registrationsTrend: [],
    productSales: [],
    refundStats: { totalRefunds: 0, refundedAmountInr: 0, refundRatePercent: 0 },
    averageOrderValueInr: 0
  });

  // Analytics Timeframe Filter
  const [analyticsRange, setAnalyticsRange] = useState<'today' | '7days' | '30days' | '1year' | 'all'>('30days');

  // Search & Filter States
  const [registrationSearch, setRegistrationSearch] = useState('');
  const [registrationDateFilter, setRegistrationDateFilter] = useState('');
  const [registrationPage, setRegistrationPage] = useState(1);
  const registrationsPerPage = 10;

  const [purchasesSearch, setPurchasesSearch] = useState('');
  const [purchasesStatusFilter, setPurchasesStatusFilter] = useState('all');
  const [purchasesDateFilter, setPurchasesDateFilter] = useState('');
  const [purchasesSort, setPurchasesSort] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [purchasesPage, setPurchasesPage] = useState(1);
  const purchasesPerPage = 10;

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerStatusFilter, setCustomerStatusFilter] = useState('all');

  // Modals
  const [selectedCustomer, setSelectedCustomer] = useState<ProfileRecord | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [selectedPaymentEvent, setSelectedPaymentEvent] = useState<PaymentEventRecord | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<ProductRecord> | null>(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundTargetOrder, setRefundTargetOrder] = useState<OrderRecord | null>(null);
  const [refundAmountInput, setRefundAmountInput] = useState<string>('');
  const [refundReasonInput, setRefundReasonInput] = useState<string>('Customer Request');
  const [isRefunding, setIsRefunding] = useState(false);

  // Copied State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Sync / Load All Data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        fetchedStats,
        fetchedProfiles,
        fetchedOrders,
        fetchedProducts,
        fetchedEvents,
        fetchedRefunds,
        fetchedAnalytics
      ] = await Promise.all([
        supabase.getDashboardStats(),
        supabase.getAllProfiles(),
        supabase.getAllOrders(),
        supabase.getAllProducts(),
        supabase.getAllPaymentEvents(),
        supabase.getAllRefunds(),
        supabase.getRevenueAnalytics(analyticsRange)
      ]);

      setStats(fetchedStats);
      setProfiles(fetchedProfiles);
      setOrders(fetchedOrders);
      setProducts(fetchedProducts);
      setPaymentEvents(fetchedEvents);
      setRefunds(fetchedRefunds);
      setAnalytics(fetchedAnalytics);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Error loading admin dashboard data:', err);
      showToast('Error refreshing database records: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [analyticsRange, showToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // URL sync for /admin
  useEffect(() => {
    if (window.location.pathname !== '/admin') {
      window.history.pushState(null, '', '/admin');
    }
  }, []);

  // --- FILTERED NEW REGISTRATIONS (PHASE 6) ---
  const filteredRegistrations = useMemo(() => {
    let result = [...profiles];

    if (registrationSearch.trim()) {
      const q = registrationSearch.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.phone && p.phone.toLowerCase().includes(q)) ||
          p.id.toLowerCase().includes(q)
      );
    }

    if (registrationDateFilter) {
      result = result.filter((p) => p.created_at.startsWith(registrationDateFilter));
    }

    // Sort newest to oldest
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return result;
  }, [profiles, registrationSearch, registrationDateFilter]);

  const paginatedRegistrations = useMemo(() => {
    const start = (registrationPage - 1) * registrationsPerPage;
    return filteredRegistrations.slice(start, start + registrationsPerPage);
  }, [filteredRegistrations, registrationPage]);

  const totalRegistrationPages = Math.ceil(filteredRegistrations.length / registrationsPerPage) || 1;

  // --- FILTERED PURCHASES (PHASE 7) ---
  const filteredPurchases = useMemo(() => {
    let result = [...orders];

    if (purchasesSearch.trim()) {
      const q = purchasesSearch.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          (o.customer_email && o.customer_email.toLowerCase().includes(q)) ||
          (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
          (o.razorpay_order_id && o.razorpay_order_id.toLowerCase().includes(q)) ||
          (o.razorpay_payment_id && o.razorpay_payment_id.toLowerCase().includes(q))
      );
    }

    if (purchasesStatusFilter !== 'all') {
      result = result.filter((o) => o.payment_status === purchasesStatusFilter);
    }

    if (purchasesDateFilter) {
      result = result.filter((o) => o.purchased_at.startsWith(purchasesDateFilter));
    }

    // Sort
    result.sort((a, b) => {
      if (purchasesSort === 'date-desc') {
        return new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime();
      }
      if (purchasesSort === 'date-asc') {
        return new Date(a.purchased_at).getTime() - new Date(b.purchased_at).getTime();
      }
      if (purchasesSort === 'amount-desc') {
        return Number(b.total_amount_paise) - Number(a.total_amount_paise);
      }
      if (purchasesSort === 'amount-asc') {
        return Number(a.total_amount_paise) - Number(b.total_amount_paise);
      }
      return 0;
    });

    return result;
  }, [orders, purchasesSearch, purchasesStatusFilter, purchasesDateFilter, purchasesSort]);

  const paginatedPurchases = useMemo(() => {
    const start = (purchasesPage - 1) * purchasesPerPage;
    return filteredPurchases.slice(start, start + purchasesPerPage);
  }, [filteredPurchases, purchasesPage]);

  const totalPurchasesPages = Math.ceil(filteredPurchases.length / purchasesPerPage) || 1;

  // --- FILTERED CUSTOMERS (PHASE 8) ---
  const filteredCustomers = useMemo(() => {
    let result = [...profiles];

    if (customerSearch.trim()) {
      const q = customerSearch.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.phone && p.phone.toLowerCase().includes(q))
      );
    }

    if (customerStatusFilter !== 'all') {
      result = result.filter((p) => p.account_status === customerStatusFilter);
    }

    return result;
  }, [profiles, customerSearch, customerStatusFilter]);

  // Customer purchase statistics helper
  const getCustomerOrderStats = useCallback(
    (customerEmail: string, customerId: string) => {
      const customerOrders = orders.filter(
        (o) =>
          (o.user_id && o.user_id === customerId) ||
          (o.customer_email && o.customer_email.toLowerCase() === customerEmail.toLowerCase())
      );
      const paidOrders = customerOrders.filter(
        (o) => o.payment_status === 'paid' || o.payment_status === 'refunded' || o.payment_status === 'partially_refunded'
      );
      const totalSpentPaise = paidOrders.reduce((sum, o) => sum + (Number(o.total_amount_paise) || 0), 0);
      const customerRefunds = refunds.filter((r) =>
        customerOrders.some((o) => o.id === r.order_id)
      );

      return {
        allOrders: customerOrders,
        totalOrders: customerOrders.length,
        successfulPurchases: paidOrders.length,
        totalSpentInr: Math.round(totalSpentPaise / 100),
        refundHistory: customerRefunds
      };
    },
    [orders, refunds]
  );

  // Export to CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      showToast('No records available to export', 'warning');
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((obj) =>
      Object.values(obj)
        .map((val) => {
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${data.length} records to CSV!`, 'success');
  };

  // Process Refund Submit Handler
  const handleProcessRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTargetOrder) return;

    const amountInr = parseFloat(refundAmountInput);
    if (isNaN(amountInr) || amountInr <= 0) {
      showToast('Please enter a valid refund amount in ₹', 'error');
      return;
    }

    const amountPaise = Math.round(amountInr * 100);
    const maxRefundablePaise = Number(refundTargetOrder.total_amount_paise) - Number(refundTargetOrder.refunded_amount_paise || 0);

    if (amountPaise > maxRefundablePaise) {
      showToast(`Maximum refundable amount is ₹${(maxRefundablePaise / 100).toFixed(2)}`, 'error');
      return;
    }

    setIsRefunding(true);
    try {
      const response = await fetch('/api/admin/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: refundTargetOrder.id,
          paymentId: refundTargetOrder.razorpay_payment_id,
          amountPaise,
          reason: refundReasonInput
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData?.error || 'Failed to process refund');
      }

      showToast(`Refund of ₹${amountInr.toFixed(2)} processed successfully!`, 'success');
      setRefundModalOpen(false);
      setRefundTargetOrder(null);
      await loadDashboardData();
    } catch (err: any) {
      showToast(`Refund error: ${err.message}`, 'error');
    } finally {
      setIsRefunding(false);
    }
  };

  // Product Save / Edit Handler
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price_paise) {
      showToast('Product name and price are required', 'error');
      return;
    }

    try {
      const res = await supabase.saveProduct(editingProduct);
      if (res.success) {
        showToast('Product saved successfully!', 'success');
        setProductModalOpen(false);
        setEditingProduct(null);
        await loadDashboardData();
      } else {
        showToast('Error saving product: ' + res.error, 'error');
      }
    } catch (e: any) {
      showToast('Product save exception: ' + e.message, 'error');
    }
  };

  // Delete / Deactivate Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate/delete product "${name}"?`)) return;
    try {
      const res = await supabase.deleteProduct(id);
      if (res.success) {
        showToast(`Product "${name}" deleted successfully.`, 'info');
        await loadDashboardData();
      } else {
        showToast('Error deleting product: ' + res.error, 'error');
      }
    } catch (e: any) {
      showToast('Delete error: ' + e.message, 'error');
    }
  };

  // Helper for Payment Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <RotateCcw className="w-3 h-3" /> Refunded
          </span>
        );
      case 'partially_refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <RotateCcw className="w-3 h-3" /> Partial Refund
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-500/15 text-gray-400 border border-gray-500/30">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-gray-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0a0d14]/90 backdrop-blur-xl border-b border-gray-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                Admin Business Control
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Live Supabase + Razorpay
              </span>
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:block">
              Integrated Store Management • Master Console
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <span className="text-[11px] text-gray-400 block">
              Last synced: {lastRefreshed.toLocaleTimeString()}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center justify-end gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> DB Connected
            </span>
          </div>

          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold glass-panel text-gray-200 hover:text-white border border-gray-700 hover:border-amber-500/50 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>

          <button
            onClick={() => setGlobalActiveTab('home')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Storefront</span>
          </button>
        </div>
      </header>

      {/* Main Layout: Sidebar + Workspace */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-3 sm:p-6 gap-6">
        {/* Sidebar Navigation (Phase 4) */}
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          <nav className="glass-panel p-3 rounded-2xl border border-gray-800 space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
              Platform Modules
            </div>

            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('new-registrations')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'new-registrations'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>New Registrations</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'new-registrations' ? 'bg-black text-amber-400' : 'bg-gray-800 text-gray-300'
              }`}>
                {profiles.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('all-customers')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'all-customers'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 shrink-0" />
                <span>All Customers</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'all-customers' ? 'bg-black text-amber-400' : 'bg-gray-800 text-gray-300'
              }`}>
                {profiles.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('all-purchases')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'all-purchases'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>All Purchases</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'all-purchases' ? 'bg-black text-amber-400' : 'bg-gray-800 text-gray-300'
              }`}>
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 shrink-0" />
                <span>Products & Ebooks</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'products' ? 'bg-black text-amber-400' : 'bg-gray-800 text-gray-300'
              }`}>
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Payments & Webhooks</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'payments' ? 'bg-black text-amber-400' : 'bg-gray-800 text-gray-300'
              }`}>
                {paymentEvents.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('refunds')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'refunds'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span>Refunds</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'refunds' ? 'bg-black text-amber-400' : 'bg-gray-800 text-gray-300'
              }`}>
                {refunds.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('revenue-analytics')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'revenue-analytics'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>Revenue Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <SettingsIcon className="w-4 h-4 shrink-0" />
              <span>Settings & Setup</span>
            </button>
          </nav>

          {/* Quick Business Health Panel */}
          <div className="glass-panel p-4 rounded-2xl border border-gray-800/80 space-y-3">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Net Business Health
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Total Net Revenue:</span>
                <span className="font-black text-amber-300">₹{stats.netRevenueInr.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Paid Customers:</span>
                <span className="font-bold text-white">{stats.successfulPurchases}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Refund Rate:</span>
                <span className="font-bold text-emerald-400">
                  {analytics.refundStats.refundRatePercent}%
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Dynamic Center Work Area */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* ================================================================ */}
          {/* TAB 1: OVERVIEW & REAL-TIME DASHBOARD STATISTICS (PHASE 5) */}
          {/* ================================================================ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Business Overview</h2>
                  <p className="text-xs text-gray-400">
                    Live operational metrics directly queried from Supabase database tables.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('revenue-analytics')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold glass-panel text-amber-300 border border-amber-500/40 hover:bg-amber-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <TrendingUp className="w-3.5 h-3.5" /> Full Revenue Charts
                  </button>
                </div>
              </div>

              {/* 10 Required Dashboard Cards (Phase 5) */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* 1. Total Registrations */}
                <div className="glass-panel p-4 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all space-y-1">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                    Total Registrations
                  </span>
                  <div className="text-2xl font-black text-white">{stats.totalRegistrations}</div>
                  <span className="text-[10px] text-gray-500 block">Total registered accounts</span>
                </div>

                {/* 2. Registrations Today */}
                <div className="glass-panel p-4 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all space-y-1">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                    Registrations Today
                  </span>
                  <div className="text-2xl font-black text-cyan-300">{stats.registrationsToday}</div>
                  <span className="text-[10px] text-cyan-500/80 block">Joined in last 24h</span>
                </div>

                {/* 3. Registrations This Month */}
                <div className="glass-panel p-4 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all space-y-1">
                  <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider block">
                    This Month
                  </span>
                  <div className="text-2xl font-black text-purple-300">{stats.registrationsThisMonth}</div>
                  <span className="text-[10px] text-purple-500/80 block">Current calendar month</span>
                </div>

                {/* 4. Total Orders */}
                <div className="glass-panel p-4 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all space-y-1">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                    Total Orders
                  </span>
                  <div className="text-2xl font-black text-white">{stats.totalOrders}</div>
                  <span className="text-[10px] text-gray-500 block">Order checkout attempts</span>
                </div>

                {/* 5. Successful Purchases */}
                <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 hover:border-emerald-500/50 transition-all space-y-1 bg-emerald-950/10">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
                    Successful Purchases
                  </span>
                  <div className="text-2xl font-black text-emerald-300">{stats.successfulPurchases}</div>
                  <span className="text-[10px] text-emerald-500/80 block">Verified paid orders</span>
                </div>

                {/* 6. Pending Payments */}
                <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 hover:border-amber-500/50 transition-all space-y-1 bg-amber-950/10">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                    Pending Payments
                  </span>
                  <div className="text-2xl font-black text-amber-300">{stats.pendingPayments}</div>
                  <span className="text-[10px] text-amber-500/80 block">Awaiting checkout</span>
                </div>

                {/* 7. Failed Payments */}
                <div className="glass-panel p-4 rounded-2xl border border-rose-500/30 hover:border-rose-500/50 transition-all space-y-1 bg-rose-950/10">
                  <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block">
                    Failed Payments
                  </span>
                  <div className="text-2xl font-black text-rose-300">{stats.failedPayments}</div>
                  <span className="text-[10px] text-rose-500/80 block">Unsuccessful transactions</span>
                </div>

                {/* 8. Total Revenue */}
                <div className="glass-panel p-4 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all space-y-1">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                    Gross Revenue
                  </span>
                  <div className="text-2xl font-black text-white">₹{stats.totalRevenueInr.toLocaleString()}</div>
                  <span className="text-[10px] text-gray-500 block">Verified payments total</span>
                </div>

                {/* 9. Total Refunds */}
                <div className="glass-panel p-4 rounded-2xl border border-indigo-500/30 hover:border-indigo-500/50 transition-all space-y-1 bg-indigo-950/10">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">
                    Total Refunds
                  </span>
                  <div className="text-2xl font-black text-indigo-300">₹{stats.totalRefundsInr.toLocaleString()}</div>
                  <span className="text-[10px] text-indigo-500/80 block">Processed refunds</span>
                </div>

                {/* 10. Net Revenue */}
                <div className="glass-panel p-4 rounded-2xl border border-amber-500/50 hover:border-amber-400 transition-all space-y-1 bg-gradient-to-br from-amber-500/10 to-transparent">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                    Net Revenue
                  </span>
                  <div className="text-2xl font-black text-amber-300">₹{stats.netRevenueInr.toLocaleString()}</div>
                  <span className="text-[10px] text-amber-500/80 block">Gross - Processed Refunds</span>
                </div>
              </div>

              {/* Chart Preview & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 30-Day Revenue Trend Chart */}
                <div className="lg:col-span-8 glass-panel p-5 rounded-2xl border border-gray-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">30-Day Revenue Momentum</h3>
                      <p className="text-[11px] text-gray-400">Daily revenue generated from successful purchases</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      Avg Order: ₹{analytics.averageOrderValueInr.toLocaleString()}
                    </span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.revenueTrend}>
                        <defs>
                          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
                        <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0a0d14',
                            borderColor: '#374151',
                            borderRadius: '12px',
                            fontSize: '11px'
                          }}
                          formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#f59e0b"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#revenueGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Products Breakdown */}
                <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-gray-800 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Top Digital Products</h3>
                    <p className="text-[11px] text-gray-400">Sales and revenue per product</p>
                  </div>

                  <div className="space-y-3">
                    {analytics.productSales.map((p, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 space-y-1.5">
                        <div className="flex justify-between items-start text-xs font-bold text-white">
                          <span className="line-clamp-1">{p.name}</span>
                          <span className="text-amber-400 font-mono shrink-0 ml-2">₹{p.revenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-gray-400">
                          <span>{p.sales} purchases</span>
                          <span>Verified downloads</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Orders Preview */}
              <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Recent Customer Orders</h3>
                    <p className="text-[11px] text-gray-400">Newest orders across the website</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('all-purchases')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    View All Orders <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 font-mono text-[10px] uppercase">
                        <th className="py-2.5 px-3">Order Number</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {orders.slice(0, 5).map((o) => (
                        <tr key={o.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-amber-300">{o.order_number}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-white">{o.customer_name}</div>
                            <div className="text-[11px] text-gray-400">{o.customer_email}</div>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-white">
                            ₹{(Number(o.total_amount_paise) / 100).toFixed(2)}
                          </td>
                          <td className="py-3 px-3">{renderStatusBadge(o.payment_status)}</td>
                          <td className="py-3 px-3 text-gray-400 font-mono text-[11px]">
                            {new Date(o.purchased_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: NEW REGISTRATIONS PAGE (PHASE 6) */}
          {/* ================================================================ */}
          {activeTab === 'new-registrations' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">New Registrations</h2>
                  <p className="text-xs text-gray-400">
                    Live stream of newly registered customer accounts. Newest registrations displayed first.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      exportToCSV(
                        filteredRegistrations.map((p) => ({
                          customer_id: p.id,
                          name: p.full_name,
                          email: p.email,
                          phone: p.phone || '',
                          status: p.account_status,
                          registered_date: new Date(p.created_at).toLocaleDateString(),
                          registered_time: new Date(p.created_at).toLocaleTimeString()
                        })),
                        'new_registrations'
                      )
                    }
                    className="px-3 py-2 rounded-xl text-xs font-bold glass-panel text-gray-200 hover:text-white border border-gray-700 hover:border-gray-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" /> Export CSV
                  </button>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="glass-panel p-4 rounded-2xl border border-gray-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-7 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by customer name, email, phone or ID..."
                    value={registrationSearch}
                    onChange={(e) => {
                      setRegistrationSearch(e.target.value);
                      setRegistrationPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-gray-900/90 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-5 flex items-center gap-2">
                  <input
                    type="date"
                    value={registrationDateFilter}
                    onChange={(e) => {
                      setRegistrationDateFilter(e.target.value);
                      setRegistrationPage(1);
                    }}
                    className="w-full px-3 py-2 bg-gray-900/90 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none font-mono"
                  />
                  {registrationDateFilter && (
                    <button
                      onClick={() => setRegistrationDateFilter('')}
                      className="px-2 py-2 text-xs text-gray-400 hover:text-white"
                      title="Clear date filter"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-900/40 text-gray-400 font-mono text-[10px] uppercase">
                        <th className="py-3 px-4">Customer ID</th>
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">Reg. Date</th>
                        <th className="py-3 px-4">Reg. Time</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {paginatedRegistrations.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-500">
                            No customer registrations found matching filter criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedRegistrations.map((p) => {
                          const dateObj = new Date(p.created_at);
                          return (
                            <tr key={p.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-3.5 px-4 font-mono text-[11px] text-gray-400">
                                {p.id.slice(0, 8)}...
                              </td>
                              <td className="py-3.5 px-4 font-bold text-white">{p.full_name}</td>
                              <td className="py-3.5 px-4 font-mono text-gray-300">{p.email}</td>
                              <td className="py-3.5 px-4 font-mono text-gray-300">{p.phone || '—'}</td>
                              <td className="py-3.5 px-4 text-gray-300 font-mono">
                                {dateObj.toLocaleDateString()}
                              </td>
                              <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px]">
                                {dateObj.toLocaleTimeString()}
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    p.account_status === 'active'
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  }`}
                                >
                                  {p.account_status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right space-x-2">
                                <button
                                  onClick={() => setSelectedCustomer(p)}
                                  className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-amber-300 text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  View Profile
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
                  <div>
                    Showing {(registrationPage - 1) * registrationsPerPage + 1} to{' '}
                    {Math.min(registrationPage * registrationsPerPage, filteredRegistrations.length)} of{' '}
                    {filteredRegistrations.length} registrations
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRegistrationPage((p) => Math.max(1, p - 1))}
                      disabled={registrationPage === 1}
                      className="p-1.5 rounded-lg border border-gray-800 disabled:opacity-40 hover:bg-white/5 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-white text-xs px-2">
                      Page {registrationPage} of {totalRegistrationPages}
                    </span>
                    <button
                      onClick={() => setRegistrationPage((p) => Math.min(totalRegistrationPages, p + 1))}
                      disabled={registrationPage === totalRegistrationPages}
                      className="p-1.5 rounded-lg border border-gray-800 disabled:opacity-40 hover:bg-white/5 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 3: ALL CUSTOMERS (PHASE 8) */}
          {/* ================================================================ */}
          {activeTab === 'all-customers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">All Customers</h2>
                  <p className="text-xs text-gray-400">
                    Comprehensive customer database with order histories, lifetime spend, and account management.
                  </p>
                </div>

                <button
                  onClick={() =>
                    exportToCSV(
                      filteredCustomers.map((p) => {
                        const stats = getCustomerOrderStats(p.email, p.id);
                        return {
                          id: p.id,
                          name: p.full_name,
                          email: p.email,
                          phone: p.phone || '',
                          status: p.account_status,
                          total_orders: stats.totalOrders,
                          successful_purchases: stats.successfulPurchases,
                          total_spent_inr: stats.totalSpentInr,
                          joined_date: new Date(p.created_at).toLocaleDateString()
                        };
                      }),
                      'customers_database'
                    )
                  }
                  className="px-3 py-2 rounded-xl text-xs font-bold glass-panel text-gray-200 hover:text-white border border-gray-700 hover:border-gray-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" /> Export CSV
                </button>
              </div>

              {/* Search & Filter */}
              <div className="glass-panel p-4 rounded-2xl border border-gray-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-8 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search customers by name, email or phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-900/90 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <select
                    value={customerStatusFilter}
                    onChange={(e) => setCustomerStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900/90 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="all">All Account Statuses</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked / Suspended</option>
                  </select>
                </div>
              </div>

              {/* Customer Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.map((p) => {
                  const customerStats = getCustomerOrderStats(p.email, p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedCustomer(p)}
                      className="glass-panel p-4 rounded-2xl border border-gray-800 hover:border-amber-500/50 transition-all cursor-pointer space-y-3 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-purple-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center font-black text-sm">
                            {p.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                              {p.full_name}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono">{p.email}</div>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            p.account_status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {p.account_status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-800 text-center">
                        <div className="p-2 rounded-lg bg-gray-900/60">
                          <span className="text-[9px] text-gray-400 uppercase font-mono block">Orders</span>
                          <span className="text-xs font-bold text-white">{customerStats.totalOrders}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-gray-900/60">
                          <span className="text-[9px] text-gray-400 uppercase font-mono block">Paid</span>
                          <span className="text-xs font-bold text-emerald-400">{customerStats.successfulPurchases}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-gray-900/60">
                          <span className="text-[9px] text-gray-400 uppercase font-mono block">Spent</span>
                          <span className="text-xs font-bold text-amber-300">₹{customerStats.totalSpentInr}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-1">
                        <span>Joined: {new Date(p.created_at).toLocaleDateString()}</span>
                        <span className="text-amber-400 group-hover:underline flex items-center gap-0.5">
                          Inspect Profile <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 4: PURCHASE MANAGEMENT (PHASE 7) */}
          {/* ================================================================ */}
          {activeTab === 'all-purchases' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Purchase Management</h2>
                  <p className="text-xs text-gray-400">
                    All customer orders, Razorpay gateway identifiers, payment statuses, and line item details.
                  </p>
                </div>

                <button
                  onClick={() =>
                    exportToCSV(
                      filteredPurchases.map((o) => ({
                        order_number: o.order_number,
                        customer_name: o.customer_name,
                        customer_email: o.customer_email,
                        product_name: o.items?.[0]?.product_name || 'AI Income Mastery',
                        amount_inr: (Number(o.total_amount_paise) / 100).toFixed(2),
                        razorpay_order_id: o.razorpay_order_id || '',
                        razorpay_payment_id: o.razorpay_payment_id || '',
                        payment_method: o.payment_method,
                        payment_status: o.payment_status,
                        purchased_date: new Date(o.purchased_at).toLocaleDateString()
                      })),
                      'purchases_report'
                    )
                  }
                  className="px-3 py-2 rounded-xl text-xs font-bold glass-panel text-gray-200 hover:text-white border border-gray-700 hover:border-gray-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" /> Export CSV
                </button>
              </div>

              {/* Filters */}
              <div className="glass-panel p-4 rounded-2xl border border-gray-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-5 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by order #, email, customer, or payment ID..."
                    value={purchasesSearch}
                    onChange={(e) => {
                      setPurchasesSearch(e.target.value);
                      setPurchasesPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-gray-900/90 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={purchasesStatusFilter}
                    onChange={(e) => {
                      setPurchasesStatusFilter(e.target.value);
                      setPurchasesPage(1);
                    }}
                    className="w-full px-3 py-2 bg-gray-900/90 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="all">All Payment Statuses</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="partially_refunded">Partially Refunded</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="date"
                    value={purchasesDateFilter}
                    onChange={(e) => {
                      setPurchasesDateFilter(e.target.value);
                      setPurchasesPage(1);
                    }}
                    className="w-full px-3 py-2 bg-gray-900/90 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <select
                    value={purchasesSort}
                    onChange={(e: any) => setPurchasesSort(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900/90 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="amount-desc">Amount: High to Low</option>
                    <option value="amount-asc">Amount: Low to High</option>
                  </select>
                </div>
              </div>

              {/* Purchases Table (Phase 7) */}
              <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-900/40 text-gray-400 font-mono text-[10px] uppercase">
                        <th className="py-3 px-4">Order Number</th>
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4">Customer Email</th>
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Razorpay Order ID</th>
                        <th className="py-3 px-4">Razorpay Payment ID</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {paginatedPurchases.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-8 text-center text-gray-500">
                            No purchase orders found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedPurchases.map((o) => (
                          <tr key={o.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                              {o.order_number}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-white">{o.customer_name}</td>
                            <td className="py-3.5 px-4 font-mono text-gray-300">{o.customer_email}</td>
                            <td className="py-3.5 px-4 text-gray-300 line-clamp-1 max-w-[150px]">
                              {o.items?.[0]?.product_name || 'AI Income Mastery'}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-black text-white">
                              ₹{(Number(o.total_amount_paise) / 100).toFixed(2)}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-gray-400">
                              {o.razorpay_order_id ? o.razorpay_order_id.slice(0, 14) + '...' : '—'}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-gray-400">
                              {o.razorpay_payment_id ? o.razorpay_payment_id.slice(0, 14) + '...' : '—'}
                            </td>
                            <td className="py-3.5 px-4 text-gray-400">{o.payment_method}</td>
                            <td className="py-3.5 px-4">{renderStatusBadge(o.payment_status)}</td>
                            <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px]">
                              {new Date(o.purchased_at).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-2">
                              <button
                                onClick={() => setSelectedOrder(o)}
                                className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-amber-300 text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Details
                              </button>
                              {o.payment_status === 'paid' && (
                                <button
                                  onClick={() => {
                                    setRefundTargetOrder(o);
                                    setRefundAmountInput(((Number(o.total_amount_paise) - Number(o.refunded_amount_paise || 0)) / 100).toFixed(2));
                                    setRefundModalOpen(true);
                                  }}
                                  className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  Refund
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
                  <div>
                    Showing {(purchasesPage - 1) * purchasesPerPage + 1} to{' '}
                    {Math.min(purchasesPage * purchasesPerPage, filteredPurchases.length)} of{' '}
                    {filteredPurchases.length} orders
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPurchasesPage((p) => Math.max(1, p - 1))}
                      disabled={purchasesPage === 1}
                      className="p-1.5 rounded-lg border border-gray-800 disabled:opacity-40 hover:bg-white/5 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-white text-xs px-2">
                      Page {purchasesPage} of {totalPurchasesPages}
                    </span>
                    <button
                      onClick={() => setPurchasesPage((p) => Math.min(totalPurchasesPages, p + 1))}
                      disabled={purchasesPage === totalPurchasesPages}
                      className="p-1.5 rounded-lg border border-gray-800 disabled:opacity-40 hover:bg-white/5 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 5: PRODUCTS & EBOOKS MANAGEMENT (PHASE 2.B) */}
          {/* ================================================================ */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Digital Products & Ebooks</h2>
                  <p className="text-xs text-gray-400">
                    Manage ebooks, change pricing, upload covers, and configure secure files in private storage.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingProduct({
                      name: '',
                      description: '',
                      price_paise: 129900,
                      image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
                      file_path: 'ebooks/digital-guide.pdf',
                      status: 'active'
                    });
                    setProductModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Digital Product
                </button>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4 relative overflow-hidden"
                  >
                    <div className="flex gap-4 items-start">
                      <img
                        src={p.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'}
                        alt={p.name}
                        className="w-24 h-24 rounded-xl object-cover ring-1 ring-gray-700 shrink-0"
                      />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              p.status === 'active'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'
                            }`}
                          >
                            {p.status}
                          </span>
                          <span className="text-base font-black text-amber-300 font-mono">
                            ₹{(Number(p.price_paise) / 100).toFixed(2)}
                          </span>
                        </div>
                        <h3 className="font-bold text-white text-sm line-clamp-1">{p.name}</h3>
                        <p className="text-[11px] text-gray-400 line-clamp-2">{p.description}</p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-400 text-[11px]">Storage Path:</span>
                      <span className="text-gray-300 text-[11px] truncate max-w-[200px]">{p.file_path || 'Not attached'}</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setProductModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-amber-400" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Deactivate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 6: PAYMENTS & WEBHOOKS (PHASE 2.E) */}
          {/* ================================================================ */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Payments & Webhooks</h2>
                  <p className="text-xs text-gray-400">
                    Live log of all Razorpay webhook events received and verified by the server.
                  </p>
                </div>
              </div>

              <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-900/40 text-gray-400 font-mono text-[10px] uppercase">
                        <th className="py-3 px-4">Event ID</th>
                        <th className="py-3 px-4">Event Type</th>
                        <th className="py-3 px-4">Razorpay Order ID</th>
                        <th className="py-3 px-4">Razorpay Payment ID</th>
                        <th className="py-3 px-4">Processing Status</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {paymentEvents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-500">
                            No webhook events recorded yet. Configure Razorpay Webhooks to stream live gateway events.
                          </td>
                        </tr>
                      ) : (
                        paymentEvents.map((evt) => (
                          <tr key={evt.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-[11px] text-amber-300">
                              {evt.provider_event_id.slice(0, 16)}...
                            </td>
                            <td className="py-3.5 px-4 font-bold text-white">
                              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[11px]">
                                {evt.event_type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-gray-400">
                              {evt.razorpay_order_id || '—'}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-gray-400">
                              {evt.razorpay_payment_id || '—'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  evt.processing_status === 'processed'
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : evt.processing_status === 'failed'
                                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                {evt.processing_status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px]">
                              {new Date(evt.created_at).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => setSelectedPaymentEvent(evt)}
                                className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-amber-300 text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                View Payload
                              </button>
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

          {/* ================================================================ */}
          {/* TAB 7: REFUNDS (PHASE 2.F) */}
          {/* ================================================================ */}
          {activeTab === 'refunds' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Refund Management</h2>
                  <p className="text-xs text-gray-400">
                    Track all processed full and partial refunds with Razorpay refund references.
                  </p>
                </div>

                <button
                  onClick={() =>
                    exportToCSV(
                      refunds.map((r) => ({
                        id: r.id,
                        order_id: r.order_id,
                        order_number: r.order_number || '',
                        customer_email: r.customer_email || '',
                        razorpay_refund_id: r.razorpay_refund_id || '',
                        amount_inr: (Number(r.amount_paise) / 100).toFixed(2),
                        status: r.status,
                        created_at: new Date(r.created_at).toLocaleString()
                      })),
                      'refunds_record'
                    )
                  }
                  className="px-3 py-2 rounded-xl text-xs font-bold glass-panel text-gray-200 hover:text-white border border-gray-700 hover:border-gray-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" /> Export CSV
                </button>
              </div>

              {/* Total Refund Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-panel p-4 rounded-2xl border border-gray-800 space-y-1">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Total Refund Count</span>
                  <div className="text-2xl font-black text-white">{refunds.length}</div>
                </div>
                <div className="glass-panel p-4 rounded-2xl border border-indigo-500/30 space-y-1 bg-indigo-950/10">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase">Total Amount Refunded</span>
                  <div className="text-2xl font-black text-indigo-300">₹{stats.totalRefundsInr.toLocaleString()}</div>
                </div>
                <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 space-y-1 bg-emerald-950/10">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase">Refund Ratio</span>
                  <div className="text-2xl font-black text-emerald-300">{analytics.refundStats.refundRatePercent}%</div>
                </div>
              </div>

              {/* Refunds Table */}
              <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-900/40 text-gray-400 font-mono text-[10px] uppercase">
                        <th className="py-3 px-4">Refund ID</th>
                        <th className="py-3 px-4">Order Number</th>
                        <th className="py-3 px-4">Customer Email</th>
                        <th className="py-3 px-4">Razorpay Refund ID</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Processed Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {refunds.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-500">
                            No refund records found in database.
                          </td>
                        </tr>
                      ) : (
                        refunds.map((r) => (
                          <tr key={r.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-[11px] text-gray-400">{r.id.slice(0, 8)}...</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-amber-300">{r.order_number || r.order_id.slice(0, 8)}</td>
                            <td className="py-3.5 px-4 font-mono text-gray-300">{r.customer_email || '—'}</td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-indigo-300">
                              {r.razorpay_refund_id || '—'}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-black text-rose-300">
                              -₹{(Number(r.amount_paise) / 100).toFixed(2)}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                {r.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px]">
                              {new Date(r.created_at).toLocaleString()}
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

          {/* ================================================================ */}
          {/* TAB 8: REVENUE ANALYTICS (PHASE 9) */}
          {/* ================================================================ */}
          {activeTab === 'revenue-analytics' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Revenue Analytics</h2>
                  <p className="text-xs text-gray-400">
                    Comprehensive reporting on sales, registrations, average order values, and product performance.
                  </p>
                </div>

                {/* Date-Range Filters */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-900/90 border border-gray-800 text-xs">
                  {(['today', '7days', '30days', '1year', 'all'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setAnalyticsRange(range)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        analyticsRange === range
                          ? 'bg-amber-500 text-black shadow font-black'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {range === 'today'
                        ? 'Today'
                        : range === '7days'
                        ? '7 Days'
                        : range === '30days'
                        ? '30 Days'
                        : range === '1year'
                        ? '1 Year'
                        : 'All Time'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Key Revenue Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-4 rounded-2xl border border-gray-800 space-y-1">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Gross Verified Revenue</span>
                  <div className="text-2xl font-black text-white">₹{stats.totalRevenueInr.toLocaleString()}</div>
                  <span className="text-[10px] text-gray-500">From paid orders</span>
                </div>

                <div className="glass-panel p-4 rounded-2xl border border-amber-500/40 bg-amber-950/10 space-y-1">
                  <span className="text-[10px] font-mono text-amber-400 uppercase">Net Realized Revenue</span>
                  <div className="text-2xl font-black text-amber-300">₹{stats.netRevenueInr.toLocaleString()}</div>
                  <span className="text-[10px] text-amber-500/80">Subtracting processed refunds</span>
                </div>

                <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 space-y-1 bg-cyan-950/10">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase">Average Order Value (AOV)</span>
                  <div className="text-2xl font-black text-cyan-300">₹{analytics.averageOrderValueInr.toLocaleString()}</div>
                  <span className="text-[10px] text-cyan-500/80">Per successful transaction</span>
                </div>

                <div className="glass-panel p-4 rounded-2xl border border-indigo-500/30 space-y-1 bg-indigo-950/10">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase">Refund Ratio</span>
                  <div className="text-2xl font-black text-indigo-300">{analytics.refundStats.refundRatePercent}%</div>
                  <span className="text-[10px] text-indigo-500/80">₹{analytics.refundStats.refundedAmountInr} total</span>
                </div>
              </div>

              {/* 1. Revenue Over Time Chart */}
              <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4">
                <h3 className="text-sm font-bold text-white">Revenue Over Time</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.revenueTrend}>
                      <defs>
                        <linearGradient id="areaRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
                      <YAxis stroke="#6b7280" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0a0d14', borderColor: '#374151', borderRadius: '12px', fontSize: '11px' }}
                        formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2.5} fill="url(#areaRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. Registrations Over Time & Purchases Over Time */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4">
                  <h3 className="text-sm font-bold text-white">New Registrations Over Time</h3>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.registrationsTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
                        <YAxis stroke="#6b7280" fontSize={10} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0a0d14', borderColor: '#374151', borderRadius: '12px', fontSize: '11px' }}
                        />
                        <Bar dataKey="registrations" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4">
                  <h3 className="text-sm font-bold text-white">Product-Wise Sales Volume</h3>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.productSales} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                        <XAxis type="number" stroke="#6b7280" fontSize={10} tickLine={false} allowDecimals={false} />
                        <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={10} tickLine={false} width={120} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0a0d14', borderColor: '#374151', borderRadius: '12px', fontSize: '11px' }}
                        />
                        <Bar dataKey="sales" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 9: SETTINGS & SETUP (PHASE 10 & FINAL INSTRUCTIONS) */}
          {/* ================================================================ */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">System Settings & Gateway Config</h2>
                <p className="text-xs text-gray-400">
                  Verify Supabase Row Level Security, tables, Razorpay webhook endpoint URLs, and admin credentials.
                </p>
              </div>

              {/* 1. Supabase Database Status */}
              <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Supabase Database Schema Status
                </h3>
                <p className="text-xs text-gray-400">
                  All 6 core business tables required by the specification:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-gray-900/60 border border-emerald-500/30 flex items-center justify-between">
                    <span className="text-white">1. profiles</span>
                    <span className="text-emerald-400 text-[10px] font-bold">RLS Active</span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-900/60 border border-emerald-500/30 flex items-center justify-between">
                    <span className="text-white">2. products</span>
                    <span className="text-emerald-400 text-[10px] font-bold">RLS Active</span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-900/60 border border-emerald-500/30 flex items-center justify-between">
                    <span className="text-white">3. orders</span>
                    <span className="text-emerald-400 text-[10px] font-bold">RLS Active</span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-900/60 border border-emerald-500/30 flex items-center justify-between">
                    <span className="text-white">4. order_items</span>
                    <span className="text-emerald-400 text-[10px] font-bold">RLS Active</span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-900/60 border border-emerald-500/30 flex items-center justify-between">
                    <span className="text-white">5. payment_events</span>
                    <span className="text-emerald-400 text-[10px] font-bold">Idempotency</span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-900/60 border border-emerald-500/30 flex items-center justify-between">
                    <span className="text-white">6. refunds</span>
                    <span className="text-emerald-400 text-[10px] font-bold">Partial/Full</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 space-y-1">
                  <strong>Database Migration File Available:</strong>
                  <p className="font-mono text-[11px] text-gray-300">
                    File: <code className="text-amber-300">supabase/schema.sql</code>
                  </p>
                  <p className="text-[11px]">
                    To apply or re-run policies, execute <code className="text-amber-300">supabase/schema.sql</code> directly in your Supabase SQL Editor.
                  </p>
                </div>
              </div>

              {/* 2. Razorpay Webhook Configuration */}
              <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" /> Razorpay Webhook Setup Instructions
                </h3>

                <p className="text-xs text-gray-400">
                  Configure this webhook URL inside your Razorpay Dashboard (Settings → Webhooks) to enable real-time idempotency, automatic order status updates, and refund syncing:
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">
                      Production Webhook URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/api/razorpay-webhook`}
                        className="flex-1 px-3 py-2 bg-gray-900/90 rounded-xl text-xs font-mono text-amber-300 border border-gray-800"
                      />
                      <button
                        onClick={() => copyToClipboard(`${window.location.origin}/api/razorpay-webhook`, 'webhook_url')}
                        className="px-3 py-2 rounded-xl text-xs font-bold glass-panel hover:bg-white/5 border border-gray-700 text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'webhook_url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 space-y-2 text-xs">
                    <span className="font-bold text-white block">Required Events to Subscribe:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] text-gray-300">
                      <div>• payment.authorized</div>
                      <div>• payment.captured</div>
                      <div>• payment.failed</div>
                      <div>• refund.created</div>
                      <div>• refund.processed</div>
                      <div>• refund.failed</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Admin Account Verification */}
              <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400" /> Master Admin Account
                </h3>
                <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-gray-900/60 border border-gray-800">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Active Admin Session</span>
                    <span className="font-bold text-white">{currentUser?.name || 'Aadarsh Rathore'}</span>
                    <span className="font-mono text-gray-400 text-[11px] block">{currentUser?.email || 'rathoreaadarsh084@gmail.com'}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Role: {currentRole}
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- CUSTOMER DETAILS MODAL (PHASE 8) --- */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl glass-panel rounded-3xl border border-amber-500/30 p-6 space-y-6 relative max-h-[90vh] overflow-y-auto bg-black/95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-lg">
                  {selectedCustomer.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{selectedCustomer.full_name}</h3>
                  <p className="text-xs text-gray-400 font-mono">{selectedCustomer.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white glass-panel cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Profile Metrics */}
            {(() => {
              const custStats = getCustomerOrderStats(selectedCustomer.email, selectedCustomer.id);
              return (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-center">
                      <span className="text-[10px] font-mono text-gray-400 uppercase block">Phone</span>
                      <span className="text-xs font-bold text-white">{selectedCustomer.phone || '—'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-center">
                      <span className="text-[10px] font-mono text-gray-400 uppercase block">Joined</span>
                      <span className="text-xs font-bold text-white">
                        {new Date(selectedCustomer.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-center">
                      <span className="text-[10px] font-mono text-gray-400 uppercase block">Total Spent</span>
                      <span className="text-xs font-black text-amber-300">₹{custStats.totalSpentInr}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-center">
                      <span className="text-[10px] font-mono text-gray-400 uppercase block">Status</span>
                      <span className="text-xs font-bold text-emerald-400 uppercase">{selectedCustomer.account_status}</span>
                    </div>
                  </div>

                  {/* Customer Purchase History */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono font-bold text-gray-400 uppercase">Complete Purchase History</h4>
                    {custStats.allOrders.length === 0 ? (
                      <p className="text-xs text-gray-500 py-4 text-center">No orders recorded for this customer yet.</p>
                    ) : (
                      <div className="divide-y divide-gray-800 border border-gray-800 rounded-xl overflow-hidden">
                        {custStats.allOrders.map((o) => (
                          <div key={o.id} className="p-3 bg-gray-900/60 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-mono font-bold text-amber-300">{o.order_number}</div>
                              <div className="text-[11px] text-gray-400">
                                {o.items?.[0]?.product_name || 'AI Income Mastery Blueprint'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold text-white">₹{(Number(o.total_amount_paise) / 100).toFixed(2)}</div>
                              <div>{renderStatusBadge(o.payment_status)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* --- ORDER DETAILS MODAL --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel rounded-3xl border border-amber-500/30 p-6 space-y-5 bg-black/95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase">Order Details</span>
                <h3 className="text-lg font-black text-amber-300 font-mono">{selectedOrder.order_number}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white glass-panel cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Customer Name:</span>
                  <span className="font-bold text-white">{selectedOrder.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Customer Email:</span>
                  <span className="font-mono text-gray-300">{selectedOrder.customer_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Razorpay Order ID:</span>
                  <span className="font-mono text-amber-300">{selectedOrder.razorpay_order_id || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Razorpay Payment ID:</span>
                  <span className="font-mono text-indigo-300">{selectedOrder.razorpay_payment_id || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Status:</span>
                  <span>{renderStatusBadge(selectedOrder.payment_status)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Purchased At:</span>
                  <span className="font-mono text-gray-300">{new Date(selectedOrder.purchased_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Order Items Snapshot */}
              <div className="space-y-2">
                <span className="font-mono text-[10px] uppercase text-gray-400">Order Items Snapshot</span>
                <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 space-y-2">
                  {(selectedOrder.items && selectedOrder.items.length > 0
                    ? selectedOrder.items
                    : [
                        {
                          id: 'fallback_item',
                          product_name: 'AI Income Mastery: Complete Blueprint',
                          quantity: 1,
                          total_price_paise: selectedOrder.total_amount_paise
                        }
                      ]
                  ).map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-white">{it.product_name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">Qty: {it.quantity}</div>
                      </div>
                      <div className="font-mono font-bold text-amber-300">
                        ₹{(Number(it.total_price_paise) / 100).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT PRODUCT MODAL --- */}
      {productModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProduct}
            className="w-full max-w-lg glass-panel rounded-3xl border border-amber-500/30 p-6 space-y-4 bg-black/95 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">
                {editingProduct.id ? 'Edit Digital Product' : 'Add New Digital Product'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setProductModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-2 rounded-xl text-gray-400 hover:text-white glass-panel cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase">Product Name *</label>
              <input
                type="text"
                required
                value={editingProduct.name || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase">Description</label>
              <textarea
                rows={3}
                value={editingProduct.description || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase">Price in ₹ *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editingProduct.price_paise ? (editingProduct.price_paise / 100).toFixed(2) : '1299.00'}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      price_paise: Math.round(parseFloat(e.target.value || '0') * 100)
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase">Status</label>
                <select
                  value={editingProduct.status || 'active'}
                  onChange={(e: any) => setEditingProduct({ ...editingProduct, status: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase">Cover Image URL</label>
              <input
                type="text"
                value={editingProduct.image_url || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase">Private Storage File Path</label>
              <input
                type="text"
                placeholder="ebooks/ai-income-blueprint.pdf"
                value={editingProduct.file_path || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, file_path: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none font-mono"
              />
              <span className="text-[10px] text-gray-500">
                Stored in private bucket <code>digital-downloads</code>. Signed URLs are issued only to paying buyers.
              </span>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setProductModalOpen(false);
                  setEditingProduct(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold glass-panel text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black font-black"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- PROCESS REFUND MODAL --- */}
      {refundModalOpen && refundTargetOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleProcessRefundSubmit}
            className="w-full max-w-md glass-panel rounded-3xl border border-rose-500/40 p-6 space-y-4 bg-black/95"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-rose-300 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-400" /> Process Order Refund
              </h3>
              <button
                type="button"
                onClick={() => setRefundModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-white glass-panel cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Order:</span>
                <span className="font-mono font-bold text-amber-300">{refundTargetOrder.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Customer:</span>
                <span className="text-white">{refundTargetOrder.customer_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Paid:</span>
                <span className="font-mono text-white">
                  ₹{(Number(refundTargetOrder.total_amount_paise) / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Already Refunded:</span>
                <span className="font-mono text-rose-300">
                  ₹{(Number(refundTargetOrder.refunded_amount_paise || 0) / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase">Refund Amount in ₹ *</label>
              <input
                type="number"
                step="0.01"
                required
                value={refundAmountInput}
                onChange={(e) => setRefundAmountInput(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-rose-400 focus:outline-none font-mono"
              />
              <span className="text-[10px] text-gray-500">
                Supports partial or full refunds through Razorpay Refund API.
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase">Reason for Refund</label>
              <input
                type="text"
                value={refundReasonInput}
                onChange={(e) => setRefundReasonInput(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-rose-400 focus:outline-none"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRefundModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold glass-panel text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRefunding}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white font-black disabled:opacity-50 flex items-center gap-1.5"
              >
                {isRefunding ? 'Refunding...' : 'Confirm Refund'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- WEBHOOK PAYLOAD VIEWER MODAL --- */}
      {selectedPaymentEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl glass-panel rounded-3xl border border-purple-500/30 p-6 space-y-4 bg-black/95 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-purple-400 uppercase">{selectedPaymentEvent.event_type}</span>
                <h3 className="text-base font-black text-white font-mono">{selectedPaymentEvent.provider_event_id}</h3>
              </div>
              <button
                onClick={() => setSelectedPaymentEvent(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white glass-panel cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 overflow-x-auto text-[11px] font-mono text-emerald-400">
              <pre>{JSON.stringify(selectedPaymentEvent.payload, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminControlPanel;
