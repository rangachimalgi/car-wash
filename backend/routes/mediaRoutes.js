import express from 'express';
import {
  getMedia,
  getPublicMedia,
  uploadMedia,
  uploadSeeTheDifference,
  deleteMedia,
} from '../controllers/mediaController.js';
import { uploadMediaSingle, uploadMediaSeeTheDifference } from '../config/multerMedia.js';

const router = express.Router();

router.get('/public', getPublicMedia);
router.get('/', getMedia);
router.post('/', uploadMediaSingle, uploadMedia);
router.post('/see-the-difference', uploadMediaSeeTheDifference, uploadSeeTheDifference);
router.delete('/:id', deleteMedia);

export default router;
