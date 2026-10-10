import React, { useState } from 'react';
import {
  Plus,
  Search,
  Video,
  Image as ImageIcon,
  Layers,
  Smartphone,
  Eye,
  MousePointerClick,
  Sparkles,
  Play,
  RotateCcw,
  Trash2,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Filter,
  ExternalLink,
  Calendar,
  AlertCircle
} from 'lucide-react';

const FORMAT_TABS = [
  { id: 'ALL', label: 'All Formats' },
  { id: 'VIDEO_PREROLL', label: 'Video Pre-Roll', icon: Video },
  { id: 'INTERSTITIAL', label: 'Interstitial', icon: Smartphone },
  { id: 'BANNER', label: 'Banner', icon: ImageIcon },
  { id: 'NATIVE_CARD', label: 'Native Card', icon: Layers },
];

const STATUS_TABS = [
  { id: 'ALL', label: 'All Status' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'PAUSED', label: 'Paused' },
  { id: 'EXPIRED', label: 'Expired' },
];

export default function CustomAdsTab({
  ads,
  stats,
  isLoading,
  onOpenCreateModal,
  onOpenEditModal,
  onToggleStatus,
  onDeleteAd,
  onResetStats
}) {
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [resettingId, setResettingId] = useState(null);

  const filteredAds = ads.filter((ad) => {
    if (selectedFormat !== 'ALL' && ad.type !== selectedFormat) return false;
    if (selectedStatus !== 'ALL' && ad.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ad.title?.toLowerCase().includes(q);
      const matchAdv = ad.advertiser?.toLowerCase().includes(q);
      if (!matchTitle && !matchAdv) return false;
    }
    return true;
  });

  const getFormatBadge = (type) => {
    switch (type) {
      case 'VIDEO_PREROLL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
            <Video className="w-3 h-3" /> Pre-Roll Video
          </span>
        );
      case 'INTERSTITIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
            <Smartphone className="w-3 h-3" /> Interstitial
          </span>
        );
      case 'BANNER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <ImageIcon className="w-3 h-3" /> Banner
          </span>
        );
      case 'NATIVE_CARD':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            <Layers className="w-3 h-3" /> Native Card
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 dark:bg-[#18181E] text-slate-700 dark:text-slate-300">
            {type}
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            ACTIVE
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            PAUSED
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-[#18181E] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10">
            EXPIRED
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4 font-urbanist">
      
      {/* Top Banner & Quick Metrics */}
      <div className="bg-white dark:bg-[#121216] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                Direct Advertisers & In-House Custom Ads
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#FEF08A]/30 text-amber-900 dark:text-[#FEF08A] border border-amber-300/50 dark:border-amber-400/30 text-[10.5px] font-extrabold">
                {ads.length} Campaigns Total
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Serve 100% margin direct sponsorships, brand takeovers, partner apps, and in-house merchandise promos.
            </p>
          </div>

          {/* Quick CTA */}
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 shadow-xs transition-all cursor-pointer self-start md:self-auto shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Custom Ad</span>
          </button>
        </div>

        {/* 4 Mini Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#18181E] border border-slate-200/60 dark:border-white/5">
            <span className="text-[11px] font-bold text-slate-400 block">Active Campaigns</span>
            <span className="text-base font-black text-slate-950 dark:text-white">
              {stats?.activeCount ?? ads.filter(a => a.status === 'ACTIVE').length} Live
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#18181E] border border-slate-200/60 dark:border-white/5">
            <span className="text-[11px] font-bold text-slate-400 block">Total Impressions</span>
            <span className="text-base font-black text-slate-950 dark:text-white">
              {(stats?.totalImpressions ?? ads.reduce((s, a) => s + (a.impressionsCount || 0), 0)).toLocaleString()}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#18181E] border border-slate-200/60 dark:border-white/5">
            <span className="text-[11px] font-bold text-slate-400 block">Total Taps / Clicks</span>
            <span className="text-base font-black text-slate-950 dark:text-white">
              {(stats?.totalClicks ?? ads.reduce((s, a) => s + (a.clicksCount || 0), 0)).toLocaleString()}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#18181E] border border-slate-200/60 dark:border-white/5">
            <span className="text-[11px] font-bold text-slate-400 block">Average CTR</span>
            <span className="text-base font-black text-amber-600 dark:text-[#FEF08A]">
              {stats?.overallCtr ?? '6.34%'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#121216] p-3 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-nodus">
        
        {/* Format Selector */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {FORMAT_TABS.map((tab) => {
            const isSelected = selectedFormat === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedFormat(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#FEF08A] text-slate-950 font-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Search & Status Filter */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sponsor or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-[#18181E] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FEF08A]/60 w-44 sm:w-56"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-[#18181E] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white cursor-pointer"
          >
            {STATUS_TABS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Custom Ads Inventory Table */}
      <div className="bg-white dark:bg-[#121216] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-nodus overflow-hidden">
        {filteredAds.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 mb-3">
              <Sparkles className="w-6 h-6 stroke-[2]" />
            </div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              No Custom Ads Found
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4 font-medium">
              No custom direct sponsor ads match your search or filter parameters.
            </p>
            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2 rounded-xl text-xs font-black bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 transition-all cursor-pointer shadow-xs"
            >
              + Create First Custom Ad
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-urbanist">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-[11px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider bg-slate-50/70 dark:bg-[#18181E]/50">
                  <th className="py-3 px-3.5">Campaign & Creative</th>
                  <th className="py-3 px-3">Format & Slot</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Impressions</th>
                  <th className="py-3 px-3">Clicks</th>
                  <th className="py-3 px-3">CTR</th>
                  <th className="py-3 px-3">Schedule</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs font-medium">
                {filteredAds.map((ad) => {
                  const id = ad.id || ad._id;
                  const isVideo = ad.type === 'VIDEO_PREROLL' || ad.mediaType === 'VIDEO';
                  const impressions = ad.impressionsCount || 0;
                  const clicks = ad.clicksCount || 0;
                  const ctr = impressions > 0 ? `${((clicks / impressions) * 100).toFixed(2)}%` : '0.00%';

                  return (
                    <tr
                      key={id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      {/* Campaign Title & Thumbnail */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center space-x-3">
                          {/* Creative Thumbnail */}
                          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-200 dark:border-white/10 overflow-hidden shrink-0 relative group">
                            {ad.mediaUrl ? (
                              isVideo ? (
                                <div className="w-full h-full relative">
                                  <img
                                    src={ad.thumbnailUrl || 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=200&q=80'}
                                    alt={ad.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <Play className="w-3.5 h-3.5 text-white fill-white" />
                                  </div>
                                </div>
                              ) : (
                                <img
                                  src={ad.mediaUrl}
                                  alt={ad.title}
                                  className="w-full h-full object-cover"
                                />
                              )
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">
                                No media
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 max-w-[220px]">
                            <span className="font-extrabold text-slate-950 dark:text-white block truncate" title={ad.title}>
                              {ad.title}
                            </span>
                            <span className="text-[11px] text-slate-400 font-semibold block truncate">
                              {ad.advertiser}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Format & Placement */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div>{getFormatBadge(ad.type)}</div>
                          <span className="text-[10px] font-bold text-slate-400 block truncate max-w-[130px]">
                            {ad.placement}
                          </span>
                        </div>
                      </td>

                      {/* Priority Rank */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[#18181E] text-slate-900 dark:text-white font-black text-[11px] border border-slate-200/60 dark:border-white/10">
                          ★ {ad.priority || 5}/10
                        </span>
                      </td>

                      {/* Impressions */}
                      <td className="py-3 px-3 font-extrabold text-slate-800 dark:text-slate-200">
                        {impressions.toLocaleString()}
                      </td>

                      {/* Clicks */}
                      <td className="py-3 px-3 font-extrabold text-slate-800 dark:text-slate-200">
                        {clicks.toLocaleString()}
                      </td>

                      {/* CTR */}
                      <td className="py-3 px-3">
                        <span className="font-black text-amber-600 dark:text-[#FEF08A]">
                          {ad.ctr || ctr}
                        </span>
                      </td>

                      {/* Schedule */}
                      <td className="py-3 px-3 text-[11px] text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">
                        <div>
                          {ad.startDate ? new Date(ad.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Now'}
                          {' → '}
                          {ad.endDate ? new Date(ad.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Indefinite'}
                        </div>
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => onToggleStatus(id)}
                            className="cursor-pointer"
                            title="Toggle Status (Active / Paused)"
                          >
                            {ad.status === 'ACTIVE' ? (
                              <ToggleRight className="w-6 h-6 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-slate-400" />
                            )}
                          </button>
                          {getStatusBadge(ad.status)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => onOpenEditModal(ad)}
                            title="Edit Campaign"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => {
                              if (window.confirm(`Reset impressions and clicks for "${ad.title}" back to 0?`)) {
                                onResetStats(id);
                              }
                            }}
                            title="Reset Analytics"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-[#FACC15]/10 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to permanently delete custom ad "${ad.title}"?`)) {
                                onDeleteAd(id);
                              }
                            }}
                            title="Delete Campaign"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
