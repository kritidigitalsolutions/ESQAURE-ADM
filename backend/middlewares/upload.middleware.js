import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root uploads directory: backend/uploads
export const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

/**
 * Ensure directory exists synchronously
 */
export const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Determine subfolder category based on MIME type or extension
 */
export const getSubfolderForMimetype = (mimetype = '', originalname = '') => {
  const ext = path.extname(originalname).toLowerCase();

  if (mimetype.startsWith('image/')) {
    return 'images';
  }
  if (mimetype.startsWith('video/')) {
    return 'videos';
  }
  if (mimetype.startsWith('audio/')) {
    return 'audios';
  }
  if (
    mimetype.includes('vtt') ||
    mimetype.includes('subrip') ||
    ext === '.srt' ||
    ext === '.vtt'
  ) {
    return 'subtitles';
  }
  return 'documents';
};

// Disk storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Support custom subfolder via query or body if safe (alphanumeric/hyphen/underscore)
    let folder = req.query.folder || req.body?.folder;
    if (!folder || typeof folder !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(folder)) {
      folder = getSubfolderForMimetype(file.mimetype, file.originalname);
    }
    const targetDir = path.join(UPLOADS_ROOT, folder);
    ensureDirectoryExists(targetDir);
    file.uploadSubfolder = folder; // attach to file object for url generation
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const finalFilename = `${uniqueSuffix}-${baseName || 'upload'}${ext}`;
    cb(null, finalFilename);
  }
});

// Configure multer instance
const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 MB max file size
  }
});

/**
 * Middleware for single file upload (field: 'file')
 */
export const uploadSingleFile = (req, res, next) => {
  const single = upload.single('file');
  single(req, res, (err) => {
    if (err) {
      return next(err);
    }
    next();
  });
};

/**
 * Middleware for multiple files upload (field: 'files', max: 20)
 */
export const uploadMultipleFiles = (req, res, next) => {
  const multi = upload.array('files', 20);
  multi(req, res, (err) => {
    if (err) {
      return next(err);
    }
    next();
  });
};
