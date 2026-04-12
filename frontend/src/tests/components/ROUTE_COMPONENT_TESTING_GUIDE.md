# Route Component Testing Guide

This section tests route-protection components for role-based access.

## Test Files

- `src/tests/components/admin/AdminRoute.test.jsx`
- `src/tests/components/user/UserRoute.test.jsx`

## Run Commands

From `frontend` folder:

```bash
npm test -- src/tests/components --watchAll=false
npm test -- src/tests/components/admin/AdminRoute.test.jsx --watchAll=false
npm test -- src/tests/components/user/UserRoute.test.jsx --watchAll=false
```

## Purpose

These tests verify navigation and access control behavior for admin and user protected routes.
