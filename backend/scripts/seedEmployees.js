import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Employee from '../models/Employee.js';

dotenv.config();

const seedEmployees = async () => {
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error('❌ MongoDB not connected. Aborting seed.');
    process.exit(1);
  }

  const employees = [
    {
      employeeId: 'EMP-1001',
      name: 'Ranga',
      phone: '9000000001',
      password: 'Emp@1001',
    },
    {
      employeeId: 'EMP-1002',
      name: 'Kiran',
      phone: '9000000002',
      password: 'Emp@1002',
    },
    {
      employeeId: 'EMP-1003',
      name: 'Sana',
      phone: '9000000003',
      password: 'Emp@1003',
    },
  ];

  const results = [];

  for (const emp of employees) {
    const existing = await Employee.findOne({ employeeId: emp.employeeId });
    if (existing) {
      results.push({ employeeId: emp.employeeId, status: 'exists' });
      continue;
    }
    const passwordHash = await bcrypt.hash(emp.password, 10);
    await Employee.create({
      employeeId: emp.employeeId,
      name: emp.name,
      phone: emp.phone,
      passwordHash,
      isActive: true,
    });
    results.push({ employeeId: emp.employeeId, status: 'created' });
  }

  console.log('✅ Employee seed complete:', results);
  process.exit(0);
};

seedEmployees().catch((error) => {
  console.error('❌ Employee seed failed:', error);
  process.exit(1);
});
