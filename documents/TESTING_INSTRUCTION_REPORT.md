# Smart-Water Testing Instruction Report

## 1. How to Run Unit Tests
Run from the Backend folder:

```bash
cd Backend
npm install
npm run test:unit
```

Optional targeted unit runs:

```bash
npm run test:unit:saving-plan
npm run test:unit:usage
npm run test:unit:my-utils
npm run test:unit:my-controllers
```

What is covered:
- Controllers: tests/unit/controllers
- Services: tests/unit/services
- Utilities: tests/unit/utils

## 2. Integration Testing Setup and Execution
Run from the Backend folder:

```bash
cd Backend
npm install
npm run test:integration
```

Optional targeted integration runs:

```bash
npm run test:integration:saving-plan
npm run test:integration:usage
npm run test:integration:my-modules
```

Integration scope:
- Route, controller, model, and DB interaction verification
- Main folders: tests/integration/activity, tests/integration/usage, tests/integration/saving-plan, tests/integration/user-management, tests/integration/household-zone

## 3. Performance Testing Setup and Execution
Performance tests use Artillery.

Required environment variables:
- PERF_BASE_URL (example: http://localhost:5000)
- PERF_JWT_TOKEN (valid JWT for a real user with a household)

PowerShell setup example:

```powershell
$env:PERF_BASE_URL = "http://localhost:5000"
$env:PERF_JWT_TOKEN = "<your-valid-jwt-token>"
```

Run from the Backend folder:

```bash
npm run test:performance:usage
npm run test:performance:usage:spike
npm run test:performance:saving-plan
npm run test:performance:saving-plan:spike
npm run test:performance:my-module
npm run test:performance:my-module:spike
```

Report metrics to include:
- p95 and p99 response time
- requests per second
- error rate (4xx and 5xx)
- at least one sustained load run and one spike run

## 4. Testing Environment Configuration Details
Backend runtime and tools:
- Node.js + npm
- Jest for unit/integration tests
- Supertest for API-level integration assertions
- mongodb-memory-server available for isolated DB testing
- Artillery for load and spike testing

Backend test scripts are defined in Backend/package.json under:
- test, test:unit, test:integration, test:performance:* 

General setup before running tests:

```bash
cd Backend
npm install
```

Optional smoke test environment variables (script-based API checks):
- API_BASE_URL (optional, default http://localhost:5000)
- TEST_EMAIL
- TEST_PASSWORD

Run smoke scripts if needed:

```bash
node tests/API/testActivityAPI.js
node tests/API/testUsageAPI.js
node tests/API/testCarbonAPI.js
node tests/API/testNodemailer.js
```

Notes:
- Unit and integration tests are run with Jest.
- Performance tests require a running backend instance and valid token.
- Keep test credentials and tokens outside source control (.env or secure CI secrets).
