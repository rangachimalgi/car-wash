import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(path.dirname(__dirname), 'uploads', 'order-photos');

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const orderId = (req.params?.id || 'order').slice(-6);
    cb(null, `order-${orderId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const allowedImage = /^image\/(jpeg|jpg|png|webp|gif)$/i;

export const uploadOrderPhotosMulter = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedImage.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, WebP, GIF) are allowed'));
    }
  },
}).array('photos', 4);
