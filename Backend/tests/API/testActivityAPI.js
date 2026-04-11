/**
 * Smoke API test script for Activity endpoints
 * Run with: node tests/API/testActivityAPI.js
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
    return response.data.token;
}

async function run() {
    try {
        console.log("\n🏃 Testing Activity API\n" + "=".repeat(40));
        const token = await login();
        console.log("✅ Login OK");

        const authHeaders = { Authorization: `Bearer ${token}` };

        // 1. Create Activity
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isoDate = tomorrow.toISOString().split('T')[0];

        const createPayload = {
            activityType: "Valve Inspection",
            scheduledDate: isoDate,
            scheduledTime: "10:30",
            location: "North Wing",
            notes: "API smoke test activity"
        };

        const createRes = await client.post("/api/activities", createPayload, { headers: authHeaders });
        console.log("✅ Create activity:", createRes.status);

        const activityId = createRes.data?.data?._id;
        if (!activityId) throw new Error("Activity ID not returned");

        // 2. List Activities
        const listRes = await client.get("/api/activities", { headers: authHeaders });
        console.log("✅ List activities:", listRes.status, `count=${listRes.data?.data?.length}`);

        // 3. Get By ID
        const getRes = await client.get(`/api/activities/${activityId}`, { headers: authHeaders });
        console.log("✅ Get activity by ID:", getRes.status);

        // 4. Update Activity (Admin only logic applies on server, script assumes TEST_EMAIL is admin if update works)
        const updateRes = await client.put(`/api/activities/${activityId}`, { status: "In-Progress" }, { headers: authHeaders });
        console.log("✅ Update activity:", updateRes.status);

        // 5. Delete Activity
        const deleteRes = await client.delete(`/api/activities/${activityId}`, { headers: authHeaders });
        console.log("✅ Delete activity:", deleteRes.status);

        console.log("\n🎉 Activity API smoke test completed successfully\n");
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
