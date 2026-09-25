# Product Requirements Document (PRD)
## Project: E² Stories (Entertainment Squared) — Backend API & Admin Panel

---

## 1. Executive Summary & Context

**E² Stories (Entertainment Squared)** is a high-growth mobile OTT streaming platform dedicated to **vertical micro-dramas and short-form serialized video stories** (episodes ranging from 1 to 3 minutes each). 

### Scope Boundaries:
- **Mobile Frontend**: Already designed and owned by the mobile app frontend team (Flutter/React Native).
- **Backend & Admin Panel (This Project)**: Owned by the Backend Developer. Responsible for:
  1. Designing and serving the high-performance **RESTful API** consumed by the mobile client.
  2. Building the **Web-based Admin Panel** (React + Tailwind CSS) for content ingestion, episode management, user administration, monetization tracking, and audit logging.

---

## 2. Inferred Product Requirements from Mobile UI Screens

Based on the 29 screens reverse-engineered from the mobile client (`ui SS/`):

### 2.1 Authentication & Onboarding
- **Phone Number Auth**: One-tap phone login with country code selector (default `+91` India).
- **OTP Verification**: 4-digit SMS OTP verification with a 60-second cooldown timer and resend capability.
- **Profile Initialization**:
  - First Name (required)
  - Last Name (optional)
  - Email Address (valid email format)
- **Interest Selection**: Onboarding genre picker (Romance, Thriller, Drama, Mystery, Action, Horror, Comedy, Fantasy) with skip option, used for cold-start recommendations.

### 2.2 Content Hierarchy & Structure
- **Genres / Categories**: Curated list with icons, display order, and active/inactive status.
- **Dramas (Series)**:
  - Title, Slug, Synopsis/Description.
  - Multi-genre tags (e.g., "Romance • Drama").
  - Media: Vertical Poster (9:16 portrait), Landscape Banner (16:9 carousel), Trailer Video preview (9:16).
  - Metadata: Release date, Age rating, View count, Total episodes count, Status (`Draft`, `Published`, `Archived`).
- **Episodes**:
  - Episode Number, Season Number (default `S1`).
  - Episode Title, Duration (e.g., `2:15`).
  - Video stream URL (HLS / MP4 with multi-bitrate support: 1080p, 720p, Auto).
  - Subtitle tracks: Multi-language SRT/VTT (`Hindi`, `English`, `Off`).
  - Access Control: `is_free` (e.g., Episodes 1–3 free teaser, Episode 4+ requires Premium Subscription).

### 2.3 Home Feed & Discovery Engine
- **Hero Featured Carousel**: Curated list of high-impact drama posters with play counts (e.g., `3.5k views`).
- **Continue Watching Row**: User-specific row displaying currently watched series, episode badge (`Episode 4`), and percentage progress bar.
- **Trending Row**: Numbered ranking badges (`1`, `2`, `3`, etc.) showing the top watched micro-dramas of the week/month.
- **Recommended for You**: Content recommendation based on user selected interests and watch history.
- **Popular Genres Horizontal Scroller**: Quick filter pills navigating to genre-specific catalogs.
- **New Releases**: Chronologically sorted recent drama launches.

### 2.4 Explore Tab (Vertical Reels Preview)
- Full-screen vertical swipeable trailer video player (similar to TikTok/Reels/Shorts).
- Direct overlay controls:
  - Drama Title & Genres
  - Tagline / Short hook
  - Action buttons:
    - **Watch Now**: Launches episode player starting from Episode 1 (or last watched episode).
    - **Episodes**: Bottom drawer displaying all episodes with locked/unlocked indicators.
    - **+ List**: Toggle adding/removing drama from user's "Saved Series" watchlist.

### 2.5 Video Player & Streaming
- Full-screen 9:16 vertical video player with custom video controls:
  - Top bar: Back button, Season/Episode indicator (`S1 · E02`), More options menu (3 dots).
  - Bottom controls: Current time / Total duration, Scrubber bar, "Episodes >" bottom sheet trigger.
  - Playback Settings Drawer:
    - Subtitle selection (`Hindi`, `English`, `Off`).
    - Video quality selector (`Auto`, `1080p`, `720p`).
    - Playback speed (`0.75x`, `1x`, `1.25x`, `1.5x`).
    - Autoplay next episode toggle.
- Heartbeat / Progress tracking API: Reports playback timestamp every 5-10 seconds to maintain accurate "Continue Watching" state.

### 2.6 Monetization & Subscriptions
- **Subscription Tiers**:
  - **Monthly Plan**: ₹199 / month.
  - **Yearly Plan**: ₹1,499 / year (high-value saving).
- **Subscription Benefits**:
  - Unlimited episodes (unlock all paywalled episodes).
  - Ad-free streaming experience.
  - High-Definition (HD 1080p) streaming access.
  - Early access to newly added micro-drama series.
- **Payment Flow**:
  - Order creation via Payment Gateway (Razorpay / Cashfree).
  - Webhook verification for instant subscription activation.
  - Transaction history & invoice receipt generation.
  - Grace periods and membership renewal tracking.

### 2.7 Search & Discovery
- Full-text search across Drama titles, synopsis, and genres.
- **Recent Searches**: Track user's past search queries, individual delete (`X`), and "Clear All" action.
- **Popular Searches**: Top aggregated search keywords with ranking badges (`01`, `02`, `03`).
- **Recommended for You**: Fallback feed on empty search query.

### 2.8 User Profile & Library
- **Subscription Status Badge**: Visual indicator (`Subscribed`) on user profile header.
- **Saved Series (Watchlist)**: List of bookmarked dramas with poster, episode count, and quick "Watch" trigger.
- **Watch History**: Chronological list of started series with "Continue" action and resume position.
- **Account & App Settings**:
  - Autoplay Next Episode toggle.
  - Default Video Quality preference.
  - App Language (English default).
  - Content Languages multi-select (`English`, `Hindi`, `Tamil`, `Telugu`, `Kannada`, `Malayalam`).
  - Notification Settings (New episodes, New releases, Recommendations alerts).
- **Compliance & Legal**:
  - Dynamic Privacy Policy viewer.
  - Dynamic Terms & Conditions viewer.
  - "Log Out" & "Delete Account" (GDPR / Indian DPDP compliance with soft-delete & data purge grace period).

---

## 3. Admin Panel Functional Requirements

The Admin Panel is a desktop-first SaaS dashboard for administrators and content curators (inspired by the clean, modern Nodus design reference):

### 3.1 Analytics & Overview Dashboard
- High-level KPIs: Total Users, Active Paid Subscribers, Daily Active Users (DAU), Total Watch Hours, Monthly Recurring Revenue (MRR).
- Visual trend charts (Daily views, Revenue growth, Episode completion rates).
- Quick alerts for failed payment webhooks, encoding errors, or user reports.

### 3.2 Drama & Episode Management (CMS)
- **Drama Ingestion**: Create, edit, and organize series. Upload 9:16 portrait posters, 16:9 banners, trailer videos, and assign genres/tags.
- **Episode Studio**:
  - Bulk video upload (direct to S3 / Cloudinary).
  - Automated or manual metadata entry (Episode title, duration, sequence number).
  - Subtitle manager (upload Hindi/English `.vtt` / `.srt` tracks).
  - Paywall configuration (`is_free` toggle per episode).
- **Feed Curator**: Drag-and-drop ordering for "Hero Carousel", "Trending", and "Featured" lists.

### 3.3 User & Subscription Management
- Searchable user table with filters (All, Free Users, Subscribed Members, Inactive).
- View individual user profile, device info, watch history, and active subscription details.
- Manual subscription override (grant complimentary access or revoke).
- Transaction logs with Razorpay payment ID, status, amount, and invoice download.

### 3.4 Notification Dispatcher
- Push notification composer targeting all users, specific genres, or inactive users.
- Automated system triggers (e.g., notify subscribers when Episode X of a watched drama drops).

### 3.5 System Audit Log
- Immutable security audit log recording every admin action (who, what, target entity, timestamp, IP address, and payload diff).
- Filter by admin user, action type, date range, and export to CSV.

---

## 4. Non-Functional Requirements
- **Response Times**: Feed and metadata endpoints must respond in `< 100ms` (leveraging Redis caching and indexed MongoDB queries).
- **Scalability**: Capable of handling high read concurrency during evening peak streaming hours.
- **Security**: Strict JWT authorization, HMAC SHA256 payment webhook signature validation, rate limiting on OTP requests (`max 3 per 10 minutes per IP/phone`).
- **Data Integrity**: Soft-delete semantics for dramas and episodes to prevent broken playback links for active sessions.
