import React from 'react';
import { useApp } from '../../context/AppContext';
import { Flame, ShieldCheck, Lock, Globe, Mail, Phone, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const { flagship, setActiveTab, siteSettings } = useApp();

  return (
    <footer className="relative bg-[#030408] border-t border-purple-900/30 pt-16 pb-12 text-xs text-gray-400 overflow-hidden">
      
      {/* Animated gradient top border shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent animate-shimmer-text" style={{ backgroundSize: '200% 100%' }} />
      
      {/* Subtle ambient glow */}
      <div className="absolute top-0 left-1/4 w-96 h-48 bg-purple-600/5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-48 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-purple-600 p-0.5 shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 group-hover:scale-105 transition-all duration-300 animate-glow-ring">
                <div className="w-full h-full bg-[#030408] rounded-[14px] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-white tracking-wider group-hover:text-amber-100 transition-colors">
                  {siteSettings.siteName}
                </span>
                <span className="text-[10px] text-amber-400 font-bold uppercase font-mono">
                  Income From AI Platform
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              The premier practical learning platform to master AI automation, 3D WebGL website design, digital products, Meta Ads, and high-ticket client acquisition.
            </p>

            <div className="flex items-center gap-4 text-gray-400">
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> 256-Bit SSL Encrypted
              </span>
              <span className="flex items-center gap-1 text-[11px] text-purple-300 font-bold">
                <Lock className="w-4 h-4 text-purple-400" /> 100% Secure Checkout
              </span>
            </div>
          </div>

          {/* Col 2: Course Modules */}
          <div className="space-y-3 group">
            <h4 className="font-extrabold text-xs uppercase font-mono tracking-wider text-amber-400">
              Curriculum Modules
            </h4>
            <ul className="space-y-2 text-xs">
              {['Module 1: AI & Prompt Engineering', 'Module 2: Full-Stack Web Dev', 'Module 3: 3D Website Design', 'Module 4: AI Automations', 'Module 5: Meta Ads Funnels', 'Module 6: Instagram Reels Engine', 'Module 7: Client Retainers'].map((mod, i) => (
                <li key={i}>
                  <button
                    onClick={() => setActiveTab('home')}
                    className="hover:text-white hover:translate-x-1 transition-all duration-300 flex items-center gap-1"
                  >
                    <span className="w-1 h-1 rounded-full bg-purple-500/50" />
                    {mod}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Resources & Bonuses */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs uppercase font-mono tracking-wider text-purple-400">
              Bonus Resources
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                { label: '500+ ChatGPT Prompt Library', tab: 'study-material' },
                { label: '3D WebGL HTML Templates', tab: 'study-material' },
                { label: 'Cold Email Pitch Scripts', tab: 'study-material' },
                { label: 'AI Skill Certification Exam', tab: 'quizzes' },
                { label: 'Golden Ticket Opportunity', tab: 'home' },
              ].map((item, i) => (
                <li key={i}>
                  <button
                    onClick={() => setActiveTab(item.tab as any)}
                    className="hover:text-white hover:translate-x-1 transition-all duration-300 flex items-center gap-1"
                  >
                    <span className="w-1 h-1 rounded-full bg-amber-500/50" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Support */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs uppercase font-mono tracking-wider text-amber-400">
              Student Support
            </h4>
            <div className="space-y-2.5 text-xs text-gray-300">
              <p className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-3.5 h-3.5 text-amber-400" /> {siteSettings.supportEmail}
              </p>
              <p className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-3.5 h-3.5 text-amber-400" /> {siteSettings.supportPhone}
              </p>
              <p className="text-[11px] text-gray-400">Mon-Sat: 10:00 AM – 7:00 PM IST</p>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-400">
          <p>© 2026 {siteSettings.siteName}. All Rights Reserved. Course: Income From AI.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white cursor-pointer transition-colors duration-300">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors duration-300">Terms of Service</span>
            <span className="hover:text-white cursor-pointer transition-colors duration-300">Refund Policy</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
