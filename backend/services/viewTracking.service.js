import crypto from 'crypto';
import mongoose from 'mongoose';
import { Drama } from '../models/Drama.js';
import { Episode } from '../models/Episode.js';
import { PlaybackView } from '../models/PlaybackView.js';

/**
 * SHA-256 helper for client privacy and anonymization
 */
const sha256 = (str = '') => {
  return crypto.createHash('sha256').update(String(str)).digest('hex');
};

/**
 * Format today's date 'YYYY-MM-DD'
 */
const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Resolve client platform (android, ios, web, unknown)
 */
const resolvePlatform = (userAgent = '', explicitPlatform = '') => {
  if (explicitPlatform) {
    const p = String(explicitPlatform).toLowerCase();
    if (['android', 'ios', 'web'].includes(p)) return p;
  }
  const ua = String(userAgent).toLowerCase();
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) return 'ios';
  if (ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari')) return 'web';
  return 'unknown';
};

class ViewTrackingService {
  /**
   * Minimum playback qualification threshold:
   * Real OTT industry standard: viewer must watch at least 10 seconds OR 20% of episode duration.
   * For ultra-short clips (< 15 seconds), minimum is 5 seconds.
   */
  qualifiesForRealView(watchedSeconds = 0, durationSeconds = 135, progressPercentage = 0) {
    const watched = Math.max(0, Number(watchedSeconds) || 0);
    const duration = Math.max(1, Number(durationSeconds) || 135);
    const percentage = Number(progressPercentage) || (watched / duration) * 100;

    if (duration <= 15) {
      return watched >= 5 || percentage >= 40;
    }

    return watched >= 10 || percentage >= 20;
  }

  /**
   * Extract or generate unique viewer identifier from request context
   */
  extractViewerContext(req = {}, customDeviceId = '') {
    const user = req.user || (req.userId ? { _id: req.userId } : null);
    const headers = req.headers || {};
    const query = req.query || {};
    const body = req.body || {};

    // 1. Authenticated viewer key
    if (user && user._id) {
      const userIdStr = user._id.toString();
      return {
        viewerKey: `user:${userIdStr}`,
        userId: user._id,
        isGuest: false,
        deviceId: customDeviceId || headers['x-device-id'] || headers['x-client-id'] || body.deviceId || query.deviceId || '',
        ipHash: '',
        userAgent: headers['user-agent'] || '',
        platform: resolvePlatform(headers['user-agent'], headers['x-platform'] || query.platform || body.platform)
      };
    }

    // 2. Anonymous / Guest viewer fingerprint
    const rawIp =
      headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      '127.0.0.1';

    const deviceId =
      customDeviceId ||
      headers['x-device-id'] ||
      headers['x-client-id'] ||
      body.deviceId ||
      query.deviceId ||
      '';

    const userAgent = headers['user-agent'] || '';
    const platform = resolvePlatform(userAgent, headers['x-platform'] || query.platform || body.platform);

    const ipH = sha256(rawIp).slice(0, 16);
    // Fingerprint combines IP + Device ID (or User Agent fallback)
    const rawFingerprint = `${rawIp}|${deviceId}|${userAgent}`;
    const fingerHash = sha256(rawFingerprint).slice(0, 32);

    return {
      viewerKey: `anon:${fingerHash}`,
      userId: null,
      isGuest: true,
      deviceId,
      ipHash: ipH,
      userAgent,
      platform
    };
  }

  /**
   * Process & Record Playback View with Intelligent Anti-Inflation & Deduplication.
   *
   * Cooldown window:
   * - Default: 30 minutes (1800 seconds).
   * - Multiple progress heartbeat pings (every 5-10 seconds) during the same watch session
   *   will NOT duplicate view counts.
   * - Only legitimate, qualified playback registers an official increment.
   */
  async recordPlaybackView({
    dramaId,
    episodeId,
    episodeNumber = 1,
    watchedSeconds = 0,
    durationSeconds = 135,
    progressPercentage = 0,
    req = {},
    customDeviceId = '',
    cooldownMinutes = 30,
    explicit = false,
    isTrailer = false,
    isLocked = false
  }) {
    const watched = Math.max(0, Number(watchedSeconds) || 0);
    const duration = Math.max(1, Number(durationSeconds) || 135);
    const calculatedPercentage = Math.min(100, Number(progressPercentage) || Number(((watched / duration) * 100).toFixed(1)));
    const isCompleted = calculatedPercentage >= 90;

    // 0. Trailer / Teaser Protection: Trailers and preview teasers must NEVER count as official episode views!
    const isTrailerView =
      Boolean(isTrailer) ||
      Boolean(req.body?.isTrailer) ||
      Boolean(req.query?.isTrailer) ||
      req.body?.mediaType === 'TRAILER' ||
      req.body?.contentType === 'TRAILER' ||
      req.body?.type === 'TRAILER' ||
      Number(episodeNumber) === 0 ||
      Boolean(req.body?.isLockedPreview);

    if (isTrailerView) {
      return {
        counted: false,
        reason: 'TRAILER_EXCLUDED',
        message: 'Trailer and preview teaser playbacks are strictly excluded from official episode stream counts.',
        watchedSeconds: watched,
        progressPercentage: calculatedPercentage
      };
    }

    // 0.1 Locked Episode Protection: Non-paying viewers watching a locked teaser preview cannot count as an episode stream
    if (Boolean(isLocked)) {
      return {
        counted: false,
        reason: 'LOCKED_EPISODE_EXCLUDED',
        message: 'Locked episode preview playbacks are strictly excluded from official stream counts.',
        watchedSeconds: watched,
        progressPercentage: calculatedPercentage
      };
    }

    // 1. Qualification check: ensure playback meets minimum viewing threshold
    const qualifies = explicit || this.qualifiesForRealView(watched, duration, calculatedPercentage);
    if (!qualifies) {
      return {
        counted: false,
        reason: 'THRESHOLD_NOT_MET',
        message: 'Playback has not yet reached the real view qualification threshold (minimum 10 seconds or 20%).',
        thresholdRequired: '10s or 20%',
        watchedSeconds: watched,
        progressPercentage: calculatedPercentage
      };
    }

    // 2. Extract unique viewer context
    const context = this.extractViewerContext(req, customDeviceId);
    const today = getTodayDateString();

    // 3. Deduplication & Active Cooldown Check
    const cooldownMs = Math.max(1, cooldownMinutes) * 60 * 1000;
    const cooldownSince = new Date(Date.now() - cooldownMs);

    const existingLog = await PlaybackView.findOne({
      viewerKey: context.viewerKey,
      episodeId,
      createdAt: { $gte: cooldownSince }
    }).sort({ createdAt: -1 });

    if (existingLog) {
      // Viewer is in active viewing session: update watch progress metrics without incrementing counters
      if (watched > (existingLog.watchedSeconds || 0)) {
        existingLog.watchedSeconds = watched;
        existingLog.progressPercentage = calculatedPercentage;
        existingLog.isCompleted = existingLog.isCompleted || isCompleted;
        await existingLog.save().catch(() => {});
      }

      const elapsedSeconds = Math.round((Date.now() - new Date(existingLog.createdAt).getTime()) / 1000);
      const remainingSeconds = Math.max(0, cooldownMinutes * 60 - elapsedSeconds);

      return {
        counted: false,
        reason: 'COOLDOWN_ACTIVE',
        message: 'View already credited for this session. Deduplication cooldown is active.',
        lastViewAt: existingLog.createdAt,
        cooldownRemainingSeconds: remainingSeconds
      };
    }

    // 4. Create legitimate audit log entry
    await PlaybackView.create({
      dramaId,
      episodeId,
      episodeNumber: Number(episodeNumber),
      userId: context.userId,
      viewerKey: context.viewerKey,
      ipHash: context.ipHash,
      deviceId: context.deviceId,
      userAgent: context.userAgent,
      platform: context.platform,
      watchedSeconds: watched,
      durationSeconds: duration,
      progressPercentage: calculatedPercentage,
      isCompleted,
      date: today
    });

    // 5. Atomically increment counters on Episode and Drama
    const [updatedEpisode, updatedDrama] = await Promise.all([
      Episode.findByIdAndUpdate(episodeId, { $inc: { viewsCount: 1 } }, { new: true }),
      Drama.findByIdAndUpdate(dramaId, { $inc: { viewsCount: 1 } }, { new: true })
    ]);

    return {
      counted: true,
      reason: 'QUALIFIED_REAL_VIEW',
      message: 'Legitimate real view verified and recorded successfully.',
      episodeViews: updatedEpisode?.viewsCount || 1,
      dramaViews: updatedDrama?.viewsCount || 1,
      viewerKey: context.viewerKey
    };
  }

  /**
   * Reconcile Drama View Count:
   * Recalculates and synchronizes Drama.viewsCount from the exact sum of Episode.viewsCount
   * to maintain 100% data integrity without any drift.
   */
  async reconcileDramaViews(dramaId) {
    const drama = await Drama.findById(dramaId);
    if (!drama) return null;

    const episodes = await Episode.find({ dramaId: drama._id }).select('viewsCount');
    const totalEpisodeViews = episodes.reduce((sum, ep) => sum + (ep.viewsCount || 0), 0);

    const prevViews = drama.viewsCount || 0;
    drama.viewsCount = totalEpisodeViews;
    await drama.save();

    return {
      dramaId: drama._id.toString(),
      title: drama.title,
      previousViews: prevViews,
      reconciledViews: totalEpisodeViews,
      totalEpisodesCount: episodes.length
    };
  }

  /**
   * Get Timeseries & Unique Viewers Analytics for a Drama
   */
  async getDramaViewAnalytics(dramaId, days = 30) {
    const drama = await Drama.findById(dramaId).select('title slug viewsCount totalEpisodes');
    if (!drama) return null;

    const daysCount = Math.min(90, Math.max(1, Number(days) || 30));
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysCount);
    const sinceDateStr = sinceDate.toISOString().split('T')[0];

    const logs = await PlaybackView.find({
      dramaId: drama._id,
      date: { $gte: sinceDateStr }
    }).lean();

    const uniqueViewersSet = new Set();
    const dailyMap = {};

    let totalLoggedViews = 0;
    let completedViews = 0;
    let totalWatchedSecs = 0;

    for (const log of logs) {
      totalLoggedViews++;
      uniqueViewersSet.add(log.viewerKey);
      if (log.isCompleted) completedViews++;
      totalWatchedSecs += log.watchedSeconds || 0;

      const d = log.date || 'Unknown';
      if (!dailyMap[d]) {
        dailyMap[d] = {
          date: d,
          views: 0,
          uniqueViewers: new Set(),
          completes: 0
        };
      }
      dailyMap[d].views++;
      dailyMap[d].uniqueViewers.add(log.viewerKey);
      if (log.isCompleted) dailyMap[d].completes++;
    }

    const dailyBreakdown = Object.keys(dailyMap)
      .sort()
      .map((k) => ({
        date: dailyMap[k].date,
        views: dailyMap[k].views,
        uniqueViewers: dailyMap[k].uniqueViewers.size,
        completes: dailyMap[k].completes
      }));

    const todayStr = getTodayDateString();
    const todayStats = dailyMap[todayStr] || { views: 0, uniqueViewers: new Set(), completes: 0 };

    const avgWatchDurationSeconds = totalLoggedViews > 0 ? Math.round(totalWatchedSecs / totalLoggedViews) : 0;
    const completionRate = totalLoggedViews > 0 ? `${((completedViews / totalLoggedViews) * 100).toFixed(1)}%` : '0.0%';

    return {
      drama: {
        id: drama._id.toString(),
        title: drama.title,
        slug: drama.slug,
        totalCatalogViews: drama.viewsCount || 0
      },
      summary: {
        totalLoggedViews,
        uniqueViewersCount: uniqueViewersSet.size,
        todayViews: todayStats.views,
        todayUniqueViewers: typeof todayStats.uniqueViewers.size === 'number' ? todayStats.uniqueViewers.size : 0,
        completedViews,
        completionRate,
        avgWatchDurationSeconds
      },
      dailyBreakdown
    };
  }
}

export const viewTrackingService = new ViewTrackingService();
