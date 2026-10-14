import crypto from 'crypto';
import { CustomAd } from '../models/CustomAd.js';
import { AdSetting } from '../models/AdSetting.js';
import { AdImpressionLog } from '../models/AdImpressionLog.js';
import { Drama } from '../models/Drama.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

// Google Official Test Ad Unit IDs (for safe SDK preview & developer sandbox testing)
export const GOOGLE_TEST_UNITS = {
  android: {
    appId: 'ca-app-pub-3940256099942544~3347511713',
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
    appOpen: 'ca-app-pub-3940256099942544/3419832817',
    native: 'ca-app-pub-3940256099942544/2247696110'
  },
  ios: {
    appId: 'ca-app-pub-3940256099942544~1458602516',
    banner: 'ca-app-pub-3940256099942544/2934735716',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
    appOpen: 'ca-app-pub-3940256099942544/5662855259',
    native: 'ca-app-pub-3940256099942544/3986624511'
  }
};

/**
 * Helper to ensure a global AdSetting document exists
 */
export const getOrCreateAdSettings = async () => {
  let settings = await AdSetting.findOne({ key: 'global' });
  if (!settings) {
    settings = await AdSetting.create({ key: 'global' });
  }
  return settings;
};

/**
 * Returns formatted date string 'YYYY-MM-DD'
 */
const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * SHA-256 helper
 */
const sha256 = (str = '') => {
  return crypto.createHash('sha256').update(String(str)).digest('hex');
};

/**
 * Helper to extract viewer identifier for ad impressions & frequency capping
 */
const extractAdViewerKey = (req = {}) => {
  const user = req.user || (req.userId ? { _id: req.userId } : null);
  const headers = req.headers || {};
  const query = req.query || {};
  const body = req.body || {};

  if (user && user._id) {
    return {
      viewerKey: `user:${user._id.toString()}`,
      userId: user._id,
      deviceId: headers['x-device-id'] || headers['x-client-id'] || body.deviceId || query.deviceId || '',
      ipHash: '',
      userAgent: headers['user-agent'] || ''
    };
  }

  const rawIp =
    headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1';

  const deviceId =
    headers['x-device-id'] ||
    headers['x-client-id'] ||
    body.deviceId ||
    query.deviceId ||
    '';

  const userAgent = headers['user-agent'] || '';
  const ipH = sha256(rawIp).slice(0, 16);
  const rawFingerprint = `${rawIp}|${deviceId}|${userAgent}`;
  const fingerHash = sha256(rawFingerprint).slice(0, 32);

  return {
    viewerKey: `anon:${fingerHash}`,
    userId: null,
    deviceId,
    ipHash: ipH,
    userAgent
  };
};

/**
 * Custom Ad Service handles all business logic, decision engine,
 * inventory management, and performance analytics.
 */
class CustomAdService {
  /**
   * List custom ad campaigns with flexible filters, sorting, pagination, and KPI metrics.
   */
  async getInventory(queryParams = {}) {
    const {
      page = 1,
      limit = 50,
      type = 'ALL',
      placement = 'ALL',
      status = 'ALL',
      device = 'ALL',
      search = '',
      sortBy = 'newest'
    } = queryParams;

    const skip = (Math.max(1, page) - 1) * limit;
    const filter = {};

    // 1. Filter by ad type / format
    if (type && type !== 'ALL') {
      filter.type = type.toUpperCase();
    }

    // 2. Filter by placement
    if (placement && placement !== 'ALL') {
      filter.placement = placement.toUpperCase();
    }

    // 3. Filter by status
    if (status && status !== 'ALL') {
      filter.status = status.toUpperCase();
    }

    // 4. Filter by target device
    if (device && device !== 'ALL') {
      filter.targetDevices = { $in: ['ALL', device.toUpperCase()] };
    }

    // 5. Search by campaign title or advertiser
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { advertiser: { $regex: q, $options: 'i' } }
      ];
    }

    // 6. Maintenance: Auto-expire campaigns past end date or capping limits
    const now = new Date();
    await CustomAd.updateMany(
      {
        endDate: { $ne: null, $lt: now },
        status: { $in: ['ACTIVE', 'SCHEDULED'] }
      },
      { $set: { status: 'EXPIRED' } }
    );

    // 7. Determine Sort criteria
    let sortCriteria = { priority: -1, createdAt: -1 };
    switch (sortBy) {
      case 'oldest':
        sortCriteria = { createdAt: 1 };
        break;
      case 'priority':
        sortCriteria = { priority: -1, createdAt: -1 };
        break;
      case 'impressions':
        sortCriteria = { impressionsCount: -1 };
        break;
      case 'clicks':
        sortCriteria = { clicksCount: -1 };
        break;
      case 'name':
        sortCriteria = { title: 1 };
        break;
      case 'newest':
      default:
        sortCriteria = { createdAt: -1 };
        break;
    }

    // 8. Execute queries concurrently
    const [ads, total, allAds] = await Promise.all([
      CustomAd.find(filter)
        .populate('targetDramaId', 'title slug posterUrl')
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit),
      CustomAd.countDocuments(filter),
      CustomAd.find({}, 'status impressionsCount clicksCount videoStarts videoCompletes').lean()
    ]);

    // 9. Compute high-level KPI stats
    const totalAds = allAds.length;
    const activeCount = allAds.filter((a) => a.status === 'ACTIVE').length;
    const pausedCount = allAds.filter((a) => a.status === 'PAUSED').length;
    const expiredCount = allAds.filter((a) => a.status === 'EXPIRED').length;
    const scheduledCount = allAds.filter((a) => a.status === 'SCHEDULED').length;

    const totalImpressions = allAds.reduce((sum, a) => sum + (a.impressionsCount || 0), 0);
    const totalClicks = allAds.reduce((sum, a) => sum + (a.clicksCount || 0), 0);
    const totalVideoStarts = allAds.reduce((sum, a) => sum + (a.videoStarts || 0), 0);
    const totalVideoCompletes = allAds.reduce((sum, a) => sum + (a.videoCompletes || 0), 0);

    const overallCtr = totalImpressions > 0
      ? `${((totalClicks / totalImpressions) * 100).toFixed(2)}%`
      : '0.00%';

    const overallVcr = totalVideoStarts > 0
      ? `${((totalVideoCompletes / totalVideoStarts) * 100).toFixed(2)}%`
      : '0.00%';

    return {
      ads,
      stats: {
        totalAds,
        activeCount,
        pausedCount,
        expiredCount,
        scheduledCount,
        totalImpressions,
        totalClicks,
        overallCtr,
        totalVideoStarts,
        totalVideoCompletes,
        overallVcr
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Create a new custom ad campaign
   */
  async create(data) {
    const payload = { ...data };

    // Auto set status to SCHEDULED if startDate is in the future
    if (payload.startDate && new Date(payload.startDate) > new Date() && payload.status === 'ACTIVE') {
      payload.status = 'SCHEDULED';
    }

    // Auto set mediaType if not specified
    if (!payload.mediaType) {
      payload.mediaType = payload.mediaUrl?.match(/\.(mp4|mov|webm)$/i) ? 'VIDEO' : 'IMAGE';
    }

    const newAd = await CustomAd.create(payload);
    return newAd;
  }

  /**
   * Get single custom ad with populated references
   */
  async getById(id) {
    const ad = await CustomAd.findById(id)
      .populate('targetDramaId', 'title slug posterUrl')
      .populate('targetDramas', 'title slug posterUrl');

    if (!ad) {
      throw new AppError('Custom ad campaign not found', 404, ERROR_CODES.VALIDATION_ERROR);
    }
    return ad;
  }

  /**
   * Update an existing custom ad
   */
  async update(id, updateData) {
    const payload = { ...updateData };

    // If dates changed, check if scheduled or expired
    const now = new Date();
    if (payload.endDate && new Date(payload.endDate) < now) {
      payload.status = 'EXPIRED';
    } else if (payload.startDate && new Date(payload.startDate) > now && payload.status === 'ACTIVE') {
      payload.status = 'SCHEDULED';
    }

    const updated = await CustomAd.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    )
      .populate('targetDramaId', 'title slug posterUrl')
      .populate('targetDramas', 'title slug posterUrl');

    if (!updated) {
      throw new AppError('Custom ad campaign not found', 404, ERROR_CODES.VALIDATION_ERROR);
    }
    return updated;
  }

  /**
   * Delete a custom ad
   */
  async delete(id) {
    const deleted = await CustomAd.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError('Custom ad campaign not found', 404, ERROR_CODES.VALIDATION_ERROR);
    }
    return deleted;
  }

  /**
   * Toggle status between ACTIVE and PAUSED
   */
  async toggleStatus(id) {
    const ad = await CustomAd.findById(id);
    if (!ad) {
      throw new AppError('Custom ad campaign not found', 404, ERROR_CODES.VALIDATION_ERROR);
    }

    ad.status = ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await ad.save();
    return ad;
  }

  /**
   * Reset stats for a campaign
   */
  async resetStats(id) {
    const ad = await CustomAd.findByIdAndUpdate(
      id,
      {
        $set: {
          impressionsCount: 0,
          clicksCount: 0,
          videoStarts: 0,
          videoFirstQuartile: 0,
          videoMidpoint: 0,
          videoThirdQuartile: 0,
          videoCompletes: 0,
          skipsCount: 0,
          dailyStats: []
        }
      },
      { new: true }
    );

    if (!ad) {
      throw new AppError('Custom ad campaign not found', 404, ERROR_CODES.VALIDATION_ERROR);
    }
    return ad;
  }

  /**
   * Bulk action on multiple campaigns (ACTIVATE, PAUSE, DELETE, RESET_STATS)
   */
  async bulkAction(action, ids = []) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('At least one ad ID must be provided.', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    let modifiedCount = 0;
    switch (action) {
      case 'ACTIVATE': {
        const res = await CustomAd.updateMany({ _id: { $in: ids } }, { $set: { status: 'ACTIVE' } });
        modifiedCount = res.modifiedCount;
        break;
      }
      case 'PAUSE': {
        const res = await CustomAd.updateMany({ _id: { $in: ids } }, { $set: { status: 'PAUSED' } });
        modifiedCount = res.modifiedCount;
        break;
      }
      case 'DELETE': {
        const res = await CustomAd.deleteMany({ _id: { $in: ids } });
        modifiedCount = res.deletedCount;
        break;
      }
      case 'RESET_STATS': {
        const res = await CustomAd.updateMany(
          { _id: { $in: ids } },
          {
            $set: {
              impressionsCount: 0,
              clicksCount: 0,
              videoStarts: 0,
              videoFirstQuartile: 0,
              videoMidpoint: 0,
              videoThirdQuartile: 0,
              videoCompletes: 0,
              skipsCount: 0,
              dailyStats: []
            }
          }
        );
        modifiedCount = res.modifiedCount;
        break;
      }
      default:
        throw new AppError(`Unknown action: ${action}`, 400, ERROR_CODES.VALIDATION_ERROR);
    }

    return { action, count: modifiedCount };
  }

  /**
   * Get timeseries analytics for a custom ad campaign (e.g. last 7, 14, 30 days)
   * Fills in missing dates with zero counters so charts render continuously.
   */
  async getAnalytics(id, days = 30) {
    const ad = await CustomAd.findById(id);
    if (!ad) {
      throw new AppError('Custom ad campaign not found', 404, ERROR_CODES.VALIDATION_ERROR);
    }

    const dayCount = Math.min(90, Math.max(1, Number(days) || 30));
    const datesMap = new Map();

    // Initialize date map for last `dayCount` days
    const now = new Date();
    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      datesMap.set(dateStr, {
        date: dateStr,
        impressions: 0,
        clicks: 0,
        videoStarts: 0,
        videoCompletes: 0,
        ctr: '0.00%'
      });
    }

    // Merge existing dailyStats
    if (Array.isArray(ad.dailyStats)) {
      ad.dailyStats.forEach((stat) => {
        if (datesMap.has(stat.date)) {
          const imps = stat.impressions || 0;
          const clks = stat.clicks || 0;
          const ctr = imps > 0 ? `${((clks / imps) * 100).toFixed(2)}%` : '0.00%';
          datesMap.set(stat.date, {
            date: stat.date,
            impressions: imps,
            clicks: clks,
            videoStarts: stat.videoStarts || 0,
            videoCompletes: stat.videoCompletes || 0,
            ctr
          });
        }
      });
    }

    const timeseries = Array.from(datesMap.values());
    const periodImpressions = timeseries.reduce((sum, d) => sum + d.impressions, 0);
    const periodClicks = timeseries.reduce((sum, d) => sum + d.clicks, 0);
    const periodCtr = periodImpressions > 0
      ? `${((periodClicks / periodImpressions) * 100).toFixed(2)}%`
      : '0.00%';

    return {
      campaign: {
        id: ad._id,
        title: ad.title,
        advertiser: ad.advertiser,
        status: ad.status,
        type: ad.type,
        placement: ad.placement,
        allTimeImpressions: ad.impressionsCount,
        allTimeClicks: ad.clicksCount,
        allTimeCtr: ad.ctr,
        videoFunnel: {
          starts: ad.videoStarts,
          firstQuartile: ad.videoFirstQuartile,
          midpoint: ad.videoMidpoint,
          thirdQuartile: ad.videoThirdQuartile,
          completes: ad.videoCompletes,
          skips: ad.skipsCount,
          completionRate: ad.completionRate
        }
      },
      periodStats: {
        days: dayCount,
        impressions: periodImpressions,
        clicks: periodClicks,
        ctr: periodCtr
      },
      timeseries
    };
  }

  /**
   * Get rotation and delivery engine settings
   */
  async getRotationSettings() {
    const settings = await getOrCreateAdSettings();
    return settings.customAdRotation || {
      enabled: true,
      policy: 'EQUAL_RANDOM',
      preventConsecutive: true,
      dailyGlobalImpressionCap: 0
    };
  }

  /**
   * Update rotation and delivery engine settings
   */
  async updateRotationSettings(data) {
    const settings = await getOrCreateAdSettings();
    settings.customAdRotation = {
      ...settings.customAdRotation,
      ...data
    };
    await settings.save();
    return settings.customAdRotation;
  }

  /**
   * AD DECISION ENGINE: Serve eligible ad (Custom In-House vs AdMob)
   */
  async serveAd(options = {}, req = {}) {
    const {
      placement,
      format,
      platform = 'android',
      page,
      isVip = false,
      dramaId,
      genre,
      excludeAdIds = ''
    } = options;

    const settings = await getOrCreateAdSettings();

    // 0. Global Master Switch
    if (settings.globalAdsEnabled === false) {
      return {
        showAd: false,
        reason: 'GLOBAL_ADS_DISABLED'
      };
    }

    // 1. VIP Subscriber Check: paid subscribers bypass all ads
    if (settings.vipBypassAds && (isVip === true || isVip === 'true')) {
      return {
        showAd: false,
        reason: 'VIP_SUBSCRIBER_EXEMPT'
      };
    }

    // 2. Granular Placement Slot Controls
    const slotKeyMap = {
      PLAYER_PREROLL: 'playerPreroll',
      EPISODE_TRANSITION: 'episodeTransition',
      HOME_BANNER: 'homeBanner',
      DRAWER_CARD: 'drawerCard',
      GLOBAL_POPUP: 'appOpen'
    };
    const currentSlot = slotKeyMap[placement?.toUpperCase()];
    const slotSetting = currentSlot && settings.placementControls?.[currentSlot];

    if (slotSetting && (slotSetting.enabled === false || slotSetting.mode === 'DISABLED')) {
      return {
        showAd: false,
        reason: 'PLACEMENT_SLOT_DISABLED'
      };
    }

    const isIos = String(platform).toLowerCase() === 'ios';
    const isWeb = String(platform).toLowerCase() === 'web';
    const testUnits = isIos ? GOOGLE_TEST_UNITS.ios : GOOGLE_TEST_UNITS.android;

    // Helper to build AdMob directive
    const buildAdMobDirective = (targetFormat) => {
      const fmtKey = (targetFormat || 'interstitial').toLowerCase();
      const unitId = settings.testMode
        ? testUnits[fmtKey] || testUnits.interstitial
        : (isIos ? settings.adUnits[fmtKey]?.ios : settings.adUnits[fmtKey]?.android);

      return {
        showAd: true,
        adSource: 'ADMOB',
        format: fmtKey.toUpperCase(),
        adMobUnitId: unitId,
        testMode: settings.testMode
      };
    };

    // 3. Mediation Mode Evaluation
    let shouldTryCustom = false;
    let allowFallback = true;

    if (slotSetting?.mode === 'CUSTOM_ONLY') {
      shouldTryCustom = true;
      allowFallback = false;
    } else if (slotSetting?.mode === 'ADMOB_ONLY') {
      shouldTryCustom = false;
      allowFallback = false;
    } else if (slotSetting?.mode === 'BOTH_CUSTOM_FIRST') {
      shouldTryCustom = true;
      allowFallback = true;
    } else if (settings.customAdsEnabled === false || settings.customAdRotation?.enabled === false) {
      shouldTryCustom = false;
    } else if (settings.admobEnabled === false) {
      shouldTryCustom = true;
      allowFallback = false;
    } else if (settings.mediationMode === 'CUSTOM_ONLY') {
      shouldTryCustom = true;
      allowFallback = false;
    } else if (settings.mediationMode === 'ADMOB_ONLY') {
      shouldTryCustom = false;
      allowFallback = false;
    } else if (settings.mediationMode === 'PERCENTAGE_SPLIT') {
      const roll = Math.random() * 100;
      shouldTryCustom = roll <= (settings.customAdSharePercent || 50);
    } else if (settings.mediationMode === 'CUSTOM_FIRST') {
      shouldTryCustom = true;
      allowFallback = true;
    } else {
      // ADMOB_FIRST
      shouldTryCustom = false;
      allowFallback = true;
    }

    // 4. Try Serving Custom Ad
    if (shouldTryCustom) {
      const now = new Date();
      const customFilter = {
        status: 'ACTIVE',
        startDate: { $lte: now },
        $or: [{ endDate: null }, { endDate: { $gte: now } }]
      };

      // Device targeting
      const clientPlatform = isWeb ? 'WEB' : isIos ? 'IOS' : 'ANDROID';
      customFilter.targetDevices = { $in: ['ALL', clientPlatform] };

      // Placement targeting
      if (placement && placement !== 'ALL') {
        customFilter.placement = { $in: ['ALL_PLACEMENTS', placement.toUpperCase()] };
      }

      // Format targeting
      if (format && format !== 'ALL') {
        customFilter.type = format.toUpperCase();
      }

      // Page targeting
      if (page && page !== 'ALL_PAGES') {
        customFilter.targetPage = { $in: ['ALL_PAGES', page.toUpperCase()] };
      }

      // Exclude recently shown ads if preventConsecutive is active
      const preventConsecutive = settings.customAdRotation?.preventConsecutive ?? true;
      if (preventConsecutive && excludeAdIds) {
        const excludedList = excludeAdIds.split(',').map((id) => id.trim()).filter(Boolean);
        if (excludedList.length > 0) {
          customFilter._id = { $nin: excludedList };
        }
      }

      // Query candidate ads
      let matchingAds = await CustomAd.find(customFilter)
        .populate('targetDramaId', 'title slug posterUrl')
        .lean();

      // Filter out ads that have hit total caps, daily impression caps, or user frequency caps
      const today = getTodayDateString();
      const viewerContext = extractAdViewerKey(req);
      const eligibleAds = [];

      for (const ad of matchingAds) {
        if (ad.cappingImpressions && (ad.impressionsCount || 0) >= ad.cappingImpressions) continue;
        if (ad.cappingClicks && (ad.clicksCount || 0) >= ad.cappingClicks) continue;

        // Daily impression cap check
        if (ad.dailyImpressionCap) {
          const todayStat = (ad.dailyStats || []).find((s) => s.date === today);
          if (todayStat && todayStat.impressions >= ad.dailyImpressionCap) continue;
        }

        // User frequency cap check
        if (ad.userFrequencyCap && viewerContext.viewerKey) {
          const userViewsToday = await AdImpressionLog.countDocuments({
            adId: ad._id,
            viewerKey: viewerContext.viewerKey,
            date: today
          });
          if (userViewsToday >= ad.userFrequencyCap) continue;
        }

        eligibleAds.push(ad);
      }
      matchingAds = eligibleAds;

      // Filter by genre or drama targeting if specified and applicable
      if (matchingAds.length > 0 && genre) {
        const genreSpecific = matchingAds.filter(
          (ad) => Array.isArray(ad.targetGenres) && ad.targetGenres.length > 0 && ad.targetGenres.includes(genre)
        );
        if (genreSpecific.length > 0) matchingAds = genreSpecific;
      }

      if (matchingAds.length > 0) {
        // Selection algorithm based on rotation policy
        const policy = settings.customAdRotation?.policy || 'EQUAL_RANDOM';
        let selectedAd = null;

        if (policy === 'PRIORITY_WEIGHTED') {
          // Weighted random lottery by priority (1 to 10)
          const totalWeight = matchingAds.reduce((acc, ad) => acc + (ad.priority || 5), 0);
          let randomWeight = Math.random() * totalWeight;
          for (const ad of matchingAds) {
            randomWeight -= (ad.priority || 5);
            if (randomWeight <= 0) {
              selectedAd = ad;
              break;
            }
          }
          if (!selectedAd) selectedAd = matchingAds[0];
        } else if (policy === 'CTR_OPTIMIZED') {
          // Sort by CTR, picking best performing
          matchingAds.sort((a, b) => {
            const ctrA = (a.impressionsCount > 0) ? (a.clicksCount / a.impressionsCount) : 0;
            const ctrB = (b.impressionsCount > 0) ? (b.clicksCount / b.impressionsCount) : 0;
            return ctrB - ctrA;
          });
          selectedAd = matchingAds[0];
        } else {
          // EQUAL_RANDOM
          const randomIndex = Math.floor(Math.random() * matchingAds.length);
          selectedAd = matchingAds[randomIndex];
        }

        // Return comprehensive ad payload with tracking URLs
        return {
          showAd: true,
          adSource: 'CUSTOM',
          ad: {
            id: selectedAd._id,
            title: selectedAd.title,
            advertiser: selectedAd.advertiser,
            type: selectedAd.type,
            placement: selectedAd.placement,
            mediaType: selectedAd.mediaType,
            mediaUrl: selectedAd.mediaUrl,
            thumbnailUrl: selectedAd.thumbnailUrl,
            companionBannerUrl: selectedAd.companionBannerUrl,
            aspectRatio: selectedAd.aspectRatio,
            videoDuration: selectedAd.videoDuration,
            skipAfterSeconds: selectedAd.skipAfterSeconds,
            ctaText: selectedAd.ctaText,
            ctaAction: selectedAd.ctaAction,
            targetUrl: selectedAd.targetUrl,
            targetWindow: selectedAd.targetWindow,
            targetDramaId: selectedAd.targetDramaId,
            tracking: {
              impressionUrl: `/api/v1/ads/track/${selectedAd._id}/impression`,
              clickUrl: `/api/v1/ads/track/${selectedAd._id}/click`,
              videoEventUrl: `/api/v1/ads/track/${selectedAd._id}/video-event`
            }
          }
        };
      }

      // If custom ad was preferred but none match: fallback to AdMob if enabled
      if (allowFallback && settings.admobEnabled && settings.mediationMode !== 'CUSTOM_ONLY') {
        return buildAdMobDirective(format);
      }
    } else {
      // AdMob preferred
      if (settings.admobEnabled) {
        return buildAdMobDirective(format);
      }

      // If AdMob was preferred but disabled: fallback to Custom Ad
      if (allowFallback) {
        const fallbackAd = await CustomAd.findOne({
          status: 'ACTIVE',
          startDate: { $lte: new Date() },
          $or: [{ endDate: null }, { endDate: { $gte: new Date() } }]
        }).sort({ priority: -1 });

        if (fallbackAd) {
          return {
            showAd: true,
            adSource: 'CUSTOM',
            ad: {
              id: fallbackAd._id,
              title: fallbackAd.title,
              advertiser: fallbackAd.advertiser,
              type: fallbackAd.type,
              placement: fallbackAd.placement,
              mediaType: fallbackAd.mediaType,
              mediaUrl: fallbackAd.mediaUrl,
              thumbnailUrl: fallbackAd.thumbnailUrl,
              aspectRatio: fallbackAd.aspectRatio,
              videoDuration: fallbackAd.videoDuration,
              skipAfterSeconds: fallbackAd.skipAfterSeconds,
              ctaText: fallbackAd.ctaText,
              ctaAction: fallbackAd.ctaAction,
              targetUrl: fallbackAd.targetUrl,
              targetWindow: fallbackAd.targetWindow,
              targetDramaId: fallbackAd.targetDramaId,
              tracking: {
                impressionUrl: `/api/v1/ads/track/${fallbackAd._id}/impression`,
                clickUrl: `/api/v1/ads/track/${fallbackAd._id}/click`,
                videoEventUrl: `/api/v1/ads/track/${fallbackAd._id}/video-event`
              }
            }
          };
        }
      }
    }

    return {
      showAd: false,
      reason: 'NO_INVENTORY'
    };
  }

  /**
   * Track Impression for a custom ad campaign.
   * Atomically updates impressionsCount and today's dailyStats breakdown.
   * Enforces 5-second burst anti-fraud debounce, dailyImpressionCap, userFrequencyCap, and auto-pauses when capped.
   */
  async recordImpression(id, req = {}) {
    const today = getTodayDateString();
    const context = extractAdViewerKey(req);

    const ad = await CustomAd.findById(id);
    if (!ad) {
      throw new AppError('Ad not found', 404, ERROR_CODES.VALIDATION_ERROR);
    }

    // 1. Anti-fraud / Rapid duplicate debounce (5 seconds)
    if (context.viewerKey) {
      const fiveSecsAgo = new Date(Date.now() - 5000);
      const recentLog = await AdImpressionLog.findOne({
        adId: id,
        viewerKey: context.viewerKey,
        createdAt: { $gte: fiveSecsAgo }
      });
      if (recentLog) {
        return {
          id: ad._id,
          impressionsCount: ad.impressionsCount,
          status: ad.status,
          deduplicated: true,
          message: 'Rapid duplicate impression debounced within 5s window.'
        };
      }
    }

    // 2. Check Daily Impression Cap
    if (ad.dailyImpressionCap) {
      const todayStat = (ad.dailyStats || []).find((s) => s.date === today);
      if (todayStat && todayStat.impressions >= ad.dailyImpressionCap) {
        return {
          id: ad._id,
          impressionsCount: ad.impressionsCount,
          status: ad.status,
          capped: true,
          reason: 'DAILY_IMPRESSION_CAP_REACHED'
        };
      }
    }

    // 3. Check User Frequency Cap
    if (ad.userFrequencyCap && context.viewerKey) {
      const userTodayCount = await AdImpressionLog.countDocuments({
        adId: id,
        viewerKey: context.viewerKey,
        date: today
      });
      if (userTodayCount >= ad.userFrequencyCap) {
        return {
          id: ad._id,
          impressionsCount: ad.impressionsCount,
          status: ad.status,
          capped: true,
          reason: 'USER_FREQUENCY_CAP_REACHED'
        };
      }
    }

    // 4. Log verified impression in AdImpressionLog
    if (context.viewerKey) {
      await AdImpressionLog.create({
        adId: ad._id,
        advertiser: ad.advertiser || '',
        userId: context.userId,
        viewerKey: context.viewerKey,
        ipHash: context.ipHash,
        deviceId: context.deviceId,
        userAgent: context.userAgent,
        placement: ad.placement,
        date: today
      }).catch(() => {});
    }

    // 5. Atomically increment today's dailyStats & total impressions
    let updated = await CustomAd.findOneAndUpdate(
      { _id: id, 'dailyStats.date': today },
      {
        $inc: {
          impressionsCount: 1,
          'dailyStats.$.impressions': 1
        }
      },
      { new: true }
    );

    // If no dailyStat for today exists yet, push a new entry
    if (!updated) {
      updated = await CustomAd.findByIdAndUpdate(
        id,
        {
          $inc: { impressionsCount: 1 },
          $push: {
            dailyStats: {
              date: today,
              impressions: 1,
              clicks: 0,
              videoStarts: 0,
              videoCompletes: 0
            }
          }
        },
        { new: true }
      );
    }

    // 6. Auto-expire if total cappingImpressions reached
    if (updated.cappingImpressions && updated.impressionsCount >= updated.cappingImpressions) {
      updated.status = 'EXPIRED';
      await updated.save();
    }

    return {
      id: updated._id,
      impressionsCount: updated.impressionsCount,
      status: updated.status,
      deduplicated: false
    };
  }

  /**
   * Track Click for a custom ad campaign.
   * Atomically updates clicksCount and today's dailyStats breakdown.
   * Auto-pauses if cappingClicks is reached.
   */
  async recordClick(id) {
    const today = getTodayDateString();

    // 1. Try to increment today's existing dailyStat entry
    let updated = await CustomAd.findOneAndUpdate(
      { _id: id, 'dailyStats.date': today },
      {
        $inc: {
          clicksCount: 1,
          'dailyStats.$.clicks': 1
        }
      },
      { new: true }
    );

    // 2. If no dailyStat for today exists yet, push a new entry
    if (!updated) {
      updated = await CustomAd.findByIdAndUpdate(
        id,
        {
          $inc: { clicksCount: 1 },
          $push: {
            dailyStats: {
              date: today,
              impressions: 0,
              clicks: 1,
              videoStarts: 0,
              videoCompletes: 0
            }
          }
        },
        { new: true }
      );
    }

    if (!updated) {
      throw new AppError('Ad not found', 404, ERROR_CODES.VALIDATION_ERROR);
    }

    // 3. Auto-pause if click cap reached
    if (updated.cappingClicks && updated.clicksCount >= updated.cappingClicks) {
      updated.status = 'EXPIRED';
      await updated.save();
    }

    return {
      id: updated._id,
      clicksCount: updated.clicksCount,
      targetUrl: updated.targetUrl,
      targetWindow: updated.targetWindow,
      targetDramaId: updated.targetDramaId,
      status: updated.status
    };
  }

  /**
   * Track VAST video funnel quartile event
   * eventType: 'start' | 'firstQuartile' | 'midpoint' | 'thirdQuartile' | 'complete' | 'skip'
   */
  async recordVideoEvent(id, eventType, progressSeconds = null) {
    const today = getTodayDateString();
    const fieldMap = {
      start: 'videoStarts',
      firstQuartile: 'videoFirstQuartile',
      midpoint: 'videoMidpoint',
      thirdQuartile: 'videoThirdQuartile',
      complete: 'videoCompletes',
      skip: 'skipsCount'
    };

    const targetField = fieldMap[eventType];
    if (!targetField) {
      throw new AppError(`Invalid video eventType: ${eventType}`, 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const incQuery = { [targetField]: 1 };

    // Also update dailyStats if start or complete
    if (eventType === 'start' || eventType === 'complete') {
      const dailyField = eventType === 'start' ? 'dailyStats.$.videoStarts' : 'dailyStats.$.videoCompletes';
      let updated = await CustomAd.findOneAndUpdate(
        { _id: id, 'dailyStats.date': today },
        { $inc: { ...incQuery, [dailyField]: 1 } },
        { new: true }
      );

      if (!updated) {
        updated = await CustomAd.findByIdAndUpdate(
          id,
          {
            $inc: incQuery,
            $push: {
              dailyStats: {
                date: today,
                impressions: 0,
                clicks: 0,
                videoStarts: eventType === 'start' ? 1 : 0,
                videoCompletes: eventType === 'complete' ? 1 : 0
              }
            }
          },
          { new: true }
        );
      }
      return { id: updated?._id, eventType, recorded: true };
    }

    const updated = await CustomAd.findByIdAndUpdate(
      id,
      { $inc: incQuery },
      { new: true }
    );

    if (!updated) {
      throw new AppError('Ad not found', 404, ERROR_CODES.VALIDATION_ERROR);
    }

    return { id: updated._id, eventType, recorded: true };
  }
}

export const customAdService = new CustomAdService();
