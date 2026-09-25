import mongoose from 'mongoose';
import { Drama } from '../models/Drama.js';
import { Genre } from '../models/Genre.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { formatViewsCount, padRank } from '../utils/formatters.js';

/**
 * Format drama document for OTT cards and trays
 */
const formatDramaCard = (drama) => {
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
    rating: drama.rating || 4.8,
    isTrending: !!drama.isTrending,
    isNewRelease: !!drama.isNewRelease
  };
};

/**
 * Helper to get ranked popular searches list
 */
const fetchPopularSearches = async (limit = 10) => {
  const popularDramas = await Drama.find({ status: 'PUBLISHED' })
    .populate('genres', 'name slug')
    .sort({ isTrending: -1, trendingRank: 1, viewsCount: -1, createdAt: -1 })
    .limit(limit);

  return popularDramas.map((drama, idx) => {
    const card = formatDramaCard(drama);
    return {
      rank: padRank(idx + 1), // "01", "02", "03"...
      displayRank: idx + 1,
      id: card.id,
      title: card.title,
      slug: card.slug,
      posterUrl: card.posterUrl,
      viewsCount: card.viewsCount,
      viewsFormatted: card.viewsFormatted,
      rating: card.rating,
      totalEpisodes: card.totalEpisodes,
      genres: card.genres,
      genreDisplay: card.genreDisplay
    };
  });
};

/**
 * Helper to get recommended dramas personalized by user profile genres (interests)
 */
const fetchRecommendedDramas = async (user, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  let userGenreIds = [];
  let userGenreDetails = [];

  // Check if user has selected genres in their profile interests
  if (user && Array.isArray(user.interests) && user.interests.length > 0) {
    userGenreIds = user.interests
      .map((g) => (g && g._id ? g._id : g))
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (userGenreIds.length > 0) {
      userGenreDetails = await Genre.find({ _id: { $in: userGenreIds }, isActive: true })
        .select('name slug')
        .lean();
    }
  }

  let recommendedDramas = [];
  let totalCount = 0;
  let isPersonalized = false;

  if (userGenreIds.length > 0) {
    isPersonalized = true;

    // Filter published dramas by user's chosen genres
    const genreFilter = {
      status: 'PUBLISHED',
      genres: { $in: userGenreIds }
    };

    totalCount = await Drama.countDocuments(genreFilter);

    recommendedDramas = await Drama.find(genreFilter)
      .populate('genres', 'name slug')
      .sort({ viewsCount: -1, rating: -1, isTrending: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // If first page has fewer results than requested limit, backfill with top published dramas
    if (recommendedDramas.length < limit && page === 1) {
      const existingIds = recommendedDramas.map((d) => d._id);
      const remainingLimit = limit - recommendedDramas.length;

      const backfillDramas = await Drama.find({
        status: 'PUBLISHED',
        _id: { $nin: existingIds }
      })
        .populate('genres', 'name slug')
        .sort({ isTrending: -1, trendingRank: 1, viewsCount: -1, rating: -1 })
        .limit(remainingLimit);

      recommendedDramas = [...recommendedDramas, ...backfillDramas];
    }
  } else {
    // Fallback for unauthenticated users or users with empty genre preferences
    isPersonalized = false;
    const query = { status: 'PUBLISHED' };
    totalCount = await Drama.countDocuments(query);

    recommendedDramas = await Drama.find(query)
      .populate('genres', 'name slug')
      .sort({ isTrending: -1, trendingRank: 1, viewsCount: -1, rating: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  const formatted = recommendedDramas.map(formatDramaCard);
  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    dramas: formatted,
    isPersonalized,
    userGenres: userGenreDetails.map((g) => ({
      id: g._id.toString(),
      name: g.name,
      slug: g.slug
    })),
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

export class SearchController {
  /**
   * Unified Search API:
   * GET /api/v1/search?q=...&genre=...&page=1&limit=10
   * - If 'q' is empty/absent: returns search landing screen (Popular Searches + Recommended For You)
   * - If 'q' is present: executes multi-field search across titles, synopsis, tags, and genres
   */
  static async search(req, res, next) {
    try {
      const queryText = (req.query.q || req.query.query || '').trim();

      // If no query string, return landing screen data
      if (!queryText) {
        return SearchController.getSearchLanding(req, res, next);
      }

      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.max(1, Number(req.query.limit || 10));
      const skip = (page - 1) * limit;

      const { genre, language, sortBy = 'relevance' } = req.query;

      // 1. Find any matching genres by name or slug
      const matchedGenres = await Genre.find({
        isActive: true,
        $or: [
          { name: { $regex: queryText, $options: 'i' } },
          { slug: { $regex: queryText, $options: 'i' } }
        ]
      }).select('name slug icon');

      const matchedGenreIds = matchedGenres.map((g) => g._id);

      // 2. Build multi-field search condition
      const searchConditions = [
        { title: { $regex: queryText, $options: 'i' } },
        { synopsis: { $regex: queryText, $options: 'i' } },
        { tags: { $regex: queryText, $options: 'i' } }
      ];

      if (matchedGenreIds.length > 0) {
        searchConditions.push({ genres: { $in: matchedGenreIds } });
      }

      const filter = {
        status: 'PUBLISHED',
        $or: searchConditions
      };

      // 3. Apply optional genre filter
      if (genre) {
        const trimmedGenre = genre.trim();
        if (mongoose.Types.ObjectId.isValid(trimmedGenre) && trimmedGenre.length === 24) {
          filter.genres = trimmedGenre;
        } else {
          const genreDoc = await Genre.findOne({ slug: trimmedGenre.toLowerCase() });
          if (genreDoc) {
            filter.genres = genreDoc._id;
          }
        }
      }

      // 4. Apply optional language filter
      if (language) {
        filter.languages = { $in: [language.trim()] };
      }

      // 5. Determine sort order
      let sort = { isTrending: -1, viewsCount: -1, rating: -1, createdAt: -1 };
      if (sortBy === 'popular') {
        sort = { viewsCount: -1, rating: -1 };
      } else if (sortBy === 'latest') {
        sort = { createdAt: -1, releaseDate: -1 };
      } else if (sortBy === 'rating') {
        sort = { rating: -1, viewsCount: -1 };
      }

      const total = await Drama.countDocuments(filter);
      const totalPages = Math.ceil(total / limit) || 1;

      const dramas = await Drama.find(filter)
        .populate('genres', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const formattedResults = dramas.map(formatDramaCard);

      return ApiResponse.success(res, `Search results for "${queryText}"`, {
        query: queryText,
        results: formattedResults,
        matchedGenres: matchedGenres.map((g) => ({
          id: g._id.toString(),
          name: g.name,
          slug: g.slug
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Search Landing Screen:
   * GET /api/v1/search/landing
   * Delivers Popular Searches (01, 02, 03...) and Recommended for You based on user's profile genres.
   * Strictly NO recent search data per design requirement.
   */
  static async getSearchLanding(req, res, next) {
    try {
      const user = req.user;
      const popularLimit = Math.max(1, Math.min(20, Number(req.query.popularLimit || 10)));
      const recommendedLimit = Math.max(1, Math.min(20, Number(req.query.recommendedLimit || 10)));

      // Fetch popular searches and genre-recommended dramas concurrently
      const [popularSearches, recommendedData] = await Promise.all([
        fetchPopularSearches(popularLimit),
        fetchRecommendedDramas(user, 1, recommendedLimit)
      ]);

      return ApiResponse.success(res, 'Search screen discovery data retrieved successfully', {
        title: 'Search',
        subtitle: 'Find a story that matches your mood',
        popularSearches,
        recommendedForYou: recommendedData.dramas,
        isPersonalized: recommendedData.isPersonalized,
        userGenres: recommendedData.userGenres
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Popular Searches:
   * GET /api/v1/search/popular?limit=10
   * Ranked 01..N list of top searched & trending dramas
   */
  static async getPopularSearches(req, res, next) {
    try {
      const limit = Math.max(1, Math.min(30, Number(req.query.limit || 10)));
      const popularSearches = await fetchPopularSearches(limit);

      return ApiResponse.success(res, 'Popular searches fetched successfully', {
        popularSearches
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Recommended For You (Personalized as per genre selected in profile build):
   * GET /api/v1/search/recommended?page=1&limit=10
   */
  static async getRecommended(req, res, next) {
    try {
      const user = req.user;
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.max(1, Math.min(50, Number(req.query.limit || 10)));

      const recommendedData = await fetchRecommendedDramas(user, page, limit);

      return ApiResponse.success(
        res,
        recommendedData.isPersonalized
          ? 'Recommended dramas fetched based on your profile genre preferences'
          : 'Trending recommended dramas fetched successfully',
        {
          recommendedForYou: recommendedData.dramas,
          isPersonalized: recommendedData.isPersonalized,
          userGenres: recommendedData.userGenres,
          pagination: recommendedData.pagination
        }
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Fast live autocomplete / search suggestions:
   * GET /api/v1/search/suggestions?q=...&limit=8
   */
  static async getSuggestions(req, res, next) {
    try {
      const queryText = (req.query.q || '').trim();
      const limit = Math.max(1, Math.min(20, Number(req.query.limit || 8)));

      if (!queryText) {
        return ApiResponse.success(res, 'No query provided', { suggestions: [] });
      }

      // Fast drama match by title (limit 5)
      const matchingDramas = await Drama.find({
        status: 'PUBLISHED',
        title: { $regex: queryText, $options: 'i' }
      })
        .select('title slug posterUrl rating viewsCount')
        .limit(Math.min(limit, 5))
        .lean();

      // Fast genre match by name or slug (limit 3)
      const matchingGenres = await Genre.find({
        isActive: true,
        $or: [
          { name: { $regex: queryText, $options: 'i' } },
          { slug: { $regex: queryText, $options: 'i' } }
        ]
      })
        .select('name slug icon')
        .limit(3)
        .lean();

      const suggestions = [
        ...matchingDramas.map((d) => ({
          type: 'drama',
          id: d._id.toString(),
          title: d.title,
          slug: d.slug,
          posterUrl: d.posterUrl,
          rating: d.rating,
          viewsFormatted: formatViewsCount(d.viewsCount || 0)
        })),
        ...matchingGenres.map((g) => ({
          type: 'genre',
          id: g._id.toString(),
          title: g.name,
          slug: g.slug,
          icon: g.icon
        }))
      ];

      return ApiResponse.success(res, 'Suggestions fetched successfully', {
        query: queryText,
        suggestions,
        dramas: matchingDramas.map((d) => ({
          id: d._id.toString(),
          title: d.title,
          slug: d.slug,
          posterUrl: d.posterUrl
        })),
        genres: matchingGenres.map((g) => ({
          id: g._id.toString(),
          name: g.name,
          slug: g.slug
        }))
      });
    } catch (error) {
      return next(error);
    }
  }
}
