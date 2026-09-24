import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller.js';
import { uploadSingleFile, uploadMultipleFiles } from '../middlewares/upload.middleware.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
//  FILE & MEDIA UPLOADS  (/api/v1/upload)
//  Accepts: images, videos, audio, documents
//  Files are auto-categorised by MIME type into uploads/images, uploads/videos, etc.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/upload/single
 * Upload one file at a time
 * Body: multipart/form-data — field: "file" (required), "folder" (optional custom subfolder)
 * Returns: { filename, originalName, mimetype, size, folder, url, path }
 */
router.post('/single', uploadSingleFile, UploadController.uploadSingle);

/**
 * POST /api/v1/upload/multiple
 * Upload up to 20 files in one request
 * Body: multipart/form-data — field: "files" (required, multi), "folder" (optional)
 * Returns: { count, files: [...] }
 */
router.post('/multiple', uploadMultipleFiles, UploadController.uploadMultiple);

export default router;
