import { AdSetting } from '../models/AdSetting.js';
import {
  customAdService,
  GOOGLE_TEST_UNITS,
  getOrCreateAdSettings
} from '../services/customAd.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN PANEL CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/ads/settings
 * Fetch AdMob configuration, mediation strategy, and platform analytics
 */
export const getAdSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateAdSettings();
    const inventory = await customAdService.getInventory({ limit: 1 });

    return ApiResponse.success(res, 'Ad settings retrieved successfully', {
      settings,
      googleTestUnits: GOOGLE_TEST_UNITS,
      customAdsStats: inventory.stats
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
      publisherAccountId,
      appPackageName,
      oauthClientId,
      oauthClientSecret,
      oauthRefreshToken,
      adUnits,
      mediationMode,
      customAdSharePercent,
      placementControls,
      vipBypassAds,
      globalAdFrequencyCap,
      websiteControls,
      customAdRotation
    } = req.body;

    const updateFields = {};
    if (globalAdsEnabled !== undefined) updateFields.globalAdsEnabled = Boolean(globalAdsEnabled);
    if (customAdsEnabled !== undefined) updateFields.customAdsEnabled = Boolean(customAdsEnabled);
    if (admobEnabled !== undefined) updateFields.admobEnabled = Boolean(admobEnabled);
    if (testMode !== undefined) updateFields.testMode = Boolean(testMode);
    if (androidAppId !== undefined) updateFields.androidAppId = String(androidAppId).trim();
    if (iosAppId !== undefined) updateFields.iosAppId = String(iosAppId).trim();
    if (publisherAccountId !== undefined) updateFields.publisherAccountId = String(publisherAccountId).trim();
    if (appPackageName !== undefined) updateFields.appPackageName = String(appPackageName).trim();
    if (oauthClientId !== undefined) updateFields.oauthClientId = String(oauthClientId).trim();
    if (oauthClientSecret !== undefined) updateFields.oauthClientSecret = String(oauthClientSecret).trim();
    if (oauthRefreshToken !== undefined) updateFields.oauthRefreshToken = String(oauthRefreshToken).trim();
    if (adUnits !== undefined) updateFields.adUnits = adUnits;
    if (mediationMode !== undefined) updateFields.mediationMode = mediationMode;
    if (customAdSharePercent !== undefined) updateFields.customAdSharePercent = Number(customAdSharePercent);
    if (placementControls !== undefined) updateFields.placementControls = placementControls;
    if (vipBypassAds !== undefined) updateFields.vipBypassAds = Boolean(vipBypassAds);
    if (globalAdFrequencyCap !== undefined) updateFields.globalAdFrequencyCap = Number(globalAdFrequencyCap);
    if (websiteControls !== undefined) updateFields.websiteControls = websiteControls;
    if (customAdRotation !== undefined) updateFields.customAdRotation = customAdRotation;

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
 * GET /api/v1/ads/custom/rotation-settings
 * Retrieve custom ad in-house delivery & rotation policy
 */
export const getRotationSettings = async (req, res, next) => {
  try {
    const rotationSettings = await customAdService.getRotationSettings();
    return ApiResponse.success(res, 'Custom ads rotation settings retrieved', { rotationSettings });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/ads/custom/rotation-settings
 * Update custom ad delivery policy & consecutive rotation prevention
 */
export const updateRotationSettings = async (req, res, next) => {
  try {
    const rotationSettings = await customAdService.updateRotationSettings(req.body);
    return ApiResponse.success(res, 'Custom ads rotation settings updated', { rotationSettings });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/ads/custom
 * Fetch custom direct sponsor ads with advanced filtering, sorting & pagination
 */
export const getCustomAds = async (req, res, next) => {
  try {
    const result = await customAdService.getInventory(req.query);
    return ApiResponse.success(res, 'Custom ads fetched successfully', result);
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
    const newAd = await customAdService.create(req.body);
    return ApiResponse.success(res, 'Custom ad campaign created successfully', { ad: newAd }, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/ads/custom/:id
 * Get single custom ad details
 */
export const getCustomAdById = async (req, res, next) => {
  try {
    const ad = await customAdService.getById(req.params.id);
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
    const updated = await customAdService.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Custom ad updated successfully', { ad: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/ads/custom/:id
 * Delete a custom ad campaign
 */
export const deleteCustomAd = async (req, res, next) => {
  try {
    await customAdService.delete(req.params.id);
    return ApiResponse.success(res, 'Custom ad campaign deleted successfully', { id: req.params.id });
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
    const ad = await customAdService.toggleStatus(req.params.id);
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
 * Reset impressions, clicks, and video funnel analytics
 */
export const resetCustomAdStats = async (req, res, next) => {
  try {
    const ad = await customAdService.resetStats(req.params.id);
    return ApiResponse.success(res, 'Custom ad analytics reset successfully', { ad });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/ads/custom/:id/analytics
 * Retrieve timeseries performance analytics (impressions, clicks, CTR, VAST funnel)
 */
export const getCustomAdAnalytics = async (req, res, next) => {
  try {
    const days = req.query.days || 30;
    const analytics = await customAdService.getAnalytics(req.params.id, days);
    return ApiResponse.success(res, 'Custom ad timeseries analytics retrieved', analytics);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/ads/custom/bulk-action
 * Perform mass operations on multiple campaigns (ACTIVATE, PAUSE, DELETE, RESET_STATS)
 */
export const bulkCustomAdsAction = async (req, res, next) => {
  try {
    const { action, ids } = req.body;
    const result = await customAdService.bulkAction(action, ids);
    return ApiResponse.success(res, `Bulk action '${action}' completed successfully`, result);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  CLIENT / MOBILE / WEB APP CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/ads/config
 * Returns public ad network setup and format unit IDs for mobile & web apps
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
      globalAdsEnabled: settings.globalAdsEnabled,
      customAdsEnabled: settings.customAdsEnabled,
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
 * Dynamic Mediation Ad Server: Decides between Custom In-House Sponsor vs AdMob
 */
export const serveAd = async (req, res, next) => {
  try {
    const decision = await customAdService.serveAd(req.query, req);
    return ApiResponse.success(res, decision.showAd ? 'Ad served' : (decision.reason || 'No ad'), decision);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/ads/track/:id/impression
 * Record an impression for a custom ad campaign
 */
export const trackImpression = async (req, res, next) => {
  try {
    const result = await customAdService.recordImpression(req.params.id, req);
    return ApiResponse.success(res, 'Impression recorded successfully', result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/ads/track/:id/click
 * Record a click for a custom ad campaign
 */
export const trackClick = async (req, res, next) => {
  try {
    const result = await customAdService.recordClick(req.params.id, req);
    return ApiResponse.success(res, 'Click recorded successfully', result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/ads/track/:id/video-event
 * Record a VAST video player milestone (start, firstQuartile, midpoint, thirdQuartile, complete, skip)
 */
export const trackVideoEvent = async (req, res, next) => {
  try {
    const { eventType, progressSeconds } = req.body;
    const result = await customAdService.recordVideoEvent(req.params.id, eventType, progressSeconds);
    return ApiResponse.success(res, `Video event '${eventType}' recorded`, result);
  } catch (err) {
    next(err);
  }
};
