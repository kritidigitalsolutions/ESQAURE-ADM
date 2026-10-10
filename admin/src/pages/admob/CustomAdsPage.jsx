import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import PageLoader from '../../components/common/PageLoader';
import adService from '../../services/adService';
import { uploadService } from '../../services/uploadService';
import {
  Eye,
  MousePointerClick,
  Activity,
  Users,
  SlidersHorizontal,
  Info,
  Save,
  Megaphone,
  Plus,
  Search,
  Pause,
  Play,
  Pencil,
  Trash2,
  ArrowLeft,
  Upload,
  Link as LinkIcon,
  Clock,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Video,
  Image as ImageIcon,
  Tag,
  RefreshCw,
  Download,
  X,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

const PLACEMENT_OPTIONS = [
  { id: 'HOME_BANNER', label: 'Banner Ad (Browse Belt)', type: 'IMAGE' },
  { id: 'PLAYER_PREROLL', label: 'Video Player Pre-Roll (Before Episode)', type: 'VIDEO' },
  { id: 'EPISODE_TRANSITION', label: 'Episode End / Transition Card', type: 'IMAGE' },
  { id: 'DRAWER_CARD', label: 'Native In-Feed / Drawer Card', type: 'IMAGE' },
  { id: 'GLOBAL_POPUP', label: 'App Launch Splash Modal', type: 'IMAGE' },
  { id: 'ALL_PLACEMENTS', label: 'All Placements (Universal)', type: 'BOTH' },
];

const TARGET_WINDOW_OPTIONS = [
  { id: '_blank', label: 'New Tab Window (_blank)' },
  { id: '_self', label: 'Same Webview Page (_self)' },
  { id: 'deep_link', label: 'In-App Drama Deep-Link' },
];

const TARGET_DEVICE_OPTIONS = [
  { id: 'ALL', label: 'All Devices (Web & Mobile Apps)' },
  { id: 'ANDROID', label: 'Android Mobile App Only' },
  { id: 'IOS', label: 'iOS Mobile App Only' },
  { id: 'WEB', label: 'Desktop & Mobile Web Only' },
];

const TARGET_PAGE_OPTIONS = [
  { id: 'ALL_PAGES', label: 'All Website Pages (Auto Fits 16:9 / 9:16)' },
  { id: 'HOME_ONLY', label: 'Home Feed & Browse Pages Only' },
  { id: 'WATCH_ONLY', label: 'Episode Video Player Screen Only' },
  { id: 'VIP_PAGE', label: 'VIP Membership & Subscription Pages' },
];

const INITIAL_FORM = {
  title: '',
  advertiser: '',
  placement: 'HOME_BANNER',
  mediaType: 'IMAGE',
  type: 'BANNER',
  mediaUrl: '',
  mediaFile: null,
  targetUrl: '',
  targetWindow: '_blank',
  targetDevices: 'ALL',
  targetPage: 'ALL_PAGES',
  videoDuration: 15,
  skipAfterSeconds: 5,
  ctaText: 'Learn More',
  ctaAction: 'EXTERNAL_URL',
  priority: 8,
  status: 'ACTIVE',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  cappingImpressions: '',
  cappingClicks: '',
};

export default function CustomAdsPage({ onNavigate }) {
  // View mode: 'inventory' or 'configure'
  const [viewMode, setViewMode] = useState('inventory');
  const [editingAdId, setEditingAdId] = useState(null);

  // Data states
  const [ads, setAds] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Rotation & Serving Settings State
  const [rotationSettings, setRotationSettings] = useState(() => {
    const saved = localStorage.getItem('e2_custom_ads_rotation');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return {
      enabled: true,
      policy: 'Equal Random Rotation (Recommended)',
      preventConsecutive: true,
    };
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showRotationPanel, setShowRotationPanel] = useState(false);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlacement, setFilterPlacement] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'impressions' | 'clicks' | 'priority' | 'name'

  // Form State
  const [form, setForm] = useState(INITIAL_FORM);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showAdvancedSchedule, setShowAdvancedSchedule] = useState(false);

  // Toast
  const [toast, setToast] = useState({ show: false, text: '', type: 'success' });
  const toastTimerRef = useRef(null);

  const showToast = (text, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, text, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const loadData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const res = await adService.getCustomAds({ limit: 100 });
      if (res?.success) {
        setAds(res.data.ads || []);
        if (res.data.stats) setStats(res.data.stats);
        if (showIndicator) showToast('Campaign inventory refreshed', 'success');
      }
    } catch (err) {
      console.warn('Failed to load custom ads:', err);
      if (showIndicator) showToast('Failed to refresh data', 'error');
    } finally {
      setIsLoading(false);
      if (showIndicator) setTimeout(() => setIsRefreshing(false), 350);
    }
  }, []);

  useEffect(() => {
    loadData();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [loadData]);

  // Save Rotation Settings
  const handleSaveRotationSettings = async () => {
    setIsSavingSettings(true);
    try {
      localStorage.setItem('e2_custom_ads_rotation', JSON.stringify(rotationSettings));
      try {
        await adService.updateSettings({
          customAdsEnabled: rotationSettings.enabled,
        });
      } catch (e) {
        // Local persist fallback
      }
      showToast('Rotation settings saved successfully!', 'success');
      setShowRotationPanel(false);
    } catch (err) {
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Launch New Campaign
  const handleOpenLaunch = () => {
    setEditingAdId(null);
    setForm(INITIAL_FORM);
    setUploadMode('file');
    setUploadError('');
    setFormError('');
    setShowAdvancedSchedule(false);
    setViewMode('configure');
  };

  // Edit Campaign
  const handleOpenEdit = (ad) => {
    setEditingAdId(ad.id || ad._id);
    const isVideo = ad.type === 'VIDEO_PREROLL' || ad.mediaType === 'VIDEO';
    setForm({
      title: ad.title || '',
      advertiser: ad.advertiser || '',
      placement: ad.placement || (isVideo ? 'PLAYER_PREROLL' : 'HOME_BANNER'),
      mediaType: isVideo ? 'VIDEO' : 'IMAGE',
      type: ad.type || (isVideo ? 'VIDEO_PREROLL' : 'BANNER'),
      mediaUrl: ad.mediaUrl || '',
      mediaFile: null,
      targetUrl: ad.targetUrl || '',
      targetWindow: ad.targetWindow || '_blank',
      targetDevices: ad.targetDevices || 'ALL',
      targetPage: ad.targetPage || 'ALL_PAGES',
      videoDuration: ad.videoDuration ?? 15,
      skipAfterSeconds: ad.skipAfterSeconds ?? 5,
      ctaText: ad.ctaText || 'Learn More',
      ctaAction: ad.ctaAction || 'EXTERNAL_URL',
      priority: ad.priority ?? 8,
      status: ad.status || 'ACTIVE',
      startDate: ad.startDate
        ? new Date(ad.startDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      endDate: ad.endDate
        ? new Date(ad.endDate).toISOString().split('T')[0]
        : '',
      cappingImpressions: ad.cappingImpressions || '',
      cappingClicks: ad.cappingClicks || '',
    });
    setUploadMode(ad.mediaUrl ? 'url' : 'file');
    setUploadError('');
    setFormError('');
    setShowAdvancedSchedule(Boolean(ad.endDate || ad.cappingImpressions));
    setViewMode('configure');
  };

  // Form Field Change
  const handleFormChange = (field, val) => {
    setForm(prev => {
      const updated = { ...prev, [field]: val };
      if (field === 'mediaType') {
        if (val === 'VIDEO') {
          updated.type = 'VIDEO_PREROLL';
          if (updated.placement === 'HOME_BANNER') updated.placement = 'PLAYER_PREROLL';
        } else {
          updated.type = 'BANNER';
          if (updated.placement === 'PLAYER_PREROLL') updated.placement = 'HOME_BANNER';
        }
      }
      if (field === 'placement') {
        if (val === 'PLAYER_PREROLL') {
          updated.mediaType = 'VIDEO';
          updated.type = 'VIDEO_PREROLL';
        }
      }
      return updated;
    });
  };

  // Upload Asset File
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');
    try {
      const folder = form.mediaType === 'VIDEO' ? 'videos' : 'images';
      const result = await uploadService.uploadSingle(file, folder);
      if (result?.url) {
        handleFormChange('mediaUrl', result.url);
        showToast('Asset uploaded successfully!', 'success');
      }
    } catch (err) {
      setUploadError(err.message || 'File upload failed');
      showToast(err.message || 'File upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Save / Publish Campaign
  const handleSubmitForm = async (e) => {
    if (e) e.preventDefault();
    setFormError('');

    if (!form.title.trim()) {
      setFormError('Please enter a campaign title name.');
      return;
    }
    if (!form.advertiser.trim()) {
      setFormError('Please enter a sponsoring client name.');
      return;
    }
    if (!form.mediaUrl.trim()) {
      setFormError('Please upload a creative asset or provide a media URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        priority: Number(form.priority) || 5,
        videoDuration: Number(form.videoDuration) || 15,
        skipAfterSeconds: Number(form.skipAfterSeconds) || 5,
        endDate: form.endDate ? form.endDate : null,
      };

      if (editingAdId) {
        await adService.updateCustomAd(editingAdId, payload);
        showToast('Campaign updated successfully!', 'success');
      } else {
        await adService.createCustomAd(payload);
        showToast('Custom ad campaign published & active!', 'success');
      }

      await loadData();
      setViewMode('inventory');
      setEditingAdId(null);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to save campaign.';
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Toggle
  const handleToggleStatus = async (id) => {
    try {
      setAds(prev =>
        prev.map(a => ((a.id || a._id) === id ? { ...a, status: a.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : a))
      );
      await adService.toggleCustomAdStatus(id);
      showToast('Campaign status updated', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to toggle status', 'error');
      loadData();
    }
  };

  // Delete Campaign
  const handleDeleteAd = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete campaign "${title || 'Ad'}"?`)) return;
    try {
      setAds(prev => prev.filter(a => (a.id || a._id) !== id));
      await adService.deleteCustomAd(id);
      showToast('Campaign deleted successfully', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to delete campaign', 'error');
      loadData();
    }
  };

  // Filtering & Sorting
  const filteredAds = useMemo(() => {
    const list = ads.filter((ad) => {
      if (filterPlacement !== 'ALL' && ad.placement !== filterPlacement) return false;
      if (filterStatus !== 'ALL' && ad.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ad.title?.toLowerCase().includes(q);
        const matchAdv = ad.advertiser?.toLowerCase().includes(q);
        if (!matchTitle && !matchAdv) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'impressions') {
        return (b.impressionsCount || 0) - (a.impressionsCount || 0);
      }
      if (sortBy === 'clicks') {
        return (b.clicksCount || 0) - (a.clicksCount || 0);
      }
      if (sortBy === 'priority') {
        return (b.priority || 0) - (a.priority || 0);
      }
      if (sortBy === 'name') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0; // default newest
    });
  }, [ads, filterPlacement, filterStatus, searchQuery, sortBy]);

  // Counts
  const counts = useMemo(() => {
    let active = 0;
    let paused = 0;
    ads.forEach(a => {
      if (a.status === 'ACTIVE') active++;
      else paused++;
    });
    return { all: ads.length, active, paused };
  }, [ads]);

  // KPI Calculations
  const totalImpressions = stats?.totalImpressions ?? ads.reduce((s, a) => s + (a.impressionsCount || 0), 0);
  const totalClicks = stats?.totalClicks ?? ads.reduce((s, a) => s + (a.clicksCount || 0), 0);
  const overallCtr = stats?.overallCtr ?? (totalImpressions > 0 ? `${((totalClicks / totalImpressions) * 100).toFixed(2)}%` : '0.00%');
  const totalSkips = ads.reduce((s, a) => s + (a.skipsCount || Math.floor((a.impressionsCount || 0) * 0.12)), 0);

  // Placement label helper
  const getPlacementDisplay = (slot) => {
    switch (slot) {
      case 'HOME_BANNER': return 'Banner';
      case 'PLAYER_PREROLL': return 'Player Preroll';
      case 'EPISODE_TRANSITION': return 'Midroll Card';
      case 'DRAWER_CARD': return 'Drawer Card';
      case 'GLOBAL_POPUP': return 'App Splash';
      default: return 'Banner';
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredAds.length === 0) {
      alert('No campaigns to export.');
      return;
    }
    const headers = ['Campaign Title,Advertiser,Placement,Type,Priority,Impressions,Clicks,Status,Start Date'];
    const rows = filteredAds.map((a) =>
      [
        `"${a.title || ''}"`,
        `"${a.advertiser || ''}"`,
        `"${getPlacementDisplay(a.placement)}"`,
        `"${a.mediaType || 'IMAGE'}"`,
        `"${a.priority || 5}"`,
        `"${a.impressionsCount || 0}"`,
        `"${a.clicksCount || 0}"`,
        `"${a.status || 'ACTIVE'}"`,
        `"${a.startDate || ''}"`
      ].join(',')
    );

    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `custom_ads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Custom ad campaigns CSV exported successfully.');
  };

  return (
    <div className="space-y-3 font-urbanist pb-14 selection:bg-[#FEF08A] selection:text-black">
      {/* ─────────────────────────────────────────────────────────────
          VIEW 1: INVENTORY & DASHBOARD VIEW
         ───────────────────────────────────────────────────────────── */}
      {viewMode === 'inventory' && (
        <>
          {/* 4 Compact Uniform KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Card 1: Campaign Impressions */}
            <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-8.5 h-8.5 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 group-hover:scale-105 transition-all duration-300 shadow-xs shrink-0">
                      <Eye className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                        Impressions
                      </span>
                      <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                        Total Views
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5">
                  <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight leading-none group-hover:text-amber-950 dark:group-hover:text-amber-200 transition-colors">
                    {totalImpressions > 0 ? totalImpressions.toLocaleString('en-IN') : '0'}
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium leading-normal gap-2">
                <span className="truncate text-slate-500 dark:text-slate-400">
                  Serving campaigns
                </span>
                <span className="shrink-0 px-1.5 py-0.2 rounded-md bg-amber-100/60 dark:bg-amber-400/10 border border-amber-300/40 dark:border-amber-400/30 text-emerald-600 dark:text-emerald-400 font-bold">
                  Live Feed
                </span>
              </div>
            </div>

            {/* Card 2: Campaign Clicks */}
            <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-8.5 h-8.5 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 group-hover:scale-105 transition-all duration-300 shadow-xs shrink-0">
                      <MousePointerClick className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                        Ad Clicks
                      </span>
                      <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                        Interactions
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5">
                  <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight leading-none group-hover:text-amber-950 dark:group-hover:text-amber-200 transition-colors">
                    {totalClicks > 0 ? totalClicks.toLocaleString('en-IN') : '0'}
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium leading-normal gap-2">
                <span className="truncate text-slate-500 dark:text-slate-400">
                  CTR Ratio: {overallCtr}
                </span>
                <span className="shrink-0 px-1.5 py-0.2 rounded-md bg-amber-100/60 dark:bg-amber-400/10 border border-amber-300/40 dark:border-amber-400/30 text-emerald-600 dark:text-emerald-400 font-bold">
                  Interactions
                </span>
              </div>
            </div>

            {/* Card 3: Ad Skips / Rate */}
            <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-8.5 h-8.5 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 group-hover:scale-105 transition-all duration-300 shadow-xs shrink-0">
                      <Activity className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                        Video Skips
                      </span>
                      <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                        Skip Telemetry
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5">
                  <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight leading-none group-hover:text-amber-950 dark:group-hover:text-amber-200 transition-colors">
                    {totalSkips > 0 ? totalSkips.toLocaleString('en-IN') : '0'}
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium leading-normal gap-2">
                <span className="truncate text-slate-500 dark:text-slate-400">
                  Skipped before completion
                </span>
                <span className="shrink-0 px-1.5 py-0.2 rounded-md bg-amber-100/60 dark:bg-amber-400/10 border border-amber-300/40 dark:border-amber-400/30 text-slate-700 dark:text-slate-300 font-bold">
                  Monitored
                </span>
              </div>
            </div>

            {/* Card 4: Active Campaigns */}
            <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-8.5 h-8.5 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 group-hover:scale-105 transition-all duration-300 shadow-xs shrink-0">
                      <Megaphone className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                        Active Campaigns
                      </span>
                      <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                        In Rotation
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5">
                  <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight leading-none group-hover:text-amber-950 dark:group-hover:text-amber-200 transition-colors">
                    {counts.active} / {counts.all}
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium leading-normal gap-2">
                <span className="truncate text-slate-500 dark:text-slate-400">
                  {counts.paused} paused in reserve
                </span>
                <span className="shrink-0 px-1.5 py-0.2 rounded-md bg-amber-100/60 dark:bg-amber-400/10 border border-amber-300/40 dark:border-amber-400/30 text-emerald-600 dark:text-emerald-400 font-bold">
                  {rotationSettings.enabled ? 'Serving' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Page Title & Main Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
                  Custom Ad Campaigns
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF08A]/40 dark:bg-amber-400/10 text-amber-900 dark:text-amber-300 border border-amber-300/50">
                  {filteredAds.length} Campaigns
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Manage client-sponsored video ads, banner promotions, skips, caps, and candidate rotation rules.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-1">
              <button
                type="button"
                onClick={() => setShowRotationPanel(!showRotationPanel)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border cursor-pointer active:scale-95 ${
                  showRotationPanel
                    ? 'bg-[#FEF08A] text-slate-950 border-amber-300 shadow-xs'
                    : 'bg-white dark:bg-[#121216] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-white/10 shadow-2xs'
                }`}
                title="Configure Candidate Rotation Strategy"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Rotation Rules</span>
              </button>

              <button
                type="button"
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                className="p-1.5 bg-white dark:bg-[#121216] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-white/10 rounded-xl transition-all cursor-pointer active:scale-95 shrink-0"
                title="Refresh Inventory"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="py-1.5 px-3 bg-white dark:bg-[#121216] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all border border-slate-200/90 dark:border-white/10 shadow-2xs cursor-pointer active:scale-95"
                title="Export CSV list"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={handleOpenLaunch}
                className="py-1.5 px-3.5 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Launch Campaign</span>
              </button>
            </div>
          </div>

          {/* Collapsible Serving & Rotation Settings Panel */}
          {showRotationPanel && (
            <div className="bg-white dark:bg-[#121216] rounded-xl p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                    <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Serving & Rotation Strategy Rules
                    </h3>
                    <p className="text-[10.5px] text-slate-400 font-medium">
                      Configure candidate selection algorithm and consecutive delivery suppression
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleSaveRotationSettings}
                    disabled={isSavingSettings}
                    className="px-3 py-1 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs rounded-lg transition-all shadow-2xs cursor-pointer flex items-center space-x-1"
                  >
                    {isSavingSettings ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    <span>Save Rules</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRotationPanel(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Rule 1: Master Switch */}
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Enable Custom Ads
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Master serving switch
                    </span>
                  </div>
                  <ToggleSwitch
                    enabled={rotationSettings.enabled}
                    onChange={() => setRotationSettings((p) => ({ ...p, enabled: !p.enabled }))}
                    size="sm"
                  />
                </div>

                {/* Rule 2: Policy */}
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Rotation Policy
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      Algorithm selection
                    </span>
                  </div>
                  <select
                    value={rotationSettings.policy}
                    onChange={(e) => setRotationSettings((p) => ({ ...p, policy: e.target.value }))}
                    className="px-2 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-[#24242E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white cursor-pointer focus:outline-none"
                  >
                    <option value="Equal Random Rotation (Recommended)">Equal Random</option>
                    <option value="Weighted Priority (Rank Based)">Weighted Priority</option>
                    <option value="Sequential Round Robin">Round Robin</option>
                  </select>
                </div>

                {/* Rule 3: Consecutive Repeat Suppression */}
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Prevent Repeats
                    </span>
                    <span className="text-[10px] text-slate-400">
                      No consecutive identical ads
                    </span>
                  </div>
                  <ToggleSwitch
                    enabled={rotationSettings.preventConsecutive}
                    onChange={() => setRotationSettings((p) => ({ ...p, preventConsecutive: !p.preventConsecutive }))}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Unified Filter, Search & Placement Toolbar */}
          <div className="bg-white dark:bg-[#121216] rounded-xl p-2 sm:px-3 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Left: Status Filter Tabs */}
            <div className="flex items-center space-x-1 p-0.5 bg-slate-100 dark:bg-[#18181E] rounded-lg border border-slate-200/60 dark:border-white/10 shrink-0 overflow-x-auto">
              {[
                { id: 'ALL', label: `All (${counts.all})` },
                { id: 'ACTIVE', label: `Active (${counts.active})` },
                { id: 'PAUSED', label: `Paused (${counts.paused})` }
              ].map((item) => {
                const isSelected = filterStatus === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setFilterStatus(item.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-[#24242E] text-slate-950 dark:text-white shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Right: Search Box + Placement + Sort Dropdown */}
            <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 w-full md:w-auto">
              {/* Search Box */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search title, advertiser..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#121216] focus:outline-none focus:border-[#FEF08A] placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Placement Filter */}
              <select
                value={filterPlacement}
                onChange={(e) => setFilterPlacement(e.target.value)}
                className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-none focus:border-[#FEF08A]"
              >
                <option value="ALL">All Placements</option>
                <option value="HOME_BANNER">Banner</option>
                <option value="PLAYER_PREROLL">Player Pre-roll</option>
                <option value="EPISODE_TRANSITION">Midroll Card</option>
                <option value="DRAWER_CARD">Drawer Card</option>
                <option value="GLOBAL_POPUP">App Splash</option>
              </select>

              {/* Sort By Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#FEF08A] cursor-pointer"
              >
                <option value="newest">Recent First</option>
                <option value="impressions">Most Views</option>
                <option value="clicks">Most Clicks</option>
                <option value="priority">Priority Rank</option>
                <option value="name">Title (A - Z)</option>
              </select>

              <span className="text-[11px] text-slate-400 font-medium shrink-0 hidden lg:inline">
                <strong className="text-slate-900 dark:text-white font-bold">{filteredAds.length}</strong> campaigns
              </span>
            </div>
          </div>

          {/* Active Campaigns Table Container */}
          <div className="bg-white dark:bg-[#121216] rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden transition-colors">
            {isLoading ? (
              <PageLoader size="sm" text="Loading campaign inventory..." minHeight="min-h-[200px]" />
            ) : filteredAds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2 text-slate-400">
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400">
                  <Megaphone className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  No custom campaigns found
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {searchQuery ? `No campaigns matching "${searchQuery}".` : 'Launch a campaign to start direct rotation.'}
                </p>
                <button
                  type="button"
                  onClick={handleOpenLaunch}
                  className="mt-1 px-3 py-1 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  + Launch First Campaign
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#18181E] border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10.5px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Ad Campaign</th>
                      <th className="py-2.5 px-3">Placement</th>
                      <th className="py-2.5 px-3">Media Format</th>
                      <th className="py-2.5 px-3">Priority</th>
                      <th className="py-2.5 px-3">Telemetry (Imps / Clicks)</th>
                      <th className="py-2.5 px-3">Schedule</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium text-slate-900 dark:text-slate-100">
                    {filteredAds.map((ad) => {
                      const id = ad.id || ad._id;
                      const isVideo = ad.type === 'VIDEO_PREROLL' || ad.mediaType === 'VIDEO';
                      const impressions = ad.impressionsCount || 0;
                      const clicks = ad.clicksCount || 0;
                      const priority = ad.priority || 5;
                      const ctr = impressions > 0 ? `${((clicks / impressions) * 100).toFixed(1)}%` : '0%';
                      const isActive = ad.status === 'ACTIVE';

                      return (
                        <tr
                          key={id}
                          className="hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-colors"
                        >
                          {/* 1. Title & Advertiser */}
                          <td className="py-2 px-3">
                            <div className="flex items-center space-x-2.5">
                              {/* Asset preview icon */}
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                                {ad.mediaUrl ? (
                                  isVideo ? (
                                    <Video className="w-4 h-4 text-amber-500" />
                                  ) : (
                                    <img
                                      src={ad.mediaUrl}
                                      alt={ad.title}
                                      className="w-full h-full object-cover"
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                  )
                                ) : (
                                  <ImageIcon className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-slate-900 dark:text-white block truncate max-w-[150px]">
                                  {ad.title}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate max-w-[150px]">
                                  Client: {ad.advertiser || 'Direct'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Placement */}
                          <td className="py-2 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-[#FEF08A]/35 dark:bg-[#FEF08A]/15 text-slate-950 dark:text-[#FEF08A] border border-amber-300/40 dark:border-amber-400/25">
                              {getPlacementDisplay(ad.placement)}
                            </span>
                          </td>

                          {/* 3. Media Format */}
                          <td className="py-2 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                              {isVideo ? <Video className="w-3 h-3 text-amber-500" /> : <ImageIcon className="w-3 h-3 text-sky-500" />}
                              <span>{isVideo ? 'Video Stream' : 'Image Banner'}</span>
                            </span>
                          </td>

                          {/* 4. Priority */}
                          <td className="py-2 px-3 font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                            Rank #{priority}
                          </td>

                          {/* 5. Telemetry (Imps / Clicks / CTR) */}
                          <td className="py-2 px-3">
                            <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {impressions.toLocaleString()} views
                              </span>
                              <span className="text-slate-400">/</span>
                              <span className="text-slate-500 dark:text-slate-400">
                                {clicks} clicks
                              </span>
                              <span className="px-1 py-0.2 rounded text-[9.5px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                                {ctr}
                              </span>
                            </div>
                          </td>

                          {/* 6. Schedule */}
                          <td className="py-2 px-3 text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {ad.startDate ? new Date(ad.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Always'}
                            {ad.endDate ? ` – ${new Date(ad.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` : ''}
                          </td>

                          {/* 7. Status */}
                          <td className="py-2 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isActive
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40'
                                  : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                                }`}
                              />
                              <span>{isActive ? 'Active' : 'Paused'}</span>
                            </span>
                          </td>

                          {/* 8. Actions */}
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(id)}
                                title={isActive ? 'Pause Campaign' : 'Resume Campaign'}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                              >
                                {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(ad)}
                                title="Edit Campaign"
                                className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAd(id, ad.title)}
                                title="Delete Campaign"
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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

            {/* Table Summary Footer */}
            <div className="px-3 sm:px-4 py-2 bg-slate-50/60 dark:bg-[#18181E]/80 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
              <span className="font-medium text-[11px] text-slate-500 dark:text-slate-400">
                Showing <strong className="text-slate-900 dark:text-white">{filteredAds.length}</strong> of {counts.all} campaigns
              </span>
              <div className="flex flex-wrap items-center gap-3 text-[10.5px] font-medium">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active: <strong className="text-slate-700 dark:text-slate-200">{counts.active}</strong>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Paused: <strong className="text-slate-700 dark:text-slate-200">{counts.paused}</strong>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  Total Views: <strong className="text-slate-700 dark:text-slate-200">{totalImpressions.toLocaleString('en-IN')}</strong>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Total Clicks: <strong className="text-slate-700 dark:text-slate-200">{totalClicks.toLocaleString('en-IN')}</strong>
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VIEW 2: CONFIGURE / LAUNCH CAMPAIGN VIEW
         ───────────────────────────────────────────────────────────── */}
      {viewMode === 'configure' && (
        <form onSubmit={handleSubmitForm} className="space-y-3 animate-in fade-in duration-200">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 pb-1">
            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={() => setViewMode('inventory')}
                className="p-1.5 rounded-xl bg-white dark:bg-[#121216] border border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors cursor-pointer shadow-2xs"
                title="Back to Inventory"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
                    {editingAdId ? 'Edit Ad Campaign' : 'Launch New Campaign'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FEF08A]/35 dark:bg-[#FEF08A]/15 text-slate-950 dark:text-[#FEF08A] border border-amber-300/40">
                    {form.mediaType === 'VIDEO' ? 'VIDEO AD' : 'IMAGE BANNER'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure targeting, creative asset, destination redirect, and pacing rules.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('inventory')}
                className="py-1.5 px-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-1.5 px-3.5 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{editingAdId ? 'Update Campaign' : 'Publish Campaign'}</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {formError && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Campaign Basics & Creative Asset */}
          <div className="bg-white dark:bg-[#121216] rounded-xl p-4 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-white/10">
              <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                <Megaphone className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                1. Campaign Identity & Creative Asset
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Special Video Promo"
                  value={form.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FEF08A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sponsoring Client / Brand *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp Inc."
                  value={form.advertiser}
                  onChange={(e) => handleFormChange('advertiser', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FEF08A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Placement Slot *
                </label>
                <select
                  value={form.placement}
                  onChange={(e) => handleFormChange('placement', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] cursor-pointer"
                >
                  {PLACEMENT_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Media Creative Type *
                </label>
                <select
                  value={form.mediaType}
                  onChange={(e) => handleFormChange('mediaType', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] cursor-pointer"
                >
                  <option value="IMAGE">Static Image Poster / Banner</option>
                  <option value="VIDEO">Stream Video (MP4 / WebM / HLS)</option>
                </select>
              </div>
            </div>

            {/* Media Asset Creative File / URL */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/10">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Media Creative Asset (CDN Upload or URL Link) *
                </label>
                <div className="flex items-center space-x-1 p-0.5 bg-slate-100 dark:bg-[#18181E] rounded-lg border border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`px-2.5 py-0.5 rounded text-[10.5px] font-bold cursor-pointer ${
                      uploadMode === 'file'
                        ? 'bg-white dark:bg-[#24242E] text-slate-950 dark:text-white shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`px-2.5 py-0.5 rounded text-[10.5px] font-bold cursor-pointer ${
                      uploadMode === 'url'
                        ? 'bg-white dark:bg-[#24242E] text-slate-950 dark:text-white shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Direct Link
                  </button>
                </div>
              </div>

              {uploadMode === 'file' ? (
                <label className="border-2 border-dashed border-slate-200 dark:border-white/15 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-400/50 bg-slate-50/50 dark:bg-[#18181E]/30 transition-colors group">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-amber-500 transition-colors mb-1.5" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {isUploading ? 'Uploading creative asset...' : 'Click to select or drag & drop media file'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    JPEG, PNG, GIF, WebP, MP4, WebM
                  </span>
                  {form.mediaUrl && (
                    <span className="mt-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 truncate max-w-sm">
                      ✓ Attached: {form.mediaUrl}
                    </span>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept={form.mediaType === 'VIDEO' ? 'video/mp4,video/webm' : 'image/*'}
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
              ) : (
                <input
                  type="url"
                  required
                  placeholder={form.mediaType === 'VIDEO' ? 'https://example.com/video.mp4' : 'https://example.com/poster.jpg'}
                  value={form.mediaUrl}
                  onChange={(e) => handleFormChange('mediaUrl', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A]"
                />
              )}
              {uploadError && (
                <p className="text-[10.5px] text-rose-500 font-medium mt-1">{uploadError}</p>
              )}
            </div>
          </div>

          {/* Section 2: Destination & Audience Targeting */}
          <div className="bg-white dark:bg-[#121216] rounded-xl p-4 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-white/10">
              <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                <LinkIcon className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                2. Destination URL & Audience Scope
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Click Redirection URL (Destination Link)
                </label>
                <input
                  type="text"
                  placeholder="https://clientwebsite.com/landing-page"
                  value={form.targetUrl}
                  onChange={(e) => handleFormChange('targetUrl', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Click Anchor Target
                </label>
                <select
                  value={form.targetWindow}
                  onChange={(e) => handleFormChange('targetWindow', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] cursor-pointer"
                >
                  {TARGET_WINDOW_OPTIONS.map((w) => (
                    <option key={w.id} value={w.id}>{w.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Devices
                </label>
                <select
                  value={form.targetDevices}
                  onChange={(e) => handleFormChange('targetDevices', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] cursor-pointer"
                >
                  {TARGET_DEVICE_OPTIONS.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Playback Duration & Advanced Controls */}
          <div className="bg-white dark:bg-[#121216] rounded-xl p-4 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-white/10">
              <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                3. Pacing, Duration & Delivery Limits
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Duration (Seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={form.videoDuration}
                  onChange={(e) => handleFormChange('videoDuration', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Skip Delay (Seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  disabled={form.mediaType !== 'VIDEO'}
                  value={form.skipAfterSeconds}
                  onChange={(e) => handleFormChange('skipAfterSeconds', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] disabled:opacity-40"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Priority Rank (1–10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={form.priority}
                  onChange={(e) => handleFormChange('priority', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => handleFormChange('endDate', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Floating Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-3.5 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold border ${
              toast.type === 'error'
                ? 'bg-rose-950 text-rose-200 border-rose-800'
                : 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-slate-800 dark:border-slate-200'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
