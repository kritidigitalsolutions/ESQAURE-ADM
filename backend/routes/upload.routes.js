import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller.js';
import { uploadSingleFile, uploadMultipleFiles } from '../middlewares/upload.middleware.js';

const router = Router();

/**
 * @route   POST /api/v1/upload/single
 * @desc    Upload a single media or document file
 * @access  Public / Authenticated
 * @body    multipart/form-data: { file: File, folder?: string }
 */
router.post('/single', uploadSingleFile, UploadController.uploadSingle);

/**
 * @route   POST /api/v1/upload/multiple
 * @desc    Upload multiple media or document files (up to 20)
 * @access  Public / Authenticated
 * @body    multipart/form-data: { files: File[], folder?: string }
 */
router.post('/multiple', uploadMultipleFiles, UploadController.uploadMultiple);

export default router;
