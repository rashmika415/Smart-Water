# Smart-Water Deploy Report (One Page)

## Deployment Summary
- Frontend: Vercel
- Backend: Render service `smart-water-backend`
- Backend runtime: Node.js
- Backend start command: `npm start` (runs `node app.js`)
- Health endpoint: `/`

## Live Endpoints
- Frontend: https://smart-water-ilpgrmvug-rashmikas-projects-1cab4a5f.vercel.app
- Backend:https://smart-water-uycy.onrender.com


## Required Environment Variables
Backend:
- `MONGO_URI`, `PORT`, `NODE_ENV`, `FRONTEND_URL`, `JWT_SECRET`
- `WEATHER_API_KEY`, `WEATHER_API_KEY_WaterSavingPlan`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`, `FROM_NAME`
- `CarbonInterface_API_key`

Frontend:
- `REACT_APP_API_BASE_URL` 

## Render Configuration
From `render.yaml`:
- `type: web`
- `name: smart-water-backend`
- `runtime: node`
- `rootDir: Backend`
- `buildCommand: npm install`
- `startCommand: npm start`
- `healthCheckPath: /`
- `autoDeploy: true`

## Deployment Checks
- Backend root returns: `Smart Water Backend API is running!`
- Frontend opens without API connection error
- Auth flow works (register and login)
- Core APIs respond: `/api/auth`, `/api/users`, `/api/households`, `/api/zones`, `/SavingPlan`, `/usage`
