import React, { useState, useEffect, useMemo } from 'react';
import { genreService } from '../../services/genreService';
import KpiStatCard from '../../components/common/KpiStatCard';
import PageLoader from '../../components/common/PageLoader';
import ModalPortal from '../../components/common/ModalPortal';
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
  Loader2,
  RefreshCw,
  AlertCircle,
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

export default function GenresPage({ onNavigate }) {
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
  const [color, setColor] = useState('#FEF08A');
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
    setColor('#FEF08A');
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
    setColor(genre.color || '#FEF08A');
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
    <div className="space-y-3 font-urbanist pb-10">

      {/* Floating Action Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-center space-x-2.5 px-3.5 py-2 rounded-xl shadow-xl border text-xs font-bold ${
              toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-800 backdrop-blur-md'
                : toast.type === 'info'
                ? 'bg-slate-900/95 text-white border-white/20 backdrop-blur-md'
                : 'bg-[#1E1E26]/95 text-emerald-300 border-emerald-500/40 backdrop-blur-md'
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
              className="text-white/60 hover:text-white ml-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Live Error Banner if initial fetch failed */}
      {error && !isLoading && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-rose-300">Live Data Sync Notice</p>
              <p className="text-[11px] text-rose-400/80">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchGenres()}
            className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 4 Clean Minimal KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <KpiStatCard
          icon={Tags}
          title="Total Genres"
          value={stats.totalGenres}
          footerLeft="Database Registry"
          footerRight="Dynamic"
        />

        <KpiStatCard
          icon={Sparkles}
          title="Active in App"
          value={stats.activeGenres}
          footerLeft="Browse Navigation"
          footerRight="Live"
          footerRightColor="text-emerald-600 dark:text-emerald-400 font-bold"
        />

        <KpiStatCard
          icon={EyeOff}
          title="Hidden / Draft"
          value={stats.hiddenGenres}
          footerLeft="Catalog Visibility"
          footerRight={stats.hiddenGenres > 0 ? `${stats.hiddenGenres} Hidden` : 'None'}
          footerRightColor={stats.hiddenGenres > 0 ? 'text-amber-500 font-bold' : 'text-slate-400 font-medium'}
        />

        <KpiStatCard
          icon={Film}
          title="Tagged Series"
          value={stats.totalSeries}
          footerLeft="Associated Dramas"
          footerRight={`${stats.totalSeries} Series`}
          footerRightColor="text-slate-900 dark:text-white font-bold"
        />
      </div>

      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
              Genres & Categories
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF08A]/40 dark:bg-amber-400/10 text-amber-900 dark:text-amber-300 border border-amber-300/50">
              {genres.length} Categories
            </span>
          </div>
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
            Manage catalog taxonomy, display ranking, and series association.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('category_priority')}
            className="py-1.5 px-3 bg-white dark:bg-[#121216] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-white/10 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Manage Homepage Display Priority Ranks"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
            <span>Category Priority</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="py-1.5 px-3.5 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Genre</span>
          </button>
        </div>
      </div>

      {/* Unified Filter, Search & Sort Toolbar */}
      <div className="bg-white dark:bg-[#121216] rounded-xl p-2 sm:px-3 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        
        {/* Left: Filter Tabs */}
        <div className="flex items-center space-x-1 p-0.5 bg-slate-100 dark:bg-[#18181E] rounded-lg border border-slate-200/60 dark:border-white/10 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-md font-bold text-xs transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-white dark:bg-[#24242E] text-slate-950 dark:text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All ({genres.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1 rounded-md font-bold text-xs transition-all cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-white dark:bg-[#24242E] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Active ({genres.filter(g => g.isActive).length})
          </button>
          <button
            onClick={() => setStatusFilter('HIDDEN')}
            className={`px-3 py-1 rounded-md font-bold text-xs transition-all cursor-pointer ${
              statusFilter === 'HIDDEN'
                ? 'bg-white dark:bg-[#24242E] text-amber-600 dark:text-amber-400 shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Hidden ({genres.filter(g => !g.isActive).length})
          </button>
        </div>

        {/* Right: Search + Sort + Refresh */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search genres or slugs..."
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

          {/* Sort By Dropdown */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#FEF08A] cursor-pointer"
            >
              <option value="order">Display Order (Asc)</option>
              <option value="dramas">Tagged Series (High)</option>
              <option value="name">Alphabetical (A - Z)</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchGenres(true)}
            disabled={isRefreshing}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-[#18181E] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-lg transition-all cursor-pointer active:scale-95 shrink-0"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>

      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#121216] rounded-xl border border-slate-200/80 dark:border-white/10 shadow-nodus overflow-hidden">
          <PageLoader text="Loading..." minHeight="min-h-[280px]" />
        </div>
      ) : filteredGenres.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-[#121216] rounded-xl p-10 text-center border border-slate-200/80 dark:border-white/10 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 text-slate-950 dark:text-amber-300 flex items-center justify-center mx-auto mb-2.5">
            <Tags className="w-5 h-5 stroke-[2]" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1">
            No genres found
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-3">
            {searchTerm
              ? `No categories match "${searchTerm}". Try a different search term or clear the filter.`
              : 'No categories are currently available. Click "Add Genre" to create your first category.'}
          </p>
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="px-3.5 py-1.5 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
            >
              Clear Search
            </button>
          ) : (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
            >
              Add First Genre
            </button>
          )}
        </div>
      ) : (
        /* Real Dynamic Genres Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {filteredGenres.map((genre) => {
            const IconComponent = ICON_MAP[genre.icon] || Tags;

            return (
              <div
                key={genre.id}
                className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-2xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all group"
              >
                {/* Top Section: Theme Icon, Name, Slug & Status */}
                <div className="flex items-start justify-between gap-2.5 mb-2.5">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    {/* Consistent Theme Icon Badge (No Rainbow Multi-Colors) */}
                    <div className="w-8.5 h-8.5 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                      <IconComponent className="w-4 h-4 stroke-[2.2]" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-950 dark:text-white truncate">
                        {genre.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                        /{genre.slug}
                      </p>
                    </div>
                  </div>

                  {/* Clean, Compact Status Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleStatus(genre)}
                    title={genre.isActive ? 'Click to hide from catalog' : 'Click to activate in catalog'}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95 ${
                      genre.isActive
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                        : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        genre.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-500'
                      }`}
                    />
                    {genre.isActive ? 'Active' : 'Hidden'}
                  </button>
                </div>

                {/* Bottom Section: Order Tag, Catalog Series Count & Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400 dark:text-slate-400 font-medium text-[10.5px]">Catalog:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {genre.dramaCount || 0} Series
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-[#18181E] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/10">
                      #{genre.displayOrder ?? 1}
                    </span>
                  </div>

                  <div className="flex items-center space-x-0.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(genre)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenreToDelete(genre)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#24242E] rounded-2xl w-full max-w-md p-5 shadow-2xl border border-slate-200 dark:border-white/15 animate-in fade-in zoom-in-95 duration-150 font-urbanist">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                  <Tags className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-950 dark:text-white">
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
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error in Modal if any */}
            {modalError && (
              <div className="mt-2.5 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSave} className="space-y-3 pt-3 text-xs">
              
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
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white font-bold focus:border-[#FEF08A] focus:outline-none transition-colors"
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
                    className="w-full pl-6 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white font-mono text-xs focus:border-[#FEF08A] focus:outline-none"
                  />
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                        className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#FEF08A] text-slate-950 font-bold shadow-xs scale-105 ring-2 ring-amber-400/60'
                            : 'bg-slate-50 dark:bg-[#18181E] text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10'
                        }`}
                        title={iconName}
                      >
                        <Comp className="w-3.5 h-3.5 stroke-[2.2]" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Display Order & Active Toggle */}
              <div className="grid grid-cols-2 gap-3 pt-0.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Display Priority Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white font-bold focus:border-[#FEF08A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full py-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-[#18181E] border-slate-200 dark:border-white/10 text-slate-500'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    <span>{isActive ? 'Active (Live)' : 'Hidden (Draft)'}</span>
                  </button>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 text-xs"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingGenre ? 'Save Changes' : 'Create Genre'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      </ModalPortal>
    )}

      {/* Delete Confirmation Modal */}
      {genreToDelete && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#24242E] rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 dark:border-white/15 animate-in fade-in zoom-in-95 duration-150 font-urbanist text-center">
              
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto mb-2.5">
                <Trash2 className="w-5 h-5 stroke-[2]" />
              </div>

              <h3 className="font-bold text-sm text-slate-950 dark:text-white mb-1">
                Delete "{genreToDelete?.name}"?
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3.5 leading-relaxed">
                This category will be permanently removed and automatically unlinked from any linked dramas. This action cannot be undone.
              </p>

              <div className="flex items-center justify-center space-x-2 pt-1">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setGenreToDelete(null)}
                  className="px-3.5 py-1.5 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 text-xs"
                >
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Delete Permanently</span>
                </button>
              </div>

            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
