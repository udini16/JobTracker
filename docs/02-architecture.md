# 02 ARCHITECTURE

## System Overview
The system uses a client-server architecture.

### Frontend (Client)
- **Framework**: React (built with Vite)
- **Styling**: TailwindCSS
- **Role**: Provides a dashboard to upload resumes, trigger searches, and monitor outreach progress.

### Backend (Server)
- **Framework**: Express.js (Node.js)
- **Role**: Exposes REST API endpoints, orchestrates web scraping via Puppeteer, interacts with the LLM API, sends emails via Resend, and pushes notifications via Telegram.

## Data Flow
1. User requests job scrape -> Backend scrapes -> Returns jobs to UI.
2. User requests email generation -> Backend sends resume + job description to LLM -> Returns drafted email.
3. User sends email -> Backend sends via Resend with tracking pixel -> Returns success.
4. Recruiter opens email -> Tracking pixel hits Backend -> Backend notifies Telegram Bot.
