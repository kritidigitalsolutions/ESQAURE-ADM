import React, { useState, useEffect, useRef } from 'react';
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
  Tv,
  Star,
  RefreshCw,
  FolderUp,
  Tag,
  FileText,
  Loader2,
  AlertTriangle,
  Link
} from 'lucide-react';
import { dramaService } from '../services/dramaService';
import { genreService } from '../services/genreService';
import { uploadService } from '../services/uploadService';

export default function ManageContentModal({ isOpen, drama, onClose, onSave }) {
  if (!isOpen || !drama) return null;

  // Tabs: 'info' | 'media' | 'episodes'
  const [activeTab, setActiveTab] = useState('info');

  // Dynamic Genres from backend
  const [availableGenres, setAvailableGenres] = useState([]);

  // Form State
  const [title, setTitle] = useState(drama.title || '');
  const [synopsis, setSynopsis] = useState(drama.synopsis || '');
  const [selectedGenres, setSelectedGenres] = useState(drama.genres || ['Romance']);
  const [ageRating, setAgeRating] = useState(drama.ageRating || 'U/A 13+');
  const [director, setDirector] = useState(drama.director || '');
  const [status, setStatus] = useState(drama.status || 'PUBLISHED');
  const [isActive, setIsActive] = useState(drama.isActive !== undefined ? Boolean(drama.isActive) : (drama.status === 'PUBLISHED' || drama.status === 'ENCODING'));
  const [isPaid, setIsPaid] = useState(drama.isPaid !== undefined ? Boolean(drama.isPaid) : true);
  const [plan, setPlan] = useState(drama.plan || (drama.isPaid === false ? 'Free Tier' : 'Premium Plan'));
  const [isTrending, setIsTrending] = useState(drama.isTrending ?? false);
  const [isFeatured, setIsFeatured] = useState(drama.isFeatured ?? true);
  const [trendingRank, setTrendingRank] = useState(drama.trendingRank || 1);
  const [priority, setPriority] = useState(drama.priority || 1);

  // Media assets
  const [posterUrl, setPosterUrl] = useState(drama.poster || drama.posterUrl || '');
  const [bannerUrl, setBannerUrl] = useState(drama.banner || drama.bannerUrl || '');
  const [trailerUrl, setTrailerUrl] = useState(drama.trailerUrl || '');
  const [posterFile, setPosterFile] = useState(drama.posterUrl ? drama.posterUrl.split('/').pop() : 'vertical_poster.jpg');
  const [bannerFile, setBannerFile] = useState(drama.bannerUrl ? drama.bannerUrl.split('/').pop() : 'hero_banner.jpg');
  const [trailerFile, setTrailerFile] = useState(drama.trailerUrl ? drama.trailerUrl.split('/').pop() : 'trailer.mp4');

  // Media Source Modes: 'file' | 'url'
  const [posterMode, setPosterMode] = useState('file');
  const [bannerMode, setBannerMode] = useState('file');
  const [trailerMode, setTrailerMode] = useState('file');
  const [posterUrlInput, setPosterUrlInput] = useState('');
  const [bannerUrlInput, setBannerUrlInput] = useState('');
  const [trailerUrlInput, setTrailerUrlInput] = useState('');

  // Episode URL Editing State
  const [editingUrlEpId, setEditingUrlEpId] = useState(null);
  const [editingUrlValue, setEditingUrlValue] = useState('');

  // Upload States
  const [uploadingTarget, setUploadingTarget] = useState(null); // 'poster' | 'banner' | 'trailer' | `episode-${id}`
  const [uploadProgress, setUploadProgress] = useState(0);

  // File Input Refs
  const posterInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const trailerInputRef = useRef(null);
  const episodeInputRef = useRef(null);
  const currentEpisodeUploadRef = useRef(null);

  // Episodes & Paywall
  const [totalEpisodes, setTotalEpisodes] = useState(drama.totalEpisodes || 0);
  const [freeEpisodes, setFreeEpisodes] = useState(drama.freeEpisodes || 3);
  const [episodesList, setEpisodesList] = useState([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

  // Saving State & Notifications
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Video Preview Modal
  const [previewVideo, setPreviewVideo] = useState(null);

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

  // Fetch dynamic genres from backend
  useEffect(() => {
    let isMounted = true;
    genreService.getActiveGenres()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : (data?.genres || []);
        if (list.length > 0) {
          setAvailableGenres(list.map(g => ({
            id: g._id || g.id,
            name: g.name
          })));
        } else {
          // Fallback defaults
          setAvailableGenres([
            { id: '1', name: 'Romance' },
            { id: '2', name: 'Thriller' },
            { id: '3', name: 'Drama' },
            { id: '4', name: 'Mystery' },
            { id: '5', name: 'Action' },
            { id: '6', name: 'Horror' },
            { id: '7', name: 'Comedy' },
            { id: '8', name: 'Fantasy' }
          ]);
        }
      })
      .catch((err) => {
        console.warn('Could not load genres from API:', err);
        setAvailableGenres([
          { id: '1', name: 'Romance' },
          { id: '2', name: 'Thriller' },
          { id: '3', name: 'Drama' },
          { id: '4', name: 'Mystery' },
          { id: '5', name: 'Action' },
          { id: '6', name: 'Horror' }
        ]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync state when drama changes and fetch real episodes from API
  useEffect(() => {
    if (!drama) return;

    setTitle(drama.title || '');
    setSynopsis(drama.synopsis || '');
    setSelectedGenres(drama.genres || ['Romance']);
    setAgeRating(drama.ageRating || 'U/A 13+');
    setDirector(drama.director || '');
    setStatus(drama.status || 'PUBLISHED');
    setIsActive(drama.isActive !== undefined ? Boolean(drama.isActive) : (drama.status === 'PUBLISHED' || drama.status === 'ENCODING'));
    setIsPaid(drama.isPaid !== undefined ? Boolean(drama.isPaid) : true);
    setPlan(drama.plan || (drama.isPaid === false ? 'Free Tier' : 'Premium Plan'));
    setIsTrending(drama.isTrending ?? false);
    setIsFeatured(drama.isFeatured ?? true);
    setTrendingRank(drama.trendingRank || 1);
    setPriority(drama.priority || 1);
    setPosterUrl(drama.poster || drama.posterUrl || '');
    setBannerUrl(drama.banner || drama.bannerUrl || '');
    setTrailerUrl(drama.trailerUrl || '');
    setPosterFile((drama.poster || drama.posterUrl || '').split('/').pop() || 'vertical_poster.jpg');
    setBannerFile((drama.banner || drama.bannerUrl || '').split('/').pop() || 'hero_banner.jpg');
    setTrailerFile((drama.trailerUrl || '').split('/').pop() || 'trailer.mp4');
    setTotalEpisodes(drama.totalEpisodes || 0);
    setFreeEpisodes(drama.freeEpisodes !== undefined ? drama.freeEpisodes : 3);
    setActionError(null);

    let isMounted = true;
    setIsLoadingEpisodes(true);

    dramaService.getDramaById(drama.id)
      .then((res) => {
        if (!isMounted || !res || !res.drama) return;
        const d = res.drama;
        if (d.ageRating) setAgeRating(d.ageRating);
        if (d.director) setDirector(d.director);
        if (d.trailerUrl) {
          setTrailerUrl(d.trailerUrl);
          setTrailerFile(d.trailerUrl.split('/').pop() || 'trailer.mp4');
        }

        if (Array.isArray(d.episodes) && d.episodes.length > 0) {
          const loaded = d.episodes.map((ep, idx) => {
            const epNum = ep.episodeNumber || (idx + 1);
            const vUrl = ep.videoUrl || ep.videoStreamUrl || '';
            return {
              id: ep.id || ep._id || `ep-${epNum}-${Date.now()}`,
              dramaId: drama.id,
              episodeNumber: epNum,
              title: ep.title || `Episode ${epNum}`,
              duration: ep.duration || '2:15',
              durationSeconds: ep.durationSeconds || 135,
              isFree: ep.isFree !== undefined ? Boolean(ep.isFree) : epNum <= (d.freeEpisodes || 3),
              views: ep.views || '0',
              videoUrl: vUrl,
              videoFileName: vUrl ? vUrl.split('/').pop() : `ep_${epNum}_1080p.mp4`,
              subtitleTracks: ep.subtitleTracks || ['English', 'Hindi']
            };
          });
          setEpisodesList(loaded);
          setTotalEpisodes(loaded.length);
        } else {
          setEpisodesList([]);
          setTotalEpisodes(0);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch drama details from API:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingEpisodes(false);
      });

    return () => {
      isMounted = false;
    };
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

  // Real File Upload Handler (Poster, Banner, Trailer)
  const handleMediaUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTarget(type);
    setUploadProgress(20);
    setActionError(null);

    try {
      const mediaType = type === 'trailer' ? 'video' : 'image';
      setUploadProgress(50);
      const res = await uploadService.uploadSingle(file, mediaType);
      setUploadProgress(100);

      if (type === 'poster') {
        setPosterUrl(res.url);
        setPosterFile(file.name);
      } else if (type === 'banner') {
        setBannerUrl(res.url);
        setBannerFile(file.name);
      } else if (type === 'trailer') {
        setTrailerUrl(res.url);
        setTrailerFile(file.name);
      }
    } catch (err) {
      console.error(`Upload ${type} failed:`, err);
      setActionError(`Upload failed: ${err.message || 'Server error'}`);
    } finally {
      setUploadingTarget(null);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  // Real Episode Video File Upload Handler
  const handleEpisodeVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    const epId = currentEpisodeUploadRef.current;
    if (!file || !epId) return;

    setUploadingTarget(`episode-${epId}`);
    setActionError(null);

    try {
      const res = await uploadService.uploadSingle(file, 'video');

      // Attempt to calculate video duration
      let detectedDuration = '2:15';
      let durationSeconds = 135;

      try {
        const videoElement = document.createElement('video');
        videoElement.src = URL.createObjectURL(file);
        await new Promise((resolve) => {
          videoElement.onloadedmetadata = () => {
            const sec = Math.round(videoElement.duration || 135);
            durationSeconds = sec;
            const mins = Math.floor(sec / 60);
            const remainderSecs = sec % 60;
            detectedDuration = `${mins}:${remainderSecs.toString().padStart(2, '0')}`;
            resolve();
          };
          videoElement.onerror = () => resolve();
          setTimeout(resolve, 1500);
        });
      } catch (e) {
        // fallback
      }

      setEpisodesList(prev =>
        prev.map(ep =>
          ep.id === epId
            ? {
                ...ep,
                videoUrl: res.url,
                videoFileName: file.name,
                duration: detectedDuration,
                durationSeconds
              }
            : ep
        )
      );
    } catch (err) {
      console.error('Episode video upload failed:', err);
      setActionError(`Episode upload failed: ${err.message || 'Server error'}`);
    } finally {
      setUploadingTarget(null);
      currentEpisodeUploadRef.current = null;
      e.target.value = '';
    }
  };

  const triggerEpisodeUpload = (epId) => {
    currentEpisodeUploadRef.current = epId;
    if (episodeInputRef.current) {
      episodeInputRef.current.click();
    }
  };

  const handleApplyPosterUrl = () => {
    if (posterUrlInput.trim()) {
      setPosterUrl(posterUrlInput.trim());
      setPosterFile('Direct Image URL');
      setPosterUrlInput('');
    }
  };

  const handleApplyBannerUrl = () => {
    if (bannerUrlInput.trim()) {
      setBannerUrl(bannerUrlInput.trim());
      setBannerFile('Direct Image URL');
      setBannerUrlInput('');
    }
  };

  const handleApplyTrailerUrl = () => {
    if (trailerUrlInput.trim()) {
      setTrailerUrl(trailerUrlInput.trim());
      setTrailerFile('Direct Stream URL');
      setTrailerUrlInput('');
    }
  };

  const handleSaveEpisodeUrl = (epId) => {
    if (!editingUrlValue.trim()) return;
    setEpisodesList(prev =>
      prev.map(ep =>
        ep.id === epId
          ? {
              ...ep,
              videoUrl: editingUrlValue.trim(),
              videoFileName: 'Stream URL'
            }
          : ep
      )
    );
    setEditingUrlEpId(null);
    setEditingUrlValue('');
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
      id: `ep-${drama.id}-${nextNum}-${Date.now().toString().slice(-4)}`,
      dramaId: drama.id,
      episodeNumber: nextNum,
      title: `Episode ${nextNum}`,
      duration: '2:15',
      durationSeconds: 135,
      isFree,
      views: '0',
      videoUrl: '',
      videoFileName: '',
      subtitleTracks: ['English', 'Hindi']
    };
    const updated = [...episodesList, newEp];
    setEpisodesList(updated);
    setTotalEpisodes(updated.length);
  };

  const handleRemoveEpisode = (epId) => {
    const filtered = episodesList.filter(ep => ep.id !== epId);
    // Renumber remaining episodes
    const renumbered = filtered.map((ep, idx) => ({
      ...ep,
      episodeNumber: idx + 1,
      isFree: (idx + 1) <= freeEpisodes
    }));
    setEpisodesList(renumbered);
    setTotalEpisodes(renumbered.length);
  };

  const handleEpisodeTitleChange = (epId, newTitle) => {
    setEpisodesList(prev =>
      prev.map(ep => (ep.id === epId ? { ...ep, title: newTitle } : ep))
    );
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setActionError(null);

    const updatedDrama = {
      ...drama,
      title,
      synopsis,
      genres: selectedGenres,
      ageRating,
      director,
      status: isActive ? (status === 'DRAFT' ? 'PUBLISHED' : status) : 'DRAFT',
      isActive,
      isPaid,
      plan: isPaid ? (plan === 'Free Tier' ? 'Premium Plan' : plan) : 'Free Tier',
      isTrending,
      isFeatured,
      trendingRank: Number(trendingRank) || 1,
      poster: posterUrl,
      posterUrl,
      banner: bannerUrl,
      bannerUrl,
      trailerUrl,
      totalEpisodes: episodesList.length || Number(totalEpisodes),
      freeEpisodes: Number(freeEpisodes),
      priority: Number(priority) || 1
    };

    try {
      // 1. Update Drama Series metadata
      await dramaService.updateDrama(drama.id, updatedDrama);

      // 2. Save Drama Episodes to Database
      if (episodesList.length > 0) {
        const formattedEpisodes = episodesList.map((ep, idx) => ({
          episodeNumber: idx + 1,
          title: ep.title || `Episode ${idx + 1}`,
          videoUrl: ep.videoUrl || '',
          videoStreamUrl: ep.videoUrl || '',
          duration: ep.duration || '2:15',
          durationSeconds: ep.durationSeconds || 135,
          isFree: Boolean(ep.isFree),
          subtitles: ep.subtitleTracks || ['English', 'Hindi']
        }));

        await dramaService.saveEpisodes(drama.id, {
          episodes: formattedEpisodes,
          freeEpisodes: Number(freeEpisodes)
        });
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (onSave) onSave(updatedDrama);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Failed to save changes to API:', err);
      setActionError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 selection:bg-[#FEF08A] selection:text-black animate-in fade-in duration-200">
      
      {/* Hidden File Inputs for Real Uploads */}
      <input
        type="file"
        ref={posterInputRef}
        accept="image/*"
        onChange={(e) => handleMediaUpload(e, 'poster')}
        className="hidden"
      />
      <input
        type="file"
        ref={bannerInputRef}
        accept="image/*"
        onChange={(e) => handleMediaUpload(e, 'banner')}
        className="hidden"
      />
      <input
        type="file"
        ref={trailerInputRef}
        accept="video/*"
        onChange={(e) => handleMediaUpload(e, 'trailer')}
        className="hidden"
      />
      <input
        type="file"
        ref={episodeInputRef}
        accept="video/*"
        onChange={handleEpisodeVideoUpload}
        className="hidden"
      />

      {/* Modal Card Shell */}
      <div className="bg-white dark:bg-[#202620] rounded-[28px] w-full max-w-4xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] border border-slate-200/90 dark:border-white/15 flex flex-col max-h-[92vh] overflow-hidden font-urbanist animate-in zoom-in-95 duration-200">
        
        {/* Top Header Card */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/10 bg-gradient-to-r from-slate-50/80 via-white to-amber-50/20 dark:from-[#202620] dark:via-[#202620] dark:to-amber-950/10 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4 min-w-0">
            
            {/* Visual Portrait Thumbnail */}
            <div className="relative w-12 h-16 sm:w-13 sm:h-17 rounded-xl overflow-hidden bg-slate-950 border border-slate-200/90 dark:border-white/10 shadow-sm shrink-0 group">
              <img
                src={posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80'}
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
                <span className="text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[#161B16] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                  {drama.id}
                </span>

                {/* Status Badge */}
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg ${
                    status === 'PUBLISHED'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                      : status === 'ENCODING'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                      : 'bg-slate-100 dark:bg-[#161B16] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10'
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
                Real-time MongoDB synchronization • Cloud storage pipeline
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100/80 dark:bg-[#161B16] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-500 hover:text-slate-900 dark:hover:text-white border border-transparent dark:border-white/10 transition-all flex items-center justify-center shrink-0 ml-3 cursor-pointer shadow-2xs"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Error Banner */}
        {actionError && (
          <div className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-rose-600 hover:text-rose-800 dark:text-rose-300 font-black cursor-pointer text-sm"
            >
              ×
            </button>
          </div>
        )}

        {/* Modern Segmented Navigation Bar */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-[#1A201A] flex items-center shrink-0">
          <div className="bg-slate-200/70 dark:bg-[#141914] p-1 rounded-2xl flex items-center gap-1 w-full sm:w-auto border border-slate-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'info'
                  ? 'bg-white dark:bg-[#262C26] text-slate-950 dark:text-white shadow-xs border border-slate-200/60 dark:border-white/12'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                activeTab === 'info' ? 'bg-[#FEF08A] text-slate-950' : 'bg-slate-200/80 dark:bg-[#202620] text-slate-600 dark:text-slate-400'
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
                  ? 'bg-white dark:bg-[#262C26] text-slate-950 dark:text-white shadow-xs border border-slate-200/60 dark:border-white/12'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                activeTab === 'media' ? 'bg-[#FEF08A] text-slate-950' : 'bg-slate-200/80 dark:bg-[#202620] text-slate-600 dark:text-slate-400'
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
                  ? 'bg-white dark:bg-[#262C26] text-slate-950 dark:text-white shadow-xs border border-slate-200/60 dark:border-white/12'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                activeTab === 'episodes' ? 'bg-[#FEF08A] text-slate-950' : 'bg-slate-200/80 dark:bg-[#202620] text-slate-600 dark:text-slate-400'
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
              <div className="bg-slate-50/70 dark:bg-[#161B16] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 space-y-4">
                <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-200/60 dark:border-white/10">
                  <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-xs">
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-[11px] uppercase tracking-wider">
                      Series Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. The Secret Billionaire Heir"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold bg-white dark:bg-[#121612] text-slate-950 dark:text-white focus:border-[#FEF08A] focus:outline-none transition-all shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-[11px] uppercase tracking-wider">
                      Age Rating / CBFC
                    </label>
                    <select
                      value={ageRating}
                      onChange={(e) => setAgeRating(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold bg-white dark:bg-[#121612] text-slate-950 dark:text-white focus:border-[#FEF08A] focus:outline-none transition-all shadow-xs cursor-pointer"
                    >
                      <option value="U (All Ages)">U (Universal — All Audiences)</option>
                      <option value="U/A 7+">U/A 7+ (Mild Drama & Fantasy)</option>
                      <option value="U/A 13+">U/A 13+ (Teen Romance & Action)</option>
                      <option value="U/A 16+">U/A 16+ (Mature Revenge & Violence)</option>
                      <option value="A 18+">A 18+ (Adults Only)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-[11px] uppercase tracking-wider">
                      Director / Creator
                    </label>
                    <input
                      type="text"
                      value={director}
                      onChange={(e) => setDirector(e.target.value)}
                      placeholder="e.g. Vikramaditya Motwane"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold bg-white dark:bg-[#121612] text-slate-950 dark:text-white focus:border-[#FEF08A] focus:outline-none transition-all shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-[11px] uppercase tracking-wider">
                      Catalog Display Priority (1 = Top)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={priority}
                      onChange={(e) => setPriority(Math.max(1, Number(e.target.value)))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold bg-white dark:bg-[#121612] text-slate-950 dark:text-white focus:border-[#FEF08A] focus:outline-none transition-all shadow-xs"
                    />
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 font-medium text-slate-900 dark:text-slate-100 bg-white dark:bg-[#121612] focus:border-[#FEF08A] focus:outline-none transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Section 2: Genres Multi-Select */}
              <div className="bg-slate-50/70 dark:bg-[#161B16] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-xs">
                      <Tag className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-950 dark:text-white text-xs sm:text-sm">
                        Genres & Discovery Tags
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Live categories fetched from MongoDB backend
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">
                    {selectedGenres.length} Selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {availableGenres.map((g) => {
                    const isSelected = selectedGenres.includes(g.name);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGenre(g.name)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#FEF08A] text-slate-950 border border-amber-300 shadow-xs font-extrabold scale-102'
                            : 'bg-white dark:bg-[#121612] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:border-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
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
                
                {/* Status: Active or Inactive */}
                <div className="bg-slate-50/70 dark:bg-[#161B16] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-xs">
                        <Tv className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-950 dark:text-white text-xs sm:text-sm">
                          Content Status
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Active or Inactive in viewer apps
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer shadow-xs ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-600/40'
                          : 'bg-slate-200 dark:bg-white/[0.08] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-white/10'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                    </button>
                  </div>

                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setIsActive(e.target.value !== 'DRAFT');
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-extrabold bg-white dark:bg-[#121612] text-slate-950 dark:text-white focus:border-[#FEF08A] focus:outline-none transition-all shadow-xs cursor-pointer"
                  >
                    <option value="PUBLISHED">🟢 Published &amp; Active (Live on Apps)</option>
                    <option value="ENCODING">🟡 Encoding / Processing Bitrates</option>
                    <option value="DRAFT">⚪ Draft &amp; Inactive (Hidden)</option>
                  </select>
                </div>

                {/* Pricing / Plan: Paid (With Plan) or Unpaid (Free) */}
                <div className="bg-slate-50/70 dark:bg-[#161B16] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-xs">
                        {isPaid ? <Lock className="w-4 h-4 stroke-[2.2]" /> : <Unlock className="w-4 h-4 stroke-[2.2]" />}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-950 dark:text-white text-xs sm:text-sm">
                          Pricing &amp; Access
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Paid (With Plan) or Unpaid (Free)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center bg-slate-200/80 dark:bg-[#121612] p-0.5 rounded-lg border border-slate-200 dark:border-white/10 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPaid(true);
                          if (plan === 'Free Tier') setPlan('Premium Plan');
                        }}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          isPaid ? 'bg-[#FEF08A] text-slate-950 font-black shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Paid
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPaid(false);
                          setPlan('Free Tier');
                        }}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          !isPaid ? 'bg-[#FEF08A] text-slate-950 font-black shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Free
                      </button>
                    </div>
                  </div>

                  {isPaid ? (
                    <select
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-extrabold bg-white dark:bg-[#121612] text-slate-950 dark:text-white focus:border-[#FEF08A] focus:outline-none transition-all shadow-xs cursor-pointer"
                    >
                      <option value="Premium Plan">🔒 All Active Subscribers (1M / 6M / 12M / Trial)</option>
                      <option value="1 Month Pass">💳 1 Month Pass (₹99 / mo)</option>
                      <option value="6 Months Pass">⭐ 6 Months Pass (₹499 / 6 mo)</option>
                      <option value="12 Months All-Access">👑 12 Months All-Access (₹899 / yr)</option>
                    </select>
                  ) : (
                    <div className="w-full px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-2">
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unpaid Content (Available for Free to All Users)</span>
                    </div>
                  )}
                </div>

                {/* Editorial Highlights */}
                <div className="sm:col-span-2 bg-slate-50/70 dark:bg-[#161B16] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 space-y-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-xs">
                      <Crown className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-950 dark:text-white text-xs sm:text-sm">
                        Editorial Highlights & Promotions
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Feature on home hero banner carousel and top 10 trending charts
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div
                      onClick={() => setIsFeatured(!isFeatured)}
                      className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 cursor-pointer select-none hover:border-[#FEF08A]/50 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-slate-900 dark:text-slate-200 text-xs">
                          Hero Banner Carousel
                        </span>
                      </div>
                      <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                        isFeatured ? 'bg-[#FEF08A] justify-end border border-amber-300' : 'bg-slate-300 dark:bg-[#202620] justify-start border border-transparent dark:border-white/10'
                      }`}>
                        <div className={`w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                          isFeatured ? 'bg-slate-950' : 'bg-white'
                        }`}></div>
                      </div>
                    </div>

                    <div
                      onClick={() => setIsTrending(!isTrending)}
                      className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 cursor-pointer select-none hover:border-[#FEF08A]/50 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Flame className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-slate-900 dark:text-slate-200 text-xs">
                          Top 10 Trending Charts
                        </span>
                      </div>
                      <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                        isTrending ? 'bg-[#FEF08A] justify-end border border-amber-300' : 'bg-slate-300 dark:bg-[#202620] justify-start border border-transparent dark:border-white/10'
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
                    Live Cloud Storage & CDN Ingestion
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Click replace on any artwork or trailer to upload real media files directly to the server.
                  </p>
                </div>
              </div>

              {/* Media Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Card 1: 9:16 Vertical Poster */}
                <div className="bg-slate-50/70 dark:bg-[#161B16] rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-slate-950 dark:text-white text-xs">
                        9:16 Vertical Poster
                      </span>
                      <div className="flex items-center bg-slate-200/80 dark:bg-[#121612] p-0.5 rounded-lg border border-slate-200 dark:border-white/10 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setPosterMode('file')}
                          className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                            posterMode === 'file' ? 'bg-[#FEF08A] text-slate-950 font-black shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          File
                        </button>
                        <button
                          type="button"
                          onClick={() => setPosterMode('url')}
                          className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                            posterMode === 'url' ? 'bg-[#FEF08A] text-slate-950 font-black shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          URL
                        </button>
                      </div>
                    </div>

                    <div className="aspect-[9/13] rounded-xl overflow-hidden bg-slate-950 relative group border border-slate-200 dark:border-white/10 shadow-sm">
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt="Poster"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                          <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                          <span className="text-[10px] font-bold">No Poster Uploaded</span>
                        </div>
                      )}
                      
                      {uploadingTarget === 'poster' && (
                        <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white">
                          <Loader2 className="w-6 h-6 animate-spin text-[#FEF08A] mb-2" />
                          <span className="text-xs font-bold">Uploading...</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      <span className="truncate">{posterFile}</span>
                      <span className="text-emerald-500 font-bold shrink-0 ml-1">✓ Active</span>
                    </div>
                  </div>

                  {posterMode === 'url' ? (
                    <div className="space-y-1.5 pt-1">
                      <input
                        type="url"
                        placeholder="https://.../poster.jpg"
                        value={posterUrlInput}
                        onChange={(e) => setPosterUrlInput(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#121612] border border-slate-200 dark:border-white/10 rounded-xl text-slate-950 dark:text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPosterUrl}
                        disabled={!posterUrlInput.trim()}
                        className="w-full py-1.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-black text-xs transition-all disabled:opacity-40 cursor-pointer"
                      >
                        Apply Poster URL
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={uploadingTarget === 'poster'}
                      onClick={() => posterInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl bg-white dark:bg-[#121612] hover:bg-[#FEF08A] hover:text-slate-950 dark:hover:bg-[#FEF08A] dark:hover:text-slate-950 text-slate-900 dark:text-white font-extrabold text-xs transition-all flex items-center justify-center space-x-1.5 border border-slate-200 dark:border-white/10 shadow-xs cursor-pointer group disabled:opacity-50"
                    >
                      {uploadingTarget === 'poster' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FolderUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                      )}
                      <span>Replace Poster File</span>
                    </button>
                  )}
                </div>

                {/* Card 2: 16:9 Landscape Banner */}
                <div className="bg-slate-50/70 dark:bg-[#161B16] rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-slate-950 dark:text-white text-xs">
                        16:9 Hero Banner
                      </span>
                      <div className="flex items-center bg-slate-200/80 dark:bg-[#121612] p-0.5 rounded-lg border border-slate-200 dark:border-white/10 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setBannerMode('file')}
                          className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                            bannerMode === 'file' ? 'bg-[#FEF08A] text-slate-950 font-black shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          File
                        </button>
                        <button
                          type="button"
                          onClick={() => setBannerMode('url')}
                          className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                            bannerMode === 'url' ? 'bg-[#FEF08A] text-slate-950 font-black shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          URL
                        </button>
                      </div>
                    </div>

                    <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 relative group border border-slate-200 dark:border-white/10 shadow-sm">
                      {bannerUrl || posterUrl ? (
                        <img
                          src={bannerUrl || posterUrl}
                          alt="Banner"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                          <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                          <span className="text-[10px] font-bold">No Banner Uploaded</span>
                        </div>
                      )}

                      {uploadingTarget === 'banner' && (
                        <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white">
                          <Loader2 className="w-6 h-6 animate-spin text-[#FEF08A] mb-2" />
                          <span className="text-xs font-bold">Uploading...</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      <span className="truncate">{bannerFile}</span>
                      <span className="text-emerald-500 font-bold shrink-0 ml-1">✓ Active</span>
                    </div>
                  </div>

                  {bannerMode === 'url' ? (
                    <div className="space-y-1.5 pt-1">
                      <input
                        type="url"
                        placeholder="https://.../banner.jpg"
                        value={bannerUrlInput}
                        onChange={(e) => setBannerUrlInput(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#121612] border border-slate-200 dark:border-white/10 rounded-xl text-slate-950 dark:text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleApplyBannerUrl}
                        disabled={!bannerUrlInput.trim()}
                        className="w-full py-1.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-black text-xs transition-all disabled:opacity-40 cursor-pointer"
                      >
                        Apply Banner URL
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={uploadingTarget === 'banner'}
                      onClick={() => bannerInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl bg-white dark:bg-[#121612] hover:bg-[#FEF08A] hover:text-slate-950 dark:hover:bg-[#FEF08A] dark:hover:text-slate-950 text-slate-900 dark:text-white font-extrabold text-xs transition-all flex items-center justify-center space-x-1.5 border border-slate-200 dark:border-white/10 shadow-xs cursor-pointer group disabled:opacity-50"
                    >
                      {uploadingTarget === 'banner' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FolderUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                      )}
                      <span>Replace Banner File</span>
                    </button>
                  )}
                </div>

                {/* Card 3: 9:16 Vertical Teaser Trailer */}
                <div className="bg-slate-50/70 dark:bg-[#161B16] rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-slate-950 dark:text-white text-xs">
                        9:16 Teaser Trailer
                      </span>
                      <div className="flex items-center bg-slate-200/80 dark:bg-[#121612] p-0.5 rounded-lg border border-slate-200 dark:border-white/10 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setTrailerMode('file')}
                          className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                            trailerMode === 'file' ? 'bg-[#FEF08A] text-slate-950 font-black shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          File
                        </button>
                        <button
                          type="button"
                          onClick={() => setTrailerMode('url')}
                          className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                            trailerMode === 'url' ? 'bg-[#FEF08A] text-slate-950 font-black shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          URL
                        </button>
                      </div>
                    </div>

                    <div className="aspect-[9/13] rounded-xl overflow-hidden bg-slate-950 relative group border border-slate-200 dark:border-white/10 shadow-sm flex flex-col items-center justify-center text-center p-4">
                      {trailerUrl ? (
                        <>
                          <div
                            onClick={() => setPreviewVideo({ title: `${title} — Trailer`, url: trailerUrl })}
                            className="w-12 h-12 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </div>
                          <span className="text-white font-black text-xs mt-3">Watch Teaser Video</span>
                          <span className="text-slate-400 text-[10px] mt-0.5 font-mono truncate max-w-[180px]">{trailerFile}</span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-500">
                          <Video className="w-8 h-8 mb-2 opacity-50" />
                          <span className="text-[10px] font-bold">No Trailer Attached</span>
                        </div>
                      )}

                      {uploadingTarget === 'trailer' && (
                        <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white">
                          <Loader2 className="w-6 h-6 animate-spin text-[#FEF08A] mb-2" />
                          <span className="text-xs font-bold">Uploading Video...</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      <span className="truncate">{trailerFile}</span>
                      <span className="text-emerald-500 font-bold shrink-0 ml-1">
                        {trailerUrl ? '✓ Ready' : '—'}
                      </span>
                    </div>
                  </div>

                  {trailerMode === 'url' ? (
                    <div className="space-y-1.5 pt-1">
                      <input
                        type="url"
                        placeholder="https://.../trailer.mp4"
                        value={trailerUrlInput}
                        onChange={(e) => setTrailerUrlInput(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#121612] border border-slate-200 dark:border-white/10 rounded-xl text-slate-950 dark:text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleApplyTrailerUrl}
                        disabled={!trailerUrlInput.trim()}
                        className="w-full py-1.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-black text-xs transition-all disabled:opacity-40 cursor-pointer"
                      >
                        Apply Trailer URL
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={uploadingTarget === 'trailer'}
                      onClick={() => trailerInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl bg-white dark:bg-[#121612] hover:bg-[#FEF08A] hover:text-slate-950 dark:hover:bg-[#FEF08A] dark:hover:text-slate-950 text-slate-900 dark:text-white font-extrabold text-xs transition-all flex items-center justify-center space-x-1.5 border border-slate-200 dark:border-white/10 shadow-xs cursor-pointer group disabled:opacity-50"
                    >
                      {uploadingTarget === 'trailer' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Video className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                      )}
                      <span>Replace Teaser MP4</span>
                    </button>
                  )}
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
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-slate-50/50 dark:from-amber-950/20 dark:via-[#161B16] dark:to-[#121612] rounded-2xl p-5 border border-amber-400/30 dark:border-amber-700/30 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-xs">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-950 dark:text-white text-xs sm:text-sm">
                        Freemium Paywall Architecture
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Set how many teaser episodes mobile viewers can watch before hitting subscriber paywall
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
                  <div className="bg-white dark:bg-[#121612] p-4 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                    <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                      Total Published Episodes
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-black text-slate-950 dark:text-white">
                        {episodesList.length}
                      </span>
                      <span className="text-xs font-bold text-slate-400">Episodes in Series</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#121612] p-4 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                    <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                      Free Preview Episodes
                    </span>
                    <div className="flex items-center justify-between">
                      <input
                        type="number"
                        min={0}
                        max={episodesList.length || 99}
                        value={freeEpisodes}
                        onChange={(e) => setFreeEpisodes(Math.max(0, Number(e.target.value)))}
                        className="text-xl font-black text-amber-600 dark:text-amber-400 bg-transparent border-none focus:outline-none w-24"
                      />
                      <span className="text-xs font-bold text-slate-400">Free before paywall</span>
                    </div>
                  </div>
                </div>

                {/* Visual Ratio Bar */}
                {episodesList.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-[#121612] overflow-hidden flex shadow-inner">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (freeEpisodes / (episodesList.length || 1)) * 100)}%` }}
                        title={`Episodes 1 to ${freeEpisodes} Free`}
                      ></div>
                      <div
                        className="bg-amber-400 h-full transition-all duration-300 flex-1"
                        title={`Episodes ${Number(freeEpisodes) + 1} to ${episodesList.length} Subscriber Locked`}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                        Ep 1–{freeEpisodes} Free for All Users
                      </span>
                      <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                        Ep {Number(freeEpisodes) + 1}+ Requires Subscription
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Episodes List Header */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h4 className="font-extrabold text-slate-950 dark:text-white text-xs sm:text-sm">
                    Episode Sequence & Files ({episodesList.length})
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Click paywall badge to toggle preview, or upload video file for each chapter
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

              {/* Loading Episodes Spinner */}
              {isLoadingEpisodes && (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#FEF08A]" />
                  <span className="text-xs font-semibold">Loading real episodes from MongoDB...</span>
                </div>
              )}

              {/* Empty State when no episodes exist */}
              {!isLoadingEpisodes && episodesList.length === 0 && (
                <div className="py-12 px-6 rounded-2xl bg-white dark:bg-[#161B16] border border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#FEF08A]/30 text-amber-500 flex items-center justify-center mb-3">
                    <FileVideo className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mb-1">
                    No Episodes Attached Yet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                    Add individual episode chapters, or attach video files to populate this series.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddEpisode}
                    className="px-4 py-2 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-extrabold text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Create First Episode</span>
                  </button>
                </div>
              )}

              {/* Episodes Card Rows */}
              {!isLoadingEpisodes && episodesList.length > 0 && (
                <div className="space-y-2.5">
                  {episodesList.map((ep) => {
                    const isUploadingThis = uploadingTarget === `episode-${ep.id}`;
                    return (
                      <div
                        key={ep.id}
                        className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10 hover:border-amber-300/80 dark:hover:border-amber-500/40 transition-all shadow-2xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Left: Number, Title, and Video Specs */}
                          <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                            <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#121612] font-black text-slate-800 dark:text-slate-200 flex items-center justify-center text-xs shrink-0 border border-slate-200/60 dark:border-white/10 shadow-2xs font-mono">
                              {ep.episodeNumber.toString().padStart(2, '0')}
                            </span>

                            <div className="min-w-0 flex-1">
                              <input
                                type="text"
                                value={ep.title}
                                onChange={(e) => handleEpisodeTitleChange(ep.id, e.target.value)}
                                className="w-full font-bold text-slate-950 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-white/20 focus:border-[#FEF08A] focus:outline-none text-xs py-0.5 truncate"
                              />
                              
                              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mt-1 font-mono">
                                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold truncate max-w-[160px]">
                                  <FileVideo className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span className="truncate">{ep.videoFileName || (ep.videoUrl ? 'video.mp4' : 'No Video')}</span>
                                </span>
                                <span>•</span>
                                <span>{ep.duration}</span>
                                <span>•</span>
                                {ep.videoUrl ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">1080p Ready</span>
                                ) : (
                                  <span className="text-amber-500 font-bold">Needs Video</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Upload / Preview, Subtitle badges, Paywall Switcher, and Delete */}
                          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                            
                            {/* Play Preview Button */}
                            {ep.videoUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewVideo({ title: `${title} — ${ep.title}`, url: ep.videoUrl })}
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#121612] hover:bg-[#FEF08A] hover:text-slate-950 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                                title="Play Video Preview"
                              >
                                <Play className="w-3 h-3 fill-current ml-0.5" />
                              </button>
                            )}

                            {/* Upload / Replace Video File Button */}
                            <button
                              type="button"
                              disabled={isUploadingThis}
                              onClick={() => triggerEpisodeUpload(ep.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#121612] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 font-bold text-[10px] flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                              title="Upload/Replace MP4 for this episode"
                            >
                              {isUploadingThis ? (
                                <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                              ) : (
                                <Upload className="w-3 h-3" />
                              )}
                              <span>{ep.videoUrl ? 'Replace' : 'Upload'}</span>
                            </button>

                            {/* Direct Stream URL Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (editingUrlEpId === ep.id) {
                                  setEditingUrlEpId(null);
                                } else {
                                  setEditingUrlEpId(ep.id);
                                  setEditingUrlValue(ep.videoUrl || '');
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg border font-bold text-[10px] flex items-center space-x-1 cursor-pointer transition-colors ${
                                editingUrlEpId === ep.id
                                  ? 'bg-[#FEF08A] text-slate-950 border-amber-300 shadow-2xs'
                                  : 'bg-slate-100 dark:bg-[#121612] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10'
                              }`}
                              title="Enter direct stream / CDN URL"
                            >
                              <Link className="w-3 h-3" />
                              <span>URL</span>
                            </button>

                            {/* Paywall Toggle Badge */}
                            <button
                              type="button"
                              onClick={() => handleTogglePaywall(ep.id)}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs ${
                                ep.isFree
                                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60 hover:bg-emerald-100'
                                  : 'bg-amber-100/80 text-amber-950 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 hover:bg-amber-200/60'
                              }`}
                              title="Click to toggle Free Preview vs Subscriber Locked"
                            >
                              {ep.isFree ? (
                                <>
                                  <Unlock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>FREE</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                                  <span>LOCKED</span>
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

                        {/* Inline Direct Stream URL Editor */}
                        {editingUrlEpId === ep.id && (
                          <div className="p-3 bg-slate-50/80 dark:bg-[#121612] rounded-xl border border-amber-400/40 dark:border-amber-700/40 flex flex-col sm:flex-row items-center gap-2 animate-in fade-in duration-150">
                            <div className="relative flex-1 w-full">
                              <Link className="w-3.5 h-3.5 text-amber-500 absolute left-3 top-2.5" />
                              <input
                                type="url"
                                value={editingUrlValue}
                                onChange={(e) => setEditingUrlValue(e.target.value)}
                                placeholder="https://.../episode.mp4 or .m3u8 stream"
                                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl text-slate-950 dark:text-white font-mono focus:outline-none focus:border-[#FEF08A]"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEpisodeUrl(ep.id);
                                  if (e.key === 'Escape') setEditingUrlEpId(null);
                                }}
                              />
                            </div>
                            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => handleSaveEpisodeUrl(ep.id)}
                                disabled={!editingUrlValue.trim()}
                                className="px-3 py-1.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-black text-xs transition-all disabled:opacity-40 cursor-pointer shadow-xs"
                              >
                                Save URL
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingUrlEpId(null)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-600 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-[#1A201A] flex items-center justify-between shrink-0">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-2">
            {saveSuccess ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Changes saved to MongoDB catalog!</span>
              </span>
            ) : isSaving ? (
              <span className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400 font-bold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synchronizing catalog...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Ready to update live mobile OTT catalog</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 ml-auto">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-7 py-2.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-black text-xs shadow-xs hover:shadow transition-all cursor-pointer flex items-center space-x-1.5 active:scale-98 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-[1100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121612] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <span className="font-extrabold text-sm text-white truncate pr-2">
                {previewVideo.title}
              </span>
              <button
                onClick={() => setPreviewVideo(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-[9/16] max-h-[70vh] bg-black flex items-center justify-center relative">
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

    </div>,
    document.body
  );
}
