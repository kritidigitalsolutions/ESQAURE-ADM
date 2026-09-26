# Project Build Phases & Implementation Roadmap
## Project: E² Stories (Entertainment Squared) — Backend & Admin Panel

---

## Phase 1: Environment Setup, Database Foundation & Dual Authentication
**Objective**: Establish the Node.js/Express backend server, connect MongoDB and Redis, configure environment variables, and build both mobile phone OTP and admin email/password authentication.

### Deliverables & Tasks:
- [ ] Initialize Node.js project (`package.json`, ES modules, scripts).
- [ ] Setup Express server with security middlewares (`helmet`, `cors`, `express-rate-limit`, `express-mongo-sanitize`).
- [ ] Setup MongoDB connection via Mongoose with auto-reconnect and error handlers.
- [ ] Setup Redis connection (`ioredis`) for OTP caching and rate-limiting.
- [ ] Implement Mongoose models: `User`, `AdminUser`, `Genre`.
- [ ] **Mobile Auth**:
  - `POST /api/v1/auth/request-otp` (generate 4-digit code, store in Redis with 60s cooldown and 5m expiry, mock/SMS integration).
  - `POST /api/v1/auth/verify-otp` (verify code, create user if new, generate JWT).
  - `POST /api/v1/auth/profile` (update first name, last name, email).
  - `POST /api/v1/auth/interests` (save onboarding genre preferences).
- [ ] **Admin Auth**:
  - Seed Super Admin account.
  - `POST /api/v1/admin/auth/login` (email + bcrypt password, generate Admin JWT).
- [ ] Implement centralized error handler (`AppError` + middleware).

---

## Phase 2: Content Management & Media Pipeline
**Objective**: Build models and APIs for managing multi-genre short-dramas, seasons, episodes, video streams, and subtitle tracks.

### Deliverables & Tasks:
- [ ] Implement Mongoose models: `Drama`, `Episode`.
- [ ] Build Media Ingestion service (S3 / Cloudinary presigned upload URLs for 9:16 portrait posters, 16:9 banners, trailers, and episode videos).
- [ ] **Admin Content CRUD APIs**:
  - `GET /api/v1/admin/dramas` (list with filters, search, pagination).
  - `POST /api/v1/admin/dramas` (create drama metadata, poster, banner, trailer).
  - `PUT /api/v1/admin/dramas/:id` (edit drama details, genres, status).
  - `DELETE /api/v1/admin/dramas/:id` (soft-delete / archive).
  - `GET /api/v1/admin/dramas/:id/episodes` (list all episodes for a drama).
  - `POST /api/v1/admin/dramas/:id/episodes` (upload episode video, set sequence number, subtitle tracks, free/paywall toggle).
  - `PUT /api/v1/admin/dramas/:id/episodes/:episodeId` (update episode info).
- [ ] Seed sample short-dramas matching mobile screens (*"Security Guard Ki CEO GF"*, *"Dhokha - A Dark Side of Love"*, *"My Wife Rented Me Out"*, *"The Last Promise"*).

---

## Phase 3: Consumer Mobile App APIs & Streaming Engine
**Objective**: Deliver high-performance REST endpoints needed by the mobile client UI for home feed, explore reel, player stream, and user library.

### Deliverables & Tasks:
- [ ] Implement Mongoose models: `WatchHistory`, `Watchlist`, `SearchLog`.
- [ ] **Home & Discovery Feed**:
  - `GET /api/v1/feed/home` (Hero carousel, Continue Watching with progress bars, Trending 1-3, Recommended for You, Popular Genres, New Releases).
  - Implement Redis caching (`5 min TTL`) on home feed.
- [ ] **Explore Tab**:
  - `GET /api/v1/feed/explore` (Vertical swipeable trailer feed with short-drama metadata).
- [ ] **Video Streaming & Player APIs**:
  - `GET /api/v1/dramas/:id/episodes` (episode drawer with lock/unlock status based on user's subscription flag).
  - `GET /api/v1/dramas/:id/episodes/:episodeNumber/stream` (checks if episode is free or user has active subscription; returns video stream URL and subtitles).
  - `POST /api/v1/dramas/:id/episodes/:episodeNumber/progress` (updates `WatchHistory` with watched seconds, duration, and completion flag).
- [ ] **User Library & Search**:
  - [x] `GET /api/v1/user/saved-series` & `POST /api/v1/user/saved-series/:dramaId` (toggle watchlist / saved series with watch later resume integration).
  - [x] `GET /api/v1/user/watch-history` (user's recent watch history).
  - [ ] `GET /api/v1/search` (text search across titles and genres).
  - [ ] `GET /api/v1/search/recent` & `DELETE /api/v1/search/recent` (search history management).
  - [ ] `GET /api/v1/search/popular` (top trending search queries).
  - [x] `PUT /api/v1/user/settings` (language, video quality, autoplay preferences).

---

## Phase 4: Monetization, Razorpay & Subscriptions
**Objective**: Build full monetization infrastructure supporting Monthly (₹199) and Yearly (₹1,499) premium plans with secure payment gateway callbacks.

### Deliverables & Tasks:
- [ ] Implement Mongoose models: `SubscriptionPlan`, `Subscription`.
- [ ] Seed default plans (Monthly ₹199 / 30 days, Yearly ₹1,499 / 365 days).
- [ ] `GET /api/v1/subscriptions/plans` (fetch active subscription tiers).
- [ ] `POST /api/v1/subscriptions/create-order` (call Razorpay Orders API, store pending transaction).
- [ ] `POST /api/v1/subscriptions/verify-payment` (verify SHA256 signature, mark active, update user `isVip = true` and `vipExpiresAt`).
- [ ] `POST /api/v1/subscriptions/webhook` (asynchronous webhook listener with HMAC signature verification for instant activation and chargeback handling).
- [ ] Build automated cron/job (node-cron) to check expired subscriptions daily and revoke subscription status.

---

## Phase 5: Admin Panel Frontend Implementation (React + Vite + Tailwind)
**Objective**: Develop the desktop web-based Admin Dashboard matching the modern Nodus design reference.

### Deliverables & Tasks:
- [ ] Setup Vite + React 18 + Tailwind CSS project in `admin-panel/`.
- [ ] Configure Tailwind theme with Urbanist typography and pastel yellow/neon/black color tokens (`#FEF08A`, `#8FFE01`, `#080B08`).
- [ ] Build Layout shell: Sidebar navigation, Header with breadcrumbs, Admin profile badge, Notifications.
- [ ] **Overview / Analytics Dashboard**:
  - KPI metric cards (Total Users, Active Paid Subscribers, Monthly Revenue, Total Views).
  - Interactive charts (Daily Views curve, Revenue histogram using Recharts).
- [ ] **Drama & Episode CMS Pages**:
  - Data table with search, genre filters, and status badges.
  - Drama creation/edit modal with image/video upload.
  - Episode Studio drawer to manage individual episodes and upload `.vtt` subtitles.
- [ ] **User & Subscriber Management**:
  - Searchable user table with subscription filters and last active date.
  - Modal to view user watch history and manual subscription override toggle.
- [ ] **Audit Log Screen**:
  - Real-time immutable audit trail showing admin actions, diffs, and CSV export.

---

## Phase 6: Push Notifications, Audit Logging, Security & Deployment
**Objective**: Implement operational logging, push notifications for new episode releases, test coverage, and Dockerize for deployment.

### Deliverables & Tasks:
- [ ] Implement Mongoose model: `AuditLog`.
- [ ] Intercept all admin mutation routes with automated audit log recorder.
- [ ] Firebase Cloud Messaging (FCM) service integration:
  - Trigger push notifications when a new episode drops for a drama.
  - Send broadcast notifications from Admin Panel.
- [ ] Data privacy compliance:
  - `POST /api/v1/user/delete-account` (soft delete user record, cancel active renewal).
  - Dynamic API for Terms of Service and Privacy Policy.
- [ ] Comprehensive testing:
  - API endpoint integration tests using Jest / Supertest.
  - Payment webhook failure simulation.
- [ ] Deployment preparation:
  - Multi-stage `Dockerfile` and `docker-compose.yml` (Express API, Admin Web, MongoDB, Redis).
  - Production environment configuration guides.
