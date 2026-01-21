import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
import { errorHandler } from './middleware/errorHandler.js';

app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/bookings', bookingRoutes);

// Error handling middleware (must be after routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});