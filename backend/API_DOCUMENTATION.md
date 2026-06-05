# Woosh API Reference

Backend for Woosh car & bike wash — used by **customer app**, **employee app**, **admin panel**, and **website**.

---

## Base URL

| Environment | URL |
|-------------|-----|
| **Production** | `https://car-wash-vbry.onrender.com/api` |
| **Local dev** | `http://localhost:8000/api` (or `PORT` from `.env`, default `5000`) |

All paths below are relative to `/api`.

---

## Authentication

### Customer (OTP → JWT)

Used by customer app and website checkout.

1. `POST /auth/request-otp` → SMS OTP sent  
2. `POST /auth/verify-otp` → returns JWT  
3. Send on protected routes:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Token lifetime: **180 days**.

### Employee (ID + password → JWT)

1. `POST /employees/login` → returns JWT  
2. Send on protected employee routes:

```http
Authorization: Bearer <token>
```

Some order/job routes accept `?employeeId=WOOSHER01` instead of JWT (legacy employee access).

---

## Response format

**Success:**

```json
{
  "success": true,
  "data": { },
  "count": 0
}
```

**Error:**

```json
{
  "success": false,
  "message": "Human-readable error"
}
```

HTTP status: `400` validation, `401` auth, `404` not found, `500` server error.

---

## Website integration (minimum)

These endpoints are enough for a marketing/booking website:

| Step | Method | Path | Auth |
|------|--------|------|------|
| Login | POST | `/auth/request-otp` | No |
| Login | POST | `/auth/verify-otp` | No |
| Browse services | GET | `/services` | No |
| Time labels | GET | `/slots/times` | No |
| Availability | GET | `/slots/available` | No |
| Validate coupon | POST | `/coupons/validate` | Yes |
| Place order | POST | `/orders` | Yes |
| My orders | GET | `/orders` | Yes |
| Order detail | GET | `/orders/:id` | Yes |
| Hero media | GET | `/media/public` | No |
| Package pricing | GET | `/package-pricing` | No |

Reference client code: `customer-app/services/*.js` and `customer-app/screens/CheckoutScreen.js`.

---

# Auth

## POST `/auth/request-otp`

Send OTP to Indian mobile number (10 digits or `91` prefix).

**Body:**

| Field | Type | Required |
|-------|------|----------|
| `phone` | string | Yes |

**Example:**

```json
{ "phone": "9876543210" }
```

**Response:** `{ "success": true, "message": "OTP sent" }`

---

## POST `/auth/verify-otp`

Verify OTP and login/register user.

**Body:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `phone` | string | Yes | Same as request |
| `otp` | string | Yes | 6-digit code |
| `name` | string | No | Set on first signup |
| `referralCode` | string | No | Only applied for **new** users |

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJ...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "phone": "9876543210",
    "name": "Ranga"
  }
}
```

---

# Services

## GET `/services`

List services (public).

**Query:**

| Param | Values | Default |
|-------|--------|---------|
| `category` | `CarWash`, `BikeWash`, `AddOn`, `Membership` | all |
| `search` | string | — |
| `sortBy` | `price-low`, `price-high`, `rating` | newest |
| `isActive` | `true`, `false` | `true` |

**Example:** `GET /services?category=CarWash&sortBy=price-low`

---

## GET `/services/popular`

**Query:** `category`, `limit` (default 5)

---

## GET `/services/category/:category`

Category in path: `CarWash`, `BikeWash`, `AddOn`, `Membership`.

---

## GET `/services/:id`

Single service by MongoDB `_id`.

---

## POST `/services` · PUT `/services/:id` · DELETE `/services/:id`

Admin — create/update/delete service. **No auth middleware yet.**

**POST body (main fields):** `name`, `description`, `category`, `basePrice`, `duration`, `image`, `isActive`, `packages`, etc.

---

## POST `/services/upload-image`

Admin — multipart upload for service image.

---

## PUT `/services/wash-order`

Admin — reorder wash services (`orderedIds` array in body).

---

# Slots

## GET `/slots/times`

Active time slot labels for booking UI (public).

**Response data:** array of `{ time, startTime, endTime, order }`  
Example time: `"10:00 AM - 11:00 AM"`

---

## GET `/slots/available`

Booked vs available slots for a date range (public).

**Query (required):**

| Param | Format |
|-------|--------|
| `startDate` | ISO 8601, e.g. `2026-06-05T00:00:00.000Z` |
| `endDate` | ISO 8601 |

**Example:** `GET /slots/available?startDate=2026-06-05T00:00:00.000Z&endDate=2026-06-12T00:00:00.000Z`

---

## GET `/slots/times/all` · POST `/slots/times` · PUT `/slots/times/:id` · DELETE `/slots/times/:id`

Admin — manage time slot definitions.

---

## GET `/slots/daily/:date` · GET `/slots/daily/range` · POST `/slots/daily` · DELETE `/slots/daily/:date`

Admin — per-day slot overrides.

---

# Orders

## POST `/orders`

Create order. **Auth required.**

**Body:**

| Field | Type | Required |
|-------|------|----------|
| `items` | array | Yes |
| `customer` | object | Yes |
| `couponCode` | string | No |
| `walletUsedAmount` | number | No |
| `employeeIds` | string[] | No |

**`customer` object:**

| Field | Required |
|-------|----------|
| `name` | No |
| `phone` | No (recommended) |
| `address` | **Yes** |
| `vehicleType` | **Yes** e.g. `Car`, `Bike` |
| `vehicleModel` | **Yes** |
| `latitude`, `longitude` | No |

**`items[]` — OneTime wash:**

```json
{
  "serviceId": "507f1f77bcf86cd799439011",
  "addOnIds": ["507f..."],
  "packageType": "OneTime",
  "packageTimes": 1,
  "scheduledDate": "2026-06-10",
  "scheduledTimeSlot": "10:00 AM - 11:00 AM"
}
```

**`items[]` — Package wash:**

```json
{
  "serviceId": "507f...",
  "addOnIds": [],
  "packageType": "Monthly",
  "packageTimes": 4,
  "scheduledSlots": [
    { "scheduledDate": "2026-06-10", "scheduledTimeSlot": "10:00 AM - 11:00 AM" }
  ]
}
```

Or use `startDate` + `startTimeSlot` for auto-generated slots.

**`items[]` — Membership:**

```json
{
  "serviceId": "507f...",
  "packageType": "Membership",
  "packageTimes": 1
}
```

**Full example (website checkout):**

```json
{
  "items": [
    {
      "serviceId": "507f1f77bcf86cd799439011",
      "addOnIds": [],
      "packageType": "OneTime",
      "packageTimes": 1,
      "scheduledDate": "2026-06-10",
      "scheduledTimeSlot": "10:00 AM - 11:00 AM"
    }
  ],
  "customer": {
    "name": "Test User",
    "phone": "9876543210",
    "address": "123 Main St, Bangalore",
    "vehicleType": "Car",
    "vehicleModel": "Swift"
  },
  "couponCode": "SAVE50",
  "walletUsedAmount": 0
}
```

**Response:** `201` — `{ "success": true, "data": { order object with orderNumber, _id, status, ... } }`

**Order statuses:** `Pending`, `Paid`, `Scheduled`, `In Progress`, `Completed`, `Cancelled`

---

## GET `/orders`

Current user's orders. **Auth required.**

**Query:** `status` — comma-separated, e.g. `?status=Pending,Scheduled`

---

## GET `/orders/:id`

Order detail. **Auth required**, or `?employeeId=WOOSHER01` for assigned employee.

---

## PATCH `/orders/:id`

Update order status. **Auth** or `?employeeId=`.

**Body:**

| Field | Notes |
|-------|-------|
| `status` | One of: `Pending`, `Paid`, `Scheduled`, `In Progress`, `Completed`, `Cancelled` |
| `paymentReceived` | Required when employee marks `Completed` |

---

## POST `/orders/:id/rate`

Customer rates completed order. **Auth required.**

**Body:** `{ "rating": 5, "review": "Great wash" }` — rating 1–5.

---

## POST `/orders/:id/upsell-addons`

Add add-ons to upcoming booking. **Auth required.**

**Body:** `{ "addOnIds": ["507f..."], "entrySource": "upcoming_bookings" }`

---

## POST `/orders/:id/photos`

Upload before/after photos. Multipart. Employee: `?employeeId=`.

**Body field:** `type` = `before` or `after` + image files.

---

## POST `/orders/:id/request-start-otp` · POST `/orders/:id/verify-start-otp`

Employee start-service OTP flow. `?employeeId=` required.

---

## PATCH `/orders/:id/employee-location`

**Body:** `{ "latitude": 12.97, "longitude": 77.59 }` — employee live location.

---

## GET `/orders/admin/all` · GET `/orders/admin/reviews`

Admin — all orders / rated orders. **No auth currently** — restrict before production.

**Query:** `status` (comma-separated)

---

# Coupons (Woosh Coins)

## GET `/coupons`

List all coupons (admin).

---

## POST `/coupons`

Create coupon (admin).

**Body:** `code`, `discountType` (`FLAT` | `PERCENT`), `discountValue`, `minOrderAmount`, `maxDiscount`, `expiryDate`, `usageLimit`, `perUserLimit`, `isActive`

---

## POST `/coupons/validate`

Validate at checkout. **Auth required.**

**Body:**

| Field | Type |
|-------|------|
| `code` | string |
| `orderAmount` | number (pre-wallet total) |
| `phone` | string |

**Response:** `{ valid, message, discountAmount, finalAmount }`

---

# Users

## PUT `/users/me/push-token`

**Auth required.** Body: `{ "expoPushToken": "ExponentPushToken[...]" }`

---

## PUT `/users/vehicle`

Legacy single vehicle update.

**Body:** `{ "phone", "vehicleType", "vehicleModel" }`

---

## GET `/users/:phone/vehicles`

List saved vehicles for phone (10-digit local format).

---

## POST `/users/:phone/vehicles`

**Body:** `{ "vehicleType", "vehicleModel" }`

---

## DELETE `/users/:phone/vehicles/:vehicleId`

---

## PUT `/users/:phone/vehicles/:vehicleId/select`

Mark vehicle as selected.

---

## GET `/users/:phone/wallet`

Wallet balance + transactions.

---

## POST `/users/:phone/wallet/credit`

Admin credit wallet. **Body:** `{ "amount", "note" }`

---

## GET `/users/:phone/referral-info`

Referral code and stats for user.

---

# Memberships

## GET `/memberships/plans`

Public — active membership products from `Service` category `Membership`.

---

## GET `/memberships/me`

**Auth required** — current user's active membership.

---

# Package pricing

## GET `/package-pricing`

Public — monthly package matrix, cards, coverage for custom packages.

**Query:** `app` (optional), `vehicleType` (optional)

---

## PUT `/package-pricing`

Admin — save pricing config.

---

# Media

## GET `/media/public`

Public — homepage/marketing assets (no auth).

**Response data keys:** `testimonials`, `transformations`, `seeTheDifference`, `homeSliders`, `whyChooseUs`, `loginBanner`

---

## GET `/media` · POST `/media` · DELETE `/media/:id`

Admin — manage media library. POST is multipart.

---

# Employees

## POST `/employees/login`

**Body:** `{ "employeeId": "WOOSHER01", "password": "..." }`

**Response:** `{ token, data: { employeeId, name, phone } }`

---

## GET `/employees` · POST `/employees` · PUT `/employees/:employeeId` · DELETE `/employees/:employeeId`

Admin — CRUD employees.

---

## PUT `/employees/:employeeId/password`

**Body:** `{ "password": "newPassword" }`

---

## GET `/employees/me/documents` · POST `/employees/me/documents`

**Auth (employee).** Upload Aadhar/PAN etc. (multipart).

---

# Jobs (employee app)

All require `employeeId` in query or body.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/jobs/incoming` | Pending assignment jobs |
| GET | `/jobs/queue` | Accepted jobs |
| GET | `/jobs/history` | Declined/completed |
| POST | `/jobs/:id/accept` | Accept job |
| POST | `/jobs/:id/decline` | Decline job |

---

# Attendance

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/attendance/check-in` | Employee | Mark check-in |
| GET | `/attendance/today` | Employee | Today's status |
| GET | `/attendance/history` | Employee | History |
| GET | `/attendance/admin/all` | No | All attendance |
| GET | `/attendance/admin/employee/:employeeId` | No | By employee |

---

# Inventory

| Method | Path | Description |
|--------|------|-------------|
| GET | `/inventory` | List items. Query: `category`, `lowStock`, `search` |
| GET | `/inventory/:id` | Single item |
| POST | `/inventory` | Create. Body: `name`, `category`, `currentStock`, `unit`, `maxCapacity`, `lowStockThreshold`, ... |
| PUT | `/inventory/:id` | Update item |
| PATCH | `/inventory/:id/stock` | Adjust stock |
| DELETE | `/inventory/:id` | Delete |
| GET | `/inventory/:id/usage` | Usage history |
| POST | `/inventory/:id/usage` | Record usage. Body: `quantity`, `orderId`, `employeeId`, `note` |
| POST | `/inventory/:id/refill-request` | Request refill. Body: `quantity`, `reason`, `notes`, `employeeId` |

---

# Employee incentives

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/employee-incentives/config` | No | Incentive rules |
| PUT | `/employee-incentives/config` | No | Update rules |
| GET | `/employee-incentives/upsell-config` | No | Upsell config |
| PUT | `/employee-incentives/upsell-config` | No | Update upsell |
| GET | `/employee-incentives/me` | Employee | My earnings |

---

# Health check

## GET `/`

Not under `/api` — root of server.

```json
{ "message": "Woosh API is running", "status": "success" }
```

---

# Security notes (important)

Several **admin** routes have **no authentication** today (orders admin, services CRUD, slots admin, inventory, etc.). This is fine for dev; **add auth or IP restriction before public launch.**

Website integrators should **only** use customer-facing endpoints listed in the website section. Do **not** expose admin routes or MongoDB credentials.

---

# Quick test flow (curl)

```bash
BASE=https://car-wash-vbry.onrender.com/api

# 1. Request OTP
curl -X POST "$BASE/auth/request-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'

# 2. Verify (replace OTP)
curl -X POST "$BASE/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","otp":"123456","name":"Test"}'

# 3. List services
curl "$BASE/services?category=CarWash"

# 4. My orders (replace TOKEN)
curl "$BASE/orders" -H "Authorization: Bearer TOKEN"
```

---

*Last updated: June 2026 — matches `backend/server.js` routes.*
