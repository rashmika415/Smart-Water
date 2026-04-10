/**
 * Basic API test script for Water Saving Plan endpoints
 * Run with: node test/API/testSavingPlanAPI.js
 *
 * Required env vars:
 * - API_BASE_URL (optional, default: http://localhost:5000)
 * - TEST_EMAIL
 * - TEST_PASSWORD
 */

require("dotenv").config();
const axios = require("axios");

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

if (!TEST_EMAIL || !TEST_PASSWORD) {
	console.error("❌ Missing TEST_EMAIL or TEST_PASSWORD in environment variables");
	process.exit(1);
}

const client = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
	headers: { "Content-Type": "application/json" },
});

async function login() {
	const response = await client.post("/api/auth/login", {
		email: TEST_EMAIL,
		password: TEST_PASSWORD,
	});

	if (!response.data?.token) {
		throw new Error("Login succeeded but token was not returned");
	}

	return response.data.token;
}

async function run() {
	try {
		console.log("\n💧 Testing Saving Plan API\n" + "=".repeat(40));
		const token = await login();
		console.log("✅ Login OK");

		const authHeaders = { Authorization: `Bearer ${token}` };

		// Test 1: Get all saving plans (should be empty initially)
		console.log("\n📋 Test 1: Get all saving plans");
		let response = await client.get("/api/saving-plan", { headers: authHeaders });
		console.log(`✅ GET /api/saving-plan: ${response.status} - ${response.data.count} plans`);

		// Test 2: Create a new saving plan
		console.log("\n📝 Test 2: Create saving plan");
		const createPayload = {
			planType: "Basic",
			householdSize: 4,
			priorityArea: "Bathroom",
			waterSource: "Municipal"
		};

		response = await client.post("/api/saving-plan", createPayload, { headers: authHeaders });
		console.log(`✅ POST /api/saving-plan: ${response.status} - Plan created`);
		const planId = response.data.data._id;

		// Test 3: Get all saving plans again (should have 1 now)
		console.log("\n📋 Test 3: Get all saving plans after creation");
		response = await client.get("/api/saving-plan", { headers: authHeaders });
		console.log(`✅ GET /api/saving-plan: ${response.status} - ${response.data.count} plans`);

		// Test 4: Get specific saving plan by ID
		console.log("\n🔍 Test 4: Get saving plan by ID");
		response = await client.get(`/api/saving-plan/${planId}`, { headers: authHeaders });
		console.log(`✅ GET /api/saving-plan/${planId}: ${response.status} - Plan retrieved`);

		// Test 5: Get saving calculation
		console.log("\n🧮 Test 5: Get saving calculation");
		response = await client.get("/api/saving-plan/calculation", { headers: authHeaders });
		console.log(`✅ GET /api/saving-plan/calculation: ${response.status} - Calculation retrieved`);

		// Test 6: Update saving plan
		console.log("\n✏️ Test 6: Update saving plan");
		const updatePayload = {
			status: "Completed",
			priorityArea: "Kitchen"
		};
		response = await client.put(`/api/saving-plan/${planId}`, updatePayload, { headers: authHeaders });
		console.log(`✅ PUT /api/saving-plan/${planId}: ${response.status} - Plan updated`);

		// Test 7: Try to create another plan (should fail - only one active plan allowed)
		console.log("\n🚫 Test 7: Try to create duplicate active plan");
		try {
			response = await client.post("/api/saving-plan", createPayload, { headers: authHeaders });
			console.log(`❌ POST /api/saving-plan: Should have failed but got ${response.status}`);
		} catch (error) {
			if (error.response?.status === 400) {
				console.log(`✅ POST /api/saving-plan: ${error.response.status} - Correctly rejected duplicate plan`);
			} else {
				throw error;
			}
		}

		// Test 8: Create custom plan
		console.log("\n🎯 Test 8: Create custom saving plan");
		// First update the existing plan to inactive
		await client.put(`/api/saving-plan/${planId}`, { status: "Inactive" }, { headers: authHeaders });

		const customPayload = {
			planType: "Custom",
			householdSize: 4,
			priorityArea: "Garden",
			waterSource: "Well",
			customGoalPercentage: 30
		};

		response = await client.post("/api/saving-plan", customPayload, { headers: authHeaders });
		console.log(`✅ POST /api/saving-plan (custom): ${response.status} - Custom plan created`);
		const customPlanId = response.data.data._id;

		// Test 9: Delete saving plan
		console.log("\n🗑️ Test 9: Delete saving plan");
		response = await client.delete(`/api/saving-plan/${customPlanId}`, { headers: authHeaders });
		console.log(`✅ DELETE /api/saving-plan/${customPlanId}: ${response.status} - Plan deleted`);

		console.log("\n🎉 All Saving Plan API tests passed!");

	} catch (error) {
		console.error("\n❌ Test failed:");
		if (error.response) {
			console.error(`Status: ${error.response.status}`);
			console.error(`Data:`, error.response.data);
		} else {
			console.error(error.message);
		}
		process.exit(1);
	}
}

if (require.main === module) {
	run();
}

module.exports = { run };