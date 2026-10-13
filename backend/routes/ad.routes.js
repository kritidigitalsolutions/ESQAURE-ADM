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
import { verifyAdmin } from '../middlewares/adminAuth.middleware.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN PANEL ROUTES (/api/v1/ads) - Protected
// ─────────────────────────────────────────────────────────────────────────────

/** AdMob & Mediation Settings */
router.get('/settings', verifyAdmin, getAdSettings);
router.put('/settings', verifyAdmin, updateAdSettings);

/** Custom Direct Sponsor Ads CRUD */
router.get('/custom', verifyAdmin, getCustomAds);
router.post('/custom', verifyAdmin, createCustomAd);
router.get('/custom/:id', verifyAdmin, getCustomAdById);
router.put('/custom/:id', verifyAdmin, updateCustomAd);
router.delete('/custom/:id', verifyAdmin, deleteCustomAd);
router.patch('/custom/:id/toggle', verifyAdmin, toggleCustomAdStatus);
router.post('/custom/:id/reset-stats', verifyAdmin, resetCustomAdStats);


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
