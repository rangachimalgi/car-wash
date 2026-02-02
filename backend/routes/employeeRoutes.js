import express from 'express';
import { createEmployee, loginEmployee, getEmployees } from '../controllers/employeeController.js';

const router = express.Router();

router.post('/login', loginEmployee);
router.get('/', getEmployees);
router.post('/', createEmployee);

export default router;
