# E² Stories — Video Player & Content API Documentation

## 1. Overview & Architecture Philosophy

This document outlines the backend APIs for the **Video Player Screen** ([Screenshot 1](file:///d:/OFFICE%20WORK/ESQAURE-ADM/Mobile%20app%20ui%20refrence%20screenshots/Screenshot_20260916-124632.e_square_ott_app.png)), **Playback Settings** ([Screenshot 2](file:///d:/OFFICE%20WORK/ESQAURE-ADM/Mobile%20app%20ui%20refrence%20screenshots/Screenshot_20260916-124635.e_square_ott_app.png)), and **Drama Catalog**.

### Key Design Highlights:
1. **Short, Easy-to-Understand API Names**:
   - `GET /api/v1/player/access/:dramaId/:ep` — Access check as per user plan status.
   - `GET /api/v1/player/play/:dramaId/:ep` — Video playback & stream details.
   - `GET /api/v1/player/episodes/:dramaId` — Paginated episodes drawer list.
   - `POST /api/v1/player/progress` — Scrubber & heartbeat progress sync.
   - `GET /api/v1/dramas` — Paginated catalog of all dramas.
   - `GET /api/v1/dramas/:id` — Single drama details & synopsis.
2. **Standard Pagination**:
   - Both `/dramas` and `/player/episodes/:dramaId` support `?page=1&limit=10`.
   - Returns metadata: `page`, `limit`, `total`, `totalPages`, `hasNextPage`, `hasPrevPage`.
3. **Bunny CDN Native Stream**:
   - Video resolutions (`1080p`, `720p`, `Auto`) and multi-language subtitles (`Hindi`, `English`) are packaged into Bunny CDN's HLS playlist (`playlist.m3u8`).
   - Playback speed (`0.75x`, `1x`, `1.25x`, `1.5x`) is set natively on device via the video player controller.

---

## 2. API Reference & Endpoints

### 2.1 Check Episode Access (Plan Status)
**Endpoint:** `GET /api/v1/player/access/:dramaId/:episodeNumber`  
*(Also accepts: `POST /api/v1/player/access` with `{ dramaId, episodeNumber }`)*  
**Authorization:** `Required` (`Authorization: Bearer <authToken>`). If omitted or invalid, returns `401 Unauthorized` (`AUTH_REQUIRED`).

#### Purpose:
Allows the mobile app to verify whether the logged-in user is permitted to play an episode **before** opening the player or navigating, based on their subscription plan status.

#### Access Evaluation Rules:
- **Missing / Invalid Auth Token**: Rejection with `401 Unauthorized` (`AUTH_REQUIRED`).
- **Free Episode (Episodes 1–3)**: `hasAccess: true`, `reason: "FREE_EPISODE"`.
- **Paywalled Episode (Episode 4+) + Active VIP**: `hasAccess: true`, `reason: "ACTIVE_VIP_SUBSCRIPTION"`.
- **Paywalled Episode + Free Tier User**: `hasAccess: false`, `reason: "SUBSCRIPTION_REQUIRED"`, returns active `upgradePlans` for paywall bottom sheet.

#### Sample Response (Allowed):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Access status evaluated successfully",
  "data": {
    "hasAccess": true,
    "reason": "FREE_EPISODE",
    "isFree": true,
    "isLocked": false,
    "userPlanStatus": {
      "isLoggedIn": true,
      "isVip": false,
      "plan": "Free Tier",
      "vipExpiresAt": null
    },
    "drama": {
      "id": "66f1a2b3c4d5e6f7a8b9c0d1",
      "title": "Security Guard Ki CEO GF",
      "slug": "security-guard-ki-ceo-gf"
    },
    "episode": {
      "id": "66f1a2b3c4d5e6f7a8b9c0e2",
      "seasonNumber": 1,
      "episodeNumber": 2,
      "seasonEpisodeTag": "S1 · E02",
      "title": "If This Is LOVE Let Me Burn",
      "durationSeconds": 135
    },
    "upgradePlans": []
  }
}
```

#### Sample Response (Locked / Subscription Required):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Access status evaluated successfully",
  "data": {
    "hasAccess": false,
    "reason": "SUBSCRIPTION_REQUIRED",
    "isFree": false,
    "isLocked": true,
    "userPlanStatus": {
      "isLoggedIn": true,
      "isVip": false,
      "plan": "Free Tier",
      "vipExpiresAt": null
    },
    "drama": {
      "id": "66f1a2b3c4d5e6f7a8b9c0d1",
      "title": "Security Guard Ki CEO GF",
      "slug": "security-guard-ki-ceo-gf"
    },
    "episode": {
      "id": "66f1a2b3c4d5e6f7a8b9c0e4",
      "seasonNumber": 1,
      "episodeNumber": 4,
      "seasonEpisodeTag": "S1 · E04",
      "title": "Forbidden Heartstrings",
      "durationSeconds": 140
    },
    "upgradePlans": [
      {
        "code": "PLAN_1M",
        "name": "Monthly Pass",
        "price": 199,
        "originalPrice": 299,
        "durationDays": 30,
        "features": ["Unlock all paywalled episodes", "HD Streaming", "Ad-free"]
      }
    ]
  }
}
```

---

### 2.2 Play Episode Stream
**Endpoint:** `GET /api/v1/player/play/:dramaId/:episodeNumber`  
*(Alias: `GET /api/v1/player/stream/:dramaId/:episodeNumber`)*  
**Authorization:** Optional for free episodes; Required for VIP episodes.

#### Purpose:
Powers the active video player screen ([Screenshot 1](file:///d:/OFFICE%20WORK/ESQAURE-ADM/Mobile%20app%20ui%20refrence%20screenshots/Screenshot_20260916-124632.e_square_ott_app.png)). Returns the Bunny CDN stream URL, `S1 · E02` badge, duration (`2:15`), genre tags, and resume progress (`0:45`).

#### Sample Response (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Episode stream data fetched successfully",
  "data": {
    "streamUrl": "https://vz-xxxx.b-cdn.net/videoId/playlist.m3u8",
    "bunnyVideoId": "b0a8-4c21-...",
    "drama": {
      "id": "66f1a2b3c4d5e6f7a8b9c0d1",
      "title": "Security Guard Ki CEO GF",
      "slug": "security-guard-ki-ceo-gf",
      "posterUrl": "https://images.unsplash.com/photo-...",
      "genres": ["Romance", "Drama"],
      "genreDisplay": "Romance / Drama",
      "totalEpisodes": 30
    },
    "episode": {
      "id": "66f1a2b3c4d5e6f7a8b9c0e2",
      "seasonNumber": 1,
      "episodeNumber": 2,
      "seasonEpisodeTag": "S1 · E02",
      "title": "If This Is LOVE Let Me Burn",
      "subtitleDisplay": "Episode 2 • Romance / Drama",
      "durationSeconds": 135,
      "formattedDuration": "2:15",
      "thumbnailUrl": "https://images.unsplash.com/photo-...",
      "isFree": true,
      "hasAccess": true
    },
    "progress": {
      "watchedSeconds": 45,
      "formattedWatched": "0:45",
      "durationSeconds": 135,
      "formattedDuration": "2:15",
      "progressPercentage": 33.3,
      "isCompleted": false
    },
    "navigation": {
      "nextEpisode": {
        "id": "66f1a2b3c4d5e6f7a8b9c0e3",
        "seasonNumber": 1,
        "episodeNumber": 3,
        "seasonEpisodeTag": "S1 · E03",
        "title": "The Silent Protector",
        "isFree": true,
        "isLocked": false
      },
      "previousEpisode": {
        "id": "66f1a2b3c4d5e6f7a8b9c0e1",
        "seasonNumber": 1,
        "episodeNumber": 1,
        "seasonEpisodeTag": "S1 · E01",
        "title": "The First Encounter",
        "isFree": true
      }
    },
    "userStatus": {
      "isAuthenticated": true,
      "isVip": false
    }
  }
}
```

---

### 2.3 Get Episodes Drawer (Paginated)
**Endpoint:** `GET /api/v1/player/episodes/:dramaId?page=1&limit=20&current=2`  
*(PRD Alias: `GET /api/v1/dramas/:dramaId/episodes`)*  
**Authorization:** Optional.

#### Purpose:
Powers the floating **"Episodes >"** button. Supports pagination so micro-dramas with 50–100+ episodes load fast without lag.

#### Sample Response (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Episodes drawer list fetched successfully",
  "data": {
    "drama": {
      "id": "66f1a2b3c4d5e6f7a8b9c0d1",
      "title": "Security Guard Ki CEO GF",
      "slug": "security-guard-ki-ceo-gf",
      "posterUrl": "https://images.unsplash.com/photo-...",
      "totalEpisodes": 30,
      "genreDisplay": "Romance / Drama"
    },
    "episodes": [
      {
        "id": "66f1a2b3c4d5e6f7a8b9c0e1",
        "seasonNumber": 1,
        "episodeNumber": 1,
        "seasonEpisodeTag": "S1 · E01",
        "title": "The First Encounter",
        "durationSeconds": 135,
        "formattedDuration": "2:15",
        "thumbnailUrl": "https://images.unsplash.com/photo-...",
        "isFree": true,
        "hasAccess": true,
        "isLocked": false,
        "isCurrent": false,
        "watched": {
          "watchedSeconds": 135,
          "formattedWatched": "2:15",
          "progressPercentage": 100,
          "isCompleted": true
        }
      },
      {
        "id": "66f1a2b3c4d5e6f7a8b9c0e2",
        "seasonNumber": 1,
        "episodeNumber": 2,
        "seasonEpisodeTag": "S1 · E02",
        "title": "If This Is LOVE Let Me Burn",
        "durationSeconds": 135,
        "formattedDuration": "2:15",
        "thumbnailUrl": "https://images.unsplash.com/photo-...",
        "isFree": true,
        "hasAccess": true,
        "isLocked": false,
        "isCurrent": true,
        "watched": {
          "watchedSeconds": 45,
          "formattedWatched": "0:45",
          "progressPercentage": 33.3,
          "isCompleted": false
        }
      },
      {
        "id": "66f1a2b3c4d5e6f7a8b9c0e4",
        "seasonNumber": 1,
        "episodeNumber": 4,
        "seasonEpisodeTag": "S1 · E04",
        "title": "Forbidden Heartstrings",
        "durationSeconds": 140,
        "formattedDuration": "2:20",
        "thumbnailUrl": "https://images.unsplash.com/photo-...",
        "isFree": false,
        "hasAccess": false,
        "isLocked": true,
        "isCurrent": false,
        "watched": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 30,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "userHasVip": false
  }
}
```

---

### 2.4 Sync Playback Progress
**Endpoint:** `POST /api/v1/player/progress`  
**Authorization:** Optional / Recommended.

#### Purpose:
Fired every 5–10s by the player or when user scrubs. Automatically calculates watched percentage (`45s / 135s = 33.3%`) and marks completed when reaching 90%+.

#### Request Body:
```json
{
  "dramaId": "security-guard-ki-ceo-gf",
  "episodeNumber": 2,
  "watchedSeconds": 45,
  "durationSeconds": 135
}
```

#### Sample Response (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Playback progress recorded successfully",
  "data": {
    "dramaId": "66f1a2b3c4d5e6f7a8b9c0d1",
    "episodeNumber": 2,
    "watchedSeconds": 45,
    "formattedWatched": "0:45",
    "durationSeconds": 135,
    "formattedDuration": "2:15",
    "progressPercentage": 33.3,
    "isCompleted": false
  }
}
```

---

### 2.5 Get All Dramas (Paginated)
**Endpoint:** `GET /api/v1/dramas?page=1&limit=10&genre=&search=&trending=`  
**Authorization:** Public.

#### Query Parameters:
- `page`: Page number (default: `1`).
- `limit`: Items per page (default: `10`).
- `genre`: Filter by genre slug (e.g. `romance`, `thriller`).
- `search`: Keyword search in title/synopsis.
- `trending`: `true` to sort by trending rank.

#### Sample Response (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "All dramas fetched successfully",
  "data": {
    "dramas": [
      {
        "id": "66f1a2b3c4d5e6f7a8b9c0d1",
        "title": "Security Guard Ki CEO GF",
        "slug": "security-guard-ki-ceo-gf",
        "synopsis": "A humble security guard with a mysterious past...",
        "posterUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=720&q=80",
        "bannerUrl": "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=1280&q=80",
        "trailerUrl": "https://commondatastorage.googleapis.com/.../trailer.mp4",
        "genres": ["Romance", "Drama"],
        "genreDisplay": "Romance / Drama",
        "totalEpisodes": 30,
        "viewsCount": 35400,
        "rating": 4.9,
        "isTrending": true,
        "isNewRelease": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 24,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### 2.6 Get Single Drama Details
**Endpoint:** `GET /api/v1/dramas/:id` (by slug or ID)  
**Authorization:** Optional (attaches user's continue watching status).

#### Sample Response (200 OK):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Drama details retrieved successfully",
  "data": {
    "drama": {
      "id": "66f1a2b3c4d5e6f7a8b9c0d1",
      "title": "Security Guard Ki CEO GF",
      "slug": "security-guard-ki-ceo-gf",
      "synopsis": "A humble security guard with a mysterious past...",
      "posterUrl": "https://images.unsplash.com/photo-...",
      "genres": ["Romance", "Drama"],
      "genreDisplay": "Romance / Drama",
      "totalEpisodes": 30,
      "viewsCount": 35400,
      "rating": 4.9,
      "firstEpisode": {
        "id": "66f1a2b3c4d5e6f7a8b9c0e1",
        "episodeNumber": 1,
        "seasonEpisodeTag": "S1 · E01",
        "title": "The First Encounter",
        "durationSeconds": 135,
        "formattedDuration": "2:15"
      },
      "continueWatching": {
        "episodeNumber": 2,
        "watchedSeconds": 45,
        "durationSeconds": 135,
        "progressPercentage": 33.3,
        "isCompleted": false
      }
    }
  }
}
```

---

## 3. Summary of API Names & Endpoints

| Purpose | Method | Path | Pagination |
| :--- | :--- | :--- | :--- |
| **All Dramas** | `GET` | `/api/v1/dramas` | Yes (`?page=1&limit=10`) |
| **Drama Details** | `GET` | `/api/v1/dramas/:id` | No |
| **Check Access** | `GET` / `POST` | `/api/v1/player/access/:dramaId/:ep` | No |
| **Play Stream** | `GET` | `/api/v1/player/play/:dramaId/:ep` | No |
| **Episodes Drawer** | `GET` | `/api/v1/player/episodes/:dramaId` | Yes (`?page=1&limit=20`) |
| **Progress Sync** | `POST` | `/api/v1/player/progress` | No |
