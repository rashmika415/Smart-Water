# 💧 Water Usage Management - Complete Feature Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Core Features](#core-features)
3. [API Endpoints](#api-endpoints)
4. [Data Tracking](#data-tracking)
5. [Carbon Footprint Integration](#carbon-footprint-integration)
6. [Analytics & Reporting](#analytics--reporting)
7. [Technical Features](#technical-features)
8. [Usage Examples](#usage-examples)

---

## 🎯 Overview

The **Water Usage Management** system is a comprehensive solution for tracking, monitoring, and analyzing household water consumption with integrated environmental impact assessment. It combines real-time tracking with sustainability metrics to help users understand and reduce their water footprint.

### **Key Highlights:**
- 📊 Real-time water usage tracking
- 🌍 Automatic carbon footprint calculation
- 📈 Advanced analytics and reporting
- 🏆 Household comparison and leaderboards
- 🔒 Secure, authenticated access
- 🌐 Third-party API integrations

---

## ⭐ Core Features

### **1. Multiple Input Methods** 🔢

Users can log water usage in three flexible ways:

#### **A. Duration-Based Input**
Perfect for continuous activities (showers, washing)
```javascript
{
  "activityType": "Shower",
  "durationMinutes": 15,    // How long
  "flowRateLpm": 10,        // Liters per minute
  // System calculates: 15 × 10 = 150 liters
}
```

**Use Cases:**
- Showers (10 min × 8 L/min = 80L)
- Garden watering (30 min × 15 L/min = 450L)
- Washing machine cycles (45 min × 12 L/min = 540L)

#### **B. Count-Based Input**
Perfect for discrete activities (flushes, loads)
```javascript
{
  "activityType": "Toilet Flush",
  "count": 5,               // How many times
  "litersPerUnit": 6,       // Liters per flush
  // System calculates: 5 × 6 = 30 liters
}
```

**Use Cases:**
- Toilet flushes (8 flushes × 6L = 48L)
- Dishwasher loads (2 loads × 15L = 30L)
- Water bottles filled (10 bottles × 0.5L = 5L)

#### **C. Direct Liters Input**
For known quantities
```javascript
{
  "activityType": "Pool Filling",
  "liters": 5000
}
```

**Use Cases:**
- Meter readings
- Pool/tank filling
- Bulk water delivery

---

### **2. Activity Type Tracking** 📝

Track different types of water usage with automatic categorization:

#### **Heated Water Activities** 🔥
*Higher carbon footprint due to energy for heating*
- Showers
- Baths
- Dishwashing (hot water)
- Washing machine (hot cycles)
- Kitchen hot water use

#### **Cold Water Activities** ❄️
*Lower carbon footprint*
- Toilet flushes
- Garden watering
- Car washing
- Drinking water
- Cold water cleaning

**Smart Detection:**
The system automatically detects heated activities and calculates appropriate carbon emissions!

---

### **3. Automatic Carbon Footprint Calculation** 🌍

Every water usage automatically calculates environmental impact:

#### **What Gets Calculated:**
```javascript
{
  "carbonFootprint": {
    "carbonKg": 0.72,           // Total CO2 emissions
    "energyKwh": 6.375,         // Energy used
    "breakdown": {
      "treatment": 0.075,       // Water treatment energy
      "heating": 6.3            // Water heating energy
    },
    "equivalents": {
      "carKm": 4.2,            // Equivalent car km driven
      "trees": 0.033,          // Trees needed/year
      "smartphones": 90,        // Phone charges
      "meals": 0.3,            // Meals cooked
      "description": "Equal to driving 4.2 km in a car"
    },
    "isHeatedWater": true,
    "source": "local",          // "api" or "local"
    "calculatedAt": "2026-03-04T10:30:00Z"
  }
}
```

#### **Real-Time Feedback:**
When users log usage, they immediately see:
> "🌍 This shower emitted 0.72 kg CO2 - equal to driving 4.2 km in a car"

**Educational Impact:**
- Users understand environmental consequences
- Motivates water conservation
- Makes sustainability tangible

---

### **4. Data Persistence & History** 📚

#### **Comprehensive Data Storage:**
- ✅ Every usage record saved to MongoDB
- ✅ Automatic timestamps (createdAt, updatedAt)
- ✅ Soft delete (data never lost)
- ✅ User/household association
- ✅ Activity categorization

#### **Queryable History:**
```javascript
// Filter by date range
GET /usage?startDate=2026-01-01&endDate=2026-03-04

// Filter by activity type
GET /usage?activityType=Shower

// Filter by household
GET /usage?householdId=65f7a8b9c1234567890abcde

// Combine filters
GET /usage?householdId=xxx&activityType=Shower&startDate=2026-03-01
```

---

## 🔌 API Endpoints

### **Standard CRUD Operations**

#### **1. Create Usage Record** ✨
```http
POST /usage
Authorization: Bearer {token}
Content-Type: application/json

{
  "householdId": "65f7a8b9c1234567890abcde",
  "activityType": "Shower",
  "durationMinutes": 15,
  "flowRateLpm": 10,
  "notes": "Morning shower"
}

Response: 201 Created
{
  "success": true,
  "message": "Usage created successfully",
  "data": {
    "_id": "...",
    "liters": 150,
    "carbonFootprint": { ... }
  },
  "carbonImpact": {
    "carbonKg": 0.72,
    "message": "🌍 Equal to driving 4.2 km in a car"
  }
}
```

#### **2. Get All Usage Records** 📋
```http
GET /usage
Authorization: Bearer {token}

Optional Query Parameters:
- userId: Filter by user
- activityType: Filter by activity
- householdId: Filter by household
- startDate: Date range start
- endDate: Date range end

Response: 200 OK
{
  "success": true,
  "count": 45,
  "data": [
    {
      "_id": "...",
      "activityType": "Shower",
      "liters": 150,
      "carbonFootprint": { ... },
      "occurredAt": "2026-03-04T08:30:00Z"
    },
    // ... more records
  ]
}
```

#### **3. Get Single Usage** 🔍
```http
GET /usage/:id
Authorization: Bearer {token}

Response: 200 OK / 404 Not Found
{
  "success": true,
  "data": {
    "_id": "65f7a8b9c1234567890abcde",
    "activityType": "Shower",
    "liters": 150,
    "carbonFootprint": { ... },
    "householdId": "...",
    "occurredAt": "2026-03-04T08:30:00Z",
    "createdAt": "2026-03-04T08:30:00Z",
    "updatedAt": "2026-03-04T08:30:00Z"
  }
}
```

#### **4. Update Usage Record** ✏️
```http
PUT /usage/:id
Authorization: Bearer {token}

{
  "activityType": "Long Shower",
  "notes": "Updated description"
}

Response: 200 OK
{
  "success": true,
  "message": "Usage updated successfully",
  "data": { ... }
}
```

**Note:** Updating liters triggers automatic carbon recalculation!

#### **5. Delete Usage Record** 🗑️
```http
DELETE /usage/:id
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "message": "Usage deleted successfully"
}
```

**Note:** Soft delete - data preserved but marked as deleted!

---

### **Carbon Footprint Analytics**

#### **6. Carbon Statistics** 📊
Get comprehensive carbon footprint analysis for a household

```http
GET /usage/carbon-stats?householdId={id}&startDate=2026-01-01&endDate=2026-03-04
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2026-01-01",
      "endDate": "2026-03-04",
      "days": 63
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
        "meals": 18.1
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

**Features:**
- ✅ Period comparison (current vs previous)
- ✅ Trend analysis (increasing/decreasing/stable)
- ✅ Total liters and carbon
- ✅ Heated water percentage
- ✅ Relatable equivalents

#### **7. Carbon by Activity** 📈
Breakdown of which activities emit the most CO2

```http
GET /usage/carbon-by-activity?householdId={id}&startDate=2026-01-01
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
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
        "percentageOfTotal": 25.5
      },
      // ... more activities
    ],
    "topEmitter": {
      "activityType": "Shower",
      "totalCarbonKg": 15.36,
      "percentageOfTotal": 34.0
    }
  }
}
```

**Use Cases:**
- Identify highest carbon activities
- Target reduction efforts
- Track activity-specific improvements

#### **8. Carbon Leaderboard** 🏆
Compare households - eco-competition!

```http
GET /usage/carbon-leaderboard?startDate=2026-01-01&limit=10
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "period": { "startDate": "2026-01-01", "endDate": "2026-03-04" },
    "leaderboard": [
      {
        "rank": 1,
        "householdName": "Silva Family",
        "totalCarbonKg": 35.2,
        "totalLiters": 6500,
        "residents": 4,
        "carbonPerResident": 8.8,
        "badge": "🥇 Top Eco-Warrior"
      },
      {
        "rank": 2,
        "householdName": "Perera Household",
        "totalCarbonKg": 38.5,
        "residents": 3,
        "carbonPerResident": 12.8,
        "badge": "🥈 Green Champion"
      },
      {
        "rank": 3,
        "householdName": "Fernando Home",
        "totalCarbonKg": 41.3,
        "badge": "🥉 Sustainability Star"
      }
    ]
  }
}
```

**Features:**
- ✅ Fair comparison (per resident)
- ✅ Achievement badges
- ✅ Motivational rankings
- ✅ Social competition element

#### **9. Carbon Trend** 📉
Daily carbon emissions over time

```http
GET /usage/carbon-trend?householdId={id}&days=30
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "period": { "days": 30 },
    "trend": [
      {
        "date": "2026-02-03",
        "totalLiters": 285,
        "totalCarbonKg": 1.52,
        "totalEnergyKwh": 7.89,
        "usageCount": 8
      },
      {
        "date": "2026-02-04",
        "totalLiters": 310,
        "totalCarbonKg": 1.65,
        "usageCount": 9
      }
      // ... 30 days
    ],
    "averageDailyCarbonKg": 1.508
  }
}
```

**Use Cases:**
- Visualize trends over time
- Identify high-usage days
- Track conservation progress
- Spot anomalies/leaks

---

## 📊 Data Tracking Features

### **1. Flexible Calculation System**

The system supports multiple calculation methods:

#### **Auto-Calculation from Duration:**
```javascript
Input: 15 minutes × 10 L/min
Output: 150 liters (automatic)
```

#### **Auto-Calculation from Count:**
```javascript
Input: 5 flushes × 6 L/flush
Output: 30 liters (automatic)
```

#### **Direct Input:**
```javascript
Input: 500 liters
Output: 500 liters (as provided)
```

**Validation:**
- System validates at least one method is provided
- Prevents negative values
- Ensures data integrity

---

### **2. Time Tracking**

Every record includes:

```javascript
{
  "occurredAt": "2026-03-04T08:30:00Z",  // When water was used
  "createdAt": "2026-03-04T08:35:00Z",   // When record was created
  "updatedAt": "2026-03-04T09:00:00Z"    // Last modification
}
```

**Features:**
- ✅ Historical tracking
- ✅ Backdating support (occurredAt)
- ✅ Audit trail (updatedAt)
- ✅ Time-based filtering

---

### **3. Source Tracking**

Track where data came from:

```javascript
{
  "source": "manual"      // User entered manually
  "source": "preset"      // From template/preset
  "source": "imported"    // Bulk import/API
}
```

**Benefits:**
- Data quality assessment
- Import validation
- User behavior analysis

---

### **4. Soft Delete Protection**

Records are never truly deleted:

```javascript
{
  "deletedAt": null              // Active record
  "deletedAt": "2026-03-04..."   // Deleted (hidden from queries)
}
```

**Advantages:**
- ✅ Data recovery possible
- ✅ Audit trail maintained
- ✅ Accidental deletion protection
- ✅ Historical analysis intact

---

## 🌍 Carbon Footprint Integration

### **How It Works**

#### **1. Automatic Detection**
```javascript
Activity: "Shower" → Detected as HEATED water
Activity: "Toilet Flush" → Detected as COLD water
```

#### **2. Energy Calculation**
```javascript
Treatment Energy = (liters / 1000) × 0.5 kWh/m³
Heating Energy   = (liters / 1000) × 42 kWh/m³  (if heated)
Total Energy     = Treatment + Heating
```

#### **3. CO2 Calculation**
```javascript
Option A: CarbonInterface API (primary)
  → POST energy data to API
  → Get accurate CO2 for Sri Lanka

Option B: Local Calculation (fallback)
  → Use emission factors
  → Calculate locally
```

#### **4. Equivalents Conversion**
```javascript
Car km      = carbonKg / 0.17
Trees       = carbonKg / 21.77
Smartphones = carbonKg / 0.008
Meals       = carbonKg / 2.5
```

---

### **Carbon Data Structure**

Every usage includes comprehensive carbon data:

```javascript
{
  "carbonFootprint": {
    // Core metrics
    "carbonKg": 0.72,               // Total CO2 emissions
    "energyKwh": 6.375,             // Total energy used
    
    // Energy breakdown
    "breakdown": {
      "treatment": 0.075,           // Water treatment
      "heating": 6.3                // Water heating
    },
    
    // Relatable equivalents
    "equivalents": {
      "carKm": 4.2,                 // Driving distance
      "trees": 0.033,               // Trees to absorb
      "smartphones": 90,             // Phone charges
      "meals": 0.3,                 // Meals cooked
      "description": "Equal to driving 4.2 km in a car"
    },
    
    // Metadata
    "isHeatedWater": true,          // Was water heated?
    "source": "local",              // "api" or "local"
    "calculatedAt": "2026-03-04..." // When calculated
  }
}
```

---

## 📈 Analytics & Reporting

### **1. Time-Series Analysis**

Track usage over time:
- Daily trends
- Weekly patterns
- Monthly comparisons
- Seasonal variations

### **2. Activity Breakdown**

Understand water usage by type:
- Which activities use most water
- Which emit most carbon
- Usage frequency
- Average per use

### **3. Comparative Analytics**

Compare performance:
- Current vs previous period
- Household vs household
- Per resident calculations
- Trend analysis (improving/worsening)

### **4. Aggregated Statistics**

System provides:
- Total liters consumed
- Total carbon emitted
- Average daily usage
- Peak usage days
- Heated vs cold water ratio

---

## 🔧 Technical Features

### **1. Database Optimization**

#### **Indexes for Performance:**
```javascript
// Single field indexes
householdId (index)
activityType (index)
occurredAt (index)
deletedAt (index)

// Compound indexes
{ householdId: 1, occurredAt: -1 }
{ householdId: 1, activityType: 1, occurredAt: -1 }
{ householdId: 1, "carbonFootprint.carbonKg": -1 }
```

**Benefits:**
- Fast household queries
- Quick date range filtering
- Efficient activity filtering
- Optimized carbon analytics

---

### **2. Data Validation**

#### **Schema-Level:**
```javascript
✅ Required fields
✅ Type validation
✅ Min/max constraints
✅ Enum validation
✅ Custom business logic
```

#### **Middleware-Level:**
```javascript
✅ Input sanitization
✅ Format validation
✅ Date validation (no future dates)
✅ Enum validation
```

#### **Controller-Level:**
```javascript
✅ Business logic validation
✅ Existence checks
✅ Permission validation
✅ Error handling
```

---

### **3. Security Features**

```javascript
✅ JWT Authentication (all routes)
✅ Token validation
✅ User-specific data access
✅ Household isolation
✅ Input sanitization
✅ SQL injection prevention (MongoDB)
✅ Error message sanitization
```

---

### **4. Error Handling**

Comprehensive error handling:

```javascript
✅ Try-catch blocks in all controllers
✅ Mongoose validation errors
✅ API fallback mechanism
✅ Graceful degradation
✅ User-friendly error messages
✅ Server error logging
✅ Proper HTTP status codes
```

---

### **5. API Integration**

#### **CarbonInterface API:**
```javascript
✅ Async/await implementation
✅ Bearer token authentication
✅ Timeout handling (5 seconds)
✅ Error handling
✅ Local fallback
✅ Never fails (always returns data)
```

---

### **6. Mongoose Features**

```javascript
✅ Pre-validate hooks (calculate liters)
✅ Pre-save hooks (calculate carbon)
✅ Population (join with users/households)
✅ Aggregation pipelines
✅ Query builders
✅ Indexes
✅ Timestamps
✅ Soft delete
```

---

## 💡 Usage Examples

### **Example 1: Morning Shower**

```javascript
POST /usage
{
  "householdId": "65f7a8b9c1234567890abcde",
  "activityType": "Morning Shower",
  "durationMinutes": 10,
  "flowRateLpm": 8
}

System calculates:
→ Liters: 10 × 8 = 80L
→ Detects: "Shower" = heated water
→ Calculates: 0.384 kg CO2
→ Equivalent: "Driving 2.3 km"

Response:
"🌍 This shower emitted 0.384 kg CO2 - equal to driving 2.3 km in a car"
```

---

### **Example 2: Toilet Flushes**

```javascript
POST /usage
{
  "householdId": "65f7a8b9c1234567890abcde",
  "activityType": "Toilet Flush",
  "count": 8,
  "litersPerUnit": 6
}

System calculates:
→ Liters: 8 × 6 = 48L
→ Detects: "Toilet" = cold water
→ Calculates: 0.038 kg CO2
→ Equivalent: "Charging 5 smartphones"

Response:
"🌍 This usage emitted 0.038 kg CO2 - equal to charging 5 smartphones"
```

---

### **Example 3: Weekly Report**

```javascript
GET /usage/carbon-stats?householdId=xxx&startDate=2026-02-25&endDate=2026-03-04

Response shows:
→ Total water: 1,250 liters
→ Total carbon: 8.5 kg CO2
→ Heated water: 35% (438L)
→ Top activity: Showers (40%)
→ Trend: Decreased 12% vs last week
→ Equivalent: "Driving 50 km" or "Planting 0.39 trees"

Message: "🎉 Great! Your carbon emissions decreased by 12%"
```

---

### **Example 4: Household Competition**

```javascript
GET /usage/carbon-leaderboard?startDate=2026-02-01&endDate=2026-03-04

Shows top 10 eco-friendly households:

1. 🥇 Silva Family    - 35.2 kg CO2 (8.8 kg/person)
2. 🥈 Perera House    - 38.5 kg CO2 (12.8 kg/person)
3. 🥉 Fernando Home   - 41.3 kg CO2 (8.3 kg/person)
4. 🌱 Your Household  - 45.2 kg CO2 (11.3 kg/person) [Rank #4]

Motivates conservation through social comparison!
```

---

## 🎯 Key Benefits

### **For Users:**
1. ✅ Easy tracking of water usage
2. ✅ Understand environmental impact
3. ✅ Set and achieve conservation goals
4. ✅ Compare with other households
5. ✅ Save money on bills
6. ✅ Educational insights

### **For Environment:**
1. ✅ Promotes water conservation
2. ✅ Reduces carbon emissions
3. ✅ Behavioral change through awareness
4. ✅ Measurable impact
5. ✅ Sustainability education

### **Technical Excellence:**
1. ✅ RESTful API design
2. ✅ Scalable architecture
3. ✅ Production-ready code
4. ✅ Comprehensive error handling
5. ✅ Third-party API integration
6. ✅ Advanced analytics

---

## 📚 Summary

Your **Water Usage Management** system provides:

### **Core Functionality:**
- ✅ 9 API endpoints (5 CRUD + 4 Analytics)
- ✅ 3 input methods (duration, count, direct)
- ✅ Automatic calculations (liters + carbon)
- ✅ Real-time feedback
- ✅ Historical tracking

### **Carbon Features:**
- ✅ Automatic CO2 calculation
- ✅ CarbonInterface API integration
- ✅ Energy breakdown
- ✅ Relatable equivalents
- ✅ Comparative analytics

### **Analytics:**
- ✅ Time-series trends
- ✅ Activity breakdowns
- ✅ Household leaderboards
- ✅ Comparative stats
- ✅ Period comparisons

### **Security:**
- ✅ JWT authentication
- ✅ Input validation
- ✅ Error handling
- ✅ Data protection

### **Database:**
- ✅ Optimized indexes
- ✅ Soft delete
- ✅ Audit trails
- ✅ Aggregation pipelines

---

**This is a production-ready, comprehensive water management solution with unique environmental sustainability features!** 🌍💧✨
