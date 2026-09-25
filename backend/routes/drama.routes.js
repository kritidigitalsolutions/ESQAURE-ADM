import { Router } from 'express';
import { DramaController } from '../controllers/drama.controller.js';
import { PlayerController } from '../controllers/player.controller.js';
import { HomeController } from '../controllers/home.controller.js';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { playerValidation } from '../validations/player.validation.js';
import { homeValidation } from '../validations/home.validation.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN PANEL DRAMA & CONTENT LIBRARY MANAGEMENT ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Admin: Get Full Content Library with Stats & Filter Parameters
 * GET /api/v1/dramas/admin
 */
router.get('/admin', DramaController.getAdminDramas);

/**
 * 2. Admin: Create New Drama Series
 * POST /api/v1/dramas
 */
router.post('/', DramaController.createDrama);

/**
 * 3. Admin: Update Drama Details
 * PATCH /api/v1/dramas/:id
 */
router.patch('/:id', DramaController.updateDrama);

/**
 * 4. Admin: Delete Drama Series
 * DELETE /api/v1/dramas/:id
 */
router.delete('/:id', DramaController.deleteDrama);

/**
 * 5. Admin: Toggle Active / Inactive Status
 * PATCH /api/v1/dramas/:id/toggle-active
 */
router.patch('/:id/toggle-active', DramaController.toggleActive);

/**
 * 6. Admin: Toggle Paid / Free Access
 * PATCH /api/v1/dramas/:id/toggle-paid',
 */
router.patch('/:id/toggle-paid', DramaController.togglePaid);

/**
 * 7. Admin: Update / Shift Drama Priority
 * PATCH /api/v1/dramas/:id/priority
 */
router.patch('/:id/priority', DramaController.setDramaPriority);

/**
 * 8. Admin: Batch Save / Update Drama Episodes & Paywall Rules
 * POST /api/v1/dramas/:id/episodes/admin
 */
router.post('/:id/episodes/admin', DramaController.saveAdminEpisodes);

// ─────────────────────────────────────────────────────────────────────────────
//  DRAMA CATALOG & CONTENT ACCESS ROUTES (MOBILE APP & COMMON)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 9. Get All Dramas with Pagination
 * GET /api/v1/dramas?page=1&limit=10&genre=&search=&trending=true
 */
router.get('/', DramaController.getDramas);

/**
 * Content as per Priority set by Admin
 * GET /api/v1/dramas/prioritized?page=1&limit=10&genre=&sortOrder=asc
 */
router.get(
  '/prioritized',
  validate(homeValidation.contentQuery, 'query'),
  HomeController.getContentByPriority
);

/**
 * New Releases Section
 * GET /api/v1/dramas/new-releases?page=1&limit=10&genre=
 */
router.get(
  '/new-releases',
  validate(homeValidation.newReleasesQuery, 'query'),
  HomeController.getNewReleases
);

/**
 * Single Drama Details & Overview
 * GET /api/v1/dramas/:id
 */
router.get('/:id', optionalAuthenticate, DramaController.getDramaById);

/**
 * Drama Episodes Drawer with Pagination
 * GET /api/v1/dramas/:dramaId/episodes?page=1&limit=20&current=2
 */
router.get('/:dramaId/episodes', optionalAuthenticate, PlayerController.getEpisodesDrawer);

/**
 * Content Access Check as per Plan Status
 * GET /api/v1/dramas/:dramaId/access/:episodeNumber
 */
router.get(
  '/:dramaId/access/:episodeNumber',
  authenticate,
  PlayerController.checkAccess
);

/**
 * Play Episode Stream
 * GET /api/v1/dramas/:dramaId/play/:episodeNumber
 * GET /api/v1/dramas/:dramaId/episodes/:episodeNumber/stream (PRD alias)
 */
router.get(
  '/:dramaId/play/:episodeNumber',
  optionalAuthenticate,
  PlayerController.getEpisodeStream
);

router.get(
  '/:dramaId/episodes/:episodeNumber/stream',
  optionalAuthenticate,
  PlayerController.getEpisodeStream
);

/**
 * Record Playback Progress
 * POST /api/v1/dramas/:dramaId/progress
 */
router.post(
  '/:dramaId/progress',
  optionalAuthenticate,
  validate(playerValidation.recordProgress),
  PlayerController.recordProgress
);

export default router;
