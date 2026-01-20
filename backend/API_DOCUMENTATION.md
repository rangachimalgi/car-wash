# Woosh API Documentation

## Services API

### Base URL
```
http://localhost:5000/api/services
```

---

### 1. Get All Services
**GET** `/api/services`

Get all services with optional filters.

**Query Parameters:**
- `category` (optional): Filter by category - `CarWash`, `BikeWash`, or `AddOn`
- `search` (optional): Search by name or description
- `sortBy` (optional): Sort order - `price-low`, `price-high`, `rating`, or default (newest first)
- `isActive` (optional): Filter by active status - `true` or `false` (default: `true` for public)

**Example Requests:**
```bash
# Get all active services
GET /api/services

# Get only Car Wash services
GET /api/services?category=CarWash

# Get Bike Wash services sorted by price (low to high)
GET /api/services?category=BikeWash&sortBy=price-low

# Search for services
GET /api/services?search=premium

# Get all services (including inactive) - for admin
GET /api/services?isActive=false
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Basic Car Wash",
      "description": "Professional cleaning service for your vehicle",
      "category": "CarWash",
      "basePrice": 299,
      "duration": "30 mins",
      "image": "https://example.com/image.jpg",
      "images": [],
      "rating": 4.5,
      "totalReviews": 120,
      "isActive": true,
      "specifications": {
        "weight": "Standard",
        "coverage": ["Exterior", "Interior"]
      },
      "addOnServices": [],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 2. Get Service by ID
**GET** `/api/services/:id`

Get detailed information about a specific service.

**Example Request:**
```bash
GET /api/services/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Basic Car Wash",
    "description": "Professional cleaning service for your vehicle",
    "category": "CarWash",
    "basePrice": 299,
    "duration": "30 mins",
    "image": "https://example.com/image.jpg",
    "images": [],
    "rating": 4.5,
    "totalReviews": 120,
    "isActive": true,
    "specifications": {
      "weight": "Standard",
      "coverage": ["Exterior", "Interior"]
    },
    "addOnServices": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Interior Vacuum",
        "basePrice": 99,
        "image": "https://example.com/vacuum.jpg"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Service not found"
}
```

---

### 3. Get Popular Services
**GET** `/api/services/popular`

Get popular services sorted by rating and review count.

**Query Parameters:**
- `category` (optional): Filter by category
- `limit` (optional): Number of results (default: 5)

**Example Requests:**
```bash
# Get top 5 popular services
GET /api/services/popular

# Get top 3 popular Car Wash services
GET /api/services/popular?category=CarWash&limit=3
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Premium Car Care",
      "description": "Premium deep cleaning and detailing service",
      "category": "CarWash",
      "basePrice": 599,
      "image": "https://example.com/image.jpg",
      "rating": 4.8,
      "totalReviews": 250,
      "duration": "2 hours"
    }
  ]
}
```

---

### 4. Get Services by Category
**GET** `/api/services/category/:category`

Get all services in a specific category.

**Path Parameters:**
- `category`: Must be one of - `CarWash`, `BikeWash`, `AddOn`

**Query Parameters:**
- `sortBy` (optional): Sort order - `price-low`, `price-high`, or default (newest first)

**Example Requests:**
```bash
# Get all Car Wash services
GET /api/services/category/CarWash

# Get Bike Wash services sorted by price
GET /api/services/category/BikeWash?sortBy=price-low
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "category": "CarWash",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Basic Car Wash",
      "description": "Professional cleaning service",
      "category": "CarWash",
      "basePrice": 299,
      "duration": "30 mins",
      "image": "https://example.com/image.jpg",
      "rating": 4.5,
      "totalReviews": 120,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Invalid category. Must be one of: CarWash, BikeWash, AddOn"
}
```

---

## Service Model Structure

```javascript
{
  name: String (required),
  description: String (required),
  category: String (required) - enum: ['CarWash', 'BikeWash', 'AddOn'],
  basePrice: Number (required, min: 0),
  duration: String (required, default: '30 mins'),
  image: String (optional),
  images: [String] (optional),
  rating: Number (default: 0, min: 0, max: 5),
  totalReviews: Number (default: 0),
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: 'User', optional),
  specifications: {
    weight: String,
    coverage: [String]
  },
  addOnServices: [ObjectId] (ref: 'Service', optional),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Testing the APIs

### Using cURL:

```bash
# Get all services
curl http://localhost:5000/api/services

# Get Car Wash services
curl http://localhost:5000/api/services?category=CarWash

# Get popular services
curl http://localhost:5000/api/services/popular?limit=3

# Get service by ID
curl http://localhost:5000/api/services/YOUR_SERVICE_ID
```

### Using Postman/Thunder Client:
1. Set method to `GET`
2. Enter URL: `http://localhost:5000/api/services`
3. Add query parameters as needed
4. Send request

---

## Next Steps

1. **Seed Database**: Create sample services for testing
2. **Admin APIs**: Add CRUD operations for admin panel
3. **Authentication**: Add JWT auth for protected routes
4. **Validation**: Add request validation middleware
