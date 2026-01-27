import express from 'express';
import { updateUserVehicle } from '../controllers/userController.js';

const router = express.Router();

router.put('/vehicle', updateUserVehicle);

export default router;
