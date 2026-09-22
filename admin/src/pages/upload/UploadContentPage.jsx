import React, { useState } from 'react';
import { Upload, Video, Image, Film, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles, Clock, Shield } from 'lucide-react';
import { mockGenres } from '../../data/mockOttData';

export default function UploadContentPage({ onNavigate }) {
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [selectedGenres, setSelectedGenres] = useState(['Romance']);
  const [ageRating, setAgeRating] = useState('U/A 13+');
  const [totalEpisodes, setTotalEpisodes] = useState(24);
  const [freeEpisodes, setFreeEpisodes] = useState(3);
  const [isPublished, setIsPublished] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Sample batch episode queue
  const [episodes, setEpisodes] = useState([
    { id: 1, title: 'Episode 1: The Beginning', duration: '2:15', isFree: true, status: 'Ready' },
    { id: 2, title: 'Episode 2: The Confrontation', duration: '2:30', isFree: true, status: 'Ready' },
    { id: 3, title: 'Episode 3: Secrets Unveiled', duration: '1:58', isFree: true, status: 'Ready' },
    { id: 4, title: 'Episode 4: Behind Closed Doors', duration: '2:45', isFree: false, status: 'VIP Locked' },
  ]);

  const toggleGenre = (genreName) => {
    if (selectedGenres.includes(genreName)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter(g => g !== genreName));
      }
    } else {
      setSelectedGenres([...selectedGenres, genreName]);
    }
  };

  const handleAddEpisode = () => {
    const nextNum = episodes.length + 1;
    setEpisodes([
      ...episodes,
      {
        id: nextNum,
        title: `Episode ${nextNum}: Title Here`,
        duration: '2:15',
        isFree: nextNum <= freeEpisodes,
        status: nextNum <= freeEpisodes ? 'Ready' : 'VIP Locked'
      }
    ]);
  };

  const handleRemoveEpisode = (id) => {
    setEpisodes(episodes.filter(ep => ep.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) {
      alert('Please enter a drama title');
      return;
    }
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
      setTimeout(() => {
        if (onNavigate) onNavigate('dramas');
      }, 1500);
    }, 1200);
  };

  return (
    <div className="space-y-6 font-urbanist max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-nodus flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950">Upload Content</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Publish new vertical short-dramas, episodes, and trailers to the streaming catalog.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 text-xs font-bold">
            Target Aspect: 9:16 Vertical
          </span>
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3 text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-sm">Series Published Successfully!</p>
            <p className="text-xs text-emerald-700">Redirecting to Content Library...</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Step 1: Series Basic Info */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-nodus space-y-4">
          <h3 className="font-extrabold text-base text-slate-950 border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Film className="w-4 h-4 text-slate-900" />
            <span>1. Series Information</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Series Title (English / Romanized) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. The CEO's Hidden Heiress"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Age Rating / Content Certification
              </label>
              <select
                value={ageRating}
                onChange={(e) => setAgeRating(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-black"
              >
                <option value="U (All Ages)">U (Universal — All Ages)</option>
                <option value="U/A 7+">U/A 7+ (Mild Themes)</option>
                <option value="U/A 13+">U/A 13+ (Teen Romance / Thriller)</option>
                <option value="U/A 16+">U/A 16+ (Mature Romance / Action)</option>
                <option value="A 18+">A 18+ (Adults Only)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Synopsis & Storyline Hook
            </label>
            <textarea
              rows={3}
              placeholder="Write an engaging vertical synopsis that hooks mobile drama viewers..."
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-black"
            />
          </div>

          {/* Genre Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Select Genres (Multiple Allowed)
            </label>
            <div className="flex flex-wrap gap-2">
              {mockGenres.map((genre) => {
                const isSelected = selectedGenres.includes(genre.name);
                return (
                  <button
                    type="button"
                    key={genre.id}
                    onClick={() => toggleGenre(genre.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-slate-950 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {genre.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 2: Media Assets & Trailer */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-nodus space-y-4">
          <h3 className="font-extrabold text-base text-slate-950 border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Upload className="w-4 h-4 text-slate-900" />
            <span>2. Cover Posters & Vertical Trailer</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 9:16 Portrait Poster */}
            <div className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl p-5 text-center flex flex-col items-center justify-center cursor-pointer group bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <Image className="w-8 h-8 text-slate-400 group-hover:text-black mb-2 transition-colors" />
              <p className="text-xs font-bold text-slate-800">Portrait Poster (9:16)</p>
              <p className="text-[11px] text-slate-400 mt-1">Recommended: 1080 x 1920px</p>
              <span className="mt-3 text-[10px] font-bold px-2 py-1 rounded bg-white border border-slate-200 text-slate-700">
                Browse Image
              </span>
            </div>

            {/* 16:9 Banner Cover */}
            <div className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl p-5 text-center flex flex-col items-center justify-center cursor-pointer group bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <Image className="w-8 h-8 text-slate-400 group-hover:text-black mb-2 transition-colors" />
              <p className="text-xs font-bold text-slate-800">Hero Banner (16:9)</p>
              <p className="text-[11px] text-slate-400 mt-1">Recommended: 1920 x 1080px</p>
              <span className="mt-3 text-[10px] font-bold px-2 py-1 rounded bg-white border border-slate-200 text-slate-700">
                Browse Image
              </span>
            </div>

            {/* Vertical Teaser Video */}
            <div className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl p-5 text-center flex flex-col items-center justify-center cursor-pointer group bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <Video className="w-8 h-8 text-slate-400 group-hover:text-black mb-2 transition-colors" />
              <p className="text-xs font-bold text-slate-800">Vertical Trailer (9:16)</p>
              <p className="text-[11px] text-slate-400 mt-1">MP4 / H.264 up to 50MB</p>
              <span className="mt-3 text-[10px] font-bold px-2 py-1 rounded bg-white border border-slate-200 text-slate-700">
                Browse Video
              </span>
            </div>

          </div>
        </div>

        {/* Step 3: Paywall & Episode Setup */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-nodus space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-950 flex items-center space-x-2">
              <Video className="w-4 h-4 text-slate-900" />
              <span>3. Episodes & Paywall Configuration</span>
            </h3>
            <button
              type="button"
              onClick={handleAddEpisode}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-900 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Episode</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50/60 p-4 rounded-xl border border-amber-200/70">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Total Episode Count
              </label>
              <input
                type="number"
                min={1}
                value={totalEpisodes}
                onChange={(e) => setTotalEpisodes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Free Episodes for Non-VIP Users
              </label>
              <input
                type="number"
                min={1}
                max={totalEpisodes}
                value={freeEpisodes}
                onChange={(e) => setFreeEpisodes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl"
              />
              <p className="text-[11px] text-slate-500 mt-1">Episodes {freeEpisodes + 1}+ require active VIP pass (₹199 / ₹1,499)</p>
            </div>
          </div>

          {/* Episode List Preview */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
            {episodes.map((ep) => (
              <div key={ep.id} className="p-3 flex items-center justify-between hover:bg-slate-50 bg-white">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 font-bold flex items-center justify-center text-slate-700">
                    {ep.id}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{ep.title}</p>
                    <p className="text-[11px] text-slate-400">{ep.duration} • 1080p</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ep.isFree ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {ep.isFree ? 'FREE PREVIEW' : 'VIP LOCKED'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEpisode(ep.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Remove episode"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Bar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-nodus flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="publishToggle"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded text-black border-slate-300 focus:ring-black"
            />
            <label htmlFor="publishToggle" className="text-xs font-bold text-slate-800 cursor-pointer">
              Publish immediately to mobile app feed upon upload
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('dramas')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-bold transition-all shadow-sm hover:shadow"
            >
              {isUploading ? 'Publishing...' : 'Upload & Publish Series'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
