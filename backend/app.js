import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { ApiResponse } from './utils/apiResponse.js';
import { env } from './config/env.js';

const app = express();

// 1. HTTP Security Headers
app.use(helmet());

// 2. CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin || env.ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev, or lock down as needed
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// 3. Request body parsing
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// 4. Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// 5. Mount API version 1
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
