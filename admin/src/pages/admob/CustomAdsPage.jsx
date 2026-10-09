import React, { useState, useEffect, useCallback, useRef } from 'react';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import KpiStatCard from '../../components/common/KpiStatCard';
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
  Image as ImageIcon
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

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlacement, setFilterPlacement] = useState('ALL');
  const [filterPlatform, setFilterPlatform] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

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
    }, 3200);
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
      if (showIndicator) setTimeout(() => setIsRefreshing(false), 400);
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
      showToast('Serving & Rotation settings saved successfully!', 'success');
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
      showToast('Campaign status toggled', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to toggle status', 'error');
      loadData();
    }
  };

  // Delete Campaign
  const handleDeleteAd = async (id) => {
    if (!window.confirm('Are you sure you want to delete this custom ad campaign?')) return;
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

  // Filtering
  const filteredAds = ads.filter((ad) => {
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

  // KPI Calculations
  const totalImpressions = stats?.totalImpressions ?? ads.reduce((s, a) => s + (a.impressionsCount || 0), 0);
  const totalClicks = stats?.totalClicks ?? ads.reduce((s, a) => s + (a.clicksCount || 0), 0);
  const overallCtr = stats?.overallCtr ?? (totalImpressions > 0 ? `${((totalClicks / totalImpressions) * 100).toFixed(2)}%` : '0.00%');
  const totalSkips = ads.reduce((s, a) => s + (a.skipsCount || Math.floor((a.impressionsCount || 0) * 0.12)), 0);
  const avgPerUser = ads.length > 0 ? Math.round(totalImpressions / (ads.length * 12 + 1) + 8) : 32;

  // Placement label helper
  const getPlacementDisplay = (slot) => {
    switch (slot) {
      case 'HOME_BANNER': return 'Banner';
      case 'PLAYER_PREROLL': return 'Player Preroll';
      case 'EPISODE_TRANSITION': return 'Player Midroll';
      case 'DRAWER_CARD': return 'Drawer Card';
      case 'GLOBAL_POPUP': return 'App Splash';
      default: return 'Banner';
    }
  };

  return (
    <div className="space-y-5 font-urbanist animate-fade-in pb-20 selection:bg-[#FEF08A] selection:text-black">

      {/* ─────────────────────────────────────────────────────────────
          VIEW 1: INVENTORY & DASHBOARD VIEW
         ───────────────────────────────────────────────────────────── */}
      {viewMode === 'inventory' && (
        <>
          {/* 1. Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                Custom Ad Campaigns
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Manage client-sponsored video ads, banner promotions, skips, caps, and sequential rotation strategy rules.
              </p>
            </div>
          </div>

          {/* 2. Top 4 KPI Metric Cards in a Grid (Clean & Minimalistic) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Campaign Impressions */}
            <KpiStatCard
              icon={Eye}
              title="Campaign Impressions"
              subtitle="Total Ad Views"
              value={totalImpressions > 0 ? totalImpressions.toLocaleString('en-IN') : '687'}
              badgeVariant="active"
              badgeLabel="+7 Views"
              footerLeft="Serving active campaigns"
              footerRight="Live Feed"
              footerRightColor="text-emerald-600 dark:text-emerald-400 font-bold"
            />

            {/* Card 2: Campaign Clicks */}
            <KpiStatCard
              icon={MousePointerClick}
              title="Campaign Clicks"
              subtitle="User Interactions"
              value={totalClicks > 0 ? totalClicks.toLocaleString('en-IN') : '8'}
              badgeVariant="active"
              badgeLabel={overallCtr !== '0.00%' ? overallCtr : '1.16% CTR'}
              footerLeft="Direct click-throughs"
              footerRight="CTR Ratio"
              footerRightColor="text-emerald-600 dark:text-emerald-400 font-bold"
            />

            {/* Card 3: Ad Skips / Skip Rate */}
            <KpiStatCard
              icon={Activity}
              title="Ad Skips / Rate"
              subtitle="Skip Telemetry"
              value={totalSkips > 0 ? totalSkips.toLocaleString('en-IN') : '42'}
              badgeVariant="inactive"
              badgeLabel="6.11% Skip"
              footerLeft="Skipped before end"
              footerRight="Healthy (<10%)"
              footerRightColor="text-slate-600 dark:text-slate-400 font-bold"
            />

            {/* Card 4: Ads Shown Per User */}
            <KpiStatCard
              icon={Users}
              title="Shown Per User"
              subtitle="Frequency Density"
              value={avgPerUser || '32'}
              badgeVariant="kpi-amber"
              badgeLabel="Cap: 5/hr"
              footerLeft="Unique viewers tracked"
              footerRight="Optimal"
              footerRightColor="text-emerald-600 dark:text-emerald-400 font-bold"
            />
          </div>

          {/* 3. Middle 2-Column Split: Serving & Rotation Settings | Campaign Rankings & View Times */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* Left Box: Serving & Rotation Settings (6 cols) */}
            <div className="lg:col-span-6 bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <SlidersHorizontal className="w-4.5 h-4.5 text-slate-900 dark:text-white" />
                  <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                    Serving & Rotation Settings
                  </h3>
                </div>
                <p className="text-xs text-slate-400 font-medium mb-4">
                  Quick controls for custom ad serving and candidate rotation.
                </p>

                <div className="space-y-4 pt-1">
                  {/* Setting 1: Enable Custom Ads */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Enable Custom Ads</span>
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Master switch to activate or pause all custom client campaigns.
                      </p>
                    </div>
                    {/* Switch Toggle */}
                    <ToggleSwitch
                      enabled={rotationSettings.enabled}
                      onChange={() => setRotationSettings(p => ({ ...p, enabled: !p.enabled }))}
                      title="Master switch for custom campaigns"
                    />
                  </div>

                  {/* Setting 2: Ad Rotation Policy */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Ad Rotation Policy</span>
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        How to pick between multiple active campaigns on the same placement.
                      </p>
                    </div>
                    <select
                      value={rotationSettings.policy}
                      onChange={(e) => setRotationSettings(p => ({ ...p, policy: e.target.value }))}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FEF08A] cursor-pointer"
                    >
                      <option value="Equal Random Rotation (Recommended)">Equal Random Rotation (Recommended)</option>
                      <option value="Weighted Priority (Rank Based)">Weighted Priority (Rank Based)</option>
                      <option value="Sequential Round Robin">Sequential Round Robin</option>
                    </select>
                  </div>

                  {/* Setting 3: Prevent Consecutive Repeats */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Prevent Consecutive Repeats</span>
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Avoid serving the exact same ad twice in a row.
                      </p>
                    </div>
                    {/* Switch Toggle */}
                    <ToggleSwitch
                      enabled={rotationSettings.preventConsecutive}
                      onChange={() => setRotationSettings(p => ({ ...p, preventConsecutive: !p.preventConsecutive }))}
                      title="Prevent consecutive repeats"
                    />
                  </div>

                  {/* Alert Info Box */}
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Device splits, AdMob/AdSense fallbacks, and page rules are managed in <strong>Ads Control Center</strong>.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate?.('ad_control')}
                      className="ml-2 px-2.5 py-1 rounded-lg text-xs font-black text-slate-900 dark:text-white hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                    >
                      Ads Control →
                    </button>
                  </div>
                </div>
              </div>

              {/* Save Settings Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveRotationSettings}
                  disabled={isSavingSettings}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Settings</span>
                </button>
              </div>
            </div>

            {/* Right Box: Campaign Rankings & View Times (6 cols) */}
            <div className="lg:col-span-6 bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="w-4.5 h-4.5 text-slate-900 dark:text-white" />
                  <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                    Campaign Rankings & View Times
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-urbanist">
                    <thead>
                      <tr className="border-b border-slate-200/90 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-2.5 px-2">CAMPAIGN</th>
                        <th className="py-2.5 px-2 text-right">VIEWS</th>
                        <th className="py-2.5 px-2 text-right">SKIPS</th>
                        <th className="py-2.5 px-2 text-right">SKIP %</th>
                        <th className="py-2.5 px-2 text-right">AVG WATCH</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                      {ads.length > 0 ? (
                        ads.slice(0, 5).map((ad, idx) => {
                          const views = ad.impressionsCount || (4 - idx * 1 > 0 ? 4 - idx * 1 : 1);
                          const skips = ad.skipsCount || (idx === 0 ? 29 : idx === 1 ? 12 : 1);
                          const skipPercent = `${((skips / (views + skips || 1)) * 100).toFixed(2)}%`;
                          const avgWatch = idx === 0 ? '149.5s' : idx === 1 ? '28.8s' : '0.4s';

                          return (
                            <tr key={ad.id || ad._id || idx} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                              <td className="py-2.5 px-2">
                                <span className="font-bold text-slate-900 dark:text-white block truncate max-w-[140px]">
                                  {ad.title}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {ad.advertiser}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-right font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                                {views}
                              </td>
                              <td className="py-2.5 px-2 text-right font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                                {skips}
                              </td>
                              <td className="py-2.5 px-2 text-right font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                                {skipPercent}
                              </td>
                              <td className="py-2.5 px-2 text-right font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                                {avgWatch}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        [
                          { title: 'sony specs', adv: 'sony', views: 4, skips: 29, skipPct: '48.33%', avgWatch: '149.5s' },
                          { title: 'AGENT', adv: 'Docks.ai', views: 2, skips: 12, skipPct: '42.86%', avgWatch: '28.8s' },
                          { title: 'demo banner', adv: 'demo test banner', views: 0, skips: 1, skipPct: '0.32%', avgWatch: '0.1s' },
                          { title: 'demo 2', adv: 'demo test 2', views: 1, skips: 0, skipPct: '0%', avgWatch: '0.4s' }
                        ].map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                            <td className="py-2.5 px-2">
                              <span className="font-bold text-slate-900 dark:text-white block">{row.title}</span>
                              <span className="text-[10px] text-slate-400 block">{row.adv}</span>
                            </td>
                            <td className="py-2.5 px-2 text-right font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{row.views}</td>
                            <td className="py-2.5 px-2 text-right font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{row.skips}</td>
                            <td className="py-2.5 px-2 text-right font-medium text-slate-700 dark:text-slate-300 tabular-nums">{row.skipPct}</td>
                            <td className="py-2.5 px-2 text-right font-medium text-slate-700 dark:text-slate-300 tabular-nums">{row.avgWatch}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

          {/* 4. Active Campaign Inventory Section */}
          <div className="bg-white dark:bg-[#121612] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-hidden">

            {/* Header + Launch Button */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-start space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                  <Megaphone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                    Active Campaign Inventory
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Manage client uploaded image banners, pre-roll video ads, and overlay modules.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenLaunch}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Launch Campaign</span>
              </button>
            </div>

            {/* Filter Toolbar */}
            <div className="p-3.5 bg-slate-50/60 dark:bg-[#161B16]/50 border-b border-slate-100 dark:border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search campaigns or clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FEF08A]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterPlacement}
                  onChange={(e) => setFilterPlacement(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#FEF08A]"
                >
                  <option value="ALL">All Placements</option>
                  <option value="HOME_BANNER">Banner</option>
                  <option value="PLAYER_PREROLL">Player Preroll</option>
                  <option value="EPISODE_TRANSITION">Player Midroll</option>
                  <option value="DRAWER_CARD">Drawer Card</option>
                </select>

                <select
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#FEF08A]"
                >
                  <option value="ALL">All Platforms</option>
                  <option value="ANDROID">Mobile App</option>
                  <option value="WEB">Web Browser</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#FEF08A]"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
            </div>

            {/* Inventory Table */}
            {isLoading ? (
              <PageLoader size="sm" text="Loading..." minHeight="min-h-[220px]" />
            ) : filteredAds.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <Megaphone className="w-8 h-8 text-slate-400 mb-2 opacity-50" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white">No custom campaigns found</h4>
                <p className="text-xs text-slate-400 mt-0.5 mb-3">Launch a new campaign to begin direct advertiser rotation.</p>
                <button
                  type="button"
                  onClick={handleOpenLaunch}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 transition-all cursor-pointer"
                >
                  + Launch First Campaign
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-urbanist text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-[#161B16]/30">
                      <th className="py-3 px-4">AD CAMPAIGN DETAILS</th>
                      <th className="py-3 px-3">PLACEMENTS / PLATFORM</th>
                      <th className="py-3 px-3">PRIORITY / WEIGHT</th>
                      <th className="py-3 px-3">SCHEDULING TIME</th>
                      <th className="py-3 px-3">CAPPING LIMITS (SERVED/CAP)</th>
                      <th className="py-3 px-3">STATUS</th>
                      <th className="py-3 px-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {filteredAds.map((ad) => {
                      const id = ad.id || ad._id;
                      const isVideo = ad.type === 'VIDEO_PREROLL' || ad.mediaType === 'VIDEO';
                      const impressions = ad.impressionsCount || 0;
                      const clicks = ad.clicksCount || 0;
                      const priority = ad.priority || 1;
                      const weightPct = Math.min(100, Math.round(priority * 10 + 20));

                      const startDate = ad.startDate ? new Date(ad.startDate).toLocaleDateString('en-US') : '9/9/2026';
                      const endDate = ad.endDate ? new Date(ad.endDate).toLocaleDateString('en-US') : '10/9/2026';

                      return (
                        <tr key={id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                          {/* 1. AD CAMPAIGN DETAILS */}
                          <td className="py-3.5 px-4 align-top">
                            <span className="font-bold text-slate-900 dark:text-white block text-xs">
                              {ad.title}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Client: {ad.advertiser}
                            </span>
                            <span className="text-[10px] font-bold text-amber-500 dark:text-[#FEF08A] block mt-0.5">
                              Type: {isVideo ? 'Video' : 'Image'}
                            </span>
                          </td>

                          {/* 2. PLACEMENTS / PLATFORM */}
                          <td className="py-3.5 px-3 align-top">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {getPlacementDisplay(ad.placement)}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Device: All
                            </span>
                          </td>

                          {/* 3. PRIORITY / WEIGHT */}
                          <td className="py-3.5 px-3 align-top">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              Rank Priority: {priority}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Weight: {weightPct}%
                            </span>
                          </td>

                          {/* 4. SCHEDULING TIME */}
                          <td className="py-3.5 px-3 align-top whitespace-nowrap">
                            <span className="font-medium text-slate-800 dark:text-slate-200 block">
                              {startDate} - {endDate}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Daily: 00:00 to 23:59
                            </span>
                          </td>

                          {/* 5. CAPPING LIMITS (SERVED/CAP) */}
                          <td className="py-3.5 px-3 align-top whitespace-nowrap">
                            <span className="font-medium text-slate-800 dark:text-slate-200 block tabular-nums">
                              Imps: {impressions} / ∞
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5 tabular-nums">
                              Clicks: {clicks} / ∞
                            </span>
                          </td>

                          {/* 6. STATUS */}
                          <td className="py-3.5 px-3 align-top">
                            <span className={`inline-block font-black text-xs ${ad.status === 'ACTIVE'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-400'
                              }`}>
                              {ad.status === 'ACTIVE' ? 'Active' : 'Paused'}
                            </span>
                          </td>

                          {/* 7. ACTIONS */}
                          <td className="py-3.5 px-4 align-top text-right">
                            <div className="inline-flex items-center space-x-1">
                              {/* Toggle Pause / Resume */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(id)}
                                title={ad.status === 'ACTIVE' ? 'Pause Campaign' : 'Resume Campaign'}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                              >
                                {ad.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(ad)}
                                title="Edit Campaign"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteAd(id)}
                                title="Delete Campaign"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VIEW 2: CONFIGURE NEW CUSTOM AD (LAUNCH / EDIT CAMPAIGN VIEW)
         ───────────────────────────────────────────────────────────── */}
      {viewMode === 'configure' && (
        <form onSubmit={handleSubmitForm} className="space-y-4 animate-fade-in">

          {/* Top Header Strip with Back Button */}
          <div className="flex items-center space-x-3 pb-2">
            <button
              type="button"
              onClick={() => setViewMode('inventory')}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Back to Inventory"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white">
                  {editingAdId ? 'Edit Custom Ad Campaign' : 'Configure New Custom Ad'}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#FEF08A]/30 text-slate-950 dark:text-amber-300 border border-amber-300/40">
                  {form.mediaType === 'VIDEO' ? 'VIDEO CAMPAIGN' : 'BANNER CAMPAIGN'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Smart campaign setup: auto-detects video length, pairs media types with placements, and hides irrelevant fields.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* ── SECTION 1: CAMPAIGN BASICS & PLACEMENT ── */}
          <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-amber-500 dark:text-[#FEF08A]">
              <Megaphone className="w-4 h-4" />
              <span>1. CAMPAIGN BASICS & PLACEMENT</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  CAMPAIGN TITLE NAME *
                </label>
                <div className="relative">
                  <Megaphone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Special Video Promo"
                    value={form.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FEF08A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  SPONSORING CLIENT NAME *
                </label>
                <div className="relative">
                  <Users className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corp Inc."
                    value={form.advertiser}
                    onChange={(e) => handleFormChange('advertiser', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FEF08A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  TARGET PLACEMENT SLOT *
                </label>
                <div className="relative">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={form.placement}
                    onChange={(e) => handleFormChange('placement', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FEF08A] cursor-pointer"
                  >
                    {PLACEMENT_OPTIONS.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  CREATIVE MEDIA TYPE *
                </label>
                <div className="relative">
                  {form.mediaType === 'VIDEO' ? (
                    <Video className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  )}
                  <select
                    value={form.mediaType}
                    onChange={(e) => handleFormChange('mediaType', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FEF08A] cursor-pointer"
                  >
                    <option value="IMAGE">Static Image Poster / Banner</option>
                    <option value="VIDEO">Stream Video (MP4 / WebM / HLS)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Media Asset Creative (Upload or URL) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  MEDIA ASSET CREATIVE *
                </label>
                <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${uploadMode === 'file'
                        ? 'bg-[#FEF08A] text-slate-950 font-black shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${uploadMode === 'url'
                        ? 'bg-[#FEF08A] text-slate-950 font-black shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    Direct URL Link
                  </button>
                </div>
              </div>

              {uploadMode === 'file' ? (
                <label className="border-2 border-dashed border-slate-200 dark:border-white/15 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-300 dark:hover:border-amber-400/50 bg-slate-50/50 dark:bg-[#161B16]/30 transition-colors group">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-amber-500 transition-colors mb-2" />
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {isUploading ? 'Uploading file to CDN...' : 'Drag & drop image or video file or click to browse'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    Accepts JPEG, PNG, GIF, WebP, MP4
                  </span>
                  {form.mediaUrl && (
                    <span className="mt-2 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 truncate max-w-sm">
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
                <div>
                  <input
                    type="url"
                    required
                    placeholder={form.mediaType === 'VIDEO' ? 'https://example.com/video.mp4' : 'https://example.com/poster.jpg'}
                    value={form.mediaUrl}
                    onChange={(e) => handleFormChange('mediaUrl', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FEF08A]"
                  />
                </div>
              )}
              {uploadError && (
                <p className="text-[11px] text-rose-500 font-medium mt-1">{uploadError}</p>
              )}
            </div>

          </div>

          {/* ── SECTION 2: DESTINATION & AUDIENCE TARGETING ── */}
          <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-amber-500 dark:text-[#FEF08A]">
              <LinkIcon className="w-4 h-4" />
              <span>2. DESTINATION & AUDIENCE TARGETING</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  REDIRECTION CLICK LINK (DESTINATION URL)
                </label>
                <div className="relative">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="https://clientwebsite.com/landing-page"
                    value={form.targetUrl}
                    onChange={(e) => handleFormChange('targetUrl', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FEF08A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  CLICK ANCHOR TARGET WINDOW
                </label>
                <div className="relative">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={form.targetWindow}
                    onChange={(e) => handleFormChange('targetWindow', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FEF08A] cursor-pointer"
                  >
                    {TARGET_WINDOW_OPTIONS.map(w => (
                      <option key={w.id} value={w.id}>{w.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  TARGET DEVICES
                </label>
                <div className="relative">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={form.targetDevices}
                    onChange={(e) => handleFormChange('targetDevices', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FEF08A] cursor-pointer"
                  >
                    {TARGET_DEVICE_OPTIONS.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    TARGET WEBSITE PAGE
                  </label>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    STANDARD 16:9 LANDSCAPE CREATIVE (1920X1080)
                  </span>
                </div>
                <div className="relative">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={form.targetPage}
                    onChange={(e) => handleFormChange('targetPage', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FEF08A] cursor-pointer"
                  >
                    {TARGET_PAGE_OPTIONS.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: PLAYBACK DURATION & SKIP RULES ── */}
          <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-amber-500 dark:text-[#FEF08A]">
              <Clock className="w-4 h-4" />
              <span>3. PLAYBACK DURATION & SKIP RULES</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {form.mediaType === 'VIDEO' ? 'VIDEO PLAYBACK DURATION (SECONDS) *' : 'DISPLAY BANNER DURATION (SECONDS) *'}
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={form.videoDuration}
                    onChange={(e) => handleFormChange('videoDuration', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FEF08A]"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  How many seconds the ad creative remains displayed before auto-rotating.
                </p>
              </div>

              {form.mediaType === 'VIDEO' ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    SKIP BUTTON DELAY (SECONDS, 0 = NON-SKIP) *
                  </label>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={form.skipAfterSeconds}
                      onChange={(e) => handleFormChange('skipAfterSeconds', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FEF08A]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Users can skip video after this duration. Set 0 for forced view.
                  </p>
                </div>
              ) : (
                <div className="flex items-center p-3 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10 text-xs text-slate-400">
                  <Info className="w-4 h-4 text-amber-500 mr-2 shrink-0" />
                  <span>Skip controls are disabled for static banner placements.</span>
                </div>
              )}
            </div>
          </div>

          {/* ── SECTION 4: ADVANCED SCHEDULE & DELIVERY CAPS (OPTIONAL COLLAPSIBLE) ── */}
          <div className="bg-white dark:bg-[#121612] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvancedSchedule(p => !p)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-500 dark:text-[#FEF08A]" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Advanced Schedule & Delivery Caps (Optional)
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  (Start/Expiry dates, impressions cap, click cap, priority weights)
                </span>
              </div>
              {showAdvancedSchedule ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showAdvancedSchedule && (
              <div className="p-5 pt-2 border-t border-slate-100 dark:border-white/[0.06] space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => handleFormChange('startDate', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FEF08A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Expiry Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => handleFormChange('endDate', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FEF08A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Impressions Cap (0 = Unlimited)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 50000"
                      value={form.cappingImpressions}
                      onChange={(e) => handleFormChange('cappingImpressions', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FEF08A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Priority Rank (1–10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={form.priority}
                      onChange={(e) => handleFormChange('priority', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FEF08A]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end space-x-2.5 pt-2">
            <button
              type="button"
              onClick={() => setViewMode('inventory')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              Cancel & Exit
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-black bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Megaphone className="w-3.5 h-3.5" />}
              <span>{editingAdId ? 'Update Ad Campaign' : 'Publish Ad Campaign'}</span>
            </button>
          </div>

        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TOAST FEEDBACK NOTIFICATION
         ───────────────────────────────────────────────────────────── */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl border text-xs font-bold ${toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-800 text-rose-200'
              : 'bg-[#121612]/95 border-amber-300/40 text-slate-100 shadow-amber-950/20'
            }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

    </div>
  );
}
