import React, { useState } from 'react';
import { MessageCircle, CheckCircle2, Copy, Check, ExternalLink, ArrowRight, AlertTriangle, X } from 'lucide-react';

export interface WhatsAppGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed?: () => void;
  transactionId?: string;
  amountPaid?: number;
  productTitle?: string;
  whatsappGroupUrl?: string;
}

export const WhatsAppGroupModal: React.FC<WhatsAppGroupModalProps> = ({
  isOpen,
  onClose,
  onProceed,
  transactionId,
  amountPaid,
  productTitle = 'Purchased File / Course',
  whatsappGroupUrl = 'https://chat.whatsapp.com/D7KO9Sr39oOJ1RDxM7OvqY'
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(whatsappGroupUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleJoin = () => {
    window.open(whatsappGroupUrl, '_blank', 'noopener,noreferrer');
  };

  const handleContinue = () => {
    if (onProceed) onProceed();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
      style={{ zIndex: 99999 }}
    >
      <div 
        className="relative w-full max-w-lg bg-gradient-to-b from-[#0e1626] via-[#090f1d] to-[#050912] border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/20 text-white space-y-5 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ambient Top Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Success Status Badge */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Purchase Successful & Verified</span>
          </div>

          {/* Requested Popup Title */}
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white capitalize leading-tight">
            whatsapp group for all furthur messages
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
            Thank you for purchasing <span className="font-semibold text-amber-400">{productTitle}</span>!
          </p>
        </div>

        {/* Purchase Summary Details (if available) */}
        {(transactionId || amountPaid !== undefined) && (
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-3.5 text-xs space-y-1.5">
            {transactionId && (
              <div className="flex justify-between items-center text-gray-400">
                <span>Payment Reference</span>
                <span className="font-mono text-gray-200">{transactionId}</span>
              </div>
            )}
            {amountPaid !== undefined && (
              <div className="flex justify-between items-center text-gray-400">
                <span>Amount Paid</span>
                <span className="font-bold text-white">₹{amountPaid.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Highlighted WhatsApp CTA Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleJoin}
            className="w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base text-white bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 shadow-xl shadow-green-500/25 flex items-center justify-center gap-3 transition-all duration-200 transform hover:scale-[1.02] cursor-pointer"
          >
            <MessageCircle className="w-6 h-6 fill-white text-emerald-600" />
            <span>Join WhatsApp Group Now</span>
            <ExternalLink className="w-4 h-4 opacity-80" />
          </button>

          {/* Copy Link Row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2.5 bg-gray-950/80 border border-gray-800 rounded-xl text-[11px] font-mono text-gray-400 truncate select-all">
              {whatsappGroupUrl}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Copy group invite link"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-300" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Disclaimer in RED COLOUR requested by user */}
        <div className="p-3.5 rounded-2xl bg-red-950/60 border-2 border-red-500 text-red-400 text-xs text-center flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="font-extrabold tracking-wide text-red-400 text-[13px]">
            please join this channel for furthur leactures and sessions
          </span>
        </div>

        {/* Continue / Close Navigation */}
        <div className="pt-2 border-t border-gray-800/80">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs text-gray-400 hover:text-white bg-gray-800/40 hover:bg-gray-800 border border-gray-700/60 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Proceed to Files & Learning Dashboard</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppGroupModal;
