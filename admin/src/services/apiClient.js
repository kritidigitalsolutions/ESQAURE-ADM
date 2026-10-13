import { auth } from './firebase.js';

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

    try {
      return await tryFetch(apiBase);
    } catch (err) {
      // If Vite proxy failed or returned 502/HTML, try connecting directly to backend port 5001
      if (resolvedFallback && resolvedFallback !== apiBase) {
        return await tryFetch(resolvedFallback);
      }
      throw err;
    }
  };
};

export default {
  getAdminAuthToken,
  createApiRequest
};
