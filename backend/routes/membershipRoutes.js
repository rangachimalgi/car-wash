import express from 'express';
import { getMembershipPlans, getMyMembership } from '../controllers/membershipController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/plans', getMembershipPlans);
router.get('/me', protect, getMyMembership);

export default router;
