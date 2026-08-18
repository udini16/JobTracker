# 05 COMPONENTS

## React Components

### `App.jsx`
The root layout component. Manages global state (resume text, job list).

### `JobSearch.jsx`
Form component that accepts a keyword and location, and triggers the scraping API.

### `ProfileManager.jsx`
A section for the user to input their master profile (skills, experience). Auto-saves to `localStorage`.

### `OutreachDashboard.jsx`
The core interface that displays all jobs in the pipeline. It handles triggering the AI email generation, generating tailored Application Documents (Resume & Cover Letter) in a modal, and sending the emails via Resend.
