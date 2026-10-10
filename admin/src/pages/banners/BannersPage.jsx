import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Trash2,
  Pencil,
  Eye,
  Link2,
  Play,
  Sparkles,
  RefreshCw,
  Loader2,
  Tv,
  CheckCircle2,
  FolderUp,
  AlertCircle,
  X,
  ExternalLink,
  Clapperboard,
  Layers,
  ArrowRight,
  Flame,
  Star
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
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

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
  const [imageSourceMode, setImageSourceMode] = useState('upload'); // 'upload' | 'url' | 'drama'
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingTrailer, setIsUploadingTrailer] = useState(false);
  const fileInputRef = useRef(null);
  const trailerInputRef = useRef(null);

  // Video trailer preview modal
  const [previewVideo, setPreviewVideo] = useState(null);



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

    // If default drama exists, auto-fill from it
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
      } else {
        await bannerService.createBanner(payload);
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
    try {
      await bannerService.toggleActive(id);
      setBanners((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
      );
    } catch (err) {
      console.error('Toggle active failed:', err);
    }
  };

  // Delete Banner
  const handleDeleteBanner = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this banner?')) return;
    try {
      await bannerService.deleteBanner(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      setStats((prev) => ({
        ...prev,
        totalBanners: Math.max(0, prev.totalBanners - 1)
      }));
    } catch (err) {
      console.error('Delete banner failed:', err);
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

    // Update display orders sequentially
    const updatedWithOrder = newBanners.map((b, idx) => ({
      ...b,
      displayOrder: idx + 1
    }));

    setBanners(updatedWithOrder);

    try {
      const items = updatedWithOrder.map((b) => ({ id: b.id, displayOrder: b.displayOrder }));
      await bannerService.reorderBanners(items);
    } catch (err) {
      console.error('Reorder failed:', err);
      fetchData(); // rollback
    }
  };

  return (
    <div className="space-y-3 font-urbanist selection:bg-[#FEF08A] selection:text-black pb-8">

      {/* 4 Clean Minimal KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <KpiStatCard
          icon={ImageIcon}
          title="Total Banners"
          value={stats.totalBanners || banners.length}
          footerLeft="Showcase Registry"
          footerRight="Widescreen"
        />

        <KpiStatCard
          icon={Sparkles}
          title="Active in Carousel"
          value={stats.activeBanners}
          footerLeft="Mobile Home"
          footerRight="Live"
          footerRightColor="text-emerald-600 dark:text-emerald-400 font-bold"
        />

        <KpiStatCard
          icon={Clapperboard}
          title="Linked to Drama"
          value={stats.dramaLinkedBanners}
          footerLeft="Direct Playback"
          footerRight={`${stats.dramaLinkedBanners} Series`}
        />

        <KpiStatCard
          icon={Link2}
          title="External / Promo"
          value={stats.externalBanners}
          footerLeft="Web Redirect"
          footerRight={`${stats.externalBanners} Links`}
        />
      </div>

      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
              Banners & Hero Carousel
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF08A]/40 dark:bg-amber-400/10 text-amber-900 dark:text-amber-300 border border-amber-300/50">
              {banners.length} Banners
            </span>
          </div>
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
            Manage 16:9 widescreen showcase slides, badges, trailer previews, and episode links.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={fetchData}
            disabled={isLoading}
            className="p-1.5 bg-white dark:bg-[#121216] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-white/10 rounded-xl transition-all cursor-pointer active:scale-95 shrink-0"
            title="Refresh Banners"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="py-1.5 px-3.5 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Upload Banner</span>
          </button>
        </div>
      </div>

      {/* Unified Filter, Search & View Toolbar */}
      <div className="bg-white dark:bg-[#121216] rounded-xl p-2 sm:px-3 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        
        {/* Left: Status Filter Tabs & Link Type */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Status Segmented Control */}
          <div className="flex items-center space-x-1 p-0.5 bg-slate-100 dark:bg-[#18181E] rounded-lg border border-slate-200/60 dark:border-white/10 shrink-0">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-1 rounded-md font-bold text-xs transition-all cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-white dark:bg-[#24242E] text-slate-950 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({banners.length})
            </button>
            <button
              onClick={() => setFilterStatus('ACTIVE')}
              className={`px-2.5 py-1 rounded-md font-bold text-xs transition-all cursor-pointer ${
                filterStatus === 'ACTIVE'
                  ? 'bg-white dark:bg-[#24242E] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Active ({stats.activeBanners})
            </button>
            <button
              onClick={() => setFilterStatus('INACTIVE')}
              className={`px-2.5 py-1 rounded-md font-bold text-xs transition-all cursor-pointer ${
                filterStatus === 'INACTIVE'
                  ? 'bg-white dark:bg-[#24242E] text-amber-600 dark:text-amber-400 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Hidden ({Math.max(0, banners.length - stats.activeBanners)})
            </button>
          </div>

          {/* Link Type Select */}
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-[#18181E] px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-xs">
            <Link2 className="w-3 h-3 text-slate-400" />
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
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('ALL');
                setFilterLinkType('ALL');
              }}
              className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold px-1.5 py-0.5 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Right: Search Box + View Switcher + Counter */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search banners..."
              className="w-full pl-8 pr-7 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg focus:border-[#FEF08A] focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View Mode Switcher: Cards vs Table */}
          <div className="bg-slate-100 dark:bg-[#18181E] p-0.5 rounded-lg flex items-center border border-slate-200/60 dark:border-white/10 shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-[#24242E] text-slate-950 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#24242E] text-slate-950 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Table
            </button>
          </div>

          {/* Showing Count */}
          <span className="text-[11px] text-slate-400 font-medium shrink-0 hidden lg:inline">
            <strong className="text-slate-900 dark:text-white font-bold">{filteredBanners.length}</strong> banners
          </span>
        </div>

      </div>

      {/* Main Banners Content */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#121216] rounded-xl border border-slate-200/80 dark:border-white/10 shadow-nodus overflow-hidden">
          <PageLoader text="Loading banners..." minHeight="min-h-[280px]" />
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="bg-white dark:bg-[#121216] rounded-xl p-10 text-center border border-slate-200/80 dark:border-white/10 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 text-slate-950 dark:text-amber-300 flex items-center justify-center mx-auto mb-2.5">
            <ImageIcon className="w-5 h-5 stroke-[2]" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white">
            {searchTerm || filterStatus !== 'ALL' || filterLinkType !== 'ALL' ? 'No matching banners found' : 'No hero banners uploaded yet'}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-3">
            {searchTerm || filterStatus !== 'ALL' || filterLinkType !== 'ALL'
              ? 'Try adjusting your search query or status filter.'
              : 'Upload 16:9 widescreen banners to feature top drama series, new releases, and promotional offers on the mobile app home screen.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Upload First Banner</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (

        /* CARDS VIEW: Clean 16:9 Widescreen Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredBanners.map((banner, index) => (
            <div
              key={banner.id}
              className="bg-white dark:bg-[#121216] rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs overflow-hidden flex flex-col group transition-all hover:border-slate-300 dark:hover:border-white/20"
            >
              {/* 16:9 Banner Image Container */}
              <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden">
                <img
                  src={banner.bannerUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />

                {/* Priority Shifter & Order Badge Top-Left */}
                <div className="absolute top-2 left-2 z-10 flex items-center space-x-1">
                  <span className="inline-flex items-center text-[9.5px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs bg-black/75 backdrop-blur-xs text-white border border-white/20">
                    #{banner.displayOrder || index + 1}
                  </span>
                  <div className="flex items-center bg-black/75 backdrop-blur-xs rounded-md p-0.5 border border-white/20">
                    <button
                      onClick={() => handleMoveOrder(banner.id, 'up')}
                      disabled={index === 0}
                      title="Move Priority Up"
                      className="p-0.5 text-white/70 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronUp className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => handleMoveOrder(banner.id, 'down')}
                      disabled={index === filteredBanners.length - 1}
                      title="Move Priority Down"
                      className="p-0.5 text-white/70 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* Theme Badge Tag & Status Pill Top-Right */}
                <div className="absolute top-2 right-2 z-10 flex items-center space-x-1">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#FEF08A]/90 backdrop-blur-xs text-slate-950 shadow-2xs border border-amber-300/60">
                    {banner.badge || 'FEATURED'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(banner.id)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold backdrop-blur-xs shadow-2xs transition-all cursor-pointer ${
                      banner.isActive
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                        : 'bg-black/75 text-slate-300 border border-white/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        banner.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    {banner.isActive ? 'Live' : 'Hidden'}
                  </button>
                </div>

                {/* Trailer Play Trigger Overlay */}
                {banner.trailerUrl && (
                  <button
                    type="button"
                    onClick={() => setPreviewVideo({ title: banner.title, url: banner.trailerUrl })}
                    className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Preview Trailer Video"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </button>
                )}
              </div>

              {/* Banner Details Body */}
              <div className="p-3 flex-1 flex flex-col justify-between space-y-2 bg-white dark:bg-[#121216]">
                <div>
                  <h4 className="font-bold text-slate-950 dark:text-white text-xs sm:text-sm truncate">
                    {banner.title}
                  </h4>
                  {banner.subtitle && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 font-normal">
                      {banner.subtitle}
                    </p>
                  )}
                </div>

                {/* Target Link Info & Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                  {banner.linkType === 'DRAMA' ? (
                    <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 min-w-0 pr-2">
                      <Clapperboard className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate font-semibold text-[11px]">
                        {banner.drama ? banner.drama.title : 'Linked Drama'} (Ep {banner.episodeNumber || 1})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 min-w-0 pr-2">
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate font-mono text-[10.5px]">
                        {banner.externalUrl || 'External Link'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(banner)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                      title="Edit Banner"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete Banner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      ) : (

        /* TABLE VIEW: Compact, Minimalistic Studio Catalog Table */
        <div className="bg-white dark:bg-[#121216] rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/70 dark:bg-[#18181E] border-b border-slate-200/80 dark:border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 w-16 text-center">Order</th>
                  <th className="py-2.5 px-3 w-28">Preview</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Banner Title</th>
                  <th className="py-2.5 px-3 w-28">Badge</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Link Target</th>
                  <th className="py-2.5 px-3 w-24 text-center">Status</th>
                  <th className="py-2.5 px-3 w-20 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                {filteredBanners.map((banner, index) => (
                  <tr
                    key={banner.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    {/* Order & Priority shifter */}
                    <td className="py-2 px-3 text-center align-middle">
                      <div className="inline-flex items-center space-x-1">
                        <span className="w-5.5 h-5.5 rounded-md flex items-center justify-center font-bold text-[11px] bg-slate-100 dark:bg-[#1E1E26] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                          {banner.displayOrder || index + 1}
                        </span>
                        <div className="flex flex-col space-y-0.5">
                          <button
                            onClick={() => handleMoveOrder(banner.id, 'up')}
                            disabled={index === 0}
                            className="p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronUp className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={() => handleMoveOrder(banner.id, 'down')}
                            disabled={index === filteredBanners.length - 1}
                            className="p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronDown className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Thumbnail */}
                    <td className="py-2 px-3 align-middle">
                      <div className="relative aspect-[16/9] w-20 rounded-md overflow-hidden bg-slate-950 border border-slate-200/80 dark:border-white/10 shadow-2xs group">
                        <img
                          src={banner.bannerUrl}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                        />
                        {banner.trailerUrl && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-3 h-3 text-white fill-current" />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Title & Subtitle */}
                    <td className="py-2 px-3 align-middle">
                      <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-[13px]">
                        {banner.title}
                      </div>
                      {banner.subtitle && (
                        <div className="text-[10.5px] text-slate-400 truncate max-w-xs font-normal mt-0.5">
                          {banner.subtitle}
                        </div>
                      )}
                    </td>

                    {/* Theme Badge */}
                    <td className="py-2 px-3 align-middle">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#FEF08A]/40 dark:bg-[#FEF08A]/15 text-amber-950 dark:text-amber-300 border border-amber-300/50 dark:border-amber-400/25 inline-block">
                        {banner.badge || 'FEATURED'}
                      </span>
                    </td>

                    {/* Link Target */}
                    <td className="py-2 px-3 align-middle">
                      {banner.linkType === 'DRAMA' ? (
                        <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                          <Clapperboard className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate font-semibold text-xs">
                            {banner.drama ? banner.drama.title : 'Linked Drama'} <span className="text-slate-400 font-normal text-[11px]">(Ep {banner.episodeNumber || 1})</span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 truncate">
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate font-mono text-[10.5px]">
                            {banner.externalUrl}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Status Pill Toggle */}
                    <td className="py-2 px-3 align-middle text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(banner.id)}
                        title="Click to toggle status"
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95 ${
                          banner.isActive
                            ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                            : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            banner.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        {banner.isActive ? 'Active' : 'Hidden'}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="py-2 px-3 align-middle text-right">
                      <div className="inline-flex items-center space-x-0.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(banner)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                          title="Edit Banner"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete Banner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          UPLOAD / CREATE / EDIT BANNER MODAL
         ======================================================== */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-[#18181E] rounded-2xl border border-slate-200 dark:border-white/10 w-full max-w-xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-[#121216]">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                  <ImageIcon className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 dark:text-white text-xs sm:text-sm">
                    {editingBanner ? 'Edit Hero Banner' : 'Upload New Hero Banner'}
                  </h3>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Configure 16:9 banner artwork, badge, and playback destination
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitModal} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs flex-1">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 flex items-center space-x-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Banner Image Source Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-[10.5px] uppercase tracking-wider">
                    Banner Artwork (16:9 Landscape) *
                  </label>
                  <div className="flex items-center bg-slate-100 dark:bg-[#121216] p-0.5 rounded-lg border border-slate-200 dark:border-white/10 text-[10.5px] font-bold">
                    <button
                      type="button"
                      onClick={() => setImageSourceMode('upload')}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
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
                        className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
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
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        imageSourceMode === 'url'
                          ? 'bg-[#FEF08A] text-slate-950 font-black shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {/* Mode 1: File Upload */}
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
                      className="border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-[#FEF08A] dark:hover:border-[#FEF08A] rounded-xl p-3.5 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-[#121216]/50"
                    >
                      {isUploadingImage ? (
                        <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
                          <Loader2 className="w-5 h-5 animate-spin text-[#FEF08A]" />
                          <span className="font-bold text-slate-600 dark:text-slate-400 text-xs">Uploading banner image...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <FolderUp className="w-5 h-5 text-slate-400" />
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                            Click to browse or drop 16:9 banner image
                          </p>
                          <p className="text-[10px] text-slate-400">
                            PNG, JPG, WEBP recommended (1920x1080 or 1280x720)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Mode 2: From Series */}
                {imageSourceMode === 'drama' && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#121216] border border-slate-200 dark:border-white/10 space-y-1.5">
                    <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400">
                      Select Drama to pull banner from:
                    </span>
                    <select
                      value={formDramaId}
                      onChange={(e) => handleSelectDrama(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#18181E] border border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white cursor-pointer text-xs"
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
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 font-mono text-xs bg-white dark:bg-[#121216] text-slate-900 dark:text-white focus:border-[#FEF08A] focus:outline-none"
                  />
                )}

                {/* Live Preview Box */}
                {formBannerUrl && (
                  <div className="relative aspect-[21/9] rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-white/10 mt-1.5 shadow-2xs group">
                    <img
                      src={formBannerUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#FEF08A] text-slate-950 shadow-2xs">
                      {formBadge === 'CUSTOM' ? formCustomBadge || 'BADGE' : formBadge}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                      <span className="font-bold text-white text-xs truncate">
                        {formTitle || 'Banner Title'}
                      </span>
                      {formSubtitle && (
                        <span className="text-[10px] text-slate-300 truncate">
                          {formSubtitle}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[10.5px] uppercase tracking-wider">
                    Banner Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Forbidden Romance"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold bg-white dark:bg-[#121216] text-slate-900 dark:text-white focus:border-[#FEF08A] focus:outline-none transition-all text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[10.5px] uppercase tracking-wider">
                    Subtitle / Tagline
                  </label>
                  <textarea
                    rows={2}
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    placeholder="Brief engaging storyline description shown on mobile banner..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 font-medium bg-white dark:bg-[#121216] text-slate-900 dark:text-white focus:border-[#FEF08A] focus:outline-none transition-all resize-none text-xs"
                  />
                </div>
              </div>

              {/* 3. Badge & Priority Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[10.5px] uppercase tracking-wider">
                    Promotional Badge
                  </label>
                  <div className="flex items-center space-x-1.5">
                    <select
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold bg-white dark:bg-[#121216] text-slate-900 dark:text-white focus:border-[#FEF08A] focus:outline-none cursor-pointer text-xs"
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
                        className="w-32 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold uppercase bg-white dark:bg-[#121216] text-slate-900 dark:text-white focus:border-[#FEF08A] focus:outline-none text-xs"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[10.5px] uppercase tracking-wider">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(Math.max(1, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold bg-white dark:bg-[#121216] text-slate-900 dark:text-white focus:border-[#FEF08A] focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* 4. Link Target (Drama or External URL) */}
              <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-[#121216] border border-slate-200/80 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    Click Action & Destination
                  </span>
                  <div className="flex items-center space-x-3 text-xs font-bold">
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                        Select Series
                      </label>
                      <select
                        value={formDramaId}
                        onChange={(e) => handleSelectDrama(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#18181E] border border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white cursor-pointer text-xs"
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
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#18181E] border border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                      Target URL
                    </label>
                    <input
                      type="url"
                      value={formExternalUrl}
                      onChange={(e) => setFormExternalUrl(e.target.value)}
                      placeholder="https://example.com/promo"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#18181E] border border-slate-200 dark:border-white/10 font-mono text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                )}
              </div>

              {/* 5. Optional Video Teaser / Trailer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-[10.5px] uppercase tracking-wider">
                    Teaser Video / Trailer (Optional MP4)
                  </label>
                  <button
                    type="button"
                    onClick={() => trailerInputRef.current?.click()}
                    disabled={isUploadingTrailer}
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <FolderUp className="w-3 h-3" />
                    <span>Upload MP4</span>
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
                  placeholder="https://.../teaser.mp4"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 font-mono text-xs bg-white dark:bg-[#121216] text-slate-900 dark:text-white"
                />
              </div>

              {/* 6. Active / Inactive Switch */}
              <div className="pt-1.5 flex items-center justify-between border-t border-slate-100 dark:border-white/5">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-xs block">
                    Banner Visibility Status
                  </span>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    When active, banner appears on mobile OTT app hero carousel
                  </span>
                </div>

                <ToggleSwitch
                  checked={formIsActive}
                  onChange={setFormIsActive}
                  ariaLabel="Active banner status"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#24242E] hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage || isUploadingTrailer}
                  className="px-4 py-1.5 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] active:bg-[#CA8A04] text-slate-950 font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer leading-none disabled:opacity-50 text-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Banner...</span>
                    </>
                  ) : (
                    <span>{editingBanner ? 'Save Changes' : 'Publish Banner'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
    )}

      {/* ========================================================
          VIDEO TRAILER PREVIEW MODAL
         ======================================================== */}
      {previewVideo && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm">
            <div className="bg-slate-950 rounded-2xl border border-white/20 w-full max-w-3xl overflow-hidden shadow-2xl relative">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <span className="font-extrabold text-white text-sm">
                  Preview: {previewVideo?.title}
                </span>
                <button
                  onClick={() => setPreviewVideo(null)}
                  className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
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
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
