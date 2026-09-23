import React, { useState, useId } from 'react';
import { mockDramas, reassignPriority } from '../../data/mockOttData';
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
  Search
} from 'lucide-react';
import { mockGenres } from '../../data/mockOttData';

// Reusable Dashboard-styled Slide Switch component
function SlideSwitch({ checked, onChange, label, sublabel, icon: Icon, badge }) {
  const switchId = useId();

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all group">
      <div className="flex items-start space-x-3.5 pr-4 min-w-0">
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
            checked
              ? 'bg-amber-400/15 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/30'
              : 'bg-slate-200/70 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-transparent'
          }`}>
            <Icon className="w-4 h-4 stroke-[2.2]" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <label htmlFor={switchId} className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 cursor-pointer select-none">
              {label}
            </label>
            {badge && (
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60">
                {badge}
              </span>
            )}
          </div>
          {sublabel && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-medium">
              {sublabel}
            </p>
          )}
        </div>
      </div>

      <label htmlFor={switchId} className="relative inline-flex items-center cursor-pointer shrink-0">
        <input
          type="checkbox"
          id={switchId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FEF08A] peer-checked:after:bg-slate-950 peer-checked:after:border-slate-950 transition-colors"></div>
      </label>
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
  const [selectedGenres, setSelectedGenres] = useState(['Romance', 'Drama']);
  const [ageRating, setAgeRating] = useState('U/A 13+');
  const [language, setLanguage] = useState('Hindi');
  const [director, setDirector] = useState('');
  const [priority, setPriority] = useState(1);

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

  // Episode Ingestion Mode & Search
  const [episodeIngestMode, setEpisodeIngestMode] = useState('batch'); // 'batch' | 'single'
  const [episodeSearchQuery, setEpisodeSearchQuery] = useState('');

  // Single Episode Ingestion Builder State
  const [newEpTitle, setNewEpTitle] = useState('');
  const [newEpSourceType, setNewEpSourceType] = useState('url'); // 'url' | 'file'
  const [newEpVideoUrl, setNewEpVideoUrl] = useState('');
  const [newEpDuration, setNewEpDuration] = useState('2:15');
  const [newEpIsFree, setNewEpIsFree] = useState(false);
  const [showAddEpisodeCard, setShowAddEpisodeCard] = useState(false);

  // Video Preview Lightbox State
  const [previewVideo, setPreviewVideo] = useState(null); // { title: string, url: string }

  // Step 3: Episodes
  const [freeEpisodes, setFreeEpisodes] = useState(3);
  const [episodes, setEpisodes] = useState([
    { id: 1, title: 'Episode 1: The Incognito Meeting', sourceType: 'file', fileName: 'ep_01_the_incognito_meeting_9x16.mp4', videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', fileSize: '28.4 MB', duration: '2:15', isFree: true, status: 'Ready' },
    { id: 2, title: 'Episode 2: Contractual Sparks', sourceType: 'url', videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', fileName: '', fileSize: 'Remote Stream', duration: '2:30', isFree: true, status: 'Ready' },
    { id: 3, title: 'Episode 3: The Boardroom Surprise', sourceType: 'file', fileName: 'ep_03_the_boardroom_surprise_9x16.mp4', videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', fileSize: '26.8 MB', duration: '1:58', isFree: true, status: 'Ready' },
    { id: 4, title: 'Episode 4: Behind Closed Doors', sourceType: 'file', fileName: 'ep_04_behind_closed_doors_9x16.mp4', videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', fileSize: '34.5 MB', duration: '2:45', isFree: false, status: 'VIP Locked' },
    { id: 5, title: 'Episode 5: High Society Gala', sourceType: 'url', videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', fileName: '', fileSize: 'Remote Stream', duration: '2:10', isFree: false, status: 'VIP Locked' },
  ]);

  // Total episodes is automatically computed from the content episodes queue
  const totalEpisodes = episodes.length;

  // Step 3 Episode Video Ingestion State
  const [isDragOverBatch, setIsDragOverBatch] = useState(false);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const [batchUploadSuccessMsg, setBatchUploadSuccessMsg] = useState('');

  // Step 4: Paywall, DRM & Distribution Switches
  const [isPublished, setIsPublished] = useState(true);
  const [isVipPaywallActive, setIsVipPaywallActive] = useState(true);
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(true);
  const [isDrmProtected, setIsDrmProtected] = useState(true);
  const [isFeatured, setIsFeatured] = useState(true);
  const [isTrending, setIsTrending] = useState(true);
  const [pricePerEpisode, setPricePerEpisode] = useState('10 Coins');

  // Step 5: Publishing status
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishingStage, setPublishingStage] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Age rating badge colors
  const ageRatings = [
    { value: 'U (All Ages)', label: 'U', desc: 'Universal — All Ages', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
    { value: 'U/A 7+', label: '7+', desc: 'Mild fantasy / comedy', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
    { value: 'U/A 13+', label: '13+', desc: 'Teen Romance / Thriller', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
    { value: 'U/A 16+', label: '16+', desc: 'Mature Themes / Intense', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' },
    { value: 'A 18+', label: '18+', desc: 'Adults Only Content', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' },
  ];

  // Quick Demo Autofill handler
  const handleAutofillDemo = () => {
    setTitle("The Billionaire's Secret Nanny");
    setSynopsis('Down on her luck, Tara accepts a high-paying nanny job at a mysterious Mumbai penthouse. She soon discovers the cold single billionaire is harboring a secret that could destroy his family empire—and her heart.');
    setSelectedGenres(['Romance', 'CEO', 'Drama']);
    setAgeRating('U/A 13+');
    setLanguage('Hindi (Dubbed)');
    setDirector('Vikramaditya Roy');
    setPriority(1);
    setPosterUrl('https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80');
    setBannerUrl('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80');
    setTrailerFileName('secret_nanny_official_teaser_9x16.mp4');
    setFreeEpisodes(3);
    setEpisodes([
      { id: 1, title: 'Episode 1: The Penthouse Interview', fileName: 'ep_01_the_penthouse_interview_9x16.mp4', fileSize: '28.4 MB', duration: '2:15', isFree: true, status: 'Ready' },
      { id: 2, title: 'Episode 2: Midnight Encounter', fileName: 'ep_02_midnight_encounter_9x16.mp4', fileSize: '32.1 MB', duration: '2:40', isFree: true, status: 'Ready' },
      { id: 3, title: 'Episode 3: The Golden Locket', fileName: 'ep_03_the_golden_locket_9x16.mp4', fileSize: '24.9 MB', duration: '1:58', isFree: true, status: 'Ready' },
      { id: 4, title: 'Episode 4: Whispers in the Boardroom', fileName: 'ep_04_whispers_in_boardroom_9x16.mp4', fileSize: '33.5 MB', duration: '2:32', isFree: false, status: 'VIP Locked' },
      { id: 5, title: 'Episode 5: False Identity', fileName: 'ep_05_false_identity_exposed_9x16.mp4', fileSize: '29.7 MB', duration: '2:14', isFree: false, status: 'VIP Locked' },
      { id: 6, title: 'Episode 6: The Heiress Strikes Back', fileName: 'ep_06_heiress_strikes_back_9x16.mp4', fileSize: '31.0 MB', duration: '2:20', isFree: false, status: 'VIP Locked' },
      { id: 7, title: 'Episode 7: Locked in the Wine Cellar', fileName: 'ep_07_locked_in_cellar_9x16.mp4', fileSize: '35.4 MB', duration: '2:45', isFree: false, status: 'VIP Locked' },
      { id: 8, title: 'Episode 8: Truth Unveiled', fileName: 'ep_08_truth_unveiled_9x16.mp4', fileSize: '27.8 MB', duration: '2:05', isFree: false, status: 'VIP Locked' },
    ]);
  };

  const toggleGenre = (genreName) => {
    if (selectedGenres.includes(genreName)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter((g) => g !== genreName));
      }
    } else {
      setSelectedGenres([...selectedGenres, genreName]);
    }
  };

  // Batch Video Files Processing (Drag & drop or file dialog)
  const handleProcessVideoFiles = (fileList) => {
    const files = Array.from(fileList || []).filter(
      (f) => f.type.startsWith('video/') || /\.(mp4|mov|m4v|mkv|webm)$/i.test(f.name)
    );
    if (files.length === 0) {
      alert('Please select valid video files (.mp4, .mov, etc.)');
      return;
    }

    setIsUploadingBatch(true);
    setTimeout(() => {
      const startIndex = episodes.length;
      const added = files.map((file, idx) => {
        const epNum = startIndex + idx + 1;
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/^(ep|episode)\s*\d+\s*[:\-_]?\s*/i, '');

        return {
          id: epNum,
          title: cleanName ? `Episode ${epNum}: ${cleanName}` : `Episode ${epNum}: Vertical Drama Chapter`,
          fileName: file.name,
          fileSize: `${sizeMB} MB`,
          duration: `${Math.floor(Math.random() * 2) + 1}:${String(Math.floor(Math.random() * 50) + 10).padStart(2, '0')}`,
          isFree: epNum <= freeEpisodes,
          status: 'Ready',
        };
      });

      const updated = [...episodes, ...added];
      setEpisodes(updated);
      setIsUploadingBatch(false);
      setBatchUploadSuccessMsg(`Successfully imported ${files.length} episode video files!`);
      setTimeout(() => setBatchUploadSuccessMsg(''), 4000);
    }, 600);
  };


  // Add individual episode with custom name & media
  const handleAddNewEpisode = (e) => {
    if (e) e.preventDefault();
    const nextNum = episodes.length + 1;
    const finalTitle = newEpTitle.trim() || `Episode ${nextNum}: New Drama Chapter`;
    const newEpisode = {
      id: nextNum,
      title: finalTitle,
      sourceType: newEpSourceType,
      fileName: newEpSourceType === 'file' ? (newEpVideoUrl || `ep_${String(nextNum).padStart(2, '0')}_vertical_1080p.mp4`) : '',
      videoUrl: newEpSourceType === 'url' ? (newEpVideoUrl.trim() || 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4') : 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      fileSize: newEpSourceType === 'file' ? '28.5 MB' : 'Remote Stream',
      duration: newEpDuration || '2:15',
      isFree: nextNum <= freeEpisodes,
      status: nextNum <= freeEpisodes ? 'Ready' : 'VIP Locked'
    };
    setEpisodes([...episodes, newEpisode]);
    setNewEpTitle('');
    setNewEpVideoUrl('');
    setShowAddEpisodeCard(false);
  };

  // Add individual episode with video placeholder
  const handleAddEpisode = () => {
    setNewEpTitle(`Episode ${episodes.length + 1}: `);
    setShowAddEpisodeCard(true);
  };

  // Inline update episode title
  const handleUpdateEpisodeTitle = (id, newTitle) => {
    setEpisodes(episodes.map(ep => ep.id === id ? { ...ep, title: newTitle } : ep));
  };

  // Attach or replace video file for single episode
  const handleAttachVideoToEpisode = (epId, file) => {
    if (!file) return;
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setEpisodes(episodes.map(ep => {
      if (ep.id === epId) {
        return {
          ...ep,
          fileName: file.name,
          fileSize: `${sizeMB} MB`,
          status: 'Ready'
        };
      }
      return ep;
    }));
  };

  // Clear episode queue
  const handleClearEpisodes = () => {
    if (confirm('Are you sure you want to clear the episode queue?')) {
      setEpisodes([]);
    }
  };


  const handleRemoveEpisode = (id) => {
    const remaining = episodes.filter((ep) => ep.id !== id);
    const reindexed = remaining.map((ep, idx) => ({
      ...ep,
      id: idx + 1,
      title: ep.title.replace(/^Episode \d+:/i, `Episode ${idx + 1}:`),
    }));
    setEpisodes(reindexed);
  };

  // Free episode slider adjustment updates episode free statuses
  const handleFreeEpisodesChange = (val) => {
    const count = Number(val);
    setFreeEpisodes(count);
    setEpisodes(episodes.map((ep) => ({
      ...ep,
      isFree: ep.id <= count,
      status: ep.id <= count ? 'Ready' : 'VIP Locked'
    })));
  };

  // Quick preset cutoff for free episodes
  const handleQuickFreeCutoff = (cutoff) => {
    handleFreeEpisodesChange(cutoff);
  };

  // Toggle individual episode free / VIP status directly
  const handleToggleEpisodeFree = (id) => {
    setEpisodes(episodes.map((ep) => {
      if (ep.id === id) {
        const nextIsFree = !ep.isFree;
        return {
          ...ep,
          isFree: nextIsFree,
          status: nextIsFree ? 'Ready' : 'VIP Locked'
        };
      }
      return ep;
    }));
  };


  // Simulated dropzone upload triggers
  const triggerMockUpload = (type) => {
    if (type === 'poster') {
      setIsPosterUploading(true);
      setTimeout(() => {
        setPosterUrl('https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80');
        setIsPosterUploading(false);
      }, 1000);
    } else if (type === 'banner') {
      setIsBannerUploading(true);
      setTimeout(() => {
        setBannerUrl('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80');
        setIsBannerUploading(false);
      }, 1000);
    } else if (type === 'trailer') {
      setIsTrailerUploading(true);
      setTimeout(() => {
        setTrailerFileName('vertical_short_trailer_1080p.mp4');
        setIsTrailerUploading(false);
      }, 1200);
    }
  };

  // Validation before advancing
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!title.trim()) {
        alert('Please enter a series title to proceed.');
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

  // Multi-stage publishing process
  const handlePublish = () => {
    setIsPublishing(true);
    setPublishingStage(1);

    setTimeout(() => {
      setPublishingStage(2);
      setTimeout(() => {
        setPublishingStage(3);
        setTimeout(() => {
          setPublishingStage(4);
          setTimeout(() => {
            // Save new drama with assigned priority into localStorage
            try {
              const existingJson = localStorage.getItem('esquare_dramas');
              const existingList = existingJson ? JSON.parse(existingJson) : mockDramas;
              const newId = `DRM-${Date.now().toString().slice(-3)}`;

              // Compile all episodes with exact user-configured titles, media URLs, and paywall flags
              const publishedEpisodes = episodes.map((ep, idx) => ({
                id: `EP-${newId.replace('DRM-', '')}-${String(idx + 1).padStart(2, '0')}`,
                dramaId: newId,
                episodeNumber: idx + 1,
                title: ep.title?.trim() || `Episode ${idx + 1}: Chapter`,
                duration: ep.duration || '2:15',
                isFree: Boolean(ep.isFree),
                views: '0',
                subtitles: ['Hindi', 'English'],
                videoUrl: ep.videoUrl || (ep.sourceType === 'url' ? 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' : 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4'),
                thumbnail: posterUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80',
                fileName: ep.fileName || (ep.sourceType === 'url' ? 'Direct Stream URL' : `ep_${String(idx + 1).padStart(2, '0')}.mp4`),
                fileSize: ep.fileSize || '28.0 MB',
                sourceType: ep.sourceType || (ep.videoUrl ? 'url' : 'file'),
              }));

              const newDramaObj = {
                id: newId,
                title: title.trim() || 'New Micro-Drama',
                priority: Number(priority) || 1,
                slug: (title.trim() || 'new-drama').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                synopsis: synopsis || '',
                genres: selectedGenres.length > 0 ? selectedGenres : ['Romance', 'Drama'],
                totalEpisodes: publishedEpisodes.length,
                publishedEpisodes: publishedEpisodes.length,
                freeEpisodes: publishedEpisodes.filter(e => e.isFree).length,
                views: '0',
                rating: 5.0,
                status: 'PUBLISHED',
                isTrending: true,
                trendingRank: 1,
                isFeatured: priority === 1,
                releaseDate: 'Just Now',
                poster: posterUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
                banner: bannerUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
                trailerUrl: trailerUrl || trailerFileName || '',
                watchHours: '0 Hrs',
                completionRate: '0%',
                episodes: publishedEpisodes, // <--- FULL EPISODES WITH NAMES & URLS ATTACHED
              };
              
              const updatedList = reassignPriority(
                [newDramaObj, ...existingList.filter(d => d.id !== newId)],
                newId,
                Number(priority) || 1
              );
              localStorage.setItem('esquare_dramas', JSON.stringify(updatedList));

              // Persist episodes in global esquare_episodes list so they show in EpisodesPage & Modals
              try {
                const existingEpsJson = localStorage.getItem('esquare_episodes');
                const existingEps = existingEpsJson ? JSON.parse(existingEpsJson) : mockEpisodes;
                localStorage.setItem(
                  'esquare_episodes',
                  JSON.stringify([...publishedEpisodes, ...existingEps.filter(e => e.dramaId !== newId)])
                );
              } catch (epsErr) {
                console.error('Error saving episodes to localStorage:', epsErr);
              }
            } catch (err) {
              console.error('Error saving drama to localStorage:', err);
            }

            setIsPublishing(false);
            setUploadSuccess(true);
            setTimeout(() => {
              if (onNavigate) onNavigate('dramas');
            }, 1800);
          }, 800);
        }, 900);
      }, 900);
    }, 800);
  };

  // Steps configuration
  const stepsConfig = [
    { num: 1, label: 'Series Info', icon: Film, subtitle: 'Metadata & Story' },
    { num: 2, label: 'Media Studio', icon: Video, subtitle: 'Artwork & Episode Files' },
    { num: 3, label: 'Paywall & Launch', icon: Lock, subtitle: 'Monetization & Publish' },
  ];

  return (
    <div className="space-y-6 font-urbanist max-w-5xl mx-auto pb-16 selection:bg-[#FEF08A] selection:text-black">
      
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-nodus relative overflow-hidden transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/15 dark:bg-amber-400/10 border border-amber-400/30 dark:border-amber-400/20 flex items-center justify-center shrink-0 shadow-xs">
              <Upload className="w-6 h-6 text-amber-600 dark:text-amber-400 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                Content Upload Studio
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                Upload, encode, and publish high-engagement micro-drama series to the streaming app in a seamless sequence.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0 self-start md:self-center">

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('dramas')}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Sequential Stepper Navigation Bar */}
        <div className="mt-7 pt-5 border-t border-slate-100 dark:border-slate-800/80">
          
          {/* Progress percentage bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-4">
            <div
              className="bg-amber-400 h-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStep) / totalSteps) * 100}%` }}
            />
          </div>

          {/* Stepper buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stepsConfig.map((s) => {
              const IconComp = s.icon;
              const isCurrent = currentStep === s.num;
              const isCompleted = currentStep > s.num;

              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setCurrentStep(s.num)}
                  className={`flex flex-col sm:flex-row items-center sm:items-start p-2 sm:p-2.5 rounded-xl text-left transition-all relative ${
                    isCurrent
                      ? 'bg-[#FEF08A]/30 dark:bg-amber-400/10 border border-amber-300/80 dark:border-amber-500/40 shadow-xs'
                      : isCompleted
                      ? 'bg-slate-50 dark:bg-slate-900/40 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 text-slate-700 dark:text-slate-300'
                      : 'border border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 mb-1 sm:mb-0 sm:mr-2.5 font-black text-xs transition-colors ${
                    isCurrent
                      ? 'bg-[#FEF08A] text-slate-950 shadow-2xs font-extrabold'
                      : isCompleted
                      ? 'bg-emerald-500 text-white font-bold'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <IconComp className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 text-center sm:text-left hidden sm:block">
                    <p className={`text-xs font-extrabold truncate ${
                      isCurrent ? 'text-slate-950 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {s.label}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
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
        <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-700/60 rounded-2xl flex items-center space-x-3.5 text-emerald-950 dark:text-emerald-200 animate-in fade-in zoom-in-95 duration-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <p className="font-extrabold text-sm sm:text-base">Series Published Successfully to Live Catalog!</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
              Encoding CDN endpoints configured. Forwarding you to the Content Library...
            </p>
          </div>
        </div>
      )}

      {/* Publishing Modal Overlay */}
      {isPublishing && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111111] rounded-3xl p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-[#FEF08A]/30 border border-amber-300/80 flex items-center justify-center mx-auto shadow-xs">
              <RotateCcw className="w-8 h-8 text-slate-950 dark:text-[#FEF08A] animate-spin" />
            </div>
            
            <div>
              <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Publishing Drama to CDN</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Optimizing 9:16 vertical bitrate stream and applying Widevine DRM keys...
              </p>
            </div>

            <div className="space-y-3 text-left">
              <div className="flex items-center space-x-3 text-xs font-bold">
                {publishingStage >= 1 ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                )}
                <span className={publishingStage >= 1 ? 'text-slate-950 dark:text-white' : 'text-slate-400'}>
                  Validating 1080x1920 portrait aspect ratio
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs font-bold">
                {publishingStage >= 2 ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                )}
                <span className={publishingStage >= 2 ? 'text-slate-950 dark:text-white' : 'text-slate-400'}>
                  Transcoding H.264 multi-bitrate chunks (480p / 720p / 1080p)
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs font-bold">
                {publishingStage >= 3 ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                )}
                <span className={publishingStage >= 3 ? 'text-slate-950 dark:text-white' : 'text-slate-400'}>
                  Configuring Razorpay VIP paywall lock for episodes {freeEpisodes + 1}+
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs font-bold">
                {publishingStage >= 4 ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                )}
                <span className={publishingStage >= 4 ? 'text-slate-950 dark:text-white' : 'text-slate-400'}>
                  Broadcasting instant cache invalidation to Edge CDN
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 1: SERIES FUNDAMENTALS & METADATA */}
      {/* ======================================================== */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-nodus space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/15 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/30 flex items-center justify-center font-extrabold shadow-xs">
                  <Film className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-base sm:text-lg tracking-tight">
                    Step 1: Series Fundamentals & Storyline
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Enter the core identity, English title, storyline synopsis, and certifications.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Step 1 of 3
              </span>
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                Series Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. The Billionaire's Secret Nanny"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm font-semibold bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:bg-white dark:focus:bg-[#161616] focus:border-amber-400 dark:focus:border-amber-400 focus:outline-none text-slate-950 dark:text-white transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1">Displayed as the primary headline on user search &amp; catalog.</p>
            </div>

            {/* Catalog Display Priority */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200">
                  Catalog Display Priority
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Sets the rank in the mobile app feed. Priority 1 places this series at the top; existing content shifts down automatically.
                </p>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Rank:</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={priority}
                  onChange={(e) => setPriority(Math.max(1, Number(e.target.value)))}
                  className="w-20 px-3 py-1.5 text-xs sm:text-sm font-bold text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Synopsis & Hook */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200">
                  Synopsis & Micro-Drama Hook <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-400">
                  {synopsis.length} / 500 characters
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="Write a high-tension synopsis designed for 2-minute vertical video binge-watchers..."
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm font-medium bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:bg-white dark:focus:bg-[#161616] focus:border-amber-400 dark:focus:border-amber-400 focus:outline-none text-slate-950 dark:text-white transition-colors leading-relaxed"
              />
            </div>

            {/* Age Certification Badges */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-2">
                Content Age Certification & Rating
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {ageRatings.map((rating) => {
                  const isSelected = ageRating === rating.value;
                  return (
                    <button
                      type="button"
                      key={rating.value}
                      onClick={() => setAgeRating(rating.value)}
                      className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-950/20 ring-1 ring-amber-400 shadow-2xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className={`px-2 py-0.5 rounded text-[11px] font-black w-fit mb-1.5 ${rating.color}`}>
                        {rating.label}
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate block">
                        {rating.value}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate mt-0.5 block">
                        {rating.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Genres Multi-Select */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200">
                  Select Associated Genres (Select up to 4)
                </label>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  {selectedGenres.length} Selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {mockGenres.map((genre) => {
                  const isSelected = selectedGenres.includes(genre.name);
                  return (
                    <button
                      type="button"
                      key={genre.id}
                      onClick={() => toggleGenre(genre.name)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#FEF08A] text-slate-950 font-extrabold shadow-2xs border border-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                      <span>{genre.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Metadata Secondary Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                  Audio Track / Primary Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:bg-white dark:focus:bg-[#161616] focus:border-amber-400 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Hindi">Hindi (Original)</option>
                  <option value="Hindi (Dubbed)">Hindi (Dubbed)</option>
                  <option value="English">English</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Telugu">Telugu</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                  Lead Director / Creator Studio
                </label>
                <input
                  type="text"
                  placeholder="e.g. E² In-House Originals"
                  value={director}
                  onChange={(e) => setDirector(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:bg-white dark:focus:bg-[#161616] focus:border-amber-400 text-slate-900 dark:text-white focus:outline-none"
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
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-nodus space-y-6">

            {/* Clean, Minimal Header matching Step 1 and Step 3 */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/15 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/30 flex items-center justify-center font-extrabold shadow-xs shrink-0">
                  <Video className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-base sm:text-lg tracking-tight">
                    Step 2: Media Studio
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Upload visual artwork, teaser trailer, and manage your vertical episode chapters.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Step 2 of 3
              </span>
            </div>

            {/* Section A: Visual Artwork & Teaser Trailer (Clean, 3-Card Grid with Uniform Heights) */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <ImageIcon className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Visual Media &amp; Teaser Trailer
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* 1. 9:16 Vertical Poster */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 bg-white dark:bg-[#151515] flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-1.5">
                        <ImageIcon className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Vertical Poster (9:16)</span>
                      </div>
                      <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setPosterMode('file')}
                          className={`px-2 py-0.5 rounded transition-all ${
                            posterMode === 'file'
                              ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs font-extrabold'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          File
                        </button>
                        <button
                          type="button"
                          onClick={() => setPosterMode('url')}
                          className={`px-2 py-0.5 rounded transition-all ${
                            posterMode === 'url'
                              ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs font-extrabold'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          URL
                        </button>
                      </div>
                    </div>

                    <div className="h-64 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/80 overflow-hidden bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-center p-3 relative">
                      {posterUrl ? (
                        <div className="relative h-full aspect-[9/16] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group shadow-sm">
                          <img src={posterUrl} alt="Poster" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setPosterUrl('')}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm flex items-center space-x-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      ) : posterMode === 'url' ? (
                        <div className="w-full px-3 text-center space-y-2">
                          <Link className="w-5 h-5 text-amber-500 mx-auto" />
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Image Web URL</p>
                          <input
                            type="url"
                            placeholder="https://.../poster.jpg"
                            value={posterUrlInput}
                            onChange={(e) => setPosterUrlInput(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 font-mono"
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
                            className="w-full py-1.5 rounded-lg bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 text-xs font-bold transition-all disabled:opacity-40"
                          >
                            Apply Poster
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => triggerMockUpload('poster')}
                          className="w-full h-full flex flex-col items-center justify-center text-center cursor-pointer hover:bg-amber-50/20 dark:hover:bg-amber-950/20 rounded-lg transition-colors p-2"
                        >
                          {isPosterUploading ? (
                            <div className="flex flex-col items-center">
                              <RotateCcw className="w-5 h-5 text-amber-500 animate-spin mb-1.5" />
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Uploading...</span>
                            </div>
                          ) : (
                            <>
                              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-amber-500 flex items-center justify-center mb-2">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload Poster</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">1080 × 1920 (PNG/JPG)</p>
                              <span className="mt-2.5 text-[10px] font-bold px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                Browse File
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Mobile app cover</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">Required</span>
                  </div>
                </div>

                {/* 2. 9:16 Vertical Trailer */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 bg-white dark:bg-[#151515] flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-1.5">
                        <Video className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Teaser Trailer (9:16)</span>
                      </div>
                      <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setTrailerMode('file')}
                          className={`px-2 py-0.5 rounded transition-all ${
                            trailerMode === 'file'
                              ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs font-extrabold'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          File
                        </button>
                        <button
                          type="button"
                          onClick={() => setTrailerMode('url')}
                          className={`px-2 py-0.5 rounded transition-all ${
                            trailerMode === 'url'
                              ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs font-extrabold'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          URL
                        </button>
                      </div>
                    </div>

                    <div className="h-64 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/80 overflow-hidden bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-center p-3 relative">
                      {trailerFileName || trailerUrl ? (
                        <div className="w-full h-full rounded-lg bg-slate-900 text-white p-3 flex flex-col items-center justify-center text-center relative border border-slate-700">
                          <div
                            onClick={() =>
                              setPreviewVideo({
                                title: `${title || 'Series'} — Teaser Trailer`,
                                url: trailerUrl || 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
                              })
                            }
                            className="w-10 h-10 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 flex items-center justify-center mb-2 cursor-pointer hover:scale-105 transition-transform"
                            title="Play trailer preview"
                          >
                            <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                          </div>
                          <p className="text-xs font-bold text-white truncate max-w-[150px]">
                            {trailerFileName || 'Trailer Video Stream'}
                          </p>
                          <span className="text-[10px] text-emerald-400 font-semibold mt-1">✓ Transcode Ready (1080p)</span>
                          <div className="mt-3 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewVideo({
                                  title: `${title || 'Series'} — Teaser Trailer`,
                                  url: trailerUrl || 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
                                })
                              }
                              className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
                            >
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTrailerFileName('');
                                setTrailerUrl('');
                              }}
                              className="px-2 py-1 text-[11px] rounded-lg bg-rose-900/60 hover:bg-rose-900 text-rose-200 font-bold transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : trailerMode === 'url' ? (
                        <div className="w-full px-3 text-center space-y-2">
                          <Video className="w-5 h-5 text-amber-500 mx-auto" />
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Video Stream URL</p>
                          <input
                            type="url"
                            placeholder="https://.../trailer.mp4"
                            value={trailerUrlInput}
                            onChange={(e) => setTrailerUrlInput(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 font-mono"
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
                            className="w-full py-1.5 rounded-lg bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 text-xs font-bold transition-all disabled:opacity-40"
                          >
                            Apply Trailer
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => triggerMockUpload('trailer')}
                          className="w-full h-full flex flex-col items-center justify-center text-center cursor-pointer hover:bg-amber-50/20 dark:hover:bg-amber-950/20 rounded-lg transition-colors p-2"
                        >
                          {isTrailerUploading ? (
                            <div className="flex flex-col items-center">
                              <RotateCcw className="w-5 h-5 text-amber-500 animate-spin mb-1.5" />
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Uploading...</span>
                            </div>
                          ) : (
                            <>
                              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-amber-500 flex items-center justify-center mb-2">
                                <Video className="w-4 h-4" />
                              </div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload Teaser</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">MP4 H.264 (Up to 60MB)</p>
                              <span className="mt-2.5 text-[10px] font-bold px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                Browse Video
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Reel teaser auto-play</span>
                    <span className="font-medium">Optional</span>
                  </div>
                </div>

                {/* 3. 16:9 Hero Banner */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 bg-white dark:bg-[#151515] flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-1.5">
                        <Film className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Hero Billboard (16:9)</span>
                      </div>
                      <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setBannerMode('file')}
                          className={`px-2 py-0.5 rounded transition-all ${
                            bannerMode === 'file'
                              ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs font-extrabold'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          File
                        </button>
                        <button
                          type="button"
                          onClick={() => setBannerMode('url')}
                          className={`px-2 py-0.5 rounded transition-all ${
                            bannerMode === 'url'
                              ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs font-extrabold'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          URL
                        </button>
                      </div>
                    </div>

                    <div className="h-64 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/80 overflow-hidden bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-center p-3 relative">
                      {bannerUrl ? (
                        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group shadow-sm">
                          <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setBannerUrl('')}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm flex items-center space-x-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      ) : bannerMode === 'url' ? (
                        <div className="w-full px-3 text-center space-y-2">
                          <Link className="w-5 h-5 text-amber-500 mx-auto" />
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Banner Web URL</p>
                          <input
                            type="url"
                            placeholder="https://.../banner.jpg"
                            value={bannerUrlInput}
                            onChange={(e) => setBannerUrlInput(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 font-mono"
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
                            className="w-full py-1.5 rounded-lg bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 text-xs font-bold transition-all disabled:opacity-40"
                          >
                            Apply Banner
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => triggerMockUpload('banner')}
                          className="w-full h-full flex flex-col items-center justify-center text-center cursor-pointer hover:bg-amber-50/20 dark:hover:bg-amber-950/20 rounded-lg transition-colors p-2"
                        >
                          {isBannerUploading ? (
                            <div className="flex flex-col items-center">
                              <RotateCcw className="w-5 h-5 text-amber-500 animate-spin mb-1.5" />
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Uploading...</span>
                            </div>
                          ) : (
                            <>
                              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-amber-500 flex items-center justify-center mb-2">
                                <Film className="w-4 h-4" />
                              </div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload Banner</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">1920 × 1080 (16:9 Widescreen)</p>
                              <span className="mt-2.5 text-[10px] font-bold px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                Browse Image
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Featured top slider</span>
                    <span className="font-medium">Optional</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Section B: Episode Video Files & Ingestion */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              
              <div className="flex items-center space-x-2">
                <Film className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Episodes &amp; Video Content ({episodes.length})
                </h4>
              </div>

              {/* Episode Ingestion Card */}
              <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-md bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
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
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      title="Clear fields"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Episode Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Episode 1: The Incognito Meeting"
                      value={newEpTitle}
                      onChange={(e) => setNewEpTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-amber-400 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      placeholder="2:15"
                      value={newEpDuration}
                      onChange={(e) => setNewEpDuration(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-amber-400 text-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-900 dark:text-white">
                        Episode Media Source
                      </label>
                      <p className="text-[11px] text-slate-400">
                        Choose local file upload or direct video stream URL
                      </p>
                    </div>

                    <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/70 text-xs font-bold shadow-2xs shrink-0 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setNewEpSourceType('file');
                          if (newEpVideoUrl?.startsWith('http')) setNewEpVideoUrl('');
                        }}
                        className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                          newEpSourceType === 'file'
                            ? 'bg-slate-950 dark:bg-[#FEF08A] text-white dark:text-slate-950 shadow-xs font-extrabold'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Media Upload</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewEpSourceType('url');
                        }}
                        className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                          newEpSourceType === 'url'
                            ? 'bg-slate-950 dark:bg-[#FEF08A] text-white dark:text-slate-950 shadow-xs font-extrabold'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Link className="w-3.5 h-3.5" />
                        <span>URL Upload</span>
                      </button>
                    </div>
                  </div>

                  {newEpSourceType === 'url' ? (
                    <div className="space-y-1.5">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Link className="w-4 h-4 text-amber-500" />
                        </div>
                        <input
                          type="url"
                          placeholder="https://cdn.example.com/episodes/ep_01_vertical_1080p.mp4"
                          value={newEpVideoUrl}
                          onChange={(e) => setNewEpVideoUrl(e.target.value)}
                          className="w-full pl-10 pr-20 py-2.5 text-xs font-mono bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-amber-400 text-slate-950 dark:text-white shadow-2xs"
                        />
                        {newEpVideoUrl && (
                          <button
                            type="button"
                            onClick={() => setNewEpVideoUrl('')}
                            className="absolute inset-y-0 right-2 my-auto h-6 px-2 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 pl-1">
                        Direct HTTPS stream links supported (MP4, HLS .m3u8).
                      </p>
                    </div>
                  ) : newEpVideoUrl && !newEpVideoUrl.startsWith('http') ? (
                    /* Attached Video File Card */
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-700/80 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {newEpVideoUrl}
                          </p>
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                            ✓ Ready for video transcode &amp; packaging
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <label
                          htmlFor="single-ep-file-replace"
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors shadow-2xs"
                        >
                          Replace
                          <input
                            type="file"
                            id="single-ep-file-replace"
                            accept="video/*,.mp4,.mov,.m4v"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setNewEpVideoUrl(file.name);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setNewEpVideoUrl('')}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                          title="Remove file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Clean Interactive File Dropzone */
                    <label
                      htmlFor="single-ep-file-input"
                      className="border border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-400/80 rounded-xl p-4 sm:p-5 bg-white dark:bg-[#151515] hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-3 group"
                    >
                      <input
                        type="file"
                        id="single-ep-file-input"
                        accept="video/*,.mp4,.mov,.m4v"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setNewEpVideoUrl(file.name);
                        }}
                      />
                      <div className="flex items-center space-x-3 text-center sm:text-left">
                        <div className="w-10 h-10 rounded-xl bg-amber-400/15 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <FileVideo className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Choose Episode Video File
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Vertical format recommended: 1080×1920 (.mp4, .mov)
                          </p>
                        </div>
                      </div>
                      <span className="px-4 py-2 rounded-xl bg-slate-950 dark:bg-[#FEF08A] hover:bg-black text-white dark:text-slate-950 text-xs font-bold transition-all shadow-2xs shrink-0">
                        Select Video File
                      </span>
                    </label>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setNewEpTitle('');
                      setNewEpVideoUrl('');
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewEpisode}
                    className="px-4 py-1.5 rounded-lg bg-slate-950 dark:bg-[#FEF08A] hover:bg-black text-white dark:text-slate-950 text-xs font-bold transition-all shadow-2xs"
                  >
                    Add to List
                  </button>
                </div>
              </div>

              {/* Episodes Queue Table */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs bg-white dark:bg-[#111111]">
                
                {/* Table Top Toolbar */}
                <div className="px-5 py-3.5 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Episodes Queue
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {episodes.length} Total
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search filter */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="Filter episodes..."
                        value={episodeSearchQuery}
                        onChange={(e) => setEpisodeSearchQuery(e.target.value)}
                        className="pl-7 pr-2.5 py-1 text-xs bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 w-36 sm:w-44"
                      />
                    </div>

                    {/* Quick Free Presets */}
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => handleQuickFreeCutoff(cnt)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                            freeEpisodes === cnt
                              ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          {cnt} Free
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleQuickFreeCutoff(0)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                          freeEpisodes === 0
                            ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        All VIP
                      </button>
                    </div>

                    {episodes.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearEpisodes}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors ml-1"
                        title="Clear all episodes"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Table Content */}
                {episodes.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileVideo className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No episodes in queue</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Use Batch Upload or Add by URL above to add episodes.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50/90 dark:bg-slate-900/80 sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-4 w-12 text-center">#</th>
                          <th className="py-2.5 px-4 min-w-[220px]">Episode Title</th>
                          <th className="py-2.5 px-4 w-36">Media Source</th>
                          <th className="py-2.5 px-4 w-24">Duration</th>
                          <th className="py-2.5 px-4 w-28 text-center">Paywall</th>
                          <th className="py-2.5 px-4 w-16 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                        {episodes
                          .filter((ep) =>
                            ep.title.toLowerCase().includes(episodeSearchQuery.toLowerCase()) ||
                            String(ep.id).includes(episodeSearchQuery)
                          )
                          .map((ep) => (
                            <tr
                              key={ep.id}
                              className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <td className="py-2.5 px-4 text-center">
                                <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-[11px] inline-flex items-center justify-center text-slate-600 dark:text-slate-300">
                                  {ep.id}
                                </span>
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="flex items-center space-x-2.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewVideo({
                                        title: ep.title,
                                        url: ep.videoUrl || 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
                                      })
                                    }
                                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#FEF08A] hover:text-slate-950 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-colors shrink-0 shadow-2xs"
                                    title="Play preview"
                                  >
                                    <Play className="w-3 h-3 fill-current ml-0.5" />
                                  </button>
                                  <input
                                    type="text"
                                    value={ep.title}
                                    onChange={(e) => handleUpdateEpisodeTitle(ep.id, e.target.value)}
                                    placeholder={`Episode ${ep.id} Title...`}
                                    className="font-bold text-xs bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 focus:bg-white dark:focus:bg-[#151515] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-amber-400 rounded-lg px-2 py-1 text-slate-900 dark:text-white transition-colors w-full"
                                  />
                                </div>
                              </td>
                              <td className="py-2.5 px-4">
                                <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                                  {ep.sourceType === 'url' || ep.videoUrl?.startsWith('http') ? (
                                    <>
                                      <Link className="w-3 h-3 text-amber-500 shrink-0" />
                                      <span className="truncate">Stream URL</span>
                                    </>
                                  ) : (
                                    <>
                                      <FileVideo className="w-3 h-3 text-amber-500 shrink-0" />
                                      <span className="truncate">{ep.fileName || `ep_${ep.id}.mp4`}</span>
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                {ep.duration}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleEpisodeFree(ep.id)}
                                  className={`inline-flex items-center space-x-1 px-2.5 py-1 text-[10px] font-extrabold rounded-lg border transition-all ${
                                    ep.isFree
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 shadow-2xs'
                                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 shadow-2xs'
                                  }`}
                                  title="Click to toggle Free vs VIP"
                                >
                                  {ep.isFree ? (
                                    <>
                                      <Unlock className="w-2.5 h-2.5 text-emerald-500" />
                                      <span>Free</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="w-2.5 h-2.5 text-amber-500" />
                                      <span>VIP</span>
                                    </>
                                  )}
                                </button>
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEpisode(ep.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors inline-flex items-center justify-center"
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
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-nodus space-y-6">
            
            {/* Step 3 Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/15 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/30 flex items-center justify-center font-extrabold shadow-xs">
                  <Lock className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-base sm:text-lg tracking-tight">
                    Step 3: Paywall &amp; Launch
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Configure Free Preview vs VIP Paywall rules, set coin pricing, and publish series.
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Step 3 of 3
              </span>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">Total Episodes</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xl font-black text-slate-950 dark:text-white">
                    {totalEpisodes}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Episodes (From Media Studio)</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">Free Preview Episodes</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {episodes.filter((ep) => ep.isFree).length}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Free (Click badge to toggle)</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">VIP Paywall Locked</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                    {episodes.filter((ep) => !ep.isFree).length}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Episodes (Requires Coins/Pass)</span>
                </div>
              </div>
            </div>

            {/* Episode Paywall Access Table */}
            <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-slate-100/70 dark:bg-slate-900/80 px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>Episode ({episodes.length} total)</span>
                <span>Paywall Status (Click badge to toggle Free / VIP)</span>
              </div>

              {episodes.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-[#111111]">
                  <FileVideo className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No episodes found</p>
                  <p className="text-xs text-slate-400 mt-1">Please go back to Step 2 (Media Studio) to add episode videos.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[380px] overflow-y-auto">
                  {episodes.map((ep) => (
                    <div
                      key={ep.id}
                      className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors bg-white dark:bg-[#111111]"
                    >
                      <div className="flex items-center space-x-3 min-w-0 pr-3 flex-1">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 font-black text-xs flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                          {ep.id}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                            {ep.title}
                          </p>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span className="flex items-center gap-1 font-mono text-slate-500">
                              <Clock className="w-3 h-3" />
                              {ep.duration}
                            </span>
                            <span>•</span>
                            <span className="truncate max-w-[240px] font-mono text-[10px] text-slate-400">
                              {ep.sourceType === 'url' ? `🔗 ${ep.videoUrl || 'Video Stream URL'}` : `📁 ${ep.fileName || `ep_${String(ep.id).padStart(2, '0')}.mp4`}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEpisodes(
                              episodes.map((item) =>
                                item.id === ep.id
                                  ? { ...item, isFree: !item.isFree, status: !item.isFree ? 'Ready' : 'VIP Locked' }
                                  : item
                              )
                            );
                          }}
                          title="Click to toggle Free Preview or VIP Locked"
                          className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold tracking-wide flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                            ep.isFree
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-[#FEF08A] text-slate-950 font-black border border-amber-300/80'
                          }`}
                        >
                          {ep.isFree ? (
                            <>
                              <Unlock className="w-3 h-3 stroke-[2.5]" />
                              <span>FREE PREVIEW</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 stroke-[2.5]" />
                              <span>VIP LOCKED</span>
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
      <div className="bg-white dark:bg-[#111111] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-nodus flex items-center justify-between gap-4 sticky bottom-4 z-40">
        
        <button
          type="button"
          onClick={handlePrevStep}
          disabled={currentStep === 1}
          className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            currentStep === 1
              ? 'opacity-40 cursor-not-allowed text-slate-400'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </button>

        <div className="hidden sm:flex items-center space-x-2 text-xs font-bold text-slate-400">
          <span>Step {currentStep} of {totalSteps}:</span>
          <span className="text-slate-900 dark:text-slate-100">{stepsConfig[currentStep - 1].label}</span>
        </div>

        {currentStep < totalSteps ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 text-xs font-black transition-all shadow-xs hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Continue to {stepsConfig[currentStep].label}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 text-xs font-black transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Publish Series</span>
          </button>
        )}

      </div>

      {/* Video Preview Lightbox Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5 min-w-0 pr-3">
                <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm text-slate-950 dark:text-white truncate">
                    {previewVideo.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    {previewVideo.url}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-[9/16] max-h-[60vh] mx-auto rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-800 relative shadow-inner">
              <video
                src={previewVideo.url}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] font-bold text-slate-400">Vertical 9:16 Video Player</span>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold hover:opacity-90 transition-opacity text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
