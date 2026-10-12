import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { bannerService } from '../../services/bannerService';
import { dramaService } from '../../services/dramaService';
import { uploadService } from '../../services/uploadService';
import Badge from '../../components/common/Badge';
import KpiStatCard from '../../components/common/KpiStatCard';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import PageLoader from '../../components/common/PageLoader';
import ModalPortal from '../../components/common/ModalPortal';
import {
  Image as ImageIcon,
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
  Trash2,
  Pencil,
  Play,
  Sparkles,
  RefreshCw,
  Loader2,
  FolderUp,
  AlertCircle,
  X,
  ExternalLink,
  Clapperboard,
  Link2,
  Check,
  Crown
} from 'lucide-react';

const BADGE_OPTIONS = [
  'FEATURED',
  'TOP 10',
  'TRENDING',
  'EXCLUSIVE',
  'NEW RELEASE',
  'ORIGINAL',
  'EDITOR CHOICE',
  'SPECIAL'
];

export default function BannersPage({ onNavigate }) {
  const [banners, setBanners] = useState([]);
  const [dramas, setDramas] = useState([]);
  const [stats, setStats] = useState({
    totalBanners: 0,
    activeBanners: 0,
    dramaLinkedBanners: 0,
    externalBanners: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [filterLinkType, setFilterLinkType] = useState('ALL'); // 'ALL' | 'DRAMA' | 'EXTERNAL_URL'

  // Quick Direct Rank Modal (same as Content Library page)
  const [quickPriorityBanner, setQuickPriorityBanner] = useState(null);
  const [quickRankInput, setQuickRankInput] = useState(1);

  // Modal states (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null); // null = create mode
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formBannerUrl, setFormBannerUrl] = useState('');
  const [formPosterUrl, setFormPosterUrl] = useState('');
  const [formTrailerUrl, setFormTrailerUrl] = useState('');
  const [formBadge, setFormBadge] = useState('FEATURED');
  const [formCustomBadge, setFormCustomBadge] = useState('');
  const [formLinkType, setFormLinkType] = useState('DRAMA');
  const [formDramaId, setFormDramaId] = useState('');
  const [formEpisodeNumber, setFormEpisodeNumber] = useState(1);
  const [formExternalUrl, setFormExternalUrl] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState(1);
  const [formIsActive, setFormIsActive] = useState(true);

  // Media upload states inside modal
  const [imageSourceMode, setImageSourceMode] = useState('upload'); // 'upload' | 'drama' | 'url'
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingTrailer, setIsUploadingTrailer] = useState(false);
  const fileInputRef = useRef(null);
  const trailerInputRef = useRef(null);

  // Video trailer preview modal
  const [previewVideo, setPreviewVideo] = useState(null);

  // Toast feedback state
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  // Fetch live banners & dramas
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [bannersRes, dramasRes] = await Promise.allSettled([
        bannerService.getAdminBanners(),
        dramaService.getAdminDramas()
      ]);

      if (bannersRes.status === 'fulfilled' && bannersRes.value) {
        setBanners(bannersRes.value.banners || []);
        if (bannersRes.value.stats) {
          setStats(bannersRes.value.stats);
        }
      }

      if (dramasRes.status === 'fulfilled' && dramasRes.value) {
        setDramas(dramasRes.value.dramas || []);
      }
    } catch (err) {
      console.error('Failed to load banner data:', err);
      setError(err.message || 'Failed to fetch banner data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered banners
  const filteredBanners = useMemo(() => {
    return banners
      .filter((b) => {
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !term ||
          b.title.toLowerCase().includes(term) ||
          (b.subtitle && b.subtitle.toLowerCase().includes(term)) ||
          (b.badge && b.badge.toLowerCase().includes(term)) ||
          (b.drama && b.drama.title.toLowerCase().includes(term));

        let matchesStatus = true;
        if (filterStatus === 'ACTIVE') matchesStatus = !!b.isActive;
        if (filterStatus === 'INACTIVE') matchesStatus = !b.isActive;

        let matchesLink = true;
        if (filterLinkType === 'DRAMA') matchesLink = b.linkType === 'DRAMA';
        if (filterLinkType === 'EXTERNAL_URL') matchesLink = b.linkType === 'EXTERNAL_URL';

        return matchesSearch && matchesStatus && matchesLink;
      })
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [banners, searchTerm, filterStatus, filterLinkType]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingBanner(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormBannerUrl('');
    setFormPosterUrl('');
    setFormTrailerUrl('');
    setFormBadge('FEATURED');
    setFormCustomBadge('');
    setFormLinkType('DRAMA');
    setFormDramaId(dramas[0]?.id || '');
    setFormEpisodeNumber(1);
    setFormExternalUrl('');
    setFormDisplayOrder(banners.length + 1);
    setFormIsActive(true);
    setImageSourceMode(dramas.length > 0 ? 'drama' : 'upload');
    setFormError(null);

    if (dramas.length > 0) {
      const d = dramas[0];
      setFormTitle(d.title);
      setFormSubtitle(d.synopsis || '');
      setFormBannerUrl(d.banner || d.poster || '');
      setFormPosterUrl(d.poster || '');
      setFormTrailerUrl(d.trailerUrl || '');
    }

    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (banner) => {
    setEditingBanner(banner);
    setFormTitle(banner.title);
    setFormSubtitle(banner.subtitle || '');
    setFormBannerUrl(banner.bannerUrl || '');
    setFormPosterUrl(banner.posterUrl || '');
    setFormTrailerUrl(banner.trailerUrl || '');
    if (BADGE_OPTIONS.includes(banner.badge)) {
      setFormBadge(banner.badge);
      setFormCustomBadge('');
    } else {
      setFormBadge('CUSTOM');
      setFormCustomBadge(banner.badge || '');
    }
    setFormLinkType(banner.linkType || 'DRAMA');
    setFormDramaId(banner.dramaId || '');
    setFormEpisodeNumber(banner.episodeNumber || 1);
    setFormExternalUrl(banner.externalUrl || '');
    setFormDisplayOrder(banner.displayOrder || 1);
    setFormIsActive(Boolean(banner.isActive));
    setImageSourceMode('url');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Pick Drama to Auto-fill
  const handleSelectDrama = (dramaId) => {
    setFormDramaId(dramaId);
    const drama = dramas.find((d) => d.id === dramaId);
    if (drama) {
      if (!formTitle || formTitle === editingBanner?.title) {
        setFormTitle(drama.title);
      }
      if (!formSubtitle) {
        setFormSubtitle(drama.synopsis || '');
      }
      if (imageSourceMode === 'drama') {
        setFormBannerUrl(drama.banner || drama.poster || '');
        setFormPosterUrl(drama.poster || '');
        if (drama.trailerUrl) setFormTrailerUrl(drama.trailerUrl);
      }
    }
  };

  // Image File Upload Handler
  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setFormError(null);
    try {
      const res = await uploadService.uploadSingle(file, 'images');
      if (res && res.url) {
        setFormBannerUrl(res.url);
        showToast('Banner artwork uploaded successfully', 'success');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      setFormError('Failed to upload image: ' + (err.message || 'Server error'));
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Video Trailer File Upload Handler
  const handleTrailerFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingTrailer(true);
    setFormError(null);
    try {
      const res = await uploadService.uploadSingle(file, 'videos');
      if (res && res.url) {
        setFormTrailerUrl(res.url);
        showToast('Teaser video trailer uploaded', 'success');
      }
    } catch (err) {
      console.error('Trailer upload failed:', err);
      setFormError('Failed to upload video: ' + (err.message || 'Server error'));
    } finally {
      setIsUploadingTrailer(false);
      if (trailerInputRef.current) trailerInputRef.current.value = '';
    }
  };

  // Submit Modal (Create or Update)
  const handleSubmitModal = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Banner title is required.');
      return;
    }
    if (!formBannerUrl.trim()) {
      setFormError('Banner image is required (upload file, select drama, or provide URL).');
      return;
    }

    const finalBadge = formBadge === 'CUSTOM' ? formCustomBadge.trim().toUpperCase() || 'FEATURED' : formBadge;

    const payload = {
      title: formTitle.trim(),
      subtitle: formSubtitle.trim(),
      bannerUrl: formBannerUrl.trim(),
      posterUrl: formPosterUrl.trim() || formBannerUrl.trim(),
      trailerUrl: formTrailerUrl.trim(),
      badge: finalBadge,
      linkType: formLinkType,
      dramaId: formLinkType === 'DRAMA' && formDramaId ? formDramaId : null,
      episodeNumber: formLinkType === 'DRAMA' ? Number(formEpisodeNumber || 1) : 1,
      externalUrl: formLinkType === 'EXTERNAL_URL' ? formExternalUrl.trim() : '',
      displayOrder: Number(formDisplayOrder || 0),
      isActive: Boolean(formIsActive)
    };

    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingBanner) {
        await bannerService.updateBanner(editingBanner.id, payload);
        showToast(`Banner "${payload.title}" updated`, 'success');
      } else {
        await bannerService.createBanner(payload);
        showToast(`Banner "${payload.title}" published to carousel`, 'success');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Save banner error:', err);
      setFormError(err.message || 'Failed to save banner.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (id) => {
    const target = banners.find((b) => b.id === id);
    const newStatus = target ? !target.isActive : true;

    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: newStatus } : b))
    );
    setStats((prev) => ({
      ...prev,
      activeBanners: newStatus ? prev.activeBanners + 1 : Math.max(0, prev.activeBanners - 1)
    }));
    showToast(newStatus ? 'Banner activated in carousel' : 'Banner hidden from carousel', 'info');

    try {
      await bannerService.toggleActive(id);
    } catch (err) {
      console.error('Toggle active failed:', err);
      fetchData(); // Rollback
    }
  };

  // Delete Banner
  const handleDeleteBanner = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete banner "${title}"?`)) return;
    try {
      await bannerService.deleteBanner(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      setStats((prev) => ({
        ...prev,
        totalBanners: Math.max(0, prev.totalBanners - 1),
        activeBanners: prev.activeBanners - (banners.find((b) => b.id === id)?.isActive ? 1 : 0)
      }));
      showToast('Banner permanently deleted', 'info');
    } catch (err) {
      console.error('Delete banner failed:', err);
      fetchData();
    }
  };

  // Reorder Priority Up / Down
  const handleMoveOrder = async (id, direction) => {
    const currentIdx = banners.findIndex((b) => b.id === id);
    if (currentIdx < 0) return;
    const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= banners.length) return;

    const newBanners = [...banners];
    const temp = newBanners[currentIdx];
    newBanners[currentIdx] = newBanners[targetIdx];
    newBanners[targetIdx] = temp;

    const updatedWithOrder = newBanners.map((b, idx) => ({
      ...b,
      displayOrder: idx + 1
    }));

    setBanners(updatedWithOrder);
    showToast(`Order shifted to priority #${targetIdx + 1}`, 'info');

    try {
      const items = updatedWithOrder.map((b) => ({ id: b.id, displayOrder: b.displayOrder }));
      await bannerService.reorderBanners(items);
    } catch (err) {
      console.error('Reorder failed:', err);
      fetchData(); // rollback
    }
  };

  // Set explicit priority rank directly (same as Content Library page)
  const handleSetDirectRank = async (id, targetRankNum) => {
    const currIdx = banners.findIndex((b) => b.id === id);
    if (currIdx === -1) return;
    const targetIdx = Math.max(0, Math.min(banners.length - 1, Number(targetRankNum) - 1));
    if (targetIdx === currIdx) return;

    const newBanners = [...banners];
    const [moved] = newBanners.splice(currIdx, 1);
    newBanners.splice(targetIdx, 0, moved);

    const updatedWithOrder = newBanners.map((b, idx) => ({
      ...b,
      displayOrder: idx + 1
    }));

    setBanners(updatedWithOrder);
    showToast(`"${moved.title}" moved to Rank #${targetIdx + 1}`, 'success');

    try {
      const items = updatedWithOrder.map((b) => ({ id: b.id, displayOrder: b.displayOrder }));
      await bannerService.reorderBanners(items);
    } catch (err) {
      console.error('Reorder banners failed:', err);
      showToast('Failed to save priority order: ' + (err.message || 'Server error'), 'error');
      fetchData();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-4 font-urbanist selection:bg-[#FEF08A] selection:text-black pb-10"
    >
      {/* 4 Clean Minimal KPI Metric Cards with Staggered Entrance */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
          }
        }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5"
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
          <KpiStatCard
            icon={ImageIcon}
            title="Total Banners"
            value={stats.totalBanners || banners.length}
            animateNumber={true}
            footerLeft="Showcase Registry"
            footerRight="Widescreen"
          />
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
          <KpiStatCard
            icon={Sparkles}
            title="Active in Carousel"
            value={stats.activeBanners}
            animateNumber={true}
            footerLeft="Mobile Home"
            footerRight="Live Feed"
            footerRightColor="text-emerald-600 dark:text-emerald-400 font-bold"
          />
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
          <KpiStatCard
            icon={Clapperboard}
            title="Linked to Drama"
            value={stats.dramaLinkedBanners}
            animateNumber={true}
            footerLeft="Direct Playback"
            footerRight={`${stats.dramaLinkedBanners} Series`}
          />
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
          <KpiStatCard
            icon={Link2}
            title="External / Promo"
            value={stats.externalBanners}
            animateNumber={true}
            footerLeft="Web Redirect"
            footerRight={`${stats.externalBanners} Links`}
          />
        </motion.div>
      </motion.div>

      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center space-x-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
                Banners & Hero Carousel
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-[#FEF08A] text-slate-950 border border-amber-300/60 shadow-xs">
                {banners.length} Banners
              </span>
            </div>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
              Manage 16:9 widescreen showcase slides, video trailer teasers, and one-tap drama deep links.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={fetchData}
            disabled={isLoading}
            className="w-8 h-8 rounded-full bg-white dark:bg-[#121216] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-white/10 flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-90 hover:scale-105 shadow-2xs group/refresh shrink-0"
            title="Refresh Banners"
          >
            <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-500 ease-out group-hover/refresh:rotate-180 ${isLoading ? 'animate-spin text-[#FEF08A]' : 'group-hover/refresh:text-[#FEF08A]'}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="h-8 px-4 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs rounded-full flex items-center space-x-1.5 transition-all duration-200 shadow-xs cursor-pointer active:scale-95 hover:scale-[1.02] group/upload"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5] transition-transform duration-200 group-hover/upload:rotate-90" />
            <span>Upload Banner</span>
          </button>
        </div>
      </div>

      {/* Unified Filter, Search & View Toolbar */}
      <div className="bg-white dark:bg-[#121216] rounded-2xl p-2.5 sm:px-3.5 border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Left: Status Filter Tabs & Link Type */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Animated Status Segmented Control */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-[#18181E] rounded-xl border border-slate-200/60 dark:border-white/10 shrink-0">
            {[
              { id: 'ALL', label: 'All', count: banners.length },
              { id: 'ACTIVE', label: 'Active', count: stats.activeBanners },
              { id: 'INACTIVE', label: 'Hidden', count: Math.max(0, banners.length - stats.activeBanners) }
            ].map((tab) => {
              const isSelected = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`relative px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'text-slate-950 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="bannerFilterTab"
                      className="absolute inset-0 bg-white dark:bg-[#24242E] rounded-lg shadow-2xs border border-slate-200/50 dark:border-white/10"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center space-x-1">
                    <span>{tab.label}</span>
                    <span className="text-[10px] opacity-70">({tab.count})</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Link Type Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-[#18181E] px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
            <Link2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterLinkType}
              onChange={(e) => setFilterLinkType(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="dark:bg-[#1E1E26]">All Targets</option>
              <option value="DRAMA" className="dark:bg-[#1E1E26]">Drama Series</option>
              <option value="EXTERNAL_URL" className="dark:bg-[#1E1E26]">External URL</option>
            </select>
          </div>

          {(searchTerm || filterStatus !== 'ALL' || filterLinkType !== 'ALL') && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('ALL');
                setFilterLinkType('ALL');
              }}
              className="text-[11.5px] text-amber-600 dark:text-amber-400 hover:underline font-bold px-2 py-0.5 cursor-pointer"
            >
              Reset Filters
            </motion.button>
          )}
        </div>

        {/* Right: Search Box + Banner Count */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search banners..."
              className="w-full pl-9 pr-8 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-xl focus:border-[#FEF08A] focus:ring-1 focus:ring-[#FEF08A]/40 focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <span className="text-[11.5px] text-slate-400 font-medium shrink-0 hidden lg:inline">
            <strong className="text-slate-900 dark:text-white font-bold">{filteredBanners.length}</strong> banners listed
          </span>
        </div>

      </div>

      {/* Main Banners Table Content */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#121216] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-hidden">
          <PageLoader text="Loading hero banners..." minHeight="min-h-[280px]" />
        </div>
      ) : filteredBanners.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-[#121216] rounded-2xl p-10 text-center border border-slate-200/90 dark:border-white/10 shadow-xs"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs mx-auto mb-3">
            <ImageIcon className="w-6 h-6 stroke-[2]" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white">
            {searchTerm || filterStatus !== 'ALL' || filterLinkType !== 'ALL'
              ? 'No matching banners found'
              : 'No hero banners uploaded yet'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto mb-4">
            {searchTerm || filterStatus !== 'ALL' || filterLinkType !== 'ALL'
              ? 'Try modifying your search query or reset status and target filters.'
              : 'Upload 16:9 widescreen showcase slides to feature top drama series, trailers, and promotions on the mobile app home screen.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center space-x-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Upload First Banner</span>
          </button>
        </motion.div>
      ) : (
        /* TABLE VIEW: Compact, Modern Studio Catalog Table */
        <div className="bg-white dark:bg-[#121216] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 dark:bg-[#18181E] border-b border-slate-200/90 dark:border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10.5px]">
                <tr>
                  <th className="py-3 px-3.5 w-24 text-center">Rank</th>
                  <th className="py-3 px-3.5 w-32">Artwork</th>
                  <th className="py-3 px-3.5 min-w-[200px]">Banner Title & Info</th>
                  <th className="py-3 px-3.5 w-32">Badge</th>
                  <th className="py-3 px-3.5 min-w-[170px]">Destination Link</th>
                  <th className="py-3 px-3.5 w-28 text-center">Status</th>
                  <th className="py-3 px-3.5 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                {filteredBanners.map((banner, index) => (
                  <motion.tr
                    layout
                    key={banner.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* Minimal Rounded Priority Stepper Capsule with Micro-Animations (same as Content Page) */}
                    <td className="py-2.5 px-3.5 align-middle text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center bg-slate-100/90 dark:bg-[#18181E] border border-slate-200/80 dark:border-white/10 rounded-full px-1 py-0.5 shadow-2xs hover:border-amber-400/40 dark:hover:border-[#FEF08A]/30 transition-all duration-200 group/stepper">
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(banner.id, 'up')}
                          disabled={index === 0}
                          title="Move Priority Up"
                          className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-[#FEF08A] hover:bg-white dark:hover:bg-white/10 active:scale-90 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer transition-all duration-150 group/up"
                        >
                          <ChevronUp className="w-3.5 h-3.5 stroke-[2.2] transition-transform duration-200 group-hover/up:-translate-y-0.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setQuickPriorityBanner(banner);
                            setQuickRankInput(banner.displayOrder || index + 1);
                          }}
                          className={`min-w-[26px] h-5 px-1 rounded-full flex items-center justify-center text-xs tabular-nums cursor-pointer transition-all duration-150 active:scale-90 hover:scale-105 ${
                            (banner.displayOrder || index + 1) === 1
                              ? 'text-amber-500 dark:text-[#FEF08A] font-black'
                              : (banner.displayOrder || index + 1) <= 3
                              ? 'text-amber-600 dark:text-amber-300 font-extrabold'
                              : 'text-slate-700 dark:text-slate-300 font-bold'
                          }`}
                          title={`Rank #${banner.displayOrder || index + 1}. Click to jump rank directly.`}
                        >
                          {banner.displayOrder || index + 1}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoveOrder(banner.id, 'down')}
                          disabled={index === filteredBanners.length - 1}
                          title="Move Priority Down"
                          className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-[#FEF08A] hover:bg-white dark:hover:bg-white/10 active:scale-90 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer transition-all duration-150 group/down"
                        >
                          <ChevronDown className="w-3.5 h-3.5 stroke-[2.2] transition-transform duration-200 group-hover/down:translate-y-0.5" />
                        </button>
                      </div>
                    </td>

                    {/* Thumbnail Artwork */}
                    <td className="py-2.5 px-3.5 align-middle">
                      <div
                        className={`relative aspect-[16/9] w-24 rounded-lg overflow-hidden bg-slate-950 border border-slate-200/90 dark:border-white/10 shadow-2xs group/art ${
                          banner.trailerUrl ? 'cursor-pointer' : ''
                        }`}
                        onClick={() => {
                          if (banner.trailerUrl) {
                            setPreviewVideo({ title: banner.title, url: banner.trailerUrl });
                          }
                        }}
                        title={banner.trailerUrl ? 'Click to preview teaser trailer' : undefined}
                      >
                        <img
                          src={banner.bannerUrl}
                          alt={banner.title}
                          className="w-full h-full object-cover group-hover/art:scale-108 transition-transform duration-300"
                        />
                        {banner.trailerUrl && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/art:opacity-100 transition-opacity">
                            <div className="w-6 h-6 rounded-full bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-md">
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Title & Subtitle */}
                    <td className="py-2.5 px-3.5 align-middle">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-[13.5px]">
                          {banner.title}
                        </span>
                        {banner.trailerUrl && (
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-400/15 text-amber-600 dark:text-amber-400 border border-amber-400/25">
                            Trailer
                          </span>
                        )}
                      </div>
                      {banner.subtitle && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md font-normal mt-0.5">
                          {banner.subtitle}
                        </div>
                      )}
                    </td>

                    {/* Theme Badge */}
                    <td className="py-2.5 px-3.5 align-middle">
                      <Badge variant="kpi-amber" label={banner.badge || 'FEATURED'} size="xs" />
                    </td>

                    {/* Link Target */}
                    <td className="py-2.5 px-3.5 align-middle">
                      {banner.linkType === 'DRAMA' ? (
                        <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                          <Clapperboard className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate font-semibold text-xs">
                            {banner.drama ? banner.drama.title : 'Drama Series'}{' '}
                            <span className="text-slate-400 dark:text-slate-500 font-normal text-[11px]">
                              (Ep {banner.episodeNumber || 1})
                            </span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 truncate">
                          <ExternalLink className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span className="truncate font-mono text-[11px]">
                            {banner.externalUrl}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-2.5 px-3.5 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-2 justify-center">
                        <ToggleSwitch
                          checked={Boolean(banner.isActive)}
                          onChange={() => handleToggleActive(banner.id)}
                          size="sm"
                          title={banner.isActive ? 'Active (Click to hide)' : 'Hidden (Click to activate)'}
                        />
                        <span
                          className={`text-[10.5px] font-bold ${
                            banner.isActive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {banner.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="py-2.5 px-3.5 align-middle text-right">
                      <div className="inline-flex items-center space-x-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => handleOpenEdit(banner)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                          title="Edit Banner"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => handleDeleteBanner(banner.id, banner.title)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete Banner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          QUICK DIRECT PRIORITY RANK MODAL (SAME AS CONTENT PAGE)
         ======================================================== */}
      {quickPriorityBanner && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/70 dark:bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-[#1E1E26] rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-white/15 overflow-hidden font-urbanist"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/70 dark:bg-[#18181E]">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
                    #{quickPriorityBanner.displayOrder || 1}
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">
                    Set Carousel Priority Rank
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickPriorityBanner(null)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content Preview & Form */}
              <div className="p-4 space-y-4">
                {/* Target Banner Info Card */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#18181E] border border-slate-200/70 dark:border-white/10">
                  <img
                    src={quickPriorityBanner.bannerUrl}
                    alt={quickPriorityBanner.title}
                    className="w-16 h-10 rounded-lg object-cover bg-slate-950 shrink-0 shadow-xs border border-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-slate-950 dark:text-white truncate">
                      {quickPriorityBanner.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {quickPriorityBanner.badge || 'FEATURED'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-[#FEF08A] border border-amber-500/20">
                        Current Rank: #{quickPriorityBanner.displayOrder || 1}
                      </span>
                      <span className="text-[10px] text-slate-400">of {banners.length} banners</span>
                    </div>
                  </div>
                </div>

                {/* Rank Input Controller */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Target Priority Rank (1 to {banners.length})
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuickRankInput((prev) => Math.max(1, Number(prev) - 1))}
                      disabled={Number(quickRankInput) <= 1}
                      className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-[#FEF08A] hover:text-slate-950 font-black text-sm flex items-center justify-center cursor-pointer transition-all duration-200 disabled:opacity-20 active:scale-90 hover:scale-105"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={banners.length}
                      value={quickRankInput}
                      onChange={(e) => setQuickRankInput(Math.max(1, Math.min(banners.length, Number(e.target.value) || 1)))}
                      className="flex-1 h-9 text-center font-black text-base rounded-full border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-[#18181E] text-slate-950 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60"
                    />
                    <button
                      type="button"
                      onClick={() => setQuickRankInput((prev) => Math.min(banners.length, Number(prev) + 1))}
                      disabled={Number(quickRankInput) >= banners.length}
                      className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-[#FEF08A] hover:text-slate-950 font-black text-sm flex items-center justify-center cursor-pointer transition-all duration-200 disabled:opacity-20 active:scale-90 hover:scale-105"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Quick Jump Shortcuts */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-400 mb-1.5">
                    Quick Placement Shortcuts
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuickRankInput(1)}
                      className={`py-1.5 px-2 rounded-full text-xs font-bold border transition-all duration-200 active:scale-95 cursor-pointer ${
                        Number(quickRankInput) === 1
                          ? 'bg-[#FEF08A] text-slate-950 border-amber-300 shadow-2xs font-black'
                          : 'bg-slate-100 dark:bg-[#18181E] text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-white/10 hover:border-amber-300/40'
                      }`}
                    >
                      👑 #1 Top
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickRankInput((prev) => Math.max(1, Number(prev) - 1))}
                      className="py-1.5 px-2 rounded-full text-xs font-bold bg-slate-100 dark:bg-[#18181E] text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-white/10 hover:border-amber-300/40 cursor-pointer transition-all duration-200 active:scale-95"
                    >
                      ⬆ Move Up
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickRankInput((prev) => Math.min(banners.length, Number(prev) + 1))}
                      className="py-1.5 px-2 rounded-full text-xs font-bold bg-slate-100 dark:bg-[#18181E] text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-white/10 hover:border-amber-300/40 cursor-pointer transition-all duration-200 active:scale-95"
                    >
                      ⬇ Move Down
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickRankInput(banners.length)}
                      className={`py-1.5 px-2 rounded-full text-xs font-bold border transition-all duration-200 active:scale-95 cursor-pointer ${
                        Number(quickRankInput) === banners.length
                          ? 'bg-[#FEF08A] text-slate-950 border-amber-300 shadow-2xs font-black'
                          : 'bg-slate-100 dark:bg-[#18181E] text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-white/10 hover:border-amber-300/40'
                      }`}
                    >
                      ⚓ Last
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="p-3.5 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-[#1E1E26] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuickPriorityBanner(null)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSetDirectRank(quickPriorityBanner.id, quickRankInput);
                    setQuickPriorityBanner(null);
                  }}
                  className="px-4 py-1.5 text-xs font-bold bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 rounded-full transition-all duration-200 shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Apply Rank</span>
                </button>
              </div>
            </motion.div>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================
          UPLOAD / CREATE / EDIT BANNER MODAL (ANIMATED)
         ======================================================== */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-white dark:bg-[#18181E] rounded-3xl border border-slate-200 dark:border-white/10 w-full max-w-2xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[92vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200/90 dark:border-white/10 flex items-center justify-between bg-slate-50/80 dark:bg-[#121216]">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs shrink-0">
                    <ImageIcon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-950 dark:text-white text-sm sm:text-base">
                      {editingBanner ? 'Edit Hero Banner' : 'Upload New Hero Banner'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Configure 16:9 widescreen showcase slide, badge, trailer video, and destination target
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form Body */}
              <form onSubmit={handleSubmitModal} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
                {formError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 flex items-center space-x-2 text-xs"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </motion.div>
                )}

                {/* 1. Banner Image Source Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider">
                      Banner Artwork (16:9 Landscape) *
                    </label>
                    <div className="flex items-center bg-slate-100 dark:bg-[#121216] p-0.5 rounded-xl border border-slate-200 dark:border-white/10 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setImageSourceMode('upload')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          imageSourceMode === 'upload'
                            ? 'bg-[#FEF08A] text-slate-950 font-black shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Upload File
                      </button>
                      {dramas.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setImageSourceMode('drama');
                            if (formDramaId) handleSelectDrama(formDramaId);
                          }}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            imageSourceMode === 'drama'
                              ? 'bg-[#FEF08A] text-slate-950 font-black shadow-2xs'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          From Series
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setImageSourceMode('url')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          imageSourceMode === 'url'
                            ? 'bg-[#FEF08A] text-slate-950 font-black shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Image URL
                      </button>
                    </div>
                  </div>

                  {/* Mode 1: File Upload Dropzone */}
                  {imageSourceMode === 'upload' && (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-[#FEF08A] dark:hover:border-[#FEF08A] rounded-2xl p-4 text-center cursor-pointer transition-all bg-slate-50/60 dark:bg-[#121216]/60 group"
                      >
                        {isUploadingImage ? (
                          <div className="flex flex-col items-center justify-center space-y-2 py-2">
                            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                              Uploading high-res banner image...
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-1.5">
                            <FolderUp className="w-6 h-6 text-slate-400 group-hover:text-amber-500 transition-colors" />
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                              Click to browse or drop 16:9 banner image
                            </p>
                            <p className="text-[10.5px] text-slate-400">
                              PNG, JPG, WEBP (1920x1080 or 1280x720 recommended)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mode 2: From Series Dropdown */}
                  {imageSourceMode === 'drama' && (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#121216] border border-slate-200 dark:border-white/10 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Choose drama series to auto-import artwork and trailer:
                      </span>
                      <select
                        value={formDramaId}
                        onChange={(e) => handleSelectDrama(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#18181E] border border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white cursor-pointer text-xs"
                      >
                        {dramas.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.title} ({d.totalEpisodes} episodes)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Mode 3: Image URL input */}
                  {imageSourceMode === 'url' && (
                    <input
                      type="url"
                      value={formBannerUrl}
                      onChange={(e) => setFormBannerUrl(e.target.value)}
                      placeholder="https://.../banner_16x9.jpg"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 font-mono text-xs bg-white dark:bg-[#121216] text-slate-900 dark:text-white focus:border-[#FEF08A] focus:outline-none"
                    />
                  )}

                  {/* Live Modal Preview Deck */}
                  {formBannerUrl && (
                    <div className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-white/10 mt-2 shadow-md group">
                      <img
                        src={formBannerUrl}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-[#FEF08A] text-slate-950 shadow-md">
                        {formBadge === 'CUSTOM' ? formCustomBadge || 'BADGE' : formBadge}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-3.5">
                        <span className="font-extrabold text-white text-sm truncate drop-shadow">
                          {formTitle || 'Banner Title'}
                        </span>
                        {formSubtitle && (
                          <span className="text-[11px] text-white/80 truncate drop-shadow-sm mt-0.5">
                            {formSubtitle}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Title & Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 text-[11px] uppercase tracking-wider">
                      Banner Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Forbidden Romance"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 font-bold bg-white dark:bg-[#121216] text-slate-900 dark:text-white focus:border-[#FEF08A] focus:outline-none transition-all text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 text-[11px] uppercase tracking-wider">
                      Subtitle / Storyline Hook
                    </label>
                    <textarea
                      rows={2}
                      value={formSubtitle}
                      onChange={(e) => setFormSubtitle(e.target.value)}
                      placeholder="Brief engaging storyline description shown on mobile carousel..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 font-medium bg-white dark:bg-[#121216] text-slate-900 dark:text-white focus:border-[#FEF08A] focus:outline-none transition-all resize-none text-xs"
                    />
                  </div>
                </div>

                {/* 3. Badge & Priority Order */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 text-[11px] uppercase tracking-wider">
                      Showcase Badge
                    </label>
                    <div className="flex items-center space-x-2">
                      <select
                        value={formBadge}
                        onChange={(e) => setFormBadge(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 font-bold bg-white dark:bg-[#121216] text-slate-900 dark:text-white focus:border-[#FEF08A] focus:outline-none cursor-pointer text-xs"
                      >
                        {BADGE_OPTIONS.map((badge) => (
                          <option key={badge} value={badge}>
                            {badge}
                          </option>
                        ))}
                        <option value="CUSTOM">Custom Badge...</option>
                      </select>

                      {formBadge === 'CUSTOM' && (
                        <input
                          type="text"
                          value={formCustomBadge}
                          onChange={(e) => setFormCustomBadge(e.target.value)}
                          placeholder="e.g. VIP ONLY"
                          className="w-36 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 font-bold uppercase bg-white dark:bg-[#121216] text-slate-900 dark:text-white focus:border-[#FEF08A] focus:outline-none text-xs"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 text-[11px] uppercase tracking-wider">
                      Priority Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formDisplayOrder}
                      onChange={(e) => setFormDisplayOrder(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 font-bold bg-white dark:bg-[#121216] text-slate-900 dark:text-white focus:border-[#FEF08A] focus:outline-none text-xs"
                    />
                  </div>
                </div>

                {/* 4. Link Target (Drama or External URL) */}
                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-[#121216] border border-slate-200/90 dark:border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                      Tap Destination Action
                    </span>
                    <div className="flex items-center space-x-3.5 text-xs font-bold">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="linkType"
                          value="DRAMA"
                          checked={formLinkType === 'DRAMA'}
                          onChange={() => setFormLinkType('DRAMA')}
                          className="accent-amber-400 cursor-pointer"
                        />
                        <span>Drama Series</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="linkType"
                          value="EXTERNAL_URL"
                          checked={formLinkType === 'EXTERNAL_URL'}
                          onChange={() => setFormLinkType('EXTERNAL_URL')}
                          className="accent-amber-400 cursor-pointer"
                        />
                        <span>External URL</span>
                      </label>
                    </div>
                  </div>

                  {formLinkType === 'DRAMA' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Select Drama Series
                        </label>
                        <select
                          value={formDramaId}
                          onChange={(e) => handleSelectDrama(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#18181E] border border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white cursor-pointer text-xs"
                        >
                          <option value="">-- Choose Series --</option>
                          {dramas.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Target Ep #
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={formEpisodeNumber}
                          onChange={(e) => setFormEpisodeNumber(Math.max(1, Number(e.target.value)))}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#18181E] border border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                        Target Website Link
                      </label>
                      <input
                        type="url"
                        value={formExternalUrl}
                        onChange={(e) => setFormExternalUrl(e.target.value)}
                        placeholder="https://example.com/promo-campaign"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#18181E] border border-slate-200 dark:border-white/10 font-mono text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* 5. Optional Video Teaser / Trailer */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider">
                      Teaser Video / Trailer (Optional MP4)
                    </label>
                    <button
                      type="button"
                      onClick={() => trailerInputRef.current?.click()}
                      disabled={isUploadingTrailer}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center space-x-1"
                    >
                      <FolderUp className="w-3.5 h-3.5" />
                      <span>{isUploadingTrailer ? 'Uploading MP4...' : 'Upload MP4'}</span>
                    </button>
                    <input
                      ref={trailerInputRef}
                      type="file"
                      accept="video/mp4,video/*"
                      onChange={handleTrailerFileUpload}
                      className="hidden"
                    />
                  </div>

                  <input
                    type="url"
                    value={formTrailerUrl}
                    onChange={(e) => setFormTrailerUrl(e.target.value)}
                    placeholder="https://.../teaser_trailer.mp4"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 font-mono text-xs bg-white dark:bg-[#121216] text-slate-900 dark:text-white"
                  />
                </div>

                {/* 6. Active / Inactive Switch */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-white/5">
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                      Active Carousel Visibility
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      When active, banner appears on the live mobile OTT hero carousel
                    </span>
                  </div>

                  <ToggleSwitch
                    checked={formIsActive}
                    onChange={setFormIsActive}
                    ariaLabel="Active banner status"
                  />
                </div>

                {/* Modal Footer Buttons */}
                <div className="pt-3 border-t border-slate-200/90 dark:border-white/10 flex items-center justify-end space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#24242E] hover:bg-slate-200 dark:hover:bg-[#2A2A35] text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer text-xs active:scale-95"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    disabled={isSubmitting || isUploadingImage || isUploadingTrailer}
                    className="px-5 py-2 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] active:bg-[#CA8A04] text-slate-950 font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer leading-none disabled:opacity-50 text-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Banner...</span>
                      </>
                    ) : (
                      <span>{editingBanner ? 'Save Changes' : 'Publish Banner'}</span>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================
          VIDEO TRAILER PREVIEW MODAL (ANIMATED)
         ======================================================== */}
      {previewVideo && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-950 rounded-3xl border border-white/20 w-full max-w-3xl overflow-hidden shadow-2xl relative"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Play className="w-4 h-4 text-amber-400 fill-current" />
                  <span className="font-extrabold text-white text-sm">
                    Trailer Preview: {previewVideo?.title}
                  </span>
                </div>
                <button
                  onClick={() => setPreviewVideo(null)}
                  className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="aspect-[16/9] bg-black">
                <video
                  src={previewVideo?.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================
          FLOATING ANIMATED TOAST NOTIFICATION
         ======================================================== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.92 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed bottom-6 right-6 z-[999999] flex items-center space-x-2.5 px-4 py-2.5 rounded-2xl bg-[#1E1E26] text-white border border-white/15 shadow-2xl backdrop-blur-md text-xs font-bold"
          >
            <div className="w-5 h-5 rounded-full bg-[#FEF08A] text-slate-950 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
