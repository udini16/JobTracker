# 15 DEPLOYMENT GUIDE

## Backend Deployment
Can be deployed to standard Node environments like Render, Heroku, or a VPS.
Note: Puppeteer requires additional system dependencies on Linux environments (e.g., `libnss3`, `libatk1.0-0`).

## Frontend Deployment
1. Run `npm run build` in the `client` folder.
2. Host the `dist` folder on Vercel, Netlify, or Firebase Hosting.
3. Ensure `axios` calls point to the production backend URL instead of `localhost:3000`.
