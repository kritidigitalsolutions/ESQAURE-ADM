import { Router } from 'express';
import { SavedSeriesController } from '../controllers/savedSeries.controller.js';
import { AuthController } from '../controllers/auth.controller.js';
import {
  getNotificationSettings,
  updateNotificationSettings,
  toggleNotificationSetting,
  resetNotificationSettings
} from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { savedSeriesValidation } from '../validations/savedSeries.validation.js';

import watchHistoryRoutes from './watchHistory.routes.js';

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
 * 7. User Watch History (Netflix/OTT-grade Viewing Activity & Management)
 * GET    /api/v1/user/watch-history?page=1&limit=20&status=&period=&search=&view=
 * GET    /api/v1/user/watch-history/summary
 * GET    /api/v1/user/watch-history/drama/:dramaId
 * POST   /api/v1/user/watch-history
 * POST   /api/v1/user/watch-history/mark-completed
 * DELETE /api/v1/user/watch-history/:historyId
 * DELETE /api/v1/user/watch-history/drama/:dramaId
 * DELETE /api/v1/user/watch-history
 */
router.use('/watch-history', watchHistoryRoutes);

/**
 * 8. User Playback & App Settings
 * GET /api/v1/user/settings
 * PUT /api/v1/user/settings
 * PATCH /api/v1/user/settings
 */
router.get('/settings', SavedSeriesController.getUserSettings);
router.put('/settings', SavedSeriesController.updateUserSettings);
router.patch('/settings', SavedSeriesController.updateUserSettings);

/**
 * 9. Notification Settings (Alert preferences screen alias)
 * GET /api/v1/user/notification-settings
 * PUT /api/v1/user/notification-settings
 * PATCH /api/v1/user/notification-settings
 * POST /api/v1/user/notification-settings/toggle
 * PATCH /api/v1/user/notification-settings/:key/toggle
 * POST /api/v1/user/notification-settings/reset
 */
router.get('/notification-settings', getNotificationSettings);
router.put('/notification-settings', updateNotificationSettings);
router.patch('/notification-settings', updateNotificationSettings);
router.post('/notification-settings/toggle', toggleNotificationSetting);
router.patch('/notification-settings/:key/toggle', toggleNotificationSetting);
router.post('/notification-settings/reset', resetNotificationSettings);

/**
 * 10. Account Deletion Request (User Profile flow alias)
 * DELETE /api/v1/user/profile
 * POST   /api/v1/user/delete-account
 * POST   /api/v1/user/cancel-delete-request
 */
router.delete('/profile', AuthController.deleteAccount);
router.post('/delete-account', AuthController.deleteAccount);
router.post('/cancel-delete-request', AuthController.cancelDeleteRequest);

export default router;
