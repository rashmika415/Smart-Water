const axios = require("axios");

const API_KEY = process.env.WEATHER_API_KEY;

/**
 * Returns a climate factor and zone label for predictive water usage
 * Zone is determined using geographic location (lat/lon)
 * Weather data is used for small dynamic adjustment
 *
 * @param {string} location - city name
 * @returns {object} { factor: number, zone: string }
 */
async function getClimateFactor(location) {
    try {
        if (!location) {
            return { factor: 1, zone: "Intermediate" };
        }

        if (!API_KEY) {
            console.log("Missing WEATHER_API_KEY in .env");
            return { factor: 1, zone: "Intermediate" };
        }

        const response = await axios.get(
            "https://api.openweathermap.org/data/2.5/weather",
            {
                params: {
                    q: location,
                    appid: API_KEY,
                    units: "metric"
                }
            }
        );

        /* ======================================================
           Extract Safe Weather Data
        ====================================================== */

        const lat = Number(response.data?.coord?.lat) || 0;
        const lon = Number(response.data?.coord?.lon) || 0;
        const temp = Number(response.data?.main?.temp) || 0;
        const rainfall =
            Number(response.data?.rain?.["1h"]) ||
            Number(response.data?.rain?.["3h"]) ||
            0;

        let zone = "Intermediate";
        let factor = 1;

        /* ======================================================
           1️⃣ Permanent Zone Classification (Sri Lanka Belts)
        ====================================================== */

        // ☀ Northern & Eastern Sri Lanka → Dry Zone
        if (lat >= 8.0) {
            zone = "Dry";
            factor = 1.15;
        }

        // 🌧 South-West Low Country → Wet Zone
        else if (lat < 7.5 && lon < 80.5) {
            zone = "Wet";
            factor = 0.85;
        }

        // 🌧 Central Highlands (Nuwara Eliya region) → Wet
        else if (lat < 7.5 && lon >= 80.5) {
            zone = "Wet";
            factor = 0.90;
        }

        // 🌤 Middle Belt → Intermediate
        else {
            zone = "Intermediate";
            factor = 1;
        }

        /* ======================================================
           2️⃣ Small Dynamic Adjustment Using Live Weather
        ====================================================== */

        // Very high temperature → increase usage slightly
        if (temp >= 33) {
            factor += 0.05;
        }

        // Heavy rainfall currently → reduce usage slightly
        if (rainfall >= 5) {
            factor -= 0.05;
        }

        /* ======================================================
           3️⃣ Safety Boundaries
        ====================================================== */

        if (factor < 0.75) factor = 0.75;
        if (factor > 1.30) factor = 1.30;

        return {
            factor: Number(factor.toFixed(2)),
            zone
        };

    } catch (error) {
        console.log("Weather API failed:", error.message);

        // Safe fallback (never break system)
        return { factor: 1, zone: "Intermediate" };
    }
}

module.exports = getClimateFactor;