import React, { useState, useEffect, useMemo, useRef } from 'react';
import { bannerService } from '../../services/bannerService';
import { dramaService } from '../../services/dramaService';
import { uploadService } from '../../services/uploadService';
import Badge from '../../components/common/Badge';
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

  // Active carousel simulator slide index
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);

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
    <div className="space-y-6 font-urbanist selection:bg-[#FEF08A] selection:text-black pb-12">

      {/* 2. Mobile App Hero Carousel Simulator Card (Live Preview) */}
      {banners.filter((b) => b.isActive).length > 0 && (
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-nodus">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-xs">
                <Tv className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">
                  Mobile App Hero Carousel Preview
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Live interactive preview of how the top banner carousel displays on mobile phone screens
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Slide {activeCarouselIndex + 1} of {banners.filter((b) => b.isActive).length}
              </span>
              <div className="flex items-center space-x-1">
                {banners
                  .filter((b) => b.isActive)
                  .map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveCarouselIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        activeCarouselIndex === idx
                          ? 'w-6 bg-[#FEF08A]'
                          : 'w-2 bg-slate-300 dark:bg-white/20 hover:bg-slate-400'
                      }`}
                      title={`Go to slide ${idx + 1}`}
                    />
                  ))}
              </div>
            </div>
          </div>

          {/* Active Carousel Slide Card */}
          {(() => {
            const activeList = banners.filter((b) => b.isActive);
            const current = activeList[activeCarouselIndex] || activeList[0];
            if (!current) return null;

            return (
              <div className="relative rounded-2xl overflow-hidden aspect-[21/9] sm:aspect-[24/9] md:aspect-[28/9] bg-slate-950 border border-slate-200/60 dark:border-white/10 group shadow-md">
                <img
                  src={current.bannerUrl}
                  alt={current.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Dark Gradient Overlay for Cinematic Depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-4 sm:p-6 md:p-8">
                  <div className="max-w-2xl space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FEF08A] text-slate-950 shadow-xs">
                        {current.badge || 'FEATURED'}
                      </span>
                      {current.linkType === 'DRAMA' && current.drama && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-xs text-white">
                          Series • Ep {current.episodeNumber || 1}
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-md">
                      {current.title}
                    </h2>

                    {current.subtitle && (
                      <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 max-w-xl font-medium drop-shadow-sm">
                        {current.subtitle}
                      </p>
                    )}

                    <div className="flex items-center space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (current.trailerUrl) {
                            setPreviewVideo({ title: current.title, url: current.trailerUrl });
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{current.trailerUrl ? 'Watch Teaser' : 'Watch Now'}</span>
                      </button>

                      {current.trailerUrl && (
                        <span className="text-[11px] text-emerald-400 font-bold flex items-center space-x-1 bg-black/60 px-2.5 py-1.5 rounded-xl border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Video Teaser Attached</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Next / Prev slide overlay controls */}
                {activeList.length > 1 && (
                  <div className="absolute right-4 bottom-4 flex items-center space-x-1.5 z-10">
                    <button
                      onClick={() =>
                        setActiveCarouselIndex((prev) =>
                          prev === 0 ? activeList.length - 1 : prev - 1
                        )
                      }
                      className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-xs cursor-pointer transition-all"
                      title="Previous Slide"
                    >
                      <ChevronUp className="w-4 h-4 -rotate-90" />
                    </button>
                    <button
                      onClick={() =>
                        setActiveCarouselIndex((prev) =>
                          prev === activeList.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-xs cursor-pointer transition-all"
                      title="Next Slide"
                    >
                      <ChevronDown className="w-4 h-4 -rotate-90" />
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* 3. Control & Filter Bar */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-nodus space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search banners by title, badge, drama..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#FEF08A] focus:outline-none transition-all font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons: View Switcher + Upload New Banner */}
          <div className="flex items-center space-x-2.5 shrink-0 self-end md:self-auto">
            {/* View Switcher: Cards vs Table */}
            <div className="bg-slate-100 dark:bg-[#161B16] p-1 rounded-xl flex items-center border border-slate-200/70 dark:border-white/10">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-[#FEF08A] text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Cards View
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#FEF08A] text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Table View
              </button>
            </div>

            {/* Reload Button */}
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#161B16] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/70 dark:border-white/10 transition-all cursor-pointer"
              title="Refresh Banners"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Upload / Create Banner CTA */}
            <button
              onClick={handleOpenCreate}
              className="px-5 py-2 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center space-x-2 shadow-xs hover:shadow transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Upload Banner</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Dropdowns & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Status Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-[#161B16] px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-white/10 text-xs">
              <span className="text-slate-400 font-medium">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL" className="dark:bg-[#1C221C]">All Statuses</option>
                <option value="ACTIVE" className="dark:bg-[#1C221C]">Active (In Carousel)</option>
                <option value="INACTIVE" className="dark:bg-[#1C221C]">Inactive (Hidden)</option>
              </select>
            </div>

            {/* Link Type Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-[#161B16] px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-white/10 text-xs">
              <Link2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterLinkType}
                onChange={(e) => setFilterLinkType(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL" className="dark:bg-[#1C221C]">All Link Targets</option>
                <option value="DRAMA" className="dark:bg-[#1C221C]">Drama Series</option>
                <option value="EXTERNAL_URL" className="dark:bg-[#1C221C]">External URL</option>
              </select>
            </div>

            {(searchTerm || filterStatus !== 'ALL' || filterLinkType !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('ALL');
                  setFilterLinkType('ALL');
                }}
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-bold px-2 py-1 cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            Showing <span className="font-extrabold text-slate-950 dark:text-white">{filteredBanners.length}</span> of {banners.length} banners
          </div>
        </div>
      </div>

      {/* 4. Main Banners Content */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FEF08A]" />
          <p className="text-xs font-bold">Loading hero banners catalog...</p>
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-12 text-center border border-slate-200/80 dark:border-white/10 shadow-nodus">
          <div className="w-14 h-14 rounded-2xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 mx-auto mb-3 shadow-xs">
            <ImageIcon className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
            {searchTerm || filterStatus !== 'ALL' || filterLinkType !== 'ALL' ? 'No matching banners found' : 'No hero banners uploaded yet'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || filterStatus !== 'ALL' || filterLinkType !== 'ALL'
              ? 'Try adjusting your search query or status filter.'
              : 'Upload 16:9 widescreen banners to feature top drama series, new releases, and promotional offers on the mobile app home screen.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-5 px-5 py-2.5 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Upload First Banner</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (

        /* ========================================================
           CARDS VIEW: 16:9 WIDESCREEN HERO BANNER TILES
           ======================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanners.map((banner, index) => (
            <div
              key={banner.id}
              className="bg-white dark:bg-[#121612] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-nodus overflow-hidden flex flex-col group transition-all duration-300 hover:border-amber-300/40 dark:hover:border-amber-400/20"
            >
              {/* 16:9 Banner Image Container */}
              <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden">
                <img
                  src={banner.bannerUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />

                {/* Priority Shifter & Order Badge Top-Left */}
                <div className="absolute top-2.5 left-2.5 z-10 flex items-center space-x-1">
                  <span className="inline-flex items-center text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs bg-black/80 backdrop-blur-xs text-white border border-white/20">
                    #{banner.displayOrder || index + 1}
                  </span>
                  <div className="flex items-center bg-black/80 backdrop-blur-xs rounded-full p-0.5 border border-white/20">
                    <button
                      onClick={() => handleMoveOrder(banner.id, 'up')}
                      disabled={index === 0}
                      title="Move Priority Up"
                      className="p-0.5 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveOrder(banner.id, 'down')}
                      disabled={index === filteredBanners.length - 1}
                      title="Move Priority Down"
                      className="p-0.5 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Badge Tag & Status Pill Top-Right */}
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center space-x-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FEF08A] text-slate-950 shadow-xs border border-amber-300/60">
                    {banner.badge || 'FEATURED'}
                  </span>
                  <Badge
                    variant={banner.isActive ? 'active' : 'inactive'}
                    size="xs"
                    onClick={() => handleToggleActive(banner.id)}
                    title="Click to toggle Active / Inactive"
                  >
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* Trailer Play Trigger Overlay */}
                {banner.trailerUrl && (
                  <button
                    type="button"
                    onClick={() => setPreviewVideo({ title: banner.title, url: banner.trailerUrl })}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Preview Trailer Video"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </button>
                )}
              </div>

              {/* Banner Details Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white dark:bg-[#121612]">
                <div>
                  <h4 className="font-bold text-slate-950 dark:text-white text-sm truncate">
                    {banner.title}
                  </h4>
                  {banner.subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 font-medium">
                      {banner.subtitle}
                    </p>
                  )}
                </div>

                {/* Target Link Info */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2 text-xs">
                  {banner.linkType === 'DRAMA' ? (
                    <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                      <Clapperboard className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate font-semibold">
                        {banner.drama ? banner.drama.title : 'Linked Drama'} (Ep {banner.episodeNumber || 1})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 truncate">
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate font-mono text-[11px]">
                        {banner.externalUrl || 'External Link'}
                      </span>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(banner.id)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        banner.isActive
                          ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'text-slate-500 bg-slate-100 dark:bg-[#1A201A] dark:text-slate-400'
                      }`}
                    >
                      {banner.isActive ? '● Live in Carousel' : '○ Hidden'}
                    </button>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(banner)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                        title="Edit Banner"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete Banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      ) : (

        /* ========================================================
           TABLE VIEW: CLEAN & MINIMAL STUDIO CATALOG TABLE
           ======================================================== */
        <div className="bg-white dark:bg-[#121612] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-nodus overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 dark:bg-[#161B16] border-b border-slate-200/80 dark:border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-20 text-center">Order</th>
                  <th className="py-3 px-4 w-32">Preview</th>
                  <th className="py-3 px-4 min-w-[200px]">Banner Title</th>
                  <th className="py-3 px-4 w-28">Badge</th>
                  <th className="py-3 px-4 min-w-[180px]">Link Target</th>
                  <th className="py-3 px-4 w-24 text-center">Status</th>
                  <th className="py-3 px-4 w-28 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                {filteredBanners.map((banner, index) => (
                  <tr
                    key={banner.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    {/* Order & Priority shifter */}
                    <td className="py-2.5 px-4 text-center align-middle">
                      <div className="inline-flex items-center space-x-1.5">
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs bg-slate-100 dark:bg-[#1A201A] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                          {banner.displayOrder || index + 1}
                        </span>
                        <div className="flex flex-col space-y-0.5">
                          <button
                            onClick={() => handleMoveOrder(banner.id, 'up')}
                            disabled={index === 0}
                            className="p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoveOrder(banner.id, 'down')}
                            disabled={index === filteredBanners.length - 1}
                            className="p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Thumbnail */}
                    <td className="py-2.5 px-4 align-middle">
                      <div className="relative aspect-[16/9] w-24 rounded-lg overflow-hidden bg-slate-950 border border-slate-200/80 dark:border-white/10 shadow-2xs">
                        <img
                          src={banner.bannerUrl}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>

                    {/* Title & Subtitle */}
                    <td className="py-2.5 px-4 align-middle">
                      <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {banner.title}
                      </div>
                      {banner.subtitle && (
                        <div className="text-[11px] text-slate-400 truncate max-w-sm">
                          {banner.subtitle}
                        </div>
                      )}
                    </td>

                    {/* Badge */}
                    <td className="py-2.5 px-4 align-middle">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FEF08A] text-slate-950 shadow-xs border border-amber-300/60 inline-block">
                        {banner.badge || 'FEATURED'}
                      </span>
                    </td>

                    {/* Link Target */}
                    <td className="py-2.5 px-4 align-middle">
                      {banner.linkType === 'DRAMA' ? (
                        <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                          <Clapperboard className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate font-semibold">
                            {banner.drama ? banner.drama.title : 'Linked Drama'} (Ep {banner.episodeNumber || 1})
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-blue-600 dark:text-blue-400 truncate">
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate font-mono text-[11px]">
                            {banner.externalUrl}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-4 align-middle text-center">
                      <Badge
                        variant={banner.isActive ? 'active' : 'inactive'}
                        size="xs"
                        onClick={() => handleToggleActive(banner.id)}
                      >
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>

                    {/* Action buttons */}
                    <td className="py-2.5 px-4 align-middle text-right">
                      <div className="inline-flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(banner)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Delete"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#161B16] rounded-2xl border border-slate-200 dark:border-white/10 w-full max-w-2xl overflow-hidden shadow-2xl my-8 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-[#121612]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0">
                  <ImageIcon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">
                    {editingBanner ? 'Edit Hero Banner' : 'Upload New Hero Banner'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Configure 16:9 banner artwork, badge, and playback destination
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitModal} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Banner Image Source Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
                    Banner Artwork (16:9 Landscape) *
                  </label>
                  <div className="flex items-center bg-slate-100 dark:bg-[#121612] p-0.5 rounded-lg border border-slate-200 dark:border-white/10 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setImageSourceMode('upload')}
                      className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                        imageSourceMode === 'upload'
                          ? 'bg-[#FEF08A] text-slate-950 font-black shadow-xs'
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
                        className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                          imageSourceMode === 'drama'
                            ? 'bg-[#FEF08A] text-slate-950 font-black shadow-xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        From Series
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setImageSourceMode('url')}
                      className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                        imageSourceMode === 'url'
                          ? 'bg-[#FEF08A] text-slate-950 font-black shadow-xs'
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
                      className="border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-[#FEF08A] dark:hover:border-[#FEF08A] rounded-xl p-5 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-[#121612]/50"
                    >
                      {isUploadingImage ? (
                        <div className="flex flex-col items-center justify-center space-y-2 py-2">
                          <Loader2 className="w-6 h-6 animate-spin text-[#FEF08A]" />
                          <span className="font-bold text-slate-600 dark:text-slate-400">Uploading banner image...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-1.5">
                          <FolderUp className="w-7 h-7 text-slate-400" />
                          <p className="font-bold text-slate-800 dark:text-slate-200">
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
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121612] border border-slate-200 dark:border-white/10 space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Select Drama to pull banner from:
                    </span>
                    <select
                      value={formDramaId}
                      onChange={(e) => handleSelectDrama(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#161B16] border border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white cursor-pointer"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-mono text-xs bg-white dark:bg-[#121612] text-slate-900 dark:text-white focus:border-[#FEF08A] focus:outline-none"
                  />
                )}

                {/* Live Preview Box */}
                {formBannerUrl && (
                  <div className="relative aspect-[21/9] rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-white/10 mt-2 shadow-xs group">
                    <img
                      src={formBannerUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#FEF08A] text-slate-950 shadow-xs">
                      {formBadge === 'CUSTOM' ? formCustomBadge || 'BADGE' : formBadge}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                      <span className="font-extrabold text-white text-xs truncate">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-[11px] uppercase tracking-wider">
                    Banner Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Forbidden Romance"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold bg-white dark:bg-[#121612] text-slate-900 dark:text-white focus:border-[#FEF08A] focus:outline-none transition-all shadow-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-[11px] uppercase tracking-wider">
                    Subtitle / Tagline
                  </label>
                  <textarea
                    rows={2}
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    placeholder="Brief engaging storyline description shown on mobile banner..."
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 font-medium bg-white dark:bg-[#121612] text-slate-900 dark:text-white focus:border-[#FEF08A] focus:outline-none transition-all shadow-xs resize-none"
                  />
                </div>
              </div>

              {/* 3. Badge & Priority Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-[11px] uppercase tracking-wider">
                    Promotional Badge
                  </label>
                  <div className="flex items-center space-x-2">
                    <select
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold bg-white dark:bg-[#121612] text-slate-900 dark:text-white focus:border-[#FEF08A] focus:outline-none cursor-pointer"
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
                        className="w-36 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold uppercase bg-white dark:bg-[#121612] text-slate-900 dark:text-white focus:border-[#FEF08A] focus:outline-none"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-[11px] uppercase tracking-wider">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold bg-white dark:bg-[#121612] text-slate-900 dark:text-white focus:border-[#FEF08A] focus:outline-none"
                  />
                </div>
              </div>

              {/* 4. Link Target (Drama or External URL) */}
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs">
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Select Series
                      </label>
                      <select
                        value={formDramaId}
                        onChange={(e) => handleSelectDrama(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#161B16] border border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white cursor-pointer"
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
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Target Episode #
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formEpisodeNumber}
                        onChange={(e) => setFormEpisodeNumber(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#161B16] border border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Target URL
                    </label>
                    <input
                      type="url"
                      value={formExternalUrl}
                      onChange={(e) => setFormExternalUrl(e.target.value)}
                      placeholder="https://example.com/promo"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#161B16] border border-slate-200 dark:border-white/10 font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* 5. Optional Video Teaser / Trailer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
                    Teaser Video / Trailer (Optional MP4)
                  </label>
                  <button
                    type="button"
                    onClick={() => trailerInputRef.current?.click()}
                    disabled={isUploadingTrailer}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <FolderUp className="w-3.5 h-3.5" />
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 font-mono text-xs bg-white dark:bg-[#121612] text-slate-900 dark:text-white"
                />
              </div>

              {/* 6. Active / Inactive Switch */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-white/5">
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                    Banner Visibility Status
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    When active, banner appears on the mobile OTT app home screen hero carousel
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-[#202620] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FEF08A]"></div>
                </label>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#202620] hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage || isUploadingTrailer}
                  className="px-6 py-2 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-black flex items-center space-x-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
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
      )}

      {/* ========================================================
          VIDEO TRAILER PREVIEW MODAL
         ======================================================== */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-950 rounded-2xl border border-white/20 w-full max-w-3xl overflow-hidden shadow-2xl relative">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <span className="font-extrabold text-white text-sm">
                Preview: {previewVideo.title}
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
                src={previewVideo.url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
