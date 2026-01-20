import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from '../models/Service.js';
import connectDB from '../config/db.js';

// Load environment variables
dotenv.config();

// Sample services data
const services = [
  // Car Wash Services
  {
    name: 'Basic Routine Cleaning',
    description: 'Professional cleaning service for your vehicle',
    category: 'CarWash',
    basePrice: 299,
    duration: '30 mins',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
    rating: 4.5,
    totalReviews: 120,
    specifications: {
      coverage: ['Exterior', 'Basic Interior'],
      notIncluded: [
        'Normal Interior Cleaning',
        'Dashboard Polish',
        '30 Days Air Freshener',
        'Dustbin',
        'Tissue Box',
        'Bucket Car Ceramic Wash',
        '340 GSM Microfiber Cloth',
        'Windshield Cleaning Tablet and Refill',
        'Odour Eliminator',
      ],
    },
    packages: {
      monthly: [
        { times: 2, discount: 5, price: 568, perWash: 284 },
        { times: 4, discount: 10, price: 1076, perWash: 269 },
        { times: 6, discount: 15, price: 1525, perWash: 254 },
        { times: 8, discount: 20, price: 1914, perWash: 239 },
      ],
      quarterly: [
        { times: 6, discount: 15, price: 4575, perWash: 254 },
        { times: 12, discount: 20, price: 8611, perWash: 239 },
        { times: 18, discount: 25, price: 12128, perWash: 224 },
      ],
      yearly: [
        { times: 24, discount: 25, price: 5382, perWash: 224 },
        { times: 36, discount: 30, price: 7543, perWash: 209 },
        { times: 48, discount: 35, price: 9331, perWash: 194 },
      ],
    },
    isActive: true,
  },
  {
    name: 'Premium Car Care',
    description: 'Premium deep cleaning and detailing service',
    category: 'CarWash',
    basePrice: 599,
    duration: '2 hours',
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=400&fit=crop',
    rating: 4.8,
    totalReviews: 250,
    specifications: {
      coverage: ['Exterior', 'Interior', 'Engine Bay', 'Tires'],
      notIncluded: [
        '30 Days Air Freshener',
        'Dustbin',
        'Tissue Box',
        'Bucket Car Ceramic Wash',
        'Windshield Cleaning Tablet and Refill',
        'Odour Eliminator',
      ],
    },
    packages: {
      monthly: [
        { times: 2, discount: 5, price: 1138, perWash: 569 },
        { times: 4, discount: 10, price: 2156, perWash: 539 },
        { times: 6, discount: 15, price: 3055, perWash: 509 },
        { times: 8, discount: 20, price: 3834, perWash: 479 },
      ],
      quarterly: [
        { times: 6, discount: 15, price: 9165, perWash: 509 },
        { times: 12, discount: 20, price: 17222, perWash: 479 },
        { times: 18, discount: 25, price: 24255, perWash: 449 },
      ],
      yearly: [
        { times: 24, discount: 25, price: 10764, perWash: 449 },
        { times: 36, discount: 30, price: 15085, perWash: 419 },
        { times: 48, discount: 35, price: 18662, perWash: 389 },
      ],
    },
    isActive: true,
  },
  {
    name: '360 Deep Cleaning',
    description: 'Complete 360-degree deep cleaning and sanitization',
    category: 'CarWash',
    basePrice: 899,
    duration: '3 hours',
    image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&h=400&fit=crop',
    rating: 4.9,
    totalReviews: 180,
    specifications: {
      coverage: ['Full Exterior', 'Full Interior', 'Engine Bay', 'Underbody', 'Sanitization'],
      notIncluded: [
        'Dustbin',
        'Tissue Box',
        'Bucket Car Ceramic Wash',
      ],
    },
    packages: {
      monthly: [
        { times: 2, discount: 5, price: 1708, perWash: 854 },
        { times: 4, discount: 10, price: 3236, perWash: 809 },
        { times: 6, discount: 15, price: 4585, perWash: 764 },
        { times: 8, discount: 20, price: 5754, perWash: 719 },
      ],
      quarterly: [
        { times: 6, discount: 15, price: 13755, perWash: 764 },
        { times: 12, discount: 20, price: 25866, perWash: 719 },
        { times: 18, discount: 25, price: 36428, perWash: 674 },
      ],
      yearly: [
        { times: 24, discount: 25, price: 16164, perWash: 674 },
        { times: 36, discount: 30, price: 22628, perWash: 629 },
        { times: 48, discount: 35, price: 27993, perWash: 584 },
      ],
    },
    isActive: true,
  },
  // Bike Wash Services
  {
    name: 'Basic Bike Wash',
    description: 'Quick and efficient cleaning service for your bike or scooter',
    category: 'BikeWash',
    basePrice: 199,
    duration: '20 mins',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=400&fit=crop&auto=format',
    rating: 4.6,
    totalReviews: 95,
    specifications: {
      coverage: ['Exterior', 'Basic Cleaning'],
      notIncluded: [
        'Normal Interior Cleaning',
        'Dashboard Polish',
        '30 Days Air Freshener',
        'Dustbin',
        'Tissue Box',
        'Bucket Bike Ceramic Wash',
        '340 GSM Microfiber Cloth',
        'Windshield Cleaning Tablet and Refill',
        'Odour Eliminator',
      ],
    },
    packages: {
      monthly: [
        { times: 2, discount: 5, price: 378, perWash: 189 },
        { times: 4, discount: 10, price: 716, perWash: 179 },
        { times: 6, discount: 15, price: 1015, perWash: 169 },
        { times: 8, discount: 20, price: 1274, perWash: 159 },
      ],
      quarterly: [
        { times: 6, discount: 15, price: 3045, perWash: 169 },
        { times: 12, discount: 20, price: 5731, perWash: 159 },
        { times: 18, discount: 25, price: 8069, perWash: 149 },
      ],
      yearly: [
        { times: 24, discount: 25, price: 3582, perWash: 149 },
        { times: 36, discount: 30, price: 5015, perWash: 139 },
        { times: 48, discount: 35, price: 6203, perWash: 129 },
      ],
    },
    isActive: true,
  },
  {
    name: 'Premium Bike Care',
    description: 'Comprehensive cleaning and detailing for your two-wheeler',
    category: 'BikeWash',
    basePrice: 399,
    duration: '1 hour',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=400&fit=crop&auto=format',
    rating: 4.7,
    totalReviews: 150,
    specifications: {
      coverage: ['Full Exterior', 'Engine Cleaning', 'Chain Lubrication', 'Tires'],
      notIncluded: [
        '30 Days Air Freshener',
        'Dustbin',
        'Tissue Box',
        'Bucket Bike Ceramic Wash',
        'Windshield Cleaning Tablet and Refill',
        'Odour Eliminator',
      ],
    },
    packages: {
      monthly: [
        { times: 2, discount: 5, price: 758, perWash: 379 },
        { times: 4, discount: 10, price: 1436, perWash: 359 },
        { times: 6, discount: 15, price: 2035, perWash: 339 },
        { times: 8, discount: 20, price: 2554, perWash: 319 },
      ],
      quarterly: [
        { times: 6, discount: 15, price: 6105, perWash: 339 },
        { times: 12, discount: 20, price: 11491, perWash: 319 },
        { times: 18, discount: 25, price: 16178, perWash: 299 },
      ],
      yearly: [
        { times: 24, discount: 25, price: 7182, perWash: 299 },
        { times: 36, discount: 30, price: 10058, perWash: 279 },
        { times: 48, discount: 35, price: 12435, perWash: 259 },
      ],
    },
    isActive: true,
  },
  {
    name: '360 Deep Bike Cleanings',
    description: 'Complete deep cleaning and sanitization for your bike',
    category: 'BikeWash',
    basePrice: 599,
    duration: '2 hours',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=400&fit=crop&auto=format',
    rating: 4.8,
    totalReviews: 80,
    specifications: {
      coverage: ['Full Exterior', 'Engine Deep Clean', 'Chain Service', 'Sanitization'],
      notIncluded: [
        'Dustbin',
        'Tissue Box',
        'Bucket Bike Ceramic Wash',
      ],
    },
    packages: {
      monthly: [
        { times: 2, discount: 5, price: 1138, perWash: 569 },
        { times: 4, discount: 10, price: 2156, perWash: 539 },
        { times: 6, discount: 15, price: 3055, perWash: 509 },
        { times: 8, discount: 20, price: 3834, perWash: 479 },
      ],
      quarterly: [
        { times: 6, discount: 15, price: 9165, perWash: 509 },
        { times: 12, discount: 20, price: 17222, perWash: 479 },
        { times: 18, discount: 25, price: 24255, perWash: 449 },
      ],
      yearly: [
        { times: 24, discount: 25, price: 10764, perWash: 449 },
        { times: 36, discount: 30, price: 15085, perWash: 419 },
        { times: 48, discount: 35, price: 18662, perWash: 389 },
      ],
    },
    isActive: true,
  },
  // Car Wash Add-On Services
  {
    name: 'Interior Vacuum',
    description: 'Deep vacuum cleaning for car interiors',
    category: 'AddOn',
    basePrice: 99,
    duration: '15 mins',
    image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=300&h=200&fit=crop',
    rating: 4.4,
    totalReviews: 200,
    specifications: {
      coverage: ['Interior Vacuum'],
    },
    isActive: true,
  },
  {
    name: 'Engine Bay Cleaning',
    description: 'Professional engine bay cleaning and degreasing',
    category: 'AddOn',
    basePrice: 149,
    duration: '20 mins',
    image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=300&h=200&fit=crop',
    rating: 4.6,
    totalReviews: 150,
    specifications: {
      coverage: ['Engine Bay'],
    },
    isActive: true,
  },
  {
    name: 'Tire Shine',
    description: 'Tire cleaning and shine treatment',
    category: 'AddOn',
    basePrice: 49,
    duration: '10 mins',
    image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=300&h=200&fit=crop',
    rating: 4.3,
    totalReviews: 300,
    specifications: {
      coverage: ['Tires'],
    },
    isActive: true,
  },
  // Bike Wash Add-On Services
  {
    name: 'Chain Lubrication',
    description: 'Chain cleaning and lubrication service',
    category: 'AddOn',
    basePrice: 79,
    duration: '15 mins',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&h=200&fit=crop',
    rating: 4.5,
    totalReviews: 180,
    specifications: {
      coverage: ['Chain Service'],
    },
    isActive: true,
  },
  {
    name: 'Bike Engine Cleaning',
    description: 'Professional bike engine cleaning and degreasing',
    category: 'AddOn',
    basePrice: 129,
    duration: '20 mins',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&h=200&fit=crop',
    rating: 4.6,
    totalReviews: 120,
    specifications: {
      coverage: ['Engine Cleaning'],
    },
    isActive: true,
  },
  {
    name: 'Bike Tire Polish',
    description: 'Bike tire cleaning and polish treatment',
    category: 'AddOn',
    basePrice: 39,
    duration: '10 mins',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&h=200&fit=crop',
    rating: 4.2,
    totalReviews: 250,
    specifications: {
      coverage: ['Tires'],
    },
    isActive: true,
  },
];

const seedServices = async () => {
  try {
    // Connect to database
    await connectDB();

    // Clear existing services before seeding
    await Service.deleteMany({});
    console.log('🗑️  Existing services cleared');

    // Insert services
    const createdServices = await Service.insertMany(services);
    console.log(`✅ ${createdServices.length} services created successfully!`);

    // Separate services by category
    const carWashServices = createdServices.filter(s => s.category === 'CarWash');
    const bikeWashServices = createdServices.filter(s => s.category === 'BikeWash');
    const carAddOns = createdServices.filter(s => s.category === 'AddOn' && 
      ['Interior Vacuum', 'Engine Bay Cleaning', 'Tire Shine'].includes(s.name));
    const bikeAddOns = createdServices.filter(s => s.category === 'AddOn' && 
      ['Chain Lubrication', 'Bike Engine Cleaning', 'Bike Tire Polish'].includes(s.name));

    // Link Car Wash add-ons to Car Wash services
    for (const carService of carWashServices) {
      carService.addOnServices = carAddOns.map(addon => addon._id);
      await carService.save();
    }

    // Link Bike Wash add-ons to Bike Wash services
    for (const bikeService of bikeWashServices) {
      bikeService.addOnServices = bikeAddOns.map(addon => addon._id);
      await bikeService.save();
    }

    console.log('\n📋 Created Services:');
    createdServices.forEach((service, index) => {
      console.log(`${index + 1}. ${service.name} (${service.category}) - ₹${service.basePrice}`);
    });

    console.log('\n🔗 Linked Add-Ons:');
    console.log(`   Car Wash services: ${carWashServices.length} services with ${carAddOns.length} add-ons`);
    console.log(`   Bike Wash services: ${bikeWashServices.length} services with ${bikeAddOns.length} add-ons`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding services:', error);
    process.exit(1);
  }
};

// Run seeder
seedServices();
