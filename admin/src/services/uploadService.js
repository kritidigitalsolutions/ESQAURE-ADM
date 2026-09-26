const API_BASE = '/api/v1/upload';
const FALLBACK_BASE = 'http://localhost:5001/api/v1/upload';

/**
 * Service for uploading media assets (images, videos, trailers, posters)
 * to backend storage with CDN-ready public URLs.
 */
export const uploadService = {
  /**
   * Upload a single file (image, video, document)
   * @param {File} file - Browser File object
   * @param {string} [folder] - Subfolder category e.g. 'images', 'videos'
   * @returns {Promise<{ filename, originalName, mimetype, size, folder, url, path }>}
   */
  async uploadSingle(file, folder = '') {
    if (!file) {
      throw new Error('Please select a file to upload.');
    }

    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    const tryUpload = async (url) => {
      const response = await fetch(url, {
        method: 'POST',
        body: formData
        // Note: fetch will automatically set multipart/form-data with proper boundary
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Upload server returned non-JSON response (${contentType})`);
      }

      const json = await response.json();
      if (!response.ok || json.success === false) {
        throw new Error(json.message || 'File upload failed');
      }

      return json.data;
    };

    try {
      return await tryUpload(`${API_BASE}/single`);
    } catch (err) {
      // Fallback directly to backend port 5001 if Vite proxy fails
      return await tryUpload(`${FALLBACK_BASE}/single`);
    }
  },

  /**
   * Upload multiple files simultaneously
   * @param {FileList|File[]} files - List of File objects
   * @param {string} [folder] - Subfolder category
   * @returns {Promise<{ count, files: Array<{ filename, originalName, mimetype, size, folder, url, path }> }>}
   */
  async uploadMultiple(files, folder = '') {
    if (!files || files.length === 0) {
      throw new Error('Please select one or more files to upload.');
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    if (folder) {
      formData.append('folder', folder);
    }

    const tryUpload = async (url) => {
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Upload server returned non-JSON response (${contentType})`);
      }

      const json = await response.json();
      if (!response.ok || json.success === false) {
        throw new Error(json.message || 'Multiple file upload failed');
      }

      return json.data;
    };

    try {
      return await tryUpload(`${API_BASE}/multiple`);
    } catch (err) {
      return await tryUpload(`${FALLBACK_BASE}/multiple`);
    }
  }
};
