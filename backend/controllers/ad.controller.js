import { AdSetting } from '../models/AdSetting.js';
import { CustomAd } from '../models/CustomAd.js';
import { Drama } from '../models/Drama.js';
import { ApiResponse } from '../utils/apiResponse.js';

// Google Official Test Ad Unit IDs (for safe SDK preview & developer sandbox testing)
const GOOGLE_TEST_UNITS = {
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
const getOrCreateAdSettings = async () => {
  let settings = await AdSetting.findOne({ key: 'global' });
  if (!settings) {
    settings = await AdSetting.create({ key: 'global' });
  }
  return settings;
};

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/ads/settings
 * Fetch current AdMob configuration, mediation strategy, and platform analytics
 */
export const getAdSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateAdSettings();

    // Compute stats for custom ads
    const allCustomAds = await CustomAd.find({}).lean();
    const totalCustomAds = allCustomAds.length;
    const activeCustomAds = allCustomAds.filter((a) => a.status === 'ACTIVE').length;
    const pausedCustomAds = allCustomAds.filter((a) => a.status === 'PAUSED').length;
    const totalCustomImpressions = allCustomAds.reduce((sum, a) => sum + (a.impressionsCount || 0), 0);
    const totalCustomClicks = allCustomAds.reduce((sum, a) => sum + (a.clicksCount || 0), 0);
    const customCtr = totalCustomImpressions > 0
      ? `${((totalCustomClicks / totalCustomImpressions) * 100).toFixed(2)}%`
      : '0.00%';

    return ApiResponse.success(res, 'Ad settings retrieved successfully', {
      settings,
      googleTestUnits: GOOGLE_TEST_UNITS,
      customAdsStats: {
        total: totalCustomAds,
        active: activeCustomAds,
        paused: pausedCustomAds,
        impressions: totalCustomImpressions,
        clicks: totalCustomClicks,
        ctr: customCtr
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/ads/settings
 * Update AdMob settings, unit IDs, and mediation rules
 */
export const updateAdSettings = async (req, res, next) => {
  try {
    const {
      globalAdsEnabled,
      customAdsEnabled,
      admobEnabled,
      testMode,
      androidAppId,
      iosAppId,
      adUnits,
      mediationMode,
      customAdSharePercent,
      placementControls,
      vipBypassAds,
      globalAdFrequencyCap
    } = req.body;

    const updateFields = {};
    if (globalAdsEnabled !== undefined) updateFields.globalAdsEnabled = Boolean(globalAdsEnabled);
    if (customAdsEnabled !== undefined) updateFields.customAdsEnabled = Boolean(customAdsEnabled);
    if (admobEnabled !== undefined) updateFields.admobEnabled = Boolean(admobEnabled);
    if (testMode !== undefined) updateFields.testMode = Boolean(testMode);
    if (androidAppId !== undefined) updateFields.androidAppId = String(androidAppId).trim();
    if (iosAppId !== undefined) updateFields.iosAppId = String(iosAppId).trim();
    if (adUnits !== undefined) updateFields.adUnits = adUnits;
    if (mediationMode !== undefined) updateFields.mediationMode = mediationMode;
    if (customAdSharePercent !== undefined) updateFields.customAdSharePercent = Number(customAdSharePercent);
    if (placementControls !== undefined) updateFields.placementControls = placementControls;
    if (vipBypassAds !== undefined) updateFields.vipBypassAds = Boolean(vipBypassAds);
    if (globalAdFrequencyCap !== undefined) updateFields.globalAdFrequencyCap = Number(globalAdFrequencyCap);

    const updated = await AdSetting.findOneAndUpdate(
      { key: 'global' },
      { $set: updateFields },
      { new: true, upsert: true, runValidators: true }
    );

    return ApiResponse.success(res, 'Ad settings updated successfully', { settings: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/ads/custom
 * Fetch all custom direct sponsor ads with filtering & pagination
 */
export const getCustomAds = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const filter = {};

    // Filter by format type
    if (req.query.type && req.query.type !== 'ALL') {
      filter.type = req.query.type.toUpperCase();
    }

    // Filter by placement
    if (req.query.placement && req.query.placement !== 'ALL') {
      filter.placement = req.query.placement.toUpperCase();
    }

    // Filter by status
    if (req.query.status && req.query.status !== 'ALL') {
      filter.status = req.query.status.toUpperCase();
    }

    // Search by title or advertiser
    if (req.query.search) {
      const q = req.query.search.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { advertiser: { $regex: q, $options: 'i' } }
      ];
    }

    // Auto update expired campaigns before query
    await CustomAd.updateMany(
      { endDate: { $ne: null, $lt: new Date() }, status: { $ne: 'EXPIRED' } },
      { $set: { status: 'EXPIRED' } }
    );

    const [ads, total] = await Promise.all([
      CustomAd.find(filter)
        .populate('targetDramaId', 'title slug posterUrl')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CustomAd.countDocuments(filter)
    ]);

    // Aggregate stats across all custom ads
    const allAds = await CustomAd.find({}).lean();
    const activeCount = allAds.filter((a) => a.status === 'ACTIVE').length;
    const pausedCount = allAds.filter((a) => a.status === 'PAUSED').length;
    const expiredCount = allAds.filter((a) => a.status === 'EXPIRED').length;
    const totalImpressions = allAds.reduce((sum, a) => sum + (a.impressionsCount || 0), 0);
    const totalClicks = allAds.reduce((sum, a) => sum + (a.clicksCount || 0), 0);
    const overallCtr = totalImpressions > 0
      ? `${((totalClicks / totalImpressions) * 100).toFixed(2)}%`
      : '0.00%';

    return ApiResponse.success(res, 'Custom ads fetched successfully', {
      ads,
      stats: {
        totalAds: allAds.length,
        activeCount,
        pausedCount,
        expiredCount,
        totalImpressions,
        totalClicks,
        overallCtr
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/ads/custom
 * Create a new custom ad campaign
 */
export const createCustomAd = async (req, res, next) => {
  try {
    const {
      title,
      advertiser,
      type,
      placement,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      videoDuration,
      skipAfterSeconds,
      ctaText,
      ctaAction,
      targetUrl,
      targetDramaId,
      status,
      priority,
      startDate,
      endDate,
      targetGenres
    } = req.body;

    if (!title || !advertiser || !type || !mediaUrl) {
      return ApiResponse.error(
        res,
        'Title, advertiser name, ad type and media URL are required',
        'VALIDATION_ERROR',
        400
      );
    }

    const newAd = await CustomAd.create({
      title: title.trim(),
      advertiser: advertiser.trim(),
      type,
      placement: placement || 'ALL_PLACEMENTS',
      mediaType: mediaType || (mediaUrl.match(/\.(mp4|mov|webm)$/i) ? 'VIDEO' : 'IMAGE'),
      mediaUrl: mediaUrl.trim(),
      thumbnailUrl: thumbnailUrl?.trim() || '',
      videoDuration: videoDuration ? Number(videoDuration) : 15,
      skipAfterSeconds: skipAfterSeconds !== undefined ? Number(skipAfterSeconds) : 5,
      ctaText: ctaText ? ctaText.trim() : 'Learn More',
      ctaAction: ctaAction || 'EXTERNAL_URL',
      targetUrl: targetUrl?.trim() || '',
      targetDramaId: targetDramaId || null,
      status: status || 'ACTIVE',
      priority: priority !== undefined ? Number(priority) : 5,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      targetGenres: Array.isArray(targetGenres) ? targetGenres : []
    });

    return ApiResponse.success(res, 'Custom ad created successfully', { ad: newAd }, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/ads/custom/:id
 * Get single custom ad
 */
export const getCustomAdById = async (req, res, next) => {
  try {
    const ad = await CustomAd.findById(req.params.id).populate('targetDramaId', 'title slug posterUrl');
    if (!ad) {
      return ApiResponse.error(res, 'Custom ad not found', 'NOT_FOUND', 404);
    }
    return ApiResponse.success(res, 'Custom ad details retrieved', { ad });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/ads/custom/:id
 * Update an existing custom ad
 */
export const updateCustomAd = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.title) updateData.title = updateData.title.trim();
    if (updateData.advertiser) updateData.advertiser = updateData.advertiser.trim();
    if (updateData.mediaUrl) updateData.mediaUrl = updateData.mediaUrl.trim();
    if (updateData.priority !== undefined) updateData.priority = Number(updateData.priority);
    if (updateData.videoDuration !== undefined) updateData.videoDuration = Number(updateData.videoDuration);
    if (updateData.skipAfterSeconds !== undefined) updateData.skipAfterSeconds = Number(updateData.skipAfterSeconds);
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    const updated = await CustomAd.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
    if (!updated) {
      return ApiResponse.error(res, 'Custom ad not found', 'NOT_FOUND', 404);
    }

    return ApiResponse.success(res, 'Custom ad updated successfully', { ad: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/ads/custom/:id
 * Delete a custom ad
 */
export const deleteCustomAd = async (req, res, next) => {
  try {
    const deleted = await CustomAd.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return ApiResponse.error(res, 'Custom ad not found', 'NOT_FOUND', 404);
    }
    return ApiResponse.success(res, 'Custom ad deleted successfully', { id: req.params.id });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/ads/custom/:id/toggle
 * Toggle custom ad status between ACTIVE and PAUSED
 */
export const toggleCustomAdStatus = async (req, res, next) => {
  try {
    const ad = await CustomAd.findById(req.params.id);
    if (!ad) {
      return ApiResponse.error(res, 'Custom ad not found', 'NOT_FOUND', 404);
    }

    ad.status = ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await ad.save();

    return ApiResponse.success(res, `Custom ad status changed to ${ad.status}`, {
      id: ad._id,
      status: ad.status
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/ads/custom/:id/reset-stats
 * Reset impressions and clicks counts
 */
export const resetCustomAdStats = async (req, res, next) => {
  try {
    const ad = await CustomAd.findByIdAndUpdate(
      req.params.id,
      { $set: { impressionsCount: 0, clicksCount: 0 } },
      { new: true }
    );
    if (!ad) {
      return ApiResponse.error(res, 'Custom ad not found', 'NOT_FOUND', 404);
    }
    return ApiResponse.success(res, 'Custom ad analytics reset successfully', { ad });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  MOBILE / CLIENT APP ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/ads/config
 * Returns public ad network setup and format unit IDs for mobile apps
 */
export const getMobileAdsConfig = async (req, res, next) => {
  try {
    const settings = await getOrCreateAdSettings();
    const platform = (req.query.platform || 'android').toLowerCase();
    const isIos = platform === 'ios';

    const testUnits = isIos ? GOOGLE_TEST_UNITS.ios : GOOGLE_TEST_UNITS.android;
    const realUnits = settings.adUnits;

    // Pick test unit ID or real unit ID according to testMode
    const resolveUnitId = (format) => {
      if (settings.testMode) {
        return testUnits[format] || '';
      }
      return isIos ? realUnits[format]?.ios : realUnits[format]?.android;
    };

    return ApiResponse.success(res, 'Mobile ads configuration retrieved', {
      admobEnabled: settings.admobEnabled,
      testMode: settings.testMode,
      appId: settings.testMode ? testUnits.appId : (isIos ? settings.iosAppId : settings.androidAppId),
      adUnits: {
        banner: {
          id: resolveUnitId('banner'),
          enabled: realUnits.banner?.enabled ?? true
        },
        interstitial: {
          id: resolveUnitId('interstitial'),
          enabled: realUnits.interstitial?.enabled ?? true,
          intervalEpisodes: realUnits.interstitial?.intervalEpisodes || 3
        },
        rewarded: {
          id: resolveUnitId('rewarded'),
          enabled: realUnits.rewarded?.enabled ?? true,
          rewardDescription: realUnits.rewarded?.rewardDescription || 'Unlock Episode'
        },
        appOpen: {
          id: resolveUnitId('appOpen'),
          enabled: realUnits.appOpen?.enabled ?? false
        },
        native: {
          id: resolveUnitId('native'),
          enabled: realUnits.native?.enabled ?? true
        }
      },
      mediationMode: settings.mediationMode,
      vipBypassAds: settings.vipBypassAds,
      frequencyCap: {
        maxPerHour: settings.globalAdFrequencyCap
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/ads/serve
 * Dynamic mediation ad serving endpoint: decides between Custom In-House Ad vs AdMob
 * Query parameters: placement, format, platform, isVip, genre
 */
export const serveAd = async (req, res, next) => {
  try {
    const { placement, format, platform = 'android', isVip, genre } = req.query;
    const settings = await getOrCreateAdSettings();

    // 0. Global Master Switch Check
    if (settings.globalAdsEnabled === false) {
      return ApiResponse.success(res, 'All ads globally disabled by admin', {
        showAd: false,
        reason: 'GLOBAL_ADS_DISABLED'
      });
    }

    // 1. VIP Subscriber Protection: automatically exempt from ads
    if (settings.vipBypassAds && (isVip === 'true' || isVip === true)) {
      return ApiResponse.success(res, 'User is VIP subscriber; ad delivery bypassed', {
        showAd: false,
        reason: 'VIP_SUBSCRIBER_EXEMPT'
      });
    }

    // 2. Granular Placement Slot Controls Check
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
      return ApiResponse.success(res, 'This ad placement slot is currently disabled', {
        showAd: false,
        reason: 'PLACEMENT_SLOT_DISABLED'
      });
    }

    const isIos = platform.toLowerCase() === 'ios';
    const testUnits = isIos ? GOOGLE_TEST_UNITS.ios : GOOGLE_TEST_UNITS.android;

    // Helper to format AdMob response
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

    // 3. Mediation Mode Evaluation (Synchronized Waterfall)
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
    } else if (settings.customAdsEnabled === false) {
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

    // Try finding custom ad if eligible
    if (shouldTryCustom) {
      const now = new Date();
      const customFilter = {
        status: 'ACTIVE',
        startDate: { $lte: now },
        $or: [{ endDate: null }, { endDate: { $gte: now } }]
      };

      if (placement && placement !== 'ALL') {
        customFilter.$or = [
          { placement: placement.toUpperCase() },
          { placement: 'ALL_PLACEMENTS' }
        ];
      }

      if (format && format !== 'ALL') {
        customFilter.type = format.toUpperCase();
      }

      const matchingAds = await CustomAd.find(customFilter)
        .populate('targetDramaId', 'title slug posterUrl')
        .sort({ priority: -1, createdAt: -1 })
        .limit(10);

      if (matchingAds.length > 0) {
        // Pick top priority ad (or randomize among top equal priority)
        const selectedAd = matchingAds[0];
        return ApiResponse.success(res, 'Custom ad served', {
          showAd: true,
          adSource: 'CUSTOM',
          ad: selectedAd
        });
      }

      // If custom ad was preferred but none active: fallback to AdMob if enabled
      if (allowFallback && settings.admobEnabled && settings.mediationMode !== 'CUSTOM_ONLY') {
        return ApiResponse.success(res, 'Fallback to AdMob unit', buildAdMobDirective(format));
      }
    } else {
      // AdMob preferred
      if (settings.admobEnabled) {
        return ApiResponse.success(res, 'AdMob unit served', buildAdMobDirective(format));
      }

      // If AdMob was preferred but disabled: fallback to Custom Ad
      if (allowFallback) {
        const matchingAd = await CustomAd.findOne({
          status: 'ACTIVE',
          startDate: { $lte: new Date() },
          $or: [{ endDate: null }, { endDate: { $gte: new Date() } }]
        }).sort({ priority: -1 });

        if (matchingAd) {
          return ApiResponse.success(res, 'Fallback to Custom ad', {
            showAd: true,
            adSource: 'CUSTOM',
            ad: matchingAd
          });
        }
      }
    }

    return ApiResponse.success(res, 'No eligible ads available for delivery', {
      showAd: false,
      reason: 'NO_INVENTORY'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/ads/track/:id/impression
 * Track an impression for a custom ad
 */
export const trackImpression = async (req, res, next) => {
  try {
    const updated = await CustomAd.findByIdAndUpdate(
      req.params.id,
      { $inc: { impressionsCount: 1 } },
      { new: true }
    );
    if (!updated) {
      return ApiResponse.error(res, 'Ad not found', 'NOT_FOUND', 404);
    }
    return ApiResponse.success(res, 'Impression logged', {
      id: updated._id,
      impressionsCount: updated.impressionsCount
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/ads/track/:id/click
 * Track a click for a custom ad
 */
export const trackClick = async (req, res, next) => {
  try {
    const updated = await CustomAd.findByIdAndUpdate(
      req.params.id,
      { $inc: { clicksCount: 1 } },
      { new: true }
    );
    if (!updated) {
      return ApiResponse.error(res, 'Ad not found', 'NOT_FOUND', 404);
    }
    return ApiResponse.success(res, 'Click logged', {
      id: updated._id,
      clicksCount: updated.clicksCount,
      targetUrl: updated.targetUrl,
      targetDramaId: updated.targetDramaId
    });
  } catch (err) {
    next(err);
  }
};
