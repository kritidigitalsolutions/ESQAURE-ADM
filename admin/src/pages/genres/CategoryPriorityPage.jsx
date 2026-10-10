import React, { useState, useEffect, useMemo } from 'react';
import { homeService } from '../../services/homeService';
import PageLoader from '../../components/common/PageLoader';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import {
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  Save,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Tv,
  Tags,
  Sparkles,
  Flame,
  Zap,
  Loader2,
  X,
  Layers,
  Film,
  Compass,
  Smile,
  Heart,
  Briefcase,
  ShieldAlert,
  GripVertical,
  ArrowUpRight
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
  Film,
  Layers
};

export default function CategoryPriorityPage({ onNavigate }) {
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'CATEGORIES' | 'CURATED' | 'ACTIVE' | 'HIDDEN'

  // Tracks whether local priority has been modified
  const [isDirty, setIsDirty] = useState(false);

  // Drag-and-drop reorder state for moving dots handle
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch live homepage sections
  const fetchData = async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const res = await homeService.getAdminSections();
      if (res?.sections) {
        const sorted = [...res.sections].sort(
          (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
        );
        setSections(sorted);
      }
    } catch (err) {
      console.error('Failed to load homepage sections:', err);
      setError(err.message || 'Failed to connect to backend service.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsDirty(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered sections list
  const filteredSections = useMemo(() => {
    return sections.filter((s) => {
      const matchesSearch =
        !searchTerm.trim() ||
        s.title.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        s.slug.toLowerCase().includes(searchTerm.toLowerCase().trim());

      let matchesFilter = true;
      if (filterType === 'CATEGORIES') matchesFilter = s.sectionType === 'GENRE';
      if (filterType === 'CURATED') matchesFilter = s.sectionType !== 'GENRE';
      if (filterType === 'ACTIVE') matchesFilter = !!s.isActive;
      if (filterType === 'HIDDEN') matchesFilter = !s.isActive;

      return matchesSearch && matchesFilter;
    });
  }, [sections, searchTerm, filterType]);

  // Counts for filter tabs
  const categoryCount = useMemo(() => sections.filter((s) => s.sectionType === 'GENRE').length, [sections]);
  const curatedCount = useMemo(() => sections.filter((s) => s.sectionType !== 'GENRE').length, [sections]);
  const activeCount = useMemo(() => sections.filter((s) => s.isActive).length, [sections]);
  const hiddenCount = useMemo(() => sections.length - activeCount, [sections, activeCount]);

  const filterTabs = useMemo(() => [
    { id: 'ALL', label: 'All', count: sections.length },
    { id: 'CATEGORIES', label: 'Categories', count: categoryCount },
    { id: 'CURATED', label: 'Featured', count: curatedCount },
    { id: 'ACTIVE', label: 'Active', count: activeCount },
    { id: 'HIDDEN', label: 'Hidden', count: hiddenCount }
  ], [sections.length, categoryCount, curatedCount, activeCount, hiddenCount]);

  const selectedTabIndex = useMemo(() => {
    const idx = filterTabs.findIndex((t) => t.id === filterType);
    return idx >= 0 ? idx : 0;
  }, [filterTabs, filterType]);

  // Shift Up
  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index - 1];
    newSections[index - 1] = temp;

    const updated = newSections.map((s, idx) => ({
      ...s,
      displayOrder: idx + 1
    }));

    setSections(updated);
    setIsDirty(true);
  };

  // Shift Down
  const handleMoveDown = (index) => {
    if (index >= sections.length - 1) return;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index + 1];
    newSections[index + 1] = temp;

    const updated = newSections.map((s, idx) => ({
      ...s,
      displayOrder: idx + 1
    }));

    setSections(updated);
    setIsDirty(true);
  };

  // Move to Top (Rank 1)
  const handleMoveToTop = (id) => {
    const currentIdx = sections.findIndex((s) => s.id === id);
    if (currentIdx <= 0) return;

    const target = sections[currentIdx];
    const remaining = sections.filter((s) => s.id !== id);
    const newSections = [target, ...remaining];

    const updated = newSections.map((s, idx) => ({
      ...s,
      displayOrder: idx + 1
    }));

    setSections(updated);
    setIsDirty(true);
    showToast(`"${target.title}" moved to Rank 1`, 'info');
  };

  // HTML5 Drag and Drop handlers for moving dots handle
  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    const sourceId = draggedId || e.dataTransfer.getData('text/plain');
    if (!sourceId || !targetId || sourceId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    setSections((prev) => {
      const fromIndex = prev.findIndex((s) => s.id === sourceId);
      const toIndex = prev.findIndex((s) => s.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const newSections = [...prev];
      const [movedItem] = newSections.splice(fromIndex, 1);
      newSections.splice(toIndex, 0, movedItem);

      return newSections.map((s, idx) => ({
        ...s,
        displayOrder: idx + 1
      }));
    });

    setIsDirty(true);
    setDraggedId(null);
    setDragOverId(null);
    showToast('Section order changed. Remember to click "Save Order".', 'info');
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // Toggle section active/hidden
  const handleToggleActive = async (id) => {
    const target = sections.find((s) => s.id === id);
    if (!target) return;

    const newActiveState = !target.isActive;
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: newActiveState } : s))
    );
    setIsDirty(true);

    try {
      await homeService.toggleSectionStatus(id);
      showToast(
        `"${target.title}" ${newActiveState ? 'activated' : 'hidden'}`,
        'info'
      );
    } catch (err) {
      console.error('Toggle section error:', err);
      // rollback
      setSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: !newActiveState } : s))
      );
    }
  };

  // Save Batch Reordered Priority to Backend
  const handleSavePriorityOrder = async () => {
    setIsSaving(true);
    try {
      const items = sections.map((s, idx) => ({
        id: s.id,
        displayOrder: idx + 1,
        isActive: Boolean(s.isActive)
      }));

      await homeService.reorderSections(items);
      setIsDirty(false);
      showToast('Priority ranks saved successfully', 'success');
    } catch (err) {
      console.error('Batch save priority error:', err);
      showToast('Failed to save priority order: ' + (err.message || 'Server error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Consistent Theme-Based Icon Resolver (Zero rainbow colors)
  const getSectionIcon = (section) => {
    if (section.sectionType === 'TRENDING') return Flame;
    if (section.sectionType === 'POPULAR' || section.sectionType === 'POPULAR_GENRES') return Sparkles;
    if (section.sectionType === 'NEW_RELEASES') return Zap;
    if (section.genreId && section.genreId.icon) {
      return ICON_MAP[section.genreId.icon] || Tags;
    }
    return Layers;
  };

  // Consistent Clean Type Label Resolver
  const getSectionTypeLabel = (section) => {
    if (section.sectionType === 'TRENDING') return 'Trending';
    if (section.sectionType === 'POPULAR' || section.sectionType === 'POPULAR_GENRES') return 'Popular';
    if (section.sectionType === 'NEW_RELEASES') return 'New Releases';
    if (section.sectionType === 'GENRE') return 'Category';
    return 'Curated';
  };

  return (
    <div className="space-y-3 font-urbanist selection:bg-[#FACC15] selection:text-slate-950 pb-8 animate-fade-in text-xs">

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in duration-150">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-xl border text-xs font-semibold ${
              toast.type === 'error'
                ? 'bg-rose-950 text-rose-200 border-rose-800'
                : toast.type === 'info'
                ? 'bg-[#18181E] text-white border-white/20'
                : 'bg-[#121216] text-amber-300 border-amber-400/30'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-white/40 hover:text-white ml-1.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. COMPACT MINIMAL HEADER
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121216] rounded-xl px-4 py-3 border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Title, Badge & Clean Inline Metadata */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
            <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white tracking-tight">
                Section Priority Manager
              </h1>
              {isDirty && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Unsaved Ranks
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{sections.length} total sections</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">{activeCount} active</span>
              {hiddenCount > 0 && (
                <>
                  <span>•</span>
                  <span>{hiddenCount} hidden</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-[#18181E] text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/[0.06] border border-slate-200/90 dark:border-white/10 text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 leading-none disabled:opacity-50"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleSavePriorityOrder}
            disabled={isSaving || !isDirty}
            className={`h-8 px-4 rounded-lg font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer leading-none active:scale-[0.98] ${
              isDirty
                ? 'bg-[#FACC15] hover:bg-[#EAB308] active:bg-[#CA8A04] text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-white/[0.05] text-slate-400 dark:text-slate-500 border border-slate-200/80 dark:border-white/5 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950 stroke-[2.2]" />
            ) : (
              <Save className="w-3.5 h-3.5 text-slate-950 stroke-[2.2]" />
            )}
            <span>{isSaving ? 'Saving...' : isDirty ? 'Save Order' : 'Saved'}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. COMPACT SEARCH & FILTER CONTROLS BAR
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121216] rounded-xl px-3 py-2 border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
        
        {/* Search Input & Segmented Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-56 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search section..."
              className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs bg-slate-100/90 dark:bg-[#18181E] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#121216] focus:border-[#FACC15] focus:outline-hidden transition-all font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Segmented Sliding Toggle Track (Smooth Sliding Indicator) */}
          <div className="relative bg-slate-100/90 dark:bg-[#18181E] p-1 rounded-xl border border-slate-200/70 dark:border-white/10 shadow-2xs w-full sm:w-[460px] max-w-full">
            {/* Smooth Sliding Active Indicator Pill */}
            <span
              className="absolute top-1 bottom-1 left-1 rounded-lg bg-[#FEF08A] shadow-xs transition-transform duration-300 ease-out pointer-events-none border border-amber-300/70"
              style={{
                width: 'calc((100% - 8px) / 5)',
                transform: `translateX(${selectedTabIndex * 100}%)`,
              }}
            />

            {/* 5 Equal Column Buttons */}
            <div className="grid grid-cols-5 relative z-10 w-full items-center">
              {filterTabs.map((tab) => {
                const isSelected = filterType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterType(tab.id)}
                    className={`h-7 px-1 text-[11px] sm:text-xs font-bold text-center flex items-center justify-center gap-1 transition-colors duration-200 select-none cursor-pointer leading-none ${
                      isSelected
                        ? 'text-slate-950 font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    <span className="truncate">{tab.label}</span>
                    <span
                      className={`px-1 py-0.2 rounded text-[9.5px] sm:text-[10px] font-mono leading-none ${
                        isSelected
                          ? 'bg-black/15 text-slate-950 font-black'
                          : 'bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Manage Categories Link */}
        <button
          onClick={() => onNavigate && onNavigate('genres')}
          className="h-7 px-2.5 rounded-lg bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white text-xs font-semibold transition-all cursor-pointer shrink-0 inline-flex items-center gap-1 leading-none self-start md:self-center border border-slate-200/80 dark:border-white/10"
        >
          <Tags className="w-3 h-3 text-slate-400" />
          <span>Manage Categories</span>
          <ArrowUpRight className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. CLEAN & MINIMALIST LIST VIEW TABLE
         ───────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#121216] rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-hidden">
          <PageLoader text="Loading live sections..." minHeight="min-h-[260px]" />
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="bg-white dark:bg-[#121216] rounded-xl p-8 text-center border border-slate-200/90 dark:border-white/10 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            No sections match your search or filter.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('ALL');
            }}
            className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 text-xs font-bold transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#121216] rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-urbanist">
              <thead className="bg-slate-50/90 dark:bg-[#18181E] border-b border-slate-200/90 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">#</th>
                  <th className="py-2.5 px-3">Section Name</th>
                  <th className="py-2.5 px-3 text-center w-28">Type</th>
                  <th className="py-2.5 px-3 text-center w-24">Content</th>
                  <th className="py-2.5 px-3 text-center w-24">Status</th>
                  <th className="py-2.5 px-3 text-right w-28 pr-4">Order Priority</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filteredSections.map((section, index) => {
                  const Icon = getSectionIcon(section);
                  const typeLabel = getSectionTypeLabel(section);
                  const isTop = index === 0;
                  const isBottom = index === filteredSections.length - 1;

                  return (
                    <tr
                      key={section.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, section.id)}
                      onDragOver={(e) => handleDragOver(e, section.id)}
                      onDrop={(e) => handleDrop(e, section.id)}
                      onDragEnd={handleDragEnd}
                      className={`transition-all duration-150 group select-none ${
                        draggedId === section.id
                          ? 'opacity-40 bg-amber-400/10 border-2 border-dashed border-amber-400'
                          : dragOverId === section.id
                          ? 'bg-amber-400/20 dark:bg-amber-400/15 border-t-2 border-amber-400'
                          : isTop
                          ? 'bg-amber-400/[0.04] dark:bg-amber-400/[0.03] hover:bg-amber-400/[0.07]'
                          : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Compact Rank Number */}
                      <td className="py-2 px-3 text-center">
                        <div className="inline-flex items-center justify-center">
                          {isTop ? (
                            <span className="w-6 h-6 rounded-md bg-[#FACC15] text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                              1
                            </span>
                          ) : (
                            <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-[#18181E] text-slate-600 dark:text-slate-400 font-bold text-xs flex items-center justify-center border border-slate-200/70 dark:border-white/5">
                              {index + 1}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Section Info (Grip + Theme Icon + Title & Slug) */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2.5">
                          {/* Tactile Moving Dots Grip Handle */}
                          <div
                            className="p-1 -ml-1 rounded-md text-slate-400 dark:text-slate-500 group-hover:text-amber-500 hover:bg-amber-400/10 active:scale-95 cursor-grab active:cursor-grabbing transition-all flex items-center justify-center shrink-0"
                            title="Drag moving dots to reorder priority"
                          >
                            <GripVertical className="w-4 h-4 stroke-[2.2]" />
                          </div>

                          {/* Unified Theme Icon Badge (No rainbow colors) */}
                          <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 text-slate-950 dark:text-amber-300 flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                          </div>

                          {/* Title & Slug */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                {section.title}
                              </span>
                            </div>
                            <span className="text-[10.5px] font-mono text-slate-400 dark:text-slate-500 block leading-tight">
                              /{section.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Clean Theme Type Badge */}
                      <td className="py-2 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-slate-100 dark:bg-[#18181E] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                          {typeLabel}
                        </span>
                      </td>

                      {/* Drama / Content Count */}
                      <td className="py-2 px-3 text-center">
                        <span className="text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                          {section.dramaCount || 0} series
                        </span>
                      </td>

                      {/* Status Toggle with Smooth Sliding ToggleSwitch */}
                      <td className="py-2 px-3 text-center" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          <ToggleSwitch
                            checked={Boolean(section.isActive)}
                            onChange={() => handleToggleActive(section.id)}
                            activeColor="amber"
                            size="sm"
                            title={section.isActive ? 'Active on feed (Click to hide)' : 'Hidden from feed (Click to activate)'}
                          />
                          <span className={`text-[10.5px] font-semibold select-none ${section.isActive ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}>
                            {section.isActive ? 'Active' : 'Hidden'}
                          </span>
                        </div>
                      </td>

                      {/* Reorder Buttons (Compact) */}
                      <td className="py-2 px-3 text-right pr-4" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Move Up */}
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={isTop}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-slate-100 dark:bg-[#18181E] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5 stroke-[2.2]" />
                          </button>

                          {/* Move Down */}
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={isBottom}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-slate-100 dark:bg-[#18181E] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5 stroke-[2.2]" />
                          </button>

                          {/* Promote to Top Hero */}
                          <button
                            onClick={() => handleMoveToTop(section.id)}
                            disabled={isTop}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-amber-600 dark:text-amber-400 hover:text-slate-950 dark:hover:text-slate-950 bg-amber-50 dark:bg-amber-400/10 hover:bg-[#FACC15] border border-amber-300/60 dark:border-amber-400/20 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
                            title="Promote to Top"
                          >
                            <ChevronsUp className="w-3.5 h-3.5 stroke-[2.4]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
