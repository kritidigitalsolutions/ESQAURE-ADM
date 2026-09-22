import React, { useState } from 'react';
import { mockDramas } from '../../data/mockOttData';
import { Sparkles, Flame, MoveUp, MoveDown, Check, Smartphone, Eye, Film } from 'lucide-react';

export default function CurationPage() {
  const [dramas, setDramas] = useState(mockDramas);

  // Reorder Trending Rank
  const moveTrending = (index, direction) => {
    const trendingList = dramas.filter(d => d.isTrending).sort((a, b) => a.trendingRank - b.trendingRank);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= trendingList.length) return;

    const itemA = trendingList[index];
    const itemB = trendingList[targetIndex];

    const rankA = itemA.trendingRank;
    const rankB = itemB.trendingRank;

    setDramas(prev => prev.map(d => {
      if (d.id === itemA.id) return { ...d, trendingRank: rankB };
      if (d.id === itemB.id) return { ...d, trendingRank: rankA };
      return d;
    }));
  };

  const toggleFeatured = (id) => {
    setDramas(prev => prev.map(d => {
      if (d.id === id) return { ...d, isFeatured: !d.isFeatured };
      return d;
    }));
  };

  const featuredDramas = dramas.filter(d => d.isFeatured);
  const trendingDramas = dramas.filter(d => d.isTrending).sort((a, b) => a.trendingRank - b.trendingRank);

  return (
    <div class="space-y-8 font-urbanist">
      
      {/* Top Banner Info */}
      <div class="bg-gradient-to-r from-slate-900 to-[#080B08] rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800 shadow-nodus">
        <div>
          <div class="flex items-center space-x-2 text-[#FEF08A] font-bold text-xs mb-1">
            <Sparkles class="w-4 h-4" />
            <span>Home Feed & Carousel</span>
          </div>
          <h2 class="text-xl font-extrabold">Home Feed & Trending Manager</h2>
          <p class="text-xs text-slate-300 mt-1">Choose what users see on their home banners, top trending list, and feeds.</p>
        </div>
        <span class="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold shrink-0 border border-white/20">
          Live Feed Sync: ACTIVE
        </span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Home Banner Feature */}
        <div class="lg:col-span-6 space-y-6">
          <div class="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-nodus">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-bold text-slate-950 text-base">Home Banner Series</h3>
                <p class="text-xs text-slate-400">Featured banner carousel at the top of the feed</p>
              </div>
              <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                {featuredDramas.length} Featured
              </span>
            </div>

            <div class="space-y-3">
              {dramas.map((drama) => (
                <div
                  key={drama.id}
                  class={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    drama.isFeatured
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div class="flex items-center space-x-3 min-w-0">
                    <img src={drama.banner || drama.poster} alt={drama.title} class="w-16 h-10 rounded-lg object-cover shrink-0 border border-slate-200" />
                    <div class="min-w-0">
                      <p class="font-bold text-slate-900 text-xs truncate">{drama.title}</p>
                      <p class="text-[10px] text-slate-400">{drama.genres.join(', ')} • {drama.totalEpisodes} Eps</p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleFeatured(drama.id)}
                    class={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                      drama.isFeatured
                        ? 'bg-[#FEF08A] text-slate-950'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {drama.isFeatured ? '★ Spotlighted' : '+ Spotlight'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Trending Top 10 Ranking */}
        <div class="lg:col-span-6 space-y-6">
          <div class="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-nodus">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-bold text-slate-950 text-base">Trending Top 10 Order</h3>
                <p class="text-xs text-slate-400">Reorder ranking badges (1, 2, 3...) shown in the app</p>
              </div>
              <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Auto-Weighted
              </span>
            </div>

            <div class="space-y-2.5">
              {trendingDramas.map((drama, idx) => (
                <div
                  key={drama.id}
                  class="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 transition-colors"
                >
                  <div class="flex items-center space-x-3 min-w-0">
                    <span class={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 ${
                      drama.trendingRank === 1
                        ? 'bg-[#FEF08A] text-slate-950'
                        : drama.trendingRank === 2
                        ? 'bg-slate-200 text-slate-800'
                        : drama.trendingRank === 3
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      #{drama.trendingRank}
                    </span>

                    <img src={drama.poster} alt={drama.title} class="w-8 h-11 rounded object-cover shrink-0" />
                    
                    <div class="min-w-0">
                      <p class="font-bold text-xs text-slate-900 truncate">{drama.title}</p>
                      <p class="text-[10px] text-slate-400">{drama.views} streams • {drama.completionRate} completion</p>
                    </div>
                  </div>

                  <div class="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => moveTrending(idx, 'up')}
                      disabled={idx === 0}
                      class="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-700"
                      title="Move Up"
                    >
                      <MoveUp class="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveTrending(idx, 'down')}
                      disabled={idx === trendingDramas.length - 1}
                      class="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-700"
                      title="Move Down"
                    >
                      <MoveDown class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
