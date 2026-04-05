import express from 'express';
import {
  getIncentiveConfig,
  putIncentiveConfig,
  getMyIncentiveEarnings,
  getUpsellConfig,
  putUpsellConfig,
} from '../controllers/employeeIncentiveController.js';
import { protectEmployee } from '../middleware/employeeAuthMiddleware.js';

const router = express.Router();

router.get('/config', getIncentiveConfig);
router.put('/config', putIncentiveConfig);
router.get('/upsell-config', getUpsellConfig);
router.put('/upsell-config', putUpsellConfig);
router.get('/me', protectEmployee, getMyIncentiveEarnings);

export default router;
