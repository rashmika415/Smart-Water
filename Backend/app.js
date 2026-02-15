const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const savingPlanRoutes = require("./routes/SavingPlanRoute");
const usageRoutes = require("./routes/usageRoute");


const PORT = process.env.PORT || 5000;


// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use("/SavingPlan", savingPlanRoutes); // Use saving plan routes
app.use("/usage", usageRoutes); // Use usage routes
// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Routes (MVC - Routes connect to Controllers)
const activityRoutes = require("./routes/activityRoutes");
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
