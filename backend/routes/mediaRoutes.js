import express from 'express';
import {
  getMedia,
  getPublicMedia,
  uploadMedia,
  deleteMedia,
  backfillMediaPosters,
} from '../controllers/mediaController.js';
import { uploadMediaFields } from '../config/multerMedia.js';

const router = express.Router();

router.get('/public', getPublicMedia);
router.post('/backfill-posters', backfillMediaPosters);
router.get('/', getMedia);
router.post('/', uploadMediaFields, uploadMedia);
router.delete('/:id', deleteMedia);

export default router;
