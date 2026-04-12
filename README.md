# Smart-Water Management System

Smart-Water is a full-stack water management application designed to support sustainable household water usage through monitoring, analytics, planning, and operational workflows.

## 1. Abstract
This project provides a practical platform for tracking water usage at household level, generating personalized saving plans, and visualizing environmental impact through carbon metrics. The system combines user and household management with usage analytics, zone-level organization, activity scheduling, and administrative notifications.

## 2. Project Objective
The primary objective is to build a production-oriented system that helps users and administrators:
- Monitor water usage behavior
- Reduce waste through saving recommendations
- Measure environmental impact via carbon-footprint analytics
- Manage household and zone data with secure access control

## 3. Scope
- Role-based authentication and authorization
- Household, zone, and user management
- Water usage CRUD and analytics
- Saving plan creation and tracking
- Carbon statistics and leaderboard endpoints
- Activity and notification modules
- Unit, integration, and performance test support



## 4. System Overview
### Architecture Style
Backend follows MVC-style organization:
- Models: MongoDB schemas with Mongoose
- Controllers: business logic and response handling
- Routes: endpoint definitions and middleware composition

Frontend is a React application that consumes backend APIs.

### High-Level Components
- Backend API: Express + MongoDB
- Frontend UI: React
- Testing layer: Jest, Supertest, mongodb-memory-server, Artillery

## 5. Core Features
- JWT-based authentication
- Role-based access control for admin and user
- Household and zone management
- Usage recording with validation
- Carbon-footprint computation and trend analytics
- Saving plan generation and update workflows
- Admin usage overview, household analytics, and anomaly detection
- Activity scheduling and admin notification endpoints

## 6. Technology Stack
### Backend
- Node.js
- Express
- MongoDB and Mongoose
- jsonwebtoken
- bcryptjs
- Axios
- Nodemailer

### Frontend
- React
- React Router
- Tailwind CSS

### Testing and Quality
- Jest
- Supertest
- mongodb-memory-server
- Artillery

## 7. Repository Structure
```text
Smart-Water/
  Backend/
    app.js
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    tests/
    utils/
  frontend/
    src/
    public/
  documents/
    API_ENDPOINT_DOCUMENTATION.md
    DEPLOY_REPORT.md
    TESTING_INSTRUCTION_REPORT.md
  render.yaml
  README.md
```

## 8. Installation and Setup
### Prerequisites
- Node.js and npm
- MongoDB instance (local or cloud)

### Step 1: Install Dependencies
```bash
cd Backend
npm install

cd ../frontend
npm install
```

### Step 2: Configure Environment Files
- Backend environment file: Backend/.env
- Frontend environment file: frontend/.env

### Step 3: Run Backend
```bash
cd Backend
npm run dev
```

### Step 4: Run Frontend
```bash
cd frontend
npm start
```

Default local URLs:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

## 9. Environment Variables
### Backend Required Variables
```env
MONGO_URI=<mongodb_connection_string>
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=<jwt_secret>

WEATHER_API_KEY=<weather_api_key>
WEATHER_API_KEY_WaterSavingPlan=<weather_api_key_for_saving_plan>
CarbonInterface_API_key=<carbon_interface_api_key>

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<smtp_user>
SMTP_PASS=<smtp_password>
FROM_EMAIL=<from_email>
FROM_NAME=<from_name>
```

### Frontend Required Variables
```env
REACT_APP_API_BASE_URL=http://localhost:5000
```

## 10. Run Scripts
### Backend
- npm run dev
- npm start
- npm test
- npm run test:unit
- npm run test:integration
- npm run test:performance

### Frontend
- npm start
- npm run build
- npm test

## 11. Testing Instructions
Run from Backend:
Testing Instruction Report: [documents/TESTING_INSTRUCTION_REPORT.md](documents/TESTING_INSTRUCTION_REPORT.md)

### Unit
```bash
npm run test:unit
npm run test:unit:saving-plan
npm run test:unit:usage
npm run test:unit:my-utils
npm run test:unit:my-controllers
```

### Integration
```bash
npm run test:integration
npm run test:integration:saving-plan
npm run test:integration:usage
npm run test:integration:my-modules
```

### Performance
Set PERF_BASE_URL and PERF_JWT_TOKEN, then run:
```bash
npm run test:performance:usage
npm run test:performance:usage:spike
npm run test:performance:saving-plan
npm run test:performance:saving-plan:spike
npm run test:performance:my-module
npm run test:performance:my-module:spike
```

## 12. API Entry Points
Current mounted route groups:
- /api/auth
- /api/users
- /api/households
- /api/zones
- /api/activities
- /api/admin-notifications
- /usage
- /SavingPlan

Health endpoint:
- GET /

Complete API reference:
- [documents/API_ENDPOINT_DOCUMENTATION.md](documents/API_ENDPOINT_DOCUMENTATION.md)

## 13. Deployment Summary
- Backend service configuration is available in render.yaml
- Deployment details are documented in [documents/DEPLOY_REPORT.md](documents/DEPLOY_REPORT.md)

## 14. Documentation Index
- API Endpoint Documentation: [documents/API_ENDPOINT_DOCUMENTATION.md](documents/API_ENDPOINT_DOCUMENTATION.md)
- Deployment Report: [documents/DEPLOY_REPORT.md](documents/DEPLOY_REPORT.md)
- Testing Instruction Report: [documents/TESTING_INSTRUCTION_REPORT.md](documents/TESTING_INSTRUCTION_REPORT.md)
- Backend Testing Overview: [Backend/tests/TESTING_OVERVIEW.md](Backend/tests/TESTING_OVERVIEW.md)
- API Smoke Testing Guide: [Backend/tests/API/API_SMOKE_TESTING.md](Backend/tests/API/API_SMOKE_TESTING.md)
- Unit Testing Guide: [Backend/tests/unit/UNIT_TESTING_GUIDE.md](Backend/tests/unit/UNIT_TESTING_GUIDE.md)
- Integration Testing Guide: [Backend/tests/integration/INTEGRATION_TESTING_GUIDE.md](Backend/tests/integration/INTEGRATION_TESTING_GUIDE.md)
- Performance Testing Guide: [Backend/tests/performance/PERFORMANCE_TESTING_GUIDE.md](Backend/tests/performance/PERFORMANCE_TESTING_GUIDE.md)
- Usage Performance Guide: [Backend/tests/performance/usage/USAGE_PERFORMANCE_TESTING.md](Backend/tests/performance/usage/USAGE_PERFORMANCE_TESTING.md)
- User-Household-Zone Performance Guide: [Backend/tests/performance/user-household-zone/USER_HOUSEHOLD_ZONE_PERFORMANCE_TESTING.md](Backend/tests/performance/user-household-zone/USER_HOUSEHOLD_ZONE_PERFORMANCE_TESTING.md)

## 15. Known Implementation Notes
- CORS allows local origins and values configured in FRONTEND_URL.
- Usage endpoints are mounted under /usage.
- GET/PUT/DELETE on /SavingPlan/:id are currently exposed without auth middleware in route configuration.

## 16. Conclusion
Smart-Water provides a structured and extensible base for household water monitoring and sustainability analytics. The current implementation supports core academic and practical requirements for authentication, domain management, analytics, testing, and deployment documentation.

Last updated: April 2026