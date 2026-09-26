import mongoose from 'mongoose';
import { Watchlist } from '../models/Watchlist.js';
import { Drama } from '../models/Drama.js';
import { Genre } from '../models/Genre.js';
import { WatchHistory } from '../models/WatchHistory.js';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

/**
 * Format view numbers into K/M strings (e.g. 35400 -> "35.4k")
 */
const formatViews = (num = 0) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return String(num);
};

/**
 * Format duration in seconds to mm:ss or hh:mm:ss
 */
const formatDuration = (seconds = 0) => {
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
 * Helper to locate drama by either 24-character ObjectId or slug
 */
const findDramaByIdOrSlug = async (identifier) => {
  if (!identifier) return null;
  const cleanId = String(identifier).trim();

  if (mongoose.Types.ObjectId.isValid(cleanId) && cleanId.length === 24) {
    const drama = await Drama.findById(cleanId);
    if (drama) return drama;
  }
  return await Drama.findOne({ slug: cleanId.toLowerCase() });
};

export class SavedSeriesController {
  /**
   * 1. Get User's Saved Series (Watchlist / Watch Later)
   * GET /api/v1/user/saved-series
   * Query params: page=1, limit=20, search='', genre='', sortBy='recent'|'rating'|'title'|'episodes'
   * @access Private (Bearer JWT required)
   */
  static async getSavedSeries(req, res, next) {
    try {
      const userId = req.userId || req.user?._id;
      if (!userId) {
        throw new AppError('Authentication required.', 401, ERROR_CODES.AUTH_REQUIRED);
      }

      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
      const skip = (page - 1) * limit;

      const { search, q, genre, sortBy = 'recent' } = req.query;
      const searchTerm = (search || q || '').trim();

      // Find all watchlist entries for user
      const watchlistQuery = { userId };

      // Step A: Find matching watchlist records
      // First populate drama to apply search, genre filters if provided
      let watchlistDocs = await Watchlist.find(watchlistQuery)
        .sort({ addedAt: -1 })
        .populate({
          path: 'dramaId',
          select:
            'title slug synopsis posterUrl bannerUrl trailerUrl genres rating totalEpisodes freeEpisodes isPaid plan status isTrending viewsCount priority',
          populate: { path: 'genres', select: 'name slug' }
        })
        .lean();

      // Step B: Filter out null/deleted dramas or unpublished if required
      let items = watchlistDocs.filter((w) => w.dramaId && w.dramaId.status !== 'ARCHIVED');

      // Filter by search keyword (title or synopsis)
      if (searchTerm) {
        const regex = new RegExp(searchTerm, 'i');
        items = items.filter(
          (w) => regex.test(w.dramaId.title) || regex.test(w.dramaId.synopsis || '')
        );
      }

      // Filter by genre (name or slug or ID)
      if (genre && genre !== 'ALL') {
        const genreTerm = genre.toLowerCase().trim();
        items = items.filter((w) => {
          const dramaGenres = w.dramaId.genres || [];
          return dramaGenres.some((g) => {
            if (typeof g === 'object' && g !== null) {
              return (
                (g.name && g.name.toLowerCase() === genreTerm) ||
                (g.slug && g.slug.toLowerCase() === genreTerm) ||
                (g._id && g._id.toString() === genreTerm)
              );
            }
            return String(g).toLowerCase() === genreTerm;
          });
        });
      }

      // Step C: Apply Sorting
      if (sortBy === 'rating') {
        items.sort((a, b) => (b.dramaId.rating || 0) - (a.dramaId.rating || 0));
      } else if (sortBy === 'title') {
        items.sort((a, b) => (a.dramaId.title || '').localeCompare(b.dramaId.title || ''));
      } else if (sortBy === 'episodes') {
        items.sort((a, b) => (b.dramaId.totalEpisodes || 0) - (a.dramaId.totalEpisodes || 0));
      } else {
        // default: 'recent' (addedAt desc)
        items.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
      }

      const total = items.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const paginatedItems = items.slice(skip, skip + limit);

      // Step D: Enhance each saved series with user's Watch History (Watch Later progress)
      // Extract drama IDs to fetch user's playback status in single bulk query
      const dramaIds = paginatedItems.map((item) => item.dramaId._id);
      const userHistories = await WatchHistory.find({
        userId,
        dramaId: { $in: dramaIds }
      }).lean();

      // Map histories by dramaId string
      const historyMap = new Map();
      userHistories.forEach((h) => {
        historyMap.set(h.dramaId.toString(), h);
      });

      const formattedSavedSeries = paginatedItems.map((item) => {
        const drama = item.dramaId;
        const genreNames = Array.isArray(drama.genres)
          ? drama.genres.map((g) => (typeof g === 'object' && g.name ? g.name : String(g))).filter(Boolean)
          : [];

        const history = historyMap.get(drama._id.toString());
        const hasStarted = Boolean(history);
        const resumeEpisodeNumber = history ? history.episodeNumber : 1;
        const progressPercentage = history ? history.progressPercentage : 0;
        const isCompleted = history ? Boolean(history.isCompleted) : false;

        let actionLabel = 'Watch Now';
        if (isCompleted) {
          actionLabel = 'Rewatch';
        } else if (hasStarted) {
          actionLabel = `Resume Ep ${resumeEpisodeNumber}`;
        }

        return {
          id: item._id.toString(),
          savedId: item._id.toString(),
          addedAt: item.addedAt,
          savedAt: item.addedAt,
          drama: {
            id: drama._id.toString(),
            title: drama.title,
            slug: drama.slug,
            synopsis: drama.synopsis || '',
            posterUrl: drama.posterUrl,
            poster: drama.posterUrl,
            bannerUrl: drama.bannerUrl || '',
            banner: drama.bannerUrl || '',
            trailerUrl: drama.trailerUrl || '',
            genres: genreNames.length > 0 ? genreNames : ['Drama'],
            genreDisplay: genreNames.join(' / ') || 'Drama',
            rating: drama.rating || 4.8,
            views: formatViews(drama.viewsCount || 0),
            viewsCount: drama.viewsCount || 0,
            totalEpisodes: drama.totalEpisodes || 0,
            freeEpisodes: drama.freeEpisodes !== undefined ? drama.freeEpisodes : 3,
            isPaid: drama.isPaid !== undefined ? drama.isPaid : true,
            plan: drama.plan || (drama.isPaid === false ? 'Free Tier' : 'Premium Plan'),
            status: drama.status,
            isActive: drama.status === 'PUBLISHED',
            isTrending: Boolean(drama.isTrending)
          },
          watchProgress: {
            hasStarted,
            resumeEpisodeNumber,
            resumeEpisodeId: history ? history.episodeId?.toString() : null,
            watchedSeconds: history ? history.watchedSeconds : 0,
            formattedWatched: history ? formatDuration(history.watchedSeconds) : '0:00',
            durationSeconds: history ? history.durationSeconds : 0,
            formattedDuration: history ? formatDuration(history.durationSeconds) : '0:00',
            progressPercentage,
            isCompleted,
            lastWatchedAt: history ? history.lastWatchedAt : null,
            actionLabel
          },
          isSaved: true
        };
      });

      // Total count of all saved dramas for this user (unfiltered)
      const totalSaved = await Watchlist.countDocuments({ userId });

      return ApiResponse.success(res, 'Saved series retrieved successfully', {
        savedSeries: formattedSavedSeries,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        stats: {
          totalSaved,
          currentFilteredCount: total
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 2. Toggle Save Series in Watchlist (+ / - Watch Later)
   * POST /api/v1/user/saved-series/:dramaId
   * If series is not in watchlist -> Add it
   * If series is already in watchlist -> Remove it
   * @access Private (Bearer JWT required)
   */
  static async toggleSavedSeries(req, res, next) {
    try {
      const userId = req.userId || req.user?._id;
      if (!userId) {
        throw new AppError('Authentication required.', 401, ERROR_CODES.AUTH_REQUIRED);
      }

      const { dramaId } = req.params;
      const drama = await findDramaByIdOrSlug(dramaId);

      if (!drama) {
        throw new AppError('Drama series not found.', 404, 'DRAMA_NOT_FOUND');
      }

      // Check if already in watchlist
      const existing = await Watchlist.findOne({
        userId,
        dramaId: drama._id
      });

      if (existing) {
        // Remove from watchlist
        await Watchlist.deleteOne({ _id: existing._id });
        const totalSaved = await Watchlist.countDocuments({ userId });

        return ApiResponse.success(res, `"${drama.title}" removed from your Saved Series`, {
          dramaId: drama._id.toString(),
          dramaTitle: drama.title,
          isSaved: false,
          action: 'REMOVED',
          totalSaved
        });
      } else {
        // Add to watchlist
        const newEntry = await Watchlist.create({
          userId,
          dramaId: drama._id,
          addedAt: new Date()
        });

        const totalSaved = await Watchlist.countDocuments({ userId });

        return ApiResponse.success(
          res,
          `"${drama.title}" added to your Saved Series / Watch Later`,
          {
            savedId: newEntry._id.toString(),
            dramaId: drama._id.toString(),
            dramaTitle: drama.title,
            isSaved: true,
            action: 'ADDED',
            addedAt: newEntry.addedAt,
            totalSaved
          },
          201
        );
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 3. Check if a Drama is Saved in Watchlist
   * GET /api/v1/user/saved-series/check/:dramaId
   * GET /api/v1/user/saved-series/:dramaId/status
   * @access Private (Bearer JWT required)
   */
  static async checkSavedStatus(req, res, next) {
    try {
      const userId = req.userId || req.user?._id;
      if (!userId) {
        throw new AppError('Authentication required.', 401, ERROR_CODES.AUTH_REQUIRED);
      }

      const { dramaId } = req.params;
      const drama = await findDramaByIdOrSlug(dramaId);

      if (!drama) {
        throw new AppError('Drama series not found.', 404, 'DRAMA_NOT_FOUND');
      }

      const savedEntry = await Watchlist.findOne({
        userId,
        dramaId: drama._id
      });

      return ApiResponse.success(res, 'Watchlist status retrieved successfully', {
        dramaId: drama._id.toString(),
        dramaTitle: drama.title,
        isSaved: Boolean(savedEntry),
        addedAt: savedEntry ? savedEntry.addedAt : null,
        savedId: savedEntry ? savedEntry._id.toString() : null
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 4. Explicitly Remove a Drama from Watchlist
   * DELETE /api/v1/user/saved-series/:dramaId
   * @access Private (Bearer JWT required)
   */
  static async removeSavedSeries(req, res, next) {
    try {
      const userId = req.userId || req.user?._id;
      if (!userId) {
        throw new AppError('Authentication required.', 401, ERROR_CODES.AUTH_REQUIRED);
      }

      const { dramaId } = req.params;
      const drama = await findDramaByIdOrSlug(dramaId);

      if (!drama) {
        throw new AppError('Drama series not found.', 404, 'DRAMA_NOT_FOUND');
      }

      const result = await Watchlist.findOneAndDelete({
        userId,
        dramaId: drama._id
      });

      const totalSaved = await Watchlist.countDocuments({ userId });

      return ApiResponse.success(
        res,
        result
          ? `"${drama.title}" removed from your Saved Series`
          : `Drama was not in your Saved Series`,
        {
          dramaId: drama._id.toString(),
          dramaTitle: drama.title,
          isSaved: false,
          action: 'REMOVED',
          totalSaved
        }
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 5. Clear All Saved Series for User
   * DELETE /api/v1/user/saved-series
   * @access Private (Bearer JWT required)
   */
  static async clearAllSavedSeries(req, res, next) {
    try {
      const userId = req.userId || req.user?._id;
      if (!userId) {
        throw new AppError('Authentication required.', 401, ERROR_CODES.AUTH_REQUIRED);
      }

      const deleteResult = await Watchlist.deleteMany({ userId });

      return ApiResponse.success(res, 'All saved series removed successfully', {
        clearedCount: deleteResult.deletedCount,
        totalSaved: 0
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 6. User Profile & Library Overview (Architecture.md Section 4.4)
   * GET /api/v1/user/profile
   * Profile info, subscription expiration, and library counts (saved series, watch history)
   * @access Private (Bearer JWT required)
   */
  static async getUserProfile(req, res, next) {
    try {
      const user = req.user;
      const userId = user._id;

      const [savedCount, historyCount, completedCount] = await Promise.all([
        Watchlist.countDocuments({ userId }),
        WatchHistory.countDocuments({ userId }),
        WatchHistory.countDocuments({ userId, isCompleted: true })
      ]);

      await user.populate('interests', 'name slug icon iconUrl imageUrl');

      return ApiResponse.success(res, 'User profile and library stats fetched successfully', {
        user: {
          id: user._id.toString(),
          phoneNumber: user.phoneNumber,
          countryCode: user.countryCode,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          avatarUrl: user.avatarUrl,
          isVip: user.isVip,
          vipExpiresAt: user.vipExpiresAt,
          plan: user.plan || (user.isVip ? 'Premium Plan' : 'Free Tier'),
          interests: user.interests,
          preferredContentLanguages: user.preferredContentLanguages,
          settings: user.settings,
          status: user.status
        },
        library: {
          savedSeriesCount: savedCount,
          watchHistoryCount: historyCount,
          completedCount: completedCount
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 7. User Watch History Listing (Architecture.md Section 4.4)
   * GET /api/v1/user/watch-history
   * Query params: page=1, limit=20
   * @access Private (Bearer JWT required)
   */
  static async getWatchHistory(req, res, next) {
    try {
      const userId = req.userId || req.user?._id;
      if (!userId) {
        throw new AppError('Authentication required.', 401, ERROR_CODES.AUTH_REQUIRED);
      }

      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
      const skip = (page - 1) * limit;

      const query = { userId };
      const total = await WatchHistory.countDocuments(query);
      const totalPages = Math.ceil(total / limit) || 1;

      const historyRecords = await WatchHistory.find(query)
        .populate({
          path: 'dramaId',
          select: 'title slug posterUrl bannerUrl rating totalEpisodes freeEpisodes isPaid genres status',
          populate: { path: 'genres', select: 'name slug' }
        })
        .populate('episodeId', 'seasonNumber episodeNumber title durationSeconds streamUrl')
        .sort({ lastWatchedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const items = historyRecords
        .filter((rec) => rec.dramaId && rec.dramaId.status !== 'ARCHIVED')
        .map((rec) => {
          const drama = rec.dramaId;
          const episode = rec.episodeId;
          const genreNames = Array.isArray(drama.genres)
            ? drama.genres.map((g) => (typeof g === 'object' && g.name ? g.name : String(g))).filter(Boolean)
            : [];

          return {
            historyId: rec._id.toString(),
            lastWatchedAt: rec.lastWatchedAt,
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
            episode: episode
              ? {
                  id: episode._id.toString(),
                  episodeNumber: rec.episodeNumber || episode.episodeNumber,
                  seasonNumber: rec.seasonNumber || episode.seasonNumber || 1,
                  title: episode.title || `Episode ${rec.episodeNumber}`,
                  durationSeconds: rec.durationSeconds || episode.durationSeconds || 135,
                  formattedDuration: formatDuration(rec.durationSeconds || episode.durationSeconds || 135)
                }
              : {
                  episodeNumber: rec.episodeNumber,
                  seasonNumber: rec.seasonNumber || 1,
                  title: `Episode ${rec.episodeNumber}`,
                  durationSeconds: rec.durationSeconds,
                  formattedDuration: formatDuration(rec.durationSeconds)
                },
            playback: {
              watchedSeconds: rec.watchedSeconds || 0,
              formattedWatched: formatDuration(rec.watchedSeconds || 0),
              durationSeconds: rec.durationSeconds || 135,
              formattedDuration: formatDuration(rec.durationSeconds || 135),
              progressPercentage: rec.progressPercentage || 0,
              isCompleted: Boolean(rec.isCompleted)
            }
          };
        });

      return ApiResponse.success(res, 'Watch history retrieved successfully', {
        history: items,
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
   * 8. Update User Settings (Architecture.md Section 4.4)
   * PUT /api/v1/user/settings
   * PATCH /api/v1/user/settings
   * Body: { autoplayNext, videoQuality, subtitlesLanguage, playbackSpeed, appLanguage, notifications }
   * @access Private (Bearer JWT required)
   */
  static async updateUserSettings(req, res, next) {
    try {
      const user = req.user;
      const updates = req.body;

      if (!user.settings) {
        user.settings = {};
      }

      if (updates.autoplayNext !== undefined) user.settings.autoplayNext = Boolean(updates.autoplayNext);
      if (updates.videoQuality) user.settings.videoQuality = updates.videoQuality;
      if (updates.subtitlesLanguage) user.settings.subtitlesLanguage = updates.subtitlesLanguage;
      if (updates.playbackSpeed) user.settings.playbackSpeed = updates.playbackSpeed;
      if (updates.appLanguage) user.settings.appLanguage = updates.appLanguage;

      if (updates.notifications && typeof updates.notifications === 'object') {
        user.settings.notifications = {
          ...user.settings.notifications,
          ...updates.notifications
        };
      }

      if (Array.isArray(updates.preferredContentLanguages)) {
        user.preferredContentLanguages = updates.preferredContentLanguages;
      }

      user.markModified('settings');
      await user.save();

      return ApiResponse.success(res, 'Settings updated successfully', {
        settings: user.settings,
        preferredContentLanguages: user.preferredContentLanguages
      });
    } catch (error) {
      return next(error);
    }
  }
}
