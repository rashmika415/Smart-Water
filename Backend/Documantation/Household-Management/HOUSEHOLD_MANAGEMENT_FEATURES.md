# 🏠 Household Management Module – Smart Water System

## 📌 Overview

The Household Management module allows users to manage their homes and zones.  
Each household belongs to a specific user and supports water tracking.

---

## 🏠 Core Features

### 1️⃣ Create Household
- Users can create multiple households.
- Each household linked to userId.

### 2️⃣ View Households
- Users see only their households.
- Admin sees all households.
- Supports pagination and search.

### 3️⃣ Update Household
- Only owner or admin allowed.

### 4️⃣ Delete Household
- Deletes related zones.
- Secure ownership validation.

---

## 🗂 Zone Management

Zones represent areas inside a home:

Examples:
- Kitchen
- Bathroom
- Garden
- Laundry Room

Each zone:
- Belongs to one household
- Supports CRUD operations

---

## 🧱 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/households | Create household |
| GET | /api/households | Get households (filtered by user) |
| GET | /api/households/:id | Get single household |
| PUT | /api/households/:id | Update household |
| DELETE | /api/households/:id | Delete household |
| POST | /api/households/:id/zones | Create zone |
| GET | /api/households/:id/zones | Get zones |

---

## 🔐 Access Control

- User can only access their own households.
- Admin can access all households.
- Role-based authorization implemented.

---

## 🧩 Database Relationships

User → Household → Zone

One user → Many households  
One household → Many zones  

---

## 🎯 Technical Highlights

- MongoDB relational modeling
- JWT-based protected routes
- Role-based filtering
- Cascade deletion of zones
- Clean RESTful design