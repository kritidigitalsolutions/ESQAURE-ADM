import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Film,
  Users,
  Receipt,
  LayoutDashboard,
  UploadCloud,
  Sliders,
  Sparkles,
  Tag,
  CreditCard,
  Ticket,
  Gift,
  Bell,
  MessageSquare,
  FileText,
  Settings,
  ChevronRight,
  TrendingUp,
  CornerDownLeft,
  Crown,
  Loader2
} from 'lucide-react';
import { searchService } from '../services/searchService';
import { dramaService } from '../services/dramaService';
import { userService } from '../services/userService';
import { subscriptionService } from '../services/subscriptionService';
import promoService from '../services/promoService';

// System navigation routes for quick spotlight jump
const SYSTEM_PAGES = [
  { id: 'page-summary', tab: 'summary', title: 'Dashboard Overview', category: 'Navigation', icon: LayoutDashboard, desc: 'Real-time viewers, subscriber stats, and daily revenue metrics' },
  { id: 'page-dramas', tab: 'dramas', title: 'Content Library (Series)', category: 'Navigation', icon: Film, desc: 'Manage vertical short-drama catalog and status' },
  { id: 'page-upload', tab: 'upload', title: 'Upload Content Studio', category: 'Navigation', icon: UploadCloud, desc: 'Publish new micro-dramas, trailers & episodes' },
  { id: 'page-banners', tab: 'banners', title: 'Banners & Hero Carousel', category: 'Navigation', icon: Film, desc: 'Manage landscape hero slides & promo banners' },
  { id: 'page-genres', tab: 'genres', title: 'Genres & Categories', category: 'Navigation', icon: Tag, desc: 'OTT genre tags and viewer interest categories' },
  { id: 'page-category_priority', tab: 'category_priority', title: 'Homepage Category Priority', category: 'Navigation', icon: Sliders, desc: 'Rank order (1, 2, 3...) for mobile app home sections' },
  { id: 'page-users', tab: 'users', title: 'User Management', category: 'Navigation', icon: Users, desc: 'Registered mobile accounts, watch times & subscription tiers' },
  { id: 'page-subscribers', tab: 'subscribers', title: 'Subscribers Ledger', category: 'Navigation', icon: Crown, desc: 'Active paid members and subscription terms' },
  { id: 'page-subscriptions', tab: 'subscriptions', title: 'Subscription Plans', category: 'Navigation', icon: CreditCard, desc: '1 Month (₹99), 6 Months (₹499), 12 Months (₹899) & 7-Day Trial (₹2)' },
  { id: 'page-promos', tab: 'promos', title: 'Promo Codes (Discounts)', category: 'Navigation', icon: Ticket, desc: 'Percentage and flat discount coupons applied during checkout' },
  { id: 'page-vouchers', tab: 'vouchers', title: 'Plan Vouchers (Complete Plans)', category: 'Navigation', icon: Gift, desc: 'Complimentary VIP passes (1M, 6M, 12M passes) for giveaways & partners' },
  { id: 'page-transactions', tab: 'transactions', title: 'Transactions & Payments', category: 'Navigation', icon: Receipt, desc: 'UPI, Razorpay & Card payment gateway logs' },
  { id: 'page-admob', tab: 'admob', title: 'Google AdMob Monetization', category: 'Navigation', icon: TrendingUp, desc: 'Rewarded video eCPM, ad units & daily impression revenue' },
  { id: 'page-custom_ads', tab: 'custom_ads', title: 'Custom Ads & Direct Sponsors', category: 'Navigation', icon: Sparkles, desc: 'Direct sponsor campaigns, video pre-rolls, banners & promos' },
  { id: 'page-ad_control', tab: 'ad_control', title: 'Ad Control & Synchronized Delivery', category: 'Navigation', icon: Sliders, desc: 'Synchronize whether to show Custom ads, AdMob, or both' },
  { id: 'page-notifications', tab: 'notifications', title: 'Push Notifications', category: 'Navigation', icon: Bell, desc: 'Targeted FCM push campaigns to viewer devices' },
  { id: 'page-app_notifications', tab: 'app_notifications', title: 'In-App System Notices', category: 'Navigation', icon: MessageSquare, desc: 'Maintenance alerts and community broadcasts' },
  { id: 'page-legal', tab: 'legal', title: 'Legal & Compliance', category: 'Navigation', icon: FileText, desc: 'Terms of service, privacy policy and statutory filings' },
  { id: 'page-settings', tab: 'settings', title: 'Platform Settings', category: 'Navigation', icon: Settings, desc: 'Storage CDN keys, payment gateway credentials & system params' },
];

export default function GlobalSearchBar({ onNavigate, onSelectDrama, onOpenIngestModal }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL'); // 'ALL' | 'dramas' | 'users' | 'transactions' | 'promos' | 'pages'
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Live Server Data
  const [liveDramas, setLiveDramas] = useState([]);
  const [liveUsers, setLiveUsers] = useState([]);
  const [liveTransactions, setLiveTransactions] = useState([]);
  const [livePromos, setLivePromos] = useState([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const hasLoadedRef = useRef(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Fetch real data from backend APIs
  const fetchLiveSearchData = async () => {
    if (isLoadingLive) return;
    setIsLoadingLive(true);
    try {
      const [dramasRes, usersRes, txRes, promosRes] = await Promise.allSettled([
        dramaService.getAdminDramas(),
        userService.getUsers({ limit: 100 }),
        subscriptionService.getTransactions({ limit: 100 }),
        promoService.getPromos()
      ]);

      if (dramasRes.status === 'fulfilled' && dramasRes.value) {
        const dList = dramasRes.value.dramas || (Array.isArray(dramasRes.value) ? dramasRes.value : []);
        setLiveDramas(dList);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value) {
        const uList = usersRes.value.users || (Array.isArray(usersRes.value) ? usersRes.value : []);
        setLiveUsers(uList);
      }
      if (txRes.status === 'fulfilled' && txRes.value) {
        const tList = txRes.value.transactions || (Array.isArray(txRes.value) ? txRes.value : []);
        setLiveTransactions(tList);
      }
      if (promosRes.status === 'fulfilled' && promosRes.value) {
        const pList = promosRes.value.promos || (Array.isArray(promosRes.value) ? promosRes.value : []);
        setLivePromos(pList);
      }
      hasLoadedRef.current = true;
    } catch (err) {
      console.warn('Live search data load error:', err);
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    fetchLiveSearchData();
  }, []);

  useEffect(() => {
    if (isOpen && !hasLoadedRef.current) {
      fetchLiveSearchData();
    }
  }, [isOpen]);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K or '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Remote search state
  const [remoteSearchResults, setRemoteSearchResults] = useState(null);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  const searchDebounceRef = useRef(null);

  // Trigger live search hitting GET /api/v1/search, /api/v1/users, /api/v1/subscriptions/admin/transactions
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setRemoteSearchResults(null);
      setIsSearchingRemote(false);
      return;
    }

    setIsSearchingRemote(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const [searchApiRes, usersRes, txRes] = await Promise.allSettled([
          searchService.search(trimmed),
          userService.getUsers({ search: trimmed, limit: 15 }),
          subscriptionService.getTransactions({ search: trimmed, limit: 15 })
        ]);

        let dramas = [];
        if (searchApiRes.status === 'fulfilled' && searchApiRes.value) {
          const raw = searchApiRes.value.results || searchApiRes.value.dramas || (Array.isArray(searchApiRes.value) ? searchApiRes.value : []);
          dramas = raw.map((d) => ({
            ...d,
            id: d.id || d._id,
            poster: d.poster || d.posterUrl || d.bannerUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
            type: 'drama',
            key: `drama-${d.id || d._id}`
          }));
        }

        let users = [];
        if (usersRes.status === 'fulfilled' && usersRes.value) {
          const raw = usersRes.value.users || (Array.isArray(usersRes.value) ? usersRes.value : []);
          users = raw.map((u) => ({
            ...u,
            id: u.id || u._id,
            name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Viewer',
            phone: u.phone || u.phoneNumber || 'N/A',
            email: u.email || 'N/A',
            plan: u.plan || (u.isVip ? 'VIP Subscriber' : 'Free Tier'),
            type: 'user',
            key: `user-${u.id || u._id}`
          }));
        }

        let transactions = [];
        if (txRes.status === 'fulfilled' && txRes.value) {
          const raw = txRes.value.transactions || (Array.isArray(txRes.value) ? txRes.value : []);
          transactions = raw.map((t) => ({
            ...t,
            id: t.id || t._id || t.gatewayPaymentId,
            type: 'transaction',
            key: `tx-${t.id || t._id}`
          }));
        }

        setRemoteSearchResults({ dramas, users, transactions });
      } catch (e) {
        console.warn('Live search API request failed, falling back:', e);
      } finally {
        setIsSearchingRemote(false);
      }
    }, 200);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [query]);

  // Filter & Search Results across all real database entities
  const searchResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return { pages: [], dramas: [], users: [], transactions: [], promos: [], totalCount: 0 };
    }

    // 1. Pages matching
    const matchedPages = SYSTEM_PAGES.filter(p => {
      return p.title.toLowerCase().includes(trimmed) ||
             p.desc.toLowerCase().includes(trimmed) ||
             p.tab.toLowerCase().includes(trimmed);
    }).map(p => ({
      ...p,
      type: 'page',
      key: `page-${p.tab}`
    }));

    // 2. Real Dramas matching (from live /api/v1/search API, fallback to local catalog)
    let matchedDramas = [];
    if (remoteSearchResults?.dramas && remoteSearchResults.dramas.length > 0) {
      matchedDramas = remoteSearchResults.dramas;
    } else {
      matchedDramas = liveDramas.filter(d => {
        const title = (d.title || '').toLowerCase();
        const id = String(d.id || d._id || '').toLowerCase();
        const synopsis = (d.synopsis || '').toLowerCase();
        const genres = Array.isArray(d.genres) ? d.genres.map(g => String(g).toLowerCase()) : [];
        const status = String(d.status || '').toLowerCase();

        return title.includes(trimmed) ||
               id.includes(trimmed) ||
               synopsis.includes(trimmed) ||
               genres.some(g => g.includes(trimmed)) ||
               status.includes(trimmed);
      }).map(d => ({
        ...d,
        id: d.id || d._id,
        poster: d.poster || d.posterUrl || d.bannerUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
        type: 'drama',
        key: `drama-${d.id || d._id}`
      }));
    }

    // 3. Real Users matching (from live /api/v1/users?search=... API, fallback to local users)
    let matchedUsers = [];
    if (remoteSearchResults?.users && remoteSearchResults.users.length > 0) {
      matchedUsers = remoteSearchResults.users;
    } else {
      matchedUsers = liveUsers.filter(u => {
        const name = (u.name || `${u.firstName || ''} ${u.lastName || ''}`).toLowerCase();
        const id = String(u.id || u._id || '').toLowerCase();
        const phone = String(u.phone || u.phoneNumber || '').toLowerCase();
        const email = String(u.email || '').toLowerCase();
        const plan = String(u.plan || (u.isVip ? 'VIP Subscriber' : 'Free Tier')).toLowerCase();

        return name.includes(trimmed) ||
               id.includes(trimmed) ||
               phone.includes(trimmed) ||
               email.includes(trimmed) ||
               plan.includes(trimmed);
      }).map(u => ({
        ...u,
        id: u.id || u._id,
        name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Viewer',
        phone: u.phone || u.phoneNumber || 'N/A',
        email: u.email || 'N/A',
        plan: u.plan || (u.isVip ? 'VIP Subscriber' : 'Free Tier'),
        type: 'user',
        key: `user-${u.id || u._id}`
      }));
    }

    // 4. Real Transactions matching (from live /api/v1/subscriptions/admin/transactions?search=... API, fallback to local tx)
    let matchedTransactions = [];
    if (remoteSearchResults?.transactions && remoteSearchResults.transactions.length > 0) {
      matchedTransactions = remoteSearchResults.transactions;
    } else {
      matchedTransactions = liveTransactions.filter(t => {
        const id = String(t.id || t._id || t.gatewayPaymentId || '').toLowerCase();
        const orderId = String(t.orderId || t.gatewayOrderId || '').toLowerCase();
        const user = String(t.user || '').toLowerCase();
        const phone = String(t.phone || '').toLowerCase();
        const amount = String(t.amount || '').toLowerCase();
        const plan = String(t.plan || '').toLowerCase();
        const method = String(t.method || '').toLowerCase();

        return id.includes(trimmed) ||
               orderId.includes(trimmed) ||
               user.includes(trimmed) ||
               phone.includes(trimmed) ||
               amount.includes(trimmed) ||
               plan.includes(trimmed) ||
               method.includes(trimmed);
      }).map(t => ({
        ...t,
        id: t.id || t._id || t.gatewayPaymentId,
        type: 'transaction',
        key: `tx-${t.id || t._id}`
      }));
    }

    // 5. Real Promo Codes matching
    const matchedPromos = livePromos.filter(p => {
      const code = String(p.code || '').toLowerCase();
      const desc = String(p.description || '').toLowerCase();
      const discount = String(p.discountValue || '').toLowerCase();

      return code.includes(trimmed) || desc.includes(trimmed) || discount.includes(trimmed);
    }).map(p => ({
      ...p,
      id: p.id || p._id,
      type: 'promo',
      key: `promo-${p.id || p._id}`
    }));

    return {
      pages: matchedPages,
      dramas: matchedDramas,
      users: matchedUsers,
      transactions: matchedTransactions,
      promos: matchedPromos,
      totalCount: matchedPages.length + matchedDramas.length + matchedUsers.length + matchedTransactions.length + matchedPromos.length
    };
  }, [query, remoteSearchResults, liveDramas, liveUsers, liveTransactions, livePromos]);

  // Filtered flat list based on active category
  const displayItems = useMemo(() => {
    if (!query.trim()) return [];

    let items = [];
    if (activeCategory === 'ALL' || activeCategory === 'dramas') {
      items = [...items, ...searchResults.dramas];
    }
    if (activeCategory === 'ALL' || activeCategory === 'users') {
      items = [...items, ...searchResults.users];
    }
    if (activeCategory === 'ALL' || activeCategory === 'pages') {
      items = [...items, ...searchResults.pages];
    }
    if (activeCategory === 'ALL' || activeCategory === 'transactions') {
      items = [...items, ...searchResults.transactions];
    }
    if (activeCategory === 'ALL' || activeCategory === 'promos') {
      items = [...items, ...searchResults.promos];
    }
    return items;
  }, [searchResults, activeCategory, query]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  // Keyboard navigation through search results
  const handleInputKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, displayItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + displayItems.length) % Math.max(1, displayItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (displayItems.length > 0 && displayItems[selectedIndex]) {
        handleSelectItem(displayItems[selectedIndex]);
      }
    }
  };

  const handleSelectItem = (item) => {
    setIsOpen(false);
    setQuery('');

    if (item.type === 'page') {
      onNavigate?.(item.tab);
    } else if (item.type === 'drama') {
      onSelectDrama?.(item.id || item._id);
      onNavigate?.('dramas');
    } else if (item.type === 'user') {
      onNavigate?.(item.isVip ? 'subscribers' : 'users');
    } else if (item.type === 'transaction') {
      onNavigate?.('transactions');
    } else if (item.type === 'promo') {
      onNavigate?.('promos');
    }
  };

  return (
    <div className="relative w-64 md:w-80 xl:w-96" ref={containerRef}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search dramas, users, billing..."
          className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-slate-100/90 dark:bg-[#141419] focus:bg-white dark:focus:bg-[#1E1E26] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 rounded-full border border-slate-200/90 dark:border-white/10 focus:border-[#FEF08A] dark:focus:border-white/25 focus:outline-none focus:ring-2 focus:ring-[#FEF08A]/20 dark:focus:ring-0 transition-all shadow-2xs"
        />

        {/* Loading Spinner or Clear Button */}
        {isSearchingRemote ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
          </div>
        ) : query ? (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            title="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Interactive Dropdown Results Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2.5 w-[calc(100vw-2rem)] max-w-[560px] sm:w-[480px] md:w-[560px] bg-white dark:bg-[#24242E] border border-slate-200/90 dark:border-white/15 rounded-2xl shadow-2xl dark:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.9),0_0_25px_rgba(0,0,0,0.7)] z-50 overflow-hidden font-urbanist animate-fadeIn backdrop-blur-xl">
          
          {/* Query Filter Chips Header (When query exists) */}
          {query.trim() && (
            <div className="p-2.5 bg-slate-50/80 dark:bg-[#1A1A22] border-b border-slate-100 dark:border-white/12 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              {[
                { id: 'ALL', label: 'All', count: searchResults.totalCount },
                { id: 'dramas', label: 'Series', count: searchResults.dramas.length },
                { id: 'users', label: 'Users', count: searchResults.users.length },
                { id: 'transactions', label: 'Billing', count: searchResults.transactions.length },
                { id: 'promos', label: 'Promos', count: searchResults.promos.length },
                { id: 'pages', label: 'Pages', count: searchResults.pages.length },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? 'bg-slate-900 text-white dark:bg-[#FEF08A] dark:text-slate-950 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
                    activeCategory === cat.id
                      ? 'bg-white/20 dark:bg-black/15 text-white dark:text-slate-950'
                      : 'bg-slate-200 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Results List */}
          <div ref={listRef} className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06] p-2">
            
            {/* If Query has text and results exist */}
            {query.trim() && displayItems.length > 0 && (
              displayItems.map((item, index) => {
                const isSelected = selectedIndex === index;

                if (item.type === 'page') {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-[#24242E] text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-white/15'
                          : 'hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#FEF08A] text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                          <Icon className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0 ml-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/60 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300">
                          Page
                        </span>
                        <CornerDownLeft className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  );
                }

                if (item.type === 'drama') {
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-[#24242E] text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-white/15'
                          : 'hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 shadow-2xs">
                          <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.title}
                            </p>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 shrink-0">
                              {item.id}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{Array.isArray(item.genres) ? item.genres.slice(0, 2).join(', ') : 'Drama'}</span>
                            <span>•</span>
                            <span className="font-semibold">{item.totalEpisodes || (Array.isArray(item.episodes) ? item.episodes.length : 0)} Eps</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0 ml-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'PUBLISHED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300/40 dark:border-emerald-700/40'
                            : 'bg-amber-100 dark:bg-amber-400/10 text-amber-700 dark:text-amber-400 border border-amber-300/40 dark:border-amber-400/30'
                        }`}>
                          {item.status || 'DRAFT'}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  );
                }

                if (item.type === 'user') {
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-[#24242E] text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-white/15'
                          : 'hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#FEF08A] text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                          {item.isVip ? <Crown className="w-4 h-4 stroke-[2.2]" /> : <Users className="w-4 h-4 stroke-[2.2]" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono">({String(item.id).slice(-6)})</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.phone} • {item.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0 ml-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.isVip
                            ? 'bg-[#FEF08A]/20 dark:bg-[#FEF08A]/15 text-amber-800 dark:text-[#FEF08A] border border-amber-300/60 dark:border-amber-400/30'
                            : 'bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300'
                        }`}>
                          {item.plan}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  );
                }

                if (item.type === 'transaction') {
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-[#24242E] text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-white/15'
                          : 'hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#FEF08A] text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                          <Receipt className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-xs font-mono font-bold text-slate-900 dark:text-white truncate">
                              {item.id}
                            </p>
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              {item.amount}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.user} • {item.method}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0 ml-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'SUCCESS'
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                            : 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400'
                        }`}>
                          {item.status}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  );
                }

                if (item.type === 'promo') {
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-[#24242E] text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-white/15'
                          : 'hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#FEF08A] text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                          <Ticket className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-xs font-mono font-bold text-slate-900 dark:text-white truncate">
                              {item.code}
                            </p>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              {item.discountType === 'PERCENTAGE' ? `${item.discountValue}% OFF` : `₹${item.discountValue} OFF`}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.description || 'Promotional Discount Coupon'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0 ml-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-300/40">
                          {item.status || 'ACTIVE'}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  );
                }

                return null;
              })
            )}

            {/* If Query has text but NO results found */}
            {query.trim() && displayItems.length === 0 && (
              isSearchingRemote ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-500" />
                  <p className="text-xs font-semibold text-slate-400">Searching live series, users &amp; payments...</p>
                </div>
              ) : (
                <div className="py-8 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  No matching results for "{query}"
                </h4>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Try searching by drama title, user name, phone (+91), or payment ID.
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      setQuery('');
                      setActiveCategory('ALL');
                    }}
                    className="px-3 py-1 bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.14] text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onNavigate?.('dramas');
                    }}
                    className="px-3 py-1 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    View All Series
                  </button>
                </div>
              </div>
            )
          )}

            {/* When Query is EMPTY: Show Quick Suggestions & Live Series Links */}
            {!query.trim() && (
              <div className="p-2 space-y-4">
                {/* Quick Navigation Pages */}
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-300">
                    Quick Access Destinations
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    {[
                      { tab: 'dramas', title: 'Content Library', icon: Film, count: `${liveDramas.length} series` },
                      { tab: 'upload', title: 'Upload Content', icon: UploadCloud, count: 'Studio' },
                      { tab: 'users', title: 'User Accounts', icon: Users, count: `${liveUsers.length} users` },
                      { tab: 'subscribers', title: 'Subscribers', icon: Crown, count: 'Paid Members' },
                      { tab: 'transactions', title: 'Transactions', icon: Receipt, count: `${liveTransactions.length} logs` },
                      { tab: 'promos', title: 'Promo Codes', icon: Ticket, count: `${livePromos.length} codes` },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.tab}
                          onClick={() => {
                            setIsOpen(false);
                            onNavigate?.(item.tab);
                          }}
                          className="group flex items-center space-x-2.5 p-2 rounded-xl text-left transition-all cursor-pointer bg-slate-50 dark:bg-[#141419] hover:bg-slate-100 dark:hover:bg-[#1E1E26] text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-white/10 hover:border-amber-300/60 dark:hover:border-[#FEF08A]/30 shadow-2xs"
                        >
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 bg-[#FEF08A] text-slate-950 shadow-xs">
                            <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate leading-tight group-hover:text-amber-600 dark:group-hover:text-[#FEF08A] transition-colors">{item.title}</p>
                            {item.count && (
                              <p className="text-[10px] text-slate-400 dark:text-slate-400">{item.count}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Series from Database */}
                {liveDramas.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400/80 flex items-center justify-between">
                      <span>Featured Live Series</span>
                      <span className="text-amber-600 dark:text-[#FEF08A] font-extrabold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Live Catalog
                      </span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {liveDramas.slice(0, 3).map((drama, idx) => (
                        <div
                          key={drama.id || drama._id}
                          onClick={() => {
                            setIsOpen(false);
                            onSelectDrama?.(drama.id || drama._id);
                            onNavigate?.('dramas');
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer transition-colors group border border-transparent dark:hover:border-white/10"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <img
                              src={drama.poster || drama.posterUrl || drama.bannerUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80'}
                              alt={drama.title}
                              className="w-7 h-10 object-cover rounded-md border border-slate-200 dark:border-white/10 shrink-0 shadow-xs"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-600 dark:group-hover:text-[#FEF08A] transition-colors">
                                {drama.title}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-400">
                                {Array.isArray(drama.genres) ? drama.genres.join(', ') : 'Drama'} • {drama.totalEpisodes || (drama.episodes ? drama.episodes.length : 0)} eps
                              </p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            idx === 0
                              ? 'bg-[#FEF08A]/15 text-amber-700 dark:text-[#FEF08A] border-amber-300/40 dark:border-[#FEF08A]/40'
                              : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10'
                          }`}>
                            Priority #{drama.priority || (idx + 1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Search match counter if querying */}
          {query.trim() && (
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-[#141419] border-t border-slate-100 dark:border-white/10 text-[10px] font-semibold text-slate-400 dark:text-slate-400 text-right">
              {searchResults.totalCount} {searchResults.totalCount === 1 ? 'match' : 'matches'}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
