import express from 'express';
import { createEmployee, loginEmployee } from '../controllers/employeeController.js';

const router = express.Router();

router.post('/login', loginEmployee);
router.post('/', createEmployee);

export default router;
