# Smart-Water API Endpoint Documentation (Submission Version)

## Base
- Base URL: http://localhost:5000
- Content-Type: application/json
- Auth header: Authorization: Bearer <jwt_token>

## Auth Levels
- Public: no token
- Authenticated: valid JWT
- Admin: JWT with role admin
- User/Admin: JWT with role user or admin

## Common Error Formats
```json
{ "message": "Error message" }
```
```json
{ "success": false, "message": "Error message", "error": "details" }
```

---

## 1) Health
### GET /
- Auth: Public
- Response:
```json
{ "message": "Smart Water Backend API is running!" }
```

---

## 2) Authentication (/api/auth)
### POST /api/auth/register
- Auth: Public
- Request:
```json
{ "name": "John", "email": "john@example.com", "password": "password123", "role": "user" }
```
- Success 201:
```json
{ "message": "User Registered with username John" }
```

### POST /api/auth/login
- Auth: Public
- Request:
```json
{ "email": "john@example.com", "password": "password123" }
```
- Success 200:
```json
{ "token": "<jwt_token>" }
```

---

## 3) Users (/api/users)
### GET /api/users/profile
- Auth: Authenticated
- Response 200 (format):
```json
{ "_id": "user_id", "name": "John", "email": "john@example.com", "role": "user" }
```

### GET /api/users
- Auth: Admin
- Response 200: array of users (password excluded)

### GET /api/users/:id
- Auth: User/Admin
- Response 200 (format):
```json
{ "_id": "user_id", "name": "John", "email": "john@example.com", "role": "user" }
```

### PUT /api/users/:id
- Auth: User/Admin
- Request:
```json
{ "name": "Updated", "email": "updated@example.com", "password": "newpass123", "role": "admin" }
```
- Success 200:
```json
{ "message": "User updated successfully", "user": { "id": "user_id", "name": "Updated", "email": "updated@example.com", "role": "admin" } }
```

### DELETE /api/users/:id
- Auth: Admin
- Success 200:
```json
{ "message": "User deleted successfully" }
```

---

## 4) Households (/api/households)
### GET /api/households/all-with-zones
- Auth: Admin
- Response 200: array of `{ household, zones[] }`

### GET /api/households/my-households
- Auth: Authenticated
- Response 200: array of households

### GET /api/households/my-with-zones
- Auth: Authenticated
- Response 200: array of households with populated zones

### GET /api/households
- Auth: Admin
- Query: page, limit, search
- Response 200 (format):
```json
{ "total": 1, "page": 1, "pages": 1, "households": [ { "_id": "household_id", "name": "Family Home" } ] }
```

### POST /api/households
- Auth: Authenticated
- Request:
```json
{ "name": "Family Home", "numberOfResidents": 4, "propertyType": "house", "location": { "city": "Colombo", "state": "WP", "country": "Sri Lanka" } }
```
- Success 201: created household object

### GET /api/households/:id
- Auth: Authenticated (owner/admin)
- Success 200: household object

### PUT /api/households/:id
- Auth: Authenticated (owner/admin)
- Request:
```json
{ "name": "Updated Home", "numberOfResidents": 5, "propertyType": "apartment", "location": { "city": "Kandy" } }
```
- Success 200: updated household object

### DELETE /api/households/:id
- Auth: Authenticated (owner/admin)
- Success 200:
```json
{ "message": "Household and zones deleted" }
```

### POST /api/households/:id/zones
- Auth: Authenticated (owner/admin)
- Request:
```json
{ "zoneName": "Kitchen", "notes": "Main kitchen" }
```
- Success 201: created zone object

### GET /api/households/:id/zones
- Auth: Authenticated (owner/admin)
- Success 200: array of zones

---

## 5) Zones (/api/zones)
### PUT /api/zones/:zoneId
- Auth: Authenticated (owner/admin)
- Request:
```json
{ "zoneName": "Updated Kitchen", "notes": "Updated notes" }
```
- Success 200: updated zone object

### DELETE /api/zones/:zoneId
- Auth: Authenticated (owner/admin)
- Success 200:
```json
{ "message": "Zone deleted" }
```

---

## 6) Saving Plans (/SavingPlan)
### POST /SavingPlan
- Auth: Authenticated
- Request:
```json
{ "planType": "Basic", "householdSize": 4, "priorityArea": "Bathroom", "waterSource": "Municipal", "customGoalPercentage": null }
```
- Rules:
  - planType: Basic | Advanced | Custom
  - priorityArea: Kitchen | Bathroom | Garden | Laundry | General
  - waterSource: Municipal | Well | Rainwater | Mixed
  - customGoalPercentage required for Custom (1-100)
- Success 201 (format):
```json
{ "success": true, "message": "Saving plan created successfully", "data": { "_id": "plan_id", "planType": "Basic", "targetReductionPercentage": 10 } }
```

### GET /SavingPlan
- Auth: Authenticated
- Success 200 (format):
```json
{ "count": 1, "savingPlans": [ { "_id": "plan_id", "planType": "Basic" } ] }
```

### GET /SavingPlan/admin
- Auth: Admin
- Success 200: same format as /SavingPlan

### GET /SavingPlan/calculation
- Auth: Authenticated
- Success 200:
```json
{ "currentUsage": 350, "targetReductionPercentage": 10, "targetUsage": 315, "estimatedSavings": 35 }
```

### GET /SavingPlan/:id
- Auth: Public (current implementation)
- Success 200 (format):
```json
{ "savingPlan": { "_id": "plan_id", "planType": "Advanced" } }
```

### PUT /SavingPlan/:id
- Auth: Public (current implementation)
- Request:
```json
{ "planType": "Custom", "householdSize": 5, "totalWaterUsagePerDay": 400, "priorityArea": "Garden", "customGoalPercentage": 25, "waterSource": "Rainwater" }
```
- Success 200:
```json
{ "savingPlan": { "_id": "plan_id", "planType": "Custom", "customGoalPercentage": 25 } }
```

### DELETE /SavingPlan/:id
- Auth: Public (current implementation)
- Success 200:
```json
{ "message": "Saving plan successfully deleted" }
```

---

## 7) Usage (/usage)
### POST /usage
- Auth: Authenticated
- Validation: activityType required, numeric fields non-negative, occurredAt valid/not future, source in manual|preset|imported
- Request:
```json
{ "activityType": "Shower", "occurredAt": "2026-04-11T09:00:00.000Z", "durationMinutes": 10, "flowRateLpm": 8, "source": "manual", "notes": "Morning shower" }
```
- Success 201 (format):
```json
{ "success": true, "message": "Usage created successfully", "data": { "_id": "usage_id", "activityType": "Shower", "liters": 80 }, "carbonImpact": { "carbonKg": 0.42 } }
```

### GET /usage
- Auth: Authenticated
- Query: activityType, startDate, endDate, source, page, limit, sort
- Success 200 (format):
```json
{ "success": true, "page": 1, "limit": 20, "count": 1, "total": 1, "totalPages": 1, "data": [ { "_id": "usage_id", "activityType": "Shower", "liters": 80 } ] }
```

### GET /usage/:id
- Auth: Authenticated
- Success 200:
```json
{ "success": true, "data": { "_id": "usage_id", "activityType": "Shower", "liters": 80 } }
```

### PUT /usage/:id
- Auth: Authenticated
- Request:
```json
{ "durationMinutes": 12, "flowRateLpm": 8, "notes": "Updated note" }
```
- Success 200:
```json
{ "success": true, "message": "Usage updated successfully", "data": { "_id": "usage_id", "liters": 96 } }
```

### DELETE /usage/:id
- Auth: Authenticated
- Success 200:
```json
{ "success": true, "message": "Usage deleted successfully" }
```

### GET /usage/carbon-stats
- Auth: Authenticated
- Query: startDate, endDate
- Success 200 (format):
```json
{ "success": true, "data": { "period": { "days": 31 }, "current": { "totalCarbonKg": 12.3 }, "previous": { "totalCarbonKg": 10.1 }, "comparison": { "carbonChange": 21.8, "trend": "increasing" }, "recordCount": 32 } }
```

### GET /usage/carbon-by-activity
- Auth: Authenticated
- Query: startDate, endDate
- Success 200 (format):
```json
{ "success": true, "data": { "totalCarbonKg": 12.3, "breakdown": [ { "activityType": "Shower", "totalCarbonKg": 6.7 } ], "topEmitter": { "activityType": "Shower" } } }
```

### GET /usage/carbon-leaderboard
- Auth: Admin
- Query: startDate, endDate, limit
- Success 200 (format):
```json
{ "success": true, "data": { "leaderboard": [ { "rank": 1, "householdName": "Eco Home", "totalCarbonKg": 5.2 } ] } }
```

### GET /usage/carbon-trend
- Auth: Authenticated
- Query: days
- Success 200 (format):
```json
{ "success": true, "data": { "period": { "days": 30 }, "trend": [ { "date": "2026-04-01", "totalCarbonKg": 0.68 } ], "averageDailyCarbonKg": 0.57 } }
```

### GET /usage/daily-water-usage
- Auth: Authenticated
- Query: days
- Success 200:
```json
{ "success": true, "data": { "totalLiters": 3200, "daysWithUsage": 24, "averageDailyUsage": 133 } }
```

### GET /usage/admin/overview
- Auth: Admin
- Query: startDate, endDate, or days
- Success 200 (format):
```json
{ "success": true, "data": { "totals": { "totalLiters": 54000, "totalCarbonKg": 312.45, "usageCount": 920 }, "topActivities": [], "trend": [] } }
```

### GET /usage/admin/households
- Auth: Admin
- Query: startDate, endDate, days, page, limit, search, sort
- Success 200 (format):
```json
{ "success": true, "data": { "page": 1, "limit": 10, "total": 2, "totalPages": 1, "rows": [ { "householdName": "Family Home", "totalLiters": 2500 } ] } }
```

### GET /usage/admin/households/:householdId
- Auth: Admin
- Query: startDate, endDate, days, page, limit, sort, activityType
- Success 200 (format):
```json
{ "success": true, "data": { "household": { "name": "Family Home" }, "summary": { "totalLiters": 2500, "usageCount": 40 }, "records": [] } }
```

### GET /usage/admin/anomalies
- Auth: Admin
- Query: startDate, endDate, or days
- Success 200 (format):
```json
{ "success": true, "data": { "thresholds": { "avgLitersPerRecord": 58.3 }, "summary": { "suspiciousHouseholdCount": 2, "spikeRecordCount": 4 }, "suspiciousHouseholds": [], "spikeRecords": [] } }
```

---

## 8) Activities (/api/activities)
### GET /api/activities
- Auth: Authenticated
- Success 200:
```json
{ "success": true, "data": [ { "_id": "activity_id", "activityType": "Pipe Inspection" } ] }
```

### GET /api/activities/:id
- Auth: Authenticated
- Success 200:
```json
{ "success": true, "data": { "_id": "activity_id", "activityType": "Pipe Inspection" } }
```

### POST /api/activities
- Auth: User/Admin
- Required fields:
  - Admin: activityType, scheduledDate, scheduledTime, location, assignedStaff, staffEmail
  - User: activityType, scheduledDate, scheduledTime, location
- Request:
```json
{ "activityType": "Leak Repair", "scheduledDate": "2026-04-20", "scheduledTime": "10:30", "location": "Zone A", "assignedStaff": "Team Alpha", "staffEmail": "staff@example.com", "notes": "Urgent leak", "status": "Pending" }
```
- Success 201 (format):
```json
{ "success": true, "message": "Activity created successfully", "data": { "_id": "activity_id", "activityType": "Leak Repair", "status": "Pending" } }
```

### PUT /api/activities/:id
- Auth: Admin
- Request: partial activity fields
- Success 200:
```json
{ "success": true, "message": "Activity updated successfully", "data": { "_id": "activity_id", "status": "In-Progress" } }
```

### DELETE /api/activities/:id
- Auth: Admin
- Success 200:
```json
{ "success": true, "message": "Activity deleted successfully", "data": { "_id": "activity_id" } }
```

---

## 9) Admin Notifications (/api/admin-notifications)
### GET /api/admin-notifications
- Auth: Admin
- Query: limit
- Success 200 (format):
```json
{ "notifications": [ { "_id": "notification_id", "type": "new_user_registration", "title": "New user registered", "isRead": false } ], "unreadCount": 1 }
```

### PATCH /api/admin-notifications/read-all
- Auth: Admin
- Success 200:
```json
{ "message": "All notifications marked as read" }
```

### PATCH /api/admin-notifications/:id/read
- Auth: Admin
- Success 200:
```json
{ "message": "Notification marked as read" }
```

---

## Quick cURL Examples
```bash
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"john@example.com","password":"password123"}'
```

```bash
curl -X POST http://localhost:5000/api/households -H "Content-Type: application/json" -H "Authorization: Bearer <jwt_token>" -d '{"name":"Family Home","numberOfResidents":4,"propertyType":"house","location":{"city":"Colombo"}}'
```

```bash
curl -X POST http://localhost:5000/usage -H "Content-Type: application/json" -H "Authorization: Bearer <jwt_token>" -d '{"activityType":"Shower","durationMinutes":10,"flowRateLpm":8,"source":"manual"}'
```

## Important Notes
- Usage routes are mounted at /usage (not /api/usage).
- CORS allow-list uses FRONTEND_URL.
- Current implementation leaves GET/PUT/DELETE /SavingPlan/:id without auth middleware.
