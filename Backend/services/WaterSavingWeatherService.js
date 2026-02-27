// services/WaterSavingWeatherService.js
const axios = require("axios");

const getWeatherForLocation = async (cityName) => {
  if (!cityName) {
    return {
      error: "No location data available",
      gardenAdvice: "⚠ Please update household location to get weather advice",
    };
  }

  try {
    // 1️⃣ Geocode the city
    const geoResponse = await axios.get(
      "http://api.openweathermap.org/geo/1.0/direct",
      {
        params: {
          q: cityName + ",LK",
          limit: 1,
          appid: process.env.WEATHER_API_KEY_WaterSavingPlan,
        },
      }
    );

    if (!geoResponse.data.length) {
      return {
        location: cityName,
        error: "Location not found in weather API",
        gardenAdvice: "⚠ Unable to get weather data for this location",
      };
    }

    const { lat, lon } = geoResponse.data[0];

    // 2️⃣ Get weather
    const weatherResponse = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      {
        params: {
          lat,
          lon,
          appid: process.env.WEATHER_API_KEY_WaterSavingPlan,
          units: "metric",
        },
      }
    );

    const weatherMain = weatherResponse.data.weather[0].main;
    const weatherDescription = weatherResponse.data.weather[0].description;
    const temperature = weatherResponse.data.main.temp;

    const gardenAdvice = ["Rain", "Drizzle", "Thunderstorm"].includes(weatherMain)
      ? "🌧 Rain detected. Do NOT water the garden today."
      : "☀ No rain. You can water the garden.";

    return {
      location: cityName,
      weather: weatherMain,
      description: weatherDescription,
      temperature,
      gardenAdvice,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      error: "Failed to fetch weather data",
      gardenAdvice: "⚠ Weather service temporarily unavailable",
    };
  }
};

module.exports = { getWeatherForLocation };