import express from 'express';
import {
  getMedia,
  getPublicMedia,
  uploadMedia,
  deleteMedia,
} from '../controllers/mediaController.js';
import { uploadMediaSingle } from '../config/multerMedia.js';

const router = express.Router();

router.get('/public', getPublicMedia);
router.get('/', getMedia);
router.post('/', uploadMediaSingle, uploadMedia);
router.delete('/:id', deleteMedia);

export default router;
