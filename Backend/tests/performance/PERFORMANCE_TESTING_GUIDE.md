# Performance Testing

This section contains Artillery load and spike scenarios.

## Scenario Groups

- Usage: `tests/performance/usage`
- Saving Plan: `tests/performance/saving-plan`
- User / Household / Zone: `tests/performance/user-household-zone`

## Prerequisites

- Backend API is running.
- Environment variables are set:
  - `PERF_BASE_URL` (example: `http://localhost:5000`)
  - `PERF_JWT_TOKEN` (valid user token)

## Commands

From `Backend` folder:

```bash
npm run test:performance:usage
npm run test:performance:usage:spike
npm run test:performance:saving-plan
npm run test:performance:saving-plan:spike
npm run test:performance:my-module
npm run test:performance:my-module:spike
```

## Existing Detailed Docs

- `tests/performance/usage/USAGE_PERFORMANCE_TESTING.md`
- `tests/performance/user-household-zone/USER_HOUSEHOLD_ZONE_PERFORMANCE_TESTING.md`
