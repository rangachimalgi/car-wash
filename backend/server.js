// Must run before any other local imports that read process.env at module load (e.g. multer R2 vs disk).
import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import connectDB from './config/db.js';
import { startKeepAlive } from './keepAlive.js';
import { getMissingR2EnvKeys, isR2Configured } from './services/r2Upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Connect to database
connectDB();

if (isR2Configured()) {
  console.log('📦 Uploads (media + service images): Cloudflare R2');
} else {
  const missing = getMissingR2EnvKeys();
  console.log(
    `📁 Uploads: local disk (missing R2 env: ${missing.join(', ') || 'unknown'})`
  );
}

const app = express();

// Ensure uploads directory exists (for employee documents)
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(path.join(uploadsDir, 'documents'), { recursive: true });
fs.mkdirSync(path.join(uploadsDir, 'media'), { recursive: true });
fs.mkdirSync(path.join(uploadsDir, 'services'), { recursive: true });
fs.mkdirSync(path.join(uploadsDir, 'order-photos'), { recursive: true });

// Middleware — admin panel is a different origin (e.g. Vite :5173 vs API :8000).
// Requests with Authorization need a concrete Access-Control-Allow-Origin, not "*".
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (employee documents)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Woosh API is running',
    status: 'success'
  });
});

// API Routes
import serviceRoutes from './routes/serviceRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import userRoutes from './routes/userRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import slotRoutes from './routes/slotRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import packagePricingRoutes from './routes/packagePricingRoutes.js';
import employeeIncentiveRoutes from './routes/employeeIncentiveRoutes.js';
import membershipRoutes from './routes/membershipRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

app.use('/api/services', serviceRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/package-pricing', packagePricingRoutes);
app.use('/api/employee-incentives', employeeIncentiveRoutes);
app.use('/api/memberships', membershipRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/bookings', bookingRoutes);

// Error handling middleware (must be after routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Listen on all network interfaces (0.0.0.0) so it's accessible from other devices
// Use 'localhost' or '127.0.0.1' if you only want local access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Accessible at http://localhost:${PORT} or http://YOUR_IP:${PORT}`);
  startKeepAlive();
});