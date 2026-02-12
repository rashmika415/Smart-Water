const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");

const PORT = process.env.PORT || 5000;

// Middleware to read JSON
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.send("Hello from the Smart Water Backend!");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users",userRoutes);


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
