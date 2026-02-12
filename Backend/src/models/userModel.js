const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,   // email must be unique
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        enum: ["admin", "user1", "user2", "user3", "user4"],
        default: "user1"
    },
    },
    {
        timestamps:true,
    }
);

module.exports = mongoose.model("User", userSchema);
