#  Activity Management - Complete Feature Guide

##  Table of Contents
1. [Overview](#overview)
2. [Core Features](#core-features)
3. [API Endpoints](#api-endpoints)
4. [Data Tracking](#data-tracking)
5. [Sub-document Integration](#sub-document-integration)
6. [Technical Features](#technical-features)
7. [Usage Examples](#usage-examples)

---

##  Overview

The **Activity Management** system is designed to schedule, track, and manage maintenance and operational activities. It allows administrators to assign tasks to staff members, monitor progress, and notify personnel via automated email alerts.

### **Key Highlights:**
-  Scheduled activity tracking with date and time
-  Staff assignment and email notifications
-  Location-based activity management
-  Task sub-documents for granular status tracking
-  Automated email updates for assignment, modification, and cancellation
-  Real-time status monitoring (Pending, In-Progress, Completed)

---

##  Core Features

### **1. Comprehensive Activity Logging** 

Activities are defined with rich metadata to ensure clear communication:

#### **Activity Definition**
```javascript
{
  "activityType": "Pump Maintenance",
  "scheduledDate": "2026-03-10",
  "scheduledTime": "09:00 AM",
  "location": "Zone A - Sector 4",
  "assignedStaff": "Saman Edirimuni",
  "staffEmail": "randikair95@gmail.com",
  "notes": "Bring replacement filters",
  "status": "Pending"
}
```

---

### **2. Granular Task Tracking (Sub-documents)** 

Break down large activities into smaller, manageable tasks using sub-documents:

#### **Task Structure**
```javascript
"tasks": [
  { "taskName": "Check pressure gauges", "isCompleted": true },
  { "taskName": "Replace primary filter", "isCompleted": false },
  { "taskName": "Inspect for leaks", "isCompleted": false }
]
```

**Benefits:**
- Track progress within a single activity
- Clearer accountability for staff
- Easy-to-see completion status in Postman/UI

---

### **3. Automated Email Notifications** 

The system automatically handles communication with staff:

- **New Assignment:** Notification sent when an activity is created.
- **Updates:** Alerts sent when scheduled details or status change.
- **Cancellations:** Notifications sent when an activity is removed from the schedule.

---

##  API Endpoints

### **Standard CRUD Operations**

#### **1. Create Activity** 
```http
POST /api/activities
Authorization: Bearer {token}
Content-Type: application/json

{
  "activityType": "Filter Cleaning",
  "scheduledDate": "2026-03-15",
  "scheduledTime": "10:30 AM",
  "location": "Main Water Plant",
  "assignedStaff": "Ravi Perera",
  "staffEmail": "ravi@example.com",
  "tasks": [
    { "taskName": "Remove sediment", "isCompleted": false },
    { "taskName": "Chemical wash", "isCompleted": false }
  ]
}

Response: 201 Created
```

#### **2. Get All Activities** 
```http
GET /api/activities
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": [ ... ]
}
```

#### **3. Update Activity** 
Update status, schedule, or individual tasks.
```http
PUT /api/activities/:id
{
  "status": "In-Progress",
  "tasks": [
    { "taskName": "Remove sediment", "isCompleted": true },
    { "taskName": "Chemical wash", "isCompleted": false }
  ]
}
```

---

##  Data Tracking Features

### **1. Status Lifecycle**
Track activities through three distinct phases:
- **Pending:** Initial state, not yet started.
- **In-Progress:** Work is currently being performed.
- **Completed:** Activity is finished and verified.

### **2. Validation Logic**
-  **No Past Dates:** Prevents scheduling maintenance in the past.
-  **Required Fields:** Ensures all contact and location info is present.
-  **Staff Email:** Validates where to send notifications.

---

##  Technical Features

- **Database:** MongoDB with Mongoose Schema.
- **Validation:** Manual and Schema-level checks.
- **Notifications:** Integrated Nodemailer service.
- **UI Friendly:** Standardized JSON responses for easy frontend consumption.

---

##  Usage Examples

### **Example: Updating Task Progress**

When a staff member finishes a specific part of the maintenance:
```javascript
PUT /api/activities/65f7...
{
  "tasks": [
    { "taskName": "Check pressure", "isCompleted": true }
  ]
}
```

**This system ensures that water infrastructure maintenance is organized, transparent, and communicative!** 
