import mongoose from 'mongoose';
import { Drama } from '../models/Drama.js';
import { Genre } from '../models/Genre.js';
import { WatchHistory } from '../models/WatchHistory.js';
import { HomeSection } from '../models/HomeSection.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { formatDramaCard, formatDuration, getPaginationMeta } from '../utils/formatters.js';

/**
 * Helper to slugify string
 */
const slugify = (text = '') =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export class HomeController {
  // ───────────────────────────────────────────────────────────────────────────
  //  1. ALL CONTENT AS PER PRIORITY SET BY ADMIN
  //  GET /api/v1/home/content?page=1&limit=10&genre=&sortOrder=asc
  // ───────────────────────────────────────────────────────────────────────────
  static async getContentByPriority(req, res, next) {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.max(1, Number(req.query.limit || 10));
      const skip = (page - 1) * limit;
      const { genre, sortOrder = 'asc' } = req.query;

      const query = { status: 'PUBLISHED' };

      // Optional genre filter (ObjectId or slug)
      if (genre) {
        if (mongoose.Types.ObjectId.isValid(genre) && genre.length === 24) {
          query.genres = genre;
        } else {
          const genreDoc = await Genre.findOne({ slug: genre.toLowerCase().trim() });
          if (genreDoc) {
            query.genres = genreDoc._id;
          }
        }
      }

      const total = await Drama.countDocuments(query);
      const pagination = getPaginationMeta(page, limit, total);

      // Sort order by admin priority:
      // 'asc' -> 1, 2, 3... (lower number = highest priority), then views & recency
      // 'desc' -> highest number first
      const sortDirection = sortOrder === 'desc' ? -1 : 1;
      const sortCriteria = {
        priority: sortDirection,
        viewsCount: -1,
        createdAt: -1
      };

      const dramas = await Drama.find(query)
        .populate('genres', 'name slug icon')
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit);

      const formattedDramas = dramas.map(formatDramaCard);

      return ApiResponse.success(res, 'Content fetched as per admin priority successfully', {
        dramas: formattedDramas,
        pagination
      });
    } catch (error) {
      return next(error);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  2. CONTINUE WATCHING (Authenticated User, graceful for guests)
  //  GET /api/v1/home/continue-watching?page=1&limit=10
  // ───────────────────────────────────────────────────────────────────────────
  static async getContinueWatching(req, res, next) {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.max(1, Number(req.query.limit || 10));
      const skip = (page - 1) * limit;
      const user = req.user;

      // If user is guest/unauthenticated, return empty list with standard pagination
      if (!user) {
        return ApiResponse.success(res, 'Continue watching list fetched successfully', {
          items: [],
          pagination: getPaginationMeta(page, limit, 0)
        });
      }

      // Filter: Unfinished watch progress for user
      const query = {
        userId: user._id,
        isCompleted: false,
        progressPercentage: { $lt: 95 }
      };

      const total = await WatchHistory.countDocuments(query);
      const pagination = getPaginationMeta(page, limit, total);

      const historyRecords = await WatchHistory.find(query)
        .populate({
          path: 'dramaId',
          select: 'title slug posterUrl bannerUrl rating totalEpisodes genres status',
          populate: { path: 'genres', select: 'name slug' }
        })
        .populate('episodeId', 'seasonNumber episodeNumber title durationSeconds streamUrl')
        .sort({ lastWatchedAt: -1 })
        .skip(skip)
        .limit(limit);

      // Filter records where drama/episode might have been deleted/unpublished
      const items = historyRecords
        .filter((rec) => rec.dramaId && rec.dramaId.status !== 'ARCHIVED' && rec.episodeId)
        .map((rec) => {
          const drama = rec.dramaId;
          const episode = rec.episodeId;
          const genreNames = Array.isArray(drama.genres)
            ? drama.genres.map((g) => (typeof g === 'object' && g.name ? g.name : String(g)))
            : [];

          const durationSeconds = rec.durationSeconds || episode.durationSeconds || 135;
          const watchedSeconds = rec.watchedSeconds || 0;
          const remainingSeconds = Math.max(0, durationSeconds - watchedSeconds);

          return {
            historyId: rec._id.toString(),
            drama: {
              id: drama._id.toString(),
              title: drama.title,
              slug: drama.slug,
              posterUrl: drama.posterUrl,
              bannerUrl: drama.bannerUrl || '',
              rating: drama.rating || 4.8,
              totalEpisodes: drama.totalEpisodes || 0,
              genres: genreNames,
              genreDisplay: genreNames.join(' / ') || 'Drama'
            },
            episode: {
              id: episode._id.toString(),
              episodeNumber: rec.episodeNumber || episode.episodeNumber,
              seasonNumber: rec.seasonNumber || episode.seasonNumber || 1,
              seasonEpisodeTag: `S${rec.seasonNumber || 1}:E${String(rec.episodeNumber || episode.episodeNumber).padStart(2, '0')}`,
              title: episode.title || `Episode ${rec.episodeNumber}`,
              durationSeconds,
              formattedDuration: formatDuration(durationSeconds)
            },
            playback: {
              watchedSeconds,
              formattedWatched: formatDuration(watchedSeconds),
              durationSeconds,
              formattedDuration: formatDuration(durationSeconds),
              remainingSeconds,
              formattedRemaining: formatDuration(remainingSeconds),
              progressPercentage: rec.progressPercentage || 0,
              isCompleted: !!rec.isCompleted,
              lastWatchedAt: rec.lastWatchedAt || rec.updatedAt
            }
          };
        });

      return ApiResponse.success(res, 'Continue watching list fetched successfully', {
        items,
        pagination
      });
    } catch (error) {
      return next(error);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  3. ALL CATEGORIES AS PER PRIORITY SET BY ADMIN
  //  GET /api/v1/home/categories?page=1&limit=10&includeDramas=false&dramasLimit=6
  // ───────────────────────────────────────────────────────────────────────────
  static async getCategories(req, res, next) {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.max(1, Number(req.query.limit || 10));
      const skip = (page - 1) * limit;
      const includeDramas = req.query.includeDramas === 'true' || req.query.includeDramas === true;
      const dramasLimit = Math.max(1, Math.min(20, Number(req.query.dramasLimit || 6)));

      const query = { isActive: true };

      const total = await Genre.countDocuments(query);
      const pagination = getPaginationMeta(page, limit, total);

      // Sorted by admin displayOrder (priority) ascending, then name
      const genres = await Genre.find(query)
        .sort({ displayOrder: 1, name: 1 })
        .skip(skip)
        .limit(limit);

      // Attach drama count and preview dramas if requested
      const categories = await Promise.all(
        genres.map(async (genre) => {
          const dramaCount = await Drama.countDocuments({
            status: 'PUBLISHED',
            genres: genre._id
          });

          let dramas = [];
          if (includeDramas) {
            const previewDramas = await Drama.find({
              status: 'PUBLISHED',
              genres: genre._id
            })
              .populate('genres', 'name slug')
              .sort({ priority: 1, viewsCount: -1, createdAt: -1 })
              .limit(dramasLimit);

            dramas = previewDramas.map(formatDramaCard);
          }

          return {
            id: genre._id.toString(),
            name: genre.name,
            slug: genre.slug,
            icon: genre.icon || '',
            iconUrl: genre.iconUrl || '',
            imageUrl: genre.imageUrl || '',
            displayOrder: genre.displayOrder || 0,
            dramasCount: dramaCount,
            ...(includeDramas && { dramas })
          };
        })
      );

      return ApiResponse.success(res, 'All categories fetched as per admin priority', {
        categories,
        pagination
      });
    } catch (error) {
      return next(error);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  4. RECOMMENDED CATEGORIES AS GENRES (Personalized & Trending)
  //  GET /api/v1/home/recommended-categories?page=1&limit=10&includeDramas=true&dramasLimit=6
  // ───────────────────────────────────────────────────────────────────────────
  static async getRecommendedCategories(req, res, next) {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.max(1, Number(req.query.limit || 10));
      const skip = (page - 1) * limit;
      const includeDramas = req.query.includeDramas !== 'false';
      const dramasLimit = Math.max(1, Math.min(20, Number(req.query.dramasLimit || 6)));
      const user = req.user;

      let userInterestIds = [];
      if (user && Array.isArray(user.interests) && user.interests.length > 0) {
        userInterestIds = user.interests
          .map((g) => (g && g._id ? g._id.toString() : String(g)))
          .filter((id) => mongoose.Types.ObjectId.isValid(id));
      }

      // Fetch all active genres
      const allActiveGenres = await Genre.find({ isActive: true }).lean();

      // Aggregate drama counts & total views per genre to compute popularity
      const genreStats = await Drama.aggregate([
        { $match: { status: 'PUBLISHED' } },
        { $unwind: '$genres' },
        {
          $group: {
            _id: '$genres',
            totalViews: { $sum: '$viewsCount' },
            dramaCount: { $sum: 1 }
          }
        }
      ]);

      const statsMap = new Map();
      genreStats.forEach((s) => {
        statsMap.set(s._id.toString(), {
          totalViews: s.totalViews,
          dramaCount: s.dramaCount
        });
      });

      // Rank genres: User interests first, then sorted by admin priority and popularity
      const rankedGenres = allActiveGenres
        .map((genre) => {
          const gId = genre._id.toString();
          const isUserInterest = userInterestIds.includes(gId);
          const stat = statsMap.get(gId) || { totalViews: 0, dramaCount: 0 };
          return {
            ...genre,
            isUserInterest,
            dramasCount: stat.dramaCount,
            totalViews: stat.totalViews
          };
        })
        .sort((a, b) => {
          // 1. User profile interests first
          if (a.isUserInterest && !b.isUserInterest) return -1;
          if (!a.isUserInterest && b.isUserInterest) return 1;
          // 2. Admin displayOrder (priority)
          if ((a.displayOrder || 0) !== (b.displayOrder || 0)) {
            return (a.displayOrder || 0) - (b.displayOrder || 0);
          }
          // 3. Popularity by total views
          return (b.totalViews || 0) - (a.totalViews || 0);
        });

      const total = rankedGenres.length;
      const pagination = getPaginationMeta(page, limit, total);
      const pageSlice = rankedGenres.slice(skip, skip + limit);

      const categories = await Promise.all(
        pageSlice.map(async (genre) => {
          let dramas = [];
          if (includeDramas) {
            const previewDramas = await Drama.find({
              status: 'PUBLISHED',
              genres: genre._id
            })
              .populate('genres', 'name slug')
              .sort({ priority: 1, viewsCount: -1, createdAt: -1 })
              .limit(dramasLimit);

            dramas = previewDramas.map(formatDramaCard);
          }

          return {
            id: genre._id.toString(),
            name: genre.name,
            slug: genre.slug,
            icon: genre.icon || '',
            iconUrl: genre.iconUrl || '',
            imageUrl: genre.imageUrl || '',
            displayOrder: genre.displayOrder || 0,
            isUserInterest: !!genre.isUserInterest,
            dramasCount: genre.dramasCount || 0,
            ...(includeDramas && { dramas })
          };
        })
      );

      return ApiResponse.success(res, 'Recommended categories as genres fetched successfully', {
        categories,
        pagination,
        isPersonalized: userInterestIds.length > 0
      });
    } catch (error) {
      return next(error);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  5. NEW RELEASES SECTION
  //  GET /api/v1/home/new-releases?page=1&limit=10&genre=
  // ───────────────────────────────────────────────────────────────────────────
  static async getNewReleases(req, res, next) {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.max(1, Number(req.query.limit || 10));
      const skip = (page - 1) * limit;
      const { genre } = req.query;

      const query = { status: 'PUBLISHED' };

      // Optional genre filter
      if (genre) {
        if (mongoose.Types.ObjectId.isValid(genre) && genre.length === 24) {
          query.genres = genre;
        } else {
          const genreDoc = await Genre.findOne({ slug: genre.toLowerCase().trim() });
          if (genreDoc) {
            query.genres = genreDoc._id;
          }
        }
      }

      // Check if dramas are specifically flagged isNewRelease
      const flaggedCount = await Drama.countDocuments({ ...query, isNewRelease: true });
      if (flaggedCount > 0) {
        query.isNewRelease = true;
      }

      const total = await Drama.countDocuments(query);
      const pagination = getPaginationMeta(page, limit, total);

      const dramas = await Drama.find(query)
        .populate('genres', 'name slug icon')
        .sort({ releaseDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const formattedDramas = dramas.map(formatDramaCard);

      return ApiResponse.success(res, 'New releases section fetched successfully', {
        dramas: formattedDramas,
        pagination
      });
    } catch (error) {
      return next(error);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  6. DYNAMIC HOME CATEGORY SECTIONS (Mobile App Screen)
  //  GET /api/v1/home/sections?page=1&limit=10
  // ───────────────────────────────────────────────────────────────────────────
  static async getHomeSections(req, res, next) {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.max(1, Number(req.query.limit || 10));
      const skip = (page - 1) * limit;

      const query = { isActive: true };
      const total = await HomeSection.countDocuments(query);
      const pagination = getPaginationMeta(page, limit, total);

      // Sorted by admin displayOrder (priority) ascending
      const sections = await HomeSection.find(query)
        .populate('genreId', 'name slug icon iconUrl')
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Resolve content dramas for each section dynamically
      const populatedSections = await Promise.all(
        sections.map(async (section) => {
          let dramas = [];
          const maxItems = section.maxItems || 10;

          if (section.sectionType === 'GENRE' && section.genreId) {
            const rawDramas = await Drama.find({
              status: 'PUBLISHED',
              genres: section.genreId._id
            })
              .populate('genres', 'name slug')
              .sort({ priority: 1, viewsCount: -1, createdAt: -1 })
              .limit(maxItems);
            dramas = rawDramas.map(formatDramaCard);
          } else if (section.sectionType === 'CUSTOM_CURATED' && section.dramaIds?.length > 0) {
            const rawDramas = await Drama.find({
              _id: { $in: section.dramaIds },
              status: 'PUBLISHED'
            })
              .populate('genres', 'name slug')
              .limit(maxItems);
            dramas = rawDramas.map(formatDramaCard);
          } else if (section.sectionType === 'NEW_RELEASES') {
            const rawDramas = await Drama.find({
              status: 'PUBLISHED',
              isNewRelease: true
            })
              .populate('genres', 'name slug')
              .sort({ releaseDate: -1, createdAt: -1 })
              .limit(maxItems);
            dramas = rawDramas.map(formatDramaCard);
          } else if (section.sectionType === 'TRENDING') {
            const rawDramas = await Drama.find({
              status: 'PUBLISHED',
              isTrending: true
            })
              .populate('genres', 'name slug')
              .sort({ trendingRank: 1, viewsCount: -1 })
              .limit(maxItems);
            dramas = rawDramas.map(formatDramaCard);
          } else if (section.sectionType === 'PRIORITY_CONTENT') {
            const rawDramas = await Drama.find({ status: 'PUBLISHED' })
              .populate('genres', 'name slug')
              .sort({ priority: 1, viewsCount: -1, createdAt: -1 })
              .limit(maxItems);
            dramas = rawDramas.map(formatDramaCard);
          }

          return {
            id: section._id.toString(),
            title: section.title,
            slug: section.slug,
            subtitle: section.subtitle || '',
            sectionType: section.sectionType,
            genre: section.genreId
              ? {
                  id: section.genreId._id.toString(),
                  name: section.genreId.name,
                  slug: section.genreId.slug
                }
              : null,
            layout: section.layout,
            displayOrder: section.displayOrder,
            viewAllEnabled: section.viewAllEnabled,
            totalItems: dramas.length,
            dramas
          };
        })
      );

      return ApiResponse.success(res, 'Home category sections fetched successfully', {
        sections: populatedSections,
        pagination
      });
    } catch (error) {
      return next(error);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  7. VIEW ALL DRAMAS FOR A SINGLE HOME SECTION
  //  GET /api/v1/home/sections/:idOrSlug?page=1&limit=10
  // ───────────────────────────────────────────────────────────────────────────
  static async getSectionContent(req, res, next) {
    try {
      const { idOrSlug } = req.params;
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.max(1, Number(req.query.limit || 10));
      const skip = (page - 1) * limit;

      const sectionQuery =
        mongoose.Types.ObjectId.isValid(idOrSlug) && idOrSlug.length === 24
          ? { _id: idOrSlug }
          : { slug: idOrSlug.toLowerCase().trim() };

      const section = await HomeSection.findOne(sectionQuery).populate('genreId', 'name slug');
      if (!section) {
        throw new AppError('Home category section not found.', 404, 'SECTION_NOT_FOUND');
      }

      let dramaQuery = { status: 'PUBLISHED' };
      let dramaSort = { priority: 1, viewsCount: -1, createdAt: -1 };

      if (section.sectionType === 'GENRE' && section.genreId) {
        dramaQuery.genres = section.genreId._id;
      } else if (section.sectionType === 'CUSTOM_CURATED') {
        dramaQuery._id = { $in: section.dramaIds || [] };
      } else if (section.sectionType === 'NEW_RELEASES') {
        dramaQuery.isNewRelease = true;
        dramaSort = { releaseDate: -1, createdAt: -1 };
      } else if (section.sectionType === 'TRENDING') {
        dramaQuery.isTrending = true;
        dramaSort = { trendingRank: 1, viewsCount: -1 };
      }

      const total = await Drama.countDocuments(dramaQuery);
      const pagination = getPaginationMeta(page, limit, total);

      const dramas = await Drama.find(dramaQuery)
        .populate('genres', 'name slug')
        .sort(dramaSort)
        .skip(skip)
        .limit(limit);

      return ApiResponse.success(res, `Content for section "${section.title}" retrieved`, {
        section: {
          id: section._id.toString(),
          title: section.title,
          slug: section.slug,
          subtitle: section.subtitle,
          sectionType: section.sectionType,
          layout: section.layout
        },
        dramas: dramas.map(formatDramaCard),
        pagination
      });
    } catch (error) {
      return next(error);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  8. UNIFIED HOME SCREEN FEED (All trays combined for fast initial load)
  //  GET /api/v1/home/feed
  // ───────────────────────────────────────────────────────────────────────────
  static async getHomeFeed(req, res, next) {
    try {
      const user = req.user;

      // 1. Featured Hero Carousel (top featured or prioritized dramas)
      const heroDramas = await Drama.find({ status: 'PUBLISHED', isFeatured: true })
        .populate('genres', 'name slug')
        .sort({ priority: 1, viewsCount: -1 })
        .limit(5);

      // Fallback if none flagged isFeatured
      let heroCarousel = heroDramas.map(formatDramaCard);
      if (heroCarousel.length === 0) {
        const fallbackHero = await Drama.find({ status: 'PUBLISHED' })
          .populate('genres', 'name slug')
          .sort({ priority: 1, viewsCount: -1 })
          .limit(5);
        heroCarousel = fallbackHero.map(formatDramaCard);
      }

      // 2. Continue Watching (if authenticated)
      let continueWatching = [];
      if (user) {
        const history = await WatchHistory.find({
          userId: user._id,
          isCompleted: false,
          progressPercentage: { $lt: 95 }
        })
          .populate({
            path: 'dramaId',
            select: 'title slug posterUrl rating totalEpisodes genres status',
            populate: { path: 'genres', select: 'name slug' }
          })
          .populate('episodeId', 'seasonNumber episodeNumber title durationSeconds')
          .sort({ lastWatchedAt: -1 })
          .limit(10);

        continueWatching = history
          .filter((h) => h.dramaId && h.episodeId)
          .map((h) => ({
            id: h._id.toString(),
            dramaId: h.dramaId._id.toString(),
            title: h.dramaId.title,
            slug: h.dramaId.slug,
            posterUrl: h.dramaId.posterUrl,
            episodeNumber: h.episodeNumber,
            seasonEpisodeTag: `S${h.seasonNumber || 1}:E${String(h.episodeNumber).padStart(2, '0')}`,
            progressPercentage: h.progressPercentage,
            watchedSeconds: h.watchedSeconds,
            durationSeconds: h.durationSeconds,
            formattedDuration: formatDuration(h.durationSeconds)
          }));
      }

      // 3. Categories horizontal bar (as per admin priority)
      const topCategories = await Genre.find({ isActive: true })
        .sort({ displayOrder: 1, name: 1 })
        .limit(10)
        .select('name slug icon iconUrl imageUrl displayOrder');

      // 4. Admin Prioritized Content Tray
      const prioritizedDramas = await Drama.find({ status: 'PUBLISHED' })
        .populate('genres', 'name slug')
        .sort({ priority: 1, viewsCount: -1, createdAt: -1 })
        .limit(10);

      // 5. New Releases Tray
      const newReleases = await Drama.find({ status: 'PUBLISHED', isNewRelease: true })
        .populate('genres', 'name slug')
        .sort({ releaseDate: -1, createdAt: -1 })
        .limit(10);

      // 6. Configured Home Sections
      const homeSections = await HomeSection.find({ isActive: true })
        .populate('genreId', 'name slug')
        .sort({ displayOrder: 1 })
        .limit(8);

      const dynamicSections = await Promise.all(
        homeSections.map(async (sec) => {
          let items = [];
          if (sec.sectionType === 'GENRE' && sec.genreId) {
            const raw = await Drama.find({ status: 'PUBLISHED', genres: sec.genreId._id })
              .populate('genres', 'name slug')
              .sort({ priority: 1, viewsCount: -1 })
              .limit(sec.maxItems || 6);
            items = raw.map(formatDramaCard);
          } else if (sec.sectionType === 'CUSTOM_CURATED') {
            const raw = await Drama.find({ _id: { $in: sec.dramaIds }, status: 'PUBLISHED' })
              .populate('genres', 'name slug')
              .limit(sec.maxItems || 6);
            items = raw.map(formatDramaCard);
          }
          return {
            id: sec._id.toString(),
            title: sec.title,
            slug: sec.slug,
            subtitle: sec.subtitle,
            sectionType: sec.sectionType,
            layout: sec.layout,
            dramas: items
          };
        })
      );

      return ApiResponse.success(res, 'Home feed aggregated payload loaded successfully', {
        heroCarousel,
        continueWatching,
        categories: topCategories,
        prioritizedContent: prioritizedDramas.map(formatDramaCard),
        newReleases: newReleases.map(formatDramaCard),
        sections: dynamicSections
      });
    } catch (error) {
      return next(error);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  ADMIN APIS: HOME CATEGORY SECTIONS MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Admin: Add new category section on home page
   * POST /api/v1/home/admin/sections
   */
  static async createSection(req, res, next) {
    try {
      const {
        title,
        subtitle = '',
        slug,
        sectionType = 'GENRE',
        genreId = null,
        dramaIds = [],
        layout = 'HORIZONTAL_CARD',
        displayOrder = 0,
        maxItems = 10,
        viewAllEnabled = true,
        isActive = true
      } = req.body;

      const generatedSlug = slug ? slugify(slug) : slugify(title);

      // Check unique slug
      const existing = await HomeSection.findOne({ slug: generatedSlug });
      if (existing) {
        throw new AppError(
          `A section with slug "${generatedSlug}" already exists. Please provide a unique title or slug.`,
          409,
          'DUPLICATE_SLUG'
        );
      }

      // If sectionType is GENRE, verify genre exists
      if (sectionType === 'GENRE' && genreId) {
        const genreExists = await Genre.findById(genreId);
        if (!genreExists) {
          throw new AppError('The specified Genre ID does not exist.', 404, 'GENRE_NOT_FOUND');
        }
      }

      const section = await HomeSection.create({
        title: title.trim(),
        subtitle: subtitle.trim(),
        slug: generatedSlug,
        sectionType,
        genreId: genreId || null,
        dramaIds: Array.isArray(dramaIds) ? dramaIds : [],
        layout,
        displayOrder: Number(displayOrder || 0),
        maxItems: Number(maxItems || 10),
        viewAllEnabled: !!viewAllEnabled,
        isActive: !!isActive
      });

      return ApiResponse.created(res, 'New home category section created successfully', {
        section
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Admin: List all home category sections with pagination & search
   * GET /api/v1/home/admin/sections?page=1&limit=20&search=&status=ALL
   */
  static async getAdminSections(req, res, next) {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.max(1, Number(req.query.limit || 20));
      const skip = (page - 1) * limit;
      const { search, status = 'ALL' } = req.query;

      const query = {};

      if (status === 'ACTIVE') query.isActive = true;
      if (status === 'INACTIVE') query.isActive = false;

      if (search) {
        query.$or = [
          { title: { $regex: search.trim(), $options: 'i' } },
          { slug: { $regex: search.trim(), $options: 'i' } },
          { subtitle: { $regex: search.trim(), $options: 'i' } }
        ];
      }

      const total = await HomeSection.countDocuments(query);
      const pagination = getPaginationMeta(page, limit, total);

      const sections = await HomeSection.find(query)
        .populate('genreId', 'name slug')
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return ApiResponse.success(res, 'Home category sections retrieved for admin', {
        sections,
        pagination
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Admin: Get single section by ID
   * GET /api/v1/home/admin/sections/:id
   */
  static async getAdminSectionById(req, res, next) {
    try {
      const { id } = req.params;
      const section = await HomeSection.findById(id)
        .populate('genreId', 'name slug')
        .populate('dramaIds', 'title slug posterUrl viewsCount');

      if (!section) {
        throw new AppError('Home category section not found.', 404, 'SECTION_NOT_FOUND');
      }

      return ApiResponse.success(res, 'Section details retrieved', { section });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Admin: Update home category section
   * PATCH /api/v1/home/admin/sections/:id
   */
  static async updateSection(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const section = await HomeSection.findById(id);
      if (!section) {
        throw new AppError('Home category section not found.', 404, 'SECTION_NOT_FOUND');
      }

      if (updates.slug && updates.slug !== section.slug) {
        const cleanSlug = slugify(updates.slug);
        const existing = await HomeSection.findOne({ slug: cleanSlug, _id: { $ne: id } });
        if (existing) {
          throw new AppError(`Slug "${cleanSlug}" is already in use.`, 409, 'DUPLICATE_SLUG');
        }
        updates.slug = cleanSlug;
      }

      if (updates.title && !updates.slug && updates.title !== section.title) {
        const generatedSlug = slugify(updates.title);
        const existing = await HomeSection.findOne({ slug: generatedSlug, _id: { $ne: id } });
        if (!existing) {
          updates.slug = generatedSlug;
        }
      }

      Object.assign(section, updates);
      await section.save();

      return ApiResponse.success(res, 'Home category section updated successfully', {
        section
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Admin: Batch reorder section display order / priority
   * PATCH /api/v1/home/admin/sections/reorder
   */
  static async reorderSections(req, res, next) {
    try {
      const { items } = req.body; // [{ id: "...", displayOrder: 1 }]

      const bulkOps = items.map((item) => ({
        updateOne: {
          filter: { _id: item.id },
          update: { $set: { displayOrder: Number(item.displayOrder) } }
        }
      }));

      await HomeSection.bulkWrite(bulkOps);

      return ApiResponse.success(res, 'Home category sections priority reordered successfully');
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Admin: Quick toggle active status
   * PATCH /api/v1/home/admin/sections/:id/toggle
   */
  static async toggleSectionStatus(req, res, next) {
    try {
      const { id } = req.params;
      const section = await HomeSection.findById(id);
      if (!section) {
        throw new AppError('Home category section not found.', 404, 'SECTION_NOT_FOUND');
      }

      section.isActive = !section.isActive;
      await section.save();

      return ApiResponse.success(
        res,
        `Section "${section.title}" is now ${section.isActive ? 'active' : 'inactive'}`,
        { section }
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Admin: Delete home category section
   * DELETE /api/v1/home/admin/sections/:id
   */
  static async deleteSection(req, res, next) {
    try {
      const { id } = req.params;
      const section = await HomeSection.findByIdAndDelete(id);
      if (!section) {
        throw new AppError('Home category section not found.', 404, 'SECTION_NOT_FOUND');
      }

      return ApiResponse.success(res, `Home section "${section.title}" deleted successfully`);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Admin: Set individual drama priority
   * PATCH /api/v1/dramas/:id/priority
   */
  static async setDramaPriority(req, res, next) {
    try {
      const { id } = req.params;
      const { priority } = req.body;

      const drama = await Drama.findByIdAndUpdate(
        id,
        { $set: { priority: Number(priority) } },
        { new: true }
      ).populate('genres', 'name slug');

      if (!drama) {
        throw new AppError('Drama series not found.', 404, 'DRAMA_NOT_FOUND');
      }

      return ApiResponse.success(res, `Drama "${drama.title}" priority set to ${priority}`, {
        drama: formatDramaCard(drama)
      });
    } catch (error) {
      return next(error);
    }
  }
}
