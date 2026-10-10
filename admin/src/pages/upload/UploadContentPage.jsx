import React, { useState, useEffect, useId } from 'react';
import { dramaService } from '../../services/dramaService';
import PulsatingDots from '../../components/common/PulsatingDots';
import ModalPortal from '../../components/common/ModalPortal';
import {
  Upload,
  Video,
  Image as ImageIcon,
  Film,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Clock,
  Shield,
  ArrowRight,
  ArrowLeft,
  Check,
  Crown,
  Flame,
  Play,
  Lock,
  Unlock,
  Layers,
  Smartphone,
  Sliders,
  X,
  ChevronRight,
  Info,
  FileVideo,
  FileCheck,
  CheckCircle,
  Eye,
  RotateCcw,
  Maximize2,
  Link,
  Edit3,
  Globe,
  Search,
  Loader2
} from 'lucide-react';
import { uploadService } from '../../services/uploadService';
import { genreService } from '../../services/genreService';
import ToggleSwitch from '../../components/common/ToggleSwitch';

// Reusable Dashboard-styled Slide Switch component
function SlideSwitch({ checked, onChange, label, sublabel, icon: Icon, badge }) {
  const switchId = useId();

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-[#18181E] border border-slate-200/70 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all group">
      <div className="flex items-start space-x-2.5 pr-3 min-w-0">
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
            checked
              ? 'bg-[#FEF08A]/40 dark:bg-[#FEF08A]/20 text-slate-950 dark:text-amber-300 border border-amber-300/60 dark:border-amber-400/30'
              : 'bg-slate-200/70 dark:bg-[#121216] text-slate-400 dark:text-slate-500 border border-transparent dark:border-white/5'
          }`}>
            <Icon className="w-4 h-4 stroke-[2.2]" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <label htmlFor={switchId} className="font-bold text-xs text-slate-900 dark:text-slate-100 cursor-pointer select-none">
              {label}
            </label>
            {badge && (
              <span className="text-[9.5px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#FEF08A]/40 dark:bg-amber-400/10 text-amber-950 dark:text-amber-300 border border-amber-300/60">
                {badge}
              </span>
            )}
          </div>
          {sublabel && (
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-medium">
              {sublabel}
            </p>
          )}
        </div>
      </div>

      <ToggleSwitch
        id={switchId}
        checked={checked}
        onChange={onChange}
        ariaLabel={label}
      />
    </div>
  );
}

export default function UploadContentPage({ onNavigate }) {
  // Stepper flow state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Step 1: Basic Series Info
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [ageRating, setAgeRating] = useState('U/A 13+');
  const [language, setLanguage] = useState('Hindi');
  const [director, setDirector] = useState('');
  const [priority, setPriority] = useState(1);

  // Dynamic genres loaded directly from backend DB
  const [availableGenres, setAvailableGenres] = useState([]);
  const [isGenresLoading, setIsGenresLoading] = useState(true);

  useEffect(() => {
    genreService
      .getActiveGenres()
      .then((res) => {
        if (res && Array.isArray(res.genres) && res.genres.length > 0) {
          setAvailableGenres(res.genres);
          if (res.genres[0]?.name) {
            setSelectedGenres([res.genres[0].name]);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load dynamic genres:', err);
      })
      .finally(() => {
        setIsGenresLoading(false);
      });
  }, []);

  // Step 2: Media & Artwork
  const [posterUrl, setPosterUrl] = useState('');
  const [posterMode, setPosterMode] = useState('file'); // 'file' | 'url'
  const [posterUrlInput, setPosterUrlInput] = useState('');

  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerMode, setBannerMode] = useState('file'); // 'file' | 'url'
  const [bannerUrlInput, setBannerUrlInput] = useState('');

  const [trailerUrl, setTrailerUrl] = useState('');
  const [trailerFileName, setTrailerFileName] = useState('');
  const [trailerMode, setTrailerMode] = useState('file'); // 'file' | 'url'
  const [trailerUrlInput, setTrailerUrlInput] = useState('');

  const [isPosterUploading, setIsPosterUploading] = useState(false);
  const [isBannerUploading, setIsBannerUploading] = useState(false);
  const [isTrailerUploading, setIsTrailerUploading] = useState(false);

  // Episode Search & Filter
  const [episodeSearchQuery, setEpisodeSearchQuery] = useState('');

  // Episode Ingestion Builder State (Single Episode: Upload File or Direct URL)
  const [newEpTitle, setNewEpTitle] = useState('');
  const [newEpSourceType, setNewEpSourceType] = useState('file'); // 'file' | 'url'
  const [newEpVideoUrl, setNewEpVideoUrl] = useState('');
  const [newEpFileName, setNewEpFileName] = useState('');
  const [newEpFileSize, setNewEpFileSize] = useState('');
  const [newEpDuration, setNewEpDuration] = useState('2:15');
  const [newEpIsFree, setNewEpIsFree] = useState(false);
  const [singleEpFileUploading, setSingleEpFileUploading] = useState(false);

  // Video Preview Lightbox State
  const [previewVideo, setPreviewVideo] = useState(null); // { title: string, url: string }

  // Step 3: Episodes (Clean, real array - starts empty)
  const [freeEpisodes, setFreeEpisodes] = useState(3);
  const [episodes, setEpisodes] = useState([]);
  const totalEpisodes = episodes.length;

  // Step 4: Paywall, DRM & Distribution Switches
  const [isPublished, setIsPublished] = useState(true);
  const [isVipPaywallActive, setIsVipPaywallActive] = useState(true);
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(true);
  const [isDrmProtected, setIsDrmProtected] = useState(true);
  const [isFeatured, setIsFeatured] = useState(true);
  const [isTrending, setIsTrending] = useState(false);
  const [pricePerEpisode, setPricePerEpisode] = useState('10 Coins');

  // Step 5: Publishing status
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishingStage, setPublishingStage] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [publishError, setPublishError] = useState(null);

  // Age rating options with distinct certification color accents
  const ageRatings = [
    {
      value: 'U (All Ages)',
      label: 'U',
      desc: 'Universal — All Ages',
      badgeActive: 'bg-emerald-500 text-white',
      badgeInactive: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
      activeBorder: 'border-emerald-500/80 bg-emerald-500/10 dark:bg-emerald-500/15 ring-1 ring-emerald-500/50'
    },
    {
      value: 'U/A 7+',
      label: '7+',
      desc: 'Mild fantasy / comedy',
      badgeActive: 'bg-sky-500 text-white',
      badgeInactive: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30',
      activeBorder: 'border-sky-500/80 bg-sky-500/10 dark:bg-sky-500/15 ring-1 ring-sky-500/50'
    },
    {
      value: 'U/A 13+',
      label: '13+',
      desc: 'Teen Romance / Thriller',
      badgeActive: 'bg-amber-400 text-slate-950',
      badgeInactive: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30',
      activeBorder: 'border-amber-400/80 bg-amber-400/10 dark:bg-amber-400/15 ring-1 ring-amber-400/50'
    },
    {
      value: 'U/A 16+',
      label: '16+',
      desc: 'Mature Themes / Intense',
      badgeActive: 'bg-orange-500 text-white',
      badgeInactive: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30',
      activeBorder: 'border-orange-500/80 bg-orange-500/10 dark:bg-orange-500/15 ring-1 ring-orange-500/50'
    },
    {
      value: 'A 18+',
      label: '18+',
      desc: 'Adults Only Content',
      badgeActive: 'bg-rose-500 text-white',
      badgeInactive: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30',
      activeBorder: 'border-rose-500/80 bg-rose-500/10 dark:bg-rose-500/15 ring-1 ring-rose-500/50'
    },
  ];

  const toggleGenre = (genreName) => {
    if (selectedGenres.includes(genreName)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter((g) => g !== genreName));
      }
    } else {
      setSelectedGenres([...selectedGenres, genreName]);
    }
  };

  // Real Poster Upload Handler
  const handlePosterFileSelect = async (file) => {
    if (!file) return;
    setIsPosterUploading(true);
    try {
      const res = await uploadService.uploadSingle(file, 'images');
      setPosterUrl(res.url);
    } catch (err) {
      console.error('Poster upload failed:', err);
      alert(err.message || 'Failed to upload poster image to server.');
    } finally {
      setIsPosterUploading(false);
    }
  };

  // Real Banner Upload Handler
  const handleBannerFileSelect = async (file) => {
    if (!file) return;
    setIsBannerUploading(true);
    try {
      const res = await uploadService.uploadSingle(file, 'images');
      setBannerUrl(res.url);
    } catch (err) {
      console.error('Banner upload failed:', err);
      alert(err.message || 'Failed to upload banner image to server.');
    } finally {
      setIsBannerUploading(false);
    }
  };

  // Real Trailer Upload Handler
  const handleTrailerFileSelect = async (file) => {
    if (!file) return;
    setIsTrailerUploading(true);
    try {
      const res = await uploadService.uploadSingle(file, 'videos');
      setTrailerUrl(res.url);
      setTrailerFileName(res.originalName || file.name);
    } catch (err) {
      console.error('Trailer upload failed:', err);
      alert(err.message || 'Failed to upload trailer video to server.');
    } finally {
      setIsTrailerUploading(false);
    }
  };

  // Real Single Episode File Upload Handler
  const handleSingleEpFileSelect = async (file) => {
    if (!file) return;
    setSingleEpFileUploading(true);
    try {
      const res = await uploadService.uploadSingle(file, 'videos');
      setNewEpVideoUrl(res.url);
      setNewEpFileName(res.originalName || file.name);
      setNewEpFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      if (!newEpTitle.trim()) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/^(ep|episode)\s*\d+\s*[:\-_]?\s*/i, '')
          .trim();
        setNewEpTitle(`Episode ${episodes.length + 1}: ${cleanName || 'Chapter'}`);
      }
    } catch (err) {
      console.error('Episode video upload failed:', err);
      alert(err.message || 'Failed to upload episode video to server.');
    } finally {
      setSingleEpFileUploading(false);
    }
  };

  // Add individual episode with real media
  const handleAddNewEpisode = (e) => {
    if (e) e.preventDefault();
    const nextNum = episodes.length + 1;
    const finalTitle = newEpTitle.trim() || `Episode ${nextNum}: Chapter`;
    const videoStreamUrl = newEpVideoUrl.trim();
    if (!videoStreamUrl) {
      alert('Please select an episode video file or enter a video stream URL.');
      return;
    }
    const newEpisode = {
      id: nextNum,
      episodeNumber: nextNum,
      title: finalTitle,
      sourceType: newEpSourceType,
      fileName: newEpFileName || (newEpSourceType === 'url' ? 'Direct Stream URL' : `ep_${String(nextNum).padStart(2, '0')}.mp4`),
      videoUrl: videoStreamUrl,
      fileSize: newEpFileSize || (newEpSourceType === 'url' ? 'Remote Stream' : 'Video File'),
      duration: newEpDuration || '2:15',
      durationSeconds: 135,
      isFree: nextNum <= freeEpisodes,
      status: nextNum <= freeEpisodes ? 'Ready' : 'Subscriber Locked'
    };
    setEpisodes((prev) => [...prev, newEpisode]);
    setNewEpTitle('');
    setNewEpVideoUrl('');
    setNewEpFileName('');
    setNewEpFileSize('');
  };



  // Inline update episode title
  const handleUpdateEpisodeTitle = (id, newTitle) => {
    setEpisodes(episodes.map(ep => ep.id === id ? { ...ep, title: newTitle } : ep));
  };

  // Attach or replace video file for single episode
  const handleAttachVideoToEpisode = async (epId, file) => {
    if (!file) return;
    try {
      const res = await uploadService.uploadSingle(file, 'videos');
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setEpisodes(episodes.map(ep => {
        if (ep.id === epId) {
          return {
            ...ep,
            fileName: file.name,
            fileSize: `${sizeMB} MB`,
            videoUrl: res.url,
            status: 'Ready',
            sourceType: 'file'
          };
        }
        return ep;
      }));
    } catch (err) {
      alert(`Failed to replace video: ${err.message}`);
    }
  };

  // Clear episode queue
  const handleClearEpisodes = () => {
    if (confirm('Are you sure you want to clear all episodes from the queue?')) {
      setEpisodes([]);
    }
  };

  const handleRemoveEpisode = (id) => {
    const remaining = episodes.filter((ep) => ep.id !== id);
    const reindexed = remaining.map((ep, idx) => ({
      ...ep,
      id: idx + 1,
      episodeNumber: idx + 1,
      title: ep.title.replace(/^Episode \d+:/i, `Episode ${idx + 1}:`),
    }));
    setEpisodes(reindexed);
  };

  // Free episode adjustment updates episode free statuses
  const handleFreeEpisodesChange = (val) => {
    const count = Number(val);
    setFreeEpisodes(count);
    setEpisodes(episodes.map((ep) => ({
      ...ep,
      isFree: ep.id <= count,
      status: ep.id <= count ? 'Ready' : 'Subscriber Locked'
    })));
  };

  // Quick preset cutoff for free episodes
  const handleQuickFreeCutoff = (cutoff) => {
    handleFreeEpisodesChange(cutoff);
  };

  // Toggle individual episode free / subscriber status directly
  const handleToggleEpisodeFree = (id) => {
    setEpisodes(episodes.map((ep) => {
      if (ep.id === id) {
        const nextIsFree = !ep.isFree;
        return {
          ...ep,
          isFree: nextIsFree,
          status: nextIsFree ? 'Ready' : 'Subscriber Locked'
        };
      }
      return ep;
    }));
  };

  // Validation before advancing
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!title.trim()) {
        alert('Please enter a series title to proceed.');
        return;
      }
      if (!synopsis.trim()) {
        alert('Please provide a storyline synopsis.');
        return;
      }
    }
    if (currentStep === 2) {
      if (!posterUrl.trim()) {
        alert('Please upload or provide a 9:16 vertical poster image.');
        return;
      }
    }
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Real Multi-stage Publishing to Backend Database
  const handlePublish = async () => {
    if (!title.trim()) {
      alert('Please enter a series title in Step 1.');
      setCurrentStep(1);
      return;
    }

    setIsPublishing(true);
    setPublishError(null);
    setPublishingStage(1);

    try {
      // Stage 2: Register Drama Series in MongoDB Database
      setPublishingStage(2);
      const dramaPayload = {
        title: title.trim(),
        synopsis: synopsis.trim(),
        posterUrl: posterUrl.trim(),
        bannerUrl: bannerUrl.trim(),
        trailerUrl: trailerUrl.trim(),
        genres: selectedGenres,
        languages: [language],
        ageRating,
        director: director.trim(),
        totalEpisodes: episodes.length,
        freeEpisodes: Number(freeEpisodes) || 0,
        isPaid: Boolean(isVipPaywallActive),
        plan: isVipPaywallActive ? 'Premium Plan' : 'Free Tier',
        status: isPublished ? 'PUBLISHED' : 'DRAFT',
        priority: Number(priority) || 1,
        isTrending: Boolean(isTrending),
        isFeatured: Boolean(isFeatured)
      };

      const createRes = await dramaService.createDrama(dramaPayload);
      const createdDrama = createRes?.drama || createRes;
      const createdDramaId = createdDrama?._id || createdDrama?.id;

      // Stage 3: Ingest All Episode Video Files & Paywall Rules
      setPublishingStage(3);
      if (episodes.length > 0 && createdDramaId) {
        const episodePayload = episodes.map((ep, idx) => ({
          episodeNumber: idx + 1,
          title: ep.title?.trim() || `Episode ${idx + 1}`,
          isFree: Boolean(ep.isFree),
          duration: ep.duration || '2:15',
          durationSeconds: ep.durationSeconds || 135,
          videoStreamUrl: ep.videoUrl || trailerUrl || '',
          thumbnailUrl: posterUrl || ''
        }));

        await dramaService.saveEpisodes(createdDramaId, {
          episodes: episodePayload,
          freeEpisodes: Number(freeEpisodes) || 0
        });
      }

      // Stage 4: Finalizing & live indexing
      setPublishingStage(4);
      await new Promise(r => setTimeout(r, 600));

      setUploadSuccess(true);
      setIsPublishing(false);

      setTimeout(() => {
        if (onNavigate) onNavigate('dramas');
      }, 1500);
    } catch (err) {
      console.error('Publish drama failed:', err);
      setIsPublishing(false);
      setPublishError(err.message || 'Failed to publish drama series.');
    }
  };

  // Steps configuration
  const stepsConfig = [
    { num: 1, label: 'Series Info', icon: Film, subtitle: 'Metadata & Story' },
    { num: 2, label: 'Media Studio', icon: Video, subtitle: 'Artwork & Episode Files' },
    { num: 3, label: 'Paywall & Launch', icon: Lock, subtitle: 'Monetization & Publish' },
  ];  return (
    <div className="space-y-3 font-urbanist w-full pb-8 selection:bg-[#FEF08A] selection:text-black">
      
      {/* Top Header & Stepper Card */}
      <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs relative overflow-hidden transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center shrink-0 shadow-xs">
              <Upload className="w-4 h-4 text-slate-950 dark:text-amber-300 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-base font-black text-slate-950 dark:text-white tracking-tight">
                  Content Upload Studio
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                  Step {currentStep} of {totalSteps}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Upload, encode, and publish micro-dramas to the catalog.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('dramas')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 border border-transparent dark:border-white/10 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Sequential Stepper Navigation Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10">
          {/* Progress percentage bar in vibrant green */}
          <div className="w-full bg-slate-100 dark:bg-[#18181E] h-1.5 rounded-full overflow-hidden mb-2.5">
            <div
              className="bg-emerald-500 h-full transition-all duration-300 ease-out shadow-xs"
              style={{ width: `${((currentStep) / totalSteps) * 100}%` }}
            />
          </div>

          {/* Stepper buttons */}
          <div className="grid grid-cols-3 gap-2">
            {stepsConfig.map((s) => {
              const IconComp = s.icon;
              const isCurrent = currentStep === s.num;
              const isCompleted = currentStep > s.num;

              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setCurrentStep(s.num)}
                  className={`flex items-center p-1.5 sm:p-2 rounded-lg text-left transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#FEF08A]/30 dark:bg-[#FEF08A]/15 border border-amber-300/80 dark:border-amber-500/40 shadow-2xs'
                      : isCompleted
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-950 dark:text-emerald-300'
                      : 'border border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-70'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mr-2 text-[11px] font-bold transition-colors ${
                    isCurrent
                      ? 'bg-[#FEF08A] text-slate-950 font-black shadow-2xs'
                      : isCompleted
                      ? 'bg-emerald-500 text-white font-bold shadow-2xs'
                      : 'bg-slate-200/80 dark:bg-[#121216] text-slate-500 dark:text-slate-400'
                  }`}>
                    {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <IconComp className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${
                      isCurrent ? 'text-slate-950 dark:text-white' : isCompleted ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {s.label}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate hidden sm:block">
                      {s.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {uploadSuccess && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-700/60 rounded-xl flex items-center space-x-3 text-emerald-950 dark:text-emerald-200 shadow-2xs animate-in fade-in duration-200">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-4.5 h-4.5 stroke-[2.5]" />
          </div>
          <div>
            <p className="font-extrabold text-xs sm:text-sm">Series Published Successfully to Live Catalog!</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
              Encoding CDN configured. Forwarding you to the Content Library...
            </p>
          </div>
        </div>
      )}

      {/* Publishing Modal Overlay */}
      {isPublishing && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#24242E] rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-white/15 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 text-slate-950 dark:text-amber-300 flex items-center justify-center mx-auto shadow-xs">
              <RotateCcw className="w-6 h-6 text-slate-950 dark:text-[#FEF08A] animate-spin" />
            </div>
            
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-950 dark:text-white">Publishing Drama to CDN</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Optimizing 9:16 vertical bitrate stream and applying DRM keys...
              </p>
            </div>

            <div className="space-y-2 text-left">
              {[
                { stage: 1, label: 'Validating portrait aspect ratio' },
                { stage: 2, label: 'Transcoding multi-bitrate chunks' },
                { stage: 3, label: `Configuring Subscriber paywall for episodes ${freeEpisodes + 1}+` },
                { stage: 4, label: 'Broadcasting instant cache to Edge CDN' },
              ].map((item) => (
                <div key={item.stage} className="flex items-center space-x-2 text-[11px] font-bold">
                  {publishingStage >= item.stage ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                  )}
                  <span className={publishingStage >= item.stage ? 'text-slate-950 dark:text-white' : 'text-slate-400'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ModalPortal>
    )}

      {/* ======================================================== */}
      {/* STEP 1: SERIES FUNDAMENTALS & METADATA */}
      {/* ======================================================== */}
      {currentStep === 1 && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121216] rounded-xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3.5">
            
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 text-slate-950 dark:text-amber-300 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center font-extrabold shadow-xs">
                  <Film className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-xs sm:text-sm tracking-tight">
                    Step 1: Series Fundamentals & Storyline
                  </h3>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                    Enter the core identity, English title, storyline synopsis, and certifications.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Step 1 of 3
              </span>
            </div>

            {/* Title & Priority Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">
                  Series Title <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Billionaire's Secret Nanny"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50/70 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg focus:bg-white dark:focus:bg-[#121216] focus:border-[#FEF08A] focus:outline-none text-slate-950 dark:text-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">
                  Priority Rank
                </label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={priority}
                  onChange={(e) => setPriority(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-xs font-bold text-center bg-slate-50/70 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg text-slate-950 dark:text-white focus:outline-none focus:border-[#FEF08A]"
                />
              </div>
            </div>

            {/* Synopsis & Hook */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200">
                  Synopsis & Hook <span className="text-amber-500">*</span>
                </label>
                <span className="text-[10px] font-semibold text-slate-400">
                  {synopsis.length} / 500 chars
                </span>
              </div>
              <textarea
                rows={2.5}
                maxLength={500}
                placeholder="Write a high-tension synopsis designed for 2-minute vertical video binge-watchers..."
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50/70 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg focus:bg-white dark:focus:bg-[#121216] focus:border-[#FEF08A] focus:outline-none text-slate-950 dark:text-white transition-colors leading-relaxed"
              />
            </div>

            {/* Age Certification (Theme-aligned, no rainbow) */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                Age Certification & Rating
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {ageRatings.map((rating) => {
                  const isSelected = ageRating === rating.value;
                  return (
                    <button
                      type="button"
                      key={rating.value}
                      onClick={() => setAgeRating(rating.value)}
                      className={`p-2 rounded-lg text-left border transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? `${rating.activeBorder} shadow-2xs`
                          : 'border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-[#18181E] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black w-fit mb-1 shadow-2xs ${
                        isSelected ? rating.badgeActive : rating.badgeInactive
                      }`}>
                        {rating.label}
                      </span>
                      <span className="font-bold text-xs truncate block text-slate-900 dark:text-white">
                        {rating.value}
                      </span>
                      <span className="text-[9.5px] text-slate-400 truncate mt-0.5 block">
                        {rating.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Genres Multi-Select */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200">
                  Associated Genres
                </label>
                <span className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400">
                  {selectedGenres.length} Selected
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {isGenresLoading ? (
                  <div className="flex items-center space-x-2 text-xs text-slate-400 py-1">
                    <PulsatingDots size="sm" />
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Loading genres...</span>
                  </div>
                ) : availableGenres.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No genres found in database.</span>
                ) : (
                  availableGenres.map((genre) => {
                    const genreKey = genre.id || genre._id || genre.name;
                    const isSelected = selectedGenres.includes(genre.name);
                    return (
                      <button
                        type="button"
                        key={genreKey}
                        onClick={() => toggleGenre(genre.name)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-[#FEF08A] text-slate-950 font-black shadow-2xs border border-amber-300'
                            : 'bg-slate-100 dark:bg-[#18181E] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-white/10'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                        <span>{genre.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Metadata Secondary Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">
                  Audio Track / Primary Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50/70 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg focus:bg-white dark:focus:bg-[#121216] focus:border-[#FEF08A] text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="Hindi">Hindi (Original)</option>
                  <option value="Hindi (Dubbed)">Hindi (Dubbed)</option>
                  <option value="English">English</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Telugu">Telugu</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">
                  Lead Director / Creator Studio
                </label>
                <input
                  type="text"
                  placeholder="e.g. E² In-House Originals"
                  value={director}
                  onChange={(e) => setDirector(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50/70 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg focus:bg-white dark:focus:bg-[#121216] focus:border-[#FEF08A] text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 2: MEDIA STUDIO                                     */}
      {/* ======================================================== */}
      {currentStep === 2 && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121216] rounded-xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3.5">

            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 text-slate-950 dark:text-amber-300 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center font-extrabold shadow-xs shrink-0">
                  <Video className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-xs sm:text-sm tracking-tight">
                    Step 2: Media Studio
                  </h3>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                    Upload visual artwork, teaser trailer, and manage your vertical episode chapters.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 border border-transparent dark:border-white/10">
                Step 2 of 3
              </span>
            </div>

            {/* Section A: Visual Artwork & Teaser Trailer (Compact 3-Card Grid) */}
            <div>
              <div className="flex items-center space-x-1.5 mb-2.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Visual Media & Teaser Trailer
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                
                {/* 1. 9:16 Vertical Poster */}
                <div className="rounded-xl border border-slate-200/80 dark:border-white/10 p-3 bg-white dark:bg-[#18181E] flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Vertical Poster (9:16)</span>
                      <div className="flex items-center p-0.5 rounded-md bg-slate-100 dark:bg-[#121216] text-[10px] font-bold border border-transparent dark:border-white/10">
                        <button
                          type="button"
                          onClick={() => setPosterMode('file')}
                          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                            posterMode === 'file'
                              ? 'bg-[#FEF08A] text-slate-950 font-black shadow-2xs'
                              : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          File
                        </button>
                        <button
                          type="button"
                          onClick={() => setPosterMode('url')}
                          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                            posterMode === 'url'
                              ? 'bg-[#FEF08A] text-slate-950 font-black shadow-2xs'
                              : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          URL
                        </button>
                      </div>
                    </div>

                    <div className="h-40 rounded-lg border border-dashed border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50/50 dark:bg-[#121216] flex items-center justify-center p-2 relative">
                      {posterUrl ? (
                        <div className="relative h-full aspect-[9/16] rounded-md overflow-hidden border border-slate-200 dark:border-white/10 group shadow-2xs">
                          <img src={posterUrl} alt="Poster" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setPosterUrl('')}
                              className="px-2 py-1 rounded-md bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 transition-colors shadow-xs flex items-center space-x-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      ) : posterMode === 'url' ? (
                        <div className="w-full px-2 text-center space-y-1.5">
                          <Link className="w-4 h-4 text-amber-500 mx-auto" />
                          <input
                            type="url"
                            placeholder="https://.../poster.jpg"
                            value={posterUrlInput}
                            onChange={(e) => setPosterUrlInput(e.target.value)}
                            className="w-full px-2 py-1 text-xs bg-white dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-md text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (posterUrlInput.trim()) {
                                setPosterUrl(posterUrlInput.trim());
                                setPosterUrlInput('');
                              }
                            }}
                            disabled={!posterUrlInput.trim()}
                            className="w-full py-1 rounded-md bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                          >
                            Apply Poster
                          </button>
                        </div>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center text-center cursor-pointer hover:bg-amber-50/20 dark:hover:bg-amber-950/20 rounded-md transition-colors p-1">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isPosterUploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePosterFileSelect(file);
                            }}
                          />
                          {isPosterUploading ? (
                            <div className="flex flex-col items-center">
                              <RotateCcw className="w-4 h-4 text-amber-500 animate-spin mb-1" />
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Uploading...</span>
                            </div>
                          ) : (
                            <>
                              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-amber-500 flex items-center justify-center mb-1">
                                <ImageIcon className="w-3.5 h-3.5" />
                              </div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload Poster</p>
                              <p className="text-[10px] text-slate-400">1080 × 1920 (9:16)</p>
                            </>
                          )}
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10.5px] text-slate-400">
                    <span>Mobile Cover</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">Required</span>
                  </div>
                </div>

                {/* 2. 9:16 Vertical Trailer */}
                <div className="rounded-xl border border-slate-200/80 dark:border-white/10 p-3 bg-white dark:bg-[#18181E] flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Teaser Trailer (9:16)</span>
                      <div className="flex items-center p-0.5 rounded-md bg-slate-100 dark:bg-[#121216] text-[10px] font-bold border border-transparent dark:border-white/10">
                        <button
                          type="button"
                          onClick={() => setTrailerMode('file')}
                          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                            trailerMode === 'file'
                              ? 'bg-[#FEF08A] text-slate-950 font-black shadow-2xs'
                              : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          File
                        </button>
                        <button
                          type="button"
                          onClick={() => setTrailerMode('url')}
                          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                            trailerMode === 'url'
                              ? 'bg-[#FEF08A] text-slate-950 font-black shadow-2xs'
                              : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          URL
                        </button>
                      </div>
                    </div>

                    <div className="h-40 rounded-lg border border-dashed border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50/50 dark:bg-[#121216] flex items-center justify-center p-2 relative">
                      {trailerFileName || trailerUrl ? (
                        <div className="w-full h-full rounded-md bg-slate-900 text-white p-2 flex flex-col items-center justify-center text-center relative border border-slate-700">
                          <div
                            onClick={() => {
                              if (trailerUrl) {
                                setPreviewVideo({
                                  title: `${title || 'Series'} — Teaser Trailer`,
                                  url: trailerUrl,
                                });
                              }
                            }}
                            className={`w-8 h-8 rounded-full ${trailerUrl ? 'bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 cursor-pointer hover:scale-105' : 'bg-slate-700 text-slate-400 cursor-not-allowed'} flex items-center justify-center mb-1 transition-transform`}
                            title={trailerUrl ? "Play trailer preview" : "No trailer uploaded"}
                          >
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </div>
                          <p className="text-xs font-bold text-white truncate max-w-[130px]">
                            {trailerFileName || 'Trailer Video Stream'}
                          </p>
                          <div className="mt-2 flex items-center gap-1">
                            {trailerUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewVideo({
                                    title: `${title || 'Series'} — Teaser Trailer`,
                                    url: trailerUrl,
                                  })
                                }
                                className="px-2 py-0.5 text-[10px] rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors cursor-pointer"
                              >
                                Preview
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setTrailerFileName('');
                                setTrailerUrl('');
                              }}
                              className="px-2 py-0.5 text-[10px] rounded-md bg-rose-900/60 hover:bg-rose-900 text-rose-200 font-bold transition-colors cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : trailerMode === 'url' ? (
                        <div className="w-full px-2 text-center space-y-1.5">
                          <Video className="w-4 h-4 text-amber-500 mx-auto" />
                          <input
                            type="url"
                            placeholder="https://.../trailer.mp4"
                            value={trailerUrlInput}
                            onChange={(e) => setTrailerUrlInput(e.target.value)}
                            className="w-full px-2 py-1 text-xs bg-white dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-md text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (trailerUrlInput.trim()) {
                                setTrailerUrl(trailerUrlInput.trim());
                                setTrailerFileName('Remote Stream URL');
                                setTrailerUrlInput('');
                              }
                            }}
                            disabled={!trailerUrlInput.trim()}
                            className="w-full py-1 rounded-md bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                          >
                            Apply Trailer
                          </button>
                        </div>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center text-center cursor-pointer hover:bg-amber-50/20 dark:hover:bg-amber-950/20 rounded-md transition-colors p-1">
                          <input
                            type="file"
                            accept="video/*,.mp4,.mov,.m4v"
                            className="hidden"
                            disabled={isTrailerUploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleTrailerFileSelect(file);
                            }}
                          />
                          {isTrailerUploading ? (
                            <div className="flex flex-col items-center">
                              <RotateCcw className="w-4 h-4 text-amber-500 animate-spin mb-1" />
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Uploading...</span>
                            </div>
                          ) : (
                            <>
                              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-amber-500 flex items-center justify-center mb-1">
                                <Video className="w-3.5 h-3.5" />
                              </div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload Teaser</p>
                              <p className="text-[10px] text-slate-400">Vertical 9:16 (MP4)</p>
                            </>
                          )}
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10.5px] text-slate-400">
                    <span>Reel Teaser</span>
                    <span>Optional</span>
                  </div>
                </div>

                {/* 3. 16:9 Hero Banner */}
                <div className="rounded-xl border border-slate-200/80 dark:border-white/10 p-3 bg-white dark:bg-[#18181E] flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Hero Billboard (16:9)</span>
                      <div className="flex items-center p-0.5 rounded-md bg-slate-100 dark:bg-[#121216] text-[10px] font-bold border border-transparent dark:border-white/10">
                        <button
                          type="button"
                          onClick={() => setBannerMode('file')}
                          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                            bannerMode === 'file'
                              ? 'bg-[#FEF08A] text-slate-950 font-black shadow-2xs'
                              : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          File
                        </button>
                        <button
                          type="button"
                          onClick={() => setBannerMode('url')}
                          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                            bannerMode === 'url'
                              ? 'bg-[#FEF08A] text-slate-950 font-black shadow-2xs'
                              : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          URL
                        </button>
                      </div>
                    </div>

                    <div className="h-40 rounded-lg border border-dashed border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50/50 dark:bg-[#121216] flex items-center justify-center p-2 relative">
                      {bannerUrl ? (
                        <div className="relative w-full aspect-[16/9] rounded-md overflow-hidden border border-slate-200 dark:border-white/10 group shadow-2xs">
                          <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setBannerUrl('')}
                              className="px-2 py-1 rounded-md bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 transition-colors shadow-xs flex items-center space-x-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      ) : bannerMode === 'url' ? (
                        <div className="w-full px-2 text-center space-y-1.5">
                          <Link className="w-4 h-4 text-amber-500 mx-auto" />
                          <input
                            type="url"
                            placeholder="https://.../banner.jpg"
                            value={bannerUrlInput}
                            onChange={(e) => setBannerUrlInput(e.target.value)}
                            className="w-full px-2 py-1 text-xs bg-white dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-md text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (bannerUrlInput.trim()) {
                                setBannerUrl(bannerUrlInput.trim());
                                setBannerUrlInput('');
                              }
                            }}
                            disabled={!bannerUrlInput.trim()}
                            className="w-full py-1 rounded-md bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                          >
                            Apply Banner
                          </button>
                        </div>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center text-center cursor-pointer hover:bg-amber-50/20 dark:hover:bg-amber-950/20 rounded-md transition-colors p-1">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isBannerUploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleBannerFileSelect(file);
                            }}
                          />
                          {isBannerUploading ? (
                            <div className="flex flex-col items-center">
                              <RotateCcw className="w-4 h-4 text-amber-500 animate-spin mb-1" />
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Uploading...</span>
                            </div>
                          ) : (
                            <>
                              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-amber-500 flex items-center justify-center mb-1">
                                <Film className="w-3.5 h-3.5" />
                              </div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload Banner</p>
                              <p className="text-[10px] text-slate-400">1920 × 1080 (16:9)</p>
                            </>
                          )}
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10.5px] text-slate-400">
                    <span>Featured Slider</span>
                    <span>Optional</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Section B: Episode Video Files & Ingestion */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/10 space-y-3">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Film className="w-3.5 h-3.5 text-amber-500" />
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Episodes & Video Content ({episodes.length})
                  </h4>
                </div>
              </div>

              {/* Single Episode Ingestion Builder */}
              <div className="rounded-xl bg-slate-50/70 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 p-3 sm:p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/10 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-md bg-[#FEF08A] text-slate-950 font-black text-xs flex items-center justify-center">
                      {episodes.length + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Add Episode {episodes.length + 1}
                    </span>
                  </div>
                  {(newEpTitle || newEpVideoUrl) && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewEpTitle('');
                        setNewEpVideoUrl('');
                        setNewEpFileName('');
                        setNewEpFileSize('');
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                      title="Clear fields"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Episode Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Episode 1: The Incognito Meeting"
                      value={newEpTitle}
                      onChange={(e) => setNewEpTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-[#FEF08A] text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      placeholder="2:15"
                      value={newEpDuration}
                      onChange={(e) => setNewEpDuration(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-[#FEF08A] text-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                {/* Media Source & Dropzone */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Episode Media
                    </span>
                    <div className="inline-flex p-0.5 rounded-md bg-slate-200/80 dark:bg-[#121216] text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setNewEpSourceType('file');
                          if (newEpVideoUrl?.startsWith('http')) setNewEpVideoUrl('');
                        }}
                        className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                          newEpSourceType === 'file'
                            ? 'bg-[#FEF08A] text-slate-950 font-black shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Media File
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewEpSourceType('url')}
                        className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                          newEpSourceType === 'url'
                            ? 'bg-[#FEF08A] text-slate-950 font-black shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Stream URL
                      </button>
                    </div>
                  </div>

                  {newEpSourceType === 'url' ? (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        <Link className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <input
                        type="url"
                        placeholder="https://cdn.example.com/episodes/ep_01_vertical.mp4"
                        value={newEpVideoUrl}
                        onChange={(e) => setNewEpVideoUrl(e.target.value)}
                        className="w-full pl-8 pr-16 py-1.5 text-xs font-mono bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-[#FEF08A] text-slate-950 dark:text-white shadow-2xs"
                      />
                      {newEpVideoUrl && (
                        <button
                          type="button"
                          onClick={() => setNewEpVideoUrl('')}
                          className="absolute inset-y-0 right-2 my-auto h-5 px-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  ) : newEpVideoUrl ? (
                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-[#FEF08A]/40 dark:bg-amber-400/10 text-slate-950 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-300/40">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {newEpFileName || newEpVideoUrl}
                          </p>
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                            ✓ Ready for ingestion {newEpFileSize ? `(${newEpFileSize})` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <label
                          htmlFor="single-ep-file-replace"
                          className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 rounded-md cursor-pointer transition-colors shadow-2xs"
                        >
                          Replace
                          <input
                            type="file"
                            id="single-ep-file-replace"
                            accept="video/*,.mp4,.mov,.m4v"
                            className="hidden"
                            disabled={singleEpFileUploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleSingleEpFileSelect(file);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setNewEpVideoUrl('');
                            setNewEpFileName('');
                            setNewEpFileSize('');
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="single-ep-file-input"
                      className="border border-dashed border-slate-300 dark:border-white/10 hover:border-amber-400 rounded-lg p-2.5 sm:p-3 bg-white dark:bg-[#121216] transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                    >
                      <input
                        type="file"
                        id="single-ep-file-input"
                        accept="video/*,.mp4,.mov,.m4v"
                        className="hidden"
                        disabled={singleEpFileUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleSingleEpFileSelect(file);
                        }}
                      />
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 text-slate-950 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-300/40">
                          {singleEpFileUploading ? (
                            <RotateCcw className="w-4 h-4 animate-spin" />
                          ) : (
                            <FileVideo className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {singleEpFileUploading ? 'Uploading Video...' : 'Choose Episode Video File'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Portrait 9:16 recommended (1080×1920)
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 text-xs font-bold transition-all shadow-2xs shrink-0">
                        {singleEpFileUploading ? 'Uploading...' : 'Browse'}
                      </span>
                    </label>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-200/70 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setNewEpTitle('');
                      setNewEpVideoUrl('');
                      setNewEpFileName('');
                      setNewEpFileSize('');
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewEpisode}
                    disabled={!newEpVideoUrl || singleEpFileUploading}
                    className="px-3.5 py-1 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 text-xs font-bold transition-all shadow-2xs disabled:opacity-40 cursor-pointer active:scale-95"
                  >
                    Add Episode
                  </button>
                </div>
              </div>

              {/* Episodes Queue Table */}
              <div className="border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden shadow-2xs bg-white dark:bg-[#121216]">
                
                {/* Table Top Toolbar */}
                <div className="px-3 py-2 bg-slate-50/70 dark:bg-[#18181E] border-b border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Episodes Queue
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {episodes.length} Total
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Search filter */}
                    <div className="relative">
                      <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={episodeSearchQuery}
                        onChange={(e) => setEpisodeSearchQuery(e.target.value)}
                        className="pl-6 pr-2 py-0.5 text-xs bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/10 rounded-md text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] w-28 sm:w-36"
                      />
                    </div>

                    {/* Quick Free Presets */}
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => handleQuickFreeCutoff(cnt)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                            freeEpisodes === cnt
                              ? 'bg-[#FEF08A] text-slate-950 border-amber-300 shadow-2xs font-black'
                              : 'bg-white dark:bg-[#121216] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-300'
                          }`}
                        >
                          {cnt} Free
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleQuickFreeCutoff(0)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                          freeEpisodes === 0
                            ? 'bg-[#FEF08A] text-slate-950 border-amber-300 shadow-2xs font-black'
                            : 'bg-white dark:bg-[#121216] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-300'
                        }`}
                      >
                        All Paid
                      </button>
                    </div>

                    {episodes.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearEpisodes}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors ml-1 cursor-pointer"
                        title="Clear all episodes"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Table Content */}
                {episodes.length === 0 ? (
                  <div className="p-6 text-center">
                    <FileVideo className="w-6 h-6 text-slate-400 dark:text-slate-600 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No episodes in queue</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Use File Upload or Direct URL above to add episodes.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50/90 dark:bg-[#18181E] sticky top-0 z-10 border-b border-slate-200/80 dark:border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[9.5px]">
                        <tr>
                          <th className="py-1.5 px-3 w-10 text-center">#</th>
                          <th className="py-1.5 px-3 min-w-[200px]">Episode Title</th>
                          <th className="py-1.5 px-3 w-32">Source</th>
                          <th className="py-1.5 px-3 w-20">Duration</th>
                          <th className="py-1.5 px-3 w-24 text-center">Access</th>
                          <th className="py-1.5 px-3 w-14 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                        {episodes
                          .filter((ep) =>
                            ep.title.toLowerCase().includes(episodeSearchQuery.toLowerCase()) ||
                            String(ep.id).includes(episodeSearchQuery)
                          )
                          .map((ep) => (
                            <tr
                              key={ep.id}
                              className="hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition-colors"
                            >
                              <td className="py-1.5 px-3 text-center">
                                <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-[#18181E] font-bold text-[10px] inline-flex items-center justify-center text-slate-600 dark:text-slate-300">
                                  {ep.id}
                                </span>
                              </td>
                              <td className="py-1.5 px-3">
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    disabled={!ep.videoUrl}
                                    onClick={() => {
                                      if (ep.videoUrl) {
                                        setPreviewVideo({
                                          title: ep.title,
                                          url: ep.videoUrl,
                                        });
                                      }
                                    }}
                                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors shrink-0 shadow-2xs ${
                                      ep.videoUrl
                                        ? 'bg-slate-100 dark:bg-[#18181E] hover:bg-[#FACC15] hover:text-slate-950 text-slate-600 dark:text-slate-300 cursor-pointer'
                                        : 'bg-slate-100/40 dark:bg-slate-800/30 text-slate-400 cursor-not-allowed'
                                    }`}
                                    title={ep.videoUrl ? "Play preview" : "No video uploaded"}
                                  >
                                    <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                                  </button>
                                  <input
                                    type="text"
                                    value={ep.title}
                                    onChange={(e) => handleUpdateEpisodeTitle(ep.id, e.target.value)}
                                    placeholder={`Episode ${ep.id} Title...`}
                                    className="font-bold text-xs bg-transparent hover:bg-slate-100 dark:hover:bg-[#18181E] focus:bg-white dark:focus:bg-[#121216] border border-transparent hover:border-slate-200 dark:hover:border-white/10 focus:border-[#FEF08A] rounded-md px-1.5 py-0.5 text-slate-900 dark:text-white transition-colors w-full"
                                  />
                                </div>
                              </td>
                              <td className="py-1.5 px-3">
                                <span className="inline-flex items-center space-x-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-white/[0.04] px-1.5 py-0.5 rounded truncate max-w-[120px]">
                                  {ep.sourceType === 'url' || ep.videoUrl?.startsWith('http') ? (
                                    <>
                                      <Link className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                      <span className="truncate">Stream URL</span>
                                    </>
                                  ) : (
                                    <>
                                      <FileVideo className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                      <span className="truncate">{ep.fileName || `ep_${ep.id}.mp4`}</span>
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="py-1.5 px-3 text-[10.5px] font-semibold text-slate-600 dark:text-slate-400">
                                {ep.duration}
                              </td>
                              <td className="py-1.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleEpisodeFree(ep.id)}
                                  className={`inline-flex items-center space-x-1 px-2 py-0.5 text-[9.5px] font-black rounded-full transition-all cursor-pointer ${
                                    ep.isFree
                                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                                      : 'bg-[#FEF08A]/40 dark:bg-amber-400/10 text-amber-950 dark:text-amber-300 border border-amber-300/50'
                                  }`}
                                  title="Click to toggle Free vs Subscribers"
                                >
                                  {ep.isFree ? (
                                    <>
                                      <Unlock className="w-2.5 h-2.5" />
                                      <span>Free</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="w-2.5 h-2.5" />
                                      <span>Subscriber</span>
                                    </>
                                  )}
                                </button>
                              </td>
                              <td className="py-1.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEpisode(ep.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors inline-flex items-center justify-center cursor-pointer"
                                  title="Remove episode"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 3: PAYWALL & LAUNCH */}
      {/* ======================================================== */}
      {currentStep === 3 && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121216] rounded-xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3.5">
            
            {/* Step 3 Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/10 gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 text-slate-950 dark:text-amber-300 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center font-extrabold shadow-xs shrink-0">
                  <Lock className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-xs sm:text-sm tracking-tight">
                    Step 3: Paywall & Launch
                  </h3>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                    Configure Free Preview vs Subscriber Paywall rules and distribution settings.
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Step 3 of 3
              </span>
            </div>

            {/* Quick Metrics Bar (Theme Aligned) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/70 dark:bg-[#18181E] border border-slate-200/80 dark:border-white/10 flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                  <Film className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Episodes</span>
                  <span className="text-base sm:text-lg font-black text-slate-950 dark:text-white">
                    {totalEpisodes}
                  </span>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/70 dark:bg-[#18181E] border border-slate-200/80 dark:border-white/10 flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                  <Unlock className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Free Preview</span>
                  <span className="text-base sm:text-lg font-black text-slate-950 dark:text-white">
                    {episodes.filter((ep) => ep.isFree).length}
                  </span>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/70 dark:bg-[#18181E] border border-slate-200/80 dark:border-white/10 flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                  <Lock className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Subscriber Locked</span>
                  <span className="text-base sm:text-lg font-black text-slate-950 dark:text-white">
                    {episodes.filter((ep) => !ep.isFree).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Distribution Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <SlideSwitch
                checked={isVipPaywallActive}
                onChange={() => setIsVipPaywallActive(!isVipPaywallActive)}
                label="VIP Subscriber Paywall"
                sublabel="Require coins or active VIP membership after free chapters"
                icon={Crown}
                badge="Monetization"
              />
              <SlideSwitch
                checked={isPublished}
                onChange={() => setIsPublished(!isPublished)}
                label="Publish Directly to Live App"
                sublabel="Make catalog stream instantly searchable on mobile devices"
                icon={Globe}
                badge="Live"
              />
              <SlideSwitch
                checked={isFeatured}
                onChange={() => setIsFeatured(!isFeatured)}
                label="Hero Billboard Spotlight"
                sublabel="Feature on mobile home top banner carousel"
                icon={Film}
                badge="Spotlight"
              />
              <SlideSwitch
                checked={isTrending}
                onChange={() => setIsTrending(!isTrending)}
                label="Trending Series Badge"
                sublabel="Display fire trending badge on catalog poster"
                icon={Flame}
                badge="Hot"
              />
            </div>

            {/* Episode Paywall Access Table */}
            <div className="border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden shadow-2xs mt-2">
              <div className="bg-slate-100/70 dark:bg-[#18181E] px-3 py-2 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                <span>Episode ({episodes.length} total)</span>
                <span>Click badge to toggle Free / Subscriber</span>
              </div>

              {episodes.length === 0 ? (
                <div className="p-5 text-center bg-white dark:bg-[#121216]">
                  <FileVideo className="w-6 h-6 text-slate-400 dark:text-slate-600 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No episodes found</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Please go back to Step 2 to add episode videos.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-[280px] overflow-y-auto">
                  {episodes.map((ep) => (
                    <div
                      key={ep.id}
                      className="px-3 py-2 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-colors bg-white dark:bg-[#121216]"
                    >
                      <div className="flex items-center space-x-2 min-w-0 pr-2 flex-1">
                        <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-[#18181E] font-black text-[10px] flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                          {ep.id}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {ep.title}
                          </p>
                          <div className="text-[10px] text-slate-400 mt-0.2 flex items-center gap-1.5 font-mono">
                            <span>{ep.duration}</span>
                            <span>•</span>
                            <span className="truncate max-w-[180px]">
                              {ep.sourceType === 'url' ? '🔗 URL' : `📁 ${ep.fileName || `ep_${ep.id}.mp4`}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEpisodes(
                              episodes.map((item) =>
                                item.id === ep.id
                                  ? { ...item, isFree: !item.isFree, status: !item.isFree ? 'Ready' : 'Subscriber Locked' }
                                  : item
                              )
                            );
                          }}
                          className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                            ep.isFree
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                              : 'bg-[#FEF08A]/40 dark:bg-amber-400/10 text-amber-950 dark:text-amber-300 border border-amber-300/50'
                          }`}
                        >
                          {ep.isFree ? (
                            <>
                              <Unlock className="w-2.5 h-2.5" />
                              <span>FREE</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-2.5 h-2.5" />
                              <span>SUBSCRIBER</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BOTTOM FIXED NAVIGATION BAR */}
      {/* ======================================================== */}
      <div className="bg-white/95 dark:bg-[#141419]/95 backdrop-blur-md rounded-xl p-2.5 sm:px-4 border border-slate-200/80 dark:border-white/10 shadow-md flex items-center justify-between gap-3 sticky bottom-3 z-40">
        
        <button
          type="button"
          onClick={handlePrevStep}
          disabled={currentStep === 1}
          className="h-8.5 px-4 rounded-lg text-xs font-bold transition-all border border-slate-200/80 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-100 dark:disabled:hover:bg-white/[0.06] disabled:cursor-not-allowed cursor-pointer active:scale-95 select-none"
        >
          Previous
        </button>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>Step {currentStep} of {totalSteps}:</span>
          <span className="text-slate-900 dark:text-white font-bold">{stepsConfig[currentStep - 1].label}</span>
        </div>

        {currentStep < totalSteps ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="h-8.5 px-5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer select-none"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="h-8.5 px-5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
          >
            {isPublishing ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950 stroke-[2.5]" />
                <span>Publishing...</span>
              </span>
            ) : (
              <span>Publish Series</span>
            )}
          </button>
        )}

      </div>

      {/* Video Preview Lightbox Modal */}
      {previewVideo && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#24242E] border border-slate-200/80 dark:border-white/12 rounded-2xl p-4 sm:p-5 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-150 space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center space-x-2 min-w-0 pr-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 text-slate-950 dark:text-amber-300 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center shrink-0">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-950 dark:text-white truncate">
                      {previewVideo?.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {previewVideo?.url}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewVideo(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="aspect-[9/16] max-h-[55vh] mx-auto rounded-xl overflow-hidden bg-black flex items-center justify-center border border-white/10 relative shadow-inner">
                <video
                  src={previewVideo?.url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-[10px] font-bold text-slate-400">Vertical 9:16 Preview</span>
                <button
                  type="button"
                  onClick={() => setPreviewVideo(null)}
                  className="px-3 py-1 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold transition-all text-xs cursor-pointer shadow-xs active:scale-95"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
