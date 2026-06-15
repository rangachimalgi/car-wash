import express from 'express';
import {
  acceptJob,
  declineJob,
  getIncomingJobs,
  getJobHistory,
  getEmployeeRatings,
  getQueueJobs,
} from '../controllers/jobController.js';

const router = express.Router();

router.get('/incoming', getIncomingJobs);
router.get('/queue', getQueueJobs);
router.get('/history', getJobHistory);
router.get('/ratings', getEmployeeRatings);
router.post('/:id/accept', acceptJob);
router.post('/:id/decline', declineJob);

export default router;
