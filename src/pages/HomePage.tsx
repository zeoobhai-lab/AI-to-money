import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { openRazorpayCheckout } from '../lib/razorpay';
import { Hero3DCanvas } from '../components/3d/Hero3DCanvas';
import { Card3DTilt } from '../components/ui/Card3DTilt';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Award,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Play,
  Star,
  Flame,
  Bot,
  DollarSign,
  TrendingUp,
  Globe,
  Rocket,
  Gift,
  Ticket,
  Crown,
  Check,
  FileText,
  Package,
  Layers,
  Users,
  Clock,
  Lock,
  MessageCircle,
  Video,
  Download
} from 'lucide-react';

export const HomePage: React.FC<{ onOpenAuth: () => void }> = ({ onOpenAuth }) => {
  const { flagship, setActiveTab, setSelectedCourseId, coupons, showToast, currentUser, enrollInCourse } = useApp();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [openModuleIndex, setOpenModuleIndex] = useState<number | null>(0);
  const scrollRef = useScrollReveal();

  const benefits = [
    '✨ 3D WebGL Web Design',
    '⚡ Full-Stack Web Development',
    '🤖 AI Automations & n8n',
    '🎯 High-ROAS Meta Ads',
    '🚀 Instagram Growth Engine',
    '💬 1-to-1 Live Mentorship',
    '📦 Digital Product Systems',
    '♾️ Lifetime Blueprint Access'
  ];

  const modules = [
    {
      title: 'Module 1: 3D WebGL & Interactive Web Design',
      desc: 'Build ultra-modern 3D interactive websites using Three.js, React 19, & Tailwind CSS that captivate clients and double conversion rates.',
      icon: Layers,
      lessons: ['Introduction to 3D WebGL Engine', 'Lighting, Materials, & Shaders', 'Interactive Camera & Parallax', 'Deploying 3D Web App to Vercel']
    },
    {
      title: 'Module 2: Full-Stack Web Development',
      desc: 'Master production React web apps, Next.js architecture, API integrations, Tailwind styling, and dynamic database connectivity.',
      icon: Globe,
      lessons: ['Modern React 19 & Vite Setup', 'State Management & Custom Hooks', 'Vercel / Supabase API Integration', 'Responsive UI & Performance Optimization']
    },
    {
      title: 'Module 3: AI Automation Systems & n8n',
      desc: 'Connect Make.com, n8n, Webhooks, & custom AI agents to automate lead generation, customer support, and email sequences on autopilot.',
      icon: Zap,
      lessons: ['n8n Self-Hosted & Cloud Setup', 'Connecting ChatGPT/Claude APIs', 'Automated Lead Scraper Scenarios', 'AI Customer Nurture Pipelines']
    },
    {
      title: 'Module 4: Meta Ads & High-ROAS Funnels',
      desc: 'Create high-converting Facebook & Instagram ad copy, viral creative hooks, custom retargeting pixels, and 5x to 8x ROAS sales funnels.',
      icon: TrendingUp,
      lessons: ['Ad Copywriting Frameworks', 'High-Converting Video Ad Hooks', 'Meta Pixel & Conversion Tracking', 'Scaling Ads from ₹500 to ₹50,000/day']
    },
    {
      title: 'Module 5: Instagram Organic Growth Engine',
      desc: 'Scale your personal brand to 100k+ followers with AI video editing workflows, viral hooks, and automated ManyChat DM funnels.',
      icon: Rocket,
      lessons: ['Viral Content Strategy & Scripting', 'AI CapCut & Premiere Editing', 'ManyChat Auto-DM Funnels', 'Monetizing Instagram Followers']
    },
    {
      title: 'Module 6: Digital Products & Auto-Stores',
      desc: 'Create, launch, & sell high-margin digital products, Notion OS templates, SaaS starter codebases, and auto-delivery storefronts.',
      icon: Package,
      lessons: ['High-Demand Digital Product Blueprint', 'Building E-Commerce Storefronts', 'Payment Gateways & Razorpay Setup', 'Automated Instant Product Delivery']
    },
    {
      title: 'Module 7: 1-to-1 Live Mentorship & Client Acquisition',
      desc: 'Weekly interactive live masterclasses with Aadarsh Rathore (Sawadh Sera), portfolio reviews, cold outreach scripts, and client retainers.',
      icon: Users,
      lessons: ['High-Ticket Client Cold Emailing', 'Proposal Writing & Closing Deals', 'Weekly Live Q&A Masterclasses', 'Scaling Agency to ₹5L+/Month']
    }
  ];

  const bonuses = [
    {
      badge: '₹20,000 VALUE',
      title: 'Bonus #1 — 10+ Premium Digital Products',
      desc: 'Instant commercial license access to pre-built website templates, 3D WebGL codebases, Notion systems, and client proposal decks.',
      items: [
        '3D Startup Web Templates',
        'Full React Web App Starter',
        'AI Prompt Master Library',
        'Notion Productivity Systems',
        'Social Media Content Engine',
        'High-Ticket Client Proposals'
      ],
      icon: Package
    },
    {
      badge: '₹15,000 VALUE',
      title: 'Bonus #2 — Premium AI Automation Toolkit',
      desc: 'Save 100+ hours with pre-tested n8n automation blueprints, ChatGPT-5 & Claude master prompts, and cold outreach workflows.',
      items: [
        'n8n & Make.com Blueprints',
        'ChatGPT-5 Master Prompts',
        'Claude Business Workflows',
        'Automated DM Lead Scrapers',
        'Client Retainer Templates',
        'SaaS Starter Codebase'
      ],
      icon: Bot
    },
    {
      badge: '₹10,000 VALUE',
      title: 'Bonus #3 — 100+ Page Business Playbook',
      desc: 'Step-by-step handbook detailing exact roadmap to build a 6-figure AI agency, digital product shop, and client retention engine.',
      items: [
        'AI Agency Foundations',
        'Web Dev Pricing Calculator',
        'Cold Email Pitch Scripts',
        'Client Acquisition Systems',
        'Meta Ads Hook Bible',
        'Scaling to ₹5L/Month Blueprint'
      ],
      icon: FileText
    }
  ];

  const testimonials = [
    {
      name: 'Rohan Sharma',
      role: 'Freelance Web Developer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      earnings: '₹2.4 Lakhs Earned',
      comment: 'The 3D WebGL module changed my career! I landed my first international client at $1,800 using the 3D portfolio template provided in Module 1.',
      stars: 5
    },
    {
      name: 'Priya Patel',
      role: 'Digital Marketer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      earnings: '4.8x ROAS Achieved',
      comment: 'Aadarsh’s Meta Ads strategy and n8n lead automation transformed our agency workflow. We automated 80% of our lead nurturing within 2 weeks.',
      stars: 5
    },
    {
      name: 'Aman Verma',
      role: 'Content Creator',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      earnings: '85k Followers Gained',
      comment: 'From 1,200 to 86,000 Instagram followers in 60 days using the AI Reel Engine scripts. Plus, I made ₹1.8L selling my Notion templates!',
      stars: 5
    }
  ];

  const faqs = flagship.faqs;

  const handleEnroll = () => {
    setSelectedCourseId(flagship.id);
    setActiveTab('checkout');
    showToast('Redirecting to Checkout Page... 🛒');
  };

  return (
    <div ref={scrollRef} className="space-y-28 pb-24 text-slate-100 selection:bg-amber-400 selection:text-black">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION — FUTURISTIC 3D & HIGH-IMPACT TYPOGRAPHY
         ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-8 sm:pt-16 pb-12 overflow-hidden">
        
        {/* Background ambient lighting orbs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-purple-600/25 via-amber-500/20 to-cyan-500/25 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top Live Announcement Widget */}
          <div className="flex justify-center mb-8 reveal">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass-panel-gold border border-amber-400/50 shadow-2xl shadow-amber-500/15 animate-float-gentle">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
              </span>
              <span className="text-xs font-black text-amber-300 uppercase tracking-widest font-mono">
                SAWADH SERA PRESENTS • OFFICIAL BATCH #4 LAUNCH
              </span>
              <span className="bg-amber-400 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                14 SEATS LEFT
              </span>
            </div>
          </div>

          {/* Centered High-Impact Hero Layout */}
          <div className="max-w-4xl mx-auto space-y-8 text-center z-10">
            
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 sticker-badge-purple text-xs tracking-wider uppercase">
                <Sparkles className="w-4 h-4 fill-white animate-spin" />
                <span>Flagship AI Mastery Blueprint 2026</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
                Income From <br />
                <span className="gradient-text-shimmer text-glow-gold">
                  AI Mastery
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-medium max-w-2xl mx-auto">
                Master <strong className="text-amber-400 font-bold">3D WebGL Web Making</strong>, Full-Stack React Web Development, n8n AI Automations, Meta Ads Funnels, Instagram Organic Growth & High-Margin Digital Products in 30 Days.
              </p>
            </div>

            {/* Verified Student Social Proof Stack */}
            <div className="flex flex-wrap items-center justify-center gap-5 pt-1">
              <div className="flex items-center -space-x-3">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Student" className="w-10 h-10 rounded-full ring-2 ring-amber-400 object-cover" />
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="Student" className="w-10 h-10 rounded-full ring-2 ring-purple-400 object-cover" />
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="Student" className="w-10 h-10 rounded-full ring-2 ring-cyan-400 object-cover" />
                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" alt="Student" className="w-10 h-10 rounded-full ring-2 ring-amber-400 object-cover" />
              </div>
              <div className="text-left text-xs">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <span className="text-sm">4.98</span>
                  <div className="flex text-amber-400 text-xs">★★★★★</div>
                </div>
                <p className="text-slate-400 font-medium text-[11px]">18,450+ Active Enrolled Students</p>
              </div>
            </div>

            {/* Benefit Badges Strip */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {benefits.map((b, i) => (
                <span
                  key={i}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs font-semibold text-slate-200 shadow-md hover:border-amber-400/50 transition-colors"
                >
                  {b}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
              <button
                onClick={handleEnroll}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl btn-3d-gold flex items-center justify-center gap-3 text-base font-black uppercase tracking-wider"
              >
                <Flame className="w-5 h-5 text-black fill-black" />
                <span>Enroll Now — ₹1,299</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  const elem = document.getElementById('curriculum') || document.getElementById('modules');
                  if (elem) {
                    elem.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    setSelectedCourseId(flagship.id);
                    setActiveTab('course-detail');
                  }
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl btn-3d-glass flex items-center justify-center gap-2 text-sm font-bold cursor-pointer hover:scale-105 transition-all"
              >
                <Play className="w-4 h-4 fill-white text-white" />
                <span>Watch Course Demo</span>
              </button>
            </div>

            {/* Micro Trust Indicators */}
            <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-2 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> 7-Day 100% Money-Back Guarantee
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" /> Instant Access
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. METRICS & PROOF BAR
         ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 rounded-3xl border border-purple-500/30 grid grid-cols-2 md:grid-cols-4 gap-6 text-center reveal-scale">
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-white">18,450+</p>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Students Enrolled</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-amber-400">4.98 ★</p>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Average Rating</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-purple-400">₹3.5 Cr+</p>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Student Earnings Proof</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-cyan-400">100%</p>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Practical Implementation</p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. CURRICULUM MODULES SECTION (THE 7 MODULES)
         ───────────────────────────────────────────────────────────── */}
      <section id="curriculum" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="text-center space-y-3 max-w-3xl mx-auto reveal">
          <div className="sticker-badge-gold inline-block uppercase font-mono">
            Structured Learning Blueprint
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            7 Complete Income From AI Modules
          </h2>
          <p className="text-sm text-slate-300">
            From basic 3D WebGL rendering to advanced AI automation setups and client acquisition scripts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Module Accordion List */}
          <div className="lg:col-span-7 space-y-4">
            {modules.map((mod, idx) => {
              const IconComp = mod.icon;
              const isOpen = openModuleIndex === idx;
              return (
                <Card3DTilt key={idx} maxTilt={6} scale={1.01}>
                  <div
                    className={`rounded-2xl glass-panel transition-all ${
                      isOpen ? 'border-amber-400/60 bg-purple-950/30' : 'hover:border-purple-400/40'
                    }`}
                  >
                    <button
                      onClick={() => setOpenModuleIndex(isOpen ? null : idx)}
                      className="w-full p-5 text-left font-bold text-sm text-white flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                          <IconComp className="w-5 h-5 text-amber-300" />
                        </div>
                        <span className="text-base sm:text-lg font-black text-white">{mod.title}</span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-amber-400 transition-transform duration-300 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-6 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4 space-y-3">
                        <p>{mod.desc}</p>
                        
                        <div className="space-y-1.5 pt-2">
                          <p className="text-xs font-mono text-amber-400 font-bold uppercase">Key Lessons Included:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
                            {mod.lessons.map((lesson, lIdx) => (
                              <div key={lIdx} className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>{lesson}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-amber-400 font-bold pt-2">
                          <Download className="w-4 h-4 text-emerald-400" /> Full Source Code & Project Files Download Included
                        </div>
                      </div>
                    )}
                  </div>
                </Card3DTilt>
              );
            })}
          </div>

          {/* Right Highlight Box */}
          <div className="lg:col-span-5">
            <Card3DTilt maxTilt={10}>
              <div className="glass-panel-gold p-8 rounded-3xl space-y-6 relative overflow-hidden">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-black text-2xl shadow-xl shadow-amber-400/30">
                  ⚡
                </div>
                <h3 className="text-2xl font-black text-white leading-snug">
                  Build 3 Real Commercial Startup Projects
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  You won't just watch videos. You will hand-code a 3D WebGL landing page, deploy an automated AI lead nurture scenario in n8n, and launch your own digital product shop.
                </p>

                <div className="space-y-2.5 pt-2 text-xs font-semibold text-slate-200">
                  <div className="flex items-center gap-2.5 bg-black/40 p-2.5 rounded-xl border border-amber-400/20">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Project 1: 3D React WebGL Startup Landing Page</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-black/40 p-2.5 rounded-xl border border-amber-400/20">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Project 2: n8n AI Lead Capture & Nurture Bot</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-black/40 p-2.5 rounded-xl border border-amber-400/20">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Project 3: Automated Digital Product Storefront</span>
                  </div>
                </div>

                <button
                  onClick={handleEnroll}
                  className="w-full py-4 rounded-xl btn-3d-gold text-xs font-black text-black uppercase tracking-wider"
                >
                  Unlock Full Access to All 7 Modules
                </button>
              </div>
            </Card3DTilt>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. 🎁 INCLUDED FREE BONUSES SECTION
         ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="text-center space-y-3 max-w-3xl mx-auto reveal">
          <div className="sticker-badge-gold inline-flex items-center gap-2 uppercase">
            <Gift className="w-4 h-4 text-black animate-bounce" />
            <span>Included Free With Enrollment Today</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            Claim <span className="gradient-text-shimmer text-glow-gold">₹70,000+ Worth</span> of Free Bonuses
          </h2>
          <p className="text-sm text-slate-300">
            Get instant lifetime download access to all bonus toolkits immediately upon joining.
          </p>
        </div>

        {/* 3 Premium Bonus Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {bonuses.map((b, idx) => {
            const IconComponent = b.icon;
            return (
              <Card3DTilt key={idx} maxTilt={10} scale={1.03}>
                <div className="glass-panel p-8 rounded-3xl space-y-6 flex flex-col justify-between h-full border border-purple-500/30">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 border border-amber-400/40 flex items-center justify-center font-bold">
                        <IconComponent className="w-6 h-6 text-amber-300" />
                      </div>
                      <span className="sticker-badge-gold">
                        {b.badge}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-white text-xl leading-snug">{b.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{b.desc}</p>

                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <p className="text-[11px] font-mono text-amber-400 font-bold uppercase">Included Toolkits:</p>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {b.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 italic">
                    Instant access inside student portal upon enrolment.
                  </div>
                </div>
              </Card3DTilt>
            );
          })}
        </div>

        {/* 🎟️ GOLDEN TICKET OPPORTUNITY */}
        <Card3DTilt maxTilt={5} scale={1.01}>
          <div className="glass-panel-gold rounded-3xl p-8 sm:p-12 border-2 border-amber-400/80 shadow-2xl shadow-amber-500/20 space-y-8">
            
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-400/30 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-black flex items-center justify-center font-black text-3xl shadow-xl shadow-amber-400/40">
                  🎟️
                </div>
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-amber-300 font-bold flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-300 fill-amber-300" /> Golden Ticket Opportunity
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-black text-white">
                    Build a Startup With Aadarsh Rathore
                  </h3>
                </div>
              </div>

              <span className="sticker-badge-gold">
                🚀 Only 1 Student Per Batch Selected
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-7 space-y-4 text-sm text-slate-200">
                <p className="leading-relaxed">
                  From every batch, <strong className="text-amber-300">ONE top-performing student</strong> will be invited to work directly with <strong className="text-white">Aadarsh Rathore (Sawadh Sera)</strong> on a real live commercial startup project.
                </p>

                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wider">
                    Selected student gains:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-200">
                    <li className="flex items-center gap-2">
                      <span className="text-amber-400">✨</span> Direct 1-on-1 mentorship & architecture guidance
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-400">🚀</span> Real production codebase deployment & testing
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-400">🤝</span> Potential long-term co-founder or paid retainer partner
                    </li>
                  </ul>
                </div>
              </div>

              <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-amber-400/30 space-y-3 bg-black/60">
                <h4 className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wider">
                  Selection Metrics
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-200 font-semibold">
                  <div className="bg-amber-400/10 border border-amber-400/20 p-2 rounded-lg flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400" /> Consistency
                  </div>
                  <div className="bg-amber-400/10 border border-amber-400/20 p-2 rounded-lg flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400" /> Completion
                  </div>
                  <div className="bg-amber-400/10 border border-amber-400/20 p-2 rounded-lg flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400" /> Implementation
                  </div>
                  <div className="bg-amber-400/10 border border-amber-400/20 p-2 rounded-lg flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400" /> Problem-Solving
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-amber-400/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-amber-300 font-bold">
                Are you ready to build the future with AI?
              </span>

              <button
                onClick={handleEnroll}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl btn-3d-gold text-xs uppercase"
              >
                Enroll & Enter Golden Ticket Selection
              </button>
            </div>

          </div>
        </Card3DTilt>

      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. STUDENT REVIEWS & CASE STUDIES GRID
         ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="text-center space-y-3 max-w-2xl mx-auto reveal">
          <div className="sticker-badge-purple inline-block uppercase font-mono">
            Student Transformations
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            Real Results From Real Students
          </h2>
          <p className="text-sm text-slate-300">
            See how past batch students transitioned into 3D Web Developers, AI Automation Specialists, and Digital Creators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, idx) => (
            <Card3DTilt key={idx} maxTilt={8} scale={1.02}>
              <div className="glass-panel p-7 rounded-3xl border border-purple-500/30 space-y-5 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={item.avatar} alt={item.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-400" />
                      <div>
                        <h4 className="font-extrabold text-white text-sm">{item.name}</h4>
                        <p className="text-[11px] text-slate-400">{item.role}</p>
                      </div>
                    </div>
                    <div className="flex text-amber-400 text-xs">
                      {Array.from({ length: item.stars }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  <span className="inline-block bg-emerald-500/20 text-emerald-300 text-xs font-black px-3 py-1 rounded-full border border-emerald-500/40">
                    {item.earnings}
                  </span>

                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{item.comment}"
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Student Enrollment
                </div>
              </div>
            </Card3DTilt>
          ))}
        </div>

      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. PRICING & ENROLLMENT SECTION
         ───────────────────────────────────────────────────────────── */}
      <section id="pricing" className="max-w-4xl mx-auto px-4">
        <Card3DTilt maxTilt={8} scale={1.02}>
          <div className="glass-panel p-8 sm:p-14 rounded-3xl text-center space-y-7 relative overflow-hidden border-2 border-amber-400/50 shadow-2xl">
            
            <div className="inline-flex items-center gap-2 sticker-badge-gold">
              <Flame className="w-4 h-4 text-black fill-black" />
              <span>Limited Launch Discount • Save 91% OFF</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white">
              Get Complete Access to Income From AI
            </h2>

            <div className="flex items-baseline justify-center gap-4">
              <span className="text-6xl font-black gradient-text-shimmer">₹1,299</span>
              <span className="text-2xl text-slate-500 line-through">₹14,999</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              Includes all 7 Modules, ₹70,000+ Free Bonus Toolkits, Golden Ticket Selection & Lifetime Access by Sawadh Sera.
            </p>

            <button
              onClick={handleEnroll}
              className="w-full max-w-md py-5 rounded-2xl btn-3d-gold text-base font-black uppercase mx-auto flex items-center justify-center gap-2"
            >
              <span>Enroll Now — Claim ₹70,000+ Free Bonuses</span>
              <ArrowRight className="w-5 h-5 text-black" />
            </button>

            <div className="flex items-center justify-center gap-3 text-xs text-slate-300 font-semibold pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>7-Day 100% Money-Back Guarantee</span>
              <span>•</span>
              <Lock className="w-4 h-4 text-purple-400" />
              <span>Razorpay 256-Bit SSL Encrypted</span>
            </div>

          </div>
        </Card3DTilt>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. FAQ ACCORDION SECTION
         ───────────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2 reveal">
          <h2 className="text-3xl font-black text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full p-5 text-left font-bold text-sm text-white flex items-center justify-between gap-4 hover:text-amber-400 transition-colors"
              >
                <span>{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-amber-400 transition-transform ${openFaqIndex === idx ? 'rotate-180' : ''}`} />
              </button>

              {openFaqIndex === idx && (
                <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
