import React from 'react';
import { X, Smartphone, Play, Lock, CheckCircle, Shield, Award, Heart } from 'lucide-react';

export default function MobileAppDrawer({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div class="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end font-urbanist">
      
      <div class="w-full max-w-md bg-slate-900 text-white h-full shadow-2xl flex flex-col border-l border-slate-800 animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div class="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div class="flex items-center space-x-3">
            <img
              src="/logo-transparent.png"
              alt="E² Stories Logo"
              class="h-9 w-auto object-contain drop-shadow-sm"
            />
            <div>
              <h3 class="font-extrabold text-base text-white">Mobile App UI Contract</h3>
              <p class="text-xs text-slate-400">Vertical Short-Drama OTT Companion</p>
            </div>
          </div>

          <button
            onClick={onClose}
            class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scroll Content */}
        <div class="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          <div class="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4">
            <div class="flex items-center space-x-2 text-amber-400 font-bold text-xs mb-1">
              <Smartphone class="w-4 h-4" />
              <span>Combined Design Reference</span>
            </div>
            <p class="text-slate-300 text-xs leading-relaxed">
              This Admin Panel directly feeds the E² Stories Mobile App (`+91` Phone Auth, Short-dramas, Episode drawers, ₹199/₹1,499 VIP Subscriptions).
            </p>
          </div>

          {/* Screenshot Breakdown 1 */}
          <div class="space-y-2">
            <h4 class="font-bold text-sm text-slate-200 flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>1. Mobile Auth & Onboarding Flow</span>
            </h4>
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-slate-400">
              <p>• Phone OTP authentication (+91 country code default)</p>
              <p>• 4-Digit SMS verification with 60s cooldown timer</p>
              <p>• User profile setup (First name, Last name, Email)</p>
              <p>• Multi-genre onboarding interest picker (Romance, Thriller, Drama, Horror, Action)</p>
            </div>
          </div>

          {/* Screenshot Breakdown 2 */}
          <div class="space-y-2">
            <h4 class="font-bold text-sm text-slate-200 flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-[#FEF08A]"></span>
              <span>2. Home Feed & Explore Reel</span>
            </h4>
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-slate-400">
              <p>• Hero Banner featured carousel (Curated by Admin)</p>
              <p>• "Continue Watching" row with episode badges & progress bars</p>
              <p>• Ranked Trending list (`1`, `2`, `3` badge ranks)</p>
              <p>• Vertical TikTok/Reels trailer previews with "Watch Now" & "Episodes" drawer</p>
            </div>
          </div>

          {/* Screenshot Breakdown 3 */}
          <div class="space-y-2">
            <h4 class="font-bold text-sm text-slate-200 flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>3. Video Player & Monetization</span>
            </h4>
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-slate-400">
              <p>• Full-screen 9:16 portrait video player with resolution & subtitle pickers</p>
              <p>• Episodes 1–3 Free preview; Episode 4+ VIP Locked</p>
              <p>• Razorpay Membership checkout: Monthly ₹199 / Yearly ₹1,499</p>
              <p>• User Profile: VIP Badge, Saved Series (Watchlist), Watch History</p>
            </div>
          </div>

        </div>

        {/* Drawer Footer */}
        <div class="p-4 border-t border-slate-800 bg-slate-950 text-center">
          <button
            onClick={onClose}
            class="w-full py-2.5 bg-[#FEF08A] hover:bg-[#FDE047] text-black font-bold rounded-xl text-xs transition-colors"
          >
            Close Reference Drawer
          </button>
        </div>

      </div>

    </div>
  );
}
