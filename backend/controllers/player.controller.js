import mongoose from 'mongoose';
import { Drama } from '../models/Drama.js';
import { Episode } from '../models/Episode.js';
import { WatchHistory } from '../models/WatchHistory.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

/**
 * Format seconds into mm:ss or hh:mm:ss format (e.g. 45 -> "0:45", 135 -> "2:15")
 */
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
 * Check if user has active VIP / subscription access
 */
export const isUserVip = (user) => {
  if (!user || !user.isVip) return false;
  if (!user.vipExpiresAt) return true;
  return new Date(user.vipExpiresAt) > new Date();
};

export class PlayerController {
  /**
   * 1. Access Check API: Verify if user has access to content/episode as per plan status
   * GET /api/v1/player/access/:dramaId/:episodeNumber
   * POST /api/v1/player/access (body: { dramaId, episodeNumber })
   */
  static async checkAccess(req, res, next) {
    try {
      const dramaId = req.params.dramaId || req.body.dramaId;
      const episodeNumber = Number(req.params.episodeNumber || req.body.episodeNumber || 1);
      const user = req.user;
      const userHasVip = isUserVip(user);

      if (!dramaId) {
        throw new AppError('Drama ID or slug is required.', 400, 'VALIDATION_ERROR');
      }

      // Locate Drama
      const dramaQuery =
        mongoose.Types.ObjectId.isValid(dramaId) && dramaId.length === 24
          ? { _id: dramaId }
          : { slug: dramaId.toLowerCase().trim() };

      const drama = await Drama.findOne(dramaQuery).select('_id title slug totalEpisodes');
      if (!drama) {
        throw new AppError('Drama series not found.', 404, 'DRAMA_NOT_FOUND');
      }

      // Locate Episode
      const episode = await Episode.findOne({
        dramaId: drama._id,
        episodeNumber
      }).select('_id seasonNumber episodeNumber title isFree durationSeconds');

      if (!episode) {
        throw new AppError(`Episode ${episodeNumber} not found for "${drama.title}".`, 404, 'EPISODE_NOT_FOUND');
      }

      // Evaluate Access
      let hasAccess = false;
      let reason = 'SUBSCRIPTION_REQUIRED';

      if (episode.isFree) {
        hasAccess = true;
        reason = 'FREE_EPISODE';
      } else if (userHasVip) {
        hasAccess = true;
        reason = 'ACTIVE_VIP_SUBSCRIPTION';
      } else {
        hasAccess = false;
        reason = 'SUBSCRIPTION_REQUIRED';
      }

      // If no access, attach active subscription plans
      let plans = [];
      if (!hasAccess) {
        plans = await SubscriptionPlan.find({
          $or: [{ status: 'ACTIVE' }, { isActive: true }]
        }).select('name code price originalPrice durationDays features badge');
      }

      const accessData = {
        hasAccess,
        reason,
        isFree: episode.isFree,
        isLocked: !hasAccess,
        userPlanStatus: {
          isLoggedIn: true,
          isVip: userHasVip,
          plan: user?.plan || (userHasVip ? 'VIP Member' : 'Free Tier'),
          vipExpiresAt: user?.vipExpiresAt || null
        },
        drama: {
          id: drama._id.toString(),
          title: drama.title,
          slug: drama.slug
        },
        episode: {
          id: episode._id.toString(),
          seasonNumber: episode.seasonNumber || 1,
          episodeNumber: episode.episodeNumber,
          seasonEpisodeTag: episode.seasonEpisodeTag,
          title: episode.title,
          durationSeconds: episode.durationSeconds
        },
        upgradePlans: !hasAccess ? plans : []
      };

      return ApiResponse.success(res, 'Access status evaluated successfully', accessData);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 2. Play Episode / Stream Details
   * GET /api/v1/player/play/:dramaId/:episodeNumber
   * GET /api/v1/player/stream/:dramaId/:episodeNumber (alias)
   */
  static async getEpisodeStream(req, res, next) {
    try {
      const { dramaId, episodeNumber = 1 } = req.params;
      const user = req.user;
      const userHasVip = isUserVip(user);

      // Locate Drama by slug or ObjectId
      const dramaQuery =
        mongoose.Types.ObjectId.isValid(dramaId) && dramaId.length === 24
          ? { _id: dramaId }
          : { slug: dramaId.toLowerCase().trim() };

      const drama = await Drama.findOne(dramaQuery).populate('genres', 'name slug');
      if (!drama) {
        throw new AppError('Drama series not found.', 404, 'DRAMA_NOT_FOUND');
      }

      // Locate Episode by episodeNumber
      const episode = await Episode.findOne({
        dramaId: drama._id,
        episodeNumber: Number(episodeNumber)
      });

      if (!episode) {
        throw new AppError(
          `Episode ${episodeNumber} not found for "${drama.title}".`,
          404,
          'EPISODE_NOT_FOUND'
        );
      }

      // Monetization check: Lock episode if not free and user is not VIP
      const isLocked = !episode.isFree && !userHasVip;
      if (isLocked) {
        const plans = await SubscriptionPlan.find({
          $or: [{ status: 'ACTIVE' }, { isActive: true }]
        }).select('name code price originalPrice durationDays features badge');

        return ApiResponse.error(
          res,
          'This episode is locked. Please subscribe to continue streaming.',
          ERROR_CODES.SUBSCRIPTION_REQUIRED,
          403,
          {
            hasAccess: false,
            isLocked: true,
            episodeNumber: episode.episodeNumber,
            seasonEpisodeTag: episode.seasonEpisodeTag,
            episodeTitle: episode.title,
            dramaTitle: drama.title,
            previewTrailerUrl: drama.trailerUrl || null,
            plans
          }
        );
      }

      // Fetch user's saved resume position
      let watchHistory = null;
      if (user) {
        watchHistory = await WatchHistory.findOne({
          userId: user._id,
          dramaId: drama._id,
          episodeId: episode._id
        });
      }

      // Find Next and Previous episodes for player navigation
      const [nextEpisode, previousEpisode] = await Promise.all([
        Episode.findOne({
          dramaId: drama._id,
          episodeNumber: episode.episodeNumber + 1
        }).select('_id seasonNumber episodeNumber title isFree durationSeconds'),
        Episode.findOne({
          dramaId: drama._id,
          episodeNumber: episode.episodeNumber - 1
        }).select('_id seasonNumber episodeNumber title isFree durationSeconds')
      ]);

      const genreNames = (drama.genres || []).map((g) => g.name || g);
      const genreString = genreNames.join(' / ') || 'Drama';
      const watchedSecs = watchHistory ? watchHistory.watchedSeconds : 0;
      const durationSecs = episode.durationSeconds || 135;

      return ApiResponse.success(res, 'Episode stream data fetched successfully', {
        streamUrl: episode.videoStreamUrl, // Bunny CDN HLS .m3u8 or MP4 stream
        bunnyVideoId: episode.bunnyVideoId || null,
        drama: {
          id: drama._id.toString(),
          title: drama.title,
          slug: drama.slug,
          posterUrl: drama.posterUrl,
          genres: genreNames,
          genreDisplay: genreString,
          totalEpisodes: drama.totalEpisodes || 0
        },
        episode: {
          id: episode._id.toString(),
          seasonNumber: episode.seasonNumber || 1,
          episodeNumber: episode.episodeNumber,
          seasonEpisodeTag: episode.seasonEpisodeTag, // "S1 · E02"
          title: episode.title, // "If This Is LOVE Let Me Burn"
          subtitleDisplay: `Episode ${episode.episodeNumber} • ${genreString}`,
          durationSeconds: durationSecs,
          formattedDuration: episode.formattedDuration || formatDuration(durationSecs), // "2:15"
          thumbnailUrl: episode.thumbnailUrl || drama.posterUrl,
          isFree: episode.isFree,
          hasAccess: true
        },
        progress: {
          watchedSeconds: watchedSecs,
          formattedWatched: formatDuration(watchedSecs), // "0:45"
          durationSeconds: durationSecs,
          formattedDuration: formatDuration(durationSecs), // "2:15"
          progressPercentage: watchHistory ? watchHistory.progressPercentage : 0,
          isCompleted: watchHistory ? watchHistory.isCompleted : false
        },
        navigation: {
          nextEpisode: nextEpisode
            ? {
                id: nextEpisode._id.toString(),
                seasonNumber: nextEpisode.seasonNumber,
                episodeNumber: nextEpisode.episodeNumber,
                seasonEpisodeTag: `S${nextEpisode.seasonNumber} · E${String(nextEpisode.episodeNumber).padStart(2, '0')}`,
                title: nextEpisode.title,
                isFree: nextEpisode.isFree,
                isLocked: !nextEpisode.isFree && !userHasVip
              }
            : null,
          previousEpisode: previousEpisode
            ? {
                id: previousEpisode._id.toString(),
                seasonNumber: previousEpisode.seasonNumber,
                episodeNumber: previousEpisode.episodeNumber,
                seasonEpisodeTag: `S${previousEpisode.seasonNumber} · E${String(previousEpisode.episodeNumber).padStart(2, '0')}`,
                title: previousEpisode.title,
                isFree: previousEpisode.isFree
              }
            : null
        },
        userStatus: {
          isAuthenticated: Boolean(user),
          isVip: userHasVip
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 3. Episodes Drawer List with Pagination
   * GET /api/v1/player/episodes/:dramaId?page=1&limit=20&current=2
   */
  static async getEpisodesDrawer(req, res, next) {
    try {
      const { dramaId } = req.params;
      const currentEp = req.query.current ? Number(req.query.current) : null;
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 50; // default 50 per page
      const skip = (page - 1) * limit;

      const user = req.user;
      const userHasVip = isUserVip(user);

      const dramaQuery =
        mongoose.Types.ObjectId.isValid(dramaId) && dramaId.length === 24
          ? { _id: dramaId }
          : { slug: dramaId.toLowerCase().trim() };

      const drama = await Drama.findOne(dramaQuery).populate('genres', 'name slug');
      if (!drama) {
        throw new AppError('Drama series not found.', 404, 'DRAMA_NOT_FOUND');
      }

      const totalEpisodesCount = await Episode.countDocuments({ dramaId: drama._id });

      const episodes = await Episode.find({ dramaId: drama._id })
        .sort({ seasonNumber: 1, episodeNumber: 1 })
        .skip(skip)
        .limit(limit);

      // User watch history map
      const userProgressMap = new Map();
      if (user) {
        const histories = await WatchHistory.find({
          userId: user._id,
          dramaId: drama._id
        });
        histories.forEach((h) => userProgressMap.set(h.episodeNumber, h));
      }

      const formattedEpisodes = episodes.map((ep) => {
        const history = userProgressMap.get(ep.episodeNumber);
        const isLocked = !ep.isFree && !userHasVip;
        return {
          id: ep._id.toString(),
          seasonNumber: ep.seasonNumber || 1,
          episodeNumber: ep.episodeNumber,
          seasonEpisodeTag: ep.seasonEpisodeTag,
          title: ep.title,
          durationSeconds: ep.durationSeconds,
          formattedDuration: ep.formattedDuration || formatDuration(ep.durationSeconds),
          thumbnailUrl: ep.thumbnailUrl || drama.posterUrl,
          isFree: ep.isFree,
          hasAccess: !isLocked,
          isLocked,
          isCurrent: currentEp !== null ? ep.episodeNumber === currentEp : false,
          watched: history
            ? {
                watchedSeconds: history.watchedSeconds,
                formattedWatched: formatDuration(history.watchedSeconds),
                progressPercentage: history.progressPercentage,
                isCompleted: history.isCompleted
              }
            : null
        };
      });

      const genreNames = (drama.genres || []).map((g) => g.name || g);
      const totalPages = Math.ceil(totalEpisodesCount / limit);

      return ApiResponse.success(res, 'Episodes drawer list fetched successfully', {
        drama: {
          id: drama._id.toString(),
          title: drama.title,
          slug: drama.slug,
          posterUrl: drama.posterUrl,
          totalEpisodes: totalEpisodesCount,
          genreDisplay: genreNames.join(' / ') || 'Drama'
        },
        episodes: formattedEpisodes,
        pagination: {
          page,
          limit,
          total: totalEpisodesCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        userHasVip
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * 4. Sync Playback Progress (Scrubber & Heartbeat)
   * POST /api/v1/player/progress
   */
  static async recordProgress(req, res, next) {
    try {
      const { dramaId, episodeNumber = 1, watchedSeconds = 0, durationSeconds = 135 } = req.body;
      const user = req.user;

      const dramaQuery =
        mongoose.Types.ObjectId.isValid(dramaId) && dramaId.length === 24
          ? { _id: dramaId }
          : { slug: dramaId.toLowerCase().trim() };

      const drama = await Drama.findOne(dramaQuery);
      if (!drama) {
        throw new AppError('Drama series not found.', 404, 'DRAMA_NOT_FOUND');
      }

      const episode = await Episode.findOne({
        dramaId: drama._id,
        episodeNumber: Number(episodeNumber)
      });
      if (!episode) {
        throw new AppError('Episode not found.', 404, 'EPISODE_NOT_FOUND');
      }

      const totalDuration = durationSeconds > 0 ? durationSeconds : episode.durationSeconds || 135;
      const safeWatchedSecs = Math.min(Number(watchedSeconds), totalDuration);
      const calculatedPercentage = totalDuration > 0
        ? Math.min(100, Number(((safeWatchedSecs / totalDuration) * 100).toFixed(1)))
        : 0;

      const isCompleted = calculatedPercentage >= 90;

      // Update WatchHistory in MongoDB if user is authenticated
      if (user) {
        await WatchHistory.findOneAndUpdate(
          { userId: user._id, dramaId: drama._id },
          {
            $set: {
              episodeId: episode._id,
              seasonNumber: episode.seasonNumber || 1,
              episodeNumber: episode.episodeNumber,
              watchedSeconds: safeWatchedSecs,
              durationSeconds: totalDuration,
              progressPercentage: calculatedPercentage,
              isCompleted,
              lastWatchedAt: new Date()
            }
          },
          { upsert: true, new: true }
        );
      }

      // Increment view counts
      await Promise.all([
        Episode.findByIdAndUpdate(episode._id, { $inc: { viewsCount: 1 } }),
        Drama.findByIdAndUpdate(drama._id, { $inc: { viewsCount: 1 } })
      ]);

      return ApiResponse.success(res, 'Playback progress recorded successfully', {
        dramaId: drama._id.toString(),
        episodeNumber: episode.episodeNumber,
        watchedSeconds: safeWatchedSecs,
        formattedWatched: formatDuration(safeWatchedSecs),
        durationSeconds: totalDuration,
        formattedDuration: formatDuration(totalDuration),
        progressPercentage: calculatedPercentage,
        isCompleted
      });
    } catch (error) {
      return next(error);
    }
  }
}
