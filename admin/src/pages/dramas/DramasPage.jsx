import React, { useState, useMemo, useEffect } from 'react';
import { dramaService } from '../../services/dramaService';
import AnimatedNumber from '../../components/common/AnimatedNumber';
import Badge from '../../components/common/Badge';
import KpiStatCard from '../../components/common/KpiStatCard';
import ManageContentModal from '../../components/ManageContentModal';
import {
  Search,
  X,
  Plus,
  Grid,
  List,
  Film,
  Play,
  Flame,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  Tv,
  ArrowUpRight,
  Clock,
  Calendar,
  Layers,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  Pencil,
  RefreshCw,
  Loader2
} from 'lucide-react';

export default function DramasPage({
  onOpenIngestModal,
  onNavigate,
  selectedDramaId,
  onClearSelectedDrama
}) {
  const [dramas, setDramas] = useState([]);
  const [serverStats, setServerStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [managingDrama, setManagingDrama] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE' | 'TRENDING'
  const [selectedAccess, setSelectedAccess] = useState('ALL'); // 'ALL' | 'PAID' | 'FREE'
  const [sortBy, setSortBy] = useState('priority');
  const [viewMode, setViewMode] = useState('table'); // 'grid' | 'table'

  // Load catalog dynamically from backend API
  const loadDramas = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dramaService.getAdminDramas();
      if (data && Array.isArray(data.dramas)) {
        setDramas(data.dramas);
        if (data.stats) {
          setServerStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load dramas from API:', err);
      setError(err.message || 'Failed to fetch content library.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDramas();
  }, []);

  useEffect(() => {
    if (selectedDramaId) {
      const found = dramas.find(d => d.id === selectedDramaId);
      if (found) {
        setManagingDrama(found);
      }
    }
  }, [selectedDramaId, dramas]);

  // Delete Drama via API
  const handleDeleteDrama = async (id) => {
    try {
      await dramaService.deleteDrama(id);
      loadDramas();
    } catch (err) {
      console.error('Delete drama failed:', err);
      // Fallback state update
      setDramas(prev => prev.filter(d => d.id !== id));
    }
  };

  // Move priority up / down via API
  const handleMovePriority = async (id, direction) => {
    const current = dramas.find(d => d.id === id);
    if (!current) return;
    const currentPriority = Number(current.priority) || 1;
    const targetPriority = direction === 'up' ? Math.max(1, currentPriority - 1) : currentPriority + 1;
    try {
      await dramaService.updatePriority(id, targetPriority);
      loadDramas();
    } catch (err) {
      console.error('Update priority failed:', err);
    }
  };

  // Toggle Series Active / Inactive via API
  const handleToggleActive = async (id) => {
    try {
      await dramaService.toggleActive(id);
      loadDramas();
    } catch (err) {
      console.error('Toggle active failed:', err);
    }
  };

  // Toggle Series Paid / Free via API
  const handleTogglePaid = async (id) => {
    try {
      await dramaService.togglePaid(id);
      loadDramas();
    } catch (err) {
      console.error('Toggle paid failed:', err);
    }
  };

  // Dynamically compute unique genres from real database records
  const genres = useMemo(() => {
    const set = new Set();
    dramas.forEach(d => {
      if (Array.isArray(d.genres)) {
        d.genres.forEach(g => {
          if (typeof g === 'string') set.add(g);
          else if (g && g.name) set.add(g.name);
        });
      }
    });
    return ['ALL', ...Array.from(set)];
  }, [dramas]);

  // Dynamic catalog statistics derived from live data & server stats
  const stats = useMemo(() => {
    const totalSeries = dramas.length;
    const published = dramas.filter(d => d.isActive || d.status === 'PUBLISHED').length;
    const totalEpisodes = dramas.reduce((acc, d) => acc + (d.totalEpisodes || 0), 0);
    const topDrama = dramas.reduce((prev, curr) => ((curr.viewsCount || 0) > (prev?.viewsCount || 0) ? curr : prev), dramas[0]);

    return {
      totalSeries: serverStats?.totalSeries ?? totalSeries,
      published: serverStats?.published ?? published,
      totalEpisodes: serverStats?.totalEpisodes ?? totalEpisodes,
      totalStreams: serverStats?.totalStreams ?? '18.1M',
      topDrama: serverStats?.topDrama ?? topDrama,
      watchTime: serverStats?.watchTime ?? '2.04M Hrs'
    };
  }, [dramas, serverStats]);

  // Filter & Sort
  const filteredDramas = useMemo(() => {
    return dramas
      .filter(d => {
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !term ||
          d.title.toLowerCase().includes(term) ||
          d.id.toLowerCase().includes(term) ||
          d.genres.some(g => g.toLowerCase().includes(term)) ||
          (d.plan && d.plan.toLowerCase().includes(term));

        const matchesGenre = selectedGenre === 'ALL' || d.genres.includes(selectedGenre);

        let matchesStatus = true;
        if (selectedStatus === 'ACTIVE') {
          matchesStatus = !!d.isActive;
        } else if (selectedStatus === 'INACTIVE') {
          matchesStatus = !d.isActive;
        } else if (selectedStatus === 'TRENDING') {
          matchesStatus = !!d.isTrending;
        } else if (selectedStatus === 'PUBLISHED') {
          matchesStatus = d.status === 'PUBLISHED' || !!d.isActive;
        } else if (selectedStatus === 'DRAFT') {
          matchesStatus = d.status === 'DRAFT' || !d.isActive;
        }

        let matchesAccess = true;
        if (selectedAccess === 'PAID') {
          matchesAccess = !!d.isPaid;
        } else if (selectedAccess === 'FREE') {
          matchesAccess = !d.isPaid;
        }

        return matchesSearch && matchesGenre && matchesStatus && matchesAccess;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          return (a.priority || 999) - (b.priority || 999);
        }
        if (sortBy === 'trending') {
          if (a.isTrending && !b.isTrending) return -1;
          if (!a.isTrending && b.isTrending) return 1;
          return 0;
        }
        if (sortBy === 'views') {
          const parseV = (v) => parseFloat(v.replace('M', '')) * 1000000 || 0;
          return parseV(b.views) - parseV(a.views);
        }
        if (sortBy === 'episodes') {
          return b.totalEpisodes - a.totalEpisodes;
        }
        if (sortBy === 'newest') {
          return b.id.localeCompare(a.id);
        }
        return 0;
      });
  }, [dramas, searchTerm, selectedGenre, selectedStatus, sortBy]);

  return (
    <div className="space-y-6 font-urbanist selection:bg-[#FEF08A] selection:text-black">
      
      {/* 4 Core Content Library KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Series */}
        <KpiStatCard
          icon={Film}
          title="Total Series"
          subtitle="Catalog Titles"
          value={stats.totalSeries}
          animateNumber
          footerLeft={`${stats.published} published series live`}
          footerRight={`${stats.totalSeries - stats.published} in draft`}
          footerRightColor="text-amber-600 dark:text-amber-400 font-bold"
        />

        {/* Metric 2: Total Episodes */}
        <KpiStatCard
          icon={Tv}
          title="Total Episodes"
          subtitle="Catalog Inventory"
          value={stats.totalEpisodes}
          animateNumber
          footerLeft={`Avg ${(stats.totalEpisodes / (stats.totalSeries || 1)).toFixed(0)} eps / series`}
          footerRight="100% HD Ready"
          footerRightColor="text-emerald-600 dark:text-emerald-400 font-bold"
        />

        {/* Metric 3: Total Streams */}
        <KpiStatCard
          icon={Play}
          title="Total Streams"
          subtitle="Across All Series"
          value={stats.totalStreams}
          footerLeft={`Top: ${stats.topDrama?.title || 'Dhokha'}`}
          footerRight={`${stats.topDrama?.views || '4.2M'} plays`}
          footerRightColor="text-slate-700 dark:text-slate-300 font-bold"
        />

        {/* Metric 4: Total Watch Time */}
        <KpiStatCard
          icon={Clock}
          title="Watch Time"
          subtitle="Catalog Engagement"
          value="2.04M Hrs"
          footerLeft="Avg completion 78%"
          footerRight="High Retention"
          footerRightColor="text-emerald-600 dark:text-emerald-400 font-bold"
        />
      </div>

      {/* Clean, Smart & Perfectly Aligned Toolbar */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 shadow-nodus space-y-4">
        
        {/* Row 1: Search & Status (Left) + View Switcher & Upload (Right) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left: Search Bar & Status Tabs */}
          <div className="flex items-center flex-wrap gap-2.5 flex-1 min-w-0">
            {/* Search input */}
            <div className="relative w-full sm:w-72 lg:w-80 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search series or genres..."
                className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm font-semibold bg-slate-100/80 dark:bg-[#161B16] focus:bg-white dark:focus:bg-[#1A201A] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200 dark:border-white/10 focus:border-[#FEF08A] focus:ring-1 focus:ring-[#FEF08A]/40 focus:outline-none transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded-full cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Tabs: Segmented control with Active / Inactive / Trending */}
            <div className="bg-slate-100 dark:bg-[#161B16] p-1 rounded-xl flex items-center border border-slate-200/70 dark:border-white/10 text-xs font-bold">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'ACTIVE', label: 'Active' },
                { id: 'INACTIVE', label: 'Inactive' },
                { id: 'TRENDING', label: 'Trending' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedStatus === tab.id
                      ? 'bg-[#FEF08A] text-slate-950 shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: View Switcher (Grid/Table) + Upload Button */}
          <div className="flex items-center space-x-2.5 shrink-0 self-end md:self-auto">
            {/* View Switcher: Grid vs Table */}
            <div className="bg-slate-100 dark:bg-[#161B16] p-1 rounded-xl flex items-center border border-slate-200/70 dark:border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#FEF08A] text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/[0.05]'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#FEF08A] text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/[0.05]'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Upload Button */}
            <button
              onClick={() => (onNavigate ? onNavigate('upload') : onOpenIngestModal?.())}
              className="px-6 py-2 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center space-x-2 shadow-xs hover:shadow transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Upload</span>
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Filters (Access, Genre, Sort) + Result Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
          {/* Left: Filters and Sorters */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Access & Plan Filter Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-[#161B16] px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-white/10 text-xs">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedAccess}
                onChange={(e) => setSelectedAccess(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL" className="dark:bg-[#1C221C]">All Access</option>
                <option value="PAID" className="dark:bg-[#1C221C]">Paid (With Plan)</option>
                <option value="FREE" className="dark:bg-[#1C221C]">Unpaid (Free)</option>
              </select>
            </div>

            {/* Genre Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-[#161B16] px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-white/10 text-xs">
              <span className="text-slate-400 font-medium">Genre:</span>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer text-xs"
              >
                {genres.map(g => (
                  <option key={g} value={g} className="dark:bg-[#1C221C]">
                    {g === 'ALL' ? 'All Genres' : g}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-[#161B16] px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-white/10 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="priority" className="dark:bg-[#1C221C]">Sort: Priority (Catalog Rank)</option>
                <option value="views" className="dark:bg-[#1C221C]">Sort: Most Views</option>
                <option value="episodes" className="dark:bg-[#1C221C]">Sort: Most Episodes</option>
                <option value="newest" className="dark:bg-[#1C221C]">Sort: Newest</option>
              </select>
            </div>

            {/* Reset Filters button if any filter is active */}
            {(searchTerm || selectedStatus !== 'ALL' || selectedGenre !== 'ALL' || selectedAccess !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('ALL');
                  setSelectedGenre('ALL');
                  setSelectedAccess('ALL');
                  setSortBy('priority');
                }}
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-bold px-2 py-1 cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Right: Counter */}
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            Showing <span className="font-extrabold text-slate-900 dark:text-white">{filteredDramas.length}</span> of {dramas.length} series
          </div>
        </div>

      </div>

      {/* Empty State */}
      {filteredDramas.length === 0 ? (
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-12 text-center border border-slate-200/80 dark:border-white/10 shadow-nodus">
          <div className="w-12 h-12 rounded-xl bg-amber-400/15 dark:bg-amber-400/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto mb-3">
            <Search className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
            No series found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or genre filter.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedGenre('ALL');
              setSelectedStatus('ALL');
            }}
            className="mt-4 px-4 py-2 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs rounded-xl transition-all"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (

        /* ========================================================
           GRID VIEW: ULTRA CLEAN & MINIMAL CARDS
           ======================================================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredDramas.map((drama) => (
            <div
              key={drama.id}
              className="bg-white dark:bg-[#121612] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-nodus card-subtle-hover overflow-hidden flex flex-col group transition-all duration-300"
            >
              {/* Clean Poster: Just 1 subtle status badge, uncluttered */}
              <div
                className="relative aspect-[3/4] sm:aspect-[9/13] bg-slate-950 overflow-hidden cursor-pointer"
                onClick={() => setManagingDrama(drama)}
              >
                <img
                  src={drama.poster}
                  alt={drama.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
                />

                {/* Priority Badge on Top Left */}
                <div className="absolute top-2.5 left-2.5 z-10 flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  <span
                    className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs bg-black/75 backdrop-blur-xs text-white border border-white/20"
                  >
                    Priority {drama.priority}
                  </span>
                  <div className="flex items-center bg-black/75 backdrop-blur-xs rounded-full p-0.5 border border-white/20">
                    <button
                      onClick={() => handleMovePriority(drama.id, 'up')}
                      disabled={drama.priority <= 1}
                      title="Move Priority Up"
                      className="p-0.5 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMovePriority(drama.id, 'down')}
                      disabled={drama.priority >= dramas.length}
                      title="Move Priority Down"
                      className="p-0.5 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Badges on Top Right: Status (Active / Inactive) & Access (Paid / Free) */}
                <div className="absolute top-2.5 right-2.5 z-10 flex flex-col items-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <Badge
                    variant={drama.isActive ? 'active' : 'inactive'}
                    size="xs"
                    onClick={() => handleToggleActive(drama.id)}
                    title="Click to toggle Active/Inactive"
                  >
                    {drama.isActive ? 'Active' : 'Inactive'}
                  </Badge>

                  <Badge
                    variant={
                      !drama.isPaid || (drama.plan || '').toLowerCase().includes('free')
                        ? 'no-plan'
                        : (drama.plan || '').toLowerCase().includes('annual') || (drama.plan || '').toLowerCase().includes('yearly')
                        ? 'flix9-premium'
                        : 'flix9-basic'
                    }
                    size="xs"
                  >
                    {!drama.isPaid ? 'Free Tier' : drama.plan || 'Flix9 Basic'}
                  </Badge>
                </div>
              </div>

              {/* Clean Content Below Poster */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white dark:bg-[#121612]">
                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <h4
                      onClick={() => setManagingDrama(drama)}
                      className="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-amber-500 transition-colors cursor-pointer"
                    >
                      {drama.title}
                    </h4>
                    {drama.isTrending && (
                      <span className="text-[11px] font-bold text-amber-500 shrink-0 flex items-center gap-0.5">
                        <Flame className="w-3 h-3 fill-current" /> Trending
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                    {drama.genres.join(', ')}
                  </p>
                </div>

                {/* Footer: Clean stats and Action */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white">
                      {drama.totalEpisodes} Episodes
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {drama.views} views
                    </p>
                  </div>

                  <button
                    onClick={() => setManagingDrama(drama)}
                    className="inline-flex items-center text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#1A201A] hover:bg-[#FEF08A] hover:text-slate-950 dark:hover:bg-[#FEF08A] dark:hover:text-slate-950 border border-slate-200/60 dark:border-white/10 px-3 py-1.5 rounded-xl transition-all gap-1 group/btn cursor-pointer"
                  >
                    <span>Manage</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
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
              <thead className="bg-slate-50/80 dark:bg-[#161B16] border-b border-slate-200/80 dark:border-white/10 text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 sm:px-6 w-20 text-center">Priority</th>
                  <th className="py-3 px-4 min-w-[220px]">Series Title</th>
                  <th className="py-3 px-4 w-36">Plan</th>
                  <th className="py-3 px-4 min-w-[160px]">Genres</th>
                  <th className="py-3 px-4 w-24">Episodes</th>
                  <th className="py-3 px-4 w-24">Views</th>
                  <th className="py-3 px-4 w-28">Release Date</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                  <th className="py-3 px-4 sm:px-6 w-28 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                {filteredDramas.map((drama) => (
                  <tr
                    key={drama.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/[0.04] transition-colors duration-150"
                  >
                    {/* Priority Rank & Up/Down Shifters */}
                    <td className="py-2.5 px-4 sm:px-6 align-middle text-center">
                      <div className="inline-flex items-center space-x-1.5">
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 bg-slate-100 dark:bg-[#1A201A] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/10"
                          title={`Display Priority ${drama.priority}`}
                        >
                          {drama.priority}
                        </span>

                        <div className="flex flex-col space-y-0.5">
                          <button
                            onClick={() => handleMovePriority(drama.id, 'up')}
                            disabled={drama.priority <= 1}
                            title="Move Priority Up"
                            className="p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded transition-colors cursor-pointer"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMovePriority(drama.id, 'down')}
                            disabled={drama.priority >= dramas.length}
                            title="Move Priority Down"
                            className="p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded transition-colors cursor-pointer"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Series Title & Compact Thumbnail (reduced height) */}
                    <td className="py-2.5 px-4 align-middle">
                      <div className="flex items-center space-x-3">
                        <div className="relative shrink-0">
                          <img
                            src={drama.poster}
                            alt={drama.title}
                            onClick={() => setManagingDrama(drama)}
                            className="w-9 h-10 rounded-lg object-cover bg-slate-900 border border-slate-200/80 dark:border-white/10 cursor-pointer hover:opacity-90 transition-opacity shadow-2xs"
                          />
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setManagingDrama(drama)}
                            className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm hover:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer truncate text-left block"
                          >
                            {drama.title}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Plan Badge */}
                    <td className="py-2 px-4 align-middle">
                      <Badge
                        variant={
                          !drama.isPaid || (drama.plan || '').toLowerCase().includes('free')
                            ? 'no-plan'
                            : (drama.plan || '').toLowerCase().includes('annual') || (drama.plan || '').toLowerCase().includes('yearly')
                            ? 'flix9-premium'
                            : 'flix9-basic'
                        }
                        size="xs"
                      >
                        {!drama.isPaid ? 'Free Tier' : drama.plan || 'Flix9 Basic'}
                      </Badge>
                    </td>

                    {/* Genres */}
                    <td className="py-2.5 px-4 align-middle text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {drama.genres.join(', ')}
                    </td>

                    {/* Episodes (Only number, non-bold) */}
                    <td className="py-2.5 px-4 align-middle text-xs font-normal text-slate-700 dark:text-slate-300 sm:text-sm">
                      {drama.totalEpisodes}
                    </td>

                    {/* Views (Non-bold) */}
                    <td className="py-2.5 px-4 align-middle text-xs font-normal text-slate-700 dark:text-slate-300 sm:text-sm">
                      {drama.views}
                    </td>

                    {/* Separate Release / Joining Date */}
                    <td className="py-2.5 px-4 align-middle text-xs font-normal text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {drama.releaseDate || '—'}
                    </td>

                    {/* Status Badge: ACTIVE OR INACTIVE */}
                    <td className="py-2 px-4 align-middle text-center">
                      <Badge
                        variant={drama.isActive ? 'active' : 'inactive'}
                        size="xs"
                        onClick={() => handleToggleActive(drama.id)}
                        title={`Status: ${drama.isActive ? 'Active' : 'Inactive'} (Click to toggle)`}
                      >
                        {drama.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-4 sm:px-6 align-middle text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setManagingDrama(drama)}
                          title="Edit Series"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-[#1A201A] hover:bg-[#FEF08A] hover:text-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/10 transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDrama(drama.id)}
                          title="Delete Series"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-[#1A201A] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200/60 dark:border-white/10 transition-all active:scale-95 cursor-pointer shadow-2xs"
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

          {/* Table Summary Footer */}
          <div className="px-4 sm:px-6 py-3 bg-slate-50/50 dark:bg-[#161B16]/80 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Showing {filteredDramas.length} of {dramas.length} series
            </span>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] font-medium text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active: <strong className="text-slate-700 dark:text-slate-200">{dramas.filter(d => d.isActive).length}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Inactive: <strong className="text-slate-700 dark:text-slate-200">{dramas.filter(d => !d.isActive).length}</strong>
              </span>
              <span className="inline-flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-500" />
                Paid: <strong className="text-slate-700 dark:text-slate-200">{dramas.filter(d => d.isPaid).length}</strong>
              </span>
              <span className="inline-flex items-center gap-1">
                <Unlock className="w-3 h-3 text-emerald-500" />
                Free: <strong className="text-slate-700 dark:text-slate-200">{dramas.filter(d => !d.isPaid).length}</strong>
              </span>
            </div>
          </div>
        </div>

      )}

      {/* Manage Content Pop-up Card */}
      <ManageContentModal
        isOpen={!!managingDrama}
        drama={managingDrama}
        onClose={() => {
          setManagingDrama(null);
          if (onClearSelectedDrama) onClearSelectedDrama();
        }}
        onSave={() => {
          setManagingDrama(null);
          if (onClearSelectedDrama) onClearSelectedDrama();
          loadDramas();
        }}
      />

    </div>
  );
}
