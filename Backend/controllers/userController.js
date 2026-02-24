const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// =============================
// GET ALL USERS (ADMIN ONLY)
// =============================
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// =============================
// GET SINGLE USER
// =============================
const getUserById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const user = await User.findById(req.params.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// =============================
// GET LOGGED IN USER PROFILE
// =============================
const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.status(200).json(user);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// =============================
// UPDATE USER
// =============================
const updateUser = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const { name, email, password, role } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // =====================
        // VALIDATION
        // =====================
        if (name !== undefined && name.trim() === "") {
            return res.status(400).json({ message: "Name cannot be empty" });
        }
        if (email !== undefined && !email.includes("@")) {
            return res.status(400).json({ message: "Invalid email format" });
        }
        if (password !== undefined && password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        // update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;

        // hash password if updating
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        const updatedUser = await user.save();

        res.status(200).json({
            message: "User updated successfully",
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// =============================
// DELETE USER (ADMIN)
// =============================
const deleteUser = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.deleteOne();

        res.status(200).json({ message: "User deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports = {
    getAllUsers,
    getUserById,
    getMyProfile,
    updateUser,
    deleteUser
};