const mongoose = require("mongoose");
const { calculateWaterCarbon, isHeatedActivity } = require("../services/carbonService");

const UsageSchema = new mongoose.Schema(
	{
		householdId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Household",
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

		// 🌍 Carbon Footprint Tracking (NEW)
		carbonFootprint: {
			carbonKg: { type: Number, default: 0, min: 0 },
			energyKwh: { type: Number, default: 0, min: 0 },
			breakdown: {
				treatment: { type: Number, default: 0 },
				heating: { type: Number, default: 0 },
			},
			equivalents: {
				carKm: { type: Number, default: 0 },
				trees: { type: Number, default: 0 },
				smartphones: { type: Number, default: 0 },
				meals: { type: Number, default: 0 },
				description: { type: String, default: "" },
			},
			isHeatedWater: { type: Boolean, default: false },
			source: {
				type: String,
				enum: ["api", "local", "none"],
				default: "none",
			},
			calculatedAt: { type: Date },
		},

		// Soft delete
		deletedAt: { type: Date, default: null, index: true },
	},
	{ timestamps: true }
);

UsageSchema.index({ householdId: 1, occurredAt: -1 });
UsageSchema.index({ householdId: 1, activityType: 1, occurredAt: -1 });
UsageSchema.index({ householdId: 1, "carbonFootprint.carbonKg": -1 });

// Pre-validate hook: Calculate liters from inputs
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

// 🌍 Pre-save hook: Calculate carbon footprint automatically
UsageSchema.pre("save", async function () {
	try {
		// Only calculate if liters changed or carbon not yet calculated
		if (this.isModified("liters") || !this.carbonFootprint?.carbonKg) {
			if (this.liters && this.liters > 0) {
				// Determine if this activity uses heated water
				const isHeated = isHeatedActivity(this.activityType);

				// Calculate carbon footprint
				const carbonData = await calculateWaterCarbon(this.liters, isHeated);

				// Store carbon footprint data
				this.carbonFootprint = {
					carbonKg: carbonData.carbonKg,
					energyKwh: carbonData.energyKwh,
					breakdown: carbonData.breakdown,
					equivalents: carbonData.equivalents,
					isHeatedWater: isHeated,
					source: carbonData.source,
					calculatedAt: carbonData.calculatedAt,
				};
			}
		}
	} catch (error) {
		console.error("Error calculating carbon footprint:", error);
		// Don't fail the save if carbon calculation fails
		// Just continue without carbon data
	}
});

module.exports = mongoose.model("Usage", UsageSchema);
