# Project Memory & AI Continuity Context
## Project: E² Stories (Entertainment Squared) — Backend & Admin Panel

---

## 1. Project Overview & Scope
- **App Name**: E² Stories (Entertainment Squared) / ESQUARE OTT.
- **Product Nature**: Indian vertical micro-drama / short-form OTT video streaming platform (1–3 minute episodes per drama).
- **Core Persona**: You are the **Backend Engineer** responsible for:
  1. The **Node.js / Express REST API** serving the already-built mobile application.
  2. The **Web Admin Panel** (React + Vite + Tailwind CSS) used by content operators and admins.
- **Mobile Client**: Owned by a separate frontend team; UI screens are already finalized and stored under `ui SS/` in this repository.

---

## 2. Technology Stack & Key Libraries
- **Language**: JavaScript (Node.js v20+ LTS, ES Modules `"type": "module"`).
- **Framework**: Express.js (`express`).
- **Database**: MongoDB with Mongoose ODM (`mongoose`).
- **Caching & Throttling**: Redis (`ioredis`).
- **Admin Panel UI**: React 18, Vite, Tailwind CSS, Lucide React (`lucide-react`), Recharts (`recharts`).
- **Authentication**: JWT (`jsonwebtoken`), `bcryptjs`, SMS OTP (+91 India).
- **Payments**: Razorpay Node SDK (`razorpay`), webhook HMAC SHA256 validation.
- **File & Media Storage**: AWS S3 / Cloudinary (Presigned upload URLs for 9:16 vertical video files, posters, and subtitles).

---

## 3. Core Business & Domain Rules
1. **Micro-Drama Structure**:
   - Each `Drama` has multiple `Episodes` (1–3 min duration).
   - Media: 9:16 portrait poster, 16:9 carousel banner, 9:16 vertical trailer preview.
   - Multi-language subtitles (`Hindi`, `English`).
2. **Freemium & VIP Paywall**:
   - Episodes 1 to 3 are typically Free (`isFree = true`).
   - Episode 4 and onward require an active VIP subscription (`isVip = true`).
   - If an unauthenticated or non-VIP user requests a paywalled stream, API returns `403 Forbidden` with error code `VIP_REQUIRED`.
3. **Monetization Plans**:
   - **Monthly**: ₹199 / month (30 days).
   - **Yearly**: ₹1,499 / year (365 days).
4. **Playback & Progress Sync**:
   - Mobile app sends heartbeat timestamps (`POST /api/v1/dramas/:id/episodes/:num/progress`).
   - Powers the "Continue Watching" row on the home feed.
5. **Admin Panel Aesthetics**:
   - Modern SaaS dark/clean aesthetic inspired by Nodus reference (`ui SS/76acc4e04f1465ab59eb0e7c889e3300.webp`).
   - Primary Font: **Urbanist**.
   - Primary Accent: Pastel Yellow (`#FEF08A`, hover `#FDE047`), Neon Lime (`#8FFE01`), Deep Slate/Charcoal Canvas (`#080B08`).
   - Clean, flat pastel tone matching soft emerald badges, with no harsh glows or colored halos.
   - **Material Design 2 Dark Theme Architecture**:
     - Surface elevation communicated via lightness overlays (00dp `#080B08`, 01dp `#121612`, 02dp `#161B16`, 04dp `#1A1F1A`, 08dp `#202620`, 16dp `#242A24`, 24dp `#282E28`).
     - Never use pure `#000000` for surface fills.
     - Natural z-axis drop shadows preserved; no light or colored glows.
     - WCAG AA text contrast: High emphasis 87-90% white (`text-white/90`), Medium emphasis 60% white (`text-white/60`), Disabled 38% white (`text-white/38`), Dividers 10-12% white (`border-white/10`).
     - Uniform KPI card badges in `#FEF08A` (no rainbow icons).

---

## 4. Repository & File Structure
```
d:\OFFICE WORK\ESQAURE-ADM\
├── Mobile app ui refrence screenshots/  # Original mobile app UI screenshots & design references
├── admin/                               # Web Admin Dashboard (React + Vite + Tailwind)
├── backend/                             # Node.js + Express REST API
└── docs/                                # Project documentation & architecture specs
    ├── Architecture.md                  # System design, Mongoose schemas & API Endpoints
    ├── Memory.md                        # AI continuity context & project rules
    ├── design.md                        # Admin panel UI/UX design tokens & specs
    ├── phases.md                        # 6-phase development roadmap
    ├── prd.md                           # Product requirements document
    └── rules.md                         # Coding standards & security rules
```

---

## 5. Continuity Instructions for Future AI Prompts
- When implementing code, **never write mobile UI code**; focus purely on Express routes, controllers, Mongoose models, and React admin components.
- Always maintain the exact JSON response envelope `{ success, statusCode, message, data }` specified in `rules.md`.
- Ensure all queries touching user libraries (`WatchHistory`, `Watchlist`) enforce the authenticated user's ID from the JWT payload.
- Reference `ui SS/` whenever validating mobile frontend data requirements.
