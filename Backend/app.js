const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const savingPlanRoutes = require("./routes/SavingPlanRoute");
const usageRoutes = require("./routes/usageRoute");
const householdRoutes = require("./routes/householdRoutes");
const zoneRoutes = require("./routes/zoneRoutes");


const PORT = process.env.PORT || 5000;


// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// CORS middleware
app.use((req, res, next) => {
  const configuredOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    ...configuredOrigins,
  ];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }
  
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Routes (MVC - Routes connect to Controllers)
const activityRoutes = require("./routes/activityRoutes");
app.use("/SavingPlan", savingPlanRoutes); // Use saving plan routes
app.use("/usage", usageRoutes); // Use usage routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/households", householdRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/activities", activityRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Smart Water Backend API is running!" });
});


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });