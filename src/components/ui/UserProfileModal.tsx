import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useApp } from '../../context/AppContext';
import { PhotoUploadModal } from './PhotoUploadModal';
import {
  User as UserIcon,
  Camera,
  Mail,
  Phone,
  ShieldCheck,
  GraduationCap,
  Calendar,
  LogOut,
  X,
  Check,
  Edit3
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, currentRole, logout, updateUserProfile, uploadToSupabaseStorage, showToast, setActiveTab } = useApp();

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser?.name || '');
  const [phoneInput, setPhoneInput] = useState(currentUser?.phone || '');

  if (!isOpen || !currentUser) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    updateUserProfile({
      name: nameInput.trim(),
      phone: phoneInput.trim()
    });
    setIsEditingName(false);
    showToast('Profile details updated successfully! ✨');
  };

  const handleSavePhoto = (newPhotoUrl: string) => {
    updateUserProfile({ avatar: newPhotoUrl });
    showToast('Profile photo updated successfully! 📸');
  };

  const isMasterAdmin = currentRole === 'admin';

  const modalJSX = (
    <>
      {/* Root Portal Backdrop - Escapes sticky header stacking context completely */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
        <div className="relative w-full max-w-lg mx-auto my-auto max-h-[85vh] overflow-y-auto glass-panel p-6 sm:p-8 rounded-3xl border border-purple-500/50 shadow-2xl bg-[#0b0e1b] text-slate-100 space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 sticky top-0 bg-[#0b0e1b]/95 backdrop-blur-md z-20 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-purple-600 p-0.5 shadow-lg shadow-purple-500/20 shrink-0">
                <div className="w-full h-full bg-[#0b0e1b] rounded-[14px] flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div>
                <h3 className="font-extrabold text-white text-lg leading-snug">My Profile & Account Details</h3>
                <p className="text-[11px] text-slate-400">View details and manage your profile photo</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Centered Profile Photo Avatar Section */}
          <div className="flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-slate-900/70 border border-slate-800/90 space-y-4">
            
            <div
              className="relative group cursor-pointer"
              onClick={() => setIsPhotoModalOpen(true)}
              title="Click to Upload New Photo"
            >
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                alt={currentUser.name}
                className="w-28 h-28 rounded-full object-cover ring-4 ring-amber-400/90 shadow-2xl group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white animate-bounce" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-400 text-black p-2 rounded-full shadow-lg border border-black">
                <Camera className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-2 text-center">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <h4 className="font-black text-white text-2xl">{currentUser.name}</h4>
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-black font-mono uppercase tracking-wider ${
                  isMasterAdmin ? 'bg-purple-600 text-white border border-purple-400' : 'bg-amber-400 text-black shadow'
                }`}>
                  {isMasterAdmin ? 'Master Admin' : 'Student Account'}
                </span>
              </div>

              <p className="text-xs text-slate-300 flex items-center justify-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentUser.email}</span>
              </p>

              <div className="pt-1">
                <button
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-black shadow-lg transition-all flex items-center justify-center gap-2 mx-auto uppercase tracking-wider"
                >
                  <Camera className="w-4 h-4 text-black fill-black" />
                  <span>Upload New Photo</span>
                </button>
              </div>
            </div>

          </div>

          {/* Centered Personal Information Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 text-center sm:text-left">
              Personal Information
            </h4>

            {isEditingName ? (
              <form onSubmit={handleSaveProfile} className="space-y-3 p-4 rounded-2xl bg-slate-900/60 border border-purple-500/40">
                <div>
                  <label className="text-[11px] font-bold text-slate-400">Full Name</label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400">Phone Number</label>
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-amber-400 text-black text-xs font-black hover:bg-amber-300"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5 text-amber-400" /> Full Name
                  </span>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white text-sm">{currentUser.name}</p>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-amber-400 hover:text-amber-300 p-1"
                      title="Edit Name"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-amber-400" /> Phone Number
                  </span>
                  <p className="font-bold text-white text-sm">{currentUser.phone || 'Not Provided'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" /> Account Created
                  </span>
                  <p className="font-bold text-white text-sm">{currentUser.createdAt || 'Active'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Account Access
                  </span>
                  <p className="font-bold text-emerald-400 text-sm flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Verified Active
                  </p>
                </div>

              </div>
            )}
          </div>

          {/* Centered Quick Actions & Navigation */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                onClose();
                setActiveTab(isMasterAdmin ? 'admin-dashboard' : 'student-dashboard');
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
            >
              <GraduationCap className="w-4.5 h-4.5" />
              <span>Go to My Dashboard</span>
            </button>

            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span>Log Out</span>
            </button>
          </div>

        </div>
      </div>

      {/* Embedded Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        title="Upload My Profile Photo"
        currentPhotoUrl={currentUser.avatar}
        uploadToSupabaseStorage={uploadToSupabaseStorage}
        onSavePhoto={handleSavePhoto}
      />
    </>
  );

  return ReactDOM.createPortal(modalJSX, document.body);
};
