import { Router } from 'express';
import { GenreController } from '../controllers/genre.controller.js';
import { verifyAdmin } from '../middlewares/adminAuth.middleware.js';

const router = Router();

/**
 * GET /api/v1/genres/admin
 * Admin: Get all genres with live calculated dramaCount and overall statistics
 */
router.get('/admin', verifyAdmin, GenreController.getAdminGenres);

/**
 * GET /api/v1/genres
 * Public / Mobile App: Get active genres with series count
 */
router.get('/', GenreController.getActiveGenres);

/**
 * GET /api/v1/genres/:id
 * Get single genre details and list of associated dramas
 */
router.get('/:id', GenreController.getGenreById);

/**
 * POST /api/v1/genres
 * Admin: Create a new genre category
 */
router.post('/', verifyAdmin, GenreController.createGenre);

/**
 * PATCH /api/v1/genres/:id
 * Admin: Update existing genre details
 */
router.patch('/:id', verifyAdmin, GenreController.updateGenre);

/**
 * PATCH /api/v1/genres/:id/toggle-active
 * Admin: Quick toggle active / hidden status
 */
router.patch('/:id/toggle-active', verifyAdmin, GenreController.toggleActive);

/**
 * PATCH /api/v1/genres/:id/toggle-trending
 * Admin: Quick toggle trending status
 */
router.patch('/:id/toggle-trending', verifyAdmin, GenreController.toggleTrending);

/**
 * PATCH /api/v1/genres/:id/toggle-popular
 * Admin: Quick toggle popular genres status
 */
router.patch('/:id/toggle-popular', verifyAdmin, GenreController.togglePopular);

/**
 * PATCH /api/v1/genres/reorder
 * Admin: Batch reorder genre display orders / priority ranks
 */
router.patch('/reorder', verifyAdmin, GenreController.reorderGenres);

/**
 * DELETE /api/v1/genres/:id
 * Admin: Delete genre permanently (safely unlinks from dramas)
 */
router.delete('/:id', verifyAdmin, GenreController.deleteGenre);


export default router;
