import React, { useState, useMemo, useEffect } from 'react';
import { dramaService } from '../../services/dramaService';
import AnimatedNumber from '../../components/common/AnimatedNumber';
import Badge from '../../components/common/Badge';
import KpiStatCard from '../../components/common/KpiStatCard';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import ManageContentModal from '../../components/ManageContentModal';
import PageLoader from '../../components/common/PageLoader';
import { confirmModal } from '../../context/DialogContext';
import {
  Search,
  X,
  Plus,
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
  Loader2,
  ArrowUpDown,
  GripVertical,
  Crown,
  ArrowUp,
  ArrowDown,
  Check,
  RotateCcw,
  Sparkles
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

  // Quick direct rank modal state
  const [quickPriorityDrama, setQuickPriorityDrama] = useState(null);
  const [quickRankInput, setQuickRankInput] = useState(1);

  // Content Priority Studio state
  const [isPriorityStudioOpen, setIsPriorityStudioOpen] = useState(false);
  const [studioDramas, setStudioDramas] = useState([]);
  const [studioSearch, setStudioSearch] = useState('');
  const [isStudioDirty, setIsStudioDirty] = useState(false);
  const [isSavingStudio, setIsSavingStudio] = useState(false);
  const [draggedStudioId, setDraggedStudioId] = useState(null);
  const [dragOverStudioId, setDragOverStudioId] = useState(null);

  // Toast feedback state
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
    const dramaToDelete = dramas.find(d => d.id === id);
    const seriesTitle = dramaToDelete?.title || 'this series';
    const confirmed = await confirmModal({
      title: 'Delete Drama Series',
      message: `Are you sure you want to permanently delete "${seriesTitle}"? All episodes, media files, and watch analytics linked to this title will be removed permanently.`,
      itemName: seriesTitle,
      confirmText: 'Delete Series',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      await dramaService.deleteDrama(id);
      loadDramas();
      showToast('Series deleted successfully', 'info');
    } catch (err) {
      console.error('Delete drama failed:', err);
      // Fallback state update
      setDramas(prev => prev.filter(d => d.id !== id));
    }
  };

  // Helper: Optimistically shift drama in local state so UI updates in 0ms
  const applyLocalPriorityShift = (dramaId, targetIndex) => {
    setDramas(prev => {
      const sorted = [...prev].sort((a, b) => (Number(a.priority) || 999) - (Number(b.priority) || 999));
      const currIdx = sorted.findIndex(d => d.id === dramaId);
      if (currIdx === -1) return prev;

      const clampedIndex = Math.max(0, Math.min(sorted.length - 1, targetIndex));
      if (clampedIndex === currIdx) return prev;

      const [moved] = sorted.splice(currIdx, 1);
      sorted.splice(clampedIndex, 0, moved);

      return sorted.map((d, idx) => ({
        ...d,
        priority: idx + 1
      }));
    });
  };

  // Move priority up / down via API with instant optimistic UI update
  const handleMovePriority = async (id, direction) => {
    const current = dramas.find(d => d.id === id);
    if (!current) return;
    const sorted = [...dramas].sort((a, b) => (Number(a.priority) || 999) - (Number(b.priority) || 999));
    const currIdx = sorted.findIndex(d => d.id === id);
    const targetIdx = direction === 'up' ? Math.max(0, currIdx - 1) : Math.min(sorted.length - 1, currIdx + 1);

    if (targetIdx === currIdx) return;

    // Optimistic UI update
    applyLocalPriorityShift(id, targetIdx);
    showToast(`Shifted "${current.title}" ${direction === 'up' ? 'up to #' + (targetIdx + 1) : 'down to #' + (targetIdx + 1)}`, 'info');

    try {
      await dramaService.updatePriority(id, { direction });
    } catch (err) {
      console.error('Update priority failed:', err);
      showToast('Failed to save priority: ' + (err.message || 'Server error'), 'error');
      loadDramas();
    }
  };

  // Move drama directly to Rank #1 (Top)
  const handleMoveToTop = async (id) => {
    const current = dramas.find(d => d.id === id);
    if (!current) return;

    applyLocalPriorityShift(id, 0);
    showToast(`"${current.title}" moved to Rank #1`, 'success');

    try {
      await dramaService.updatePriority(id, { moveTo: 'top' });
    } catch (err) {
      console.error('Move to top failed:', err);
      showToast('Failed to move to top: ' + (err.message || 'Server error'), 'error');
      loadDramas();
    }
  };

  // Set explicit priority rank directly (e.g. from quick modal or row input)
  const handleSetDirectRank = async (id, newRank) => {
    const current = dramas.find(d => d.id === id);
    if (!current) return;
    const targetIdx = Math.max(0, Math.min(dramas.length - 1, Number(newRank) - 1));

    applyLocalPriorityShift(id, targetIdx);
    showToast(`"${current.title}" set to Rank #${targetIdx + 1}`, 'success');

    try {
      await dramaService.updatePriority(id, { priority: targetIdx + 1 });
    } catch (err) {
      console.error('Set rank failed:', err);
      showToast('Failed to set rank: ' + (err.message || 'Server error'), 'error');
      loadDramas();
    }
  };

  // Open Content Priority Studio
  const handleOpenPriorityStudio = () => {
    const sorted = [...dramas].sort((a, b) => (Number(a.priority) || 999) - (Number(b.priority) || 999));
    setStudioDramas(sorted);
    setStudioSearch('');
    setIsStudioDirty(false);
    setIsPriorityStudioOpen(true);
  };

  // Priority Studio: Move item up
  const handleStudioMoveUp = (index) => {
    if (index <= 0) return;
    const newItems = [...studioDramas];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    setStudioDramas(newItems.map((d, idx) => ({ ...d, priority: idx + 1 })));
    setIsStudioDirty(true);
  };

  // Priority Studio: Move item down
  const handleStudioMoveDown = (index) => {
    if (index >= studioDramas.length - 1) return;
    const newItems = [...studioDramas];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    setStudioDramas(newItems.map((d, idx) => ({ ...d, priority: idx + 1 })));
    setIsStudioDirty(true);
  };

  // Priority Studio: Move to Top (#1)
  const handleStudioMoveToTop = (id) => {
    const currIdx = studioDramas.findIndex(d => d.id === id);
    if (currIdx <= 0) return;
    const newItems = [...studioDramas];
    const [moved] = newItems.splice(currIdx, 1);
    newItems.unshift(moved);
    setStudioDramas(newItems.map((d, idx) => ({ ...d, priority: idx + 1 })));
    setIsStudioDirty(true);
    showToast(`"${moved.title}" moved to Rank #1`, 'info');
  };

  // Priority Studio: Change rank directly on row
  const handleStudioDirectRank = (id, targetRankNum) => {
    const currIdx = studioDramas.findIndex(d => d.id === id);
    if (currIdx === -1) return;
    const targetIdx = Math.max(0, Math.min(studioDramas.length - 1, Number(targetRankNum) - 1));
    if (targetIdx === currIdx) return;
    const newItems = [...studioDramas];
    const [moved] = newItems.splice(currIdx, 1);
    newItems.splice(targetIdx, 0, moved);
    setStudioDramas(newItems.map((d, idx) => ({ ...d, priority: idx + 1 })));
    setIsStudioDirty(true);
  };

  // Priority Studio: HTML5 Drag & Drop
  const handleStudioDragStart = (e, id) => {
    setDraggedStudioId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleStudioDragOver = (e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStudioId !== id) {
      setDragOverStudioId(id);
    }
  };

  const handleStudioDrop = (e, targetId) => {
    e.preventDefault();
    const sourceId = draggedStudioId || e.dataTransfer.getData('text/plain');
    if (!sourceId || !targetId || sourceId === targetId) {
      setDraggedStudioId(null);
      setDragOverStudioId(null);
      return;
    }

    setStudioDramas(prev => {
      const fromIdx = prev.findIndex(d => d.id === sourceId);
      const toIdx = prev.findIndex(d => d.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;

      const newItems = [...prev];
      const [moved] = newItems.splice(fromIdx, 1);
      newItems.splice(toIdx, 0, moved);
      return newItems.map((d, idx) => ({ ...d, priority: idx + 1 }));
    });

    setIsStudioDirty(true);
    setDraggedStudioId(null);
    setDragOverStudioId(null);
  };

  const handleStudioDragEnd = () => {
    setDraggedStudioId(null);
    setDragOverStudioId(null);
  };

  // Priority Studio: Save batch reordered list to backend
  const handleStudioSave = async () => {
    setIsSavingStudio(true);
    try {
      const items = studioDramas.map((d, idx) => ({
        id: d.id,
        priority: idx + 1
      }));
      await dramaService.reorderDramas(items);
      setDramas(studioDramas.map((d, idx) => ({ ...d, priority: idx + 1 })));
      setIsStudioDirty(false);
      showToast('Priority catalog saved and normalized successfully!', 'success');
      setIsPriorityStudioOpen(false);
    } catch (err) {
      console.error('Batch save priority failed:', err);
      showToast('Failed to save priority order: ' + (err.message || 'Server error'), 'error');
    } finally {
      setIsSavingStudio(false);
    }
  };

  // Priority Studio: Reset changes
  const handleStudioReset = () => {
    const sorted = [...dramas].sort((a, b) => (Number(a.priority) || 999) - (Number(b.priority) || 999));
    setStudioDramas(sorted);
    setIsStudioDirty(false);
    showToast('Reverted priority changes to server state', 'info');
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

  // Reconcile and synchronize real stream view counts
  const handleReconcileViews = async (id, title) => {
    try {
      const res = await dramaService.reconcileViews(id);
      showToast(`Reconciled views for "${title}". Verified streams: ${res?.reconciledViews ?? 'synced'}`, 'success');
      loadDramas();
    } catch (err) {
      console.error('Reconcile views failed:', err);
      showToast('Failed to reconcile views: ' + (err.message || 'Server error'), 'error');
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
          <div className="relative flex items-center bg-slate-50 dark:bg-[#18181E] px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-xs">
            <Lock className="w-3 h-3 text-slate-400 mr-1.5 shrink-0" />
            <select
              value={selectedAccess}
              onChange={(e) => setSelectedAccess(e.target.value)}
              className="appearance-none bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer text-xs pr-5"
            >
              <option value="ALL" className="dark:bg-[#1E1E26]">All Access</option>
              <option value="PAID" className="dark:bg-[#1E1E26]">Paid</option>
              <option value="FREE" className="dark:bg-[#1E1E26]">Free</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
          </div>

          {/* Genre Dropdown */}
          <div className="relative flex items-center bg-slate-50 dark:bg-[#18181E] px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-xs">
            <span className="text-slate-400 font-medium text-[11px] mr-1.5 shrink-0">Genre:</span>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="appearance-none bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer text-xs pr-5"
            >
              {genres.map(g => (
                <option key={g} value={g} className="dark:bg-[#1E1E26]">
                  {g === 'ALL' ? 'All Genres' : g}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
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
          <div className="relative flex items-center shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#FEF08A] cursor-pointer"
            >
              <option value="priority" className="dark:bg-[#1E1E26]">Priority Rank</option>
              <option value="views" className="dark:bg-[#1E1E26]">Most Views</option>
              <option value="episodes" className="dark:bg-[#1E1E26]">Most Episodes</option>
              <option value="newest" className="dark:bg-[#1E1E26]">Newest</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
          </div>

          <span className="text-[11px] text-slate-400 font-medium shrink-0 hidden sm:inline px-2 py-1 rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10">
            <strong className="text-slate-900 dark:text-white font-bold">{filteredDramas.length}</strong> series
          </span>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadDramas}
            disabled={isLoading}
            className="w-9 h-9 flex items-center justify-center bg-slate-50 hover:bg-slate-100 dark:bg-[#18181E] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-full transition-all cursor-pointer active:scale-90 hover:scale-105 shadow-sm shrink-0"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          {/* Upload Series CTA */}
          <button
            type="button"
            onClick={() => (onNavigate ? onNavigate('upload') : onOpenIngestModal?.())}
            className="py-1.5 px-3.5 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Upload Series</span>
          </button>
        </div>

      </div>

      {/* Main Content: Loading, Empty, Grid, or Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#121216] rounded-xl border border-slate-200/80 dark:border-white/10 shadow-nodus overflow-hidden">
          <PageLoader text="Loading series..." minHeight="min-h-[280px]" />
        </div>
      ) : filteredDramas.length === 0 ? (
        <div className="bg-white dark:bg-[#121216] rounded-xl p-10 text-center border border-slate-200/80 dark:border-white/10 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs mx-auto mb-2.5">
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
      ) : (

        /* TABLE VIEW: Compact, Clean Studio Catalog Table */
        <div className="bg-white dark:bg-[#121216] rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/75 dark:bg-[#18181E] border-b border-slate-200/70 dark:border-white/10 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 w-24 text-center">Rank</th>
                  <th className="py-2.5 px-3 min-w-[200px] text-left">Series Title</th>
                  <th className="py-2.5 px-3 min-w-[140px] max-w-[260px] text-left">Genres</th>
                  <th className="py-2.5 px-3 w-20 text-center">Episodes</th>
                  <th className="py-2.5 px-3 w-20 text-center">Views</th>
                  <th className="py-2.5 px-3 w-24 text-center">Access</th>
                  <th className="py-2.5 px-3 w-28 text-center">Status</th>
                  <th className="py-2.5 pr-4 pl-3 w-20 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                {filteredDramas.map((drama) => (
                  <tr
                    key={drama.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Minimal Rounded Priority Stepper Capsule with Micro-Animations */}
                    <td className="py-2 px-3 align-middle text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center bg-slate-100/90 dark:bg-[#18181E] border border-slate-200/80 dark:border-white/10 rounded-full px-1 py-0.5 shadow-2xs hover:border-amber-400/40 dark:hover:border-[#FEF08A]/30 transition-all duration-200 group/stepper">
                        <button
                          type="button"
                          onClick={() => handleMovePriority(drama.id, 'up')}
                          disabled={drama.priority <= 1}
                          title="Move Priority Up"
                          className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-[#FEF08A] hover:bg-white dark:hover:bg-white/10 active:scale-90 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer transition-all duration-150 group/up"
                        >
                          <ChevronUp className="w-3.5 h-3.5 stroke-[2.2] transition-transform duration-200 group-hover/up:-translate-y-0.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setQuickPriorityDrama(drama);
                            setQuickRankInput(drama.priority);
                          }}
                          className={`min-w-[26px] h-5 px-1 rounded-full flex items-center justify-center text-xs tabular-nums cursor-pointer transition-all duration-150 active:scale-90 hover:scale-105 ${
                            drama.priority === 1
                              ? 'text-amber-500 dark:text-[#FEF08A] font-black'
                              : drama.priority <= 3
                              ? 'text-amber-600 dark:text-amber-300 font-extrabold'
                              : 'text-slate-700 dark:text-slate-300 font-bold'
                          }`}
                          title={`Rank #${drama.priority}. Click to jump rank directly.`}
                        >
                          {drama.priority}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMovePriority(drama.id, 'down')}
                          disabled={drama.priority >= dramas.length}
                          title="Move Priority Down"
                          className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-[#FEF08A] hover:bg-white dark:hover:bg-white/10 active:scale-90 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer transition-all duration-150 group/down"
                        >
                          <ChevronDown className="w-3.5 h-3.5 stroke-[2.2] transition-transform duration-200 group-hover/down:translate-y-0.5" />
                        </button>
                      </div>
                    </td>

                    {/* Series Title & Proportional Thumbnail */}
                    <td className="py-2 px-3 align-middle">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={drama.poster}
                          alt={drama.title}
                          onClick={() => setManagingDrama(drama)}
                          className="w-[26px] h-[34px] rounded-md object-cover bg-slate-900 border border-slate-200/80 dark:border-white/10 cursor-pointer hover:opacity-90 transition-opacity shadow-2xs shrink-0"
                        />
                        <button
                          type="button"
                          onClick={() => setManagingDrama(drama)}
                          title={drama.title}
                          className="font-bold text-slate-900 dark:text-white text-xs hover:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer truncate text-left"
                        >
                          {drama.title}
                        </button>
                      </div>
                    </td>

                    {/* Genres */}
                    <td className="py-2 px-3 align-middle text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                      <div className="max-w-[220px] lg:max-w-[280px] truncate" title={Array.isArray(drama.genres) ? drama.genres.join(', ') : ''}>
                        {Array.isArray(drama.genres) && drama.genres.length > 0 ? drama.genres.join(', ') : '—'}
                      </div>
                    </td>

                    {/* Episodes */}
                    <td className="py-2 px-3 align-middle text-center text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                      {drama.totalEpisodes}
                    </td>

                    {/* Views */}
                    <td className="py-2 px-3 align-middle text-center text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                      {drama.views}
                    </td>

                    {/* Access (Paid / Free) */}
                    <td className="py-2 px-3 align-middle text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePaid(drama.id)}
                        className="cursor-pointer active:scale-95 transition-transform inline-flex"
                        title="Click to toggle Paid/Free access"
                      >
                        <Badge
                          variant={drama.isPaid ? 'paid' : 'free'}
                          label={drama.isPaid ? 'Paid' : 'Free'}
                          size="xs"
                        />
                      </button>
                    </td>

                    {/* Status (Active / Draft) */}
                    <td className="py-2 px-3 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <ToggleSwitch
                          checked={Boolean(drama.isActive)}
                          onChange={() => handleToggleActive(drama.id)}
                          size="sm"
                          title={drama.isActive ? 'Active (Click to hide)' : 'Draft (Click to publish)'}
                        />
                        <span className={`text-[10px] font-bold w-9 text-left ${drama.isActive ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                          {drama.isActive ? 'Active' : 'Draft'}
                        </span>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="py-2 pr-4 pl-3 align-middle text-right">
                      <div className="inline-flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => handleReconcileViews(drama.id, drama.title)}
                          title="Reconcile Real Streams (Sync with episode views)"
                          className="p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
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
          <div className="px-4 py-2 bg-slate-50/70 dark:bg-[#18181E]/90 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
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
              <span className="inline-flex items-center gap-1 text-slate-400">
                Paid: <strong className="text-slate-700 dark:text-slate-200">{dramas.filter(d => d.isPaid).length}</strong>
              </span>
              <span className="inline-flex items-center gap-1 text-slate-400">
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

      {/* ── QUICK DIRECT PRIORITY MODAL ─────────────────────────── */}
      {quickPriorityDrama && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#24242E] rounded-2xl w-full max-w-md shadow-2xl border border-slate-200/90 dark:border-white/15 overflow-hidden font-urbanist animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/70 dark:bg-[#1E1E26]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                  <ArrowUpDown className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    Set Priority Rank
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Determines position on home feeds & carousels
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickPriorityDrama(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Preview & Form */}
            <div className="p-4 space-y-4">
              {/* Target Drama Info Card */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#18181E] border border-slate-200/70 dark:border-white/10">
                <img
                  src={quickPriorityDrama.poster}
                  alt={quickPriorityDrama.title}
                  className="w-12 h-16 rounded-lg object-cover bg-slate-900 shrink-0 shadow-xs"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {quickPriorityDrama.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {Array.isArray(quickPriorityDrama.genres) ? quickPriorityDrama.genres.join(' • ') : 'Drama'}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-[#FEF08A] border border-amber-500/20">
                      Current Rank: #{quickPriorityDrama.priority}
                    </span>
                    <span className="text-[10px] text-slate-400">of {dramas.length} series</span>
                  </div>
                </div>
              </div>

              {/* Rank Input Controller */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Target Priority Rank (1 to {dramas.length})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickRankInput(prev => Math.max(1, Number(prev) - 1))}
                    disabled={Number(quickRankInput) <= 1}
                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-[#FEF08A] hover:text-slate-950 font-black text-sm flex items-center justify-center cursor-pointer transition-all duration-200 disabled:opacity-20 active:scale-90 hover:scale-105"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={dramas.length}
                    value={quickRankInput}
                    onChange={(e) => setQuickRankInput(Math.max(1, Math.min(dramas.length, Number(e.target.value) || 1)))}
                    className="flex-1 h-9 text-center font-black text-base rounded-full border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-[#18181E] text-slate-950 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60"
                  />
                  <button
                    type="button"
                    onClick={() => setQuickRankInput(prev => Math.min(dramas.length, Number(prev) + 1))}
                    disabled={Number(quickRankInput) >= dramas.length}
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
                        : 'bg-slate-100 dark:bg-[#18181E] text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-white/10 hover:border-amber-300/40'
                    }`}
                  >
                    👑 #1 Top
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickRankInput(prev => Math.max(1, Number(prev) - 1))}
                    className="py-1.5 px-2 rounded-full text-xs font-bold bg-slate-100 dark:bg-[#18181E] text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-white/10 hover:border-amber-300/40 cursor-pointer transition-all duration-200 active:scale-95"
                  >
                    ⬆ Move Up
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickRankInput(prev => Math.min(dramas.length, Number(prev) + 1))}
                    className="py-1.5 px-2 rounded-full text-xs font-bold bg-slate-100 dark:bg-[#18181E] text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-white/10 hover:border-amber-300/40 cursor-pointer transition-all duration-200 active:scale-95"
                  >
                    ⬇ Move Down
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickRankInput(dramas.length)}
                    className={`py-1.5 px-2 rounded-full text-xs font-bold border transition-all duration-200 active:scale-95 cursor-pointer ${
                      Number(quickRankInput) === dramas.length
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
                onClick={() => setQuickPriorityDrama(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSetDirectRank(quickPriorityDrama.id, quickRankInput);
                  setQuickPriorityDrama(null);
                }}
                className="px-4 py-1.5 text-xs font-bold bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 rounded-full transition-all duration-200 shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Apply Rank</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENT PRIORITY STUDIO (DRAG & REORDER MODAL) ─────────── */}
      {isPriorityStudioOpen && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/70 dark:bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#24242E] rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200/90 dark:border-white/15 flex flex-col max-h-[90vh] overflow-hidden font-urbanist animate-in zoom-in-95 duration-200">
            {/* Studio Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-[#1E1E26] flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                  <ArrowUpDown className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-950 dark:text-white tracking-tight">
                      Content Priority Studio
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF08A] text-slate-950 border border-amber-300/40">
                      {studioDramas.length} Series Ranked
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Drag items or set numeric ranks. Series #1 sits at the very top of mobile home feeds.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPriorityStudioOpen(false)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Box in Studio */}
            <div className="p-3 border-b border-slate-100 dark:border-white/10 bg-white dark:bg-[#202028] shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={studioSearch}
                  onChange={(e) => setStudioSearch(e.target.value)}
                  placeholder="Filter series in studio by title or genre..."
                  className="w-full pl-9 pr-8 py-2 text-xs font-semibold bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#FEF08A]"
                />
                {studioSearch && (
                  <button
                    onClick={() => setStudioSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Draggable Reorder List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 bg-slate-50/50 dark:bg-[#18181E]/60">
              {studioDramas
                .filter(d => {
                  const t = studioSearch.toLowerCase().trim();
                  if (!t) return true;
                  return d.title.toLowerCase().includes(t) || (Array.isArray(d.genres) && d.genres.some(g => g.toLowerCase().includes(t)));
                })
                .map((drama) => {
                  const actualIndex = studioDramas.findIndex(s => s.id === drama.id);
                  const isTopRank = drama.priority === 1;
                  const isTop3 = drama.priority <= 3;
                  const isOver = dragOverStudioId === drama.id;

                  return (
                    <div
                      key={drama.id}
                      draggable
                      onDragStart={(e) => handleStudioDragStart(e, drama.id)}
                      onDragOver={(e) => handleStudioDragOver(e, drama.id)}
                      onDrop={(e) => handleStudioDrop(e, drama.id)}
                      onDragEnd={handleStudioDragEnd}
                      className={`group flex items-center gap-2.5 p-2 rounded-xl transition-all select-none cursor-move border ${
                        isOver
                          ? 'bg-amber-500/15 border-amber-400 shadow-md scale-[1.01]'
                          : isTopRank
                          ? 'bg-amber-500/5 dark:bg-[#24242E] border-amber-300/40 shadow-2xs'
                          : 'bg-white dark:bg-[#1E1E26] border-slate-200/70 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      {/* Drag Grip Handle */}
                      <div className="text-slate-300 dark:text-slate-500 group-hover:text-amber-500 transition-colors shrink-0">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Rank Badge */}
                      <div className="shrink-0 w-8 flex justify-center">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs tabular-nums border shadow-2xs ${
                            isTopRank
                              ? 'bg-[#FEF08A] text-slate-950 border-amber-300 font-black shadow-xs ring-1 ring-amber-400/30'
                              : isTop3
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300/40'
                              : 'bg-slate-100 dark:bg-[#141419] text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-white/10'
                          }`}
                        >
                          #{drama.priority}
                        </span>
                      </div>

                      {/* Poster Preview */}
                      <img
                        src={drama.poster}
                        alt={drama.title}
                        className="w-8 h-11 rounded-md object-cover bg-slate-900 border border-slate-200/80 dark:border-white/10 shrink-0 shadow-2xs"
                      />

                      {/* Title & Metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {drama.title}
                          </h4>
                          {isTopRank && (
                            <span className="px-1.5 py-0.2 rounded-md bg-[#FEF08A] text-slate-950 font-black text-[9px] uppercase tracking-wide shrink-0">
                              Top Pick
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {Array.isArray(drama.genres) ? drama.genres.join(', ') : 'Drama'} • {drama.totalEpisodes} Eps • {drama.views} Plays
                        </p>
                      </div>

                      {/* Status Tag */}
                      <div className="hidden sm:block shrink-0">
                        <Badge
                          variant={drama.isActive ? 'active' : 'draft'}
                          label={drama.isActive ? 'Active' : 'Draft'}
                          size="xs"
                        />
                      </div>

                      {/* Direct Numeric Input */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-slate-400 font-bold hidden md:inline">Rank:</span>
                        <input
                          type="number"
                          min={1}
                          max={studioDramas.length}
                          value={drama.priority}
                          onChange={(e) => handleStudioDirectRank(drama.id, e.target.value)}
                          className="w-12 h-6 text-center font-bold text-xs rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121216] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#FEF08A]"
                        />
                      </div>

                      {/* Micro Action Buttons */}
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStudioMoveToTop(drama.id)}
                          disabled={actualIndex === 0}
                          title="Hoist to Rank #1"
                          className="p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-20 cursor-pointer transition-colors"
                        >
                          <Crown className="w-3.5 h-3.5 stroke-[2.2]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStudioMoveUp(actualIndex)}
                          disabled={actualIndex === 0}
                          title="Move Up"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-20 cursor-pointer transition-colors"
                        >
                          <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStudioMoveDown(actualIndex)}
                          disabled={actualIndex === studioDramas.length - 1}
                          title="Move Down"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-20 cursor-pointer transition-colors"
                        >
                          <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Studio Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-[#1E1E26] flex items-center justify-between shrink-0">
              <div>
                {isStudioDirty ? (
                  <span className="flex items-center gap-1.5 text-amber-500 dark:text-[#FEF08A] text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Unsaved rank adjustments made
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Priority catalog in sync with database
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {isStudioDirty && (
                  <button
                    type="button"
                    onClick={handleStudioReset}
                    className="py-1.5 px-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsPriorityStudioOpen(false)}
                  className="py-1.5 px-3 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleStudioSave}
                  disabled={isSavingStudio || !isStudioDirty}
                  className="py-1.5 px-4 text-xs font-bold bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-40 disabled:hover:bg-[#FACC15] flex items-center space-x-1.5"
                >
                  {isSavingStudio ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Catalog...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Save Priority Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION ────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[100000] animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-950 dark:bg-[#1E1E26] text-white text-xs font-bold shadow-xl border border-white/15">
            <span className="w-2 h-2 rounded-full bg-[#FEF08A] shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}
