# User Pages Testing Guide

This section contains user page test suites.

## Test Files

- `src/tests/pages/user/UserDashboard.test.jsx`
- `src/tests/pages/user/UserActivities.test.jsx`
- `src/tests/pages/user/WaterActivities.test.jsx`
- `src/tests/pages/user/UsageHistory.test.jsx`
- `src/tests/pages/user/CarbonAnalytics.test.jsx`
- `src/tests/pages/user/EstimatedBill.test.jsx`
- `src/tests/pages/user/MyProfile.test.jsx`
- `src/tests/pages/user/MyHouseholds.test.jsx`
- `src/tests/pages/user/HouseholdDetails.test.jsx`
- `src/tests/pages/user/SavingPlane.test.jsx`
- `src/tests/pages/user/ViewSavingPlane.test.jsx`
- `src/tests/pages/user/WeatherInsights.test.jsx`

## Run Commands

From `frontend` folder:

```bash
npm test -- src/tests/pages/user --watchAll=false
npm test -- src/tests/pages/user/UserDashboard.test.jsx --watchAll=false
```

## Purpose

Use these tests to validate user dashboard features, household management pages, activity tracking, and analytics views.
