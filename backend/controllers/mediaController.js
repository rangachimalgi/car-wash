import Media from '../models/Media.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  isR2Configured,
  uploadObjectToR2,
  deleteR2ObjectByPublicUrl,
  publicUrlToR2Key,
  randomSuffix,
} from '../services/r2Upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads', 'media');

function safeExt(originalname, mimetype, fallback = '.bin') {
  let ext = path.extname(originalname || '');
  if (!ext && mimetype) {
    if (/jpeg|jpg/i.test(mimetype)) ext = '.jpg';
    else if (/png/i.test(mimetype)) ext = '.png';
    else if (/webp/i.test(mimetype)) ext = '.webp';
    else if (/gif/i.test(mimetype)) ext = '.gif';
    else if (/mp4/i.test(mimetype)) ext = '.mp4';
    else if (/webm/i.test(mimetype)) ext = '.webm';
    else if (/quicktime|mov/i.test(mimetype)) ext = '.mov';
  }
  return ext || fallback;
}

async function removeStoredMediaFile(url) {
  if (!url || typeof url !== 'string') return;
  if (publicUrlToR2Key(url)) {
    await deleteR2ObjectByPublicUrl(url);
    return;
  }
  if (url.startsWith('/uploads/')) {
    const filePath = path.join(uploadsDir, path.basename(url));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}

// @desc    Get all media (admin) or by type
// @route   GET /api/media
// @access  Public (admin panel)
export const getMedia = async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};
    const items = await Media.find(query).sort({ type: 1, order: 1 });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ success: false, message: 'Error fetching media', error: error.message });
  }
};

// @desc    Get media for customer app (testimonials, transformations, seeTheDifference)
// @route   GET /api/media/public
// @access  Public
export const getPublicMedia = async (req, res) => {
  try {
    const [testimonials, transformations, seeTheDifference] = await Promise.all([
      Media.find({ type: 'testimonials' }).sort({ order: 1 }).select('url name order').lean(),
      Media.find({ type: 'transformations' }).sort({ order: 1 }).select('url name order').lean(),
      Media.find({ type: 'seeTheDifference' }).sort({ order: 1 }).select('url name order').lean(),
    ]);
    res.status(200).json({
      success: true,
      data: {
        testimonials,
        transformations,
        seeTheDifference,
      },
    });
  } catch (error) {
    console.error('Error fetching public media:', error);
    res.status(500).json({ success: false, message: 'Error fetching media', error: error.message });
  }
};

// @desc    Upload single media (testimonial or transformation video)
// @route   POST /api/media
// @access  Public (admin)
export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const type = req.body?.type || 'testimonials';
    if (!['testimonials', 'transformations'].includes(type)) {
      if (!isR2Configured() && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(400).json({ success: false, message: 'Type must be testimonials or transformations' });
    }
    const name = (req.body?.name || '').trim();
    let url;

    if (isR2Configured()) {
      const ext = safeExt(req.file.originalname, req.file.mimetype);
      const key = `media/${type}/${Date.now()}-${randomSuffix()}${ext}`;
      if (!req.file.buffer) {
        return res.status(500).json({ success: false, message: 'Upload buffer missing (R2 mode)' });
      }
      url = await uploadObjectToR2({
        key,
        body: req.file.buffer,
        contentType: req.file.mimetype || 'application/octet-stream',
      });
    } else {
      url = `/uploads/media/${req.file.filename}`;
    }

    const count = await Media.countDocuments({ type });
    const doc = await Media.create({ type, url, name, order: count });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    if (!isR2Configured() && req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }
    console.error('Error uploading media:', error);
    const providerCode = error?.name || error?.Code || error?.code || 'UploadError';
    const providerMessage = error?.message || 'Unknown upload failure';
    res.status(500).json({
      success: false,
      message: `Error uploading media (${providerCode})`,
      error: providerMessage,
    });
  }
};

// @desc    Upload See The Difference (exactly 3 images - replaces existing)
// @route   POST /api/media/see-the-difference
// @access  Public (admin)
export const uploadSeeTheDifference = async (req, res) => {
  const files = req.files;
  const image1 = files?.image1?.[0];
  const image2 = files?.image2?.[0];
  const image3 = files?.image3?.[0];

  const cleanupLocalTempFiles = () => {
    [image1, image2, image3].filter(Boolean).forEach((f) => {
      if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
    });
  };

  try {
    if (!image1 || !image2 || !image3) {
      cleanupLocalTempFiles();
      return res.status(400).json({
        success: false,
        message: 'Please upload all 3 images (image1, image2, image3)',
      });
    }

    const existing = await Media.find({ type: 'seeTheDifference' });
    for (const doc of existing) {
      await removeStoredMediaFile(doc.url);
    }
    await Media.deleteMany({ type: 'seeTheDifference' });

    const nameParts = (req.body?.names || '')
      .split(',')
      .map((s) => s.trim())
      .slice(0, 3);
    while (nameParts.length < 3) nameParts.push('');

    const ts = Date.now();
    let items;

    if (isR2Configured()) {
      const uploadOne = async (file, index) => {
        if (!file.buffer) throw new Error('Missing image buffer');
        const ext = safeExt(file.originalname, file.mimetype, '.jpg');
        const key = `media/see-the-difference/${ts}-${index}-${randomSuffix()}${ext}`;
        const url = await uploadObjectToR2({
          key,
          body: file.buffer,
          contentType: file.mimetype || 'image/jpeg',
        });
        return url;
      };
      const [u0, u1, u2] = await Promise.all([
        uploadOne(image1, 0),
        uploadOne(image2, 1),
        uploadOne(image3, 2),
      ]);
      items = [
        { type: 'seeTheDifference', url: u0, name: nameParts[0] || '', order: 0 },
        { type: 'seeTheDifference', url: u1, name: nameParts[1] || '', order: 1 },
        { type: 'seeTheDifference', url: u2, name: nameParts[2] || '', order: 2 },
      ];
    } else {
      items = [
        { type: 'seeTheDifference', url: `/uploads/media/${image1.filename}`, name: nameParts[0] || '', order: 0 },
        { type: 'seeTheDifference', url: `/uploads/media/${image2.filename}`, name: nameParts[1] || '', order: 1 },
        { type: 'seeTheDifference', url: `/uploads/media/${image3.filename}`, name: nameParts[2] || '', order: 2 },
      ];
    }

    const created = await Media.insertMany(items);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    cleanupLocalTempFiles();
    console.error('Error uploading see the difference:', error);
    res.status(500).json({ success: false, message: 'Error uploading images', error: error.message });
  }
};

// @desc    Delete media by ID
// @route   DELETE /api/media/:id
// @access  Public (admin)
export const deleteMedia = async (req, res) => {
  try {
    const doc = await Media.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }
    await removeStoredMediaFile(doc.url);
    await Media.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Media deleted' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ success: false, message: 'Error deleting media', error: error.message });
  }
};
