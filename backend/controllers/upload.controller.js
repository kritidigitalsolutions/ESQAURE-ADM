import { ApiResponse } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

/**
 * Format file object into standard response metadata
 */
const formatFileResponse = (req, file) => {
  const subfolder = file.uploadSubfolder || 'documents';
  const protocol = req.protocol;
  const host = req.get('host');
  const publicUrl = `${protocol}://${host}/uploads/${subfolder}/${file.filename}`;

  return {
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    folder: subfolder,
    url: publicUrl,
    path: `uploads/${subfolder}/${file.filename}`
  };
};

export class UploadController {
  /**
   * Upload a single file (Field: 'file')
   * POST /api/v1/upload/single
   */
  static async uploadSingle(req, res, next) {
    try {
      if (!req.file) {
        return ApiResponse.error(
          res,
          "No file uploaded. Please attach a file using the form-data key 'file'.",
          ERROR_CODES.VALIDATION_ERROR,
          400
        );
      }

      const fileData = formatFileResponse(req, req.file);

      return ApiResponse.success(
        res,
        'File uploaded successfully.',
        fileData,
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload multiple files (Field: 'files', max 20)
   * POST /api/v1/upload/multiple
   */
  static async uploadMultiple(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return ApiResponse.error(
          res,
          "No files uploaded. Please attach one or more files using the form-data key 'files'.",
          ERROR_CODES.VALIDATION_ERROR,
          400
        );
      }

      const formattedFiles = req.files.map((file) => formatFileResponse(req, file));

      return ApiResponse.success(
        res,
        `${formattedFiles.length} file(s) uploaded successfully.`,
        {
          count: formattedFiles.length,
          files: formattedFiles
        },
        201
      );
    } catch (error) {
      next(error);
    }
  }
}
