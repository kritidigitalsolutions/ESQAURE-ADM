import { Router } from 'express';
import {
  getAdSettings,
  updateAdSettings,
  getCustomAds,
  createCustomAd,
  getCustomAdById,
  updateCustomAd,
  deleteCustomAd,
  toggleCustomAdStatus,
  resetCustomAdStats,
  getMobileAdsConfig,
  serveAd,
  trackImpression,
  trackClick
} from '../controllers/ad.controller.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN PANEL ROUTES (/api/v1/ads)
// ─────────────────────────────────────────────────────────────────────────────

/** AdMob & Mediation Settings */
router.get('/settings', getAdSettings);
router.put('/settings', updateAdSettings);

/** Custom Direct Sponsor Ads CRUD */
router.get('/custom', getCustomAds);
router.post('/custom', createCustomAd);
router.get('/custom/:id', getCustomAdById);
router.put('/custom/:id', updateCustomAd);
router.delete('/custom/:id', deleteCustomAd);
router.patch('/custom/:id/toggle', toggleCustomAdStatus);
router.post('/custom/:id/reset-stats', resetCustomAdStats);

// ─────────────────────────────────────────────────────────────────────────────
//  MOBILE / CLIENT APP ROUTES (/api/v1/ads)
// ─────────────────────────────────────────────────────────────────────────────

/** Client Ad Network Configuration & Format IDs */
router.get('/config', getMobileAdsConfig);

/** Dynamic Mediation Ad Server (decides Custom vs AdMob) */
router.get('/serve', serveAd);

/** Custom Ad Impression & Click Tracking */
router.post('/track/:id/impression', trackImpression);
router.post('/track/:id/click', trackClick);

export default router;
