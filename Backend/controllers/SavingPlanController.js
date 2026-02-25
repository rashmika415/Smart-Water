const SavingPlan = require('../models/SavingPlanModel');
const Household = require('../models/householdModel');
const axios = require("axios");

const getAllSavingPlans = async (req, res) => {
    let savingPlans;
    try {
        // Populate householdId to get location data
        savingPlans = await SavingPlan.find().populate('householdId');
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Error fetching saving plans" });
    }
    
    if (!savingPlans || savingPlans.length === 0) {
        return res.status(404).json({ message: "No saving plans found" });
    }

    // Array to store enhanced saving plans with weather data
    const enhancedSavingPlans = [];

    // Loop through each saving plan to get weather data
    for (const plan of savingPlans) {
        try {
            const planObj = plan.toObject();
            
            // Check if household exists and has location
            if (plan.householdId && plan.householdId.location) {
                const locationName = plan.householdId.location;
                
                // 1️⃣ Geocode the location
                const geoResponse = await axios.get(
                    "http://api.openweathermap.org/geo/1.0/direct",
                    {
                        params: {
                            q: locationName + ",LK", // Assuming Sri Lanka
                            limit: 1,
                            appid: process.env.WEATHER_API_KEY_WaterSavingPlan
                        }
                    }
                );

                if (geoResponse.data.length > 0) {
                    const { lat, lon } = geoResponse.data[0];

                    // 2️⃣ Get weather data
                    const weatherResponse = await axios.get(
                        "https://api.openweathermap.org/data/2.5/weather",
                        {
                            params: {
                                lat,
                                lon,
                                appid: process.env.WEATHER_API_KEY_WaterSavingPlan,
                                units: "metric"
                            }
                        }
                    );

                    const weatherMain = weatherResponse.data.weather[0].main;
                    const weatherDescription = weatherResponse.data.weather[0].description;
                    const temperature = weatherResponse.data.main.temp;

                    // 3️⃣ Generate advice based on weather
                    let gardenAdvice;
                    if (["Rain", "Drizzle", "Thunderstorm"].includes(weatherMain)) {
                        gardenAdvice = "🌧 Rain detected. Do NOT water the garden today.";
                    } else {
                        gardenAdvice = "☀ No rain. You can water the garden.";
                    }

                    // Add weather data to the plan object
                    planObj.weatherData = {
                        location: locationName,
                        weather: weatherMain,
                        description: weatherDescription,
                        temperature: temperature,
                        gardenAdvice: gardenAdvice,
                        timestamp: new Date()
                    };
                } else {
                    planObj.weatherData = {
                        location: locationName,
                        error: "Location not found in weather API",
                        gardenAdvice: "⚠ Unable to get weather data for this location"
                    };
                }
            } else {
                planObj.weatherData = {
                    error: "No location data available for this household",
                    gardenAdvice: "⚠ Please update household location to get weather advice"
                };
            }
            
            enhancedSavingPlans.push(planObj);
            
        } catch (err) {
            console.log(`Error fetching weather for plan ${plan._id}:`, err.message);
            // Add plan without weather data
            const planObj = plan.toObject();
            planObj.weatherData = {
                error: "Failed to fetch weather data",
                gardenAdvice: "⚠ Weather service temporarily unavailable"
            };
            enhancedSavingPlans.push(planObj);
        }
    }

    // Display all saving plans with weather data in json format
    return res.status(200).json({ 
        count: enhancedSavingPlans.length,
        savingPlans: enhancedSavingPlans 
    });
};

//data Insert
const addSavingPlan = async (req, res) => {
    const { householdId, planType, householdSize, priorityArea, customGoalPercentage, waterSource } = req.body;
    let savingPlan;
    try {
        savingPlan = new SavingPlan({
            householdId,
            planType,
            householdSize,
            priorityArea,
            customGoalPercentage,
            waterSource
        });
        await savingPlan.save();
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Unable to add saving plan" });
    }
    //not insert saving plan
    if (!savingPlan) {
        return res.status(404).json({ message: "Unable to add" });
    }

    //insert saving plan successfully
    return res.status(200).json({ savingPlan });
};

//get by id
const getSavingPlanById = async (req, res) => {
    const id = req.params.id;
    let savingPlan;
    try {
        savingPlan = await SavingPlan.findById(id).populate('householdId');
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Error fetching saving plan" });
    }
    if (!savingPlan) {
        return res.status(404).json({ message: "No saving plan found" });
    }
    
    // Add weather data for single plan
    try {
        const planObj = savingPlan.toObject();
        
        if (savingPlan.householdId && savingPlan.householdId.location) {
            const locationName = savingPlan.householdId.location;
            
            const geoResponse = await axios.get(
                "http://api.openweathermap.org/geo/1.0/direct",
                {
                    params: {
                        q: locationName + ",LK",
                        limit: 1,
                        appid: process.env.WEATHER_API_KEY_WaterSavingPlan
                    }
                }
            );

            if (geoResponse.data.length > 0) {
                const { lat, lon } = geoResponse.data[0];

                const weatherResponse = await axios.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    {
                        params: {
                            lat,
                            lon,
                            appid: process.env.WEATHER_API_KEY_WaterSavingPlan,
                            units: "metric"
                        }
                    }
                );

                const weatherMain = weatherResponse.data.weather[0].main;
                const gardenAdvice = ["Rain", "Drizzle", "Thunderstorm"].includes(weatherMain)
                    ? "🌧 Rain detected. Do NOT water the garden today."
                    : "☀ No rain. You can water the garden.";

                planObj.weatherData = {
                    location: locationName,
                    weather: weatherMain,
                    description: weatherResponse.data.weather[0].description,
                    temperature: weatherResponse.data.main.temp,
                    gardenAdvice: gardenAdvice,
                    timestamp: new Date()
                };
            }
        }
        
        return res.status(200).json({ savingPlan: planObj });
    } catch (err) {
        // Return plan without weather data if weather API fails
        return res.status(200).json({ savingPlan });
    }
};

const updateSavingPlan = async (req, res) => {
    const id = req.params.id;
    const { householdId, planType, householdSize, priorityArea, customGoalPercentage, waterSource } = req.body;
    let savingPlan;
    try {
        savingPlan = await SavingPlan.findByIdAndUpdate(id, {
            householdId,
            planType,
            householdSize,
            priorityArea,
            customGoalPercentage,
            waterSource
        }, { new: true }); // Added { new: true } to return updated document
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Unable to update" });
    }
    if (!savingPlan) {
        return res.status(404).json({ message: "Unable to update" });
    }
    return res.status(200).json({ savingPlan });
};

const deleteSavingPlan = async (req, res) => {
    const id = req.params.id;
    let savingPlan;
    try {
        savingPlan = await SavingPlan.findByIdAndDelete(id);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Unable to delete" });
    }
    if (!savingPlan) {
        return res.status(404).json({ message: "Unable to delete" });
    }
    return res.status(200).json({ message: "Saving plan successfully deleted" });
};

exports.createSavingPlan = async (req, res) => {
    try {
        // 1️⃣ Find household of logged user
        const household = await Household.findOne({
            userId: req.user.id || req.user._id
        });

        if (!household) {
            return res.status(404).json({ message: "No household found for this user" });
        }

        // 2️⃣ Create saving plan automatically linked
        const savingPlan = new SavingPlan({
            householdId: household._id,
            planType: req.body.planType,
            householdSize: req.body.householdSize,
            priorityArea: req.body.priorityArea,
            customGoalPercentage: req.body.customGoalPercentage,
            waterSource: req.body.waterSource
        });

        await savingPlan.save();
        res.status(201).json(savingPlan);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

//get weather data from openweathermap api
exports.getWeatherAdvice = async (req, res) => {
    try {
        // 1️⃣ Get saving plan using logged user household
        const savingPlan = await SavingPlan.findOne()
            .populate("householdId");

        if (!savingPlan) {
            return res.status(404).json({ message: "Saving plan not found" });
        }

        const household = savingPlan.householdId;

        if (!household || !household.location) {
            return res.status(400).json({ message: "Household location not set" });
        }

        const locationName = household.location;

        // 2️⃣ Geocode
        const geoResponse = await axios.get(
            "http://api.openweathermap.org/geo/1.0/direct",
            {
                params: {
                    q: locationName + ",LK",
                    limit: 1,
                    appid: process.env.WEATHER_API_KEY_WaterSavingPlan
                }
            }
        );

        if (geoResponse.data.length === 0) {
            return res.status(404).json({ message: "Location not found in weather API" });
        }

        const { lat, lon } = geoResponse.data[0];

        // 3️⃣ Get weather
        const weatherResponse = await axios.get(
            "https://api.openweathermap.org/data/2.5/weather",
            {
                params: {
                    lat,
                    lon,
                    appid: process.env.WEATHER_API_KEY_WaterSavingPlan,
                    units: "metric"
                }
            }
        );

        const weatherMain = weatherResponse.data.weather[0].main;

        let advice;

        if (["Rain", "Drizzle", "Thunderstorm"].includes(weatherMain)) {
            advice = "🌧 Rain detected. Do NOT water the garden today.";
        } else {
            advice = "☀ No rain. You can water the garden.";
        }

        res.status(200).json({
            savingPlan,
            location: locationName,
            weather: weatherMain,
            advice
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Export all functions
exports.getAllSavingPlans = getAllSavingPlans;
exports.addSavingPlan = addSavingPlan;
exports.getSavingPlanById = getSavingPlanById;
exports.deleteSavingPlan = deleteSavingPlan;
exports.updateSavingPlan = updateSavingPlan;
