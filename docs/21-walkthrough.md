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

## Features Overview

### 1. Profile Manager
- **Centralized Data Hub:** This is where you configure your core professional identity—Biodata, Education, Experience, Projects, Skills, and Certifications.
- **Editable Entries:** You can edit existing Education, Experience, and Project entries by clicking the pencil icon, loading the data back into the form for quick updates.
- **Auto-Parse Tool:** If you have an unstructured text resume, simply paste it in the "Auto-Parse Resume" modal. The backend uses the LLM to intelligently extract and populate all your structured profile sections instantly.

### 2. Hermes Custom Reachout Email & Document Generator
When you paste your resume and click "Generate Email" or "Tailor Resume & CV" on a job:
- The backend sends the job description and your profile data to the **LLM API**.
- It acts as "Hermes", analyzing the context and writing a highly customized, professional outreach email, CV, and cover letter tailored perfectly to the specific job.
- **Editable Documents**: The generated CV and Cover Letter are fully editable right inside the browser modal. You can tweak the generated text before downloading, and your edits will be permanently saved.
- **PDF Generation**: You can instantly download your beautifully formatted CV and Cover Letter as ATS-friendly PDFs, generated flawlessly on the backend using Puppeteer.

### 3. Custom Jobs & Saved Jobs Vault
- **Parse from Links:** Found a job on a random site like Threads or Twitter? Just paste the URL into the "Add Custom Job" tool. The backend visits the link, extracts the text, and intelligently parses the job details right into your pipeline.
- **Job Pipeline:** Shows the list of scraped jobs (from JobSpy) or allows you to paste a custom URL/text snippet to parse a custom job using the LLM.
- **Outreach Dashboard (within Pipeline):** For any job found, clicking "Craft Approach" will generate the custom Resume and Cover letter dynamically using the LLM. 
- **Saved Jobs Management:** You can manually add new jobs or edit the details of your saved jobs using the edit pencil icon in the Saved Jobs tab. You can also generate your Hermes Email and Tailored CV directly from here without going through the main pipeline.
- **Applied Jobs Tab:** Once an email has been sent for a saved job, it automatically moves out of Saved Jobs and into the dedicated Applied Jobs tab for easy pipeline management.

### 4. Email Tracking & Telegram Integration
- **Nodemailer (Gmail):** Integrated Nodemailer to send emails securely directly from your personal Gmail account via an App Password.
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

# Email Delivery (Nodemailer via Gmail)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password

# Telegram Bot Config
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_CHAT_ID=your_chat_id
```

### Running the App (Unified Start)

Thanks to `concurrently` set up in the root directory, you no longer need multiple terminals! From the **root** of the project, simply run:

```bash
npm install
npm run install:all # Installs dependencies for root, server, and client
npm run dev
```

This will automatically boot up both the Express backend on port 3000 and the Vite React frontend on port 5173.

Happy hunting! 🏹
