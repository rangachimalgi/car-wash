# Attendance System Implementation Plan

## Overview
This document outlines the complete plan for implementing a secure attendance tracking system for employees with employee ID/password authentication, daily attendance marking, and tracking in both the employee app and admin panel.

---

## 1. Backend Implementation

### 1.1 Database Model - Attendance
**File**: `backend/models/Attendance.js`

```javascript
- employeeId (String, required, ref: Employee)
- date (Date, required) - Store date only (YYYY-MM-DD)
- checkIn (Date) - Timestamp when employee checked in
- checkOut (Date) - Timestamp when employee checked out
- status (String, enum: ['present', 'absent', 'late']) - Default: 'present'
- location (Object, optional) - { latitude, longitude } for check-in location
- notes (String, optional) - Any additional notes
- timestamps: true (createdAt, updatedAt)
```

**Indexes**:
- Unique compound index on `employeeId` + `date` (one attendance record per employee per day)

### 1.2 Employee Authentication
**File**: `backend/controllers/employeeController.js`

**Status**: ✅ Already implemented
- Current login uses `employeeId` + `password` (no changes needed)
- Login endpoint: `POST /api/employees/login`
- Returns JWT token with employeeId and employeeDbId

### 1.3 Employee Auth Middleware
**File**: `backend/middleware/employeeAuthMiddleware.js` (NEW)

```javascript
- Verify JWT token from employee login
- Extract employeeId from token
- Attach employee to req.employee
- Similar to protect middleware but for employees
```

### 1.4 Attendance Controller
**File**: `backend/controllers/attendanceController.js` (NEW)

**Endpoints**:
1. **POST `/api/attendance/check-in`**
   - Protected route (employee auth required)
   - Check if already checked in today
   - Create attendance record with checkIn timestamp
   - Return attendance record

2. **POST `/api/attendance/check-out`**
   - Protected route (employee auth required)
   - Find today's attendance record
   - Update checkOut timestamp
   - Return updated record

3. **GET `/api/attendance/today`**
   - Protected route (employee auth required)
   - Get today's attendance status for logged-in employee
   - Return attendance record or null

4. **GET `/api/attendance/history`**
   - Protected route (employee auth required)
   - Query params: `limit` (default: 30), `page` (default: 1)
   - Get attendance history for logged-in employee
   - Return paginated results

5. **GET `/api/attendance/admin/all`** (Admin only)
   - Get all employees' attendance
   - Query params: `date` (optional, default: today), `employeeId` (optional)
   - Return list of attendance records

6. **GET `/api/attendance/admin/employee/:employeeId`**
   - Get attendance history for specific employee
   - Query params: `startDate`, `endDate`, `limit`, `page`

### 1.5 Attendance Routes
**File**: `backend/routes/attendanceRoutes.js` (NEW)

```javascript
- POST /check-in → markCheckIn
- POST /check-out → markCheckOut
- GET /today → getTodayAttendance
- GET /history → getAttendanceHistory
- GET /admin/all → getAllAttendance (admin)
- GET /admin/employee/:employeeId → getEmployeeAttendance (admin)
```

### 1.6 Server Integration
**File**: `backend/server.js`
- Add attendance routes: `/api/attendance`

---

## 2. Employee App Implementation

### 2.1 Login Screen
**File**: `employee-app/screens/LoginScreen.js`

**Status**: ✅ Already correct
- Current login uses Employee ID + Password (no changes needed)
- Already sends `employeeId` to `/api/employees/login`

### 2.2 Attendance API Service
**File**: `employee-app/services/attendanceApi.js` (NEW)

```javascript
- markCheckIn() - POST /attendance/check-in
- markCheckOut() - POST /attendance/check-out
- getTodayAttendance() - GET /attendance/today
- getAttendanceHistory(limit, page) - GET /attendance/history
```

### 2.3 Update Attendance Screen
**File**: `employee-app/screens/AttendanceScreen.js`

**Changes**:
- Remove mock data
- Add API integration:
  - Fetch today's attendance on mount
  - Mark check-in when button clicked
  - Mark check-out (if needed in future)
  - Fetch attendance history
- Add loading states
- Add error handling
- Show proper status (not marked, checked in, checked out)
- Display real attendance history from API

**Features**:
- Real-time clock display
- Check-in button (only if not checked in today)
- Check-out button (if checked in but not checked out)
- Attendance history list (last 30 days)
- Pull to refresh

---

## 3. Admin Panel Implementation

### 3.1 Add Attendance Tab
**File**: `admin-panel/src/App.jsx`

**New Tab**: "Attendance"

**Features**:
1. **Date Picker**: Select date to view attendance
2. **Employee Filter**: Filter by employee (dropdown)
3. **Attendance Table**:
   - Employee Name
   - Employee ID
   - Phone
   - Check-in Time
   - Check-out Time
   - Status (Present/Absent/Late)
   - Total Hours (calculated)
4. **Summary Cards**:
   - Total Employees
   - Present Today
   - Absent Today
   - Late Arrivals
5. **Export Button**: Export attendance data to CSV/Excel

### 3.2 Admin Attendance API Functions
**File**: `admin-panel/src/App.jsx`

```javascript
- fetchAllAttendance(date) - GET /attendance/admin/all?date=YYYY-MM-DD
- fetchEmployeeAttendance(employeeId, startDate, endDate) - GET /attendance/admin/employee/:employeeId
- fetchAllEmployees() - GET /employees (if not exists, create it)
```

---

## 4. Security Considerations

1. **Authentication**:
   - All attendance routes (except admin view) require employee JWT token
   - Admin routes should have separate admin authentication (future)

2. **Validation**:
   - Prevent duplicate check-ins on same day
   - Validate check-out can only happen after check-in
   - Validate employee is active before allowing attendance

3. **Data Integrity**:
   - Unique constraint on employeeId + date
   - Automatic status calculation (present if check-in exists)

---

## 5. Database Schema Summary

### Attendance Collection
```javascript
{
  _id: ObjectId,
  employeeId: String (ref: Employee.employeeId),
  date: Date (YYYY-MM-DD),
  checkIn: Date (ISO timestamp),
  checkOut: Date (ISO timestamp) || null,
  status: 'present' | 'absent' | 'late',
  location: {
    latitude: Number,
    longitude: Number
  } || null,
  notes: String || null,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `{ employeeId: 1, date: 1 }` - Unique compound index

---

## 6. API Endpoints Summary

### Employee Endpoints (Protected)
- `POST /api/attendance/check-in` - Mark check-in
- `POST /api/attendance/check-out` - Mark check-out
- `GET /api/attendance/today` - Get today's attendance
- `GET /api/attendance/history?limit=30&page=1` - Get history

### Admin Endpoints
- `GET /api/attendance/admin/all?date=2026-01-20` - Get all attendance
- `GET /api/attendance/admin/employee/:employeeId?startDate=...&endDate=...` - Get employee attendance

---

## 7. Implementation Order

1. ✅ **Backend Foundation**
   - Create Attendance model
   - Create employee auth middleware
   - Create attendance controller
   - Create attendance routes
   - Update server.js

2. ✅ **Employee App Integration**
   - Create attendance API service
   - Update AttendanceScreen with real API calls

4. ✅ **Admin Panel**
   - Add attendance tab
   - Add API functions
   - Create attendance table view
   - Add filters and summary

5. ✅ **Testing**
   - Test check-in/check-out flow
   - Test attendance history
   - Test admin view
   - Test edge cases (duplicate check-in, etc.)

---

## 8. Future Enhancements (Optional)

1. **Location Tracking**: Add GPS coordinates on check-in
2. **Late Arrival Detection**: Auto-mark as "late" if check-in after 9:30 AM
3. **Notifications**: Push notifications for attendance reminders
4. **Reports**: Monthly attendance reports with analytics
5. **Leave Management**: Integration with leave requests
6. **Biometric**: Face recognition or fingerprint for check-in
7. **QR Code**: QR code scanning for check-in

---

## Notes

- All timestamps should be stored in UTC and converted to local time in frontend
- Date comparisons should use date-only (not time) for "today" checks
- Consider timezone handling for employees in different locations
- Admin panel should handle pagination for large employee lists
- Add proper error messages and validation feedback
