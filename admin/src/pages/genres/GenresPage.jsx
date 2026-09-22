import React, { useState } from 'react';
import { mockGenres } from '../../data/mockOttData';
import { Tags, Plus, Heart, ShieldAlert, Briefcase, Flame, Tv, Compass, Smile, Zap, CheckCircle2 } from 'lucide-react';

export default function GenresPage() {
  const [genres, setGenres] = useState(mockGenres);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGenreName, setNewGenreName] = useState('');
  const [newGenreColor, setNewGenreColor] = useState('#EC4899');

  const toggleActive = (id) => {
    setGenres(prev => prev.map(g => {
      if (g.id === id) return { ...g, isActive: !g.isActive };
      return g;
    }));
  };

  const handleAddGenre = (e) => {
    e.preventDefault();
    if (!newGenreName) return;
    const newG = {
      id: `GNR-${Date.now().toString().slice(-3)}`,
      name: newGenreName,
      slug: newGenreName.toLowerCase().replace(/\s+/g, '-'),
      color: newGenreColor,
      dramaCount: 0,
      isActive: true,
      icon: 'Tags'
    };
    setGenres(prev => [...prev, newG]);
    setIsAddModalOpen(false);
    setNewGenreName('');
  };

  return (
    <div class="space-y-6 font-urbanist">
      
      {/* Top Header & Add Action */}
      <div class="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-nodus flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-extrabold text-slate-950">OTT Genres & User Interest Categories</h2>
          <p class="text-xs text-slate-400 mt-0.5">
            These categories populate the onboarding interest selector and catalog filtering rows.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          class="py-2.5 px-4 bg-[#FEF08A] hover:bg-[#FDE047] text-black font-bold text-xs rounded-xl flex items-center space-x-2 transition-all shrink-0"
        >
          <Plus class="w-4 h-4 text-black stroke-[2.5]" />
          <span>Add New Genre</span>
        </button>
      </div>

      {/* Genres Grid */}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {genres.map((genre) => (
          <div
            key={genre.id}
            class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-nodus flex flex-col justify-between transition-all"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                  style={{ backgroundColor: genre.color }}
                >
                  <Tags class="w-5 h-5" />
                </div>
                <div>
                  <h4 class="font-extrabold text-sm text-slate-950">{genre.name}</h4>
                  <p class="text-[10px] text-slate-400 font-mono">/{genre.slug}</p>
                </div>
              </div>

              {/* Status Toggle Switch */}
              <button
                onClick={() => toggleActive(genre.id)}
                class={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors ${
                  genre.isActive
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {genre.isActive ? 'ACTIVE' : 'HIDDEN'}
              </button>
            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span class="text-slate-400 font-medium">Associated Catalog</span>
              <span class="font-extrabold text-slate-900">{genre.dramaCount} Series</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Genre Modal */}
      {isAddModalOpen && (
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
            <h3 class="font-extrabold text-base text-slate-950 mb-1">Add Content Genre / Category</h3>
            <p class="text-xs text-slate-400 mb-4">Creates a new tag for series and catalog browsing.</p>

            <form onSubmit={handleAddGenre} class="space-y-4 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Genre Display Name</label>
                <input
                  type="text"
                  value={newGenreName}
                  onChange={(e) => setNewGenreName(e.target.value)}
                  placeholder="e.g. Fantasy & Mythological"
                  required
                  class="w-full p-2.5 rounded-xl border border-slate-200 focus:border-[#FEF08A] font-bold focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Brand Accent Color</label>
                <div class="flex items-center space-x-3">
                  <input
                    type="color"
                    value={newGenreColor}
                    onChange={(e) => setNewGenreColor(e.target.value)}
                    class="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <span class="font-mono font-bold text-slate-600">{newGenreColor}</span>
                </div>
              </div>

              <div class="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  class="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-5 py-2.5 bg-[#FEF08A] hover:bg-[#FDE047] text-black font-bold rounded-xl"
                >
                  Create Genre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
