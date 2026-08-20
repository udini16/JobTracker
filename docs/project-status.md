# Hermes JobPortal - Project Status & Roadmap

This document outlines all the features and tasks that have been successfully implemented in the **Hermes JobPortal** project, as well as a list of strategic recommendations for future development.

## ✅ Completed Tasks

### Core Architecture & Branding
- **Full-Stack Setup:** Established a React (Vite) frontend with Tailwind CSS and an Express/Node.js backend.
- **Rebranding:** Successfully transitioned the project name from "JobTracker" to "JobPortal".
- **Visual Identity:** Added the custom Hermes logo and updated the application's favicon and title.
- **Version Control:** Enforced Conventional Commits methodology (`feat:`, `fix:`, etc.) for clean GitHub history.

### Job Pipeline & Scraping
- **Job Aggregation:** Built API endpoints to scrape jobs from various platforms (LinkedIn, Indeed, ZipRecruiter, Google, etc.).
- **Fallback Mechanisms:** Implemented custom HTML/Cheerio scrapers for platforms that block standard requests (Google, MauKerja).
- **In-Memory Store:** Temporarily managing active pipeline jobs using a fast in-memory array on the backend.

### Profile Management System
- **Tabbed Interface:** Separated the application into "Outreach Pipeline" and "My Base Profile" views.
- **Complex Profile Data Structure:** Upgraded the profile manager from a single text block to a structured JSON format containing:
  - **Core Details:** General summary, work history, and education.
  - **Master Skills:** A comprehensive list of technical tools and languages.
  - **Project Portfolio:** A list of past projects, including their specific tech stacks.
- **Local Persistence:** Data is reliably saved across sessions using browser `localStorage`.

### AI Generation & Outreach
- **Automated Cold Emails:** Integrated OpenAI LLM to draft highly persuasive, customized outreach emails comparing the user's resume to the job description.
- **Tailored Resume & CV Generator:** 
  - **Pre-Generation Modal:** Users can select exactly which past projects to include for a specific job application.
  - **Dynamic Skills Engine:** The system automatically extracts the relevant tech stack from the selected projects and populates them into the prompt.
  - **Strict Formatting:** Enforced a traditional, highly professional Resume Markdown format with specific ATS-friendly headers (and zero emojis).
- **Document Export:** Added the ability to download the generated Resume and Cover Letter directly as `.md` files.

### Email Delivery & Tracking
- **Email Delivery:** Integrated Resend API for sending actual emails directly to hiring managers.
- **Open Tracking:** Implemented a transparent 1x1 tracking pixel to detect when a hiring manager opens the email.
- **Telegram Notifications:** Set up instant push notifications to your phone when an email is sent or opened.

---

## 🚀 Future Task Recommendations

While the core MVP is fully functional and highly capable, here are the recommended next steps to scale the application into a production-grade SaaS or a more robust personal tool:

### 1. Database & Persistence (High Priority)
- **Migrate to PostgreSQL/MongoDB/Firebase:** Replace the `localStorage` and backend in-memory arrays with a real database. This will allow you to track hundreds of jobs over months without losing data when you clear your browser cache.
- **User Authentication:** Add login functionality (e.g., Firebase Auth) so you can access your profile and pipeline from any device, or allow other people to use the platform.

### 2. Scraping Improvements (Medium Priority)
- **Headless Browser Scraping:** Many job boards (Glassdoor, Indeed) aggressively block standard HTTP requests. Integrate **Puppeteer** or **Playwright** on the backend to simulate a real browser, drastically improving scraper success rates.
- **Daily Automated Scrapes:** Set up a cron job to automatically scrape new jobs at 8:00 AM every day and send a summary to your Telegram.

### 3. Application Pipeline Enhancements (Medium Priority)
- **PDF Export Generation:** Convert the generated Markdown Resume directly into a beautifully formatted, ATS-friendly PDF using a library like `puppeteer` or `react-pdf`.
- **Kanban Board UI:** Upgrade the Pipeline view from a vertical list to a Trello-style Kanban board (Discovered → Applied → Interviewing → Offered/Rejected).
- **Automated Follow-ups:** Add logic to automatically send a polite follow-up email if a hiring manager hasn't opened your initial email after 7 days.

### 4. Advanced AI Features (Low Priority)
- **Interview Prep Agent:** Add a feature that takes the tailored resume and the job description, and uses an LLM to generate 10 highly probable interview questions and suggested answers.
- **Company Research Summary:** Before you email the hiring manager, the app could summarize recent news or blog posts from the company to include a highly personalized hook in the email.
