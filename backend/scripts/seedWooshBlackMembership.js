/**
 * One-time seed: Woosh Black membership Service document.
 * Run from backend folder: node scripts/seedWooshBlackMembership.js
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Service from '../models/Service.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function run() {
  if (!MONGO_URI) {
    console.error('Set MONGO_URI in .env (same as backend server).');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);
  const existing = await Service.findOne({ category: 'Membership', name: 'Woosh Black' });
  if (existing) {
    console.log('Woosh Black membership service already exists:', existing._id.toString());
    await mongoose.disconnect();
    return;
  }

  const doc = await Service.create({
    name: 'Woosh Black',
    description: '12-month membership — save on every car wash.',
    category: 'Membership',
    basePrice: 499,
    listPrice: 1200,
    duration: '12 months',
    membershipDurationMonths: 12,
    membershipDiscountPercent: 40,
    isActive: true,
    image: '',
    rating: 0,
    totalReviews: 0,
    specifications: { coverage: [], notIncluded: [] },
  });

  console.log('Created Woosh Black membership service:', doc._id.toString());
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
