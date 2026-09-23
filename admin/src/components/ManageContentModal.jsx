import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Film,
  Image as ImageIcon,
  Video,
  Upload,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Check,
  CheckCircle2,
  Sparkles,
  Flame,
  Crown,
  Subtitles,
  Eye,
  Play,
  Layers,
  FileVideo,
  Clock,
  ShieldCheck,
  AlertCircle,
  Sliders,
  Tv,
  Star,
  RefreshCw,
  FolderUp,
  Tag,
  FileText
} from 'lucide-react';
import { mockGenres, mockEpisodes } from '../data/mockOttData';

export default function ManageContentModal({ isOpen, drama, onClose, onSave }) {
  if (!isOpen || !drama) return null;

  // Tabs: 'info' | 'media' | 'episodes'
  const [activeTab, setActiveTab] = useState('info');

  // Form State
  const [title, setTitle] = useState(drama.title || '');
  const [synopsis, setSynopsis] = useState(drama.synopsis || '');
  const [selectedGenres, setSelectedGenres] = useState(drama.genres || ['Romance']);
  const [ageRating, setAgeRating] = useState('U/A 13+');
  const [status, setStatus] = useState(drama.status || 'PUBLISHED');
  const [isTrending, setIsTrending] = useState(drama.isTrending ?? false);
  const [isFeatured, setIsFeatured] = useState(drama.isFeatured ?? true);
  const [trendingRank, setTrendingRank] = useState(drama.trendingRank || 1);
  const [priority, setPriority] = useState(drama.priority || 1);

  // Media assets
  const [posterUrl, setPosterUrl] = useState(drama.poster || '');
  const [bannerUrl, setBannerUrl] = useState(drama.banner || '');
  const [trailerUrl, setTrailerUrl] = useState(drama.trailerUrl || '');
  const [posterFile, setPosterFile] = useState('poster_vertical_1080x1920.jpg');
  const [bannerFile, setBannerFile] = useState('hero_banner_1920x1080.jpg');
  const [trailerFile, setTrailerFile] = useState('teaser_trailer_vertical.mp4');

  // Episodes & Paywall
  const [totalEpisodes, setTotalEpisodes] = useState(drama.totalEpisodes || 24);
  const [freeEpisodes, setFreeEpisodes] = useState(drama.freeEpisodes || 3);
  const [episodesList, setEpisodesList] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Lock background scrolling
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  // Sync state when drama changes
  useEffect(() => {
    if (!drama) return;

    setTitle(drama.title || '');
    setSynopsis(drama.synopsis || '');
    setSelectedGenres(drama.genres || ['Romance']);
    setStatus(drama.status || 'PUBLISHED');
    setIsTrending(drama.isTrending ?? false);
    setIsFeatured(drama.isFeatured ?? true);
    setTrendingRank(drama.trendingRank || 1);
    setPriority(drama.priority || 1);
    setPosterUrl(drama.poster || '');
    setBannerUrl(drama.banner || '');
    setTrailerUrl(drama.trailerUrl || '');
    setTotalEpisodes(drama.totalEpisodes || 24);
    setFreeEpisodes(drama.freeEpisodes || 3);

    const existingEps = (drama.episodes && Array.isArray(drama.episodes) && drama.episodes.length > 0)
      ? drama.episodes
      : (() => {
          try {
            const saved = localStorage.getItem('esquare_episodes');
            if (saved) {
              const parsed = JSON.parse(saved);
              const found = parsed.filter(e => e.dramaId === drama.id);
              if (found.length > 0) return found;
            }
          } catch (e) {}
          return mockEpisodes.filter(e => e.dramaId === drama.id);
        })();

    if (existingEps.length > 0) {
      setEpisodesList(existingEps.map(e => ({
        ...e,
        videoFileName: e.fileName || `ep_${e.episodeNumber.toString().padStart(2, '0')}_1080p.mp4`,
        subtitleTracks: e.subtitles || ['English', 'Hindi']
      })));
    } else {
      const count = Math.min(drama.totalEpisodes || 12, 12);
      const freeCount = drama.freeEpisodes || 3;
      const sampleTitles = [
        'The First Encounter',
        'Hidden Intentions',
        'Truth Unveiled',
        'The Silent Betrayal',
        'Shadows of the Past',
        'The Power Play',
        'Dangerous Secrets',
        'Midnight Alliance',
        'A Fateful Decision',
        'Breaking the Chains',
        'The Billionaire\'s Revenge',
        'The Final Standoff'
      ];
      const generated = Array.from({ length: count }).map((_, i) => {
        const epNum = i + 1;
        return {
          id: `EP-${drama.id}-${epNum}`,
          dramaId: drama.id,
          episodeNumber: epNum,
          title: sampleTitles[i] || `Episode ${epNum}: Chapter ${epNum}`,
          duration: `${2 + (epNum % 2)}:${(10 + (epNum * 7) % 50).toString().padStart(2, '0')}`,
          isFree: epNum <= freeCount,
          views: `${(100 + epNum * 15)}k`,
          videoFileName: `ep_${epNum.toString().padStart(2, '0')}_1080p.mp4`,
          subtitleTracks: ['English', 'Hindi']
        };
      });
      setEpisodesList(generated);
    }
  }, [drama]);

  const toggleGenre = (genreName) => {
    if (selectedGenres.includes(genreName)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter(g => g !== genreName));
      }
    } else {
      setSelectedGenres([...selectedGenres, genreName]);
    }
  };

  const handleTogglePaywall = (epId) => {
    setEpisodesList(prev =>
      prev.map(ep => (ep.id === epId ? { ...ep, isFree: !ep.isFree } : ep))
    );
  };

  const handleApplyPaywallRule = () => {
    setEpisodesList(prev =>
      prev.map(ep => ({
        ...ep,
        isFree: ep.episodeNumber <= freeEpisodes
      }))
    );
  };

  const handleAddEpisode = () => {
    const nextNum = episodesList.length + 1;
    const isFree = nextNum <= freeEpisodes;
    const newEp = {
      id: `EP-${drama.id}-${nextNum}-${Date.now().toString().slice(-4)}`,
      dramaId: drama.id,
      episodeNumber: nextNum,
      title: `Episode ${nextNum}: New Chapter`,
      duration: '2:25',
      isFree,
      views: '0',
      videoFileName: `ep_${nextNum.toString().padStart(2, '0')}_1080p.mp4`,
      subtitleTracks: ['English']
    };
    setEpisodesList([...episodesList, newEp]);
    if (nextNum > totalEpisodes) {
      setTotalEpisodes(nextNum);
    }
  };

  const handleRemoveEpisode = (epId) => {
    setEpisodesList(prev => prev.filter(ep => ep.id !== epId));
  };

  const handleEpisodeTitleChange = (epId, newTitle) => {
    setEpisodesList(prev =>
      prev.map(ep => (ep.id === epId ? { ...ep, title: newTitle } : ep))
    );
  };

  const handleSimulateFileChange = (type) => {
    const rand = Math.floor(Math.random() * 900 + 100);
    if (type === 'poster') setPosterFile(`poster_v2_${rand}.jpg`);
    if (type === 'banner') setBannerFile(`hero_banner_v2_${rand}.jpg`);
    if (type === 'trailer') setTrailerFile(`trailer_hls_v2_${rand}.mp4`);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const updatedDrama = {
      ...drama,
      title,
      synopsis,
      genres: selectedGenres,
      status,
      isTrending,
      isFeatured,
      trendingRank: Number(trendingRank),
      poster: posterUrl,
      banner: bannerUrl,
      trailerUrl,
      totalEpisodes: Number(totalEpisodes),
      freeEpisodes: Number(freeEpisodes),
      priority: Number(priority) || 1
    };

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      if (onSave) onSave(updatedDrama);
      onClose();
    }, 600);
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 selection:bg-[#FEF08A] selection:text-black animate-in fade-in duration-200">
      
      {/* Modal Card Shell */}
      <div className="bg-white dark:bg-[#111111] rounded-[28px] w-full max-w-4xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border border-slate-200/90 dark:border-slate-800/90 flex flex-col max-h-[92vh] overflow-hidden font-urbanist animate-in zoom-in-95 duration-200">
        
        {/* Top Header Card */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-slate-50/80 via-white to-amber-50/20 dark:from-slate-900/50 dark:via-[#111111] dark:to-amber-950/10 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4 min-w-0">
            
            {/* Visual Portrait Thumbnail */}
            <div className="relative w-12 h-16 sm:w-13 sm:h-17 rounded-xl overflow-hidden bg-slate-950 border border-slate-200/90 dark:border-slate-700 shadow-sm shrink-0 group">
              <img
                src={posterUrl}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <span className="absolute bottom-1 left-1 text-[9px] font-extrabold text-white font-mono bg-black/60 px-1 rounded">
                9:16
              </span>
            </div>

            {/* Title & Metadata Badges */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {/* ID Badge */}
                <span className="text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                  {drama.id}
                </span>

                {/* Status Badge */}
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg ${
                    status === 'PUBLISHED'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                      : status === 'ENCODING'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      status === 'PUBLISHED'
                        ? 'bg-emerald-500 animate-pulse'
                        : status === 'ENCODING'
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-slate-400'
                    }`}
                  ></span>
                  <span>{status === 'PUBLISHED' ? 'Live on App' : status === 'ENCODING' ? 'Processing' : 'Draft'}</span>
                </span>

                {/* Trending Badge */}
                {isTrending && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg bg-amber-400/15 dark:bg-amber-400/10 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/40">
                    <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>Trending #{trendingRank}</span>
                  </span>
                )}
              </div>

              {/* Series Title */}
              <h2 className="font-extrabold text-slate-950 dark:text-white text-base sm:text-lg lg:text-xl truncate tracking-tight">
                {title || 'Untitled Series'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                Manage storyline, vertical artwork, teaser trailers, and paywall locks
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center shrink-0 ml-3 cursor-pointer shadow-2xs"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modern Segmented Navigation Bar (Dashboard Style) */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#151515] flex items-center shrink-0">
          <div className="bg-slate-200/70 dark:bg-slate-900 p-1 rounded-2xl flex items-center gap-1 w-full sm:w-auto border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'info'
                  ? 'bg-white dark:bg-[#1C1C1E] text-slate-950 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                activeTab === 'info' ? 'bg-[#FEF08A] text-slate-950' : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                <Film className="w-3 h-3" />
              </div>
              <span>Series Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'media'
                  ? 'bg-white dark:bg-[#1C1C1E] text-slate-950 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                activeTab === 'media' ? 'bg-[#FEF08A] text-slate-950' : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                <ImageIcon className="w-3 h-3" />
              </div>
              <span>Media & Artwork</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('episodes')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'episodes'
                  ? 'bg-white dark:bg-[#1C1C1E] text-slate-950 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                activeTab === 'episodes' ? 'bg-[#FEF08A] text-slate-950' : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                <Video className="w-3 h-3" />
              </div>
              <span>Episodes & Paywall</span>
              <span className="px-1.5 py-0.2 rounded-md bg-amber-400/20 text-amber-800 dark:text-amber-400 text-[10px] font-mono font-black ml-1">
                {episodesList.length}
              </span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* ========================================================
              TAB 1: SERIES OVERVIEW & METADATA
             ======================================================== */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              
              {/* Section 1: Core Details Card */}
              <div className="bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-200/60 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/15 dark:bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                    <FileText className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-950 dark:text-white text-xs sm:text-sm">
                      Series Information
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Primary titles, storyline description, and content maturity rating
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-[11px] uppercase tracking-wider">
                      Series Title (Romanized / English) *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. The Secret Billionaire Heir"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold bg-white dark:bg-[#161616] text-slate-950 dark:text-white focus:border-amber-400 focus:outline-none transition-all shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-[11px] uppercase tracking-wider">
                      Age Rating / CBFC Certification
                    </label>
                    <div className="relative">
                      <select
                        value={ageRating}
                        onChange={(e) => setAgeRating(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold bg-white dark:bg-[#161616] text-slate-950 dark:text-white focus:border-amber-400 focus:outline-none transition-all shadow-xs cursor-pointer"
                      >
                        <option value="U (All Ages)">U (Universal — All Audiences)</option>
                        <option value="U/A 7+">U/A 7+ (Mild Drama & Fantasy)</option>
                        <option value="U/A 13+">U/A 13+ (Teen Romance & Action)</option>
                        <option value="U/A 16+">U/A 16+ (Mature Revenge & Violence)</option>
                        <option value="A 18+">A 18+ (Adults Only)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
                      Synopsis & Story Hook *
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Appears in mobile episode feed description
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={synopsis}
                    onChange={(e) => setSynopsis(e.target.value)}
                    placeholder="Write the dramatic storyline hook that drives viewers to watch episode 1..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-slate-100 bg-white dark:bg-[#161616] focus:border-amber-400 focus:outline-none transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Section 2: Genres Multi-Select */}
              <div className="bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/15 dark:bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                      <Tag className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-950 dark:text-white text-xs sm:text-sm">
                        Genres & Discovery Tags
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Select applicable micro-drama themes for algorithm recommendations
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">
                    {selectedGenres.length} Selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {mockGenres.map((g) => {
                    const isSelected = selectedGenres.includes(g.name);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGenre(g.name)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#FEF08A] text-slate-950 border border-amber-300 shadow-xs font-extrabold scale-102'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 stroke-[3] text-slate-950" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{g.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Publishing & Curation Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Catalog Publishing Status */}
                <div className="bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/15 dark:bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                      <Tv className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-950 dark:text-white text-xs sm:text-sm">
                        App Feed Status
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Controls visibility on viewer screens
                      </p>
                    </div>
                  </div>

                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-extrabold bg-white dark:bg-[#161616] text-slate-950 dark:text-white focus:border-amber-400 focus:outline-none transition-all shadow-xs cursor-pointer"
                  >
                    <option value="PUBLISHED">🟢 Published (Live on Android &amp; iOS)</option>
                    <option value="ENCODING">🟡 Encoding / Processing Bitrates</option>
                    <option value="DRAFT">⚪ Draft (Internal Admin Review)</option>
                  </select>
                </div>

                {/* Catalog Display Priority */}
                <div className="bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/15 dark:bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                      <Layers className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-950 dark:text-white text-xs sm:text-sm">
                        Catalog Priority Rank
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        1 = Top Spotlight in mobile catalog
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={priority}
                      onChange={(e) => setPriority(Math.max(1, Number(e.target.value)))}
                      className="w-24 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-black text-center bg-white dark:bg-[#161616] text-slate-950 dark:text-white focus:border-amber-400 focus:outline-none transition-all shadow-xs text-sm"
                    />
                  </div>
                </div>

                {/* Carousel & Trending Toggles */}
                <div className="bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/15 dark:bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                      <Crown className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-950 dark:text-white text-xs sm:text-sm">
                        Editorial Highlights
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Feature in home banner and top charts
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    {/* Feature on Carousel Toggle */}
                    <div
                      onClick={() => setIsFeatured(!isFeatured)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#161616] border border-slate-200/80 dark:border-slate-700/80 cursor-pointer select-none hover:border-amber-300 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-slate-900 dark:text-slate-200 text-xs">
                          Hero Banner Carousel
                        </span>
                      </div>
                      <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                        isFeatured ? 'bg-[#FEF08A] justify-end border border-amber-300' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                      }`}>
                        <div className={`w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                          isFeatured ? 'bg-slate-950' : 'bg-white'
                        }`}></div>
                      </div>
                    </div>

                    {/* Trending Chart Toggle */}
                    <div
                      onClick={() => setIsTrending(!isTrending)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#161616] border border-slate-200/80 dark:border-slate-700/80 cursor-pointer select-none hover:border-amber-300 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Flame className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-slate-900 dark:text-slate-200 text-xs">
                          Top 10 Trending Charts
                        </span>
                      </div>
                      <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                        isTrending ? 'bg-[#FEF08A] justify-end border border-amber-300' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                      }`}>
                        <div className={`w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                          isTrending ? 'bg-slate-950' : 'bg-white'
                        }`}></div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ========================================================
              TAB 2: MEDIA ASSETS & ARTWORK
             ======================================================== */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              
              <div className="p-4 bg-amber-400/10 dark:bg-amber-400/5 border border-amber-400/30 rounded-2xl flex items-center space-x-3 text-amber-900 dark:text-amber-300">
                <div className="w-8 h-8 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-xs">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-950 dark:text-white">
                    Cloud Storage & Transcoding Pipeline
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Uploaded posters and trailer videos are synchronized to AWS S3 & Cloudinary CDN automatically.
                  </p>
                </div>
              </div>

              {/* Media Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Card 1: 9:16 Vertical Poster */}
                <div className="bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-slate-950 dark:text-white text-xs">
                        9:16 Vertical Poster
                      </span>
                      <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-[#FEF08A] text-slate-950 shadow-2xs">
                        1080×1920
                      </span>
                    </div>

                    <div className="aspect-[9/13] rounded-xl overflow-hidden bg-slate-950 relative group border border-slate-200 dark:border-slate-700 shadow-sm">
                      <img
                        src={posterUrl}
                        alt="Poster"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center text-white">
                        <span className="text-xs font-bold">Recommended Specs:</span>
                        <span className="text-[10px] text-slate-300 mt-0.5">PNG / JPG • Under 3MB</span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      <span className="truncate">{posterFile}</span>
                      <span className="text-emerald-500 font-bold shrink-0 ml-1">✓ Active</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSimulateFileChange('poster')}
                    className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#FEF08A] hover:text-slate-950 dark:hover:bg-[#FEF08A] dark:hover:text-slate-950 text-slate-900 dark:text-white font-extrabold text-xs transition-all flex items-center justify-center space-x-1.5 border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer group"
                  >
                    <FolderUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                    <span>Replace Poster File</span>
                  </button>
                </div>

                {/* Card 2: 16:9 Landscape Banner */}
                <div className="bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-slate-950 dark:text-white text-xs">
                        16:9 Hero Banner
                      </span>
                      <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-[#FEF08A] text-slate-950 shadow-2xs">
                        1920×1080
                      </span>
                    </div>

                    <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 relative group border border-slate-200 dark:border-slate-700 shadow-sm">
                      <img
                        src={bannerUrl || posterUrl}
                        alt="Banner"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center text-white">
                        <span className="text-xs font-bold">Carousel Hero Banner:</span>
                        <span className="text-[10px] text-slate-300 mt-0.5">High-contrast top artwork</span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      <span className="truncate">{bannerFile}</span>
                      <span className="text-emerald-500 font-bold shrink-0 ml-1">✓ Active</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSimulateFileChange('banner')}
                    className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#FEF08A] hover:text-slate-950 dark:hover:bg-[#FEF08A] dark:hover:text-slate-950 text-slate-900 dark:text-white font-extrabold text-xs transition-all flex items-center justify-center space-x-1.5 border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer group"
                  >
                    <FolderUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                    <span>Replace Banner File</span>
                  </button>
                </div>

                {/* Card 3: 9:16 Vertical Teaser Trailer */}
                <div className="bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-slate-950 dark:text-white text-xs">
                        9:16 Teaser Trailer
                      </span>
                      <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-400">
                        MP4 / H.264
                      </span>
                    </div>

                    <div className="aspect-[9/13] rounded-xl overflow-hidden bg-slate-950 relative group border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center p-4">
                      <div className="w-12 h-12 rounded-full bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform cursor-pointer">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                      <span className="text-white font-black text-xs mt-3">Watch Vertical Teaser</span>
                      <span className="text-slate-400 text-[10px] mt-0.5 font-mono">0:45s • 1080p 60fps • 24MB</span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      <span className="truncate">{trailerFile}</span>
                      <span className="text-emerald-500 font-bold shrink-0 ml-1">✓ Transcoded</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSimulateFileChange('trailer')}
                    className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#FEF08A] hover:text-slate-950 dark:hover:bg-[#FEF08A] dark:hover:text-slate-950 text-slate-900 dark:text-white font-extrabold text-xs transition-all flex items-center justify-center space-x-1.5 border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer group"
                  >
                    <Video className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span>Replace Teaser MP4</span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================
              TAB 3: EPISODES & PAYWALL ARCHITECTURE
             ======================================================== */}
          {activeTab === 'episodes' && (
            <div className="space-y-6">
              
              {/* Paywall Configuration Blueprint Card */}
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-slate-50/50 dark:from-amber-950/30 dark:via-slate-900/40 dark:to-slate-900/20 rounded-2xl p-5 border border-amber-400/30 dark:border-amber-700/30 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center font-bold shadow-xs">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-950 dark:text-white text-xs sm:text-sm">
                        Freemium Paywall Architecture
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Set how many teaser episodes mobile viewers can watch before hitting the VIP paywall
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyPaywallRule}
                    className="px-3.5 py-1.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center space-x-1.5 shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Apply Rule to All</span>
                  </button>
                </div>

                {/* Steppers & Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="bg-white dark:bg-[#161616] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                      Total Published Episodes
                    </span>
                    <div className="flex items-center justify-between">
                      <input
                        type="number"
                        min={1}
                        value={totalEpisodes}
                        onChange={(e) => setTotalEpisodes(Number(e.target.value))}
                        className="text-xl font-black text-slate-950 dark:text-white bg-transparent border-none focus:outline-none w-24"
                      />
                      <span className="text-xs font-bold text-slate-400">Episodes in Series</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#161616] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                      Free Preview Episodes
                    </span>
                    <div className="flex items-center justify-between">
                      <input
                        type="number"
                        min={1}
                        max={totalEpisodes}
                        value={freeEpisodes}
                        onChange={(e) => setFreeEpisodes(Number(e.target.value))}
                        className="text-xl font-black text-amber-600 dark:text-amber-400 bg-transparent border-none focus:outline-none w-24"
                      />
                      <span className="text-xs font-bold text-slate-400">Free before paywall</span>
                    </div>
                  </div>
                </div>

                {/* Visual Ratio Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex shadow-inner">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (freeEpisodes / totalEpisodes) * 100)}%` }}
                      title={`Episodes 1 to ${freeEpisodes} Free`}
                    ></div>
                    <div
                      className="bg-amber-400 h-full transition-all duration-300 flex-1"
                      title={`Episodes ${Number(freeEpisodes) + 1} to ${totalEpisodes} VIP Locked`}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      Ep 1–{freeEpisodes} Free for All Users
                    </span>
                    <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                      Ep {Number(freeEpisodes) + 1}+ Requires VIP Pass
                    </span>
                  </div>
                </div>
              </div>

              {/* Episodes List Header */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h4 className="font-extrabold text-slate-950 dark:text-white text-xs sm:text-sm">
                    Episode Sequence & Files ({episodesList.length})
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Click the paywall badge on any episode to toggle individual free preview access
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddEpisode}
                  className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-black dark:bg-[#FEF08A] dark:hover:bg-[#FDE047] text-white dark:text-slate-950 font-extrabold text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Episode</span>
                </button>
              </div>

              {/* Episodes Card Rows */}
              <div className="space-y-2.5">
                {episodesList.map((ep) => (
                  <div
                    key={ep.id}
                    className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#151515] border border-slate-200/80 dark:border-slate-800 hover:border-amber-300/80 dark:hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    {/* Left: Number, Title, and Video Specs */}
                    <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                      <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-slate-800 dark:text-slate-200 flex items-center justify-center text-xs shrink-0 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs font-mono">
                        {ep.episodeNumber.toString().padStart(2, '0')}
                      </span>

                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          value={ep.title}
                          onChange={(e) => handleEpisodeTitleChange(ep.id, e.target.value)}
                          className="w-full font-bold text-slate-950 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-amber-400 focus:outline-none text-xs py-0.5 truncate"
                        />
                        
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mt-1 font-mono">
                          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold">
                            <FileVideo className="w-3 h-3 text-amber-500" />
                            {ep.videoFileName || `ep_${ep.episodeNumber}_1080p.mp4`}
                          </span>
                          <span>•</span>
                          <span>{ep.duration}</span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">1080p Ready</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Subtitle badges, Paywall Switcher, and Delete */}
                    <div className="flex items-center space-x-2.5 shrink-0 self-end sm:self-center">
                      
                      {/* Subtitles Track Badge */}
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 flex items-center gap-1 font-mono">
                        <Subtitles className="w-3 h-3 text-slate-400" />
                        <span>EN, HI</span>
                      </span>

                      {/* Paywall Toggle Badge */}
                      <button
                        type="button"
                        onClick={() => handleTogglePaywall(ep.id)}
                        className={`px-3 py-1 rounded-xl text-[10px] font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs ${
                          ep.isFree
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60 hover:bg-emerald-100'
                            : 'bg-amber-100/80 text-amber-950 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 hover:bg-amber-200/60'
                        }`}
                        title="Click to toggle Free Preview vs VIP Locked"
                      >
                        {ep.isFree ? (
                          <>
                            <Unlock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>FREE PREVIEW</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                            <span>VIP LOCKED</span>
                          </>
                        )}
                      </button>

                      {/* Delete Episode Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveEpisode(ep.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                        title="Delete Episode"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#151515] flex items-center justify-between shrink-0">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-2">
            {saveSuccess ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Changes saved to streaming catalog!</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Ready to update mobile OTT catalog</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-7 py-2.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-black text-xs shadow-xs hover:shadow transition-all cursor-pointer flex items-center space-x-1.5 active:scale-98"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
