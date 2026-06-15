import express from 'express';
import { 
  updateUserVehicle, 
  getVehicles, 
  addVehicle, 
  deleteVehicle, 
  setSelectedVehicle,
  updatePushToken,
  sendTestPushNotification,
  getWallet,
  creditWallet,
  getReferralInfo,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/me/push-token', protect, updatePushToken);
router.post('/me/test-push', protect, sendTestPushNotification);
router.put('/vehicle', updateUserVehicle);
router.get('/:phone/vehicles', getVehicles);
router.post('/:phone/vehicles', addVehicle);
router.delete('/:phone/vehicles/:vehicleId', deleteVehicle);
router.put('/:phone/vehicles/:vehicleId/select', setSelectedVehicle);
router.get('/:phone/wallet', getWallet);
router.post('/:phone/wallet/credit', creditWallet);
router.get('/:phone/referral-info', getReferralInfo);

export default router;
