# Woosh Backend API

Backend API for Woosh - Car & Bike Wash Service Booking Platform

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the backend directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
NODE_ENV=development
```

### 3. Start Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### 4. Seed Sample Data
```bash
npm run seed:services
```

This will create sample services (Car Wash, Bike Wash, and Add-Ons) for testing.

---

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/
│   └── serviceController.js   # Service business logic
├── middleware/
│   └── errorHandler.js        # Error handling middleware
├── models/
│   └── Service.js             # Service data model
├── routes/
│   └── serviceRoutes.js       # Service API routes
├── scripts/
│   └── seedServices.js        # Database seeder
├── server.js                   # Express app entry point
└── package.json
```

---

## 📡 API Endpoints

### Services API

**Base URL:** `http://localhost:5000/api/services`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | Get all services (with filters) |
| GET | `/api/services/:id` | Get service by ID |
| GET | `/api/services/popular` | Get popular services |
| GET | `/api/services/category/:category` | Get services by category |

**Query Parameters:**
- `category`: Filter by `CarWash`, `BikeWash`, or `AddOn`
- `search`: Search by name or description
- `sortBy`: Sort by `price-low`, `price-high`, `rating`, or default
- `isActive`: Filter by active status (default: `true`)
- `limit`: Limit results (for popular endpoint)

**Example Requests:**
```bash
# Get all Car Wash services
GET /api/services?category=CarWash

# Get popular Bike Wash services
GET /api/services/popular?category=BikeWash&limit=3

# Search for services
GET /api/services?search=premium
```

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 🗄️ Database Models

### Service Model
```javascript
{
  name: String,
  description: String,
  category: 'CarWash' | 'BikeWash' | 'AddOn',
  basePrice: Number,
  duration: String,
  image: String,
  images: [String],
  rating: Number (0-5),
  totalReviews: Number,
  isActive: Boolean,
  specifications: {
    weight: String,
    coverage: [String]
  },
  addOnServices: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔧 Development

### Adding New Services (via Admin Panel - Coming Soon)
Currently, you can add services via:
1. MongoDB directly
2. Admin APIs (to be implemented)
3. Seed script (for testing)

### Testing APIs
Use tools like:
- **Postman**
- **Thunder Client** (VS Code extension)
- **cURL**
- **Browser** (for GET requests)

Example cURL:
```bash
curl http://localhost:5000/api/services?category=CarWash
```

---

## 📝 Next Steps

1. ✅ Services API (Customer-facing)
2. ⏳ Authentication APIs
3. ⏳ User Management APIs
4. ⏳ Cart & Booking APIs
5. ⏳ Payment Integration
6. ⏳ Admin APIs (CRUD for services, bookings, etc.)

---

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGO_URI` in `.env` file
- Verify network connectivity

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using port 5000

### Services Not Found
- Run `npm run seed:services` to create sample data
- Check MongoDB connection
- Verify service IDs in requests

---

## 📄 License

Private - Woosh Platform
