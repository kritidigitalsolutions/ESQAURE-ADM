import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Film, Image as ImageIcon, Sparkles, Check, Crown, Flame } from 'lucide-react';

export default function DramaIngestModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [selectedGenres, setSelectedGenres] = useState(['Romance', 'Drama']);
  const [isFeatured, setIsFeatured] = useState(true);
  const [isTrending, setIsTrending] = useState(false);
  const [trendingRank, setTrendingRank] = useState('1');

  const genresList = ['Romance', 'Thriller', 'Drama', 'Mystery', 'Action', 'Horror', 'Comedy', 'Fantasy', 'CEO', 'Revenge'];

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 selection:bg-[#FEF08A] selection:text-black animate-in fade-in duration-200">
      
      <div className="bg-white dark:bg-[#111111] rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-urbanist">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/15 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/30 flex items-center justify-center font-extrabold shadow-xs">
              <Film className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-950 dark:text-white text-lg tracking-tight">Upload New Series</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Add vertical short-drama details, posters, and display settings</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <div className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
          
          {/* Series Title */}
          <div>
            <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1.5">Series Title *</label>
            <input
              type="text"
              placeholder="e.g. Security Guard Ki CEO GF"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 font-semibold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-[#161616] focus:border-amber-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Synopsis */}
          <div>
            <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1.5">Story / Description *</label>
            <textarea
              rows="3"
              placeholder="One secret. One promise. One story that changes everything..."
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 font-medium text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-[#161616] focus:border-amber-400 focus:outline-none transition-colors"
            ></textarea>
          </div>

          {/* Genre Multi-select */}
          <div>
            <label className="block font-bold text-slate-900 dark:text-slate-200 mb-2">Select Genres *</label>
            <div className="flex flex-wrap gap-2">
              {genresList.map((genre) => {
                const isSelected = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-full font-bold text-xs transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-[#FEF08A] text-slate-950 font-extrabold shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 inline" />}
                    <span>{genre}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Upload Dropzones Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 9:16 Portrait Poster Dropzone */}
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center bg-slate-50/50 dark:bg-slate-800/30 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-500/50 transition-all cursor-pointer group">
              <ImageIcon className="w-8 h-8 text-amber-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-bold text-slate-900 dark:text-white">Upload 9:16 Vertical Poster</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Portrait vertical cover (PNG/JPG, 1080x1920)</p>
            </div>

            {/* 16:9 Banner Dropzone */}
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center bg-slate-50/50 dark:bg-slate-800/30 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-500/50 transition-all cursor-pointer group">
              <Upload className="w-8 h-8 text-amber-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-bold text-slate-900 dark:text-white">Upload Banner Image</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Wide banner for top carousel (PNG/JPG, 1920x1080)</p>
            </div>

          </div>

          {/* Curation Flags */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider block">Display Options</span>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-slate-800 dark:text-slate-200">Feature on Home Banner</span>
              </div>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-slate-800 dark:text-slate-200">Show in Trending Top List</span>
              </div>
              <input
                type="checkbox"
                checked={isTrending}
                onChange={(e) => setIsTrending(e.target.checked)}
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-extrabold text-slate-950 bg-[#FEF08A] hover:bg-[#FDE047] shadow-xs transition-all"
          >
            Upload Series
          </button>
        </div>

      </div>

    </div>,
    document.body
  );
}
