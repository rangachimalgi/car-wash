import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(path.dirname(__dirname), 'uploads', 'documents');

const getEmployeeDir = (employeeId) => path.join(uploadsDir, String(employeeId));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const emp = req.employee;
    if (!emp || !emp._id) {
      return cb(new Error('Employee not found'));
    }
    const dir = getEmployeeDir(emp._id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const field = file.fieldname;
    const ext = path.extname(file.originalname) || '.jpg';
    const name = field === 'aadhar' ? 'aadhar' : field === 'pan' ? 'pan' : field;
    cb(null, `${name}${ext}`);
  },
});

export const uploadDocuments = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|webp)$/i;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, WebP) are allowed'));
    }
  },
}).fields([
  { name: 'aadhar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
]);

export function getDocumentUrl(employeeId, filename) {
  return `/uploads/documents/${employeeId}/${filename}`;
}
