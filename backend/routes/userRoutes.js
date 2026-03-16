import express from 'express';
import { 
  updateUserVehicle, 
  getVehicles, 
  addVehicle, 
  deleteVehicle, 
  setSelectedVehicle,
  updatePushToken,
  getWallet,
  creditWallet,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/me/push-token', protect, updatePushToken);
router.put('/vehicle', updateUserVehicle);
router.get('/:phone/vehicles', getVehicles);
router.post('/:phone/vehicles', addVehicle);
router.delete('/:phone/vehicles/:vehicleId', deleteVehicle);
router.put('/:phone/vehicles/:vehicleId/select', setSelectedVehicle);
router.get('/:phone/wallet', getWallet);
router.post('/:phone/wallet/credit', creditWallet);

export default router;
