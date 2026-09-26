import os from 'os';

/**
 * Common data and text formatting helpers for E² Stories OTT
 */

let cachedLocalIp = null;

/**
 * Automatically get machine's active LAN IPv4 address (e.g. 192.168.1.25)
 * so mobile devices / physical phones on the network can access uploaded images/videos.
 */
export const getLocalNetworkIp = () => {
  if (cachedLocalIp) return cachedLocalIp;
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          cachedLocalIp = iface.address;
          return cachedLocalIp;
        }
      }
    }
  } catch (e) {
    // fallback
  }
  return 'localhost';
};

/**
 * Resolve media URL dynamically to handle:
 * 1. Mobile devices calling from physical phones or emulators (replacing localhost:5001 with active server host)
 * 2. Relative upload paths like /uploads/images/...
 * 3. CDN / External URLs (kept as-is)
 */
export const resolveMediaUrl = (url, req = null) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const request = req && typeof req === 'object' && req.get ? req : null;
  const protocol = request ? (request.headers['x-forwarded-proto'] || request.protocol || 'http') : 'http';
  const host = request ? request.get('host') : `${getLocalNetworkIp()}:5001`;
  const currentBase = `${protocol}://${host}`;

  // If URL contains localhost:5001 or 127.0.0.1:5001, dynamically rewrite to current reachable base
  if (trimmed.includes('localhost:5001') || trimmed.includes('127.0.0.1:5001')) {
    return trimmed.replace(/https?:\/\/(localhost|127\.0\.0\.1):5001/, currentBase);
  }

  // If URL is a relative path starting with /uploads or uploads
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${currentBase}${cleanPath}`;
  }

  return trimmed;
};

/**
 * Format raw view count number into compact OTT display format (e.g. "3.5k", "1.2M", "950")
 * Matches mobile app UI badge style (e.g., "▶ 3.5k")
 * @param {number} num 
 * @returns {string}
 */
export const formatViewsCount = (num) => {
  if (num === null || num === undefined || isNaN(num) || num < 0) {
    return '0';
  }

  const count = Number(num);

  if (count >= 1000000) {
    const formatted = (count / 1000000).toFixed(1);
    return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M`;
  }

  if (count >= 1000) {
    const formatted = (count / 1000).toFixed(1);
    return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}k`;
  }

  return String(count);
};

export const formatDuration = (seconds = 0) => {
  const sec = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remainingSecs = sec % 60;

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  }
  return `${mins}:${String(remainingSecs).padStart(2, '0')}`;
};

/**
 * Standard pagination metadata calculator
 * @param {number} page
 * @param {number} limit
 * @param {number} total
 */
export const getPaginationMeta = (page, limit, total) => {
  const currentPage = Math.max(1, Number(page || 1));
  const pageLimit = Math.max(1, Number(limit || 10));
  const totalCount = Math.max(0, Number(total || 0));
  const totalPages = Math.ceil(totalCount / pageLimit) || 1;

  return {
    page: currentPage,
    limit: pageLimit,
    total: totalCount,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};

/**
 * Format a Drama document into a comprehensive, backwards-and-forwards compatible OTT card.
 * Provides all standard field aliases (_id and id, poster and posterUrl, etc.)
 * so any mobile frontend (Flutter, React Native, iOS, Android) binds seamlessly.
 *
 * @param {object} drama
 * @param {object} req - Optional Express request object for dynamic IP/host resolution
 */
export const formatDramaCard = (drama, req = null) => {
  if (!drama) return null;

  const request = req && typeof req === 'object' && req.get ? req : null;
  const idStr = drama._id ? drama._id.toString() : (drama.id ? drama.id.toString() : '');

  const genreNames = Array.isArray(drama.genres)
    ? drama.genres
        .map((g) => (typeof g === 'object' && g && g.name ? g.name : String(g || '')))
        .filter(Boolean)
    : [];

  const genreObjects = Array.isArray(drama.genres)
    ? drama.genres
        .map((g) => {
          if (typeof g === 'object' && g) {
            return {
              id: g._id ? g._id.toString() : g.id,
              name: g.name || '',
              slug: g.slug || ''
            };
          }
          return { id: String(g), name: String(g), slug: String(g).toLowerCase() };
        })
        .filter((g) => g.name)
    : [];

  const poster = resolveMediaUrl(drama.posterUrl || drama.poster, request);
  const banner = resolveMediaUrl(drama.bannerUrl || drama.banner, request);
  const trailer = resolveMediaUrl(drama.trailerUrl || drama.trailer, request);

  const viewsNum = Number(drama.viewsCount) || 0;
  const viewsDisplay = formatViewsCount(viewsNum);
  const totalEps = Number(drama.totalEpisodes) || 0;
  const freeEps = Number(drama.freeEpisodes !== undefined ? drama.freeEpisodes : 3);
  const titleStr = drama.title || '';
  const synopsisStr = drama.synopsis || '';
  const isPaid = drama.isPaid !== undefined ? Boolean(drama.isPaid) : true;
  const statusStr = drama.status || 'PUBLISHED';
  const isActive = statusStr === 'PUBLISHED';

  return {
    id: idStr,
    _id: idStr,

    // Title & Text aliases
    title: titleStr,
    name: titleStr,
    slug: drama.slug || '',
    synopsis: synopsisStr,
    description: synopsisStr,
    overview: synopsisStr,

    // Artwork & Media aliases
    posterUrl: poster,
    poster: poster,
    thumbnailUrl: poster,
    thumbnail: poster,
    coverImage: poster,
    image: poster,

    bannerUrl: banner,
    banner: banner,
    cover: banner,

    trailerUrl: trailer,
    trailer: trailer,
    videoUrl: trailer,

    // Genres
    genres: genreNames,
    genreList: genreObjects,
    genre: genreNames[0] || 'Drama',
    genreDisplay: genreNames.join(' / ') || 'Drama',

    // Episodes & Paywall
    totalEpisodes: totalEps,
    episodesCount: totalEps,
    episodes_count: totalEps,
    freeEpisodes: freeEps,
    isPaid,
    plan: drama.plan || (isPaid ? 'Premium Plan' : 'Free Tier'),

    // Stats & Ratings
    viewsCount: viewsNum,
    viewsFormatted: viewsDisplay,
    views: viewsDisplay,
    rating: drama.rating !== undefined ? Number(drama.rating) : 4.8,
    priority: drama.priority !== undefined ? Number(drama.priority) : 1,

    // Curation Flags
    isTrending: Boolean(drama.isTrending),
    trendingRank: drama.trendingRank || null,
    isFeatured: Boolean(drama.isFeatured),
    isNewRelease: Boolean(drama.isNewRelease),
    status: statusStr,
    isActive,

    // Timestamps
    releaseDate: drama.releaseDate || drama.createdAt || new Date().toISOString(),
    createdAt: drama.createdAt || new Date().toISOString()
  };
};

/**
 * Pad a numeric rank to a 2-digit string (e.g., 1 -> "01", 2 -> "02")
 * Matches "Popular Searches" UI badge style
 * @param {number} index 
 * @returns {string}
 */
export const padRank = (index) => {
  const num = Math.max(1, parseInt(index, 10) || 1);
  return String(num).padStart(2, '0');
};
