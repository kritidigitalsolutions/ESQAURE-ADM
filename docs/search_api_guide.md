# Search & Discovery APIs Guide

## Overview

This guide details the Search and Discovery REST APIs implemented for the **E² Stories OTT Mobile App** based on the Search Screen UI reference ([Screenshot_20260916-124308.e_square_ott_app.png](file:///d:/OFFICE%20WORK/ESQAURE-ADM/Mobile%20app%20ui%20refrence%20screenshots/Screenshot_20260916-124308.e_square_ott_app.png)).

---

## Key Design Decisions & Requirements

1. **Genre-Personalized Recommendations ("Recommended for you")**:
   - Matches dramas according to the user's selected genres in their profile build / onboarding (`user.interests`).
   - If the user is unauthenticated (guest) or has not yet selected genres, the system automatically falls back to top-trending and highest-rated published dramas.
   - Includes view badge formatting (e.g. `▶ 3.5k`, `45k`, `1.2M`) matching the vertical card overlay shown in the UI.

2. **No Recent Searches**:
   - Per explicit requirements, **recent search history is omitted**. Neither recorded nor displayed.

3. **Popular Searches**:
   - Ranked list (`01`, `02`, `03`...) of trending/popular dramas, complete with rank badges, poster thumbnail, views count, rating, and navigation metadata.

4. **Multi-Field Real-Time Search & Autocomplete**:
   - Searches across drama `title`, `synopsis`, `tags`, and matching `genres` (name and slug).
   - Fast autocomplete suggestions for instant UI updates as the user types in the search bar.

---

## Base URL

```text
http://<host>:<port>/api/v1/search
```

---

## Endpoints Summary

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/search` | **Unified Route**: returns landing screen when `q` is omitted; executes search when `q` is provided | Optional |
| `GET` | `/api/v1/search/landing` | **Search Landing Screen**: Popular searches + genre-personalized recommendations | Optional |
| `GET` | `/api/v1/search/popular` | **Popular Searches**: Ranked list with `01`, `02`, `03`... badges | Optional |
| `GET` | `/api/v1/search/recommended` | **Recommended For You**: Personalized by profile genres, with pagination | Optional |
| `GET` | `/api/v1/search/suggestions` | **Instant Autocomplete**: Fast drama and genre suggestions | Optional |

---

## 1. Search Landing Screen Discovery API

Retrieves all sections needed to populate the initial Search screen before the user begins typing.

- **URL**: `GET /api/v1/search/landing` (or `GET /api/v1/search`)
- **Headers**:
  - `Authorization: Bearer <token>` *(Optional — enables profile-genre personalization)*
- **Query Parameters**:
  - `popularLimit` (optional, default `10`): Number of popular searches to return.
  - `recommendedLimit` (optional, default `10`): Number of recommended drama cards to return.

### Response (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Search screen discovery data retrieved successfully",
  "data": {
    "title": "Search",
    "subtitle": "Find a story that matches your mood",
    "popularSearches": [
      {
        "rank": "01",
        "displayRank": 1,
        "id": "66f40b2a8d3e5a001e3b1234",
        "title": "The Last Promise",
        "slug": "the-last-promise",
        "posterUrl": "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=720&q=80",
        "viewsCount": 45000,
        "viewsFormatted": "45k",
        "rating": 4.9,
        "totalEpisodes": 24,
        "genres": ["Romance"],
        "genreDisplay": "Romance"
      },
      {
        "rank": "02",
        "displayRank": 2,
        "id": "66f40b2a8d3e5a001e3b1235",
        "title": "Behind Lies",
        "slug": "behind-lies",
        "posterUrl": "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=720&q=80",
        "viewsCount": 22000,
        "viewsFormatted": "22k",
        "rating": 4.7,
        "totalEpisodes": 18,
        "genres": ["Thriller", "Mystery"],
        "genreDisplay": "Thriller / Mystery"
      }
    ],
    "recommendedForYou": [
      {
        "id": "66f40b2a8d3e5a001e3b1236",
        "title": "Security Guard Ki CEO GF",
        "slug": "security-guard-ki-ceo-gf",
        "synopsis": "A humble security guard with a mysterious past crosses paths with an uncompromising billionaire female CEO.",
        "posterUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=720&q=80",
        "bannerUrl": "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=1280&q=80",
        "genres": ["Romance", "Drama"],
        "genreDisplay": "Romance / Drama",
        "totalEpisodes": 30,
        "viewsCount": 35400,
        "viewsFormatted": "35.4k",
        "rating": 4.9,
        "isTrending": true,
        "isNewRelease": true
      }
    ],
    "isPersonalized": true,
    "userGenres": [
      {
        "id": "66f40b2a8d3e5a001e3b1201",
        "name": "Romance",
        "slug": "romance"
      }
    ]
  }
}
```

---

## 2. Popular Searches API

- **URL**: `GET /api/v1/search/popular`
- **Query Parameters**:
  - `limit` (optional, integer, default `10`, max `30`)

### Response (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Popular searches fetched successfully",
  "data": {
    "popularSearches": [
      {
        "rank": "01",
        "displayRank": 1,
        "id": "66f40b2a8d3e5a001e3b1234",
        "title": "The Last Promise",
        "slug": "the-last-promise",
        "posterUrl": "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=720&q=80",
        "viewsCount": 45000,
        "viewsFormatted": "45k",
        "rating": 4.9,
        "totalEpisodes": 24,
        "genres": ["Romance"],
        "genreDisplay": "Romance"
      }
    ]
  }
}
```

---

## 3. Recommended For You API (Personalized as per Profile Genres)

- **URL**: `GET /api/v1/search/recommended`
- **Headers**:
  - `Authorization: Bearer <token>` *(Optional)*
- **Query Parameters**:
  - `page` (optional, integer, default `1`)
  - `limit` (optional, integer, default `10`, max `50`)

### Response (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Recommended dramas fetched based on your profile genre preferences",
  "data": {
    "recommendedForYou": [
      {
        "id": "66f40b2a8d3e5a001e3b1236",
        "title": "Dhokha - A Dark Side of Love",
        "slug": "dhokha-dark-side-of-love",
        "synopsis": "A chilling romantic thriller exploring betrayal and vengeance.",
        "posterUrl": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=720&q=80",
        "bannerUrl": "",
        "genres": ["Romance", "Thriller"],
        "genreDisplay": "Romance / Drama",
        "totalEpisodes": 25,
        "viewsCount": 15400,
        "viewsFormatted": "15.4k",
        "rating": 4.85,
        "isTrending": true,
        "isNewRelease": false
      }
    ],
    "isPersonalized": true,
    "userGenres": [
      {
        "id": "66f40b2a8d3e5a001e3b1202",
        "name": "Thriller",
        "slug": "thriller"
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

## 4. Live Autocomplete Suggestions API

Provides instant suggestions as the user types in the search bar.

- **URL**: `GET /api/v1/search/suggestions`
- **Query Parameters**:
  - `q` (required, string, min 1 char)
  - `limit` (optional, integer, default `8`, max `20`)

### Example: `GET /api/v1/search/suggestions?q=Sec`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Suggestions fetched successfully",
  "data": {
    "query": "Sec",
    "suggestions": [
      {
        "type": "drama",
        "id": "66f40b2a8d3e5a001e3b1236",
        "title": "Security Guard Ki CEO GF",
        "slug": "security-guard-ki-ceo-gf",
        "posterUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=720&q=80",
        "rating": 4.9,
        "viewsFormatted": "35.4k"
      }
    ],
    "dramas": [
      {
        "id": "66f40b2a8d3e5a001e3b1236",
        "title": "Security Guard Ki CEO GF",
        "slug": "security-guard-ki-ceo-gf",
        "posterUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=720&q=80"
      }
    ],
    "genres": []
  }
}
```

---

## 5. Multi-Field Search Query API

Searches drama titles, synopsis, tags, and matching genres.

- **URL**: `GET /api/v1/search?q=Promise`
- **Query Parameters**:
  - `q` (required for search query, string)
  - `genre` (optional, genre slug or ObjectId)
  - `language` (optional, e.g. `'Hindi'`, `'English'`)
  - `sortBy` (optional: `'relevance'`, `'popular'`, `'latest'`, `'rating'`, default `'relevance'`)
  - `page` (optional, integer, default `1`)
  - `limit` (optional, integer, default `10`)

### Response (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Search results for \"Promise\"",
  "data": {
    "query": "Promise",
    "results": [
      {
        "id": "66f40b2a8d3e5a001e3b1234",
        "title": "The Last Promise",
        "slug": "the-last-promise",
        "synopsis": "A heart-wrenching story of unfulfilled promises and eternal devotion.",
        "posterUrl": "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=720&q=80",
        "bannerUrl": "",
        "trailerUrl": "",
        "genres": ["Romance"],
        "genreDisplay": "Romance",
        "totalEpisodes": 24,
        "viewsCount": 45000,
        "viewsFormatted": "45k",
        "rating": 4.9,
        "isTrending": true,
        "isNewRelease": false
      }
    ],
    "matchedGenres": [],
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
