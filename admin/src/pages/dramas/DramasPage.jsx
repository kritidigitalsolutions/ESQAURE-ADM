import React, { useState } from 'react';
import { mockDramas } from '../../data/mockOttData';
import { Search, Plus, Filter, Grid, List, Film, Play, MoreVertical, Edit, Trash2, Eye, Flame, CheckCircle2, Clock } from 'lucide-react';

export default function DramasPage({ onOpenIngestModal, onSelectDramaForEpisodes }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const genres = ['ALL', 'Romance', 'Thriller', 'Drama', 'Comedy', 'Mystery', 'Action', 'CEO'];

  const filteredDramas = mockDramas.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.synopsis.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'ALL' || d.genres.includes(selectedGenre);
    const matchesStatus = selectedStatus === 'ALL' || d.status === selectedStatus;
    return matchesSearch && matchesGenre && matchesStatus;
  });

  return (
    <div class="space-y-6 font-urbanist">
      
      {/* Top Filter & Action Bar */}
      <div class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-nodus flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search & Genre Chips */}
        <div class="flex flex-wrap items-center gap-3 flex-1">
          <div class="relative w-full sm:w-64">
            <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search micro-dramas..."
              class="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-100/80 focus:bg-white text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-[#FEF08A] focus:outline-none transition-colors"
            />
          </div>

          {/* Genre Filter */}
          <div class="flex items-center space-x-1.5 overflow-x-auto py-1">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                class={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  selectedGenre === g
                    ? 'bg-[#FEF08A] text-slate-950 font-extrabold'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode & Ingest Button */}
        <div class="flex items-center space-x-3 shrink-0">
          <div class="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              class={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-black' : 'text-slate-500'}`}
              title="Grid View (9:16 Posters)"
            >
              <Grid class="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              class={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-black' : 'text-slate-500'}`}
              title="Table View"
            >
              <List class="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenIngestModal}
            class="py-2 px-4 bg-[#FEF08A] hover:bg-[#FDE047] text-black font-bold text-xs rounded-xl flex items-center space-x-2 transition-all"
          >
            <Plus class="w-4 h-4 text-black stroke-[2.5]" />
            <span>Upload Content</span>
          </button>
        </div>

      </div>

      {/* Grid Mode (9:16 Vertical OTT Posters) */}
      {viewMode === 'grid' ? (
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {filteredDramas.map((drama) => (
            <div
              key={drama.id}
              class="bg-white rounded-2xl border border-slate-200/90 shadow-nodus overflow-hidden flex flex-col group transition-all"
            >
              {/* 9:16 Vertical Poster Container */}
              <div class="relative aspect-[9/14] bg-slate-950 overflow-hidden">
                <img
                  src={drama.poster}
                  alt={drama.title}
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

                {/* Top Badges */}
                <div class="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                  {drama.isTrending ? (
                    <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FEF08A] text-slate-950">
                      <Flame class="w-3 h-3 fill-black" />
                      <span>RANK #{drama.trendingRank}</span>
                    </span>
                  ) : (
                    <span></span>
                  )}

                  <span class={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm ${
                    drama.status === 'PUBLISHED'
                      ? 'bg-emerald-500 text-white'
                      : drama.status === 'ENCODING'
                      ? 'bg-amber-500 text-black animate-pulse'
                      : 'bg-slate-700 text-white'
                  }`}>
                    {drama.status}
                  </span>
                </div>

                {/* Bottom Overlay Info */}
                <div class="absolute bottom-3 left-3 right-3 text-white">
                  <div class="flex items-center space-x-1 text-[11px] text-amber-300 font-bold mb-1">
                    <span>★ {drama.rating}</span>
                    <span>•</span>
                    <span class="text-slate-300 font-medium">{drama.views} streams</span>
                  </div>
                  <h4 class="font-extrabold text-sm text-white leading-snug line-clamp-2">
                    {drama.title}
                  </h4>
                </div>
              </div>

              {/* Card Meta & Actions */}
              <div class="p-3.5 flex-1 flex flex-col justify-between space-y-3 bg-white">
                <div>
                  <div class="flex flex-wrap gap-1 mb-2">
                    {drama.genres.map(g => (
                      <span key={g} class="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {g}
                      </span>
                    ))}
                  </div>
                  <p class="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {drama.synopsis}
                  </p>
                </div>

                <div class="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-700">{drama.totalEpisodes} Episodes</span>
                  <button
                    onClick={() => onSelectDramaForEpisodes(drama.id)}
                    class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#FEF08A] hover:text-black text-slate-800 font-bold text-[11px] transition-all"
                  >
                    Episodes &gt;
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table Mode */
        <div class="bg-white rounded-2xl border border-slate-200/90 shadow-nodus overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th class="py-3 px-4">Series Title</th>
                  <th class="py-3 px-4">Genres</th>
                  <th class="py-3 px-4">Episodes</th>
                  <th class="py-3 px-4">Streams & Watch Time</th>
                  <th class="py-3 px-4">Featured / Trending</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                {filteredDramas.map((drama) => (
                  <tr key={drama.id} class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-3 px-4">
                      <div class="flex items-center space-x-3">
                        <img src={drama.poster} alt={drama.title} class="w-9 h-12 rounded object-cover shrink-0" />
                        <div>
                          <p class="font-bold text-slate-900">{drama.title}</p>
                          <p class="text-[10px] text-slate-400">{drama.id} • {drama.releaseDate}</p>
                        </div>
                      </div>
                    </td>
                    <td class="py-3 px-4">
                      <div class="flex flex-wrap gap-1">
                        {drama.genres.map(g => (
                          <span key={g} class="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {g}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td class="py-3 px-4 font-bold text-slate-800">
                      {drama.totalEpisodes} Eps ({drama.freeEpisodes} Free)
                    </td>
                    <td class="py-3 px-4">
                      <p class="font-bold text-slate-900">{drama.views}</p>
                      <p class="text-[10px] text-emerald-600 font-bold">{drama.watchHours}</p>
                    </td>
                    <td class="py-3 px-4">
                      {drama.isTrending && (
                        <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-extrabold text-[10px]">
                          Trending #{drama.trendingRank}
                        </span>
                      )}
                    </td>
                    <td class="py-3 px-4">
                      <span class={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        drama.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {drama.status}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectDramaForEpisodes(drama.id)}
                        class="px-3 py-1 bg-slate-100 hover:bg-[#FEF08A] hover:text-black rounded-lg font-bold text-xs transition-colors"
                      >
                        Manage Studio
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
