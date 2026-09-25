# Home Screen, Dynamic Category Sections & Catalog APIs Specification

This document provides complete developer documentation for the **Home Feed & Discovery Engine**, **Continue Watching**, **Admin Prioritized Content**, **Categories/Genres**, and **Dynamic Category Sections**.

---

## 1. Architectural Highlights

- **Standardized Pagination Across All APIs**:
  Every listing endpoint accepts `page` (default 1) and `limit` (default 10) and returns a uniform metadata object:
  ```json
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 48,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
  ```
- **Admin Prioritization Engine**:
  Dramas and Home Category Sections support an admin-assigned `priority` / `displayOrder`. Lower integers (`1`, `2`, `3`...) represent the highest priority.
- **Dynamic Category Sections for Home Page**:
  Admin can create custom category sections that dynamically appear on the mobile Home Page. Supported types:
  - `GENRE`: Dynamically populates dramas matching a specific Genre.
  - `CUSTOM_CURATED`: Manually chosen drama series IDs by Admin.
  - `NEW_RELEASES`: Dynamic latest releases.
  - `TRENDING`: Dynamic trending dramas.
  - `PRIORITY_CONTENT`: Dramas ordered by admin priority score.
- **Graceful Guest Support**:
  Personalized endpoints (like Continue Watching and Recommended Categories) support `optionalAuthenticate`. If the user is unauthenticated, they return valid empty structures or curated fallbacks without throwing errors.

---

## 2. API Endpoints Summary

### Mobile App (Home Screen & Discovery)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/home/content` | All content ordered by Admin Priority | Public |
| `GET` | `/api/v1/home/continue-watching` | Unfinished dramas with resume timestamps & % | Optional Bearer |
| `GET` | `/api/v1/home/categories` | All categories ordered by Admin Priority | Public |
| `GET` | `/api/v1/home/recommended-categories` | Recommended categories as genres (Personalized) | Optional Bearer |
| `GET` | `/api/v1/home/new-releases` | Chronological new release dramas | Public |
| `GET` | `/api/v1/home/sections` | Dynamic home category sections configured by Admin | Public |
| `GET` | `/api/v1/home/sections/:idOrSlug` | View all dramas for a specific section | Public |
| `GET` | `/api/v1/home/feed` | Pre-aggregated complete Home screen feed | Optional Bearer |

### Admin Panel (Home Category Sections & Drama Priority)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/home/admin/sections` | Create a new category section on home page |
| `GET` | `/api/v1/home/admin/sections` | List all sections (search, filter, pagination) |
| `GET` | `/api/v1/home/admin/sections/:id` | Get section details |
| `PATCH` | `/api/v1/home/admin/sections/:id` | Update section title, layout, priority, etc. |
| `PATCH` | `/api/v1/home/admin/sections/reorder` | Batch reorder section display priorities |
| `PATCH` | `/api/v1/home/admin/sections/:id/toggle` | Quick toggle active/inactive |
| `DELETE` | `/api/v1/home/admin/sections/:id` | Delete section |
| `PATCH` | `/api/v1/home/admin/dramas/:id/priority` | Set individual drama priority score |

---

## 3. Detailed Request & Response Examples

### 3.1 All Content as per Admin Priority
`GET /api/v1/home/content?page=1&limit=10&genre=&sortOrder=asc`

#### Sample Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Content fetched as per admin priority successfully",
  "data": {
    "dramas": [
      {
        "id": "673cf58bb0104618e47f7a11",
        "title": "Billionaire's Secret Bride",
        "slug": "billionaires-secret-bride",
        "synopsis": "A contractual marriage turns into genuine passion...",
        "posterUrl": "https://cdn.esquarestories.com/posters/billionaire_bride.webp",
        "bannerUrl": "https://cdn.esquarestories.com/banners/billionaire_bride.webp",
        "trailerUrl": "https://cdn.esquarestories.com/trailers/billionaire_bride.mp4",
        "genres": ["Romance", "Drama"],
        "genreDisplay": "Romance / Drama",
        "totalEpisodes": 45,
        "viewsCount": 182400,
        "viewsFormatted": "182.4k",
        "rating": 4.9,
        "priority": 1,
        "isTrending": true,
        "isNewRelease": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 35,
      "totalPages": 4,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### 3.2 Continue Watching
`GET /api/v1/home/continue-watching?page=1&limit=10`
*Header*: `Authorization: Bearer <jwt_token>` (Optional)

#### Sample Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Continue watching list fetched successfully",
  "data": {
    "items": [
      {
        "historyId": "673cf891b0104618e47f7d99",
        "drama": {
          "id": "673cf58bb0104618e47f7a11",
          "title": "Billionaire's Secret Bride",
          "slug": "billionaires-secret-bride",
          "posterUrl": "https://cdn.esquarestories.com/posters/billionaire_bride.webp",
          "rating": 4.9,
          "totalEpisodes": 45,
          "genres": ["Romance"],
          "genreDisplay": "Romance"
        },
        "episode": {
          "id": "673cf701b0104618e47f7c03",
          "episodeNumber": 4,
          "seasonNumber": 1,
          "seasonEpisodeTag": "S1:E04",
          "title": "The Proposal",
          "durationSeconds": 140,
          "formattedDuration": "2:20"
        },
        "playback": {
          "watchedSeconds": 85,
          "formattedWatched": "1:25",
          "durationSeconds": 140,
          "formattedDuration": "2:20",
          "remainingSeconds": 55,
          "formattedRemaining": "0:55",
          "progressPercentage": 60.7,
          "isCompleted": false,
          "lastWatchedAt": "2026-09-25T10:15:00.000Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

### 3.3 All Categories as per Priority by Admin
`GET /api/v1/home/categories?page=1&limit=10&includeDramas=false`

#### Sample Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "All categories fetched as per admin priority",
  "data": {
    "categories": [
      {
        "id": "673ce101b0104618e47f7001",
        "name": "Romance",
        "slug": "romance",
        "icon": "heart",
        "iconUrl": "https://cdn.esquarestories.com/icons/romance.png",
        "imageUrl": "https://cdn.esquarestories.com/categories/romance.webp",
        "displayOrder": 1,
        "dramasCount": 18
      },
      {
        "id": "673ce101b0104618e47f7002",
        "name": "Thriller",
        "slug": "thriller",
        "icon": "zap",
        "iconUrl": "https://cdn.esquarestories.com/icons/thriller.png",
        "imageUrl": "https://cdn.esquarestories.com/categories/thriller.webp",
        "displayOrder": 2,
        "dramasCount": 12
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 8,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

### 3.4 Recommended Categories as Genres
`GET /api/v1/home/recommended-categories?page=1&limit=10&includeDramas=true&dramasLimit=6`

#### Sample Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Recommended categories as genres fetched successfully",
  "data": {
    "categories": [
      {
        "id": "673ce101b0104618e47f7001",
        "name": "Romance",
        "slug": "romance",
        "icon": "heart",
        "iconUrl": "https://cdn.esquarestories.com/icons/romance.png",
        "imageUrl": "https://cdn.esquarestories.com/categories/romance.webp",
        "displayOrder": 1,
        "isUserInterest": true,
        "dramasCount": 18,
        "dramas": [
          {
            "id": "673cf58bb0104618e47f7a11",
            "title": "Billionaire's Secret Bride",
            "slug": "billionaires-secret-bride",
            "posterUrl": "https://cdn.esquarestories.com/posters/billionaire_bride.webp",
            "rating": 4.9,
            "viewsFormatted": "182.4k"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 8,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    },
    "isPersonalized": true
  }
}
```

---

### 3.5 New Releases Section
`GET /api/v1/home/new-releases?page=1&limit=10`

#### Sample Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "New releases section fetched successfully",
  "data": {
    "dramas": [
      {
        "id": "673cf99ab0104618e47f7e22",
        "title": "Revenge of the Heiress",
        "slug": "revenge-of-the-heiress",
        "posterUrl": "https://cdn.esquarestories.com/posters/revenge_heiress.webp",
        "genres": ["Drama", "Mystery"],
        "genreDisplay": "Drama / Mystery",
        "viewsFormatted": "42.1k",
        "rating": 4.7,
        "isNewRelease": true,
        "releaseDate": "2026-09-24T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 12,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### 3.6 Dynamic Home Category Sections (Added by Admin)
`GET /api/v1/home/sections?page=1&limit=10`

#### Sample Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Home category sections fetched successfully",
  "data": {
    "sections": [
      {
        "id": "673cfa01b0104618e47f7f01",
        "title": "Trending Romantic Stories",
        "slug": "trending-romance",
        "subtitle": "Top romance micro-dramas of the month",
        "sectionType": "GENRE",
        "genre": {
          "id": "673ce101b0104618e47f7001",
          "name": "Romance",
          "slug": "romance"
        },
        "layout": "HORIZONTAL_CARD",
        "displayOrder": 1,
        "viewAllEnabled": true,
        "totalItems": 6,
        "dramas": [
          {
            "id": "673cf58bb0104618e47f7a11",
            "title": "Billionaire's Secret Bride",
            "posterUrl": "https://cdn.esquarestories.com/posters/billionaire_bride.webp",
            "viewsFormatted": "182.4k"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 4,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

### 3.7 Admin: Add New Category Section on Home Page
`POST /api/v1/home/admin/sections`

#### Request Body:
```json
{
  "title": "Trending Romantic Stories",
  "subtitle": "Top romance micro-dramas of the month",
  "sectionType": "GENRE",
  "genreId": "673ce101b0104618e47f7001",
  "layout": "HORIZONTAL_CARD",
  "displayOrder": 1,
  "maxItems": 10,
  "viewAllEnabled": true,
  "isActive": true
}
```

#### Response:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "New home category section created successfully",
  "data": {
    "section": {
      "id": "673cfa01b0104618e47f7f01",
      "title": "Trending Romantic Stories",
      "slug": "trending-romantic-stories",
      "subtitle": "Top romance micro-dramas of the month",
      "sectionType": "GENRE",
      "genreId": "673ce101b0104618e47f7001",
      "displayOrder": 1,
      "layout": "HORIZONTAL_CARD",
      "maxItems": 10,
      "viewAllEnabled": true,
      "isActive": true
    }
  }
}
```

---

### 3.8 Admin: Set Drama Priority Score
`PATCH /api/v1/home/admin/dramas/:id/priority`

#### Request Body:
```json
{
  "priority": 1
}
```

#### Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Drama \"Billionaire's Secret Bride\" priority set to 1",
  "data": {
    "drama": {
      "id": "673cf58bb0104618e47f7a11",
      "title": "Billionaire's Secret Bride",
      "priority": 1
    }
  }
}
```
