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
import {
  isVideoMime,
  generatePosterBufferFromVideoBuffer,
  generatePosterBufferFromVideoPath,
} from '../services/videoPoster.js';

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

async function uploadVideoPoster({ type, videoBuffer, videoPath, videoExt }) {
  try {
    const posterBuffer = videoBuffer
      ? await generatePosterBufferFromVideoBuffer(videoBuffer, videoExt)
      : await generatePosterBufferFromVideoPath(videoPath);
    if (!posterBuffer?.length) return '';

    if (isR2Configured()) {
      const posterKey = `media/${type}/posters/${Date.now()}-${randomSuffix()}.jpg`;
      return await uploadObjectToR2({
        key: posterKey,
        body: posterBuffer,
        contentType: 'image/jpeg',
      });
    }

    const posterName = `poster-${Date.now()}-${randomSuffix()}.jpg`;
    const posterPath = path.join(uploadsDir, posterName);
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.writeFileSync(posterPath, posterBuffer);
    return `/uploads/media/${posterName}`;
  } catch (err) {
    console.warn('[uploadMedia] poster generation skipped:', err?.message || err);
    return '';
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

// @desc    Get media for customer app (testimonials, transformations, seeTheDifference, homeSliders)
// @route   GET /api/media/public
// @access  Public
export const getPublicMedia = async (req, res) => {
  try {
    const [testimonials, transformations, seeTheDifference, homeSliders] = await Promise.all([
      Media.find({ type: 'testimonials' }).sort({ order: 1 }).select('url posterUrl name order').lean(),
      Media.find({ type: 'transformations' }).sort({ order: 1 }).select('url posterUrl name order').lean(),
      Media.find({ type: 'seeTheDifference' }).sort({ order: 1 }).select('url posterUrl name order').lean(),
      Media.find({ type: 'homeSliders' }).sort({ order: 1 }).select('url posterUrl name order').lean(),
    ]);
    res.status(200).json({
      success: true,
      data: {
        testimonials,
        transformations,
        seeTheDifference,
        homeSliders,
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
    const allowedTypes = ['testimonials', 'transformations', 'seeTheDifference', 'homeSliders'];
    if (!allowedTypes.includes(type)) {
      if (!isR2Configured() && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid media type',
      });
    }
    if (type === 'seeTheDifference' || type === 'homeSliders') {
      const mt = req.file.mimetype || '';
      if (!/^image\/(jpeg|jpg|png|webp|gif)$/i.test(mt)) {
        if (!isR2Configured() && req.file.path && fs.existsSync(req.file.path)) {
          fs.unlink(req.file.path, () => {});
        }
        return res.status(400).json({
          success: false,
          message: 'This media type accepts images only (JPEG, PNG, WebP, GIF)',
        });
      }
    }
    const name = (req.body?.name || '').trim();
    const ext = safeExt(req.file.originalname, req.file.mimetype);
    let url;
    let posterUrl = '';

    if (isR2Configured()) {
      const key = `media/${type}/${Date.now()}-${randomSuffix()}${ext}`;
      if (!req.file.buffer) {
        return res.status(500).json({ success: false, message: 'Upload buffer missing (R2 mode)' });
      }
      url = await uploadObjectToR2({
        key,
        body: req.file.buffer,
        contentType: req.file.mimetype || 'application/octet-stream',
      });
      if (isVideoMime(req.file.mimetype)) {
        posterUrl = await uploadVideoPoster({
          type,
          videoBuffer: req.file.buffer,
          videoExt: ext,
        });
      }
    } else {
      url = `/uploads/media/${req.file.filename}`;
      if (isVideoMime(req.file.mimetype) && req.file.path) {
        posterUrl = await uploadVideoPoster({
          type,
          videoPath: req.file.path,
          videoExt: ext,
        });
      }
    }

    const count = await Media.countDocuments({ type });
    const doc = await Media.create({ type, url, posterUrl, name, order: count });
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
      details: error?.details || undefined,
    });
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
    if (doc.posterUrl) await removeStoredMediaFile(doc.posterUrl);
    await Media.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Media deleted' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ success: false, message: 'Error deleting media', error: error.message });
  }
};
