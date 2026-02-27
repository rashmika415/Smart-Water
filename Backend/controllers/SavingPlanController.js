const SavingPlan = require('../models/SavingPlanModel');
const Household = require('../models/householdModel');
const axios = require("axios");

const getAllSavingPlans = async (req, res) => {
    let savingPlans;
    try {
        // Populate householdId to get location data temporarily
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

            // Calculate water saving
if (
    planObj.totalWaterUsagePerDay !== undefined &&
    planObj.targetReductionPercentage !== undefined
) {

    const waterToSave =
        (planObj.totalWaterUsagePerDay * planObj.targetReductionPercentage) / 100;

    const targetDailyUsage =
        planObj.totalWaterUsagePerDay - waterToSave;

    planObj.savingCalculation = {
        totalWaterUsagePerDay: planObj.totalWaterUsagePerDay,
        targetReductionPercentage: planObj.targetReductionPercentage,
        waterToSaveLiters: waterToSave,
        targetDailyUsage: targetDailyUsage
    };
}
            
            // Store the household ID separately
            const householdIdValue = plan.householdId._id.toString();

            // ensure customGoalPercentage null for non-custom plans
            if (planObj.planType !== "Custom") {
                planObj.customGoalPercentage = null;
            }
            
            // Check if household exists and has location
            if (plan.householdId && plan.householdId.location && plan.householdId.location.city) {
                const locationName = plan.householdId.location.city;
                
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
            
            // Replace the populated householdId with just the ID string
            planObj.householdId = householdIdValue;
            
            enhancedSavingPlans.push(planObj);
            
        } catch (err) {
            console.log(`Error fetching weather for plan ${plan._id}:`, err.message);
            // Add plan without weather data
            const planObj = plan.toObject();
            
            // Store the household ID separately and replace populated data
            if (plan.householdId) {
                planObj.householdId = plan.householdId._id.toString();
            }
            
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
    try {
        // 1️⃣ Find household using logged-in user
        const household = await Household.findOne({
            userId: req.user.id || req.user._id
        });

        if (!household) {
            return res.status(404).json({
                success: false,
                message: "No household found for this user"
            });
        }

        const {
            planType,
            householdSize,
            totalWaterUsagePerDay,
            priorityArea,
            customGoalPercentage,
            waterSource
        } = req.body;

        // 2️⃣ Validate required fields
        if (!planType || !householdSize || !priorityArea || !waterSource) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided"
            });
        }

        // 3️⃣ Validate planType
        const allowedPlanTypes = ["Basic", "Advanced", "Custom"];
        if (!allowedPlanTypes.includes(planType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan type. Allowed types: Basic, Advanced, Custom"
            });
        }

        let targetReductionPercentage = 0;

        // 4️⃣ Business Logic
        switch (planType) {

            case "Basic":
                targetReductionPercentage = 10;
                break;

            case "Advanced":
                targetReductionPercentage = 20;
                break;

            case "Custom":

                if (!customGoalPercentage) {
                    return res.status(400).json({
                        success: false,
                        message: "Custom goal percentage is required for Custom plan"
                    });
                }

                if (customGoalPercentage < 1 || customGoalPercentage > 100) {
                    return res.status(400).json({
                        success: false,
                        message: "Custom goal must be between 1 and 100"
                    });
                }

                targetReductionPercentage = customGoalPercentage;
                break;
        }

        // 5️⃣ Optional: Prevent multiple active plans
        const existingPlan = await SavingPlan.findOne({
            householdId: household._id,
            status: "Active"
        });

        if (existingPlan) {
            return res.status(400).json({
                success: false,
                message: "An active saving plan already exists"
            });
        }

        // 6️⃣ Create new saving plan
        const newSavingPlan = new SavingPlan({
            householdId: household._id,
            planType,
            householdSize,
            totalWaterUsagePerDay,
            priorityArea,
            waterSource,
            customGoalPercentage: planType === "Custom" ? customGoalPercentage : null,
            targetReductionPercentage,
            status: "Active",
            createdAt: new Date()
        });

        await newSavingPlan.save();

        res.status(201).json({
            success: true,
            message: "Saving plan created successfully",
            data: newSavingPlan
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
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
        
        // Store the household ID separately
        const householdIdValue = savingPlan.householdId._id.toString();
        
        if (savingPlan.householdId && savingPlan.householdId.location && savingPlan.householdId.location.city) {
            const locationName = savingPlan.householdId.location.city;
            
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
            if (planObj.planType !== "Custom") {
    planObj.customGoalPercentage = null;
}

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
        
        // Replace the populated householdId with just the ID string
        planObj.householdId = householdIdValue;
        
        return res.status(200).json({ savingPlan: planObj });
    } catch (err) {
        // Return plan without weather data if weather API fails
        const planObj = savingPlan.toObject();
        if (savingPlan.householdId) {
            planObj.householdId = savingPlan.householdId._id.toString();
        }
        return res.status(200).json({ savingPlan: planObj });
    }
};

//update saving plan

const updateSavingPlan = async (req, res) => {
    const id = req.params.id;
    const { householdId, planType, householdSize,totalWaterUsagePerDay, priorityArea, customGoalPercentage, waterSource } = req.body;
    let savingPlan;
    try {
        savingPlan = await SavingPlan.findByIdAndUpdate(id, {
            householdId,
            planType,
            householdSize,
            totalWaterUsagePerDay,
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

//delete saving plan
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

exports.addSavingPlan = async (req, res) => {
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
            totalWaterUsagePerDay: req.body.totalWaterUsagePerDay,
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
const getSavingCalculation = async (req, res) => {
    try {

        // 1️⃣ Find logged user's household
        const household = await Household.findOne({
            userId: req.user.id || req.user._id
        });

        if (!household) {
            return res.status(404).json({ message: "Household not found" });
        }

        // 2️⃣ Find saving plan
        const savingPlan = await SavingPlan.findOne({
            householdId: household._id
        });

        if (!savingPlan) {
            return res.status(404).json({ message: "Saving plan not found" });
        }

        const baselineUsage = savingPlan.totalWaterUsagePerDay;
        const targetPercent = savingPlan.targetReductionPercentage;

        // 3️⃣ Calculate water to save
        const waterToSave =
            (baselineUsage * targetPercent) / 100;

        // 4️⃣ Calculate target daily usage
        const targetUsage =
            baselineUsage - waterToSave;

        return res.status(200).json({
            totalWaterUsagePerDay: baselineUsage,
            targetReductionPercentage: targetPercent,
            waterToSaveLiters: waterToSave,
            targetDailyUsage: targetUsage
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
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
exports.getSavingCalculation = getSavingCalculation;
