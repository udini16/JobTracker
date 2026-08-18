# 05 COMPONENTS

## React Components

### `App.jsx`
The root layout component. Manages global state (resume text, job list).

### `JobSearch.jsx`
Form component that accepts a keyword and location, and triggers the scraping API.

### `ResumeUpload.jsx`
A simple text area component to paste the user's resume content.

### `OutreachDashboard.jsx`
The core interface that displays all jobs in the pipeline. It handles triggering the AI email generation and sending the emails.
