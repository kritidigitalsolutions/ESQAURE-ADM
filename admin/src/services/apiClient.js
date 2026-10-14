import { auth } from './firebase.js';

// Global in-memory cache for API GET requests (Fast SWR layer)
const apiCache = new Map();
// Deduplication map for in-flight identical requests
const pendingRequests = new Map();

const DEFAULT_CACHE_TTL = 25 * 1000; // 25 seconds

/**
 * Clear client-side API memory cache
 * @param {string} [prefix] - optional route prefix to invalidate specific cache entries
 */
export const clearApiCache = (prefix = '') => {
  if (!prefix) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.includes(prefix)) {
      apiCache.delete(key);
    }
  }
};

/**
 * Retrieve current administrator authorization token.
 * Prioritizes active Firebase user ID Token, falling back to local storage or dev secret.
 */
export const getAdminAuthToken = async () => {
  try {
    if (auth && auth.currentUser) {
      const idToken = await auth.currentUser.getIdToken();
      if (idToken) return idToken;
    }
  } catch (err) {
    console.warn('[apiClient] Unable to retrieve Firebase ID token:', err);
  }

  try {
    const storedToken = localStorage.getItem('admin_token');
    if (storedToken) return storedToken;
  } catch {}

  // Safe developer key fallback for local offline testing
  return 'esquare_admin_dev_secret_2026';
};

/**
 * Factory to generate an authenticated service requester for a specific base route.
 *
 * @param {string} apiBase - e.g. '/api/v1/users'
 * @param {string} [fallbackBase] - e.g. 'http://localhost:5001/api/v1/users'
 */
export const createApiRequest = (apiBase, fallbackBase = '') => {
  const resolvedFallback = fallbackBase || `http://localhost:5001${apiBase}`;

  return async (endpoint = '', options = {}) => {
    const method = (options.method || 'GET').toUpperCase();
    const isGet = method === 'GET';
    const bypassCache = Boolean(options.bypassCache || options.headers?.['cache-control'] === 'no-cache');
    const ttl = options.cacheTtl ?? DEFAULT_CACHE_TTL;

    // Cache key incorporates base and query params
    const cacheKey = `${apiBase}${endpoint}`;

    // 1. Check in-memory cache for GET requests
    if (isGet && !bypassCache) {
      const cached = apiCache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt) {
        return cached.data;
      }
    }

    // 2. Request deduplication for simultaneous GET requests
    if (isGet && !bypassCache && pendingRequests.has(cacheKey)) {
      return await pendingRequests.get(cacheKey);
    }

    const token = await getAdminAuthToken();
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

    const baseHeaders = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-Admin-Key': token,
      ...(options.headers || {})
    };

    const tryFetch = async (baseUrl) => {
      const fullUrl = `${baseUrl}${endpoint}`;
      const response = await fetch(fullUrl, {
        ...options,
        headers: baseHeaders
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Expected JSON response but received: ${contentType}`);
      }

      const json = await response.json();
      if (!response.ok || json.success === false) {
        throw new Error(json.message || `API request failed with status ${response.status}`);
      }

      return json.data;
    };

    const executeRequest = async () => {
      try {
        let result;
        try {
          result = await tryFetch(apiBase);
        } catch (err) {
          // If Vite proxy failed or returned 502/HTML, try connecting directly to backend port 5001
          if (resolvedFallback && resolvedFallback !== apiBase) {
            result = await tryFetch(resolvedFallback);
          } else {
            throw err;
          }
        }

        // Cache successful GET results
        if (isGet) {
          apiCache.set(cacheKey, {
            data: result,
            expiresAt: Date.now() + ttl
          });
        } else {
          // Invalidate cache for mutations (POST, PUT, PATCH, DELETE)
          clearApiCache(apiBase);
        }

        return result;
      } finally {
        pendingRequests.delete(cacheKey);
      }
    };

    if (isGet && !bypassCache) {
      const pendingPromise = executeRequest();
      pendingRequests.set(cacheKey, pendingPromise);
      return await pendingPromise;
    }

    return await executeRequest();
  };
};

export default {
  getAdminAuthToken,
  createApiRequest,
  clearApiCache
};
