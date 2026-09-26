import { Router } from 'express';
import { SavedSeriesController } from '../controllers/savedSeries.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { savedSeriesValidation } from '../validations/savedSeries.validation.js';

const router = Router();

// All user library routes require authentication
router.use(authenticate);

// ─────────────────────────────────────────────────────────────────────────────
//  SAVED SERIES / WATCH LATER (WATCHLIST) ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Get User's Saved Series (Watchlist) with Pagination, Search, Filter & Playback Progress
 * GET /api/v1/user/saved-series?page=1&limit=20&search=&genre=&sortBy=recent
 */
router.get(
  '/saved-series',
  validate(savedSeriesValidation.listQuery, 'query'),
  SavedSeriesController.getSavedSeries
);

/**
 * 2. Toggle Drama in Saved Series (+ / - Watch Later)
 * POST /api/v1/user/saved-series/:dramaId
 */
router.post(
  '/saved-series/:dramaId',
  validate(savedSeriesValidation.dramaParam, 'params'),
  SavedSeriesController.toggleSavedSeries
);

/**
 * 3. Check if Specific Drama is Saved
 * GET /api/v1/user/saved-series/check/:dramaId
 * GET /api/v1/user/saved-series/:dramaId/status
 */
router.get(
  '/saved-series/check/:dramaId',
  validate(savedSeriesValidation.dramaParam, 'params'),
  SavedSeriesController.checkSavedStatus
);

router.get(
  '/saved-series/:dramaId/status',
  validate(savedSeriesValidation.dramaParam, 'params'),
  SavedSeriesController.checkSavedStatus
);

/**
 * 4. Explicitly Remove Drama from Saved Series
 * DELETE /api/v1/user/saved-series/:dramaId
 */
router.delete(
  '/saved-series/:dramaId',
  validate(savedSeriesValidation.dramaParam, 'params'),
  SavedSeriesController.removeSavedSeries
);

/**
 * 5. Clear All Saved Series for User
 * DELETE /api/v1/user/saved-series
 */
router.delete(
  '/saved-series',
  SavedSeriesController.clearAllSavedSeries
);

// ─────────────────────────────────────────────────────────────────────────────
//  USER LIBRARY & SETTINGS (Architecture.md Section 4.4)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 6. User Library Profile & Statistics (Counts for Saved Series & History)
 * GET /api/v1/user/profile
 */
router.get('/profile', SavedSeriesController.getUserProfile);

/**
 * 7. User Watch History with Resume Timestamps
 * GET /api/v1/user/watch-history?page=1&limit=20
 */
router.get('/watch-history', SavedSeriesController.getWatchHistory);

/**
 * 8. User Playback & App Settings
 * PUT /api/v1/user/settings
 * PATCH /api/v1/user/settings
 */
router.put('/settings', SavedSeriesController.updateUserSettings);
router.patch('/settings', SavedSeriesController.updateUserSettings);

export default router;
