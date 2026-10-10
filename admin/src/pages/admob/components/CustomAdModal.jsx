import React, { useState } from 'react';
import {
  X,
  Upload,
  Video,
  Image as ImageIcon,
  ExternalLink,
  Sparkles,
  Play,
  Clock,
  Layers,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Smartphone,
  Eye
} from 'lucide-react';
import { uploadService } from '../../../services/uploadService';
import ModalPortal from '../../../components/common/ModalPortal';

const FORMAT_OPTIONS = [
  { id: 'VIDEO_PREROLL', label: 'Video Pre-Roll', desc: '10-15s video before episode stream', icon: Video },
  { id: 'INTERSTITIAL', label: 'Interstitial Card', desc: 'Full-screen poster during navigation', icon: Smartphone },
  { id: 'BANNER', label: 'Display Banner', desc: 'Landscape banner in feed or player footer', icon: ImageIcon },
  { id: 'NATIVE_CARD', label: 'Native In-Feed Card', desc: 'Sponsored card between drama carousels', icon: Layers },
];

const PLACEMENT_OPTIONS = [
  { id: 'ALL_PLACEMENTS', label: 'All Placements (Universal)' },
  { id: 'PLAYER_PREROLL', label: 'Video Player Pre-Roll (Before Episode)' },
  { id: 'EPISODE_TRANSITION', label: 'Episode End / Transition' },
  { id: 'HOME_BANNER', label: 'Home Page Hero / Feed Banner' },
  { id: 'DRAWER_CARD', label: 'Episodes Drawer / Sidebar Card' },
  { id: 'GLOBAL_POPUP', label: 'App Launch Global Modal' },
];

const CTA_ACTION_OPTIONS = [
  { id: 'EXTERNAL_URL', label: 'External Website Link (Browser)' },
  { id: 'DEEP_LINK_SUBSCRIPTION', label: 'In-App Subscription Paywall' },
  { id: 'DEEP_LINK_DRAMA', label: 'In-App Drama Series Deep-link' },
  { id: 'IN_APP_BROWSER', label: 'Embedded Webview' },
];

export default function CustomAdModal({ initialData, onClose, onSave }) {
  const isEdit = Boolean(initialData?.id || initialData?._id);

  const [form, setForm] = useState(() => ({
    title: initialData?.title || '',
    advertiser: initialData?.advertiser || '',
    type: initialData?.type || 'VIDEO_PREROLL',
    placement: initialData?.placement || 'PLAYER_PREROLL',
    mediaType: initialData?.mediaType || (initialData?.type === 'VIDEO_PREROLL' ? 'VIDEO' : 'IMAGE'),
    mediaUrl: initialData?.mediaUrl || '',
    thumbnailUrl: initialData?.thumbnailUrl || '',
    videoDuration: initialData?.videoDuration ?? 15,
    skipAfterSeconds: initialData?.skipAfterSeconds ?? 5,
    ctaText: initialData?.ctaText || 'Learn More',
    ctaAction: initialData?.ctaAction || 'EXTERNAL_URL',
    targetUrl: initialData?.targetUrl || '',
    priority: initialData?.priority ?? 8,
    status: initialData?.status || 'ACTIVE',
    startDate: initialData?.startDate
      ? new Date(initialData.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    endDate: initialData?.endDate
      ? new Date(initialData.endDate).toISOString().split('T')[0]
      : '',
  }));

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (field, val) => {
    setForm(prev => {
      const updated = { ...prev, [field]: val };
      if (field === 'type') {
        if (val === 'VIDEO_PREROLL') {
          updated.mediaType = 'VIDEO';
          if (updated.placement === 'ALL_PLACEMENTS') updated.placement = 'PLAYER_PREROLL';
        } else {
          updated.mediaType = 'IMAGE';
          if (updated.placement === 'PLAYER_PREROLL') updated.placement = 'HOME_BANNER';
        }
      }
      return updated;
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');
    try {
      const folder = form.mediaType === 'VIDEO' ? 'videos' : 'images';
      const result = await uploadService.uploadSingle(file, folder);
      if (result?.url) {
        handleChange('mediaUrl', result.url);
      }
    } catch (err) {
      setUploadError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.title.trim()) {
      setFormError('Please enter a campaign title.');
      return;
    }
    if (!form.advertiser.trim()) {
      setFormError('Please enter an advertiser or brand name.');
      return;
    }
    if (!form.mediaUrl.trim()) {
      setFormError('Please upload media or provide a media URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        priority: Number(form.priority),
        videoDuration: Number(form.videoDuration),
        skipAfterSeconds: Number(form.skipAfterSeconds),
        endDate: form.endDate ? form.endDate : null,
      };
      await onSave(payload, initialData?.id || initialData?._id);
      onClose();
    } catch (err) {
      setFormError(err.message || 'Failed to save custom ad.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal isOpen={true}>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm overflow-y-auto font-urbanist animate-fade-in">
      <div className="relative w-full max-w-5xl bg-white dark:bg-[#30303D] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/15 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-white/10 shrink-0 bg-slate-50/60 dark:bg-[#24242E]/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
              <Sparkles className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {isEdit ? 'Edit Custom Ad Campaign' : 'Create Custom Ad Campaign'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct sponsor branding, in-house promos & high-impact vertical video ads.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split View (Form + Live Mockup Preview) */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Form (7 cols) */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Campaign Title & Advertiser */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Campaign Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Monster Energy — Unleash the Beast"
                  value={form.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FEF08A]/60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Advertiser / Sponsor Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Monster Beverage / E² Store"
                  value={form.advertiser}
                  onChange={(e) => handleChange('advertiser', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FEF08A]/60"
                />
              </div>
            </div>

            {/* Format Selection (Pill grid) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Ad Format Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FORMAT_OPTIONS.map((fmt) => {
                  const Icon = fmt.icon;
                  const isSelected = form.type === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => handleChange('type', fmt.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#FEF08A]/20 dark:bg-[#FEF08A]/10 border-amber-300 dark:border-amber-400 text-slate-950 dark:text-white ring-1 ring-amber-300'
                          : 'bg-slate-50/70 dark:bg-[#18181E] border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-500 dark:text-[#FEF08A]' : 'text-slate-400'}`} />
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                      </div>
                      <span className="text-xs font-extrabold block leading-tight">{fmt.label}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{fmt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Placement & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Placement Slot
                </label>
                <select
                  value={form.placement}
                  onChange={(e) => handleChange('placement', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FEF08A]/60"
                >
                  {PLACEMENT_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Priority Weight (1–10)</span>
                  <span className="text-amber-500 font-extrabold">{form.priority}/10</span>
                </label>
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={form.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    className="flex-1 accent-[#FEF08A] cursor-pointer"
                  />
                  <span className="text-xs font-black text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-[#18181E] border border-slate-200 dark:border-white/10">
                    {form.priority}
                  </span>
                </div>
              </div>
            </div>

            {/* Media Creative (URL + Upload Button) */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#18181E] border border-slate-200/80 dark:border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  {form.mediaType === 'VIDEO' ? <Video className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                  <span>Creative Media File or URL</span>
                  <span className="text-rose-500">*</span>
                </label>
                
                {/* Upload Button */}
                <label className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-[#24242E] border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08] cursor-pointer shadow-xs transition-colors">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3 text-slate-500" />
                      <span>Upload Asset</span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept={form.mediaType === 'VIDEO' ? 'video/mp4,video/webm,video/quicktime' : 'image/*'}
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>

              <input
                type="url"
                required
                placeholder={form.mediaType === 'VIDEO' ? 'https://.../video.mp4' : 'https://.../poster.jpg'}
                value={form.mediaUrl}
                onChange={(e) => handleChange('mediaUrl', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FEF08A]/60"
              />

              {uploadError && (
                <p className="text-[11px] text-rose-500 font-medium">{uploadError}</p>
              )}

              {/* Video Specific Controls */}
              {form.mediaType === 'VIDEO' && (
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/60 dark:border-white/5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Duration (Seconds)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={form.videoDuration}
                      onChange={(e) => handleChange('videoDuration', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Skip Button Delay (Sec, 0 = Non-skip)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={form.skipAfterSeconds}
                      onChange={(e) => handleChange('skipAfterSeconds', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CTA & Target Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Call-To-Action Button Text
                </label>
                <input
                  type="text"
                  placeholder="e.g., Learn More / Shop Now"
                  value={form.ctaText}
                  onChange={(e) => handleChange('ctaText', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FEF08A]/60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Action Destination Type
                </label>
                <select
                  value={form.ctaAction}
                  onChange={(e) => handleChange('ctaAction', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FEF08A]/60"
                >
                  {CTA_ACTION_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Destination Target URL / Link
              </label>
              <input
                type="text"
                placeholder="https://sponsor.com or /subscriptions or dramaId"
                value={form.targetUrl}
                onChange={(e) => handleChange('targetUrl', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FEF08A]/60"
              />
            </div>

            {/* Schedule & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FEF08A]/60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FEF08A]/60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Campaign Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FEF08A]/60"
                >
                  <option value="ACTIVE">ACTIVE (Live)</option>
                  <option value="PAUSED">PAUSED</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-black bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isEdit ? 'Save Changes' : 'Create Custom Ad'}</span>
              </button>
            </div>
          </form>

          {/* Right Live Device Mockup Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#18181E] p-4 rounded-2xl border border-slate-200/80 dark:border-white/10">
            <div className="w-full flex items-center justify-between mb-3 text-xs">
              <span className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-500" />
                Live In-App Mobile Preview
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-400/30">
                {form.type}
              </span>
            </div>

            {/* Phone Screen Mockup Frame */}
            <div className="w-[280px] h-[480px] bg-slate-950 rounded-[32px] p-2.5 shadow-2xl border-[4px] border-slate-800 relative overflow-hidden flex flex-col justify-between font-urbanist select-none">
              
              {/* Phone Speaker Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-slate-900 rounded-full z-20" />

              {/* Mock App Content (Behind Ad) */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-3 pt-8 flex flex-col justify-between opacity-30 pointer-events-none">
                <div className="space-y-2">
                  <div className="w-20 h-4 bg-slate-700 rounded" />
                  <div className="w-48 h-2.5 bg-slate-800 rounded" />
                </div>
                <div className="w-full h-32 bg-slate-800/40 rounded-xl" />
                <div className="space-y-1">
                  <div className="w-32 h-3 bg-slate-700 rounded" />
                  <div className="w-full h-8 bg-slate-800 rounded-lg" />
                </div>
              </div>

              {/* Dynamic Live Ad Overlay according to type */}
              <div className="relative z-10 w-full h-full flex flex-col justify-between p-2">
                
                {/* 1. Video Pre-roll Mockup */}
                {form.type === 'VIDEO_PREROLL' && (
                  <div className="w-full h-full flex flex-col justify-between rounded-2xl overflow-hidden relative bg-black/90 border border-white/10">
                    {/* Media representation */}
                    {form.mediaUrl ? (
                      form.mediaType === 'VIDEO' ? (
                        <video
                          src={form.mediaUrl}
                          className="w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={form.mediaUrl}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                        <Play className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-[11px]">Video Pre-roll Preview</span>
                      </div>
                    )}

                    {/* Top Ad Indicator Bar */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] text-white">
                      <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs font-bold border border-white/10">
                        Ad · 0:{form.videoDuration}
                      </span>
                      <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs font-bold border border-white/10">
                        Skip in {form.skipAfterSeconds}s
                      </span>
                    </div>

                    {/* Bottom CTA Overlay */}
                    <div className="absolute bottom-2 left-2 right-2 p-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/15">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <p className="text-white text-[11px] font-black truncate">{form.title || 'Campaign Name'}</p>
                          <p className="text-slate-400 text-[9px] truncate">{form.advertiser || 'Brand Sponsor'}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-[#FEF08A] text-slate-950 font-black text-[10px] shrink-0 shadow-xs">
                          {form.ctaText || 'Learn More'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Interstitial Mockup */}
                {form.type === 'INTERSTITIAL' && (
                  <div className="w-full h-full flex flex-col justify-center items-center p-3 relative">
                    <div className="w-full max-h-[380px] bg-[#18181E] rounded-2xl border border-white/20 p-3 shadow-2xl flex flex-col justify-between relative overflow-hidden">
                      <div className="w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center absolute top-2 right-2 text-[10px]">
                        ✕
                      </div>
                      
                      <div className="w-full h-44 rounded-xl overflow-hidden bg-slate-900 relative mb-2">
                        {form.mediaUrl ? (
                          <img src={form.mediaUrl} alt="ad" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                            Interstitial Poster
                          </div>
                        )}
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-amber-300">
                          SPONSORED
                        </span>
                      </div>

                      <div className="space-y-1 my-1">
                        <h4 className="text-white font-extrabold text-xs leading-snug line-clamp-1">{form.title || 'Special Promotion'}</h4>
                        <p className="text-slate-400 text-[10px] line-clamp-1">{form.advertiser || 'Sponsor Name'}</p>
                      </div>

                      <button type="button" className="w-full py-1.5 rounded-lg bg-[#FEF08A] text-slate-950 font-black text-[11px] mt-2">
                        {form.ctaText || 'Claim Offer'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Banner Mockup */}
                {form.type === 'BANNER' && (
                  <div className="w-full h-full flex flex-col justify-end p-1">
                    <div className="w-full h-16 rounded-xl overflow-hidden bg-[#18181E] border border-amber-300/40 p-1.5 flex items-center justify-between shadow-xl">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                        {form.mediaUrl ? (
                          <img src={form.mediaUrl} alt="banner" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-500">Banner</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 px-2">
                        <span className="text-[8px] font-bold text-amber-300 block">ADVERTISEMENT</span>
                        <p className="text-white text-[10px] font-bold truncate">{form.title || 'Banner Title'}</p>
                      </div>
                      <span className="px-2 py-1 rounded bg-[#FEF08A] text-slate-950 text-[9px] font-black shrink-0">
                        {form.ctaText || 'Open'}
                      </span>
                    </div>
                  </div>
                )}

                {/* 4. Native In-Feed Card */}
                {form.type === 'NATIVE_CARD' && (
                  <div className="w-full h-full flex flex-col justify-center p-2">
                    <div className="w-full bg-[#121216] rounded-xl border border-white/15 p-2.5 space-y-2">
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-extrabold">Sponsored</span>
                        <span className="text-slate-500">{form.advertiser || 'Direct Sponsor'}</span>
                      </div>
                      <div className="w-full h-28 rounded-lg overflow-hidden bg-slate-800">
                        {form.mediaUrl ? (
                          <img src={form.mediaUrl} alt="native" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">Feed Creative</div>
                        )}
                      </div>
                      <p className="text-white text-xs font-bold line-clamp-1">{form.title || 'In-Feed Native Headline'}</p>
                      <button type="button" className="w-full py-1 rounded-lg bg-[#FEF08A] text-slate-950 font-black text-[10px]">
                        {form.ctaText || 'Learn More'}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-3 font-medium">
              Real-time interactive mobile preview of your creative asset.
            </p>
          </div>
        </div>
      </div>
    </div>
  </ModalPortal>
);
}
