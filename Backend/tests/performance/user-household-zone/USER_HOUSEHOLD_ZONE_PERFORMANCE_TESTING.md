# User / Household / Zone Performance Testing

These Artillery scenarios measure performance of your module endpoints:
- user profile
- household read flows
- household create flow

## Preconditions

- Backend API is running
- `PERF_BASE_URL` is set (example: `http://localhost:5000`)
- `PERF_JWT_TOKEN` is set for a valid user token

## Commands

From `Backend` folder:

- `npm run test:performance:my-module`
- `npm run test:performance:my-module:spike`

## Example (PowerShell)

```powershell
$env:PERF_BASE_URL = "http://localhost:5000"
$env:PERF_JWT_TOKEN = "<your-valid-jwt-token>"
npm run test:performance:my-module
```

## Key metrics

- p95 / p99 latency
- requests per second
- 4xx / 5xx error rate

