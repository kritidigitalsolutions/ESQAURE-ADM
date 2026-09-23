import React, { useState, useMemo } from 'react';
import { Search, X, SlidersHorizontal, Download, ChevronDown, Plus, Film, Crown, Play, Eye, MoreVertical, Edit3, Trash2, CheckCircle2, Clock, Flame } from 'lucide-react';

export default function DataTableSection({ onOpenIngestModal }) {
  const [activeTab, setActiveTab] = useState('dramas');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState('15');

  // Micro-Dramas Ingested Catalog
  const dramaItems = [
    {
      id: 'DRM-101',
      title: 'Security Guard Ki CEO GF',
      genres: ['Romance', 'Drama'],
      episodes: 24,
      views: '3.5k',
      rating: 4.8,
      status: 'PUBLISHED',
      isTrending: true,
      trendingRank: 1,
      isFeatured: true,
      poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=120&q=80',
      updatedAt: '12 min ago'
    },
    {
      id: 'DRM-102',
      title: 'Dhokha: A Dark Side of Love',
      genres: ['Romance', 'Thriller'],
      episodes: 18,
      views: '2.8k',
      rating: 4.7,
      status: 'PUBLISHED',
      isTrending: true,
      trendingRank: 2,
      isFeatured: false,
      poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=120&q=80',
      updatedAt: '1 hour ago'
    },
    {
      id: 'DRM-103',
      title: 'My Wife Rented Me Out',
      genres: ['Comedy', 'Romance'],
      episodes: 12,
      views: '4.1k',
      rating: 4.9,
      status: 'PUBLISHED',
      isTrending: true,
      trendingRank: 3,
      isFeatured: false,
      poster: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
      updatedAt: '3 hours ago'
    },
    {
      id: 'DRM-104',
      title: 'The Last Promise',
      genres: ['Drama', 'Mystery'],
      episodes: 16,
      views: '1.2k',
      rating: 4.6,
      status: 'PROCESSING',
      isTrending: false,
      trendingRank: null,
      isFeatured: true,
      poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=120&q=80',
      updatedAt: 'In Encoding'
    },
    {
      id: 'DRM-105',
      title: 'Mafia Romance',
      genres: ['Action', 'Romance'],
      episodes: 30,
      views: '5.6k',
      rating: 4.9,
      status: 'PUBLISHED',
      isTrending: false,
      trendingRank: null,
      isFeatured: false,
      poster: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=120&q=80',
      updatedAt: 'Yesterday'
    }
  ];

  // Subscription Transactions
  const subscriptionTransactions = [
    {
      id: 'SUB-9821',
      user: 'Aryan (+91 76****97)',
      plan: 'Yearly Pass',
      amount: '₹1,499',
      paymentId: 'pay_Pq87x291KmA',
      status: 'SUCCESS',
      time: '12 min ago'
    },
    {
      id: 'SUB-9820',
      user: 'Priya Sharma (+91 98****12)',
      plan: 'Monthly Pass',
      amount: '₹199',
      paymentId: 'pay_Pq86a112LzB',
      status: 'SUCCESS',
      time: '35 min ago'
    },
    {
      id: 'SUB-9819',
      user: 'Rahul Verma (+91 91****44)',
      plan: 'Monthly Pass',
      amount: '₹199',
      paymentId: 'pay_Pq85b991XcC',
      status: 'FAILED',
      time: '1 hour ago'
    }
  ];

  // Filtered lists based on searchTerm
  const filteredDramaItems = useMemo(() => {
    if (!searchTerm.trim()) return dramaItems;
    const term = searchTerm.toLowerCase();
    return dramaItems.filter(d =>
      d.title.toLowerCase().includes(term) ||
      d.id.toLowerCase().includes(term) ||
      d.status.toLowerCase().includes(term) ||
      d.genres.some(g => g.toLowerCase().includes(term))
    );
  }, [searchTerm, dramaItems]);

  const filteredSubscriptionTransactions = useMemo(() => {
    if (!searchTerm.trim()) return subscriptionTransactions;
    const term = searchTerm.toLowerCase();
    return subscriptionTransactions.filter(tx =>
      tx.id.toLowerCase().includes(term) ||
      tx.user.toLowerCase().includes(term) ||
      tx.paymentId.toLowerCase().includes(term) ||
      tx.plan.toLowerCase().includes(term) ||
      tx.status.toLowerCase().includes(term) ||
      tx.amount.toLowerCase().includes(term)
    );
  }, [searchTerm, subscriptionTransactions]);

  return (
    <div class="bg-white rounded-2xl border border-slate-200/90 shadow-nodus overflow-hidden">
      
      {/* Sub-tab Header */}
      <div class="px-6 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between overflow-x-auto">
        
        <div class="flex items-center space-x-6 text-xs font-bold text-slate-500">
          <button
            onClick={() => setActiveTab('dramas')}
            class={`py-3.5 border-b-2 transition-all whitespace-nowrap flex items-center space-x-2 ${
              activeTab === 'dramas'
                ? 'border-slate-950 text-slate-950'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Film class="w-4 h-4 text-amber-500" />
            <span>All Series ({dramaItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('subscriptions')}
            class={`py-3.5 border-b-2 transition-all whitespace-nowrap flex items-center space-x-2 ${
              activeTab === 'subscriptions'
                ? 'border-slate-950 text-slate-950'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Crown class="w-4 h-4 text-amber-500" />
            <span>Subscribers ({subscriptionTransactions.length})</span>
          </button>
        </div>

        <button
          onClick={onOpenIngestModal}
          class="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 py-2 px-3 rounded-lg hover:bg-amber-50 transition-colors"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Upload Content</span>
        </button>

      </div>

      {/* Control Filter Bar */}
      <div class="p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100">
        
        <div class="flex items-center space-x-3 w-full md:w-auto">
          <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold whitespace-nowrap">
            {activeTab === 'dramas' ? `${filteredDramaItems.length} Dramas` : `${filteredSubscriptionTransactions.length} Transactions`}
          </span>

          <div class="relative flex-1 md:w-80">
            <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={activeTab === 'dramas' ? "Search drama title, genre, ID..." : "Search user phone, payment ID..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              class="w-full pl-9 pr-9 py-1.5 text-xs font-medium bg-slate-100/80 focus:bg-white text-slate-900 placeholder-slate-400 rounded-full border border-slate-200 focus:border-slate-950 focus:outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div class="flex items-center space-x-2.5 w-full md:w-auto justify-end">
          <button class="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-full border border-slate-200 transition-colors">
            <SlidersHorizontal class="w-3.5 h-3.5 text-slate-500" />
            <span>Filters</span>
          </button>

          <button class="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-full border border-slate-200 transition-colors">
            <Download class="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
            <ChevronDown class="w-3 h-3 text-slate-400" />
          </button>

          <div class="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white rounded-full border border-slate-200">
            <span class="text-slate-400 font-normal">Page size</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value)}
              class="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

      </div>

      {/* Table Content */}
      <div class="overflow-x-auto">
        {activeTab === 'dramas' ? (
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th class="py-3.5 px-4 sm:px-6">Status</th>
                <th class="py-3.5 px-4 sm:px-6">Micro-Drama Series</th>
                <th class="py-3.5 px-4 sm:px-6">Genres</th>
                <th class="py-3.5 px-4 sm:px-6 text-center">Episodes</th>
                <th class="py-3.5 px-4 sm:px-6 text-center">Total Views</th>
                <th class="py-3.5 px-4 sm:px-6">Curation Flags</th>
                <th class="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              {filteredDramaItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Search className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">No micro-dramas match "{searchTerm}"</p>
                      <p className="text-[11px] text-slate-400">Try checking title spelling or clearing the search filter.</p>
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-1 px-3 py-1 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs rounded-lg transition-colors"
                      >
                        Clear Search
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDramaItems.map((drama) => (
                  <tr key={drama.id} class="hover:bg-slate-50/80 transition-colors group">
                    
                    {/* Status */}
                    <td class="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <span class={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        drama.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        <span class={`w-1.5 h-1.5 rounded-full ${drama.status === 'PUBLISHED' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        <span>{drama.status}</span>
                      </span>
                    </td>

                    {/* Drama Poster & Title */}
                    <td class="py-4 px-4 sm:px-6">
                      <div class="flex items-center space-x-3">
                        <img
                          src={drama.poster}
                          alt={drama.title}
                          class="w-9 h-12 rounded-lg object-cover shadow-sm ring-1 ring-slate-200 shrink-0"
                        />
                        <div>
                          <p class="font-bold text-slate-950 text-sm group-hover:text-amber-500 transition-colors font-urbanist">
                            {drama.title}
                          </p>
                          <p class="text-[11px] text-slate-400 font-normal">ID: {drama.id} • Updated {drama.updatedAt}</p>
                        </div>
                      </div>
                    </td>

                    {/* Genres */}
                    <td class="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <div class="flex items-center space-x-1">
                        {drama.genres.map((g, idx) => (
                          <span key={idx} class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            {g}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Episodes */}
                    <td class="py-4 px-4 sm:px-6 text-center font-bold text-slate-900">
                      {drama.episodes} Ep
                    </td>

                    {/* Total Views */}
                    <td class="py-4 px-4 sm:px-6 text-center font-bold text-amber-600">
                      {drama.views}
                    </td>

                    {/* Curation Flags */}
                    <td class="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <div class="flex items-center space-x-1.5">
                        {drama.isTrending && (
                          <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                            <Flame class="w-3 h-3 text-red-500" />
                            <span>Rank #{drama.trendingRank}</span>
                          </span>
                        )}
                        {drama.isFeatured && (
                          <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            <Crown class="w-3 h-3 text-amber-500" />
                            <span>Featured Banner</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td class="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div class="flex items-center justify-end space-x-1">
                        <button
                          onClick={onOpenIngestModal}
                          title="Edit Details"
                          class="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Edit3 class="w-4 h-4" />
                        </button>
                        <button
                          title="Delete"
                          class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th class="py-3.5 px-4 sm:px-6">Status</th>
                <th class="py-3.5 px-4 sm:px-6">Subscriber</th>
                <th class="py-3.5 px-4 sm:px-6">Plan Tier</th>
                <th class="py-3.5 px-4 sm:px-6">Amount</th>
                <th class="py-3.5 px-4 sm:px-6">Razorpay Payment ID</th>
                <th class="py-3.5 px-4 sm:px-6 text-right">Time</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              {filteredSubscriptionTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Search className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">No transactions match "{searchTerm}"</p>
                      <p className="text-[11px] text-slate-400">Try searching by payment ID, customer name, or phone number.</p>
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-1 px-3 py-1 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs rounded-lg transition-colors"
                      >
                        Clear Search
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubscriptionTransactions.map((tx) => (
                  <tr key={tx.id} class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <span class={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        tx.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <span>{tx.status}</span>
                      </span>
                    </td>
                    <td class="py-4 px-4 sm:px-6 font-bold text-slate-900">{tx.user}</td>
                    <td class="py-4 px-4 sm:px-6 font-bold text-amber-800">{tx.plan}</td>
                    <td class="py-4 px-4 sm:px-6 font-bold text-slate-950">{tx.amount}</td>
                    <td class="py-4 px-4 sm:px-6 font-mono text-[11px] text-slate-500">{tx.paymentId}</td>
                    <td class="py-4 px-4 sm:px-6 text-right text-slate-400">{tx.time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
