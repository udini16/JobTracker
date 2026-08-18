# 14 ERROR HANDLING

## Backend
All Express routes are wrapped in `try/catch` blocks. Errors are returned to the client as JSON:
`{ success: false, error: "Error message" }`

## Frontend
API errors are caught in components and displayed as red banner alerts within the respective UI cards (e.g., JobSearch or OutreachDashboard).
