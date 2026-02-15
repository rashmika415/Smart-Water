const mongoose = require("mongoose");

const UsageSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},

		activityType: { type: String, required: true, index: true },
		occurredAt: { type: Date, default: Date.now, index: true },

		// Input styles: duration-based or count-based
		durationMinutes: { type: Number, min: 0 },
		count: { type: Number, min: 0 },

		// Parameters for auto-calculation
		flowRateLpm: { type: Number, min: 0 },
		litersPerUnit: { type: Number, min: 0 },

		// Computed/stored total
		liters: { type: Number, min: 0, required: true },

		// Preset/template support
		presetId: { type: mongoose.Schema.Types.ObjectId, ref: "UsagePreset" },
		source: {
			type: String,
			enum: ["manual", "preset", "imported"],
			default: "manual",
		},

		notes: { type: String, default: "" },

		// Soft delete
		deletedAt: { type: Date, default: null, index: true },
	},
	{ timestamps: true }
);

UsageSchema.index({ userId: 1, occurredAt: -1 });
UsageSchema.index({ userId: 1, activityType: 1, occurredAt: -1 });

UsageSchema.pre("validate", function () {
	if (typeof this.liters === "number" && this.liters >= 0) return;

	if (this.durationMinutes != null && this.flowRateLpm != null) {
		this.liters = this.durationMinutes * this.flowRateLpm;
		return;
	}

	if (this.count != null && this.litersPerUnit != null) {
		this.liters = this.count * this.litersPerUnit;
		return;
	}

	throw new Error(
		"Cannot compute liters: provide (durationMinutes + flowRateLpm) or (count + litersPerUnit), or set liters."
	);
});

module.exports = mongoose.model("Usage", UsageSchema);
