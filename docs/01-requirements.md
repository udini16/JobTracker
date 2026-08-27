# 01 REQUIREMENTS

## Core Objectives
1. **Job Scraping**: Automatically scrape job listings based on keywords and location.
2. **AI Email Generation**: Use the Hermes (or equivalent) LLM to write highly personalized reach-out emails by analyzing the user's resume against the job description.
3. **AI Resume & Cover Letter Generation**: Generate highly-targeted Markdown resumes and professional cover letters based on the user's base profile and specific job descriptions.
4. **Email Sending & Tracking**: Send emails securely to HR/Recruiters and track when they are opened using an invisible pixel.
4. **Real-time Notifications**: Alert the user via a Telegram Bot as soon as an email is opened.

## Technical Requirements
- Node.js environment
- React + Vite for the frontend UI
- Puppeteer for scraping
- Third-party APIs: OpenAI (for LLM), Nodemailer (for emails), Telegram Bot API.
