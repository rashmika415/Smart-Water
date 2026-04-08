const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    getAllUsers,
    getUserById,
    getMyProfile,
    updateUser,
    deleteUser
} = require("../controllers/userController");


// ======================================
// PROFILE ROUTE (LOGGED USER)
// ======================================
// If you prefer /me change profile -> me
router.get("/profile", verifyToken, getMyProfile);


// ======================================
// ADMIN ROUTES
// ======================================

// get all users (admin only)
router.get("/", verifyToken, authorizeRoles("admin"), getAllUsers);

// delete user (admin only)
router.delete("/:id", verifyToken, authorizeRoles("admin"), deleteUser);


// ======================================
// USER + ADMIN ROUTES
// ======================================

// get single user (must be BELOW /profile)
router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "user"),
  getUserById
);

// update user
router.put("/:id", verifyToken, authorizeRoles("admin", "user"), updateUser);


module.exports = router;