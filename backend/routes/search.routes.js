import { Router } from 'express';
import { SearchController } from '../controllers/search.controller.js';
import { optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { searchValidation } from '../validations/search.validation.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
//  SEARCH & DISCOVERY ROUTES (Mobile App Screen)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Search Landing Screen Discovery API
 * GET /api/v1/search/landing?popularLimit=10&recommendedLimit=10
 * Returns "Popular Searches" (01, 02, 03...) and "Recommended for You"
 * (personalized as per genre(s) selected by user during profile build).
 * Strictly NO recent search data per design requirement.
 */
router.get('/landing', optionalAuthenticate, SearchController.getSearchLanding);

/**
 * 2. Popular Searches API
 * GET /api/v1/search/popular?limit=10
 * Returns ranked popular / trending drama titles with rank badges ("01", "02", "03"...)
 */
router.get(
  '/popular',
  optionalAuthenticate,
  validate(searchValidation.popularQuery, 'query'),
  SearchController.getPopularSearches
);

/**
 * 3. Recommended For You API
 * GET /api/v1/search/recommended?page=1&limit=10
 * Recommends dramas personalized to user's selected genres from profile build (user.interests).
 * Seamless fallback to top-rated / trending dramas for guests.
 */
router.get(
  '/recommended',
  optionalAuthenticate,
  validate(searchValidation.recommendedQuery, 'query'),
  SearchController.getRecommended
);

/**
 * 4. Fast Live Autocomplete / Suggestions API
 * GET /api/v1/search/suggestions?q=...&limit=8
 * Returns instant drama title and genre suggestions while typing in the search bar.
 */
router.get(
  '/suggestions',
  optionalAuthenticate,
  validate(searchValidation.suggestionsQuery, 'query'),
  SearchController.getSuggestions
);

/**
 * 5. Unified Search & Discovery Route
 * GET /api/v1/search?q=romance&genre=...&page=1&limit=10
 * - If query parameter `q` is absent/empty: serves Search Landing Screen.
 * - If query parameter `q` is provided: executes full search across titles, synopsis, tags & genres.
 */
router.get(
  '/',
  optionalAuthenticate,
  validate(searchValidation.searchQuery, 'query'),
  SearchController.search
);

export default router;
