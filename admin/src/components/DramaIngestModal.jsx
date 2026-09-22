import React, { useState } from 'react';
import { X, Upload, Film, Image as ImageIcon, Sparkles, Check, Crown, Flame } from 'lucide-react';

export default function DramaIngestModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [selectedGenres, setSelectedGenres] = useState(['Romance', 'Drama']);
  const [isFeatured, setIsFeatured] = useState(true);
  const [isTrending, setIsTrending] = useState(false);
  const [trendingRank, setTrendingRank] = useState('1');

  const genresList = ['Romance', 'Thriller', 'Drama', 'Mystery', 'Action', 'Horror', 'Comedy', 'Fantasy'];

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  return (
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      
      <div class="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300/40 flex items-center justify-center font-bold">
              <Film class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-extrabold text-slate-950 text-lg font-urbanist">Upload New Series</h3>
              <p class="text-xs font-medium text-slate-500">Add series details, posters, and display settings</p>
            </div>
          </div>

          <button
            onClick={onClose}
            class="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <div class="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
          
          {/* Series Title */}
          <div>
            <label class="block font-bold text-slate-900 mb-1.5">Series Title *</label>
            <input
              type="text"
              placeholder="e.g. Security Guard Ki CEO GF"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:border-[#FEF08A] focus:outline-none transition-colors"
            />
          </div>

          {/* Synopsis */}
          <div>
            <label class="block font-bold text-slate-900 mb-1.5">Story / Description *</label>
            <textarea
              rows="3"
              placeholder="One secret. One promise. One story that changes everything..."
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-900 focus:border-[#FEF08A] focus:outline-none transition-colors"
            ></textarea>
          </div>

          {/* Genre Multi-select */}
          <div>
            <label class="block font-bold text-slate-900 mb-2">Select Genres *</label>
            <div class="flex flex-wrap gap-2">
              {genresList.map((genre) => {
                const isSelected = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    class={`px-3 py-1.5 rounded-full font-bold text-xs transition-all ${
                      isSelected
                        ? 'bg-[#FEF08A] text-slate-950 font-extrabold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected && <Check class="w-3 h-3 inline mr-1" />}
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Upload Dropzones Grid */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 9:16 Portrait Poster Dropzone */}
            <div class="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50/50 hover:bg-amber-50/30 transition-all cursor-pointer">
              <ImageIcon class="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p class="font-bold text-slate-900">Upload 9:16 Vertical Poster</p>
              <p class="text-[10px] text-slate-400 mt-0.5">Portrait vertical cover (PNG/JPG)</p>
            </div>

            {/* 16:9 Banner Dropzone */}
            <div class="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50/50 hover:bg-amber-50/30 transition-all cursor-pointer">
              <Upload class="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p class="font-bold text-slate-900">Upload Banner Image</p>
              <p class="text-[10px] text-slate-400 mt-0.5">Wide banner for top carousel (PNG/JPG)</p>
            </div>

          </div>

          {/* Curation Flags */}
          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <span class="font-bold text-slate-900 text-xs uppercase tracking-wider block">Display Options</span>

            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <Crown class="w-4 h-4 text-amber-500" />
                <span class="font-bold text-slate-800">Feature on Home Banner</span>
              </div>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                class="w-4 h-4 accent-[#FEF08A] rounded cursor-pointer"
              />
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <Flame class="w-4 h-4 text-red-500" />
                <span class="font-bold text-slate-800">Show in Trending Top List</span>
              </div>
              <input
                type="checkbox"
                checked={isTrending}
                onChange={(e) => setIsTrending(e.target.checked)}
                class="w-4 h-4 accent-[#FEF08A] rounded cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div class="p-6 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            class="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200/70 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            class="px-6 py-2.5 rounded-xl font-bold text-black bg-[#FEF08A] hover:bg-[#FDE047] transition-all"
          >
            Upload Series
          </button>
        </div>

      </div>

    </div>
  );
}
