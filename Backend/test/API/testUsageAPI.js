/**
 * Basic API test script for Water Usage endpoints
 * Run with: node test/API/testUsageAPI.js
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
		console.log("\n💧 Testing Usage API\n" + "=".repeat(40));
		const token = await login();
		console.log("✅ Login OK");

		const authHeaders = { Authorization: `Bearer ${token}` };

		const createPayload = {
			activityType: "shower",
			durationMinutes: 8,
			flowRateLpm: 6,
			occurredAt: new Date().toISOString(),
			source: "manual",
			notes: "API test usage record",
		};

		const createRes = await client.post("/usage", createPayload, { headers: authHeaders });
		console.log("✅ Create usage:", createRes.status);

		const usageId = createRes.data?.data?._id;
		if (!usageId) {
			throw new Error("Create usage did not return usage id");
		}

		const listRes = await client.get("/usage?page=1&limit=5&sort=-occurredAt", { headers: authHeaders });
		console.log("✅ List usages:", listRes.status, `count=${listRes.data?.count}, total=${listRes.data?.total}`);

		const getRes = await client.get(`/usage/${usageId}`, { headers: authHeaders });
		console.log("✅ Get usage by id:", getRes.status);

		const updateRes = await client.put(
			`/usage/${usageId}`,
			{
				activityType: "shower",
				durationMinutes: 7,
				flowRateLpm: 6,
				notes: "Updated by API test",
			},
			{ headers: authHeaders }
		);
		console.log("✅ Update usage:", updateRes.status);

		const deleteRes = await client.delete(`/usage/${usageId}`, { headers: authHeaders });
		console.log("✅ Delete usage:", deleteRes.status);

		const carbonRes = await client.get("/usage/carbon-stats", { headers: authHeaders });
		console.log("✅ Carbon stats:", carbonRes.status);

		console.log("\n🎉 Usage API smoke test completed successfully\n");
	} catch (error) {
		if (error.response) {
			console.error("❌ API Error:", error.response.status, error.response.data);
		} else {
			console.error("❌ Test failed:", error.message);
		}
		process.exit(1);
	}
}

run();
