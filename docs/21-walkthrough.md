# Hermes JobTracker Walkthrough

I have successfully built the "guna hermes & jobs scrapper skill" system! Here's a walkthrough of what was accomplished and how it works.

## 🚀 Architecture Overview

We built a full-stack application consisting of:
1. **React Frontend (Vite + TailwindCSS):** A sleek, modern dashboard for uploading your resume, searching jobs, and managing outreach.
2. **Node.js/Express Backend:** An API server handling the complex logic (web scraping, AI generation, email sending, Telegram integration).

---

## 🔍 Features Implemented

### 1. Multi-Platform Jobs Scraper Skill
The backend now supports a massive **8-platform scraping engine**:
- **Core Platforms**: LinkedIn, Indeed, ZipRecruiter, and Glassdoor are supported via the robust `jobspy` port.
- **Regional/Specialty**: Google Jobs, Bayt, Naukri, and MauKerja are supported via custom Puppeteer fallback scrapers.
- **Frontend Integration**: You can multi-select any combination of these 8 platforms directly from the React UI before searching!

### 2. Hermes Custom Reachout Email & Document Generator
When you paste your resume and click "Generate Email" or "Tailor Resume & CV" on a job:
- The backend sends the job description and your profile data to the **LLM API**.
- It acts as "Hermes", analyzing the context and writing a highly customized, professional outreach email, CV, and cover letter tailored perfectly to the specific job.
- **Editable Documents**: The generated CV and Cover Letter are fully editable right inside the browser modal. You can tweak the generated text before downloading, and your edits will be permanently saved.
- **PDF Generation**: You can instantly download your beautifully formatted CV and Cover Letter as ATS-friendly PDFs, generated flawlessly on the backend using Puppeteer.

### 3. Custom Jobs & Saved Jobs Vault
- **Parse from Links:** Found a job on a random site like Threads or Twitter? Just paste the URL into the "Add Custom Job" tool. The backend visits the link, extracts the text, and intelligently parses the job details right into your pipeline.
- **Permanent Storage:** We added a persistent **Saved Jobs** tab. Whenever you parse a custom link or generate documents for *any* job, it is automatically backed up. Even if you restart the server, you won't lose your generated emails and PDFs!

### 4. Email Tracking & Telegram Integration
- **Resend API** is integrated to send the emails securely to HR or recruiters.
- **Pixel Tracking:** An invisible 1x1 pixel is injected into the HTML of every email sent.
- **Telegram Bot:** When the recruiter opens the email, the tracking pixel triggers an endpoint on your Node server, which immediately fires off a message to your **Telegram Bot** alerting you that the email was opened!

---

## 🛠️ How to run the application

Before starting, you need to set up your environment variables. 
Create a `.env` file in the `server` folder with the following:

```env
# Server
PORT=3000
BACKEND_URL=http://localhost:3000

# LLM (Hermes / OpenAI / OpenRouter)
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1 # Change to OpenRouter/TogetherAI if using open-source Hermes
LLM_MODEL=gpt-4o-mini # Change to hermes model string if using OpenRouter

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=your_verified_email@domain.com

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_CHAT_ID=your_chat_id
```

### Starting the Backend
```bash
cd server
npm start # (or run `node src/index.js`)
```

### Starting the Frontend
```bash
cd client
npm run dev
```

Enjoy your automated job application tracker! Let me know if you need any adjustments to the scraper logic or AI prompts.
