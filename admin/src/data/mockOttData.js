// Priority normalization and reordering utilities for continuous 1..N sequence
export const normalizePriorities = (dramaList) => {
  return [...dramaList]
    .sort((a, b) => (a.priority ?? 9999) - (b.priority ?? 9999))
    .map((item, index) => ({
      ...item,
      priority: index + 1
    }));
};

export const reassignPriority = (dramaList, dramaId, targetPriority) => {
  const current = dramaList.find(d => d.id === dramaId);
  if (!current) return normalizePriorities(dramaList);

  const target = Math.max(1, Math.min(dramaList.length, Number(targetPriority) || 1));
  const otherDramas = dramaList.filter(d => d.id !== dramaId);
  const sortedOthers = normalizePriorities(otherDramas);

  sortedOthers.splice(target - 1, 0, { ...current, priority: target });

  return sortedOthers.map((item, index) => ({
    ...item,
    priority: index + 1
  }));
};

export const mockDramas = [
  {
    id: 'DRM-101',
    title: 'Security Guard Ki CEO GF',
    priority: 1,
    slug: 'security-guard-ki-ceo-gf',
    synopsis: 'A humble night security guard secretly protects the heiress of Mumbai\'s largest media empire. When an assassination attempt fails, an unexpected romance blossoms between two opposite worlds.',
    genres: ['Romance', 'Drama', 'CEO'],
    totalEpisodes: 24,
    publishedEpisodes: 24,
    freeEpisodes: 3,
    views: '3.8M',
    rating: 4.9,
    status: 'PUBLISHED',
    isTrending: true,
    trendingRank: 1,
    isFeatured: true,
    carouselOrder: 1,
    releaseDate: 'Aug 2026',
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    trailerUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-portrait-of-a-woman-posing-41551-large.mp4',
    watchHours: '420.5k Hrs',
    completionRate: '88.4%',
  },
  {
    id: 'DRM-102',
    title: 'Dhokha: A Dark Side of Love',
    priority: 2,
    slug: 'dhokha-dark-side-of-love',
    synopsis: 'Betrayal runs deep in this gripping psychological thriller where high-society secrets and deceptive revenge collide in suburban Delhi.',
    genres: ['Romance', 'Thriller', 'Revenge'],
    totalEpisodes: 18,
    publishedEpisodes: 18,
    freeEpisodes: 3,
    views: '2.9M',
    rating: 4.8,
    status: 'PUBLISHED',
    isTrending: true,
    trendingRank: 2,
    isFeatured: true,
    carouselOrder: 2,
    releaseDate: 'Jul 2026',
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    trailerUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-walking-in-a-field-of-yellow-flowers-41618-large.mp4',
    watchHours: '310.2k Hrs',
    completionRate: '82.6%',
  },
  {
    id: 'DRM-103',
    title: 'My Wife Rented Me Out',
    priority: 3,
    slug: 'my-wife-rented-me-out',
    synopsis: 'To pay off an unexpected family debt, a quirky contract husband is rented out as a fake boyfriend to wealthy socialites—until real feelings ignite.',
    genres: ['Comedy', 'Romance'],
    totalEpisodes: 15,
    publishedEpisodes: 15,
    freeEpisodes: 2,
    views: '4.2M',
    rating: 4.9,
    status: 'PUBLISHED',
    isTrending: true,
    trendingRank: 3,
    isFeatured: false,
    carouselOrder: 3,
    releaseDate: 'Aug 2026',
    poster: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    trailerUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-fashion-model-dancing-in-studio-41487-large.mp4',
    watchHours: '480.1k Hrs',
    completionRate: '86.1%',
  },
  {
    id: 'DRM-104',
    title: 'The Last Promise',
    priority: 4,
    slug: 'the-last-promise',
    synopsis: 'Separated by destiny and a 10-year family rivalry, two lovers make a binding vow beneath the rainy streets of Kolkata.',
    genres: ['Drama', 'Mystery'],
    totalEpisodes: 20,
    publishedEpisodes: 16,
    freeEpisodes: 3,
    views: '1.4M',
    rating: 4.6,
    status: 'ENCODING',
    isTrending: false,
    trendingRank: 4,
    isFeatured: true,
    carouselOrder: 4,
    releaseDate: 'Sep 2026',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
    trailerUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-with-neon-lights-at-night-42173-large.mp4',
    watchHours: '190.8k Hrs',
    completionRate: '79.2%',
  },
  {
    id: 'DRM-105',
    title: 'The Secret Billionaire Heir',
    priority: 5,
    slug: 'the-secret-billionaire-heir',
    synopsis: 'Mocked by his in-laws as an unemployed loser, Kabir secretly controls the nation\'s biggest conglomerate. Today, the disguise comes off.',
    genres: ['Action', 'Revenge', 'Billionaire'],
    totalEpisodes: 30,
    publishedEpisodes: 30,
    freeEpisodes: 3,
    views: '5.8M',
    rating: 4.95,
    status: 'PUBLISHED',
    isTrending: true,
    trendingRank: 5,
    isFeatured: true,
    carouselOrder: 5,
    releaseDate: 'Sep 2026',
    poster: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
    trailerUrl: 'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-man-in-suit-smiling-41710-large.mp4',
    watchHours: '640.4k Hrs',
    completionRate: '91.3%',
  },
  {
    id: 'DRM-106',
    title: 'Midnight Affair: Room 404',
    priority: 6,
    slug: 'midnight-affair-room-404',
    synopsis: 'A luxury hotel manager stumbles upon an unsolved mystery that ties back to the city\'s most powerful politician.',
    genres: ['Mystery', 'Thriller'],
    totalEpisodes: 16,
    publishedEpisodes: 0,
    freeEpisodes: 2,
    views: '0',
    rating: 0,
    status: 'DRAFT',
    isTrending: false,
    trendingRank: null,
    isFeatured: false,
    carouselOrder: null,
    releaseDate: 'Coming Soon',
    poster: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    trailerUrl: '',
    watchHours: '0 Hrs',
    completionRate: '0%',
  }
];

export const mockEpisodes = [
  { id: 'EP-101', dramaId: 'DRM-101', episodeNumber: 1, title: 'The Encounter at the Gate', duration: '2:14', isFree: true, views: '184.2k', subtitles: ['Hindi', 'English'], videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80' },
  { id: 'EP-102', dramaId: 'DRM-101', episodeNumber: 2, title: 'A Secret Worth Millions', duration: '2:28', isFree: true, views: '162.8k', subtitles: ['Hindi', 'English'], videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80' },
  { id: 'EP-103', dramaId: 'DRM-101', episodeNumber: 3, title: 'The Midnight Ambush', duration: '1:58', isFree: true, views: '149.0k', subtitles: ['Hindi', 'English'], videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80' },
  { id: 'EP-104', dramaId: 'DRM-101', episodeNumber: 4, title: 'Identity Revealed (Subscriber Locked)', duration: '2:45', isFree: false, views: '128.4k', subtitles: ['Hindi', 'English'], videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80' },
  { id: 'EP-105', dramaId: 'DRM-101', episodeNumber: 5, title: 'The Boardroom Shock', duration: '2:10', isFree: false, views: '115.1k', subtitles: ['Hindi', 'English'], videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80' },
  { id: 'EP-106', dramaId: 'DRM-101', episodeNumber: 6, title: 'Confrontation at Dawn', duration: '2:32', isFree: false, views: '108.9k', subtitles: ['Hindi', 'English'], videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80' },
  { id: 'EP-107', dramaId: 'DRM-101', episodeNumber: 7, title: 'Whispers in the Dark', duration: '2:05', isFree: false, views: '99.4k', subtitles: ['Hindi', 'English'], videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80' },
  { id: 'EP-108', dramaId: 'DRM-101', episodeNumber: 8, title: 'The Dangerous Bargain', duration: '2:40', isFree: false, views: '95.2k', subtitles: ['Hindi', 'English'], videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80' },
];

export const mockGenres = [
  { id: 'GNR-1', name: 'Romance', slug: 'romance', color: '#EC4899', dramaCount: 22, isActive: true, icon: 'Heart' },
  { id: 'GNR-2', name: 'Thriller', slug: 'thriller', color: '#EF4444', dramaCount: 16, isActive: true, icon: 'ShieldAlert' },
  { id: 'GNR-3', name: 'CEO & Billionaire', slug: 'ceo-billionaire', color: '#F59E0B', dramaCount: 19, isActive: true, icon: 'Briefcase' },
  { id: 'GNR-4', name: 'Revenge', slug: 'revenge', color: '#8B5CF6', dramaCount: 14, isActive: true, icon: 'Flame' },
  { id: 'GNR-5', name: 'Drama', slug: 'drama', color: '#3B82F6', dramaCount: 28, isActive: true, icon: 'Tv' },
  { id: 'GNR-6', name: 'Mystery', slug: 'mystery', color: '#6366F1', dramaCount: 12, isActive: true, icon: 'Compass' },
  { id: 'GNR-7', name: 'Comedy', slug: 'comedy', color: '#10B981', dramaCount: 8, isActive: true, icon: 'Smile' },
  { id: 'GNR-8', name: 'Action', slug: 'action', color: '#F97316', dramaCount: 11, isActive: true, icon: 'Zap' },
];

export const mockUsers = [
  { id: 'USR-8910', phone: '+91 98201 44582', firstName: 'Aarav',  lastName: 'Sharma',   name: 'Aarav Sharma',    email: 'aarav.sharma@gmail.com',   isVip: true,  plan: 'Monthly ₹199',     vipExpiresAt: '18 Oct 2026', joinedAt: '12 Jan 2025', totalWatchTime: '48.2 hrs',  lastActive: '5 min ago',    status: 'ACTIVE'    },
  { id: 'USR-8911', phone: '+91 97112 39810', firstName: 'Priya',  lastName: 'Mehra',    name: 'Priya Mehra',     email: 'priya.m22@yahoo.com',      isVip: true,  plan: 'Yearly ₹1,499',    vipExpiresAt: '24 Jul 2027', joinedAt: '03 Mar 2025', totalWatchTime: '112.4 hrs', lastActive: '12 min ago',   status: 'ACTIVE'    },
  { id: 'USR-8912', phone: '+91 98450 12893', firstName: 'Rohan',  lastName: 'Verma',    name: 'Rohan Verma',     email: 'rohan.v@outlook.com',      isVip: false, plan: 'Free Tier',         vipExpiresAt: '—',           joinedAt: '28 Apr 2025', totalWatchTime: '14.5 hrs',  lastActive: '45 min ago',   status: 'ACTIVE'    },
  { id: 'USR-8913', phone: '+91 91670 88231', firstName: 'Sneha',  lastName: 'Patel',    name: 'Sneha Patel',     email: 'sneha.patel@gmail.com',    isVip: true,  plan: 'Monthly ₹199',     vipExpiresAt: '04 Oct 2026', joinedAt: '17 Jun 2025', totalWatchTime: '62.0 hrs',  lastActive: '2 hours ago',  status: 'ACTIVE'    },
  { id: 'USR-8914', phone: '+91 99234 56123', firstName: 'Vikram', lastName: 'Sengupta', name: 'Vikram Sengupta', email: 'vikram.sen@gmail.com',     isVip: false, plan: 'Expired Subscription', vipExpiresAt: '01 Sep 2026', joinedAt: '05 Feb 2025', totalWatchTime: '88.1 hrs',  lastActive: 'Yesterday',    status: 'SUSPENDED' },
  { id: 'USR-8915', phone: '+91 94220 99112', firstName: 'Ananya', lastName: 'Roy',      name: 'Ananya Roy',      email: 'ananya.roy@hotmail.com',   isVip: true,  plan: 'Yearly ₹1,499',    vipExpiresAt: '12 Aug 2027', joinedAt: '21 Aug 2024', totalWatchTime: '140.8 hrs', lastActive: '3 min ago',    status: 'ACTIVE'    },
];

export const mockSubscriptions = [
  {
    code: 'PLAN_MONTHLY',
    name: 'Monthly Pass',
    price: 199,
    period: '30 Days',
    badge: 'Popular',
    activeSubscribers: 8940,
    mrrContribution: '₹17.79 Lakh',
    features: [
      'Unlock all paywalled episodes (Episode 4+)',
      '1080p Full HD vertical streaming',
      'Ad-free uninterrupted viewing',
      'Hindi & English subtitles'
    ]
  },
  {
    code: 'PLAN_YEARLY',
    name: 'Annual All-Access',
    price: 1499,
    period: '365 Days',
    badge: 'Best Value (Save 37%)',
    activeSubscribers: 3510,
    mrrContribution: '₹7.01 Lakh (Amortized)',
    features: [
      'Everything in Monthly Pass',
      'Early access to new series drops',
      'Subscriber badge in community comments',
      'Download episodes for offline playback'
    ]
  }
];

export const mockTransactions = [
  { id: 'pay_P89xKmQ1', orderId: 'order_Nx881A', user: 'Aarav Sharma', phone: '+91 98201 44582', plan: 'Monthly Pass', amount: '₹199', method: 'UPI (PhonePe)', status: 'SUCCESS', date: '16 Sep 2026, 15:42' },
  { id: 'pay_P89xLmB2', orderId: 'order_Nx882B', user: 'Priya Mehra', phone: '+91 97112 39810', plan: 'Yearly All-Access', amount: '₹1,499', method: 'Credit Card (HDFC)', status: 'SUCCESS', date: '16 Sep 2026, 15:10' },
  { id: 'pay_P89xMoC3', orderId: 'order_Nx883C', user: 'Sneha Patel', phone: '+91 91670 88231', plan: 'Monthly Pass', amount: '₹199', method: 'UPI (GPay)', status: 'SUCCESS', date: '16 Sep 2026, 14:28' },
  { id: 'pay_P89xNpD4', orderId: 'order_Nx884D', user: 'Rakesh Yadav', phone: '+91 98199 00124', plan: 'Monthly Pass', amount: '₹199', method: 'Paytm Wallet', status: 'FAILED', date: '16 Sep 2026, 13:55' },
  { id: 'pay_P89xOqE5', orderId: 'order_Nx885E', user: 'Ananya Roy', phone: '+91 94220 99112', plan: 'Yearly All-Access', amount: '₹1,499', method: 'UPI (BHIM)', status: 'SUCCESS', date: '16 Sep 2026, 12:40' },
  { id: 'pay_P89xPrF6', orderId: 'order_Nx886F', user: 'Devendra K', phone: '+91 98765 43210', plan: 'Monthly Pass', amount: '₹199', method: 'Netbanking (ICICI)', status: 'SUCCESS', date: '16 Sep 2026, 11:15' },
];

export const mockAuditLogs = [
  { id: 'AUD-901', action: 'UPLOAD_SERIES', entity: 'Drama', targetId: 'DRM-105 (The Secret Billionaire Heir)', admin: 'Greg B. (Admin)', time: '14:20:12', duration: '320ms', status: 'SUCCESS', diff: { before: null, after: { title: 'The Secret Billionaire Heir', totalEpisodes: 30, status: 'PUBLISHED' } } },
  { id: 'AUD-902', action: 'UPDATE_PRICING', entity: 'Subscription', targetId: 'PLAN-YEARLY', admin: 'Priya K. (Billing)', time: '13:05:44', duration: '110ms', status: 'SUCCESS', diff: { before: { price: 1299 }, after: { price: 1499 } } },
  { id: 'AUD-903', action: 'OVERRIDE_VIP', entity: 'User', targetId: 'USR-8910 (Aarav Sharma)', admin: 'Greg B. (Admin)', time: '12:30:10', duration: '190ms', status: 'SUCCESS', diff: { before: { isVip: false }, after: { isVip: true, daysGranted: 30 } } },
  { id: 'AUD-904', action: 'BROADCAST_NOTIFICATION', entity: 'PushNotification', targetId: 'FCM-4921 ("Episode 24 Dropped")', admin: 'Aman S. (Marketing)', time: '11:15:00', duration: '890ms', status: 'SUCCESS', diff: { before: null, after: { sentTo: '148,920 users', status: 'DELIVERED' } } },
  { id: 'AUD-905', action: 'ENCODING_FAILURE_RETRY', entity: 'Transcoder', targetId: 'DRM-104 (The Last Promise - Ep 17)', admin: 'System Transcoder', time: '10:05:22', duration: '4100ms', status: 'FAILED', diff: { error: 'Transcoding timeout at frame 4200 (1080p ladder)' } },
];

export const mockNotifications = [
  { id: 'NOTIF-1', title: '🔥 Episode 24 Finale Dropped!', message: 'Security Guard Ki CEO GF finale is now streaming! Watch the shocking reveal.', target: 'All Users', sentAt: 'Today, 11:15 AM', sentCount: '148.9k', openRate: '34.2%' },
  { id: 'NOTIF-2', title: '⭐ Exclusive Release: Secret Billionaire', message: 'Subscribers get 48 hours early access to Kabir\'s story. Stream Episode 1-10 now!', target: 'Subscribers Only', sentAt: 'Yesterday, 6:00 PM', sentCount: '12.4k', openRate: '68.5%' },
  { id: 'NOTIF-3', title: '👀 We miss you! Complete Dhokha Episode 5', message: 'Continue where you left off. The mystery deepens tonight.', target: 'Inactive 7+ Days', sentAt: '14 Sep 2026', sentCount: '24.1k', openRate: '19.8%' },
];

export const mockAdmobOverview = {
  monthlyRevenue: '₹4,85,200',
  monthlyRevenueNum: 485200,
  growthRate: '+22.4%',
  todayRevenue: '₹18,450',
  impressions: '2,840,000',
  impressionsNum: 2840000,
  ecpm: '₹170.80',
  matchRate: '98.6%',
  fillRate: '99.2%',
  adFormatBreakdown: [
    {
      format: 'Rewarded Video Ads',
      placement: 'Episode Paywall Unlock (Ep 3+)',
      share: '62.4%',
      revenue: '₹3,02,800',
      impressions: '1.42M',
      ecpm: '₹213.20',
      color: '#FEF08A',
      progressBg: 'bg-[#FEF08A]'
    },
    {
      format: 'Interstitial Ads',
      placement: 'Episode End & App Navigation',
      share: '24.8%',
      revenue: '₹1,20,300',
      impressions: '890k',
      ecpm: '₹135.10',
      color: '#FBBF24',
      progressBg: 'bg-amber-400'
    },
    {
      format: 'Native Feed & Banner Ads',
      placement: 'Home & Search Feed',
      share: '12.8%',
      revenue: '₹62,100',
      impressions: '530k',
      ecpm: '₹117.10',
      color: '#10B981',
      progressBg: 'bg-emerald-500'
    }
  ],
  monthlyTrend: [
    { month: 'Oct 2025', revenue: 210000, ecpm: 142.50, impressions: '1.4M' },
    { month: 'Nov 2025', revenue: 275000, ecpm: 151.00, impressions: '1.8M' },
    { month: 'Dec 2025', revenue: 340000, ecpm: 158.20, impressions: '2.1M' },
    { month: 'Jan 2026', revenue: 395000, ecpm: 164.00, impressions: '2.4M' },
    { month: 'Feb 2026', revenue: 420000, ecpm: 168.50, impressions: '2.6M' },
    { month: 'Mar 2026', revenue: 485200, ecpm: 170.80, impressions: '2.84M' }
  ],
  adUnits: [
    {
      id: 'ca-app-pub-99201928471/ep_unlock_rewarded',
      name: 'Episode Paywall Unlock Rewarded',
      type: 'Rewarded Video',
      floorEcpm: '₹180.00',
      ecpm: '₹213.20',
      impressions: '1,420,000',
      monthlyRevenue: '₹3,02,800',
      status: 'ACTIVE'
    },
    {
      id: 'ca-app-pub-99201928471/nav_interstitial',
      name: 'Navigation Transition Interstitial',
      type: 'Interstitial',
      floorEcpm: '₹110.00',
      ecpm: '₹135.10',
      impressions: '890,000',
      monthlyRevenue: '₹1,20,300',
      status: 'ACTIVE'
    },
    {
      id: 'ca-app-pub-99201928471/feed_native_card',
      name: 'Feed Carousel Native Ad Unit',
      type: 'Native Advanced',
      floorEcpm: '₹90.00',
      ecpm: '₹117.10',
      impressions: '530,000',
      monthlyRevenue: '₹62,100',
      status: 'ACTIVE'
    },
    {
      id: 'ca-app-pub-99201928471/splash_app_open',
      name: 'App Launch Splash Ad Unit',
      type: 'App Open',
      floorEcpm: '₹150.00',
      ecpm: '₹195.40',
      impressions: '180,000',
      monthlyRevenue: '₹35,170',
      status: 'PAUSED'
    }
  ]
};

