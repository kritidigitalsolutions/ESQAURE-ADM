import { Router } from 'express';
import { PlayerController } from '../controllers/player.controller.js';
import { HomeController } from '../controllers/home.controller.js';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { playerValidation } from '../validations/player.validation.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
//  SIMPLE, HIGH-PERFORMANCE VIDEO PLAYER APIS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Access Check API: Verify if user has access to content/episode as per plan status
 * GET  /api/v1/player/access/:dramaId/:episodeNumber
 * POST /api/v1/player/access
 */
router.get(
  '/access/:dramaId/:episodeNumber',
  authenticate,
  PlayerController.checkAccess
);

router.post(
  '/access',
  authenticate,
  PlayerController.checkAccess
);

/**
 * 2. Play Episode / Stream Details
 * GET /api/v1/player/play/:dramaId/:episodeNumber
 * GET /api/v1/player/stream/:dramaId/:episodeNumber (alias)
 */
router.get(
  '/play/:dramaId/:episodeNumber',
  optionalAuthenticate,
  PlayerController.getEpisodeStream
);

router.get(
  '/play/:dramaId',
  optionalAuthenticate,
  PlayerController.getEpisodeStream
);

// Backward-compatible alias
router.get(
  '/stream/:dramaId/:episodeNumber',
  optionalAuthenticate,
  PlayerController.getEpisodeStream
);

router.get(
  '/stream/:dramaId',
  optionalAuthenticate,
  PlayerController.getEpisodeStream
);

/**
 * 3. Episodes Drawer List with Pagination
 * GET /api/v1/player/episodes/:dramaId?page=1&limit=20&current=2
 */
router.get(
  '/episodes/:dramaId',
  optionalAuthenticate,
  PlayerController.getEpisodesDrawer
);

/**
 * 4. Sync Playback Progress (Scrubber & Heartbeat)
 * POST /api/v1/player/progress
 */
router.post(
  '/progress',
  optionalAuthenticate,
  validate(playerValidation.recordProgress),
  PlayerController.recordProgress
);

/**
 * 5. Continue Watching List with Pagination
 * GET /api/v1/player/continue-watching?page=1&limit=10
 */
router.get(
  '/continue-watching',
  optionalAuthenticate,
  HomeController.getContinueWatching
);

export default router;
