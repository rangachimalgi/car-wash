import express from 'express';
import { 
  updateUserVehicle, 
  getVehicles, 
  addVehicle, 
  deleteVehicle, 
  setSelectedVehicle 
} from '../controllers/userController.js';

const router = express.Router();

router.put('/vehicle', updateUserVehicle);
router.get('/:phone/vehicles', getVehicles);
router.post('/:phone/vehicles', addVehicle);
router.delete('/:phone/vehicles/:vehicleId', deleteVehicle);
router.put('/:phone/vehicles/:vehicleId/select', setSelectedVehicle);

export default router;
