# Water Saving Plan Feature

## Overview

The Water Saving Plan module helps users monitor and reduce their daily water consumption by setting reduction goals. Users can define their current water usage and set a target percentage to reduce their consumption.

This feature encourages sustainable water usage by calculating how much water should be saved per day and providing a clear target for users.

---

## Core Features

### Create Saving Plan
Users can create a water saving plan by specifying:

- Plan name
- Current daily water usage
- Target reduction percentage
- Notes

The system calculates the amount of water that should be saved daily.

Example:

Current usage: 500L  
Target reduction: 20%

Water to save = 100L  
Target daily usage = 400L

---

### View Saving Plans

Users can view all saving plans they have created. This allows them to monitor their water reduction goals and track their progress.

---

### Update Saving Plan

Users can modify existing plans by changing the reduction percentage or notes. When the reduction percentage changes, the system recalculates the target water usage.

---

### Delete Saving Plan

Users can remove a saving plan when it is no longer needed.

---

## API Endpoints

### Create Saving Plan

POST /saving-plan

Example Request:


---

### Get All Saving Plans

GET /saving-plan

Returns all saving plans for the logged-in user.

---

### Get Saving Plan By ID

GET /saving-plan/:id

Returns a single saving plan.

---

### Update Saving Plan

PUT /saving-plan/:id

Allows modification of saving plan details.

---

### Delete Saving Plan

DELETE /saving-plan/:id

Deletes a saving plan.

---

## Calculation Logic

The system automatically calculates the water saving target.

Formula:

Water to Save = (Total Water Usage × Target Reduction Percentage) / 100

Target Daily Usage = Total Usage − Water to Save

Example:

Total Usage = 500L  
Reduction = 20%

Water to Save = 100L  
Target Daily Usage = 400L

---

## Benefits

- Encourages sustainable water usage
- Helps households reduce water waste
- Provides clear reduction goals
- Supports environmental conservation