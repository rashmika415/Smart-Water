const mongoose = require("mongoose");
const AdminNotification = require("./adminNotificationModel");

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
        enum: ["admin", "user"],
        default: "user"
    },
    },
    {
        timestamps:true,
    }
);

userSchema.post("save", async function onUserCreated(doc) {
  try {
    if (!doc?.isNew) return;
    if (String(doc.role || "").toLowerCase() !== "user") return;
    await AdminNotification.create({
      type: "new_user_registration",
      title: "New user registered",
      message: `${doc.name} joined the system with ${doc.email}`,
      userId: doc._id,
      userName: doc.name,
      userEmail: doc.email,
      readBy: [],
    });
  } catch (err) {
    console.error("Failed to create admin notification from user model:", err);
  }
});

module.exports = mongoose.model("User", userSchema);