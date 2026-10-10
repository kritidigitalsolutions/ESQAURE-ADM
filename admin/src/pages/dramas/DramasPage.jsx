import React, { useState, useMemo, useEffect } from 'react';
import { dramaService } from '../../services/dramaService';
import AnimatedNumber from '../../components/common/AnimatedNumber';
import Badge from '../../components/common/Badge';
import KpiStatCard from '../../components/common/KpiStatCard';
import ManageContentModal from '../../components/ManageContentModal';
import PageLoader from '../../components/common/PageLoader';
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
    const totalViewsRaw = dramas.reduce((acc, d) => acc + (d.viewsCount || 0), 0);
    const formatNumber = (num) => {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
      return (num || 0).toString();
    };
    const computedStreams = formatNumber(totalViewsRaw);
    const computedHours = Math.round((totalViewsRaw * 2.2) / 60);
    const computedWatchTime = computedHours > 0 ? `${formatNumber(computedHours)} Hrs` : '0 Hrs';

    return {
      totalSeries: serverStats?.totalSeries ?? totalSeries,
      published: serverStats?.published ?? published,
      totalEpisodes: serverStats?.totalEpisodes ?? totalEpisodes,
      totalStreams: serverStats?.totalStreams ?? computedStreams,
      topDrama: serverStats?.topDrama ?? topDrama,
      watchTime: serverStats?.watchTime ?? computedWatchTime
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
    <div className="space-y-3 font-urbanist selection:bg-[#FEF08A] selection:text-black pb-8">

      {/* 4 Clean Minimal KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <KpiStatCard
          icon={Film}
          title="Total Series"
          value={stats.totalSeries}
          footerLeft={`${stats.published} live published`}
          footerRight={`${stats.totalSeries - stats.published} draft`}
          footerRightColor="text-slate-400 font-medium"
        />

        <KpiStatCard
          icon={Tv}
          title="Total Episodes"
          value={stats.totalEpisodes}
          footerLeft="Catalog Inventory"
          footerRight="HD Ready"
          footerRightColor="text-emerald-600 dark:text-emerald-400 font-bold"
        />

        <KpiStatCard
          icon={Play}
          title="Total Streams"
          value={stats.totalStreams}
          footerLeft="Platform Plays"
          footerRight="Dynamic"
        />

        <KpiStatCard
          icon={Clock}
          title="Watch Time"
          value={stats.watchTime}
          footerLeft="Catalog Retention"
          footerRight="High"
          footerRightColor="text-emerald-600 dark:text-emerald-400 font-bold"
        />
      </div>

      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
              Content Library
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF08A]/40 dark:bg-amber-400/10 text-amber-900 dark:text-amber-300 border border-amber-300/50">
              {dramas.length} Series
            </span>
          </div>
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
            Manage short-drama episodes, catalog status, priority ranking, and monetization.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={loadDramas}
            disabled={isLoading}
            className="p-1.5 bg-white dark:bg-[#121216] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-white/10 rounded-xl transition-all cursor-pointer active:scale-95 shrink-0"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => (onNavigate ? onNavigate('upload') : onOpenIngestModal?.())}
            className="py-1.5 px-3.5 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Upload Series</span>
          </button>
        </div>
      </div>

      {/* Unified Filter, Search & View Toolbar */}
      <div className="bg-white dark:bg-[#121216] rounded-xl p-2 sm:px-3 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        
        {/* Left: Status Filter Tabs & Sub-Filters */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Status Segmented Control */}
          <div className="flex items-center space-x-1 p-0.5 bg-slate-100 dark:bg-[#18181E] rounded-lg border border-slate-200/60 dark:border-white/10 shrink-0">
            {[
              { id: 'ALL', label: `All (${dramas.length})` },
              { id: 'ACTIVE', label: `Active (${stats.published})` },
              { id: 'INACTIVE', label: `Draft (${Math.max(0, dramas.length - stats.published)})` },
              { id: 'TRENDING', label: `Trending (${dramas.filter(d => d.isTrending).length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  selectedStatus === tab.id
                    ? 'bg-white dark:bg-[#24242E] text-slate-950 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Access Filter (Paid / Free) */}
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-[#18181E] px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-xs">
            <Lock className="w-3 h-3 text-slate-400" />
            <select
              value={selectedAccess}
              onChange={(e) => setSelectedAccess(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="dark:bg-[#1E1E26]">All Access</option>
              <option value="PAID" className="dark:bg-[#1E1E26]">Paid</option>
              <option value="FREE" className="dark:bg-[#1E1E26]">Free</option>
            </select>
          </div>

          {/* Genre Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-[#18181E] px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Genre:</span>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer text-xs"
            >
              {genres.map(g => (
                <option key={g} value={g} className="dark:bg-[#1E1E26]">
                  {g === 'ALL' ? 'All Genres' : g}
                </option>
              ))}
            </select>
          </div>

          {(searchTerm || selectedStatus !== 'ALL' || selectedGenre !== 'ALL' || selectedAccess !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('ALL');
                setSelectedGenre('ALL');
                setSelectedAccess('ALL');
                setSortBy('priority');
              }}
              className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold px-1.5 py-0.5 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Right: Search + Sort + View Switcher */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search series or genres..."
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

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#FEF08A] cursor-pointer"
            >
              <option value="priority">Priority Rank</option>
              <option value="views">Most Views</option>
              <option value="episodes">Most Episodes</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {/* View Mode Switcher: Grid vs Table */}
          <div className="bg-slate-100 dark:bg-[#18181E] p-0.5 rounded-lg flex items-center border border-slate-200/60 dark:border-white/10 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#24242E] text-slate-950 dark:text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#24242E] text-slate-950 dark:text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-medium shrink-0 hidden lg:inline">
            <strong className="text-slate-900 dark:text-white font-bold">{filteredDramas.length}</strong> series
          </span>
        </div>

      </div>

      {/* Main Content: Loading, Empty, Grid, or Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#121216] rounded-xl border border-slate-200/80 dark:border-white/10 shadow-nodus overflow-hidden">
          <PageLoader text="Loading series..." minHeight="min-h-[280px]" />
        </div>
      ) : filteredDramas.length === 0 ? (
        <div className="bg-white dark:bg-[#121216] rounded-xl p-10 text-center border border-slate-200/80 dark:border-white/10 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 text-slate-950 dark:text-amber-300 flex items-center justify-center mx-auto mb-2.5">
            <Film className="w-5 h-5 stroke-[2]" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white">
            No series found
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-3">
            Try adjusting your search terms, status, or genre filter.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedGenre('ALL');
              setSelectedStatus('ALL');
              setSelectedAccess('ALL');
            }}
            className="px-3.5 py-1.5 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (

        /* GRID VIEW: Clean, Compact Widescreen Poster Tiles */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
          {filteredDramas.map((drama) => (
            <div
              key={drama.id}
              className="bg-white dark:bg-[#121216] rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs overflow-hidden flex flex-col group transition-all hover:border-slate-300 dark:hover:border-white/20"
            >
              {/* Poster Image */}
              <div
                className="relative aspect-[3/4] bg-slate-950 overflow-hidden cursor-pointer"
                onClick={() => setManagingDrama(drama)}
              >
                <img
                  src={drama.poster}
                  alt={drama.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 ease-out"
                />

                {/* Priority Badge Top-Left */}
                <div className="absolute top-2 left-2 z-10 flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  <span className="inline-flex items-center text-[9.5px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs bg-black/75 backdrop-blur-xs text-white border border-white/20">
                    #{drama.priority}
                  </span>
                  <div className="flex items-center bg-black/75 backdrop-blur-xs rounded-md p-0.5 border border-white/20">
                    <button
                      onClick={() => handleMovePriority(drama.id, 'up')}
                      disabled={drama.priority <= 1}
                      title="Move Priority Up"
                      className="p-0.5 text-white/70 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronUp className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => handleMovePriority(drama.id, 'down')}
                      disabled={drama.priority >= dramas.length}
                      title="Move Priority Down"
                      className="p-0.5 text-white/70 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* Status Badge Top-Right */}
                <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(drama.id)}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold backdrop-blur-xs shadow-2xs transition-all cursor-pointer ${
                      drama.isActive
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                        : 'bg-black/75 text-slate-300 border border-white/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        drama.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    {drama.isActive ? 'Live' : 'Draft'}
                  </button>
                </div>

                {/* Paid Tag Bottom-Left */}
                {drama.isPaid && (
                  <div className="absolute bottom-2 left-2 z-10">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#FEF08A] text-slate-950 shadow-2xs">
                      PAID
                    </span>
                  </div>
                )}
              </div>

              {/* Card Meta Content */}
              <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2 bg-white dark:bg-[#121216]">
                <div>
                  <h4
                    onClick={() => setManagingDrama(drama)}
                    className="font-bold text-slate-900 dark:text-white text-xs truncate group-hover:text-amber-500 transition-colors cursor-pointer"
                  >
                    {drama.title}
                  </h4>
                  <p className="text-[10.5px] text-slate-400 font-normal mt-0.5 truncate">
                    {drama.genres.join(', ')}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-[11px] block">
                      {drama.totalEpisodes} Eps
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal block">
                      {drama.views} views
                    </span>
                  </div>

                  <button
                    onClick={() => setManagingDrama(drama)}
                    className="inline-flex items-center text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#1E1E26] hover:bg-[#FACC15] hover:text-slate-950 dark:hover:bg-[#FACC15] dark:hover:text-slate-950 border border-slate-200/60 dark:border-white/10 px-2 py-1 rounded-lg transition-all gap-0.5 cursor-pointer"
                  >
                    <span>Manage</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

      ) : (

        /* TABLE VIEW: Compact, Clean Studio Catalog Table */
        <div className="bg-white dark:bg-[#121216] rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/70 dark:bg-[#18181E] border-b border-slate-200/80 dark:border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 w-16 text-center">Rank</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Series Title</th>
                  <th className="py-2.5 px-3 min-w-[140px]">Genres</th>
                  <th className="py-2.5 px-3 w-20">Episodes</th>
                  <th className="py-2.5 px-3 w-20">Views</th>
                  <th className="py-2.5 px-3 w-20">Access</th>
                  <th className="py-2.5 px-3 w-24 text-center">Status</th>
                  <th className="py-2.5 px-3 w-20 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                {filteredDramas.map((drama) => (
                  <tr
                    key={drama.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    {/* Priority Rank */}
                    <td className="py-2 px-3 align-middle text-center">
                      <div className="inline-flex items-center space-x-1">
                        <span className="w-5.5 h-5.5 rounded-md flex items-center justify-center font-bold text-[11px] bg-slate-100 dark:bg-[#1E1E26] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                          {drama.priority}
                        </span>
                        <div className="flex flex-col space-y-0.5">
                          <button
                            onClick={() => handleMovePriority(drama.id, 'up')}
                            disabled={drama.priority <= 1}
                            className="p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronUp className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={() => handleMovePriority(drama.id, 'down')}
                            disabled={drama.priority >= dramas.length}
                            className="p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronDown className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Series Title & Compact Thumbnail */}
                    <td className="py-2 px-3 align-middle">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={drama.poster}
                          alt={drama.title}
                          onClick={() => setManagingDrama(drama)}
                          className="w-8 h-10 rounded-md object-cover bg-slate-900 border border-slate-200/80 dark:border-white/10 cursor-pointer hover:opacity-90 transition-opacity shadow-2xs shrink-0"
                        />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setManagingDrama(drama)}
                            className="font-bold text-slate-900 dark:text-white text-xs sm:text-[13px] hover:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer truncate text-left block"
                          >
                            {drama.title}
                          </button>
                          {drama.isTrending && (
                            <span className="text-[10px] font-bold text-amber-500 inline-flex items-center gap-0.5 mt-0.5">
                              <Flame className="w-2.5 h-2.5 fill-current" /> Trending
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Genres */}
                    <td className="py-2 px-3 align-middle text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                      {drama.genres.join(', ')}
                    </td>

                    {/* Episodes */}
                    <td className="py-2 px-3 align-middle text-xs font-bold text-slate-900 dark:text-white">
                      {drama.totalEpisodes}
                    </td>

                    {/* Views */}
                    <td className="py-2 px-3 align-middle text-xs font-medium text-slate-600 dark:text-slate-300">
                      {drama.views}
                    </td>

                    {/* Access (Paid / Free) */}
                    <td className="py-2 px-3 align-middle">
                      <button
                        type="button"
                        onClick={() => handleTogglePaid(drama.id)}
                        className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          drama.isPaid
                            ? 'bg-[#FEF08A]/40 dark:bg-amber-400/10 text-amber-950 dark:text-amber-300 border border-amber-300/50'
                            : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                        }`}
                      >
                        {drama.isPaid ? 'Paid' : 'Free'}
                      </button>
                    </td>

                    {/* Status (Active / Draft) */}
                    <td className="py-2 px-3 align-middle text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(drama.id)}
                        title="Click to toggle status"
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95 ${
                          drama.isActive
                            ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                            : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            drama.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        {drama.isActive ? 'Active' : 'Draft'}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="py-2 px-3 align-middle text-right">
                      <div className="inline-flex items-center space-x-0.5">
                        <button
                          type="button"
                          onClick={() => setManagingDrama(drama)}
                          title="Manage Series"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDrama(drama.id)}
                          title="Delete Series"
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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
          <div className="px-3 sm:px-4 py-2 bg-slate-50/60 dark:bg-[#18181E]/80 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <span className="font-medium text-[11px] text-slate-500 dark:text-slate-400">
              Showing <strong className="text-slate-900 dark:text-white">{filteredDramas.length}</strong> of {dramas.length} series
            </span>
            <div className="flex flex-wrap items-center gap-3 text-[10.5px] font-medium">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active: <strong className="text-slate-700 dark:text-slate-200">{stats.published}</strong>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Draft: <strong className="text-slate-700 dark:text-slate-200">{Math.max(0, dramas.length - stats.published)}</strong>
              </span>
              <span className="inline-flex items-center gap-1">
                Paid: <strong className="text-slate-700 dark:text-slate-200">{dramas.filter(d => d.isPaid).length}</strong>
              </span>
              <span className="inline-flex items-center gap-1">
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
