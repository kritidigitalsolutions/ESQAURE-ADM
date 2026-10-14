import { Router } from 'express';
import {
  getAdSettings,
  updateAdSettings,
  getRotationSettings,
  updateRotationSettings,
  getCustomAds,
  createCustomAd,
  getCustomAdById,
  updateCustomAd,
  deleteCustomAd,
  toggleCustomAdStatus,
  resetCustomAdStats,
  getCustomAdAnalytics,
  bulkCustomAdsAction,
  getMobileAdsConfig,
  serveAd,
  trackImpression,
  trackClick,
  trackVideoEvent
} from '../controllers/ad.controller.js';
import { verifyAdmin } from '../middlewares/adminAuth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { adValidation } from '../validations/ad.validation.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN PANEL ROUTES (/api/v1/ads) - Protected
// ─────────────────────────────────────────────────────────────────────────────

/** AdMob & Mediation Master Settings */
router.get('/settings', verifyAdmin, getAdSettings);
router.put('/settings', verifyAdmin, updateAdSettings);

/** In-House Custom Ads Rotation & Delivery Policy */
router.get('/custom/rotation-settings', verifyAdmin, getRotationSettings);
router.put(
  '/custom/rotation-settings',
  verifyAdmin,
  validate(adValidation.rotationSettings, 'body'),
  updateRotationSettings
);

/** Bulk Mass Action (Activate, Pause, Delete, Reset Stats) */
router.post(
  '/custom/bulk-action',
  verifyAdmin,
  validate(adValidation.bulkAction, 'body'),
  bulkCustomAdsAction
);

/** Custom Direct Sponsor Ads CRUD & Analytics */
router.get('/custom', verifyAdmin, validate(adValidation.customAdsQuery, 'query'), getCustomAds);
router.post('/custom', verifyAdmin, validate(adValidation.createCustomAd, 'body'), createCustomAd);
router.get('/custom/:id', verifyAdmin, getCustomAdById);
router.put('/custom/:id', verifyAdmin, validate(adValidation.updateCustomAd, 'body'), updateCustomAd);
router.delete('/custom/:id', verifyAdmin, deleteCustomAd);
router.patch('/custom/:id/toggle', verifyAdmin, toggleCustomAdStatus);
router.post('/custom/:id/reset-stats', verifyAdmin, resetCustomAdStats);
router.get(
  '/custom/:id/analytics',
  verifyAdmin,
  validate(adValidation.analyticsQuery, 'query'),
  getCustomAdAnalytics
);

// ─────────────────────────────────────────────────────────────────────────────
//  MOBILE & CLIENT APP ROUTES (/api/v1/ads)
// ─────────────────────────────────────────────────────────────────────────────

/** Client Ad Network Configuration & Format IDs */
router.get('/config', getMobileAdsConfig);

/** Dynamic Mediation Ad Server (decides Custom vs AdMob) */
router.get('/serve', validate(adValidation.serveAdQuery, 'query'), serveAd);

/** Custom Ad Tracking (Impressions, Clicks, VAST Video Funnel Quartiles) */
router.post('/track/:id/impression', trackImpression);
router.post('/track/:id/click', trackClick);
router.post(
  '/track/:id/video-event',
  validate(adValidation.trackVideoEvent, 'body'),
  trackVideoEvent
);

export default router;
