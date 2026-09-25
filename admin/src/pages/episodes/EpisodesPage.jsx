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
    <div class="space-y-6 font-urbanist">
      
      {/* Drama Selector Header & Stats Bar */}
      <div class="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-nodus flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Drama Switcher Dropdown */}
        <div class="flex items-center space-x-4">
          <div class="w-14 h-20 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-200">
            <img src={selectedDrama.poster} alt={selectedDrama.title} class="w-full h-full object-cover" />
          </div>
          <div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Micro-Drama Series</span>
            <select
              value={selectedDramaId}
              onChange={(e) => setSelectedDramaId(e.target.value)}
              class="block w-full sm:w-80 mt-1 font-extrabold text-base text-slate-950 bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#FEF08A] cursor-pointer"
            >
              {dramas.map(d => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.totalEpisodes || d.episodes?.length || 0} Eps)
                </option>
              ))}
            </select>
            <div class="flex items-center space-x-2 mt-1 text-xs text-slate-500">
              <span>{selectedDrama.genres.join(' • ')}</span>
              <span>•</span>
              <span class="font-bold text-emerald-600">{dramaEpisodes.length} Episodes Uploaded</span>
            </div>
          </div>
        </div>

        {/* Studio Summary & Add Episode CTA */}
        <div class="flex items-center space-x-3 shrink-0">
          <div class="text-right hidden sm:block">
            <p class="text-[11px] font-bold text-slate-400">Freemium Paywall Rule</p>
            <p class="text-xs font-extrabold text-slate-900">Ep 1–3 Free • Ep 4+ Subscriber Locked</p>
          </div>

          <button
            onClick={() => setIsAddEpisodeModalOpen(true)}
            class="py-2.5 px-4 bg-[#FEF08A] hover:bg-[#FDE047] text-black font-bold text-xs rounded-xl flex items-center space-x-2 transition-all"
          >
            <Plus class="w-4 h-4 text-black stroke-[2.5]" />
            <span>Upload New Episode</span>
          </button>
        </div>

      </div>

      {/* Episodes Table & Media Inspector */}
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-nodus overflow-hidden">
        <div class="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 class="font-bold text-slate-950 text-sm">Episodes Sequence & Paywall Control</h3>
            <p class="text-[11px] text-slate-400">Click the Paywall lock to toggle Free Preview vs Subscriber Access</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search episodes (#, title)..."
                className="w-full pl-8 pr-7 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:border-[#FEF08A] focus:outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <span class="text-xs font-bold text-slate-500 shrink-0">{filteredEpisodes.length} Episodes</span>
          </div>
        </div>

        <div class="divide-y divide-slate-100">
          {filteredEpisodes.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">No episodes match "{searchTerm}"</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 px-3 py-1 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs rounded-lg transition-colors"
              >
                Clear Filter
              </button>
            </div>
          ) : (
            filteredEpisodes.map((ep) => (
            <div
              key={ep.id}
              class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
            >
              {/* Left: Ep #, Thumbnail, Title */}
              <div class="flex items-center space-x-4 min-w-0">
                <span class="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                  #{ep.episodeNumber}
                </span>

                <div class="relative w-16 h-22 rounded-lg bg-slate-900 overflow-hidden shrink-0 group cursor-pointer" onClick={() => { setActiveEpisode(ep); setIsPreviewOpen(true); }}>
                  <img src={ep.thumbnail} alt={ep.title} class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play class="w-6 h-6 text-[#FEF08A] fill-[#FEF08A]" />
                  </div>
                  <span class="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-white font-mono text-[9px] font-bold">
                    {ep.duration}
                  </span>
                </div>

                <div class="min-w-0">
                  <div class="flex items-center space-x-2">
                    <h4 class="text-xs font-bold text-slate-950 truncate">{ep.title}</h4>
                    <span class="text-[10px] text-slate-400">({ep.id})</span>
                  </div>

                  <div class="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span class="flex items-center space-x-1">
                      <Clock class="w-3 h-3 text-slate-400" />
                      <span>{ep.duration} min</span>
                    </span>
                    <span>•</span>
                    <span class="flex items-center space-x-1">
                      <Eye class="w-3 h-3 text-slate-400" />
                      <span>{ep.views} views</span>
                    </span>
                    <span>•</span>
                    <span class="flex items-center space-x-1 text-slate-700 font-semibold">
                      <Subtitles class="w-3 h-3 text-slate-400" />
                      <span>{ep.subtitles.join(', ')}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Paywall Toggle & Actions */}
              <div class="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                {/* Paywall Switch Button */}
                <button
                  onClick={() => togglePaywall(ep.id)}
                  class={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center space-x-1.5 transition-all ${
                    ep.isFree
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-[#FEF08A] text-slate-950 hover:bg-[#FDE047]'
                  }`}
                  title={ep.isFree ? "Click to lock for Subscribers only" : "Click to make Free Teaser"}
                >
                  {ep.isFree ? (
                    <>
                      <Unlock class="w-3.5 h-3.5" />
                      <span>FREE TEASER</span>
                    </>
                  ) : (
                    <>
                      <Lock class="w-3.5 h-3.5 text-black" />
                      <span>SUBSCRIBER LOCKED</span>
                    </>
                  )}
                </button>

                {/* Preview Trigger */}
                <button
                  onClick={() => { setActiveEpisode(ep); setIsPreviewOpen(true); }}
                  class="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Test Video Stream"
                >
                  <Play class="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
          )}
        </div>
      </div>

      {/* Video Preview Modal (9:16 Vertical OTT Player) */}
      {isPreviewOpen && activeEpisode && (
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl relative">
            <div class="p-3 border-b border-slate-800 flex items-center justify-between text-white">
              <div>
                <p class="text-xs font-extrabold text-amber-300">S1 • E{activeEpisode.episodeNumber}</p>
                <p class="text-xs font-bold truncate">{activeEpisode.title}</p>
              </div>
              <button onClick={() => setIsPreviewOpen(false)} class="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white">
                <X class="w-4 h-4" />
              </button>
            </div>

            {/* Simulated 9:16 Video Player */}
            <div class="relative aspect-[9/16] bg-black flex items-center justify-center">
              <img src={selectedDrama.poster} alt={activeEpisode.title} class="w-full h-full object-cover opacity-60" />
              <div class="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
                <div class="w-14 h-14 rounded-full bg-[#FEF08A] text-slate-950 flex items-center justify-center mb-3">
                  <Play class="w-6 h-6 fill-black ml-1" />
                </div>
                <p class="font-extrabold text-sm text-white">Simulated 9:16 Video Stream</p>
                <p class="text-xs text-slate-300 mt-1">Multi-bitrate HLS (1080p, 720p Auto)</p>
                <span class="mt-3 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-400 text-[10px] font-bold">
                  {activeEpisode.isFree ? 'FREE PREVIEW STREAM' : 'SUBSCRIBER STREAM'}
                </span>
              </div>
            </div>

            <div class="p-3 bg-slate-900 border-t border-slate-800 text-center">
              <button
                onClick={() => setIsPreviewOpen(false)}
                class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Close Preview Player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Episode Drawer / Modal */}
      {isAddEpisodeModalOpen && (
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200">
            <div class="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 class="font-bold text-slate-950 text-base">Upload Episode to {selectedDrama.title}</h3>
                <p class="text-xs text-slate-400">Upload 9:16 vertical video and subtitles</p>
              </div>
              <button onClick={() => setIsAddEpisodeModalOpen(false)} class="p-1 text-slate-400 hover:text-slate-900 rounded-lg">
                <X class="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEpisode} class="p-6 space-y-4 text-xs">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Episode Number</label>
                  <input
                    type="number"
                    value={newEpNumber}
                    onChange={(e) => setNewEpNumber(e.target.value)}
                    required
                    class="w-full p-2.5 rounded-xl border border-slate-200 focus:border-[#FEF08A] font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Duration (MM:SS)</label>
                  <input
                    type="text"
                    value={newEpDuration}
                    onChange={(e) => setNewEpDuration(e.target.value)}
                    placeholder="2:15"
                    class="w-full p-2.5 rounded-xl border border-slate-200 focus:border-[#FEF08A] font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Episode Title / Hook</label>
                <input
                  type="text"
                  value={newEpTitle}
                  onChange={(e) => setNewEpTitle(e.target.value)}
                  placeholder="e.g. The Boardroom Confrontation"
                  class="w-full p-2.5 rounded-xl border border-slate-200 focus:border-[#FEF08A] font-medium focus:outline-none"
                />
              </div>

              {/* Video File Dropzone */}
              <div>
                <label class="block font-bold text-slate-700 mb-1">Vertical Video File (.mp4, 1080x1920)</label>
                <div class="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center bg-slate-50 cursor-pointer transition-colors">
                  <UploadCloud class="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p class="font-bold text-slate-800 text-xs">Drop vertical MP4 or click to browse</p>
                  <p class="text-[10px] text-slate-400 mt-1">Chunked upload to AWS S3 / Cloudinary</p>
                </div>
              </div>

              {/* Subtitles & Paywall */}
              <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span class="font-bold text-slate-900 block">Freemium Paywall Access</span>
                  <span class="text-[11px] text-slate-500">Uncheck to lock episode behind subscription</span>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEpIsFree}
                    onChange={(e) => setNewEpIsFree(e.target.checked)}
                    class="sr-only peer"
                  />
                  <div class="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#080B08]"></div>
                </label>
              </div>

              <div class="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddEpisodeModalOpen(false)}
                  class="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-5 py-2.5 bg-[#FEF08A] hover:bg-[#FDE047] text-black font-bold rounded-xl"
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
