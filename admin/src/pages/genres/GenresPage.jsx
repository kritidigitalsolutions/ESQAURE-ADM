import React, { useState, useEffect, useMemo } from 'react';
import { genreService } from '../../services/genreService';
import KpiStatCard from '../../components/common/KpiStatCard';
import {
  Tags,
  Plus,
  Search,
  X,
  Heart,
  ShieldAlert,
  Briefcase,
  Flame,
  Tv,
  Compass,
  Smile,
  Zap,
  Sparkles,
  Edit3,
  Trash2,
  Check,
  Loader2,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  Film,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';

const ICON_MAP = {
  Heart,
  ShieldAlert,
  Briefcase,
  Flame,
  Tv,
  Compass,
  Smile,
  Zap,
  Sparkles,
  Tags,
  Film
};

const AVAILABLE_ICONS = [
  'Heart',
  'Zap',
  'Flame',
  'Compass',
  'Smile',
  'Sparkles',
  'Tv',
  'Film',
  'ShieldAlert',
  'Briefcase',
  'Tags'
];

const PRESET_COLORS = [
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F97316', // Orange
];

export default function GenresPage() {
  const [genres, setGenres] = useState([]);
  const [serverStats, setServerStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'HIDDEN'
  const [sortBy, setSortBy] = useState('order'); // 'order' | 'name' | 'dramas'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Delete Confirmation Modal State
  const [genreToDelete, setGenreToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [color, setColor] = useState('#F59E0B');
  const [icon, setIcon] = useState('Heart');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  // Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Helper to fetch genres dynamically from backend
  const fetchGenres = async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const data = await genreService.getAdminGenres();
      if (data && Array.isArray(data.genres)) {
        setGenres(data.genres);
        if (data.stats) {
          setServerStats(data.stats);
        }
      } else {
        setGenres([]);
      }
    } catch (err) {
      console.error('Failed to load genres:', err);
      setError(err.message || 'Unable to connect to genres service.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  // Compute live KPI metrics
  const stats = useMemo(() => {
    const totalGenres = genres.length;
    const activeGenres = genres.filter(g => g.isActive).length;
    const hiddenGenres = totalGenres - activeGenres;
    const totalSeries = genres.reduce((acc, g) => acc + (g.dramaCount || 0), 0);

    return {
      totalGenres: serverStats?.totalGenres ?? totalGenres,
      activeGenres: serverStats?.activeGenres ?? activeGenres,
      hiddenGenres: serverStats?.hiddenGenres ?? hiddenGenres,
      totalSeries: serverStats?.totalSeries ?? totalSeries
    };
  }, [genres, serverStats]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingGenre(null);
    setName('');
    setSlug('');
    setColor('#F59E0B');
    setIcon('Heart');
    setDisplayOrder(genres.length + 1);
    setIsActive(true);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (genre) => {
    setEditingGenre(genre);
    setName(genre.name);
    setSlug(genre.slug);
    setColor(genre.color || '#F59E0B');
    setIcon(genre.icon || 'Tags');
    setDisplayOrder(genre.displayOrder ?? 1);
    setIsActive(genre.isActive);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Auto-slugify when typing name (if adding or slug was derived)
  const handleNameChange = (val) => {
    setName(val);
    if (!editingGenre) {
      const autoSlug = val
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');
      setSlug(autoSlug);
    }
  };

  // Save (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError('Please enter a genre name');
      return;
    }

    setIsSaving(true);
    setModalError(null);

    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      color,
      icon,
      displayOrder: Number(displayOrder) || 1,
      isActive
    };

    try {
      if (editingGenre) {
        const updated = await genreService.updateGenre(editingGenre.id, payload);
        const updatedDoc = updated.genre;
        setGenres(prev =>
          prev.map(g => (g.id === editingGenre.id ? { ...g, ...updatedDoc } : g))
        );
        showToast(`Genre "${payload.name}" updated successfully!`, 'success');
      } else {
        const created = await genreService.createGenre(payload);
        const createdDoc = created.genre;
        setGenres(prev => [...prev, createdDoc]);
        showToast(`Genre "${payload.name}" created successfully!`, 'success');
      }
      setIsModalOpen(false);
      // Refresh background stats
      fetchGenres(true);
    } catch (err) {
      console.error('Error saving genre:', err);
      setModalError(err.message || 'Failed to save genre.');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Status directly from card
  const toggleStatus = async (genre) => {
    const originalStatus = genre.isActive;
    // Optimistic UI update
    setGenres(prev =>
      prev.map(g => (g.id === genre.id ? { ...g, isActive: !originalStatus } : g))
    );

    try {
      await genreService.toggleActive(genre.id);
      showToast(
        `"${genre.name}" is now ${!originalStatus ? 'Active in Catalog' : 'Hidden from Users'}`,
        'info'
      );
      fetchGenres(true);
    } catch (err) {
      console.error('Failed to toggle status:', err);
      // Revert optimistic update
      setGenres(prev =>
        prev.map(g => (g.id === genre.id ? { ...g, isActive: originalStatus } : g))
      );
      showToast(`Failed to update status: ${err.message}`, 'error');
    }
  };

  // Delete Genre Permanently
  const handleConfirmDelete = async () => {
    if (!genreToDelete) return;
    setIsDeleting(true);

    try {
      await genreService.deleteGenre(genreToDelete.id);
      setGenres(prev => prev.filter(g => g.id !== genreToDelete.id));
      showToast(`Genre "${genreToDelete.name}" deleted and safely unlinked.`, 'success');
      setGenreToDelete(null);
      fetchGenres(true);
    } catch (err) {
      console.error('Failed to delete genre:', err);
      showToast(`Delete failed: ${err.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered and Sorted list
  const filteredGenres = useMemo(() => {
    return genres
      .filter(g => {
        // Status filter
        if (statusFilter === 'ACTIVE' && !g.isActive) return false;
        if (statusFilter === 'HIDDEN' && g.isActive) return false;

        // Search term
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchName = g.name?.toLowerCase().includes(term);
          const matchSlug = g.slug?.toLowerCase().includes(term);
          if (!matchName && !matchSlug) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'dramas') {
          return (b.dramaCount || 0) - (a.dramaCount || 0);
        }
        // default order
        return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
      });
  }, [genres, statusFilter, searchTerm, sortBy]);

  return (
    <div className="space-y-6 font-urbanist pb-10">

      {/* Floating Action Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold ${
              toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-800 backdrop-blur-md'
                : toast.type === 'info'
                ? 'bg-slate-900/95 text-white border-white/20 backdrop-blur-md'
                : 'bg-[#1A1F1A]/95 text-emerald-300 border-emerald-500/40 backdrop-blur-md'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-white/60 hover:text-white ml-2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Live Error Banner if initial fetch failed */}
      {error && !isLoading && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-rose-300">Live Data Sync Notice</p>
              <p className="text-[11px] text-rose-400/80">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchGenres()}
            className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 4 Standard KPI Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiStatCard
          icon={Tags}
          title="Total Genres"
          subtitle="Configured in Platform"
          value={stats.totalGenres}
          animateNumber={false}
          badgeVariant="neutral"
          badgeLabel="CATALOG"
          footerLeft="Database Registry"
          footerRight="Dynamic"
        />

        <KpiStatCard
          icon={Sparkles}
          title="Active in App"
          subtitle="Visible to Subscribers"
          value={stats.activeGenres}
          animateNumber={false}
          badgeVariant="success"
          badgeLabel="LIVE"
          footerLeft="App Navigation"
          footerRight="Active"
        />

        <KpiStatCard
          icon={EyeOff}
          title="Hidden / Draft"
          subtitle="Disabled from Browse"
          value={stats.hiddenGenres}
          animateNumber={false}
          badgeVariant="warning"
          badgeLabel="OFFLINE"
          footerLeft="Catalog Visibility"
          footerRight={stats.hiddenGenres > 0 ? `${stats.hiddenGenres} Inactive` : 'None'}
          footerRightColor="text-amber-500 font-bold"
        />

        <KpiStatCard
          icon={Film}
          title="Tagged Series"
          subtitle="Dramas Linked Across Genres"
          value={stats.totalSeries}
          animateNumber={false}
          badgeVariant="theme"
          badgeLabel="ASSOCIATED"
          footerLeft="Live Drama Catalog"
          footerRight="Real-Time Count"
        />
      </div>

      {/* Main Header & Search / Filter Bar */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-nodus flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
              Genres & Categories
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FEF08A]/30 text-amber-800 dark:text-amber-300 border border-amber-300/40">
              Live Dynamic API
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time catalog taxonomy, custom iconography, display ranking, and series association.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchGenres(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#161B16] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-xl transition-all cursor-pointer active:scale-95 shrink-0"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search genres or slugs..."
              className="w-full pl-8 pr-7 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl focus:border-[#FEF08A] focus:outline-none text-slate-900 dark:text-slate-100 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Add Genre Primary Action Button */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="py-2.5 px-4 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 transition-all shrink-0 active:scale-95 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Genre</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Sorting Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-[#121612] rounded-xl border border-slate-200/80 dark:border-white/10 shrink-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-white dark:bg-[#202620] text-slate-950 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All ({genres.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-white dark:bg-[#202620] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Active ({genres.filter(g => g.isActive).length})
          </button>
          <button
            onClick={() => setStatusFilter('HIDDEN')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              statusFilter === 'HIDDEN'
                ? 'bg-white dark:bg-[#202620] text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Hidden ({genres.filter(g => !g.isActive).length})
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 dark:text-slate-400 font-medium">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-[#121612] border border-slate-200 dark:border-white/10 rounded-xl font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#FEF08A] cursor-pointer"
          >
            <option value="order">Display Order (Ascending)</option>
            <option value="dramas">Tagged Series (High to Low)</option>
            <option value="name">Alphabetical (A - Z)</option>
          </select>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 animate-pulse space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/[0.06]" />
                  <div className="space-y-1.5">
                    <div className="w-20 h-4 bg-slate-200 dark:bg-white/[0.06] rounded" />
                    <div className="w-14 h-3 bg-slate-200 dark:bg-white/[0.06] rounded" />
                  </div>
                </div>
                <div className="w-16 h-6 bg-slate-200 dark:bg-white/[0.06] rounded-full" />
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex justify-between">
                <div className="w-16 h-3 bg-slate-200 dark:bg-white/[0.06] rounded" />
                <div className="w-12 h-3 bg-slate-200 dark:bg-white/[0.06] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredGenres.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-12 text-center border border-slate-200/80 dark:border-white/10 shadow-nodus">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF08A]/30 border border-amber-300/40 text-slate-950 dark:text-amber-300 flex items-center justify-center mx-auto mb-3">
            <Tags className="w-6 h-6 stroke-[2]" />
          </div>
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">
            No genres found
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            {searchTerm
              ? `No categories match "${searchTerm}". Try a different search term or clear the filter.`
              : 'No categories are currently available. Click "Add Genre" to create your first category.'}
          </p>
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
            >
              Clear Search
            </button>
          ) : (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
            >
              Add First Genre
            </button>
          )}
        </div>
      ) : (
        /* Real Dynamic Genres Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredGenres.map((genre) => {
            const IconComponent = ICON_MAP[genre.icon] || Tags;
            const itemColor = genre.color || '#F59E0B';

            return (
              <div
                key={genre.id}
                className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-nodus flex flex-col justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all group"
              >
                {/* Top Section: Icon, Name & Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Category Icon Container */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: `${itemColor}15`,
                        borderColor: `${itemColor}35`,
                        color: itemColor,
                      }}
                    >
                      <IconComponent className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-sm text-slate-950 dark:text-white truncate">
                          {genre.name}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-400 font-mono truncate">
                        /{genre.slug}
                      </p>
                    </div>
                  </div>

                  {/* Status Toggle Button with Live Pulsing Dot */}
                  <button
                    type="button"
                    onClick={() => toggleStatus(genre)}
                    title={genre.isActive ? 'Click to hide from catalog' : 'Click to activate in catalog'}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all shrink-0 cursor-pointer shadow-xs active:scale-95 ${
                      genre.isActive
                        ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-200/80 dark:bg-white/[0.08] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-white/10'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        genre.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-500'
                      }`}
                    />
                    {genre.isActive ? 'ACTIVE' : 'HIDDEN'}
                  </button>
                </div>

                {/* Bottom Section: Real Calculated Series Count & Quick Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400 dark:text-slate-400 font-medium text-[11px]">Catalog:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                      {genre.dramaCount || 0} Series
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(genre)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenreToDelete(genre)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Genre Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202620] rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-white/15 animate-in fade-in zoom-in-95 duration-150 font-urbanist">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0">
                  <Tags className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">
                    {editingGenre ? 'Edit Genre Category' : 'Add New Genre Category'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Live updates reflect directly in the OTT browsing catalog.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error in Modal if any */}
            {modalError && (
              <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSave} className="space-y-4 pt-4 text-xs">
              
              {/* Name Input */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Genre Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Mystery & Suspense"
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#161B16] text-slate-900 dark:text-white font-bold focus:border-[#FEF08A] focus:outline-none transition-colors"
                />
              </div>

              {/* Slug Input */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  URL Slug
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[11px]">
                    /
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="mystery-suspense"
                    className="w-full pl-6 pr-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#161B16] text-slate-900 dark:text-white font-mono text-xs focus:border-[#FEF08A] focus:outline-none"
                  />
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category Icon
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_ICONS.map((iconName) => {
                    const Comp = ICON_MAP[iconName] || Tags;
                    const isSelected = icon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setIcon(iconName)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#FEF08A] text-slate-950 font-bold shadow-xs scale-105 ring-2 ring-amber-400/60'
                            : 'bg-slate-50 dark:bg-[#161B16] text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10'
                        }`}
                        title={iconName}
                      >
                        <Comp className="w-4 h-4 stroke-[2.2]" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Preset Palette */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Theme Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setColor(hex)}
                      className={`w-7 h-7 rounded-lg transition-transform flex items-center justify-center cursor-pointer ${
                        color.toLowerCase() === hex.toLowerCase() ? 'scale-110 ring-2 ring-slate-950 dark:ring-white shadow-xs' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: hex }}
                    >
                      {color.toLowerCase() === hex.toLowerCase() && (
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 ml-1 bg-transparent"
                    title="Custom Color"
                  />
                  <span className="font-mono text-[11px] text-slate-400 uppercase">
                    {color}
                  </span>
                </div>
              </div>

              {/* Display Order & Active Toggle */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Display Priority Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#161B16] text-slate-900 dark:text-white font-bold focus:border-[#FEF08A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-[#161B16] border-slate-200 dark:border-white/10 text-slate-500'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    <span>{isActive ? 'Active (Live)' : 'Hidden (Draft)'}</span>
                  </button>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold rounded-xl transition-all shadow-xs flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingGenre ? 'Save Changes' : 'Create Genre'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {genreToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202620] rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 dark:border-white/15 animate-in fade-in zoom-in-95 duration-150 font-urbanist text-center">
            
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6 stroke-[2]" />
            </div>

            <h3 className="font-extrabold text-base text-slate-950 dark:text-white mb-1">
              Delete "{genreToDelete.name}"?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              This category will be permanently removed and automatically unlinked from any linked dramas. This action cannot be undone.
            </p>

            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setGenreToDelete(null)}
                className="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-xs flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Permanently</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
