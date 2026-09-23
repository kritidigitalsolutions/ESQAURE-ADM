import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Film,
  Users,
  Receipt,
  Shield,
  LayoutDashboard,
  UploadCloud,
  Sliders,
  Sparkles,
  Tag,
  CreditCard,
  Ticket,
  Bell,
  MessageSquare,
  FileText,
  Settings,
  ChevronRight,
  TrendingUp,
  CornerDownLeft,
  ArrowRight,
  ExternalLink,
  Crown,
  CheckCircle2,
  Clock,
  Play
} from 'lucide-react';
import {
  mockDramas,
  mockUsers,
  mockTransactions,
  mockAuditLogs
} from '../data/mockOttData';

// System navigation routes for quick spotlight jump
const SYSTEM_PAGES = [
  { id: 'page-summary', tab: 'summary', title: 'Dashboard Overview', category: 'Navigation', icon: LayoutDashboard, desc: 'Real-time viewers, subscriber stats, and daily revenue metrics' },
  { id: 'page-dramas', tab: 'dramas', title: 'Content Library (Series)', category: 'Navigation', icon: Film, desc: 'Manage vertical short-drama catalog and status' },
  { id: 'page-upload', tab: 'upload', title: 'Upload Content Studio', category: 'Navigation', icon: UploadCloud, desc: 'Publish new micro-dramas, trailers & episodes' },
  { id: 'page-episodes', tab: 'dramas', title: 'Content & Episodes Management', category: 'Navigation', icon: Play, desc: 'Manage series, paywalls, episodes and media files' },
  { id: 'page-genres', tab: 'genres', title: 'Genres & Categories', category: 'Navigation', icon: Tag, desc: 'OTT genre tags and viewer interest categories' },
  { id: 'page-users', tab: 'users', title: 'User Management', category: 'Navigation', icon: Users, desc: 'Registered mobile accounts, watch times & subscription tiers' },
  { id: 'page-subscribers', tab: 'subscribers', title: 'Subscribers Ledger', category: 'Navigation', icon: Crown, desc: 'Active paid members and subscription terms' },
  { id: 'page-subscriptions', tab: 'subscriptions', title: 'Subscription Plans', category: 'Navigation', icon: CreditCard, desc: 'Monthly (₹199) and Yearly (₹1,499) plan pricing' },
  { id: 'page-promos', tab: 'promos', title: 'Promos & Coupon Vouchers', category: 'Navigation', icon: Ticket, desc: 'Discount coupons, trial codes & referral campaigns' },
  { id: 'page-transactions', tab: 'transactions', title: 'Transactions & Payments', category: 'Navigation', icon: Receipt, desc: 'UPI, Razorpay & Card payment gateway logs' },
  { id: 'page-admob', tab: 'admob', title: 'AdMob Ad Monetization', category: 'Navigation', icon: TrendingUp, desc: 'Rewarded video eCPM, ad units & daily impression revenue' },
  { id: 'page-notifications', tab: 'notifications', title: 'Push Notifications', category: 'Navigation', icon: Bell, desc: 'Targeted FCM push campaigns to viewer devices' },
  { id: 'page-app_notifications', tab: 'app_notifications', title: 'In-App System Notices', category: 'Navigation', icon: MessageSquare, desc: 'Maintenance alerts and community broadcasts' },
  { id: 'page-legal', tab: 'legal', title: 'Legal & Compliance', category: 'Navigation', icon: FileText, desc: 'Terms of service, privacy policy and statutory filings' },
  { id: 'page-auditlog', tab: 'auditlog', title: 'Activity & Audit Log', category: 'Navigation', icon: Shield, desc: 'Immutable administrator audit trail & action diffs' },
  { id: 'page-settings', tab: 'settings', title: 'Platform Settings', category: 'Navigation', icon: Settings, desc: 'Storage CDN keys, payment gateway credentials & system params' },
];

export default function GlobalSearchBar({ onNavigate, onSelectDrama, onOpenIngestModal }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL'); // 'ALL' | 'dramas' | 'users' | 'transactions' | 'logs' | 'pages'
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

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

  // Filter & Search Results across all platform entities
  const searchResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    // 1. Pages matching
    const matchedPages = SYSTEM_PAGES.filter(p => {
      if (!trimmed) return false;
      return p.title.toLowerCase().includes(trimmed) ||
             p.desc.toLowerCase().includes(trimmed) ||
             p.tab.toLowerCase().includes(trimmed);
    }).map(p => ({
      ...p,
      type: 'page',
      key: `page-${p.tab}`
    }));

    // 2. Dramas matching
    const matchedDramas = mockDramas.filter(d => {
      if (!trimmed) return false;
      return d.title.toLowerCase().includes(trimmed) ||
             d.id.toLowerCase().includes(trimmed) ||
             d.synopsis.toLowerCase().includes(trimmed) ||
             d.genres.some(g => g.toLowerCase().includes(trimmed)) ||
             d.status.toLowerCase().includes(trimmed);
    }).map(d => ({
      ...d,
      type: 'drama',
      key: `drama-${d.id}`
    }));

    // 3. Users matching
    const matchedUsers = mockUsers.filter(u => {
      if (!trimmed) return false;
      return u.name.toLowerCase().includes(trimmed) ||
             u.id.toLowerCase().includes(trimmed) ||
             u.phone.toLowerCase().includes(trimmed) ||
             u.email.toLowerCase().includes(trimmed) ||
             u.plan.toLowerCase().includes(trimmed);
    }).map(u => ({
      ...u,
      type: 'user',
      key: `user-${u.id}`
    }));

    // 4. Transactions matching
    const matchedTransactions = mockTransactions.filter(t => {
      if (!trimmed) return false;
      return t.id.toLowerCase().includes(trimmed) ||
             t.orderId.toLowerCase().includes(trimmed) ||
             t.user.toLowerCase().includes(trimmed) ||
             t.phone.toLowerCase().includes(trimmed) ||
             t.amount.toLowerCase().includes(trimmed) ||
             t.plan.toLowerCase().includes(trimmed) ||
             t.method.toLowerCase().includes(trimmed);
    }).map(t => ({
      ...t,
      type: 'transaction',
      key: `tx-${t.id}`
    }));

    // 5. Audit Logs matching
    const matchedLogs = mockAuditLogs.filter(l => {
      if (!trimmed) return false;
      return l.action.toLowerCase().includes(trimmed) ||
             l.admin.toLowerCase().includes(trimmed) ||
             l.targetId.toLowerCase().includes(trimmed) ||
             l.id.toLowerCase().includes(trimmed);
    }).map(l => ({
      ...l,
      type: 'log',
      key: `log-${l.id}`
    }));

    return {
      pages: matchedPages,
      dramas: matchedDramas,
      users: matchedUsers,
      transactions: matchedTransactions,
      logs: matchedLogs,
      totalCount: matchedPages.length + matchedDramas.length + matchedUsers.length + matchedTransactions.length + matchedLogs.length
    };
  }, [query]);

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
    if (activeCategory === 'ALL' || activeCategory === 'logs') {
      items = [...items, ...searchResults.logs];
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
      setSelectedIndex(prev => (prev < displayItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : Math.max(0, displayItems.length - 1)));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (displayItems.length > 0 && displayItems[selectedIndex]) {
        handleSelectItem(displayItems[selectedIndex]);
      }
    }
  };

  // Action execution when user clicks or presses Enter on a result
  const handleSelectItem = (item) => {
    setIsOpen(false);
    setQuery('');

    if (item.type === 'page') {
      onNavigate?.(item.tab);
    } else if (item.type === 'drama') {
      onSelectDrama?.(item.id);
      onNavigate?.('dramas');
    } else if (item.type === 'user') {
      onNavigate?.(item.isVip ? 'subscribers' : 'users');
    } else if (item.type === 'transaction') {
      onNavigate?.('transactions');
    } else if (item.type === 'log') {
      onNavigate?.('auditlog');
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
          placeholder="Search dramas, users, logs..."
          className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-slate-100/90 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-full border border-slate-200/90 dark:border-slate-700/80 focus:border-[#FEF08A] dark:focus:border-[#FEF08A] focus:outline-none focus:ring-2 focus:ring-[#FEF08A]/20 transition-all shadow-2xs"
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            title="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Interactive Dropdown Results Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2.5 w-[calc(100vw-2rem)] max-w-[560px] sm:w-[480px] md:w-[560px] bg-white dark:bg-[#121212] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden font-urbanist animate-fadeIn">
          
          {/* Query Filter Chips Header (When query exists) */}
          {query.trim() && (
            <div className="p-2.5 bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              {[
                { id: 'ALL', label: 'All', count: searchResults.totalCount },
                { id: 'dramas', label: 'Series', count: searchResults.dramas.length },
                { id: 'users', label: 'Users', count: searchResults.users.length },
                { id: 'transactions', label: 'Billing', count: searchResults.transactions.length },
                { id: 'logs', label: 'Audit Logs', count: searchResults.logs.length },
                { id: 'pages', label: 'Pages', count: searchResults.pages.length },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? 'bg-slate-900 text-white dark:bg-[#FEF08A] dark:text-black shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
                    activeCategory === cat.id
                      ? 'bg-white/20 dark:bg-black/15 text-white dark:text-black'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Results List */}
          <div ref={listRef} className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
            
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
                          ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-slate-700'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/50 dark:border-amber-900/40">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0 ml-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
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
                          ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-slate-700'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
                          <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.title}
                            </p>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                              {item.id}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{item.genres?.slice(0, 2).join(', ')}</span>
                            <span>•</span>
                            <span>{item.views} Views</span>
                            <span>•</span>
                            <span className="font-semibold">{item.totalEpisodes} Eps</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0 ml-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'PUBLISHED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                            : item.status === 'ENCODING'
                            ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400'
                            : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                        }`}>
                          {item.status}
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
                          ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-slate-700'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-200/60 dark:border-violet-800/40">
                          {item.isVip ? <Crown className="w-4 h-4 text-amber-500" /> : <Users className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono">({item.id})</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.phone} • {item.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0 ml-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.isVip
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
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
                          ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-slate-700'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/40">
                          <Receipt className="w-4 h-4" />
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

                if (item.type === 'log') {
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-slate-700'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800/40">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-mono font-bold text-slate-900 dark:text-white truncate">
                            {item.action}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.admin} → {item.targetId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0 ml-2 text-[10px] text-slate-400">
                        <span>{item.time}</span>
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
              <div className="py-8 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  No matching results for "{query}"
                </h4>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                  Try searching by drama title (e.g. "Security Guard"), user name, phone (+91), or payment ID.
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      setQuery('');
                      setActiveCategory('ALL');
                    }}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors"
                  >
                    Clear Search
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onNavigate?.('dramas');
                    }}
                    className="px-3 py-1 bg-[#FEF08A] hover:bg-[#FDE047] text-black text-xs font-bold rounded-lg transition-colors"
                  >
                    View All Series
                  </button>
                </div>
              </div>
            )}

            {/* When Query is EMPTY: Show Quick Suggestions & Recent Links */}
            {!query.trim() && (
              <div className="p-2 space-y-4">
                {/* Quick Navigation Pages */}
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Quick Access Destinations
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    {[
                      { tab: 'dramas', title: 'Content Library', icon: Film, count: `${mockDramas.length} series` },
                      { tab: 'upload', title: 'Upload Content', icon: UploadCloud, highlight: true },
                      { tab: 'subscribers', title: 'Subscribers', icon: Crown, count: '₹24.8L MRR' },
                      { tab: 'admob', title: 'AdMob Revenue', icon: TrendingUp, count: '+22.4%' },
                      { tab: 'transactions', title: 'Transactions', icon: Receipt, count: '6 recent' },
                      { tab: 'auditlog', title: 'Activity Log', icon: Shield, count: '1.3k events' },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.tab}
                          onClick={() => {
                            setIsOpen(false);
                            onNavigate?.(item.tab);
                          }}
                          className={`flex items-center space-x-2.5 p-2 rounded-xl text-left transition-all ${
                            item.highlight
                              ? 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-amber-200 border border-amber-200/70 dark:border-amber-900/60'
                              : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-amber-500 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate leading-tight">{item.title}</p>
                            {item.count && (
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">{item.count}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Trending Micro-Dramas */}
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                    <span>Trending Vertical Series</span>
                    <span className="text-amber-500">Top Viewed</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {mockDramas.slice(0, 3).map((drama) => (
                      <div
                        key={drama.id}
                        onClick={() => {
                          setIsOpen(false);
                          onSelectDrama?.(drama.id);
                          onNavigate?.('dramas');
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <img
                            src={drama.poster}
                            alt={drama.title}
                            className="w-7 h-10 object-cover rounded-md border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                              {drama.title}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {drama.genres.join(', ')} • {drama.views} views
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                          Rank #{drama.trendingRank || 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Search match counter if querying */}
          {query.trim() && (
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-slate-400 dark:text-slate-500 text-right">
              {searchResults.totalCount} {searchResults.totalCount === 1 ? 'match' : 'matches'}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
