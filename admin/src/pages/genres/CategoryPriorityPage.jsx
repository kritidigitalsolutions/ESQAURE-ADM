import React, { useState, useEffect, useMemo } from 'react';
import { homeService } from '../../services/homeService';
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
  Eye,
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
  ShieldAlert
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
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'CATEGORIES' | 'FEATURED' | 'ACTIVE' | 'HIDDEN'

  // Tracks whether local priority has been modified
  const [isDirty, setIsDirty] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
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
      if (filterType === 'FEATURED') matchesFilter = s.sectionType !== 'GENRE';
      if (filterType === 'ACTIVE') matchesFilter = !!s.isActive;
      if (filterType === 'HIDDEN') matchesFilter = !s.isActive;

      return matchesSearch && matchesFilter;
    });
  }, [sections, searchTerm, filterType]);

  // Counts for filter tabs
  const categoryCount = useMemo(() => sections.filter((s) => s.sectionType === 'GENRE').length, [sections]);
  const featuredCount = useMemo(() => sections.filter((s) => s.sectionType !== 'GENRE').length, [sections]);
  const activeCount = useMemo(() => sections.filter((s) => s.isActive).length, [sections]);

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
    showToast(`"${target.title}" set to Top Priority (Rank 1)`, 'info');
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
        `"${target.title}" is now ${newActiveState ? 'active on Homepage' : 'hidden from Homepage'}`,
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
      showToast('Homepage section priority ranks saved successfully!', 'success');
    } catch (err) {
      console.error('Batch save priority error:', err);
      showToast('Failed to save priority order: ' + (err.message || 'Server error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper for Section Icon & Color
  const getSectionIconInfo = (section) => {
    if (section.sectionType === 'TRENDING') {
      return { Icon: Flame, color: '#F59E0B' };
    }
    if (section.sectionType === 'POPULAR' || section.sectionType === 'POPULAR_GENRES') {
      return { Icon: Sparkles, color: '#EC4899' };
    }
    if (section.sectionType === 'NEW_RELEASES') {
      return { Icon: Zap, color: '#3B82F6' };
    }
    if (section.genreId && section.genreId.icon) {
      const Comp = ICON_MAP[section.genreId.icon] || Tags;
      return { Icon: Comp, color: section.genreId.color || '#F59E0B' };
    }
    return { Icon: Layers, color: '#8B5CF6' };
  };

  // Helper for Section Type Label
  const getSectionTypeLabel = (section) => {
    if (section.sectionType === 'TRENDING') {
      return { label: 'Trending Section', style: 'text-amber-500 bg-amber-400/10 border-amber-400/20' };
    }
    if (section.sectionType === 'POPULAR' || section.sectionType === 'POPULAR_GENRES') {
      return { label: 'Popular Genres', style: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
    }
    if (section.sectionType === 'NEW_RELEASES') {
      return { label: 'New Releases', style: 'text-sky-400 bg-sky-500/10 border-sky-500/20' };
    }
    if (section.sectionType === 'GENRE') {
      return { label: 'Category Section', style: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
    }
    return { label: 'Curated Section', style: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  };

  return (
    <div className="space-y-6 font-urbanist selection:bg-[#FEF08A] selection:text-black pb-14">

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

      {/* Top Header Card with Save Action */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-white/10 shadow-nodus relative overflow-hidden transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center shrink-0 shadow-xs">
              <SlidersHorizontal className="w-6 h-6 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                  Homepage Section Priority Manager
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#FEF08A] text-slate-950 shadow-xs">
                  Home Feed Curation
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                Decide the exact rank priority (1, 2, 3...) for sections and category trays on the mobile app homepage feed.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0 self-start md:self-center">
            {/* Refresh Button */}
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-white/10 text-xs font-bold transition-all cursor-pointer"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* Save Priority Order CTA */}
            <button
              onClick={handleSavePriorityOrder}
              disabled={isSaving || !isDirty}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer shadow-xs ${
                isDirty
                  ? 'bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 shadow-md ring-2 ring-amber-400/50 animate-pulse'
                  : 'bg-slate-200/80 dark:bg-white/[0.08] text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Save className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>{isDirty ? 'Save Priority Order' : 'Priority Saved'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-nodus flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sections by title or slug..."
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

          {/* Quick Filter Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'All Sections', count: sections.length },
              { id: 'CATEGORIES', label: 'Category Sections', count: categoryCount },
              { id: 'FEATURED', label: 'Featured (Trending/Popular)', count: featuredCount },
              { id: 'ACTIVE', label: 'Active', count: activeCount },
              { id: 'HIDDEN', label: 'Hidden', count: sections.length - activeCount }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-[#FEF08A] text-slate-950 font-extrabold shadow-xs'
                    : 'bg-slate-100 dark:bg-[#161B16] text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white border border-slate-200/70 dark:border-white/10'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                    filterType === tab.id
                      ? 'bg-black/15 text-slate-950'
                      : 'bg-black/10 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onNavigate && onNavigate('genres')}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer shrink-0 self-start md:self-center"
        >
          Manage Categories
        </button>
      </div>

      {/* Main Priority Reorder Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FEF08A]" />
          <p className="text-xs font-bold">Loading homepage section priority feed...</p>
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-12 text-center border border-slate-200/80 dark:border-white/10 shadow-nodus">
          <div className="w-14 h-14 rounded-2xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 mx-auto mb-3 shadow-xs">
            <SlidersHorizontal className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
            No matching sections found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or filter.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#121612] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-nodus overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-urbanist">
              <thead className="bg-slate-50/70 dark:bg-[#161B16]/80 border-b border-slate-200/80 dark:border-white/10 text-slate-400 dark:text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-center w-16">Rank</th>
                  <th className="py-3 px-4">Section / Category</th>
                  <th className="py-3 px-4 text-center w-36">Section Type</th>
                  <th className="py-3 px-4 text-center w-28">Content</th>
                  <th className="py-3 px-4 text-center w-28">Status</th>
                  <th className="py-3 px-4 text-right w-28 pr-6">Priority</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filteredSections.map((section, index) => {
                  const { Icon, color } = getSectionIconInfo(section);
                  const typeInfo = getSectionTypeLabel(section);
                  const isTop = index === 0;
                  const isBottom = index === filteredSections.length - 1;

                  return (
                    <tr
                      key={section.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Priority Rank (Clean number without #) */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center text-xs ${
                            index === 0
                              ? 'w-6 h-6 rounded-lg bg-[#FEF08A] text-slate-950 font-black shadow-xs'
                              : 'w-6 h-6 font-semibold text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>

                      {/* Section Title & Slug */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-xs"
                            style={{
                              backgroundColor: `${color}15`,
                              borderColor: `${color}25`,
                              color: color
                            }}
                          >
                            <Icon className="w-4 h-4 stroke-[2]" />
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                {section.title}
                              </span>
                              {index === 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FEF08A]/30 text-amber-700 dark:text-amber-300 border border-amber-300/40 uppercase tracking-wide">
                                  Top 1 Row
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                              /{section.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Section Type Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${typeInfo.style}`}>
                          {typeInfo.label}
                        </span>
                      </td>

                      {/* Content / Drama Count */}
                      <td className="py-3.5 px-4 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                        {section.dramaCount || 0} series
                      </td>

                      {/* Status Dot Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(section.id)}
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
                          title="Click to toggle Active / Hidden"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              section.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span
                            className={
                              section.isActive
                                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                : 'text-slate-400 dark:text-slate-500'
                            }
                          >
                            {section.isActive ? 'Active' : 'Hidden'}
                          </span>
                        </button>
                      </td>

                      {/* Shift Priority & Top Actions */}
                      <td className="py-3.5 px-4 text-right pr-6">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={isTop}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] disabled:opacity-20 disabled:hover:bg-transparent transition-all cursor-pointer"
                            title="Shift Up"
                          >
                            <ChevronUp className="w-4 h-4 stroke-[2.2]" />
                          </button>

                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={isBottom}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] disabled:opacity-20 disabled:hover:bg-transparent transition-all cursor-pointer"
                            title="Shift Down"
                          >
                            <ChevronDown className="w-4 h-4 stroke-[2.2]" />
                          </button>

                          <button
                            onClick={() => handleMoveToTop(section.id)}
                            disabled={isTop}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-400/10 disabled:opacity-20 disabled:hover:bg-transparent transition-all cursor-pointer"
                            title="Move directly to Rank 1"
                          >
                            <ChevronsUp className="w-4 h-4 stroke-[2.2]" />
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
