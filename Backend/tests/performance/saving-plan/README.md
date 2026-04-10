# Saving Plan Performance Testing

These scenarios use Artillery to evaluate the water saving plan API performance.

## Preconditions

- Backend API is running.
- `PERF_BASE_URL` is set (example: `http://localhost:5000`).
- `PERF_JWT_TOKEN` is set for a real user that already has a household with usage data.

## Commands

From Backend folder:

- `npm run test:performance:saving-plan`
- `npm run test:performance:saving-plan:spike`

## Example (PowerShell)

```powershell
$env:PERF_BASE_URL = "http://localhost:5000"
$env:PERF_JWT_TOKEN = "<your-valid-jwt-token>"
npm run test:performance:saving-plan
```

## Interpreting results

Track these metrics from Artillery output:

- p95 and p99 response time
- requests per second
- error rate (`4xx` and `5xx`)

For assignment reporting, include at least one sustained load run and one spike run.