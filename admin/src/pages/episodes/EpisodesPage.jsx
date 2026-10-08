import React, { useState } from 'react';
import { mockDramas, mockEpisodes } from '../../data/mockOttData';
import { Video, Plus, Play, Lock, Unlock, UploadCloud, Subtitles, CheckCircle2, ChevronRight, X, Clock, Eye, Search } from 'lucide-react';

export default function EpisodesPage({ initialDramaId }) {
  const [dramas] = useState(() => {
    try {
      const saved = localStorage.getItem('esquare_dramas');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return mockDramas;
  });

  const [selectedDramaId, setSelectedDramaId] = useState(initialDramaId || 'DRM-101');
  const [episodes, setEpisodes] = useState(() => {
    try {
      const saved = localStorage.getItem('esquare_episodes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return mockEpisodes;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [isAddEpisodeModalOpen, setIsAddEpisodeModalOpen] = useState(false);

  // New Episode Form State
  const [newEpNumber, setNewEpNumber] = useState(9);
  const [newEpTitle, setNewEpTitle] = useState('');
  const [newEpDuration, setNewEpDuration] = useState('2:15');
  const [newEpIsFree, setNewEpIsFree] = useState(false);

  const selectedDrama = dramas.find(d => d.id === selectedDramaId) || dramas[0] || mockDramas[0];
  const dramaEpisodes = episodes.filter(e => e.dramaId === selectedDramaId);
  const filteredEpisodes = dramaEpisodes.filter(e => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return e.title.toLowerCase().includes(term) ||
           e.id.toLowerCase().includes(term) ||
           String(e.episodeNumber).includes(term);
  });

  // Toggle Paywall status (Free Preview vs Premium Locked)
  const togglePaywall = (epId) => {
    setEpisodes(prev => prev.map(ep => {
      if (ep.id === epId) {
        return { ...ep, isFree: !ep.isFree };
      }
      return ep;
    }));
  };

  const handleAddEpisode = (e) => {
    e.preventDefault();
    const newEp = {
      id: `EP-${Date.now().toString().slice(-4)}`,
      dramaId: selectedDramaId,
      episodeNumber: Number(newEpNumber),
      title: newEpTitle || `Episode ${newEpNumber}`,
      duration: newEpDuration || '2:10',
      isFree: newEpIsFree,
      views: '0',
      subtitles: ['Hindi', 'English'],
      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      thumbnail: selectedDrama.poster
    };
    setEpisodes(prev => [...prev, newEp]);
    setIsAddEpisodeModalOpen(false);
    setNewEpTitle('');
    setNewEpNumber(prev => Number(prev) + 1);
  };

  return (
    <div className="space-y-3.5 font-urbanist">
      
      {/* Drama Selector Header & Stats Bar */}
      <div className="bg-white dark:bg-[#121612] rounded-xl p-3.5 sm:p-4 border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Drama Switcher Dropdown */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-16 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-200 dark:border-white/10">
            <img src={selectedDrama.poster} alt={selectedDrama.title} className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Select Micro-Drama Series</span>
            <select
              value={selectedDramaId}
              onChange={(e) => setSelectedDramaId(e.target.value)}
              className="block w-full sm:w-80 mt-0.5 font-bold text-sm text-slate-950 dark:text-white bg-slate-100/80 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#FEF08A] cursor-pointer"
            >
              {dramas.map(d => (
                <option key={d.id} value={d.id} className="dark:bg-[#161B16]">
                  {d.title} ({d.totalEpisodes || d.episodes?.length || 0} Eps)
                </option>
              ))}
            </select>
            <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span>{selectedDrama.genres.join(' • ')}</span>
              <span>•</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{dramaEpisodes.length} Episodes Uploaded</span>
            </div>
          </div>
        </div>

        {/* Studio Summary & Add Episode CTA */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400">Freemium Paywall Rule</p>
            <p className="text-[11px] font-extrabold text-slate-900 dark:text-white">Ep 1–3 Free • Ep 4+ Subscriber Locked</p>
          </div>

          <button
            onClick={() => setIsAddEpisodeModalOpen(true)}
            className="py-2 px-3.5 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Upload New Episode</span>
          </button>
        </div>

      </div>

      {/* Episodes Table & Media Inspector */}
      <div className="bg-white dark:bg-[#121612] rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="p-3 sm:p-3.5 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/50 dark:bg-[#161B16]">
          <div>
            <h3 className="font-bold text-slate-950 dark:text-white text-xs sm:text-[13px]">Episodes Sequence & Paywall Control</h3>
            <p className="text-[10.5px] text-slate-400 dark:text-slate-400">Click the Paywall lock to toggle Free Preview vs Subscriber Access</p>
          </div>
          
          <div className="flex items-center space-x-2.5">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search episodes (#, title)..."
                className="w-full pl-8 pr-7 py-1 text-xs font-semibold bg-white dark:bg-[#121612] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg focus:border-[#FEF08A] focus:outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded-full cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">{filteredEpisodes.length} Episodes</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {filteredEpisodes.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-400 mx-auto mb-2">
                <Search className="w-4.5 h-4.5" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No episodes match "{searchTerm}"</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-1.5 px-2.5 py-1 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Clear Filter
              </button>
            </div>
          ) : (
            filteredEpisodes.map((ep) => (
            <div
              key={ep.id}
              className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-colors"
            >
              {/* Left: Ep #, Thumbnail, Title */}
              <div className="flex items-center space-x-3 min-w-0">
                <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-white/[0.08] text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
                  #{ep.episodeNumber}
                </span>

                <div className="relative w-14 h-18 rounded-lg bg-slate-900 overflow-hidden shrink-0 group cursor-pointer" onClick={() => { setActiveEpisode(ep); setIsPreviewOpen(true); }}>
                  <img src={ep.thumbnail} alt={ep.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-5 h-5 text-[#FEF08A] fill-[#FEF08A]" />
                  </div>
                  <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 text-white font-mono text-[8.5px] font-bold">
                    {ep.duration}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <h4 className="text-xs font-bold text-slate-950 dark:text-white truncate">{ep.title}</h4>
                    <span className="text-[10px] text-slate-400">({ep.id})</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{ep.duration} min</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Eye className="w-3 h-3 text-slate-400" />
                      <span>{ep.views} views</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 font-semibold">
                      <Subtitles className="w-3 h-3 text-slate-400" />
                      <span>{ep.subtitles.join(', ')}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Paywall Toggle & Actions */}
              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                {/* Paywall Switch Button */}
                <button
                  onClick={() => togglePaywall(ep.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center space-x-1 transition-all cursor-pointer ${
                    ep.isFree
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                      : 'bg-[#FEF08A] text-slate-950 hover:bg-[#FDE047]'
                  }`}
                  title={ep.isFree ? "Click to lock for Subscribers only" : "Click to make Free Teaser"}
                >
                  {ep.isFree ? (
                    <>
                      <Unlock className="w-3 h-3" />
                      <span>FREE TEASER</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 text-slate-950" />
                      <span>LOCKED</span>
                    </>
                  )}
                </button>

                {/* Preview Trigger */}
                <button
                  onClick={() => { setActiveEpisode(ep); setIsPreviewOpen(true); }}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Test Video Stream"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
          )}
        </div>
      </div>

      {/* Video Preview Modal (9:16 Vertical OTT Player) */}
      {isPreviewOpen && activeEpisode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl relative">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between text-white">
              <div>
                <p className="text-xs font-bold text-[#FEF08A]">S1 • E{activeEpisode.episodeNumber}</p>
                <p className="text-xs font-bold truncate">{activeEpisode.title}</p>
              </div>
              <button onClick={() => setIsPreviewOpen(false)} className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated 9:16 Video Player */}
            <div className="relative aspect-[9/16] bg-black flex items-center justify-center">
              <img src={selectedDrama.poster} alt={activeEpisode.title} className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
                <div className="w-12 h-12 rounded-full bg-[#FEF08A] text-slate-950 flex items-center justify-center mb-2.5">
                  <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                </div>
                <p className="font-extrabold text-sm text-white">Simulated 9:16 Video Stream</p>
                <p className="text-[11px] text-slate-300 mt-1">Multi-bitrate HLS (1080p, 720p Auto)</p>
                <span className="mt-2.5 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-400 text-[10px] font-bold">
                  {activeEpisode.isFree ? 'FREE PREVIEW STREAM' : 'SUBSCRIBER STREAM'}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-900 border-t border-slate-800 text-center">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close Preview Player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Episode Drawer / Modal */}
      {isAddEpisodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202620] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-white/15">
            <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-950 dark:text-white text-sm">Upload Episode to {selectedDrama.title}</h3>
                <p className="text-[11px] text-slate-400">Upload 9:16 vertical video and subtitles</p>
              </div>
              <button onClick={() => setIsAddEpisodeModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddEpisode} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Episode Number</label>
                  <input
                    type="number"
                    value={newEpNumber}
                    onChange={(e) => setNewEpNumber(e.target.value)}
                    required
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121612] text-slate-900 dark:text-white focus:border-[#FEF08A] font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Duration (MM:SS)</label>
                  <input
                    type="text"
                    value={newEpDuration}
                    onChange={(e) => setNewEpDuration(e.target.value)}
                    placeholder="2:15"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121612] text-slate-900 dark:text-white focus:border-[#FEF08A] font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Episode Title / Hook</label>
                <input
                  type="text"
                  value={newEpTitle}
                  onChange={(e) => setNewEpTitle(e.target.value)}
                  placeholder="e.g. The Boardroom Confrontation"
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121612] text-slate-900 dark:text-white focus:border-[#FEF08A] font-medium focus:outline-none"
                />
              </div>

              {/* Video File Dropzone */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Vertical Video File (.mp4, 1080x1920)</label>
                <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-lg p-4 text-center bg-slate-50 dark:bg-[#161B16] cursor-pointer transition-colors">
                  <UploadCloud className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Drop vertical MP4 or click to browse</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Chunked upload to AWS S3 / Cloudinary</p>
                </div>
              </div>

              {/* Subtitles & Paywall */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-[#161B16] rounded-lg border border-slate-200 dark:border-white/10">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block text-xs">Freemium Paywall Access</span>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400">Uncheck to lock episode behind subscription</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEpIsFree}
                    onChange={(e) => setNewEpIsFree(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 dark:bg-[#202620] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FEF08A]"></div>
                </label>
              </div>

              <div className="pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddEpisodeModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Confirm & Upload Episode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
