import express from 'express';
import {
  markCheckIn,
  getTodayAttendance,
  getAttendanceHistory,
  getAllAttendance,
  getEmployeeAttendance,
} from '../controllers/attendanceController.js';
import { protectEmployee } from '../middleware/employeeAuthMiddleware.js';

const router = express.Router();

// Employee routes (protected)
router.post('/check-in', protectEmployee, markCheckIn);
router.get('/today', protectEmployee, getTodayAttendance);
router.get('/history', protectEmployee, getAttendanceHistory);

// Admin routes (public for now, add admin auth later)
router.get('/admin/all', getAllAttendance);
router.get('/admin/employee/:employeeId', getEmployeeAttendance);

export default router;
