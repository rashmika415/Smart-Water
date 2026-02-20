const axios = require("axios");

const API_KEY = process.env.WEATHER_API_KEY;

async function getClimateFactor(location) {

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric`;

        const response = await axios.get(url);

        const weather = response.data.weather[0].main;
        const temp = response.data.main.temp;

        if (weather === "Rain") return 0.9;
        if (temp > 32) return 1.15;

        return 1;

    } catch (error) {
        console.log("Weather API failed:", error.message);
        return 1;
    }
}

module.exports = getClimateFactor;
