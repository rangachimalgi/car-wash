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
  isVideoUrl,
  generatePosterBufferFromVideoBuffer,
  generatePosterBufferFromVideoPath,
  generatePosterBufferFromVideoUrl,
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

function absoluteMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const s = url.trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/uploads/')) {
    const host = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 8000}`;
    return `${host.replace(/\/$/, '')}${s}`;
  }
  if (isR2Configured() && process.env.R2_PUBLIC_BASE_URL) {
    const base = process.env.R2_PUBLIC_BASE_URL.trim().replace(/\/$/, '');
    return `${base}/${s.replace(/^\//, '')}`;
  }
  return s;
}

async function persistPosterForMedia(doc, posterBuffer) {
  if (!posterBuffer?.length || !doc?._id) return '';
  const type = doc.type || 'testimonials';
  if (isR2Configured()) {
    const posterKey = `media/${type}/posters/${Date.now()}-${randomSuffix()}.jpg`;
    const posterUrl = await uploadObjectToR2({
      key: posterKey,
      body: posterBuffer,
      contentType: 'image/jpeg',
    });
    await Media.findByIdAndUpdate(doc._id, { posterUrl });
    return posterUrl;
  }
  const posterName = `poster-${Date.now()}-${randomSuffix()}.jpg`;
  const posterPath = path.join(uploadsDir, posterName);
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(posterPath, posterBuffer);
  const posterUrl = `/uploads/media/${posterName}`;
  await Media.findByIdAndUpdate(doc._id, { posterUrl });
  return posterUrl;
}

async function ensurePosterForMediaDoc(doc) {
  if (!doc?.url || doc.posterUrl || !isVideoUrl(doc.url)) return doc.posterUrl || '';

  let posterBuffer = null;
  if (doc.url.startsWith('/uploads/')) {
    const filePath = path.join(uploadsDir, path.basename(doc.url));
    if (fs.existsSync(filePath)) {
      posterBuffer = await generatePosterBufferFromVideoPath(filePath);
    }
  }
  if (!posterBuffer) {
    posterBuffer = await generatePosterBufferFromVideoUrl(absoluteMediaUrl(doc.url));
  }
  if (!posterBuffer) return '';
  return persistPosterForMedia(doc, posterBuffer);
}

let backfillRunning = false;
async function backfillMissingPostersInBackground() {
  if (backfillRunning) return;
  backfillRunning = true;
  try {
    const rows = await Media.find({
      type: { $in: ['testimonials', 'transformations'] },
      $or: [{ posterUrl: { $exists: false } }, { posterUrl: '' }, { posterUrl: null }],
    })
      .select('_id type url posterUrl')
      .lean();
    for (const row of rows) {
      if (!row?.url || !isVideoUrl(row.url)) continue;
      try {
        await ensurePosterForMediaDoc(row);
      } catch (err) {
        console.warn('[media] poster backfill skipped for', row._id, err?.message || err);
      }
    }
  } finally {
    backfillRunning = false;
  }
}

async function uploadPosterImageFile({ type, file }) {
  if (!file) return '';
  const ext = safeExt(file.originalname, file.mimetype, '.jpg');
  const contentType = file.mimetype || 'image/jpeg';

  if (isR2Configured()) {
    if (!file.buffer) return '';
    const posterKey = `media/${type}/posters/${Date.now()}-${randomSuffix()}${ext}`;
    return uploadObjectToR2({
      key: posterKey,
      body: file.buffer,
      contentType,
    });
  }

  if (file.path && fs.existsSync(file.path)) {
    const posterName = `poster-${Date.now()}-${randomSuffix()}${ext}`;
    const dest = path.join(uploadsDir, posterName);
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.copyFileSync(file.path, dest);
    return `/uploads/media/${posterName}`;
  }
  return '';
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

const PUBLIC_MEDIA_SELECT = 'url posterUrl name title description order';

// @desc    Get media for customer app (testimonials, transformations, seeTheDifference, homeSliders, whyChooseUs)
// @route   GET /api/media/public
// @access  Public
export const getPublicMedia = async (req, res) => {
  try {
    const [testimonials, transformations, seeTheDifference, homeSliders, whyChooseUs] = await Promise.all([
      Media.find({ type: 'testimonials' }).sort({ order: 1 }).select(PUBLIC_MEDIA_SELECT).lean(),
      Media.find({ type: 'transformations' }).sort({ order: 1 }).select(PUBLIC_MEDIA_SELECT).lean(),
      Media.find({ type: 'seeTheDifference' }).sort({ order: 1 }).select(PUBLIC_MEDIA_SELECT).lean(),
      Media.find({ type: 'homeSliders' }).sort({ order: 1 }).select(PUBLIC_MEDIA_SELECT).lean(),
      Media.find({ type: 'whyChooseUs' }).sort({ order: 1 }).select(PUBLIC_MEDIA_SELECT).lean(),
    ]);
    res.status(200).json({
      success: true,
      data: {
        testimonials,
        transformations,
        seeTheDifference,
        homeSliders,
        whyChooseUs,
      },
    });

    setImmediate(() => {
      backfillMissingPostersInBackground().catch(() => {});
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
  const uploadedPaths = [];
  try {
    const mainFile = req.files?.file?.[0] || req.file;
    const posterFile = req.files?.poster?.[0] || null;
    if (!mainFile) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    if (!isR2Configured() && mainFile.path) uploadedPaths.push(mainFile.path);
    if (!isR2Configured() && posterFile?.path) uploadedPaths.push(posterFile.path);

    const type = req.body?.type || 'testimonials';
    const allowedTypes = ['testimonials', 'transformations', 'seeTheDifference', 'homeSliders', 'whyChooseUs'];
    if (!allowedTypes.includes(type)) {
      uploadedPaths.forEach((p) => fs.existsSync(p) && fs.unlink(p, () => {}));
      return res.status(400).json({
        success: false,
        message: 'Invalid media type',
      });
    }
    const imageOnlyTypes = ['seeTheDifference', 'homeSliders', 'whyChooseUs'];
    if (imageOnlyTypes.includes(type)) {
      const mt = mainFile.mimetype || '';
      if (!/^image\/(jpeg|jpg|png|webp|gif)$/i.test(mt)) {
        uploadedPaths.forEach((p) => fs.existsSync(p) && fs.unlink(p, () => {}));
        return res.status(400).json({
          success: false,
          message: 'This media type accepts images only (JPEG, PNG, WebP, GIF)',
        });
      }
    }
    const title = (req.body?.title || '').trim();
    const description = (req.body?.description || '').trim();
    if (type === 'whyChooseUs' && (!title || !description)) {
      uploadedPaths.forEach((p) => fs.existsSync(p) && fs.unlink(p, () => {}));
      return res.status(400).json({
        success: false,
        message: 'Title and description are required for Why Choose Woosh cards',
      });
    }
    if (posterFile && !isVideoMime(mainFile.mimetype)) {
      uploadedPaths.forEach((p) => fs.existsSync(p) && fs.unlink(p, () => {}));
      return res.status(400).json({
        success: false,
        message: 'Thumbnail image is only used when uploading a video',
      });
    }
    const name = (req.body?.name || '').trim();
    const ext = safeExt(mainFile.originalname, mainFile.mimetype);
    let url;
    let posterUrl = '';

    if (isR2Configured()) {
      const key = `media/${type}/${Date.now()}-${randomSuffix()}${ext}`;
      if (!mainFile.buffer) {
        return res.status(500).json({ success: false, message: 'Upload buffer missing (R2 mode)' });
      }
      url = await uploadObjectToR2({
        key,
        body: mainFile.buffer,
        contentType: mainFile.mimetype || 'application/octet-stream',
      });
      if (posterFile) {
        posterUrl = await uploadPosterImageFile({ type, file: posterFile });
      } else if (isVideoMime(mainFile.mimetype)) {
        posterUrl = await uploadVideoPoster({
          type,
          videoBuffer: mainFile.buffer,
          videoExt: ext,
        });
      }
    } else {
      url = `/uploads/media/${mainFile.filename}`;
      if (posterFile) {
        posterUrl = await uploadPosterImageFile({ type, file: posterFile });
      } else if (isVideoMime(mainFile.mimetype) && mainFile.path) {
        posterUrl = await uploadVideoPoster({
          type,
          videoPath: mainFile.path,
          videoExt: ext,
        });
      }
    }

    const count = await Media.countDocuments({ type });
    const doc = await Media.create({
      type,
      url,
      posterUrl,
      name,
      title: type === 'whyChooseUs' ? title : '',
      description: type === 'whyChooseUs' ? description : '',
      order: count,
    });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    uploadedPaths.forEach((p) => fs.existsSync(p) && fs.unlink(p, () => {}));
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
// @desc    Generate missing video posters (testimonials + transformations)
// @route   POST /api/media/backfill-posters
export const backfillMediaPosters = async (req, res) => {
  try {
    await backfillMissingPostersInBackground();
    const remaining = await Media.countDocuments({
      type: { $in: ['testimonials', 'transformations'] },
      url: { $regex: /\.(mp4|webm|mov)(\?|$)/i },
      $or: [{ posterUrl: { $exists: false } }, { posterUrl: '' }, { posterUrl: null }],
    });
    res.status(200).json({
      success: true,
      message: remaining === 0 ? 'All video posters are ready.' : `${remaining} video(s) still missing posters.`,
      remaining,
    });
  } catch (error) {
    console.error('Error backfilling posters:', error);
    res.status(500).json({ success: false, message: 'Poster backfill failed', error: error.message });
  }
};

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
