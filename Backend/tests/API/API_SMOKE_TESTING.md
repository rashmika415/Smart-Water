# API Smoke Testing

This folder contains standalone API smoke test scripts.

These files are run directly with Node.js and are useful for quick endpoint checks.

## Files

- `testActivityAPI.js`
- `testUsageAPI.js`
- `testCarbonAPI.js`
- `testNodemailer.js`

## Prerequisites

- Backend server is running.
- `.env` contains API test credentials where needed.

Required by `testActivityAPI.js` and `testUsageAPI.js`:

- `API_BASE_URL` (optional, defaults to `http://localhost:5000`)
- `TEST_EMAIL`
- `TEST_PASSWORD`

## Commands

From `Backend` folder:

```bash
node tests/API/testActivityAPI.js
node tests/API/testUsageAPI.js
node tests/API/testCarbonAPI.js
node tests/API/testNodemailer.js
```

## Notes

- These are script-based smoke checks, not Jest test files.
- They are best for manual validation of running APIs.
