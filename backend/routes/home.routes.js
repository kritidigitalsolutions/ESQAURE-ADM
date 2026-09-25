import { Router } from 'express';
import { HomeController } from '../controllers/home.controller.js';
import { optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { homeValidation } from '../validations/home.validation.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN PANEL ROUTES: HOME SECTIONS & PRIORITY MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Admin: Create a new category section on home page
 * POST /api/v1/home/admin/sections
 */
router.post(
  '/admin/sections',
  validate(homeValidation.createSection, 'body'),
  HomeController.createSection
);

/**
 * 2. Admin: List all home category sections with pagination & filter
 * GET /api/v1/home/admin/sections?page=1&limit=20&search=&status=ALL
 */
router.get('/admin/sections', HomeController.getAdminSections);

/**
 * 3. Admin: Batch reorder section display order / priorities
 * PATCH /api/v1/home/admin/sections/reorder
 */
router.patch(
  '/admin/sections/reorder',
  validate(homeValidation.reorderSections, 'body'),
  HomeController.reorderSections
);

/**
 * 4. Admin: Get single section by ID
 * GET /api/v1/home/admin/sections/:id
 */
router.get('/admin/sections/:id', HomeController.getAdminSectionById);

/**
 * 5. Admin: Update home category section
 * PATCH /api/v1/home/admin/sections/:id
 */
router.patch(
  '/admin/sections/:id',
  validate(homeValidation.updateSection, 'body'),
  HomeController.updateSection
);

/**
 * 6. Admin: Toggle section active/inactive status
 * PATCH /api/v1/home/admin/sections/:id/toggle
 */
router.patch('/admin/sections/:id/toggle', HomeController.toggleSectionStatus);

/**
 * 7. Admin: Delete home category section
 * DELETE /api/v1/home/admin/sections/:id
 */
router.delete('/admin/sections/:id', HomeController.deleteSection);

/**
 * 8. Admin: Set/Update individual drama priority
 * PATCH /api/v1/home/admin/dramas/:id/priority
 */
router.patch(
  '/admin/dramas/:id/priority',
  validate(homeValidation.setDramaPriority, 'body'),
  HomeController.setDramaPriority
);

// ─────────────────────────────────────────────────────────────────────────────
//  MOBILE APP & HOME FEED DISCOVERY ROUTES (All with Pagination)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. All Content as per Priority set by Admin
 * GET /api/v1/home/content?page=1&limit=10&genre=&sortOrder=asc
 */
router.get(
  '/content',
  validate(homeValidation.contentQuery, 'query'),
  HomeController.getContentByPriority
);

/**
 * 2. Continue Watching (for authenticated user; graceful fallback for guests)
 * GET /api/v1/home/continue-watching?page=1&limit=10
 */
router.get(
  '/continue-watching',
  optionalAuthenticate,
  validate(homeValidation.continueWatchingQuery, 'query'),
  HomeController.getContinueWatching
);

/**
 * 3. All Categories as per Priority by Admin
 * GET /api/v1/home/categories?page=1&limit=10&includeDramas=false&dramasLimit=6
 */
router.get(
  '/categories',
  validate(homeValidation.categoriesQuery, 'query'),
  HomeController.getCategories
);

/**
 * 4. Recommended Categories as Genres (personalized by user interests + popularity)
 * GET /api/v1/home/recommended-categories?page=1&limit=10&includeDramas=true&dramasLimit=6
 */
router.get(
  '/recommended-categories',
  optionalAuthenticate,
  validate(homeValidation.recommendedCategoriesQuery, 'query'),
  HomeController.getRecommendedCategories
);

/**
 * 5. New Release Section
 * GET /api/v1/home/new-releases?page=1&limit=10&genre=
 */
router.get(
  '/new-releases',
  validate(homeValidation.newReleasesQuery, 'query'),
  HomeController.getNewReleases
);

/**
 * 6. Dynamic Home Category Sections (created & prioritized by admin)
 * GET /api/v1/home/sections?page=1&limit=10
 */
router.get(
  '/sections',
  validate(homeValidation.sectionsQuery, 'query'),
  HomeController.getHomeSections
);

/**
 * 7. View All Content for a Specific Category Section
 * GET /api/v1/home/sections/:idOrSlug?page=1&limit=10
 */
router.get('/sections/:idOrSlug', HomeController.getSectionContent);

/**
 * 8. Unified Home Feed (All sections pre-aggregated for instant mobile load)
 * GET /api/v1/home/feed
 */
router.get('/feed', optionalAuthenticate, HomeController.getHomeFeed);

export default router;
