import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Tag, CheckCircle2, Lock, Flame, Zap, Shield } from 'lucide-react';
import { openRazorpayCheckout } from '../lib/razorpay';
import { useScrollReveal } from '../hooks/useScrollReveal';

export const CheckoutPage: React.FC = () => {
  const {
    currentUser,
    flagship,
    coupons,
    enrollInCourse,
    validateCoupon,
    setActiveTab,
    showToast
  } = useApp();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number; discountAmount?: number } | null>(null);
  const [userPhone, setUserPhone] = useState(currentUser?.phone || '+91 9876543210');

  useEffect(() => {
    if (currentUser?.phone) {
      setUserPhone(currentUser.phone);
    }
  }, [currentUser]);

  useEffect(() => {
    if (appliedCoupon) {
      validateCoupon(appliedCoupon.code, flagship.currentPrice, flagship.id).then((res) => {
        if (!res.valid) {
          setAppliedCoupon(null);
        }
      });
    }
  }, [coupons, flagship.currentPrice]);

  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useScrollReveal();

  const originalPrice = flagship.originalPrice;
  const courseDiscountedPrice = flagship.currentPrice;
  const couponDiscountAmount = appliedCoupon
    ? (appliedCoupon.discountAmount ?? Math.round((courseDiscountedPrice * appliedCoupon.percent) / 100))
    : 0;
  const finalPrice = Math.max(0, courseDiscountedPrice - couponDiscountAmount);

  const handleApplyCoupon = async (e?: React.FormEvent, codeToApply?: string) => {
    if (e) e.preventDefault();
    const targetCode = codeToApply || couponInput;
    if (!targetCode || !targetCode.trim()) {
      showToast('Please enter a coupon code.', 'error');
      return;
    }
    const res = await validateCoupon(targetCode, courseDiscountedPrice, flagship.id);
    if (res.valid && res.coupon) {
      setAppliedCoupon({
        code: res.coupon.code,
        percent: res.coupon.discountPercent,
        discountAmount: res.discountAmount
      });
      setCouponInput(res.coupon.code);
      showToast(res.message || `🎉 Coupon ${res.coupon.code} applied successfully!`, 'success');
    } else {
      showToast(res.error || 'Invalid coupon code or minimum order not met.', 'error');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    showToast('Coupon code removed.', 'info');
  };

  const handleCompletePayment = async () => {
    setIsProcessing(true);

    try {
      await openRazorpayCheckout({
        amount: Math.max(100, finalPrice * 100), // Amount in paise (minimum 100 paise)
        name: 'AI Income Mastery',
        description: `Flagship Enrolment - ${flagship.title}`,
        prefill: {
          name: currentUser?.name || 'Student Account',
          email: currentUser?.email || 'student@example.com',
          contact: userPhone || '+91 9876543210'
        },
        notes: {
          courseId: flagship.id,
          couponCode: appliedCoupon?.code || 'NONE',
          userEmail: currentUser?.email || 'student@example.com'
        },
        theme: {
          color: '#8B5CF6'
        },
        onSuccess: (paymentData, verifyData) => {
          setIsProcessing(false);
          console.log('Payment verified successfully:', verifyData);
          const success = enrollInCourse(flagship.id, {
            amountPaid: finalPrice,
            couponCode: appliedCoupon?.code,
            paymentMethod: 'Razorpay',
            userPhone: userPhone,
            transactionId: paymentData.razorpay_payment_id
          });
          if (success) {
            showToast(`🎉 Payment Verified & Successful! Payment ID: ${paymentData.razorpay_payment_id}`);
            setActiveTab('course-learning');
          }
        },
        onError: (err: any) => {
          setIsProcessing(false);
          showToast(`❌ Payment Error: ${err.message || 'Payment processing failed'}`);
        },
        onDismiss: () => {
          setIsProcessing(false);
          showToast('ℹ️ Payment checkout modal was cancelled.');
        }
      });
    } catch (err: any) {
      setIsProcessing(false);
      showToast(`❌ Failed to start payment: ${err.message || 'Error occurred'}`);
    }
  };

  return (
    <div ref={scrollRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 mesh-gradient">
      
      <div className="text-center space-y-2 reveal">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 animate-float-gentle">
          <Flame className="w-3.5 h-3.5 fill-amber-400" /> Flagship Enrolment
        </div>
        <h1 className="text-3xl font-black text-white">Secure Checkout</h1>
        <p className="text-xs text-gray-400">Enrolling in AI Income Mastery: Complete Blueprint</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Order Details & Payment Method */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4 card-3d reveal">
            <h3 className="font-bold text-white text-sm uppercase font-mono tracking-wider text-purple-400">
              Selected Flagship Program
            </h3>

            <div className="flex gap-4 items-center">
              <img
                src={flagship.thumbnail}
                alt={flagship.title}
                className="w-28 h-18 rounded-xl object-cover ring-1 ring-purple-500/40"
              />
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase font-mono">
                  7 FULL MODULES • LIFETIME ACCESS
                </span>
                <h4 className="font-extrabold text-white text-base leading-snug">{flagship.title}</h4>
                <p className="text-xs text-gray-400 mt-1">Lead Mentors: Karan Malhotra & Ria Kapoor</p>
              </div>
            </div>
          </div>

          {/* Account & Billing Contact Details */}
          <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 space-y-4 bg-gray-900/40">
            <h3 className="font-bold text-white text-sm uppercase font-mono tracking-wider text-amber-400 flex items-center justify-between">
              <span>Purchaser Account Details</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                Supabase DB Sync Ready
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase font-mono">Username / Account Name</label>
                <div className="p-3 bg-gray-900 rounded-xl font-bold text-white border border-gray-800">
                  {currentUser?.name || 'Student Account'}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase font-mono">Registered Email ID</label>
                <div className="p-3 bg-gray-900 rounded-xl font-mono text-purple-300 border border-gray-800 truncate">
                  {currentUser?.email || 'student@example.com'}
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-[10px] font-bold text-amber-400 uppercase font-mono flex items-center justify-between">
                <span>Mobile Number (Phone No)</span>
                <span className="text-[10px] text-gray-400 font-normal">Will show in Admin Suite & Supabase Table</span>
              </label>
              <input
                type="tel"
                required
                placeholder="Enter Mobile No (e.g. +91 9876543210)"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                className="w-full p-3 bg-gray-900 rounded-xl text-xs font-bold text-amber-300 border border-amber-500/40 focus:border-amber-400 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Payment Gateway Selector */}
          <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm uppercase font-mono tracking-wider text-purple-400">
                Select Payment Method
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono flex items-center gap-1 border border-blue-500/30">
                <Shield className="w-3 h-3 text-blue-400" /> Secure Gateway
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div
                className="p-4 rounded-xl border bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 border-blue-400/60 text-white shadow-lg ring-1 ring-blue-500/30 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-400/40 text-blue-400">
                    <Zap className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-white">Payment</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded font-extrabold uppercase">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 mt-0.5">
                      All-in-one payment for UPI, GPay, PhonePe, Cards, Netbanking & Wallets
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Instant Verification</span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-xl border border-blue-500/40 bg-blue-950/20 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/20 rounded-xl border border-blue-500/40 text-blue-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    Online Payment Gateway
                  </h4>
                  <p className="text-xs text-gray-300">
                    Supports GPay, PhonePe, Paytm, BHIM UPI, All Bank Cards, Netbanking & EMI
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-blue-900/50 text-[11px] text-blue-200/80 flex items-center justify-between">
                <span>🔒 256-Bit SSL Encrypted Payment</span>
                <span className="font-mono text-emerald-400">Auto Enrolment Active</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right: Summary & Coupon */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 space-y-5">
            <h3 className="font-bold text-white text-sm uppercase font-mono tracking-wider text-amber-400">
              Order Summary
            </h3>

            <form onSubmit={handleApplyCoupon} className="space-y-3">
              <label className="text-[11px] font-bold text-gray-300 uppercase font-mono flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-400" /> Apply Coupon Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Coupon Code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 uppercase focus:border-amber-400 focus:outline-none"
                />
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-xl hover:bg-red-500/30 transition-colors"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-400 text-black text-xs font-black rounded-xl hover:bg-amber-300 transition-colors"
                  >
                    Apply
                  </button>
                )}
              </div>



              {appliedCoupon && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Coupon <span className="font-mono underline">{appliedCoupon.code}</span> Applied! ({appliedCoupon.percent}% OFF)
                  </p>
                  <span className="text-xs font-black text-emerald-400 font-mono">
                    -₹{couponDiscountAmount.toLocaleString()}
                  </span>
                </div>
              )}
            </form>

            <div className="space-y-2 text-xs border-t border-b border-gray-800 py-4">
              <div className="flex justify-between text-gray-400">
                <span>Original Price</span>
                <span className="line-through">₹{originalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Launch Discount</span>
                <span className="text-emerald-400">-₹{(originalPrice - courseDiscountedPrice).toLocaleString()}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-amber-400 font-bold">
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                  <span>-₹{couponDiscountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-400">
                <span>GST (Included)</span>
                <span>₹0</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="text-sm font-bold text-white">Final Amount Payable</span>
              <span className="text-2xl font-black text-amber-400">₹{finalPrice.toLocaleString()}</span>
            </div>

            <button
              onClick={handleCompletePayment}
              disabled={isProcessing}
              className="w-full py-4 rounded-xl font-black text-sm text-black bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:scale-[1.02] shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-wider"
            >
              {isProcessing ? (
                <span>Launching Razorpay Checkout...</span>
              ) : (
                <>
                  <Zap className="w-4.5 h-4.5 text-black fill-black" />
                  <span>Pay ₹{finalPrice.toLocaleString()} via Razorpay</span>
                </>
              )}
            </button>

            <div className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Instant Automatic Enrolment & Unlocked Access</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
