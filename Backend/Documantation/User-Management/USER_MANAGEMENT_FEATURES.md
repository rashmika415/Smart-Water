# 👤 User Management Module – Smart Water System

## 📌 Overview

The User Management module handles authentication, authorization, and user profile management.  
It ensures secure access to the Smart Water system using JWT-based authentication.

---

## 🔐 Core Features

### 1️⃣ User Registration
- Users can create new accounts.
- Passwords are hashed using bcrypt.
- Role-based access supported (admin / user).

### 2️⃣ User Login
- Validates email and password.
- Generates JWT token.
- Token used for accessing protected routes.

### 3️⃣ JWT Authentication
- All protected routes require Bearer token.
- Middleware verifies token.
- User data stored in `req.user`.

### 4️⃣ Role-Based Authorization
- Admin can access all data.
- Users can only access their own data.
- Middleware checks allowed roles.

---

## 🧱 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login and receive JWT |
| GET | /api/users/me | Get logged-in user profile |
| PUT | /api/users/me | Update logged-in user profile |

---

## 🔒 Security Implementation

- Password hashing (bcrypt)
- JWT token authentication
- Role-based access control
- Input validation
- Error handling middleware

---

## 🧩 Business Logic

- Users own households.
- One-to-many relationship (User → Households).
- Only owners or admins can access resources.

---

## 🎯 Technical Highlights

- Express.js RESTful design
- MongoDB integration
- Protected routes
- Middleware-based authentication
- Clean architecture