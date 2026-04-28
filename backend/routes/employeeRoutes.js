import express from 'express';
import {
  createEmployee,
  changeEmployeePassword,
  loginEmployee,
  getEmployees,
  removeEmployee,
  updateEmployee,
  updatePushToken,
  getMyDocuments,
  uploadMyDocuments,
  getEmployeeDocuments,
} from '../controllers/employeeController.js';
import { protectEmployee } from '../middleware/employeeAuthMiddleware.js';
import { uploadDocuments } from '../config/multerDocuments.js';

const router = express.Router();

router.post('/login', loginEmployee);
router.get('/', getEmployees);
router.post('/', createEmployee);
router.put('/:employeeId', updateEmployee);
router.put('/:employeeId/password', changeEmployeePassword);
router.delete('/:employeeId', removeEmployee);
router.put('/me/push-token', protectEmployee, updatePushToken);

router.get('/me/documents', protectEmployee, getMyDocuments);
router.post('/me/documents', protectEmployee, uploadDocuments, uploadMyDocuments);
router.get('/:employeeId/documents', getEmployeeDocuments);

export default router;
