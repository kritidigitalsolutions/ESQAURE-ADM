import { Router } from 'express';
import { WatchHistoryController } from '../controllers/watchHistory.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { watchHistoryValidation } from '../validations/watchHistory.validation.js';

const router = Router();

// All watch history operations require authenticated user context
router.use(authenticate);

// ─────────────────────────────────────────────────────────────────────────────
//  OTT WATCH HISTORY & VIEWING ACTIVITY ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Get User's Watch History with Search, Filter & Date Grouping
 * GET /api/v1/watch-history?page=1&limit=20&search=&status=all&period=all&sortBy=recent&view=dramas
 */
router.get(
  '/',
  validate(watchHistoryValidation.listQuery, 'query'),
  WatchHistoryController.getWatchHistory
);

/**
 * 2. Get User's Watch History Statistics Summary & Top Genres
 * GET /api/v1/watch-history/summary
 */
router.get('/summary', WatchHistoryController.getHistorySummary);

/**
 * 3. Record or Update Playback Progress in Watch History (Client Sync)
 * POST /api/v1/watch-history
 */
router.post(
  '/',
  validate(watchHistoryValidation.recordWatch, 'body'),
  WatchHistoryController.recordWatchHistory
);

/**
 * 4. Mark Episode or Drama as Completed
 * POST /api/v1/watch-history/mark-completed
 */
router.post(
  '/mark-completed',
  validate(watchHistoryValidation.markCompleted, 'body'),
  WatchHistoryController.markAsCompleted
);

/**
 * 5. Get Viewing History Breakdown for a Specific Drama
 * GET /api/v1/watch-history/drama/:dramaId
 */
router.get(
  '/drama/:dramaId',
  validate(watchHistoryValidation.dramaParam, 'params'),
  WatchHistoryController.getDramaHistory
);

/**
 * 6. Remove All Viewing History for a Specific Drama
 * DELETE /api/v1/watch-history/drama/:dramaId
 */
router.delete(
  '/drama/:dramaId',
  validate(watchHistoryValidation.dramaParam, 'params'),
  WatchHistoryController.deleteDramaHistory
);

/**
 * 7. Clear User's Entire Watch History
 * DELETE /api/v1/watch-history
 */
router.delete('/', WatchHistoryController.clearAllHistory);

/**
 * 8. Remove Single Item from Watch History
 * DELETE /api/v1/watch-history/:historyId
 */
router.delete(
  '/:historyId',
  validate(watchHistoryValidation.historyParam, 'params'),
  WatchHistoryController.deleteHistoryItem
);

/**
 * 9. Get Single History Record / Drama Detail Alias
 * GET /api/v1/watch-history/:id
 */
router.get('/:id', WatchHistoryController.getDramaHistory);

export default router;
