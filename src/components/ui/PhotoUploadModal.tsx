import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Camera, Upload, X, Check, Image as ImageIcon } from 'lucide-react';
import { processImageUpload } from '../../utils/fileUpload';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePhoto: (photoUrl: string) => void;
  title?: string;
  currentPhotoUrl?: string;
  uploadToSupabaseStorage?: (file: File, folder?: string) => Promise<{ success: boolean; publicUrl: string }>;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  onSavePhoto,
  title = 'Upload Profile Photo',
  currentPhotoUrl = '',
  uploadToSupabaseStorage
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>(currentPhotoUrl);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);

    const res = await processImageUpload(file, uploadToSupabaseStorage);
    setIsUploading(false);

    if (res.success) {
      setPreviewUrl(res.url);
    } else {
      setErrorMsg(res.error || 'Failed to process image');
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);

    const res = await processImageUpload(file, uploadToSupabaseStorage);
    setIsUploading(false);

    if (res.success) {
      setPreviewUrl(res.url);
    } else {
      setErrorMsg(res.error || 'Failed to process image');
    }
  };

  const handleSave = () => {
    if (previewUrl) {
      onSavePhoto(previewUrl);
      onClose();
    }
  };

  const modalJSX = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="glass-panel max-w-md w-full my-auto max-h-[85vh] overflow-y-auto p-6 rounded-3xl border border-purple-500/40 space-y-6 relative shadow-2xl bg-[#0b0e1b]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 sticky top-0 bg-[#0b0e1b]/95 backdrop-blur-md z-20 pt-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-white text-lg">{title}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Photo Preview & Drop Area */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-purple-500/40 hover:border-amber-400/60 rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 bg-slate-900/50 hover:bg-slate-900/80 group space-y-4"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {previewUrl ? (
            <div className="relative w-28 h-28 mx-auto rounded-full overflow-hidden ring-4 ring-amber-400 shadow-xl group-hover:scale-105 transition-transform">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto rounded-full bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <ImageIcon className="w-8 h-8" />
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
              {isUploading ? 'Processing Photo...' : 'Click or Drag & Drop Photo Here'}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Supports PNG, JPG, WEBP (Max 10MB)</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-xs text-red-300 font-semibold text-center">
            {errorMsg}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          
          <button
            disabled={!previewUrl || isUploading}
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl text-xs font-black text-black bg-gradient-to-r from-amber-400 to-orange-400 hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save & Apply Photo</span>
          </button>
        </div>

      </div>
    </div>
  );

  return ReactDOM.createPortal(modalJSX, document.body);
};
