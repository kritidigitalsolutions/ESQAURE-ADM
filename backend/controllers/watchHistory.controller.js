import mongoose from 'mongoose';
import { WatchHistory } from '../models/WatchHistory.js';
import { Drama } from '../models/Drama.js';
import { Episode } from '../models/Episode.js';
import { Genre } from '../models/Genre.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import {
  formatDuration,
  getPaginationMeta,
  resolveMediaUrl
} from '../utils/formatters.js';

/**
 * Helper: Humanized relative time (e.g. "Just now", "25 minutes ago", "Yesterday")
 */
const getRelativeTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const diffSecs = Math.max(0, Math.floor((now.getTime() - new Date(date).getTime()) / 1000));

  if (diffSecs < 60) return 'Just now';
  if (diffSecs < 3600) {
    const mins = Math.floor(diffSecs / 60);
    return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
  }
  if (diffSecs < 86400) {
    const hrs = Math.floor(diffSecs / 3600);
    return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} ago`;
  }
  if (diffSecs < 172800) {
    return 'Yesterday';
  }
  if (diffSecs < 604800) {
    const days = Math.floor(diffSecs / 86400);
    return `${days} days ago`;
  }

  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

/**
 * Helper: Categorize date into OTT timeline bucket
 */
const getDateBucket = (date) => {
  if (!date) return 'Earlier';
  const target = new Date(date);
  const now = new Date();

  // Reset to midnight for clean day comparisons
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayMidnight = new Date(todayMidnight);
  yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);
  const weekAgo = new Date(todayMidnight);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(todayMidnight);
  monthAgo.setDate(monthAgo.getDate() - 30);

  if (target >= todayMidnight) return 'Today';
  if (target >= yesterdayMidnight) return 'Yesterday';
  if (target >= weekAgo) return 'This Week';
  if (target >= monthAgo) return 'This Month';
  return 'Earlier';
};

/**
 * Helper: Format cumulative watch time into readable string (e.g. "1h 45m" or "35m 10s")
 */
const formatWatchTime = (totalSeconds = 0) => {
  const secs = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const remSecs = secs % 60;

  if (hrs > 0) {
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  if (mins > 0) {
    return `${mins}m ${remSecs}s`;
  }
  return `${remSecs}s`;
};

/**
 * Helper: Format a single WatchHistory record into a comprehensive OTT card
 */
const formatHistoryItem = (rec, req = null) => {
  const drama = rec.dramaId || {};
  const episode = rec.episodeId || {};

  const genreNames = Array.isArray(drama.genres)
    ? drama.genres
        .map((g) => (typeof g === 'object' && g && g.name ? g.name : String(g || '')))
        .filter(Boolean)
    : [];

  const poster = resolveMediaUrl(drama.posterUrl || drama.poster, req);
  const banner = resolveMediaUrl(drama.bannerUrl || drama.banner, req);
  const episodeThumb = resolveMediaUrl(episode.thumbnailUrl || drama.posterUrl, req);

  const durationSeconds = rec.durationSeconds || episode.durationSeconds || 135;
  const watchedSeconds = rec.watchedSeconds || 0;
  const remainingSeconds = Math.max(0, durationSeconds - watchedSeconds);
  const progressPercentage = rec.progressPercentage !== undefined
    ? Number(rec.progressPercentage)
    : durationSeconds > 0 ? Math.min(100, Number(((watchedSeconds / durationSeconds) * 100).toFixed(1))) : 0;

  const isCompleted = Boolean(rec.isCompleted || progressPercentage >= 90);
  const lastWatchedAt = rec.lastWatchedAt || rec.updatedAt || new Date();

  const seasonNum = rec.seasonNumber || episode.seasonNumber || 1;
  const epNum = rec.episodeNumber || episode.episodeNumber || 1;
  const seasonEpisodeTag = `S${seasonNum} · E${String(epNum).padStart(2, '0')}`;

  const dramaIdStr = drama._id ? drama._id.toString() : (rec.dramaId ? rec.dramaId.toString() : '');
  const episodeIdStr = episode._id ? episode._id.toString() : (rec.episodeId ? rec.episodeId.toString() : '');
  const historyIdStr = rec._id ? rec._id.toString() : '';

  const watchedEpisodesList = Array.isArray(rec.watchedEpisodes)
    ? rec.watchedEpisodes.map((we) => ({
        episodeId: we.episodeId ? we.episodeId.toString() : '',
        seasonNumber: we.seasonNumber || 1,
        episodeNumber: we.episodeNumber,
        seasonEpisodeTag: `S${we.seasonNumber || 1} · E${String(we.episodeNumber).padStart(2, '0')}`,
        title: we.title || `Episode ${we.episodeNumber}`,
        watchedSeconds: we.watchedSeconds || 0,
        formattedWatched: formatDuration(we.watchedSeconds || 0),
        durationSeconds: we.durationSeconds || 135,
        formattedDuration: formatDuration(we.durationSeconds || 135),
        progressPercentage: we.progressPercentage || 0,
        isCompleted: Boolean(we.isCompleted),
        lastWatchedAt: we.lastWatchedAt
      }))
    : [];

  const totalEpisodesCount = Number(drama.totalEpisodes || 0);
  const watchedCount = watchedEpisodesList.length > 0 ? watchedEpisodesList.length : (rec.totalEpisodesWatched || 1);
  const seriesCompletionPercent = totalEpisodesCount > 0
    ? Math.min(100, Number(((watchedCount / totalEpisodesCount) * 100).toFixed(1)))
    : progressPercentage;

  return {
    id: historyIdStr,
    historyId: historyIdStr,
    drama: {
      id: dramaIdStr,
      _id: dramaIdStr,
      title: drama.title || 'Untitled Series',
      slug: drama.slug || '',
      synopsis: drama.synopsis || '',
      posterUrl: poster,
      poster,
      bannerUrl: banner,
      banner,
      rating: drama.rating !== undefined ? Number(drama.rating) : 4.8,
      totalEpisodes: totalEpisodesCount,
      freeEpisodes: drama.freeEpisodes !== undefined ? Number(drama.freeEpisodes) : 3,
      isPaid: drama.isPaid !== undefined ? Boolean(drama.isPaid) : true,
      genres: genreNames,
      genreDisplay: genreNames.join(' / ') || 'Drama',
      status: drama.status || 'PUBLISHED'
    },
    episode: {
      id: episodeIdStr,
      _id: episodeIdStr,
      episodeNumber: epNum,
      seasonNumber: seasonNum,
      seasonEpisodeTag,
      title: episode.title || `Episode ${epNum}`,
      thumbnailUrl: episodeThumb,
      durationSeconds,
      formattedDuration: formatDuration(durationSeconds),
      isFree: episode.isFree !== undefined ? Boolean(episode.isFree) : epNum <= 3
    },
    playback: {
      watchedSeconds,
      formattedWatched: formatDuration(watchedSeconds),
      durationSeconds,
      formattedDuration: formatDuration(durationSeconds),
      remainingSeconds,
      formattedRemaining: remainingSeconds > 0 ? `${formatDuration(remainingSeconds)} left` : 'Completed',
      progressPercentage,
      isCompleted,
      status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS'
    },
    timeline: {
      lastWatchedAt,
      relativeTime: getRelativeTime(lastWatchedAt),
      dateGroup: getDateBucket(lastWatchedAt),
      formattedDate: new Date(lastWatchedAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    },
    seriesProgress: {
      watchedEpisodesCount: watchedCount,
      totalEpisodes: totalEpisodesCount,
      percentSeriesCompleted: seriesCompletionPercent,
      watchedEpisodes: watchedEpisodesList
    },
    actions: {
      resumeUrl: `/api/v1/player/play/${dramaIdStr}/${epNum}?resume=${watchedSeconds}`,
      streamUrl: `/api/v1/player/stream/${dramaIdStr}/${epNum}`,
      removeFromHistoryUrl: `/api/v1/watch-history/${historyIdStr}`
    }
  };
};

export class WatchHistoryController {
  /**
   * 1. Get User's Watch History (OTT Viewing Activity)
   * GET /api/v1/watch-history
   * GET /api/v1/user/watch-history
   *
   * Query Parameters:
   * - page: Page number (default: 1)
   * - limit: Records per page (default: 20)
   * - search / q: Search by drama title
   * - status: 'all' | 'in-progress' / 'continue' | 'completed'
   * - period: 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month'
   * - genre: Filter by genre slug or name
   * - sortBy: 'recent' (default) | 'oldest' | 'progress' | 'title'
   * - view: 'dramas' (default) | 'episodes' | 'grouped'
   * - groupBy: 'date' | 'none'
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

      const searchTerm = (req.query.search || req.query.q || '').trim();
      const statusFilter = (req.query.status || 'all').toLowerCase();
      const periodFilter = (req.query.period || 'all').toLowerCase();
      const genreFilter = (req.query.genre || '').trim();
      const sortBy = (req.query.sortBy || 'recent').toLowerCase();
      const viewMode = (req.query.view || 'dramas').toLowerCase();
      const groupByDate = req.query.groupBy === 'date' || viewMode === 'grouped';

      // Base query scoped to authenticated user
      const query = { userId };

      // 1. Status Filter
      if (statusFilter === 'completed') {
        query.$or = [{ isCompleted: true }, { progressPercentage: { $gte: 90 } }];
      } else if (statusFilter === 'in-progress' || statusFilter === 'continue') {
        query.isCompleted = false;
        query.progressPercentage = { $lt: 90 };
      }

      // 2. Period Filter
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (periodFilter === 'today') {
        query.lastWatchedAt = { $gte: todayStart };
      } else if (periodFilter === 'yesterday') {
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        query.lastWatchedAt = { $gte: yesterdayStart, $lt: todayStart };
      } else if (periodFilter === 'this_week') {
        const weekAgo = new Date(todayStart);
        weekAgo.setDate(weekAgo.getDate() - 7);
        query.lastWatchedAt = { $gte: weekAgo };
      } else if (periodFilter === 'this_month') {
        const monthAgo = new Date(todayStart);
        monthAgo.setDate(monthAgo.getDate() - 30);
        query.lastWatchedAt = { $gte: monthAgo };
      }

      // 3. Search or Genre Filter (matching Drama IDs)
      let dramaMatchIds = null;
      if (searchTerm || genreFilter) {
        const dramaQuery = {};
        if (searchTerm) {
          dramaQuery.title = { $regex: searchTerm, $options: 'i' };
        }
        if (genreFilter) {
          // Check if genreFilter is ObjectId or slug/name
          if (mongoose.Types.ObjectId.isValid(genreFilter)) {
            dramaQuery.genres = genreFilter;
          } else {
            const foundGenre = await Genre.findOne({
              $or: [
                { slug: genreFilter.toLowerCase() },
                { name: { $regex: `^${genreFilter}$`, $options: 'i' } }
              ]
            }).select('_id');
            if (foundGenre) {
              dramaQuery.genres = foundGenre._id;
            }
          }
        }
        const matchedDramas = await Drama.find(dramaQuery).select('_id');
        dramaMatchIds = matchedDramas.map((d) => d._id);
        query.dramaId = { $in: dramaMatchIds };
      }

      // Sort Order
      let sortSpec = { lastWatchedAt: -1 };
      if (sortBy === 'oldest') {
        sortSpec = { lastWatchedAt: 1 };
      } else if (sortBy === 'progress') {
        sortSpec = { progressPercentage: -1, lastWatchedAt: -1 };
      }

      // Count total matches
      const total = await WatchHistory.countDocuments(query);
      const pagination = getPaginationMeta(page, limit, total);

      // Fetch history records
      const rawRecords = await WatchHistory.find(query)
        .populate({
          path: 'dramaId',
          select: 'title slug synopsis posterUrl bannerUrl rating totalEpisodes freeEpisodes isPaid genres status',
          populate: { path: 'genres', select: 'name slug' }
        })
        .populate('episodeId', 'seasonNumber episodeNumber title durationSeconds thumbnailUrl isFree')
        .sort(sortSpec)
        .skip(skip)
        .limit(limit)
        .lean();

      // Filter out archived dramas
      const validRecords = rawRecords.filter((rec) => rec.dramaId && rec.dramaId.status !== 'ARCHIVED');

      // Summary Statistics (Calculated across all user watch records)
      const [allUserRecords, completedCount] = await Promise.all([
        WatchHistory.find({ userId }).select('watchedSeconds durationSeconds isCompleted totalEpisodesWatched watchedEpisodes').lean(),
        WatchHistory.countDocuments({
          userId,
          $or: [{ isCompleted: true }, { progressPercentage: { $gte: 90 } }]
        })
      ]);

      let totalWatchTimeSeconds = 0;
      let totalEpisodesWatched = 0;
      allUserRecords.forEach((r) => {
        totalWatchTimeSeconds += Number(r.watchedSeconds || 0);
        const epCount = Array.isArray(r.watchedEpisodes) && r.watchedEpisodes.length > 0
          ? r.watchedEpisodes.length
          : (r.totalEpisodesWatched || 1);
        totalEpisodesWatched += epCount;
      });

      const summary = {
        totalDramasWatched: allUserRecords.length,
        totalEpisodesWatched,
        completedCount,
        inProgressCount: Math.max(0, allUserRecords.length - completedCount),
        totalWatchTimeSeconds,
        formattedTotalWatchTime: formatWatchTime(totalWatchTimeSeconds)
      };

      // Format Items
      let items = validRecords.map((rec) => formatHistoryItem(rec, req));

      // If user requested alphabetical sorting by title
      if (sortBy === 'title') {
        items.sort((a, b) => a.drama.title.localeCompare(b.drama.title));
      }

      // Itemized Episodes View (if requested)
      if (viewMode === 'episodes') {
        const episodeItems = [];
        validRecords.forEach((rec) => {
          const drama = rec.dramaId || {};
          const epList = Array.isArray(rec.watchedEpisodes) && rec.watchedEpisodes.length > 0
            ? rec.watchedEpisodes
            : [
                {
                  episodeId: rec.episodeId?._id || rec.episodeId,
                  seasonNumber: rec.seasonNumber || 1,
                  episodeNumber: rec.episodeNumber,
                  title: rec.episodeId?.title || `Episode ${rec.episodeNumber}`,
                  thumbnailUrl: rec.episodeId?.thumbnailUrl || drama.posterUrl,
                  watchedSeconds: rec.watchedSeconds || 0,
                  durationSeconds: rec.durationSeconds || 135,
                  progressPercentage: rec.progressPercentage || 0,
                  isCompleted: rec.isCompleted,
                  lastWatchedAt: rec.lastWatchedAt
                }
              ];

          epList.forEach((ep) => {
            const watchedSecs = ep.watchedSeconds || 0;
            const durSecs = ep.durationSeconds || 135;
            const remSecs = Math.max(0, durSecs - watchedSecs);
            const isDone = Boolean(ep.isCompleted || ep.progressPercentage >= 90);
            const watchedAt = ep.lastWatchedAt || rec.lastWatchedAt;
            const seasonNum = ep.seasonNumber || 1;
            const epNum = ep.episodeNumber;

            episodeItems.push({
              id: `${rec._id}_${epNum}`,
              historyId: rec._id.toString(),
              dramaId: drama._id?.toString() || '',
              dramaTitle: drama.title || '',
              posterUrl: resolveMediaUrl(drama.posterUrl, req),
              episodeNumber: epNum,
              seasonNumber: seasonNum,
              seasonEpisodeTag: `S${seasonNum} · E${String(epNum).padStart(2, '0')}`,
              title: ep.title || `Episode ${epNum}`,
              thumbnailUrl: resolveMediaUrl(ep.thumbnailUrl || drama.posterUrl, req),
              watchedSeconds: watchedSecs,
              formattedWatched: formatDuration(watchedSecs),
              durationSeconds: durSecs,
              formattedDuration: formatDuration(durSecs),
              remainingSeconds: remSecs,
              formattedRemaining: remSecs > 0 ? `${formatDuration(remSecs)} left` : 'Completed',
              progressPercentage: ep.progressPercentage || 0,
              isCompleted: isDone,
              status: isDone ? 'COMPLETED' : 'IN_PROGRESS',
              lastWatchedAt: watchedAt,
              relativeTime: getRelativeTime(watchedAt),
              dateGroup: getDateBucket(watchedAt),
              resumeUrl: `/api/v1/player/play/${drama._id}/${epNum}?resume=${watchedSecs}`
            });
          });
        });

        episodeItems.sort((a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime());

        return ApiResponse.success(res, 'Itemized watch history retrieved successfully', {
          summary,
          history: episodeItems,
          pagination: getPaginationMeta(page, limit, episodeItems.length)
        });
      }

      // Grouped by Date View
      const groupedHistory = {
        Today: [],
        Yesterday: [],
        'This Week': [],
        'This Month': [],
        Earlier: []
      };

      items.forEach((item) => {
        const bucket = item.timeline.dateGroup;
        if (groupedHistory[bucket]) {
          groupedHistory[bucket].push(item);
        } else {
          groupedHistory.Earlier.push(item);
        }
      });

      const responsePayload = {
        summary,
        history: items,
        pagination
      };

      if (groupByDate) {
        responsePayload.groupedHistory = groupedHistory;
      }

      return ApiResponse.success(res, 'Watch history retrieved successfully', responsePayload);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 2. Get Viewing History for a Specific Drama
   * GET /api/v1/watch-history/drama/:dramaId
   * GET /api/v1/watch-history/:id
   */
  static async getDramaHistory(req, res, next) {
    try {
      const userId = req.userId || req.user?._id;
      if (!userId) {
        throw new AppError('Authentication required.', 401, ERROR_CODES.AUTH_REQUIRED);
      }

      const identifier = req.params.dramaId || req.params.id || req.params.historyId;
      if (!identifier) {
        throw new AppError('Drama or history identifier is required.', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      // Find Drama by ObjectId or slug
      let drama = null;
      let historyRecord = null;

      if (mongoose.Types.ObjectId.isValid(identifier)) {
        // Try finding directly by History ID first
        historyRecord = await WatchHistory.findOne({ _id: identifier, userId })
          .populate({
            path: 'dramaId',
            select: 'title slug synopsis posterUrl bannerUrl rating totalEpisodes freeEpisodes isPaid genres status',
            populate: { path: 'genres', select: 'name slug' }
          })
          .populate('episodeId', 'seasonNumber episodeNumber title durationSeconds thumbnailUrl isFree');

        if (historyRecord && historyRecord.dramaId) {
          drama = historyRecord.dramaId;
        } else {
          // If not history ID, try finding drama by ObjectId
          drama = await Drama.findById(identifier).populate('genres', 'name slug');
        }
      } else {
        // Try finding drama by slug
        drama = await Drama.findOne({ slug: identifier.toLowerCase() }).populate('genres', 'name slug');
      }

      if (!drama) {
        throw new AppError('Drama series not found.', 404, ERROR_CODES.NOT_FOUND);
      }

      // If we didn't already find historyRecord, find by userId and drama._id
      if (!historyRecord) {
        historyRecord = await WatchHistory.findOne({ userId, dramaId: drama._id })
          .populate({
            path: 'dramaId',
            select: 'title slug synopsis posterUrl bannerUrl rating totalEpisodes freeEpisodes isPaid genres status',
            populate: { path: 'genres', select: 'name slug' }
          })
          .populate('episodeId', 'seasonNumber episodeNumber title durationSeconds thumbnailUrl isFree');
      }

      // If user hasn't watched this drama yet
      if (!historyRecord) {
        return ApiResponse.success(res, 'No watch history for this drama', {
          hasStarted: false,
          drama: {
            id: drama._id.toString(),
            title: drama.title,
            slug: drama.slug,
            posterUrl: resolveMediaUrl(drama.posterUrl, req),
            totalEpisodes: drama.totalEpisodes || 0
          },
          currentEpisode: null,
          playback: null,
          watchedEpisodes: []
        });
      }

      const formatted = formatHistoryItem(historyRecord, req);

      return ApiResponse.success(res, 'Drama watch history retrieved successfully', {
        hasStarted: true,
        ...formatted
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 3. Get Watch History Analytics & Statistics Summary
   * GET /api/v1/watch-history/summary
   * GET /api/v1/user/watch-history/summary
   */
  static async getHistorySummary(req, res, next) {
    try {
      const userId = req.userId || req.user?._id;
      if (!userId) {
        throw new AppError('Authentication required.', 401, ERROR_CODES.AUTH_REQUIRED);
      }

      const histories = await WatchHistory.find({ userId })
        .populate({
          path: 'dramaId',
          select: 'title slug posterUrl genres',
          populate: { path: 'genres', select: 'name slug' }
        })
        .sort({ lastWatchedAt: -1 })
        .lean();

      let totalWatchTimeSeconds = 0;
      let totalEpisodesWatched = 0;
      let completedCount = 0;
      const genreCounts = {};

      histories.forEach((h) => {
        totalWatchTimeSeconds += Number(h.watchedSeconds || 0);

        const epsCount = Array.isArray(h.watchedEpisodes) && h.watchedEpisodes.length > 0
          ? h.watchedEpisodes.length
          : (h.totalEpisodesWatched || 1);
        totalEpisodesWatched += epsCount;

        if (h.isCompleted || (h.progressPercentage && h.progressPercentage >= 90)) {
          completedCount++;
        }

        if (h.dramaId && Array.isArray(h.dramaId.genres)) {
          h.dramaId.genres.forEach((g) => {
            const name = g.name || String(g);
            if (name) {
              genreCounts[name] = (genreCounts[name] || 0) + 1;
            }
          });
        }
      });

      // Top watched genres
      const topGenres = Object.entries(genreCounts)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const latestRecord = histories[0];
      const recentlyWatched = latestRecord && latestRecord.dramaId
        ? {
            id: latestRecord.dramaId._id.toString(),
            title: latestRecord.dramaId.title,
            slug: latestRecord.dramaId.slug,
            posterUrl: resolveMediaUrl(latestRecord.dramaId.posterUrl, req),
            episodeNumber: latestRecord.episodeNumber,
            lastWatchedAt: latestRecord.lastWatchedAt,
            relativeTime: getRelativeTime(latestRecord.lastWatchedAt)
          }
        : null;

      return ApiResponse.success(res, 'Watch history summary retrieved successfully', {
        totalDramasWatched: histories.length,
        totalEpisodesWatched,
        completedCount,
        inProgressCount: Math.max(0, histories.length - completedCount),
        totalWatchTimeSeconds,
        formattedTotalWatchTime: formatWatchTime(totalWatchTimeSeconds),
        recentlyWatched,
        topGenres
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 4. Record or Sync Watch History Progress
   * POST /api/v1/watch-history
   * POST /api/v1/user/watch-history
   *
   * Body:
   * - dramaId: Drama ID or slug
   * - episodeNumber: Number (default: 1)
   * - episodeId: Optional ObjectId
   * - watchedSeconds: Number (default: 0)
   * - durationSeconds: Optional Number
   * - isCompleted: Optional Boolean
   */
  static async recordWatchHistory(req, res, next) {
    try {
      const userId = req.userId || req.user?._id;
      if (!userId) {
        throw new AppError('Authentication required.', 401, ERROR_CODES.AUTH_REQUIRED);
      }

      const { dramaId, episodeNumber = 1, watchedSeconds = 0 } = req.body;
      if (!dramaId) {
        throw new AppError('dramaId is required.', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      // Find Drama
      let drama = null;
      if (mongoose.Types.ObjectId.isValid(dramaId)) {
        drama = await Drama.findById(dramaId);
      } else {
        drama = await Drama.findOne({ slug: String(dramaId).toLowerCase() });
      }

      if (!drama) {
        throw new AppError('Drama series not found.', 404, ERROR_CODES.NOT_FOUND);
      }

      // Find Episode
      let episode = null;
      if (req.body.episodeId && mongoose.Types.ObjectId.isValid(req.body.episodeId)) {
        episode = await Episode.findById(req.body.episodeId);
      } else {
        episode = await Episode.findOne({
          dramaId: drama._id,
          episodeNumber: Number(episodeNumber)
        });
      }

      const totalDuration = Number(req.body.durationSeconds) > 0
        ? Number(req.body.durationSeconds)
        : (episode?.durationSeconds || 135);

      const safeWatchedSecs = Math.min(Number(watchedSeconds), totalDuration);
      const calculatedPercentage = totalDuration > 0
        ? Math.min(100, Number(((safeWatchedSecs / totalDuration) * 100).toFixed(1)))
        : 0;

      const isCompleted = req.body.isCompleted !== undefined
        ? Boolean(req.body.isCompleted)
        : calculatedPercentage >= 90;

      // Find existing history
      const existingHistory = await WatchHistory.findOne({
        userId,
        dramaId: drama._id
      });

      let watchedEpisodes = existingHistory?.watchedEpisodes ? [...existingHistory.watchedEpisodes] : [];
      const epNum = episode ? episode.episodeNumber : Number(episodeNumber);
      const seasonNum = episode?.seasonNumber || 1;

      const epIndex = watchedEpisodes.findIndex(
        (e) => Number(e.episodeNumber) === epNum && Number(e.seasonNumber || 1) === seasonNum
      );

      const episodeEntry = {
        episodeId: episode ? episode._id : new mongoose.Types.ObjectId(),
        seasonNumber: seasonNum,
        episodeNumber: epNum,
        title: episode?.title || `Episode ${epNum}`,
        thumbnailUrl: episode?.thumbnailUrl || '',
        watchedSeconds: safeWatchedSecs,
        durationSeconds: totalDuration,
        progressPercentage: calculatedPercentage,
        isCompleted,
        lastWatchedAt: new Date()
      };

      if (epIndex >= 0) {
        watchedEpisodes[epIndex] = episodeEntry;
      } else {
        watchedEpisodes.push(episodeEntry);
      }

      const updatedHistory = await WatchHistory.findOneAndUpdate(
        { userId, dramaId: drama._id },
        {
          $set: {
            episodeId: episodeEntry.episodeId,
            seasonNumber: seasonNum,
            episodeNumber: epNum,
            watchedSeconds: safeWatchedSecs,
            durationSeconds: totalDuration,
            progressPercentage: calculatedPercentage,
            isCompleted,
            lastWatchedAt: new Date(),
            totalEpisodesWatched: watchedEpisodes.length,
            watchedEpisodes
          }
        },
        { upsert: true, new: true }
      ).populate({
        path: 'dramaId',
        select: 'title slug synopsis posterUrl bannerUrl rating totalEpisodes freeEpisodes isPaid genres status',
        populate: { path: 'genres', select: 'name slug' }
      }).populate('episodeId', 'seasonNumber episodeNumber title durationSeconds thumbnailUrl isFree');

      const formatted = formatHistoryItem(updatedHistory, req);

      return ApiResponse.success(res, 'Watch history progress recorded successfully', formatted, 201);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 5. Mark Episode or Drama as Completed
   * POST /api/v1/watch-history/mark-completed
   * POST /api/v1/user/watch-history/mark-completed
   *
   * Body:
   * - dramaId: Drama ID or slug (required)
   * - episodeNumber: Optional number
   */
  static async markAsCompleted(req, res, next) {
    try {
      const userId = req.userId || req.user?._id;
      if (!userId) {
        throw new AppError('Authentication required.', 401, ERROR_CODES.AUTH_REQUIRED);
      }

      const { dramaId, episodeNumber } = req.body;
      if (!dramaId) {
        throw new AppError('dramaId is required.', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      let drama = null;
      if (mongoose.Types.ObjectId.isValid(dramaId)) {
        drama = await Drama.findById(dramaId);
      } else {
        drama = await Drama.findOne({ slug: String(dramaId).toLowerCase() });
      }

      if (!drama) {
        throw new AppError('Drama series not found.', 404, ERROR_CODES.NOT_FOUND);
      }

      const history = await WatchHistory.findOne({ userId, dramaId: drama._id });
      if (!history) {
        throw new AppError('No watch history found for this drama to mark complete.', 404, ERROR_CODES.NOT_FOUND);
      }

      // Mark specific episode or current episode
      history.isCompleted = true;
      history.progressPercentage = 100;
      history.watchedSeconds = history.durationSeconds;
      history.lastWatchedAt = new Date();

      if (Array.isArray(history.watchedEpisodes)) {
        if (episodeNumber !== undefined) {
          const ep = history.watchedEpisodes.find((e) => Number(e.episodeNumber) === Number(episodeNumber));
          if (ep) {
            ep.isCompleted = true;
            ep.progressPercentage = 100;
            ep.watchedSeconds = ep.durationSeconds;
            ep.lastWatchedAt = new Date();
          }
        } else {
          // Mark all recorded episodes as completed
          history.watchedEpisodes.forEach((e) => {
            e.isCompleted = true;
            e.progressPercentage = 100;
            e.watchedSeconds = e.durationSeconds;
          });
        }
      }

      await history.save();

      return ApiResponse.success(res, 'Watch history marked as completed', {
        dramaId: drama._id.toString(),
        isCompleted: true,
        progressPercentage: 100
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 6. Delete a Single Item from Watch History
   * DELETE /api/v1/watch-history/:historyId
   * DELETE /api/v1/user/watch-history/:historyId
   */
  static async deleteHistoryItem(req, res, next) {
    try {
      const userId = req.userId || req.user?._id;
      if (!userId) {
        throw new AppError('Authentication required.', 401, ERROR_CODES.AUTH_REQUIRED);
      }

      const historyId = req.params.historyId || req.params.id;
      if (!historyId) {
        throw new AppError('History ID or drama ID is required.', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      // Check if historyId matches a WatchHistory _id OR a dramaId
      let deleteQuery = { userId };
      if (mongoose.Types.ObjectId.isValid(historyId)) {
        deleteQuery.$or = [{ _id: historyId }, { dramaId: historyId }];
      } else {
        // Try finding drama by slug
        const drama = await Drama.findOne({ slug: historyId.toLowerCase() }).select('_id');
        if (drama) {
          deleteQuery.dramaId = drama._id;
        } else {
          deleteQuery._id = historyId;
        }
      }

      const deleted = await WatchHistory.findOneAndDelete(deleteQuery);
      if (!deleted) {
        throw new AppError('Watch history record not found.', 404, ERROR_CODES.NOT_FOUND);
      }

      return ApiResponse.success(res, 'Content removed from watch history', {
        historyId: deleted._id.toString(),
        dramaId: deleted.dramaId.toString(),
        deleted: true
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 7. Delete Drama Entirely from Watch History
   * DELETE /api/v1/watch-history/drama/:dramaId
   * DELETE /api/v1/user/watch-history/drama/:dramaId
   */
  static async deleteDramaHistory(req, res, next) {
    try {
      const userId = req.userId || req.user?._id;
      if (!userId) {
        throw new AppError('Authentication required.', 401, ERROR_CODES.AUTH_REQUIRED);
      }

      const dramaId = req.params.dramaId;
      if (!dramaId) {
        throw new AppError('Drama identifier is required.', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      let targetDramaId = dramaId;
      if (!mongoose.Types.ObjectId.isValid(dramaId)) {
        const drama = await Drama.findOne({ slug: dramaId.toLowerCase() }).select('_id');
        if (!drama) {
          throw new AppError('Drama series not found.', 404, ERROR_CODES.NOT_FOUND);
        }
        targetDramaId = drama._id;
      }

      const deleted = await WatchHistory.findOneAndDelete({
        userId,
        dramaId: targetDramaId
      });

      if (!deleted) {
        throw new AppError('Watch history for this drama not found.', 404, ERROR_CODES.NOT_FOUND);
      }

      return ApiResponse.success(res, 'Drama removed from watch history', {
        dramaId: targetDramaId.toString(),
        deleted: true
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 8. Clear User's Entire Watch History
   * DELETE /api/v1/watch-history
   * DELETE /api/v1/user/watch-history
   */
  static async clearAllHistory(req, res, next) {
    try {
      const userId = req.userId || req.user?._id;
      if (!userId) {
        throw new AppError('Authentication required.', 401, ERROR_CODES.AUTH_REQUIRED);
      }

      const result = await WatchHistory.deleteMany({ userId });

      return ApiResponse.success(res, 'All watch history cleared successfully', {
        cleared: true,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      return next(error);
    }
  }
}
