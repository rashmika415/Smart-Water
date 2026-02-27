# Smart Water Backend - MVC Architecture

## Project Structure

```
Backend/
├── app.js                 # Application entry point & server configuration
├── models/                # M - Models (Data Layer)
│   └── Activity.js        # Activity schema/model
├── controllers/           # C - Controllers (Business Logic Layer)
│   └── activityController.js
├── routes/                # Routes (HTTP Routing Layer)
│   └── activityRoutes.js  # Maps HTTP routes to controllers
└── package.json
```

## MVC Architecture Explanation

### **M - Models** (`/models`)
- Define database schemas and data structures
- Handle data validation at the schema level
- Interact with the database (MongoDB via Mongoose)
- Example: `Activity.js` - defines the Activity schema

### **V - Views** (`/Frontend`)
- Frontend presentation layer (HTML, CSS, JavaScript)
- User interface for interacting with the application
- Located in the `Frontend/` directory
- Example: `create-activity.html` - form for creating activities

### **C - Controllers** (`/controllers`)
- Handle business logic and request processing
- Process data from models
- Send responses back to clients
- Example: `activityController.js` - contains `createActivity` function

### **Routes** (`/routes`)
- Define API endpoints
- Map HTTP methods (GET, POST, PUT, DELETE) to controller functions
- Thin layer that only handles routing
- Example: `activityRoutes.js` - maps `/api/activities` POST to `createActivity` controller

## Data Flow

```
Client Request → Routes → Controllers → Models → Database
                                    ↓
Client Response ← Routes ← Controllers ← Models ← Database
```

## Example Flow: Creating an Activity

1. **Client** sends POST request to `/api/activities`
2. **Route** (`activityRoutes.js`) receives request and calls controller
3. **Controller** (`activityController.js`) processes business logic:
   - Validates input data
   - Creates new Activity instance
   - Saves to database
   - Returns response
4. **Model** (`Activity.js`) handles database operations
5. **Response** sent back to client

## Benefits of MVC Architecture

✅ **Separation of Concerns**: Each layer has a specific responsibility  
✅ **Maintainability**: Easy to find and modify code  
✅ **Scalability**: Easy to add new features  
✅ **Testability**: Each layer can be tested independently  
✅ **Reusability**: Controllers and models can be reused
