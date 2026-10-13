import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoSanitize from 'express-mongo-sanitize';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { apiGlobalLimiter } from './middlewares/rateLimiter.js';
import { ApiResponse } from './utils/apiResponse.js';
import { env } from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


// 1. HTTP Security Headers (allows cross-origin media loading on web/mobile apps)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// 2. CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      if (env.ALLOWED_ORIGINS.includes(origin) || env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error(`Origin [${origin}] is not permitted by CORS policy.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Admin-Key']
  })
);


// 3. Request body parsing (captures rawBody buffer for Razorpay/Stripe webhook HMAC checks)
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// 4. Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// 4.1 Real-time HTTP Request Logging (visible in terminal)
app.use((req, res, next) => {
  const start = Date.now();
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusColor = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : status >= 300 ? '\x1b[36m' : '\x1b[32m';
    const reset = '\x1b[0m';
    console.log(`[HTTP] ${req.method.padEnd(6)} ${req.originalUrl} | ${statusColor}${status}${reset} (${duration}ms) | IP: ${clientIp}`);
  });

  next();
});

// 5. Statically serve uploaded files (/uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root route welcome/health check
app.get('/', (req, res) => {
  return ApiResponse.success(res, 'E² Stories OTT Backend API is running successfully', {
    service: 'E² Stories OTT API',
    version: '1.0.0',
    healthCheck: '/api/v1/health',
    timestamp: new Date().toISOString()
  });
});

// 6. Global Rate Limiter for all API routes (DDoS & scraping shield)
app.use('/api', apiGlobalLimiter);

// 7. Mount API version 1
app.use('/api/v1', apiRoutes);


// 6. Handle undefined routes (404)
app.all('*', (req, res) => {
  return ApiResponse.error(
    res,
    `Cannot find resource at [${req.method}] ${req.originalUrl}`,
    'ROUTE_NOT_FOUND',
    404
  );
});

// 7. Global centralized error handler
app.use(errorHandler);

export default app;
