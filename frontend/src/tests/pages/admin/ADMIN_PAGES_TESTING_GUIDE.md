# Admin Pages Testing Guide

This section contains admin page test suites.

## Test Files

- `src/tests/pages/admin/AdminDashboard.test.jsx`
- `src/tests/pages/admin/AllHouseholdsWithZones.test.jsx`
- `src/tests/pages/admin/ManageActivities.test.jsx`
- `src/tests/pages/admin/ManageHouseholds.test.jsx`
- `src/tests/pages/admin/ManageUsage.test.jsx`
- `src/tests/pages/admin/ManageUsers.test.jsx`
- `src/tests/pages/admin/SavingPlaneA.test.jsx`

## Run Commands

From `frontend` folder:

```bash
npm test -- src/tests/pages/admin --watchAll=false
npm test -- src/tests/pages/admin/AdminDashboard.test.jsx --watchAll=false
```

## Purpose

Use these tests to validate admin dashboard flows, management pages, and role-specific UI behavior.
