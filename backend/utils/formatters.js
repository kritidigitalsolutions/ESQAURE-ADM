/**
 * Common data and text formatting helpers for E² Stories OTT
 */

/**
 * Resolve media URL dynamically:
 * 1. Prepend active request protocol & host to /uploads/ if Express req is present
 * 2. Return relative path /uploads/... if req is null
 * 3. Keep CDN / External URLs as-is
 */
export const resolveMediaUrl = (url, req = null) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const request = req && typeof req === 'object' && req.get ? req : null;

  // If URL contains /uploads/ anywhere
  if (trimmed.includes('/uploads/')) {
    const uploadPath = trimmed.substring(trimmed.indexOf('/uploads/'));
    if (request) {
      const protocol = request.headers['x-forwarded-proto'] || request.protocol || 'http';
      const host = request.get('host');
      return `${protocol}://${host}${uploadPath}`;
    }
    return uploadPath;
  }

  // If URL is relative without leading slash
  if (trimmed.startsWith('uploads/')) {
    const uploadPath = `/${trimmed}`;
    if (request) {
      const protocol = request.headers['x-forwarded-proto'] || request.protocol || 'http';
      const host = request.get('host');
      return `${protocol}://${host}${uploadPath}`;
    }
    return uploadPath;
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
