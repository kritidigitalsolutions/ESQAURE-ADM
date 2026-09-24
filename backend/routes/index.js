import { Router } from 'express';
import authRoutes         from './auth.routes.js';
import userRoutes         from './user.routes.js';
import uploadRoutes       from './upload.routes.js';
import notificationRoutes from './notification.routes.js';

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

/** Notification list, settings, FCM device token management */
router.use('/notifications', notificationRoutes);

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN PANEL ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/** User list, search, filter, VIP management, status toggle */
router.use('/users', userRoutes);

// ─────────────────────────────────────────────────────────────────────────────
//  SHARED ROUTES  (used by both Mobile App and Admin Panel)
// ─────────────────────────────────────────────────────────────────────────────

/** Single and multiple file/media uploads */
router.use('/upload', uploadRoutes);

export default router;
