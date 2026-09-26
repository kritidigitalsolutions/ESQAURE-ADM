import { Router } from 'express';
import authRoutes         from './auth.routes.js';
import userRoutes         from './user.routes.js';
import uploadRoutes       from './upload.routes.js';
import notificationRoutes from './notification.routes.js';
import legalRoutes        from './legal.routes.js';
import subscriptionRoutes from './subscription.routes.js';
import playerRoutes       from './player.routes.js';
import dramaRoutes        from './drama.routes.js';
import searchRoutes       from './search.routes.js';
import homeRoutes         from './home.routes.js';
import genreRoutes        from './genre.routes.js';
import savedSeriesRoutes  from './savedSeries.routes.js';
import promoRoutes        from './promo.routes.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
//  SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'E² Stories OTT API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  MOBILE APP ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/** OTP login, profile setup, token refresh, genre/interest onboarding */
router.use('/auth', authRoutes);

/** Subscription Plans, 7-Day Rs. 2 Trial, Razorpay verification, Upgrades & Webhooks */
router.use('/subscriptions', subscriptionRoutes);

/** Notification list, settings, FCM device token management */
router.use('/notifications', notificationRoutes);

/** Video Player, Scrubber, Episodes Drawer & Playback Settings */
router.use('/player', playerRoutes);

/** Drama series catalog and nested stream endpoints */
router.use('/dramas', dramaRoutes);

/** Search & Discovery (Popular Searches, Genre-based Recommendations, Auto-suggest) */
router.use('/search', searchRoutes);

/** Home Feed, Prioritized Content, Categories & Admin Home Sections */
router.use('/home', homeRoutes);
router.use('/banners', homeRoutes);

/** User Library: Saved Series (Watchlist / Watch Later), Watch History & Settings */
router.use('/user', savedSeriesRoutes);
router.use('/saved-series', savedSeriesRoutes);

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN PANEL ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/** User list, search, filter, subscription management, status toggle */
router.use('/users', userRoutes);

/** Genre and category management (CRUD, active toggle, stats) */
router.use('/genres', genreRoutes);

/** Promos & Vouchers (Admin CRUD + mobile validate) */
router.use('/promos', promoRoutes);

// ─────────────────────────────────────────────────────────────────────────────
//  SHARED ROUTES  (used by both Mobile App and Admin Panel)
// ─────────────────────────────────────────────────────────────────────────────

/** Single and multiple file/media uploads */
router.use('/upload', uploadRoutes);

/** Legal documents (Privacy Policy, Terms & Conditions, Refund, Compliance) */
router.use('/legal', legalRoutes);

export default router;
