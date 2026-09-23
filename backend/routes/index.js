import { Router } from 'express';
import authRoutes from './auth.routes.js';

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

export default router;
