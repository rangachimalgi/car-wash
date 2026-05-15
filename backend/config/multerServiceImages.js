import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { isR2Configured } from '../services/r2Upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(path.dirname(__dirname), 'uploads', 'services');

const filenameFromOriginal = (file) => {
  const ext = path.extname(file.originalname) || '.bin';
  const base = path.basename(file.originalname, ext).replace(/\s+/g, '-').slice(0, 40);
  return `${base}-${Date.now()}${ext}`;
};

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, filenameFromOriginal(file));
  },
});

const allowedImage = /^image\/(jpeg|jpg|png|webp|gif)$/i;

/** R2 vs disk is chosen per request so it stays in sync with env after dotenv loads. */
function createUploadServiceImageSingle() {
  const storage = isR2Configured() ? multer.memoryStorage() : diskStorage;
  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (allowedImage.test(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only images (JPEG, PNG, WebP, GIF) are allowed'));
      }
    },
  }).single('file');
}

export const uploadServiceImageSingle = (req, res, next) =>
  createUploadServiceImageSingle()(req, res, next);

export function getServiceImageLocalPath(filename) {
  return `/uploads/services/${filename}`;
}
