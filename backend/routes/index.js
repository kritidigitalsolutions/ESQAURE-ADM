import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import uploadRoutes from './upload.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'E² Stories OTT API',
    timestamp: new Date().toISOString()
  });
});

// Authentication endpoints (/api/v1/auth)
router.use('/auth', authRoutes);

// User management endpoints (/api/v1/users)
router.use('/users', userRoutes);

// File and media upload endpoints (/api/v1/upload)
router.use('/upload', uploadRoutes);

export default router;
