import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(path.dirname(__dirname), 'uploads', 'media');

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || path.extname(file.mimetype) || '.bin';
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-').slice(0, 40);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const allowedVideo = /^video\/(mp4|webm|quicktime)$/i;
const allowedImage = /^image\/(jpeg|jpg|png|webp|gif)$/i;

export const uploadMediaSingle = multer({
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

export const uploadMediaSeeTheDifference = multer({
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

export function getMediaUrl(filename) {
  return `/uploads/media/${filename}`;
}
