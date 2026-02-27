# 🌍 Carbon Footprint API - Complete Documentation

## Overview
The Carbon Footprint API integration calculates and tracks the environmental impact (CO2 emissions) of water consumption in your Smart Water Management System.

---

## ✨ Features Implemented

### 1. **Automatic Carbon Calculation**
- Every water usage record automatically calculates CO2 emissions
- Differentiates between cold and heated water
- Uses CarbonInterface API with local fallback

### 2. **Real-time Impact Display**
- Shows carbon emissions when creating usage
- Provides relatable equivalents (car km, trees, etc.)
- Educational messages for users

### 3. **Analytics & Reporting**
- Carbon statistics with trend analysis
- Activity-based breakdown
- Household leaderboards
- Daily trend tracking

### 4. **Gamification**
- Compare households (eco-competition)
- Achievement badges
- Progress tracking
- Savings goals

---

## 🔌 API Endpoints

### 1. Create Usage (with automatic carbon calculation)
```http
POST /usage
Authorization: Bearer <token>

Request Body:
{
  "householdId": "65f7a8b9c1234567890abcde",
  "activityType": "Shower",
  "durationMinutes": 15,
  "flowRateLpm": 10,
  "notes": "Morning shower"
}

Response:
{
  "success": true,
  "message": "Usage created successfully",
  "data": {
    "_id": "65f7a8b9c1234567890abcde",
    "activityType": "Shower",
    "liters": 150,
    "carbonFootprint": {
      "carbonKg": 0.72,
      "energyKwh": 6.375,
      "breakdown": {
        "treatment": 0.075,
        "heating": 6.3
      },
      "equivalents": {
        "carKm": 4.2,
        "trees": 0.033,
        "smartphones": 90,
        "meals": 0.3,
        "description": "Equal to driving 4.2 km in a car"
      },
      "isHeatedWater": true,
      "source": "local",
      "calculatedAt": "2026-02-27T10:30:00.000Z"
    },
    "occurredAt": "2026-02-27T10:30:00.000Z"
  },
  "carbonImpact": {
    "carbonKg": 0.72,
    "equivalents": {
      "carKm": 4.2,
      "trees": 0.033,
      "smartphones": 90,
      "meals": 0.3,
      "description": "Equal to driving 4.2 km in a car"
    },
    "message": "🌍 Equal to driving 4.2 km in a car"
  }
}
```

---

### 2. Get Carbon Statistics
```http
GET /usage/carbon-stats?householdId=<id>&startDate=2026-01-01&endDate=2026-02-27
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-02-27T23:59:59.999Z",
      "days": 58
    },
    "current": {
      "totalCarbonKg": 45.236,
      "totalEnergyKwh": 234.5,
      "totalLiters": 8500,
      "heatedWaterLiters": 3200,
      "heatedWaterPercentage": 37.6,
      "equivalents": {
        "carKm": 266,
        "trees": 2.08,
        "smartphones": 5654,
        "meals": 18.1,
        "description": "Equal to driving 266 km in a car"
      }
    },
    "previous": {
      "totalCarbonKg": 52.8,
      "totalEnergyKwh": 278.3
    },
    "comparison": {
      "carbonChange": -14.4,
      "trend": "decreasing",
      "message": "🎉 Great! Your carbon emissions decreased by 14.4%"
    },
    "recordCount": 156
  }
}
```

---

### 3. Get Carbon Breakdown by Activity
```http
GET /usage/carbon-by-activity?householdId=<id>&startDate=2026-01-01&endDate=2026-02-27
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-02-27T23:59:59.999Z"
    },
    "totalCarbonKg": 45.236,
    "breakdown": [
      {
        "activityType": "Shower",
        "totalLiters": 3200,
        "totalCarbonKg": 15.36,
        "totalEnergyKwh": 136.0,
        "count": 58,
        "avgLitersPerUse": 55.2,
        "avgCarbonPerUse": 0.265,
        "percentageOfTotal": 34.0
      },
      {
        "activityType": "Washing Machine",
        "totalLiters": 2400,
        "totalCarbonKg": 11.52,
        "totalEnergyKwh": 100.8,
        "count": 24,
        "avgLitersPerUse": 100.0,
        "avgCarbonPerUse": 0.48,
        "percentageOfTotal": 25.5
      },
      {
        "activityType": "Toilet Flush",
        "totalLiters": 1500,
        "totalCarbonKg": 1.2,
        "totalEnergyKwh": 0.75,
        "count": 150,
        "avgLitersPerUse": 10.0,
        "avgCarbonPerUse": 0.008,
        "percentageOfTotal": 2.7
      }
    ],
    "topEmitter": {
      "activityType": "Shower",
      "totalCarbonKg": 15.36,
      "percentageOfTotal": 34.0
    }
  }
}
```

---

### 4. Get Carbon Leaderboard
```http
GET /usage/carbon-leaderboard?startDate=2026-01-01&endDate=2026-02-27&limit=10
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-02-27T23:59:59.999Z"
    },
    "leaderboard": [
      {
        "rank": 1,
        "householdId": "65f7a8b9c1234567890abcde",
        "householdName": "Silva Family",
        "totalCarbonKg": 35.2,
        "totalLiters": 6500,
        "residents": 4,
        "carbonPerResident": 8.8,
        "badge": "🥇 Top Eco-Warrior"
      },
      {
        "rank": 2,
        "householdId": "65f7a8b9c1234567890abcdf",
        "householdName": "Perera Household",
        "totalCarbonKg": 38.5,
        "totalLiters": 7200,
        "residents": 3,
        "carbonPerResident": 12.8,
        "badge": "🥈 Green Champion"
      },
      {
        "rank": 3,
        "householdId": "65f7a8b9c1234567890abce0",
        "householdName": "Fernando Home",
        "totalCarbonKg": 41.3,
        "totalLiters": 7800,
        "residents": 5,
        "carbonPerResident": 8.3,
        "badge": "🥉 Sustainability Star"
      }
    ]
  }
}
```

---

### 5. Get Carbon Trend
```http
GET /usage/carbon-trend?householdId=<id>&days=30
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2026-01-28T00:00:00.000Z",
      "endDate": "2026-02-27T23:59:59.999Z",
      "days": 30
    },
    "trend": [
      {
        "date": "2026-01-28",
        "totalLiters": 285,
        "totalCarbonKg": 1.52,
        "totalEnergyKwh": 7.89,
        "usageCount": 8
      },
      {
        "date": "2026-01-29",
        "totalLiters": 310,
        "totalCarbonKg": 1.65,
        "totalEnergyKwh": 8.56,
        "usageCount": 9
      }
      // ... more days
    ],
    "averageDailyCarbonKg": 1.508
  }
}
```

---

## 🧪 Testing

### Run the test script:
```bash
cd Backend
node testCarbonAPI.js
```

### Test Output:
```
🌍 Testing Carbon Footprint API Integration
============================================================

📊 Test 1: Cold Water Usage (Toilet Flush)
Water Used: 10 liters
Carbon Emissions: 0.008 kg CO2
Equivalent to: Equal to charging 1 smartphones

📊 Test 2: Hot Water Usage (15-min Shower)
Water Used: 150 liters
Carbon Emissions: 0.72 kg CO2
Equivalent to: Driving 4.2 km in a car

✅ All tests completed successfully!
```

---

## 🔧 Configuration

### Environment Variables (.env):
```env
# Carbon Footprint API
CarbonInterface_API_key=FJOpDhOlmglCbUpRjTNTw
```

### API Key Setup:
1. Sign up at https://www.carboninterface.com/
2. Get your API key from dashboard
3. Add to `.env` file
4. Restart server

**Note**: If API key is invalid or missing, the system automatically falls back to local calculations using standard emission factors.

---

## 📊 How It Works

### Calculation Logic:

#### 1. **Water Treatment & Distribution**
```
Energy = (liters / 1000) × 0.5 kWh/m³
CO2 = liters × 0.0005 kg/L
```

#### 2. **Water Heating** (for showers, dishwashing, etc.)
```
Energy = (liters / 1000) × 42 kWh/m³
CO2 = liters × 0.004 kg/L
```

#### 3. **Wastewater Treatment**
```
CO2 = liters × 0.0003 kg/L
```

### Heated Activities Detection:
- Shower
- Bath
- Dishwashing
- Washing Machine
- Laundry
- Hot Water

---

## 🎯 Use Cases

### 1. **User Education**
"Your 15-min shower emitted 0.72 kg CO2 - equal to driving 4.2 km"

### 2. **Behavioral Change**
Show users their carbon impact to encourage water conservation

### 3. **Household Competition**
Leaderboards motivate households to reduce their footprint

### 4. **Trend Analysis**
Track if conservation efforts are working

### 5. **Reporting**
Generate monthly environmental impact reports

---

## 💡 Best Practices

1. **Always include carbon data** in responses
2. **Use equivalents** for better understanding
3. **Show trends** to demonstrate progress
4. **Gamify** with leaderboards and badges
5. **Educate** users about their impact

---

## 🚀 Next Steps

### Optional Enhancements:
1. Add carbon savings goals
2. Send weekly carbon reports via email
3. Create carbon offset recommendations
4. Add tree planting calculator
5. Integration with carbon offset programs

---

## 📝 Database Schema

### Carbon Footprint Fields (in Usage Model):
```javascript
carbonFootprint: {
  carbonKg: Number,          // Total CO2 in kg
  energyKwh: Number,         // Energy used in kWh
  breakdown: {
    treatment: Number,       // Treatment energy
    heating: Number          // Heating energy
  },
  equivalents: {
    carKm: Number,          // Car kilometers
    trees: Number,          // Trees needed/year
    smartphones: Number,    // Phone charges
    meals: Number,          // Meals cooked
    description: String     // Human-readable
  },
  isHeatedWater: Boolean,   // Was water heated?
  source: String,           // 'api' or 'local'
  calculatedAt: Date        // When calculated
}
```

---

## ❓ Troubleshooting

### API Returns 401 Error:
- Check if API key is correct
- Verify API key is activated
- System will automatically use local calculations

### Carbon not calculating:
- Check if `liters` field exists
- Verify model hooks are running
- Check server logs for errors

### Incorrect activity detection:
- Update activity type names
- Modify `isHeatedActivity()` function in carbonService.js

---

## 📚 References

- CarbonInterface API: https://www.carboninterface.com/docs
- Emission Factors: IPCC Guidelines
- Water Energy Calculator: https://www.energystar.gov/

---

## ✅ Summary

You now have:
- ✅ Automatic carbon calculation for all water usage
- ✅ 4 new analytical endpoints
- ✅ Real-time impact feedback
- ✅ Leaderboards and trends
- ✅ Educational carbon equivalents
- ✅ Robust error handling with fallback

**This significantly enhances your project's value and demonstrates advanced API integration!** 🌍🎉
