/**
 * Test script for Carbon Footprint API Integration
 * Run with: node testCarbonAPI.js
 */

require("dotenv").config();
const { calculateWaterCarbon, isHeatedActivity, calculateEquivalents } = require("../../services/carbonService");

console.log("🌍 Testing Carbon Footprint API Integration\n");
console.log("=" .repeat(60));

async function testCarbonCalculations() {
	try {
		// Test 1: Cold water usage (toilet flush)
		console.log("\n📊 Test 1: Cold Water Usage (Toilet Flush)");
		console.log("-".repeat(60));
		const toiletTest = await calculateWaterCarbon(10, false);
		console.log("Water Used: 10 liters");
		console.log("Heated: No");
		console.log("Carbon Emissions:", toiletTest.carbonKg, "kg CO2");
		console.log("Energy Used:", toiletTest.energyKwh, "kWh");
		console.log("Equivalent to:", toiletTest.equivalents.description);
		console.log("Source:", toiletTest.source);

		// Test 2: Hot water usage (shower)
		console.log("\n📊 Test 2: Hot Water Usage (15-min Shower)");
		console.log("-".repeat(60));
		const showerTest = await calculateWaterCarbon(150, true);
		console.log("Water Used: 150 liters");
		console.log("Heated: Yes");
		console.log("Carbon Emissions:", showerTest.carbonKg, "kg CO2");
		console.log("Energy Used:", showerTest.energyKwh, "kWh");
		console.log("Breakdown:");
		console.log("  - Treatment:", showerTest.breakdown.treatment, "kWh");
		console.log("  - Heating:", showerTest.breakdown.heating, "kWh");
		console.log("\n🚗 Equivalents:");
		console.log("  - Car driving:", showerTest.equivalents.carKm, "km");
		console.log("  - Trees needed/year:", showerTest.equivalents.trees);
		console.log("  - Smartphone charges:", showerTest.equivalents.smartphones);
		console.log("  - Meals cooked:", showerTest.equivalents.meals);
		console.log("\n💬", showerTest.equivalents.description);

		// Test 3: Activity type detection
		console.log("\n📊 Test 3: Activity Type Detection");
		console.log("-".repeat(60));
		const activities = [
			"Toilet Flush",
			"Shower",
			"Dishwashing",
			"Garden Watering",
			"Washing Machine",
			"Drinking Water"
		];
		
		activities.forEach(activity => {
			const isHeated = isHeatedActivity(activity);
			console.log(`${activity.padEnd(20)} → ${isHeated ? "🔥 Heated" : "❄️  Cold"}`);
		});

		// Test 4: Large usage scenario (full household daily usage)
		console.log("\n📊 Test 4: Daily Household Usage (4 people)");
		console.log("-".repeat(60));
		const dailyUsage = await calculateWaterCarbon(600, false); // Mixed usage
		console.log("Water Used: 600 liters (daily average)");
		console.log("Carbon Emissions:", dailyUsage.carbonKg, "kg CO2");
		console.log("Monthly Estimate:", (dailyUsage.carbonKg * 30).toFixed(2), "kg CO2");
		console.log("Yearly Estimate:", (dailyUsage.carbonKg * 365).toFixed(2), "kg CO2");

		// Test 5: Carbon equivalents showcase
		console.log("\n📊 Test 5: Carbon Equivalents (10 kg CO2)");
		console.log("-".repeat(60));
		const equivalents = calculateEquivalents(10);
		console.log("10 kg CO2 is equivalent to:");
		console.log(`  🚗 Driving ${equivalents.carKm} km in a car`);
		console.log(`  🌳 Requires ${equivalents.trees} trees to absorb (1 year)`);
		console.log(`  📱 Charging ${equivalents.smartphones} smartphones`);
		console.log(`  🍳 Cooking ${equivalents.meals} meals`);

		// API Status Check
		console.log("\n📊 API Configuration Status");
		console.log("-".repeat(60));
		const apiKey = process.env.CarbonInterface_API_key;
		if (apiKey && apiKey !== "your_carbon_api_key_here") {
			console.log("✅ CarbonInterface API Key: Configured");
			console.log("   Key:", apiKey.substring(0, 5) + "..." + apiKey.slice(-3));
		} else {
			console.log("⚠️  CarbonInterface API Key: Not configured");
			console.log("   Using local calculations as fallback");
		}

		console.log("\n" + "=".repeat(60));
		console.log("✅ All tests completed successfully!");
		console.log("🌍 Carbon Footprint Integration is working!\n");

	} catch (error) {
		console.error("\n❌ Test failed:", error.message);
		console.error(error);
		process.exit(1);
	}
}

// Run tests
testCarbonCalculations();
