/**
 * Common data and text formatting helpers for E² Stories OTT
 */

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
 * Format a Drama document into a standard OTT card
 * @param {object} drama
 */
export const formatDramaCard = (drama) => {
  if (!drama) return null;

  const genreNames = Array.isArray(drama.genres)
    ? drama.genres.map((g) => (typeof g === 'object' && g.name ? g.name : String(g)))
    : [];

  return {
    id: drama._id ? drama._id.toString() : drama.id,
    title: drama.title,
    slug: drama.slug,
    synopsis: drama.synopsis || '',
    posterUrl: drama.posterUrl,
    bannerUrl: drama.bannerUrl || '',
    trailerUrl: drama.trailerUrl || '',
    genres: genreNames,
    genreDisplay: genreNames.join(' / ') || 'Drama',
    totalEpisodes: drama.totalEpisodes || 0,
    viewsCount: drama.viewsCount || 0,
    viewsFormatted: formatViewsCount(drama.viewsCount || 0),
    rating: drama.rating !== undefined ? drama.rating : 4.8,
    priority: drama.priority !== undefined ? drama.priority : 0,
    isTrending: !!drama.isTrending,
    trendingRank: drama.trendingRank || null,
    releaseDate: drama.releaseDate || drama.createdAt || null
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

