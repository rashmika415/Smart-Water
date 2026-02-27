# 💧 Smart-Water Management System

A comprehensive water usage management and monitoring system that helps households track water consumption, receive intelligent alerts, create saving plans, and monitor different zones. The system integrates weather data to provide smart recommendations and sends email notifications for usage alerts.

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Usage](#usage)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Core Functionality
- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin/User)
  - Secure password hashing with bcrypt

- **Water Usage Tracking**
  - Real-time usage monitoring
  - Historical usage data
  - Usage estimation and predictions
  - Multi-zone tracking support

- **Smart Saving Plans**
  - Customizable water saving goals
  - Household size-based recommendations
  - Priority area targeting
  - Water source tracking

- **Household Management**
  - Multi-household support
  - Household member management
  - Zone-based consumption tracking

- **Intelligent Alert System**
  - Customizable alert preferences
  - Email notifications via SendGrid/Nodemailer
  - Threshold-based alerts
  - Activity logging and monitoring

- **Weather Integration**
  - Weather-based consumption insights
  - Smart recommendations based on weather conditions
  - Seasonal usage patterns

- **🌍 Carbon Footprint Tracking** (NEW)
  - Automatic CO2 emission calculation for all water usage
  - Real-time environmental impact feedback
  - Carbon equivalents (car km, trees, phone charges)
  - Activity-based carbon breakdown
  - Household carbon leaderboards
  - Daily trend analysis
  - Educational sustainability metrics

## 🛠 Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js v5.2.1
- **Database:** MongoDB with Mongoose ODM v9.2.0
- **Authentication:** JWT (jsonwebtoken v9.0.3)
- **Security:** bcryptjs v3.0.3
- **Email Services:** 
  - Nodemailer v8.0.1
  - SendGrid integration
- **HTTP Client:** Axios v1.13.5
- **Environment Management:** dotenv v17.2.4
- **🌍 Third-Party APIs:**
  - OpenWeather API (weather data)
  - CarbonInterface API (carbon footprint calculations)

### Development Tools
- **Nodemon** v3.1.11 - Auto-restart during development

## 📦 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14.x or higher)
- **MongoDB** (v4.x or higher)
- **npm** or **yarn** package manager

### Required API Keys
- CarbonInterface API key (for carbon footprint calculations - optional, has local fallback)
- MongoDB connection URI
- SendGrid API key (for email notifications)
- Weather API key (for weather integration)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/Smart-Water.git
cd Smart-Water
```

### 2. Install Backend Dependencies
```bash
cd Backend
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the `Backend` directory (see [Environment Variables](#environment-variables) section)

### 4. Start MongoDB
Ensure your MongoDB server is running:
```bash
# For Windows
net start MongoDB

# For Mac/Linux
sudo systemctl start mongod
```

### 5. Run the Application
```bash
# Development mode with auto-restart
npm start

# Production mode
node app.js
```

The server will start on `http://localhost:5000` (or your specified PORT)

## 🔐 Environment Variables

Create a `.env` file in the `Backend` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/smart-water

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Email Configuration (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@smartwater.com

# Email Configuration (Nodemailer - Alternative)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password

# Weather API
WEATHER_API_KEY=your_weather_api_key
WEATHER_API_URL=https://api.weatherapi.com/v1

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

> **Note:** For SendGrid setup instructions, refer to [Backend/SENDGRID_SETUP.md](Backend/SENDGRID_SETUP.md)

## 📁 Project Structure

```
Smart-Water/
├── README.md                          # Main project documentation
├── Backend/                           # Backend application
│   ├── app.js                        # Application entry point
│   ├── package.json                  # Dependencies and scripts
│   ├── README.md                     # Backend-specific documentation
│   ├── SENDGRID_SETUP.md            # SendGrid configuration guide
│   ├── testNodemailer.js            # Email service testing
│   │
│   ├── config/                       # Configuration files
│   │   └── waterConfig.js           # Water usage configurations
│   │
│   ├── controllers/                  # Business logic layer
│   │   ├── activityController.js    # Activity management
│   │   ├── alertController.js       # Alert handling
│   │   ├── authController.js        # Authentication logic
│   │   ├── householdController.js   # Household management
│   │   ├── SavingPlanController.js  # Saving plans
│   │   ├── usageController.js       # Usage tracking
│   │   ├── userController.js        # User management
│   │   └── zoneController.js        # Zone management
│   │
│   ├── middleware/                   # Express middleware
│   │   ├── authMiddleware.js        # JWT authentication
│   │   ├── roleMiddleware.js        # Role-based access control
│   │   └── validationMiddleware.js  # Input validation
│   │
│   ├── models/                       # Data models (Mongoose schemas)
│   │   ├── Activity.js              # Activity schema
│   │   ├── AlertPreferencesModel.js # Alert preferences
│   │   ├── householdModel.js        # Household schema
│   │   ├── SavingPlanModel.js       # Saving plan schema
│   │   ├── UsageModel.js            # Usage data schema
│   │   ├── userModel.js             # User schema
│   │   └── zoneModel.js             # Zone schema
│   │
│   ├── routes/                       # API route definitions
│   │   ├── activityRoutes.js        # /api/activities
│   │   ├── alertRoutes.js           # /api/alerts
│   │   ├── authRoutes.js            # /api/auth
│   │   ├── householdRoutes.js       # /api/households
│   │   ├── SavingPlanRoute.js       # /SavingPlan
│   │   ├── usageRoute.js            # /usage
│   │   ├── userRoutes.js            # /api/users
│   │   └── zoneRoutes.js            # /api/zones
│   │
│   ├── services/                     # External service integrations
│   │   └── emailService.js          # Email sending service
│   │
│   └── utils/                        # Utility functions
│       ├── emailAlertHelper.js      # Email alert helpers
│       ├── estimateUsage.js         # Usage estimation logic
│       ├── householdEmail.js        # Household email templates
│       ├── sendGridService.js       # SendGrid integration
│       ├── usageHelpers.js          # Usage calculation helpers
│       └── weatherService.js        # Weather API integration
│
└── Frontend/                         # Frontend application
    └── create-activity.html         # Activity creation interface
```

## 🔌 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Users (`/api/users`)
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Households (`/api/households`)
- `GET /api/households` - Get all households
- `POST /api/households` - Create household
- `GET /api/households/:id` - Get household by ID
- `PUT /api/households/:id` - Update household
- `DELETE /api/households/:id` - Delete household

### Usage Tracking (`/usage`)
- `GET /usage` - Get usage data
- `POST /usage` - Record usage
- `GET /usage/history` - Get usage history
- `GET /usage/estimate` - Get usage estimate
- `GET /usage/:id` - Get usage by ID
- `PUT /usage/:id` - Update usage
- `DELETE /usage/:id` - Delete usage

### 🌍 Carbon Footprint (`/usage/carbon-*`)
- `GET /usage/carbon-stats` - Get carbon statistics
- `GET /usage/carbon-by-activity` - Carbon breakdown by activity
- `GET /usage/carbon-leaderboard` - Household carbon leaderboard
- `GET /usage/carbon-trend` - Daily carbon trend analysis

### Saving Plans (`/SavingPlan`)
- `GET /SavingPlan` - Get all saving plans
- `POST /SavingPlan` - Create saving plan
- `GET /SavingPlan/:id` - Get plan by ID
- `PUT /SavingPlan/:id` - Update saving plan
- `DELETE /SavingPlan/:id` - Delete saving plan

### Zones (`/api/zones`)
- `GET /api/zones` - Get all zones
- `POST /api/zones` - Create zone
- `GET /api/zones/:id` - Get zone by ID
- `PUT /api/zones/:id` - Update zone
- `DELETE /api/zones/:id` - Delete zone

### Activities (`/api/activities`)
- `GET /api/activities` - Get all activities
- `POST /api/activities` - Create activity
- `GET /api/activities/:id` - Get activity by ID
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity

## 💻 Usage

### Starting the Application

1. **Development Mode:**
   ```bash
   cd Backend
   npm start
   ```
   The server will run on port 5000 with auto-restart enabled.

2. **Access the API:**
   Navigate to `http://localhost:5000/` to verify the server is running.

3. **Frontend:**
   Open `Frontend/create-activity.html` in your browser or serve it via a local server.

### Testing Email Service
```bash
cd Backend
node testNodemailer.js
```

### API Testing
You can test the API endpoints using:
- **Postman** - Import the API collection
- **cURL** - Command line requests
- **Thunder Client** - VS Code extension

Example request:
```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"securePassword123"}'
```

## 🏗 Architecture

The Smart-Water system follows the **MVC (Model-View-Controller)** architectural pattern:

### Model (Data Layer)
- Mongoose schemas define data structure
- Database validation and constraints
- Data relationships and references

### View (Presentation Layer)
- HTML/CSS/JavaScript frontend
- User interface components
- Form handling and validation

### Controller (Business Logic Layer)
- Request handling and processing
- Business logic implementation
- Response formatting
- Error handling

### Data Flow
```
Client Request → Routes → Middleware → Controllers → Models → Database
                                                        ↓
Client Response ← Routes ← Middleware ← Controllers ← Models ← Database
```

### Middleware Layers
1. **Authentication Middleware** - Verifies JWT tokens
2. **Role Middleware** - Checks user permissions
3. **Validation Middleware** - Validates request data

For detailed architecture documentation, see [Backend/README.md](Backend/README.md)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards
- Follow ESLint configuration
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation as needed


## 📞 Support & Contact

For support, questions, or feedback:
- **Email:** support@smartwater.com
- **Issues:** [GitHub Issues](https://github.com/yourusername/Smart-Water/issues)

## 🙏 Acknowledgments

- MongoDB for database solutions
- Express.js community
- SendGrid for email services
- Weather API providers

---

**Last Updated:** February 2026  
**Version:** 1.0.0

Made with 💧 for a sustainable future