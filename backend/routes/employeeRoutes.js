import express from 'express';
import { createEmployee, loginEmployee, getEmployees, updatePushToken } from '../controllers/employeeController.js';
import { protectEmployee } from '../middleware/employeeAuthMiddleware.js';

const router = express.Router();

router.post('/login', loginEmployee);
router.get('/', getEmployees);
router.post('/', createEmployee);
router.put('/me/push-token', protectEmployee, updatePushToken);

export default router;
