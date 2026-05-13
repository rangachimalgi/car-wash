import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { isR2Configured } from '../services/r2Upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(path.dirname(__dirname), 'uploads', 'media');

const filenameFromOriginal = (file) => {
  const ext = path.extname(file.originalname) || path.extname(file.mimetype) || '.bin';
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

const allowedVideo = /^video\/(mp4|webm|quicktime)$/i;
const allowedImage = /^image\/(jpeg|jpg|png|webp|gif)$/i;

/** R2 vs disk is chosen per request so it stays in sync with env after dotenv loads. */
function createUploadMediaSingle() {
  const storage = isR2Configured() ? multer.memoryStorage() : diskStorage;
  return multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (allowedVideo.test(file.mimetype) || allowedImage.test(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only videos (MP4, WebM) and images (JPEG, PNG, WebP, GIF) are allowed'));
      }
    },
  }).single('file');
}

function createUploadMediaSeeTheDifference() {
  const storage = isR2Configured() ? multer.memoryStorage() : diskStorage;
  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (allowedImage.test(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only images (JPEG, PNG, WebP, GIF) are allowed for See The Difference'));
      }
    },
  }).fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
  ]);
}

export const uploadMediaSingle = (req, res, next) => createUploadMediaSingle()(req, res, next);

export const uploadMediaSeeTheDifference = (req, res, next) =>
  createUploadMediaSeeTheDifference()(req, res, next);

export function getMediaUrl(filename) {
  return `/uploads/media/${filename}`;
}
