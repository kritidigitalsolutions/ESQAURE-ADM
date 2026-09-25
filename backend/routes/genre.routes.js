import { Router } from 'express';
import { GenreController } from '../controllers/genre.controller.js';

const router = Router();

/**
 * GET /api/v1/genres/admin
 * Admin: Get all genres with live calculated dramaCount and overall statistics
 */
router.get('/admin', GenreController.getAdminGenres);

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
router.post('/', GenreController.createGenre);

/**
 * PATCH /api/v1/genres/:id
 * Admin: Update existing genre details
 */
router.patch('/:id', GenreController.updateGenre);

/**
 * PATCH /api/v1/genres/:id/toggle-active
 * Admin: Quick toggle active / hidden status
 */
router.patch('/:id/toggle-active', GenreController.toggleActive);

/**
 * DELETE /api/v1/genres/:id
 * Admin: Delete genre permanently (safely unlinks from dramas)
 */
router.delete('/:id', GenreController.deleteGenre);

export default router;
