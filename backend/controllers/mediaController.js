import Media from '../models/Media.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads', 'media');

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
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ success: false, message: 'Type must be testimonials or transformations' });
    }
    const name = (req.body?.name || '').trim();
    const url = `/uploads/media/${req.file.filename}`;
    const count = await Media.countDocuments({ type });
    const doc = await Media.create({ type, url, name, order: count });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }
    console.error('Error uploading media:', error);
    res.status(500).json({ success: false, message: 'Error uploading media', error: error.message });
  }
};

// @desc    Upload See The Difference (exactly 3 images - replaces existing)
// @route   POST /api/media/see-the-difference
// @access  Public (admin)
export const uploadSeeTheDifference = async (req, res) => {
  try {
    const files = req.files;
    const image1 = files?.image1?.[0];
    const image2 = files?.image2?.[0];
    const image3 = files?.image3?.[0];
    if (!image1 || !image2 || !image3) {
      [image1, image2, image3].filter(Boolean).forEach((f) => f?.path && fs.unlinkSync(f.path));
      return res.status(400).json({
        success: false,
        message: 'Please upload all 3 images (image1, image2, image3)',
      });
    }
    const existing = await Media.find({ type: 'seeTheDifference' });
    for (const doc of existing) {
      const p = path.join(uploadsDir, path.basename(doc.url));
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    await Media.deleteMany({ type: 'seeTheDifference' });

    const names = (req.body?.names || '').split(',').map((s) => s.trim()).slice(0, 3);
    const items = [
      { type: 'seeTheDifference', url: `/uploads/media/${image1.filename}`, name: names[0] || 'Slide 1', order: 0 },
      { type: 'seeTheDifference', url: `/uploads/media/${image2.filename}`, name: names[1] || 'Slide 2', order: 1 },
      { type: 'seeTheDifference', url: `/uploads/media/${image3.filename}`, name: names[2] || 'Slide 3', order: 2 },
    ];
    const created = await Media.insertMany(items);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (req.files) {
      Object.values(req.files).flat().forEach((f) => f?.path && fs.existsSync(f.path) && fs.unlinkSync(f.path));
    }
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
    const filePath = path.join(uploadsDir, path.basename(doc.url));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await Media.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Media deleted' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ success: false, message: 'Error deleting media', error: error.message });
  }
};
