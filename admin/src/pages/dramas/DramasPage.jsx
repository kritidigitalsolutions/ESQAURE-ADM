import React, { useState, useMemo, useEffect } from 'react';
import { mockDramas, normalizePriorities, reassignPriority } from '../../data/mockOttData';
import AnimatedNumber from '../../components/common/AnimatedNumber';
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
  Trash2
} from 'lucide-react';

export default function DramasPage({
  onOpenIngestModal,
  onNavigate,
  selectedDramaId,
  onClearSelectedDrama
}) {
  const [dramas, setDramas] = useState(() => {
    try {
      const saved = localStorage.getItem('esquare_dramas');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return normalizePriorities(parsed);
        }
      }
    } catch (e) {}
    return normalizePriorities(mockDramas);
  });

  useEffect(() => {
    try {
      localStorage.setItem('esquare_dramas', JSON.stringify(dramas));
    } catch (e) {}
  }, [dramas]);

  const [managingDrama, setManagingDrama] = useState(null);

  useEffect(() => {
    if (selectedDramaId) {
      const found = dramas.find(d => d.id === selectedDramaId);
      if (found) {
        setManagingDrama(found);
      }
    }
  }, [selectedDramaId, dramas]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('priority');
  const [viewMode, setViewMode] = useState('table'); // 'grid' | 'table'

  // When admin deletes content, priority shifts automatically:
  // (e.g. deleting #1 shifts #2 -> #1, #3 -> #2, etc.)
  const handleDeleteDrama = (id) => {
    setDramas(prev => {
      const remaining = prev.filter(d => d.id !== id);
      return normalizePriorities(remaining);
    });
  };

  const handleUpdatePriority = (id, newPriority) => {
    setDramas(prev => reassignPriority(prev, id, newPriority));
  };

  const handleMovePriority = (id, direction) => {
    const current = dramas.find(d => d.id === id);
    if (!current) return;
    const targetPriority = direction === 'up' ? (current.priority || 1) - 1 : (current.priority || 1) + 1;
    setDramas(prev => reassignPriority(prev, id, targetPriority));
  };

  // Available Genres
  const genres = useMemo(() => {
    const set = new Set();
    dramas.forEach(d => d.genres.forEach(g => set.add(g)));
    return ['ALL', ...Array.from(set)];
  }, [dramas]);

  // Top Clean Stats
  const stats = useMemo(() => {
    const totalSeries = dramas.length;
    const published = dramas.filter(d => d.status === 'PUBLISHED').length;
    const totalEpisodes = dramas.reduce((acc, d) => acc + (d.totalEpisodes || 0), 0);
    const topDrama = dramas.find(d => d.isTrending && d.trendingRank === 1) || dramas[0];

    return {
      totalSeries,
      published,
      totalEpisodes,
      topDrama,
      totalStreams: '18.1M'
    };
  }, [dramas]);

  // Filter & Sort
  const filteredDramas = useMemo(() => {
    return dramas
      .filter(d => {
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !term ||
          d.title.toLowerCase().includes(term) ||
          d.id.toLowerCase().includes(term) ||
          d.genres.some(g => g.toLowerCase().includes(term));

        const matchesGenre = selectedGenre === 'ALL' || d.genres.includes(selectedGenre);

        let matchesStatus = true;
        if (selectedStatus === 'TRENDING') {
          matchesStatus = !!d.isTrending;
        } else if (selectedStatus !== 'ALL') {
          matchesStatus = d.status === selectedStatus;
        }

        return matchesSearch && matchesGenre && matchesStatus;
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
      
      {/* 3 Clean Top Stat Cards: Total Series, Total Streams, and Total Watch Time */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Total Series */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-nodus card-subtle-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 group-hover:scale-105 transition-transform shadow-xs">
              <Film className="w-5 h-5 text-slate-950 dark:text-amber-400" />
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-xs">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" /> +12.5%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Series</p>
            <p className="text-3xl font-extrabold text-slate-950 dark:text-white mt-1">
              <AnimatedNumber value={stats.totalSeries} />
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span>{stats.published} Published series live</span>
          </div>
        </div>

        {/* Card 2: Total Streams */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-nodus card-subtle-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 group-hover:scale-105 transition-transform shadow-xs">
              <Play className="w-5 h-5 text-slate-950 dark:text-amber-400 ml-0.5" />
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-xs">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" /> +24.8%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Streams</p>
            <p className="text-3xl font-extrabold text-slate-950 dark:text-white mt-1">
              {stats.totalStreams}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span>Across all uploaded series</span>
          </div>
        </div>

        {/* Card 3: Total Watch Time */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-nodus card-subtle-hover flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 group-hover:scale-105 transition-transform shadow-xs">
              <Clock className="w-5 h-5 text-slate-950 dark:text-amber-400" />
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-xs">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" /> +28.4%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Watch Time</p>
            <p className="text-3xl font-extrabold text-slate-950 dark:text-white mt-1">
              2.04M Hrs
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span>Hours streamed across catalog</span>
          </div>
        </div>

      </div>

      {/* Clean, Smart & Perfectly Aligned Toolbar */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-nodus space-y-3.5">
        
        {/* Main Row: Search + Filter Controls on Left, Elongated Upload Button on Right */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Left Group: Search input + other controllers */}
          <div className="flex items-center flex-wrap gap-2.5 flex-1 min-w-0">
            {/* Search input */}
            <div className="relative w-full sm:w-64 lg:w-72 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search series or genres..."
                className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm font-semibold bg-slate-100/80 dark:bg-slate-800/70 focus:bg-white dark:focus:bg-[#161616] text-slate-900 dark:text-white placeholder-slate-400 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:border-amber-400 focus:outline-none transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Tabs: Clean segmented button */}
            <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center border border-slate-200/70 dark:border-slate-700/70 text-xs font-bold">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'PUBLISHED', label: 'Published' },
                { id: 'TRENDING', label: 'Trending' },
                { id: 'DRAFT', label: 'Draft' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedStatus === tab.id
                      ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Genre Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-xs">
              <span className="text-slate-400 font-medium">Genre:</span>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer text-xs"
              >
                {genres.map(g => (
                  <option key={g} value={g} className="dark:bg-[#161616]">
                    {g === 'ALL' ? 'All Genres' : g}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="priority" className="dark:bg-[#161616]">Sort: Priority (Catalog Rank)</option>
                <option value="views" className="dark:bg-[#161616]">Sort: Most Views</option>
                <option value="episodes" className="dark:bg-[#161616]">Sort: Most Episodes</option>
                <option value="newest" className="dark:bg-[#161616]">Sort: Newest</option>
              </select>
            </div>

            {/* View Switcher: Grid vs Table */}
            <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center border border-slate-200/70 dark:border-slate-700/70">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Upload Button (prominent & long horizontally) */}
          <div className="flex items-center justify-end shrink-0">
            <button
              onClick={() => (onNavigate ? onNavigate('upload') : onOpenIngestModal?.())}
              className="w-full sm:w-auto px-8 py-2.5 min-w-[145px] bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center space-x-2 shadow-xs hover:shadow transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Upload</span>
            </button>
          </div>

        </div>

      </div>

      {/* Empty State */}
      {filteredDramas.length === 0 ? (
        <div className="bg-white dark:bg-[#111111] rounded-2xl p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-nodus">
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
              className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-nodus card-subtle-hover overflow-hidden flex flex-col group transition-all duration-300"
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

                {/* Single Sleek Status Badge on Top Right */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  <span
                    className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs ${
                      drama.status === 'PUBLISHED'
                        ? 'bg-emerald-500 text-white'
                        : drama.status === 'ENCODING'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    {drama.status === 'PUBLISHED' ? 'Published' : drama.status === 'ENCODING' ? 'Processing' : 'Draft'}
                  </span>
                </div>
              </div>

              {/* Clean Content Below Poster */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white dark:bg-[#111111]">
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
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
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
                    className="inline-flex items-center text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-[#FEF08A] hover:text-slate-950 dark:hover:bg-[#FEF08A] dark:hover:text-slate-950 px-3 py-1.5 rounded-xl transition-all gap-1 group/btn cursor-pointer"
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
           TABLE VIEW: CLEAN MINIMAL STUDIO TABLE
           ======================================================== */
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 w-[110px]">Priority</th>
                  <th className="py-3.5 px-4 w-[32%] min-w-[220px]">Series Title</th>
                  <th className="py-3.5 px-4 w-[120px]">Status</th>
                  <th className="py-3.5 px-4 w-[22%] min-w-[170px]">Genres</th>
                  <th className="py-3.5 px-4 w-[110px]">Episodes</th>
                  <th className="py-3.5 px-4 w-[100px]">Views</th>
                  <th className="py-3.5 px-4 w-[120px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {filteredDramas.map((drama) => (
                  <tr
                    key={drama.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150"
                  >
                    {/* Priority Rank & Up/Down Shifters */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                          title={`Display Priority ${drama.priority}`}
                        >
                          {drama.priority}
                        </span>

                        <div className="flex flex-col space-y-0.5">
                          <button
                            onClick={() => handleMovePriority(drama.id, 'up')}
                            disabled={drama.priority <= 1}
                            title="Move Priority Up"
                            className="p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMovePriority(drama.id, 'down')}
                            disabled={drama.priority >= dramas.length}
                            title="Move Priority Down"
                            className="p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Series Title */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex items-center space-x-3">
                        <div className="relative shrink-0">
                          <img
                            src={drama.poster}
                            alt={drama.title}
                            onClick={() => setManagingDrama(drama)}
                            className="w-10 h-14 rounded-lg object-cover bg-slate-900 border border-slate-200/80 dark:border-slate-800 cursor-pointer"
                          />
                          {drama.isTrending && (
                            <span
                              title={`Trending #${drama.trendingRank || ''}`}
                              className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs"
                            >
                              <Flame className="w-2.5 h-2.5 fill-current" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p
                            onClick={() => setManagingDrama(drama)}
                            className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm hover:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer truncate"
                          >
                            {drama.title}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {drama.releaseDate}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Status (Clean text pill, NO dot) */}
                    <td className="py-3.5 px-4 align-middle">
                      {drama.status === 'PUBLISHED' ? (
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
                          Published
                        </span>
                      ) : drama.status === 'ENCODING' ? (
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40">
                          Processing
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700/60">
                          Draft
                        </span>
                      )}
                    </td>

                    {/* Genres (Clean text) */}
                    <td className="py-3.5 px-4 align-middle text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {drama.genres.join(', ')}
                    </td>

                    {/* Episodes (Clean text, NO tv icon) */}
                    <td className="py-3.5 px-4 align-middle font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {drama.totalEpisodes} Episodes
                    </td>

                    {/* Views (Clean text, NO play icon) */}
                    <td className="py-3.5 px-4 align-middle font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {drama.views}
                    </td>

                    {/* Action (Clean minimal icon buttons: Manage, Delete) */}
                    <td className="py-3.5 px-4 align-middle text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setManagingDrama(drama)}
                          title="Manage Content"
                          className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDrama(drama.id)}
                          title="Delete Series"
                          className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Summary Footer */}
          <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Showing {filteredDramas.length} of {dramas.length} series
            </span>
            <div className="flex items-center space-x-4 text-[11px] font-medium text-slate-400">
              <span>Published: {filteredDramas.filter(d => d.status === 'PUBLISHED').length}</span>
              <span>Processing: {filteredDramas.filter(d => d.status === 'ENCODING').length}</span>
              <span>Draft: {filteredDramas.filter(d => d.status === 'DRAFT').length}</span>
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
        onSave={(updatedDrama) => {
          if (updatedDrama.priority) {
            setDramas(prev => reassignPriority(prev, updatedDrama.id, updatedDrama.priority));
          } else {
            setDramas(prev => prev.map(d => (d.id === updatedDrama.id ? updatedDrama : d)));
          }
          setManagingDrama(null);
          if (onClearSelectedDrama) onClearSelectedDrama();
        }}
      />

    </div>
  );
}
