# Integration Testing

This section verifies interactions across routes, controllers, models, and database behavior.

## Module Folders

- `tests/integration/activity`
- `tests/integration/usage`
- `tests/integration/saving-plan`
- `tests/integration/user-management`
- `tests/integration/household-zone`

## Commands

From `Backend` folder:

```bash
npm run test:integration
npm run test:integration:saving-plan
npm run test:integration:usage
npm run test:integration:my-modules
```

## Purpose

Use integration tests to confirm complete request/response flows and cross-module behavior.
